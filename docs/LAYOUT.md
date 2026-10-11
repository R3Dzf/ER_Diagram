# Structured automatic layout

Auto layout plans a complete candidate, verifies it, and only then updates the diagram. The button uses separate device preferences for Chen and Crow’s Foot; Layout options exposes Balanced, horizontal layers, vertical layers, and Comfortable/Compact spacing. Repeating an identical arrangement is a no-op in editor history.

## Independent views and Undo

Chen and Crow’s Foot share conceptual data, but each keeps its own saved node positions and edge routes. Auto layout, dragging, alignment, coordinate edits, routing choices and manual bends affect only the active notation. Switching notation restores that view and does not consume an Undo step. Each notation also retains its own direction and spacing choices. A legacy global preference seeds Chen only; Crow’s Foot starts with Balanced/Comfortable.

Drawing Undo/Redo selects only actions from the current view. Shared data edits (names, attributes, keys/types, cardinality, participation, node/relationship creation or deletion) are available in either view and update the common model. History applies changed fields rather than replacing an old whole-diagram snapshot, so a shared rename Undo keeps both layouts intact. Deleting/restoring an object restores both of its saved positions. A new shared edit invalidates redo branches; a drawing edit invalidates shared/current-view redo while keeping the other view’s drawing redo.

Legacy diagrams seed both views from their existing coordinates once. Layouts persist in device/account storage, JSON backups, saved versions and shared diagrams. Undo/Redo remains an editor-session history, distinct from the durable 50-version history. Explicitly restoring a saved version restores that full saved diagram, including both layouts.

## Hard constraints

- Visible shape bounds keep at least 28 units of clearance, including relationship diamonds and Chen attributes.
- Entity/table centers align on shared rows or columns. Placement uses actual shape sizes and complete attribute-tree extents.
- The layout uses canonical name/ID ordering and explicit key-first attribute ordering. Initial visible coordinates and source array order do not choose the arrangement.
- Composite attribute trees stay together. Cyclic/shared attribute graphs use one canonical forest, so nodes are positioned once.
- Each disconnected major component has reserved space. Isolated relationships and Chen attribute groups get separate panels.
- Relationship connections are checked against all intervening visible shapes; attributes retain direct spokes behind the shape layer.
- Connection label boxes reserve space around shapes, endpoint symbols, and other labels. Opaque labels render above all connection strokes.
- Stored coordinates remain within the model's supported range. Candidates with unverified spacing, blocked relationship routes, or invalid bounds cannot partially mutate the live model.

Comfortable spacing uses 44 units between attribute subtrees, 84 between attribute levels, 100 for relationship corridors, and 200 between components. Compact reduces those soft spacing preferences while preserving the hard 28-unit shape clearance. Corridors can expand automatically if the first candidate cannot place routes or labels clearly.

## Separate placement engines

`layout-engine.js` dispatches only. `chen-layout-engine.js` owns Chen attribute forests, entity clusters and relationship diamond placement. `crow-layout-engine.js` owns a separate table graph, level ordering and measured-card packing. The shared `layout-validation.js` checks final shapes, bounds, routes and labels; it does not choose positions. `layout-options.js` stores the two sets of device preferences in `bosha-layout-options-v2`.

## Chen organization

Simple chains follow their connected order. Small branching trees use orthogonal branches. Other balanced components use aligned rows with a serpentine reading order; horizontal/vertical modes use breadth-first connected layers. Relationship diamonds prefer the direct participant midpoint, with attributes perpendicular to its axis. Repeated relations use separate legal lanes. A reserved shelf handles junctions whose attribute trees cannot fit near their midpoint.

## Crow’s Foot organization

Crow’s Foot builds a graph of visible entity/association cards only. It chooses a stable endpoint root for a chain, or a connected hub for branching components. Cardinality helps resolve root ties. Breadth-first levels and four deterministic forward/backward barycenter sweeps group neighboring tables. Within a level, actual row counts and name/type widths determine card dimensions. Levels reserve label corridors and align table centers. Balanced mode wraps long level sequences into bands of at most five levels; horizontal/vertical modes keep a single directional sequence. Disconnected components are packed separately.

Comfortable Crow spacing uses 64 units between table bounds within a level, a base 160-unit column corridor plus label allowance, 180 units between components and 220 between wrapped bands. Compact uses 48/110/140/180. Failed path/label checks can expand these corridors before application. This engine has no Chen ellipse/diamond placement dependency. Hidden attributes retain relative offsets in their Crow view without reserving ellipse bounds; their stored Chen positions remain untouched.

 Connection ports spread endpoint symbols along card boundaries. Cards with many connections grow to provide symbol clearance. Recursive relations use outside loops. Orthogonal routing uses a visibility grid, bend penalties, stable priority ordering, tested outer corridors, and a bounded search.

## Boundaries

A dense or non-planar graph can still have line crossings. This is not a guarantee of a crossing-free embedding or the globally smallest drawing. Shared/cyclic attributes are preserved and positioned consistently, but automatic layout does not repair their conceptual meaning. Very large requested horizontal/vertical arrangements can fall back to Balanced; diagrams that cannot fit the supported coordinate limits need splitting into smaller diagrams.

Names, node types, keys, cardinalities, participation, roles, and other model flags are preserved. Automatic layout intentionally replaces manual bend points and route choices in the active view; Undo restores them along with that view’s node positions. The account database and generated SQL schema are not changed by layout.

## Validation

Regression coverage includes every built-in model in both notations, all three directions, both spacing settings, shuffled node/edge arrays, perturbed visible coordinates, composite trees, parallel/recursive/n-ary relations, disconnected groups, large chains, 500-element attribute trees, route obstacle avoidance, label clearance, endpoint port spacing, model immutability during planning, failed-plan atomicity, saved options, repeated-layout no-op behavior, and editor Undo/Redo. Additional regressions enforce dedicated dispatch, invariance to old Chen positions/bends, independent settings migration/persistence, and Chen → Crow Auto layout → Chen sequences with Undo/Redo and reload.

Export SVGs are inspected in both themes. LinkeDOM tests exercise actual editor handlers. Native browser pointer behavior and full responsive interface QA require a browser environment.
