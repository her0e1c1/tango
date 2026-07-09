include common.mk

.PHONY: e2e

test:
	@$(MAKE) npx ARG="vitest run --exclude '**/firestore/**/*.spec.ts'"
	@$(MAKE) npx ARG="vitest run src/action/firestore" SERVICE=test
	@$(MAKE) -C sample test

e2e:
	$(COMPOSE) up -d e2e
	$(COMPOSE) run --rm --remove-orphans --use-aliases -e PW_TEST_CONNECT_WS_ENDPOINT=ws://e2e:3000/ -e PLAYWRIGHT_BASE_URL=http://base:4173 base -lc "VITE_PROJECT_ID=tango-e2e VITE_WEB_API_KEY=e2e-api-key npm run build && npx vite preview --host 0.0.0.0 --port 4173 & node -e \"const http=require('http');const url='http://base:4173';let n=0;(function wait(){http.get(url,r=>{r.resume();process.exit(0)}).on('error',()=>setTimeout(wait,500));if(++n>120)process.exit(1)})()\" && npm run e2e"

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
