import type { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  emphasized?: boolean;
  children: ReactNode;
}

export function Card({ emphasized = false, className = '', children, ...rest }: CardProps) {
  return (
    <div
      className={[
        'bg-surface rounded-card shadow-card border',
        emphasized ? 'border-border-strong' : 'border-border',
        className,
      ].join(' ')}
      {...rest}
    >
      {children}
    </div>
  );
}
