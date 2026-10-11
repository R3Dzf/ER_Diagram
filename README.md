# Bosha Studio

English ER diagram workspace with Chen and Crow’s Foot views, ChatGPT and optional Google sign-in, and private per-account cloud projects.

## Storage and identity

Sites provides authentication at `/signin-with-chatgpt` and `/signout-with-chatgpt`. Only dispatch-supplied authenticated identity headers are accepted by the server. Users cannot supply an owner ID in a request body. Every diagram and version operation verifies the authenticated owner. The existing Site audience is preserved; site-level access and per-account diagram ownership are separate.

Cloudflare D1 is bound as `DB` in `.openai/hosting.json`. The schema contains `accounts`, `diagrams`, and `diagram_versions`. Schema changes use `npm run db:generate`; commit the generated Drizzle migration and metadata. Deployment applies hosted migrations. There is no request-time schema creation. Native authentication owns sessions; no passwords or tokens are stored by this app.

A user has up to 60 active diagrams and 50 retained versions per diagram. Autosave uses optimistic revisions to reject stale writes. Offline changes stay in an account-specific device cache and are retried when connectivity returns. A conflict can be kept as a recovered copy. Device-only diagrams are imported into an account through an explicit user action. Deletion is soft and supports immediate undo. Account identity is resolved before displaying cloud records.

## Editor

- Hold left mouse on empty space to pan; scroll zooms around the pointer. Space/middle mouse and Hand mode also pan.
- Shift-click or Shift-drag selects multiple elements. Area select supports the same gesture without a keyboard. Group move, alignment, distribution, copy/paste and duplication preserve internal connections.
- Choose Straight or Orthogonal in connection properties. Orthogonal routing avoids surrounding elements when a path is found. Double-click a connection to insert a bend, then drag its handles. Reset bends restores automatic routing.
- Auto layout arranges the drawing; movement shows alignment guides. Alt temporarily suppresses guide snapping. Undo restores previous positions.
- Validation locates missing keys, disconnected elements, incomplete relationships, and shape-crossing connections.
- Chen and Crow’s Foot use one underlying conceptual model. Crow’s Foot shows entity attribute rows and endpoint markers; relationships with attributes and multi-entity relationships use association boxes. Relationship properties remain editable from Outline and Connections.
- SQL preview/download generates PostgreSQL tables, keys, foreign keys, association tables, and multivalued attribute tables. Generated assumptions and rules needing application enforcement are shown before execution.
- PNG and SVG exports include the entire diagram. PDF renders vector shapes and embedded fonts, with A3/A4, orientation and tiled-page options. Tiled output caps page count to prevent unbounded export.

## Source and checks

The retained editor lives in `public/studio/`; `/` redirects to it. Vinext hosts authenticated APIs under `/api/workspace`. `lib/workspace-api.mjs` contains the server boundary. D1 statements are parameterized, mutations reject foreign origins, and uploads are bounded.

Run `npm test` and `node node_modules/typescript/bin/tsc --noEmit`. Tests cover ownership isolation, revisions/history, offline retry/conflict preservation, routing geometry, notation conversion, group operations, SQL generation, vector PDF, the real UI DOM, and earlier underline/participation/panning regressions. DOM tests do not replace visual browser QA.

Use the Sites build helper for deployment. The source workflow owns Git synchronization and packaging. Fonts and PDF rendering dependencies are bundled locally so export does not depend on a third-party CDN.

## Google sign-in setup

Google Identity Services is implemented and is disabled until `GOOGLE_CLIENT_ID` is configured in the Site's hosted runtime settings. The Client ID is a public application identifier; this ID-token flow does not require a Client Secret. Do not copy secrets into source or browser code.

1. In Google Cloud > Google Auth Platform, configure branding and create an OAuth client of type **Web application**.
2. Add this exact Authorized JavaScript origin: `https://bosha-er-studio-5b42.tiny-mole-7191.chatgpt.site`.
3. Set `GOOGLE_CLIENT_ID` to the returned `…apps.googleusercontent.com` value using Sites runtime environment tools. Redeploy the saved version to apply that environment revision.
4. Open Account > Connect Google to this account to retain the current account's drawings. Anonymous visitors may choose Continue with Google to create or access a separate Google-backed workspace. The Site is currently public. Visitors can use Google directly once this Client ID is configured. Hosting access remains separate from per-account drawing authorization.

The implementation uses the official hosted GIS script on a dedicated, top-level sign-in page. No One Tap or automatic sign-in is requested. The browser posts the Google ID token over same-origin HTTPS. The server validates Google's RS256 signature, audience, issuer, expiry, issued time, authorized party and a one-use browser-bound nonce. Only the verified Google subject identifies the Google account. Equal email addresses never cause automatic account merges.

Nonce and session cookies are Secure, HttpOnly, SameSite=Lax and use the `__Host-` prefix. D1 stores hashed nonce/session tokens and seven-day sessions. Explicit account linking verifies the currently authenticated account again before creating the binding, retains its account ID, and rejects a Google subject already owned by another account. Logging out revokes the Google session before using the native ChatGPT sign-out route. Drawing mutations also check the editor's expected account to prevent writes under a different identity after a session switch.

Google OAuth activation and real Google consent/browser QA require the actual Client ID and authorized-origin setup. Automated tests use locally signed keys and tokens; they do not claim a live Google login succeeded.

## Sharing, appearance and offline app

Diagram sharing is opt-in through Share in the editor or a diagram card. A random, revocable capability in the URL fragment opens only that diagram's latest saved revision. Owner management requires the current signed-in account and same-origin mutations. Public reads use a bounded JSON POST, return no owner/workspace metadata, and are never cached. Links expire after 7 or 30 days, or remain valid until revoked. Replacing a link invalidates its predecessor. Deleted diagrams cannot be viewed. Revocation prevents subsequent reads; previously viewed content cannot be recalled.

Appearance supports Light, Dark and System. Export appearance is independent: light/white or dark/navy, plus transparency for PNG/SVG. PDF keeps an opaque background and vector text/geometry.

The root-scoped module service worker precaches the editor shell, local fonts and PDF libraries. Open online once, and wait for offline preparation in Install app before relying on offline use. Installation uses the browser's prompt when available, with browser-menu instructions otherwise. The offline cache deliberately excludes APIs, authentication pages and the shared viewer. Increment `CACHE_NAME` in `public/sw.js` whenever changing any precached asset; updates wait for user action and respect pending work.

A previously opened account can edit its validated device cache offline. Queued edits/deletions retain account IDs and revisions. Reconnection checks the live account before unpausing writes; mismatched accounts keep their original local edits. Revision conflicts preserve local models and offer recovery copies. Sync runs while the app is open; this is not a background-sync guarantee. Guest diagrams remain device-local. JSON backups remain available, and storage failures are reported in the save indicator. Offline access trusts the local device, so do not use a shared device for private work.

Tests cover capability isolation/rotation/revocation/expiry, offline shell exclusions and root fallback, paused writes, installation prompt/update lifecycle, appearance/export independence, and real editor reconnection across account changes. Actual browser installation and browser visual QA require a browser-control surface.

## Relationship participant settings

Select a relationship diamond (or its Outline entry in Crow’s Foot view) to configure each connected entity’s Cardinality (1, N, M, or Not set) and Participation (Partial/Total). New connections leave cardinality unset and select the relationship for configuration. Connection properties retain routing, bends and role labels, with an Edit relationship shortcut.

Chen renders one cardinality on each entity–relationship connection, at the entity side. Legacy relationship-end duplicate labels are ignored, while existing entity-side values and whole-connection total participation remain readable. Updating a participant clears its obsolete opposite-side fields. Settings remain independent across participants, support more than two entities, and use the same values for validation, SQL, Crow’s Foot, sharing and exports. No database migration or bulk rewrite is performed.

## Google configuration error: no registered origin / invalid_client

This Google-hosted error indicates that the current origin is not authorized for the selected OAuth web client. Editing application CSS or accepting unsigned credentials cannot resolve it.

For this deployment, open Google Cloud → Google Auth Platform → Clients, select the existing Web application client `599299968338-fstcqt31gg7ulva4q2oseasvan1trha1.apps.googleusercontent.com`, and add `https://bosha-er-studio-5b42.tiny-mole-7191.chatgpt.site` to **Authorized JavaScript origins**. Save, then retry sign-in. Enter the scheme and hostname only, without `/studio/` or a trailing slash. This app uses the popup callback flow; an Authorized redirect URI is not required for this flow. The hosted Client ID is already configured. This change must be made in the Google Cloud project that owns the client.

## Connected auto layout and branding

Chen auto layout first packs complete entity attribute trees, orders entities by their relationships, then places relationship diamonds near their participants in clear spaces. It separates outgoing relationship directions to keep cardinalities readable, reserves relationship attribute trees and retains deterministic, undoable positions. Cyclic/shared attribute graphs are claimed once. Crow’s Foot continues to reserve full card sizes. SVG/PNG/PDF exports and sharing use the same model positions.

The brand symbol depicts two entities connected to a relationship diamond. It is used in the navigation, editor header, loading screen, Google account page, root and studio favicons, Apple icon, and PWA manifest. Installed clients use **Update app** to activate a waiting offline shell; pending edits are protected.


Branching Chen diagrams now use a hub-oriented topology: connected entities occupy separate sides, while attribute fans point into unused space. Relationship attribute fans can use any of four directions, so a vertical relationship can keep its attribute beside the diamond instead of pushing the diamond off its connection axis. Relationship placement checks actual shapes and the candidate's own attribute spokes. Long/deep clusters retain the general packer; all paths remain deterministic and undoable. Cardinality text has explicit clearance from entity borders, including diagonal connections.
