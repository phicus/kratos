import { useCallback, useRef, type KeyboardEvent } from 'react';

interface Props {
  value: number | null;
  onChange: (n: number) => void;
  ariaLabel: string;
  disabled?: boolean;
}

const SCORES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

export function ScoreSelectorChips({ value, onChange, ariaLabel, disabled }: Props) {
  const buttonsRef = useRef<Array<HTMLButtonElement | null>>([]);

  const onKey = useCallback(
    (e: KeyboardEvent<HTMLButtonElement>, idx: number) => {
      let target = idx;
      if (e.key === 'ArrowRight') target = (idx + 1) % SCORES.length;
      else if (e.key === 'ArrowLeft') target = (idx - 1 + SCORES.length) % SCORES.length;
      else if (e.key === 'Home') target = 0;
      else if (e.key === 'End') target = SCORES.length - 1;
      else if (/^[1-9]$/.test(e.key)) {
        const n = Number(e.key);
        target = n - 1;
        onChange(n);
      } else if (e.key === '0') {
        target = 9;
        onChange(10);
      } else {
        return;
      }
      e.preventDefault();
      buttonsRef.current[target]?.focus();
    },
    [onChange],
  );

  return (
    <div role="radiogroup" aria-label={ariaLabel} className="flex flex-wrap gap-1.5">
      {SCORES.map((n, idx) => {
        const selected = value === n;
        return (
          <button
            key={n}
            ref={(el) => (buttonsRef.current[idx] = el)}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            tabIndex={selected || (!value && n === 1) ? 0 : -1}
            onClick={() => onChange(n)}
            onKeyDown={(e) => onKey(e, idx)}
            className={[
              'inline-flex items-center justify-center',
              'min-w-[2.25rem] h-9 px-2 text-sm font-medium rounded-pill',
              'border transition-colors duration-fast ease-out tabular',
              selected
                ? 'bg-primary text-primary-fg border-primary'
                : 'bg-surface text-fg-secondary border-border hover:bg-surface-sunken hover:border-border-strong',
              'disabled:opacity-50 disabled:cursor-not-allowed',
            ].join(' ')}
          >
            {n}
          </button>
        );
      })}
    </div>
  );
}
