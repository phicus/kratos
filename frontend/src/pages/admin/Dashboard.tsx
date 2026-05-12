import { useNavigate } from 'react-router-dom';
import type { ComponentType } from 'react';
import type { LucideProps } from 'lucide-react';
import { ActionCardContextual, type ActionId } from '../../components/admin/ActionCardContextual';
import { MetricCard } from '../../components/admin/MetricCard';
import { RecentAuditList } from '../../components/admin/RecentAuditList';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../components/ui/useToast';
import { useDashboardData } from '../../hooks/useDashboardData';
import {
  IconChevronRight,
  IconClipboardList,
  IconClock,
  IconEyeOff,
  IconLock,
  IconMerge,
  IconPlay,
  IconVote,
} from '../../components/admin/iconMap';
import type { PeriodState } from '../../api/types';
import { admin as adminApi } from '../../api/endpoints';

const HERO_COPY: Record<
  PeriodState,
  { title: string; sub: string; quote: string; tag: string; icon: ComponentType<LucideProps> }
> = {
  preparacion: {
    title: 'Periodo en preparación',
    sub: 'La votación todavía no está abierta.',
    quote: 'Importa las propuestas, ajústalas y abre la votación cuando esté lista.',
    tag: 'PREP',
    icon: IconClock,
  },
  abierto: {
    title: 'Periodo abierto',
    sub: 'Los empleados están emitiendo papeleta.',
    quote: 'Consulta la participación o cierra la votación cuando todos hayan votado.',
    tag: 'OPEN',
    icon: IconPlay,
  },
  cerrado: {
    title: 'Periodo cerrado',
    sub: 'Ranking publicado.',
    quote: 'Descarga el CSV o reinicia para una nueva votación.',
    tag: 'DONE',
    icon: IconLock,
  },
};

const ROUTE_FOR_ACTION: Record<ActionId, string> = {
  import: '/admin/proposals',
  create: '/admin/proposals',
  merge: '/admin/merge',
  open: '/admin/period',
  close: '/admin/period',
  reset: '/admin/period',
  part: '/admin/participation',
  audit: '/admin/audit',
  ranking: '/results',
  csv: '/results',
};

export function Dashboard() {
  const { data, loading, error } = useDashboardData();
  const navigate = useNavigate();
  const { push } = useToast();

  if (loading && !data) {
    return <p className="text-fg-muted">Cargando dashboard…</p>;
  }
  if (error && !data) {
    return <p className="text-danger">{error}</p>;
  }
  if (!data) return null;

  const state = data.period.state;
  const hero = HERO_COPY[state];
  const HeroIcon = hero.icon;
  const c = data.counters;

  const onAction = (id: ActionId) => {
    if (id === 'csv') {
      void (async () => {
        try {
          const resp = await adminApi.downloadResultsCsv();
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
      })();
      return;
    }
    navigate(ROUTE_FOR_ACTION[id]);
  };

  return (
    <div className="space-y-5">
      <h1 className="font-display text-2xl sm:text-3xl font-semibold">Dashboard</h1>

      <section className={`adm-hero adm-hero--${state}`} aria-label="Estado del periodo">
        <div className="adm-hero-icon">
          <HeroIcon size={28} />
        </div>
        <div>
          <h2 className="adm-hero-title">{hero.title}</h2>
          <div className="adm-hero-sub">{hero.sub}</div>
          <div className="adm-hero-quote">{hero.quote}</div>
        </div>
        <div className="adm-hero-cta flex flex-col items-end gap-2">
          <span className="adm-hero-tag">{hero.tag}</span>
          {state === 'abierto' && (
            <Button variant="secondary" size="sm" onClick={() => navigate('/admin/participation')}>
              Ver participación
              <IconChevronRight size={14} />
            </Button>
          )}
        </div>
      </section>

      <section className="adm-metrics" aria-label="Métricas">
        <MetricCard
          counter={c.votable}
          label="Propuestas votables"
          sub="estado · votable"
          icon={IconClipboardList}
          onClick={() => navigate('/admin/proposals')}
        />
        <MetricCard
          counter={c.excluded}
          label="Excluidas"
          sub="no votables"
          icon={IconEyeOff}
          onClick={() => navigate('/admin/proposals')}
        />
        <MetricCard
          counter={c.merged_parent}
          label="Padres de fusión"
          sub="originadas de varias"
          icon={IconMerge}
          onClick={() => navigate('/admin/merge')}
        />
        {state !== 'preparacion' ? (
          <MetricCard
            counter={c.ballots_cast}
            label="Papeletas emitidas"
            sub={
              state === 'abierto' && data.period.expected_quorum
                ? `de ${data.period.expected_quorum} · ${Math.min(
                    100,
                    Math.round((c.ballots_cast / data.period.expected_quorum) * 100),
                  )}%`
                : state === 'cerrado'
                  ? 'cierre · final'
                  : undefined
            }
            icon={IconVote}
            onClick={() => navigate(state === 'abierto' ? '/admin/participation' : '/results')}
          />
        ) : (
          <MetricCard
            counter="—"
            label="Papeletas emitidas"
            sub="periodo aún no abierto"
            icon={IconVote}
            disabled
          />
        )}
      </section>

      <ActionCardContextual state={state} onAction={onAction} />

      <RecentAuditList entries={data.recent_audit} onSeeAll={() => navigate('/admin/audit')} />
    </div>
  );
}
