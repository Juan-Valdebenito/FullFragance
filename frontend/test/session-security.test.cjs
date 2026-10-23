/* eslint-disable @typescript-eslint/no-require-imports -- Node test harness compiles the route in isolation. */
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");
const { NextRequest } = require("next/server");

process.env.NODE_ENV = "production";
process.env.API_INTERNAL_URL = "https://api.example.test/api";
const filename = path.resolve(__dirname, "../src/app/session-api/[...path]/route.ts");
const compiled = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const loaded = new Module(filename, module);
loaded.filename = filename;
loaded.paths = Module._nodeModulePaths(path.dirname(filename));
loaded._compile(compiled, filename);
const route = loaded.exports;
const context = endpoint => ({ params: Promise.resolve({ path: endpoint.split("/") }) });
function request(endpoint, options = {}) {
  return new NextRequest(`https://shop.example.test/session-api/${endpoint}`, options);
}
const postHeaders = { origin: "https://shop.example.test", "content-type": "application/json", "x-fullfragance-request": "1" };

test("cross-origin writes and requests without CSRF header fail before upstream", async () => {
  for (const headers of [{ ...postHeaders, origin: "https://evil.test" }, { origin: postHeaders.origin, "content-type": "application/json" }]) {
    const response = await route.POST(request("auth/login", { method: "POST", headers, body: "{}" }), context("auth/login"));
    assert.equal(response.status, 403);
  }
});

test("login stores token in secure HttpOnly cookie, never in JSON", async t => {
  t.mock.method(global, "fetch", async () => Response.json({ token: "signed-token", user: { id: "u1" } }));
  const response = await route.POST(request("auth/login", { method: "POST", headers: postHeaders, body: "{}" }), context("auth/login"));
  assert.deepEqual(await response.json(), { user: { id: "u1" } });
  const cookie = response.cookies.get("__Host-fullfragance_session");
  assert.equal(cookie.value, "signed-token");
  assert.equal(cookie.httpOnly, true);
  assert.equal(cookie.secure, true);
  assert.equal(cookie.sameSite, "lax");
  assert.equal(response.headers.get("cache-control"), "private, no-store");
});

test("only the cookie supplies upstream authorization; redirects are rejected", async t => {
  t.mock.method(global, "fetch", async (url, options) => {
    assert.equal(url, "https://api.example.test/api/auth/me");
    assert.equal(options.headers.get("authorization"), "Bearer cookie-token");
    assert.equal(options.redirect, "error");
    return Response.json({ user: { id: "u1" } });
  });
  await route.GET(request("auth/me", { headers: { cookie: "__Host-fullfragance_session=cookie-token", authorization: "Bearer attacker" } }), context("auth/me"));
});

test("logout clears cookie after revoking upstream session", async t => {
  t.mock.method(global, "fetch", async () => new Response(null, { status: 204 }));
  const response = await route.POST(request("auth/logout", { method: "POST", headers: postHeaders, body: "{}" }), context("auth/logout"));
  assert.equal(response.status, 204);
  assert.equal(response.cookies.get("__Host-fullfragance_session").maxAge, 0);
});

test("oversized bodies and path traversal are blocked", async () => {
  const response = await route.POST(request("auth/login", { method: "POST", headers: postHeaders, body: "x".repeat(102401) }), context("auth/login"));
  assert.equal(response.status, 413);
  const traversal = await route.GET(request("auth/me"), context("auth/../private"));
  assert.equal(traversal.status, 404);
});

test("return paths cannot execute scripts or navigate to external origins", () => {
  const helperFile = path.resolve(__dirname, "../src/shared/navigation/safeReturnPath.ts");
  const helper = new Module(helperFile, module);
  helper._compile(ts.transpileModule(fs.readFileSync(helperFile, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, helperFile);
  const { safeReturnPath } = helper.exports;
  for (const value of ["javascript:alert(1)", "https://evil.test", "//evil.test", "/\\evil.test", "/\nevil.test"]) {
    assert.equal(safeReturnPath(value, "/dashboard"), "/dashboard");
  }
  assert.equal(safeReturnPath("/dashboard?brand=Dior", "/"), "/dashboard?brand=Dior");
});
