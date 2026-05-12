# Feature Specification: QA + CI en GitHub Actions

**Feature Branch**: `003-ci-pipeline`
**Created**: 2026-05-12
**Status**: Draft
**Input**: User description: "qa del proyecto y ci para github actions"

> Esta feature **no añade funcionalidad de producto**. Define qué entendemos
> por "código entregable" (matriz QA) y automatiza esa verificación en
> GitHub Actions para que ningún cambio merge a `main` sin pasar los
> controles innegociables de la constitución (Principios I, II y III).
>
> Los "actores" de esta spec son los **desarrolladores y mantenedores** del
> proyecto, no usuarios finales.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Feedback rápido en cada Pull Request (Priority: P1)

Cuando un desarrollador abre un PR contra `main`, GitHub muestra el
estado de la verificación automatizada en menos de 10 minutos: tests,
lint, formato, type-check y build. Si los tres tests innegociables de la
constitución (`test_vote_anonymity`, `test_vote_unicity`,
`test_auth_domain`) fallan, el PR queda **bloqueado** para merge.

**Why this priority**: el flujo de PR es el momento donde más caro sale
romper algo. Sin esta historia, la única validación es la disciplina
manual del autor, lo que no escala ni siquiera con dos administradores.
Es el corazón de la propuesta de valor de esta feature.

**Independent Test**: abrir un PR con un cambio que rompa
deliberadamente uno de los tres tests innegociables; GitHub Actions debe
marcar el check correspondiente en rojo, y la UI de GitHub debe impedir
hacer "Merge" hasta que se arregle.

**Acceptance Scenarios**:

1. **Given** un PR que añade un archivo trivial sin afectar tests,
   **When** se abre el PR, **Then** los checks de CI arrancan
   automáticamente y todos los jobs terminan en verde en
   ≤ 10 minutos (asumiendo cache caliente).
2. **Given** un PR que rompe deliberadamente `test_vote_anonymity`,
   **When** se ejecuta CI, **Then** el job de tests termina en rojo
   con el nombre del test fallido visible en la salida del runner; el
   resumen del PR muestra el check fallido como **required**.
3. **Given** un PR con error de tipo (`tsc --noEmit` falla) o de lint
   (`ruff` o `eslint` falla), **When** se ejecuta CI, **Then** el
   job correspondiente termina en rojo con la línea/regla concreta.
4. **Given** los checks en rojo, **When** un mantenedor intenta usar
   el botón "Merge pull request" desde la UI de GitHub, **Then** el
   botón está deshabilitado o muestra "Required statuses must pass".
5. **Given** un PR sólo cambia archivos en `frontend/`,
   **When** corre CI, **Then** los jobs irrelevantes (p. ej. tests
   backend) **igualmente se ejecutan** para evitar regresiones por
   dependencias cruzadas (el cliente API tipado vive en frontend pero
   refleja schemas backend). No se introduce path-filtering en esta
   feature.

---

### User Story 2 - Estado verificable de `main` (Priority: P2)

Cualquier mantenedor puede confirmar de un vistazo, abriendo la pestaña
"Actions" del repo en GitHub, que `main` está en verde. Un fallo en
`main` produce notificación automática al primer autor del commit que
rompió la cadena.

**Why this priority**: la confianza en `main` es lo que permite hacer
release/deploy sin miedo. La notificación on-failure cubre el caso
"alguien mergea con conflicto post-rebase" donde los checks del PR ya
no son representativos del estado final.

**Independent Test**: forzar un commit directo a `main` (con permisos de
admin del repo) que rompa un test; GitHub Actions debe ejecutar el
workflow contra ese commit y el dashboard de Actions debe mostrar
"failure" en la fila correspondiente. El autor del commit (campo
`commit.author.email`) debe recibir email de GitHub.

**Acceptance Scenarios**:

1. **Given** un commit recién mergeado a `main`, **When** se navega a
   la pestaña Actions, **Then** aparece la ejecución de "CI · main"
   en la primera fila con su estado actualizado.
2. **Given** un commit en `main` que rompe CI, **When** termina el
   workflow, **Then** el autor recibe email de GitHub con asunto
   "Failed run" y link al log.

---

### User Story 3 - Paridad de QA en local (Priority: P3)

Un desarrollador puede ejecutar **el mismo conjunto exacto de checks**
en su máquina con un único comando (`make ci`), en el mismo orden, sin
necesidad de abrir un PR. Si pasa en local, pasa en CI; si falla en CI
y no en local, hay un bug en la paridad y se trata como tal.

**Why this priority**: reduce el ciclo "abro PR, CI falla, vuelvo a
local, push, espero 10 min, …". Útil pero no bloqueante: alguien puede
trabajar sólo abriendo PRs y mirando GitHub.

**Independent Test**: ejecutar `make ci` sobre `main`; debe terminar con
exit code 0. Tras introducir un fallo local idéntico al del escenario
US1-2, `make ci` debe fallar con el mismo test nombrado de la misma
forma que en GitHub Actions.

**Acceptance Scenarios**:

1. **Given** una checkout limpia de `main` y `make install` hecho,
   **When** se ejecuta `make ci`, **Then** termina con exit code 0 en
   ≤ 3 minutos (más rápido que el CI cloud porque salta la fase de
   provisioning y comparte caches locales).
2. **Given** un fallo deliberado, **When** se ejecuta `make ci` y
   luego CI cloud sobre el mismo commit, **Then** ambos identifican
   el mismo job + test fallido con el mismo nombre canónico (p. ej.
   `tests/integration/test_vote_unicity.py::test_concurrent_double_votes_yield_exactly_one_receipt`).

---

### User Story 4 - Artefactos descargables al pasar CI (Priority: P4)

Cada ejecución verde de CI en `main` (o sobre un tag `v*`) deja como
**artifact** del workflow el bundle de producción listo para desplegar:
la imagen Docker exportada como tarball + el `frontend/dist/` zipado.

**Why this priority**: facilita los despliegues manuales (descargar
artifact → `docker load` → arrancar) sin requerir un registry externo.
No es crítico — `make docker-build` local sigue funcionando.

**Independent Test**: tras una ejecución verde sobre `main`, en la
pestaña Actions abrir el run y verificar que la sección "Artifacts"
ofrece descarga de (a) `kratos-image-<sha>.tar` y (b)
`frontend-dist-<sha>.zip`. Re-cargar el tarball localmente con
`docker load -i kratos-image-<sha>.tar` debe registrar la imagen
correspondiente.

**Acceptance Scenarios**:

1. **Given** un commit verde en `main`, **When** termina CI,
   **Then** los dos artifacts están publicados durante al menos 7 días
   (retención por defecto de GitHub Actions).
2. **Given** un push de tag `v0.2.0`, **When** termina CI, **Then**
   además se publica el mismo conjunto de artifacts asociado al tag,
   visible desde la página "Releases" si se promueve manualmente.

---

### Edge Cases

- **Cache fría**: la primera ejecución tras un cambio de versión de
  dependencias puede tardar > 10 minutos; aceptable y no se considera
  fallo de SC-001.
- **Tests flaky**: cualquier test que falle intermitentemente debe
  arreglarse, no re-intentarse en silencio. CI **no** reintenta tests
  fallidos automáticamente.
- **PR de Dependabot**: los PR automáticos de actualizaciones de
  dependencias también pasan por CI con el mismo conjunto de checks;
  si fallan, no se mergean hasta arreglar.
- **Repo sin permisos para artifacts**: si por alguna razón GitHub
  Actions no puede subir artifact (cuota, etc.), el job correspondiente
  marca warning pero **no** rompe el workflow; los demás checks siguen
  siendo required.
- **Cambio en la lista de tests innegociables**: si la constitución
  añade un cuarto principio con su test asociado, el workflow debe
  actualizarse en el mismo PR; el spec no fija los nombres en piedra,
  pero sí la regla "todos los tests del principio constitucional son
  required".
- **Sin secretos en CI**: las credenciales reales de Google OAuth
  **NUNCA** se cargan en CI; los tests usan valores dummy y el endpoint
  `/auth/test/login` (sólo disponible con `ENV=test`). Cualquier intento
  de leer un secret real desde un job debe fallar.

## Requirements *(mandatory)*

### Functional Requirements

#### Trigger y ámbito

- **FR-001**: El sistema MUST disponer de **un workflow de CI**
  ejecutado en cada uno de estos eventos: (a) push a `main`,
  (b) creación o actualización de Pull Request contra `main`,
  (c) creación de tag `v*`.
- **FR-002**: El workflow MUST poderse re-lanzar manualmente desde la
  UI de GitHub Actions sin abrir un PR ("workflow_dispatch").

#### Matriz QA mínima ejecutada por CI

- **FR-010**: El workflow MUST ejecutar, en jobs separados o agrupados
  según convenga:
  - `backend-lint` (lint + format check del backend)
  - `backend-typecheck` (sólo si la stack tiene type checker;
    si no lo tiene, este check se documenta como opcional)
  - `backend-tests` (todos los tests backend, NO sólo los obligatorios)
  - `frontend-lint` (lint + format check del frontend)
  - `frontend-typecheck`
  - `frontend-tests` (unit/componente, NO E2E)
  - `frontend-build` (build de producción)
  - `docker-build` (sólo en `main` y tags `v*`; en PR puede saltarse)
- **FR-011**: El workflow MUST cachear las dependencias entre
  ejecuciones para que un PR típico termine en ≤ 5 minutos (objetivo
  SC-001).
- **FR-012**: Los tres tests innegociables de la constitución
  (`test_vote_anonymity`, `test_vote_unicity`, `test_auth_domain`)
  MUST identificarse en la salida del workflow como **bloqueantes** y
  configurarse en GitHub branch protection como "required status
  checks" para `main`.
- **FR-013**: Si cualquier check required falla, GitHub MUST impedir
  el merge del PR mediante branch protection rules. La configuración
  de protección queda documentada en el repo (no es código, pero la
  documentación es entregable de esta feature).
- **FR-014**: El workflow MUST publicar como artifact (a) el bundle
  de la imagen Docker (`docker save | gzip`) y (b) el `frontend/dist/`
  en cada ejecución verde sobre `main` o tags `v*`.

#### Paridad local

- **FR-020**: El repositorio MUST exponer un target `make ci` que
  ejecute exactamente la misma matriz de checks del workflow, en el
  mismo orden lógico (lint → typecheck → tests → build), con los
  mismos comandos subyacentes.
- **FR-021**: La salida de `make ci` MUST nombrar los tests fallidos
  con la misma cadena canónica que el workflow remoto, de forma que un
  developer pueda copiar/pegar el nombre desde GitHub Actions a su
  terminal local y reproducir el fallo.
- **FR-022**: `make ci` MUST poder ejecutarse offline tras un
  `make install` previo (no requiere red salvo para resolver el set
  inicial de dependencias).

#### Seguridad y secretos

- **FR-030**: El workflow MUST NUNCA cargar `GOOGLE_CLIENT_ID`,
  `GOOGLE_CLIENT_SECRET` ni `SESSION_SECRET` reales. Para los tests,
  usa valores dummy fijados en el propio workflow (`ENV=test`).
- **FR-031**: Cualquier secret necesario en el futuro (registry de
  contenedores, etc.) se carga vía **GitHub Secrets** y se referencia
  con `${{ secrets.X }}`, nunca codeado en el yaml.
- **FR-032**: El workflow NO debe exponer logs que incluyan tokens,
  cookies de sesión, ni el contenido de `.env`.

#### Notificaciones y visibilidad

- **FR-040**: Un fallo en `main` MUST resultar en notificación de
  GitHub al autor del commit (comportamiento default de GitHub
  Actions; no requiere configuración adicional, pero debe verificarse).
- **FR-041**: La duración mediana de los workflows MUST ser observable
  desde la pestaña Actions sin instrumentación adicional.

#### Mantenibilidad del workflow

- **FR-050**: El YAML del workflow MUST quedar en un único archivo
  (`.github/workflows/ci.yml`) o, como máximo, dos archivos si separar
  el flujo de tags lo simplifica. Sin abstracciones reutilizables
  (composite actions propias, etc.) en esta primera iteración —
  Principio IV (Simplicidad).
- **FR-051**: El workflow NO debe depender de actions de terceros que
  no sean (a) las oficiales de GitHub (`actions/checkout`,
  `actions/setup-*`, `actions/cache`, `actions/upload-artifact`) o
  (b) imágenes Docker oficiales. Razón: minimizar superficie de
  suministro.

### Key Entities

Esta feature no introduce nuevas entidades persistentes. Las entidades
relevantes son operativas:

- **Workflow run**: ejecución de CI sobre un commit concreto. Identidad:
  `(repo, workflow, run_number)`. Visible en GitHub Actions.
- **Status check**: resultado individual de un job. Identidad:
  `(commit_sha, check_name)`. Es lo que GitHub usa para required.
- **Artifact**: archivo subido al final de un job verde. Identidad:
  `(workflow_run, artifact_name)`. Retención por defecto 7-90 días
  según configuración.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El **95% de los PRs** completan la matriz CI en **≤ 7
  minutos** desde el push del último commit, asumiendo cache caliente
  (verificable consultando los percentiles de duración en la pestaña
  Actions tras 4 semanas de uso).
- **SC-002**: El **100% de los merges** a `main` durante el primer mes
  tras la adopción han pasado los tres tests innegociables (verificable
  inspeccionando el log de Actions y la branch protection history).
- **SC-003**: **0 PRs** mergeados con CI en rojo desde el día en que
  se activa branch protection con required checks (verificable con
  `gh pr list --state merged --json statusCheckRollup`).
- **SC-004**: La divergencia entre `make ci` (local) y CI cloud sobre
  el mismo commit es **≤ 30 segundos** de output diff (medible
  comparando salidas; tolera diferencias en duración y formato de
  timestamps).
- **SC-005**: Un nuevo contribuidor puede abrir su primer PR válido en
  **≤ 30 minutos** desde el clone, siguiendo sólo el README, e
  identificar por qué falló (si falla) sin pedir ayuda.

## Assumptions

- **Hosting del repo**: el repositorio está o estará en **GitHub** (no
  GitLab/Gitea/etc.); CI tiene sentido sólo en ese contexto.
- **Plan de GitHub**: el repo dispone del plan free de Actions (2.000
  minutos/mes para repos privados, ilimitado para públicos), suficiente
  para el volumen previsto (≤ 50 PRs/mes).
- **Sin deploy automatizado**: esta feature **NO** despliega a
  producción automáticamente. El despliegue sigue siendo manual
  (descargar artifact, `docker load`, arrancar). La razón es el
  Principio IV: el despliegue es lo suficientemente raro (una vez por
  ciclo de votación) para no automatizarlo todavía.
- **Sin registry externo**: no se publica la imagen a Docker Hub ni a
  GHCR. Si más adelante se necesita, se hace en una feature aparte.
- **Sin cobertura mínima obligatoria**: se genera reporte de cobertura
  para visibilidad, pero no se exige un umbral. Razón: la métrica de
  calidad real son los tres tests innegociables, no el % de
  cobertura.
- **E2E Playwright queda fuera del MVP de CI**: los browsers de
  Playwright son pesados de cachear y el test E2E actual requiere el
  backend arriba con `ENV=test`. Se documenta cómo añadirlo en una
  iteración futura.
- **Lint y format en check-only**: el CI **comprueba** que el código
  está bien formateado, no lo reformatea. Si el check falla, el
  desarrollador ejecuta `make format` (o equivalente) en local.
- **Tests deterministas**: no hay reintentos automáticos en CI. Si un
  test falla "a veces", se considera bug del test y se arregla, no se
  oculta con `--retry`.
- **Branch protection se configura desde la UI de GitHub** la primera
  vez (no como código todavía); las reglas se documentan en un
  `CONTRIBUTING.md` o en el `README` para que cualquier admin del repo
  pueda recrearlas.
- **Idioma de los mensajes de error en logs**: se mantienen en inglés
  por convención de las herramientas (`ruff`, `eslint`, `pytest`,
  `tsc`); las copys del producto siguen en español.
- **Python y Node versions** fijadas: la matriz de CI usa una versión
  fija de Python y otra de Node (las mismas declaradas en
  `pyproject.toml` y `package.json`), no una matriz multi-versión. Si
  el día de mañana queremos verificar compatibilidad con varias
  versiones, será otra feature.
- **Workflow YAML como única fuente de verdad operativa**: las
  instrucciones del Makefile (`make ci`) reproducen lo del YAML pero
  el YAML manda en caso de discrepancia.
