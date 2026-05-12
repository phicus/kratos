import { useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface Props {
  votersCount: number;
  expectedQuorum: number | null;
  onQuorumChange: (n: number | null) => void | Promise<void>;
}

export function ParticipationProgress({ votersCount, expectedQuorum, onQuorumChange }: Props) {
  const [draft, setDraft] = useState<string>(expectedQuorum !== null ? String(expectedQuorum) : '');
  const [saving, setSaving] = useState(false);

  const onSave = async () => {
    setSaving(true);
    try {
      const value = draft.trim() === '' ? null : Number(draft);
      if (value !== null && (!Number.isInteger(value) || value < 1)) return;
      await onQuorumChange(value);
    } finally {
      setSaving(false);
    }
  };

  const pct =
    expectedQuorum && expectedQuorum > 0
      ? Math.min(100, Math.round((votersCount / expectedQuorum) * 100))
      : 0;

  return (
    <div className="part-progress-card">
      {expectedQuorum && expectedQuorum > 0 ? (
        <>
          <div className="part-progress-num">
            {votersCount}
            <small>/ {expectedQuorum} papeletas</small>
          </div>
          <div
            className="part-progress-bar"
            role="progressbar"
            aria-valuenow={votersCount}
            aria-valuemin={0}
            aria-valuemax={expectedQuorum}
            aria-label={`${votersCount} de ${expectedQuorum} papeletas emitidas`}
          >
            <i style={{ width: `${pct}%` }} />
            <span className="part-progress-pct">{pct}%</span>
          </div>
          <p className="part-progress-sub">
            {expectedQuorum - votersCount === 0 ? (
              '¡Todas las personas han votado!'
            ) : (
              <>
                <strong className="text-fg">{Math.max(0, expectedQuorum - votersCount)}</strong>{' '}
                personas todavía no han votado.
              </>
            )}
          </p>
          <div className="part-quorum-row">
            <label htmlFor="quorum-edit">Aforo esperado:</label>
            <Input
              id="quorum-edit"
              type="number"
              min={1}
              className="w-24"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />
            <Button variant="secondary" size="sm" onClick={onSave} disabled={saving}>
              {saving ? 'Guardando…' : 'Guardar'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setDraft('');
                void onQuorumChange(null);
              }}
              disabled={saving}
            >
              Limpiar
            </Button>
          </div>
        </>
      ) : (
        <>
          <div className="part-progress-num">
            {votersCount}
            <small> papeletas emitidas</small>
          </div>
          <div
            className="part-quorum-row"
            style={{ marginTop: 16, borderTop: 'none', paddingTop: 0 }}
          >
            <label htmlFor="quorum-edit">Aforo esperado:</label>
            <Input
              id="quorum-edit"
              type="number"
              min={1}
              className="w-24"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="48"
            />
            <Button onClick={onSave} disabled={saving || draft.trim() === ''} size="sm">
              {saving ? 'Guardando…' : 'Guardar'}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
