import { ApplicationError } from "../errors/application-error.mjs";

const ERROR_STATUS = new Map([
  ["MALFORMED_JSON", 400],
  ["VALIDATION_ERROR", 400],
  ["NOT_FOUND", 404],
  ["METHOD_NOT_ALLOWED", 405],
  ["DUPLICATE_NAME", 409],
  ["BODY_TOO_LARGE", 413],
]);

export function sendJson(response, statusCode, payload) {
  const body = JSON.stringify(payload);
  response.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(body),
  });
  response.end(body);
}

export function mapApplicationError(error) {
  const knownStatus = error instanceof ApplicationError ? ERROR_STATUS.get(error.code) : undefined;
  if (knownStatus === undefined) {
    return {
      statusCode: 500,
      body: { error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" } },
    };
  }
  const publicError = { code: error.code, message: error.message };
  if (error.details !== undefined) publicError.details = error.details;
  return { statusCode: knownStatus, body: { error: publicError } };
}

export function readJsonBody(request, { limitBytes }) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let bytes = 0;
    let settled = false;

    request.on("data", (chunk) => {
      if (settled) return;
      bytes += chunk.length;
      if (bytes > limitBytes) {
        settled = true;
        reject(new ApplicationError("BODY_TOO_LARGE", "Request body exceeds 64 KiB"));
        return;
      }
      chunks.push(chunk);
    });
    request.on("end", () => {
      if (settled) return;
      settled = true;
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")));
      } catch {
        reject(new ApplicationError("MALFORMED_JSON", "Request body must contain valid JSON"));
      }
    });
    request.on("error", (error) => {
      if (!settled) {
        settled = true;
        reject(error);
      }
    });
  });
}

function routeKind(pathname) {
  if (pathname === "/health") return "health";
  if (pathname === "/api/v1/initiatives") return "initiatives";
  if (pathname === "/api/v1/ranking") return "ranking";
  if (/^\/api\/v1\/initiatives\/[^/]+$/.test(pathname)) return "initiative";
  return undefined;
}

export function createRequestHandler({ initiativeService, bodyLimitBytes, logger }) {
  return async function requestHandler(request, response) {
    try {
      const { pathname } = new URL(request.url, "http://localhost");
      const kind = routeKind(pathname);
      if (!kind) throw new ApplicationError("NOT_FOUND", "Route not found");

      if (kind === "health" && request.method === "GET") {
        sendJson(response, 200, { status: "ok" });
        return;
      }
      if (kind === "initiatives" && request.method === "POST") {
        sendJson(response, 201, await initiativeService.createInitiative(
          await readJsonBody(request, { limitBytes: bodyLimitBytes }),
        ));
        return;
      }
      if (kind === "initiative" && request.method === "PATCH") {
        const id = decodeURIComponent(pathname.slice("/api/v1/initiatives/".length));
        sendJson(response, 200, await initiativeService.updateInitiative(
          id,
          await readJsonBody(request, { limitBytes: bodyLimitBytes }),
        ));
        return;
      }
      if (kind === "initiatives" && request.method === "GET") {
        sendJson(response, 200, await initiativeService.listInitiatives());
        return;
      }
      if (kind === "ranking" && request.method === "GET") {
        sendJson(response, 200, await initiativeService.getRanking());
        return;
      }
      throw new ApplicationError("METHOD_NOT_ALLOWED", "Method not allowed for this route");
    } catch (error) {
      const mapped = mapApplicationError(error);
      if (mapped.statusCode === 500) {
        logger.error("request.unexpected_failure", {
          category: "request",
          code: "INTERNAL_ERROR",
        });
      }
      if (!response.headersSent) sendJson(response, mapped.statusCode, mapped.body);
      else response.end();
    }
  };
}
