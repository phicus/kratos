# Design Brief — Admin Dashboard (feature 002)

Esta feature **añade un panel principal admin** sobre un sistema visual
ya existente. NO se rediseña el resto de la app. El design system vive en
`frontend/src/styles/design-tokens.css`, `frontend/tailwind.config.js` y
`specs/001-voting-system/design-system.md`.

## Pantallas / componentes a diseñar

1. **`/admin` — Dashboard principal**
   - Hero con estado del periodo (preparación / abierto / cerrado) como
     bloque grande visualmente distinto por estado.
   - Fila de tarjetas con contadores clicables: propuestas votables,
     excluidas, padres-fusión, papeletas emitidas.
   - Sección "Acciones rápidas" con CTAs contextuales según estado
     (matriz definida en spec).
   - Sección "Últimas acciones" mostrando las 5 últimas entradas del log
     admin (timestamp · admin · acción).
   - Estados vacíos para: sin propuestas en preparación, 0 papeletas en
     abierto, recién reiniciado, etc.

2. **Sección "Participación"** (visible sólo con periodo `abierto`)
   - Visualmente distinguible: círculo/barra de progreso "X de Y (Z%)".
   - Input pequeño "Aforo esperado" inline.
   - Lista de emails de votantes (paginada 50/página, virtual si > 100),
     con timestamp de cada voto.
   - Nota visual sutil que recuerde que SÓLO se ve quién, no qué se
     votó (refuerza la confianza en el anonimato).

3. **Mejoras sobre `/admin/proposals` (existente)**
   - Campo de búsqueda en la cabecera.
   - Checkbox de selección por fila + checkbox master "seleccionar
     todos los visibles".
   - Barra flotante con "N seleccionadas · Excluir · Restaurar" cuando
     hay ≥ 1 selección.

## Restricciones (NO negociables)

- **Stack**: Tailwind 3 + lucide-react + componentes ya portados en
  `frontend/src/components/ui/*`. No introducir nuevas librerías UI.
- **Tokens semánticos existentes**: paleta (primary, surface, fg-muted,
  warning, success, danger), `font-display`/`font-body`/`font-mono`,
  `rounded-card`/`rounded-control`, `shadow-card`, focus ring AA.
- **Mobile**: el dashboard debe ser usable en 360px de ancho (los
  administradores podrían consultarlo desde el móvil).
- **Idioma**: es-ES, mismo tono que el resto ("Pelea de gallos · Round
  X").
- **Accesibilidad**: contrastes AA, foco visible, atributos ARIA en
  selecciones múltiples.

## Lo que NO hay que tocar

- Login, Vote, AlreadyVoted, PeriodNotOpen/Closed, Results, NotFound: no
  cambian visualmente en esta feature.
- Pantallas `/admin/period`, `/admin/merge`, `/admin/audit` existentes:
  se mantienen intactas (el dashboard apunta a ellas).
- Tokens del design system: NO se cambian valores. Si se necesita un
  matiz nuevo (p.ej. otra variante de Badge), se extiende usando los
  raws existentes.

---

## Prompt para Claude Design

Copia/pega este bloque completo en una nueva sesión de Claude (en
[claude.ai](https://claude.ai)). El prompt es autocontenido.

````markdown
Eres un diseñador de producto senior. Vas a **diseñar el panel de
administración** de una webapp interna de Phicus (Kratos).
**NO** rediseñas el resto de la app: hay un design system ya en uso que
debes respetar al 100%.

## Contexto previo (resumido)

- Empresa: **Phicus**, consultora tecnológica española.
- Producto: votación interna anónima donde empleados puntúan propuestas
  internas de 1 a 10. Voto único e irreversible. Dos administradores
  (jgomez@phicus.es, epastor@phicus.es) gestionan el proceso.
- Volumen: ≤ 500 votantes, ≤ 200 propuestas.
- El proceso tiene tres estados secuenciales:
  - **preparación**: el admin importa CSV, edita, excluye o fusiona
    propuestas, antes de abrir.
  - **abierto**: los empleados emiten papeleta. Los admins observan
    participación.
  - **cerrado**: se publica el ranking. Los admins pueden exportar CSV o
    reiniciar.
- Tono de marca: profesional con guiños sutiles (la votación
  internamente se llama "Pelea de gallos, Round N").

## Sistema visual existente (NO inventar nuevos tokens)

- **Stack**: Tailwind CSS 3 + lucide-react.
- **Paleta** (variables CSS ya definidas, úsalas tal cual):
  - `--color-background` `#faf9f7`, `--color-surface` `#fff`,
    `--color-surface-sunken` `#f3f1ed`.
  - `--color-text` `#15140f`, `--color-text-secondary` `#534f49`,
    `--color-text-muted` `#76716a`.
  - `--color-primary` `#1f7a86` (teal-blue), `--color-primary-soft`
    `#ecf6f7`.
  - `--color-accent` `#e36a3a` (coral, reservado para guiños).
  - `--color-success` `#2f8f55`, `--color-warning` `#b4801b`,
    `--color-danger` `#c83838`. Cada uno con variante "soft" + texto.
- **Tipografías**: Geist (display + body), Geist Mono (números y datos).
- **Radios**: 6px controles, 10px cards, 14px modales, 999px pill.
- **Sombras**: `shadow-sm` cards, `shadow-md` hover, `shadow-focus` para
  AA.
- **Componentes ya portados** (no rediseñar — sólo componer): Button
  (primary/secondary/danger/ghost), Card, Badge (neutral/primary/
  success/warning/danger), Banner (info/success/warning/danger/neutral),
  Modal + ConfirmModal, Input, Textarea, Label, Toast.

## Pantallas a diseñar

### 1. `/admin` — Dashboard

Layout en 3 zonas verticales:

**Zona A — Estado del periodo (hero)**
- Tarjeta grande con el estado actual (preparación / abierto / cerrado)
  como elemento visualmente protagonista.
- Cada estado tiene variante de color distinta usando los soft tokens:
  preparación → warning, abierto → primary, cerrado → surface-sunken.
- Sub-texto contextual: "Importa las propuestas y abre la votación
  cuando esté lista." / "Faltan N votantes por participar." / "Ranking
  publicado. Descarga el CSV o reinicia."

**Zona B — Métricas y acciones rápidas (grid)**
- Fila de 4 tarjetas con contadores clicables (cada una abre el
  listado correspondiente filtrado):
  - Propuestas votables (icono `ClipboardList`).
  - Excluidas (`EyeOff`).
  - Padres de fusión (`GitMerge`).
  - Papeletas emitidas (sólo si abierto o cerrado; icono `Vote`).
- Cada tarjeta: número grande en `font-display`, etiqueta, icono
  pequeño arriba a la derecha.
- Debajo, una caja "Próximos pasos" con 1–3 CTAs según el estado (matriz
  abajo).

**Zona C — Últimas acciones**
- Lista compacta de las 5 últimas entradas del audit log.
- Cada fila: timestamp (mono · 12px · muted) · Badge de la acción ·
  email del admin · ids afectados (mono).
- Link al final "Ver log completo →" a `/admin/audit`.

**Matriz de CTAs según estado** (define qué tarjetas aparecen en la caja
"Próximos pasos"):

| Estado       | CTAs (en orden de prioridad)                                                |
|--------------|------------------------------------------------------------------------------|
| preparación  | Importar CSV (primario) · Crear propuesta · Fusionar duplicadas · Abrir votación |
| abierto      | Ver participación (primario) · Cerrar votación · Ver log                     |
| cerrado      | Descargar resultados CSV (primario) · Ver ranking · Reiniciar votación (danger) · Ver log |

### 2. Sección "Participación" (modal o ruta `/admin/participation`)

Sólo visible/accesible con estado `abierto`.

- Header con número grande "X / Y" (en `font-display`) + barra de
  progreso debajo. Si Y=0 (aforo no configurado), mostrar sólo X y un
  input pequeño inline "Aforo esperado: [__]".
- Pill `Periodo abierto · faltan N votantes` arriba a la derecha.
- Lista de votantes paginada (50/página) con dos columnas: email
  (font-body), timestamp (`font-mono`, formato `dd/mm HH:MM`).
- Nota sutil al pie: "El sistema sólo registra quién ha votado, nunca
  qué ha votado." (font-style italic, text-muted).

### 3. Mejoras sobre `/admin/proposals` (rediseño parcial)

Sin cambiar el layout general, añadir:

- Campo de búsqueda en la cabecera (input con icono `Search` a la
  izquierda, `XCircle` para limpiar a la derecha).
- En cada fila: checkbox a la izquierda (touch target ≥ 24px).
- Barra flotante en la parte inferior (sticky, sólo cuando hay
  selección): "3 seleccionadas · Excluir · Restaurar · Cancelar".
- En estado `preparación` los checkboxes son visibles; en abierto y
  cerrado se ocultan (no `disabled`, ocultos).

## Entregables esperados

1. **Mockup ASCII / Mermaid de cada una de las 3 pantallas** (desktop y
   mobile cuando aplique, especialmente la lista de propuestas con
   selección).
2. **Snippets de código JSX + Tailwind** para los componentes nuevos:
   - `<AdminDashboard />` con sus tres zonas A/B/C.
   - `<MetricCard counter={...} label={...} icon={Icon} onClick={...} />`
   - `<ActionCardContextual state="abierto" />` con la matriz de CTAs.
   - `<RecentAuditList entries={...} />`.
   - `<ParticipationView voters={...} quorum={...} />` con la progress
     bar.
   - `<ProposalsSearchAndBulk />` (el bloque de buscador + barra
     flotante de bulk).
3. **Markdown actualizando `design-system.md`** con la nueva sección
   "Componentes del Admin Dashboard" — sólo añadir, no reescribir lo
   existente.
4. **Notas de accesibilidad** específicas para:
   - Foco visible en checkboxes de selección masiva.
   - ARIA en la lista de votantes (rol `list` + `listitem` + label).
   - Anuncio para screen readers cuando cambia el contador de
     seleccionadas.

## Restricciones (NO negociables)

- NO introducir nuevas librerías UI ni nuevos tokens semánticos.
- NO modificar las pantallas ya implementadas fuera de `/admin/*`.
- Mobile-first: el dashboard debe ser perfectamente usable a 360px de
  ancho.
- AA mínimo en contrastes y navegación por teclado.
- Idioma de la UI: español de España, mismo tono que el resto.

Empieza por el mockup ASCII de la pantalla 1 en desktop y mobile,
después saltas a los componentes.
````

---

## Después del output de Claude Design

1. Pega los mockups y código en una nueva sesión de Claude Code junto al
   spec (`specs/002-admin-dashboard/spec.md`), o directamente en este
   directorio como `design-output.md`.
2. Ejecutamos `/speckit-plan` para generar `plan.md` con el detalle
   técnico (nuevo endpoint `/api/admin/participation`, hooks `useDashboardStats`,
   refresco con polling, persistencia del aforo en `periods`, etc.).
3. Después `/speckit-tasks` y `/speckit-implement`.

## Fallback si no puedes pasar por Claude Design

Si prefieres iterar el dashboard directamente sin pasar por una sesión
de Claude Design separada, dímelo y procedo a `/speckit-plan` →
`/speckit-tasks` → `/speckit-implement` aplicando las decisiones de
diseño documentadas aquí (mockups ASCII + composición con los componentes
ya existentes). Es viable porque el sistema visual está estabilizado y
el alcance del rediseño es localizado.
