# Features Instructions

## `model/`

- Do not implement or duplicate domain logic owned by an Entity. Entity-owned logic is logic that remains valid independently of a specific Feature or UI.
- If needed, expose Entity-owned logic from `entities` and consume it here.
- Feature-specific workflows may coordinate multiple Entities.
- For list/view Features, define UI-facing interfaces and map Entity data to them without reimplementing Entity rules.
- For edit Features, define UI-facing form interfaces and map Entity data and constraints to form state/input without reimplementing Entity rules.

## `ui/`

- Keep Feature UI presentational: accept prepared data and state through props, and report user intent through callbacks.
- Do not read Entity or Feature stores, invoke Entity or Feature state/workflow hooks, call mutations or APIs, or own routing/navigation directly from `ui/`.
- Keep reusable Feature state, workflows, and orchestration in `model/`. Route-level Pages may connect lower-layer state/actions to Feature UI.
- UI-only local state is allowed when it represents transient presentation behavior such as open/closed, focus, selection display, or animation state and does not encode domain or workflow state.
- React and library hooks that only support presentation behavior are allowed.
