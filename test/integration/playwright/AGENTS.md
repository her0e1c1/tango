# Playwright Store Integration Instructions

- Use `docs/test/integration/playwright` as the application contract. Begin each test title with its case ID. Parameterized inputs may share an ID only when the specification documents their states and expected results.
- Group setup, actions, and assertions in named `test.step` blocks starting with `Given:`, `When:`, and `Then:`. Put precondition assertions in Given and preserve the order of repeated actions and assertions.
- Prepare fixed authentication, Deck, Card, preferences, session IDs, and times in the browser before rendering. Use the real application stores, Page, model, actions, rules, and composed UI. Do not replace the behavior being verified.
- Keep the Vite entry and external I/O substitutes in this test directory. Do not add production exports, parameters, callbacks, or test globals solely for test setup. A substitute's response or prepared state update does not prove Firestore persistence or subscription delivery.
- Run `npm run test:playwright` without starting Firebase emulators. Use the normal Playwright Chromium installation; `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` may select an existing Chromium binary in a cloud environment.
- Keep contexts isolated and await observable results. Do not add sleeps, force operations, timeout increases, or retries to conceal failures. Keep unexpected browser errors and attempted external network access visible to the test.
- Remove a specification's `[TODO]` only after its complete Given / When / Then and input variants are implemented and executed in this runner. A partial pilot or a legacy Storybook play does not implement a broader case.
- Retire legacy assertions only after the parity gate in `../storybook/RETIREMENT.md` is satisfied. Keep the existing E2E coverage until its replacement is proven as well.
