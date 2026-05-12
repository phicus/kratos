// app.jsx — Kratos, prototipo interactivo
// Punto de entrada: monta DesignCanvas con varios artboards interactivos +
// Tweaks panel global.

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "palette": ["#1f7a86", "#e36a3a", "#faf9f7"],
  "fontFamily": "Geist",
  "density": "regular",
  "scoreType": "chips",
  "periodState": "open",
  "fontScale": 100
}/*EDITMODE-END*/;

// Mapeo de paletas → tokens CSS
const PALETTES = {
  '#1f7a86': { // Teal técnico (default)
    primary: '#1f7a86', primaryHover: '#16606b', primaryActive: '#114b54',
    primarySoft: '#ecf6f7', primarySoftText: '#114b54',
    accent: '#e36a3a', accentSoft: '#fef1ec', accentSoftText: '#a8421c',
    focusRing: 'rgba(31,122,134,0.32)',
  },
  '#3b5bdb': { // Azul indigo
    primary: '#3b5bdb', primaryHover: '#2f48ad', primaryActive: '#243888',
    primarySoft: '#eef2fd', primarySoftText: '#243888',
    accent: '#e36a3a', accentSoft: '#fef1ec', accentSoftText: '#a8421c',
    focusRing: 'rgba(59,91,219,0.32)',
  },
  '#2c5d3a': { // Verde bosque
    primary: '#2c5d3a', primaryHover: '#22482c', primaryActive: '#18361f',
    primarySoft: '#ecf3ee', primarySoftText: '#18361f',
    accent: '#c4823b', accentSoft: '#fbf2e6', accentSoftText: '#7a4d18',
    focusRing: 'rgba(44,93,58,0.32)',
  },
  '#6b46c1': { // Violeta
    primary: '#6b46c1', primaryHover: '#553696', primaryActive: '#3f2870',
    primarySoft: '#f1ebfa', primarySoftText: '#3f2870',
    accent: '#e36a3a', accentSoft: '#fef1ec', accentSoftText: '#a8421c',
    focusRing: 'rgba(107,70,193,0.32)',
  },
};

const FONT_FAMILIES = {
  Geist:    `"Geist", ui-sans-serif, system-ui, sans-serif`,
  Inter:    `"Inter", ui-sans-serif, system-ui, sans-serif`,
  'IBM Plex': `"IBM Plex Sans", ui-sans-serif, system-ui, sans-serif`,
  Manrope:  `"Manrope", ui-sans-serif, system-ui, sans-serif`,
};

// Aplica tokens globales en :root según tweaks.
function applyTweaks(t) {
  const p = PALETTES[t.palette[0]] || PALETTES['#1f7a86'];
  const root = document.documentElement.style;
  root.setProperty('--color-primary', p.primary);
  root.setProperty('--color-primary-hover', p.primaryHover);
  root.setProperty('--color-primary-active', p.primaryActive);
  root.setProperty('--color-primary-soft', p.primarySoft);
  root.setProperty('--color-primary-soft-text', p.primarySoftText);
  root.setProperty('--color-border-focus', p.primary);
  root.setProperty('--color-accent', p.accent);
  root.setProperty('--color-accent-soft', p.accentSoft);
  root.setProperty('--color-accent-soft-text', p.accentSoftText);
  root.setProperty('--color-focus-ring', p.focusRing);

  const ff = FONT_FAMILIES[t.fontFamily] || FONT_FAMILIES.Geist;
  root.setProperty('--font-display', ff);
  root.setProperty('--font-body', ff);

  // Escala tipográfica global (porcentaje sobre 16px)
  root.setProperty('font-size', (t.fontScale || 100) + '%');
}

// ──────────────────────────────────────────────────────────────────────────
// App — un instancia interactiva del producto. Mantiene su propio estado
// (auth, ruta, scores). Recibe initialRoute y mobile.
// ──────────────────────────────────────────────────────────────────────────
function reducer(state, action) {
  switch (action.type) {
    case 'login':   return { ...state, auth: true, route: state.afterLogin || 'vote' };
    case 'logout':  return { ...state, auth: false, route: 'login' };
    case 'goto':    return { ...state, route: action.route };
    case 'score':   return { ...state, scores: { ...state.scores, [action.id]: action.value } };
    case 'submit':  return { ...state, submitted: true, route: 'alreadyVoted' };
    case 'reset':   return { ...action.initial };
    default:        return state;
  }
}

function App({ initialRoute = 'vote', mobile = false, scoreType, periodState, density }) {
  const initial = React.useMemo(() => ({
    auth: initialRoute !== 'login',
    route: initialRoute,
    scores: initialRoute === 'vote'
      ? { p1: 8, p2: 9, p3: 6, p4: 7, p6: 5, p7: 10 }
      : {},
    submitted: false,
    afterLogin: initialRoute === 'login' ? 'vote' : null,
  }), [initialRoute]);
  const [state, dispatch] = React.useReducer(reducer, initial);

  // Override: para PeriodClosed / NotOpen específicos, redirigir Vote.
  let effectiveRoute = state.route;
  if (state.route === 'vote' && periodState === 'closed') effectiveRoute = 'periodClosed';
  if (state.route === 'vote' && periodState === 'preparing') effectiveRoute = 'periodNotOpen';

  const screen = (() => {
    switch (effectiveRoute) {
      case 'login':          return <LoginScreen mobile={mobile} dispatch={dispatch} />;
      case 'vote':           return <VoteScreen mobile={mobile} state={state} dispatch={dispatch} scoreType={scoreType} />;
      case 'alreadyVoted':   return <AlreadyVotedScreen mobile={mobile} dispatch={dispatch} />;
      case 'periodClosed':   return <PeriodScreen mobile={mobile} dispatch={dispatch} state="closed" />;
      case 'periodNotOpen':  return <PeriodScreen mobile={mobile} dispatch={dispatch} state="notopen" />;
      case 'results':        return <ResultsScreen mobile={mobile} dispatch={dispatch} />;
      case 'admin-proposals':return <AdminProposalsScreen mobile={mobile} dispatch={dispatch} />;
      case 'admin-merge':    return <AdminMergeScreen mobile={mobile} dispatch={dispatch} />;
      case 'admin-period':   return <AdminPeriodScreen mobile={mobile} dispatch={dispatch} />;
      case 'admin-audit':    return <AdminAuditScreen mobile={mobile} dispatch={dispatch} />;
      case 'error':          return <ErrorScreen mobile={mobile} dispatch={dispatch} />;
      default:               return <ErrorScreen mobile={mobile} dispatch={dispatch} />;
    }
  })();

  return (
    <div className={`app-host density-${density || 'regular'} ${mobile ? 'app--mobile' : 'app--desktop'}`}
         style={{ width: '100%', height: '100%' }}>
      {screen}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Sandbox del Score Selector: card aislada para mostrar una variante en vivo
// ──────────────────────────────────────────────────────────────────────────
function ScoreSandbox({ type, density }) {
  const [v, setV] = React.useState({ chips: 8, slider: 7, stepper: 6, dial: 9 }[type] ?? 0);
  const label = {
    chips:   'Chips · 10 píldoras',
    slider:  'Slider · rango continuo',
    stepper: 'Stepper · − N +',
    dial:    'Dial · semicírculo con emoji',
  }[type];

  return (
    <div className={`app density-${density || 'regular'}`} style={{ padding: 0 }}>
      <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
        <div className="field-label" style={{ marginBottom: 4 }}>Variante</div>
        <div className="h3">{label}</div>
      </div>
      <div style={{ padding: 24, background: 'var(--color-background)', flex: 1 }}>
        <div className="card" style={{ padding: 20 }}>
          <div className="field-label" style={{ marginBottom: 12 }}>Propuesta de ejemplo</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, marginBottom: 4 }}>
            Refactor del login con OAuth2
          </div>
          <p className="muted" style={{ fontSize: 13, marginBottom: 16 }}>
            Migrar la sesión propia a Google OAuth completo.
          </p>
          <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 16 }}>
            <ScoreSelector type={type} value={v} onChange={setV} />
          </div>
        </div>
        <div style={{ marginTop: 16, padding: '12px 14px', background: 'var(--color-surface-sunken)', borderRadius: 8, fontSize: 12, color: 'var(--color-text-secondary)' }}>
          <b>Teclado:</b> <span className="mono">← →</span> mueve · <span className="mono">1-9, 0</span> selección directa · <span className="mono">Home/End</span> extremos
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Canvas principal
// ──────────────────────────────────────────────────────────────────────────
function Canvas() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  React.useEffect(() => { applyTweaks(t); }, [t]);

  // Color palettes para Tweaks (cada opción = array [primary, accent, bg])
  const palOptions = [
    ['#1f7a86', '#e36a3a', '#faf9f7'],  // Teal técnico
    ['#3b5bdb', '#e36a3a', '#faf9f7'],  // Azul indigo
    ['#2c5d3a', '#c4823b', '#faf9f7'],  // Verde bosque
    ['#6b46c1', '#e36a3a', '#faf9f7'],  // Violeta
  ];

  return (
    <>
      <DesignCanvas>
        <DCSection id="user-flow" title="Flujo de usuario"
                   subtitle="Inicia sesión, puntúa, envía. Click en los artboards para interactuar.">
          <DCArtboard id="login-desktop" label="01 · Login (desktop)" width={1280} height={800}>
            <App initialRoute="login" mobile={false} scoreType={t.scoreType}
                 periodState={t.periodState} density={t.density} />
          </DCArtboard>
          <DCArtboard id="login-mobile" label="01 · Login (mobile)" width={390} height={780}>
            <App initialRoute="login" mobile={true} scoreType={t.scoreType}
                 periodState={t.periodState} density={t.density} />
          </DCArtboard>
        </DCSection>

        <DCSection id="vote" title="Vote — la pantalla crítica"
                   subtitle="Score selector cambia con el tweak. Sticky bar siempre visible. Botón → confirmación.">
          <DCArtboard id="vote-desktop" label="02 · Vote (desktop, 1280)" width={1280} height={900}>
            <App initialRoute="vote" mobile={false} scoreType={t.scoreType}
                 periodState={t.periodState} density={t.density} />
          </DCArtboard>
          <DCArtboard id="vote-mobile" label="02 · Vote (mobile, 390)" width={390} height={900}>
            <App initialRoute="vote" mobile={true} scoreType={t.scoreType}
                 periodState={t.periodState} density={t.density} />
          </DCArtboard>
          <DCArtboard id="vote-mobile-narrow" label="02 · Vote (mobile, 360)" width={360} height={900}>
            <App initialRoute="vote" mobile={true} scoreType={t.scoreType}
                 periodState={t.periodState} density={t.density} />
          </DCArtboard>
        </DCSection>

        <DCSection id="score-variants" title="Score Selector · 4 variantes divergentes"
                   subtitle="Cada artboard es interactivo. El tweak global elige cuál se usa en Vote.">
          <DCArtboard id="ss-chips" label="A · Chips (default · desktop)" width={520} height={420}>
            <ScoreSandbox type="chips" density={t.density} />
          </DCArtboard>
          <DCArtboard id="ss-slider" label="B · Slider (mobile-first)" width={520} height={420}>
            <ScoreSandbox type="slider" density={t.density} />
          </DCArtboard>
          <DCArtboard id="ss-stepper" label="C · Stepper" width={520} height={420}>
            <ScoreSandbox type="stepper" density={t.density} />
          </DCArtboard>
          <DCArtboard id="ss-dial" label="D · Dial + emoji" width={520} height={460}>
            <ScoreSandbox type="dial" density={t.density} />
          </DCArtboard>
        </DCSection>

        <DCSection id="states" title="Estados y mensajes"
                   subtitle="AlreadyVoted, periodo cerrado, periodo aún no abierto, 404.">
          <DCArtboard id="already" label="03 · AlreadyVoted (desktop)" width={1280} height={760}>
            <App initialRoute="alreadyVoted" mobile={false}
                 scoreType={t.scoreType} periodState={t.periodState} density={t.density} />
          </DCArtboard>
          <DCArtboard id="already-mobile" label="03 · AlreadyVoted (mobile)" width={390} height={760}>
            <App initialRoute="alreadyVoted" mobile={true}
                 scoreType={t.scoreType} periodState={t.periodState} density={t.density} />
          </DCArtboard>
          <DCArtboard id="closed" label="04 · Periodo cerrado" width={1280} height={760}>
            <App initialRoute="periodClosed" mobile={false}
                 scoreType={t.scoreType} periodState={t.periodState} density={t.density} />
          </DCArtboard>
          <DCArtboard id="closed-mobile" label="04 · Periodo cerrado (mobile)" width={390} height={760}>
            <App initialRoute="periodClosed" mobile={true}
                 scoreType={t.scoreType} periodState={t.periodState} density={t.density} />
          </DCArtboard>
          <DCArtboard id="notopen" label="04 · Periodo aún no abierto" width={1280} height={760}>
            <App initialRoute="periodNotOpen" mobile={false}
                 scoreType={t.scoreType} periodState={t.periodState} density={t.density} />
          </DCArtboard>
          <DCArtboard id="error" label="10 · 404" width={1280} height={760}>
            <App initialRoute="error" mobile={false}
                 scoreType={t.scoreType} periodState={t.periodState} density={t.density} />
          </DCArtboard>
        </DCSection>

        <DCSection id="results" title="Resultados"
                   subtitle="Ranking del último periodo cerrado. Top 3 destacado.">
          <DCArtboard id="results-desktop" label="05 · Results (desktop)" width={1280} height={900}>
            <App initialRoute="results" mobile={false}
                 scoreType={t.scoreType} periodState={t.periodState} density={t.density} />
          </DCArtboard>
          <DCArtboard id="results-mobile" label="05 · Results (mobile)" width={390} height={900}>
            <App initialRoute="results" mobile={true}
                 scoreType={t.scoreType} periodState={t.periodState} density={t.density} />
          </DCArtboard>
        </DCSection>

        <DCSection id="admin" title="Admin"
                   subtitle="Tabs Propuestas / Fusionar / Periodo / Auditoría. Click navega entre ellas dentro del artboard.">
          <DCArtboard id="admin-proposals" label="06 · Propuestas" width={1280} height={900}>
            <App initialRoute="admin-proposals" mobile={false}
                 scoreType={t.scoreType} periodState={t.periodState} density={t.density} />
          </DCArtboard>
          <DCArtboard id="admin-merge" label="07 · Fusionar" width={1280} height={900}>
            <App initialRoute="admin-merge" mobile={false}
                 scoreType={t.scoreType} periodState={t.periodState} density={t.density} />
          </DCArtboard>
          <DCArtboard id="admin-period" label="08 · Periodo" width={1280} height={900}>
            <App initialRoute="admin-period" mobile={false}
                 scoreType={t.scoreType} periodState={t.periodState} density={t.density} />
          </DCArtboard>
          <DCArtboard id="admin-audit" label="09 · Auditoría" width={1280} height={760}>
            <App initialRoute="admin-audit" mobile={false}
                 scoreType={t.scoreType} periodState={t.periodState} density={t.density} />
          </DCArtboard>
        </DCSection>
      </DesignCanvas>

      <TweaksPanel title="Sistema · tweaks">
        <TweakSection label="Paleta">
          <TweakColor label="Color principal" value={t.palette}
                      options={palOptions}
                      onChange={(v) => setTweak('palette', v)} />
        </TweakSection>

        <TweakSection label="Tipografía">
          <TweakSelect label="Familia" value={t.fontFamily}
                       options={['Geist', 'Inter', 'IBM Plex', 'Manrope']}
                       onChange={(v) => setTweak('fontFamily', v)} />
          <TweakSlider label="Escala" value={t.fontScale} min={88} max={112} step={2} unit="%"
                       onChange={(v) => setTweak('fontScale', v)} />
        </TweakSection>

        <TweakSection label="Densidad">
          <TweakRadio label="Espaciado" value={t.density}
                      options={['compact', 'regular', 'comfy']}
                      onChange={(v) => setTweak('density', v)} />
        </TweakSection>

        <TweakSection label="Score Selector (en Vote)">
          <TweakSelect label="Variante" value={t.scoreType}
                       options={[
                         { value: 'chips',   label: 'A · Chips' },
                         { value: 'slider',  label: 'B · Slider' },
                         { value: 'stepper', label: 'C · Stepper' },
                         { value: 'dial',    label: 'D · Dial' },
                       ]}
                       onChange={(v) => setTweak('scoreType', v)} />
        </TweakSection>

        <TweakSection label="Estado del periodo (afecta Vote)">
          <TweakRadio label="Estado" value={t.periodState}
                      options={[
                        { value: 'preparing', label: 'Prep' },
                        { value: 'open',      label: 'Abierto' },
                        { value: 'closed',    label: 'Cerrado' },
                      ]}
                      onChange={(v) => setTweak('periodState', v)} />
        </TweakSection>
      </TweaksPanel>
    </>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<Canvas />);
