---
description: "Task list for feature 002-admin-dashboard"
---

# Tasks: Admin Dashboard

**Input**: Design documents from `/specs/002-admin-dashboard/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/delta.yaml, design-brief.md, design/admin-dashboard.jsx (prototipo)

**Tests**: sólo se incluyen tests **obligatorios por constitución**
(Principio I — `test_participation_no_score_leak`) más los necesarios
para validar los flujos críticos de cada user story.

**Organization**: tareas agrupadas por user story para implementación y
prueba independientes.

**Design integration**: el bundle de Claude Design está en
`specs/002-admin-dashboard/design/`. Las tareas de UI portan los
componentes JSX del prototipo a TypeScript / React, mapeando iconos
custom → `lucide-react` (ver `research.md §6`) y
`dispatch({type:'goto'})` → `useNavigate` (ver `research.md §8`). Se
**reutilizan** los componentes UI ya en `frontend/src/components/ui/`
de la feature 001 (Button, Card, Badge, Banner, Modal); no se
reescriben.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: paralelizable (archivo distinto, sin dependencia con tarea
  no completada del mismo phase)
- **[Story]**: pertenece a una user story (US1..US4); ausente en
  Setup, Foundational y Polish.

## Path Conventions

- Backend: `backend/src/kratos/...`, tests en `backend/tests/{integration,contract,unit}/`
- Frontend: `frontend/src/...`, tests en `frontend/tests/{component,e2e}/`
- Diseño de referencia: `specs/002-admin-dashboard/design/` (sólo lectura)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: archivos vacíos / scaffolds necesarios antes de que ninguna user story arranque. No hay nuevas dependencias.

- [X] T001 [P] Crear migración SQL `ALTER TABLE periods ADD COLUMN expected_quorum INTEGER NULL` en `backend/src/kratos/migrations/0002_admin_quorum.sql`
- [X] T002 [P] Portar el bloque `ADMIN_STYLE` del prototipo a `frontend/src/styles/admin.css` (copia literal desde `specs/002-admin-dashboard/design/admin-dashboard.jsx` lines 10-312)
- [X] T003 [P] Importar `admin.css` desde `frontend/src/styles/index.css` (añadir `@import './admin.css';` justo después de `design-tokens.css`)
- [X] T004 [P] Crear directorio `frontend/src/components/admin/` con un `.gitkeep` vacío para forzar su existencia en repo

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: extensiones base sobre la infra de 001 que TODAS las user stories de 002 consumen.

**⚠️ CRITICAL**: ninguna user story puede empezar hasta que termine esta fase.

### Backend foundation

- [X] T005 Aplicar migración: ejecutar `python -m kratos.db init` para que el runner aplique `0002_admin_quorum.sql`; verificar con `sqlite3 data/voting.db "PRAGMA table_info('periods')"` que aparece la columna
- [X] T006 [P] Extender `VALID_ACTIONS` en `backend/src/kratos/models/audit.py` añadiendo `"PROPOSAL_BULK_EXCLUDE"`, `"PROPOSAL_BULK_RESTORE"`, `"PERIOD_QUORUM_SET"` al frozenset
- [X] T007 [P] Extender `get_period()` en `backend/src/kratos/models/period.py` para que devuelva también `expected_quorum` en el dict resultado (modificar el SELECT y el dict por defecto)
- [X] T008 [P] Extender `transition()` en `backend/src/kratos/models/period.py`: en la transición `cerrado → preparacion` (rama del reset), añadir `expected_quorum=NULL` al UPDATE de `periods` (cláusula `SET state=?, opened_at=NULL, closed_at=NULL, opened_by=NULL, closed_by=NULL, expected_quorum=NULL`)
- [X] T009 Añadir función `set_quorum(conn, *, expected_quorum, admin_email)` a `backend/src/kratos/models/period.py` que: (a) valide estado `abierto` (raise 409 si no), (b) valide `expected_quorum is None or expected_quorum >= 1` (raise 422), (c) lea el valor anterior, (d) actualice la columna, (e) emita `audit.append(action='PERIOD_QUORUM_SET', details={'old': old, 'new': new})`
- [X] T010 [P] Añadir función `bulk_set_status(conn, *, proposal_ids, target_status, admin_email)` a `backend/src/kratos/models/proposal.py` que: (a) genere un `bulk_group_id = uuid4().hex[:8]`, (b) para cada id, lea el estado actual, si NO es el origen válido (`votable` para exclude, `excluded` para restore) lo añada a `skipped` con motivo, (c) para cada id válido, llame a `set_status()` Y emita `audit.append(action='PROPOSAL_EXCLUDE'|'PROPOSAL_RESTORE', target_ids=[pid], details={'bulk_group_id': bulk_group_id})`, (d) devuelva `{'affected': int, 'bulk_group_id': str, 'skipped': [{'proposal_id':int,'reason':str}]}`
- [X] T011 [P] Añadir schemas Pydantic en `backend/src/kratos/models/schemas.py`: `DashboardCounters`, `DashboardPeriod` (extiende `Period` con `expected_quorum`), `AuditEntryCompact`, `DashboardData`, `VoterReceiptSummary`, `ParticipationData`, `QuorumUpdateRequest`, `BulkProposalsRequest`, `BulkProposalsResult` — todos definidos en `contracts/delta.yaml` §components

### Frontend foundation

- [X] T012 [P] Extender `frontend/src/api/types.ts` con interfaces TypeScript equivalentes a los schemas Pydantic de T011 (`DashboardData`, `ParticipationData`, `VoterReceiptSummary`, `BulkProposalsResult`, etc.)
- [X] T013 [P] Extender `frontend/src/api/endpoints.ts` añadiendo dentro del objeto `admin`: `dashboard()`, `participation()`, `setQuorum(value: number|null)`, `bulkExclude(proposal_ids: number[])`, `bulkRestore(proposal_ids: number[])` — todos con tipos del T012
- [X] T014 [P] Crear hook `useDashboardData()` en `frontend/src/hooks/useDashboardData.ts` que: (a) hace `GET /api/admin/dashboard` al montar, (b) re-fetch con `setInterval` cada 10 s, (c) pausa con `document.addEventListener('visibilitychange')` cuando `visibilityState !== 'visible'`, (d) reanuda al volver, (e) expone `{data, loading, error, reload}`
- [X] T015 [P] Crear hook `useParticipation(enabled)` en `frontend/src/hooks/useParticipation.ts` con misma estrategia que T014 pero contra `/api/admin/participation`; `enabled=false` desactiva todo (cuando el periodo no está `abierto`)
- [X] T016 [P] Crear hook `useBulkSelection<T extends {id:number}>(items)` en `frontend/src/hooks/useBulkSelection.ts` que mantiene `Set<number>` y expone `toggle(id)`, `toggleAll(filtered)`, `clear()`, `selected`, `allChecked`, `someChecked` — portar la lógica de selección desde `ProposalsSearchAndBulk` (líneas 590-630 del prototipo)
- [X] T017 [P] Crear `IconMap` en `frontend/src/components/admin/iconMap.ts` exportando los iconos `lucide-react` con los nombres usados en el prototipo (`IconClipboardList`, `IconEyeOff`, `IconVote`, `IconClock`, `IconPlay`, `IconLock`, `IconMerge`, `IconUsers`, `IconList`, `IconTrophy`, `IconRefresh`, `IconShield`, `IconSparkles`, `IconDownload`, `IconUpload`, `IconSearch`, `IconEdit`, `IconTrash`, `IconXCircle`, `IconChevronLeft`, `IconChevronRight`, `IconPlus`) — re-exporta directamente desde `lucide-react` siguiendo el mapping de `research.md §6`

**Checkpoint**: Foundation lista — las user stories pueden ejecutarse en paralelo a partir de aquí. Verificar que `pytest backend/tests/` sigue verde (no regresión sobre los 25 tests del MVP).

---

## Phase 3: User Story 1 — Dashboard de estado y acciones rápidas (Priority: P1) 🎯 MVP

**Goal**: el administrador entra en `/admin` y ve el estado, contadores clicables, próximos pasos contextuales y las últimas 5 acciones del audit.

**Independent Test**: con admin autenticado y DB en cualquiera de los 3 estados, navegar a `/admin` debe renderizar (a) hero por estado, (b) 4 MetricCards, (c) caja "Próximos pasos" con los CTAs de la matriz para ese estado, (d) lista de 5 últimas acciones.

### Backend para User Story 1

- [X] T018 [US1] Implementar endpoint `GET /api/admin/dashboard` en `backend/src/kratos/api/admin_dashboard.py` que: (a) require_admin, (b) en una conexión: lee `periods` (incluye `expected_quorum`), agrega contadores con `SELECT SUM(CASE...) FROM proposals`, `COUNT(*) FROM vote_receipts WHERE period_id=1`, y `audit.list_entries(conn, limit=5)`, (c) devuelve `DashboardData`. **Importante**: no importar `models.results` ni hacer JOIN con `vote_scores`.
- [X] T019 [US1] Registrar el router en `backend/src/kratos/main.py`: añadir `from .api import admin_dashboard` y `app.include_router(admin_dashboard.router)`
- [X] T020 [P] [US1] Test `test_admin_dashboard.py` en `backend/tests/integration/test_admin_dashboard.py` que verifica: (a) 403 sin admin, (b) en estado `preparacion` devuelve `period.state == 'preparacion'`, `counters.ballots_cast == 0`, (c) tras sembrar 3 propuestas y abrir periodo, `counters.votable == 3` y `period.state == 'abierto'`, (d) `recent_audit` tiene a lo sumo 5 entradas y aparece la transición de periodo en la primera posición

### Frontend para User Story 1

- [X] T021 [P] [US1] Componente `MetricCard` en `frontend/src/components/admin/MetricCard.tsx`: portar de `admin-dashboard.jsx` líneas 378-389. Props: `{counter: number|string, label: string, sub?: string, icon: LucideIcon, onClick?: () => void}`. Renderiza `<button className="adm-metric">` con icono top-right, número en `adm-metric-num`, label en `adm-metric-label`, sub opcional.
- [X] T022 [P] [US1] Componente `ActionCardContextual` en `frontend/src/components/admin/ActionCardContextual.tsx`: portar de `admin-dashboard.jsx` líneas 394-437. Props: `{state: PeriodState, onAction: (id: string) => void}`. Define `CTA_MATRIX` (3 estados × N CTAs cada uno con `{id, label, icon, variant}`) según la tabla del spec FR-104. Mapping de variantes a clases existentes: `primary` → `Button variant="primary"`, `secondary` → `variant="secondary"`, `danger` → `variant="danger"`, `ghost` → `variant="ghost"`.
- [X] T023 [P] [US1] Componente `RecentAuditList` en `frontend/src/components/admin/RecentAuditList.tsx`: portar de `admin-dashboard.jsx` líneas 451-480. Props: `{entries: AuditEntry[], onSeeAll: () => void}`. Función helper `actionToBadgeVariant(action)` que mapea cada código a la variante de Badge correcta (`PERIOD_OPEN`→primary, `PERIOD_CLOSE`→neutral, `PERIOD_RESET`→danger, `PROPOSAL_CREATE`→success, `PROPOSAL_EXCLUDE`→warning, `PROPOSAL_MERGE`→primary, etc.).
- [X] T024 [US1] Página `Dashboard` en `frontend/src/pages/admin/Dashboard.tsx`: portar de `admin-dashboard.jsx` líneas 743-852. Compone (a) hero `adm-hero adm-hero--{state}` con icono + título + sub + quote + tag `R3`, (b) grid de 4 `MetricCard` (votable, excluded, merged_parent, ballots_cast — esta última muestra "—" en `preparacion`), (c) `ActionCardContextual`, (d) `RecentAuditList`. Usa `useDashboardData()` y `useNavigate()`. Handler `onAction(id)` con el mapping `routeForActionId` documentado en `research.md §8` (`'part'→/admin/participation`, `'audit'→/admin/audit`, `'csv'→download`, `'ranking'→/results`, `'merge'→/admin/merge`, `'open'|'close'|'reset'→/admin/period`, `'create'|'import'→/admin/proposals`).
- [X] T025 [US1] Modificar routing en `frontend/src/App.tsx`: cambiar el `<Route path="/admin"...>` para que renderice `<AdminShell>` con `<Outlet/>` Y un `index` route que renderice `<Dashboard/>` (en lugar de `<Navigate to="/admin/proposals" replace />`). Conserva las rutas hijas existentes (`/admin/proposals`, `/admin/merge`, `/admin/period`, `/admin/audit`).
- [X] T026 [P] [US1] Añadir entrada "Dashboard" al inicio del `LINKS` array de `frontend/src/pages/admin/AdminShell.tsx` con `{to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true}`. Usar prop `end` para que el NavLink no se marque activo en sub-rutas.

**Checkpoint**: User Story 1 funcionalmente completa. El admin entra en `/admin` y ve el dashboard con polling. Las pantallas existentes (`/admin/proposals`, `/admin/merge`, `/admin/period`, `/admin/audit`) siguen accesibles.

---

## Phase 4: User Story 2 — Métricas de participación en tiempo real (Priority: P2)

**Goal**: durante `abierto`, el admin consulta quién ha votado y configura el aforo esperado, sin tocar scores.

**Independent Test**: con periodo `abierto`, seedear N papeletas. `GET /api/admin/participation` devuelve N votantes ordenados desc por `voted_at`. `PATCH /api/admin/period/quorum {"expected_quorum": Y}` persiste el valor; el siguiente GET lo refleja. Test `test_participation_no_score_leak.py` pasa.

### Backend para User Story 2

- [X] T027 [US2] **(Principio I — INNEGOCIABLE)** Test `test_participation_no_score_leak.py` en `backend/tests/integration/test_participation_no_score_leak.py` que valida las 3 invariantes de `research.md §9`: (a) JSON response no contiene claves `score`, `scores`, `ballot_uuid`, `proposal_id`, `ballot`; (b) `ast.parse` sobre `backend/src/kratos/api/admin_participation.py` y comprueba que no hay `Import`/`ImportFrom` con módulo `vote_scores`, `results`; (c) bajo un wrapper de conexión SQLite que captura todos los `execute()`/`executescript()`, llamar al endpoint con 5 papeletas pre-sembradas NUNCA emite SQL que mencione `vote_scores`
- [X] T028 [P] [US2] Implementar endpoint `GET /api/admin/participation` en `backend/src/kratos/api/admin_participation.py` que: (a) require_admin, (b) lee estado del periodo; si NO es `abierto`, raise 409, (c) ejecuta UNA query: `SELECT user_email, voted_at FROM vote_receipts WHERE period_id=1 ORDER BY voted_at DESC, id DESC`, (d) responde `ParticipationData(voters_count, expected_quorum, voters=[{email, voted_at}, ...])`. **Crítico**: no importar `models.results` ni `models.ballot`; sólo `models.period` y `db.connection`.
- [X] T029 [US2] Implementar endpoint `PATCH /api/admin/period/quorum` en `backend/src/kratos/api/admin_participation.py` que: (a) require_admin, (b) acepta body `QuorumUpdateRequest`, (c) llama a `period.set_quorum(conn, expected_quorum=..., admin_email=admin.email)` dentro de `transaction(conn)`, (d) devuelve 204
- [X] T030 [US2] Registrar el router en `backend/src/kratos/main.py`: añadir `from .api import admin_participation` y `app.include_router(admin_participation.router)`
- [X] T031 [P] [US2] Test `test_admin_participation.py` en `backend/tests/integration/test_admin_participation.py` que cubre el comportamiento funcional (complementario a T027 que sólo cubre anti-leak): (a) 409 en estados `preparacion` y `cerrado`, (b) tras sembrar 3 papeletas vía `ballot.submit`, devuelve 3 voters ordenados desc, (c) `PATCH /api/admin/period/quorum {"expected_quorum": 48}` → 204; siguiente GET devuelve `expected_quorum=48`, (d) `PATCH /api/admin/period/quorum {"expected_quorum": null}` lo limpia, (e) valor inválido `0` → 422

### Frontend para User Story 2

- [X] T032 [P] [US2] Componente `ParticipationProgress` en `frontend/src/components/admin/ParticipationProgress.tsx`: portar de `admin-dashboard.jsx` líneas 499-546 (la card de progreso, sin la lista). Props: `{votersCount: number, expectedQuorum: number|null, onQuorumChange: (n: number|null) => void}`. Renderiza la tarjeta `part-progress-card` con número grande, barra de progreso si hay `expectedQuorum`, e input "Aforo esperado: [__]" + botón Guardar.
- [X] T033 [P] [US2] Componente `VotersList` en `frontend/src/components/admin/VotersList.tsx`: portar de `admin-dashboard.jsx` líneas 549-580. Props: `{voters: VoterReceiptSummary[]}`. Implementa paginación cliente con `pageSize=50`, controles Anterior/Siguiente con `ChevronLeft`/`ChevronRight`. Nota de privacidad al pie con `Shield` icon + texto italic muted: "El sistema sólo registra quién ha votado, nunca qué ha votado."
- [X] T034 [US2] Página `Participation` en `frontend/src/pages/admin/Participation.tsx`: portar de `admin-dashboard.jsx` líneas 880-908. Usa `useParticipation(enabled)` donde `enabled = period.state === 'abierto'`. Si periodo no es `abierto`, mostrar Banner "Disponible mientras la votación esté abierta" en lugar de los componentes. Header con link "← Dashboard" (Button ghost + ChevronLeft) y Badge "Periodo abierto · faltan N votantes" arriba a la derecha. Compone `ParticipationProgress` (pasa handler que llama a `admin.setQuorum` y luego `reload()`) y `VotersList`.
- [X] T035 [US2] Añadir ruta `/admin/participation` en `frontend/src/App.tsx` dentro del `<Route path="/admin" element={<AdminShell>}` block: `<Route path="participation" element={<Participation/>} />`
- [X] T036 [P] [US2] Añadir entrada "Participación" al `LINKS` array de `frontend/src/pages/admin/AdminShell.tsx` con `{to: '/admin/participation', label: 'Participación', icon: Users}`. Posición: después de "Periodo".

**Checkpoint**: User Story 2 funcionalmente completa. Test T027 obligatorio debe pasar antes de considerar US2 cerrada.

---

## Phase 5: User Story 3 — Centro de acciones contextual (Priority: P3)

**Goal**: el dashboard adapta los CTAs visibles según el estado del periodo (matriz definida en spec FR-104). Las acciones de la matriz están a ≤ 2 clicks del dashboard (SC-101).

**Independent Test**: por cada uno de los 3 estados, inspeccionar el conjunto de botones renderizados dentro de `<ActionCardContextual>` y verificar que coinciden EXACTAMENTE con la matriz del spec (sin CTAs de otros estados).

### Implementación

> US3 está mayormente cubierta por T022 (`ActionCardContextual`) y T024
> (página Dashboard) de US1, ya que el componente nace con la matriz
> integrada. Aquí sólo el test de matriz y un retoque de UX.

- [X] T037 [P] [US3] Test componente `ActionCardContextual.test.tsx` en `frontend/tests/component/ActionCardContextual.test.tsx`: para cada estado (`preparacion`, `abierto`, `cerrado`), monta el componente y verifica con Testing Library que (a) los botones presentes en el DOM coinciden con la matriz, (b) los botones de otros estados NO están en el DOM (no basta con `disabled`), (c) click en cada CTA invoca `onAction` con el id correcto
- [X] T038 [US3] Refinar `Dashboard.tsx` (T024): cuando el estado es `preparacion` y `counters.votable === 0`, en la caja "Próximos pasos" reordenar para que `Importar CSV` aparezca destacado como tarjeta primaria grande (no como botón normal). Este es el "estado vacío" del spec FR-100 / Edge case "0 propuestas en preparación".

**Checkpoint**: User Stories 1, 2 y 3 funcionando.

---

## Phase 6: User Story 4 — Búsqueda y operaciones masivas (Priority: P4)

**Goal**: buscar propuestas por nombre/descripción en cliente y excluir/restaurar múltiples a la vez con bulk-bar sticky.

**Independent Test**: con 50 propuestas seedeadas, buscar por una subcadena debe filtrar; seleccionar 3 con checkbox + pulsar "Excluir seleccionadas" → 3 propuestas cambian a `excluded` en una transacción; `admin_audit_log` recibe 3 entradas `PROPOSAL_EXCLUDE` con el mismo `bulk_group_id`.

### Backend para User Story 4

- [X] T039 [US4] Implementar endpoint `POST /api/admin/proposals/bulk-exclude` en `backend/src/kratos/api/admin_proposals.py` que: (a) require_admin + `_require_preparacion(conn)`, (b) acepta body `BulkProposalsRequest` con `proposal_ids: list[int]`, (c) dentro de `transaction(conn, immediate=True)` llama a `proposal.bulk_set_status(conn, proposal_ids=ids, target_status='excluded', admin_email=admin.email)`, (d) devuelve `BulkProposalsResult`
- [X] T040 [P] [US4] Implementar endpoint `POST /api/admin/proposals/bulk-restore` en `backend/src/kratos/api/admin_proposals.py` análogo a T039 con `target_status='votable'`
- [X] T041 [P] [US4] Test `test_admin_bulk_proposals.py` en `backend/tests/integration/test_admin_bulk_proposals.py`: (a) bulk-exclude de 3 votables → `affected=3`, `skipped=[]`, los 3 cambian a `excluded`; (b) audit log contiene 3 nuevas entradas `PROPOSAL_EXCLUDE` con el mismo `bulk_group_id` en `details`; (c) bulk-exclude que incluye 2 ya excluidas + 1 votable → `affected=1`, `skipped=[{'proposal_id':X,'reason':'not_votable'},{...}]`; (d) bulk-restore inverso; (e) bulk en estado `abierto` → 409; (f) cuerpo con `proposal_ids=[]` → 422 (Pydantic minItems=1)

### Frontend para User Story 4

- [X] T042 [P] [US4] Componente `ProposalsSearch` en `frontend/src/components/admin/ProposalsSearch.tsx`: input con `Search` icon a la izquierda + `XCircle` para limpiar (sólo si hay query). Props: `{value: string, onChange: (v: string) => void}`. Usa clases `prop-search` del CSS portado.
- [X] T043 [P] [US4] Función utility `frontend/src/lib/normalize.ts` que exporta `normalize(s: string): string` con `s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()` para comparación sin acentos (FR-120)
- [X] T044 [P] [US4] Componente `BulkBar` en `frontend/src/components/admin/BulkBar.tsx`: sticky bottom, animación `bulk-rise` (clase del CSS portado). Props: `{count: number, onExclude: () => void, onRestore: () => void, onCancel: () => void, mobile?: boolean}`. Mobile = full-width; desktop = centrado con `transform: translateX(-50%)`. Usa pelar el contenido de líneas 715-735 del prototipo.
- [X] T045 [US4] Reescribir página `Proposals` en `frontend/src/pages/admin/Proposals.tsx` portando `AdminProposalsV2` (líneas 913-939) + `ProposalsSearchAndBulk` (líneas 588-737) del prototipo. Estructura: header con título + botones "Importar CSV" y "+ Nueva propuesta" (deshabilitados fuera de `preparacion`), `ProposalsSearch`, fila de filtros `role="tablist"`, tabla con checkbox-master + filas con checkbox individual (sólo visibles en `preparacion`), `BulkBar` flotante cuando `selected.size > 0`. Usa `useBulkSelection`, `admin.bulkExclude`, `admin.bulkRestore`. Conserva los modales de crear/editar/import del archivo original.
- [X] T046 [P] [US4] **Anuncio screen reader**: en `Proposals.tsx`, añadir un `<div role="status" aria-live="polite" aria-atomic="true" className="sr-only">` que muestra el texto "N propuestas seleccionadas" cuando cambia `selected.size`. Class `sr-only` con `position:absolute; width:1px; height:1px; overflow:hidden; clip:rect(0 0 0 0)` (añadir a `admin.css` si no existe).
- [X] T047 [P] [US4] Test componente `useBulkSelection.test.tsx` en `frontend/tests/component/useBulkSelection.test.tsx`: monta un componente trivial que usa el hook, valida (a) `toggle(1)` añade 1, segundo toggle lo quita, (b) `toggleAll(items)` con items=[1,2,3] añade todos; segundo toggleAll con misma lista los quita, (c) `clear()` vacía el Set, (d) `allChecked` correcto, (e) `someChecked` correcto.

**Checkpoint**: las 4 user stories independientemente operativas. `Proposals.tsx` ha sido reescrito (sustituye al anterior).

---

## Phase 7: Polish & Cross-Cutting

**Purpose**: validaciones finales, hardening y verificación cruzada.

- [X] T048 [P] Verificar regresión: ejecutar `cd backend && .venv/bin/python -m pytest tests/ -q` — los 25 tests del MVP 001 + los nuevos de US1/US2/US4 deben pasar todos (esperado ~33 tests pass)
- [X] T049 [P] Smoke test backend siguiendo `quickstart.md §2-4`: levantar uvicorn, login admin via `/auth/test/login`, ejercer los 5 endpoints nuevos, verificar respuestas con `jq`
- [X] T050 [P] Smoke test frontend siguiendo `quickstart.md §5`: arrancar `npm run dev`, recorrer el golden path manual de 8 pasos
- [X] T051 [P] Validar polling con visibilidad: en DevTools → Network, cambiar a otra pestaña, verificar que `/api/admin/dashboard` deja de dispararse en ≤ 11 s; volver, verificar que se dispara inmediatamente
- [X] T052 [P] Actualizar `backend/README.md` añadiendo una sección "Feature 002 (admin dashboard)" con los 5 endpoints nuevos
- [X] T053 [P] Actualizar `frontend/README.md` añadiendo el listado de componentes nuevos y rutas
- [X] T054 [P] Limpieza: borrar el `.gitkeep` de `frontend/src/components/admin/` (ya tiene archivos reales en su lugar)
- [X] T055 Ejecutar `/speckit-analyze` con las tasks completas para verificación cruzada spec ↔ plan ↔ tasks

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: arranca de inmediato. No bloquea.
- **Foundational (Phase 2)**: depende de Setup. **Bloquea** las user stories.
- **User Stories (Phases 3-6)**: dependen de Foundational. Pueden ir en paralelo si hay capacidad.
- **Polish (Phase 7)**: depende de que las user stories que se quieran entregar estén listas.

### User Story Dependencies

- **US1 (P1, MVP)**: depende sólo de Phase 2.
- **US2 (P2)**: depende de Phase 2 + T011 (schemas). Independiente de US1.
- **US3 (P3)**: depende de US1 (reutiliza el componente `ActionCardContextual` de T022).
- **US4 (P4)**: depende de Phase 2 + T010 (`bulk_set_status`) y T016 (`useBulkSelection`). Independiente de US1/US2/US3.

### Within Each User Story

- Tests obligatorios (T020 en US1, T027 en US2, T041 en US4) **antes** que la implementación de endpoint correspondiente (escríbelos primero, deben fallar, luego implementa).
- Schemas (T011) antes de endpoints que los usen.
- Endpoints antes de los hooks/páginas frontend que los consumen.
- Componentes UI atómicos (MetricCard, ActionCardContextual, etc.) antes de la página que los compone (Dashboard.tsx).

### Parallel Opportunities

- **Phase 1**: T001-T004 todos `[P]`, se pueden lanzar simultáneamente.
- **Phase 2**: tras T005 (migración bloqueante), T006-T011 backend y T012-T017 frontend son `[P]` entre sí.
- **Phase 3**: T021-T023 (componentes UI) son `[P]`; T024 (Dashboard.tsx) los compone.
- **Phase 6**: T042, T043, T044 son `[P]`; T045 los compone.
- **Phase 7**: todos `[P]` salvo T055.

### Equipo paralelo

Tras Phase 2, **3 desarrolladores** pueden tomar:

- Dev A: US1 (dashboard, la grande)
- Dev B: US2 (participación + test innegociable Principio I)
- Dev C: US4 (búsqueda + bulk)

US3 se completa naturalmente al cerrar US1.

---

## Parallel Example: Phase 2 foundational (tras T005)

```bash
# Backend en paralelo (archivos distintos):
Task: "Extender audit.py añadiendo nuevas VALID_ACTIONS"               # T006
Task: "Extender period.get_period() para devolver expected_quorum"      # T007
Task: "Extender period.transition() para purgar quorum en reset"       # T008
Task: "Añadir bulk_set_status() a proposal.py"                          # T010
Task: "Añadir schemas Pydantic en schemas.py"                            # T011

# Frontend en paralelo:
Task: "Extender types.ts con interfaces TS de los nuevos schemas"        # T012
Task: "Extender endpoints.ts con admin.dashboard/participation/etc"      # T013
Task: "Crear useDashboardData con polling+visibility"                    # T014
Task: "Crear useParticipation con polling+visibility"                    # T015
Task: "Crear useBulkSelection genérico"                                   # T016
Task: "Crear iconMap re-exportando lucide-react"                         # T017
```

## Parallel Example: US1 components frontend

```bash
Task: "Implementar MetricCard"               # T021
Task: "Implementar ActionCardContextual"     # T022
Task: "Implementar RecentAuditList"          # T023
```

Tras los 3, T024 (Dashboard.tsx) los compone.

---

## Implementation Strategy

### MVP First (US1 sólo)

1. Phase 1 + Phase 2 (toda)
2. Phase 3 — US1 completa
3. Validar: `pytest backend/tests/integration/test_admin_dashboard.py`, smoke manual del dashboard.
4. Demo/Deploy: ya tienes el dashboard funcionando con polling. Las acciones avanzadas (participación, bulk) se entregan en siguientes iteraciones.

### Entrega incremental

1. MVP (US1) → demo
2. US2 (participación + test innegociable Principio I) → demo
3. US4 (búsqueda + bulk) → demo
4. US3 se cierra con un retoque pequeño tras US1.
5. Polish → preparar merge.

### Equipo paralelo

Con 3 personas tras Phase 2:

- Dev A → US1
- Dev B → US2 (incluido test no-negociable T027)
- Dev C → US4

US3 cierra con T037+T038 cuando US1 esté lista.

---

## Notes

- `[P]` = archivo distinto sin dependencias en tareas no completadas del mismo phase.
- Los **tests no negociables** son T027 (Principio I, US2) y, en menor medida, T037 (matriz de CTAs US3). El merge de la feature está bloqueado hasta que T027 pase.
- Los componentes del prototipo se portan **literalmente** en estructura y clases CSS; sólo se cambia (a) JSX → TSX con tipos, (b) iconos custom → `lucide-react`, (c) `dispatch` → `useNavigate`.
- Tras todas las phases, ejecutar `/speckit-analyze` (T055) para verificación cruzada final.
