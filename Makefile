COMPOSE_FILE ?= .devcontainer/compose.yaml
COMPOSE = COMPOSE_FILE=$(COMPOSE_FILE) docker compose
RUN = $(COMPOSE) run --rm --remove-orphans
SERVICE = dev
NPM = $(RUN) --entrypoint npm $(SERVICE)
SAMPLE_MAKE = $(MAKE) -C sample
.DEFAULT_GOAL := help

.PHONY: help
help: ## Show available targets
	@awk 'BEGIN {FS = ":.*## "} /^[a-zA-Z0-9_.-]+:.*## / {printf "  %-24s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

.PHONY: init
init: .env image npm-install ## Initialize local development environment

.env: .env.example
	cp -n .env.example .env

.PHONY: npm-install
npm-install: ## Install npm packages in the dev container
	$(NPM) ci

.PHONY: up
up: init ## Start development containers
	$(COMPOSE) up --wait --wait-timeout 120 --remove-orphans -d

.PHONY: sh
sh: ## Open a shell in the dev container
	$(RUN) --entrypoint bash $(SERVICE)

.PHONY: test
test: test-unit test-firestore test-sample ## Run all tests

.PHONY: test-unit
test-unit: ## Run unit tests
	$(NPM) run test:unit

.PHONY: test-firestore
test-firestore: ## Run Firestore tests
	$(COMPOSE) up --wait --wait-timeout 120 --remove-orphans -d db
	$(NPM) run test:firestore

.PHONY: test-sample
test-sample: ## Run sample tests
	@$(SAMPLE_MAKE) test

.PHONY: ci
ci: build fmt lint test e2e ## Run the same checks as the pull request CI

.PHONY: e2e
e2e: COMPOSE_FILE := .devcontainer/compose.yaml:.devcontainer/compose.e2e.yaml
e2e: ## Run end-to-end tests
	$(COMPOSE) up --wait --wait-timeout 120 --remove-orphans
	$(NPM) run e2e

.PHONY: fmt
fmt: ## Format source files
	$(NPM) run fmt
	@$(SAMPLE_MAKE) fmt

.PHONY: fmt-check
fmt-check: ## Check source formatting without writing changes
	$(NPM) run fmt:check
	@$(SAMPLE_MAKE) fmt-check

.PHONY: lint
lint: ## Run lint checks
	$(NPM) run lint

.PHONY: lint-check
lint-check: ## Run lint checks without writing changes
	$(NPM) run lint:check

.PHONY: build
build: ## Build app, Storybook, and sample output
	@$(SAMPLE_MAKE) build
	$(NPM) run build
	$(NPM) run build:storybook

.PHONY: clean
clean: clean-branches ## Remove local branches whose upstream was deleted

.PHONY: clean-branches-dry-run
clean-branches-dry-run: ## List local branches whose upstream was deleted
	@git fetch --prune
	@git branch --format='%(refname:short)|%(worktreepath)|%(upstream:track)' | while IFS='|' read -r branch worktree_path upstream_track; do \
		[ "$$branch" != "main" ] || continue; \
		[ "$$upstream_track" = "[gone]" ] || continue; \
		if [ -n "$$worktree_path" ]; then echo "$$branch $$worktree_path"; else echo "$$branch"; fi; \
	done

.PHONY: clean-branches
clean-branches: ## Remove local branches whose upstream was deleted; requires CONFIRM=1
	@if [ "$(CONFIRM)" != "1" ]; then \
		echo "Refusing to delete branches without CONFIRM=1."; \
		echo "Run 'make clean-branches-dry-run' to inspect targets first."; \
		echo "Run 'make clean-branches CONFIRM=1' to delete them."; \
		exit 1; \
	fi
	@git fetch --prune
	@git branch --format='%(refname:short)|%(worktreepath)|%(upstream:track)' | while IFS='|' read -r branch worktree_path upstream_track; do \
		[ "$$branch" != "main" ] || continue; \
		[ "$$upstream_track" = "[gone]" ] || continue; \
		if [ -n "$$worktree_path" ]; then git worktree remove "$$worktree_path"; fi; \
		git branch -D "$$branch"; \
	done

.PHONY: image
image: ## Build the dev container image
	$(COMPOSE) build $(SERVICE)

.PHONY: start
start: ## Start local development services
	$(NPM) run start:all
