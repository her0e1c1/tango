COMPOSE = docker compose
RUN = $(COMPOSE) run --rm --remove-orphans
SERVICE = base
.DEFAULT_GOAL := sh

.PHONY: run
run:
	$(RUN) $(OPT) $(SERVICE) $(ARG)

.PHONY: sh
sh: run

.PHONY: build
build: run
build: OPT=--entrypoint 'python generate.py ./test -o build/output.json'

.PHONY: test
test: run
test: OPT=--entrypoint 'py.test'

.PHONY: fmt
fmt: run
fmt: OPT=--entrypoint 'ruff format'
