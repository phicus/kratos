# Feature Specification: Admin Dashboard

**Feature Branch**: `002-admin-dashboard`
**Created**: 2026-05-12
**Status**: Draft
**Input**: User description: "panel admin para administradores para hacer las tareas necesarios"

> Esta feature **no modifica** las tareas administrativas existentes
> (transiciones de periodo, CRUD/fusión/import de propuestas, log de
> auditoría); las **consolida y orquesta** desde un panel principal que
> acelera el trabajo diario del administrador.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Dashboard de estado y acciones rápidas (Priority: P1)

Cuando un administrador entra en `/admin`, ve **en una sola pantalla** el
estado actual del sistema de votación (estado del periodo, contadores
clave, últimas acciones) y los botones de acceso rápido a las tareas más
frecuentes según el estado en que se encuentre el proceso.

**Why this priority**: hoy `/admin` redirige a "Propuestas" sin contexto;
el administrador tiene que navegar por 4 pestañas para saber qué falta
por hacer. Un dashboard que resuelve esto en una sola vista es el corazón
del valor de esta feature.

**Independent Test**: con cuenta admin autenticada, navegar a `/admin`
debe mostrar (a) el estado del periodo prominentemente, (b) número de
propuestas votables/excluidas/padres-fusión, (c) si el periodo está
abierto: número de papeletas emitidas, (d) últimas 5 acciones del log
admin, (e) al menos un CTA acorde al estado del periodo.

**Acceptance Scenarios**:

1. **Given** que el periodo está en `preparacion` y hay 0 propuestas
   importadas, **When** el administrador entra en `/admin`, **Then** ve
   un estado vacío con CTA primario "Importar propuestas desde CSV" y un
   secundario "Crear propuesta manualmente".
2. **Given** que el periodo está en `preparacion` y hay propuestas
   importadas, **When** entra en `/admin`, **Then** ve el contador de
   propuestas votables y CTAs "Abrir votación" y "Fusionar duplicadas".
3. **Given** que el periodo está `abierto`, **When** entra en `/admin`,
   **Then** ve el progreso de participación y un CTA secundario "Cerrar
   votación".
4. **Given** que el periodo está `cerrado`, **When** entra en `/admin`,
   **Then** ve el podio de top-3 propuestas, CTAs "Descargar resultados
   CSV" y "Reiniciar votación" (este último con confirmación).
5. **Given** un dashboard cargado, **When** el administrador pulsa
   cualquier tarjeta de métrica (p.ej. "Propuestas excluidas: 4"),
   **Then** navega directamente al listado filtrado por esa categoría.

---

### User Story 2 - Métricas de participación en tiempo real (Priority: P2)

Durante el estado `abierto`, el administrador puede consultar quién ha
votado y cuánta gente queda, **sin acceder en ningún caso al contenido
de las papeletas**.

**Why this priority**: permite saber cuándo cerrar el periodo (cuando ya
ha votado la masa crítica) y mandar recordatorios manuales a quienes
faltan. No es P1 porque el periodo puede gestionarse "a ojo" sin estas
métricas, pero las acelera notablemente.

**Independent Test**: con periodo en `abierto`, sembrar N papeletas de
emails sintéticos `user{i}@phicus.es` y verificar que la sección de
participación del dashboard muestra (a) recuento de votos emitidos, (b)
porcentaje sobre un aforo esperado configurable, (c) lista de emails
ordenada por timestamp del recibo y (d) ningún campo correlacionable
con puntuaciones.

**Acceptance Scenarios**:

1. **Given** un periodo `abierto` con 7 papeletas emitidas y un aforo
   configurado de 30, **When** el administrador abre la sección
   "Participación", **Then** ve "7 / 30 (23%)" y la lista de los 7
   emails con su timestamp redondeado a minuto.
2. **Given** la misma situación, **When** el administrador intenta
   consultar las puntuaciones de un votante concreto desde la UI,
   **Then** no existe ningún elemento que ofrezca esa acción y la API
   subyacente devuelve los emails sin scores.
3. **Given** un periodo distinto de `abierto`, **When** entra en la
   sección "Participación", **Then** ve un mensaje "Disponible mientras
   la votación esté abierta" sin lista de votantes.
4. **Given** el aforo no está configurado, **When** entra en la sección,
   **Then** ve sólo el número absoluto de votantes y un input para
   establecer el aforo esperado (que se persiste en la configuración del
   periodo).

---

### User Story 3 - Centro de acciones contextual (Priority: P3)

El dashboard adapta los accesos rápidos visibles al estado actual,
sugiriendo la siguiente acción razonable y ocultando las que no aplican.

**Why this priority**: reduce el ruido visual y la posibilidad de errores
(p.ej. intentar editar propuestas con la votación abierta). Es deseable
pero no bloqueante: las páginas existentes ya rechazan acciones inválidas
con un 409 claro.

**Independent Test**: por cada uno de los tres estados, capturar el
conjunto de CTAs visibles en el dashboard y verificar que coinciden con
la matriz definida en este documento (ver tabla en sección "Resumen de
estados y acciones").

**Acceptance Scenarios**:

1. **Given** estado `preparacion`, **When** se renderiza el dashboard,
   **Then** son visibles: Importar CSV · Crear propuesta · Fusionar ·
   Editar/Excluir propuestas · Abrir votación. **No** son visibles:
   Cerrar votación · Reiniciar · Descargar resultados.
2. **Given** estado `abierto`, **When** se renderiza el dashboard,
   **Then** son visibles: Cerrar votación · Ver participación · Ver log.
   **No** son visibles: ningún CTA que mute propuestas.
3. **Given** estado `cerrado`, **When** se renderiza el dashboard,
   **Then** son visibles: Descargar resultados CSV · Ver podio ·
   Reiniciar votación · Ver log.

---

### User Story 4 - Búsqueda y operaciones masivas sobre propuestas (Priority: P4)

En el listado de propuestas, el administrador puede buscar por texto y
ejecutar acciones (excluir / restaurar) sobre múltiples propuestas
seleccionadas a la vez.

**Why this priority**: cuando hay 100+ propuestas (caso real del CSV de
Phicus con 174 entradas), revisar una a una es lento. Útil pero
secundario al dashboard.

**Independent Test**: con 50 propuestas importadas, buscar por una
subcadena del nombre debe devolver sólo las coincidencias; seleccionar
3 y pulsar "Excluir seleccionadas" debe pasar las 3 a estado `excluded`
en una sola acción.

**Acceptance Scenarios**:

1. **Given** un listado con 100 propuestas y campo de búsqueda,
   **When** el admin escribe "automatiza", **Then** sólo se muestran
   las propuestas cuyo nombre o descripción contiene "automatiza"
   (case-insensitive, sin acentos).
2. **Given** un listado filtrado por estado `votable` con 20 propuestas,
   **When** el admin marca 5 checkboxes y pulsa "Excluir seleccionadas",
   **Then** las 5 pasan a `excluded` en una operación; el log admin
   contiene 5 entradas `PROPOSAL_EXCLUDE` con el mismo timestamp dentro
   del minuto.
3. **Given** el periodo está `abierto`, **When** el admin pulsa una
   acción bulk, **Then** la operación se rechaza con el mensaje de
   estado equivalente al de las acciones individuales (409 + texto).

---

### Edge Cases

- **Sin administradores configurados**: si `ADMIN_EMAILS` está vacío en
  el deploy, ningún usuario podrá entrar en `/admin`; pero si un admin
  configurado accede con una identidad de transición (justo después de
  añadirse a la lista), el dashboard debe cargar sin errores.
- **0 propuestas en `preparacion`**: estado vacío deliberado con CTAs
  primario y secundario claros, sin mostrar contadores en cero todos
  los lados.
- **0 papeletas durante `abierto`**: muestra "Aún nadie ha votado" con
  el aforo esperado si está configurado.
- **Volúmenes grandes**: con 500 papeletas en `vote_receipts`, la lista
  de votantes debe paginarse o virtualizarse para no degradar la UX.
- **Cambio de estado por otro admin**: si admin A ve el dashboard y
  admin B cierra la votación, el dashboard de A debe reflejarlo en su
  siguiente refresco automático (≤ 15s) sin requerir recarga manual.
- **Carga inicial**: el dashboard muestra placeholders/skeletons mientras
  hace las consultas; no debe quedarse en blanco más de 1 segundo en
  conexión normal.
- **Búsqueda con cadena vacía**: equivale a "sin filtro de texto".
- **Acción bulk con 0 seleccionadas**: el botón "Excluir seleccionadas"
  está deshabilitado hasta que haya al menos 1 selección.

### Resumen de estados y acciones

Matriz que el dashboard implementa (también referencia para los tests
de US3):

| Acción del dashboard      | preparacion | abierto | cerrado |
|---------------------------|:-----------:|:-------:|:-------:|
| Importar CSV              | ✅          | —       | —       |
| Crear propuesta           | ✅          | —       | —       |
| Editar / excluir / fusionar propuestas | ✅ | —    | —       |
| Bulk excluir / restaurar  | ✅          | —       | —       |
| Abrir votación            | ✅          | —       | —       |
| Cerrar votación           | —           | ✅      | —       |
| Ver participación         | —           | ✅      | —       |
| Descargar resultados CSV  | —           | —       | ✅      |
| Reiniciar votación        | —           | —       | ✅      |
| Ver log auditoría         | ✅          | ✅      | ✅      |

## Requirements *(mandatory)*

### Functional Requirements

#### Vista principal del dashboard (US1, US3)

- **FR-100**: El sistema MUST exponer una ruta `/admin` que renderice un
  dashboard administrativo en lugar de redirigir a otra subruta.
- **FR-101**: El dashboard MUST mostrar de forma prominente el estado
  actual del periodo (`preparacion`, `abierto`, `cerrado`) usando una
  variante visual distintiva por estado.
- **FR-102**: El dashboard MUST mostrar los siguientes contadores:
  propuestas totales, votables, excluidas, padres-fusión, papeletas
  emitidas (sólo si periodo `abierto` o `cerrado`).
- **FR-103**: El dashboard MUST mostrar las últimas 5 entradas del log
  administrativo con timestamp, email y acción legibles.
- **FR-104**: El dashboard MUST presentar los CTAs visibles según la
  matriz de "Resumen de estados y acciones" (ver arriba). Los CTAs
  ocultos NO deben aparecer en el DOM (no basta con `disabled`).
- **FR-105**: Cada contador en el dashboard MUST ser clicable y MUST
  llevar al listado pre-filtrado correspondiente
  (p.ej. "Propuestas excluidas: 4" → `/admin/proposals?filter=excluded`).
- **FR-106**: El dashboard MUST refrescar los datos automáticamente al
  menos cada 15 segundos sin recargar la página completa.

#### Participación (US2)

- **FR-110**: El sistema MUST exponer un endpoint admin que devuelva
  `{voters_count, expected_quorum, emails: [{email, voted_at}]}`. La
  respuesta NUNCA contendrá scores ni IDs que correlacionen con
  papeletas.
- **FR-111**: El dashboard MUST mostrar, sólo durante el estado
  `abierto`, la sección de participación con: número de votantes,
  porcentaje sobre el aforo si está configurado, y lista de emails de
  los que ya votaron ordenada por `voted_at` descendente.
- **FR-112**: La sección de participación MUST exponer un input para
  fijar el "aforo esperado" (entero positivo), persistente entre
  sesiones, configurable sólo en estado `abierto`.
- **FR-113**: El aforo esperado MUST almacenarse asociado al periodo
  actual; al hacer reset, debe purgarse junto con las papeletas.
- **FR-114**: El sistema MUST garantizar que ningún endpoint accesible
  desde el dashboard permite cruzar `vote_receipts` con `vote_scores`
  (Principio I de la constitución).

#### Búsqueda y operaciones masivas (US4)

- **FR-120**: El listado de propuestas en `/admin/proposals` MUST
  ofrecer un campo de búsqueda libre que filtre por coincidencia
  case-insensitive y sin acentos sobre `name` y `description`.
- **FR-121**: El listado MUST permitir seleccionar varias propuestas
  vía checkbox y ofrecer dos acciones bulk: "Excluir seleccionadas" y
  "Restaurar seleccionadas".
- **FR-122**: Las acciones bulk MUST ejecutarse de forma transaccional
  (todo-o-nada) y MUST registrar **una entrada por cada propuesta
  afectada** en el log administrativo, conservando el detalle.
- **FR-123**: Las acciones bulk MUST estar deshabilitadas
  (no aparecer en DOM) fuera del estado `preparacion`, igual que sus
  equivalentes individuales (FR-014 en spec 001).

#### Refresco y reactividad

- **FR-130**: Cuando el estado del periodo cambia desde otra sesión, el
  dashboard MUST reflejar el nuevo estado en ≤ 15 segundos sin
  intervención del usuario.
- **FR-131**: Cuando el dashboard detecta un cambio de estado, MUST
  actualizar también la matriz de CTAs visibles para coincidir con el
  nuevo estado.

### Key Entities

- **Aforo esperado del periodo**: número entero opcional asociado al
  periodo actual, configurado por un administrador. Se usa sólo para
  calcular el porcentaje de participación; no condiciona el cierre
  automático.
- **(Sin nuevas entidades persistentes más allá del aforo)** — esta
  feature reutiliza `periods`, `proposals`, `proposal_merges`,
  `vote_receipts` (sin tocar `vote_scores`) y `admin_audit_log` del
  modelo existente.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-100**: Un administrador puede identificar el estado del sistema
  y la siguiente acción razonable en **≤ 5 segundos** desde el primer
  render del dashboard (medible con un usability test simple sobre los
  dos administradores).
- **SC-101**: El número de clicks para ejecutar las acciones admin más
  frecuentes (abrir/cerrar periodo, importar CSV, descargar resultados)
  baja de **≥ 3 clicks** (estado actual: home → admin → subruta →
  acción) a **≤ 2 clicks** desde el dashboard.
- **SC-102**: El 100% de las respuestas del endpoint de participación
  inspeccionadas en un escaneo automático sobre 50 papeletas NO
  contienen ningún campo que permita correlacionar un email con una
  puntuación concreta (Principio I de la constitución).
- **SC-103**: La búsqueda en el listado de propuestas devuelve
  resultados en **≤ 1 segundo** para volúmenes de hasta 200 propuestas
  activas.
- **SC-104**: La operación bulk "Excluir N seleccionadas" persiste el
  cambio y registra N entradas de auditoría en **≤ 1 segundo** para
  N ≤ 20.
- **SC-105**: Tras un cambio de estado del periodo iniciado por otro
  admin, el dashboard del primer admin refleja el nuevo estado en
  **≤ 15 segundos** sin recarga manual.

## Assumptions

- **Sin notificaciones push reales**: el refresco automático del
  dashboard se hace por *polling* del lado del cliente cada 10–15s. No
  se introduce websockets ni server-sent events en esta feature (se
  respeta el principio IV de simplicidad de la constitución).
- **Aforo esperado es opcional**: no condiciona ningún flujo; sólo se
  usa para mostrar el % de participación cuando está configurado.
- **Búsqueda local vs servidor**: para volúmenes ≤ 200 propuestas, la
  búsqueda se hace en cliente sobre la lista ya cargada. Si el volumen
  crece, se reconsidera (fuera de alcance del MVP).
- **Acciones bulk se limitan a exclude/restore**: no se introducen
  acciones bulk para fusionar o eliminar; esas operaciones siguen
  haciéndose una a una desde sus pantallas dedicadas.
- **Granularidad del log para acciones bulk**: una entrada por propuesta
  afectada (no una entrada con N targets) — facilita auditoría
  cronológica y reúne los detalles individuales.
- **Lista de votantes paginada con un único page-size**: 50 por página,
  sin filtrado por email (los administradores rara vez necesitan
  buscar a alguien concreto; si lo necesitan, `Cmd+F` en navegador es
  suficiente para volúmenes < 500).
- **Sin "borrador" de propuestas**: las propuestas son visibles para los
  votantes cuando están en estado `votable`; no hay estado intermedio
  "draft". El admin las crea ya votables y luego las excluye si quiere.
- **Idioma de la interfaz**: español (es-ES), consistente con el resto.
- **El acceso al dashboard NO modifica la lógica de Auth existente**: la
  validación `is_admin` se hace en cliente para enrutado y en servidor
  en cada endpoint (defensa en profundidad ya implementada).
- **Diseño asistido por Claude Design**: la UI del dashboard se
  prototipa en una sesión de Claude Design siguiendo el design system
  existente (`design-tokens.css`, `tailwind.config.js`,
  `design-system.md`). Se reusa el sistema visual; no se introducen
  paletas ni tipografías nuevas.
