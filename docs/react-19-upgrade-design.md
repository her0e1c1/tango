# React 19 Upgrade Design

## Goal

Upgrade React, React DOM, and their TypeScript definitions to React 19 while keeping the React Compiler disabled and preserving the current client-rendered architecture and runtime behavior.

## Scope

- Upgrade `react` and `react-dom` to the same latest stable React 19 minor available at implementation time.
- Upgrade `@types/react` and `@types/react-dom` to compatible React 19 releases.
- Review the official React 19 migration recipe and TypeScript codemod output, adopting only changes required by this repository.
- Resolve React 19 type errors and deprecations without broad refactors or lint suppressions.
- Document that future workspaces, including the work tracked by Issue #211, must use the same React major.

React Compiler configuration, React 19 feature adoption, Server Components, SSR, and the Expo implementation from Issue #211 remain out of scope.

## Implementation

The four React packages will be updated together so the application and development dependency graph cannot resolve mixed React majors. The lockfile will be regenerated with the repository's pinned npm version.

TypeScript and the official codemod diagnostics will define the application changes. No-argument refs such as retry or navigation guards will receive an explicit `undefined` initial value, preserving their existing three-state semantics. Callback refs, the global `JSX` namespace, and deprecated React types will be changed only where React 19 diagnostics require it. Existing modern JSX transformation, `createRoot`, and `StrictMode` setup will remain unchanged.

Shared form components already accept `React.Ref<T>` and pass it directly to the corresponding element. Their runtime API will remain stable. If React 19 exposes callback-ref incompatibilities at React Hook Form call sites, focused form or hook tests will cover registration, focus, and cleanup behavior before the minimal type-safe fix is applied.

## Runtime Behavior and Error Handling

The upgrade must not introduce duplicate auth initialization, dark-mode changes, form registration, study navigation, or browser-history guards under `StrictMode`. Existing application error handling remains authoritative; no React 19 error callback or monitoring feature will be added unless a regression demonstrates that the current contract is broken.

Existing Playwright handling of browser console warnings and errors must continue to fail E2E tests. Both the Vite application build and Storybook static build must resolve React 19 without warnings or invalid peer dependencies.

## Testing and Verification

Changes will follow test-driven development for behavior-affecting fixes:

1. Add or adjust one focused test that exposes the React 19 regression.
2. Verify that it fails for the expected reason.
3. Apply the smallest production change.
4. Verify the focused test and the related suite pass.

Dependency-only and type-only changes will be validated by diagnostics rather than artificial runtime tests. Final verification will include:

- `npm ls react react-dom @types/react @types/react-dom`
- TypeScript, React Hooks diagnostics, and Biome through `make check`
- Vite and Storybook builds
- unit, Firestore, sample, and Playwright E2E suites through `make ci`

The dependency tree must contain no React 18 duplicate, invalid peer dependency, or unintended multiple React major. The resulting pull request will be opened as a draft and will link Issue #266.

## Rollback

All React 19 dependency, type compatibility, test, and documentation changes will stay in one branch and pull request. React Compiler configuration will not be changed, so reverting this pull request independently restores the prior React 18 state.
