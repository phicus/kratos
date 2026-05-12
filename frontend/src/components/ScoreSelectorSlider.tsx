import type { ChangeEvent } from 'react';

interface Props {
  value: number | null;
  onChange: (n: number) => void;
  ariaLabel: string;
  disabled?: boolean;
}

export function ScoreSelectorSlider({ value, onChange, ariaLabel, disabled }: Props) {
  const current = value ?? 5;
  const set = (e: ChangeEvent<HTMLInputElement>) => onChange(Number(e.target.value));
  return (
    <div className="flex items-center gap-4">
      <input
        type="range"
        min={1}
        max={10}
        step={1}
        value={current}
        onChange={set}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-valuemin={1}
        aria-valuemax={10}
        aria-valuenow={current}
        className="flex-1 accent-[var(--color-primary)] h-2"
      />
      <div
        className={`min-w-[3rem] text-center px-3 py-1 rounded-pill font-display text-2xl font-semibold tabular ${
          value === null
            ? 'bg-surface-sunken text-fg-muted'
            : 'bg-primary-soft text-primary-soft-text'
        }`}
      >
        {value ?? '–'}
      </div>
    </div>
  );
}
