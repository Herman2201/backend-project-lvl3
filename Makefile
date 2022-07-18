# Makefile

install:
	npm ci

publish:
	npm publish --dry-run

lint:
	npx eslint .

lint-fix:
	npx eslint . --fix

link:
	sudo npm link

test:
	npm test

test-coverage:
	npm test -- --coverage --coverageProvider=v8

.PHONY: test