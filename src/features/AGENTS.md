# Features Instructions

## Slice scope

- Follow FSD v2.1 page-first: create or retain a Feature only when the same user interaction or workflow is reused or composed by multiple Pages.
- Keep a workflow in its owning Page when that Page is its only consumer, even when the workflow is an independently meaningful user action.
- Resolve `fsd/insignificant-slice` structurally by merging single-consumer Feature slices into their owning Page rather than disabling the rule.
- Promote Page code to a Feature when actual cross-Page reuse appears.
- Do not create or retain a Feature merely as a home for Page-specific presentation, a props-driven Storybook target, or a single Page's connection boundary.

## `model/`

- Do not implement or duplicate reusable domain logic owned by an Entity.
- If needed by multiple consumers, expose Entity-owned logic from `entities` and consume it here.
- A reusable Feature workflow may coordinate multiple Entities.
- For list/view Features, define UI-facing interfaces and map Entity data to them without reimplementing Entity rules.
- For edit Features, define UI-facing form interfaces and map Entity data and constraints to form state/input without reimplementing Entity rules.

## `ui/`

- Keep Feature UI presentational: accept prepared data and state through props, and report user intent through callbacks.
- Do not read Entity or Feature stores, invoke Entity or Feature state/workflow hooks, call mutations or APIs, or own routing/navigation directly from `ui/`.
- Keep reusable Feature state, workflows, and orchestration in `model/`. Route-level Pages may connect lower-layer state/actions to Feature UI.
- UI-only local state is allowed when it represents transient presentation behavior such as open/closed, focus, selection display, or animation state and does not encode domain or workflow state.
- React and library hooks that only support presentation behavior are allowed.
