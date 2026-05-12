# Contrato: Makefile targets ↔ CI jobs

**Branch**: `003-ci-pipeline` · **Date**: 2026-05-12

Este documento fija el mapping entre los targets del `Makefile`
(invocables en local) y los jobs/steps del workflow de GitHub Actions.
El YAML es la fuente de verdad; el Makefile debe ejecutar **los mismos
comandos** subyacentes.

## Mapping

| Make target | Comando equivalente | Job CI correspondiente |
|---|---|---|
| `make ci` | (orquesta los siguientes en orden) | (workflow completo) |
| `make ci-backend` | (orquesta backend-lint + backend-tests) | job `backend` |
| `make ci-frontend` | (orquesta frontend-typecheck + lint + tests + build) | job `frontend` |
| `make ci-backend-lint` | `ruff check backend/src backend/tests && black --check backend/src backend/tests` | step "Lint check" + "Format check" en `backend` |
| `make ci-backend-tests` | `pytest backend/tests` (sin `--junitxml` por defecto en local; flag opcional vía `JUNIT=1`) | step "Tests" en `backend` |
| `make ci-frontend-typecheck` | `cd frontend && npx tsc --noEmit` | step "Typecheck" en `frontend` |
| `make ci-frontend-lint` | `cd frontend && npm run lint && npx prettier --check 'src/**/*.{ts,tsx,css,html,json}'` | step "Lint" en `frontend` |
| `make ci-frontend-tests` | `cd frontend && npm run test` (vitest run) | step "Tests" en `frontend` |
| `make ci-frontend-build` | `cd frontend && npm run build` | step "Build" en `frontend` |
| `make format` | `ruff check --fix backend/src backend/tests && black backend/src backend/tests && cd frontend && npx prettier --write 'src/**/*.{ts,tsx,css,html,json}'` | **N/A** — sólo local. CI no auto-formatea (research.md §8). |

## Comportamiento de `make ci`

`make ci` debe:

1. Detectar venv backend e instalación frontend; si faltan, sugerir
   `make install` y abortar (NO instalar automáticamente para
   reproducir el aislamiento de CI).
2. Ejecutar `make ci-backend` y `make ci-frontend` **secuencialmente**
   en local (sin paralelismo de procesos para no enredar logs).
3. Si cualquier sub-target falla, **continuar** con los demás (con
   `-k` o equivalente al estilo `if: always()` de Actions) para dar
   feedback completo, y luego salir con exit code agregado (0 sólo si
   todos pasaron).
4. Imprimir un resumen al final:

```
─── CI summary ─────────────────────────────────────────
✓ backend-lint
✗ backend-tests (1 failed)
✓ frontend-typecheck
✓ frontend-lint
✓ frontend-tests
✓ frontend-build
─────────────────────────────────────────────────────────
Exit code: 1 (1 sub-target failed)
```

5. Salir con código 0 si y sólo si todos los sub-targets pasaron.

## Variables que `make ci` exporta

Las mismas que el workflow inyecta (contracts/workflow-shape.md §1
`env`):

```bash
export ENV=test
export SESSION_SECRET=ci-dummy-secret-not-for-production
export GOOGLE_CLIENT_ID=ci-dummy-client-id
export GOOGLE_CLIENT_SECRET=ci-dummy-secret
export ADMIN_EMAILS=jgomez@phicus.es,epastor@phicus.es
export BASE_URL=http://localhost:5173
```

Esto garantiza la paridad de SC-004.

## Compatibilidad con targets existentes

El `Makefile` actual ya tiene:

- `make test` → ejecuta `make test-backend test-frontend`. Se mantiene
  como atajo "ejecuta los tests" (alias humano).
- `make test-backend`, `make test-frontend` → pytest y vitest.
- `make typecheck`, `make lint` → typecheck y eslint del frontend.
- `make build` → `make build-frontend` + copia a static.

**`make ci` no sustituye a éstos**; los **compone** en el orden y con
el entorno exacto que ejecuta el workflow. Los targets existentes
siguen siendo accesos directos para tareas individuales en desarrollo.

## Anti-patrones

- **NO** introducir paralelismo (`make -j`) en `make ci`: dificulta
  leer logs y no hay beneficio real para un single-dev local.
- **NO** instalar dependencias automáticamente desde `make ci`. Eso
  oculta problemas de setup. Si falta venv/node_modules → exit con
  mensaje claro.
- **NO** mezclar `make ci` con `make format`. Si quieres autofix:
  `make format && make ci`.
