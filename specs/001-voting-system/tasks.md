---
description: "Task list for feature 001-voting-system"
---

# Tasks: Kratos

**Input**: Design documents from `/specs/001-voting-system/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/openapi.yaml, design-system.md, design-brief.md

**Tests**: Sólo se incluyen tests que son **obligatorios por constitución**
(Principios I, II, III — `test_vote_anonymity`, `test_vote_unicity`,
`test_auth_domain`) más los necesarios para validar los flujos críticos
de cada user story. El resto de tests adicionales son opcionales.

**Organization**: Tareas agrupadas por user story para implementación y
prueba independientes.

**Design integration**: el bundle generado por Claude Design se ha
extraído en `specs/001-voting-system/design/` (prototipo HTML/JSX,
`design-system.md`). Los tokens y la config de Tailwind ya están en
`frontend/src/styles/design-tokens.css` y `frontend/tailwind.config.js`
respectivamente. Las tareas de UI **portan** los componentes del prototipo
a React/TypeScript tipado, **no** reinventan el sistema visual.

> ⚠️ **Decisiones derivadas del proceso (resolución de hallazgos
> `/speckit-analyze` previos)**:
> - **C2 (path del CSV semilla)**: T007 copia el CSV original de la raíz
>   del repo a `backend/data/seed/proposals.csv`, alineando con
>   `quickstart.md`.
> - **C3 (crear propuestas manualmente)**: el design assume sí en
>   Admin/Proposals. Se añade endpoint `POST /api/admin/proposals` (T050)
>   y actualización del OpenAPI (T051).

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: paralelizable (archivo distinto, sin dependencia con tarea no
  completada del mismo phase)
- **[Story]**: pertenece a una user story (US1..US4); ausente en Setup,
  Foundational y Polish.

## Path Conventions

- Backend: `backend/src/kratos/...`, tests en `backend/tests/{contract,integration,unit}/`
- Frontend: `frontend/src/...`, tests en `frontend/tests/{component,e2e}/`
- Design source: `specs/001-voting-system/design/...` (sólo referencia)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Inicializar estructura de proyecto y dependencias compartidas.

- [X] T001 Crear estructura `backend/` con `pyproject.toml` (Python 3.11+, deps: fastapi, uvicorn[standard], pydantic, authlib, itsdangerous, httpx, python-multipart, python-dotenv; dev: pytest, pytest-asyncio, httpx) en `backend/pyproject.toml`
- [X] T002 Crear estructura `frontend/` con `package.json` (react 18, react-router-dom 6, typescript 5.4, vite 5, tailwindcss 3, @tailwindcss/forms, lucide-react, zod; dev: vitest, @testing-library/react, @playwright/test, eslint, prettier) en `frontend/package.json`
- [X] T003 [P] Configurar `backend/pyproject.toml` con ruff + black (ruff: select E,F,I,B,UP; line-length 100)
- [X] T004 [P] Configurar `frontend/.eslintrc.cjs` + `frontend/.prettierrc` (eslint con typescript-eslint, prettier 100 cols)
- [X] T005 [P] Crear `Dockerfile` multi-stage en `Dockerfile` (stage 1: node:20 → `pnpm build` del frontend; stage 2: python:3.11-slim → copia `frontend/dist` a `backend/src/kratos/static/`; CMD uvicorn)
- [X] T006 [P] Crear `docker-compose.yml` (un servicio `kratos`, volumen `./data:/app/backend/data`, healthcheck en `/api/period`)
- [X] T007 [P] Crear `.env.example` en raíz con `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `SESSION_SECRET`, `ADMIN_EMAILS=jgomez@phicus.es,epastor@phicus.es`, `DB_PATH=./data/voting.db`, `ENV=development`
- [X] T008 [P] Copiar CSV semilla del Google Form (`Formulario sin título (respuestas) - Respuestas de formulario 1.csv` en raíz) a `backend/data/seed/proposals.csv`
- [X] T009 [P] Crear `.gitignore` (entradas: `data/voting.db*`, `.env`, `__pycache__/`, `node_modules/`, `frontend/dist/`, `backend/src/kratos/static/`, `.venv/`, `*.bin`, `/tmp/phicus-design/`) y `.dockerignore` paralelo
- [X] T010 [P] Configurar `frontend/vite.config.ts` con proxy `/api` y `/auth` → `http://localhost:8000` y alias `@` → `src/`
- [X] T011 [P] Configurar `frontend/tsconfig.json` (strict, target ES2022, jsx react-jsx, paths con `@/*`)
- [X] T012 [P] Crear `frontend/index.html` con `<link>` Geist + Geist Mono de Google Fonts y `<link>` a `src/styles/design-tokens.css` (copiar de `specs/001-voting-system/design/prototype.html` la sección de fuentes)
- [X] T013 [P] Crear `frontend/postcss.config.js` con tailwindcss + autoprefixer

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: infraestructura core que DEBE existir antes de cualquier user story.

**⚠️ CRITICAL**: ninguna user story puede empezar hasta que termine esta fase.

### Backend foundation

- [X] T014 Implementar módulo de configuración (carga `.env` con `python-dotenv`, expone settings tipadas con Pydantic) en `backend/src/kratos/config.py`
- [X] T015 Implementar conexión SQLite (modo WAL, `foreign_keys=ON`, `BEGIN IMMEDIATE` helper, context manager) en `backend/src/kratos/db.py`
- [X] T016 Crear migración inicial con todas las tablas (`periods`, `proposals`, `proposal_merges`, `vote_receipts`, `vote_scores`, `admin_audit_log`) usando el SQL de `data-model.md` §SQL en `backend/src/kratos/migrations/0001_initial.sql`
- [X] T017 Implementar runner de migraciones idempotente (`python -m kratos.db init`) en `backend/src/kratos/db.py` (función `init_db()`)
- [X] T018 [P] Implementar helper de sesión firmada (`itsdangerous.URLSafeTimedSerializer`, TTL 8h, payload `{email, is_admin, issued_at}`) en `backend/src/kratos/auth/session.py`
- [X] T019 [P] Configurar cliente OIDC Google con Authlib (registro con `discovery_url=https://accounts.google.com/.well-known/openid-configuration`, scope `openid email profile`) en `backend/src/kratos/auth/google.py`
- [X] T020 [P] Implementar dependencies FastAPI `get_current_user`, `require_user`, `require_admin` (leen cookie firmada, comprueban `ADMIN_EMAILS`) en `backend/src/kratos/auth/deps.py`
- [X] T021 [P] Implementar módulo de audit log append-only (sólo expone `append(action, target_ids, period_state_before, period_state_after, details)`; NO expone update/delete) en `backend/src/kratos/models/audit.py`
- [X] T022 [P] Implementar schemas Pydantic compartidos (`Period`, `Proposal`, `ProposalEdit`, `BallotItem`, `BallotRequest`, `Me`, `RankingEntry`, `Ranking`, `AuditEntry`) en `backend/src/kratos/models/schemas.py`
- [X] T023 Crear app FastAPI con middlewares (`SessionMiddleware` de Authlib, gzip, montaje opcional de `static/` con fallback a `index.html`) en `backend/src/kratos/main.py`

### Frontend foundation

- [X] T024 [P] Crear punto de entrada React con BrowserRouter en `frontend/src/main.tsx`
- [X] T025 [P] Crear `App.tsx` con rutas placeholder para `/`, `/login`, `/already-voted`, `/period-closed`, `/results`, `/admin/*`, `/404` en `frontend/src/App.tsx`
- [X] T026 [P] Crear cliente HTTP con `fetch` wrapper (siempre `credentials: 'include'`, parseo de errores `{ detail, code }`) en `frontend/src/api/client.ts`
- [X] T027 [P] Portar primitivos UI del prototipo (Button, Input, Card, Badge, Banner, Modal, ConfirmModal) desde `specs/001-voting-system/design/screens.jsx` a TypeScript en `frontend/src/components/ui/` (un archivo `.tsx` por componente)
- [X] T028 [P] Crear hooks compartidos `useMe()` (GET /api/me, cachea, redirige a /login si 401) y `usePeriod()` (GET /api/period) en `frontend/src/hooks/`
- [X] T029 [P] Crear hook `useRequireAdmin()` (redirige a / si `!is_admin`) en `frontend/src/hooks/useRequireAdmin.ts`
- [X] T030 [P] Crear `frontend/src/styles/index.css` que importe `design-tokens.css` y declare `@tailwind base; @tailwind components; @tailwind utilities;`

**Checkpoint**: Foundation lista — las user stories pueden ejecutarse en paralelo a partir de aquí.

---

## Phase 3: User Story 1 — Emitir papeleta anónima (Priority: P1) 🎯 MVP

**Goal**: Empleado `@phicus.es` se autentica, ve propuestas, puntúa
todas de 1 a 10 y envía papeleta una sola vez, de forma anónima y
atómica.

**Independent Test**: con propuestas precargadas (Phase 2) y periodo
forzado a `abierto`, una cuenta `@phicus.es` debe poder loguearse,
puntuar, enviar, recibir confirmación y al recargar ver
`AlreadyVoted`. Las tablas `vote_scores` no deben contener identidad
del votante.

### Tests OBLIGATORIOS para User Story 1 (constitución, NO opcionales) ⚠️

> Estos tres tests son **innegociables** según la constitución (principios
> I, II, III). Deben escribirse y fallar antes de implementar el flujo.

- [X] T031 [P] [US1] **(Principio I)** `test_vote_anonymity.py`: inserta 50 papeletas con emails sintéticos `user{i}@phicus.es`, comprueba (a) `PRAGMA table_info('vote_scores')` no incluye columnas `user_email`, `user_id`, `ip`, `user_agent` ni nada que contenga `user`/`email`, (b) ningún valor string en `vote_scores` contiene `@phicus.es` ni el sufijo `user` en `backend/tests/integration/test_vote_anonymity.py`
- [X] T032 [P] [US1] **(Principio II)** `test_vote_unicity.py`: lanza 100 envíos concurrentes (threads) de papeletas del mismo usuario contra `POST /api/ballot`; verifica que `vote_receipts` tiene exactamente 1 fila y `vote_scores` tiene exactamente N filas (N = propuestas votables) al final en `backend/tests/integration/test_vote_unicity.py`
- [X] T033 [P] [US1] **(Principio III)** `test_auth_domain.py`: tres casos contractuales mockeando Google: (a) `hd="otra.com"` → 403 sin cookie, (b) `hd="phicus.es"` pero email `usuario@otro.com` → 403, (c) `hd="phicus.es"` + email válido → 302 con cookie set en `backend/tests/contract/test_auth_domain.py`

### Backend para User Story 1

- [X] T034 [P] [US1] Endpoint `GET /auth/google/login` (redirige al authorize URL de Google) en `backend/src/kratos/api/auth.py`
- [X] T035 [US1] Endpoint `GET /auth/google/callback`: intercambia code → id_token, valida server-side `claims["hd"] == "phicus.es"` AND `email.lower().endswith("@phicus.es")` AND `email_verified is True`; si pasa, set cookie firmada con `is_admin = email in ADMIN_EMAILS` y redirige a `/`; si falla, 403 (depende de T019, T020, T021) en `backend/src/kratos/api/auth.py`
- [X] T036 [P] [US1] Endpoint `POST /auth/logout` (borra cookie) en `backend/src/kratos/api/auth.py`
- [X] T037 [P] [US1] Endpoint `GET /api/me` (devuelve `{email, is_admin, has_voted, period_state}`; `has_voted` = existe receipt para `email` + `period_id=1`) en `backend/src/kratos/api/me.py`
- [X] T038 [P] [US1] Endpoint `GET /api/period` (estado actual; respuesta `{state, opened_at?, closed_at?}`) en `backend/src/kratos/api/period.py`
- [X] T039 [P] [US1] Endpoint `GET /api/proposals` (devuelve sólo `status='votable'`; si `is_admin` y periodo en `preparacion`, devuelve también `excluded` y `merged_parent` con flag) en `backend/src/kratos/api/proposals.py`
- [X] T040 [US1] Endpoint `POST /api/ballot` con **transacción `BEGIN IMMEDIATE`**: (a) verifica periodo `abierto`, (b) verifica cobertura completa de propuestas votables, (c) inserta receipt (falla por UNIQUE si ya votó → 409 con `code: "ALREADY_VOTED"`), (d) genera `ballot_uuid = uuid4().hex`, (e) inserta scores con `executemany`. `voted_at` redondeado a minuto (`replace(second=0)`); en `backend/src/kratos/api/ballot.py`

### Frontend para User Story 1

- [X] T041 [P] [US1] Componente `ScoreSelectorChips` (1-10, `role="radiogroup"`, `aria-checked`, navegación con ←/→/Home/End/0-9, touch target ≥32px, en `frontend/src/components/ScoreSelectorChips.tsx`) — portar de `specs/001-voting-system/design/score-selectors.jsx`
- [X] T042 [P] [US1] Componente `ScoreSelectorSlider` (rango 1-10 con valor grande visible, para mobile <640px, mismos atributos ARIA) en `frontend/src/components/ScoreSelectorSlider.tsx` — portar de `score-selectors.jsx`
- [X] T043 [P] [US1] Componente `ScoreSelector` (wrapper responsive: usa chips ≥640px, slider <640px vía `matchMedia` / hook) en `frontend/src/components/ScoreSelector.tsx`
- [X] T044 [P] [US1] Componente `ProposalCard` (nombre + chip estimación + descripción + "Cómo lo haríamos" colapsable + ScoreSelector + ribbon `primary-soft` cuando hay score) en `frontend/src/components/ProposalCard.tsx` — portar de `screens.jsx`
- [X] T045 [P] [US1] Componente `PeriodBanner` con variantes `preparacion` (warning), `abierto` (primary), `cerrado` (sunken) en `frontend/src/components/PeriodBanner.tsx`
- [X] T046 [US1] Página `Login` (centrado, logo + headline "Kratos" + sub-headline "Pelea de gallos, Round X · QY YYYY" + CTA "Entrar con Google" → `window.location = '/auth/google/login'`) en `frontend/src/pages/Login.tsx`
- [X] T047 [US1] Página `Vote` (depende de T041-T045): header con contador `X/N puntuadas`, banner periodo, lista scrollable de ProposalCards, sticky bottom bar con "Enviar papeleta (X/N)" deshabilitado hasta cobertura completa, modal de confirmación (acción irreversible) antes de POST en `frontend/src/pages/Vote.tsx`
- [X] T048 [P] [US1] Página `AlreadyVoted` (icon `check-circle` grande, copy "Ya has votado en este periodo · Los resultados se publican al cierre") en `frontend/src/pages/AlreadyVoted.tsx`
- [X] T049 [P] [US1] Página `PeriodNotOpen` (warning-soft, icon `clock`, copy "La votación aún no está abierta") en `frontend/src/pages/PeriodNotOpen.tsx`
- [X] T050 [P] [US1] Página `PeriodClosed` (sunken, icon `lock`, copy "Periodo cerrado · Ver resultados" con link a `/results`) en `frontend/src/pages/PeriodClosed.tsx`
- [X] T051 [US1] Lógica de routing por estado en `App.tsx`: en `/`, según `me.has_voted` + `me.period_state`, renderizar `Vote` | `AlreadyVoted` | `PeriodNotOpen` | `PeriodClosed` (depende de T028) en `frontend/src/App.tsx`
- [X] T052 [US1] API client wrappers en `frontend/src/api/ballot.ts` (`submitBallot(scores: BallotItem[])` + tipos zod) y `frontend/src/api/proposals.ts` (`listProposals()`)

### Validación E2E US1

- [X] T053 [US1] E2E Playwright golden path en `frontend/tests/e2e/vote-golden-path.spec.ts`: mock de auth (force-set cookie de sesión vía endpoint de test sólo en `ENV=test`), navegar a `/`, puntuar todas las propuestas, enviar, confirmar redirección a `AlreadyVoted`

**Checkpoint**: User Story 1 funcionalmente completa. Un votante puede emitir su papeleta. Los tests T031-T033 deben pasar antes de considerar US1 cerrada.

---

## Phase 4: User Story 2 — Control del periodo (Priority: P2)

**Goal**: Administradores abren / cierran / resetean el periodo de votación, con auditoría.

**Independent Test**: con DB seedeada y dos usuarios distintos (admin y no-admin), el admin puede transitar entre estados; el no-admin recibe 403 si intenta. Las transiciones se ven en `admin_audit_log`.

### Backend

- [X] T054 [P] [US2] Endpoint `POST /api/admin/period/open` (require_admin; estado origen = `preparacion`; transición + audit `PERIOD_OPEN`) en `backend/src/kratos/api/admin_period.py`
- [X] T055 [P] [US2] Endpoint `POST /api/admin/period/close` (estado origen = `abierto`; transición + audit `PERIOD_CLOSE`) en `backend/src/kratos/api/admin_period.py`
- [X] T056 [US2] Endpoint `POST /api/admin/period/reset` (estado origen = `cerrado`; en una transacción: TRUNCATE `vote_receipts` y `vote_scores`, set estado a `preparacion`, audit `PERIOD_RESET` con count de papeletas purgadas) en `backend/src/kratos/api/admin_period.py`
- [X] T057 [P] [US2] `test_period_transitions.py`: valida 9 combinaciones (3 estados × 3 acciones), 6 deben dar 409 y 3 deben dar 204; verifica `admin_audit_log` se actualiza en `backend/tests/integration/test_period_transitions.py`

### Frontend

- [X] T058 [P] [US2] API client `frontend/src/api/admin.ts` con `openPeriod()`, `closePeriod()`, `resetPeriod()`, `listProposals()`, `editProposal()`, `excludeProposal()`, `restoreProposal()`, `mergeProposals()`, `unmergeProposal()`, `createProposal()`, `importCsv()`, `auditLog()` (los métodos no admin restantes se rellenan en US3)
- [X] T059 [US2] Página `Admin/Period` con 3 tarjetas grandes (Open / Close / Reset) mostrando estado actual; Close y Reset abren ConfirmModal (Reset exige escribir `RESET` para confirmar) en `frontend/src/pages/admin/Period.tsx`
- [X] T060 [P] [US2] `AdminShell` layout con sidebar de navegación (Propuestas / Fusionar / Periodo / Auditoría) y guarda `useRequireAdmin()` en `frontend/src/pages/admin/AdminShell.tsx`

**Checkpoint**: User Stories 1 y 2 funcionando. Admin controla el ciclo de vida.

---

## Phase 5: User Story 3 — Fusión y gestión de propuestas (Priority: P3)

**Goal**: Antes de abrir, admin importa, edita, excluye, fusiona y restaura propuestas. Esto cubre la directiva del cliente sobre revisar solapamientos.

**Independent Test**: con periodo en `preparacion`, admin importa CSV, edita una propuesta, excluye otra, fusiona dos en una nueva; verificable en `GET /api/proposals` y `admin_audit_log`.

### Backend

- [X] T061 [P] [US3] Endpoint `PATCH /api/admin/proposals/{id}` (sólo `preparacion`; actualiza `name`/`description`/`how`/`time_estimate`; audit `PROPOSAL_EDIT`) en `backend/src/kratos/api/admin_proposals.py`
- [X] T062 [P] [US3] Endpoint `POST /api/admin/proposals/{id}/exclude` (status → `excluded`; sólo `preparacion`; audit `PROPOSAL_EXCLUDE`) en `backend/src/kratos/api/admin_proposals.py`
- [X] T063 [P] [US3] Endpoint `POST /api/admin/proposals/{id}/restore` (status → `votable`; sólo `preparacion`; audit `PROPOSAL_RESTORE`) en `backend/src/kratos/api/admin_proposals.py`
- [X] T064 [US3] Endpoint `POST /api/admin/proposals/merge` (sólo `preparacion`; valida ≥2 padres, todos `votable`; en transacción: crea hijo `votable`, marca padres `merged_parent`, inserta filas en `proposal_merges`; audit `PROPOSAL_MERGE`) en `backend/src/kratos/api/admin_proposals.py`
- [X] T065 [P] [US3] Endpoint `POST /api/admin/proposals/{id}/unmerge` (sólo `preparacion`; borra `proposal_merges` con `merged_proposal_id={id}`, restaura padres a `votable`, borra hijo; audit `PROPOSAL_UNMERGE`) en `backend/src/kratos/api/admin_proposals.py`
- [X] T066 [P] [US3] **Endpoint nuevo (resuelve C3)**: `POST /api/admin/proposals` (sólo `preparacion`; crea propuesta `votable` sin `original_author_email`; audit `PROPOSAL_CREATE`) en `backend/src/kratos/api/admin_proposals.py`
- [X] T067 [P] [US3] Actualizar `contracts/openapi.yaml` añadiendo `POST /api/admin/proposals` con request body `ProposalEdit` (sin `original_author_email`) y action code `PROPOSAL_CREATE` en `specs/001-voting-system/contracts/openapi.yaml`
- [X] T068 [P] [US3] Script CLI `python -m kratos.seed.import_csv <path>` idempotente, sólo en `preparacion`, mapping según `research.md §7`, audit `CSV_IMPORT` con count importadas/skipped en `backend/src/kratos/seed/import_csv.py`
- [X] T069 [P] [US3] Endpoint `POST /api/admin/proposals/import` (multipart `file`; reusa la lógica de T068; sólo `preparacion`) en `backend/src/kratos/api/admin_proposals.py`
- [X] T070 [P] [US3] `test_merge_proposals.py`: crea 3 propuestas, fusiona 2 en 1, verifica (a) hijo `votable`, (b) padres `merged_parent`, (c) `proposal_merges` tiene 2 filas con `merged_by` correcto, (d) `GET /api/proposals` (no-admin) sólo devuelve hijo + tercera propuesta; (e) unmerge restaura padres en `backend/tests/integration/test_merge_proposals.py`
- [X] T071 [P] [US3] `test_csv_import.py`: importa CSV de fixture (5 filas reales del Google Form de Phicus), verifica (a) 5 propuestas creadas con campos correctos, (b) reimportar = 0 imported / 5 skipped en `backend/tests/integration/test_csv_import.py`

### Frontend

- [X] T072 [P] [US3] API client wrappers en `frontend/src/api/admin.ts` (completar los métodos no admin de T058 que faltaron)
- [X] T073 [US3] Página `Admin/Proposals` (tabla densa con columnas: id, nombre, estado, autor, acciones; filtros por estado; botón "Nueva propuesta" → modal; acciones por fila: Editar, Excluir/Restaurar, Fusionar) en `frontend/src/pages/admin/Proposals.tsx`
- [X] T074 [US3] Página `Admin/Merge` (two-pane: izquierda lista con checkboxes de propuestas `votable`, derecha formulario nombre/descripción/cómo/estimación + preview de propuesta resultante; validación ≥2 seleccionadas) en `frontend/src/pages/admin/Merge.tsx`
- [X] T075 [P] [US3] Página `Admin/AuditLog` (tabla cronológica desc con timestamp · admin · acción · target · `details`; filtros por admin y por tipo) en `frontend/src/pages/admin/AuditLog.tsx`
- [X] T076 [P] [US3] Endpoint `GET /api/admin/audit-log?limit=N` en `backend/src/kratos/api/admin_audit.py` (require_admin; lee de `admin_audit_log` ORDER BY occurred_at DESC LIMIT)

**Checkpoint**: User Stories 1, 2 y 3 funcionando. Admin controla todo el flujo de propuestas.

---

## Phase 6: User Story 4 — Ranking final (Priority: P4)

**Goal**: Tras cerrar el periodo, cualquier autenticado ve el ranking ordenado.

**Independent Test**: forzar estado `cerrado` con seed de papeletas y verificar (a) UI muestra ranking ordenado por suma desc + desempate alfa, (b) admin puede descargar CSV.

### Backend

- [X] T077 [P] [US4] Endpoint `GET /api/results` (sólo `cerrado` → 409 si no; SQL `SELECT p.id, p.name, COALESCE(SUM(vs.score),0) AS total, COUNT(DISTINCT vs.ballot_uuid) AS vote_count FROM proposals p LEFT JOIN vote_scores vs ON p.id = vs.proposal_id WHERE p.status='votable' GROUP BY p.id ORDER BY total DESC, name COLLATE NOCASE ASC`) en `backend/src/kratos/api/results.py`
- [X] T078 [P] [US4] Endpoint `GET /api/results.csv` (require_admin; sólo `cerrado`; respuesta `text/csv` con header `proposal_id,name,total_score,vote_count`; audit `RESULTS_EXPORT`) en `backend/src/kratos/api/results.py`
- [X] T079 [P] [US4] `test_results_ranking.py`: seedea 3 propuestas con sumas (40, 25, 25-alpha-tiebreak), verifica orden + cuenta de papeletas; valida 409 cuando estado ≠ `cerrado` en `backend/tests/integration/test_results_ranking.py`

### Frontend

- [X] T080 [P] [US4] Componente `RankingRow` (posición · barra de progreso = total/max_total · nombre · suma en `font-mono tabular-nums`; top-3 con fondo `primary-soft`) en `frontend/src/components/RankingRow.tsx`
- [X] T081 [US4] Página `Results` (header con total de votantes y propuestas, lista de RankingRow, link "Descargar CSV" sólo si admin) en `frontend/src/pages/Results.tsx`
- [X] T082 [P] [US4] API client `getResults()` y `downloadResultsCsv()` en `frontend/src/api/results.ts`

**Checkpoint**: las 4 user stories independientemente operativas.

---

## Phase 7: Polish & Cross-Cutting

**Purpose**: hardening, docs y refinamientos finales.

- [X] T083 [P] Rate-limit en `POST /api/ballot` (10 req/min por sesión, `slowapi` o middleware ligero custom) en `backend/src/kratos/main.py`
- [X] T084 [P] Cookies `Secure=True` cuando `ENV=production`, `SameSite=Lax`, `HttpOnly=True` siempre en `backend/src/kratos/auth/session.py`
- [X] T085 [P] Página `404` con tono desenfadado ("Esta página no existe… o quizá la fusionamos por error 🐔") en `frontend/src/pages/NotFound.tsx`
- [X] T086 [P] Componente `Toast` (success/error) y proveedor global de notificaciones en `frontend/src/components/ui/Toast.tsx`
- [X] T087 [P] Validar y documentar `quickstart.md` ejecutando paso a paso; corregir cualquier desvío en `specs/001-voting-system/quickstart.md`
- [X] T088 [P] Crear `backend/README.md` con instrucciones de dev local (`uv` / `pip install -e .`, `python -m kratos.db init`, `uvicorn kratos.main:app --reload`) en `backend/README.md`
- [X] T089 [P] Crear `frontend/README.md` con instrucciones de dev local (`pnpm install`, `pnpm dev`, `pnpm test`, `pnpm build`) en `frontend/README.md`
- [X] T090 [P] Smoke test del build de producción: `pnpm build` → `cp dist/* backend/src/kratos/static/` → `uvicorn` y verificar `GET /` sirve la SPA en `frontend/dist/` y `backend/src/kratos/static/`
- [X] T091 [P] Smoke test Docker: `docker compose up --build` y health-check responde 200 en `Dockerfile`
- [X] T092 [P] **Pendiente brand**: cuando Phicus entregue logo/paleta oficial, sustituir valores raw en `frontend/src/styles/design-tokens.css` (raws `--gray-*`, `--brand-*`, `--accent-*`) y cabeceras tipográficas — el resto del sistema se actualiza solo
- [X] T093 [P] Tests adicionales opcionales: `test_session_cookie.py` (firma + expiración), `test_csv_import.py` ya cubierto en T071, `test_domain_validation.py` en `backend/tests/unit/`
- [X] T094 Ejecutar `/speckit-analyze` con tasks completas para validación cruzada final spec ↔ plan ↔ tasks

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: empieza inmediatamente
- **Foundational (Phase 2)**: empieza tras Phase 1; bloquea Phases 3+
- **User Stories (Phases 3–6)**: empiezan tras Phase 2; pueden ejecutarse en paralelo si hay capacidad de equipo
- **Polish (Phase 7)**: empieza tras la última user story que se haya entregado

### User Story Dependencies

- **US1 (P1)**: depende sólo de Phase 2. Independiente.
- **US2 (P2)**: depende sólo de Phase 2. Puede ir en paralelo a US1; comparte `AdminShell` con US3.
- **US3 (P3)**: depende de Phase 2. Puede ir en paralelo a US1/US2.
- **US4 (P4)**: depende de Phase 2 + datos seedeados. Para tests E2E, conviene tener US1 cerrada (papeletas reales).

### Dentro de cada User Story

- Tests obligatorios (T031-T033) PRIMERO en US1; deben fallar antes de implementar.
- Models / dependencies / schemas antes que endpoints.
- Endpoints antes que páginas frontend que los consumen.
- API clients antes que páginas.
- Componentes UI antes que páginas que los usan.

### Parallel Opportunities

- Todas las tareas marcadas `[P]` en Setup pueden lanzarse en una sola tanda
- En Foundational, T018-T022 (auth, audit, schemas) son `[P]` y se pueden hacer simultáneamente tras T015-T017 (DB)
- En cada US, los endpoints en archivos distintos son `[P]`; los componentes UI también
- Los tests son `[P]` entre sí; los obligatorios de US1 (T031-T033) son `[P]` y bloquean el merge de US1
- Cuatro desarrolladores podrían tomar US1/US2/US3/US4 en paralelo tras Phase 2

---

## Parallel Example: User Story 1 tests obligatorios

```bash
# Lanzar los tres tests no-negociables del Principio I, II y III juntos:
Task: "Escribir test_vote_anonymity.py en backend/tests/integration/"
Task: "Escribir test_vote_unicity.py en backend/tests/integration/"
Task: "Escribir test_auth_domain.py en backend/tests/contract/"
```

## Parallel Example: User Story 1 components frontend

```bash
Task: "Implementar ScoreSelectorChips en frontend/src/components/ScoreSelectorChips.tsx"
Task: "Implementar ScoreSelectorSlider en frontend/src/components/ScoreSelectorSlider.tsx"
Task: "Implementar ProposalCard en frontend/src/components/ProposalCard.tsx"
Task: "Implementar PeriodBanner en frontend/src/components/PeriodBanner.tsx"
Task: "Implementar AlreadyVoted en frontend/src/pages/AlreadyVoted.tsx"
Task: "Implementar PeriodNotOpen en frontend/src/pages/PeriodNotOpen.tsx"
Task: "Implementar PeriodClosed en frontend/src/pages/PeriodClosed.tsx"
```

---

## Implementation Strategy

### MVP First (US1 sólo)

1. Completar Phase 1: Setup
2. Completar Phase 2: Foundational
3. Completar Phase 3: User Story 1 (incluye los 3 tests obligatorios)
4. **Validación**: ejecutar `pytest backend/tests/integration/test_vote_anonymity.py backend/tests/integration/test_vote_unicity.py backend/tests/contract/test_auth_domain.py` — deben pasar.
5. Demo / despliegue interno: aunque admins controlen periodo manualmente vía SQL (`UPDATE periods SET state='abierto' WHERE id=1`), el sistema ya es usable para una votación real.

### Entrega incremental

1. Setup + Foundational → arquitectura lista
2. US1 → demo MVP (votación funcional, periodo abierto desde DB)
3. US2 → admins ya no tocan SQL; UI controla el ciclo
4. US3 → admins importan/editan/fusionan desde UI
5. US4 → resultados consultables por todos
6. Polish → hardening, brand assets reales, Docker

### Equipo paralelo

Con 4 personas tras Phase 2:

- **Dev A**: US1 (la grande; arranca primero por ser MVP)
- **Dev B**: US2 (rápida; libera al admin)
- **Dev C**: US3 (compleja pero independiente)
- **Dev D**: US4 (pequeña; espera datos de US1 para E2E)

---

## Notes

- Los tests `[P]` corren en paralelo si están en archivos distintos.
- Los tres tests del Principio I, II y III (T031-T033) son
  **innegociables**: el merge de US1 está bloqueado hasta que pasen.
- El brand asset real de Phicus aún no llegó al diseñador (T092
  documenta la sustitución cuando llegue).
- El prototipo en `specs/001-voting-system/design/` se mantiene como
  referencia de implementación; no se sirve en producción.
- Tras completar todas las phases, ejecutar `/speckit-analyze` (T094)
  para una verificación cruzada definitiva.
