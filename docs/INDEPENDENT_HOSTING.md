# Cloudflare deployment

The official ER Diagram repository is maintained on `main` and deployed to:

**https://er-diagram.r3dzf-studio.workers.dev**

The Cloudflare Worker `er-diagram` uses the dedicated D1 database `bosha-studio`. This environment is independent of earlier hosting; existing accounts, diagrams, sessions and sharing links are not transferred automatically.

## Continuous deployment

Pushes to `main` run the project tests and the Cloudflare deployment workflow at `.github/workflows/deploy-cloudflare.yml`. It uses the following settings:

- Account ID: `6411cac8f04e7bc98a84aeac63fcebef`
- Worker: `er-diagram`
- D1 database ID: `0022588d-62ab-4765-8ccf-294c7d00e2e4`
- GitHub Actions secret `CLOUDFLARE_API_TOKEN`: restricted Cloudflare token
- Optional Actions secret `BOSHA_GOOGLE_CLIENT_ID`: Google OAuth Web application client ID

Resource IDs are not credentials. Do not put API tokens, signing keys or other secrets in Git, issues or chat.

The workflow:
1. Installs locked dependencies and runs tests/type checks.
2. Configures the dedicated D1 binding and applies committed migrations.
3. Builds and publishes the Worker.
4. Verifies the live website and account-isolation protections.
5. Tests the deployed editor in Chromium at mobile, tablet and desktop widths.

Deploys skip safely when the Cloudflare token is unavailable.

## New Cloudflare installation

Use a separate account and D1 database for a new instance. Never point a fresh instance at another deployment's existing database.

```bash
corepack enable
corepack pnpm install --frozen-lockfile
corepack pnpm exec wrangler login
corepack pnpm exec wrangler d1 create bosha-studio
corepack pnpm cloudflare:configure YOUR_NEW_D1_UUID
corepack pnpm test
corepack pnpm typecheck
corepack pnpm cloudflare:build
corepack pnpm cloudflare:migrate
corepack pnpm cloudflare:deploy
```

`cloudflare:configure` writes the ignored `wrangler.standalone.jsonc` config. Review migrations under `drizzle/` before applying them to your database.

## Sign-in and account safety

The public Worker accepts verified Google ID tokens and database-backed sessions. It rejects untrusted identity headers at its entrypoint. Register the Worker's **exact HTTPS origin** with Google Cloud's OAuth Web application settings and configure `GOOGLE_CLIENT_ID`.

Google sign-in requires a live browser test; a passing build or health check does not by itself prove that an OAuth popup works.

## Backups and migration

Export important diagrams as JSON before changing domains or environments. Diagram versions, ownership and collaborator access require a separate, reviewed migration plan. The earlier deployment and its data remain independent.

## Rollback

Use a known-good commit and redeploy only after reviewing migrations. Do not run destructive schema changes during rollback. Preserve a backup of cloud diagrams before major releases.
