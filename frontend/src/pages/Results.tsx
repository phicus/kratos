import { useEffect, useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { Button } from '../components/ui/Button';
import { RankingRow } from '../components/RankingRow';
import { useToast } from '../components/ui/Toast';
import { admin, getResults } from '../api/endpoints';
import type { Me, Ranking } from '../api/types';

interface Props {
  me: Me | null;
}

export function Results({ me }: Props) {
  const [ranking, setRanking] = useState<Ranking | null>(null);
  const [loading, setLoading] = useState(true);
  const { push } = useToast();

  useEffect(() => {
    getResults()
      .then(setRanking)
      .catch((e) => push('error', e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false));
  }, [push]);

  const downloadCsv = async () => {
    try {
      const resp = await admin.downloadResultsCsv();
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'resultados.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      push('error', err instanceof Error ? err.message : String(err));
    }
  };

  if (loading) {
    return (
      <AppShell me={me}>
        <div className="flex items-center gap-2 text-fg-muted py-8 justify-center">
          <Loader2 className="w-4 h-4 animate-spin" /> Cargando resultados…
        </div>
      </AppShell>
    );
  }

  if (!ranking) {
    return (
      <AppShell me={me}>
        <p className="text-fg-muted">No hay resultados disponibles.</p>
      </AppShell>
    );
  }

  const max = ranking.entries.reduce((m, e) => Math.max(m, e.total_score), 0);

  return (
    <AppShell me={me}>
      <div className="space-y-5">
        <header className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-semibold">Ranking final</h1>
            <p className="text-fg-secondary mt-1 text-sm">
              Ordenadas por suma de puntos. {ranking.entries.length} propuestas votables.
            </p>
          </div>
          {me?.is_admin && (
            <Button variant="secondary" onClick={downloadCsv}>
              <Download className="w-4 h-4" /> Descargar CSV
            </Button>
          )}
        </header>
        <div className="space-y-2">
          {ranking.entries.map((entry, idx) => (
            <RankingRow key={entry.proposal_id} entry={entry} rank={idx + 1} maxScore={max} />
          ))}
        </div>
      </div>
    </AppShell>
  );
}
