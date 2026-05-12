# Quickstart — Kratos

Guía mínima para levantar el entorno de desarrollo, sembrar las
propuestas iniciales y validar los flujos clave del MVP.

## 1. Requisitos previos

- Python 3.11+
- Node.js 20+ (con `pnpm` o `npm`)
- Una credencial OAuth 2.0 en Google Cloud Console asociada al Workspace
  de Phicus, con `https://kratos.phicus.es/auth/google/callback` y
  `http://localhost:8000/auth/google/callback` como redirect URIs.

## 2. Variables de entorno

Copia `.env.example` a `.env` y completa:

```env
GOOGLE_CLIENT_ID=...apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=...
SESSION_SECRET=<64 caracteres hex aleatorios>
ADMIN_EMAILS=jgomez@phicus.es,epastor@phicus.es
DB_PATH=./data/voting.db
ENV=development           # 'production' en deploy real
```

## 3. Bootstrap del backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"
mkdir -p data
python -m kratos.db init                          # crea tablas + period(state='preparacion')
python -m kratos.seed.import_csv data/seed/proposals.csv
uvicorn kratos.main:app --reload --port 8000
```

## 4. Bootstrap del frontend

```bash
cd frontend
pnpm install               # o: npm install
pnpm dev                   # arranca Vite en http://localhost:5173
```

Vite proxea `/api` y `/auth` a `http://localhost:8000`, así que se
trabaja siempre contra `http://localhost:5173`.

## 5. Validación del MVP (golden path manual)

1. Visita `http://localhost:5173`.
2. Pulsa **Entrar con Google** y autentícate con una cuenta `@phicus.es`.
3. Verifica que ves la pantalla "La votación aún no está abierta"
   (estado `preparacion`).
4. En otra pestaña, autentica como administrador (`jgomez@phicus.es`
   o `epastor@phicus.es`) y desde `/admin/period` pulsa **Abrir**.
5. Vuelve a la pestaña original: ahora ves el listado de propuestas y
   un selector 1–10 por propuesta. Puntúa todas y pulsa **Enviar
   papeleta**. Confirma "Voto registrado".
6. Recarga la página: debes ver "Ya has votado".
7. Como admin, pulsa **Cerrar** en `/admin/period`. Vuelve a la pestaña
   del votante y abre `/results`: ves el ranking ordenado por suma de
   puntos descendente.

## 6. Validación de los principios constitucionales

Estos tests son **no negociables**; deben ejecutarse y pasar antes de
considerar el MVP entregable:

```bash
cd backend
pytest tests/integration/test_vote_anonymity.py -v
pytest tests/integration/test_vote_unicity.py   -v
```

- `test_vote_anonymity.py` (Principio I):
  - Inspecciona `PRAGMA table_info('vote_scores')` y exige que ninguna
    columna sea `user_email`, `user_id`, `ip`, `user_agent`, ni cualquier
    nombre con `user` o `email`.
  - Inserta 50 papeletas con emails sintéticos y comprueba que ningún
    valor textual de `vote_scores` contiene `@phicus.es`.

- `test_vote_unicity.py` (Principio II):
  - Lanza 100 envíos concurrentes (threads) del mismo usuario a
    `POST /api/ballot` y verifica que la tabla `vote_receipts` termina
    con exactamente 1 fila para ese email.
  - Verifica que `vote_scores` tiene exactamente `N` filas (siendo `N`
    el número de propuestas votables), no `100 × N`.

## 7. Validación de auth domain

```bash
pytest tests/contract/test_auth_domain.py -v
```

- Mockea Google devolviendo `hd="otra-empresa.com"` y verifica HTTP 403
  + ausencia de cookie de sesión.
- Mockea Google devolviendo `hd="phicus.es"` pero email
  `usuario@otro.com` y verifica HTTP 403 (segundo filtro).
- Mockea Google con identidad válida y verifica cookie + redirect 302.

## 8. Build de producción

```bash
cd frontend && pnpm build              # genera dist/
cp -r dist/* ../backend/src/kratos/static/
cd ../backend && python -m kratos.db init && uvicorn kratos.main:app --port 8000
```

En producción la SPA se sirve como estáticos desde el mismo proceso
FastAPI (montaje en `/`, fallback a `index.html` para rutas de React
Router que no empiezan por `/api/` ni `/auth/`).

## 9. Resetear una votación

```bash
# Sólo en estado 'cerrado':
curl -X POST http://localhost:8000/api/admin/period/reset \
     -b "phicus_session=<cookie-de-admin>"
# Esto purga vote_receipts + vote_scores del ciclo cerrado y devuelve
# el periodo a 'preparacion'. El admin_audit_log conserva la entrada
# PERIOD_RESET para trazabilidad.
```

## 10. Checklist rápido pre-deploy

- [ ] `.env` de producción tiene `SESSION_SECRET` ≥ 64 chars y único.
- [ ] `GOOGLE_CLIENT_ID/SECRET` apuntan al proyecto correcto.
- [ ] `ADMIN_EMAILS` contiene exactamente
      `jgomez@phicus.es,epastor@phicus.es` (sin espacios).
- [ ] El servidor sirve por HTTPS (`Secure=True` en cookies).
- [ ] El CSV inicial fue importado y el periodo está en `preparacion`.
- [ ] Los dos tests no negociables (`anonymity`, `unicity`) pasan en CI.
