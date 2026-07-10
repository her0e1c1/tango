include common.mk

.PHONY: e2e

test:
	@$(MAKE) npx ARG="vitest run --exclude '**/firestore/**/*.spec.ts'"
	@$(MAKE) npx ARG="vitest run src/action/firestore" SERVICE=test
	@$(MAKE) -C sample test

e2e:
	$(COMPOSE) up -d e2e
	$(COMPOSE) run --rm --remove-orphans --use-aliases \
		-e PW_TEST_CONNECT_WS_ENDPOINT=ws://e2e:3000/ \
		-e PLAYWRIGHT_BASE_URL=http://base:4173 \
		base ./scripts/e2e.sh

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
