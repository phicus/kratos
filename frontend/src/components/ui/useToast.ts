import { useCallback, useContext } from 'react';
import { ToastContext } from './toast-context';

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}

export function useToastOnError() {
  const { push } = useToast();
  return useCallback(
    (err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      push('error', msg);
    },
    [push],
  );
}
