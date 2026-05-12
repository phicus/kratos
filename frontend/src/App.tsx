import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useMe } from './hooks/useMe';
import { usePeriod } from './hooks/usePeriod';
import { ToastProvider } from './components/ui/Toast';
import { Login } from './pages/Login';
import { Vote } from './pages/Vote';
import { AlreadyVoted } from './pages/AlreadyVoted';
import { PeriodNotOpen } from './pages/PeriodNotOpen';
import { PeriodClosed } from './pages/PeriodClosed';
import { Results } from './pages/Results';
import { NotFound } from './pages/NotFound';
import { AdminShell } from './pages/admin/AdminShell';
import { AdminPeriod } from './pages/admin/Period';
import { AdminProposals } from './pages/admin/Proposals';
import { AdminMerge } from './pages/admin/Merge';
import { AdminAuditLog } from './pages/admin/AuditLog';
import { Dashboard as AdminDashboard } from './pages/admin/Dashboard';
import { Participation as AdminParticipation } from './pages/admin/Participation';
import type { Me } from './api/types';

export default function App() {
  return (
    <ToastProvider>
      <AppRoutes />
    </ToastProvider>
  );
}

// Rutas accesibles sin sesión cuando el periodo está `cerrado` — el ranking
// es información pública una vez publicada.
const PUBLIC_RESULTS_PATHS = new Set(['/', '/results']);

function AppRoutes() {
  const { me, loading: meLoading, networkError } = useMe();
  const { period, loading: periodLoading } = usePeriod();
  const location = useLocation();

  if (meLoading || periodLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-2 text-fg-muted">
        <Loader2 className="w-5 h-5 animate-spin" />
        <div className="text-xs">Comprobando sesión…</div>
      </div>
    );
  }

  const periodClosed = period?.state === 'cerrado';
  const publicResultsAllowed = periodClosed && PUBLIC_RESULTS_PATHS.has(location.pathname);

  if (!me && location.pathname !== '/login' && !publicResultsAllowed) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname, networkError: networkError ?? undefined }}
      />
    );
  }

  return (
    <Routes>
      <Route path="/login" element={me ? <Navigate to="/" replace /> : <Login />} />

      <Route path="/" element={<HomeRouter me={me} periodClosed={periodClosed} />} />
      <Route path="/already-voted" element={<AlreadyVoted me={me} />} />
      <Route path="/period-not-open" element={<PeriodNotOpen me={me} />} />
      <Route path="/period-closed" element={<PeriodClosed me={me} />} />
      <Route path="/results" element={<Results me={me} />} />

      <Route path="/admin" element={<AdminShell me={me!} loading={meLoading} />}>
        <Route index element={<AdminDashboard />} />
        <Route path="proposals" element={<AdminProposals />} />
        <Route path="merge" element={<AdminMerge />} />
        <Route path="period" element={<AdminPeriod />} />
        <Route path="participation" element={<AdminParticipation />} />
        <Route path="audit" element={<AdminAuditLog />} />
      </Route>

      <Route path="*" element={<NotFound me={me} />} />
    </Routes>
  );
}

function HomeRouter({ me, periodClosed }: { me: Me | null; periodClosed: boolean }) {
  // Cuando el periodo está cerrado, el ranking es la página de inicio
  // para cualquiera (autenticado o no).
  if (periodClosed) return <Results me={me} />;
  // Sin sesión y periodo NO cerrado, la guarda superior ya redirigió a /login.
  if (!me) return null;
  if (me.has_voted) return <AlreadyVoted me={me} />;
  if (me.period_state === 'preparacion') return <PeriodNotOpen me={me} />;
  return <Vote me={me} />;
}
