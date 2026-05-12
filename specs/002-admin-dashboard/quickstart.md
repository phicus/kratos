# Quickstart — Admin Dashboard (feature 002)

Esta feature se entrega encima de la base ya levantada por
`specs/001-voting-system/quickstart.md`. Aquí sólo se describen los
pasos adicionales.

## 1. Aplicar la migración nueva

```bash
cd backend
.venv/bin/python -m kratos.db init
```

`init_db()` aplica `0002_admin_quorum.sql` automáticamente (idempotente).
Verificar:

```bash
sqlite3 data/voting.db "PRAGMA table_info('periods');" | grep expected_quorum
# Esperado: 6|expected_quorum|INTEGER|0||0
```

## 2. Smoke test del dashboard

Con la base sembrada del feature 001:

```bash
# 1) Login admin (modo dev)
curl -c cookies.txt -X POST 'http://localhost:8000/auth/test/login?email=jgomez@phicus.es'

# 2) Dashboard data
curl -b cookies.txt http://localhost:8000/api/admin/dashboard | jq .
# Esperado:
# {
#   "period": { "state": "preparacion", "expected_quorum": null, ... },
#   "counters": { "votable": 23, "excluded": 0, "merged_parent": 0, "ballots_cast": 0 },
#   "recent_audit": [ ... ]
# }

# 3) Abrir periodo y consultar participación
curl -b cookies.txt -X POST http://localhost:8000/api/admin/period/open
curl -b cookies.txt http://localhost:8000/api/admin/participation | jq .
# Esperado:
# { "voters_count": 0, "expected_quorum": null, "voters": [] }

# 4) Establecer aforo
curl -b cookies.txt -X PATCH \
  http://localhost:8000/api/admin/period/quorum \
  -H 'Content-Type: application/json' \
  -d '{"expected_quorum": 48}'
# 204
curl -b cookies.txt http://localhost:8000/api/admin/participation | jq .expected_quorum
# 48
```

## 3. Smoke test bulk operations

```bash
# Volver a preparación (purga papeletas)
curl -b cookies.txt -X POST http://localhost:8000/api/admin/period/close
curl -b cookies.txt -X POST http://localhost:8000/api/admin/period/reset

# Excluir 3 propuestas en lote
curl -b cookies.txt -X POST \
  http://localhost:8000/api/admin/proposals/bulk-exclude \
  -H 'Content-Type: application/json' \
  -d '{"proposal_ids": [1, 2, 3]}' | jq .
# Esperado: {"affected": 3, "bulk_group_id": "<uuid>", "skipped": []}

# Verificar en audit log
curl -b cookies.txt 'http://localhost:8000/api/admin/audit-log?limit=10' \
  | jq '[.[] | select(.action == "PROPOSAL_EXCLUDE")] | length'
# Esperado: 3
```

## 4. Validación constitucional (Principio I)

Test obligatorio que **bloquea** el merge de esta feature:

```bash
cd backend
.venv/bin/python -m pytest tests/integration/test_participation_no_score_leak.py -v
```

Verifica tres invariantes:

1. El response JSON de `/api/admin/participation` no contiene `score`,
   `scores`, `ballot_uuid`, `proposal_id` ni valores enteros entre 1-10
   accidentales.
2. El módulo `kratos/api/admin_participation.py` no importa
   `vote_scores` ni `results` (AST estático).
3. Bajo un wrapper de conexión SQLite que traza `execute()`, ninguna
   llamada a `/api/admin/participation` ejecuta SELECT ni JOIN sobre
   `vote_scores`.

## 5. Frontend — golden path manual

```bash
cd frontend && npm run dev
```

1. Login con admin → ya estás en `/admin` (antes redirigía a
   `/admin/proposals`).
2. Verifica el hero: estado del periodo a tamaño grande.
3. Click en la métrica "Propuestas votables" → te lleva a
   `/admin/proposals`.
4. Vuelve a `/admin`, click en "Próximos pasos" → "Abrir votación" →
   modal de confirmación → estado pasa a `abierto`.
5. Tras `abierto`, el hero cambia de color (warning → primary), las
   métricas muestran "Papeletas emitidas: 0", y los CTAs cambian.
6. Click en "Ver participación" → `/admin/participation`. Configura
   aforo a 5, guarda.
7. En otra pestaña/incógnito, login como votante normal y emite una
   papeleta. Vuelve a la pestaña admin: en ≤ 10 s la lista refresca
   sola con el nuevo email.
8. Vuelve a `/admin`. Comprueba que la métrica "Papeletas emitidas"
   ha subido a 1 sin recargar.

## 6. Verificar que el polling se pausa cuando la pestaña está oculta

DevTools → Network → throttling. Cambia de pestaña: las peticiones a
`/api/admin/dashboard` y `/api/admin/participation` deben dejar de
disparar. Vuelve a la pestaña: vuelven a disparar inmediatamente.

## 7. Pre-merge checklist

- [ ] `pytest backend/tests/integration/test_participation_no_score_leak.py` pasa.
- [ ] `pytest backend/tests/` entero pasa (no regresión sobre los 25 tests del MVP).
- [ ] `npm run build` en frontend pasa sin warnings.
- [ ] `npm run test` en frontend pasa los tests de `BulkBar`, `useBulkSelection` y `ProposalsSearch`.
- [ ] Smoke manual: el dashboard cambia visualmente al transitar
      preparacion → abierto → cerrado.
- [ ] El polling se pausa con `document.visibilityState !== 'visible'`
      (verificable en Network DevTools).
