# Implementation Plan: QA + CI en GitHub Actions

**Branch**: `003-ci-pipeline` | **Date**: 2026-05-12 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-ci-pipeline/spec.md`

## Summary

Pipeline CI **único** en GitHub Actions que ejecuta toda la matriz de QA
del proyecto (lint, format, typecheck, tests, build) sobre cada PR, cada
commit a `main` y cada tag `v*`. Los tres tests innegociables de la
constitución (Principios I, II y III) se marcan como **required status
checks** en branch protection, así ningún PR puede mergearse a `main`
sin haberlos pasado.

Aproximación técnica:

- **Un único archivo** `.github/workflows/ci.yml`, sin composite actions
  propias, sólo actions oficiales de GitHub (`actions/checkout`,
  `setup-python`, `setup-node`, `cache`, `upload-artifact`).
- **Dos jobs paralelos** `backend` y `frontend`, cada uno ejecuta sus
  checks dentro como pasos secuenciales con `if: always()` cuando
  procede, para que un fallo de lint no oculte un fallo de test.
- **Un job condicional** `docker-build` que sólo corre en `main` o tags
  `v*` y depende del éxito de los anteriores.
- **Make target** `ci` que reproduce la misma matriz en local, mismo
  orden y mismos comandos subyacentes — paridad ≤ 30 s diff con el
  workflow remoto (SC-004).
- **Branch protection** documentada en `CONTRIBUTING.md`: 5 checks
  required (`backend / lint`, `backend / tests`, `frontend / typecheck`,
  `frontend / tests`, `frontend / build`), configurada una vez desde la
  UI de GitHub por un admin del repo.

## Technical Context

**Language/Version**:
- Backend: Python 3.11 (declarado en `backend/pyproject.toml` como
  `requires-python = ">=3.11"` y `target-version = "py311"` en ruff y
  black).
- Frontend: Node 20 LTS (no declarado explícitamente en `engines`; se
  fija en `actions/setup-node@v4` con `node-version: '20'`).

**Primary Dependencies** (todas ya en el proyecto, ninguna nueva):
- Backend: `ruff` + `black` para lint/format, `pytest` para tests.
- Frontend: `tsc` (type), `eslint` + `prettier` para lint/format,
  `vitest` para tests, `vite` para build.
- CI: sólo actions oficiales (`actions/checkout@v4`,
  `actions/setup-python@v5`, `actions/setup-node@v4`,
  `actions/cache@v4`, `actions/upload-artifact@v4`,
  `docker/setup-buildx-action@v3` para el build multi-stage).

**Storage**: N/A — esta feature no toca el modelo de datos.

**Testing**: la matriz de QA **es** lo que esta feature configura.
Concretamente se ejecuta:

| Categoría | Comando | Trigger |
|---|---|---|
| Backend lint | `ruff check backend/src backend/tests` + `black --check backend/src` | push, PR, dispatch |
| Backend tests | `pytest backend/tests --junitxml=backend-junit.xml` | push, PR, dispatch |
| Frontend typecheck | `tsc --noEmit` (vía `npm run build` en realidad lo cubre, pero lo separamos para feedback más rápido) | push, PR, dispatch |
| Frontend lint | `npm run lint` (ESLint) + `prettier --check src` | push, PR, dispatch |
| Frontend tests | `vitest run --reporter=junit --outputFile=frontend-junit.xml` | push, PR, dispatch |
| Frontend build | `npm run build` | push, PR, dispatch |
| Docker build | `docker compose build` | push a `main`, tags `v*` |
| Artifacts | `docker save \| gzip` + zip de `dist/` | push a `main`, tags `v*` |

**Target Platform**: GitHub Actions runners `ubuntu-latest`. Mismo OS
que la imagen Docker de producción (Debian-derivado), así reducimos
divergencias entre CI y prod.

**Project Type**: tooling/infraestructura del repo. **No** introduce
código en `backend/` ni `frontend/` (salvo cambios menores de comandos
en `package.json` para añadir flags JUnit reporter).

**Performance Goals**:
- ≤ 5 min de duración total en PR típico con cache caliente (objetivo
  SC-001 dice ≤ 7 min en p95, aquí apuntamos a 5 min mediana).
- Cache miss (primera ejecución o tras cambio de lockfile): ≤ 12 min
  aceptable, no bloqueante.

**Constraints**:
- Sólo actions oficiales de GitHub (FR-051): minimiza superficie de
  cadena de suministro.
- Sin secretos reales (FR-030, FR-031, FR-032): los tests usan dummy
  values y `ENV=test`.
- Sin push a registry externo: artifacts dentro del workflow run.
- Sin matriz multi-versión: una sola Python (3.11) y una sola Node
  (20 LTS).
- Sin retry de tests fallidos.

**Scale/Scope**: ≤ 50 PRs/mes proyectados → bien dentro del plan free
de Actions (2 000 minutos/mes en repos privados).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Inicial

| Principio | Evaluación | Justificación |
|---|---|---|
| **I. Anonimato del Voto** | ✅ PASS+ | Esta feature **refuerza** el Principio I: `test_vote_anonymity.py` pasa de "alguien recordó ejecutarlo en local" a "GitHub bloquea el merge si falla". La integridad del invariante queda automatizada. |
| **II. Un Voto por Persona, Atómico** | ✅ PASS+ | Idem: `test_vote_unicity.py` queda en la lista de required checks. |
| **III. Auth dominio @phicus.es** | ✅ PASS+ | Idem: `test_auth_domain.py` queda required. Adicionalmente, FR-030/031/032 blindan que CI **nunca** carga credenciales OAuth reales — refuerzo defensivo del principio. |
| **IV. Simplicidad Pragmática** | ✅ PASS | Un único YAML, dos jobs paralelos, cero composite actions propias, cero deps nuevas en el código de producción. El Makefile crece en un solo target (`ci`). |
| **V. Trazabilidad Administrativa** | ✅ PASS (N/A directo) | El audit log de admins (Principio V) no se ve afectado por CI. Sin embargo, los workflow runs de Actions son un "audit log del código" complementario: cada commit a `main` deja constancia trazable de quién lo aprobó y qué checks pasó. |

**Resultado**: ✅ Gate inicial superado. Sin violaciones. Complexity
Tracking vacío.

### Post-diseño (re-evaluación)

| Principio | Estado | Notas |
|---|---|---|
| I. Anonimato | ✅ PASS+ | El job `backend / tests` declarado en `contracts/workflow-shape.md` incluye explícitamente `test_vote_anonymity` en sus tests; el `CONTRIBUTING.md` enumera el check como required. |
| II. Atomicidad | ✅ PASS+ | Idem para `test_vote_unicity`. |
| III. Auth dominio | ✅ PASS+ | Idem para `test_auth_domain`. El YAML inyecta `ENV=test` y secretos dummy explícitamente. |
| IV. Simplicidad | ✅ PASS | El archivo `ci.yml` final estimado en ~120 líneas. Una sola carpeta nueva (`.github/workflows/`). El `quickstart.md` ocupa < 80 líneas. |
| V. Trazabilidad | ✅ PASS | Los artifacts mantienen retención GitHub default (90 días en repos privados con plan free). Suficiente para auditar despliegues. |

**Resultado post-diseño**: ✅ Gate superado. Sin desvíos.

## Project Structure

### Documentation (this feature)

```text
specs/003-ci-pipeline/
├── plan.md              # Este archivo
├── research.md          # Phase 0 — 8 decisiones técnicas
├── data-model.md        # Phase 1 — explícitamente N/A (no hay persistencia)
├── quickstart.md        # Phase 1 — cómo verificar localmente y en cloud
├── contracts/
│   ├── workflow-shape.md   # Estructura del ci.yml: jobs, dependencias, checks required
│   └── make-targets.md     # Mapping make targets ↔ jobs CI
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2 (/speckit-tasks)
```

### Source Code (adiciones al repo)

```text
.github/
└── workflows/
    └── ci.yml                  # NUEVO — el workflow único

backend/
├── pyproject.toml              # SIN CAMBIOS estructurales; comandos ya
│                                # están parametrizables (--junitxml=...)
└── (resto sin cambios)

frontend/
├── package.json                # EXTENDIDO: scripts "test:junit",
│                                # "lint:check", "format:check"
└── (resto sin cambios)

Makefile                        # EXTENDIDO: nuevo target `ci` + sub-targets
                                # consistentes con los jobs de GitHub

CONTRIBUTING.md                 # NUEVO — cómo contribuir + branch
                                # protection rules a configurar

README.md                       # EXTENDIDO: badge de CI status + link al
                                # CONTRIBUTING
```

**Structure Decision**: adición pura. No se toca código de
`backend/src/` ni `frontend/src/`. La única modificación funcional es
añadir un par de scripts en `package.json` (delegan a binarios ya
instalados) y un target en `Makefile`. Todo lo demás vive en archivos
nuevos.

## Complexity Tracking

Sin violaciones. Esta sección queda vacía a propósito.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| _(ninguna)_ | _(N/A)_ | _(N/A)_ |
