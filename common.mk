COMPOSE = docker compose
RUN = $(COMPOSE) run --rm --remove-orphans
LOG = $(COMPOSE) logs
SERVICE = base
.DEFAULT_GOAL := sh

.PHONY: all test build start

.PHONY: run
run:
	$(RUN) $(OPT) $(SERVICE) $(ARG)

.PHONY: sh
sh: run

.PHONY: npx
npx: OPT=--entrypoint npx
npx: run
