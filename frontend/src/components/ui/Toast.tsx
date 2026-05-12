import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { CheckCircle2, AlertCircle, XCircle } from 'lucide-react';

type ToastTone = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  tone: ToastTone;
  message: string;
}

interface ToastContextValue {
  push: (tone: ToastTone, message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((tone: ToastTone, message: string) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, tone, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);
  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div className="fixed top-4 right-4 z-toast flex flex-col gap-2 max-w-sm">
        {toasts.map((t) => (
          <ToastView key={t.id} toast={t} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastView({ toast }: { toast: Toast }) {
  const Icon = toast.tone === 'success' ? CheckCircle2 : toast.tone === 'error' ? XCircle : AlertCircle;
  const cls =
    toast.tone === 'success'
      ? 'bg-success-soft text-success-text border-success/20'
      : toast.tone === 'error'
        ? 'bg-danger-soft text-danger-text border-danger/30'
        : 'bg-primary-soft text-primary-soft-text border-primary/20';
  return (
    <div className={`flex items-start gap-2 px-3 py-2 rounded-card border shadow-md ${cls}`} role="alert">
      <Icon className="w-4 h-4 mt-0.5 shrink-0" />
      <div className="text-sm">{toast.message}</div>
    </div>
  );
}

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

export { useEffect };
