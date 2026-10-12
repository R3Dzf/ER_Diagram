# Independent Cloudflare Workers deployment (experimental staging)

This branch is based on the exact GitHub source checked against the currently published Bosha Studio. It does **not** migrate production Sites accounts, sessions, or diagrams. Do not point the existing production domain to this copy until you have tested user identity and data.

## Important security boundary

ChatGPT Sites injects trusted `oai-authenticated-user-*` headers behind its own gateway. A public Cloudflare Worker does **not** have that gateway. This branch strips those headers at the Worker ingress, before routing, so a browser cannot impersonate a Sites user. Google ID tokens are verified on the server using Google public keys and a browser-bound nonce, and Google sessions are stored in D1.

The standalone editor works in guest/local-device mode without Google configuration. Cloud synchronization, account sharing and collaboration require a configured Google Web application client.

## Set up a new, isolated environment

1. Create a free Cloudflare account at https://dash.cloudflare.com/ and enable a Workers subdomain. Use **this staging branch**, not `main`.
2. On a trusted development environment or CI machine with Node 22+, install the exact lockfile dependencies: `corepack enable`, then `corepack pnpm install --frozen-lockfile`.
3. Authenticate with `corepack pnpm exec wrangler login`. Do not put Cloudflare API tokens in Git, commits, issues or chats.
4. Create a **new** D1 database: `corepack pnpm exec wrangler d1 create bosha-studio`. Copy its displayed UUID. Do **not** use the existing Sites database or any placeholder ID.
5. Run `corepack pnpm cloudflare:configure YOUR_NEW_D1_UUID`. This creates the gitignored `wrangler.standalone.jsonc` file with the real database ID.
6. Run `corepack pnpm test` and `corepack pnpm typecheck`, then `corepack pnpm cloudflare:build`.
7. Review the SQL under `drizzle/`, then create the staging tables: `corepack pnpm cloudflare:migrate` (this applies migrations to the **new remote database**, not Sites production).
8. Publish with `corepack pnpm cloudflare:deploy`. Wrangler should print a `*.workers.dev` URL for your Cloudflare account.

Cloudflare's Vite plugin emits a deployment configuration during the production build. The script forces the standalone config only for standalone builds, removing Sites mock identity/connector preview integrations.

## Google sign-in (required for cloud accounts)

Create an OAuth client of type **Web application** in Google Cloud. Add the exact `https://YOUR-WORKERS-SUBDOMAIN.workers.dev` site origin to **Authorized JavaScript origins**. The frontend uses a Google Identity Services ID-token popup; there is no server-side client secret for this flow.

In the same authenticated environment, configure the public Google OAuth client ID as a Worker secret/binding (not committed in Git):

```sh
corepack pnpm exec wrangler secret put GOOGLE_CLIENT_ID --config wrangler.standalone.jsonc
```

Redeploy the worker as needed and check `/api/auth/google` for `configured: true`, then verify real browser sign-in, sign-out, isolation between two different Google accounts, version history, sharing and collaboration. Don't share the account's cookies or tokens.

## Moving existing diagrams

The standalone D1 database is separate. Users of Sites do not automatically appear in this database, even when their email matches a Google account. Before abandoning the original site, each person should export their diagrams as JSON and explicitly import them into their own newly authenticated standalone account. Verify a restored diagram, revision history behavior and backups. There is no automatic full cloud-user migration in this branch.

## Rollback / production safety

Do not modify the existing Sites version, the original database, or `main`. The standalone Worker and D1 are isolated. If something fails, stop using the new `workers.dev` URL while preserving the old working Site.

Production publish readiness requires testing on your real Cloudflare account; unit tests and a Vite build in CI cannot substitute for that.
