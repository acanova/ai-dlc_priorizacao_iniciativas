import test from "node:test";
import assert from "node:assert/strict";
import * as fileSystem from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createApplication } from "../../src/app.mjs";

const silentLogger = { info() {}, error() {} };

async function fixture(t, { contents, idPrefix = "id" } = {}) {
  const directory = await fileSystem.mkdtemp(join(tmpdir(), "initiative-api-"));
  const dataFile = join(directory, "data", "initiatives.json");
  await fileSystem.mkdir(join(directory, "data"), { recursive: true });
  if (contents !== undefined) await fileSystem.writeFile(dataFile, contents);
  let sequence = 0;
  const application = createApplication({
    host: "127.0.0.1",
    port: 0,
    dataFile,
    logger: silentLogger,
    generateId: () => `${idPrefix}-${++sequence}`,
    now: () => `2026-08-15T12:00:0${sequence}.000Z`,
  });
  t.after(async () => {
    await application.stop();
    await fileSystem.rm(directory, { recursive: true, force: true });
  });
  return { application, dataFile };
}

function initiative(name, overrides = {}) {
  return { name, reach: 100, impact: 2, confidence: 80, effort: 10, ...overrides };
}

async function jsonRequest(url, path, { method = "GET", body } = {}) {
  const response = await fetch(`${url}${path}`, {
    method,
    headers: body === undefined ? undefined : { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { response, body: await response.json() };
}

test("executa os cinco endpoints, reordena apos patch e nao persiste erro", async (t) => {
  const { application, dataFile } = await fixture(t);
  const { url } = await application.start();
  assert.deepEqual((await jsonRequest(url, "/health")).body, { status: "ok" });

  for (const input of [
    initiative("Alpha", { reach: 100 }),
    initiative("Beta", { reach: 300 }),
    initiative("Gamma", { reach: 200 }),
  ]) {
    const created = await jsonRequest(url, "/api/v1/initiatives", { method: "POST", body: input });
    assert.equal(created.response.status, 201);
  }

  const list = await jsonRequest(url, "/api/v1/initiatives");
  assert.deepEqual(list.body.map(({ name }) => name), ["Alpha", "Beta", "Gamma"]);
  const ranking = await jsonRequest(url, "/api/v1/ranking");
  assert.deepEqual(ranking.body.map(({ name }) => name), ["Beta", "Gamma", "Alpha"]);

  const alphaId = list.body[0].id;
  const patched = await jsonRequest(url, `/api/v1/initiatives/${alphaId}`, {
    method: "PATCH",
    body: { effort: 1 },
  });
  assert.equal(patched.response.status, 200);
  assert.equal((await jsonRequest(url, "/api/v1/ranking")).body[0].name, "Alpha");

  const before = await fileSystem.readFile(dataFile, "utf8");
  const invalid = await jsonRequest(url, "/api/v1/initiatives", {
    method: "POST",
    body: initiative("Invalid", { effort: 0 }),
  });
  assert.equal(invalid.response.status, 400);
  assert.equal(invalid.body.error.code, "VALIDATION_ERROR");
  assert.equal(await fileSystem.readFile(dataFile, "utf8"), before);
});

test("mantem dados depois do reinicio com o mesmo arquivo", async (t) => {
  const first = await fixture(t, { idPrefix: "restart" });
  const firstAddress = await first.application.start();
  await jsonRequest(firstAddress.url, "/api/v1/initiatives", {
    method: "POST",
    body: initiative("Persistent"),
  });
  await first.application.stop();

  const second = createApplication({
    host: "127.0.0.1",
    port: 0,
    dataFile: first.dataFile,
    logger: silentLogger,
  });
  t.after(() => second.stop());
  const secondAddress = await second.start();
  assert.equal((await jsonRequest(secondAddress.url, "/api/v1/initiatives")).body[0].name, "Persistent");
});

test("recusa startup e preserva estados invalidos", async (t) => {
  for (const contents of [
    "{broken",
    JSON.stringify({ schemaVersion: 1, initiatives: {} }),
    JSON.stringify({ schemaVersion: 2, initiatives: [] }),
  ]) {
    const current = await fixture(t, { contents });
    await assert.rejects(current.application.start());
    assert.equal(await fileSystem.readFile(current.dataFile, "utf8"), contents);
  }
});

test("lista e ranqueia corretamente 1000 iniciativas sem criterio temporal", async (t) => {
  const initiatives = Array.from({ length: 1000 }, (_, index) => ({
    id: `id-${String(index).padStart(4, "0")}`,
    createdAt: `2026-08-15T12:${String(Math.floor(index / 60)).padStart(2, "0")}:${String(index % 60).padStart(2, "0")}.000Z`,
    ...initiative(`Initiative ${index}`, { reach: index }),
  }));
  const contents = JSON.stringify({ schemaVersion: 1, initiatives });
  const current = await fixture(t, { contents });
  const { url } = await current.application.start();
  assert.equal((await jsonRequest(url, "/api/v1/initiatives")).body.length, 1000);
  const ranking = (await jsonRequest(url, "/api/v1/ranking")).body;
  assert.equal(ranking.length, 1000);
  assert.equal(ranking[0].reach, 999);
  assert.equal(ranking.at(-1).reach, 0);
});
