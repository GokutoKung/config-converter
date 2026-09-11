# Config Converter

Convert configuration between **YAML**, **`.env`**, and **Kubernetes ConfigMap**
(`KEY: "value"`) — any format to any other — that runs **100% in your browser**.
Paste a `config.yaml` and get a `.env` (or a ConfigMap `data:` block, or the other
way around) instantly — no upload, no backend, no database. Your secrets never
leave the tab.

<p align="center">
  <em>YAML &nbsp;·&nbsp; .env &nbsp;·&nbsp; ConfigMap &nbsp;·&nbsp; any-to-any &nbsp;·&nbsp; nested keys &nbsp;·&nbsp; type inference &nbsp;·&nbsp; arrays &nbsp;·&nbsp; validation &nbsp;·&nbsp; one-click copy</em>
</p>

---

## Why

| Pain point                                   | Solved by                                         |
| -------------------------------------------- | ------------------------------------------------- |
| Have a YAML config but need a `.env`         | **YAML → ENV**                                    |
| Have a `.env` but need YAML                  | **ENV → YAML**                                    |
| Need a Kubernetes ConfigMap `data:` block    | **→ ConfigMap** (`KEY: "value"`)                  |
| Don't want to rewrite hundreds of keys       | Instant, handles hundreds of keys                 |
| Want to see the result as you type           | Live conversion (recomputed every keystroke)      |
| Don't want to upload secrets to some website | Everything runs locally — **nothing is uploaded** |

## Features

- **Three formats, any-to-any** — YAML, `.env`, and Kubernetes ConfigMap
  (`KEY: "value"`), converted in any direction with a one-click swap.
- **Nested keys** — `database.host` ⇄ `DATABASE_HOST` (single-underscore convention).
- **Type inference** — `PORT=8080` → `8080` (number), `DEBUG=true` → `true` (boolean).
- **Arrays** as comma-separated values — `FEATURES=a,b,c` ⇄ a YAML list.
- **Lossless round-trips** — strings that look like numbers/booleans (e.g. `"007"`,
  `"true"`) are quoted so they survive the trip.
- **Validation** — invalid YAML, malformed `.env` lines, duplicate keys and key
  collisions are surfaced as inline errors/warnings.
- **Copy output** to the clipboard.
- **Dark / light** theme (follows your OS).

## Tech stack

- [Vite](https://vitejs.dev/) + [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Bun](https://bun.sh/) as the package manager / runtime
- [`yaml`](https://eemeli.org/yaml/) for parsing & serialization
- [Vitest](https://vitest.dev/) + [Testing Library](https://testing-library.com/) for tests
- [ESLint](https://eslint.org/) + [Prettier](https://prettier.io/) for linting/formatting
- [Husky](https://typicode.github.io/husky/) + [lint-staged](https://github.com/lint-staged/lint-staged) for pre-commit checks

The conversion engine (`src/lib`) is pure, framework-agnostic TypeScript with no DOM
dependencies, so it is fully unit-tested in isolation.

## Getting started

Requires [Bun](https://bun.sh/) (≥ 1.3).

```bash
bun install
bun dev
```

Open http://localhost:5173.

### Configuring the port

Config lives in [`config/`](config/config.yaml.example). Copy the template once
(the real `config.yaml` is git-ignored):

```bash
cp config/config.yaml.example config/config.yaml
```

The port is resolved in this order (highest priority first):

1. the `PORT` environment variable,
2. `server.port` in `config/config.yaml`,
3. the default `5173`.

So set it persistently in the config file:

```yaml
# config/config.yaml
server:
  port: 3000
```

or override it per-run with an env var:

```bash
PORT=3000 bun dev
PORT=3000 bun preview
```

## Scripts

| Script                  | Description                      |
| ----------------------- | -------------------------------- |
| `bun dev`               | Start the dev server (Vite)      |
| `bun run build`         | Type-check and build to `dist/`  |
| `bun preview`           | Preview the production build     |
| `bun test`              | Run unit tests once              |
| `bun run test:watch`    | Run tests in watch mode          |
| `bun run test:coverage` | Run tests with a coverage report |
| `bun run lint`          | Lint with ESLint                 |
| `bun run format`        | Format with Prettier             |
| `bun run typecheck`     | Type-check without emitting      |

## Conversion rules

The engine is deterministic and the conventions are fixed so that a round-trip is
as lossless as possible.

### Nesting — single underscore `_`

```yaml
database:
  host: localhost
  credentials:
    user: admin
```

```dotenv
DATABASE_HOST=localhost
DATABASE_CREDENTIALS_USER=admin
```

> ENV → YAML lowercases keys and splits on `_`, so `DATABASE_HOST` becomes
> `database.host`. Because the separator is a single underscore, a YAML key that
> already contains `_` will be treated as nesting when converted back — this is the
> trade-off of the single-underscore convention.

### Types

| ENV            | YAML            | Note                        |
| -------------- | --------------- | --------------------------- |
| `PORT=8080`    | `port: 8080`    | integer                     |
| `RATIO=1.5`    | `ratio: 1.5`    | float                       |
| `DEBUG=true`   | `debug: true`   | boolean (case-insensitive)  |
| `EMPTY=`       | `empty: ''`     | empty string                |
| `NOTHING=null` | `nothing: null` | `null` / `~`                |
| `CODE=007`     | `code: '007'`   | leading-zero kept as string |
| `NAME="true"`  | `name: 'true'`  | quoted → stays a string     |

Type inference can be toggled off (everything stays a string).

### Arrays — comma-separated

```yaml
features:
  - auth
  - billing
```

```dotenv
FEATURES=auth,billing
```

Arrays of objects (or scalars that contain commas) fall back to indexed keys:

```yaml
servers:
  - host: a
  - host: b
```

```dotenv
SERVERS_0_HOST=a
SERVERS_1_HOST=b
```

### Kubernetes ConfigMap

The **ConfigMap** format is a flat mapping of `KEY: "value"` pairs — the shape of a
Kubernetes ConfigMap `data:` block (and docker-compose `environment:`). Every value
is a quoted string and keys stay flat:

```yaml
NODE_ENV: 'production'
SERVER_HOST: '0.0.0.0'
SERVER_PORT: '3001'
```

Converting a ConfigMap **to** YAML or `.env` applies the same key-splitting and type
inference as `.env` (so `SERVER_PORT: "3001"` → `server.port: 3001`). Converting
**to** ConfigMap flattens the keys and quotes every value as a string.

**Paste-friendly:** you can paste the `data:` lines straight out of a manifest —
common leading indentation is stripped automatically, and if you paste a whole
`ConfigMap` manifest (`apiVersion` / `kind` / `metadata` / `data`) only the `data:`
section is used.

### Quoting

Values are quoted only when needed to survive a round-trip: edge whitespace,
newlines, `#`, quotes/backslashes, commas, or values that would otherwise be
re-typed (`"true"`, `"42"`). Interior spaces are left unquoted.

## Testing

```bash
bun test
bun run test:coverage
```

Covers the conversion engine (flatten/unflatten, type inference, quoting,
round-trips, validation, a 500-key performance guard) and the React UI.

## Pre-commit hooks

`lint-staged` (ESLint + Prettier on staged files) is wired to run on commit via
Husky. Because this repo may not be a git repo yet, enable it once:

```bash
git init
bun install                          # runs the "prepare" script → husky
echo 'bunx lint-staged' > .husky/pre-commit
```

After that, every `git commit` lints and formats your staged files.

## Docker

Multi-stage build: Bun builds the static site, nginx serves it.

```bash
# Build
docker build -t config-converter:latest .

# Run (maps host port 8080 → container 8080)
docker run --rm -p 8080:8080 config-converter:latest
```

Open http://localhost:8080.

### Choosing the port

```bash
# Publish on a different host port
docker run --rm -p 3000:8080 config-converter:latest

# Or change the port nginx listens on inside the container
docker run --rm -e PORT=9000 -p 3000:9000 config-converter:latest
```

### docker compose

```bash
docker compose up --build          # http://localhost:8080
HOST_PORT=3000 docker compose up    # http://localhost:3000
```

### Publishing to Docker Hub

```bash
# Log in once
docker login

# Tag with your Docker Hub username and a version
docker build -t <your-user>/config-converter:latest -t <your-user>/config-converter:1.0.0 .

# Push
docker push <your-user>/config-converter:latest
docker push <your-user>/config-converter:1.0.0
```

For multi-architecture images (amd64 + arm64):

```bash
docker buildx create --use
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t <your-user>/config-converter:latest \
  --push .
```

## Project structure

```
src/
  lib/                 # Pure conversion engine (framework-agnostic, unit-tested)
    convert.ts         #   facade: convert(input, direction, options)
    yamlToEnv.ts       #   YAML → ENV
    envToYaml.ts       #   ENV → YAML
    flatten.ts         #   nested object → flat ENV pairs
    unflatten.ts       #   flat ENV pairs → nested object
    value.ts           #   scalar formatting / inference / quoting
    parseEnv.ts        #   .env tokenizer
    samples.ts         #   example inputs
    *.test.ts          #   unit tests
  components/          # UI: Toolbar, EditorPane, OutputPane, IssuePanel
  hooks/useCopy.ts     # clipboard helper
  App.tsx              # composition
nginx/                 # nginx config template for the Docker image
```

## Privacy

No network requests are made with your data. There is no backend and no database;
the entire conversion happens in your browser. You can verify this in your browser's
Network tab, or run it fully offline via Docker.

## License

MIT
