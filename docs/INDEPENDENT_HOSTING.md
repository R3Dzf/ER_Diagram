# Independent Cloudflare Workers deployment (experimental staging)

This branch is based on the exact GitHub source checked against the currently published Bosha Studio. It does **not** migrate previous hosting environment accounts, sessions, or diagrams. Do not point the existing production domain to this copy until you have tested user identity and data.

## Important security boundary

previous hosting environment injects trusted untrusted legacy identity headers behind its own gateway. A public Cloudflare Worker does **not** have that gateway. This branch strips those headers at the Worker ingress, before routing, so a browser cannot impersonate a previous hosting environment. Google ID tokens are verified on the server using Google public keys and a browser-bound nonce, and Google sessions are stored in D1.

The standalone editor works in guest/local-device mode without Google configuration. Cloud synchronization, account sharing and collaboration require a configured Google Web application client.

## Browser-only deployment from GitHub Actions (recommended)

The Cloudflare account is already connected, its free Workers subdomain is `r3dzf-studio.workers.dev`, and the **new staging** D1 database `bosha-studio` exists with ID `0022588d-62ab-4765-8ccf-294c7d00e2e4`. The account ID is `6411cac8f04e7bc98a84aeac63fcebef`. The independent Worker will be named `er-diagram` (the D1 database remains named `bosha-studio`). These are resource identifiers, **not** authentication credentials.

Only **one GitHub Actions secret** is required to launch the isolated staging Worker:

1. In your Cloudflare dashboard, create a restricted **account-scoped API token** with **Workers Admin** at the Workers product scope (needed to create the first Worker) and **D1 Editor** for the staging database or D1 product (needed for migrations). Restrict the token to this Cloudflare account. Never paste the token into commits, chats, issues, or logs.
2. Open https://github.com/R3Dzf/ER_Diagram/settings/secrets/actions and create a repository secret named `CLOUDFLARE_API_TOKEN`; paste the value there.
3. Trigger a fresh commit/push **only** to `deploy/independent-cloudflare-20261012`. That branch's `.github/workflows/deploy-cloudflare-staging.yml` will automatically run tests, apply schema migrations to this staging D1, build, and deploy `er-diagram`. If the secret is absent, deployment steps skip safely. No variable or other secret is required for a guest-mode deployment.
4. Check GitHub Actions and the new `https://er-diagram.r3dzf-studio.workers.dev` URL after successful deployment. Never assume it is live until verified. Set up the separate Google OAuth application in Google Cloud for account-based cloud sync; the optional `BOSHA_GOOGLE_CLIENT_ID` GitHub secret is available once the exact origin has been authorized.
5. Once the first Worker exists, reduce the API token's Worker scope to Editor for only the `er-diagram` Worker where supported, retaining D1 Editor for future schema migrations.

The old ChatGPT Site, its D1 database, and `main` are never targeted by this workflow. Keep the old site live until user data export/import and end-to-end tests are complete.

## Set up a new, isolated environment

1. Create a free Cloudflare account at https://dash.cloudflare.com/ and enable a Workers subdomain. Use **this staging branch**, not `main`.
2. On a trusted development environment or CI machine with Node 22+, install the exact lockfile dependencies: `corepack enable`, then `corepack pnpm install --frozen-lockfile`.
3. Authenticate with `corepack pnpm exec wrangler login`. Do not put Cloudflare API tokens in Git, commits, issues or chats.
4. Create a **new** D1 database: `corepack pnpm exec wrangler d1 create bosha-studio`. Copy its displayed UUID. Do **not** use the previous hosting environment database or any placeholder ID.
5. Run `corepack pnpm cloudflare:configure YOUR_NEW_D1_UUID`. This creates the gitignored `wrangler.standalone.jsonc` file with the real database ID.
6. Run `corepack pnpm test` and `corepack pnpm typecheck`, then `corepack pnpm cloudflare:build`.
7. Review the SQL under `drizzle/`, then create the staging tables: `corepack pnpm cloudflare:migrate` (this applies migrations to the **new remote database**, not previous hosting environment).
8. Publish with `corepack pnpm cloudflare:deploy`. Wrangler should print a `*.workers.dev` URL for your Cloudflare account.

Cloudflare's Vite plugin emits a deployment configuration during the production build. The script forces the standalone config only for standalone builds, removing previous hosting environment identity/connector preview integrations.

## Google sign-in (required for cloud accounts)

Create an OAuth client of type **Web application** in Google Cloud. Add the exact `https://YOUR-WORKERS-SUBDOMAIN.workers.dev` site origin to **Authorized JavaScript origins**. The frontend uses a Google Identity Services ID-token popup; there is no server-side client secret for this flow.

In the same authenticated environment, configure the public Google OAuth client ID as a Worker secret/binding (not committed in Git):

```sh
corepack pnpm exec wrangler secret put GOOGLE_CLIENT_ID --config wrangler.standalone.jsonc
```

Redeploy the worker as needed and check `/api/auth/google` for `configured: true`, then verify real browser sign-in, sign-out, isolation between two different Google accounts, version history, sharing and collaboration. Don't share the account's cookies or tokens.

## Moving existing diagrams

The standalone D1 database is separate. Users of Sites do not automatically appear in this database, even when their email matches a Google account. Before abandoning the previous hosting environment, each person should export their diagrams as JSON and explicitly import them into their own newly authenticated standalone account. Verify a restored diagram, revision history behavior and backups. There is no automatic full cloud-user migration in this branch.

## Rollback / production safety

Do not modify the previous hosting environment version, the original database, or `main`. The standalone Worker and D1 are isolated. If something fails, stop using the new `workers.dev` URL while preserving the old working Site.

Production publish readiness requires testing on your real Cloudflare account; unit tests and a Vite build in CI cannot substitute for that.
