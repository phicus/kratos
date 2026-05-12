import type { ReactNode } from 'react';

type Tone = 'info' | 'success' | 'warning' | 'danger' | 'neutral';

const TONES: Record<Tone, string> = {
  info: 'bg-primary-soft text-primary-soft-text border-primary/20',
  success: 'bg-success-soft text-success-text border-success/20',
  warning: 'bg-warning-soft text-warning-text border-warning/30',
  danger: 'bg-danger-soft text-danger-text border-danger/30',
  neutral: 'bg-surface-sunken text-fg-secondary border-border',
};

interface BannerProps {
  tone?: Tone;
  icon?: ReactNode;
  title?: ReactNode;
  children?: ReactNode;
  className?: string;
}

export function Banner({ tone = 'info', icon, title, children, className = '' }: BannerProps) {
  return (
    <div
      className={`flex items-start gap-3 px-4 py-3 rounded-xl border ${TONES[tone]} ${className}`}
      role="status"
    >
      {icon && <div className="shrink-0 mt-0.5">{icon}</div>}
      <div className="min-w-0 flex-1">
        {title && <div className="font-semibold">{title}</div>}
        {children && <div className="text-sm">{children}</div>}
      </div>
    </div>
  );
}
