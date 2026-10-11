# API reference

These routes are same-origin endpoints for the application. They are not a public third-party token API. Requests use the current authenticated session; mutations must pass origin/account checks where required. API responses use `Cache-Control: no-store`.

## Workspace

| Method | Route | Result |
| --- | --- | --- |
| GET | `/api/workspace` | Current user and owned/joined active projects; anonymous requests receive a guest/empty response |
| GET | `/api/workspace/:id` | Accessible diagram with revision and role; `If-None-Match` can return 304 |
| PUT | `/api/workspace/:id` | Create at revision 0, update, compatible merge, or owned recovery |
| DELETE | `/api/workspace/:id` | Owner-only soft deletion; `If-Match` must equal the current revision |
| GET | `/api/workspace/:id/versions` | Up to 50 accessible saved versions, newest first |

A save body contains `model`, `revision`, and optionally `baseModel`. A baseline must match persisted history before it can authorize a three-way merge. Success returns the resulting revision/timestamp and can return a merged model/role. The client supplies `X-Bosha-Account-ID` to detect an account switch during mutations.

```json
{
  "revision": 0,
  "model": {
    "version": 1,
    "title": "Untitled diagram",
    "nodes": [],
    "edges": []
  }
}
```

Use a valid diagram ID, same-origin JSON requests, and the session established by the host or Google flow. A client-provided user/owner ID is not an authentication mechanism.

## Google authentication

| Method | Route | Result |
| --- | --- | --- |
| GET | `/api/auth/google` | Google configuration/client ID and current resolved user |
| POST | `/api/auth/google/nonce` | One-use browser-bound nonce; `{ "link": true }` requests explicit linking |
| POST | `/api/auth/google` | Verify `{ "credential": "<Google ID token>" }` against the nonce and create a server session |
| POST | `/api/auth/google/logout` | Revoke the current Google session and clear its cookie |

The browser uses the Google Identity Services script on `/account/google.html`. The client ID is public. The server verifies RS256 signature, audience, issuer, expiry, issued time, authorized party, verified email, subject and nonce. Cookies are `Secure`, `HttpOnly`, `SameSite=Lax` and `__Host-` scoped. Linking requires the same authenticated account at issuance and completion; matching emails alone never merge workspaces.

## Read-only sharing

| Method | Route | Result |
| --- | --- | --- |
| GET | `/api/shares/:id` | Owner’s current sharing configuration |
| POST | `/api/shares/:id` | Create/replace a capability; body `days` is 0, 7 or 30 |
| DELETE | `/api/shares/:id` | Revoke the current capability |
| POST | `/api/shares/view` | Read the latest shared model using `{ "token": "<capability>" }` |

Owner management requires the current account. The public viewer receives only the diagram model/revision/update time, not account metadata or the rest of the workspace. Share tokens are carried in the URL fragment and submitted in a bounded JSON request. Replaced, expired, revoked or deleted-diagram links stop returning the drawing.

## Collaboration

| Method | Route | Result |
| --- | --- | --- |
| GET | `/api/collaboration/:id` | Accessible team, role, presence, comments and owner-visible invitations |
| POST | `/api/collaboration/:id/presence` | Update cursor and selected element |
| POST | `/api/collaboration/:id/comments` | Add a comment; optional `elementId` |
| DELETE | `/api/collaboration/:id/comments/:commentId` | Delete own comment, or owner moderation |
| POST | `/api/collaboration/:id/invites` | Owner creates an editor/viewer invitation |
| DELETE | `/api/collaboration/:id/invites/:inviteId` | Owner revokes an invitation |
| PATCH | `/api/collaboration/:id/members/:accountId` | Owner changes editor/viewer role |
| DELETE | `/api/collaboration/:id/members/:accountId` | Owner removes a member and their presence |
| POST | `/api/collaboration/join` | Accept a single-use invitation token as the signed-in account |

Mutations require same-origin JSON where applicable and the matching `X-Bosha-Account-ID`. Collaboration invitations use `{ "role": "editor" }` or `{ "role": "viewer" }`. Accepting an invitation atomically consumes it and establishes membership. Diagram writes still go through the workspace API and its revision/access checks.

## Errors and limits

Common outcomes include 400 for invalid data, 401 for missing identity, 403 for denied permissions/origin, 404 for inaccessible/unavailable resources, 409 for revision/account/link conflicts, 413 for oversized workspace input, 415 for invalid workspace content type, and 503 for unavailable database/configuration. Exact responses vary by endpoint.

The workspace JSON body is bounded to 3,000,000 bytes; Google bodies to 20,000 bytes; collaboration bodies to 4,096 bytes; share bodies to 2,048 bytes. Model, label, comment, invitation and history bounds also apply. Always inspect the returned JSON error and preserve local edits on a failed save.
