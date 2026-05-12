# Implementation Plan: Kratos

**Branch**: `001-voting-system` | **Date**: 2026-05-11 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-voting-system/spec.md`

## Summary

Sistema web interno donde empleados de Phicus, autenticados con Google
Workspace (`@phicus.es`), puntúan de 1 a 10 propuestas internas. El voto es
anónimo (separación física entre "quién votó" y "qué se votó"), único por
persona (UNIQUE constraint + transacción atómica), y sujeto al estado del
periodo (preparación/abierto/cerrado) controlado por administradores
configurados por env.

Aproximación técnica: backend FastAPI con SQLite (modo WAL + transacciones
explícitas para atomicidad), sesión por cookie firmada (no JWT) tras
validar `hd=phicus.es` del ID token de Google. Frontend SPA TypeScript +
React + Vite, servido como estáticos por el mismo proceso FastAPI en
producción y por el dev server de Vite con proxy en desarrollo. Diseño UI
generado iterativamente por Claude (interpretación de "Claude Design" del
input del usuario) sobre primitivos accesibles (Radix UI) y Tailwind.

## Technical Context

**Language/Version**: Python 3.11+ (backend), TypeScript 5.4+ (frontend)
**Primary Dependencies**:
- Backend: FastAPI, Pydantic v2, Authlib (OIDC con Google), `itsdangerous`
  (firma de cookie), `sqlite3` (stdlib), `uvicorn`, `python-multipart`.
- Frontend: React 18, Vite 5, react-router-dom 6, Tailwind CSS 3, Radix UI
  primitives, `zod` para validación de formularios.

**Storage**: SQLite ≥ 3.40 en modo WAL, archivo único `data/voting.db`.
Persistencia atómica vía transacciones explícitas; índice UNIQUE sobre
`vote_receipts(user_email, period_id)` como cerrojo lógico contra dobles
votos.

**Testing**:
- Backend: `pytest` + `httpx.AsyncClient` con `TestClient` de FastAPI;
  fixtures de base de datos in-memory + temp file. Test obligatorio del
  principio I (anonimato) y II (atomicidad/unicidad).
- Frontend: Vitest + React Testing Library para componentes; Playwright
  para un único E2E golden-path (login simulado, voto, resultados).

**Target Platform**: Servidor Linux (Docker, Python 3.11 base image),
navegadores modernos (últimas 2 versiones mayores de Chrome, Firefox,
Safari, Edge).

**Project Type**: Web application (backend service + frontend SPA).

**Performance Goals**:
- Ranking final: < 3 s para 500 votantes × 200 propuestas (SC-005).
- Emisión de voto: < 500 ms p95 (incluye transacción y validación
  server-side).
- Listado de propuestas: < 200 ms p95.

**Constraints**:
- Anonimato verificable por test: NINGÚN campo en `vote_scores` puede
  correlacionarse con la identidad del votante.
- Atomicidad transaccional: emisión de papeleta es todo-o-nada.
- Single-process deployment: nada de microservicios, colas o cachés
  distribuidas (por constitución, principio IV).
- Lista de administradores inmutable en runtime (configurada por env).

**Scale/Scope**: ≤ 500 votantes activos, ≤ 200 propuestas, 1 elección
activa a la vez, ~20 endpoints HTTP, ~10 pantallas frontend.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Inicial (antes de research)

| Principio | Evaluación | Justificación |
|---|---|---|
| **I. Anonimato del Voto** (NON-NEGOTIABLE) | ✅ PASS | El diseño separa físicamente `vote_receipts` (con `user_email`) de `vote_scores` (sin ningún identificador del usuario). Los scores se agrupan por `ballot_uuid` aleatorio sin relación con el receipt. Test obligatorio verificará esta separación. |
| **II. Un Voto por Persona, Atómico** (NON-NEGOTIABLE) | ✅ PASS | `UNIQUE(user_email, period_id)` en `vote_receipts` + transacción explícita SQLite que inserta receipt y scores en una sola unidad de trabajo. Test obligatorio con 100 envíos concurrentes verificará que sólo 1 receipt sobrevive. |
| **III. Autenticación Corporativa Restringida** | ✅ PASS | Endpoint `/auth/google/callback` valida server-side `id_token.claims["hd"] == "phicus.es"` y `email.endswith("@phicus.es")` antes de crear sesión. Cliente no participa en la decisión. |
| **IV. Simplicidad Pragmática (YAGNI)** | ✅ PASS | Un solo servicio FastAPI, un solo archivo SQLite, un solo frontend SPA. Sin ORM pesado (usamos `sqlite3` stdlib + `Pydantic` para validación). Sin colas, sin Redis, sin Celery. Authlib es la única dep "no trivial" y se justifica porque escribir un cliente OIDC desde cero violaría más este principio. |
| **V. Trazabilidad Administrativa** | ✅ PASS | Tabla `admin_audit_log` append-only (sin DELETE/UPDATE habilitados a nivel aplicación) que registra cada acción admin con email, timestamp, acción e IDs afectados. Independiente físicamente de `vote_scores`. |

**Resultado**: ✅ Gate inicial superado. Sin violaciones; sección
"Complexity Tracking" vacía.

### Post-diseño (re-evaluación tras Phase 1)

| Principio | Evaluación | Notas |
|---|---|---|
| I. Anonimato | ✅ PASS | El `data-model.md` confirma que `vote_scores.ballot_uuid` es un UUIDv4 generado en el servidor y NO se persiste en ninguna otra tabla; la relación con el votante se rompe en la transacción y no se puede reconstruir. |
| II. Atomicidad/Unicidad | ✅ PASS | Contract `POST /api/ballot` describe el flujo transaccional; el test de carrera está reflejado en `quickstart.md`. |
| III. Auth dominio | ✅ PASS | Contract `GET /auth/google/callback` documenta validación `hd` + sufijo email server-side. |
| IV. Simplicidad | ✅ PASS | El árbol de proyecto (Opción 2 web) tiene 2 raíces (`backend/`, `frontend/`); no se introducen submódulos extra. |
| V. Trazabilidad | ✅ PASS | Endpoints admin escriben en `admin_audit_log` antes de retornar éxito; documentado en contracts. |

**Resultado post-diseño**: ✅ Gate superado, sin desvíos.

## Project Structure

### Documentation (this feature)

```text
specs/001-voting-system/
├── plan.md              # Este archivo (/speckit-plan)
├── research.md          # Phase 0 (/speckit-plan)
├── data-model.md        # Phase 1 (/speckit-plan)
├── quickstart.md        # Phase 1 (/speckit-plan)
├── contracts/
│   ├── openapi.yaml     # Contrato HTTP de toda la API
│   └── README.md        # Resumen y convenciones de los endpoints
├── checklists/
│   └── requirements.md  # Checklist de calidad del spec
└── tasks.md             # Phase 2 (/speckit-tasks, NO creado aquí)
```

### Source Code (repository root)

```text
backend/
├── pyproject.toml
├── src/
│   └── kratos/
│       ├── __init__.py
│       ├── main.py                # App FastAPI + montaje SPA
│       ├── config.py              # Carga env: GOOGLE_*, SESSION_SECRET, ADMIN_EMAILS, DB_PATH
│       ├── db.py                  # Conexión SQLite (WAL, foreign_keys), migraciones
│       ├── auth/
│       │   ├── google.py          # Cliente OIDC Authlib, validación hd
│       │   ├── session.py         # Cookie firmada (itsdangerous), get_current_user
│       │   └── deps.py            # Dependencies FastAPI: require_user, require_admin
│       ├── models/
│       │   ├── proposal.py        # Pydantic schemas + funciones CRUD
│       │   ├── period.py
│       │   ├── ballot.py          # Submit ballot transaccional
│       │   ├── audit.py
│       │   └── results.py
│       ├── api/
│       │   ├── auth.py            # /auth/google/*, /auth/logout
│       │   ├── me.py              # /api/me
│       │   ├── proposals.py       # /api/proposals
│       │   ├── period.py          # /api/period
│       │   ├── ballot.py          # /api/ballot (POST)
│       │   ├── results.py         # /api/results, /api/results.csv
│       │   └── admin.py           # /api/admin/*
│       └── seed/
│           └── import_csv.py      # Importador del CSV de Google Form
├── data/
│   ├── voting.db                  # SQLite (gitignored)
│   └── seed/
│       └── proposals.csv          # Copia del CSV original
└── tests/
    ├── contract/
    │   ├── test_openapi_conformance.py
    │   └── test_auth_domain.py
    ├── integration/
    │   ├── test_vote_anonymity.py  # PRINCIPIO I (no-negociable)
    │   ├── test_vote_unicity.py    # PRINCIPIO II (no-negociable)
    │   ├── test_period_transitions.py
    │   ├── test_merge_proposals.py
    │   └── test_results_ranking.py
    └── unit/
        ├── test_session_cookie.py
        ├── test_csv_import.py
        └── test_domain_validation.py

frontend/
├── package.json
├── tsconfig.json
├── vite.config.ts                  # Proxy /api y /auth → backend en dev
├── index.html
├── src/
│   ├── main.tsx
│   ├── App.tsx                     # Router
│   ├── api/
│   │   ├── client.ts               # fetch wrapper con credentials: 'include'
│   │   ├── proposals.ts
│   │   ├── ballot.ts
│   │   ├── results.ts
│   │   └── admin.ts
│   ├── components/
│   │   ├── ProposalCard.tsx
│   │   ├── ScoreSelector.tsx       # 1..10
│   │   ├── PeriodBanner.tsx
│   │   ├── RankingTable.tsx
│   │   ├── AdminPanel.tsx
│   │   └── ui/                     # Primitivos Radix + Tailwind
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── Vote.tsx                # Pantalla principal del votante
│   │   ├── AlreadyVoted.tsx
│   │   ├── PeriodClosed.tsx
│   │   ├── Results.tsx
│   │   └── admin/
│   │       ├── Proposals.tsx
│   │       ├── Merge.tsx
│   │       ├── Period.tsx
│   │       └── AuditLog.tsx
│   ├── hooks/
│   │   ├── useMe.ts
│   │   └── usePeriod.ts
│   └── styles/
│       └── index.css
└── tests/
    ├── component/
    │   └── ScoreSelector.test.tsx
    └── e2e/
        └── vote-golden-path.spec.ts  # Playwright

.env.example                         # GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, SESSION_SECRET, ADMIN_EMAILS, DB_PATH
Dockerfile                           # Multi-stage: build frontend → copia a backend/static → run uvicorn
docker-compose.yml                   # Servicio único + volumen para data/
```

**Structure Decision**: **Opción 2 (web application)** — backend FastAPI
en `backend/` + frontend SPA en `frontend/`. En desarrollo corren por
separado (uvicorn + vite dev server con proxy `/api` y `/auth`); en
producción el backend sirve los estáticos compilados desde
`backend/static/` (montaje `StaticFiles` con fallback a `index.html` para
las rutas de React Router). Esto satisface el principio IV (un solo
proceso desplegable) sin pagar el coste de un monorepo Lerna/Turbo.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

Sin violaciones. Esta sección queda vacía a propósito.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| _(ninguna)_ | _(N/A)_ | _(N/A)_ |
