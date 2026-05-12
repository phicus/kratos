# Phase 1 — Data Model: Admin Dashboard

**Branch**: `002-admin-dashboard` · **Date**: 2026-05-12

Esta feature **NO añade entidades persistentes**. Sólo:

1. Una **columna nueva** en la tabla `periods` existente.
2. Tres **acciones nuevas** en el enum lógico de `admin_audit_log`.

Toda la lógica reusa el modelo de datos del MVP 001.

---

## Modificación: tabla `periods`

```sql
-- migrations/0002_admin_quorum.sql
ALTER TABLE periods ADD COLUMN expected_quorum INTEGER NULL;
```

| Campo (existente)     | (sin cambios) |
|-----------------------|---------------|
| `id`                  | PK = 1        |
| `state`               | `preparacion`/`abierto`/`cerrado` |
| `opened_at`, `closed_at` | timestamps |
| `opened_by`, `closed_by`| emails admin |
| **`expected_quorum`** | **NUEVO** — INTEGER NULL. Número esperado de votantes; usado sólo para calcular el % de participación. NULL si no se ha configurado. |

**Reglas de validación**:

- Si se proporciona, debe ser `≥ 1` (CHECK en aplicación, no en SQL — más fácil de evolucionar).
- Sólo se puede modificar con periodo `abierto` (regla de negocio en `models/period.py`).
- Se persiste en `NULL` en `PERIOD_RESET` (extensión del UPDATE existente).

**Migración (idempotente)**:

- El runner de migraciones (`init_db()`) ya soporta múltiples archivos
  `.sql` aplicados en orden alfabético; `0002_admin_quorum.sql` aplica
  una sola vez gracias a la tabla `schema_migrations`.
- En SQLite, `ALTER TABLE ADD COLUMN` con `NULL` por defecto es
  instantáneo y no requiere reescritura.

---

## Extensión de `admin_audit_log` (sin cambio de esquema)

La tabla `admin_audit_log` no cambia. Sólo añadimos tres códigos de
`action` válidos en `models/audit.py`:

```python
VALID_ACTIONS = frozenset({
    # ... existentes (PERIOD_OPEN, ...) ...
    "PROPOSAL_BULK_EXCLUDE",    # NUEVO
    "PROPOSAL_BULK_RESTORE",    # NUEVO
    "PERIOD_QUORUM_SET",        # NUEVO
})
```

**Convenciones para los nuevos códigos**:

| Acción                  | `target_ids`                  | `details`                                  |
|-------------------------|-------------------------------|--------------------------------------------|
| `PROPOSAL_BULK_EXCLUDE` | _omitido en la entrada padre_ | _omitido_                                  |
| `PROPOSAL_BULK_RESTORE` | _omitido en la entrada padre_ | _omitido_                                  |
| `PERIOD_QUORUM_SET`     | _vacío_                       | `{"old": int\|null, "new": int\|null}`     |

**Importante**: las acciones bulk **NO** crean una entrada-padre; en su
lugar, persisten **una entrada por propuesta afectada** con
`action=PROPOSAL_EXCLUDE` (o `PROPOSAL_RESTORE`) y un campo
`details.bulk_group_id` opcional para agrupar visualmente en la UI:

```json
{ "bulk_group_id": "uuid-corto-aleatorio" }
```

`bulk_group_id` no se persiste fuera del log y no se cruza con ninguna
otra tabla. Es opcional para la UI, no para la auditoría.

> **Razón**: preserva la propiedad de "buscar en el log por ID de
> propuesta" (FR-122 / `research.md §3`) sin perder la noción visual de
> "esto fue parte de un bulk".

Se reusan los códigos `PROPOSAL_EXCLUDE` y `PROPOSAL_RESTORE` ya
existentes; los códigos `PROPOSAL_BULK_*` sólo aparecen si en el futuro
queremos emitir una entrada-resumen además (no en el MVP de esta
feature).

---

## Lectura de datos del dashboard

El endpoint `GET /api/admin/dashboard` se compone de queries existentes
+ una nueva agregación. Resumen:

```sql
-- 1. estado del periodo (incluye expected_quorum)
SELECT state, opened_at, closed_at, opened_by, closed_by, expected_quorum
FROM periods WHERE id = 1;

-- 2. contadores de propuestas por estado
SELECT
  SUM(CASE WHEN status='votable'        THEN 1 ELSE 0 END) AS votable,
  SUM(CASE WHEN status='excluded'       THEN 1 ELSE 0 END) AS excluded,
  SUM(CASE WHEN status='merged_parent'  THEN 1 ELSE 0 END) AS merged_parent
FROM proposals;

-- 3. papeletas emitidas
SELECT COUNT(*) AS ballots FROM vote_receipts WHERE period_id = 1;

-- 4. últimas 5 acciones admin
SELECT admin_email, action, target_ids, period_state_before,
       period_state_after, details, occurred_at
FROM admin_audit_log
ORDER BY occurred_at DESC, id DESC
LIMIT 5;
```

**Crítico (Principio I)**: la query 3 lee `COUNT(*)` de `vote_receipts`
agregado, sin ninguna columna de identidad. La query 4 lee
`admin_audit_log`, que por construcción no contiene scores ni
`ballot_uuid`.

## Lectura de datos de participación

```sql
-- /api/admin/participation
-- ÚNICA query sobre vote_receipts; ningún JOIN con vote_scores.
SELECT user_email, voted_at
FROM vote_receipts
WHERE period_id = 1
ORDER BY voted_at DESC, id DESC;
```

El servicio agrega `voters_count = len(rows)` y mete `expected_quorum`
de `periods`. **NO se calculan scores, ni `ballot_uuid`, ni se hace
`JOIN`** con `vote_scores` (validado por test estructural en Phase 0
§9).

---

## Invariante de anonimato (Principio I)

Diagrama de **lo que está permitido** desde los endpoints admin nuevos:

```text
┌────────────────────┐      ┌──────────────────────┐
│ periods            │◄────▶│ admin_audit_log      │
│   id, state,       │      │   action, target_ids │
│   expected_quorum  │      │   period_state_*     │
└────────────────────┘      └──────────────────────┘
        │
        │ FK period_id
        ▼
┌────────────────────┐
│ vote_receipts      │  ← LO ÚNICO que lee /participation
│   user_email,      │
│   voted_at         │
└────────────────────┘
                            ╔══════════════════════╗
                            ║ vote_scores          ║ ← NUNCA tocado
                            ║   score, ballot_uuid ║   por endpoints
                            ║   proposal_id        ║   /admin/dashboard
                            ╚══════════════════════╝   ni /participation
```

`vote_scores` queda completamente fuera del scope de esta feature. El
test obligatorio `test_participation_no_score_leak.py` verifica las
tres condiciones documentadas en `research.md §9`.

---

## Reglas de validación derivadas (mapping a FRs)

| Regla | Implementada en | FR cubre |
|---|---|---|
| `expected_quorum >= 1` | `models/period.py::set_quorum()` | FR-112 |
| Aforo sólo configurable en `abierto` | `models/period.py::set_quorum()` | FR-112 |
| Aforo se purga en reset | `models/period.py::transition(_, _, 'preparacion')` | FR-113 |
| `/api/admin/participation` no expone scores | `api/admin_participation.py` (no importa `vote_scores`) | FR-114 / Principio I |
| Bulk operations atómicas | `transaction(immediate=True)` + `executemany` | FR-122 |
| Bulk persisten una entrada por target | `models/audit.py::append()` en bucle dentro de `transaction()` | FR-122 |
| Bulk bloqueado fuera de `preparacion` | `_require_preparacion(conn)` (helper existente) | FR-123 |
| Polling 10s con Page Visibility | `hooks/useDashboardData.ts` y `useParticipation.ts` | FR-106, FR-130 |
