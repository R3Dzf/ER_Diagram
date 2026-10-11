# Contributing

Start with the [development guide](docs/DEVELOPMENT.md). Keep changes focused and describe the user-visible problem, resulting behavior, validation and limitations.

## Project conventions

- Keep all application interface text in English and general-purpose.
- Preserve one conceptual model for both notations and all export/validation/SQL consumers.
- Keep entity-side cardinality and participant-specific participation consistent.
- Preserve users’ diagrams, revisions, pending edits and account identity during cache/account changes.
- Use prepared statements and verify roles on server operations.
- Never place tokens, private environment files, database state or production records in commits.
- Preserve bundled fonts/libraries and their notices when modifying export assets.
- Increment the service worker cache version after changes to precached assets.

## Validation

Run `pnpm test`, `pnpm run typecheck` and `pnpm run build`. Add meaningful regression checks for changed model/API/UI behavior. Review the actual UI in a browser for visible changes, including dark theme and narrow viewports; document any unavailable verification.

For schema changes, generate and review a new migration, commit its metadata, apply it to a local database, and check existing account/permission/history behavior. Keep deployed migrations intact.

## Issues and pull requests

For a bug, include reproduction steps, browser/OS, expected behavior, actual behavior, and an anonymized JSON diagram when geometry/model data matters. Remove private labels/data before sharing examples. For a feature, state the intended user task and distinguish existing functionality from proposed work.

Do not report authentication bypasses or private-data leaks with working credentials in a public issue; follow [SECURITY.md](SECURITY.md).

No project-wide open-source license has been selected. Discuss reuse/licensing questions with the repository owner before distributing a derived project.
