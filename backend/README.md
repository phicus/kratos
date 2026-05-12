# Backend — Kratos

FastAPI + SQLite. Stack mínimo siguiendo el Principio IV de la constitución.

## Requisitos

- Python 3.11+
- SQLite ≥ 3.40 (incluido con la stdlib de Python)

## Dev local

```bash
python -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"

# Variables de entorno (lee .env de la raíz del repo)
cp ../.env.example ../.env  # editar GOOGLE_CLIENT_ID/SECRET, SESSION_SECRET

# Inicializar DB
python -m kratos.db init

# Sembrar propuestas desde el CSV del Google Form
python -m kratos.seed.import_csv data/seed/proposals.csv

# Servidor de desarrollo
uvicorn kratos.main:app --reload --port 8000
```

API docs interactiva en <http://localhost:8000/api/docs>.

## Tests

```bash
.venv/bin/python -m pytest tests/                                # todos
.venv/bin/python -m pytest tests/integration/test_vote_anonymity.py -v   # Principio I
.venv/bin/python -m pytest tests/integration/test_vote_unicity.py   -v   # Principio II
.venv/bin/python -m pytest tests/contract/test_auth_domain.py       -v   # Principio III
```

Los tres tests de los Principios I, II y III son **innegociables** (constitución v1.0.0).

## Layout

```text
src/kratos/
├── config.py              # Settings tipadas (env)
├── db.py                  # SQLite + migraciones + transacciones
├── main.py                # FastAPI app factory
├── migrations/
│   └── 0001_initial.sql
├── auth/
│   ├── google.py          # OIDC Google + validación hd=phicus.es
│   ├── session.py         # Cookie firmada (itsdangerous)
│   └── deps.py            # require_user / require_admin
├── models/
│   ├── schemas.py         # Pydantic
│   ├── period.py          # transiciones de estado + audit
│   ├── proposal.py        # CRUD + merge + CSV import
│   ├── ballot.py          # Emisión atómica (Principios I/II)
│   ├── audit.py           # Append-only (Principio V)
│   └── results.py         # Ranking
├── api/                   # routers FastAPI
│   ├── auth.py
│   ├── me.py
│   ├── period.py
│   ├── proposals.py
│   ├── ballot.py          # con rate-limit in-memory
│   ├── results.py
│   ├── admin_period.py
│   ├── admin_proposals.py
│   └── admin_audit.py
└── seed/import_csv.py
```

## Operaciones

- **Resetear un ciclo**: `POST /api/admin/period/reset` (estado `cerrado` → `preparacion`). Purga `vote_receipts` y `vote_scores`; el audit conserva la entrada.
- **Backup**: copia de `data/voting.db` cuando el periodo esté `cerrado`.
- **Logs**: stdout de uvicorn.
