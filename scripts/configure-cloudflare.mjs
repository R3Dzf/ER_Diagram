import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("../", import.meta.url));
const id = process.argv[2];
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
if (!uuid.test(id || "") || /^0{8}-0{4}-0{4}-0{4}-0{12}$/i.test(id)) {
  console.error("Usage: pnpm cloudflare:configure <UUID returned by wrangler d1 create bosha-studio>");
  process.exit(1);
}
const output = root + "wrangler.standalone.jsonc";
if (existsSync(output)) {
  console.error("wrangler.standalone.jsonc already exists. Back it up or remove it before reconfiguring.");
  process.exit(1);
}
const template = readFileSync(root + "wrangler.standalone.example.jsonc", "utf8");
const config = template.replace("REPLACE_WITH_YOUR_D1_DATABASE_ID", id);
JSON.parse(config);
writeFileSync(output, config, { flag: "wx", mode: 0o600 });
console.log("Created ignored wrangler.standalone.jsonc with your D1 binding.");
