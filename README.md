# Kratos

[![CI](https://github.com/phicus/kratos/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/phicus/kratos/actions/workflows/ci.yml)
[![Contributions welcome](https://img.shields.io/badge/contributions-welcome-brightgreen)](./CONTRIBUTING.md)

Sistema interno de votación para Phicus. Empleados con cuenta
`@phicus.es` puntúan propuestas internas de 1 a 10 vía Google Workspace
SSO. Voto anónimo, único por persona, controlado por dos administradores.

> ⚠️ El badge de CI asume que el repo se aloja en `github.com/phicus/kratos`.
> Ajusta el path en el `<owner>/<repo>` del URL si difiere.

## Quickstart

```bash
# Setup
cp .env.example .env   # editar GOOGLE_CLIENT_ID/SECRET, SESSION_SECRET

# Backend
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"
python -m kratos.db init
python -m kratos.seed.import_csv data/seed/proposals.csv
uvicorn kratos.main:app --reload --port 8000 &

# Frontend (otro terminal)
cd ../frontend
npm install
npm run dev      # http://localhost:5173
```

## Documentación

- **Spec funcional**: [`specs/001-voting-system/spec.md`](specs/001-voting-system/spec.md)
- **Constitución (principios no negociables)**: [`.specify/memory/constitution.md`](.specify/memory/constitution.md)
- **Plan técnico**: [`specs/001-voting-system/plan.md`](specs/001-voting-system/plan.md)
- **Diseño visual**: [`specs/001-voting-system/design-system.md`](specs/001-voting-system/design-system.md)
- **API**: [`specs/001-voting-system/contracts/openapi.yaml`](specs/001-voting-system/contracts/openapi.yaml)
- **Quickstart detallado**: [`specs/001-voting-system/quickstart.md`](specs/001-voting-system/quickstart.md)
- **Backend README**: [`backend/README.md`](backend/README.md)
- **Frontend README**: [`frontend/README.md`](frontend/README.md)

## Tests innegociables (constitución)

```bash
cd backend
.venv/bin/python -m pytest tests/integration/test_vote_anonymity.py -v  # Principio I
.venv/bin/python -m pytest tests/integration/test_vote_unicity.py   -v  # Principio II
.venv/bin/python -m pytest tests/contract/test_auth_domain.py       -v  # Principio III
```

Los tres bloquean el merge del MVP si no pasan.

## Despliegue

```bash
docker compose build
docker compose up -d
```

Volumen persistente `./data:/app/backend/data` (SQLite + WAL).
