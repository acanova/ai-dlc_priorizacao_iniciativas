import test from "node:test";
import assert from "node:assert/strict";
import * as fileSystem from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createJsonInitiativeRepository } from "../../src/infrastructure/json-initiative-repository.mjs";
import { persistedInitiative } from "../helpers/test-dependencies.mjs";

async function temporaryDataFile(t) {
  const directory = await fileSystem.mkdtemp(join(tmpdir(), "initiative-repository-"));
  t.after(() => fileSystem.rm(directory, { recursive: true, force: true }));
  return join(directory, "nested", "initiatives.json");
}

test("cria o documento inicial quando ausente", async (t) => {
  const filePath = await temporaryDataFile(t);
  const repository = createJsonInitiativeRepository({ filePath });
  await repository.initialize();
  assert.deepEqual(JSON.parse(await fileSystem.readFile(filePath, "utf8")), {
    schemaVersion: 1,
    initiatives: [],
  });
});

test("persiste, recarrega e devolve copias", async (t) => {
  const filePath = await temporaryDataFile(t);
  const repository = createJsonInitiativeRepository({ filePath });
  await repository.initialize();
  await repository.replaceAll([persistedInitiative()]);
  const first = await repository.list();
  first[0].name = "Mutated";
  const restarted = createJsonInitiativeRepository({ filePath });
  await restarted.initialize();
  assert.equal((await restarted.findById("initiative-1")).name, "Nova API");
  assert.equal(JSON.parse(await fileSystem.readFile(filePath, "utf8")).initiatives[0].score, undefined);
});

test("preserva e rejeita documentos existentes invalidos", async (t) => {
  for (const [name, contents] of [
    ["malformed", "{not-json"],
    ["structure", JSON.stringify({ schemaVersion: 1, initiatives: "no" })],
    ["version", JSON.stringify({ schemaVersion: 2, initiatives: [] })],
  ]) {
    const filePath = await temporaryDataFile(t);
    await fileSystem.mkdir(join(filePath, ".."), { recursive: true });
    await fileSystem.writeFile(filePath, contents);
    await assert.rejects(createJsonInitiativeRepository({ filePath }).initialize());
    assert.equal(await fileSystem.readFile(filePath, "utf8"), contents, name);
  }
});

test("suporta e valida uma colecao de 1000 iniciativas", async (t) => {
  const filePath = await temporaryDataFile(t);
  const repository = createJsonInitiativeRepository({ filePath });
  await repository.initialize();
  const records = Array.from({ length: 1000 }, (_, index) => persistedInitiative({
    id: `initiative-${index}`,
    name: `Initiative ${index}`,
  }));
  await repository.replaceAll(records);
  assert.equal((await repository.list()).length, 1000);
  await assert.rejects(repository.replaceAll([...records, persistedInitiative({ id: "extra", name: "Extra" })]));
});

test("falha de rename preserva documento anterior completo e limpa temporario", async (t) => {
  const filePath = await temporaryDataFile(t);
  const repository = createJsonInitiativeRepository({ filePath });
  await repository.initialize();
  await repository.replaceAll([persistedInitiative()]);
  const before = await fileSystem.readFile(filePath, "utf8");
  const failingFileSystem = {
    ...fileSystem,
    async rename() { throw new Error("injected rename failure"); },
  };
  const failingRepository = createJsonInitiativeRepository({
    filePath,
    fileSystem: failingFileSystem,
    createTemporaryName: () => ".injected.tmp",
  });
  await assert.rejects(failingRepository.replaceAll([
    persistedInitiative({ name: "Changed" }),
  ]));
  assert.equal(await fileSystem.readFile(filePath, "utf8"), before);
  await assert.rejects(fileSystem.access(join(filePath, "..", ".injected.tmp")));
});
