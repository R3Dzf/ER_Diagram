# Deployment and authentication

## Current live application

[Bosha Studio](https://bosha-er-studio-5b42.tiny-mole-7191.chatgpt.site) is the existing hosted application. Uploading this repository does not move it, copy its database, or change its audience. The repository is a clean source export from the published version-17 application, with documentation and portable development commands added.

## Sites hosting

The application uses Vinext, a Cloudflare Worker and a D1 binding. `.openai/hosting.json` declares `"d1": "DB"` and no R2 bucket. The existing live project ID has been omitted from this repository’s manifest to avoid accidentally targeting that Site from a new clone.

For a new hosted copy:

1. Register/select a Site through the supported Sites workflow and persist its returned project ID in `.openai/hosting.json`.
2. Preserve the D1 binding `DB` and committed migrations.
3. Configure runtime bindings, including optional `GOOGLE_CLIENT_ID`.
4. Install using the pinned pnpm/lockfile and run the checks.
5. Build/package the matching committed source, save a version, and deploy that saved version.
6. Verify the deployment result and test sign-in, private workspace isolation, sharing and collaboration.

Do not copy `.sites-runtime/`, local database state or credentials into the repository. Use the host’s runtime configuration for application environment values. Sites applies committed D1 migrations through its deployment workflow.

## Running on another host

The guest editor can be served as static files from `public/`. Full functionality needs a Worker-compatible backend, D1 or an explicitly adapted database layer, HTTPS, migrations and a trustworthy identity boundary. GitHub Pages cannot execute the account/workspace/collaboration APIs.

**The native identity headers are trusted only behind the Sites gateway.** On another host, strip or reject client-supplied `oai-authenticated-user-*` headers and supply identity only after a verified server-side authentication flow. The native `/signin-with-chatgpt` and `/signout-with-chatgpt` routes are hosting capabilities, not a standalone OAuth integration shipped by this application.

`wrangler.local.jsonc` is a local migration/development config with a placeholder database ID. Do not deploy it as if it contained a real production database. Provision your own database, use its binding/ID, apply migrations, and configure the production Worker’s asset and routing setup.

## Google sign-in

This implementation uses **Google Identity Services**, a Web application client and an ID-token popup callback. It does not require a Client Secret for this flow.

1. Configure branding/consent and create an OAuth client of type **Web application** in the Google Cloud project you control.
2. Add each deployment’s exact scheme + hostname under **Authorized JavaScript origins**. For the current live app, the origin is `https://bosha-er-studio-5b42.tiny-mole-7191.chatgpt.site`.
3. Configure `GOOGLE_CLIENT_ID` in the host’s runtime environment to the returned `…apps.googleusercontent.com` value.
4. Apply the runtime setting to the deployment and open `/account/google.html` from Account.
5. Use **Connect Google to this account** when retaining an existing account’s diagrams, or **Continue with Google** to sign into the Google-backed workspace.

Use an origin without `/studio/` or a trailing path. This callback flow does not use an application redirect URI. If Google reports `invalid_client` or “no registered origin,” check the client type, owning Cloud project, exact client ID, and authorized origins. Editing CSS does not fix that configuration error.

`.dev.vars.example` shows the optional public binding. Copy it to ignored `.dev.vars` for local Worker testing. The nonce/session cookies are Secure; validate a real Google flow in a compatible HTTPS environment. Local development’s mock ChatGPT login is a separate facility.

The server verifies the token and browser-bound nonce. Google sessions and nonces expire and are stored as hashes. Linking is explicit and rejects a Google subject already owned by another application account. No equal-email automatic merge is performed.

## Offline shell releases

Changing a precached editor asset requires a new `CACHE_NAME` in `public/sw.js`. Keep all required local assets in the precache list. Existing clients may receive a waiting update; they activate it with **Update app** once their edits are safe. Installation controls hide when installed/standalone status is detected.

## Verification limits

Automated tests use local signing keys and in-memory database fixtures. They validate token/security logic and API permissions but do not prove a real Google consent screen or production account linking succeeded. Installation, theme visuals, touch/pointer behavior and complex diagram layouts also require real-browser checks.

The CI workflow builds and tests source; it does not deploy to the existing Site or need production secrets. Uptime, quotas, backups and continued service depend on the chosen hosting service and its configuration.
