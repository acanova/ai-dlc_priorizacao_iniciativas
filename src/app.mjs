import { randomUUID } from "node:crypto";
import { createServer } from "node:http";
import { resolve } from "node:path";
import {
  DEFAULT_BODY_LIMIT_BYTES,
  DEFAULT_DATA_FILE,
  DEFAULT_HOST,
  DEFAULT_PORT,
} from "../config/defaults.mjs";
import { createInitiativeService } from "./application/initiative-service.mjs";
import { createRequestHandler } from "./http/request-handler.mjs";
import { createJsonInitiativeRepository } from "./infrastructure/json-initiative-repository.mjs";
import { createSafeConsoleLogger } from "./observability/safe-console-logger.mjs";

function validateConfiguration({ host, port, dataFile }) {
  if (typeof host !== "string" || host.trim().length === 0) throw new Error("Invalid HOST configuration");
  if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error("Invalid PORT configuration");
  if (typeof dataFile !== "string" || dataFile.trim().length === 0) throw new Error("Invalid DATA_FILE configuration");
  return { host: host.trim(), port, dataFile: resolve(dataFile) };
}

export function createApplication(options = {}) {
  const configuration = validateConfiguration({
    host: options.host ?? DEFAULT_HOST,
    port: options.port ?? DEFAULT_PORT,
    dataFile: options.dataFile ?? DEFAULT_DATA_FILE,
  });
  const logger = options.logger ?? createSafeConsoleLogger();
  const repository = options.repository ?? createJsonInitiativeRepository({ filePath: configuration.dataFile });
  const service = options.initiativeService ?? createInitiativeService({
    repository,
    generateId: options.generateId ?? randomUUID,
    now: options.now ?? (() => new Date().toISOString()),
  });
  const handler = createRequestHandler({
    initiativeService: service,
    bodyLimitBytes: options.bodyLimitBytes ?? DEFAULT_BODY_LIMIT_BYTES,
    logger,
  });
  const server = createServer(handler);
  let started = false;

  return {
    async start() {
      if (started) return this.address();
      try {
        await repository.initialize();
        await new Promise((resolveListen, rejectListen) => {
          server.once("error", rejectListen);
          server.listen({ host: configuration.host, port: configuration.port }, () => {
            server.off("error", rejectListen);
            resolveListen();
          });
        });
        started = true;
        const address = this.address();
        logger.info("startup.completed", { host: address.host, port: address.port });
        return address;
      } catch (error) {
        logger.error("startup.failed", { category: "startup", code: "STARTUP_FAILED" });
        throw error;
      }
    },

    async stop() {
      if (!started) return;
      await new Promise((resolveClose, rejectClose) => {
        server.close((error) => (error ? rejectClose(error) : resolveClose()));
      });
      started = false;
      logger.info("shutdown.completed", { category: "lifecycle" });
    },

    address() {
      const address = server.address();
      if (!address || typeof address === "string") {
        return { host: configuration.host, port: configuration.port, url: undefined };
      }
      return {
        host: configuration.host,
        port: address.port,
        url: `http://${configuration.host}:${address.port}`,
      };
    },
  };
}
