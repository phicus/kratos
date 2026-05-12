import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, Loader2 } from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { PeriodBanner } from '../components/PeriodBanner';
import { ProposalCard } from '../components/ProposalCard';
import { Button } from '../components/ui/Button';
import { ConfirmModal } from '../components/ui/Modal';
import { useToast } from '../components/ui/useToast';
import { ApiError } from '../api/client';
import { getProposals, submitBallot } from '../api/endpoints';
import type { Me, Proposal } from '../api/types';

interface Props {
  me: Me;
}

export function Vote({ me }: Props) {
  const navigate = useNavigate();
  const { push } = useToast();
  const [proposals, setProposals] = useState<Proposal[] | null>(null);
  const [scores, setScores] = useState<Record<number, number>>({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getProposals()
      .then(setProposals)
      .catch((e) => push('error', e instanceof Error ? e.message : String(e)));
  }, [push]);

  const total = proposals?.length ?? 0;
  const completed = useMemo(
    () => (proposals ? proposals.filter((p) => p.id in scores).length : 0),
    [proposals, scores],
  );
  const canSubmit = total > 0 && completed === total && !submitting;

  const onScore = (proposalId: number, n: number) =>
    setScores((prev) => ({ ...prev, [proposalId]: n }));

  const onConfirmSubmit = async () => {
    if (!proposals) return;
    setSubmitting(true);
    try {
      await submitBallot(proposals.map((p) => ({ proposal_id: p.id, score: scores[p.id] })));
      push('success', 'Papeleta registrada de forma anónima');
      navigate('/already-voted');
    } catch (err) {
      if (err instanceof ApiError && err.code === 'ALREADY_VOTED') {
        navigate('/already-voted');
        return;
      }
      const msg = err instanceof Error ? err.message : String(err);
      push('error', msg);
      setConfirmOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell me={me}>
      <div className="space-y-5 pb-28">
        <header className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-semibold">Tu papeleta</h1>
            <p className="text-fg-secondary mt-1 text-sm">
              Puntúa cada propuesta de 1 a 10. El voto es anónimo e irreversible.
            </p>
          </div>
          <div className="px-3 py-1.5 rounded-pill bg-surface-sunken text-fg-secondary text-sm font-medium tabular">
            {completed} / {total} puntuadas
          </div>
        </header>
        <PeriodBanner state="abierto" />
        {proposals === null ? (
          <div className="flex items-center gap-2 text-fg-muted py-8 justify-center">
            <Loader2 className="w-4 h-4 animate-spin" /> Cargando propuestas…
          </div>
        ) : proposals.length === 0 ? (
          <div className="text-center py-10 text-fg-muted">No hay propuestas votables.</div>
        ) : (
          <div className="space-y-4">
            {proposals.map((p) => (
              <ProposalCard
                key={p.id}
                proposal={p}
                score={scores[p.id] ?? null}
                onScore={(n) => onScore(p.id, n)}
                disabled={submitting}
              />
            ))}
          </div>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-sticky bg-surface/95 backdrop-blur border-t border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="text-sm text-fg-secondary tabular">
            <span className="font-semibold text-fg">{completed}</span> / {total} puntuadas
          </div>
          <Button
            disabled={!canSubmit}
            onClick={() => setConfirmOpen(true)}
            className="min-w-[12rem]"
          >
            <Send className="w-4 h-4" />
            Enviar papeleta
          </Button>
        </div>
      </div>

      <ConfirmModal
        open={confirmOpen}
        onClose={() => !submitting && setConfirmOpen(false)}
        onConfirm={onConfirmSubmit}
        title="¿Enviar papeleta?"
        description={
          <p className="text-fg-secondary text-sm leading-relaxed">
            Una vez enviada no podrás modificarla ni volver a votar. El sistema no asocia tus
            puntuaciones con tu identidad.
          </p>
        }
        confirmLabel="Enviar papeleta"
        loading={submitting}
      />
    </AppShell>
  );
}
