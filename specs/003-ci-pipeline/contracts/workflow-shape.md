# Contrato: estructura del workflow `ci.yml`

**Branch**: `003-ci-pipeline` · **Date**: 2026-05-12

Este documento es el **contrato funcional** del archivo único
`.github/workflows/ci.yml`. La implementación concreta (rolos exactos
de YAML, posiciones de líneas) puede variar; lo que NO puede variar son
los nombres de los jobs, los triggers y los outputs visibles.

## Triggers

```yaml
on:
  push:
    branches: [main]
    tags: ['v*']
  pull_request:
    branches: [main]
  workflow_dispatch: {}
```

## Permissions (mínimo principio)

```yaml
permissions:
  contents: read
  actions: read
  checks: write
```

Justificación:
- `contents: read` — para `actions/checkout`.
- `actions: read` — para leer artefactos previos si fuera necesario.
- `checks: write` — para publicar el estado de cada job como status check.
- **No** `contents: write` — CI nunca empuja commits.
- **No** `pull-requests: write` — CI nunca comenta en PRs.

## Concurrency

```yaml
concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: ${{ github.event_name == 'pull_request' }}
```

Justificación: en un PR, cuando llega un nuevo push se cancela el run
anterior (ahorra minutos). En `main` y tags **no se cancela**, para
mantener historial completo.

## Jobs

### 1. `backend`

**Status check name** (lo que GitHub muestra y se configura como
required): `backend`.

**Runner**: `ubuntu-latest`.

**Steps** (en orden):

1. `actions/checkout@v4`
2. `actions/setup-python@v5` con `python-version: '3.11'`,
   `cache: 'pip'`, `cache-dependency-path: backend/pyproject.toml`
3. `pip install --upgrade pip`
4. `pip install -e "backend[dev]"`
5. **Lint check**: `ruff check backend/src backend/tests`
6. **Format check** (`if: always()`): `black --check backend/src backend/tests`
7. **Tests** (`if: always()`):
   `pytest backend/tests --junitxml=backend-junit.xml`

   El comando ejecuta **todos los tests** del directorio, incluidos:
   - `tests/integration/test_vote_anonymity.py` (Principio I)
   - `tests/integration/test_vote_unicity.py` (Principio II)
   - `tests/contract/test_auth_domain.py` (Principio III)
8. **Upload JUnit XML** (`if: always()`):
   `actions/upload-artifact@v4` con `name: backend-junit-${{ github.sha }}`,
   `path: backend-junit.xml`, `retention-days: 14`

**Env vars usadas en los tests** (todas dummy, NUNCA reales):

```yaml
env:
  ENV: test
  SESSION_SECRET: ci-dummy-secret-not-for-production
  GOOGLE_CLIENT_ID: ci-dummy-client-id
  GOOGLE_CLIENT_SECRET: ci-dummy-secret
  ADMIN_EMAILS: jgomez@phicus.es,epastor@phicus.es
  BASE_URL: http://localhost:5173
```

### 2. `frontend`

**Status check name**: `frontend`.

**Runner**: `ubuntu-latest`.

**Steps** (en orden):

1. `actions/checkout@v4`
2. `actions/setup-node@v4` con `node-version: '20'`,
   `cache: 'npm'`, `cache-dependency-path: frontend/package-lock.json`
3. `npm ci` (instalación reproducible desde `package-lock.json`),
   trabajando en `frontend/`
4. **Typecheck**: `npm --prefix frontend run typecheck`
   (o `npx --prefix frontend tsc --noEmit`)
5. **Lint** (`if: always()`): `npm --prefix frontend run lint:check`
   (eslint + prettier --check)
6. **Tests** (`if: always()`):
   `npm --prefix frontend run test:ci`
   (vitest run --reporter=junit --outputFile=frontend-junit.xml)
7. **Build** (`if: always()`): `npm --prefix frontend run build`
8. **Upload JUnit XML** (`if: always()`): análogo a backend
9. **Upload dist** (sólo en main/tags, `if:` con condición):
   `actions/upload-artifact@v4` con `name: frontend-dist-${{ github.sha }}`,
   `path: frontend/dist/`, `retention-days: 90`

### 3. `docker-build` (condicional)

**Status check name**: `docker-build`. **NO** required en PR.

**Condition**:

```yaml
if: github.ref == 'refs/heads/main' || startsWith(github.ref, 'refs/tags/v')
```

**Needs**: `[backend, frontend]` (sólo corre si ambos pasan).

**Runner**: `ubuntu-latest`.

**Steps**:

1. `actions/checkout@v4`
2. `docker/setup-buildx-action@v3` (build multi-stage cacheable)
3. **Build**: `docker compose build` (usa el `docker-compose.yml`
   existente)
4. **Save**: `docker save kratos-phicus:latest | gzip > kratos-image.tar.gz`
5. **Upload artifact** con `name: kratos-image-${{ github.sha }}`,
   `path: kratos-image.tar.gz`, `retention-days: 90`

## Resumen de status checks visibles en cada commit

| Check name | Trigger | Required en branch protection |
|---|---|---|
| `backend` | push/PR/dispatch | ✅ |
| `frontend` | push/PR/dispatch | ✅ |
| `docker-build` | push a main, tags | ⛔ (sólo informativo) |

## Anti-patrones explícitamente prohibidos

- **NO** usar actions de terceros distintas a `docker/setup-buildx-action`
  (FR-051).
- **NO** ejecutar tests con `--retry N` para ocultar flakies.
- **NO** referenciar secrets reales con `${{ secrets.GOOGLE_CLIENT_ID }}`
  o equivalentes. Sólo dummies hardcodeados o `ENV=test`.
- **NO** hacer `git push` desde un job (`contents: write` está
  deliberadamente fuera de `permissions`).
- **NO** comentar en PRs desde el workflow.

## Output de fallos: forma canónica

Cuando un test falla, la salida del runner debe incluir la línea de
identificación canónica:

- pytest: `tests/integration/test_X.py::test_Y FAILED`
- vitest: `× tests/component/Z.test.tsx > test name`

Estas son las **mismas líneas exactas** que aparecen en local. Es la
base de cumplimiento de SC-004.
