#!/usr/bin/env bash
set -euo pipefail

cd /workspace/tango
mkdir -p /workspace/tango-cloud/bin /workspace/tango-cloud/downloads /workspace/tango-cloud/gnupg
chmod 700 /workspace/tango-cloud/gnupg

if [ ! -f /workspace/tango-cloud/activate.sh ]; then
  cat > /workspace/tango-cloud/activate.sh <<'ACTIVATE'
export MISE_DATA_DIR=/workspace/tango-cloud/mise-data
export MISE_CACHE_DIR=/workspace/tango-cloud/mise-cache
export MISE_CONFIG_DIR=/workspace/tango-cloud/mise-config
export MISE_STATE_DIR=/workspace/tango-cloud/mise-state
export GNUPGHOME=/workspace/tango-cloud/gnupg
export NPM_CONFIG_CACHE=/workspace/tango-cloud/npm-cache
export DOCKER_CONFIG=/workspace/tango-cloud/docker-config
export FIREBASE_CLI_DISABLE_UPDATE_CHECK=1
export STORYBOOK_DISABLE_TELEMETRY=1
export PLAYWRIGHT_BROWSERS_PATH=/workspace/tango-cloud/playwright
export FIREBASE_EMULATORS_PATH=/workspace/tango-cloud/firebase-emulators
export XDG_CONFIG_HOME=/workspace/tango-cloud/xdg-config
export XDG_CACHE_HOME=/workspace/tango-cloud/xdg-cache
export UV_CACHE_DIR=/workspace/tango-cloud/uv-cache
export UV_PYTHON_INSTALL_DIR=/workspace/tango-cloud/python
export UV_PYTHON_BIN_DIR=/workspace/tango-cloud/bin
export PYTHONDONTWRITEBYTECODE=1
export PATH=/workspace/tango-cloud/bin:/workspace/tango-cloud/mise-data/installs/npm/12.0.1/package/bin:/workspace/tango-cloud/mise-data/installs/node/24.15.0/bin:$PATH
ACTIVATE
fi
source /workspace/tango-cloud/activate.sh

if [ ! -x /workspace/tango-cloud/bin/mise ]; then
  curl -fsSL https://github.com/jdx/mise/releases/download/v2026.10.1/mise-v2026.10.1-linux-x64.tar.xz -o /workspace/tango-cloud/downloads/mise-latest.tar.xz
  curl -fsSL https://github.com/jdx/mise/releases/download/v2026.10.1/SHASUMS256.txt -o /workspace/tango-cloud/downloads/mise-latest-sha256.txt
  python - <<'VERIFY'
import hashlib
from pathlib import Path
root = Path('/workspace/tango-cloud/downloads')
expected = next(line.split()[0] for line in (root / 'mise-latest-sha256.txt').read_text().splitlines()
                if line.split()[-1].removeprefix('./') == 'mise-v2026.10.1-linux-x64.tar.xz')
actual = hashlib.sha256((root / 'mise-latest.tar.xz').read_bytes()).hexdigest()
if actual != expected:
    raise RuntimeError('Mise archive checksum mismatch')
VERIFY
  tar -xJf /workspace/tango-cloud/downloads/mise-latest.tar.xz -C /workspace/tango-cloud/downloads
  install -m 755 /workspace/tango-cloud/downloads/mise/bin/mise /workspace/tango-cloud/bin/mise
fi
mise trust /workspace/tango/mise.toml
MISE_DISABLE_TOOLS=gcloud mise install node@24.15.0 npm@12.0.1 hadolint@2.15.0
test "$(node --version)" = v24.15.0
test "$(npm --version)" = 12.0.1
npm ci
if [ ! -f .env ]; then cp .env.example .env; fi

# Docker build networking is unavailable here; run the unchanged sample generator
# with the required Python minor and hash-verified locked packages on the host.
uv python install 3.13.15
if [ ! -x /workspace/tango-cloud/sample-venv/bin/python ]; then
  uv venv --python 3.13.15 /workspace/tango-cloud/sample-venv
fi
python - <<'REQUIREMENTS'
import json
from pathlib import Path
lock = json.loads(Path('/workspace/tango/sample/Pipfile.lock').read_text())
lines = []
for name, package in lock['develop'].items():
    line = name + package['version']
    if package.get('markers'):
        line += ' ; ' + package['markers']
    line += ' ' + ' '.join('--hash=' + value for value in package['hashes'])
    lines.append(line)
Path('/workspace/tango-cloud/sample-requirements.txt').write_text('\n'.join(lines) + '\n')
REQUIREMENTS
uv pip sync --require-hashes --python /workspace/tango-cloud/sample-venv/bin/python /workspace/tango-cloud/sample-requirements.txt
cd /workspace/tango/sample
/workspace/tango-cloud/sample-venv/bin/python generate.py ./test -o build/output.json

if [ ! -f /workspace/tango-cloud/firebase.cloud.json ]; then
  cat > /workspace/tango-cloud/firebase.cloud.json <<'FIREBASE'
{
  "firestore": {
    "rules": "/workspace/tango/firestore.rules",
    "indexes": "/workspace/tango/firebase.indexes.json"
  },
  "emulators": {
    "firestore": { "host": "127.0.0.1", "port": 8080 },
    "auth": { "host": "127.0.0.1", "port": 9099 },
    "ui": { "enabled": false },
    "singleProjectMode": false
  }
}
FIREBASE
fi
if [ ! -f /workspace/tango-cloud/smoke.mjs ]; then
  cat > /workspace/tango-cloud/smoke.mjs <<'SMOKE'
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
const require = createRequire('/workspace/tango/package.json');
const { chromium, expect } = require('@playwright/test');
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const name = `Cloud setup ${Date.now()}`;
  await page.goto('http://127.0.0.1:5173', { timeout: 120_000 });
  await expect(page.getByRole('heading', { level: 1, name: 'Decks', exact: true })).toBeVisible({ timeout: 120_000 });
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await page.getByRole('menuitem', { name: 'Create deck' }).click();
  await page.getByRole('textbox', { name: 'Name', exact: true }).fill(name);
  await page.getByRole('combobox').selectOption('typescript');
  await page.getByRole('button', { name: 'Create deck' }).click();
  await expect(page).toHaveURL(/\/deck\/(?!new$)[^/]+$/);
  await expect(page.getByText('0 cards', { exact: true })).toBeVisible();
  await page.goto('http://127.0.0.1:5173');
  await page.reload();
  await expect(page.getByRole('button', { name: `Open cards in ${name}`, exact: true })).toBeVisible();
  assert.deepEqual(errors, []);
  const response = await fetch('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=dummy-api-key-for-local-development', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ returnSecureToken: true }),
  });
  assert.equal(response.status, 200);
  const account = await response.json();
  assert.equal(typeof account.localId, 'string');
  console.log('PASS: deck creation and persistence after reload; no browser page errors; Auth emulator signup.');
} finally {
  await browser.close();
}
SMOKE
fi
cd /workspace/tango
npx playwright install chromium
cd /workspace/tango-cloud
/workspace/tango/node_modules/.bin/firebase setup:emulators:firestore

# Services are started separately by start_skill; live processes are not retained.
cd /workspace/tango
node --version
npm --version
git status --short
