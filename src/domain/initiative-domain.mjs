import { ApplicationError } from "../errors/application-error.mjs";

export const EDITABLE_FIELDS = ["name", "reach", "impact", "confidence", "effort"];
const IMPACT_VALUES = new Set([0.25, 0.5, 1, 2, 3]);

function detail(field, code, message) {
  return { field, code, message };
}

function validationError(fields) {
  return new ApplicationError(
    "VALIDATION_ERROR",
    "Request validation failed",
    { fields },
  );
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function valueError(field, value) {
  if (field === "name") {
    if (typeof value !== "string") {
      return detail(field, "INVALID_TYPE", "name must be a string");
    }
    const normalized = value.trim();
    if (normalized.length < 1 || normalized.length > 120) {
      return detail(field, "OUT_OF_RANGE", "name must contain between 1 and 120 characters");
    }
    return undefined;
  }

  if (typeof value !== "number" || !Number.isFinite(value)) {
    return detail(field, "INVALID_TYPE", `${field} must be a finite number`);
  }
  if (field === "reach" && value < 0) {
    return detail(field, "OUT_OF_RANGE", "reach must be greater than or equal to zero");
  }
  if (field === "impact" && !IMPACT_VALUES.has(value)) {
    return detail(field, "INVALID_VALUE", "impact must be one of 0.25, 0.5, 1, 2, or 3");
  }
  if (field === "confidence" && (value < 0 || value > 100)) {
    return detail(field, "OUT_OF_RANGE", "confidence must be between 0 and 100");
  }
  if (field === "effort" && value <= 0) {
    return detail(field, "OUT_OF_RANGE", "effort must be greater than zero");
  }
  return undefined;
}

export function normalizeInitiativeInput(input) {
  const normalized = { ...input };
  if (typeof normalized.name === "string") normalized.name = normalized.name.trim();
  return normalized;
}

export function validateInitiativeInput(input, { partial = false } = {}) {
  if (!isObject(input)) {
    throw validationError([detail("body", "INVALID_TYPE", "body must be a JSON object")]);
  }

  const keys = Object.keys(input);
  const errors = [];
  const unknown = keys.filter((key) => !EDITABLE_FIELDS.includes(key)).sort();
  for (const field of unknown) {
    errors.push(detail(field, "UNKNOWN_FIELD", `${field} is not an editable field`));
  }

  if (partial && keys.length === 0) {
    errors.push(detail("body", "EMPTY_PATCH", "patch must contain at least one editable field"));
  }

  if (!partial) {
    for (const field of EDITABLE_FIELDS) {
      if (!Object.hasOwn(input, field)) {
        errors.push(detail(field, "REQUIRED", `${field} is required`));
      }
    }
  }

  for (const field of EDITABLE_FIELDS) {
    if (!Object.hasOwn(input, field)) continue;
    const error = valueError(field, input[field]);
    if (error) errors.push(error);
  }

  if (errors.length > 0) throw validationError(errors);

  const selected = {};
  for (const field of EDITABLE_FIELDS) {
    if (Object.hasOwn(input, field)) selected[field] = input[field];
  }
  return normalizeInitiativeInput(selected);
}

export function canonicalizeInitiativeName(name) {
  return name.trim().toLowerCase();
}

export function calculateRiceScore(initiative) {
  const score = (
    initiative.reach * initiative.impact * (initiative.confidence / 100)
  ) / initiative.effort;
  if (!Number.isFinite(score)) {
    throw validationError([detail("score", "OUT_OF_RANGE", "calculated score must be finite")]);
  }
  return score;
}

export function toInitiativeView(initiative) {
  const score = calculateRiceScore(initiative);
  return { ...initiative, score: Math.round((score + Number.EPSILON) * 100) / 100 };
}

export function rankInitiatives(initiatives) {
  return [...initiatives].sort((left, right) => {
    const scoreOrder = calculateRiceScore(right) - calculateRiceScore(left);
    if (scoreOrder !== 0) return scoreOrder;
    const createdAtOrder = left.createdAt.localeCompare(right.createdAt);
    return createdAtOrder !== 0 ? createdAtOrder : left.id.localeCompare(right.id);
  });
}

export function validateInitiativeRecord(record) {
  if (!isObject(record)) throw new Error("Persisted initiative must be an object");
  const expected = [...EDITABLE_FIELDS, "id", "createdAt"].sort();
  const actual = Object.keys(record).sort();
  if (actual.length !== expected.length || actual.some((key, index) => key !== expected[index])) {
    throw new Error("Persisted initiative has an invalid structure");
  }
  const editableInput = Object.fromEntries(EDITABLE_FIELDS.map((field) => [field, record[field]]));
  const input = validateInitiativeInput(editableInput);
  if (typeof record.id !== "string" || record.id.length === 0) {
    throw new Error("Persisted initiative has an invalid id");
  }
  if (
    typeof record.createdAt !== "string"
    || Number.isNaN(Date.parse(record.createdAt))
    || new Date(record.createdAt).toISOString() !== record.createdAt
  ) {
    throw new Error("Persisted initiative has an invalid createdAt");
  }
  return { ...input, id: record.id, createdAt: record.createdAt };
}

export function validateInitiativeCollection(initiatives) {
  if (!Array.isArray(initiatives) || initiatives.length > 1000) {
    throw new Error("Persisted initiatives must be an array with at most 1000 items");
  }
  const records = initiatives.map(validateInitiativeRecord);
  const ids = new Set();
  const names = new Set();
  for (const record of records) {
    const canonicalName = canonicalizeInitiativeName(record.name);
    if (ids.has(record.id) || names.has(canonicalName)) {
      throw new Error("Persisted initiatives contain duplicate identities or names");
    }
    ids.add(record.id);
    names.add(canonicalName);
  }
  return records;
}
