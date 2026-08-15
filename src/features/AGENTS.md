# Features Instructions

## `model/`

- Do not implement or duplicate domain logic owned by an Entity. Entity-owned logic is logic that remains valid independently of a specific Feature or UI.
- If needed, expose Entity-owned logic from `entities` and consume it here.
- Feature-specific workflows may coordinate multiple Entities.
- For list/view Features, define UI-facing interfaces and map Entity data to them without reimplementing Entity rules.
