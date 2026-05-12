import { useNavigate } from 'react-router-dom';
import { ParticipationProgress } from '../../components/admin/ParticipationProgress';
import { VotersList } from '../../components/admin/VotersList';
import { Badge } from '../../components/ui/Badge';
import { Banner } from '../../components/ui/Banner';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import { usePeriod } from '../../hooks/usePeriod';
import { useParticipation } from '../../hooks/useParticipation';
import { admin } from '../../api/endpoints';
import {
  IconChevronLeft,
  IconClock,
  IconLock,
  IconPlay,
} from '../../components/admin/iconMap';

export function Participation() {
  const navigate = useNavigate();
  const { push } = useToast();
  const { period, reload: reloadPeriod } = usePeriod();
  const isOpen = period?.state === 'abierto';
  const { data, reload } = useParticipation(isOpen);

  if (!period) {
    return <p className="text-fg-muted">Cargando…</p>;
  }

  if (!isOpen) {
    return (
      <div className="space-y-5">
        <Button variant="ghost" size="sm" onClick={() => navigate('/admin')}>
          <IconChevronLeft size={14} />
          Dashboard
        </Button>
        <h1 className="font-display text-2xl font-semibold">Participación</h1>
        <Banner
          tone={period.state === 'preparacion' ? 'warning' : 'neutral'}
          icon={period.state === 'preparacion' ? <IconClock size={20} /> : <IconLock size={20} />}
          title="Participación no disponible"
        >
          Esta sección sólo se muestra mientras la votación está abierta. Estado actual:{' '}
          <strong>{period.state}</strong>.
        </Banner>
      </div>
    );
  }

  const onQuorumChange = async (n: number | null) => {
    try {
      await admin.setQuorum(n);
      push('success', 'Aforo actualizado');
      await Promise.all([reload(), reloadPeriod()]);
    } catch (err) {
      push('error', err instanceof Error ? err.message : String(err));
    }
  };

  const remaining =
    data && data.expected_quorum
      ? Math.max(0, data.expected_quorum - data.voters_count)
      : null;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/admin')}>
            <IconChevronLeft size={14} />
            Dashboard
          </Button>
          <h1 className="font-display text-2xl font-semibold mt-1">Participación</h1>
        </div>
        <Badge variant="success">
          <IconPlay size={11} className="inline mr-1" />
          Periodo abierto
          {remaining !== null && ` · faltan ${remaining}`}
        </Badge>
      </div>

      {data ? (
        <>
          <ParticipationProgress
            votersCount={data.voters_count}
            expectedQuorum={data.expected_quorum}
            onQuorumChange={onQuorumChange}
          />
          <VotersList voters={data.voters} />
        </>
      ) : (
        <p className="text-fg-muted">Cargando participación…</p>
      )}
    </div>
  );
}
