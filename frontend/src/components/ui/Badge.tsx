import type { ReactNode } from 'react';

type Variant = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'accent';

const VARIANT: Record<Variant, string> = {
  neutral: 'bg-surface-sunken text-fg-muted',
  primary: 'bg-primary-soft text-primary-soft-text',
  success: 'bg-success-soft text-success-text',
  warning: 'bg-warning-soft text-warning-text',
  danger: 'bg-danger-soft text-danger-text',
  accent: 'bg-accent-soft text-accent-soft-text',
};

interface BadgeProps {
  variant?: Variant;
  children: ReactNode;
  className?: string;
}

export function Badge({ variant = 'neutral', children, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-pill text-xs font-medium ${VARIANT[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
