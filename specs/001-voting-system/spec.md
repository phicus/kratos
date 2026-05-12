# Feature Specification: Kratos

**Feature Branch**: `001-voting-system`
**Created**: 2026-05-11
**Status**: Draft
**Input**: User description: "Sistema de votación empresarial donde los empleados de Phicus, autenticados con Google Workspace (@phicus.es), puntúan de 1 a 10 las propuestas internas. Voto anónimo, una sola vez por persona. Administradores (jgomez@phicus.es, epastor@phicus.es) abren/cierran el plazo, pueden fusionar propuestas solapadas, y al cierre el sistema ordena las propuestas por suma de puntos descendente."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Emitir papeleta de votación anónima (Priority: P1)

Cualquier empleado con cuenta `@phicus.es` accede al sistema, se autentica con Google,
visualiza la lista de propuestas vigentes, otorga una puntuación de 1 a 10 a cada una
y envía su papeleta una sola vez. El sistema garantiza que no podrá emitir un segundo
voto y que su papeleta queda registrada sin posibilidad técnica de asociarla a su
identidad.

**Why this priority**: Es el corazón del producto. Sin esta historia no hay sistema
de votación: es lo que justifica el proyecto y lo que la dirección de Phicus quiere
conseguir. Las demás historias añaden control, calidad o consulta, pero esta sola
ya constituye un MVP funcional cuando hay un conjunto de propuestas precargado y un
periodo abierto por configuración inicial.

**Independent Test**: Con un conjunto de propuestas precargado y el periodo
configurado como "abierto", una cuenta `@phicus.es` puede entrar, puntuar las
propuestas, enviar la papeleta y comprobar (a) que no puede volver a entrar a votar,
(b) que su email aparece en la lista de "ya votó", y (c) que el registro de
puntuaciones almacenado no contiene su identidad.

**Acceptance Scenarios**:

1. **Given** que el periodo de votación está abierto y existen N propuestas,
   **When** una persona con email `usuario@phicus.es` inicia sesión por primera
   vez y envía una papeleta con una puntuación entre 1 y 10 para cada propuesta,
   **Then** el sistema acepta la papeleta y al volver a entrar le indica que
   ya ha votado y no le ofrece formulario.
2. **Given** que `usuario@phicus.es` ya emitió su papeleta, **When** intenta
   enviar una segunda papeleta por cualquier vía (recargar, otro dispositivo),
   **Then** el sistema rechaza el envío con un mensaje claro y las puntuaciones
   almacenadas no cambian.
3. **Given** una papeleta enviada, **When** un administrador con acceso directo
   al almacén intenta determinar qué puntuaciones emitió `usuario@phicus.es`,
   **Then** la consulta es imposible porque los registros de puntuación no
   contienen ni email, ni ID de usuario, ni ningún identificador correlacionable
   con la identidad del votante.
4. **Given** un intento de inicio de sesión con `externo@gmail.com` o
   `proveedor@otro-dominio.com`, **When** el flujo de Google devuelve la
   identidad, **Then** el sistema rechaza el acceso antes de mostrar
   propuestas y no crea ningún recibo de voto para esa identidad.

---

### User Story 2 - Control del periodo de votación por administradores (Priority: P2)

Los administradores `jgomez@phicus.es` y `epastor@phicus.es` deciden cuándo se abre
y cuándo se cierra el periodo de votación. Mientras esté cerrado nadie puede emitir
papeletas; al cerrarlo, ya no se aceptan más envíos y se habilita la publicación de
resultados.

**Why this priority**: Sin control administrativo, la votación o bien queda
permanentemente abierta (sin desenlace) o bien permanentemente cerrada (sin
participación). Es lo que convierte un MVP estático en un proceso real con
principio y fin. No es P1 porque, para el primer despliegue de prueba, basta con
fijar el estado "abierto" mediante configuración.

**Independent Test**: Sin necesidad de historia US1, un administrador puede
autenticarse, alternar el estado del periodo entre "preparación", "abierto" y
"cerrado", y verificar que (a) en "preparación" el resto de usuarios ven una
pantalla "todavía no disponible", (b) en "abierto" se permite votar y (c) en
"cerrado" se bloquean nuevos envíos.

**Acceptance Scenarios**:

1. **Given** que el periodo está en "preparación", **When** una cuenta normal
   `@phicus.es` accede, **Then** ve un mensaje "La votación aún no está abierta"
   y no se le ofrece el formulario.
2. **Given** que `jgomez@phicus.es` está autenticado y el periodo está en
   "preparación", **When** pulsa "Abrir votación", **Then** el estado pasa a
   "abierto", queda registrada la acción con su email y timestamp en el log
   administrativo, y a partir de ese instante los empleados pueden votar.
3. **Given** que el periodo está "abierto" y hay papeletas ya emitidas,
   **When** `epastor@phicus.es` pulsa "Cerrar votación", **Then** el estado
   pasa a "cerrado", se registra en el log administrativo, y nuevos intentos
   de envío de papeleta son rechazados aunque procedan de usuarios que aún
   no habían votado.
4. **Given** que `usuario@phicus.es` (no administrador) está autenticado,
   **When** intenta abrir o cerrar el periodo, **Then** el sistema rechaza la
   acción con un error de autorización.

---

### User Story 3 - Fusión de propuestas solapadas antes de abrir (Priority: P3)

Antes de abrir el periodo, un administrador revisa el conjunto de propuestas
importadas, identifica aquellas que se solapan y las fusiona en una propuesta
nueva que preserva la referencia a las propuestas "padre".

**Why this priority**: Lo pide explícitamente el cliente en `requisitos.txt`
para asegurar que el resultado refleje preferencias reales y no se diluyan ideas
similares. Sin embargo, no es P1 porque la votación puede funcionar perfectamente
sin fusionar nada (a coste de algún solapamiento en los datos crudos).

**Independent Test**: Sin necesidad de US1 ni US2, un administrador puede entrar
con el periodo en "preparación", seleccionar dos propuestas existentes, fusionarlas
indicando un nombre y descripción nuevos, y verificar que (a) la nueva propuesta
aparece en la lista, (b) las dos originales dejan de aparecer como votables, y
(c) la nueva propuesta mantiene visible la referencia a los IDs originales en
sus metadatos.

**Acceptance Scenarios**:

1. **Given** que el periodo está en "preparación" y existen las propuestas
   A y B con contenido solapado, **When** `jgomez@phicus.es` ejecuta una fusión
   indicando un nuevo nombre y descripción, **Then** se crea una nueva propuesta
   C cuyos metadatos referencian A y B como padres, y A y B dejan de mostrarse
   como votables.
2. **Given** una propuesta C resultado de fusionar A y B, **When** un votante
   emite su papeleta, **Then** puede puntuar C pero ni A ni B, y al cierre los
   puntos asignados a C cuentan únicamente para C.
3. **Given** que el periodo está "abierto" (votación en curso), **When** un
   administrador intenta fusionar dos propuestas, **Then** el sistema rechaza
   la operación con un mensaje "Cierra o vuelve a preparación para fusionar
   propuestas".
4. **Given** una propuesta C fusión de A y B, **When** un administrador
   "deshace" la fusión antes de abrir el periodo, **Then** A y B vuelven a
   estar disponibles como votables y C deja de existir.

---

### User Story 4 - Consulta del ranking final al cierre (Priority: P4)

Cuando el periodo se cierra, cualquier empleado autenticado puede ver el ranking
de propuestas ordenadas por puntuación total descendente.

**Why this priority**: Es el "entregable" visible del proceso, pero un MVP
defendible puede entregar resultados manualmente (export CSV) sin pantalla
dedicada. La automatización es valiosa pero no bloqueante.

**Independent Test**: Sin US1 (con papeletas seedeadas) y con el periodo forzado
a "cerrado", cualquier cuenta `@phicus.es` puede entrar y ver la lista ordenada
de propuestas con su puntuación total.

**Acceptance Scenarios**:

1. **Given** que el periodo está "cerrado" y hay papeletas emitidas, **When**
   `usuario@phicus.es` accede al ranking, **Then** ve todas las propuestas
   votables ordenadas por suma de puntos descendente, con la suma visible
   junto a cada una.
2. **Given** dos propuestas con la misma suma de puntos, **When** se muestra
   el ranking, **Then** se desempata por orden alfabético de nombre.
3. **Given** que el periodo está "abierto" (no cerrado todavía), **When**
   `usuario@phicus.es` intenta acceder al ranking, **Then** el sistema
   responde con un mensaje "Resultados disponibles al cierre".

---

### Edge Cases

- **Acceso desde cuenta personal**: una sesión Google con un email `@gmail.com`
  o cualquier dominio distinto de `phicus.es` es rechazada incluso si el usuario
  está invitado al Workspace o pertenece a otra organización.
- **Doble envío por carrera de red**: dos envíos casi simultáneos del mismo
  usuario sólo registran uno; el otro recibe el error de "ya votó".
- **Cierre durante envío**: si el periodo se cierra mientras un usuario está
  rellenando el formulario, al pulsar "enviar" el sistema rechaza el envío y
  ninguna puntuación queda registrada.
- **Papeleta incompleta**: enviar el formulario sin haber puntuado todas las
  propuestas se rechaza con indicación de qué propuestas faltan; la papeleta
  parcial NO se persiste y el usuario sigue contando como "no votado".
- **Puntuación fuera de rango**: cualquier puntuación < 1 o > 10, o no entera,
  invalida la papeleta completa con un mensaje claro.
- **Fusión con el periodo abierto**: bloqueada (ver US3-3).
- **Resultados con 0 papeletas**: el ranking se muestra con todas las
  propuestas y suma 0 cada una; no es un error.
- **Lista de admins inválida en deploy**: si la configuración no contiene
  ningún administrador, el sistema arranca pero todas las acciones admin
  quedan inaccesibles y se muestra un aviso en el log de despliegue.
- **Reintentos OAuth fallidos**: si Google devuelve error o el `hd` no es
  `phicus.es`, el usuario ve un mensaje claro y puede reintentar; no se
  crea sesión ni registro alguno.

## Requirements *(mandatory)*

### Functional Requirements

#### Autenticación y autorización

- **FR-001**: El sistema MUST autenticar a los usuarios exclusivamente mediante
  Google OAuth/OIDC contra el Workspace de Phicus, validando server-side que la
  identidad pertenece al dominio `phicus.es`.
- **FR-002**: El sistema MUST rechazar el acceso a cualquier cuenta cuyo email
  no termine en `@phicus.es` o cuya claim de dominio (`hd`) no sea `phicus.es`,
  aunque la autenticación con Google sea exitosa.
- **FR-003**: El sistema MUST reconocer como administradores únicamente los
  emails configurados en una lista fija (por defecto `jgomez@phicus.es` y
  `epastor@phicus.es`).
- **FR-004**: El sistema MUST establecer una sesión autenticada de duración
  limitada (≤ 8 horas) tras validar la identidad de Google.

#### Propuestas

- **FR-010**: El sistema MUST permitir cargar un conjunto inicial de propuestas
  a partir del export del formulario de Google existente, conservando al menos
  nombre, descripción/objetivo, descripción del cómo (opcional) y estimación
  temporal (opcional).
- **FR-011**: El sistema MUST permitir a los administradores, mientras el
  periodo esté en "preparación", editar el nombre y descripción de una
  propuesta, marcar propuestas como excluidas (no votables) y restaurarlas.
- **FR-012**: El sistema MUST permitir a los administradores fusionar dos o
  más propuestas en una nueva propuesta cuya identidad reemplaza a las
  originales como entidad votable, preservando referencias a los IDs de las
  propuestas padre.
- **FR-013**: El sistema MUST permitir deshacer una fusión mientras el periodo
  esté en "preparación", restaurando las propuestas padre como votables.
- **FR-014**: El sistema MUST bloquear cualquier cambio sobre las propuestas
  (edición, fusión, exclusión, deshacer fusión) cuando el periodo esté
  "abierto" o "cerrado".

#### Periodo de votación

- **FR-020**: El sistema MUST mantener un único periodo de votación con
  exactamente uno de estos estados en cada instante: `preparación`, `abierto`,
  `cerrado`.
- **FR-021**: El sistema MUST permitir a los administradores transitar el
  estado del periodo: `preparación → abierto`, `abierto → cerrado`,
  `cerrado → preparación` (este último sólo si se desea reiniciar; al hacerlo
  todas las papeletas anteriores se purgan).
- **FR-022**: El sistema MUST registrar cada transición de estado en un log
  administrativo append-only con email del administrador, timestamp y
  estado origen/destino.

#### Emisión de voto

- **FR-030**: El sistema MUST presentar a cada votante autenticado la lista
  completa de propuestas votables (no excluidas, no padre de fusión) cuando
  el periodo esté "abierto" y el votante aún no haya votado.
- **FR-031**: El sistema MUST exigir que la papeleta contenga una puntuación
  entera entre 1 y 10 (ambos inclusive) para CADA propuesta votable; no se
  aceptan papeletas parciales.
- **FR-032**: El sistema MUST registrar la papeleta de forma atómica: o se
  persisten todas las puntuaciones y el recibo de voto, o no se persiste nada.
- **FR-033**: El sistema MUST garantizar que ningún registro de puntuación
  persistido contenga, directa o indirectamente, identificador del votante
  (email, sub Google, IP, user-agent ni timestamp con precisión > 1 minuto).
- **FR-034**: El sistema MUST mantener un registro separado de "recibos de
  voto" que contenga sólo email del votante y un timestamp redondeado,
  sin ninguna referencia a las puntuaciones emitidas.
- **FR-035**: El sistema MUST rechazar cualquier segundo intento de votar
  del mismo usuario, incluso bajo condiciones de carrera (envíos simultáneos).
- **FR-036**: El sistema MUST rechazar cualquier intento de votar fuera del
  estado `abierto`.
- **FR-037**: Una papeleta emitida MUST ser irreversible: el usuario no puede
  modificarla ni eliminarla, ni siquiera con el periodo aún abierto.

#### Resultados

- **FR-040**: El sistema MUST calcular, al pasar a "cerrado", la suma de
  puntos recibida por cada propuesta votable.
- **FR-041**: El sistema MUST mostrar a cualquier usuario autenticado, cuando
  el estado sea "cerrado", el ranking de propuestas ordenado por suma de
  puntos descendente.
- **FR-042**: En caso de empate por suma, el sistema MUST ordenar las
  propuestas implicadas alfabéticamente por nombre.
- **FR-043**: El sistema MUST exponer el ranking también en un formato
  exportable (CSV) accesible para administradores.

#### Auditoría administrativa

- **FR-050**: El sistema MUST registrar en el log administrativo append-only
  cada acción administrativa relevante (transición de periodo, edición de
  propuesta, exclusión/restauración, fusión, deshacer fusión, exportación
  de resultados) con email del administrador, acción, IDs afectados y
  timestamp.
- **FR-051**: El log administrativo NO debe contener ninguna información que
  permita relacionar una acción admin con una papeleta concreta.

### Key Entities

- **Empleado votante**: persona con cuenta `@phicus.es` en el Workspace de
  Phicus. Identificada por su email. Estado relevante: "ha votado / no ha
  votado" en el periodo actual.
- **Administrador**: subconjunto de empleados votantes con permisos para
  gestionar propuestas y periodo. Configurado por lista fija.
- **Propuesta**: idea o proyecto candidato a votación. Atributos: nombre,
  descripción del objetivo, descripción del cómo (opcional), estimación
  temporal (opcional), autor original (opcional, importado del Google Form),
  estado (votable / excluida / padre-de-fusión), referencias a propuestas
  padre si es una fusión.
- **Periodo de votación**: estado global del proceso con valores
  `preparación`, `abierto` o `cerrado`.
- **Papeleta (registro de puntuaciones)**: conjunto de puntuaciones (1-10)
  por propuesta votable emitidas en un mismo envío. No contiene identidad
  del votante.
- **Recibo de voto**: prueba de que un email ha votado en el periodo actual.
  Contiene email y timestamp redondeado. No contiene puntuaciones ni
  referencia a una papeleta concreta.
- **Entrada de log administrativo**: registro append-only de una acción
  ejecutada por un administrador. Contiene email del admin, acción,
  identificadores de entidades afectadas y timestamp.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El 100% de las papeletas almacenadas son verificablemente
  anónimas: una auditoría automática sobre el almacén no encuentra ningún
  campo del registro de puntuaciones que correlacione con la identidad del
  votante (validable mediante una prueba que inserta 50 papeletas y comprueba
  que ningún campo persistido en puntuaciones coincide con los emails
  emitidos).
- **SC-002**: 0 votos duplicados aceptados por usuario en cualquier escenario:
  una prueba automatizada que lanza 100 intentos concurrentes de doble voto
  por el mismo usuario debe terminar con exactamente 1 papeleta registrada.
- **SC-003**: El 100% de los intentos de acceso con cuentas externas al
  dominio `phicus.es` son rechazados antes de crear sesión y antes de exponer
  propuestas.
- **SC-004**: Un empleado puede iniciar sesión, leer todas las propuestas,
  puntuarlas y emitir su papeleta en menos de 5 minutos en condiciones
  normales (asumiendo ≤ 200 propuestas activas).
- **SC-005**: Tras cerrar el periodo, el ranking de propuestas se calcula y
  presenta a un usuario autenticado en menos de 3 segundos para volúmenes
  de hasta 500 votantes y 200 propuestas.
- **SC-006**: Un administrador puede fusionar dos propuestas en una sola
  operación end-to-end en menos de 1 minuto (desde abrir el listado hasta
  ver la propuesta resultante en la lista de votables).
- **SC-007**: El log administrativo contiene una entrada por cada acción
  administrativa observable (transición de periodo, edición, fusión,
  exclusión, exportación), verificable comparando una secuencia de 20
  acciones simuladas contra el log resultante.

## Assumptions

- **Importación inicial**: las propuestas del MVP se importan a partir del
  CSV `Formulario sin título (respuestas) - Respuestas de formulario 1.csv`
  presente en la raíz del repositorio, que contiene ~174 entradas de un
  formulario de Google.
- **Visibilidad de resultados al cierre**: cualquier empleado autenticado
  con cuenta `@phicus.es` puede consultar el ranking final, no solo los
  administradores. Razón: la votación es interna y el resultado es feedback
  de equipo, no información confidencial.
- **Reversibilidad del voto**: una papeleta emitida es definitiva incluso
  con el periodo abierto. Razón: simplifica el modelo "un voto por persona"
  y refuerza el principio de anonimato (no se requiere correlacionar usuario
  con papeleta para reemplazarla).
- **Idioma de interfaz**: español (es-ES).
- **Volumen**: ≤ 200 propuestas activas y ≤ 500 empleados con cuenta
  `@phicus.es`. No se requiere escalabilidad más allá.
- **Concurrencia de procesos**: una sola elección activa a la vez; no hay
  necesidad de soportar múltiples kratoses en paralelo.
- **Gestión de la lista de administradores**: la lista se define en la
  configuración del despliegue (variable de entorno o archivo). Cambiarla
  requiere redeploy. Razón: el alcance MVP no justifica una UI de gestión
  de administradores.
- **Plataforma**: aplicación web. No hay app móvil nativa. Acceso desde
  navegador moderno (últimas dos versiones mayores de Chrome, Firefox,
  Safari, Edge).
- **Notificaciones de apertura/cierre**: no se envían notificaciones
  automáticas por email; los administradores comunican la apertura y
  cierre del periodo por canales internos (Slack, email manual). Esto
  queda fuera del alcance de la aplicación.
- **Despliegue y operaciones**: despliegue interno controlado por el
  equipo de Phicus; no se requiere SLA público. Una caída temporal del
  servicio no compromete los datos: la persistencia es local y duradera
  entre reinicios.
- **Reinicio de periodo**: si un administrador vuelve a `preparación` desde
  `cerrado`, se entiende como "reiniciar la votación": todas las papeletas
  y recibos del ciclo anterior se purgan. El log administrativo conserva la
  acción de reinicio para trazabilidad.
- **Auditoría externa**: la verificación del anonimato y de la unicidad del
  voto se realiza mediante tests automatizados en el repositorio, no por
  un tercero externo.
