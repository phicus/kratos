// score-selectors.jsx — 4 variantes divergentes del Score Selector 1-10.
// Todas implementan:
//   role="radiogroup", aria-label, aria-checked, navegación con teclado
//   (← → para mover, Home/End extremos, 0/1-9 selección directa)
// Tipo: 'chips' | 'slider' | 'stepper' | 'dial'

const SCORE_STYLE = `
/* ── Chips: 10 píldoras ──────────────────────────────────────────────── */
.ss-chips { display: grid; grid-template-columns: repeat(10, 1fr); gap: 4px; }
.ss-chip {
  appearance: none; height: 38px; min-width: 32px;
  padding: 0; border: 1px solid var(--color-border);
  background: var(--color-surface); color: var(--color-text-secondary);
  border-radius: var(--radius-sm);
  font-family: var(--font-mono); font-size: 14px; font-weight: 500;
  cursor: pointer; transition: all 140ms cubic-bezier(.22,1,.36,1);
  font-variant-numeric: tabular-nums;
}
.ss-chip:hover { border-color: var(--color-border-strong); color: var(--color-text); }
.ss-chip:focus-visible { outline: none; box-shadow: var(--shadow-focus); z-index: 1; }
.ss-chip[aria-checked="true"] {
  background: var(--color-primary); color: var(--color-text-on-primary);
  border-color: var(--color-primary);
  transform: translateY(-1px);
}
.app--mobile .ss-chips { grid-template-columns: repeat(5, 1fr); gap: 6px; }
.app--mobile .ss-chip { height: 44px; }

/* ── Slider ──────────────────────────────────────────────────────────── */
.ss-slider {
  display: flex; align-items: center; gap: 16px;
  padding: 4px 4px 0;
}
.ss-slider-track {
  position: relative; flex: 1; height: 36px;
  display: flex; align-items: center; cursor: pointer;
  touch-action: none;
}
.ss-slider-rail {
  width: 100%; height: 8px; border-radius: 999px;
  background: var(--color-surface-sunken);
  position: relative; overflow: hidden;
}
.ss-slider-fill {
  position: absolute; left: 0; top: 0; bottom: 0;
  background: var(--color-primary);
  transition: width 100ms linear;
}
.ss-slider-ticks {
  position: absolute; inset: 0;
  display: grid; grid-template-columns: repeat(10, 1fr);
  pointer-events: none;
}
.ss-slider-ticks > i {
  align-self: center;
  width: 1px; height: 4px; background: rgba(0,0,0,.18);
  justify-self: center;
}
.ss-slider-thumb {
  position: absolute; top: 50%;
  width: 22px; height: 22px; border-radius: 50%;
  background: var(--color-surface);
  border: 2px solid var(--color-primary);
  box-shadow: var(--shadow-sm);
  transform: translate(-50%, -50%);
  transition: left 100ms linear;
  pointer-events: none;
}
.ss-slider-value {
  flex-shrink: 0; min-width: 56px;
  font-family: var(--font-display);
  font-size: 28px; font-weight: 700;
  color: var(--color-primary);
  font-variant-numeric: tabular-nums;
  text-align: right;
  letter-spacing: -0.02em;
}
.ss-slider-value small {
  font-size: 13px; font-weight: 500;
  color: var(--color-text-muted);
  font-family: var(--font-body);
  font-variant-numeric: normal;
  letter-spacing: 0;
}

/* ── Stepper ─────────────────────────────────────────────────────────── */
.ss-stepper {
  display: grid; grid-template-columns: 44px 1fr 44px;
  align-items: center; gap: 12px;
  padding: 4px;
  background: var(--color-surface-sunken);
  border-radius: var(--radius-lg);
}
.ss-stepper-btn {
  appearance: none; width: 44px; height: 44px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  display: grid; place-items: center;
  color: var(--color-text); cursor: pointer;
  transition: all 140ms cubic-bezier(.22,1,.36,1);
}
.ss-stepper-btn:hover:not(:disabled) {
  border-color: var(--color-primary); color: var(--color-primary);
}
.ss-stepper-btn:disabled { opacity: 0.35; cursor: not-allowed; }
.ss-stepper-btn:focus-visible { outline: none; box-shadow: var(--shadow-focus); }
.ss-stepper-value {
  text-align: center;
  font-family: var(--font-display);
  letter-spacing: -0.04em;
  color: var(--color-text);
  font-variant-numeric: tabular-nums;
}
.ss-stepper-value strong { font-size: 32px; font-weight: 700; }
.ss-stepper-value span { font-size: 14px; color: var(--color-text-muted); margin-left: 4px; font-weight: 400; }
.ss-stepper-ticks {
  grid-column: 1 / -1;
  display: grid; grid-template-columns: repeat(10, 1fr); gap: 2px;
  padding: 0 8px 4px;
}
.ss-stepper-ticks > i {
  height: 4px; border-radius: 999px;
  background: var(--color-border);
  transition: background 140ms;
}
.ss-stepper-ticks > i[data-on="1"] { background: var(--color-primary); }

/* ── Dial (semi-radial) ──────────────────────────────────────────────── */
.ss-dial {
  position: relative; width: 100%; max-width: 280px; margin: 0 auto;
  aspect-ratio: 2 / 1;
  display: grid; place-items: end center;
  touch-action: none;
  user-select: none;
}
.ss-dial-svg { width: 100%; height: 100%; display: block; cursor: pointer; }
.ss-dial-track {
  fill: none; stroke: var(--color-surface-sunken); stroke-width: 14;
  stroke-linecap: round;
}
.ss-dial-fill {
  fill: none; stroke: url(#dialGradient); stroke-width: 14;
  stroke-linecap: round;
  transition: stroke-dashoffset 220ms cubic-bezier(.22,1,.36,1);
}
.ss-dial-tick { stroke: rgba(0,0,0,.25); stroke-width: 1.2; }
.ss-dial-tick[data-active="1"] { stroke: var(--color-text); }
.ss-dial-handle {
  fill: var(--color-surface);
  stroke: var(--color-primary); stroke-width: 3;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.12));
  transition: cx 220ms cubic-bezier(.22,1,.36,1),
              cy 220ms cubic-bezier(.22,1,.36,1);
}
.ss-dial-label {
  position: absolute;
  bottom: 0; left: 50%; transform: translateX(-50%);
  text-align: center;
  font-family: var(--font-display);
  font-size: 44px; font-weight: 700;
  color: var(--color-text);
  letter-spacing: -0.03em;
  font-variant-numeric: tabular-nums;
  line-height: 1;
}
.ss-dial-label small {
  display: block; font-size: 11px; font-weight: 500;
  color: var(--color-text-muted); letter-spacing: 0.08em;
  text-transform: uppercase; font-family: var(--font-body);
  margin-top: 4px;
}
.ss-dial-emoji {
  position: absolute; top: 12%; left: 50%; transform: translateX(-50%);
  font-size: 28px;
  filter: grayscale(0);
  transition: transform 220ms cubic-bezier(.22,1,.36,1);
}

/* ── Shared a11y ─────────────────────────────────────────────────────── */
.ss-meta {
  display: flex; justify-content: space-between;
  font-size: var(--text-xs); color: var(--color-text-muted);
  letter-spacing: 0.02em; text-transform: uppercase;
  margin-bottom: 8px;
}
.ss-empty {
  font-size: var(--text-xs); color: var(--color-text-muted);
  margin-top: 6px;
}
`;

function injectScoreStyle() {
  if (document.getElementById('__ss_style')) return;
  const s = document.createElement('style');
  s.id = '__ss_style';
  s.textContent = SCORE_STYLE;
  document.head.appendChild(s);
}

// Shared keyboard handler — translates ←/→/Home/End/0-9 to a new score.
function useKbdScore(value, onChange) {
  return React.useCallback((e) => {
    const k = e.key;
    let v = value;
    if (k === 'ArrowLeft' || k === 'ArrowDown') v = Math.max(1, (value || 1) - 1);
    else if (k === 'ArrowRight' || k === 'ArrowUp') v = Math.min(10, (value || 0) + 1);
    else if (k === 'Home') v = 1;
    else if (k === 'End') v = 10;
    else if (k === '0') v = 10;
    else if (/^[1-9]$/.test(k)) v = parseInt(k, 10);
    else return;
    e.preventDefault();
    onChange(v);
  }, [value, onChange]);
}

// ── 1. Chips ────────────────────────────────────────────────────────────
function ScoreChips({ value, onChange, label = 'Puntuación' }) {
  React.useEffect(injectScoreStyle, []);
  const onKey = useKbdScore(value, onChange);
  return (
    <div>
      <div className="ss-meta"><span>1 · Mejorable</span><span>10 · Imprescindible</span></div>
      <div className="ss-chips" role="radiogroup" aria-label={label} onKeyDown={onKey}>
        {[1,2,3,4,5,6,7,8,9,10].map((n) => (
          <button key={n} type="button" className="ss-chip"
                  role="radio" aria-checked={value === n} aria-label={`${n} de 10`}
                  tabIndex={value === n || (!value && n === 1) ? 0 : -1}
                  onClick={() => onChange(n)}>
            {n}
          </button>
        ))}
      </div>
      {!value && <div className="ss-empty">Sin puntuar</div>}
    </div>
  );
}

// ── 2. Slider ───────────────────────────────────────────────────────────
function ScoreSlider({ value, onChange, label = 'Puntuación' }) {
  React.useEffect(injectScoreStyle, []);
  const trackRef = React.useRef(null);
  const onKey = useKbdScore(value, onChange);

  const fromClient = (clientX) => {
    const r = trackRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (clientX - r.left) / r.width));
    return Math.max(1, Math.min(10, Math.round(pct * 9) + 1));
  };

  const onPointer = (e) => {
    e.preventDefault();
    const v = fromClient(e.clientX);
    onChange(v);
    const move = (ev) => { const nv = fromClient(ev.clientX); if (nv !== v) onChange(nv); };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  const v = value || 0;
  const pct = v ? ((v - 1) / 9) * 100 : 0;

  return (
    <div>
      <div className="ss-meta"><span>1</span><span>10</span></div>
      <div className="ss-slider" role="radiogroup" aria-label={label}
           onKeyDown={onKey} tabIndex={0}>
        <div ref={trackRef} className="ss-slider-track" onPointerDown={onPointer}>
          <div className="ss-slider-rail">
            <div className="ss-slider-fill" style={{ width: pct + '%' }} />
            <div className="ss-slider-ticks">
              {[1,2,3,4,5,6,7,8,9,10].map((n) => <i key={n} />)}
            </div>
          </div>
          {v > 0 && <div className="ss-slider-thumb" style={{ left: pct + '%' }} />}
        </div>
        <div className="ss-slider-value">
          {v ? v : <span style={{ color: 'var(--color-text-muted)' }}>—</span>}
          <small>{v ? ` / 10` : ' / 10'}</small>
        </div>
      </div>
    </div>
  );
}

// ── 3. Stepper ──────────────────────────────────────────────────────────
function ScoreStepper({ value, onChange, label = 'Puntuación' }) {
  React.useEffect(injectScoreStyle, []);
  const onKey = useKbdScore(value, onChange);
  const v = value || 0;
  return (
    <div>
      <div className="ss-meta"><span>Pulsa − / +</span><span>1 – 10</span></div>
      <div className="ss-stepper" role="radiogroup" aria-label={label} onKeyDown={onKey} tabIndex={0}>
        <button type="button" className="ss-stepper-btn"
                aria-label="Bajar puntuación"
                disabled={v <= 1}
                onClick={() => onChange(Math.max(1, v - 1))}>
          <IconMinus size={18} />
        </button>
        <div className="ss-stepper-value">
          {v ? <strong>{v}</strong> : <strong style={{ color: 'var(--color-text-muted)' }}>—</strong>}
          <span>/ 10</span>
        </div>
        <button type="button" className="ss-stepper-btn"
                aria-label="Subir puntuación"
                disabled={v >= 10}
                onClick={() => onChange(Math.min(10, (v || 0) + 1))}>
          <IconPlus size={18} />
        </button>
        <div className="ss-stepper-ticks">
          {[1,2,3,4,5,6,7,8,9,10].map((n) => (
            <i key={n} data-on={v >= n ? '1' : '0'} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── 4. Dial ─────────────────────────────────────────────────────────────
// Semicírculo radial 180°→0° (izq→der). Emoji indica intensidad.
const EMOJIS = ['🌱','🌱','🌿','🌿','☘️','🌳','🌳','🔥','🔥','🚀'];

function ScoreDial({ value, onChange, label = 'Puntuación' }) {
  React.useEffect(injectScoreStyle, []);
  const svgRef = React.useRef(null);
  const onKey = useKbdScore(value, onChange);
  const v = value || 0;

  // Geometry: semicircle in 200x100 viewBox, center (100,100), r=80, from angle π → 0
  const CX = 100, CY = 100, R = 80;
  const angleFor = (n) => Math.PI - (Math.PI * (n - 1)) / 9; // 1→π, 10→0
  const pointFor = (n) => ({ x: CX + R * Math.cos(angleFor(n)), y: CY - R * Math.sin(angleFor(n)) });

  // Stroke-dash for fill arc: full arc length = π * R; fraction by score
  const fullLen = Math.PI * R;
  const frac = v ? (v - 1) / 9 : 0;

  const fromPointer = (clientX, clientY) => {
    const r = svgRef.current.getBoundingClientRect();
    // Map to viewBox coords
    const x = ((clientX - r.left) / r.width) * 200 - CX;
    const y = CY - ((clientY - r.top) / r.height) * 100;
    let a = Math.atan2(Math.max(0, y), x); // 0..π
    if (a < 0) a = 0; if (a > Math.PI) a = Math.PI;
    const n = Math.round(((Math.PI - a) / Math.PI) * 9) + 1;
    return Math.max(1, Math.min(10, n));
  };

  const onPointer = (e) => {
    e.preventDefault();
    const nv = fromPointer(e.clientX, e.clientY);
    onChange(nv);
    const move = (ev) => { const x = fromPointer(ev.clientX, ev.clientY); onChange(x); };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  const handle = v ? pointFor(v) : null;
  // arc path: M start L … using sweep
  const start = pointFor(1), end = pointFor(10);
  const arcD = `M ${start.x} ${start.y} A ${R} ${R} 0 0 1 ${end.x} ${end.y}`;

  return (
    <div className="ss-dial" role="radiogroup" aria-label={label}
         tabIndex={0} onKeyDown={onKey}>
      <svg ref={svgRef} className="ss-dial-svg" viewBox="0 0 200 110"
           onPointerDown={onPointer} preserveAspectRatio="xMidYMax meet">
        <defs>
          <linearGradient id="dialGradient" x1="0" x2="1">
            <stop offset="0" stopColor="var(--color-primary)" />
            <stop offset="1" stopColor="var(--color-accent)" />
          </linearGradient>
        </defs>
        <path className="ss-dial-track" d={arcD} />
        <path className="ss-dial-fill" d={arcD}
              strokeDasharray={`${fullLen} ${fullLen}`}
              strokeDashoffset={fullLen * (1 - frac)} />
        {[1,2,3,4,5,6,7,8,9,10].map((n) => {
          const p = pointFor(n);
          const inner = { x: CX + (R - 10) * Math.cos(angleFor(n)),
                          y: CY - (R - 10) * Math.sin(angleFor(n)) };
          return <line key={n} className="ss-dial-tick"
                       x1={p.x} y1={p.y} x2={inner.x} y2={inner.y}
                       data-active={v === n ? '1' : '0'} />;
        })}
        {handle && <circle className="ss-dial-handle"
                           cx={handle.x} cy={handle.y} r="9" />}
      </svg>
      {v > 0 && <div className="ss-dial-emoji" aria-hidden="true">{EMOJIS[v - 1]}</div>}
      <div className="ss-dial-label">
        {v ? v : '—'}
        <small>{v ? 'puntos' : 'sin puntuar'}</small>
      </div>
    </div>
  );
}

// ── Selector despachador ────────────────────────────────────────────────
function ScoreSelector({ type = 'chips', ...rest }) {
  if (type === 'slider')  return <ScoreSlider  {...rest} />;
  if (type === 'stepper') return <ScoreStepper {...rest} />;
  if (type === 'dial')    return <ScoreDial    {...rest} />;
  return <ScoreChips {...rest} />;
}

Object.assign(window, {
  ScoreSelector, ScoreChips, ScoreSlider, ScoreStepper, ScoreDial,
});
