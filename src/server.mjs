import { createApplication } from "./app.mjs";

function parsePort(value) {
  if (value === undefined) return undefined;
  const port = Number(value);
  return Number.isInteger(port) ? port : Number.NaN;
}

const application = createApplication({
  host: process.env.HOST,
  port: parsePort(process.env.PORT),
  dataFile: process.env.DATA_FILE,
});

try {
  await application.start();
} catch {
  process.exitCode = 1;
}

let stopping = false;
async function stop() {
  if (stopping) return;
  stopping = true;
  try {
    await application.stop();
  } finally {
    process.exitCode = 0;
  }
}

process.once("SIGINT", stop);
process.once("SIGTERM", stop);
