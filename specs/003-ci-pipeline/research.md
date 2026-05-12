# Phase 0 — Research: QA + CI en GitHub Actions

**Branch**: `003-ci-pipeline` · **Date**: 2026-05-12

Resoluciones técnicas previas a Phase 1. Ninguna `NEEDS CLARIFICATION`
abierta en `plan.md`.

---

## 1. Topología de jobs: monolítico vs paralelo vs micro-jobs

**Decision**: **Dos jobs paralelos** (`backend` y `frontend`) + un
tercero condicional (`docker-build`) que depende de los dos.

Cada job contiene sus checks como **steps secuenciales** con
`if: always()` allí donde corresponda (lint puede fallar pero seguimos
con tests para no esconder problemas).

```text
┌──────────────┐   ┌──────────────┐
│  backend     │   │  frontend    │
│  ─ lint      │   │  ─ typecheck │
│  ─ tests     │   │  ─ lint      │
│  (junit xml) │   │  ─ tests     │
│              │   │  ─ build     │
└──────┬───────┘   └──────┬───────┘
       └────────┬─────────┘
                ▼
         ┌──────────────┐
         │ docker-build │ ← sólo main y tags v*
         │ + artifacts  │
         └──────────────┘
```

**Rationale**:
- Paralelismo real: backend y frontend tardan ~3 min cada uno; en
  paralelo el wall-clock baja de 6 a 3 min.
- Granularidad de status checks: GitHub reporta UN check por job, por
  lo que `backend / tests` es un check separado de `frontend / tests`.
  Esto es exactamente lo que necesitamos para branch protection
  (FR-013).
- Steps secuenciales dentro de cada job son simples de leer y debuggear.

**Alternatives considered**:
- Un solo job monolítico: pierde paralelismo, hace el log más largo.
- Micro-jobs (un job por step): explota el contador de minutos por el
  spinup repetido del runner; sin beneficio.
- Reusable workflow: sobre-ingeniería para un solo workflow.

---

## 2. Caching de dependencias

**Decision**: `actions/cache@v4` con keys explícitas anidadas en
`setup-python` y `setup-node` cuando esté disponible nativamente.

```yaml
# Backend
- uses: actions/setup-python@v5
  with:
    python-version: '3.11'
    cache: 'pip'
    cache-dependency-path: backend/pyproject.toml

# Frontend
- uses: actions/setup-node@v4
  with:
    node-version: '20'
    cache: 'npm'
    cache-dependency-path: frontend/package-lock.json
```

**Rationale**:
- Las propias actions `setup-python` y `setup-node` exponen cache
  nativo (`cache: 'pip'`/`'npm'`) con key derivada del lockfile —
  más sencillo que `actions/cache` manual y mantenido por GitHub.
- `cache-dependency-path` apunta al manifest exacto para que el hash
  capture cambios de versiones.
- Cache hit típico: 95% (sólo se invalida cuando alguien cambia
  `pyproject.toml` o `package-lock.json`).

**Alternatives considered**:
- `actions/cache@v4` manual: más control pero más boilerplate; no
  necesario.
- Cache de `node_modules` en lugar de `~/.npm`: más rápido pero más
  frágil con symlinks/permisos. La cache de npm (descarga) es lo
  recomendado.
- Sin cache: añade ~3 min cada PR. Inaceptable.

---

## 3. Versiones de Python y Node fijas (no matriz)

**Decision**:
- Python: **3.11** (única).
- Node: **20 LTS** (única).

Ambas reflejan exactamente el entorno de producción (Docker base
`python:3.11-slim` + `node:20-alpine` para el build de frontend).

**Rationale**:
- La matriz multi-versión (3.11 × 3.12, Node 18 × 20) duplicaría
  tiempo de CI sin valor real: la app sólo se despliega contra UNA
  versión fija. Si en el futuro se quiere publicar como librería o
  soportar múltiples versiones, será otra feature.
- Mismas versiones que producción → tests más representativos.

**Alternatives considered**:
- Matriz 3.11 + 3.12: doble coste de minutos sin beneficio para una
  app interna.
- Matriz Node 18 + 20: idem.

---

## 4. Reportes JUnit XML para que los nombres de test coincidan local vs remoto

**Decision**: ambos test runners producen JUnit XML como artifact
del job y como reporter primario en la salida de CI:

- Backend: `pytest --junitxml=backend-junit.xml backend/tests/`
- Frontend: `vitest run --reporter=junit --outputFile=frontend-junit.xml`

GitHub Actions luego usa la propia salida del comando para identificar
los fallos. El JUnit XML se sube como artifact secundario para
inspección offline.

**Rationale**:
- Es el formato standard que ambos runners producen idéntico al
  local. Un developer puede copiar el `nodeid` de pytest desde GitHub
  Actions y pegarlo en su terminal: `pytest <ese_id>` reproduce
  exactamente.
- No requiere parsers custom — pytest y vitest soportan JUnit XML
  out-of-the-box.
- Cumple SC-004 ("≤ 30 s diff entre local y CI").

**Alternatives considered**:
- `dorny/test-reporter` action: third-party, viola FR-051. Y la salida
  default de pytest/vitest ya es suficiente.
- `publish-test-results` action: ídem.

---

## 5. Required status checks: nombre exacto

**Decision**: los nombres que GitHub usa para branch protection son
los nombres de los JOBS, no de los steps. Por lo tanto definimos:

| Job (en yaml) | Nombre que GitHub muestra | Required? |
|---|---|---|
| `backend` | `backend` | ✅ required |
| `frontend` | `frontend` | ✅ required |
| `docker-build` | `docker-build` | ⛔ NO required (sólo en main/tags) |

**Rationale**:
- Granularidad correcta: si `backend / tests` (un step) falla, el job
  `backend` falla entero, y eso es lo que GitHub bloquea.
- `docker-build` NO se requiere en PR porque no se ejecuta en PR
  (sólo main/tags).

**¿Cómo sabemos que los 3 tests innegociables están dentro del job
required?**

El job `backend` ejecuta `pytest backend/tests/`, que **siempre**
incluye los tres. Cualquier intento de excluirlos en el comando
quedaría visible en el diff del workflow yaml (FR-050 limita el
workflow a UN archivo, por lo que es fácil de auditar).

**Alternatives considered**:
- Steps required individualmente: GitHub no soporta marcar steps como
  required, sólo jobs.
- Job dedicado `constitution-tests` que sólo ejecute los tres tests
  innegociables: redundante (ya se ejecutan en `backend`) y propenso
  a desincronización si se renombra algún test.

---

## 6. Branch protection: configuración vía UI vs API vs IaC

**Decision**: **configuración manual desde la UI de GitHub**,
documentada paso a paso en `CONTRIBUTING.md`. NO se gestiona como
código en esta feature.

**Rationale**:
- Para un repo pequeño con 2 admins, la inversión en
  Terraform/Pulumi/`github-action-branch-protection` no se justifica.
- Cambiar las reglas es raro (≤ 1 vez por trimestre); cuando ocurre,
  los pasos del CONTRIBUTING.md están al lado.
- Si en el futuro se quiere infraestructura como código, será otra
  feature (`004-branch-protection-iac` o similar).

**Documentación a producir** (en `CONTRIBUTING.md`):

```text
Settings → Branches → Add rule:
  Branch name pattern: main
  ✅ Require a pull request before merging
     ✅ Require approvals: 1
  ✅ Require status checks to pass before merging
     ✅ Require branches to be up to date before merging
     ✅ Status checks that are required:
        - backend
        - frontend
  ✅ Require conversation resolution before merging
  ✅ Do not allow bypassing the above settings (incluye admins)
```

**Alternatives considered**:
- `actions/github-script` + REST API en un workflow `setup-branch-protection.yml`:
  funcional pero opaco; la UI sigue siendo la fuente de verdad
  visible.
- Terraform: sobre-ingeniería.

---

## 7. Artefactos: qué se sube y con qué nombre

**Decision**:

| Artifact | Nombre | Subido en | Retención |
|---|---|---|---|
| Imagen Docker | `kratos-image-${{ github.sha }}.tar.gz` | `main`, tags `v*` | 90 días (default) |
| Frontend dist | `frontend-dist-${{ github.sha }}.zip` | `main`, tags `v*` | 90 días (default) |
| Backend JUnit XML | `backend-junit-${{ github.sha }}.xml` | siempre (PR incluido) | 14 días |
| Frontend JUnit XML | `frontend-junit-${{ github.sha }}.xml` | siempre (PR incluido) | 14 días |

**Rationale**:
- Los nombres incluyen `github.sha` para evitar colisiones entre runs
  paralelos del mismo workflow.
- Los JUnit XML van con retención corta (14 días) — sólo útiles para
  postmortem; no consumen cuota innecesariamente.
- Los artefactos de release (Docker, dist) van con retención larga
  para facilitar rollbacks.

`docker save | gzip` ocupa ~80-120 MB para esta app. Dentro del plan
free de Actions sin problemas.

**Alternatives considered**:
- Publicar a GHCR (`ghcr.io/<org>/kratos:<sha>`): mejor experiencia
  pero requiere permisos `packages: write` y un secret. Fuera de
  alcance de esta feature; va en `004-ghcr-publish` si llega.
- Sin artefactos en PR: pierdes la capacidad de descargar el JUnit
  XML para análisis local.

---

## 8. Lint/format: check-only en CI vs auto-fix

**Decision**: **check-only**. CI **comprueba** que el código está
formateado y lintado correctamente; **no** aplica fixes automáticos.

```bash
# Backend
ruff check backend/src backend/tests       # lint, falla si hay issues
black --check backend/src backend/tests    # format check, falla si difiere

# Frontend
npm run lint                                # eslint
npx prettier --check 'src/**/*.{ts,tsx,css,html,json}'
```

**Rationale**:
- Si CI autofixea, los developers nunca aprenden a configurar su
  editor — calidad del DX baja.
- Hacer push automático desde CI requiere permisos `contents: write`
  y abre potenciales bucles de commits.
- Para arreglar localmente: `make format` (target nuevo que ejecuta
  `ruff check --fix` y `prettier --write`). Documentado en
  `CONTRIBUTING.md`.

**Alternatives considered**:
- Bot `lint-action` que abre PR con fixes: util pero complejidad alta
  para una primera iteración.
- Pre-commit hook + Husky: capa adicional sin valor incremental sobre
  CI.

---

## 9. Triggers exactos

**Decision**:

```yaml
on:
  push:
    branches: [main]
    tags: ['v*']
  pull_request:
    branches: [main]
  workflow_dispatch: {}
```

**Rationale**:
- `push: branches: [main]` cubre merges (un merge a main produce un
  push).
- `push: tags: ['v*']` activa el job `docker-build` con artifacts de
  release.
- `pull_request: branches: [main]` cubre todos los PRs contra main,
  incluidos los de Dependabot.
- `workflow_dispatch` permite re-ejecutar desde la UI sin abrir un PR
  (útil para volver a generar artifacts o validar tras un cambio de
  secret).

**Alternatives considered**:
- `push:` en todas las ramas: dispararía CI en ramas WIP donde no se
  quiere. Innecesario.
- `pull_request_target`: incrementa permisos (acceso a secrets desde
  forks). Innecesario porque no recibimos PRs de forks de externos.

---

## Resumen

| Tema | Decisión |
|---|---|
| Topología jobs | 2 paralelos (`backend`, `frontend`) + 1 condicional (`docker-build`) |
| Caching | `setup-python` + `setup-node` con caché nativa por lockfile |
| Versiones | Python 3.11 + Node 20, fijas (sin matriz) |
| Test reports | JUnit XML idéntico local/remoto |
| Required checks | `backend`, `frontend` (job-level) |
| Branch protection | Manual desde UI, documentado en `CONTRIBUTING.md` |
| Artifacts | Docker tarball + dist zip en main/tags; JUnit XML en todo run |
| Lint/format | Check-only; `make format` arregla en local |
| Triggers | push a main, tags v*, PRs a main, dispatch manual |

Todas las decisiones cumplen los 5 principios, sin nuevas dependencias
fuera del stack ya instalado en el proyecto.
