COMPOSE = docker compose
RUN = $(COMPOSE) run --rm --remove-orphans
LOG = $(COMPOSE) logs
SERVICE = base
.DEFAULT_GOAL := sh

.PHONY: run
run:
	$(RUN) $(OPT) $(SERVICE) $(ARG)

.PHONY: sh
sh: run

.PHONY: npx
npx: OPT=--entrypoint npx
npx: run

.PHONY: test
test:
	@$(MAKE) npx ARG="vitest run --exclude '**/firestore/**/*.spec.ts'"
	@$(MAKE) npx ARG="vitest run src/action/firestore" SERVICE=test
	@$(MAKE) -C sample test

.PHONY: e2e
e2e:
	$(COMPOSE) up --wait --wait-timeout 120 --remove-orphans browser app
	$(COMPOSE) run --rm --remove-orphans --use-aliases --env-from-file .env.e2e base -lc "npm run e2e"

.PHONY: fmt
fmt:
	@$(MAKE) npx ARG="prettier './src/**/*.{ts,tsx,js,jsx}' --write"
	@$(MAKE) npx ARG="eslint . --ext ts,tsx --report-unused-disable-directives --fix"
	@$(MAKE) -C sample fmt

.PHONY: lint
lint:
	@$(MAKE) npx ARG="tsc"
	@$(MAKE) npx ARG="eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0"

.PHONY: build
build:
	@$(MAKE) -C sample build
	@$(MAKE) npx ARG="vite build"
	@$(MAKE) npx ARG="storybook build"

.PHONY: image
image:
	$(COMPOSE) build base

.PHONY: log
log:
	$(LOG) -f db

.PHONY: start
start:
	npx firebase emulators:start & \
	npx storybook dev & \
	npx vite dev --open & \
	wait
