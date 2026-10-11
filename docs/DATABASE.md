# Database

The full application uses **Cloudflare D1**, a SQLite-compatible database bound as `DB`. `db/schema.ts` is the Drizzle source schema. `drizzle/*.sql` and `drizzle/meta/` contain the committed migrations and their metadata.

## Tables

| Table | Purpose and key |
| --- | --- |
| `accounts` | Account ID, email, display name and creation time |
| `diagrams` | Diagram ID, owning account, JSON model, revision, timestamps and soft-delete flag |
| `diagram_versions` | Saved JSON models keyed by diagram ID and revision |
| `google_identities` | Verified Google subject bound to one application account |
| `google_sessions` | Hashed Google session token, account/subject association and expiry |
| `google_nonces` | Hashed browser nonce, optional account-link target and expiry |
| `diagram_shares` | One active read-only link configuration per diagram, owner, token/hash and expiry |
| `diagram_members` | Diagram/account pair and editor/viewer role |
| `diagram_invites` | Single-use invitation hash, diagram, role and expiry |
| `diagram_presence` | Latest participant cursor/selection and update time |
| `diagram_comments` | Author, diagram, optional element, body and creation time |

No account passwords are stored. Google session tokens and nonce values are stored as hashes. An owner’s active share capability is also retained so the owner can retrieve/copy the current link; treat a database export as sensitive.

## Relationships and permissions

Each diagram has one owning account. Versions, share settings, invitations, members, presence and comments reference a diagram. Google identities reference an account; sessions reference the account and verified Google subject.

The server checks ownership/membership rather than trusting submitted owner IDs. The owner can edit, delete, share, manage members and restore history. Editors can save diagram changes. Viewers can read, export and comment but cannot change diagram data. See the [API guide](API.md).

## Storage limits

| Record/operation | Current bound |
| --- | --- |
| Active diagrams per workspace | 60, including joined diagrams |
| Retained versions per diagram | 50 |
| Nodes / edges per model | 500 / 2,000 |
| Collaborator member rows per diagram | 20, in addition to the owner |
| Active invitations per diagram | 20 |
| Comments per diagram | 100 |
| Comment body | 1,000 characters |
| Collaboration invitation expiry | 7 days |
| Google session expiry | 7 days |
| Google sign-in nonce expiry | 10 minutes |
| Presence freshness | Approximately 15 seconds |
| Read-only share expiry | 7 days, 30 days, or until revoked |

These are implementation limits, not hosting quotas or availability promises.

## Migrations

| Migration | Added scope |
| --- | --- |
| `0000_aberrant_skin.sql` | Accounts, diagrams and version history |
| `0001_simple_magdalene.sql` | Google identities, sessions and nonces |
| `0002_greedy_zeigeist.sql` | Diagram share links |
| `0003_glorious_mad_thinker.sql` | Collaboration membership, invitations, presence and comments |

Generate a new migration with `pnpm run db:generate`, inspect it, and commit the SQL and metadata together. Existing migrations are historical deployment inputs; do not rewrite them to patch a live database.

Apply locally with `pnpm run db:migrate:local`. Production Sites deployment applies migrations through the host’s configured database workflow. When hosting separately, provision your own D1 database and configure migration application for it.

## Persistence behavior

Models are JSON payloads validated on writes. Prepared statements parameterize user-controlled values. A successful write increments the revision and records a saved version. Contested changes require a verified baseline or return a conflict. History pruning retains the most recent 50 saves.

Deletion sets the soft-delete flag and increments the revision. Deleted diagrams disappear from workspace lists and read-only share access. The UI’s Undo is an immediate recovery action, not a full trash-management interface.

Browser caches are separate from D1. Guests save on the device; account caches retain their own account ID, revisions, pending changes and deletions. Device diagrams enter an account only through explicit import. Downloaded JSON is the portable backup format.

Production data, SQLite files, Wrangler local state, user diagrams and session records are intentionally absent from this repository.
