COMPOSE = docker compose
RUN = $(COMPOSE) run --rm --remove-orphans
LOG = $(COMPOSE) logs
SERVICE = base
.DEFAULT_GOAL := sh

.PHONY: all test build start e2e fmt lint image log run sh npx

run:
	$(RUN) $(OPT) $(SERVICE) $(ARG)

sh: run

npx: OPT=--entrypoint npx
npx: run

test:
	@$(MAKE) npx ARG="vitest run --exclude '**/firestore/**/*.spec.ts'"
	@$(MAKE) npx ARG="vitest run src/action/firestore" SERVICE=test
	@$(MAKE) -C sample test

e2e:
	$(COMPOSE) up --wait --wait-timeout 120 --remove-orphans browser app
	$(COMPOSE) run --rm --remove-orphans --use-aliases --env-from-file .env.e2e base -lc "npm run e2e"

fmt:
	@$(MAKE) npx ARG="prettier './src/**/*.{ts,tsx,js,jsx}' --write"
	@$(MAKE) npx ARG="eslint . --ext ts,tsx --report-unused-disable-directives --fix"
	@$(MAKE) -C sample fmt

lint:
	@$(MAKE) npx ARG="tsc"
	@$(MAKE) npx ARG="eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0"

build:
	@$(MAKE) -C sample build
	@$(MAKE) npx ARG="vite build"
	@$(MAKE) npx ARG="storybook build"

image:
	$(COMPOSE) build base

log:
	$(LOG) -f db

start:
	npx firebase emulators:start & \
	npx storybook dev & \
	npx vite dev --open & \
	wait
