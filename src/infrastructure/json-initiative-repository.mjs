import * as defaultFileSystem from "node:fs/promises";
import { dirname, join } from "node:path";
import { randomUUID } from "node:crypto";
import { validateInitiativeCollection } from "../domain/initiative-domain.mjs";

const INITIAL_DOCUMENT = { schemaVersion: 1, initiatives: [] };

function persistenceError(cause) {
  return new Error("Initiative persistence operation failed", { cause });
}

function parseDocument(contents) {
  let document;
  try {
    document = JSON.parse(contents);
  } catch (error) {
    throw persistenceError(error);
  }
  if (
    document === null
    || typeof document !== "object"
    || Array.isArray(document)
    || document.schemaVersion !== 1
    || !Object.hasOwn(document, "initiatives")
    || Object.keys(document).some((key) => !["schemaVersion", "initiatives"].includes(key))
  ) {
    throw persistenceError(new Error("Invalid persisted document"));
  }
  try {
    return validateInitiativeCollection(document.initiatives);
  } catch (error) {
    throw persistenceError(error);
  }
}

export function createJsonInitiativeRepository({
  filePath,
  fileSystem = defaultFileSystem,
  createTemporaryName = () => `.initiatives-${randomUUID()}.tmp`,
}) {
  if (typeof filePath !== "string" || filePath.length === 0) {
    throw new TypeError("filePath is required");
  }

  async function readRecords() {
    try {
      return parseDocument(await fileSystem.readFile(filePath, "utf8"));
    } catch (error) {
      if (error.message === "Initiative persistence operation failed") throw error;
      throw persistenceError(error);
    }
  }

  return {
    async initialize() {
      try {
        await fileSystem.mkdir(dirname(filePath), { recursive: true });
        try {
          await fileSystem.access(filePath);
        } catch (error) {
          if (error.code !== "ENOENT") throw error;
          const handle = await fileSystem.open(filePath, "wx");
          try {
            await handle.writeFile(`${JSON.stringify(INITIAL_DOCUMENT, null, 2)}\n`, "utf8");
          } finally {
            await handle.close();
          }
        }
        await readRecords();
      } catch (error) {
        if (error.message === "Initiative persistence operation failed") throw error;
        throw persistenceError(error);
      }
    },

    async list() {
      return structuredClone(await readRecords());
    },

    async findById(id) {
      const record = (await readRecords()).find((item) => item.id === id);
      return record === undefined ? undefined : structuredClone(record);
    },

    async replaceAll(initiatives) {
      let records;
      try {
        records = validateInitiativeCollection(initiatives);
      } catch (error) {
        throw persistenceError(error);
      }
      const temporaryPath = join(dirname(filePath), createTemporaryName());
      let handle;
      let committed = false;
      try {
        handle = await fileSystem.open(temporaryPath, "wx");
        await handle.writeFile(`${JSON.stringify({ schemaVersion: 1, initiatives: records }, null, 2)}\n`, "utf8");
        await handle.close();
        handle = undefined;
        await fileSystem.rename(temporaryPath, filePath);
        committed = true;
      } catch (error) {
        throw persistenceError(error);
      } finally {
        if (handle) {
          try { await handle.close(); } catch {}
        }
        if (!committed) {
          try { await fileSystem.unlink(temporaryPath); } catch {}
        }
      }
    },
  };
}
