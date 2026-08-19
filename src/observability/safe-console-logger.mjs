const ALLOWED_EVENTS = new Set([
  "startup.completed",
  "startup.failed",
  "shutdown.completed",
  "request.unexpected_failure",
]);
const ALLOWED_FIELDS = new Set(["category", "code", "host", "port"]);

export function createSafeConsoleLogger({ consoleObject = console } = {}) {
  function emit(level, event, fields = {}) {
    if (!ALLOWED_EVENTS.has(event)) return;
    const entry = { event };
    for (const [key, value] of Object.entries(fields)) {
      if (ALLOWED_FIELDS.has(key) && ["string", "number", "boolean"].includes(typeof value)) {
        entry[key] = value;
      }
    }
    consoleObject[level](JSON.stringify(entry));
  }

  return {
    info(event, fields) { emit("log", event, fields); },
    error(event, fields) { emit("error", event, fields); },
  };
}
