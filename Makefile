COMPOSE = docker compose
E2E_COMPOSE = COMPOSE_FILE=compose.yaml:compose.e2e.yaml $(COMPOSE)
RUN = $(COMPOSE) run --rm --remove-orphans
LOG = $(COMPOSE) logs
SERVICE = dev
NPM = $(RUN) --entrypoint npm $(SERVICE)
E2E_NPM = $(E2E_COMPOSE) run --rm --remove-orphans --use-aliases --env-from-file .env.e2e --entrypoint npm $(SERVICE)
SAMPLE_MAKE = $(MAKE) -C sample
.DEFAULT_GOAL := sh

.PHONY: sh
sh:
	$(RUN) $(SERVICE)

.PHONY: test
test:
	$(NPM) run test:unit
	$(COMPOSE) up --wait --wait-timeout 120 --remove-orphans -d db
	$(NPM) run test:firestore
	@$(SAMPLE_MAKE) test

.PHONY: e2e
e2e:
	$(E2E_COMPOSE) up --wait --wait-timeout 120 --remove-orphans browser app
	$(E2E_NPM) run e2e

.PHONY: fmt
fmt:
	$(NPM) run fmt
	@$(SAMPLE_MAKE) fmt

.PHONY: lint
lint:
	$(NPM) run lint

.PHONY: build
build:
	@$(SAMPLE_MAKE) build
	$(NPM) run build
	$(NPM) run build:storybook

.PHONY: clean
clean: clean-branches

.PHONY: clean-branches
clean-branches:
	@git fetch --prune
	@git branch --format='%(refname:short)|%(worktreepath)|%(upstream:track)' | while IFS='|' read -r branch worktree_path upstream_track; do \
		[ "$$branch" != "main" ] || continue; \
		[ "$$upstream_track" = "[gone]" ] || continue; \
		if [ -n "$$worktree_path" ]; then git worktree remove "$$worktree_path"; fi; \
		git branch -D "$$branch"; \
	done

.PHONY: image
image:
	$(COMPOSE) build $(SERVICE)

.PHONY: log
log:
	$(LOG) -f db

.PHONY: start
start:
	$(NPM) run start:all
