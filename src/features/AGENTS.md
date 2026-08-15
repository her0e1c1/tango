# Features Instructions

- Treat `src/features` as the FSD Features layer and each `src/features/<feature>` directory as a Feature slice.
- Feature code may coordinate user interactions, UI state, and feature-specific workflows across Entities.

## `model/`

- Do not implement or duplicate domain logic that should be owned by an Entity.
- Entity-owned domain logic includes rules, calculations, relationships, selections, and transformations that describe Entity behavior independently of a particular Feature or UI.
- If Feature code needs an Entity-owned domain decision, implement and expose that decision from the appropriate `entities` slice, then consume its result from the Feature.
- Feature-specific workflow and orchestration may remain in `features` when it coordinates Entity operations rather than defining Entity behavior.
- For list/view Features, define UI-facing interfaces and transform Entity data into those interfaces.
- Keep list/view transformations limited to presentation concerns such as selecting already-derived values, combining, renaming, or restructuring data for the UI.
- Do not reimplement Entity rules while building UI-facing models.
