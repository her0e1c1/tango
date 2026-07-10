COMPOSE = docker compose
RUN = $(COMPOSE) run --rm --remove-orphans
SERVICE = base
.DEFAULT_GOAL := sh

.PHONY: all test build fmt run sh

run:
	$(RUN) $(OPT) $(SERVICE) $(ARG)

sh: run

build: run
build: OPT=--entrypoint 'python generate.py ./test -o build/output.json'

test: run
test: OPT=--entrypoint 'py.test'

fmt: run
fmt: OPT=--entrypoint 'ruff format'
