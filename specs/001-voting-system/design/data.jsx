// data.jsx — datos de muestra (propuestas, ranking, audit log)
// Tono: profesional con guiños sutiles. Empresa interna española.

const PROPOSALS = [
  { id: 'p1',  name: 'Refactor del login con OAuth2',
    desc: 'Migrar el login propio a Google OAuth completo y unificar permisos con el directorio interno.',
    how:  'Sustituir la sesión basada en cookies por flujo PKCE + roles desde Google Workspace. Estimamos 2 sprints incluyendo migración de usuarios.',
    estimate: '8d', status: 'votable' },
  { id: 'p2',  name: 'Centralizar documentación en Notion',
    desc: 'Tenemos READMEs en cuatro repos, una wiki, y una carpeta de Drive. Consolidar en un único índice.',
    how:  'Auditoría inicial de qué se queda, qué se archiva. Bot de Slack para "qué dice el manual de X".',
    estimate: '5d', status: 'votable' },
  { id: 'p3',  name: 'Onboarding nuevo de ingeniería',
    desc: 'Que un dev nuevo entre en jueves y el lunes tenga su primer PR mergeado, sin perseguir a nadie.',
    how:  'Checklist con accesos pre-aprovisionados, buddy asignado, primer ticket "good first issue" listo.',
    estimate: '12d', status: 'votable' },
  { id: 'p4',  name: 'Métricas de rendimiento por endpoint',
    desc: 'p95, p99 y tasa de error por endpoint, no por servicio. Necesario para SLOs reales.',
    how:  'Histograma en OpenTelemetry, dashboard en Grafana, alerta cuando p99 > 800ms 5min.',
    estimate: '6d', status: 'votable' },
  { id: 'p5',  name: 'Sustituir Jenkins por GitHub Actions',
    desc: 'Mantenemos Jenkins por inercia. Coste de operación alto y CI rara cuando se rompe.',
    how:  'Migrar pipelines a workflows reusables; runners self-hosted para builds pesadas.',
    estimate: '15d', status: 'votable' },
  { id: 'p6',  name: 'Pruebas E2E en preview deploys',
    desc: 'Hoy Playwright corre sólo en main. Que cada PR tenga su preview con E2E verde antes de revisar.',
    how:  'Vercel-style preview por PR + matriz de E2E. Cache de browsers en runners.',
    estimate: '7d', status: 'votable' },
  { id: 'p7',  name: 'Café decente en la cocina',
    desc: 'La máquina actual ha visto cosas. Renovar a una cafetera de buen grano.',
    how:  'Pedir tres presupuestos. Encuesta corta de marca preferida. Calendario rotatorio para limpieza.',
    estimate: '2d', status: 'votable' },
  { id: 'p8',  name: 'Día de "deuda técnica" mensual',
    desc: 'Un viernes al mes dedicado exclusivamente a deuda: refactors, tests pendientes, docs.',
    how:  'Backlog específico etiquetado. Sin reuniones. Demo corta al final del día.',
    estimate: '0d', status: 'votable' },
  { id: 'p9',  name: 'Reducir reuniones recurrentes',
    desc: 'Auditar todas las recurrentes, eliminar las que ya no aportan, fusionar las solapadas.',
    how:  'Lista pública, dueño por reunión, criterio "¿qué decisión salió hoy?" como filtro.',
    estimate: '3d', status: 'votable' },
  { id: 'p10', name: 'Sistema de feature flags propio',
    desc: 'Acoplados a config en YAML que requiere deploy. Queremos toggles en tiempo real con segmentación.',
    how:  'Servicio interno simple sobre Redis + SDK para front/back. Auditoría de cambios.',
    estimate: '10d', status: 'merged_parent' },
  { id: 'p11', name: 'Reescribir API legacy en PHP',
    desc: 'Propuesta de migrar la API antigua a Node.',
    how:  'Demasiado coste/beneficio. Excluida del periodo actual.',
    estimate: '40d', status: 'excluded' },
  { id: 'p12', name: 'Backup automático de bases de datos',
    desc: 'Snapshots diarios + retención 30 días + restore drill mensual.',
    how:  'Lambda + S3 con cifrado server-side. Drill cronometrado.',
    estimate: '4d', status: 'votable' },
];

const VOTABLE = PROPOSALS.filter((p) => p.status === 'votable');

// Resultados (ranking de un periodo cerrado anterior)
const RESULTS = [
  { id: 'r1', name: 'Centralizar documentación en Notion',  sum: 412, voters: 47 },
  { id: 'r2', name: 'Métricas de rendimiento por endpoint', sum: 388, voters: 47 },
  { id: 'r3', name: 'Onboarding nuevo de ingeniería',       sum: 366, voters: 47 },
  { id: 'r4', name: 'Día de deuda técnica mensual',         sum: 342, voters: 47 },
  { id: 'r5', name: 'Pruebas E2E en preview deploys',       sum: 318, voters: 47 },
  { id: 'r6', name: 'Refactor del login con OAuth2',        sum: 297, voters: 47 },
  { id: 'r7', name: 'Reducir reuniones recurrentes',        sum: 281, voters: 47 },
  { id: 'r8', name: 'Backup automático de bases de datos',  sum: 264, voters: 47 },
  { id: 'r9', name: 'Café decente en la cocina',            sum: 251, voters: 47 },
  { id: 'r10',name: 'Sustituir Jenkins por GitHub Actions', sum: 229, voters: 47 },
];

const AUDIT_LOG = [
  { ts: '2026-05-11 09:42', admin: 'maria@phicus.es',   action: 'Periodo abierto',      target: 'Q3 2026 · R3', diff: '—' },
  { ts: '2026-05-11 09:38', admin: 'alvaro@phicus.es', action: 'Propuesta excluida',   target: 'Reescribir API en PHP', diff: 'status: votable → excluded' },
  { ts: '2026-05-10 17:12', admin: 'maria@phicus.es',   action: 'Fusión',               target: 'Feature flags propio',  diff: '2 propuestas fusionadas' },
  { ts: '2026-05-10 16:55', admin: 'maria@phicus.es',   action: 'Propuesta creada',     target: 'Backup automático de BBDD', diff: '+ propuesta' },
  { ts: '2026-05-09 11:20', admin: 'alvaro@phicus.es', action: 'Propuesta editada',    target: 'Pruebas E2E en preview', diff: 'estimate: 5d → 7d' },
  { ts: '2026-05-08 09:15', admin: 'maria@phicus.es',   action: 'Periodo cerrado',      target: 'Q3 2026 · R2', diff: '—' },
];

Object.assign(window, { PROPOSALS, VOTABLE, RESULTS, AUDIT_LOG });
