export function createMemoryRepository(initial = []) {
  let records = structuredClone(initial);
  let replaceCalls = 0;
  return {
    async initialize() {},
    async list() { return structuredClone(records); },
    async findById(id) { return structuredClone(records.find((item) => item.id === id)); },
    async replaceAll(next) {
      replaceCalls += 1;
      records = structuredClone(next);
    },
    snapshot() { return structuredClone(records); },
    get replaceCalls() { return replaceCalls; },
  };
}

export function validInitiative(overrides = {}) {
  return {
    name: "Nova API",
    reach: 1000,
    impact: 2,
    confidence: 80,
    effort: 10,
    ...overrides,
  };
}

export function persistedInitiative(overrides = {}) {
  return {
    ...validInitiative(),
    id: "initiative-1",
    createdAt: "2026-08-15T12:00:00.000Z",
    ...overrides,
  };
}
