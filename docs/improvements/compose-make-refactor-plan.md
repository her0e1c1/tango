# Docker Compose and Makefile Refactor Plan

## Goal

Refactor `docker-compose.yml`, `Makefile`, and `common.mk` without changing the public command interface used by local development and CI.

The following entry points must keep their current behavior:

- `make build`
- `make fmt`
- `make lint`
- `make test`
- `make e2e`
- `make image`
- `make log`
- `make start`
- `docker compose run test`
- `docker compose run test ./src/action/xxx.spec.ts`

## Current Context

CI runs `make build`, `make fmt`, `make lint`, `make test`, and `make e2e` from `.github/workflows/test.yml`. The deploy workflow also runs `make build`.

`Makefile` delegates Docker Compose helpers to `common.mk`, but some compose options are still embedded in individual targets. In particular, the E2E target mixes service startup, wait behavior, environment file selection, aliases, and test execution in one command sequence.

`docker-compose.yml` already uses a shared `base` service anchor. The derived `test` and `app` services work, but their intent can be made easier to scan by grouping inherited settings, overrides, dependency behavior, and health checks consistently.

## Proposed Changes

1. Clarify shared Make variables in `common.mk`.

   Keep the existing `COMPOSE`, `RUN`, `LOG`, `SERVICE`, `OPT`, and `ARG` behavior where compatibility requires it, but introduce clearer internal names for common compose operations. For example:

   - `COMPOSE_RUN`
   - `COMPOSE_UP`
   - `COMPOSE_LOGS`
   - `RUN_OPTS`

2. Keep the `make npx ARG="..."` compatibility path.

   Existing targets and ad hoc developer usage may depend on this pattern. The refactor should make it easier to understand internally, but should not remove or rename it.

3. Extract E2E-specific compose options.

   Move repeated or dense E2E options into named Make variables, such as:

   - service startup wait options
   - `.env.e2e` injection
   - network alias behavior
   - browser/app service list

   The `e2e` target should read as two steps: start required services, then run Playwright.

4. Reorder `docker-compose.yml` for scanability without behavior changes.

   Preserve service names, images, ports, health checks, environment variables, profiles, and commands. Group each service so inherited configuration and overrides are clear.

5. Avoid renames in this PR.

   Do not rename `docker-compose.yml` to `compose.yaml`, and do not rename Make targets or Compose services. Those changes would widen the compatibility surface and are not needed for the first refactor.

## Validation Plan

Before merging the implementation PR, run:

```bash
docker compose config
make -n build
make -n fmt
make -n lint
make -n test
make -n e2e
```

If Docker is available and time allows, also run at least one behavior check:

```bash
make test
```

or a narrower Firestore-backed test through Compose.

## Non-Goals

- No CI workflow changes unless required by a verified compatibility issue.
- No package or dependency updates.
- No service, target, or file renames.
- No changes to application source code.
