COMPOSE = docker compose
RUN = $(COMPOSE) run --rm --remove-orphans
LOG = $(COMPOSE) logs
SERVICE = base
NPM = $(RUN) --entrypoint npm $(SERVICE)
TEST_NPM = $(RUN) --entrypoint npm test
E2E_NPM = $(RUN) --use-aliases --env-from-file .env.e2e --entrypoint npm base
SAMPLE_MAKE = $(MAKE) -C sample
.DEFAULT_GOAL := sh

.PHONY: sh
sh:
	$(RUN) $(SERVICE)

.PHONY: test
test:
	$(NPM) run test:unit
	$(TEST_NPM) run test:firestore
	@$(SAMPLE_MAKE) test

.PHONY: e2e
e2e:
	$(COMPOSE) up --wait --wait-timeout 120 --remove-orphans browser app
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
	$(COMPOSE) build base

.PHONY: log
log:
	$(LOG) -f db

.PHONY: start
start:
	$(NPM) run start:all
