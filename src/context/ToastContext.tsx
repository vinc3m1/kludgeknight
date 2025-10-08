import { createContext, ReactNode, useCallback } from 'react';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';

type ToastType = 'success' | 'error' | 'info';

interface ToastContextValue {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  showSuccess: (message: string, duration?: number) => void;
  showError: (message: string, duration?: number) => void;
  showInfo: (message: string, duration?: number) => void;
  dismissToast: (id: string | number) => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const showToast = useCallback((message: string, type: ToastType = 'info', duration = 5000) => {
    switch (type) {
      case 'success':
        toast.success(message, { duration });
        break;
      case 'error':
        toast.error(message, { duration });
        break;
      case 'info':
      default:
        toast.info(message, { duration });
        break;
    }
  }, []);

  const showSuccess = useCallback((message: string, duration?: number) => {
    toast.success(message, { duration });
  }, []);

  const showError = useCallback((message: string, duration?: number) => {
    toast.error(message, { duration });
  }, []);

  const showInfo = useCallback((message: string, duration?: number) => {
    toast.info(message, { duration });
  }, []);

  const dismissToast = useCallback((id: string | number) => {
    toast.dismiss(id);
  }, []);

  const value: ToastContextValue = {
    showToast,
    showSuccess,
    showError,
    showInfo,
    dismissToast,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Toaster />
    </ToastContext.Provider>
  );
}
