import { useEffect, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { useToast } from '../../components/ui/Toast';
import { admin } from '../../api/endpoints';
import type { AuditEntry } from '../../api/types';

const ACTION_VARIANTS: Record<string, 'primary' | 'success' | 'warning' | 'danger' | 'neutral'> = {
  PERIOD_OPEN: 'primary',
  PERIOD_CLOSE: 'warning',
  PERIOD_RESET: 'danger',
  PROPOSAL_CREATE: 'success',
  PROPOSAL_EDIT: 'neutral',
  PROPOSAL_EXCLUDE: 'warning',
  PROPOSAL_RESTORE: 'success',
  PROPOSAL_MERGE: 'primary',
  PROPOSAL_UNMERGE: 'neutral',
  RESULTS_EXPORT: 'neutral',
  CSV_IMPORT: 'success',
};

export function AdminAuditLog() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { push } = useToast();

  useEffect(() => {
    admin
      .listAudit(500)
      .then(setEntries)
      .catch((e) => push('error', e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false));
  }, [push]);

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-display text-2xl font-semibold">Auditoría administrativa</h1>
        <p className="text-sm text-fg-secondary mt-1">
          Append-only · sin correlación con papeletas (Principio V).
        </p>
      </header>
      {loading ? (
        <p className="text-fg-muted">Cargando…</p>
      ) : entries.length === 0 ? (
        <p className="text-fg-muted">Sin acciones administrativas registradas.</p>
      ) : (
        <Card className="divide-y divide-border">
          {entries.map((e, idx) => (
            <div key={idx} className="p-3 flex items-start gap-3 text-sm">
              <div className="font-mono text-xs text-fg-muted shrink-0 mt-0.5 w-32">
                {e.occurred_at}
              </div>
              <Badge variant={ACTION_VARIANTS[e.action] ?? 'neutral'}>{e.action}</Badge>
              <div className="flex-1 min-w-0">
                <div className="text-fg-secondary">
                  {e.admin_email}
                  {e.target_ids && e.target_ids.length > 0 && (
                    <span className="text-fg-muted">
                      {' '}
                      · targets: <code className="font-mono">{e.target_ids.join(', ')}</code>
                    </span>
                  )}
                </div>
                {e.details && Object.keys(e.details).length > 0 && (
                  <pre className="mt-1 text-xs text-fg-muted bg-surface-sunken rounded-control p-2 overflow-x-auto">
                    {JSON.stringify(e.details, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
