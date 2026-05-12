import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

const SIZE: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
};

export function Modal({ open, onClose, title, children, footer, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-overlay flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className={`bg-surface rounded-xl shadow-xl border border-border w-full ${SIZE[size]}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <header className="flex items-center justify-between gap-4 px-5 py-4 border-b border-border">
          <h2 className="text-xl font-semibold text-fg">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-control hover:bg-surface-sunken text-fg-muted"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </header>
        <div className="px-5 py-4">{children}</div>
        {footer && (
          <footer className="flex items-center justify-end gap-2 px-5 py-4 border-t border-border bg-surface-sunken/40 rounded-b-xl">
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
}

interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: ReactNode;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  /** Si se proporciona, el usuario debe escribirlo para habilitar el botón. */
  confirmPhrase?: string;
  loading?: boolean;
}

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  danger = false,
  confirmPhrase,
  loading = false,
}: ConfirmModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <ConfirmButton
            onConfirm={onConfirm}
            danger={danger}
            label={confirmLabel}
            confirmPhrase={confirmPhrase}
            loading={loading}
          />
        </>
      }
    >
      {description}
    </Modal>
  );
}

import { useState } from 'react';
import { Input } from './Input';

function ConfirmButton({
  onConfirm,
  danger,
  label,
  confirmPhrase,
  loading,
}: {
  onConfirm: () => void;
  danger: boolean;
  label: string;
  confirmPhrase?: string;
  loading: boolean;
}) {
  const [typed, setTyped] = useState('');
  const requiresType = !!confirmPhrase;
  const canConfirm = !requiresType || typed === confirmPhrase;
  return (
    <div className="flex flex-col items-stretch gap-2 w-full max-w-xs">
      {requiresType && (
        <Input
          autoFocus
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          placeholder={`Escribe "${confirmPhrase}" para confirmar`}
          aria-label="Confirmación"
        />
      )}
      <Button
        variant={danger ? 'danger' : 'primary'}
        onClick={onConfirm}
        disabled={!canConfirm || loading}
      >
        {loading ? 'Procesando…' : label}
      </Button>
    </div>
  );
}
