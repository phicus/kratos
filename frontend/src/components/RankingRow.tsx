import type { RankingEntry } from '../api/types';

interface Props {
  entry: RankingEntry;
  rank: number;
  maxScore: number;
}

export function RankingRow({ entry, rank, maxScore }: Props) {
  const isTop = rank <= 3;
  const pct = maxScore > 0 ? Math.round((entry.total_score / maxScore) * 100) : 0;
  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-card border ${
        isTop ? 'border-primary/30 bg-primary-soft' : 'border-border bg-surface'
      }`}
    >
      <div
        className={`shrink-0 w-10 text-center font-display font-semibold tabular ${
          isTop ? 'text-2xl text-primary-soft-text' : 'text-lg text-fg-muted'
        }`}
        aria-label={`Posición ${rank}`}
      >
        #{rank}
      </div>
      <div className="flex-1 min-w-0">
        <div className={`font-medium ${isTop ? 'text-fg' : 'text-fg-secondary'}`}>{entry.name}</div>
        <div className="mt-1 h-1.5 bg-surface-sunken rounded-pill overflow-hidden" aria-hidden>
          <div className="h-full bg-primary/60 rounded-pill" style={{ width: `${pct}%` }} />
        </div>
      </div>
      <div className="shrink-0 text-right">
        <div className="font-mono tabular text-lg font-semibold text-fg">{entry.total_score}</div>
        <div className="text-xs text-fg-muted">pts</div>
      </div>
    </div>
  );
}
