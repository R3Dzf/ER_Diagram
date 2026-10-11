# Structured automatic layout

Auto layout plans a complete candidate, verifies it, and only then updates the diagram. The button uses device preferences; Layout options exposes Balanced, horizontal layers, vertical layers, and Comfortable/Compact spacing. Repeating an identical arrangement is a no-op in editor history.

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

## Organization

Simple chains follow their connected order. Small branching trees use orthogonal branches, including association cards in Crow's Foot. Other balanced components use aligned rows with a serpentine reading order; horizontal/vertical modes use breadth-first connected layers. Relationship diamonds prefer the direct participant midpoint, with attributes perpendicular to its axis. Repeated relations use separate legal lanes. A reserved shelf handles junctions whose attribute trees cannot fit near their midpoint.

Crow's Foot keeps hidden Chen attributes relative to their owner when possible; it packs only the cards visible in that notation. Connection ports spread endpoint symbols along card boundaries. Cards with many connections grow to provide symbol clearance. Recursive relations use outside loops. Orthogonal routing uses a visibility grid, bend penalties, stable priority ordering, tested outer corridors, and a bounded search.

## Boundaries

A dense or non-planar graph can still have line crossings. This is not a guarantee of a crossing-free embedding or the globally smallest drawing. Shared/cyclic attributes are preserved and positioned consistently, but automatic layout does not repair their conceptual meaning. Very large requested horizontal/vertical arrangements can fall back to Balanced; diagrams that cannot fit the supported coordinate limits need splitting into smaller diagrams.

Names, node types, keys, cardinalities, participation, roles, and other model flags are preserved. Automatic layout intentionally replaces manual bend points and route choices; Undo restores them along with node positions. The account database and generated SQL schema are not changed by layout.

## Validation

Regression coverage includes every built-in model in both notations, all three directions, both spacing settings, shuffled node/edge arrays, perturbed visible coordinates, composite trees, parallel/recursive/n-ary relations, disconnected groups, large chains, 500-element attribute trees, route obstacle avoidance, label clearance, endpoint port spacing, model immutability during planning, failed-plan atomicity, saved options, repeated-layout no-op behavior, and editor Undo/Redo.

Export SVGs are inspected in both themes. LinkeDOM tests exercise actual editor handlers. Native browser pointer behavior and full responsive interface QA require a browser environment.
