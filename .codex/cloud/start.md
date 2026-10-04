# Codex cloud startup

Use the existing `/workspace/tango` checkout. Each cloud task is isolated already;
do not create a Git worktree unless the user explicitly requests one. Leave
tracked source, tests, dependency declarations, and lockfiles unchanged during
setup. Installation artifacts and caches are retained, but live processes must
be started again in each new machine.

Activate the prepared tools in every shell:

```bash
source /workspace/tango-cloud/activate.sh
cd /workspace/tango
node --version # v24.15.0
npm --version  # 12.0.1
```

The sample dataset is at `sample/build/output.json`. If sample inputs changed,
refresh it with the locked Python environment:

```bash
cd /workspace/tango/sample
/workspace/tango-cloud/sample-venv/bin/python generate.py ./test -o build/output.json
```

Inspect existing listeners before startup. Reuse services only after the checks
below establish that they are the expected local emulators and Tango app. Do not
stop processes started by someone else. Start these commands in separate managed
terminal sessions; log files are optional and do not establish readiness.

Firestore and Auth emulators:

```bash
source /workspace/tango-cloud/activate.sh
cd /workspace/tango-cloud
JAVA_TOOL_OPTIONS='-Xmx2g -XX:ActiveProcessorCount=4' \
  /workspace/tango/node_modules/.bin/firebase emulators:start \
  --only firestore,auth --project demo-tango \
  --config /workspace/tango-cloud/firebase.cloud.json
```

Local application:

```bash
source /workspace/tango-cloud/activate.sh
cd /workspace/tango
npm start -- --mode dev --host 127.0.0.1 --port 5173 --strictPort
```

Wait for the emulators and Vite to finish startup. Verify the emulator hub reports
Firestore on 8080 and Auth on 9099, then verify browser behavior and Auth signup:

```bash
curl --noproxy '*' -fsS http://127.0.0.1:4400/emulators
source /workspace/tango-cloud/activate.sh
cd /workspace/tango
node /workspace/tango-cloud/smoke.mjs
```

The smoke check must print PASS: it creates an isolated local Deck, verifies it
survives page reload, checks for browser page errors, and creates an anonymous
account in the local Auth emulator. It does not contact a production project.
It allows up to 120 seconds for the initial application boot, matching the
repository's E2E warmup limit while Vite transforms modules after a cold start.
Use local requests for validation; do not create user-facing localhost preview
links. `.env.dev` provides the repository's non-secret local development values;
no production Firebase credentials are required.

Development checks from `/workspace/tango`:

```bash
source /workspace/tango-cloud/activate.sh
npm run build -- --mode dev
npm run lint
npm run fmt
MISE_DISABLE_TOOLS=gcloud mise run lint-docker
npm run test:unit -- --no-file-parallelism --mode dev
npm run test:integration -- test/integration/firestore/deck.spec.ts --mode dev
```

The representative Firestore suite currently has five passing tests and one TODO.
Keep the TODO distinct from a pass. Unit tests run serially to avoid the timeout
flakes documented in `mise.toml`. Use `--mode dev` for the tested local configuration.
Capture runner exit status as well as test counts.

Sample checks from `/workspace/tango/sample`:

```bash
source /workspace/tango-cloud/activate.sh
cd /workspace/tango/sample
/workspace/tango-cloud/sample-venv/bin/python -m pytest -p no:cacheprovider
/workspace/tango-cloud/sample-venv/bin/ruff format --check
```

The native sample generator and Firebase CLI replace the Compose startup path in
this cloud workflow because Docker build networking could not resolve PyPI.
Run the Compose E2E suite, coverage, mutation testing, and Storybook tests
separately when needed. The Compose workflow requires working Docker build
networking. Hadolint installation also requires access to `tuf-repo-cdn.sigstore.dev`
for attestation verification.
