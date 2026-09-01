import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 7);
    setToasts((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const success = useCallback((msg, duration) => addToast(msg, 'success', duration), [addToast]);
  const error = useCallback((msg, duration) => addToast(msg, 'error', duration), [addToast]);
  const info = useCallback((msg, duration) => addToast(msg, 'info', duration), [addToast]);
  const warning = useCallback((msg, duration) => addToast(msg, 'warning', duration), [addToast]);

  return (
    <ToastContext.Provider value={{ addToast, removeToast, success, error, info, warning }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((toast) => {
          const typeConfig = {
            success: {
              icon: CheckCircle2,
              bg: 'bg-emerald-50 text-emerald-900 border-emerald-200',
              iconColor: 'text-emerald-600',
            },
            error: {
              icon: AlertCircle,
              bg: 'bg-rose-50 text-rose-900 border-rose-200',
              iconColor: 'text-rose-600',
            },
            warning: {
              icon: AlertTriangle,
              bg: 'bg-amber-50 text-amber-900 border-amber-200',
              iconColor: 'text-amber-600',
            },
            info: {
              icon: Info,
              bg: 'bg-brand-50 text-brand-900 border-brand-200',
              iconColor: 'text-brand-600',
            },
          }[toast.type] || {
            icon: Info,
            bg: 'bg-slate-50 text-slate-900 border-slate-200',
            iconColor: 'text-slate-600',
          };

          const IconComponent = typeConfig.icon;

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-lg animate-slide-up ${typeConfig.bg} backdrop-blur-sm`}
            >
              <IconComponent className={`w-5 h-5 flex-shrink-0 mt-0.5 ${typeConfig.iconColor}`} />
              <div className="flex-1 text-sm font-medium leading-5">{toast.message}</div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-slate-400 hover:text-slate-600 p-0.5 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
