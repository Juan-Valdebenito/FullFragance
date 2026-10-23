import { NextRequest, NextResponse } from "next/server";

const production = process.env.NODE_ENV === "production";
const cookieName = production ? "__Host-fullfragance_session" : "fullfragance_session";
const cookieOptions = { httpOnly: true, secure: production, sameSite: "lax" as const, path: "/" };

function clearCookies(response: NextResponse) {
  response.cookies.set(cookieName, "", { ...cookieOptions, maxAge: 0 });
  response.cookies.set("fullfragance_session_present", "", { ...cookieOptions, httpOnly: false, maxAge: 0 });
}

async function proxy(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  if (!path.length || path.some(part => !/^[a-zA-Z0-9_-]+$/.test(part)) ||
      !["auth", "users", "scrapers", "analytics", "catalog", "prices", "products"].includes(path[0])) {
    return NextResponse.json({ error: "Ruta inválida." }, { status: 404 });
  }
  const endpoint = path.join("/");
  const mutation = !["GET", "HEAD"].includes(request.method);
  if (mutation && (request.headers.get("origin") !== new URL(request.url).origin ||
      request.headers.get("x-fullfragance-request") !== "1" ||
      !request.headers.get("content-type")?.startsWith("application/json"))) {
    return NextResponse.json({ error: "Origen de solicitud inválido." }, { status: 403 });
  }
  let body: Uint8Array | undefined;
  if (mutation && request.body) {
    const reader = request.body.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > 100 * 1024) {
        await reader.cancel();
        return NextResponse.json({ error: "Solicitud demasiado grande." }, { status: 413 });
      }
      chunks.push(value);
    }
    body = Buffer.concat(chunks);
  }
  const configured = process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL;
  const base = configured?.startsWith("http") ? configured :
    !production ? `${process.env.DEV_API_PROXY_TARGET || "http://localhost:3000"}/api` : null;
  if (!base) return NextResponse.json({ error: "API no configurada." }, { status: 503 });
  const token = request.cookies.get(cookieName)?.value;
  const headers = new Headers({ "Content-Type": "application/json" });
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const logout = endpoint === "auth/logout" && request.method === "POST";
  try {
    const upstream = await fetch(`${base.replace(/\/$/, "")}/${endpoint}${new URL(request.url).search}`, {
      method: request.method, headers, body: body as BodyInit | undefined,
      cache: "no-store", redirect: "error", signal: AbortSignal.timeout(30000),
    });
    const data = upstream.status === 204 ? null : await upstream.json();
    const sessionToken = data?.token;
    if (data && typeof data === "object") delete data.token;
    const response = new NextResponse(data === null ? null : JSON.stringify(data), {
      status: upstream.status,
      headers: { "Content-Type": "application/json", "Cache-Control": "private, no-store" },
    });
    for (const name of ["retry-after", "ratelimit-limit", "ratelimit-remaining", "ratelimit-reset"]) {
      const value = upstream.headers.get(name);
      if (value) response.headers.set(name, value);
    }
    if (upstream.ok && typeof sessionToken === "string" &&
        ["auth/login", "auth/register", "auth/google", "users/me/password"].includes(endpoint)) {
      response.cookies.set(cookieName, sessionToken, cookieOptions);
      // Non-secret UI hint only. The API always validates the HttpOnly token.
      response.cookies.set("fullfragance_session_present", "1", { ...cookieOptions, httpOnly: false });
    }
    if (logout || (upstream.ok && endpoint === "users/me" && request.method === "DELETE") ||
        (endpoint === "auth/me" && upstream.status === 401)) clearCookies(response);
    return response;
  } catch {
    const response = NextResponse.json({ error: "No se pudo conectar con el servidor." }, { status: 502 });
    response.headers.set("Cache-Control", "private, no-store");
    if (logout) clearCookies(response);
    return response;
  }
}

export { proxy as GET, proxy as POST, proxy as PUT, proxy as DELETE };
