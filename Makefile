SHELL := /bin/bash
lint:
		@echo "running jslint"
		@node ./scripts/batchLint.js

test:
		@echo "running tests with mocha"
		@mocha -R spec ./tests/*.js