<h1>
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="./public/tango-logo-dark.svg">
    <img src="./public/tango-logo.svg" alt="Tango" width="216" height="64">
  </picture>
</h1>

## Demo

You can access to the page for **demo** here: https://tango-ts.web.app

Demo data is stored in Firestore and may be **deleted** without notice.

## Storybook

Browse the latest Storybook at https://her0e1c1.github.io/tango/. Updates are published automatically from `main`.

Run Storybook locally with:

```bash
mise run storybook
```

The `Page` stories render every application route with deterministic authentication, remote collections, configuration,
and study progress. They do not require a Firebase project or emulator.

## Development

### Setup for development

```bash
mise install
mise run init
```

This installs the pinned Node.js and npm versions, creates `.env` from `.env.example` if it does not already exist,
and installs npm packages.

### Start Server

```bash
mise run dev
```

You can go to web UI and see data in firestore: http://localhost:4000/

## Test

The test task runs the application unit tests and sample Python tests:

```bash
mise run test
# You can also pass a specified file
mise run test-unit -- ./src/entities/card/model/card.spec.ts
```

Run a specific suite with the commands below. The integration task starts the Firestore emulator automatically:

```bash
mise run test-unit
mise run test-integration
mise run test-sample
```

Firestore persistence, subscription, and security-rule contracts and case IDs are documented in the
[Firestore integration test specifications](./docs/integration/firestore/README.md).

### Vitest Coverage

Run the TypeScript and React unit specs in one Vitest invocation:

```bash
mise run coverage
```

Coverage includes `src/**/*.{ts,tsx}`, including files that no test imports. Specs, stories, and declaration files
are excluded. The committed global thresholds are 86% statements, 78% branches,
85% functions, and 92% lines. When the full-suite result improves, raise the relevant integer threshold manually
in `vitest.config.ts`; do not auto-update thresholds.

The terminal summary, HTML report, LCOV data, and JSON summary are written to `coverage/`. Open
`coverage/index.html` for details after a failure. These percentages cover Vitest only: sample Python tests use
pytest, and browser behavior is tested separately with Playwright.

### E2E Test

Playwright runs the browser-level acceptance suite documented in `docs/e2e/`. `mise run e2e` starts isolated
Firestore and Firebase Auth emulators, a healthy Vite dev server from the project image, and the official Playwright
Docker image as a remote browser server before running the complete suite. The tests use emulator-backed remote data,
local-only browser data, offline cache behavior, and the Auth emulator's local identity-provider flow; they do not
connect to a real Firebase project or external identity provider.

```bash
mise run e2e
```

`npm run e2e:ui` only opens Playwright's UI and does not start the required app and emulators. Use the
compose-backed `mise run e2e` task for the acceptance suite. Failed local runs retain screenshots under
`test-results/`; CI also writes an HTML report and captures a trace on the first retry.

Each test and retry uses isolated identifiers and storage, so the suite can run fully in parallel locally. CI runs the
same acceptance suite with its configured worker and retry limits.

### Card FSRS cutover (#1725)

`Card.fsrs` is the sole scheduling state. New and copied Cards start at `null`; content edits and update imports
preserve it. Ratings partially update only `fsrs` and `updatedAt` in the same batch as Answer and Session.
`createdAt` remains Card creation time; `updatedAt` is the last document update, including ratings.
The last rating time remains `fsrs.lastReviewedAt`. Content comparison in imports uses editable fields, and
Card ordering uses creation time or FSRS deadlines, so a rating is not treated as a content edit.

**Anyone allowed to read a public Card can also read its FSRS, including review timestamps and difficulty.**
UI visibility is not access control. Private Cards remain private; FSRS writes require the Card and Deck owner.
Rules validate the outer Card shape and nullable FSRS map; the application validates all FSRS fields and ranges.
Malformed or missing FSRS fails parsing instead of becoming an unrated Card. Card/Deck tombstones hide the Card
and its embedded state together; physically removing a Card cannot leave a separate state document.

This replaces the #1702 reset procedure. Do not reset valid state, replay answers, discard unsynchronized writes,
or run this migration at application startup. This PR does not authorize or execute production migration,
source deletion, or Rules deployment.

1. Announce maintenance and the public-FSRS reading contract. Inventory all linked and anonymous clients,
   including offline devices. Keep the old release available for recovery. Before blocking writes, bring linked
   clients online and wait for all SDK pending writes to be acknowledged. Export and retain any unsynchronized
   data that cannot be acknowledged. Stop if any device has unresolved data; elapsed time is not proof of sync.
2. Anonymous clients have local-only data and must not be reset or signed out. Preserve their UID and complete
   browser profile/IndexedDB backup. In an isolated copy, use a one-time maintenance client on the old SDK/cache
   with networking disabled: read the cached Card/State/Deck collections, perform the same schema, ID and owner
   checks below, and update only Card.fsrs/updatedAt in a local batch. Wait for local snapshots (not server ACKs),
   verify all values/counts and preserve pending writes and identity. Remove obsolete local State documents only
   after verification. This server tool cannot migrate anonymous caches. A client with an incomplete cache must
   remain blocked until its missing data is recovered; never interpret a failed cache read as absent State.
3. Stop old clients, background tabs and service workers. Block client writes with temporary maintenance Rules
   and restrict application access. Take a managed Firestore export as an independent rollback backup.
   Do not reopen old clients after migration; their full Card writes can erase FSRS. Obtain a short-lived operator
   token with `gcloud auth print-access-token` and place it in `FIRESTORE_MIGRATION_TOKEN` without logging it.
4. Run the one-time tool with Node 24, from this checkout, using the explicit production project and a new private
   backup path outside the repository. These commands are operator actions, not part of deployment automation:

   ```bash
   node scripts/migrate-card-fsrs.mjs backup PROJECT /secure/path/card-fsrs.json
   node scripts/migrate-card-fsrs.mjs check PROJECT /secure/path/card-fsrs.json
   node scripts/migrate-card-fsrs.mjs apply PROJECT /secure/path/card-fsrs.json
   node scripts/migrate-card-fsrs.mjs verify PROJECT /secure/path/card-fsrs.json
   ```

   The tool validates every legacy State schema and deterministic ID, Card/Deck/UID correspondence, timestamps,
   and existing target FSRS before any writes. Orphans, mismatches and invalid data are reported as errors;
   resolve them explicitly without deleting or overwriting the unresolved source. Missing State or explicit null
   maps to null. Card content and createdAt are untouched; updatedAt is the maximum of existing Card/State times.
   Writes use update-time preconditions and cannot recreate Cards. Retry partial runs with the same backup:
   existing migrated values and valid newer ratings are preserved, conflicting target values stop the run.
5. Under maintenance, compare the backup's Card/State counts and mapping with the verify report (zero pending,
   zero errors). Compare each embedded FSRS to its source, and confirm unchanged content and createdAt.
   Retain the backup and report. Only after every server and local-only client is accounted for, remove the exact
   backed-up State documents with this separate, explicitly destructive operator command:

   ```bash
   node scripts/migrate-card-fsrs.mjs cleanup PROJECT /secure/path/card-fsrs.json
   ```

   Cleanup revalidates every target against the backup, refuses changed/additional sources before deleting,
   and reads each target in a read-write transaction before deleting its source with an update-time precondition.
   It verifies that the old collection is empty. A partial cleanup can be retried with the same backup; already
   deleted sources are tolerated, but every backed-up mapping is still validated. Keep old writers stopped.
6. Deploy the new Card Rules (which deny the old collection) and matching app while maintenance remains active.
   For linked clients with confirmed zero pending writes, clear the old Firestore cache once so a stale content-only
   snapshot cannot fail the new parser; preserve Auth and Preferences. For anonymous or still-pending clients,
   use the verified migrated cache from step 2, never a blanket cache clear. Replace the service worker and close
   old tabs before reopening. Confirm Card snapshots, ratings, skips, content edits, imports and public reads.
   Normal startup must never clear the cache. If rollback is needed, keep maintenance active and restore a
   consistent backup plus matching app/Rules; do not restore old writers over newer learning results.
