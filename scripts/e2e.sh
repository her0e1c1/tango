set -euo pipefail

npm run build

npx vite preview --host 0.0.0.0 --port 4173 &
preview_pid=$!
trap 'kill "$preview_pid" 2>/dev/null || true' EXIT

node ./scripts/wait-http.js "${PLAYWRIGHT_BASE_URL:-http://base:4173}"

npm run e2e
