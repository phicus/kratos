# Subo Voting Interface Prototype

_Started 2026-05-11 20:19 UTC_

---

## User



## Assistant

_[tool: questions_v2]_

Antes de empezar, quiero confirmar un par de cosas — el brief está muy claro pero hay decisiones que necesito que tomes tú.

## User

Questions answered:
- brand_source: Subo logo + paleta + tipografía oficial (recomendado)
- deliverable: Prototipo interactivo clickable de las pantallas clave (Login → Vote → AlreadyVoted, + Results, + Admin) con tweaks
- device_focus: Mobile y desktop lado a lado para cada pantalla relevante
- score_selector_variations: 4+ variantes muy divergentes (incluyendo ideas novedosas tipo emoji, color gradient, dial)
- tone: Profesional con guiños sutiles (microcopy juguetón, ilustración minimal)
- tweaks_focus: Decide for me
- tech_artifacts: Sí, todos (HTML mockups + CSS tokens + tailwind config + .md)
- imagery: Iconografía lucide-react + algún acento geométrico (formas, patrones)

## Assistant

_[tool: list_files]_

¡Perfecto, gracias! Dijiste que subes logo + paleta + tipografía oficial de Phicus, pero todavía no veo los archivos en el proyecto.

**¿Me los puedes adjuntar?** Idealmente:
- Logo (SVG si tienes, si no PNG)
- Paleta (códigos hex de primarios, secundarios, neutros) — vale una imagen del manual de marca, una captura, o simplemente pegada como texto
- Tipografía (nombre de las familias para titular y cuerpo, y si son de pago, alternativas que puedas usar)

**Mientras tanto, voy avanzando** con la arquitectura del prototipo y los componentes base usando colores/tipografía neutros como placeholder. Cuando me pases la marca real intercambio los tokens y todo se actualiza automáticamente (esa es justo la gracia de tener `design-tokens.css` centralizado).

Voy a:

1. Montar la estructura del proyecto (carpetas `frontend/src/styles`, `specs/001-voting-system/`, etc.)
2. Crear `design-tokens.css` + `tailwind.config.js` + `design-system.md` con tokens placeholder bien organizados
3. Construir el prototipo interactivo (HTML/React) con las pantallas clave + tweaks para paleta, tipografía, densidad, y variantes del Score Selector
4. Mockups mobile + desktop lado a lado en un design canvas para revisar el sistema

Empiezo y te muestro algo en breve. Adjunta los assets cuando puedas — los integro en cuanto lleguen.

_[tool: update_todos]_

_[tool: copy_starter_component]_

Voy a empezar. Declaro la dirección estética que usaré como placeholder (intercambiable cuando suba la marca real):

**Sistema base provisional**
- **Tipografía**: `Geist` (UI/cuerpo) + `Geist Mono` (datos numéricos, código) — técnico, neutro, legible en densidad alta
- **Color**: primario teal-blue oklch confiado (técnico, no genérico azul corporativo), neutros cálidos (oklch warm grays), acento coral reservado para el guiño "Pelea de gallos"
- **Radios**: 10px (cards), 6px (controles) — suave sin ser blando
- **Sombras**: sutiles, capa única (no drama)
- **Iconografía**: lucide-react via SVG inline, peso 1.5

Empiezo por starters + tokens.

_[tool: copy_starter_component]_

_[tool: read_file]_

_[tool: snip]_

Now let me build the design tokens, tailwind config, design system doc, and the prototype.

_[tool: write_file]_

_[tool: write_file]_

_[tool: write_file]_

_[tool: snip]_

_[tool: write_file]_

_[tool: write_file]_

Now the prototype. I'll split into focused files.

_[tool: snip]_

Now the score selectors (4 divergent variants) and UI primitives.

_[tool: write_file]_

_[tool: snip]_

_[tool: read_file]_

_[tool: snip]_

Now the screens. I'll build them as one cohesive App with internal routing.

_[tool: write_file]_

_[tool: snip]_

Now the screens.

_[tool: write_file]_

_[tool: snip]_

_[tool: write_file]_

_[tool: write_file]_

_[tool: snip]_

_[tool: done]_

_[tool: fork_verifier_agent]_

Listo. Te dejo un resumen muy breve:

**Entregables**
- `Kratos.html` — prototipo interactivo, canvas con todas las pantallas (Login, Vote, AlreadyVoted, Periodo cerrado/no abierto, Results, Admin Propuestas/Fusionar/Periodo/Auditoría, 404) + las 4 variantes del Score Selector (chips, slider, stepper, dial).
- `frontend/src/styles/design-tokens.css` — tokens semánticos (paleta, tipografía, espaciado, radios, sombras).
- `frontend/tailwind.config.js` — extensión del tema mapeada a los tokens.
- `specs/001-voting-system/design-system.md` — doc legible (paleta + contrastes AA, tipografía, componentes, mockups ASCII de las 10 pantallas).

**Tweaks expuestos** (botón Tweaks en la toolbar): 4 paletas, 4 tipografías, escala global, densidad, variante del Score Selector, y estado del periodo.

**Mobile + desktop** lado a lado en cada sección; Vote también incluye un artboard a 360px para verificar el caso crítico.

**Pendiente cuando subas la marca real de Phicus**: sustituir valores raw en `design-tokens.css` (paleta + `--font-display`/`--font-body`) — el resto se actualiza solo.

## User



## Assistant

_[tool: snip]_

_[tool: update_todos]_

_[tool: write_file]_

_[tool: snip]_

Voy a empezar por los mockups ASCII de la pantalla 1, después saltamos a los componentes.

## Pantalla 1 — `/admin` Dashboard

### Desktop (≥ 1024px)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ ◐ Phicus Vota   ✨ Pelea de gallos · R3                  [👤 Admin] [Salir]    │ ← Topbar
├─────────────────────────────────────────────────────────────────────────────────┤
│ [Dashboard] [Propuestas] [Fusionar] [Periodo] [Auditoría]                       │ ← Tabs admin
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  Dashboard                                                                      │
│                                                                                 │
│  ╔═══════════════════════════════════════════════════════════════════════════╗  │ ← ZONA A
│  ║   ▶  Periodo abierto                                              R3 ║      │   color = primary-soft
│  ║   Q3 2026 · Round 3 — faltan 3 días para cerrar                       ║     │   ICONO: PlayCircle (40px)
│  ║   "Faltan 16 votantes por participar."                                ║     │   Tag periodo "R3"
│  ║                                          [Ver participación →]       ║     │   CTA secundario inline
│  ╚═══════════════════════════════════════════════════════════════════════╝     │
│                                                                                 │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐                │ ← ZONA B (parte 1)
│  │ 📋          │ │ 🚫          │ │ 🔀          │ │ 🗳           │                │  4 MetricCards
│  │  24         │ │  3          │ │  2          │ │  32          │                │  número 32px display
│  │  Propuestas │ │  Excluidas  │ │  Fusionadas │ │  Papeletas   │                │  hover → underline
│  │  votables   │ │             │ │  (padres)   │ │  emitidas    │                │  click → lista filtrada
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘                │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────┐       │ ← ZONA B (parte 2)
│  │ Próximos pasos                                                      │       │  ActionCard contextual
│  │ ─────────────────────────────────────────────────────────────────── │       │
│  │ [▶ Ver participación   ]  [⏸ Cerrar votación]  [📜 Ver auditoría]   │       │  CTAs según matriz
│  └─────────────────────────────────────────────────────────────────────┘       │
│                                                                                 │
│  Últimas acciones                                          Ver log completo →   │ ← ZONA C
│  ┌─────────────────────────────────────────────────────────────────────┐       │
│  │ 11/05 09:42  ▣ Periodo abierto      maria@phicus.es    Q3-2026-R3   │       │   timestamp mono 12px
│  │ 11/05 09:38  ▣ Propuesta excluida   alvaro@phicus.es   p11          │       │   badge + admin + ids
│  │ 10/05 17:12  ▣ Fusión               maria@phicus.es    p10,p13→p10  │       │
│  │ 10/05 16:55  ▣ Propuesta creada     maria@phicus.es    p12          │       │
│  │ 09/05 11:20  ▣ Propuesta editada    alvaro@phicus.es   p6           │       │
│  └─────────────────────────────────────────────────────────────────────┘       │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Mobile (360px)

```
┌──────────────────────────────┐
│ ◐ Vota   [Admin]   [Salir]   │
├──────────────────────────────┤
│ Dashboard│Props│Fusion│Per│… │ ← tabs scrollables horizontal
├──────────────────────────────┤
│ Dashboard                    │
│                              │
│ ╔══════════════════════════╗ │ ← Zona A apilada
│ ║ ▶ Periodo abierto    R3  ║ │
│ ║ Q3 2026 · faltan 3 días  ║ │
│ ║ Faltan 16 por votar.     ║ │
│ ║ [Ver participación →]    ║ │
│ ╚══════════════════════════╝ │
│                              │
│ ┌────────────┐ ┌────────────┐│ ← Zona B grid 2×2
│ │ 📋  24     │ │ 🚫  3      ││
│ │ Votables   │ │ Excluidas  ││
│ └────────────┘ └────────────┘│
│ ┌────────────┐ ┌────────────┐│
│ │ 🔀  2      │ │ 🗳  32     ││
│ │ Fusionadas │ │ Papeletas  ││
│ └────────────┘ └────────────┘│
│                              │
│ ┌──────────────────────────┐ │
│ │ Próximos pasos           │ │ ← CTAs vertical stack
│ │ [▶ Ver participación]    │ │
│ │ [⏸ Cerrar votación]      │ │
│ │ [📜 Ver auditoría]       │ │
│ └──────────────────────────┘ │
│                              │
│ Últimas acciones             │
│ ┌──────────────────────────┐ │ ← Audit list densa
│ │ 11/05 09:42              │ │
│ │ ▣ Periodo abierto        │ │
│ │ maria@phicus.es · R3     │ │
│ ├──────────────────────────┤ │
│ │ 11/05 09:38              │ │
│ │ ▣ Propuesta excluida     │ │
│ │ alvaro@phicus.es · p11   │ │
│ └──────────────────────────┘ │
│ Ver log completo →           │
└──────────────────────────────┘
```

## Pantalla 2 — Participación (`/admin/participation`)

### Desktop

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ [← Dashboard]                       Participación        🟢 Abierto · faltan 16 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────┐       │
│  │                                                                     │       │
│  │   32 / 48 papeletas                                                 │       │ ← Número grande display 48px
│  │   ▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▱▱▱▱▱▱▱▱▱▱▱▱  67%                      │       │ ← Progress bar 12px alto
│  │                                                                     │       │
│  │   16 personas todavía no han votado.                                │       │ ← Subtexto secondary
│  │                                                                     │       │
│  └─────────────────────────────────────────────────────────────────────┘       │
│                                                                                 │
│  Cuando no hay aforo configurado:                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐       │
│  │  32 papeletas emitidas                                              │       │
│  │  ─────────────────────────                                          │       │
│  │  Aforo esperado: [    48    ]  [Guardar]                            │       │ ← Input inline
│  └─────────────────────────────────────────────────────────────────────┘       │
│                                                                                 │
│  Personas que ya han votado                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐       │
│  │  email                                  cuándo                      │       │
│  ├─────────────────────────────────────────────────────────────────────┤       │
│  │  maria@phicus.es                        11/05 09:48                 │       │   email body
│  │  alvaro@phicus.es                       11/05 09:51                 │       │   timestamp mono 12px
│  │  jgomez@phicus.es                       11/05 10:02                 │       │
│  │  …                                                                  │       │
│  ├─────────────────────────────────────────────────────────────────────┤       │
│  │  [← Anterior]   Página 1 · de 1          50 por página              │       │
│  └─────────────────────────────────────────────────────────────────────┘       │
│                                                                                 │
│  ⓘ El sistema sólo registra quién ha votado, nunca qué ha votado.              │ ← italic muted 13px
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Pantalla 3 — `/admin/proposals` (búsqueda + bulk)

### Desktop · estado `preparación` (con checkboxes visibles)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  Propuestas                                                  [+ Nueva propuesta]│
│                                                                                 │
│  [🔍 Buscar por nombre…                    ⊗] [Todas·24][Votables][Excluidas]  │
│                                                                                 │
│  ┌──────────────────────────────────────────────────────────────────────────┐  │
│  │ ☐  Nombre                                  Estado     Estimación   ··· │  │
│  ├──────────────────────────────────────────────────────────────────────────┤  │
│  │ ☑  Refactor del login con OAuth2          Votable     8d           ··· │  │   row con check ON
│  │ ☐  Centralizar documentación en Notion    Votable     5d           ··· │  │
│  │ ☑  Onboarding nuevo de ingeniería         Votable     12d          ··· │  │
│  │ ☑  Métricas de rendimiento por endpoint   Votable     6d           ··· │  │
│  │ …                                                                       │  │
│  └──────────────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
│  ╔══════════════════════════════════════════════════════════════════════════╗  │ ← Sticky bulk bar
│  ║ 3 seleccionadas       [Excluir] [Restaurar] [Cancelar selección]         ║  │   surface elevada
│  ╚══════════════════════════════════════════════════════════════════════════╝  │   shadow-md
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Mobile (360px) · estado `preparación`

```
┌──────────────────────────────┐
│ Propuestas         [+ Nueva] │
│                              │
│ [🔍 Buscar…             ⊗]   │
│ [Todas·24 ▾]                 │ ← filtros colapsados en select
│                              │
│ ☑ Refactor del login con O…  │
│   Votable · 8d         ···   │
│ ──────────────────────────── │
│ ☐ Centralizar documentación…│
│   Votable · 5d         ···   │
│ ──────────────────────────── │
│ ☑ Onboarding nuevo de ing…  │
│   Votable · 12d        ···   │
│                              │
│ ╔══════════════════════════╗ │ ← Sticky bottom
│ ║ 2 selec · [Excluir] [✕]  ║ │   acciones compactas
│ ╚══════════════════════════╝ │   menú "···" para Restaurar
└──────────────────────────────┘
```

Ahora los componentes:

_[tool: list_files]_

_[tool: update_todos]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: snip]_

_[tool: read_file]_

_[tool: snip]_

_[tool: str_replace_edit]_

_[tool: str_replace_edit]_

_[tool: str_replace_edit]_

_[tool: str_replace_edit]_

_[tool: str_replace_edit]_

_[tool: str_replace_edit]_

_[tool: read_file]_

_[tool: snip]_

_[tool: str_replace_edit]_

_[tool: update_todos]_

_[tool: read_file]_

_[tool: snip]_

_[tool: run_script]_

_[tool: update_todos]_

_[tool: done]_

_[tool: grep]_

_[tool: snip]_

_[tool: str_replace_edit]_

_[tool: grep]_

_[tool: snip]_

_[tool: done]_

_[tool: update_todos]_

_[tool: fork_verifier_agent]_

Listo. Resumen del entregable del panel de admin:

**Pantallas nuevas y rediseñadas** (en el canvas, sección Admin):
- **A1 · Dashboard** (`/admin`) — desktop + mobile 360 + variantes prep/abierto/cerrado. Zona A hero, Zona B métricas + próximos pasos contextuales, Zona C últimas acciones.
- **A2 · Participación** (`/admin/participation`) — desktop + mobile. Progreso X/Y con barra, lista paginada y nota de anonimato.
- **A3 · Propuestas** — desktop + mobile, con buscador y bulk bar sticky en estado *preparación*; checkboxes ocultos en abierto/cerrado.

**Componentes nuevos** (en `admin-dashboard.jsx`):
`AdminDashboard`, `MetricCard`, `ActionCardContextual` (matriz CTAs prep/abierto/cerrado), `RecentAuditList`, `ParticipationView`, `ProposalsSearchAndBulk`.

**Otros cambios**:
- Tab "Dashboard" + "Participación" añadidos al `AdminTopbar`.
- `App` enruta `admin-dashboard` y `admin-participation`; `admin-proposals` ahora usa la versión V2.
- `design-system.md` ampliado con la sección **12 · Componentes del Admin Dashboard** (composición, matriz CTAs, notas A11y).
- Tweaks existentes (estado del periodo) cambian el dashboard en vivo.

**Pendientes**:
- Sustituir valores raw cuando llegue la marca Phicus.
- Confirmar copy en es-ES de los CTAs.

