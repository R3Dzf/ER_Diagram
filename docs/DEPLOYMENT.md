# Deployment

ER Diagram is available at https://er-diagram.r3dzf-studio.workers.dev.

The independent deployment is hosted on Cloudflare Workers and uses its own Cloudflare D1 database. The previous application environment is kept separate; no accounts, saved diagrams or sessions are migrated automatically.

## Cloudflare deployment

Follow [INDEPENDENT_HOSTING.md](INDEPENDENT_HOSTING.md) for environment setup, D1 migrations, Google OAuth configuration, and GitHub Actions deployment. The deployment workflow runs only from the standalone branch.

- Keep `CLOUDFLARE_API_TOKEN` in GitHub Actions Secrets; never commit tokens.
- Configure `GOOGLE_CLIENT_ID` for your own authorized web origin.
- Run tests and type checks before publishing.
- Apply database migrations only against the dedicated D1 database.
- Verify homepage, login, diagram storage, and sharing after deployment.

## Authentication and security

The public Worker authenticates using verified Google ID tokens and database-backed sessions. Client-provided identity headers must never grant account access. The deployment validates this boundary.

## Migration and backup

Always export JSON backups of important diagrams before moving between independent environments. Account records, collaborators, sharing links, and revision history do not transfer automatically.
