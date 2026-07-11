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

<<<<<<< HEAD
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
=======
Because the first Compose file is now in `.devcontainer/`, Compose would otherwise use `devcontainer` as the default project name. The Makefile derives an explicit, sanitized project name from the repository or worktree directory so concurrent worktrees do not share containers, networks, or volumes. Dev Containers continues to manage its own Compose project identity.

## Command Integration

The root Makefile defines the base Compose command with an explicit worktree-specific project name and `-f .devcontainer/compose.yaml`. The E2E command adds `.devcontainer/compose.e2e.yaml`. Existing targets and service names remain stable.

GitHub Actions changes its build command to `docker compose -f .devcontainer/compose.yaml build dev`. Changed-file detection retains `Dockerfile`, `package.json`, and `package-lock.json` and adds both relocated Compose files.

README command examples and the Compose references in `docs/summary/configuration.md`, `docs/summary/runtime-and-deployment.md`, `docs/summary/testing.md`, `docs/summary/repository-overview.md`, and `docs/summary/cli-and-commands.md` use the new paths.

The Makefile's `--env-from-file .env.e2e` remains root-relative because it is a CLI argument resolved from Make's working directory. Only the Compose override's `env_file` changes to `../.env.e2e`.

## Devcontainer Behavior

The devcontainer sets `service` to `dev`, `runServices` to `db` and `dev`, and `overrideCommand` to `true`. Dev Containers can therefore inject its keepalive command while also starting Firestore. It forwards the Vite development port, `5173`. The shared service supplies the correct Firestore connection values (`db` and the configured port) and builds from the local Dockerfile.

## Verification

1. Validate the base and E2E merged configurations with `docker compose --profile dev config`.
2. Confirm resolved build contexts, mounts, env file paths, service names, and worktree-specific project identity in rendered config.
3. Dry-run `sh`, `test`, `e2e`, `fmt`, `lint`, `build`, `image`, `log`, and `start`, including the recursive sample Make recipes, to verify every command selects the relocated files.
4. Create the devcontainer and confirm it remains running, starts both `dev` and `db`, exposes `VITE_DB_HOST=db` and the expected port inside `dev`, and forwards port `5173`.
5. Confirm separate worktrees resolve to different Compose project identities.
6. Run the repository's build, lint, unit, Firestore, sample, and E2E checks where the Docker environment permits.
>>>>>>> b2bcb99 (Document devcontainer compose relocation)
