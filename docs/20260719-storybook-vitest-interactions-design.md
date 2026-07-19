# Storybook Vitest and Interaction Tests Design

## Context

Tango has 52 Storybook files and 279 stories, but Storybook currently verifies only that the catalog builds. No story runs in a real browser during pull request validation, no story has a `play` function, and callbacks used by representative stories are not observable.

Issue #339 introduces Storybook's Vitest integration so every story becomes a Chromium smoke test and representative user interactions become executable assertions.

## Goals

- Run every story as a real-browser smoke test with Vitest and Playwright Chromium.
- Make Storybook tests available from both the Storybook testing widget and an npm script.
- Cover representative form, retry, overlay, tag, switch, and slider interactions with `play` functions.
- Report actionable failures in local Storybook, terminal output, and pull request CI.
- Preserve the existing jsdom unit-test behavior and coverage thresholds.

## Non-goals

- Replacing every no-op callback in the story catalog.
- Changing application or component behavior.
- Adding accessibility or visual regression testing, which belong to follow-up issues under #336.
- Expanding end-to-end application scenarios.

## Approach

Use `@storybook/addon-vitest` with a named Storybook project in the existing Vitest configuration. Keep a separate named unit project that inherits the current jsdom and coverage settings. This follows Vitest 4's project model while keeping Storybook's testing widget connected to the same root configuration.

Two alternatives were rejected:

- A separate Storybook-only Vitest config would isolate changes, but it would duplicate Vite configuration and make Storybook UI discovery less direct.
- Converting every no-op callback to `fn()` would improve observability broadly, but it would create unrelated churn. Only callbacks asserted by the new interactions need spies.

## Test Infrastructure

Add version-aligned `@storybook/addon-vitest` and `@vitest/browser-playwright` development dependencies. Register the addon in `.storybook/main.ts`; Storybook 10.4 automatically applies project preview annotations to Vitest browser tests.

The Vitest root configuration will define two named projects:

- `unit`: inherits the existing React compiler, path aliases, jsdom environment, globals, and coverage configuration.
- `storybook`: inherits the shared Vite configuration, applies the Storybook test plugin, and runs headless Chromium through Playwright browser mode.

The Storybook project pre-optimizes `storybook/test` so the first interaction import cannot trigger a Vite reload during a browser test run.

The `test:storybook` npm script will run only the Storybook project in non-watch mode. Existing unit, Firestore, and coverage scripts will explicitly select the unit project so their scope remains unchanged.

## Representative Interactions

Existing stories will remain the source of test cases. The new `play` functions will use accessible queries with `userEvent` or `fireEvent`, and callback args involved in assertions will use Storybook's `fn()` utility.

- `DeckForm`: edit the name field and submit the form; assert the field callback and submit callback.
- `RemoteReadBoundary`: activate Retry from an error state; assert the retry callback.
- `CardListTemplate`: close an open card overlay; assert the close callback.
- `CardListTemplate`: remove a selected tag; assert that the tag disappears and the removal behavior completes.
- `TagFilter`: select and remove a tag; assert the checkbox state and selected-tag callback payloads.
- `Switch`: toggle the control; assert its checked state and change callback.
- `Slider`: change the control value; assert its visible value and change callback.

Each interaction awaits browser events and asserts the user-visible result or callback payload. Other stories still receive automatic render smoke coverage through the Storybook Vitest plugin.

## CI and Failure Reporting

Pull request CI will install Chromium with its system dependencies and run `npm run test:storybook`. Vitest's standard failure output will identify the story and failed assertion. Browser failure screenshots will be written under `test-results/storybook` and included in the existing Playwright artifact upload.

Locally, developers can run the npm script for terminal output or use Storybook's testing widget for per-story status and interaction debugging.

## Verification

The implementation is complete when:

- the Storybook test command executes all 283 stories in Chromium, including the four new interaction scenarios;
- the representative interaction stories pass and prove their intended results;
- unit-test and coverage commands still target only the unit project;
- pull request CI contains the Storybook browser test;
- `npm run test:storybook`, `npm run build:storybook`, and `make check` succeed.
