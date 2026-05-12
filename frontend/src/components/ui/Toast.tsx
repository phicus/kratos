import { useCallback, useState, type ReactNode } from 'react';
import { CheckCircle2, AlertCircle, XCircle } from 'lucide-react';
import { ToastContext, type ToastItem, type ToastTone } from './toast-context';

// useToast / useToastOnError viven en ./useToast para que este archivo
// exporte sólo componentes (react-refresh/only-export-components).

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
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

function ToastView({ toast }: { toast: ToastItem }) {
  const Icon =
    toast.tone === 'success' ? CheckCircle2 : toast.tone === 'error' ? XCircle : AlertCircle;
  const cls =
    toast.tone === 'success'
      ? 'bg-success-soft text-success-text border-success/20'
      : toast.tone === 'error'
        ? 'bg-danger-soft text-danger-text border-danger/30'
        : 'bg-primary-soft text-primary-soft-text border-primary/20';
  return (
    <div
      className={`flex items-start gap-2 px-3 py-2 rounded-card border shadow-md ${cls}`}
      role="alert"
    >
      <Icon className="w-4 h-4 mt-0.5 shrink-0" />
      <div className="text-sm">{toast.message}</div>
    </div>
  );
}
