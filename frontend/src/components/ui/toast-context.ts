import { createContext } from 'react';

export type ToastTone = 'success' | 'error' | 'info';

export interface ToastItem {
  id: number;
  tone: ToastTone;
  message: string;
}

export interface ToastContextValue {
  push: (tone: ToastTone, message: string) => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);
