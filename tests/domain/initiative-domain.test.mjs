import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateRiceScore,
  canonicalizeInitiativeName,
  rankInitiatives,
  toInitiativeView,
  validateInitiativeInput,
} from "../../src/domain/initiative-domain.mjs";

const valid = {
  name: "  Nova API  ",
  reach: 1000,
  impact: 2,
  confidence: 80,
  effort: 10,
};

test("calcula a pontuacao RICE conhecida", () => {
  assert.equal(calculateRiceScore(valid), 160);
});

test("normaliza o nome e preserva acentos, pontuacao e espacos internos", () => {
  const normalized = validateInitiativeInput({ ...valid, name: "  Ação  nova!  " });
  assert.equal(normalized.name, "Ação  nova!");
  assert.equal(canonicalizeInitiativeName(normalized.name), "ação  nova!");
});

test("aceita os limites numericos e todos os impactos discretos", () => {
  for (const impact of [0.25, 0.5, 1, 2, 3]) {
    assert.doesNotThrow(() => validateInitiativeInput({
      ...valid,
      reach: 0,
      confidence: 0,
      effort: 0.1,
      impact,
    }));
  }
});

test("rejeita numeros nao finitos e limites invalidos", () => {
  assert.throws(
    () => validateInitiativeInput({
      name: " ", reach: -1, impact: 4, confidence: Infinity, effort: 0,
    }),
    (error) => {
      assert.equal(error.code, "VALIDATION_ERROR");
      assert.deepEqual(
        error.details.fields.map(({ field, code }) => [field, code]),
        [
          ["name", "OUT_OF_RANGE"],
          ["reach", "OUT_OF_RANGE"],
          ["impact", "INVALID_VALUE"],
          ["confidence", "INVALID_TYPE"],
          ["effort", "OUT_OF_RANGE"],
        ],
      );
      return true;
    },
  );
});

test("agrega desconhecidos, obrigatorios e invalidos em ordem deterministica", () => {
  assert.throws(
    () => validateInitiativeInput({ zebra: true, alpha: true, reach: -1 }),
    (error) => {
      assert.deepEqual(
        error.details.fields.map(({ field, code }) => [field, code]),
        [
          ["alpha", "UNKNOWN_FIELD"],
          ["zebra", "UNKNOWN_FIELD"],
          ["name", "REQUIRED"],
          ["impact", "REQUIRED"],
          ["confidence", "REQUIRED"],
          ["effort", "REQUIRED"],
          ["reach", "OUT_OF_RANGE"],
        ],
      );
      return true;
    },
  );
});

test("rejeita corpo, patch vazio e campos imutaveis", () => {
  assert.throws(() => validateInitiativeInput(null), { code: "VALIDATION_ERROR" });
  assert.throws(() => validateInitiativeInput({}, { partial: true }), { code: "VALIDATION_ERROR" });
  assert.throws(
    () => validateInitiativeInput({ score: 1 }, { partial: true }),
    { code: "VALIDATION_ERROR" },
  );
});

test("projeta score numerico arredondado sem alterar a precisao de ordenacao", () => {
  const record = {
    ...validateInitiativeInput({ ...valid, reach: 1, confidence: 100, effort: 3 }),
    id: "a",
    createdAt: "2026-08-15T00:00:00.000Z",
  };
  assert.equal(calculateRiceScore(record), 2 / 3);
  assert.equal(toInitiativeView(record).score, 0.67);
  assert.equal(typeof toInitiativeView(record).score, "number");
});

test("ordena por score completo, createdAt e id sem mutar a colecao", () => {
  const records = [
    { ...valid, name: "B", id: "b", createdAt: "2026-08-15T00:00:00.000Z" },
    { ...valid, name: "A", id: "a", createdAt: "2026-08-15T00:00:00.000Z" },
    { ...valid, name: "C", reach: 2000, id: "c", createdAt: "2026-08-16T00:00:00.000Z" },
  ];
  const snapshot = structuredClone(records);
  assert.deepEqual(rankInitiatives(records).map(({ id }) => id), ["c", "a", "b"]);
  assert.deepEqual(records, snapshot);
});
