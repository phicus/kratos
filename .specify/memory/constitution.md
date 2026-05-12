<!--
Sync Impact Report
==================
Version change: (inicial) → 1.0.0
Bump rationale: Ratificación inicial de la constitución del proyecto Phicus
  Voting System a partir de plantilla vacía. Se establecen 5 principios
  fundamentales, restricciones tecnológicas/seguridad y flujo de desarrollo.

Modified principles: N/A (ratificación inicial)
Added sections:
  - Core Principles (5 principios)
  - Restricciones Tecnológicas y de Seguridad
  - Flujo de Desarrollo y Calidad
  - Governance
Removed sections: N/A

Templates requiring updates:
  - .specify/templates/plan-template.md          ✅ compatible (sección "Constitution Check" referenciará estos principios sin cambios estructurales)
  - .specify/templates/spec-template.md          ✅ compatible (no requiere cambios; principios son testables vía SC-*/FR-*)
  - .specify/templates/tasks-template.md         ✅ compatible (las categorías de tareas existentes admiten requisitos derivados de los principios)
  - CLAUDE.md                                    ✅ sin cambios necesarios (apunta al plan actual)
  - README.md / docs/quickstart.md               ⚠ no existen todavía (se crearán durante /speckit-plan)

Follow-up TODOs: ninguno; todas las fechas son conocidas (ratificación = hoy).
-->

# Phicus Voting System Constitution

Sistema de votación empresarial para que los empleados de Phicus voten y prioricen
propuestas internas. Esta constitución es la fuente de verdad para los principios
no negociables del producto, las restricciones tecnológicas y el flujo de trabajo.

## Core Principles

### I. Anonimato del Voto (NO NEGOCIABLE)

Los votos emitidos MUST ser anónimos en el almacén de datos: ningún registro de
voto puede contener, directa o indirectamente, identificadores de la persona que
votó (email, sub de Google, IP, user-agent, timestamp con precisión > minuto, ni
correlación 1:1 con la sesión). El estado "este usuario ya votó" MUST persistirse
en una entidad separada (p. ej. tabla `ballot_receipts` con `user_id` + `voted_at`)
que NO referencie las puntuaciones emitidas. La consulta "¿qué votó X?" debe ser
imposible mediante el modelo de datos persistido, incluso con acceso administrador.

**Rationale**: Si los empleados perciben que la dirección puede ver su voto, la
votación pierde su valor como mecanismo de feedback honesto. La separación física
entre "quién votó" y "qué se votó" es la única garantía técnica creíble.

### II. Un Voto por Persona, Atómico (NO NEGOCIABLE)

Cada usuario autenticado MUST poder emitir como máximo una papeleta completa por
proceso de votación abierto. La inserción del recibo de voto y el registro de las
puntuaciones MUST ocurrir dentro de una única transacción atómica; un fallo parcial
NO puede dejar puntuaciones contabilizadas sin recibo o viceversa. El segundo
intento de votar de un mismo usuario MUST rechazarse con error explícito antes de
tocar la base de datos de puntuaciones.

**Rationale**: Sin esta garantía la elección es manipulable y pierde legitimidad;
con transacciones no atómicas un error de red podría producir votos fantasma o
dobles que invaliden el resultado.

### III. Autenticación Corporativa Restringida por Dominio

La única vía de acceso MUST ser Google OAuth 2.0 / OpenID Connect contra el
Workspace de Phicus, validando server-side que la claim `hd` (hosted domain) y el
sufijo del email sean exactamente `phicus.es`. La verificación de dominio MUST
realizarse en el backend después de validar la firma del ID token; nunca en el
frontend ni confiando en parámetros enviados por el cliente. Cuentas
`@gmail.com`, alias externos o cuentas personales MUST ser rechazadas aunque
estén invitadas al Workspace.

**Rationale**: Cualquier filtrado en cliente es eludible. El dominio corporativo
es el único criterio válido de "empleado de Phicus" y debe imponerse en el único
punto que el atacante no controla: el servidor.

### IV. Simplicidad Pragmática (YAGNI)

El sistema MUST mantenerse en una arquitectura mínima: un único servicio FastAPI,
una única base de datos local (SQLite preferido sobre JSON plano por integridad
transaccional), un único frontend SPA servido estático o detrás del mismo backend.
NO se permiten microservicios, colas, ORMs pesados, caches distribuidas, ni
abstracciones especulativas "por si crece". Cualquier dependencia adicional MUST
justificarse explícitamente en el plan contra esta regla.

**Rationale**: El alcance real (decenas de usuarios, una elección puntual cada
varios meses) no soporta el coste de mantener infraestructura compleja. La
simplicidad además reduce la superficie en la que un fallo pueda romper los
principios I-III.

### V. Trazabilidad Administrativa

Las acciones de administración MUST quedar registradas en un log append-only:
apertura/cierre del periodo de votación, creación/edición/fusión de propuestas,
y cómputo final de resultados. Cada entrada del log MUST incluir el email del
administrador, la acción, los identificadores de las propuestas afectadas y el
timestamp. Solo los emails `jgomez@phicus.es` y `epastor@phicus.es` MUST tener
permisos de administración por defecto; cualquier ampliación requiere una
enmienda de esta constitución. El log de admin NO contiene votos ni puede
correlacionarse con ellos.

**Rationale**: La anonimato del voto no debe usarse como escudo contra la
responsabilidad administrativa. Si una propuesta se fusiona o el plazo se cierra
antes de tiempo, debe poder auditarse quién y cuándo.

## Restricciones Tecnológicas y de Seguridad

**Stack obligatorio**:

- Backend: Python 3.11+ con FastAPI y Pydantic.
- Persistencia: SQLite (vía `sqlite3` stdlib o SQLModel ligero) como opción por
  defecto; JSON plano permitido SOLO si el plan demuestra que no se necesitan
  garantías transaccionales (en cuyo caso el principio II debe seguir cumpliéndose
  vía locking explícito).
- Frontend: TypeScript + React + Vite. UI diseñada con Claude Design.
- Autenticación: Google OAuth 2.0 / OIDC restringido a `hd=phicus.es`.

**Seguridad mínima**:

- Todas las rutas que modifican estado MUST exigir sesión autenticada (cookie HTTP-only
  firmada o JWT corto con verificación server-side).
- Rate limiting MUST aplicarse al endpoint de emisión de voto.
- El backend MUST validar que el periodo de votación esté abierto antes de aceptar
  cualquier voto; el frontend NO es autoridad sobre el estado del periodo.
- Secretos (client_id/secret de Google, clave de firma de sesión) MUST cargarse
  de variables de entorno y NUNCA commitearse al repositorio.

**Modelo de propuestas**: las propuestas se valoran de 1 a 10 puntos cada una;
los resultados se calculan sumando puntos por propuesta y ordenando descendente.
Antes de abrir la votación, el administrador puede fusionar propuestas solapadas;
una propuesta fusionada MUST conservar referencias a sus propuestas "padre".

## Flujo de Desarrollo y Calidad

- Toda nueva feature MUST pasar por el flujo Spec Kit: `/speckit-specify` →
  `/speckit-clarify` (si hay ambigüedad) → `/speckit-plan` → `/speckit-tasks` →
  `/speckit-implement`.
- El paso `/speckit-plan` MUST contener una sección "Constitution Check" que
  evalúe explícitamente el cumplimiento de los principios I-V; violaciones SOLO
  son admisibles si quedan justificadas en la tabla "Complexity Tracking" del plan.
- Tests mínimos obligatorios (incluso si el spec no pide tests adicionales): un
  test que verifique que un usuario no puede votar dos veces (principio II) y un
  test que verifique que el registro de voto persistido no contiene identificador
  de usuario (principio I). Estos dos tests son innegociables.
- Code review en PRs antes de merge a `main`; el revisor debe marcar
  explícitamente que los principios I-III no se han debilitado.
- Validación de inputs en cliente para UX, en servidor para autoridad.

## Governance

Esta constitución prevalece sobre cualquier otra práctica, plantilla o
convención del proyecto. En caso de conflicto entre esta constitución y un
plan, spec o pieza de código, la constitución gana hasta que se enmiende.

**Procedimiento de enmienda**:

1. La enmienda propuesta se documenta como PR que modifica este archivo.
2. El PR MUST incluir el bump de versión semántica y actualizar las fechas.
3. MAJOR: cambio incompatible (eliminar/redefinir un principio); MINOR:
   añadir un principio o sección nueva o expandir guía materialmente;
   PATCH: aclaraciones, redacción, sin cambio semántico.
4. La aprobación requiere acuerdo explícito de ambos administradores
   (`jgomez@phicus.es`, `epastor@phicus.es`).
5. Tras el merge, los templates dependientes (`plan-template.md`,
   `spec-template.md`, `tasks-template.md`) MUST revisarse y actualizarse
   en el mismo PR o en uno inmediato.

**Revisión de cumplimiento**: cada PR debe verificar que no introduce
regresiones contra los principios I-V; la herramienta `/speckit-analyze`
puede usarse para validación cruzada entre spec, plan y tasks.

**Version**: 1.0.0 | **Ratified**: 2026-05-11 | **Last Amended**: 2026-05-11
