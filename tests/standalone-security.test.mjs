import test from "node:test";
import assert from "node:assert/strict";
import { stripUntrustedSiteIdentityHeaders } from "../lib/standalone-security.mjs";
test("standalone ingress discards forged Sites identity but retains Google session", async () => {
  const request = new Request("https://studio.example/api/workspace", {
    method: "POST",
    headers: {
      "oai-authenticated-user-id": "victim-id",
      "OAI-AUTHENTICATED-USER-EMAIL": "victim@example.com",
      "Cookie": "__Host-bosha_google_session=some-token",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ test: true })
  });
  const safe = stripUntrustedSiteIdentityHeaders(request);
  assert.equal(safe.headers.get("oai-authenticated-user-id"), null);
  assert.equal(safe.headers.get("oai-authenticated-user-email"), null);
  assert.equal(safe.headers.get("cookie"), "__Host-bosha_google_session=some-token");
  assert.deepEqual(await safe.json(), { test: true });
});
test("standalone ingress is a no-op when no legacy identity header exists", () => {
  const request = new Request("https://studio.example/");
  assert.equal(stripUntrustedSiteIdentityHeaders(request), request);
});
