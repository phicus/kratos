import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Badge } from './ui/Badge';
import { Card } from './ui/Card';
import { ScoreSelector } from './ScoreSelector';
import type { Proposal } from '../api/types';

interface Props {
  proposal: Proposal;
  score: number | null;
  onScore: (n: number) => void;
  disabled?: boolean;
}

export function ProposalCard({ proposal, score, onScore, disabled }: Props) {
  const [expanded, setExpanded] = useState(false);
  const hasScore = score !== null;
  return (
    <Card
      emphasized={hasScore}
      className={`relative overflow-hidden ${
        hasScore ? 'before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-primary' : ''
      }`}
    >
      <div className="p-4 sm:p-5 flex flex-col gap-3">
        <header className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-display font-semibold text-lg leading-tight text-fg">
              {proposal.name}
            </h3>
          </div>
          {proposal.time_estimate && (
            <Badge variant="neutral" className="font-mono">
              {proposal.time_estimate}
            </Badge>
          )}
        </header>
        <p className="text-fg-secondary text-sm leading-relaxed">{proposal.description}</p>
        {proposal.how && (
          <div>
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="inline-flex items-center gap-1 text-sm text-fg-muted hover:text-fg-secondary transition-colors"
              aria-expanded={expanded}
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              Cómo lo haríamos
            </button>
            {expanded && (
              <p className="mt-2 text-sm text-fg-secondary bg-surface-sunken rounded-control p-3 leading-relaxed">
                {proposal.how}
              </p>
            )}
          </div>
        )}
        <div className="pt-2 border-t border-border">
          <ScoreSelector
            value={score}
            onChange={onScore}
            ariaLabel={`Puntuar ${proposal.name} de 1 a 10`}
            disabled={disabled}
          />
        </div>
      </div>
    </Card>
  );
}
