import { useMemo, useState } from 'react';
import { Button } from '../ui/Button';
import {
  IconChevronLeft,
  IconChevronRight,
  IconShield,
} from './iconMap';
import type { VoterReceiptSummary } from '../../api/types';

const PAGE_SIZE = 50;

function formatTimestamp(iso: string): string {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})/);
  if (!m) return iso;
  return `${m[3]}/${m[2]} ${m[4]}:${m[5]}`;
}

interface Props {
  voters: VoterReceiptSummary[];
}

export function VotersList({ voters }: Props) {
  const [page, setPage] = useState(1);
  const pages = Math.max(1, Math.ceil(voters.length / PAGE_SIZE));
  const safePage = Math.min(page, pages);
  const items = useMemo(
    () => voters.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [voters, safePage],
  );

  return (
    <>
      <ul
        className="part-voters-list"
        role="list"
        aria-label={`Personas que ya han votado: ${voters.length}`}
      >
        <li className="part-voters-head" aria-hidden="true">
          <span>email</span>
          <span style={{ textAlign: 'right' }}>cuándo</span>
        </li>
        {items.length === 0 ? (
          <li className="part-voter" style={{ gridTemplateColumns: '1fr' }}>
            <span className="text-fg-muted">Aún nadie ha votado.</span>
          </li>
        ) : (
          items.map((v) => (
            <li
              key={v.email}
              className="part-voter"
              role="listitem"
              aria-label={`${v.email}, votó el ${formatTimestamp(v.voted_at)}`}
            >
              <span className="font-mono text-sm">{v.email}</span>
              <span className="part-voter-when">{formatTimestamp(v.voted_at)}</span>
            </li>
          ))
        )}
        {pages > 1 && (
          <li className="part-pagination" aria-hidden="true">
            <span>
              Página <strong className="tabular">{safePage}</strong> de{' '}
              <strong className="tabular">{pages}</strong> · {voters.length} votantes
            </span>
            <span className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                disabled={safePage <= 1}
                onClick={() => setPage(safePage - 1)}
              >
                <IconChevronLeft size={14} />
                Anterior
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={safePage >= pages}
                onClick={() => setPage(safePage + 1)}
              >
                Siguiente
                <IconChevronRight size={14} />
              </Button>
            </span>
          </li>
        )}
      </ul>
      <p className="part-privacy">
        <IconShield size={14} aria-hidden="true" />
        El sistema sólo registra quién ha votado, nunca qué ha votado.
      </p>
    </>
  );
}
