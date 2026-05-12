# Implementation Plan: Admin Dashboard

**Branch**: `002-admin-dashboard` | **Date**: 2026-05-12 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-admin-dashboard/spec.md`

## Summary

Panel admin consolidado encima del MVP de votación entregado en 001. Tres
aportaciones concretas:

1. **Nuevo dashboard `/admin`** con hero del estado del periodo, métricas
   clicables, caja "Próximos pasos" con CTAs contextuales por estado y
   feed de las últimas acciones del audit log.
2. **Participación en tiempo real** durante `abierto`: contador X/Y con
   barra de progreso, aforo configurable, lista paginada de votantes
   (emails + timestamp) — siempre desacoplada de `vote_scores`
   (Principio I).
3. **Búsqueda + operaciones bulk** en `/admin/proposals`: filtrado por
   texto, selección múltiple con bulk-bar sticky, excluir/restaurar en
   lote.

Aproximación técnica:

- **Backend**: 1 columna nueva (`expected_quorum` en `periods`) + 5
  endpoints (`/api/admin/dashboard`, `/api/admin/participation`,
  `PATCH /api/admin/period/quorum`,
  `POST /api/admin/proposals/bulk-exclude`,
  `POST /api/admin/proposals/bulk-restore`). Reusa toda la lógica de
  auditoría, autenticación y validación de estado del periodo.
- **Frontend**: porte literal de `admin-dashboard.jsx` del bundle de
  Claude Design a TS/React, mapeando iconos custom → `lucide-react` y
  `dispatch({type:'goto', route})` → `useNavigate`. Reusa los
  componentes UI existentes (`Card`, `Button`, `Badge`, `Banner`,
  `Modal`). Polling cliente cada 10s para reflejar cambios cross-admin
  (FR-130) — sin websockets.

## Technical Context

**Language/Version**: Python 3.11+ (backend), TypeScript 5.4+ (frontend) — sin cambios respecto a 001.

**Primary Dependencies** (sin novedades):
- Backend: FastAPI, Pydantic v2, Authlib, `itsdangerous`, `sqlite3` (stdlib).
- Frontend: React 18, Vite 5, react-router-dom 6, Tailwind 3, lucide-react.

**Storage**: SQLite con WAL. Migración aditiva `0002_admin_quorum.sql`
añade `expected_quorum INTEGER NULL` a `periods`.

**Testing**:
- Backend: `pytest` + `httpx.AsyncClient`. **Test obligatorio nuevo**
  (Principio I): `test_participation_no_score_leak.py` que verifica que
  el endpoint de participación nunca emite scores ni IDs que se puedan
  cruzar con `vote_scores`.
- Frontend: Vitest sobre `ProposalsSearchAndBulk` (selección múltiple,
  search) y `ParticipationView` (paginación, quorum). Sin E2E nuevo en
  esta feature.

**Target Platform**: idem 001 — Linux server (Docker) + navegadores
modernos. Mobile-first para todos los nuevos componentes.

**Project Type**: web application (backend + frontend), mismo layout.

**Performance Goals**:
- Dashboard render inicial < 1 s con datos cacheados; refresco por
  polling cada 10 s.
- Búsqueda en cliente de propuestas < 100 ms para 200 propuestas (SC-103).
- Bulk exclude/restore de ≤ 20 propuestas < 1 s end-to-end (SC-104).

**Constraints**:
- **Principio I (NON-NEGOTIABLE)**: la lista de votantes lee SOLO
  `vote_receipts`; **prohibido** join con `vote_scores`. Test estructural
  obligatorio.
- Polling con `setInterval` cada 10 s; pausar cuando la pestaña no está
  visible (`document.visibilityState`).
- `expected_quorum` se purga junto con `vote_receipts` y `vote_scores`
  en `PERIOD_RESET` (extiende la lógica existente).

**Scale/Scope**: idem volumen 001 (≤ 500 votantes, ≤ 200 propuestas).
Lista de votantes paginada en cliente con `pageSize=50`.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Inicial

| Principio | Evaluación | Justificación |
|---|---|---|
| **I. Anonimato del Voto** | ✅ PASS | `/api/admin/participation` lee `SELECT user_email, voted_at FROM vote_receipts WHERE period_id=1 ORDER BY voted_at DESC` — NUNCA toca `vote_scores`. Test obligatorio nuevo `test_participation_no_score_leak.py` verifica (a) que el response JSON no contiene scores ni `ballot_uuid`, (b) que el handler no abre `vote_scores` (inspección de uso a través de un mock connection). |
| **II. Un Voto por Persona, Atómico** | ✅ PASS | Sin cambios en el flujo de emisión de voto. Las acciones bulk (exclude/restore) operan sobre `proposals`, no sobre papeletas, y son atómicas vía `BEGIN IMMEDIATE` + insert N entradas de audit en la misma transacción. |
| **III. Auth dominio @phicus.es** | ✅ PASS | Reusa `require_admin` existente. Endpoints nuevos protegidos por la misma dep. |
| **IV. Simplicidad Pragmática** | ✅ PASS | Sin nuevas dependencias. Polling 10 s en lugar de websockets/SSE. Una sola columna nueva en DB. Reuso total de componentes UI ya portados. |
| **V. Trazabilidad Administrativa** | ✅ PASS | Bulk operations emiten **una entrada de audit por propuesta** (decisión documentada en spec FR-122), preservando granularidad. Cambios de `expected_quorum` se loguean con nueva acción `PERIOD_QUORUM_SET`. |

**Resultado**: ✅ Gate inicial superado. Sin violaciones; Complexity Tracking vacío.

### Post-diseño (re-evaluación)

| Principio | Estado | Notas |
|---|---|---|
| I. Anonimato | ✅ PASS | `data-model.md` confirma que `expected_quorum` se almacena en `periods` (junto al estado), sin tocar tablas de votos. El contrato `/api/admin/participation` en `contracts/delta.yaml` documenta explícitamente que el response no contiene scores. |
| II. Atomicidad | ✅ PASS | Endpoints bulk usan `transaction(conn, immediate=True)` y `conn.executemany` para audit log. |
| III. Auth | ✅ PASS | Sin cambios. |
| IV. Simplicidad | ✅ PASS | `data-model.md` añade 1 columna nullable; `contracts/delta.yaml` documenta 5 endpoints nuevos; tareas frontend son portes de un design ya implementado en JSX. |
| V. Trazabilidad | ✅ PASS | `models/audit.py` extiende `VALID_ACTIONS` con `PROPOSAL_BULK_EXCLUDE`, `PROPOSAL_BULK_RESTORE`, `PERIOD_QUORUM_SET`; granularidad por propuesta documentada. |

**Resultado post-diseño**: ✅ Gate superado. No hay desvíos.

## Project Structure

### Documentation (this feature)

```text
specs/002-admin-dashboard/
├── plan.md              # Este archivo
├── research.md          # Phase 0
├── data-model.md        # Phase 1 — migración 0002 + invariantes
├── quickstart.md        # Phase 1
├── contracts/
│   └── delta.yaml       # Sólo el delta sobre 001/openapi.yaml (5 endpoints nuevos)
├── design/              # Bundle de Claude Design (prototipo de referencia)
│   ├── admin-dashboard.jsx
│   ├── prototype.html
│   ├── screens.jsx
│   ├── icons.jsx
│   ├── data.jsx
│   ├── app.css
│   └── chat-transcript.md
├── checklists/
│   └── requirements.md
├── design-brief.md
└── tasks.md             # Phase 2 (/speckit-tasks)
```

### Source Code (extensiones sobre la base existente)

```text
backend/src/kratos/
├── api/
│   ├── admin_dashboard.py        # NUEVO: GET /api/admin/dashboard
│   ├── admin_participation.py    # NUEVO: GET /api/admin/participation, PATCH /api/admin/period/quorum
│   └── admin_proposals.py        # EXTENDIDO: bulk-exclude, bulk-restore
├── migrations/
│   └── 0002_admin_quorum.sql     # NUEVO: ALTER TABLE periods ADD expected_quorum INTEGER
├── models/
│   ├── audit.py                  # EXTENDIDO: PROPOSAL_BULK_*, PERIOD_QUORUM_SET
│   ├── period.py                 # EXTENDIDO: get_period devuelve expected_quorum; transition purga en reset
│   └── proposal.py               # EXTENDIDO: bulk_set_status()
└── tests/
    ├── integration/
    │   ├── test_admin_dashboard.py        # NUEVO
    │   ├── test_admin_bulk_proposals.py   # NUEVO
    │   └── test_participation_no_score_leak.py   # NUEVO (Principio I, innegociable)

frontend/src/
├── pages/admin/
│   ├── Dashboard.tsx              # NUEVO — porta AdminDashboard
│   ├── Participation.tsx          # NUEVO — porta AdminParticipationScreen
│   └── Proposals.tsx              # REESCRITO — porta AdminProposalsV2 (sustituye al actual)
├── components/admin/
│   ├── MetricCard.tsx             # NUEVO
│   ├── ActionCardContextual.tsx   # NUEVO
│   ├── RecentAuditList.tsx        # NUEVO
│   ├── ParticipationProgress.tsx  # NUEVO (extraído de ParticipationView)
│   ├── VotersList.tsx             # NUEVO (paginación cliente)
│   ├── ProposalsSearch.tsx        # NUEVO
│   └── BulkBar.tsx                # NUEVO (sticky bottom, animación bulk-rise)
├── api/
│   ├── types.ts                   # EXTENDIDO: DashboardData, ParticipationData
│   └── endpoints.ts               # EXTENDIDO: admin.dashboard, admin.participation, admin.setQuorum, admin.bulkExclude, admin.bulkRestore
├── hooks/
│   ├── useDashboardData.ts        # NUEVO — polling 10s + Page Visibility
│   ├── useParticipation.ts        # NUEVO — polling 10s
│   └── useBulkSelection.ts        # NUEVO — Set<number> + toggle/all/none
└── styles/
    └── admin.css                  # NUEVO — clases adm-* (portadas del prototipo)
```

**Structure Decision**: extensión aditiva sobre el árbol existente
(Opción 2 — web app). Reutiliza el sistema visual completo y los
componentes UI ya portados. La pantalla `/admin/proposals` se reescribe
en sitio (sustituye la actual, no convive en paralelo) por la
sustitución cosmética + de comportamiento que aporta US4.

## Complexity Tracking

Sin violaciones. Esta sección queda vacía a propósito.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| _(ninguna)_ | _(N/A)_ | _(N/A)_ |
