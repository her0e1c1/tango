include ../common.mk

build: run
build: OPT=--entrypoint 'python generate.py ./test -o build/output.json'

test: run
test: OPT=--entrypoint 'py.test'

fmt: run
fmt: OPT=--entrypoint 'ruff format'
