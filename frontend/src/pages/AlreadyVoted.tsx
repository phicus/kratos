import { CheckCircle2 } from 'lucide-react';
import { AppShell } from '../components/AppShell';
import type { Me } from '../api/types';

export function AlreadyVoted({ me }: { me?: Me | null }) {
  return (
    <AppShell me={me}>
      <div className="flex flex-col items-center text-center gap-4 py-10">
        <div className="w-16 h-16 rounded-pill bg-success-soft text-success-text flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h1 className="font-display text-2xl font-semibold">Ya has votado</h1>
        <p className="text-fg-secondary max-w-md">
          Tu papeleta quedó registrada de forma anónima. Los resultados se publicarán cuando
          cierre el periodo de votación.
        </p>
      </div>
    </AppShell>
  );
}
