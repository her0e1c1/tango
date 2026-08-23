# Source Instructions

## Page-first Architecture

- Keep screen-specific presentation, state connections, and composition in the corresponding `pages` slice.
- Keep a `features` slice only when it represents an independently meaningful user action or workflow. Do not create Features merely to host presentational components.
- Keep reusable domain state and rules in `entities`, and preserve FSD dependency direction and slice public APIs when Pages consume lower layers.

## Storybook

- Every presentational component in Feature UI, every Page UI component except `*Page` and `*Container`, and every reusable Shared UI component must have a co-located, same-basename `*.stories.tsx` file.
- When one module exports multiple components, cover every exported component in that module's co-located story file.
- Cover private rendering helpers through their owner component's stories; do not export or promote a helper solely to give it standalone Storybook coverage.
- Reproduce visual and interaction states through props, including empty, loading, error, dialog, feedback, responsive, and theme states when the component owns them.
- Do not require ordinary component stories for `*Page` or `*Container`, and do not add a `*View` or wrapper only to make Storybook setup easier.
- Put stories that require routes, providers, or stores under App or route-level integration/smoke stories and name them clearly as integration coverage.

## Store Compatibility

- The product is under active development. Do not preserve backward compatibility for store state unless explicitly requested.
- Breaking changes to store state shape and behavior are allowed. Prefer the simplest current design over compatibility layers.
- In particular, do not add migrations or retain legacy state formats for Zustand `persist`. Invalidate or discard incompatible persisted state instead.
