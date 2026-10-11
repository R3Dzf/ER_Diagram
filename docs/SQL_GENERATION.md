# SQL generation

Schema studio produces a proposed relational schema from the shared conceptual diagram. It exports SQL text and never executes it against Bosha Studio's account database. The generated schema, its assumptions, and your business rules require review before database use.

## Databases

| Option | Behavior |
| --- | --- |
| PostgreSQL | Double-quoted identifiers; JSONB and BYTEA; foreign keys added after table creation |
| MySQL 8.0.16+ | Backtick identifiers; InnoDB; CHAR(36) for UUID, DOUBLE for REAL, DATETIME for TIMESTAMP; enforced CHECK support is required |
| SQLite | Foreign keys enabled with PRAGMA; inline foreign keys; affinity-based types |

Foreign key indexes are enabled by default. An index is omitted when an existing primary or unique key already covers its leading columns. Optional transaction wrapping applies to PostgreSQL and SQLite. MySQL DDL commits implicitly, so the export explains why it does not wrap table creation in BEGIN/COMMIT.

## Mapping rules

| Model | Generated structure |
| --- | --- |
| Entity | One table; declared key attributes form its primary key |
| No entity key | An INTEGER `id` with a review warning; values are not automatically generated |
| Composite attribute | Leaf columns prefixed with their composite path; ancestor key and derived flags apply to descendants |
| Derived attribute | Omitted from storage, with an explanatory note |
| Multivalued attribute | Separate collection table, with owner foreign key and value columns forming its key |
| Weak entity | Owner key included in its composite primary key; weak owner chains finalized before referencing them |
| One-to-many | Foreign key and scalar relationship attributes on the many side |
| Relationship key attributes | UNIQUE on the declared relationship key tuple, including composite leaves |
| One-to-one | Foreign key on a selected side, preferably one with total participation, plus a UNIQUE constraint |
| Many-to-many | Association table with the participant key tuple as primary key |
| Relationship collection | Association table plus a collection referencing its complete key |
| Multi-entity relationship | Association table; a one-side cardinality adds uniqueness for the other participant tuple |
| Recursive relationship | Role names distinguish foreign key columns referencing the same entity |
| Missing cardinality | Conservative association table and an explicit review warning |

Participation on the side holding a foreign key determines whether it is required. Nullable composite foreign keys have an all-null or all-present check. Required scalar relationship attributes on an optional relationship use conditional checks, and relationship values cannot exist without that relationship's foreign key.

## Review boundaries

The generator cannot infer rules from arbitrary names. Required participation on the inverse side of a foreign key, or the existence of at least one association row for every entity, generally needs application logic or a database-specific trigger. Invalid or cyclic weak ownership, multiple candidate owners, unsupported types, and missing keys generate review diagnostics.

SQLite affinities do not validate date formats, UUIDs, JSON domains, boolean values, or decimal precision. Add those checks for your application. MySQL text/blob key values use VARCHAR(255) with a warning; review whether this matches your data, key sizes, collation, and database index limits. Generated IDs do not imply identity/auto-increment behavior. Deletion behavior is the database's default; cascading deletes are not inferred.

Use **Tables & relationships** to inspect exact column names, types, primary keys, foreign keys, nullable state, and uniqueness. Mapping notes explain the relationship placement, and **Locate** selects the original diagram element. Changing export options does not change the diagram or its stored model.

## Validation

Regression tests execute generated SQLite schemas and attempt invalid inserts to verify foreign key, uniqueness, requiredness, conditional attribute, and composite-null checks. They also cover composite/multivalued flags, relationship collections, weak owner chains, recursive roles, n-ary tuple uniqueness, deterministic identifiers, dialect text, source immutability, UI tab switching, and safe syntax highlighting. PostgreSQL and MySQL output is covered by generator assertions; live execution against those engines is not part of the local suite.
