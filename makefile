DEBUG=sourced*

test: 
	$(MAKE) DEBUG= test-debug

test-debug: 
	DEBUG=$(DEBUG) \
	npm test

test-docs:
	DEBUG=sourced* \
	npm run docs

test-markdown:
	DEBUG=sourced* \
	NODE_ENV=development \
	npm run markdown

.PHONY: test
