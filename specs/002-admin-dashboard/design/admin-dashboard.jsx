// admin-dashboard.jsx — Componentes del panel de administración
// Respeta tokens existentes; NO introduce nuevos tokens semánticos.
// Componentes exportados:
//   AdminDashboard, MetricCard, ActionCardContextual, RecentAuditList,
//   ParticipationView, ProposalsSearchAndBulk

// ──────────────────────────────────────────────────────────────────────────
// CSS local — sólo combinaciones de tokens existentes
// ──────────────────────────────────────────────────────────────────────────
const ADMIN_STYLE = `
/* Zona A · Hero del estado del periodo */
.adm-hero {
  border-radius: var(--radius-xl);
  padding: var(--space-6) var(--space-8);
  display: grid; grid-template-columns: 64px 1fr auto;
  gap: var(--space-5); align-items: center;
}
.app--mobile .adm-hero {
  grid-template-columns: 48px 1fr;
  padding: var(--space-5);
  row-gap: var(--space-4);
}
.adm-hero-icon {
  width: 64px; height: 64px; border-radius: 50%;
  display: grid; place-items: center; flex-shrink: 0;
}
.app--mobile .adm-hero-icon { width: 48px; height: 48px; }
.adm-hero-title { font-family: var(--font-display); font-size: var(--text-2xl);
  font-weight: 700; letter-spacing: var(--tracking-tight); line-height: 1.1;
  margin: 0 0 4px; }
.adm-hero-sub { color: inherit; opacity: 0.78; font-size: var(--text-sm); }
.adm-hero-quote { margin-top: 10px; font-size: var(--text-base); font-weight: 500;
  text-wrap: pretty; }
.adm-hero-tag {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 3px 10px; border-radius: var(--radius-pill);
  background: rgba(255,255,255,0.65); font-size: var(--text-xs);
  font-weight: 600; letter-spacing: 0.04em;
  font-family: var(--font-mono);
}
.adm-hero--preparing { background: var(--color-warning-soft); color: var(--color-warning-text); }
.adm-hero--preparing .adm-hero-icon { background: var(--color-warning); color: white; }
.adm-hero--open      { background: var(--color-primary-soft); color: var(--color-primary-soft-text); }
.adm-hero--open .adm-hero-icon { background: var(--color-primary); color: white; }
.adm-hero--closed    { background: var(--color-surface-sunken); color: var(--color-text-secondary); }
.adm-hero--closed .adm-hero-icon { background: var(--color-text-secondary); color: white; }
.app--mobile .adm-hero-cta { grid-column: 1 / -1; }

/* Zona B · Metric cards */
.adm-metrics {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--space-3);
  margin-top: var(--space-5);
}
.app--mobile .adm-metrics { grid-template-columns: repeat(2, 1fr); }
.adm-metric {
  appearance: none; text-align: left;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  padding: var(--space-4) var(--space-5);
  position: relative;
  cursor: pointer;
  transition: border-color var(--duration-fast) var(--ease-out),
              box-shadow var(--duration-fast) var(--ease-out),
              transform var(--duration-fast) var(--ease-out);
  font: inherit; color: inherit;
  display: flex; flex-direction: column; gap: 6px;
}
.adm-metric:hover {
  border-color: var(--color-border-strong);
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}
.adm-metric:focus-visible {
  outline: none;
  box-shadow: var(--shadow-focus);
  border-color: var(--color-primary);
}
.adm-metric-icon {
  position: absolute; top: 14px; right: 14px;
  width: 28px; height: 28px; border-radius: 6px;
  background: var(--color-primary-soft); color: var(--color-primary);
  display: grid; place-items: center;
}
.adm-metric-num {
  font-family: var(--font-display);
  font-size: 32px; font-weight: 700; line-height: 1;
  letter-spacing: -0.02em;
  color: var(--color-text);
  font-variant-numeric: tabular-nums;
}
.adm-metric-label {
  font-size: var(--text-sm); font-weight: 500;
  color: var(--color-text-secondary);
}
.adm-metric-sub {
  font-size: 11px; color: var(--color-text-muted);
  font-variant-numeric: tabular-nums; margin-top: 2px;
}

/* Zona B · Caja "Próximos pasos" */
.adm-actions {
  margin-top: var(--space-5);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  padding: var(--space-5);
}
.adm-actions-head {
  display: flex; align-items: center; gap: 8px;
  font-size: var(--text-xs); font-weight: 600;
  text-transform: uppercase; letter-spacing: 0.06em;
  color: var(--color-text-muted);
  margin-bottom: var(--space-3);
}
.adm-actions-row {
  display: flex; flex-wrap: wrap; gap: var(--space-2);
}
.app--mobile .adm-actions-row { flex-direction: column; }
.app--mobile .adm-actions-row .btn { width: 100%; }

/* Zona C · Audit list (compact) */
.adm-audit-head {
  display: flex; align-items: baseline; justify-content: space-between;
  margin: var(--space-8) 0 var(--space-3);
}
.adm-audit-link {
  font-size: var(--text-sm); font-weight: 500; color: var(--color-primary);
  text-decoration: none;
}
.adm-audit-link:hover { text-decoration: underline; }
.adm-audit {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  overflow: hidden;
}
.adm-audit-row {
  display: grid; grid-template-columns: 110px 130px 1fr auto;
  align-items: center; gap: var(--space-4);
  padding: var(--space-3) var(--space-4);
  font-size: var(--text-sm);
  border-bottom: 1px solid var(--color-border);
}
.adm-audit-row:last-child { border-bottom: 0; }
.adm-audit-row:hover { background: var(--color-surface-sunken); }
.adm-audit-ts {
  font-family: var(--font-mono); font-size: 12px;
  color: var(--color-text-muted); font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.adm-audit-admin {
  font-family: var(--font-mono); font-size: 12px;
  color: var(--color-text-secondary);
}
.adm-audit-target {
  color: var(--color-text); font-weight: 500;
}
.adm-audit-ids {
  font-family: var(--font-mono); font-size: 12px;
  color: var(--color-text-muted); white-space: nowrap;
}
.app--mobile .adm-audit-row {
  grid-template-columns: 1fr;
  gap: 4px; padding: var(--space-3) var(--space-4);
}

/* Participación */
.part-progress-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  padding: var(--space-6);
}
.part-progress-num {
  font-family: var(--font-display);
  font-size: 48px; font-weight: 700; line-height: 1;
  letter-spacing: -0.03em;
  font-variant-numeric: tabular-nums;
  color: var(--color-text);
}
.part-progress-num small {
  font-size: 22px; color: var(--color-text-muted);
  font-weight: 600; letter-spacing: -0.02em; margin-left: 6px;
}
.part-progress-bar {
  position: relative; height: 12px; margin-top: var(--space-4);
  background: var(--color-surface-sunken);
  border-radius: 999px; overflow: hidden;
}
.part-progress-bar > i {
  display: block; height: 100%;
  background: var(--color-primary);
  border-radius: 999px;
  transition: width 320ms cubic-bezier(.22,1,.36,1);
}
.part-progress-pct {
  position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
  font-family: var(--font-mono); font-size: 11px; font-weight: 500;
  color: white; mix-blend-mode: difference; pointer-events: none;
  font-variant-numeric: tabular-nums;
}
.part-progress-sub {
  margin-top: var(--space-3); color: var(--color-text-secondary);
  font-size: var(--text-sm);
}
.part-quorum-row {
  display: flex; align-items: center; gap: var(--space-3);
  margin-top: var(--space-4); padding-top: var(--space-4);
  border-top: 1px dashed var(--color-border);
}
.part-quorum-row label { font-size: var(--text-sm); color: var(--color-text-secondary); white-space: nowrap; }
.part-voters-list {
  margin-top: var(--space-5);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  overflow: hidden;
}
.part-voters-head {
  display: grid; grid-template-columns: 1fr 150px;
  padding: var(--space-3) var(--space-4);
  background: var(--color-surface-sunken);
  font-size: var(--text-xs); font-weight: 500;
  text-transform: uppercase; letter-spacing: 0.04em;
  color: var(--color-text-muted);
  border-bottom: 1px solid var(--color-border);
}
.part-voter {
  display: grid; grid-template-columns: 1fr 150px;
  padding: var(--space-3) var(--space-4);
  font-size: var(--text-sm);
  border-bottom: 1px solid var(--color-border);
  align-items: center;
}
.part-voter:last-child { border-bottom: 0; }
.part-voter:hover { background: var(--color-surface-sunken); }
.part-voter-when {
  font-family: var(--font-mono); font-size: 12px;
  color: var(--color-text-secondary); font-variant-numeric: tabular-nums;
  text-align: right;
}
.part-pagination {
  display: flex; align-items: center; justify-content: space-between;
  padding: var(--space-3) var(--space-4);
  background: var(--color-surface-sunken);
  font-size: var(--text-sm); color: var(--color-text-secondary);
  border-top: 1px solid var(--color-border);
}
.part-privacy {
  margin-top: var(--space-4); padding: var(--space-3) var(--space-4);
  font-size: var(--text-sm); font-style: italic;
  color: var(--color-text-muted);
  display: flex; align-items: center; gap: 8px;
}

/* Proposals search + bulk */
.prop-search {
  position: relative; flex: 1 1 240px;
  display: flex; align-items: center;
}
.prop-search > .prop-search-icon {
  position: absolute; left: 12px; color: var(--color-text-muted);
  pointer-events: none;
}
.prop-search > input {
  width: 100%; padding-left: 36px; padding-right: 36px;
}
.prop-search > .prop-search-clear {
  position: absolute; right: 8px;
  background: none; border: 0; cursor: pointer; padding: 4px;
  color: var(--color-text-muted); border-radius: 4px;
  display: grid; place-items: center;
}
.prop-search > .prop-search-clear:hover {
  background: var(--color-surface-sunken); color: var(--color-text);
}
.prop-row-check { width: 24px; height: 24px; display: grid; place-items: center; }
.prop-row-check input {
  width: 16px; height: 16px;
  accent-color: var(--color-primary);
  cursor: pointer;
}
.prop-row-check input:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px; border-radius: 3px;
}

.bulk-bar {
  position: absolute; left: 50%; bottom: 16px;
  transform: translateX(-50%);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-pill);
  box-shadow: var(--shadow-lg);
  padding: 6px 6px 6px 16px;
  display: flex; align-items: center; gap: var(--space-3);
  z-index: 4;
  font-size: var(--text-sm);
  animation: bulk-rise 220ms cubic-bezier(.22,1,.36,1);
}
@keyframes bulk-rise { from { opacity: 0; transform: translate(-50%, 8px); } }
.bulk-bar b { font-weight: 600; }
.app--mobile .bulk-bar {
  left: 8px; right: 8px; bottom: 8px; transform: none;
  border-radius: var(--radius-xl);
  padding: var(--space-3);
  justify-content: space-between;
}
@keyframes bulk-rise-mobile { from { opacity: 0; transform: translateY(8px); } }
.app--mobile .bulk-bar { animation: bulk-rise-mobile 220ms cubic-bezier(.22,1,.36,1); }
`;

function injectAdminStyle() {
  if (document.getElementById('__adm_style')) return;
  const s = document.createElement('style');
  s.id = '__adm_style';
  s.textContent = ADMIN_STYLE;
  document.head.appendChild(s);
}

// Sub-icons (lucide en línea para no inventar peso extra)
const IconClipboardList = (p) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={p.size||16} height={p.size||16}
       viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
       strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect width="8" height="4" x="8" y="2" rx="1" ry="1"/>
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
    <path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/>
  </svg>
);
const IconEyeOff = (p) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={p.size||16} height={p.size||16}
       viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
       strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m15 18-.722-3.25"/><path d="M2 8a10.645 10.645 0 0 0 20 0"/>
    <path d="m20 15-1.726-2.05"/><path d="m4 15 1.726-2.05"/><path d="m9 18 .722-3.25"/>
  </svg>
);
const IconVote = (p) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={p.size||16} height={p.size||16}
       viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
       strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m9 12 2 2 4-4"/>
    <path d="M5 7c0-1.1.9-2 2-2h10a2 2 0 0 1 2 2v12H5V7Z"/>
    <path d="M22 19H2"/>
  </svg>
);
const IconDownload = (p) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={p.size||16} height={p.size||16}
       viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
       strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>
  </svg>
);
const IconUpload = (p) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={p.size||16} height={p.size||16}
       viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
       strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/>
  </svg>
);
const IconXCircle = (p) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={p.size||16} height={p.size||16}
       viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
       strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/>
  </svg>
);

// ──────────────────────────────────────────────────────────────────────────
// MetricCard
//  - número grande en font-display, label, icono pequeño arriba derecha
//  - tabIndex=0 + role=button → accesible y enfocable por teclado
// ──────────────────────────────────────────────────────────────────────────
function MetricCard({ counter, label, sub, icon: Icon, onClick }) {
  return (
    <button type="button" className="adm-metric" onClick={onClick}>
      <span className="adm-metric-icon" aria-hidden="true">
        {Icon ? <Icon size={14} /> : null}
      </span>
      <span className="adm-metric-num">{counter}</span>
      <span className="adm-metric-label">{label}</span>
      {sub && <span className="adm-metric-sub">{sub}</span>}
    </button>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// ActionCardContextual — CTAs según matriz state → acciones
// ──────────────────────────────────────────────────────────────────────────
const CTA_MATRIX = {
  preparing: [
    { id: 'import',  label: 'Importar CSV',         icon: IconUpload, variant: 'primary' },
    { id: 'create',  label: 'Crear propuesta',      icon: IconPlus,   variant: 'secondary' },
    { id: 'merge',   label: 'Fusionar duplicadas',  icon: IconMerge,  variant: 'secondary' },
    { id: 'open',    label: 'Abrir votación',       icon: IconPlay,   variant: 'secondary' },
  ],
  open: [
    { id: 'part',    label: 'Ver participación',    icon: IconUsers,  variant: 'primary' },
    { id: 'close',   label: 'Cerrar votación',      icon: IconLock,   variant: 'secondary' },
    { id: 'audit',   label: 'Ver auditoría',        icon: IconList,   variant: 'ghost' },
  ],
  closed: [
    { id: 'csv',     label: 'Descargar resultados', icon: IconDownload, variant: 'primary' },
    { id: 'ranking', label: 'Ver ranking',          icon: IconTrophy,   variant: 'secondary' },
    { id: 'reset',   label: 'Reiniciar votación',   icon: IconRefresh,  variant: 'danger' },
    { id: 'audit',   label: 'Ver auditoría',        icon: IconList,     variant: 'ghost' },
  ],
};

function ActionCardContextual({ state, onAction }) {
  const items = CTA_MATRIX[state] || CTA_MATRIX.open;
  return (
    <div className="adm-actions" aria-labelledby="adm-actions-h">
      <div className="adm-actions-head" id="adm-actions-h">
        <IconSparkles size={12} />
        <span>Próximos pasos</span>
      </div>
      <div className="adm-actions-row">
        {items.map((it) => {
          const Ico = it.icon;
          return (
            <button key={it.id}
                    className={`btn btn--${it.variant}`}
                    onClick={() => onAction && onAction(it.id)}>
              <Ico size={16} />
              <span>{it.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// RecentAuditList — últimas 5 entradas, link a ver todas
// ──────────────────────────────────────────────────────────────────────────
function actionToBadge(action) {
  if (/abierto|abrir/i.test(action))   return { cls: 'badge--success', label: action };
  if (/cerrad|cerrar/i.test(action))   return { cls: '',               label: action };
  if (/excluid/i.test(action))         return { cls: 'badge--danger',  label: action };
  if (/fus/i.test(action))             return { cls: 'badge--primary', label: action };
  if (/creada|edit/i.test(action))     return { cls: 'badge--success', label: action };
  return { cls: '', label: action };
}

function RecentAuditList({ entries, onSeeAll }) {
  const five = entries.slice(0, 5);
  return (
    <>
      <div className="adm-audit-head">
        <h3 className="h3">Últimas acciones</h3>
        <a className="adm-audit-link" href="#"
           onClick={(e) => { e.preventDefault(); onSeeAll && onSeeAll(); }}>
          Ver log completo →
        </a>
      </div>
      <ul className="adm-audit" role="list">
        {five.map((row, i) => {
          const b = actionToBadge(row.action);
          // Extract ids from "target" — heurística simple
          const idMatch = (row.diff || row.target || '').match(/\bp\d+(?:[,→\s\d-]*)/i);
          const idsHint = idMatch ? idMatch[0].trim() : (row.target || '').slice(0, 22);
          return (
            <li key={i} className="adm-audit-row" role="listitem">
              <span className="adm-audit-ts">{row.ts.replace(/^\d{4}-/, '').replace('-', '/')}</span>
              <span className={`badge ${b.cls}`}>{b.label}</span>
              <span><span className="adm-audit-admin">{row.admin}</span></span>
              <span className="adm-audit-ids">{idsHint}</span>
            </li>
          );
        })}
      </ul>
    </>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// ParticipationView
//   props: voters (array), quorum (number | null), onQuorum (fn)
// ──────────────────────────────────────────────────────────────────────────
function ParticipationView({ voters, quorum, onQuorum, mobile }) {
  const [page, setPage] = React.useState(1);
  const [draftQuorum, setDraftQuorum] = React.useState(quorum || 48);
  const perPage = 50;
  const x = voters.length;
  const y = quorum || 0;
  const pct = y > 0 ? Math.min(100, Math.round((x / y) * 100)) : 0;
  const pages = Math.max(1, Math.ceil(x / perPage));
  const start = (page - 1) * perPage;
  const pageItems = voters.slice(start, start + perPage);

  return (
    <div>
      {/* Tarjeta de progreso */}
      <div className="part-progress-card">
        {y > 0 ? (
          <>
            <div className="part-progress-num">
              {x}<small>/ {y} papeletas</small>
            </div>
            <div className="part-progress-bar" role="progressbar"
                 aria-valuenow={x} aria-valuemin={0} aria-valuemax={y}
                 aria-label={`${x} de ${y} papeletas emitidas`}>
              <i style={{ width: pct + '%' }} />
              <span className="part-progress-pct">{pct}%</span>
            </div>
            <p className="part-progress-sub">
              {y - x === 0
                ? '¡Todas las personas han votado!'
                : <><b style={{ color: 'var(--color-text)' }}>{y - x}</b> personas todavía no han votado.</>}
            </p>
            <div className="part-quorum-row">
              <label htmlFor="quorum-edit">Aforo esperado:</label>
              <input id="quorum-edit" type="number" className="input"
                     style={{ width: 100 }} value={draftQuorum}
                     onChange={(e) => setDraftQuorum(Number(e.target.value))} />
              <button className="btn btn--secondary btn--sm"
                      onClick={() => onQuorum && onQuorum(draftQuorum)}>
                Guardar
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="part-progress-num">
              {x}<small> papeletas emitidas</small>
            </div>
            <div className="part-quorum-row" style={{ marginTop: 16, borderTop: 'none', paddingTop: 0 }}>
              <label htmlFor="quorum-edit">Aforo esperado:</label>
              <input id="quorum-edit" type="number" className="input"
                     style={{ width: 100 }} value={draftQuorum}
                     onChange={(e) => setDraftQuorum(Number(e.target.value))}
                     placeholder="48" />
              <button className="btn btn--primary btn--sm"
                      onClick={() => onQuorum && onQuorum(draftQuorum)}>
                Guardar
              </button>
            </div>
          </>
        )}
      </div>

      {/* Lista de votantes */}
      <ul className="part-voters-list" role="list"
          aria-label={`Personas que ya han votado: ${x}`}>
        <li className="part-voters-head" aria-hidden="true">
          <span>email</span>
          <span style={{ textAlign: 'right' }}>cuándo</span>
        </li>
        {pageItems.map((v, i) => (
          <li key={i} className="part-voter" role="listitem"
              aria-label={`${v.email}, votó el ${v.when}`}>
            <span className="mono" style={{ fontSize: 13 }}>{v.email}</span>
            <span className="part-voter-when">{v.when}</span>
          </li>
        ))}
        <li className="part-pagination" aria-hidden="true">
          <span>Página <b className="tabular">{page}</b> de <b className="tabular">{pages}</b></span>
          <span>
            <button className="btn btn--ghost btn--sm"
                    disabled={page <= 1} onClick={() => setPage(page - 1)}>
              <IconChevronLeft size={14} /> Anterior
            </button>{' '}
            <button className="btn btn--ghost btn--sm"
                    disabled={page >= pages} onClick={() => setPage(page + 1)}>
              Siguiente <IconChevronRight size={14} />
            </button>
          </span>
        </li>
      </ul>

      <p className="part-privacy">
        <IconShield size={14} aria-hidden="true" />
        El sistema sólo registra quién ha votado, nunca qué ha votado.
      </p>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// ProposalsSearchAndBulk — buscador + checkboxes + sticky bulk bar
// ──────────────────────────────────────────────────────────────────────────
function ProposalsSearchAndBulk({ proposals, periodState, mobile, onExclude, onRestore }) {
  const [query, setQuery] = React.useState('');
  const [selected, setSelected] = React.useState(new Set());
  const [filter, setFilter] = React.useState('all');
  const liveRef = React.useRef(null);
  const checkboxesVisible = periodState === 'preparing';

  const filtered = proposals.filter((p) => {
    if (filter !== 'all' && p.status !== filter) return false;
    if (query && !p.name.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  // Anuncio para SR cuando cambia el contador
  React.useEffect(() => {
    if (!liveRef.current) return;
    if (selected.size === 0) liveRef.current.textContent = '';
    else liveRef.current.textContent =
      `${selected.size} propuesta${selected.size > 1 ? 's' : ''} seleccionada${selected.size > 1 ? 's' : ''}`;
  }, [selected.size]);

  const toggle = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const clearSelection = () => setSelected(new Set());
  const allChecked = filtered.length > 0 && filtered.every((p) => selected.has(p.id));
  const someChecked = filtered.some((p) => selected.has(p.id));
  const toggleAll = () => {
    setSelected((prev) => {
      if (allChecked) {
        const next = new Set(prev);
        filtered.forEach((p) => next.delete(p.id));
        return next;
      }
      const next = new Set(prev);
      filtered.forEach((p) => next.add(p.id));
      return next;
    });
  };

  return (
    <>
      {/* Búsqueda + filtros */}
      <div className="row" style={{ marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
        <div className="prop-search">
          <span className="prop-search-icon"><IconSearch size={16} /></span>
          <input className="input" placeholder="Buscar por nombre…"
                 value={query} onChange={(e) => setQuery(e.target.value)}
                 aria-label="Buscar propuesta" />
          {query && (
            <button type="button" className="prop-search-clear"
                    aria-label="Limpiar búsqueda"
                    onClick={() => setQuery('')}>
              <IconXCircle size={16} />
            </button>
          )}
        </div>
        <div className="tabs" role="tablist">
          <button role="tab" aria-selected={filter === 'all'}      onClick={() => setFilter('all')}>Todas <span className="muted">· {proposals.length}</span></button>
          <button role="tab" aria-selected={filter === 'votable'}  onClick={() => setFilter('votable')}>Votables</button>
          <button role="tab" aria-selected={filter === 'excluded'} onClick={() => setFilter('excluded')}>Excluidas</button>
          <button role="tab" aria-selected={filter === 'merged_parent'} onClick={() => setFilter('merged_parent')}>Fusionadas</button>
        </div>
      </div>

      {/* Tabla */}
      <table className="adm-table">
        <thead>
          <tr>
            {checkboxesVisible && (
              <th style={{ width: 40 }}>
                <div className="prop-row-check">
                  <input type="checkbox" checked={allChecked}
                         ref={(el) => { if (el) el.indeterminate = !allChecked && someChecked; }}
                         onChange={toggleAll}
                         aria-label={allChecked ? 'Deseleccionar todas' : 'Seleccionar todas las visibles'} />
                </div>
              </th>
            )}
            <th>Nombre</th>
            <th style={{ width: 100 }}>Estado</th>
            <th style={{ width: 90 }}>Estimación</th>
            <th style={{ width: 100, textAlign: 'right' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((p) => {
            const on = selected.has(p.id);
            return (
              <tr key={p.id} style={on ? { background: 'var(--color-primary-soft)' } : null}>
                {checkboxesVisible && (
                  <td>
                    <div className="prop-row-check">
                      <input type="checkbox" checked={on}
                             onChange={() => toggle(p.id)}
                             aria-label={`Seleccionar ${p.name}`} />
                    </div>
                  </td>
                )}
                <td>
                  <div style={{ fontWeight: 500 }}>{p.name}</div>
                  <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>{p.desc.slice(0, 70)}…</div>
                </td>
                <td><StatusBadge status={p.status} /></td>
                <td className="mono tabular">{p.estimate}</td>
                <td>
                  <div className="actions">
                    <button className="btn btn--ghost btn--icon" aria-label="Editar"><IconEdit size={14} /></button>
                    <button className="btn btn--ghost btn--icon" aria-label="Fusionar"><IconMerge size={14} /></button>
                    <button className="btn btn--ghost btn--icon" aria-label="Excluir"><IconTrash size={14} /></button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Live region para SR */}
      <div ref={liveRef} role="status" aria-live="polite" aria-atomic="true"
           style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }} />

      {/* Sticky bulk bar */}
      {checkboxesVisible && selected.size > 0 && (
        <div className="bulk-bar" role="region" aria-label="Acciones masivas">
          <span><b>{selected.size}</b> seleccionada{selected.size > 1 ? 's' : ''}</span>
          {!mobile && <span style={{ color: 'var(--color-border-strong)' }}>|</span>}
          <button className="btn btn--secondary btn--sm"
                  onClick={() => { onExclude && onExclude([...selected]); clearSelection(); }}>
            <IconEyeOff size={14} /> Excluir
          </button>
          {!mobile && (
            <button className="btn btn--secondary btn--sm"
                    onClick={() => { onRestore && onRestore([...selected]); clearSelection(); }}>
              <IconRefresh size={14} /> Restaurar
            </button>
          )}
          <button className="btn btn--ghost btn--sm"
                  onClick={clearSelection} aria-label="Cancelar selección">
            <IconXCircle size={14} />
            {!mobile && <span>Cancelar</span>}
          </button>
        </div>
      )}
    </>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// AdminDashboard — agrupa A · B · C
// ──────────────────────────────────────────────────────────────────────────
function AdminDashboard({ mobile, dispatch, periodState }) {
  React.useEffect(injectAdminStyle, []);

  // Datos de demo
  const counts = {
    votable: PROPOSALS.filter((p) => p.status === 'votable').length,
    excluded: PROPOSALS.filter((p) => p.status === 'excluded').length,
    mergedParents: PROPOSALS.filter((p) => p.status === 'merged_parent').length,
    ballots: 32,
  };

  const heroCopy = {
    preparing: {
      title: 'Periodo en preparación',
      sub:   'Q3 2026 · Round 3 — aún no abierto',
      quote: 'Importa las propuestas y abre la votación cuando esté lista.',
      tag:   'R3',
      icon:  IconClock,
    },
    open: {
      title: 'Periodo abierto',
      sub:   'Q3 2026 · Round 3 — faltan 3 días para cerrar',
      quote: `Faltan ${48 - counts.ballots} votantes por participar.`,
      tag:   'R3',
      icon:  IconPlay,
    },
    closed: {
      title: 'Periodo cerrado',
      sub:   'Q3 2026 · Round 3 — finalizado el 28 de mayo',
      quote: 'Ranking publicado. Descarga el CSV o reinicia para un nuevo round.',
      tag:   'R3',
      icon:  IconLock,
    },
  }[periodState] || {};

  const onAction = (id) => {
    if (id === 'part')    dispatch({ type: 'goto', route: 'admin-participation' });
    if (id === 'audit')   dispatch({ type: 'goto', route: 'admin-audit' });
    if (id === 'ranking') dispatch({ type: 'goto', route: 'results' });
    if (id === 'merge')   dispatch({ type: 'goto', route: 'admin-merge' });
    if (id === 'open' || id === 'close' || id === 'reset')
      dispatch({ type: 'goto', route: 'admin-period' });
    if (id === 'create' || id === 'import')
      dispatch({ type: 'goto', route: 'admin-proposals' });
    if (id === 'csv') {/* no-op demo */}
  };

  return (
    <div className="app">
      <AdminTopbar mobile={mobile} dispatch={dispatch} route="admin-dashboard" />
      <div className="content">
        <div className="container container--wide">
          <h1 className="h1" style={{ marginBottom: 20 }}>Dashboard</h1>

          {/* ZONA A · Hero */}
          {(() => null)()}
          <div className={`adm-hero adm-hero--${periodState}`}>
            <div className="adm-hero-icon" aria-hidden="true">
              {(() => { const HeroIcon = heroCopy.icon; return HeroIcon ? <HeroIcon size={28} /> : null; })()}
            </div>
            <div>
              <h2 className="adm-hero-title">{heroCopy.title}</h2>
              <div className="adm-hero-sub">{heroCopy.sub}</div>
              <div className="adm-hero-quote">{heroCopy.quote}</div>
            </div>
            <div className="adm-hero-cta" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
              <span className="adm-hero-tag">{heroCopy.tag}</span>
              {periodState === 'open' && (
                <button className="btn btn--secondary btn--sm"
                        onClick={() => dispatch({ type: 'goto', route: 'admin-participation' })}>
                  Ver participación <IconChevronRight size={14} />
                </button>
              )}
            </div>
          </div>

          {/* ZONA B · Metric cards */}
          <div className="adm-metrics">
            <MetricCard counter={counts.votable} label="Propuestas votables"
                        sub="estado · votable" icon={IconClipboardList}
                        onClick={() => dispatch({ type: 'goto', route: 'admin-proposals' })} />
            <MetricCard counter={counts.excluded} label="Excluidas"
                        sub="no votables" icon={IconEyeOff}
                        onClick={() => dispatch({ type: 'goto', route: 'admin-proposals' })} />
            <MetricCard counter={counts.mergedParents} label="Padres de fusión"
                        sub="originadas de varias" icon={IconMerge}
                        onClick={() => dispatch({ type: 'goto', route: 'admin-merge' })} />
            {periodState !== 'preparing' && (
              <MetricCard counter={counts.ballots} label="Papeletas emitidas"
                          sub={periodState === 'open' ? `de 48 · 67%` : `cierre · final`}
                          icon={IconVote}
                          onClick={() => dispatch({ type: 'goto', route: 'admin-participation' })} />
            )}
            {periodState === 'preparing' && (
              <MetricCard counter="—" label="Papeletas emitidas"
                          sub="periodo aún no abierto" icon={IconVote} />
            )}
          </div>

          {/* ZONA B (2) · Próximos pasos */}
          <ActionCardContextual state={periodState} onAction={onAction} />

          {/* ZONA C · Audit list */}
          <RecentAuditList entries={AUDIT_LOG}
                           onSeeAll={() => dispatch({ type: 'goto', route: 'admin-audit' })} />
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// AdminParticipationScreen — usa ParticipationView en un app frame
// ──────────────────────────────────────────────────────────────────────────
const SAMPLE_VOTERS = [
  { email: 'maria@phicus.es',    when: '11/05 09:48' },
  { email: 'alvaro@phicus.es',  when: '11/05 09:51' },
  { email: 'jgomez@phicus.es',   when: '11/05 10:02' },
  { email: 'epastor@phicus.es',  when: '11/05 10:14' },
  { email: 'lcorrales@phicus.es',when: '11/05 10:38' },
  { email: 'rmoreno@phicus.es',  when: '11/05 10:42' },
  { email: 'pgarcia@phicus.es',  when: '11/05 11:01' },
  { email: 'dvillar@phicus.es',  when: '11/05 11:05' },
  { email: 'aalonso@phicus.es',  when: '11/05 11:14' },
  { email: 'tortega@phicus.es',  when: '11/05 11:22' },
  { email: 'cdominguez@phicus.es',when: '11/05 11:33' },
  { email: 'rmartin@phicus.es',  when: '11/05 12:02' },
  { email: 'iherrero@phicus.es', when: '11/05 12:18' },
  { email: 'srubio@phicus.es',   when: '11/05 12:22' },
  { email: 'mfernandez@phicus.es', when: '11/05 13:04' },
  { email: 'pquiroga@phicus.es', when: '11/05 13:30' },
  { email: 'cnavarro@phicus.es', when: '11/05 14:05' },
  { email: 'jmolina@phicus.es',  when: '11/05 14:21' },
  { email: 'eblanco@phicus.es',  when: '11/05 14:48' },
  { email: 'ftorres@phicus.es',  when: '11/05 15:02' },
];

function AdminParticipationScreen({ mobile, dispatch }) {
  React.useEffect(injectAdminStyle, []);
  const [quorum, setQuorum] = React.useState(48);
  return (
    <div className="app">
      <AdminTopbar mobile={mobile} dispatch={dispatch} route="admin-participation" />
      <div className="content">
        <div className="container container--wide">
          <div className="row row--between" style={{ marginBottom: 20, gap: 12, flexWrap: 'wrap' }}>
            <div>
              <button className="btn btn--ghost btn--sm" style={{ marginBottom: 8 }}
                      onClick={() => dispatch({ type: 'goto', route: 'admin-dashboard' })}>
                <IconChevronLeft size={14} /> Dashboard
              </button>
              <h1 className="h1">Participación</h1>
            </div>
            <span className="badge badge--success">
              <IconPlay size={11} /> Periodo abierto · faltan {Math.max(0, quorum - SAMPLE_VOTERS.length)} votantes
            </span>
          </div>

          <ParticipationView voters={SAMPLE_VOTERS}
                             quorum={quorum} onQuorum={setQuorum}
                             mobile={mobile} />
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// AdminProposalsV2 — propuestas con search + bulk bar
// ──────────────────────────────────────────────────────────────────────────
function AdminProposalsV2({ mobile, dispatch, periodState }) {
  React.useEffect(injectAdminStyle, []);
  return (
    <div className="app">
      <AdminTopbar mobile={mobile} dispatch={dispatch} route="admin-proposals" />
      <div className="content" style={{ position: 'relative', paddingBottom: 80 }}>
        <div className="container container--wide">
          <div className="row row--between" style={{ marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
            <h1 className="h1">Propuestas</h1>
            <div className="row" style={{ gap: 8 }}>
              <button className="btn btn--secondary"
                      disabled={periodState !== 'preparing'}
                      title={periodState !== 'preparing' ? 'Sólo en preparación' : ''}>
                <IconUpload size={16} /> Importar CSV
              </button>
              <button className="btn btn--primary"
                      disabled={periodState !== 'preparing'}>
                <IconPlus size={16} /> Nueva propuesta
              </button>
            </div>
          </div>
          <ProposalsSearchAndBulk proposals={PROPOSALS} periodState={periodState} mobile={mobile} />
        </div>
      </div>
    </div>
  );
}

Object.assign(window, {
  AdminDashboard, MetricCard, ActionCardContextual, RecentAuditList,
  ParticipationView, ProposalsSearchAndBulk,
  AdminParticipationScreen, AdminProposalsV2,
  IconClipboardList, IconEyeOff, IconVote, IconDownload, IconUpload, IconXCircle,
});
