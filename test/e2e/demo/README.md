# W66: one manual Playwright demo

Start with [CARD-LIST-ACTIONS-02](../../../docs/test/e2e/card-list-actions.md#card-list-actions-02),
then use this demo to compare the real Card list with that specification. The existing
[automated case](../card-list-actions.spec.ts) remains the acceptance test. This demo is an opt-in human walkthrough,
excluded from the normal `*.spec.ts` suite.

## Start

Run from the repository root with the pinned Node/npm versions (`mise install`), Docker Compose and a graphical
desktop available to the process. A remote cloud session needs a visible desktop; an SSH shell alone cannot show
Chromium or Playwright Inspector. Keep ports 8080 and 4173 free.

```bash
npm ci
mise run //sample:build
npx playwright install chromium
VITE_DB_PORT=8080 docker compose --env-file .env.e2e -p tango-w66-demo \
  -f .devcontainer/compose.yaml -f .devcontainer/compose.local.yaml up --wait db
npm run e2e:demo
```

The command starts Vite on `http://127.0.0.1:4173`, loads the existing
[`card-list-sort` fixture](../../../docs/test/e2e/fixture/card-list-sort.yaml), opens its Card list in a fresh Chromium
context, and pauses in Inspector. Authentication responses use the existing E2E stub; data uses the local Firestore
emulator in project `tango-e2e`. No real Google sign-in is required. Use the Chromium window for the following
operations and Inspector's **Resume** button only at the two checkpoints below.

## Compare by hand

| Checkpoint | Human action and expected observation |
| --- | --- |
| Given: first pause | `E2E Deck` has **3 cards** in Standard order: **oldest question → newest question → tied question**. The fixture has creation times 1000, 3000, 3000; oldest was edited at 9000. |
| When: first pause | Focus **Sort order** (click or Tab), press **ArrowDown**, then **Tab** to choose **Newest added**. Compare **newest question → tied question → oldest question**: equal creation times keep their relative order, and the later edit does not move oldest first. |
| When: first pause | Click **oldest question**. Its preview must show **oldest answer**, despite the row having moved. Leave the preview open and click **Resume** in Inspector. |
| Then: second pause | Compare the visible answer again, close the preview in Chromium, and verify **Newest added**, the same row order and **3 cards** remain. Click **Resume** in Inspector to finish. |

Playwright only prepares the initial state and checks the state at those checkpoints. It does not perform the
sorting or preview clicks for you. After the second Resume it also compares saved Deck, Card, StudySession and
StudyAnswer data before/after. A green result supplies supporting checks; record what you actually observed by hand.

Example review note: `CARD-LIST-ACTIONS-02 / commit <sha> / Chromium <version>: keyboard sorting <pass/fail>,
tie order <pass/fail>, preview target <pass/fail>, count and retained sort <pass/fail>; observed difference: ...`.

This short walkthrough covers sorting, stable ties, preview identity, count and unchanged saved data. It does not
exercise the specification's concurrent row changes, menus/focus after deletion, filter/language changes, disabled
operations or creation of a new study session. It does not replace the complete acceptance case or manual review.

## Repeat, diagnose and stop

Run `npm run e2e:demo` again for a fresh browser context and the fixture's initial state. Do not reset by selecting
Standard inside a completed run. To abandon a paused run, press Ctrl+C in the terminal, then rerun the command.

For evidence, the run retains a Playwright trace under `test-results/`; open the emitted path with
`npx playwright show-trace <path-to-trace.zip>`. A checkpoint failure also retains a screenshot. These generated
files are Git-ignored. A trace records browser actions, not a person's visual judgment.

If the initial state does not appear, check the emulator command and port 8080. If Vite cannot start, stop the
process on port 4173. If Chromium/Inspector cannot open, check the graphical desktop and browser installation.
Keep `PW_TEST_CONNECT_WS_ENDPOINT` unset so the manually operated browser stays on that desktop.

The demo owns its Vite process and stops it when the run exits. Stop only the dedicated emulator project with:

```bash
VITE_DB_PORT=8080 docker compose --env-file .env.e2e -p tango-w66-demo \
  -f .devcontainer/compose.yaml -f .devcontainer/compose.local.yaml down --volumes
```
