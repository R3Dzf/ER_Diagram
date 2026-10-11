# Development

## Requirements

Use Node.js **22.13 or newer** and the project’s pinned **pnpm 11.25.0**. The test suite uses `node:sqlite`. Do not replace the pnpm lockfile with an npm-generated dependency graph.

```bash
git clone https://github.com/R3Dzf/ER_Diagram.git
cd ER_Diagram
pnpm install --frozen-lockfile
pnpm run db:migrate:local
pnpm run dev
```

Open `http://localhost:5173/studio/`. The root route redirects there. Windows users can use the same pnpm commands. Python’s static server is an alternative for guest-only editor development; see the README.

A clean clone selects the **portable** execution profile. The managed Sites environment can select a profile in ignored `.sites-runtime/execution-profile.json`; never commit that machine-specific state.

## Local database

`wrangler.local.jsonc` declares the same placeholder D1 binding/name used by Vite’s local configuration. It is for local development only, not a production deployment config.

```bash
pnpm run db:migrate:local
```

This applies committed SQL migrations to local `.wrangler/` state. Stop the development server before applying schema changes. The migration command can prompt before making changes. Production database records are not included in this repository.

The source schema is `db/schema.ts`. Generate a new migration with:

```bash
pnpm run db:generate
```

Review both SQL and Drizzle metadata. Commit them together, apply locally, and rerun API tests. Do not edit previously deployed migrations to change existing production databases. There is no request-time table creation.

## Authentication during development

The Sites Vite plugin provides a mock ChatGPT sign-in on loopback-only development servers. Its identity is a development fixture, not the real user’s ChatGPT account. Production builds exclude that mock server hook.

The public static editor has no backend identity. Google is optional and uses a runtime `GOOGLE_CLIENT_ID`; do not hard-code tokens or private secrets into browser files. See [deployment](DEPLOYMENT.md) for its HTTPS and authorized-origin requirements.

## Commands

| Command | Purpose |
| --- | --- |
| `pnpm run install:ci` | Frozen pnpm dependency installation |
| `pnpm run dev` | Portable Vinext development server on port 5173 |
| `pnpm test` | All Node test files |
| `pnpm run typecheck` | TypeScript checking, no emit |
| `pnpm run build` | Production Vinext/Worker build |
| `pnpm run start` | Local production Worker via Wrangler, after building |
| `pnpm run db:generate` | Generate SQL and Drizzle metadata from the schema |
| `pnpm run db:migrate:local` | Apply SQL migrations to local D1 |
| `pnpm run lint` | Existing ESLint configuration; separate from the CI gate |

`pnpm run start` serves a local Worker and does not reproduce the host’s real authentication gateway. Use the development mock or a properly configured hosted deployment for account flows.

## Test coverage

| Tests | Main behavior |
| --- | --- |
| `core`, `notation-regression`, `relationship-participants` | Model validation, SVG, cardinality/participation, notation consistency |
| `design`, `layout-regression`, `auto-layout-ui` | Geometry, layout, group movement, save and Undo/Redo |
| `workspace`, `account`, `cloud` | Persistence, ownership, revisions, version retention, conflict handling |
| `google-auth` | Signed token verification, nonce/session boundaries, linking and logout |
| `shares` | Diagram-scoped links, expiry, replacement and revocation |
| `collaboration`, `collaboration-ui` | Permissions, invitations, merging, comments, viewer restrictions |
| `offline-features`, `offline-ui` | Cache exclusions, pause/reconnect, installation and updates |
| `ui`, `live-names`, `notifications`, `welcome-ui` | Actual DOM flows, immediate rename, toast layering and onboarding |
| `pdf` | Vector PDF geometry, fonts and tiling |

Run a specific test while iterating:

```bash
node --test tests/welcome-ui.test.mjs
```

DOM tests use LinkeDOM. API tests use in-memory SQLite adapters for D1 semantics. Real Google consent, browser/PWA installation, pointer/touch behavior, and visual layout need browser QA in addition to these checks.

## Offline asset changes

When changing any cached editor asset, increment `CACHE_NAME` in `public/sw.js`. Add new local dependencies to `STATIC_FILES` when offline operation needs them. Never precache API responses, authentication pages, or the shared viewer. Test update handling with unsynced work before publishing.

## CI

`.github/workflows/ci.yml` runs frozen install, the test suite, TypeScript checking, and the production build. It does not deploy the application or access production credentials. The workflow uses read-only repository permissions.

## Maintainer notes

Keep interface text in English and keep the editor general-purpose. Preserve the common model used by both notations, validation, SQL, sharing, and exports. Changes to participation/cardinality must be checked across all of those consumers. Fonts and PDF libraries are intentionally bundled so exports do not require a CDN.
