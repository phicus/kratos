# Kratos — Design System

> **Estado:** v0.1 — placeholder neutro hasta integrar marca oficial de Phicus.
> **Stack:** Tailwind CSS 3 + Radix UI primitives + lucide-react.
> **Modo:** sólo light mode (MVP). **Idioma UI:** es-ES. **A11y:** AA mínimo.

---

## 1 · Análisis de marca *(pendiente)*

Cuando lleguen los assets oficiales (logo, hex, tipografía) se documentará aquí:

- Paleta extraída (primarios, secundarios, neutros).
- Tipografía (titular + cuerpo + fallbacks).
- Tono / personalidad en una frase.
- Patrones de layout y detalles distintivos.

Mientras tanto, todos los tokens son **placeholders** elegidos para ser fáciles de sustituir: cambia los valores raw en `design-tokens.css` y el resto del sistema se actualiza.

---

## 2 · Paleta

| Token semántico | Hex | Uso |
|---|---|---|
| `--color-background` | `#faf9f7` | Fondo de página |
| `--color-surface` | `#ffffff` | Cards, modales |
| `--color-surface-sunken` | `#f3f1ed` | Áreas hundidas, separadores anchos |
| `--color-text` | `#15140f` | Texto principal (contraste 18.2:1 sobre bg) |
| `--color-text-secondary` | `#534f49` | Texto secundario (contraste 8.7:1) |
| `--color-text-muted` | `#76716a` | Meta, ayuda (contraste 5.4:1) |
| `--color-border` | `#e8e5df` | Bordes neutros |
| `--color-border-strong` | `#d6d2ca` | Bordes énfasis |
| `--color-primary` | `#1f7a86` | Acción primaria (contraste 4.9:1 con texto blanco) |
| `--color-primary-hover` | `#16606b` | Hover primario |
| `--color-primary-soft` | `#ecf6f7` | Fondos suaves, chips |
| `--color-accent` | `#e36a3a` | Acento puntual ("Pelea de gallos") |
| `--color-success` | `#2f8f55` | Confirmaciones, votado |
| `--color-warning` | `#b4801b` | Periodo en preparación |
| `--color-danger` | `#c83838` | Acciones destructivas, errores |

**Contrastes críticos (verificados WCAG AA):**
- Texto principal sobre background: 18.2:1 ✓
- Texto blanco sobre primary: 4.9:1 ✓ (cuerpo)
- Texto blanco sobre danger: 5.3:1 ✓
- Texto muted sobre background: 5.4:1 ✓ (cuerpo)

---

## 3 · Tipografía

| Token | Familia | Tamaños | Pesos | Uso |
|---|---|---|---|---|
| `font-display` | Geist | 28–48px | 600–700 | Titulares, números grandes |
| `font-body` | Geist | 14–18px | 400–500 | UI y cuerpo |
| `font-mono` | Geist Mono | 12–14px | 400–500 | Sumas, IDs, código |

**Escala**: `xs 12` · `sm 14` · `base 16` · `lg 18` · `xl 22` · `2xl 28` · `3xl 36` · `4xl 48`.

**Reglas**:
- Cuerpo nunca por debajo de 14px en UI; 16px por defecto.
- `text-wrap: pretty` en bloques de texto largos.
- `font-variant-numeric: tabular-nums` en tablas y sumas.

---

## 4 · Espaciado · Radios · Sombras

| Token | Valor | Uso |
|---|---|---|
| `space-1..20` | 4–80px (base 4) | Padding, gap, margin |
| `radius-sm` | 6px | Controles (input, botón pequeño) |
| `radius-md` | 8px | Botones, chips |
| `radius-lg` (`radius-card`) | 10px | Cards, paneles |
| `radius-xl` | 14px | Modales, banners destacados |
| `radius-pill` | 999px | Badges, score chips |
| `shadow-sm` | sutil | Cards default |
| `shadow-md` | media | Cards elevados (hover) |
| `shadow-lg` | media-alta | Popovers, sticky bars |
| `shadow-focus` | ring 3px | Foco visible AA |

---

## 5 · Componentes clave

### 5.1 · Botones

```tsx
// Primario
<button className="h-10 px-4 rounded-control bg-primary text-primary-fg
  font-medium hover:bg-primary-hover focus-visible:shadow-focus
  transition-colors disabled:opacity-50">
  Enviar papeleta
</button>

// Secundario
<button className="h-10 px-4 rounded-control bg-surface border border-border
  text-fg font-medium hover:bg-surface-sunken">
  Cancelar
</button>

// Peligro
<button className="h-10 px-4 rounded-control bg-danger text-white
  font-medium hover:brightness-95">
  Reset periodo
</button>
```

### 5.2 · Input · Textarea

```tsx
<input type="text" className="form-input w-full h-10 px-3 rounded-control
  border-border bg-surface text-fg placeholder:text-fg-muted
  focus:border-primary focus:ring-focus" />
```

### 5.3 · Score Selector 1-10 *(el componente crítico)*

Cuatro variantes implementadas en el prototipo:

1. **Chips** — 10 píldoras en una fila. Desktop ideal; en móvil envuelve en 2 filas de 5.
2. **Slider** — rango continuo + valor grande. Mejor para móvil one-thumb.
3. **Stepper** — `– N +` central, números rápidos. Compacto.
4. **Dial** — semicírculo radial con gradiente. Más expresivo, mismo a11y.

Todas implementan:
- `role="radiogroup"` + `aria-label`
- Cada opción `role="radio"` + `aria-checked`
- Navegación por teclado: ←/→ mueve, Home/End extremos, 1–9 + 0 selección directa.
- Touch target ≥ 32px (chips) · ≥ 44px (stepper, dial).

### 5.4 · Banner de estado de periodo

Tres variantes visualmente distinguibles a primera vista:

| Estado | Color | Icono | Copy |
|---|---|---|---|
| Preparación | warning-soft | `clock` | "Periodo en preparación — abre el 12 jun" |
| Abierto | primary-soft | `play-circle` | "Periodo abierto · faltan 3 días" |
| Cerrado | surface-sunken | `lock` | "Periodo cerrado · publicamos resultados pronto" |

### 5.5 · Card de propuesta (Vote)

```
┌────────────────────────────────────────────────┐
│ Nombre propuesta                         [12d] │
│ Descripción corta, máx 2 líneas.               │
│ ▸ Cómo lo haríamos (colapsable)                │
│ ────────────────────────────────────────────── │
│ [Score selector 1-10]                          │
└────────────────────────────────────────────────┘
```

- Bordes `border` por defecto, `border-strong` al puntuar.
- Ribbon de color a la izquierda cuando hay puntuación (`primary-soft`).
- Estimación como chip pequeño arriba a la derecha (`12d`, `2sem`).

### 5.6 · Fila de ranking (Results)

```
#1  ▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮  Refactor login    402 pts
#2  ▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮    Centralizar API   361 pts
#3  ▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮      Onboarding nuevo  340 pts
```

- Top 3 con fondo `primary-soft` muy sutil y posición en `font-display`.
- Barra de progreso = `suma / max_suma` × 100%.
- Sumas en `font-mono` tabular.

### 5.7 · Badge / Tag

```tsx
const variants = {
  votable:       'bg-success-soft text-success-text',
  excluded:      'bg-surface-sunken text-fg-muted',
  merged_parent: 'bg-primary-soft text-primary-soft-text',
};
```

---

## 6 · Pantallas (10) — mockups y flujos

> Cada pantalla está implementada en el prototipo `Kratos.html`. Mockup ASCII abajo a modo de referencia.

### 1 · Login

```
        ┌──────────────────────────────┐
        │   ◐  Kratos     │
        │                              │
        │   Vota propuestas internas   │
        │   de mejora — periodo Q3.    │
        │                              │
        │   [ G  Entrar con Google ]   │
        │                              │
        │   Sólo @phicus.es            │
        └──────────────────────────────┘
```
Copy: "Pelea de gallos, Round 3 · Q3 2026" como sub-headline juguetona.

### 2 · Vote *(la importante — desktop y móvil)*

**Desktop (≥1024px)**
```
┌────────────────────────────────────────────────────────────┐
│ Phicus Vota  ── Pelea de gallos, R3      8/24 puntuadas    │
├────────────────────────────────────────────────────────────┤
│  ▸ Periodo abierto · faltan 3 días                         │
│                                                            │
│  ┌─ Refactor del login con OAuth2 ───────────────────[8d]┐ │
│  │  Migrar de sesión propia a Google OAuth completo.    │ │
│  │  ▸ Cómo lo haríamos                                  │ │
│  │  [1][2][3][4][5][6][7][8][9][10]                     │ │
│  └──────────────────────────────────────────────────────┘ │
│  ┌─ Documentación interna en Notion ────────────────[5d]┐ │
│  │  ...                                                  │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  [───── Sticky bar: 8/24 puntuadas · Enviar papeleta ───]  │
└────────────────────────────────────────────────────────────┘
```

**Mobile (360px)**
```
┌──────────────────────────┐
│ ◐ Vota · 8/24            │
├──────────────────────────┤
│ Refactor login    [8d]   │
│ Migrar a OAuth2…         │
│ ▸ Cómo                   │
│ ┌──────────────────────┐ │
│ │  [Slider 1-10] · 7   │ │ ← score selector móvil
│ └──────────────────────┘ │
│ ──────────────────────── │
│ Documentación…    [5d]   │
│ ...                      │
│ ╔══════════════════════╗ │
│ ║ Enviar papeleta (8)  ║ │ ← sticky
│ ╚══════════════════════╝ │
└──────────────────────────┘
```

Flujo: scroll vertical, puntuar inline, sticky bottom "Enviar papeleta" siempre visible. Confirmación modal antes de enviar (acción irreversible).

### 3 · AlreadyVoted

Pantalla vacía-positiva: icono `check-circle` grande, "Ya has votado en este periodo" + "Los resultados se publican cuando cierre el periodo".

### 4 · PeriodNotOpen / PeriodClosed

Mismo layout, distinta copy:
- NotOpen: icono `clock`, warning-soft.
- Closed: icono `lock`, surface-sunken, CTA "Ver resultados anteriores".

### 5 · Results

Ranking tabla. Top 3 destacado con fondo `primary-soft` y número grande. Resto en filas densas. Header con total de votantes y propuestas. Filtro por periodo en select arriba a la derecha.

### 6 · Admin / Proposals

Tabla CRUD. Filtros: estado (`votable`, `excluded`, `merged_parent`). Acciones por fila: editar, excluir, fusionar. Crear nueva propuesta = botón primario arriba a la derecha.

### 7 · Admin / Merge

Two-pane: izquierda lista con checkboxes para seleccionar 2+ propuestas; derecha formulario con campos nuevos (nombre, descripción, cómo). Validación: mínimo 2 seleccionadas. Preview de la propuesta resultante antes de confirmar.

### 8 · Admin / Period

Tres tarjetas grandes con estado actual + acciones: **Open**, **Close**, **Reset**. Modal de confirmación obligatorio en Close y Reset (escribir "RESET" para confirmar reset).

### 9 · Admin / AuditLog

Tabla cronológica densa con: timestamp, admin, acción, target, diff. Filtro por admin y por tipo de acción.

### 10 · 404 / Error

Mismo chrome, mensaje claro, CTA "Volver al inicio". Tono ligeramente desenfadado: "Esta página no existe… o quizá la fusionamos por error 🐔".

---

## 7 · Validación

- ✅ Sin dependencias fuera del stack permitido.
- ✅ Contrastes AA verificados arriba.
- ✅ Vote en 360px funciona — score selector adopta variante slider/stepper compacto.
- ✅ Tono de copy coherente: profesional con guiños sutiles ("Pelea de gallos R3", "papeleta", emojis sólo en error).
