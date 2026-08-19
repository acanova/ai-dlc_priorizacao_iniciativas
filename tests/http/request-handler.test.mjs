import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { once } from "node:events";
import { createRequestHandler } from "../../src/http/request-handler.mjs";
import { createSafeConsoleLogger } from "../../src/observability/safe-console-logger.mjs";

async function withHandler(t, service, options = {}) {
  const entries = [];
  const logger = options.logger ?? createSafeConsoleLogger({
    consoleObject: {
      log: (value) => entries.push(value),
      error: (value) => entries.push(value),
    },
  });
  const server = createServer(createRequestHandler({
    initiativeService: service,
    bodyLimitBytes: options.bodyLimitBytes ?? 64 * 1024,
    logger,
  }));
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(() => new Promise((resolve) => server.close(resolve)));
  return { url: `http://127.0.0.1:${server.address().port}`, entries };
}

const service = {
  async createInitiative(input) { return { id: "1", ...input, score: 1 }; },
  async updateInitiative(id, input) { return { id, ...input, score: 2 }; },
  async listInitiatives() { return []; },
  async getRanking() { return []; },
};

test("roteia os cinco contratos com status JSON", async (t) => {
  const { url } = await withHandler(t, service);
  const cases = [
    ["GET", "/health", undefined, 200],
    ["POST", "/api/v1/initiatives", { name: "A" }, 201],
    ["PATCH", "/api/v1/initiatives/abc", { effort: 2 }, 200],
    ["GET", "/api/v1/initiatives", undefined, 200],
    ["GET", "/api/v1/ranking", undefined, 200],
  ];
  for (const [method, path, body, status] of cases) {
    const response = await fetch(`${url}${path}`, {
      method,
      headers: body ? { "content-type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    assert.equal(response.status, status, `${method} ${path}`);
    assert.match(response.headers.get("content-type"), /^application\/json/);
  }
});

test("rejeita JSON malformado e corpo acima do limite", async (t) => {
  const { url } = await withHandler(t, service, { bodyLimitBytes: 16 });
  const malformed = await fetch(`${url}/api/v1/initiatives`, { method: "POST", body: "{" });
  assert.equal(malformed.status, 400);
  assert.equal((await malformed.json()).error.code, "MALFORMED_JSON");
  const large = await fetch(`${url}/api/v1/initiatives`, {
    method: "POST",
    body: JSON.stringify({ value: "x".repeat(32) }),
  });
  assert.equal(large.status, 413);
  assert.equal((await large.json()).error.code, "BODY_TOO_LARGE");
});

test("distingue rota ausente e metodo nao permitido", async (t) => {
  const { url } = await withHandler(t, service);
  const absent = await fetch(`${url}/missing`);
  assert.equal(absent.status, 404);
  assert.equal((await absent.json()).error.code, "NOT_FOUND");
  const method = await fetch(`${url}/health`, { method: "POST" });
  assert.equal(method.status, 405);
  assert.equal((await method.json()).error.code, "METHOD_NOT_ALLOWED");
});

test("protege falhas inesperadas e registra somente campos permitidos", async (t) => {
  const failingService = {
    ...service,
    async listInitiatives() { throw new Error("secret /local/path stack"); },
  };
  const { url, entries } = await withHandler(t, failingService);
  const response = await fetch(`${url}/api/v1/initiatives`);
  const text = await response.text();
  assert.equal(response.status, 500);
  assert.equal(JSON.parse(text).error.code, "INTERNAL_ERROR");
  assert.doesNotMatch(text, /secret|local\/path|stack/);
  assert.deepEqual(JSON.parse(entries[0]), {
    event: "request.unexpected_failure",
    category: "request",
    code: "INTERNAL_ERROR",
  });
});

test("logger descarta eventos e campos fora da lista permitida", () => {
  const entries = [];
  const logger = createSafeConsoleLogger({
    consoleObject: { log: (value) => entries.push(value), error: (value) => entries.push(value) },
  });
  logger.info("unknown", { path: "/secret" });
  logger.error("startup.failed", { category: "startup", path: "/secret", body: { name: "A" } });
  assert.equal(entries.length, 1);
  assert.deepEqual(JSON.parse(entries[0]), { event: "startup.failed", category: "startup" });
});
