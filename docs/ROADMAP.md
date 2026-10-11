# Scope and roadmap

## Implemented

The repository includes the current working editor, both notations, independent relationship participant settings, SVG/PNG/vector PDF exports, SQL preview, validation, connected movement, improved auto layout, templates, account workspaces, Google/native sign-in boundaries, history, read-only sharing, polling collaboration/comments, offline/PWA support, themes, dialog-safe notifications, a connected ER logo, and focused first-visit Home.

The clean export is based on the live version-17 source commit `945290e49adba25dd28f3b92f9924f633e5c6685`. The GitHub export adds documentation, a portable local migration command/config, and a CI workflow; it does not contain production records or credentials.

## Future ideas — not implemented

| Idea | Intended benefit / open work |
| --- | --- |
| Written Relationship Reader | Explain each participant’s allowed/required association in text; quote arbitrary labels instead of guessing verbs; define role-aware recursive and multi-participant rules |
| Layout preview | Review a proposed arrangement before applying it |
| Quick add | Create connected elements with fewer steps |
| More validation rules | Better diagnostics for modeling consistency and notation-specific requirements |
| Minimap / focused view | Navigate large drawings and isolate a selected group |
| Folders, favorites and trash | Organize work and provide managed recovery beyond immediate deletion Undo |
| Model documentation export | Produce a structured written description of entities, keys and relationship rules |
| Browser QA expansion | Extend real-browser checks for touch, PWA installation, OAuth and visual geometry |
| Collaboration transport evolution | Evaluate WebSockets/CRDTs if scale and simultaneous-edit requirements justify them |

The Relationship Reader is intended to be **written only**, with no voice narration. It must derive sentences from explicit cardinality/participation and role data, not invent meaning from relationship names. Missing settings should be reported instead of guessed. These are ideas, not shipped feature claims or delivery promises.
