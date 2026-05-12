import { Link } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { Button } from '../components/ui/Button';
import type { Me } from '../api/types';

export function NotFound({ me }: { me?: Me | null }) {
  return (
    <AppShell me={me}>
      <div className="flex flex-col items-center text-center gap-4 py-10">
        <div className="font-display text-6xl font-semibold text-fg-muted">404</div>
        <h1 className="font-display text-2xl font-semibold">Esta página no existe…</h1>
        <p className="text-fg-secondary">o quizá la fusionamos por error 🐔</p>
        <Link to="/">
          <Button variant="secondary">Volver al inicio</Button>
        </Link>
      </div>
    </AppShell>
  );
}
