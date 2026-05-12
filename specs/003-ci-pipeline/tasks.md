---
description: "Task list for feature 003-ci-pipeline"
---

# Tasks: QA + CI en GitHub Actions

**Input**: Design documents from `/specs/003-ci-pipeline/`
**Prerequisites**: plan.md, spec.md, research.md, contracts/workflow-shape.md, contracts/make-targets.md, quickstart.md

**Tests**: esta feature **no introduce código de aplicación**, así que
no requiere tests nuevos del proyecto. La propia funcionalidad (CI
ejecutando los 47 tests backend + 9 tests frontend existentes) es lo
que se valida — los tests funcionan como contrato de aceptación
implícito de las US.

**Organization**: tareas agrupadas por user story para implementación y
prueba independientes.

> ⚠️ **Decisión clave del plan**: cero acciones de terceros (sólo
> oficiales de GitHub + `docker/setup-buildx-action`). Cero secretos
> reales. Un solo archivo YAML. Branch protection manual desde la UI,
> documentada en `CONTRIBUTING.md`.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: paralelizable (archivo distinto, sin dependencia con tarea
  no completada del mismo phase).
- **[Story]**: pertenece a una user story (US1..US4); ausente en
  Setup, Foundational y Polish.

## Path Conventions

- Pipeline: `.github/workflows/ci.yml`
- Local QA orquestación: `Makefile` (target `ci` y sub-targets)
- Docs: `CONTRIBUTING.md`, `README.md`
- Scripts backend: `backend/package.json` no existe (Python); los
  flags JUnit van en los comandos del workflow + Makefile.
- Scripts frontend: `frontend/package.json` (extender con
  `lint:check`, `format:check`, `test:ci`)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: archivos vacíos y carpetas que las user stories rellenarán.
No hay dependencias nuevas.

- [X] T001 [P] Crear directorio `.github/workflows/` con un `.gitkeep` para reservar la ruta en el repo
- [X] T002 [P] Crear esqueleto `CONTRIBUTING.md` en la raíz del repo con secciones vacías "Cómo ejecutar CI en local", "Cómo añadir un check nuevo", "Branch protection rules" — se rellenan en las phases siguientes
- [X] T003 [P] Crear `.github/CODEOWNERS` con una línea `* @jgmel @epastor` para que los admins de Phicus reciban auto-asignación de review en PRs (alineado con FR-040)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: extensiones a los manifests existentes que TODAS las user stories de 003 consumen. Sin estos, los jobs no pueden invocar los comandos.

**⚠️ CRITICAL**: ninguna user story puede empezar hasta que termine esta fase.

- [X] T004 [P] Extender `frontend/package.json` con tres scripts nuevos: `"typecheck": "tsc --noEmit"`, `"lint:check": "eslint src --max-warnings 0 && prettier --check \"src/**/*.{ts,tsx,css,html,json}\""`, `"format": "eslint src --fix && prettier --write \"src/**/*.{ts,tsx,css,html,json}\""`, `"test:ci": "vitest run --reporter=junit --outputFile=frontend-junit.xml"`. Mantener los scripts `dev`, `build`, `preview`, `test`, `lint`, `test:e2e` intactos.
- [X] T005 [P] Añadir `prettier` como dev-dependency explícita en `frontend/package.json` si no aparece ya en `devDependencies` — verificar con `npm ls prettier` desde `frontend/`; si está, no hacer nada
- [X] T006 [P] Verificar que `backend/pyproject.toml` tiene en `[project.optional-dependencies]` la sección `dev` con `pytest`, `ruff`, `black` (debe estar ya por feature 001); si falta alguno, añadirlo
- [X] T007 [P] Crear `.github/dependabot.yml` con dos `package-ecosystem` (`pip` apuntando a `backend/`, `npm` apuntando a `frontend/`), `interval: weekly`, `groups` para minor/patch para evitar PR-storm
- [X] T008 Probar localmente que los nuevos scripts del package.json funcionan: `cd frontend && npm run typecheck && npm run lint:check && npm run test:ci && npm run build` — TODOS deben pasar antes de seguir, porque CI los ejecutará exactamente igual

**Checkpoint**: Foundation lista. Verificar:

```bash
cd frontend && npm run typecheck && npm run lint:check && npm run test:ci && npm run build
# y desde la raíz
backend/.venv/bin/python -m pytest backend/tests/ -q --junitxml=/tmp/junit-smoke.xml && rm /tmp/junit-smoke.xml
```

Ambos deben terminar con exit 0.

---

## Phase 3: User Story 1 — Feedback rápido en cada Pull Request (Priority: P1) 🎯 MVP

**Goal**: cuando un developer abre un PR, ve en ≤ 7 min si su cambio rompe algo. Los 3 tests innegociables bloquean merges en rojo (vía branch protection, configurada manualmente con instrucciones en `CONTRIBUTING.md`).

**Independent Test**: abrir un PR de prueba que rompa deliberadamente un test innegociable. CI debe terminar en rojo en el job `backend`, el PR muestra ese check como required failing, y el botón "Merge" queda deshabilitado.

### Workflow YAML

- [X] T009 [US1] Crear el archivo principal `.github/workflows/ci.yml` con (a) `name: CI`, (b) bloque `on:` con `push: branches: [main], tags: ['v*']`, `pull_request: branches: [main]`, `workflow_dispatch: {}`, (c) bloque `permissions:` con `contents: read`, `actions: read`, `checks: write` (siguiendo `contracts/workflow-shape.md §Permissions`), (d) bloque `concurrency:` con `group: ci-${{ github.ref }}` y `cancel-in-progress: ${{ github.event_name == 'pull_request' }}`
- [X] T010 [US1] Añadir el job `backend` a `.github/workflows/ci.yml`: `runs-on: ubuntu-latest`, steps en orden: `actions/checkout@v4` → `actions/setup-python@v5` (con `python-version: '3.11'`, `cache: 'pip'`, `cache-dependency-path: backend/pyproject.toml`) → `pip install --upgrade pip` → `pip install -e "./backend[dev]"` → "Lint" `ruff check backend/src backend/tests` → "Format check" (`if: always()`) `black --check backend/src backend/tests` → "Tests" (`if: always()`) `pytest backend/tests --junitxml=backend-junit.xml` → "Upload JUnit" (`if: always()`) `actions/upload-artifact@v4` con `name: backend-junit-${{ github.sha }}`, `path: backend-junit.xml`, `retention-days: 14`. Definir el `env:` del job con los dummies exactos del contrato (`ENV=test`, `SESSION_SECRET=ci-dummy-secret-not-for-production`, `GOOGLE_CLIENT_ID=ci-dummy-client-id`, `GOOGLE_CLIENT_SECRET=ci-dummy-secret`, `ADMIN_EMAILS=jgomez@phicus.es,epastor@phicus.es`, `BASE_URL=http://localhost:5173`)
- [X] T011 [US1] Añadir el job `frontend` a `.github/workflows/ci.yml`: `runs-on: ubuntu-latest`, steps en orden: `actions/checkout@v4` → `actions/setup-node@v4` (con `node-version: '20'`, `cache: 'npm'`, `cache-dependency-path: frontend/package-lock.json`) → "Install" `npm --prefix frontend ci` → "Typecheck" `npm --prefix frontend run typecheck` → "Lint" (`if: always()`) `npm --prefix frontend run lint:check` → "Tests" (`if: always()`) `npm --prefix frontend run test:ci` → "Build" (`if: always()`) `npm --prefix frontend run build` → "Upload JUnit" (`if: always()`) `actions/upload-artifact@v4` con `name: frontend-junit-${{ github.sha }}`, `path: frontend/frontend-junit.xml`, `retention-days: 14`
- [X] T012 [US1] Validar local que el yaml es sintácticamente válido: ejecutar `python3 -c "import yaml,sys; yaml.safe_load(open('.github/workflows/ci.yml'))"` desde la raíz y verificar exit 0

### Documentación de branch protection

- [X] T013 [P] [US1] Rellenar la sección "Branch protection rules" de `CONTRIBUTING.md` con el procedimiento paso a paso de `quickstart.md §3`: añadir rule sobre `main`, marcar required reviews + required status checks `backend` y `frontend`, prohibir bypass de admins
- [X] T014 [P] [US1] Rellenar la sección "Cómo ejecutar CI en local" de `CONTRIBUTING.md` con el comando `make ci` (que se introduce en US3) y enlace al troubleshooting de `quickstart.md §9`

### Smoke test del PR

- [ ] T015 [US1] Tras hacer push de la rama `003-ci-pipeline` a `origin`, abrir un PR contra `main` en la UI de GitHub. Verificar que: (a) los dos jobs `backend` y `frontend` arrancan en ≤ 30 s tras el push, (b) ambos terminan en verde en ≤ 7 min asumiendo cache caliente (en el primer run será cache frío y puede llegar a 12 min — aceptable, no bloqueante), (c) los artifacts `backend-junit-*.xml` y `frontend-junit-*.xml` aparecen descargables en la sección Artifacts del run. Documentar la URL del PR de prueba en el comentario final de esta task para auditoría posterior.

**Checkpoint**: User Story 1 funcionalmente completa. El feedback loop de PR está activo. Para que el bloqueo de merge funcione, el admin del repo debe configurar branch protection una sola vez siguiendo T013 (que produce la documentación) + ejecución manual desde la UI.

---

## Phase 4: User Story 2 — Estado verificable de `main` (Priority: P2)

**Goal**: cualquier mantenedor confirma de un vistazo que `main` está en verde. Un fallo notifica al autor.

**Independent Test**: forzar un commit a `main` que rompa un test (con permisos de admin temporal saltando branch protection); verificar que (a) el workflow se ejecuta sobre ese commit, (b) el dashboard de Actions muestra "failure", (c) el autor recibe email de GitHub.

### Implementación

> US2 se completa **gratis** con T009 (triggers ya incluyen `push: branches: [main]`) y la notificación on-failure es comportamiento default de GitHub Actions. Sólo añadimos visibilidad.

- [X] T016 [P] [US2] Añadir un badge de CI al `README.md`: `![CI](https://github.com/<owner>/<repo>/actions/workflows/ci.yml/badge.svg)` justo bajo el título "Kratos", con un link al historial de Actions
- [X] T017 [P] [US2] Documentar en `CONTRIBUTING.md` (sección nueva "Cuando CI falla en main") que: (a) GitHub manda email automáticamente al autor del commit, (b) el procedimiento estándar es revertir el commit con `git revert <sha> && git push origin main` (que pasa por PR según las reglas establecidas en T013), (c) NUNCA hotfixear con commit directo en main saltando las reglas de branch protection
- [ ] T018 [US2] Smoke test (post-merge de la rama 003): comprobar que el workflow "CI" aparece en la pestaña Actions del repo con la última ejecución sobre `main` en verde tras el merge

**Checkpoint**: Stories 1 y 2 funcionando.

---

## Phase 5: User Story 3 — Paridad de QA en local (Priority: P3)

**Goal**: `make ci` reproduce CI cloud en local con divergencia ≤ 30 s (SC-004).

**Independent Test**: ejecutar `make ci` sobre `main` recién clonado tras `make install`. Debe terminar con exit 0 en ≤ 3 min. Tras introducir un fallo idéntico al de US1-2, `make ci` debe identificar el mismo test fallido con la misma cadena canónica que CI cloud.

### Extensión del Makefile

- [X] T019 [US3] Añadir target `ci-backend-lint` al `Makefile`: ejecuta `cd $(BACKEND_DIR) && $(CURDIR)/.venv/bin/ruff check src tests && $(CURDIR)/.venv/bin/black --check src tests`. Hace `@echo "→ Backend lint"` antes
- [X] T020 [US3] Añadir target `ci-backend-tests` al `Makefile`: ejecuta `cd $(BACKEND_DIR) && $(CURDIR)/$(PYTEST) tests/ -q`. Pasa flag `--junitxml=$(BACKEND_DIR)/backend-junit.xml` SÓLO si la env var `JUNIT=1` está set
- [X] T021 [US3] Añadir target `ci-backend` al `Makefile` que orquesta `ci-backend-lint` + `ci-backend-tests` secuencialmente con `set -e; <cmd1>; <cmd2>` para que continúe tras el primer fallo y reporte ambos (estilo `if: always()` del workflow)
- [X] T022 [US3] Añadir target `ci-frontend-typecheck` al `Makefile`: `cd $(FRONTEND_DIR) && $(NPM) run typecheck`
- [X] T023 [US3] Añadir target `ci-frontend-lint` al `Makefile`: `cd $(FRONTEND_DIR) && $(NPM) run lint:check`
- [X] T024 [US3] Añadir target `ci-frontend-tests` al `Makefile`: `cd $(FRONTEND_DIR) && $(NPM) run test`
- [X] T025 [US3] Añadir target `ci-frontend-build` al `Makefile`: `cd $(FRONTEND_DIR) && $(NPM) run build`
- [X] T026 [US3] Añadir target `ci-frontend` que orquesta los 4 sub-targets frontend secuencialmente con la misma semántica `if: always()` que `ci-backend`
- [X] T027 [US3] Añadir target principal `make ci` que: (a) exporta las env vars dummy del contrato (`ENV=test`, `SESSION_SECRET=ci-dummy-secret-not-for-production`, etc.), (b) ejecuta `ci-backend` y `ci-frontend` secuencialmente acumulando exit codes en una variable, (c) al final imprime el resumen estilo `─── CI summary ───` con ✓/✗ por sub-target, (d) sale con exit code 0 sólo si todos los sub-targets pasaron, no-cero si alguno falló. Implementarlo como recipe shell de varias líneas o como script bash inline.
- [X] T028 [US3] Añadir target `make format` al `Makefile` que ejecuta `cd $(BACKEND_DIR) && $(CURDIR)/.venv/bin/ruff check --fix src tests && $(CURDIR)/.venv/bin/black src tests && cd $(CURDIR)/$(FRONTEND_DIR) && $(NPM) run format` (alias de los formatters). NO se invoca desde `make ci`.
- [X] T029 [US3] Actualizar el bloque `.PHONY` y la salida de `make help` para reflejar los nuevos targets `ci`, `ci-backend`, `ci-frontend`, `ci-backend-lint`, `ci-backend-tests`, `ci-frontend-typecheck`, `ci-frontend-lint`, `ci-frontend-tests`, `ci-frontend-build`, `format`
- [X] T030 [US3] Smoke test local del paridad: ejecutar `make ci` desde la raíz limpia tras `make install`. Verificar exit 0 y ≤ 3 min. Romper deliberadamente un test (p.ej. `assert 1 == 2` en `test_vote_anonymity.py`) y verificar que `make ci` falla nombrando el test con la misma cadena canónica que GitHub Actions (`tests/integration/test_vote_anonymity.py::<name>`). **REVERTIR** el cambio antes de continuar.

**Checkpoint**: Stories 1, 2 y 3 operativas. El developer ya puede iterar en local con paridad total.

---

## Phase 6: User Story 4 — Artefactos descargables (Priority: P4)

**Goal**: cada ejecución verde en `main` o tag `v*` deja Docker tarball + dist zip como artifacts descargables.

**Independent Test**: tras un merge verde a `main`, abrir el run en Actions y verificar que la sección Artifacts tiene `kratos-image-<sha>.tar.gz` y `frontend-dist-<sha>.zip`. `docker load -i kratos-image-<sha>.tar.gz` debe registrar la imagen.

### Workflow extendido

- [X] T031 [US4] Añadir el job `docker-build` a `.github/workflows/ci.yml`: `runs-on: ubuntu-latest`, `needs: [backend, frontend]`, condición `if: github.ref == 'refs/heads/main' || startsWith(github.ref, 'refs/tags/v')`, steps: `actions/checkout@v4` → `docker/setup-buildx-action@v3` → `docker compose build` → `docker save kratos-phicus:latest | gzip > kratos-image.tar.gz` → `actions/upload-artifact@v4` con `name: kratos-image-${{ github.sha }}`, `path: kratos-image.tar.gz`, `retention-days: 90`
- [X] T032 [US4] Extender el step "Build" del job `frontend` (T011): cuando la condición `github.ref == 'refs/heads/main' || startsWith(github.ref, 'refs/tags/v')` se cumpla, añadir un step adicional `actions/upload-artifact@v4` con `name: frontend-dist-${{ github.sha }}`, `path: frontend/dist/`, `retention-days: 90`. Implementar el condicional en el step (no en el job) para no duplicar el job.
- [X] T033 [P] [US4] Documentar en `CONTRIBUTING.md` la sección "Descargar artifacts de un release" con el procedimiento `gh run download <run-id>` y `docker load -i kratos-image-<sha>.tar.gz`, copiando de `quickstart.md §5`
- [ ] T034 [US4] Smoke test artifacts: tras el merge del PR de esta feature, esperar a que CI corra en `main` y verificar manualmente que (a) ambos artifacts están presentes con retención 90 días, (b) descargar el tarball, ejecutar `docker load -i` localmente y comprobar `docker image ls | grep kratos-phicus` muestra la imagen recién cargada

**Checkpoint**: todas las user stories operativas.

---

## Phase 7: Polish & Cross-Cutting

**Purpose**: refinamientos finales, verificación cruzada y limpieza.

- [X] T035 [P] Añadir badge de "PRs welcome" / link a `CONTRIBUTING.md` al `README.md` en la cabecera, además del badge de CI de T016
- [X] T036 [P] Validar `.github/workflows/ci.yml` final con un linter de Actions: ejecutar `npx --yes action-validator ./.github/workflows/ci.yml` y verificar 0 errores. Si `action-validator` no está disponible, hacer `gh workflow view CI --yaml` desde el repo tras el primer push y verificar que GitHub no marca errores en la pestaña Actions.
- [X] T037 [P] Limpiar: eliminar `.github/workflows/.gitkeep` creado en T001 (ya no necesario porque `ci.yml` ocupa la carpeta)
- [X] T038 [P] Auditar el yaml manualmente para verificar las invariantes constitucionales: (a) cero referencias `${{ secrets.* }}` a credenciales reales, (b) cero uso de `actions/*` fuera de las oficiales (excepción autorizada: `docker/setup-buildx-action`), (c) el job `backend` ejecuta `pytest backend/tests/` sin flags de exclusión (`-k`, `--ignore`) que dejarían fuera los 3 tests innegociables
- [X] T039 [P] Verificar paridad SC-004: ejecutar `make ci` local y `gh run watch` simultáneos sobre el mismo commit. La divergencia en líneas de output (ignorando timestamps y duración) debe ser ≤ 30 segundos de diff cuando se ejecutan `diff <(local) <(remote)` en las salidas de tests
- [ ] T040 Ejecutar `/speckit-analyze` con tasks completas para verificación cruzada final spec ↔ plan ↔ tasks de feature 003

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: arranca de inmediato.
- **Foundational (Phase 2)**: depende de Setup. **Bloquea** las user stories porque el yaml de CI invoca los scripts npm nuevos definidos en T004.
- **US1, US2**: dependen de Phase 2. US2 se completa "gratis" tras US1 + visibilidad (badge + docs).
- **US3**: depende de Phase 2 y de US1 (necesita conocer los comandos exactos del workflow para reproducirlos en Makefile).
- **US4**: depende de US1 (extiende el yaml ya creado).
- **Polish (Phase 7)**: depende de tener todas las user stories cerradas.

### User Story Dependencies

- **US1 (P1, MVP)**: depende de Phase 2.
- **US2 (P2)**: depende de US1 (T016 referencia el badge que apunta al workflow de US1).
- **US3 (P3)**: depende de US1 (debe reproducir los mismos comandos del workflow).
- **US4 (P4)**: depende de US1 (extiende el yaml).

### Within Each User Story

- En US1: T009 (skeleton del yaml) ANTES de T010/T011 (jobs); T012 (validación sintáctica) tras T009-T011; T013/T014 (docs) en paralelo con jobs; T015 (smoke real) al final.
- En US3: T019-T025 son `[US3]` no `[P]` entre sí porque todos tocan el mismo archivo `Makefile`. Aunque los targets son independientes lógicamente, escribir el Makefile linealmente evita conflictos de edición.
- En US4: T031 ANTES de T032 (T032 referencia la condición que T031 introduce); T033 puede hacerse en paralelo.

### Parallel Opportunities

- **Phase 1**: T001-T003 todos `[P]`.
- **Phase 2**: T004-T007 todos `[P]` (archivos distintos). T008 secuencial tras los anteriores.
- **US1**: T013, T014 `[P]` en docs mientras T009-T012 trabajan el yaml.
- **US2**: T016, T017 `[P]` en docs/README.
- **US4**: T033 `[P]` con T031/T032.
- **Phase 7**: T035-T039 todos `[P]`; T040 al final.

### Equipo paralelo

Esta feature es pequeña — **1 sola persona** la completa en ~3-4 horas
de trabajo enfocado. Si fueran dos:

- Dev A: US1 + US4 (todo lo del yaml)
- Dev B: US3 (Makefile) + docs (CONTRIBUTING.md, README badges)

---

## Parallel Example: Phase 2 foundational

```bash
# Todos en paralelo, archivos distintos:
Task: "Extender frontend/package.json con scripts typecheck/lint:check/test:ci/format"   # T004
Task: "Añadir prettier como devDependency si falta"                                       # T005
Task: "Verificar backend/pyproject.toml tiene dev deps"                                   # T006
Task: "Crear .github/dependabot.yml"                                                       # T007
```

Tras estos cuatro, secuencialmente:

```bash
Task: "Smoke local: verificar que los scripts nuevos pasan"                                # T008
```

## Parallel Example: US1 docs

```bash
# Mientras T009-T011 escriben el yaml, en paralelo:
Task: "Rellenar 'Branch protection rules' en CONTRIBUTING.md"                              # T013
Task: "Rellenar 'Cómo ejecutar CI en local' en CONTRIBUTING.md"                            # T014
```

---

## Implementation Strategy

### MVP First (US1 sólo)

1. Phase 1 completa (T001-T003).
2. Phase 2 completa (T004-T008). Si T008 (smoke local) falla, NO se sigue
   — significa que la matriz local no está estable, y CI tampoco lo
   estará.
3. Phase 3 — US1 (T009-T015): se obtiene el feedback loop de PR.
4. Configurar branch protection siguiendo T013 (que produce la doc).
5. Demo: abrir un PR cualquiera, ver el dashboard de Actions con `backend`
   y `frontend` en verde, intentar mergear con un check en rojo y ver el
   botón "Merge" bloqueado.

A partir de aquí, US2/US3/US4 se entregan incrementalmente sin urgencia.

### Entrega incremental

1. MVP (US1) → feedback de PR + branch protection lista para activar
2. US2 → visibilidad de main + procedimiento para fallos en main
3. US3 → `make ci` para iterar más rápido en local
4. US4 → artifacts descargables para deploys manuales

### Plan de una persona, una tarde

Estimación realista (single dev, asumiendo familiaridad con GitHub Actions):

| Bloque | Tareas | Tiempo |
|---|---|---|
| Setup + Foundational | T001-T008 | 30 min |
| US1 yaml + docs | T009-T015 | 90 min (incluye 1 cache cold de CI ~12 min mientras se hace otra cosa) |
| US2 badge + docs | T016-T018 | 15 min |
| US3 Makefile completo | T019-T030 | 60 min |
| US4 docker-build + artifacts | T031-T034 | 30 min (más espera de smoke) |
| Polish | T035-T040 | 20 min |
| **Total** | 40 tareas | **~4 horas activas** |

---

## Notes

- `[P]` = archivo distinto sin dependencias en tareas no completadas del mismo phase.
- **No hay tests innegociables propios** de esta feature. Lo que se valida es **que los tests innegociables existentes (Principios I/II/III, ya implementados en feature 001) se ejecutan en cada PR** y se marcan como required.
- El éxito se mide por: (a) un PR de prueba que rompa `test_vote_anonymity` queda bloqueado para merge (verificación de US1), (b) badge de CI verde en `main` (verificación de US2), (c) `make ci` exit 0 en local con paridad (verificación de US3), (d) artifacts descargables (verificación de US4).
- Tras todas las phases, **el cumplimiento de los Principios I/II/III de la constitución pasa de "verificado por disciplina" a "verificado por plataforma"** — un salto cualitativo grande.
- T040 (`/speckit-analyze`) es opcional pero recomendado antes de mergear la rama: permite confirmar que no quedan FRs sin tarea ni tareas huérfanas.
