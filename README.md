# ER Diagram — Bosha Studio

An open-source, browser-based workspace for **designing, validating, and exporting entity–relationship diagrams**. Draw with **Chen** or **Crow's Foot** notation, inspect your data model, and generate SQL from your design.

[**Try the live editor**](https://er-diagram.r3dzf-studio.workers.dev) · [Report a bug](https://github.com/R3Dzf/ER_Diagram/issues) · [Independent hosting guide](https://github.com/R3Dzf/ER_Diagram/blob/deploy/independent-cloudflare-20261012/docs/INDEPENDENT_HOSTING.md)

> **No installation required.** You can create and export diagrams as a guest. Guest diagrams are saved on your current device. Google sign-in and cross-device cloud sync require completing the new site's Google OAuth configuration; until then, use the guest editor and export JSON backups.

## What can you do?

- **Two diagram notations:** switch between classic Chen and Crow's Foot representations of the same conceptual model.
- **Visual editing:** add entities, attributes and relationships; drag, pan, zoom, multi-select, duplicate and arrange elements.
- **Relationship rules:** set per-participant cardinality and participation (partial/total); model weak entities, keys and complex relationships.
- **Automatic layout:** dedicated layout behavior for Chen and Crow's Foot views with separate drawing positions.
- **Model validation:** find disconnected elements, missing keys, incomplete relationships and layout issues before exporting.
- **SQL generation:** preview relational tables, keys and relationships, including PostgreSQL output and schema views.
- **Export options:** produce SVG, PNG or vector PDF, or save your diagram as JSON for later editing.
- **Multiple projects and templates:** start from an example, switch projects, search your collection and keep editing.
- **Optional online workspaces:** authenticated diagrams, history, sharing and collaboration backed by Cloudflare D1 once Google sign-in is configured.
- **Offline-friendly interface:** PWA caching and local drafts, with explicit import/export and recovery paths.

## Live demo

**https://er-diagram.r3dzf-studio.workers.dev**

The independent demo is deployed as a Cloudflare Worker, with a separate Cloudflare D1 database. It does **not** read from or write to the previous hosted site's database. Existing user accounts and saved cloud diagrams are **not transferred automatically**.

For guest access, open the link, choose **Create a diagram** or a template, then export the result using the editor's export menu. Keep a JSON backup when moving to a different browser or device.

## Development

The project uses JavaScript/TypeScript, React, **Vinext**, Cloudflare Workers, Cloudflare D1, Drizzle ORM and a browser-based SVG editor.

**Requirements:** Node.js 22.13+ and pnpm 11.25 (as specified in `package.json`).

```bash
corepack enable
corepack pnpm install --frozen-lockfile
corepack pnpm dev
```

Run checks locally:

```bash
corepack pnpm test
corepack pnpm typecheck
corepack pnpm build
```

The default-branch source retains compatibility helpers for its original hosting environment. The independently deployed Cloudflare variant is maintained on [`deploy/independent-cloudflare-20261012`](https://github.com/R3Dzf/ER_Diagram/tree/deploy/independent-cloudflare-20261012) until the standalone deployment and account migration are fully verified.

## Deployment and data safety

For a separate instance, use the [independent Cloudflare deployment guide](https://github.com/R3Dzf/ER_Diagram/blob/deploy/independent-cloudflare-20261012/docs/INDEPENDENT_HOSTING.md). Set up your **own D1 database and verified Google OAuth client**. Never use someone else's database ID as your production database, or accept client-provided identity headers as authenticated user identity.

Before any migration, back up your diagrams. Cross-host account identities, local browser data and historical versions are not automatically portable.

## Learn more

- [User guide](docs/USER_GUIDE.md)
- [Development notes](docs/DEVELOPMENT.md)
- [Database schema](docs/DATABASE.md)
- [Deployment and identity](docs/DEPLOYMENT.md)
- [Roadmap](docs/ROADMAP.md)

## Contributing

Bug reports, reproducible test cases and focused improvements are welcome through [GitHub Issues](https://github.com/R3Dzf/ER_Diagram/issues). When proposing a change, describe the expected editor behavior, include steps to reproduce and add regression tests where possible.

If this project is useful for your studies or development work, consider **starring the repository** to help others find it.
