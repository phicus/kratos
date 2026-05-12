# API Contracts — Kratos

Contrato HTTP completo en [`openapi.yaml`](./openapi.yaml) (OpenAPI 3.1).

## Convenciones globales

- **Origen único**: en producción la SPA y la API se sirven desde el
  mismo origen; las cookies de sesión van con `SameSite=Lax`,
  `HttpOnly=true`, `Secure=true`.
- **Sesión**: cookie `phicus_session` firmada con `itsdangerous`. TTL 8h.
- **Errores**: formato FastAPI `{ "detail": "..." }`. El caso
  "ya votó" añade `code: "ALREADY_VOTED"` para que el frontend pueda
  redirigir directamente a `/already-voted`.
- **Timestamps**: ISO-8601 UTC. Las respuestas no devuelven nunca el
  `voted_at` exacto de una papeleta (sólo cuentas agregadas).
- **Idempotencia**: las acciones administrativas (`open`, `close`,
  `reset`, `merge`, `unmerge`) son **no** idempotentes: ejecutar dos
  veces puede devolver 409 (estado origen incorrecto).

## Mapping endpoints ↔ User Stories

| Endpoint                                | US  | FR cubiertos          |
|-----------------------------------------|-----|-----------------------|
| `GET /auth/google/login`                | US1 | FR-001                |
| `GET /auth/google/callback`             | US1 | FR-001, FR-002, FR-004 |
| `POST /auth/logout`                     | US1 | FR-004                |
| `GET /api/me`                           | US1 | FR-002, FR-003         |
| `GET /api/proposals`                    | US1 | FR-030, FR-011         |
| `GET /api/period`                       | US2 | FR-020                |
| `POST /api/ballot`                      | US1 | FR-031..FR-037         |
| `GET /api/results`                      | US4 | FR-040..FR-042         |
| `GET /api/results.csv`                  | US4 | FR-043                |
| `POST /api/admin/period/open`           | US2 | FR-020, FR-021, FR-022, FR-050 |
| `POST /api/admin/period/close`          | US2 | FR-020, FR-021, FR-022, FR-050 |
| `POST /api/admin/period/reset`          | US2 | FR-021, FR-050         |
| `PATCH /api/admin/proposals/{id}`       | US3 | FR-011, FR-014, FR-050 |
| `POST /api/admin/proposals/{id}/exclude`| US3 | FR-011, FR-014, FR-050 |
| `POST /api/admin/proposals/{id}/restore`| US3 | FR-011, FR-014, FR-050 |
| `POST /api/admin/proposals/merge`       | US3 | FR-012, FR-014, FR-050 |
| `POST /api/admin/proposals/{id}/unmerge`| US3 | FR-013, FR-014, FR-050 |
| `GET /api/admin/audit-log`              | US2/US3 | FR-050, FR-051     |
| `POST /api/admin/proposals/import`      | US3 | FR-010, FR-050         |

## Reglas de autorización transversales

- Todos los endpoints `/api/*` y `/auth/logout` exigen cookie de sesión
  válida (HTTP 401 si falta o expirada).
- Todos los endpoints `/api/admin/*` exigen además
  `current_user.is_admin == True`; 403 en caso contrario.
- La validación de **dominio** vive sólo en `/auth/google/callback`:
  una vez creada la sesión, su email ya está garantizado como `@phicus.es`.

## Reglas de estado del periodo

Cada endpoint que muta estado verifica el estado de periodo:

| Endpoint                                | Estado requerido         |
|-----------------------------------------|--------------------------|
| `POST /api/ballot`                      | `abierto`                |
| `POST /api/admin/period/open`           | `preparacion`            |
| `POST /api/admin/period/close`          | `abierto`                |
| `POST /api/admin/period/reset`          | `cerrado`                |
| `PATCH /api/admin/proposals/*`          | `preparacion`            |
| `POST /api/admin/proposals/merge`       | `preparacion`            |
| `POST /api/admin/proposals/{id}/unmerge`| `preparacion`            |
| `POST /api/admin/proposals/import`      | `preparacion`            |
| `GET /api/results`                      | `cerrado`                |
| `GET /api/results.csv`                  | `cerrado`                |

Si el estado no coincide, la respuesta es `409 Conflict` con `detail`
explicando el estado requerido.
