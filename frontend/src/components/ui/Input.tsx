import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}
interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {}

const BASE =
  'form-input w-full px-3 text-base bg-surface text-fg placeholder:text-fg-muted border-border rounded-control focus:border-primary focus:ring-2 focus:ring-focus focus:ring-offset-0';

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className = '', ...rest },
  ref,
) {
  return <input ref={ref} className={`${BASE} h-10 ${className}`} {...rest} />;
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className = '', rows = 3, ...rest },
  ref,
) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={`form-textarea ${BASE} py-2 ${className}`}
      {...rest}
    />
  );
});

interface LabelProps {
  htmlFor?: string;
  children: React.ReactNode;
  required?: boolean;
}

export function Label({ htmlFor, children, required }: LabelProps) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-fg mb-1.5">
      {children}
      {required && <span className="text-danger ml-0.5">*</span>}
    </label>
  );
}
