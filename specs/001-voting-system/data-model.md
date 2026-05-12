# Phase 1 — Data Model: Kratos

**Branch**: `001-voting-system` · **Date**: 2026-05-11

Modelo persistente en SQLite (modo WAL, `foreign_keys = ON`). Todas las
fechas/horas se almacenan en UTC ISO-8601. Las claves primarias son
`INTEGER PRIMARY KEY AUTOINCREMENT` salvo indicación distinta.

> **Invariante crítica (Principio I)**: no existe ninguna columna, ni
> ningún join posible mediante FK, que enlace `vote_scores` con la
> identidad del votante. Las únicas referencias indirectas son
> `period_id` (compartido entre todas las papeletas del mismo periodo)
> y `ballot_uuid` (sólo agrupa los scores de una papeleta; jamás se
> persiste fuera de `vote_scores`).

---

## Entidades

### `periods`

Estado global del proceso de votación. Por diseño hay **exactamente una
fila** (`id = 1`) en cualquier instante; el sistema NO soporta múltiples
elecciones simultáneas.

| Campo | Tipo | Constraints | Descripción |
|---|---|---|---|
| `id` | INTEGER | PK, default 1 | Siempre 1; ver "Estado" abajo. |
| `state` | TEXT | NOT NULL, CHECK in `('preparacion','abierto','cerrado')` | Estado actual. |
| `opened_at` | TEXT | NULL | Timestamp UTC del último `preparacion → abierto`. |
| `closed_at` | TEXT | NULL | Timestamp UTC del último `abierto → cerrado`. |
| `opened_by` | TEXT | NULL | Email del admin que abrió. |
| `closed_by` | TEXT | NULL | Email del admin que cerró. |

**Transiciones permitidas**:

```
preparacion ─────(open)─────► abierto
abierto     ─────(close)────► cerrado
cerrado     ─────(reset)────► preparacion  (purga ballots + receipts del ciclo)
```

Cualquier otra transición está prohibida y debe rechazarse a nivel de
servicio (no por trigger SQL, por simplicidad — el chequeo vive en
`models/period.py`).

---

### `proposals`

Propuestas candidatas a votación. Aparecen como votables sólo cuando
`status = 'votable'`.

| Campo | Tipo | Constraints | Descripción |
|---|---|---|---|
| `id` | INTEGER | PK AUTOINCREMENT | |
| `name` | TEXT | NOT NULL, len 1..200 | Nombre visible. |
| `description` | TEXT | NOT NULL | Objetivo / problema que resuelve. |
| `how` | TEXT | NULL | Cómo lo haría (opcional, del Google Form). |
| `time_estimate` | TEXT | NULL | Estimación temporal (opcional). |
| `original_author_email` | TEXT | NULL | Email del autor original (si vino del Form). |
| `status` | TEXT | NOT NULL, CHECK in `('votable','excluded','merged_parent')` | |
| `created_at` | TEXT | NOT NULL DEFAULT (`datetime('now')`) | |
| `updated_at` | TEXT | NOT NULL DEFAULT (`datetime('now')`) | Actualizado por trigger en edits admin. |

**Reglas de estado**:

- `votable`: aparece en `/api/proposals` y se puntúa en el voto.
- `excluded`: oculta para votantes; visible para admin con flag de
  restauración.
- `merged_parent`: la propuesta es padre de una fusión; NO se muestra a
  votantes, sí a admins con referencia a la propuesta hija.

**Índices**:

- `idx_proposals_status` ON (`status`).

---

### `proposal_merges`

Relación N:M entre la propuesta hija (resultado de fusionar) y sus padres.

| Campo | Tipo | Constraints | Descripción |
|---|---|---|---|
| `merged_proposal_id` | INTEGER | NOT NULL, FK → `proposals.id` | Propuesta hija (votable). |
| `parent_proposal_id` | INTEGER | NOT NULL, FK → `proposals.id` | Padre (status `merged_parent`). |
| `merged_at` | TEXT | NOT NULL DEFAULT (`datetime('now')`) | |
| `merged_by` | TEXT | NOT NULL | Email del admin. |

**Constraints**:

- PRIMARY KEY (`merged_proposal_id`, `parent_proposal_id`).
- Un padre puede aparecer en **un único** merge a la vez. Se enforce con
  índice UNIQUE adicional sobre (`parent_proposal_id`) cuando el padre
  está en `merged_parent`.

**Deshacer fusión**: aplicación elimina la fila de `proposal_merges` y
cambia `status` de los padres a `votable` y de la hija a un estado lógico
"deleted" (que en SQL traducimos a borrado físico, pues no hay votos
emitidos en estado `preparacion`).

---

### `vote_receipts`

Prueba de que un email ha votado **en este ciclo**. No contiene
puntuaciones.

| Campo | Tipo | Constraints | Descripción |
|---|---|---|---|
| `id` | INTEGER | PK AUTOINCREMENT | |
| `user_email` | TEXT | NOT NULL | Email en minúsculas. |
| `period_id` | INTEGER | NOT NULL, FK → `periods.id` | Siempre 1. |
| `voted_at` | TEXT | NOT NULL | UTC ISO con precisión de **minuto** (segundos = `:00`). |

**Constraints**:

- UNIQUE (`user_email`, `period_id`) — implementación del Principio II.

**Índices**:

- `idx_vote_receipts_email` ON (`user_email`) implícito por UNIQUE.

**Propiedad fundamental**: esta tabla y `vote_scores` no comparten ningún
campo correlacionable. `period_id` aparece en ambas pero es constante
para todas las papeletas, así que no individualiza nada.

---

### `vote_scores`

Las puntuaciones efectivas. **Anónimas por construcción**.

| Campo | Tipo | Constraints | Descripción |
|---|---|---|---|
| `id` | INTEGER | PK AUTOINCREMENT | |
| `period_id` | INTEGER | NOT NULL, FK → `periods.id` | Constante 1 en la práctica. |
| `proposal_id` | INTEGER | NOT NULL, FK → `proposals.id` | |
| `score` | INTEGER | NOT NULL, CHECK between 1 and 10 | |
| `ballot_uuid` | TEXT | NOT NULL | UUIDv4 hex; agrupa los N scores de una papeleta. |

**Constraints**:

- UNIQUE (`ballot_uuid`, `proposal_id`) — una papeleta no puede tener
  dos scores para la misma propuesta.

**Índices**:

- `idx_vote_scores_proposal` ON (`proposal_id`) para acelerar el ranking.

**Propiedad anti-correlación**:

- `ballot_uuid` no se persiste en ninguna otra tabla. El servidor lo
  genera dentro de la transacción de emisión y lo descarta tras
  ejecutarla.
- No hay columna `user_email`, `user_id`, `ip`, ni `user_agent` en esta
  tabla. El test `test_vote_anonymity.py` verifica esto inspeccionando
  `PRAGMA table_info('vote_scores')`.

---

### `admin_audit_log`

Registro append-only de acciones administrativas (Principio V).

| Campo | Tipo | Constraints | Descripción |
|---|---|---|---|
| `id` | INTEGER | PK AUTOINCREMENT | |
| `admin_email` | TEXT | NOT NULL | Email del admin. |
| `action` | TEXT | NOT NULL | Código de acción (`PERIOD_OPEN`, `PERIOD_CLOSE`, `PERIOD_RESET`, `PROPOSAL_EDIT`, `PROPOSAL_EXCLUDE`, `PROPOSAL_RESTORE`, `PROPOSAL_MERGE`, `PROPOSAL_UNMERGE`, `RESULTS_EXPORT`, `CSV_IMPORT`). |
| `target_ids` | TEXT | NULL | JSON array de IDs afectados (p.ej. `[12, 47]` en merge). |
| `period_state_before` | TEXT | NULL | Snapshot del estado de periodo antes. |
| `period_state_after` | TEXT | NULL | Snapshot del estado de periodo después. |
| `details` | TEXT | NULL | JSON con metadatos adicionales (nombre nuevo en merge, etc.). |
| `occurred_at` | TEXT | NOT NULL DEFAULT (`datetime('now')`) | UTC. |

**Reglas**:

- Append-only a nivel de aplicación: el módulo `models/audit.py` sólo
  expone `append()`, jamás `update()` ni `delete()`.
- NUNCA debe contener IDs de `vote_scores` o `vote_receipts`. El test
  `test_admin_audit_no_vote_link.py` lo verifica.

---

## Diagrama de relaciones

```text
                ┌────────────────────┐
                │     periods        │
                │ id state opened_at │
                └────────┬───────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
┌───────▼────────┐ ┌─────▼────────┐ ┌─────▼───────────┐
│ vote_receipts  │ │ vote_scores  │ │ admin_audit_log │
│ (user_email)   │ │ (NO user_*)  │ │ (admin_email)   │
│ UNIQUE         │ │ ballot_uuid  │ │ action          │
│ (email,period) │ │ proposal_id  │ │ target_ids      │
└────────────────┘ └─────┬────────┘ └─────────────────┘
                         │
                  ┌──────▼───────┐
                  │  proposals   │
                  │ status, name │
                  └──────┬───────┘
                         │
                  ┌──────▼────────────┐
                  │ proposal_merges   │
                  │ child + parent    │
                  └───────────────────┘
```

`vote_receipts` y `vote_scores` **no se pueden join-ear**: comparten sólo
`period_id` (constante) y no hay ningún identificador del votante en
`vote_scores`.

---

## SQL de inicialización (referencia)

```sql
PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

CREATE TABLE periods (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    state TEXT NOT NULL CHECK (state IN ('preparacion','abierto','cerrado')),
    opened_at TEXT, closed_at TEXT,
    opened_by TEXT, closed_by TEXT
);
INSERT OR IGNORE INTO periods(id, state) VALUES (1, 'preparacion');

CREATE TABLE proposals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 200),
    description TEXT NOT NULL,
    how TEXT,
    time_estimate TEXT,
    original_author_email TEXT,
    status TEXT NOT NULL CHECK (status IN ('votable','excluded','merged_parent')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_proposals_status ON proposals(status);

CREATE TABLE proposal_merges (
    merged_proposal_id INTEGER NOT NULL REFERENCES proposals(id),
    parent_proposal_id INTEGER NOT NULL REFERENCES proposals(id),
    merged_at TEXT NOT NULL DEFAULT (datetime('now')),
    merged_by TEXT NOT NULL,
    PRIMARY KEY (merged_proposal_id, parent_proposal_id)
);
CREATE UNIQUE INDEX idx_proposal_merges_parent ON proposal_merges(parent_proposal_id);

CREATE TABLE vote_receipts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_email TEXT NOT NULL,
    period_id INTEGER NOT NULL REFERENCES periods(id),
    voted_at TEXT NOT NULL,
    UNIQUE (user_email, period_id)
);

CREATE TABLE vote_scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    period_id INTEGER NOT NULL REFERENCES periods(id),
    proposal_id INTEGER NOT NULL REFERENCES proposals(id),
    score INTEGER NOT NULL CHECK (score BETWEEN 1 AND 10),
    ballot_uuid TEXT NOT NULL,
    UNIQUE (ballot_uuid, proposal_id)
);
CREATE INDEX idx_vote_scores_proposal ON vote_scores(proposal_id);

CREATE TABLE admin_audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    admin_email TEXT NOT NULL,
    action TEXT NOT NULL,
    target_ids TEXT,
    period_state_before TEXT,
    period_state_after TEXT,
    details TEXT,
    occurred_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

---

## Reglas de validación derivadas (mapping a FRs)

| Regla | Implementada en | Cubre |
|---|---|---|
| Email lowercased al insertar receipt | `models/ballot.py` | FR-035 (case sensitivity attacks) |
| `voted_at` con segundos a `00` | `models/ballot.py` | FR-033 (no timestamp de alta resolución) |
| Score ∈ {1..10} | CHECK SQL + validación Pydantic | FR-031 |
| Papeleta cubre todas las propuestas `votable` | `models/ballot.py` antes de la transacción | FR-031 |
| Papeleta sólo aceptada con periodo `abierto` | `models/ballot.py` | FR-036 |
| Inmutabilidad de la papeleta | Sin endpoint de UPDATE; constraint UNIQUE | FR-037 |
| Append-only audit log | `models/audit.py` (sólo expone `append`) | FR-050 |
| No correlación audit ↔ voto | Tablas separadas, sin FK | FR-051 |
