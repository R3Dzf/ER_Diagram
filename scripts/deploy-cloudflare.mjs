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
if (config.name !== "er-diagram" || !/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(db?.database_id || "")) {
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
  if (action === "deploy") {
    // Vinext and the Cloudflare Vite plugin can emit their output config in
    // different build subdirectories. Deploy only a verified production bundle.
    const candidates = [
      "dist/server/wrangler.json",
      `dist/${config.name}/wrangler.json`,
      "dist/wrangler.json"
    ];
    let outputPath = null;
    for (const candidate of candidates) {
      if (!existsSync(root + candidate)) continue;
      const builtConfig = JSON.parse(readFileSync(root + candidate, "utf8"));
      const builtDb = builtConfig.d1_databases?.find(x => x.binding === "DB");
      if (builtConfig.name === config.name && builtDb?.database_id === db.database_id) {
        outputPath = candidate;
        break;
      }
    }
    if (!outputPath) {
      console.error("No generated Worker config matches the configured name and staging D1 ID. Deployment cancelled.");
      process.exit(1);
    }
    console.log(`Deploying verified Cloudflare Worker bundle using ${outputPath}`);
    invoke("../node_modules/wrangler/bin/wrangler.js", ["deploy", "--config", outputPath]);
  }
}
