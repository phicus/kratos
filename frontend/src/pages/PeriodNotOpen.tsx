import { Clock } from 'lucide-react';
import { AppShell } from '../components/AppShell';
import type { Me } from '../api/types';

export function PeriodNotOpen({ me }: { me?: Me | null }) {
  return (
    <AppShell me={me}>
      <div className="flex flex-col items-center text-center gap-4 py-10">
        <div className="w-16 h-16 rounded-pill bg-warning-soft text-warning-text flex items-center justify-center">
          <Clock className="w-8 h-8" />
        </div>
        <h1 className="font-display text-2xl font-semibold">Aún no hemos abierto la votación</h1>
        <p className="text-fg-secondary max-w-md">
          Los administradores siguen revisando las propuestas. Recibirás aviso interno cuando el
          periodo se abra.
        </p>
      </div>
    </AppShell>
  );
}
