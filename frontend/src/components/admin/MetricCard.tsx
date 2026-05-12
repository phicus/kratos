import type { ComponentType } from 'react';
import type { LucideProps } from 'lucide-react';

interface Props {
  counter: number | string;
  label: string;
  sub?: string;
  icon?: ComponentType<LucideProps>;
  onClick?: () => void;
  disabled?: boolean;
}

export function MetricCard({ counter, label, sub, icon: Icon, onClick, disabled }: Props) {
  return (
    <button type="button" className="adm-metric" onClick={onClick} disabled={disabled || !onClick}>
      <span className="adm-metric-icon" aria-hidden="true">
        {Icon ? <Icon size={14} /> : null}
      </span>
      <span className="adm-metric-num">{counter}</span>
      <span className="adm-metric-label">{label}</span>
      {sub && <span className="adm-metric-sub">{sub}</span>}
    </button>
  );
}
