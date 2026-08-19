import { ApplicationError } from "../errors/application-error.mjs";
import {
  canonicalizeInitiativeName,
  rankInitiatives,
  toInitiativeView,
  validateInitiativeInput,
  validateInitiativeRecord,
} from "../domain/initiative-domain.mjs";

function duplicateNameError() {
  return new ApplicationError(
    "DUPLICATE_NAME",
    "An initiative with this name already exists",
    { field: "name" },
  );
}

function assertUniqueName(records, candidate, ignoredId) {
  const canonical = canonicalizeInitiativeName(candidate);
  if (records.some((record) => (
    record.id !== ignoredId && canonicalizeInitiativeName(record.name) === canonical
  ))) {
    throw duplicateNameError();
  }
}

export function createInitiativeService({ repository, generateId, now }) {
  if (!repository || typeof generateId !== "function" || typeof now !== "function") {
    throw new TypeError("repository, generateId, and now are required");
  }

  return {
    async createInitiative(input) {
      const normalized = validateInitiativeInput(input);
      const records = await repository.list();
      if (records.length >= 1000) {
        throw new ApplicationError(
          "VALIDATION_ERROR",
          "Request validation failed",
          { fields: [{ field: "body", code: "CAPACITY_EXCEEDED", message: "at most 1000 initiatives are supported" }] },
        );
      }
      assertUniqueName(records, normalized.name);
      const record = validateInitiativeRecord({
        ...normalized,
        id: generateId(),
        createdAt: now(),
      });
      if (records.some(({ id }) => id === record.id)) {
        throw new Error("Generated initiative id is not unique");
      }
      await repository.replaceAll([...records, record]);
      return toInitiativeView(record);
    },

    async updateInitiative(id, patch) {
      const normalizedPatch = validateInitiativeInput(patch, { partial: true });
      const records = await repository.list();
      const index = records.findIndex((record) => record.id === id);
      if (index === -1) {
        throw new ApplicationError("NOT_FOUND", "Initiative not found");
      }
      const candidate = validateInitiativeRecord({ ...records[index], ...normalizedPatch });
      assertUniqueName(records, candidate.name, id);
      const replacement = [...records];
      replacement[index] = candidate;
      await repository.replaceAll(replacement);
      return toInitiativeView(candidate);
    },

    async listInitiatives() {
      return (await repository.list()).map(toInitiativeView);
    },

    async getRanking() {
      return rankInitiatives(await repository.list()).map(toInitiativeView);
    },
  };
}
