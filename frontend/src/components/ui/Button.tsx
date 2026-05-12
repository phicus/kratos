import { forwardRef, type ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    'bg-primary text-primary-fg hover:bg-primary-hover active:bg-primary-active disabled:bg-fg-disabled',
  secondary: 'bg-surface border border-border text-fg hover:bg-surface-sunken disabled:opacity-50',
  danger: 'bg-danger text-white hover:brightness-95 active:brightness-90 disabled:opacity-50',
  ghost: 'bg-transparent text-fg hover:bg-surface-sunken',
};

const SIZE_CLASSES: Record<Size, string> = {
  sm: 'h-8 px-3 text-sm rounded-control',
  md: 'h-10 px-4 text-base rounded-control',
  lg: 'h-12 px-5 text-lg rounded-md',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', className = '', children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      className={[
        'inline-flex items-center justify-center gap-2 font-medium',
        'transition-colors duration-fast ease-out',
        'disabled:cursor-not-allowed disabled:opacity-50',
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        className,
      ].join(' ')}
      {...rest}
    >
      {children}
    </button>
  );
});
