import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("../", import.meta.url));
const configPath = root + "wrangler.standalone.jsonc";
const action = process.argv[2];
if (!["build", "migrate", "deploy"].includes(action)) {
  console.error("Usage: pnpm cloudflare:build | cloudflare:migrate | cloudflare:deploy");
  process.exit(1);
}
if (!existsSync(configPath)) {
  console.error("Cloudflare D1 is not configured. Run pnpm cloudflare:configure <D1 UUID> first.");
  process.exit(1);
}
const config = JSON.parse(readFileSync(configPath, "utf8"));
const db = config.d1_databases?.find(x => x.binding === "DB");
if (config.name !== "bosha-studio" || !/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(db?.database_id || "")) {
  console.error("Invalid standalone Cloudflare Worker or D1 configuration.");
  process.exit(1);
}
const invoke = (relative, args, env = process.env) => {
  const executable = fileURLToPath(new URL(relative, import.meta.url));
  const result = spawnSync(process.execPath, [executable, ...args], { cwd: root, env, stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
};
if (action === "migrate") {
  invoke("../node_modules/wrangler/bin/wrangler.js",
    ["d1", "migrations", "apply", "DB", "--remote", "--config", "wrangler.standalone.jsonc"]);
} else {
  invoke("./run-framework.mjs", ["build"], { ...process.env, BOSHA_STANDALONE: "1" });
  if (action === "deploy") invoke("../node_modules/wrangler/bin/wrangler.js", ["deploy"]);
}
