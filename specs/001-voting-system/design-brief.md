# Design Brief — Kratos

Este documento define qué necesitamos del sistema visual de la SPA y
contiene el **prompt listo para usar** en una sesión de Claude
(idealmente Claude con WebFetch/visión disponible) que analice
`web.phicus.es` y produzca el design system del proyecto.

## ¿Cuándo se usa este prompt?

**Ahora**, antes de ejecutar `/speckit-tasks`. La razón:

- Las tareas de frontend referenciarán componentes con clases Tailwind y
  variantes Radix que dependen del tema (paleta, tipografía, radios,
  sombras).
- Si el design system queda definido antes de generar `tasks.md`, las
  tareas podrán contener especificaciones visuales concretas en vez de
  "diseñar más tarde".

Si se ejecuta después, no hay drama: las tareas de UI se refinan con el
output del brief.

## Qué necesitamos como entregable

El output del prompt debe materializarse en estos artefactos dentro del
repo (Claude los puede escribir directamente o tú los puedes pegar):

1. `frontend/src/styles/design-tokens.css` — variables CSS de paleta,
   tipografía, radios, sombras, espaciado.
2. `frontend/tailwind.config.js` — extensión del tema con esos tokens.
3. `specs/001-voting-system/design-system.md` — documento legible:
   paleta con códigos hex y nombres semánticos, escala tipográfica,
   ejemplos de componentes (botones, inputs, score selector, banner de
   estado de periodo, ranking row), reglas de accesibilidad (contraste
   AA mínimo).
4. (Opcional) Mockups ASCII/Mermaid de las 10 pantallas, o referencias
   a Figma si se prefiere.

## Pantallas que el design system debe cubrir

Del `plan.md` (`frontend/src/pages/`):

1. **Login** — un único CTA "Entrar con Google".
2. **Vote** — listado de propuestas con un score selector 1-10 por
   propuesta, header con "X de N puntuadas", botón sticky "Enviar
   papeleta". Es la pantalla más importante (puede contener ~100
   propuestas, requiere buen escaneo visual).
3. **AlreadyVoted** — confirmación "Ya has votado".
4. **PeriodClosed** / **PeriodNotOpen** — estado neutro indicando que
   la votación no está activa.
5. **Results** — ranking tipo tabla, top-3 destacado, sumas y posición.
6. **Admin / Proposals** — gestión CRUD, filtros por estado
   (votable / excluded / merged_parent).
7. **Admin / Merge** — selección de propuestas a fusionar + formulario
   con nombre y descripción nuevos.
8. **Admin / Period** — controles open/close/reset con confirmación.
9. **Admin / AuditLog** — tabla cronológica del log administrativo.
10. **404 / Error genérico** — coherente con el resto.

## Restricciones técnicas (no son negociables)

- **Stack visual obligatorio**: Tailwind CSS 3 + Radix UI primitives +
  lucide-react. No proponer Chakra, MUI, Mantine ni similar.
- **Sin CSS-in-JS**: nada de styled-components, emotion, vanilla-extract.
- **Accesibilidad**: contraste AA mínimo (4.5:1 texto normal, 3:1 texto
  grande); foco visible siempre; navegación por teclado en todos los
  componentes interactivos; ARIA correcto en el score selector.
- **Idioma**: la UI es en **español (es-ES)**, las copys deben respirar
  cultura interna de empresa (cercano, claro, sin marketing-speak).
- **Modo único**: sólo light mode en el MVP (sin dark mode).
- **Mobile responsive**: la pantalla **Vote** debe ser perfectamente
  usable en móvil (es el principal uso esperado).

---

## Prompt para Claude

Copia/pega este bloque completo en una nueva sesión de Claude (en
[claude.ai](https://claude.ai) o vía Claude Code con WebFetch
disponible). El prompt es autocontenido: incluye contexto, restricciones
y entregables.

````markdown
Eres un diseñador de producto senior. Tu trabajo es **crear el sistema
visual completo** de una webapp interna de Phicus llamada "Sistema de
Votación Phicus".

## Paso 1 — Analizar la identidad visual de Phicus

Visita y analiza la web corporativa de la empresa:

- URL principal: https://web.phicus.es
- Si tiene subpáginas relevantes (sobre nosotros, servicios, blog),
  visítalas también para captar el tono completo.

Extrae:

1. **Paleta de colores** — colores primarios, secundarios, neutros
   (incluyendo códigos hex exactos cuando puedas leerlos del CSS o de
   inspección visual).
2. **Tipografía** — qué fuentes usan en titulares y cuerpo (nombre
   exacto y fallbacks). Si son fuentes propietarias o no disponibles
   en Google Fonts, proponme una alternativa visualmente equivalente.
3. **Tono / personalidad** — corporativo, técnico, cercano, juvenil,
   minimalista, expresivo. Una frase descriptiva.
4. **Patrones de layout** — densidad, uso del espacio, cómo
   estructuran tarjetas, listas, navegación. Cualquier elemento
   distintivo (formas, iconografía, fotografía vs ilustración).
5. **Detalles** — radios de borde, sombras, gradientes, animaciones
   notables.

Resume todo lo anterior en una sección "Análisis de marca Phicus" antes
de pasar al paso 2.

## Paso 2 — Producir el design system

Sobre la base de ese análisis, genera el sistema visual de la SPA
respetando las siguientes restricciones técnicas (NO negociables):

- Stack: **Tailwind CSS 3 + Radix UI primitives + lucide-react**.
- Nada de CSS-in-JS, nada de Material UI / Chakra / Mantine.
- Idioma de la UI: **español (es-ES)**.
- Sólo light mode (no dark mode en el MVP).
- Accesibilidad AA mínimo (contraste 4.5:1 cuerpo, 3:1 texto grande;
  foco visible; navegación por teclado completa).
- Mobile-first: la pantalla "Vote" debe ser perfectamente usable en
  un móvil de 360px de ancho.

Entrega los siguientes archivos, cada uno en su propio bloque de código
con el path como título:

### 2.1 `frontend/src/styles/design-tokens.css`

Variables CSS bajo `:root` con la paleta y la escala tipográfica
extraídas. Nombres semánticos (`--color-primary`, `--color-surface`,
`--color-success`, `--color-danger`, etc.), no nombres literales
(`--azul-phicus`).

### 2.2 `frontend/tailwind.config.js`

Extiende el `theme` para que las clases `bg-primary`, `text-muted`,
`rounded-card`, `shadow-card`, `font-display`, `font-body` funcionen
con esos tokens. Incluye `content: ['./src/**/*.{ts,tsx,html}']` y los
plugins esenciales (`@tailwindcss/forms`).

### 2.3 `specs/001-voting-system/design-system.md`

Documento legible que contenga:

- **Paleta**: tabla con `Token | Hex | Uso` para todos los colores.
- **Tipografía**: tabla con `Token | Familia | Tamaños | Pesos | Uso`.
- **Espaciado/Radios/Sombras**: tablas equivalentes.
- **Componentes clave** (con código Tailwind + JSX de ejemplo):
  - Botón primario, secundario, peligro.
  - Input de texto y textarea.
  - **Score Selector 1-10** — el componente más importante. Diseña
    una variante en escala horizontal para desktop (botones tap-target
    ≥ 32px) y otra colapsable o de slider para móvil. ARIA correcto
    (`role="radiogroup"`, `aria-label`).
  - Banner de estado del periodo (3 variantes: preparación, abierto,
    cerrado) — visualmente distinto a primera vista.
  - Card de propuesta para la pantalla de voto: muestra nombre,
    descripción, "cómo" (colapsable), estimación, y el score selector.
  - Fila de ranking: posición, nombre, suma, barra de progreso
    relativa al máximo.
  - Tag/Badge para estado de propuesta (votable / excluida / padre).

### 2.4 Mockups ASCII o descripciones de pantalla

Para cada una de estas 10 pantallas, dame:

1. Login
2. Vote (la importante; describe layout en desktop **y** en móvil)
3. AlreadyVoted
4. PeriodNotOpen / PeriodClosed
5. Results (ranking)
6. Admin / Proposals (listado CRUD)
7. Admin / Merge
8. Admin / Period (controles open/close/reset)
9. Admin / AuditLog
10. 404 / Error genérico

Cada pantalla: un mockup ASCII o Mermaid + 3-5 líneas describiendo el
flujo y las copys principales (en español de España).

## Paso 3 — Validación contra principios

Antes de cerrar, revisa que tu propuesta:

- No introduce dependencias fuera del stack permitido.
- Cumple AA de accesibilidad (justifica brevemente los contrastes
  críticos).
- La pantalla **Vote** funciona en 360px de ancho sin scroll horizontal
  y sin que el score selector se desborde.
- El tono de las copys es coherente con la voz de marca extraída en el
  paso 1.

## Contexto adicional sobre el producto

- Empresa: **Phicus** (consultora/operador tecnológico español, dominio
  `phicus.es`).
- Producto: votación interna anónima donde empleados puntúan
  propuestas de mejora de 1 a 10. Voto único, periodo controlado por
  dos administradores.
- Volumen: ≤ 500 votantes, ≤ 200 propuestas.
- La votación tiene un toque desenfadado internamente — un round del
  proceso se llamó "Pelea de gallos, Round 1". El tono puede ser un
  poco juguetón sin perder profesionalismo.
- Audiencia: ingenieros y personal interno; no es marketing-facing.

Empieza por el Paso 1 y procede en orden.
````

---

## Después de recibir el output

1. Pega los archivos `design-tokens.css`, `tailwind.config.js` y
   `design-system.md` en sus rutas.
2. Revisa el análisis de marca: ¿la paleta y tipografía coinciden con
   lo que tú esperabas? Si no, itera con un follow-up al mismo Claude.
3. Avísame y ejecutamos `/speckit-tasks`; las tareas de UI ya podrán
   referenciar componentes del design system.

## Fallback si web.phicus.es no es accesible

Si la web está caída o la sesión de Claude no puede hacer fetch, dale
en su lugar:

- 2-3 capturas de la web (logo, una landing, una sección de servicios).
- O un brief textual de la marca (colores principales en hex,
  tipografía, descripción del tono).

El resto del prompt funciona igual sin el paso 1 automático.
