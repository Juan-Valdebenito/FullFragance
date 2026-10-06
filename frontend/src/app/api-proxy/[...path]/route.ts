// Proxy SOLO para desarrollo local. El backend de producción rechaza por CORS
// los orígenes localhost; con esto el navegador habla con su mismo origen y
// Next reenvía la petición al backend real.
//
// Se activa definiendo en frontend/.env.local:
//   NEXT_PUBLIC_API_URL=/api-proxy
//   DEV_API_PROXY_TARGET=https://fullfragance-backend.onrender.com
// Sin DEV_API_PROXY_TARGET (como en Vercel) la ruta responde 404.

const FORWARDED_HEADERS = ["authorization", "content-type"];

async function proxy(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const target = process.env.DEV_API_PROXY_TARGET?.replace(/\/$/, "");
  if (!target) return new Response(null, { status: 404 });

  const { path } = await params;
  const { search } = new URL(request.url);
  const headers = new Headers();
  for (const name of FORWARDED_HEADERS) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }

  const hasBody = !["GET", "HEAD"].includes(request.method);
  const upstream = await fetch(`${target}/api/${path.map(encodeURIComponent).join("/")}${search}`, {
    method: request.method,
    headers,
    body: hasBody ? await request.arrayBuffer() : undefined,
    cache: "no-store",
  });

  return new Response(upstream.body, {
    status: upstream.status,
    headers: { "content-type": upstream.headers.get("content-type") ?? "application/json" },
  });
}

export { proxy as GET, proxy as POST, proxy as PUT, proxy as DELETE };
