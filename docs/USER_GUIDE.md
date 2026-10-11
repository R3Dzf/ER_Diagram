# User guide

## Start with one decision

On a fresh workspace, Home introduces the editor with two main actions:

- **Create your first diagram** opens a blank canvas.
- **Try an example** creates an editable Customer/Order diagram.

You can also browse templates or open the full workspace. Starting or dismissing the introduction is remembered on the device for that workspace/account. Existing diagrams open in the dashboard. **Help & shortcuts → Getting started** reopens the introduction without replacing your work.

## Create a diagram

1. Add an **Entity**, such as Customer or Order.
2. Select the entity, then add an **Attribute** to attach it automatically.
3. Add a **Relationship**, such as Places.
4. Choose **Connect elements**, then select its start and end.
5. Select the relationship to configure each connected entity’s cardinality and participation.
6. Select any element and edit its name or properties. Names update as you type.

An entity is something you store data about. An attribute describes it. A relationship connects entities. Keys identify instances; marking an attribute as a primary key underlines its label.

## Cardinality and participation

These describe different rules. Configure them from the relationship’s participant blocks.

| Setting | Meaning |
| --- | --- |
| `1` | One on that participant’s side of the relationship ratio |
| `N` or `M` | Many; different letters distinguish the two sides of a many-to-many ratio |
| Not set | A rule has not been specified yet |
| Partial | Some instances may take no part in the relationship |
| Total | Every instance must take part; Chen displays a double line |

For **Customer — Places — Order**, `1` beside Customer and `N` beside Order means one customer can place many orders, while one order relates to one customer. Total participation on Order means every order must have a customer. Partial participation on Customer allows a customer with no orders.

`M` and `N` are symbols for “many,” not fixed numeric values. Naming a relationship does not determine either cardinality or participation automatically.

For a recursive relationship, add clear role labels such as Manager and Subordinate. Connections provide routing/bend/role controls and an **Edit relationship** shortcut.

## Navigate and edit

| Action | How |
| --- | --- |
| Pan | Hold the left mouse button on empty canvas and drag |
| Pan from anywhere | Hold Space and drag, use the middle mouse button, or choose Hand |
| Zoom | Scroll around the pointer, or use the zoom buttons |
| Fit | Fit to screen or `F` |
| Move | Drag an element |
| Move entity and attributes | Drag the entity; its attached attribute tree follows |
| Multiple selection | Shift-click elements, Shift-drag empty space, or Area select |
| Copy/paste a group | Ctrl+C / Ctrl+V |
| Undo/redo | Ctrl+Z / Ctrl+Shift+Z |
| Rename | Select an element and type in Properties |
| Find elements | Use Outline search, then select an entry |
| Snap | Toggle Snap; Shift and alignment guides assist positioning |
| Suppress guides temporarily | Hold Alt while moving |
| Add a line bend | Double-click a connection and drag the bend handle |
| Reset bends | Use the connection’s properties |

Connections sit behind shapes. Straight and orthogonal routing are available. Orthogonal routing avoids obstacles when a route can be found; manually adjust bends for difficult drawings.

## Arrange and validate

**Auto layout** arranges the whole diagram. It accounts for connected entities, entity/relationship attribute trees, and notation-specific sizes. Branching Chen diagrams distribute connected entities across separate directions. All positions remain editable, and **Undo** restores the previous arrangement.

Use **Validate** to list available checks and jump to affected elements. Resolve issues before generating SQL. Validation cannot infer business rules from arbitrary labels, and a clean validation result does not prove a database design is complete.

## Switch notation

Choose Chen or Crow’s Foot from the notation selector. Both render the same conceptual model. Crow’s Foot shows entity attributes as rows and relationship endpoint markers. Relationships with attributes or multiple participants can appear as association boxes. Select the relationship through Outline to edit its rules.

## Save and organize

Guests save on the current browser/device. Signed-in diagrams save to the account. The save indicator reports pending, saved, offline, or conflict states.

The dashboard offers search, notation filters, sorting, grid/list views, recent diagrams, duplication, and deletion with immediate undo. A workspace holds up to **60 active diagrams**, including joined diagrams. Version history retains up to **50 saves per diagram**; restoring creates a new save.

**Save project** downloads JSON. **Import** loads a supported diagram JSON. Keep JSON backups before clearing browser data, changing devices, or experimenting with large changes. Guest projects do not move into an account automatically: use **Account → Import device diagrams** after signing in.

## Accounts and collaboration

Sign in with ChatGPT on compatible Sites hosting, or with Google when configured. To keep the same workspace while adding Google, use **Connect Google to this account**. Matching email addresses do not automatically merge accounts.

Owners can invite people as **Can edit** or **Can view & comment**. Each invitation link is single-use and expires after seven days. Share the link with the intended person yourself.

Collaborators can see presence/cursors and add diagram or element comments. Viewers cannot mutate diagram data. The owner manages membership and roles. Updates use polling while the app is open; simultaneous edits to different fields can merge, while incompatible edits preserve a local copy and require recovery.

## Share a read-only link

Use **Share** after the diagram syncs. Choose seven days, thirty days, or no expiry. The link exposes that diagram’s latest saved revision, not the rest of your workspace. Replace or revoke the link to stop future access. Revocation cannot remove copies already viewed or downloaded.

A read-only share link and a collaborator invitation serve different purposes: the former lets link holders view a diagram; the latter grants a signed-in account a membership role.

## Export

| Format | Best use | Options |
| --- | --- | --- |
| PNG | Screenshots, coursework, slides | Resolution, light/dark background, optional transparency |
| SVG | Scalable artwork and editing | Light/dark appearance and optional transparency |
| PDF | Printing and documents | Embedded fonts, vector shapes, A4/A3, orientation, single-page fit or tiling |
| JSON | Editable backup | Preserves the model, rather than a flattened picture |

Image and PDF exports include the whole diagram, not just the visible viewport. Export appearance is independent of Light/Dark/System UI theme. PDF uses an opaque background. Large PNGs are bounded to avoid excessive memory use; tiled PDFs have a page limit.

**Generate SQL** produces PostgreSQL text with warnings about assumptions. Review it before running it against a real database.

## Install and work offline

Open the app online once and allow the offline shell to prepare. Use **Install app** when the browser supports it, or follow the browser-menu instructions. The button hides after installation is detected. Use **Update app** to activate a waiting update; pending edits can block reload.

Offline assets include the editor, fonts, and PDF libraries. API responses, sign-in pages, and the shared viewer are excluded from the cache. A previously opened account can edit its validated device copy offline. Reconnect to the same account to sync. Queued changes do not switch silently into another account.

Sync occurs while the app is open; closing the app does not guarantee background delivery. Device storage can be cleared or unavailable, so keep downloaded backups.

## Keyboard shortcuts

| Key | Action |
| --- | --- |
| `E` | Entity |
| `R` | Relationship |
| `A` | Attribute |
| `C` | Connect |
| `V` | Select |
| `H` | Hand |
| `F` | Fit |
| `Delete` / `Backspace` | Delete selection |
| Arrow keys | Move selected elements |
| Shift + arrows | Larger movement |
| Ctrl+Z | Undo |
| Ctrl+Shift+Z | Redo |
| Ctrl+C / Ctrl+V | Copy / paste group |
| Esc | Exit connection mode / close panels |

Shortcuts do not replace normal typing while a text input is active.
