#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

if ! command -v docker >/dev/null || ! docker compose version >/dev/null 2>&1; then
  echo "E2E UI requires Docker with Compose v2 (including up --wait). Install and start Docker, then rerun mise e2e:ui." >&2
  exit 1
fi
if ! docker info >/dev/null 2>&1; then
  echo "Cannot access Docker. Start Docker and check your Docker context/access, then rerun mise e2e:ui." >&2
  exit 1
fi

export E2E_UI_PORT="${E2E_UI_PORT:-8077}"
if [[ ! "$E2E_UI_PORT" =~ ^[1-9][0-9]{0,4}$ ]] || (( E2E_UI_PORT > 65535 )); then
  echo "E2E_UI_PORT must be a port number between 1 and 65535." >&2
  exit 1
fi

# Ignore caller/project overrides that could reuse another stack or a development database port.
export COMPOSE_FILE=".devcontainer/compose.yaml:.devcontainer/compose.e2e.yaml:.devcontainer/compose.e2e-ui.yaml"
export COMPOSE_ENV_FILES=".env.e2e"
export VITE_DB_PORT=8080
export COMPOSE_PROJECT_NAME="tango-e2e-ui-$(date +%s)-$$-$RANDOM"
export BRANCH="$COMPOSE_PROJECT_NAME"
child=""

# Keep the UI profile active for inspection and cleanup as well as explicit startup.
compose=(docker compose --profile ui --env-file .env.e2e)

cleanup() {
  local status=$?
  trap - EXIT INT TERM
  if [[ -n "$child" ]]; then
    kill "$child" 2>/dev/null || true
    wait "$child" 2>/dev/null || true
  fi
  if (( status != 0 )); then
    "${compose[@]}" logs --no-color --tail 80 >"test-results/$COMPOSE_PROJECT_NAME/startup.log" 2>&1 || true
    echo "E2E UI stopped (exit $status). See test-results/$COMPOSE_PROJECT_NAME/startup.log." >&2
    echo "If port $E2E_UI_PORT is occupied, use E2E_UI_PORT=8078 mise e2e:ui; existing services are left running." >&2
  fi
  "${compose[@]}" down --volumes --remove-orphans || status=1
  docker compose -p "$COMPOSE_PROJECT_NAME" -f sample/docker-compose.yml down --volumes --remove-orphans || status=1
  exit "$status"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

run() {
  "$@" &
  child=$!
  wait "$child"
  child=""
}

mkdir -p "test-results/$COMPOSE_PROJECT_NAME"
"${compose[@]}" config --quiet
echo "Preparing E2E UI stack: $COMPOSE_PROJECT_NAME"
# Reuse the existing generator and Docker image dependency installation; no host npm setup is required.
test -f .env || cp .env.example .env
run mise run //sample:build
run "${compose[@]}" build app
run "${compose[@]}" up --wait --wait-timeout 300 db auth app browser ui
echo "Playwright UI is ready: http://127.0.0.1:$E2E_UI_PORT/"
echo "Select a test and click Run in the UI. Press Ctrl-C here to stop this stack."
echo "Artifacts: test-results/$COMPOSE_PROJECT_NAME/ (container images remain cached)."
run "${compose[@]}" wait ui
exit "$(docker inspect --format '{{.State.ExitCode}}' "$("${compose[@]}" ps --all --quiet ui)")"
