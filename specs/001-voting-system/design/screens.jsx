// screens.jsx — todas las pantallas del prototipo
// Cada Screen recibe { state, dispatch, mobile, scoreType, periodState }
// y devuelve el contenido del frame (.app interior, sin chrome de canvas).

// ──────────────────────────────────────────────────────────────────────────
// Topbar reusable
// ──────────────────────────────────────────────────────────────────────────
function Topbar({ mobile, meta, onLogout, hidePelea }) {
  return (
    <div className="topbar">
      <div className="row">
        <div className="brand">
          <div className="brand-mark"><IconBird size={14} /></div>
          {!mobile && <span>Phicus Vota</span>}
          {mobile && <span>Vota</span>}
        </div>
        {!mobile && !hidePelea && (
          <span className="brand-tag">
            <IconSparkles size={11} /> Pelea de gallos · R3
          </span>
        )}
      </div>
      <div className="topbar-end">
        {meta && <span className="topbar-meta">{meta}</span>}
        {onLogout && (
          <button className="btn btn--ghost btn--sm" aria-label="Salir" onClick={onLogout}>
            <IconLogout size={16} />
            {!mobile && <span>Salir</span>}
          </button>
        )}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// 1 · Login
// ──────────────────────────────────────────────────────────────────────────
function LoginScreen({ mobile, dispatch }) {
  return (
    <div className="app">
      <div className="topbar">
        <div className="brand">
          <div className="brand-mark"><IconBird size={14} /></div>
          <span>Phicus Vota</span>
        </div>
      </div>
      <div className="content" style={{ display: 'grid', placeItems: 'center' }}>
        <div className="container container--narrow" style={{ textAlign: 'center', paddingTop: mobile ? 32 : 80 }}>
          <span className="brand-tag" style={{ marginLeft: 0, marginBottom: 24 }}>
            <IconSparkles size={11} /> Pelea de gallos · Round 3
          </span>
          <h1 className="h1" style={{ marginTop: 24 }}>Tu voto, tus mejoras.</h1>
          <p className="muted" style={{ marginTop: 12, fontSize: 15, lineHeight: 1.6, textWrap: 'pretty' }}>
            Puntúa las propuestas internas del Q3. Voto único, anónimo, abierto hasta el 14 de junio.
          </p>
          <div style={{ marginTop: 32 }}>
            <button className="btn btn--google btn--lg btn--block"
                    onClick={() => dispatch({ type: 'login' })}>
              <span className="g-mark" aria-hidden="true" />
              Entrar con Google
            </button>
            <p className="muted" style={{ marginTop: 12, fontSize: 13 }}>
              Sólo correos <span className="mono">@phicus.es</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Banner del periodo (3 estados visualmente distintos)
// ──────────────────────────────────────────────────────────────────────────
function PeriodBanner({ state }) {
  if (state === 'preparing') return (
    <div className="banner banner--warning">
      <div className="banner-icon"><IconClock size={18} /></div>
      <div className="banner-body">
        <div className="banner-title">Periodo en preparación</div>
        <div className="banner-msg">Los administradores están afinando las propuestas. Abre el 14 de junio.</div>
      </div>
    </div>
  );
  if (state === 'closed') return (
    <div className="banner banner--neutral">
      <div className="banner-icon"><IconLock size={18} /></div>
      <div className="banner-body">
        <div className="banner-title">Periodo cerrado</div>
        <div className="banner-msg">Cerramos el 28 de mayo. Publicamos resultados en breve.</div>
      </div>
    </div>
  );
  return (
    <div className="banner banner--info">
      <div className="banner-icon"><IconPlay size={18} /></div>
      <div className="banner-body">
        <div className="banner-title">Periodo abierto · faltan 3 días</div>
        <div className="banner-msg">Tu papeleta se envía una sola vez. Tómate tu tiempo.</div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// 2 · Vote
// ──────────────────────────────────────────────────────────────────────────
function ProposalCard({ p, score, onScore, scoreType, mobile }) {
  return (
    <article className={`card proposal ${score ? 'card--scored' : ''}`}>
      <header className="proposal-head">
        <div>
          <h3 className="proposal-title">{p.name}</h3>
          <p className="proposal-desc" style={{ marginTop: 6 }}>{p.desc}</p>
        </div>
        <span className="badge">{p.estimate}</span>
      </header>
      <details className="proposal-how">
        <summary>
          <IconChevronRight size={12} className="chev" />
          <span>Cómo lo haríamos</span>
        </summary>
        <p>{p.how}</p>
      </details>
      <div className="proposal-score-region">
        <ScoreSelector type={scoreType} value={score} onChange={onScore} label={`Puntuación: ${p.name}`} />
      </div>
    </article>
  );
}

function VoteScreen({ mobile, state, dispatch, scoreType }) {
  const { scores } = state;
  const scored = Object.values(scores).filter(Boolean).length;
  const total = VOTABLE.length;
  const pct = total > 0 ? (scored / total) * 100 : 0;
  const [showConfirm, setShowConfirm] = React.useState(false);

  return (
    <div className="app">
      <Topbar mobile={mobile}
              meta={<><b>{scored}</b>/{total} puntuadas</>}
              onLogout={() => dispatch({ type: 'logout' })} />
      <div className="content" style={{ position: 'relative' }}>
        <div className="container">
          <PeriodBanner state="open" />
          <div className="stack-3">
            {VOTABLE.map((p) => (
              <ProposalCard key={p.id} p={p}
                            score={scores[p.id]}
                            onScore={(v) => dispatch({ type: 'score', id: p.id, value: v })}
                            scoreType={scoreType} mobile={mobile} />
            ))}
          </div>
        </div>
      </div>
      <div className="sticky-submit">
        <div className="progress" role="progressbar" aria-valuenow={scored} aria-valuemax={total}>
          <i style={{ width: pct + '%' }} />
        </div>
        <span className="progress-label">
          <b>{scored}</b>/{total}
          {!mobile && ' puntuadas'}
        </span>
        <button className="btn btn--primary"
                disabled={scored === 0}
                onClick={() => setShowConfirm(true)}>
          {mobile ? 'Enviar' : 'Enviar papeleta'}
        </button>
      </div>
      {showConfirm && (
        <ConfirmSubmit scored={scored} total={total}
                       onCancel={() => setShowConfirm(false)}
                       onConfirm={() => { setShowConfirm(false); dispatch({ type: 'submit' }); }} />
      )}
    </div>
  );
}

function ConfirmSubmit({ scored, total, onCancel, onConfirm }) {
  return (
    <div className="modal-veil" role="dialog" aria-modal="true">
      <div className="modal">
        <h3 className="h3">¿Enviar tu papeleta?</h3>
        <p>
          Has puntuado <b>{scored}</b> de {total} propuestas.{' '}
          {scored < total && 'Las que dejes sin puntuar contarán como cero. '}
          No se puede cambiar después.
        </p>
        <div className="row row--end" style={{ gap: 8 }}>
          <button className="btn btn--secondary" onClick={onCancel}>Cancelar</button>
          <button className="btn btn--primary" onClick={onConfirm}>Sí, enviar</button>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// 3 · AlreadyVoted
// ──────────────────────────────────────────────────────────────────────────
function AlreadyVotedScreen({ mobile, dispatch }) {
  return (
    <div className="app">
      <Topbar mobile={mobile} onLogout={() => dispatch({ type: 'logout' })} hidePelea />
      <div className="content">
        <div className="state-illo state-illo--success">
          <div className="ic"><IconCheckCircle size={32} /></div>
          <h2 className="h2">Papeleta entregada</h2>
          <p>Gracias por participar. Los resultados se publicarán cuando cierre el periodo, el <b>14 de junio</b>.</p>
          <div style={{ marginTop: 24, display: 'flex', gap: 8 }}>
            <button className="btn btn--secondary"
                    onClick={() => dispatch({ type: 'goto', route: 'results' })}>
              Ver resultados anteriores
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// 4 · PeriodNotOpen / PeriodClosed
// ──────────────────────────────────────────────────────────────────────────
function PeriodScreen({ mobile, dispatch, state }) {
  const closed = state === 'closed';
  return (
    <div className="app">
      <Topbar mobile={mobile} onLogout={() => dispatch({ type: 'logout' })} hidePelea />
      <div className="content">
        <div className={`state-illo ${closed ? 'state-illo--neutral' : 'state-illo--warning'}`}>
          <div className="ic">{closed ? <IconLock size={28} /> : <IconClock size={28} />}</div>
          <h2 className="h2">{closed ? 'Periodo cerrado' : 'Aún no hemos abierto'}</h2>
          <p>
            {closed
              ? 'Cerramos el voto el 28 de mayo. Los resultados se publican muy pronto.'
              : 'Estamos terminando de afinar las propuestas. El periodo abre el 14 de junio.'}
          </p>
          {closed && (
            <div style={{ marginTop: 24 }}>
              <button className="btn btn--primary"
                      onClick={() => dispatch({ type: 'goto', route: 'results' })}>
                Ver resultados
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// 5 · Results
// ──────────────────────────────────────────────────────────────────────────
function ResultsScreen({ mobile, dispatch }) {
  const max = Math.max(...RESULTS.map((r) => r.sum));
  return (
    <div className="app">
      <Topbar mobile={mobile} onLogout={() => dispatch({ type: 'logout' })} hidePelea />
      <div className="content">
        <div className="container container--wide">
          <div className="row row--between" style={{ alignItems: 'baseline', marginBottom: 6 }}>
            <h1 className="h1">Resultados</h1>
            <select className="input" style={{ width: 'auto', height: 36, paddingRight: 32 }} defaultValue="r2">
              <option value="r2">Q3 2026 · R2</option>
              <option value="r1">Q3 2026 · R1</option>
              <option value="q2">Q2 2026</option>
            </select>
          </div>
          <p className="muted" style={{ fontSize: 14, margin: '4px 0 24px' }}>
            <span className="row" style={{ display: 'inline-flex', gap: 16 }}>
              <span><IconUsers size={14} style={{ verticalAlign: '-2px', marginRight: 4 }} /> 47 votantes</span>
              <span><IconList size={14} style={{ verticalAlign: '-2px', marginRight: 4 }} /> 24 propuestas</span>
              <span><IconCheckCircle size={14} style={{ verticalAlign: '-2px', marginRight: 4 }} /> 92% de participación</span>
            </span>
          </p>
          {RESULTS.map((r, i) => {
            const pos = i + 1;
            const isTop = pos <= 3;
            const w = (r.sum / max) * 100;
            return (
              <div key={r.id} className={`rank-row ${isTop ? 'rank-row--top' : ''} rank-row--${pos}`}>
                <span className="rank-pos">
                  {isTop ? <><IconTrophy size={pos === 1 ? 22 : 18} style={{ verticalAlign: '-3px', marginRight: 2 }} />{pos}</> : `#${pos}`}
                </span>
                <div className="rank-body">
                  <div className="rank-name">{r.name}</div>
                  <div className="rank-bar"><i style={{ width: w + '%' }} /></div>
                </div>
                <div className="rank-score">{r.sum}<span className="muted" style={{ fontSize: 12, marginLeft: 2 }}>pts</span></div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// 6 · Admin / Proposals
// ──────────────────────────────────────────────────────────────────────────
function AdminTopbar({ mobile, dispatch, route }) {
  return (
    <>
      <Topbar mobile={mobile} onLogout={() => dispatch({ type: 'logout' })}
              meta={<span className="badge badge--accent" style={{ background: 'var(--color-warning-soft)', color: 'var(--color-warning-text)' }}>
                <IconShield size={11} /> Admin
              </span>} />
      <div style={{ background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }}>
        <div className="container container--wide" style={{ padding: '12px 24px' }}>
          <div className="tabs" style={{ display: 'inline-flex' }}>
            <button aria-selected={route === 'admin-proposals'} onClick={() => dispatch({ type: 'goto', route: 'admin-proposals' })}>Propuestas</button>
            <button aria-selected={route === 'admin-merge'} onClick={() => dispatch({ type: 'goto', route: 'admin-merge' })}>Fusionar</button>
            <button aria-selected={route === 'admin-period'} onClick={() => dispatch({ type: 'goto', route: 'admin-period' })}>Periodo</button>
            <button aria-selected={route === 'admin-audit'} onClick={() => dispatch({ type: 'goto', route: 'admin-audit' })}>Auditoría</button>
          </div>
        </div>
      </div>
    </>
  );
}

function StatusBadge({ status }) {
  const map = {
    votable:       { cls: 'badge--success', label: 'Votable' },
    excluded:      { cls: '',               label: 'Excluida' },
    merged_parent: { cls: 'badge--primary', label: 'Fusionada' },
  };
  const v = map[status] || map.votable;
  return <span className={`badge ${v.cls}`}>{v.label}</span>;
}

function AdminProposalsScreen({ mobile, dispatch }) {
  const [filter, setFilter] = React.useState('all');
  const [query, setQuery] = React.useState('');
  const filtered = PROPOSALS.filter((p) => {
    if (filter !== 'all' && p.status !== filter) return false;
    if (query && !p.name.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="app">
      <AdminTopbar mobile={mobile} dispatch={dispatch} route="admin-proposals" />
      <div className="content">
        <div className="container container--wide">
          <div className="row row--between" style={{ marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
            <h1 className="h1">Propuestas</h1>
            <button className="btn btn--primary">
              <IconPlus size={16} /> Nueva propuesta
            </button>
          </div>

          <div className="row" style={{ marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
            <div className="row" style={{ position: 'relative', flex: '1 1 240px' }}>
              <IconSearch size={16} style={{ position: 'absolute', left: 12, color: 'var(--color-text-muted)' }} />
              <input className="input" placeholder="Buscar por nombre…"
                     style={{ paddingLeft: 36 }} value={query}
                     onChange={(e) => setQuery(e.target.value)} />
            </div>
            <div className="tabs">
              <button aria-selected={filter === 'all'}      onClick={() => setFilter('all')}>Todas <span className="muted">· {PROPOSALS.length}</span></button>
              <button aria-selected={filter === 'votable'}  onClick={() => setFilter('votable')}>Votables</button>
              <button aria-selected={filter === 'excluded'} onClick={() => setFilter('excluded')}>Excluidas</button>
              <button aria-selected={filter === 'merged_parent'} onClick={() => setFilter('merged_parent')}>Fusionadas</button>
            </div>
          </div>

          <table className="adm-table">
            <thead>
              <tr><th>Nombre</th><th style={{ width: 90 }}>Estado</th><th style={{ width: 80 }}>Estimación</th><th style={{ width: 120, textAlign: 'right' }}>Acciones</th></tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id}>
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// 7 · Admin / Merge
// ──────────────────────────────────────────────────────────────────────────
function AdminMergeScreen({ mobile, dispatch }) {
  const [selected, setSelected] = React.useState(['p4', 'p10']);
  const [name, setName] = React.useState('Sistema unificado de observabilidad');
  const [desc, setDesc] = React.useState(
    'Combinar métricas por endpoint y feature flags en una plataforma de observabilidad y configuración en runtime.');
  const toggle = (id) => setSelected((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);
  const canMerge = selected.length >= 2;

  return (
    <div className="app">
      <AdminTopbar mobile={mobile} dispatch={dispatch} route="admin-merge" />
      <div className="content">
        <div className="container container--wide">
          <h1 className="h1" style={{ marginBottom: 6 }}>Fusionar propuestas</h1>
          <p className="muted" style={{ marginBottom: 24, fontSize: 14 }}>
            Selecciona dos o más propuestas y define el resultado de la fusión. Quedará una sola "padre" con las hijas archivadas.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : '1fr 1fr', gap: 24, alignItems: 'start' }}>
            <section>
              <div className="field-label" style={{ marginBottom: 8 }}>Selección · {selected.length} marcadas</div>
              <div className="stack-2">
                {PROPOSALS.filter((p) => p.status === 'votable').slice(0, 7).map((p) => {
                  const on = selected.includes(p.id);
                  return (
                    <label key={p.id} className={`card ${on ? 'card--scored' : ''}`}
                           style={{ padding: 12, display: 'flex', gap: 12, alignItems: 'flex-start', cursor: 'pointer' }}>
                      <input type="checkbox" checked={on} onChange={() => toggle(p.id)}
                             style={{ marginTop: 3, accentColor: 'var(--color-primary)' }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 500 }}>{p.name}</div>
                        <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>{p.desc.slice(0, 80)}…</div>
                      </div>
                      <span className="badge">{p.estimate}</span>
                    </label>
                  );
                })}
              </div>
            </section>

            <section style={{ position: 'sticky', top: 0 }}>
              <div className="card" style={{ padding: 20 }}>
                <div className="field-label" style={{ marginBottom: 12 }}>Propuesta resultante</div>
                <div className="field" style={{ marginBottom: 12 }}>
                  <label className="field-label">Nombre</label>
                  <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="field">
                  <label className="field-label">Descripción</label>
                  <textarea className="input" value={desc} onChange={(e) => setDesc(e.target.value)} />
                </div>
                <div className="divider" />
                <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 12 }}>
                  Las {selected.length || 0} propuestas seleccionadas quedarán archivadas y enlazadas como hijas.
                </div>
                <div className="row row--end" style={{ gap: 8 }}>
                  <button className="btn btn--secondary">Cancelar</button>
                  <button className="btn btn--primary" disabled={!canMerge}>
                    <IconMerge size={14} /> Fusionar
                  </button>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// 8 · Admin / Period
// ──────────────────────────────────────────────────────────────────────────
function AdminPeriodScreen({ mobile, dispatch }) {
  const [confirm, setConfirm] = React.useState(null); // 'close' | 'reset'
  const [resetText, setResetText] = React.useState('');
  const currentStatus = 'open'; // demostración

  return (
    <div className="app">
      <AdminTopbar mobile={mobile} dispatch={dispatch} route="admin-period" />
      <div className="content">
        <div className="container container--wide">
          <h1 className="h1" style={{ marginBottom: 6 }}>Control de periodo</h1>
          <p className="muted" style={{ marginBottom: 24, fontSize: 14 }}>
            Periodo actual: <b className="mono">Q3 2026 · Round 3</b>{' '}
            <span className="badge badge--success" style={{ marginLeft: 8 }}>Abierto</span>
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : 'repeat(3, 1fr)', gap: 16 }}>
            <div className="card" style={{ padding: 20 }}>
              <div className="row" style={{ marginBottom: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--color-primary-soft)', color: 'var(--color-primary)', display: 'grid', placeItems: 'center' }}><IconPlay size={18} /></div>
                <div className="h3">Abrir</div>
              </div>
              <p className="muted" style={{ fontSize: 13, marginBottom: 16 }}>Habilita el voto para los empleados. Genera entrada en auditoría.</p>
              <button className="btn btn--primary btn--block" disabled>Ya está abierto</button>
            </div>

            <div className="card" style={{ padding: 20 }}>
              <div className="row" style={{ marginBottom: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--color-warning-soft)', color: 'var(--color-warning-text)', display: 'grid', placeItems: 'center' }}><IconLock size={18} /></div>
                <div className="h3">Cerrar</div>
              </div>
              <p className="muted" style={{ fontSize: 13, marginBottom: 16 }}>Bloquea el envío de papeletas y publica los resultados.</p>
              <button className="btn btn--secondary btn--block" onClick={() => setConfirm('close')}>Cerrar periodo</button>
            </div>

            <div className="card" style={{ padding: 20, borderColor: 'var(--color-danger-soft)' }}>
              <div className="row" style={{ marginBottom: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--color-danger-soft)', color: 'var(--color-danger)', display: 'grid', placeItems: 'center' }}><IconRefresh size={18} /></div>
                <div className="h3">Reset</div>
              </div>
              <p className="muted" style={{ fontSize: 13, marginBottom: 16 }}>Borra todos los votos del periodo actual. Acción irreversible.</p>
              <button className="btn btn--danger btn--block" onClick={() => setConfirm('reset')}>Reset</button>
            </div>
          </div>

          <div className="card" style={{ padding: 20, marginTop: 24 }}>
            <div className="h3" style={{ marginBottom: 12 }}>Métricas del periodo</div>
            <div style={{ display: 'grid', gridTemplateColumns: mobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 16 }}>
              {[
                { l: 'Votantes',     v: '32',  s: '/ 48 elegibles' },
                { l: 'Participación',v: '67%', s: '+12 vs R2' },
                { l: 'Propuestas',   v: '24',  s: 'votables' },
                { l: 'Abre desde',   v: '3d',  s: '21h', mono: true },
              ].map((m, i) => (
                <div key={i}>
                  <div className="field-label" style={{ marginBottom: 4 }}>{m.l}</div>
                  <div className={m.mono ? 'mono' : ''} style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em' }}>{m.v}</div>
                  <div className="muted" style={{ fontSize: 12 }}>{m.s}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {confirm === 'close' && (
        <div className="modal-veil"><div className="modal">
          <h3 className="h3">¿Cerrar el periodo?</h3>
          <p>Al cerrar, ningún empleado podrá enviar más papeletas. Los resultados se publicarán automáticamente.</p>
          <div className="row row--end" style={{ gap: 8 }}>
            <button className="btn btn--secondary" onClick={() => setConfirm(null)}>Cancelar</button>
            <button className="btn btn--primary" onClick={() => setConfirm(null)}>Sí, cerrar</button>
          </div>
        </div></div>
      )}
      {confirm === 'reset' && (
        <div className="modal-veil"><div className="modal">
          <h3 className="h3">Reset del periodo</h3>
          <p>Esto borra <b>todos los votos</b> del periodo actual. Escribe <span className="mono">RESET</span> para confirmar.</p>
          <input className="input" value={resetText} onChange={(e) => setResetText(e.target.value)}
                 placeholder="RESET" style={{ marginBottom: 16 }} />
          <div className="row row--end" style={{ gap: 8 }}>
            <button className="btn btn--secondary" onClick={() => { setResetText(''); setConfirm(null); }}>Cancelar</button>
            <button className="btn btn--danger" disabled={resetText !== 'RESET'}
                    onClick={() => { setResetText(''); setConfirm(null); }}>Borrar todos los votos</button>
          </div>
        </div></div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// 9 · Admin / AuditLog
// ──────────────────────────────────────────────────────────────────────────
function AdminAuditScreen({ mobile, dispatch }) {
  return (
    <div className="app">
      <AdminTopbar mobile={mobile} dispatch={dispatch} route="admin-audit" />
      <div className="content">
        <div className="container container--wide">
          <h1 className="h1" style={{ marginBottom: 6 }}>Auditoría</h1>
          <p className="muted" style={{ marginBottom: 20, fontSize: 14 }}>
            Registro cronológico de todas las acciones administrativas. Sólo lectura.
          </p>
          <div className="row" style={{ marginBottom: 12, gap: 8, flexWrap: 'wrap' }}>
            <select className="input" style={{ width: 'auto', height: 36 }} defaultValue="">
              <option value="">Todos los admins</option>
              <option>maria@phicus.es</option>
              <option>alvaro@phicus.es</option>
            </select>
            <select className="input" style={{ width: 'auto', height: 36 }} defaultValue="">
              <option value="">Todas las acciones</option>
              <option>Apertura/cierre</option>
              <option>CRUD propuestas</option>
              <option>Fusiones</option>
            </select>
          </div>
          <table className="adm-table">
            <thead>
              <tr><th style={{ width: 150 }}>Cuándo</th><th style={{ width: 180 }}>Admin</th><th>Acción</th><th>Target</th><th>Diff</th></tr>
            </thead>
            <tbody>
              {AUDIT_LOG.map((row, i) => (
                <tr key={i}>
                  <td className="mono tabular" style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{row.ts}</td>
                  <td className="mono" style={{ fontSize: 12 }}>{row.admin}</td>
                  <td>{row.action}</td>
                  <td style={{ color: 'var(--color-text-secondary)' }}>{row.target}</td>
                  <td className="mono" style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{row.diff}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// 10 · 404 / Error
// ──────────────────────────────────────────────────────────────────────────
function ErrorScreen({ mobile, dispatch }) {
  return (
    <div className="app">
      <Topbar mobile={mobile} hidePelea />
      <div className="content">
        <div className="state-illo state-illo--neutral">
          <div className="ic"><IconHelp size={28} /></div>
          <h2 className="h2">Por aquí no hay nada</h2>
          <p>Esta página no existe — o quizá la fusionamos por error. <span aria-hidden="true">🐔</span></p>
          <div style={{ marginTop: 24 }}>
            <button className="btn btn--primary"
                    onClick={() => dispatch({ type: 'goto', route: 'vote' })}>
              Volver a votar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, {
  LoginScreen, VoteScreen, AlreadyVotedScreen, PeriodScreen,
  ResultsScreen, AdminProposalsScreen, AdminMergeScreen,
  AdminPeriodScreen, AdminAuditScreen, ErrorScreen,
  PeriodBanner, ProposalCard,
});
