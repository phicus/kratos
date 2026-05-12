# Frontend — Kratos

React 18 + Vite 5 + TypeScript + Tailwind 3 + lucide-react. Diseño desde
`specs/001-voting-system/design-system.md`.

## Dev local

```bash
npm install
npm run dev        # arranca Vite en http://localhost:5173
```

Vite proxea `/api` y `/auth` a `http://localhost:8000` (backend). Los dos
servidores corren en paralelo durante desarrollo.

## Build de producción

```bash
npm run build      # genera dist/
```

El backend en producción sirve `dist/` desde `backend/src/kratos/static/`
(ver Dockerfile multi-stage).

## Tests

```bash
npm run test                    # unitarios / componente (Vitest)
npm run test:e2e                # E2E Playwright (requiere backend en ENV=test)
```

El test E2E (`tests/e2e/vote-golden-path.spec.ts`) recorre el flujo
**login → vote → already-voted** y documenta los pasos para preparar el
entorno en su cabecera.

## Layout

```text
src/
├── main.tsx
├── App.tsx                     # Router (react-router-dom 6)
├── styles/
│   ├── design-tokens.css       # Variables CSS (paleta, tipografía, etc.)
│   └── index.css               # Importa tokens + Tailwind
├── api/
│   ├── client.ts               # fetch wrapper con credentials:include
│   ├── endpoints.ts
│   └── types.ts
├── hooks/
│   ├── useMe.ts                # GET /api/me + cache
│   ├── usePeriod.ts
│   └── useRequireAdmin.ts
├── components/
│   ├── ui/                     # Button, Input, Card, Badge, Banner, Modal, Toast
│   ├── ScoreSelectorChips.tsx  # 10 chips, ARIA radiogroup
│   ├── ScoreSelectorSlider.tsx # Variante mobile <640px
│   ├── ScoreSelector.tsx       # Wrapper responsive
│   ├── ProposalCard.tsx
│   ├── PeriodBanner.tsx
│   ├── RankingRow.tsx
│   └── AppShell.tsx
└── pages/
    ├── Login.tsx
    ├── Vote.tsx                # Pantalla principal del votante
    ├── AlreadyVoted.tsx
    ├── PeriodNotOpen.tsx
    ├── PeriodClosed.tsx
    ├── Results.tsx
    ├── NotFound.tsx
    └── admin/
        ├── AdminShell.tsx
        ├── Period.tsx          # Open / Close / Reset
        ├── Proposals.tsx       # CRUD + filtros + import CSV
        ├── Merge.tsx           # Two-pane fusión
        └── AuditLog.tsx
```

## Design tokens

Los tokens semánticos viven en `src/styles/design-tokens.css`. Tailwind
los expone como clases (`bg-primary`, `text-fg-muted`, `rounded-card`,
`shadow-card`, `font-display`, etc.) configuradas en `tailwind.config.js`.

**Sustitución de marca**: cuando lleguen los assets oficiales de Phicus,
basta con cambiar la sección "Raw scale" en `design-tokens.css`. El resto
del sistema se actualiza solo.
