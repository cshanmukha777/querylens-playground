# QueryLens Playground

An interactive developer workspace for inspecting SQL with the published [`@shanmukha_npm/querylens`](https://www.npmjs.com/package/@shanmukha_npm/querylens) package. Analysis runs in the browser, uses the same QueryLens API as the library, and never executes editor SQL.

## Links

- Core library: [cshanmukha777/querylens](https://github.com/cshanmukha777/querylens)
- npm package: [@shanmukha_npm/querylens](https://www.npmjs.com/package/@shanmukha_npm/querylens)
- Live demo: deployment is not yet configured.

## Features

- CodeMirror SQL editor with SQLite, PostgreSQL, and MySQL dialect selection.
- Five editable examples, including a sample for each supported dialect.
- Real parser diagnostics, structural findings, score, fingerprint, and complexity indicators from QueryLens **0.1.1**.
- Browser-local query history and JSON/HTML report downloads.
- Optional local Express API for profiling three fixed SQLite samples against a seeded, read-only demo database.

The score describes static structure; it is not an execution-time prediction. The profiler executes only server-defined sample queries with fixed parameters. Visitor SQL is never sent to the database.

## Run locally

Requirements: Node.js 22.13 or later.

```sh
git clone https://github.com/cshanmukha777/querylens-playground.git
cd querylens-playground
npm ci
npm run dev:server
```

In a second terminal:

```sh
npm run dev
```

Vite serves the interface at `http://localhost:5173` and proxies optional `/api` requests to the local server on port 4179. Static analysis works in the browser through the published package. The profile control is shown in development only when the API is running, and only for the curated SQLite samples.

## Production build

```sh
npm run typecheck
npm run lint
npm test
npm run build
```

The static frontend is written to `dist/`. Set `VITE_API_URL` to a deployed API origin at build time only if the curated SQLite profiling feature is also deployed. Without that variable, the static analyzer remains fully functional and the app does not show a non-working profile control.

The optional API can be started with `npm run server:start`. It reads `FRONTEND_ORIGINS` as a comma-separated CORS allowlist and `DATABASE_PATH` as the SQLite file location. It seeds its demo data at startup, then opens the database read-only for profiling.

## API

| Endpoint | Behavior |
|---|---|
| `GET /api/health` | Process health status. |
| `GET /api/samples` | Metadata and SQL for fixed profiling samples. |
| `POST /api/analyze` | `{ "sql": "SELECT 1", "dialect": "sqlite" }`; analyzes one statement using QueryLens and never executes it. |
| `POST /api/profile` | `{ "sampleId": "order-details" }`; profiles only a known, fixed SQLite sample. Extra request fields are rejected. |

API request bodies are limited to 8 KB, SQL input is limited to 8,000 characters, and API requests are rate-limited to 60 per minute per IP. CORS is controlled by `FRONTEND_ORIGINS`.

## Tests

```sh
npm test
npm run test:coverage
npm run typecheck
npm run lint
npm run build
```

The tests cover the published package across the sample dialects, malformed and multi-statement SQL, the profiling allowlist, request limits, and CORS behavior.

## Deployment

`netlify.toml` configures the static Vite build. `render.yaml` configures the optional Node API. Configure the hosting account and deployment URLs before using either service; no public demo URL is claimed until the deployment has been verified.

## License

MIT. See [LICENSE](LICENSE).
