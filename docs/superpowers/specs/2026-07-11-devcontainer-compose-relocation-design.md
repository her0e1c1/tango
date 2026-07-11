# Devcontainer Compose Relocation Design

## Goal

Move the shared development and E2E Compose definitions under `.devcontainer/` and make the devcontainer use the shared `dev` service. Remove the separate, stale devcontainer Compose stack.

## File Layout

- `.devcontainer/compose.yaml` contains the existing `db`, `dev`, `app`, and `browser` services.
- `.devcontainer/compose.e2e.yaml` remains a small E2E override for the `app` service.
- `.devcontainer/devcontainer.json` uses `compose.yaml` and selects the `dev` service.
- `.devcontainer/docker-compose.yml` is removed.

## Path Handling

Compose resolves relative paths from the directory containing the first Compose file. After relocation, repository resources must use `..`:

- build context: `..`
- workspace bind mount: `..:/workspace`
- Firestore rules: `../firestore.rules:/firestore.rules`
- E2E env file: `../.env.e2e`

The named `node_modules` volume remains unchanged.

## Command Integration

The root Makefile defines the base Compose command as `docker compose -f .devcontainer/compose.yaml`. The E2E command adds `.devcontainer/compose.e2e.yaml`. Existing targets and service names remain stable.

GitHub Actions invokes the relocated Compose file explicitly when building the `dev` service and includes both relocated Compose files in its changed-file detection. Documentation and command examples use the new paths.

## Devcontainer Behavior

The devcontainer starts the shared `dev` service and overrides its normal interactive behavior with `sleep infinity` through `devcontainer.json`. It forwards the Vite development port, `5173`. The shared service supplies the correct Firestore connection values (`db` and the configured port) and builds from the local Dockerfile.

## Verification

1. Validate the base and E2E merged configurations with `docker compose config`.
2. Confirm resolved build contexts, mounts, env file paths, and service names in rendered config.
3. Dry-run the Make targets to verify every command selects the relocated files.
4. Run the repository's build, lint, unit, Firestore, sample, and E2E checks where the Docker environment permits.
