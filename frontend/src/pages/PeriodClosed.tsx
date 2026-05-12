import { Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { Button } from '../components/ui/Button';

export function PeriodClosed() {
  return (
    <AppShell>
      <div className="flex flex-col items-center text-center gap-4 py-10">
        <div className="w-16 h-16 rounded-pill bg-surface-sunken text-fg-muted flex items-center justify-center">
          <Lock className="w-8 h-8" />
        </div>
        <h1 className="font-display text-2xl font-semibold">Periodo cerrado</h1>
        <p className="text-fg-secondary max-w-md">
          La votación ha terminado. Consulta el ranking final con las propuestas más votadas.
        </p>
        <Link to="/results">
          <Button>Ver resultados</Button>
        </Link>
      </div>
    </AppShell>
  );
}
