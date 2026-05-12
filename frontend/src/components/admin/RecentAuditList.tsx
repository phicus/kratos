import { Badge } from '../ui/Badge';
import type { AuditEntry } from '../../api/types';

type BadgeVariant = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'accent';

const ACTION_TO_VARIANT: Record<string, BadgeVariant> = {
  PERIOD_OPEN: 'primary',
  PERIOD_CLOSE: 'neutral',
  PERIOD_RESET: 'danger',
  PERIOD_QUORUM_SET: 'primary',
  PROPOSAL_CREATE: 'success',
  PROPOSAL_EDIT: 'neutral',
  PROPOSAL_EXCLUDE: 'warning',
  PROPOSAL_RESTORE: 'success',
  PROPOSAL_MERGE: 'primary',
  PROPOSAL_UNMERGE: 'neutral',
  PROPOSAL_BULK_EXCLUDE: 'warning',
  PROPOSAL_BULK_RESTORE: 'success',
  RESULTS_EXPORT: 'neutral',
  CSV_IMPORT: 'success',
};

function formatTimestamp(iso: string): string {
  // ISO: "2026-05-12 10:42:00" → "12/05 10:42"
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})/);
  if (!m) return iso;
  return `${m[3]}/${m[2]} ${m[4]}:${m[5]}`;
}

function summarizeTargets(targets: number[] | null): string {
  if (!targets || targets.length === 0) return '';
  if (targets.length === 1) return `p${targets[0]}`;
  if (targets.length <= 3) return targets.map((t) => `p${t}`).join(', ');
  return `${targets.length} ids`;
}

interface Props {
  entries: AuditEntry[];
  onSeeAll?: () => void;
}

export function RecentAuditList({ entries, onSeeAll }: Props) {
  const five = entries.slice(0, 5);
  return (
    <>
      <div className="adm-audit-head">
        <h3 className="font-display text-lg font-semibold text-fg">Últimas acciones</h3>
        {onSeeAll && (
          <button type="button" className="adm-audit-link" onClick={onSeeAll}>
            Ver log completo →
          </button>
        )}
      </div>
      {five.length === 0 ? (
        <p className="text-fg-muted text-sm">Aún no hay acciones registradas.</p>
      ) : (
        <ul className="adm-audit" role="list">
          {five.map((row, i) => (
            <li key={i} className="adm-audit-row" role="listitem">
              <span className="adm-audit-ts">{formatTimestamp(row.occurred_at)}</span>
              <Badge variant={ACTION_TO_VARIANT[row.action] ?? 'neutral'}>
                {row.action}
              </Badge>
              <span className="adm-audit-admin">{row.admin_email}</span>
              <span className="adm-audit-ids">{summarizeTargets(row.target_ids)}</span>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
