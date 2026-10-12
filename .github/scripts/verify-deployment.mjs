/**
 * Verify the real deployed staging URL from GitHub Actions.
 * Checks public routes and verifies that fake Sites identity headers
 * cannot authenticate an independent Cloudflare visitor.
 */
const base = "https://er-diagram.r3dzf-studio.workers.dev";
async function load(path, headers = {}) {
  let lastError;
  for (let attempt = 0; attempt < 6; attempt++) {
    try {
      const response = await fetch(new URL(path, base), {
        headers, redirect: "follow", signal: AbortSignal.timeout(15000),
      });
      if (!response.ok) {
        const preview = (await response.text()).slice(0, 250);
        throw new Error(`${path}: HTTP ${response.status} ${preview}`);
      }
      return response;
    } catch (error) {
      lastError = error;
      if (attempt < 5) await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
  throw lastError;
}
const root = await load("/");
const html = await root.text();
if (!/Bosha Studio|BoshaStudio|ER Diagram|My diagrams|studio/i.test(html)) {
  throw new Error("Deployed homepage lacks expected app content");
}
const auth = await (await load("/api/auth/google")).json();
if (typeof auth.configured !== "boolean") {
  throw new Error("Google authentication endpoint returned an invalid payload");
}
const workspace = await (await load("/api/workspace", {
  "oai-authenticated-user-id": "forged-identity",
  "oai-authenticated-user-email": "forged@example.test",
})).json();
if (workspace.user !== null || !Array.isArray(workspace.projects) || workspace.projects.length !== 0) {
  throw new Error("SECURITY: Forged Sites headers authenticated an independent visitor");
}
console.log("Live HTTP smoke tests passed:", base);
console.log("Homepage reachable; Google configuration endpoint responds; forged Sites identity rejected.");
console.log("Google sign-in configured:", auth.configured);
