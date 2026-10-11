# Security

## Reporting

Use the repository’s private vulnerability-reporting channel if the owner enables it. Otherwise contact the maintainer privately through a verified channel before disclosing exploit details. Do not include live tokens, share capabilities, user diagrams or account information in public issues.

## Boundaries

- The full backend trusts native identity only when a trusted Sites gateway supplies the authenticated headers. Those headers are not independently verified bearer tokens; hosting elsewhere must strip untrusted copies and replace the identity integration.
- Google identities require signature/claim verification and a one-use browser-bound nonce. Explicit linking retains the account ID and never merges accounts by email alone.
- Session/nonce cookies are Secure, HttpOnly, SameSite=Lax and host scoped. Session/nonce tokens are hashed in D1.
- Diagram operations check owner/member roles. Viewers cannot write diagram content; only owners manage share links, membership and deletion.
- Origin/account checks protect mutations. Request sizes, graph bounds, labels and record limits are enforced. SQL parameters are bound rather than interpolated.
- API responses and the shared viewer are excluded from the offline precache. Offline account access trusts the local device and its browser storage.
- Public share links are capabilities: anyone holding an active link can view that diagram. Revocation stops later reads but cannot erase previously downloaded copies.
- Revision checks and conflict handling protect local edits from silent stale overwrites; they are not a replacement for backups.

This repository contains code and schema only. Runtime credentials, production records, `.dev.vars`, `.env*`, `.wrangler/`, `.sites-runtime/`, and local database files must remain excluded. Automated security regression tests are included; they do not certify the complete host or a deployment configuration.
