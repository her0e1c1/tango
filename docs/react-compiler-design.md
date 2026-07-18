# React Compiler Integration Design

## Goal

Enable React Compiler 1.x for the production application, Vitest, and Storybook through one shared configuration while preserving React 19 runtime behavior and keeping the compiler removable as an independent rollback boundary.

## Scope

- Add `@rolldown/plugin-babel`, `@babel/core`, `@types/babel__core`, and `babel-plugin-react-compiler` as direct development dependencies.
- Create one factory that returns a fresh React Compiler Babel plugin instance for each Vite-based environment.
- Apply the shared compiler configuration exactly once in the application, Vitest, and Storybook pipelines.
- Verify configuration wiring, compiler output, application and Storybook builds, all tests, and E2E behavior.
- Document configuration, verification, exception, and rollback policy.

Removing existing manual memoization, enabling annotation mode or runtime gating, filtering source directories, and adopting unrelated React 19 features remain out of scope.

## Architecture

A root-level `reactCompiler.ts` module will export `createReactCompilerPlugin()`. Each call will create a new `@rolldown/plugin-babel` instance configured with `reactCompilerPreset()` from `@vitejs/plugin-react`. No target is passed, so React 19 uses its built-in `react/compiler-runtime`. No compilation mode, filter, suppression, panic threshold, or runtime gate is configured.

The application Vite configuration will keep its existing `react()` plugin and add one compiler plugin. Vitest will add one compiler plugin so imported application modules execute compiled code. Storybook already supplies its React Vite integration through `@storybook/react-vite`; its `viteFinal` hook will add one compiler plugin without registering a second React plugin.

This boundary centralizes compiler behavior without forcing the three environments to share unrelated Vite plugins. Calling the factory independently also avoids sharing mutable plugin state between builds or test processes.

## Verification

A focused root-level test will exercise the factory and exported configuration helpers. It will verify that each factory call returns a distinct compiler plugin, that the application and Vitest plugin lists contain exactly one compiler plugin, and that Storybook's `viteFinal` adds exactly one compiler plugin without duplicating it when composing its input configuration.

The production verification will build with source maps enabled for inspection, then confirm that compiled application output references React 19's compiler runtime and contains compiler-generated cache code. Source maps used only for verification will remain build artifacts and will not be committed.

Final automated verification includes dependency resolution, zero-warning React Compiler diagnostics, `make check`, Vite and Storybook builds, unit and Firestore tests, sample tests, and Playwright E2E through `make ci`. Build duration and emitted asset size will be recorded in the pull request. React DevTools confirmation of `Memo ✨` on representative deck-list and study components will remain an explicit manual pull-request checklist item.

## Error Handling and Exceptions

The compiler keeps its default production behavior so unsupported components can be skipped safely. CI safety continues to come from the existing zero-warning `eslint-plugin-react-hooks` diagnostic gate.

`"use no memo"`, annotation mode, directory filters, suppressions, custom panic thresholds, and runtime gating are prohibited unless a confirmed upstream or third-party blocker requires a minimal temporary exception. Every exception must document its reason and link a tracking issue.

## Rollback

Compiler dependencies, the shared factory, configuration wiring, focused verification, and documentation will stay in one pull request. Reverting that pull request removes only React Compiler integration and leaves React 19 and its diagnostic gate intact.
