import assert from "node:assert/strict";
import { getPublishBackend } from "../shared/clients/publish";
const backend = getPublishBackend();
assert.equal(backend.id, "simulated");
assert.deepEqual(await backend.publish({ orgId: "demo", opportunityId: "clip", channel: "x_post", copy: "test", assetPath: null }), {
  ok: true, mode: "simulated", externalRef: null,
});
console.log("PASS publishing is simulated-only");
