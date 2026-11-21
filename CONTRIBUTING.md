# Contributing

Thanks for helping improve QueryLens Playground. Please keep analysis tied to the published QueryLens API and keep visitor SQL separate from database execution.

## Development setup

1. Use Node.js 22.13 or later.
2. Run `npm ci`.
3. Start the optional API with `npm run dev:server`.
4. Start Vite in another terminal with `npm run dev`.

## Before opening a pull request

Run the same checks used in CI:

```sh
npm run typecheck
npm run lint
npm test
npm run build
```

Add tests for behavior changes. Keep profile endpoints restricted to fixed, parameterized sample queries. Never execute SQL received from the browser.
