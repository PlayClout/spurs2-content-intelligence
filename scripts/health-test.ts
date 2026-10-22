import assert from "node:assert/strict";
import { createServer } from "node:http";
import { once } from "node:events";
import { workerHealth } from "../pipeline/health";
import { configureWriteStore, type WriteStore } from "../shared/clients/writeback";
const saved = { ...process.env };
let stale = false;
const server = createServer(async (_req, res) => {
  const health = await workerHealth("test-worker", "unit", stale ? 0 : Date.now());
  res.writeHead(health.ok ? 200 : 503, { "content-type": "application/json" }); res.end(JSON.stringify(health));
});
try {
  Object.assign(process.env, { SCOREPLAY_API_KEY: "secret-not-for-response", TWELVELABS_API_KEY: "secret-twelve", SCOREPLAY_WRITES: "1", SCOREPLAY_WRITE_KILL_SWITCH: "0" });
  delete process.env.MOCK_MODE;
  server.listen(0, "127.0.0.1"); await once(server, "listening");
  const url = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
  let response = await fetch(url); assert.equal(response.status, 200);
  let body = await response.text(); assert(!body.includes("secret"));
  assert.equal(JSON.parse(body).writes, "held");
  configureWriteStore({ getKillSwitch: async () => true } as WriteStore);
  assert.equal((await workerHealth("w", "l", Date.now())).writes, "held");
  configureWriteStore({ getKillSwitch: async (): Promise<boolean> => { throw Error("offline"); } } as WriteStore);
  assert.equal((await workerHealth("w", "l", Date.now())).writes, "held");
  stale = true; response = await fetch(url); assert.equal(response.status, 503);
  console.log("PASS HTTP health: provider modes, missing/offline DB holds, secret redaction and stale-loop 503");
} finally {
  server.closeAllConnections(); await new Promise<void>((resolve) => server.close(() => resolve()));
  for (const key of Object.keys(process.env)) if (!(key in saved)) delete process.env[key]; Object.assign(process.env, saved);
}
