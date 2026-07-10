set -euo pipefail

npx vite dev --host 0.0.0.0 --port 4173 &
vite_pid=$!
trap 'kill "$vite_pid" 2>/dev/null || true' EXIT

node ./scripts/wait-http.js "${PLAYWRIGHT_BASE_URL:-http://base:4173}"

npm run e2e
