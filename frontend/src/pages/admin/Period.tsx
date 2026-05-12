import { useState } from 'react';
import { PlayCircle, Lock, RefreshCw } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { ConfirmModal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import { usePeriod } from '../../hooks/usePeriod';
import { admin } from '../../api/endpoints';

type Action = 'open' | 'close' | 'reset';

export function AdminPeriod() {
  const { period, reload } = usePeriod();
  const { push } = useToast();
  const [pending, setPending] = useState<Action | null>(null);
  const [loading, setLoading] = useState(false);

  if (!period) {
    return <p className="text-fg-muted">Cargando estado…</p>;
  }

  const run = async () => {
    if (!pending) return;
    setLoading(true);
    try {
      if (pending === 'open') await admin.openPeriod();
      else if (pending === 'close') await admin.closePeriod();
      else await admin.resetPeriod();
      push('success', 'Transición aplicada');
      setPending(null);
      await reload();
    } catch (err) {
      push('error', err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const stateBadge =
    period.state === 'preparacion' ? (
      <Badge variant="warning">preparación</Badge>
    ) : period.state === 'abierto' ? (
      <Badge variant="primary">abierto</Badge>
    ) : (
      <Badge variant="neutral">cerrado</Badge>
    );

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-display text-2xl font-semibold">Periodo de votación</h1>
        <div className="mt-1 text-sm text-fg-secondary flex items-center gap-2">
          Estado actual: {stateBadge}
        </div>
      </header>
      <div className="grid sm:grid-cols-3 gap-4">
        <Card className="p-5 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <PlayCircle className="w-5 h-5 text-primary" />
            <h2 className="font-semibold">Abrir</h2>
          </div>
          <p className="text-sm text-fg-secondary">
            Habilita la emisión de papeletas. Sólo desde «preparación».
          </p>
          <Button
            disabled={period.state !== 'preparacion'}
            onClick={() => setPending('open')}
            className="mt-auto"
          >
            Abrir votación
          </Button>
        </Card>
        <Card className="p-5 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-fg-secondary" />
            <h2 className="font-semibold">Cerrar</h2>
          </div>
          <p className="text-sm text-fg-secondary">
            Bloquea nuevos votos y publica el ranking. Sólo desde «abierto».
          </p>
          <Button
            variant="secondary"
            disabled={period.state !== 'abierto'}
            onClick={() => setPending('close')}
            className="mt-auto"
          >
            Cerrar votación
          </Button>
        </Card>
        <Card className="p-5 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-danger" />
            <h2 className="font-semibold">Reiniciar</h2>
          </div>
          <p className="text-sm text-fg-secondary">
            Borra papeletas y vuelve a «preparación». <strong>Destructivo.</strong>
          </p>
          <Button
            variant="danger"
            disabled={period.state !== 'cerrado'}
            onClick={() => setPending('reset')}
            className="mt-auto"
          >
            Reiniciar
          </Button>
        </Card>
      </div>

      <ConfirmModal
        open={pending === 'open'}
        onClose={() => !loading && setPending(null)}
        onConfirm={run}
        title="¿Abrir el periodo?"
        description={
          <p className="text-fg-secondary">
            A partir de este momento los empleados podrán emitir su papeleta.
          </p>
        }
        confirmLabel="Abrir"
        loading={loading}
      />
      <ConfirmModal
        open={pending === 'close'}
        onClose={() => !loading && setPending(null)}
        onConfirm={run}
        title="¿Cerrar el periodo?"
        description={
          <p className="text-fg-secondary">
            Bloquearás cualquier nuevo voto. El ranking quedará publicado.
          </p>
        }
        confirmLabel="Cerrar"
        loading={loading}
      />
      <ConfirmModal
        open={pending === 'reset'}
        onClose={() => !loading && setPending(null)}
        onConfirm={run}
        title="¿Reiniciar la votación?"
        description={
          <div className="space-y-2">
            <p className="text-fg-secondary">
              Se borrarán todas las papeletas y receipts del ciclo actual. Esta acción no es
              reversible.
            </p>
            <p className="text-sm text-fg-muted">
              Escribe <code className="font-mono">RESET</code> para confirmar.
            </p>
          </div>
        }
        confirmLabel="Reiniciar"
        confirmPhrase="RESET"
        danger
        loading={loading}
      />
    </div>
  );
}
