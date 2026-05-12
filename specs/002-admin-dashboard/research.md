# Phase 0 — Research: Admin Dashboard

**Branch**: `002-admin-dashboard` · **Date**: 2026-05-12

Resoluciones técnicas previas a Phase 1. Ninguna marca
`NEEDS CLARIFICATION` queda abierta.

---

## 1. Cómo refrescar el dashboard cuando cambia el estado por otro admin

**Decision**: **Polling cliente** cada 10 s sobre los endpoints
`/api/admin/dashboard` y `/api/admin/participation`, con pausa
automática cuando `document.visibilityState !== 'visible'`.

**Rationale**:
- Sin nuevas dependencias (cumple Principio IV). Websockets exigirían
  un cliente WS server-side (FastAPI ya soporta `WebSocket` pero el
  manejo de reconexión, autenticación y proxying en dev añade
  complejidad para un sistema con 2 administradores).
- SSE (Server-Sent Events) sería aún más simple, pero exige un canal
  abierto por admin y complica el proxy de Vite. El beneficio sobre
  polling 10 s es marginal para este volumen.
- Pausar polling cuando el tab está oculto evita load innecesario.

**Alternatives considered**:
- Websockets: descartado por complejidad.
- SSE: descartado por mismo motivo.
- Polling 5 s: descartado por load excesivo (admin podría dejar la
  página abierta horas).
- Refresco manual con botón: degrada UX. Descartado por SC-105.

---

## 2. Dónde almacenar `expected_quorum`

**Decision**: Columna `expected_quorum INTEGER NULL` en la tabla
`periods` (la singleton ya existente).

**Rationale**:
- El aforo es **un atributo del periodo activo**, no una entidad propia.
- Al hacer `PERIOD_RESET`, se purga junto con `vote_receipts` y
  `vote_scores`: simplemente se incluye `expected_quorum = NULL` en el
  `UPDATE` de reset.
- La migración es trivial (`ALTER TABLE periods ADD COLUMN
  expected_quorum INTEGER`) y compatible con bases existentes.

**Alternatives considered**:
- Tabla `period_settings` aparte: sobre-ingeniería para 1 valor.
- Variable de entorno: no se puede cambiar runtime sin redeploy.

---

## 3. Granularidad del log para operaciones bulk

**Decision**: **Una entrada de `admin_audit_log` por cada propuesta
afectada** dentro de la misma transacción. Las N entradas comparten el
mismo `occurred_at` truncado al segundo (no es necesario el minuto;
Principio I sólo aplica a `voted_at` de papeletas).

**Rationale**:
- Permite auditar acciones individualmente con el mismo nivel de
  granularidad que las acciones individuales del MVP 001 (FR-122 del
  spec lo exige).
- Al ser parte de la misma transacción, son atómicas.
- En el frontend, agrupamos visualmente las entradas con el mismo
  timestamp + acción + admin como "bulk de N" en el `AuditLog` (mejora
  opcional, no bloqueante).

**Alternatives considered**:
- Una sola entrada con `target_ids = [N IDs]` y `details = {count: N}`:
  más compacto pero pierde la propiedad de buscar por ID de propuesta
  en el log. Rechazado.

---

## 4. Paginación de la lista de votantes: cliente vs servidor

**Decision**: **Paginación en cliente** con `pageSize=50`. El endpoint
devuelve la lista completa de votantes del periodo actual.

**Rationale**:
- Volumen objetivo: ≤ 500 votantes. El payload completo son ~25 KB de
  JSON (`{email, voted_at}` × 500). Despreciable en LAN.
- Paginación servidor implicaría más estado (cursor) y peticiones por
  cambio de página → más complejidad sin beneficio.
- El admin típicamente quiere ver los más recientes (ya ordenados desc
  por `voted_at`), no buscar a una persona concreta.

**Alternatives considered**:
- Paginación servidor con `?page=N&size=50`: descartado por
  complejidad innecesaria para el volumen.
- Sin paginación, lista completa renderizada: descartado para volúmenes
  cercanos a 500 (jank en scroll si renderizan 500 filas con
  animaciones).

---

## 5. Búsqueda de propuestas: cliente vs servidor

**Decision**: **Filtrado en cliente** sobre la lista ya cargada de
`GET /api/proposals` (en modo admin trae todas, no sólo `votable`).

**Rationale**:
- Mismo argumento que la paginación: volumen ≤ 200 propuestas, payload
  pequeño, búsqueda < 100 ms con `String.includes()` case-insensitive
  + normalización Unicode (`'NFD'` para quitar acentos).
- Frontend ya tiene la lista para renderizar la tabla, no hay coste
  adicional.

**Alternatives considered**:
- `GET /api/proposals?q=...`: descartado por complejidad innecesaria.
- FTS5 de SQLite: descartado, sobre-ingeniería.

---

## 6. Mapeo de iconos custom (`admin-dashboard.jsx`) → `lucide-react`

**Decision**: tabla de equivalencias directa, sin envoltorio
adicional:

| Custom (prototipo) | `lucide-react`     | Uso                              |
|--------------------|--------------------|----------------------------------|
| `IconClock`        | `Clock`            | Hero "preparación"               |
| `IconPlay`         | `PlayCircle`       | Hero "abierto"                   |
| `IconLock`         | `Lock`             | Hero "cerrado"                   |
| `IconPlus`         | `Plus`             | "Crear propuesta"                |
| `IconMerge`        | `GitMerge`         | "Fusionar"                       |
| `IconUsers`        | `Users`            | "Ver participación"              |
| `IconList`         | `List`             | "Ver auditoría"                  |
| `IconTrophy`       | `Trophy`           | "Ver ranking"                    |
| `IconRefresh`      | `RefreshCw`        | "Reiniciar" + "Restaurar"        |
| `IconChevronLeft`  | `ChevronLeft`      | Volver / paginación              |
| `IconChevronRight` | `ChevronRight`     | Avanzar / paginación             |
| `IconShield`       | `Shield`           | Nota de anonimato                |
| `IconSparkles`     | `Sparkles`         | Cabecera "Próximos pasos"        |
| `IconSearch`       | `Search`           | Buscador propuestas              |
| `IconEdit`         | `Pencil`           | Editar propuesta                 |
| `IconTrash`        | `Trash2`           | Excluir                          |
| `IconXCircle`      | `XCircle`          | Limpiar búsqueda                 |
| `IconClipboardList`| `ClipboardList`    | MetricCard "Votables"            |
| `IconEyeOff`       | `EyeOff`           | MetricCard "Excluidas"           |
| `IconVote`         | `Vote`             | MetricCard "Papeletas emitidas"  |
| `IconDownload`     | `Download`         | "Descargar CSV"                  |
| `IconUpload`       | `Upload`           | "Importar CSV"                   |

**Rationale**: `lucide-react` (ya instalado) contiene equivalentes
visuales con la misma familia (peso 1.5, esquinas redondeadas,
strokeLinecap round). Migración 1:1 sin retoque visual.

---

## 7. Estilos: portar las clases `adm-*` y `part-*` del prototipo

**Decision**: copiar el bloque `ADMIN_STYLE` del prototipo a
`frontend/src/styles/admin.css` literalmente (las clases usan
exclusivamente variables CSS ya definidas en `design-tokens.css`).
Importar `admin.css` desde `styles/index.css`.

**Rationale**:
- El prototipo inyecta los estilos dinámicamente desde JS
  (`injectAdminStyle()`); en la app real, los importamos en build.
- No introduce ningún token nuevo. Todas las reglas usan `var(--*)`.
- Mantener las clases `adm-*` y `part-*` minimiza la diferencia
  diff-able entre prototipo y código real, facilita auditar la fidelidad.

**Alternatives considered**:
- Reescribir todo como utilidades Tailwind: laborioso, sin beneficio
  visual; perdemos la trazabilidad 1:1 con el prototipo.

---

## 8. Routing: `dispatch({type:'goto', route})` → `react-router-dom`

**Decision**: reemplazar todas las llamadas `dispatch({type:'goto',
route: 'admin-X'})` por `navigate('/admin/X')` usando el hook
`useNavigate` de `react-router-dom`. Una sola línea de cambio por sitio.

**Mapping**:

| `route` del prototipo  | URL real           |
|------------------------|--------------------|
| `admin-dashboard`      | `/admin`           |
| `admin-proposals`      | `/admin/proposals` |
| `admin-merge`          | `/admin/merge`     |
| `admin-period`         | `/admin/period`    |
| `admin-audit`          | `/admin/audit`     |
| `admin-participation`  | `/admin/participation` (NUEVA) |
| `results`              | `/results`         |

**Rationale**: el patrón router está ya establecido en el repo. El
`dispatch` del prototipo es un placeholder.

---

## 9. Test no negociable: anti-leak en `/api/admin/participation`

**Decision**: el test `test_participation_no_score_leak.py` cubre
**tres invariantes**:

1. **JSON response**: tras emitir N papeletas con scores variados,
   `GET /api/admin/participation` devuelve sólo `voters_count`,
   `expected_quorum` y `emails: [{email, voted_at}, ...]`. Ninguna
   clave del response (recursivamente) puede llamarse `score`,
   `scores`, `ballot_uuid`, `ballot`, `proposal`, ni contener un
   integer numérico con rango 1..10 en alguna propiedad accidental.
2. **Source code**: el módulo `kratos/api/admin_participation.py` no
   importa `vote_scores` ni `results`. Inspección estática con `ast`.
3. **Trace de queries**: bajo un fixture que envuelve la conexión
   SQLite con un wrapper que loguea cada `execute()`, llamar al
   endpoint NUNCA debe ejecutar SELECT/JOIN sobre `vote_scores`.

**Rationale**: defensa en profundidad. Una sola comprobación de payload
no detecta una posible regresión donde un futuro PR añade `ballot_uuid`
"accidentalmente". El test estructural sí.

---

## Resumen

| Tema | Decisión |
|---|---|
| Refresco cross-admin | Polling 10 s + Page Visibility pause |
| Aforo persistente | Columna `expected_quorum` en `periods` (nullable) |
| Granularidad audit bulk | 1 entrada por propuesta, misma transacción |
| Paginación votantes | Cliente, `pageSize=50` |
| Búsqueda propuestas | Cliente, normalización Unicode |
| Iconos | `lucide-react` (mapping 1:1) |
| Estilos `adm-*` | Copia literal en `frontend/src/styles/admin.css` |
| Routing | `dispatch` → `useNavigate`, mapping explícito |
| Anti-leak Principio I | 3 invariantes: JSON, AST estático, trace de queries |

Todas las decisiones cumplen los 5 principios y respetan la simplicidad
del proyecto (sin nuevas dependencias).
