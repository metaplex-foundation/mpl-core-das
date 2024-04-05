# Contributing to the JavaScript library

This is a quick guide to help you contribute to this JavaScript library.

## Getting started

[Ensure you have pnpm installed](https://pnpm.io/installation) and run the following command to install the library's dependencies.

```sh
pnpm install
```

You can then run the following commands to build, test and lint the client. 
Note, that you should [set up your testing environment](#testing) for running tests first.

```sh
# Build the library.
pnpm build

# Test the library (requires building first).
pnpm build && pnpm test

# Test a specific file or set of files.
pnpm build && pnpm test test/somefile.test.js
pnpm build && pnpm test test/somePattern*

# Lint and/or format the client.
pnpm lint
pnpm lint:fix
pnpm format
pnpm format:fix
```

## Testing

The tests included in this repository can be run locally to test different endpoints. From the root folder, follow the steps below to setup the environment to run the tests:
1. Make a copy of file `.env.example` and name it `.env`.
2. Edit the `.env` file and include a line specifying your endpoint:
   ```bash
   DAS_API_ENDPOINT="<URL>"
   ```
   where `<URL>` is the URL of your endpoint.
3. [Ensure you have pnpm installed](https://pnpm.io/installation) and run the following command to install the dependencies:
   ```bash
   pnpm install
   ```
4. Build and run the tests:
   ```bash
   pnpm build && pnpm test
   ```