# Phase 0 — Research: Kratos

**Branch**: `001-voting-system` · **Date**: 2026-05-11

Este documento resuelve las decisiones técnicas no triviales identificadas
en `plan.md` antes de pasar al diseño (Phase 1). No quedan marcadores
`NEEDS CLARIFICATION` en el plan.

---

## 1. Validación del dominio `phicus.es` en el flujo Google OIDC

**Decision**: Usar **Authlib** (`authlib.integrations.starlette_client.OAuth`)
para el flujo OIDC contra Google. Tras recibir el `id_token`, validar
**en el servidor** dos condiciones combinadas:

1. `claims["hd"] == "phicus.es"` (hosted domain).
2. `claims["email"].lower().endswith("@phicus.es")` y `claims["email_verified"] is True`.

Si CUALQUIERA falla, abortar el callback con HTTP 403 y NO crear sesión.

**Rationale**:
- La claim `hd` la emite Google únicamente para cuentas pertenecientes a
  un Workspace; comprobar sólo el sufijo del email es eludible mediante
  alias de Gmail (`usuario+phicus.es@gmail.com` no aplica, pero direcciones
  con `@phicus.es` configuradas fuera del Workspace sí podrían existir
  en teoría).
- Comprobar ambas (`hd` + sufijo) elimina ambos vectores y satisface el
  Principio III ("Autenticación Corporativa Restringida") de la
  constitución.
- Authlib hace la verificación criptográfica del `id_token` (firma JWK,
  `iss`, `aud`, `exp`) sin que tengamos que reimplementarla.

**Alternatives considered**:
- `google-auth` (paquete oficial de Google): más verboso para el flujo
  authcode+session; preferimos Authlib por su integración nativa con
  Starlette/FastAPI.
- `python-jose` + cliente OAuth manual: implica más código propio para
  validar JWKs y rotación de claves, contradice el principio IV.
- Sólo `email.endswith("@phicus.es")`: rechazado por el riesgo descrito
  arriba; viola el espíritu del Principio III.

---

## 2. Gestión de sesión: cookie firmada vs JWT

**Decision**: **Cookie HTTP-only firmada** con `itsdangerous`, payload
mínimo `{ "email": str, "is_admin": bool, "issued_at": int }`, TTL 8h,
`SameSite=Lax`, `Secure=True` en producción.

**Rationale**:
- Servimos frontend y backend desde el mismo origen en producción
  (`StaticFiles` + API en el mismo proceso). No hay necesidad de un token
  bearer.
- Cookie HTTP-only es inmune a XSS exfiltration; un JWT en `localStorage`
  no lo sería.
- `SameSite=Lax` cubre CSRF para todos los endpoints que cambian estado,
  ya que el navegador no envía la cookie en POST cross-site.
- Refresca el principio IV: una cookie firmada simétricamente no necesita
  store de sesiones (la verificación es local con `SESSION_SECRET`).

**Alternatives considered**:
- JWT en `Authorization: Bearer`: requeriría exponer el token al JS,
  introducir refresh tokens o aceptar TTLs cortos con UX peor. Beneficio
  cero porque no hay clientes terceros.
- Sesión server-side (tabla `sessions` en SQLite): añade complejidad sin
  beneficio para un solo proceso; el riesgo de "invalidar sesión" se
  resuelve con TTL corto + logout que borra la cookie.

---

## 3. Atomicidad de la emisión de papeleta en SQLite

**Decision**: Una sola transacción explícita con `BEGIN IMMEDIATE`:

```python
with db.execute("BEGIN IMMEDIATE"):
    db.execute(
        "INSERT INTO vote_receipts(user_email, period_id, voted_at) "
        "VALUES (?, ?, ?)",
        (email, period_id, truncated_now)
    )  # falla por UNIQUE si ya votó
    ballot_uuid = uuid4().hex
    db.executemany(
        "INSERT INTO vote_scores(period_id, proposal_id, score, ballot_uuid) "
        "VALUES (?, ?, ?, ?)",
        [(period_id, pid, s, ballot_uuid) for pid, s in scores.items()]
    )
```

**Rationale**:
- `BEGIN IMMEDIATE` adquiere lock RESERVED de inmediato, así dos envíos
  concurrentes del mismo usuario se serializan. Combinado con el `UNIQUE
  (user_email, period_id)` del receipt, el segundo fallará al ejecutar el
  primer INSERT y el ROLLBACK automático limpia cualquier intento
  parcial.
- WAL mode permite lecturas concurrentes (listar propuestas, ver período)
  sin bloquearse contra escrituras.
- El `ballot_uuid` agrupa los scores de una papeleta sin referenciar al
  votante: cumple el Principio I.

**Alternatives considered**:
- `BEGIN DEFERRED` (default): el lock se adquiere al primer escribir;
  ventana de carrera pequeña pero existente. Rechazado por margen de
  seguridad insuficiente para el Principio II.
- ORM con `nested_transactions=False` (SQLAlchemy): pagamos peso para
  obtener una abstracción que ya tenemos con `sqlite3`.
- Cola de votos asíncrona: viola el Principio IV (introduce un broker)
  sin beneficio para el volumen objetivo.

---

## 4. Verificación automática del anonimato (Principio I)

**Decision**: Test `tests/integration/test_vote_anonymity.py` que:

1. Crea N usuarios con emails sintéticos `user{i}@phicus.es`.
2. Para cada uno, simula un envío de papeleta con puntuaciones únicas
   (p.ej. `score = i % 10 + 1`) sobre propuestas distintas.
3. Lee la tabla completa `vote_scores` y comprueba:
   - Ninguna columna contiene el sufijo `@phicus.es` ni la cadena `user`.
   - Ningún `ballot_uuid` aparece en `vote_receipts` (las tablas no se
     pueden join-ear).
   - El `voted_at` está redondeado al minuto (no permite correlación
     temporal de alta resolución).
4. Itera sobre todas las columnas del esquema y exige que ninguna sea
   `user_email`, `user_id`, `ip`, `user_agent` o cualquier nombre con
   `user`/`email` en `vote_scores`.

**Rationale**:
- La validación estructural ("¿qué columnas existen?") es más robusta
  que comparar valores: si alguien añade en el futuro una columna
  `ip_hash`, el test salta aunque los valores no contengan `@phicus.es`.
- El test cubre el SC-001 del spec.

**Alternatives considered**:
- Sólo test de valores: insuficiente porque hashes/UUIDs derivados del
  email pasarían el test pero violarían el principio.
- Test manual con SQL ad-hoc: no es repetible en CI.

---

## 5. "Claude Design" — interpretación del input del usuario

**Decision**: Interpretar "Claude Design" como **"el sistema visual de la
SPA se diseña iterativamente con la asistencia de Claude"**, materializado
sobre:

- **Tailwind CSS 3** como motor de utilidades.
- **Radix UI primitives** (`@radix-ui/react-*`) para componentes
  accesibles sin opinión visual (dialog, select, slider, toast).
- **lucide-react** para iconografía.
- Una **paleta corporativa Phicus** definida en `tailwind.config.js`
  (extraída de `Pelea de gallos, Round 1..html` si contiene branding;
  de lo contrario, paleta neutra inicial que se refina iterativamente).

**Rationale**:
- No existe un sistema oficial llamado "Claude Design"; el usuario lo
  empleó como sinónimo de "diseño asistido por Claude". Esta
  interpretación es lo que mejor encaja con el input.
- Radix + Tailwind es la combinación con menor footprint que respeta el
  Principio IV: cero CSS-in-JS, cero librería de componentes pesada.
- Se puede refinar en cualquier momento sin reescribir lógica.

**Alternatives considered**:
- Material UI, Chakra, Mantine: librerías "pesadas" que aportan tema
  consistente pero acoplan estilos y bundles más grandes; innecesario
  para 10 pantallas.
- Componentes 100% custom: incumple SC-004 (UX en 5 min) por riesgo de
  problemas de accesibilidad/usabilidad.

**Follow-up**: extraer la paleta de los assets del cliente
(`Pelea de gallos, Round 1..html`) durante la fase de implementación
(tarea aparte en `tasks.md`).

---

## 6. Servir la SPA junto a la API en producción

**Decision**: En producción, el backend FastAPI monta `StaticFiles(directory="static")`
sobre la ruta `/` con `html=True` y un middleware ligero que, ante un GET
404 cuyo path no empieza por `/api/` ni `/auth/`, devuelve `index.html`
(fallback para rutas de React Router). En desarrollo se usa el dev server
de Vite con proxy:

```ts
// vite.config.ts
server: {
  proxy: {
    '/api':  'http://localhost:8000',
    '/auth': 'http://localhost:8000',
  },
}
```

**Rationale**:
- Un solo proceso desplegable cumple el Principio IV.
- Mismo origen elimina CORS y simplifica cookies.
- Vite proxy en dev preserva la productividad de hot reload.

**Alternatives considered**:
- Nginx delante: mayor complejidad operativa sin beneficio para el
  volumen objetivo.
- CDN para los estáticos: irrelevante para una app interna.

---

## 7. Importación inicial de propuestas desde el CSV de Google Form

**Decision**: Script CLI `python -m kratos.seed.import_csv <ruta_csv>`
que:

1. Lee el CSV con `csv.DictReader`.
2. Por cada fila válida (email termina en `@phicus.es`, nombre no vacío),
   crea una `Proposal` con `status=VOTABLE`, mapeando columnas:
   - "¿Cuál sería el nombre de la idea/proyecto?" → `name`
   - "Describe cual es el objetivo de la idea/proyecto…" → `description`
   - "¿Sabrías explicar como lo harías?" → `how`
   - "¿Podrías estimar si se podría hacer en un día…?" → `time_estimate`
   - "Dirección de correo electrónico" → `original_author_email`
3. Es idempotente: si la propuesta ya existe (match por `name` + `original_author_email`),
   se ignora.
4. Sólo se permite ejecutar cuando el periodo está en estado `preparación`.

**Rationale**:
- El CSV es la única fuente de propuestas conocida; el script es la vía
  documentada para repoblar el sistema en cualquier despliegue.
- Idempotencia evita duplicados si se re-ejecuta.
- La restricción del estado evita corrupción durante una votación viva.

**Alternatives considered**:
- UI admin para subir el CSV: factible, pero queda fuera del MVP;
  cualquier admin puede ejecutar el comando una vez.
- Carga automática al arrancar: rechazado, queremos un paso explícito.

---

## 8. Empates por suma de puntos

**Decision**: Desempate por orden **alfabético del nombre** de la
propuesta, ascendente y sensible a la configuración local del servidor
(`ORDER BY total DESC, name COLLATE NOCASE ASC`).

**Rationale**:
- Es lo asumido en el spec (SC + acceptance scenario US4-2).
- Predecible, sin dependencias externas.

**Alternatives considered**:
- Desempate por número de "10s" recibidos: añade complejidad sin
  consenso del cliente.
- Sorteo aleatorio: rompe reproducibilidad de pruebas y rankings.

---

## Resumen

| Tema | Decisión |
|---|---|
| OIDC Google | Authlib + validación `hd` + sufijo email server-side |
| Sesión | Cookie HTTP-only firmada con `itsdangerous`, TTL 8h |
| Atomicidad voto | `BEGIN IMMEDIATE` + UNIQUE constraint |
| Test anonimato | Estructural (esquema) + valores (substring search) |
| "Claude Design" | Tailwind + Radix + lucide-react, paleta Phicus |
| Despliegue | FastAPI sirve SPA estática; Vite proxy en dev |
| Importación inicial | Script CLI idempotente, sólo en estado `preparación` |
| Desempate | Alfabético ASC por nombre |

Todas las decisiones cumplen los cinco principios de la constitución y
quedan respaldadas por requisitos concretos del spec (`FR-*` / `SC-*`).
