import test from "node:test";
import assert from "node:assert/strict";
import { createInitiativeService } from "../../src/application/initiative-service.mjs";
import {
  createMemoryRepository,
  persistedInitiative,
  validInitiative,
} from "../helpers/test-dependencies.mjs";

function serviceFor(repository, overrides = {}) {
  return createInitiativeService({
    repository,
    generateId: () => "initiative-2",
    now: () => "2026-08-16T12:00:00.000Z",
    ...overrides,
  });
}

test("cadastra uma iniciativa normalizada com uma unica substituicao", async () => {
  const repository = createMemoryRepository();
  const created = await serviceFor(repository).createInitiative(validInitiative({ name: "  Nova API  " }));
  assert.equal(created.name, "Nova API");
  assert.equal(created.score, 160);
  assert.equal(repository.replaceCalls, 1);
  assert.equal(repository.snapshot()[0].score, undefined);
});

test("rejeita nome duplicado sem diferenciar caixa e sem gravar", async () => {
  const repository = createMemoryRepository([persistedInitiative()]);
  await assert.rejects(
    serviceFor(repository).createInitiative(validInitiative({ name: " nova api " })),
    { code: "DUPLICATE_NAME" },
  );
  assert.equal(repository.replaceCalls, 0);
});

test("valida patch antes de consultar identificador ausente", async () => {
  const repository = createMemoryRepository();
  await assert.rejects(serviceFor(repository).updateInitiative("missing", {}), {
    code: "VALIDATION_ERROR",
  });
  assert.equal(repository.replaceCalls, 0);
  await assert.rejects(serviceFor(repository).updateInitiative("missing", { effort: 5 }), {
    code: "NOT_FOUND",
  });
});

test("atualiza parcialmente, preserva identidade e grava uma vez", async () => {
  const original = persistedInitiative();
  const repository = createMemoryRepository([original]);
  const updated = await serviceFor(repository).updateInitiative(original.id, { effort: 20 });
  assert.equal(updated.id, original.id);
  assert.equal(updated.createdAt, original.createdAt);
  assert.equal(updated.effort, 20);
  assert.equal(updated.score, 80);
  assert.equal(repository.replaceCalls, 1);
});

test("rejeita colisao no estado final do patch sem gravar", async () => {
  const repository = createMemoryRepository([
    persistedInitiative(),
    persistedInitiative({ id: "initiative-2", name: "Portal" }),
  ]);
  await assert.rejects(
    serviceFor(repository).updateInitiative("initiative-2", { name: "NOVA API" }),
    { code: "DUPLICATE_NAME" },
  );
  assert.equal(repository.replaceCalls, 0);
});

test("lista na ordem persistida e calcula ranking sem gravar", async () => {
  const repository = createMemoryRepository([
    persistedInitiative({ id: "low", name: "Low", reach: 1 }),
    persistedInitiative({ id: "high", name: "High", reach: 100 }),
  ]);
  const service = serviceFor(repository);
  assert.deepEqual((await service.listInitiatives()).map(({ id }) => id), ["low", "high"]);
  assert.deepEqual((await service.getRanking()).map(({ id }) => id), ["high", "low"]);
  assert.equal(repository.replaceCalls, 0);
});
