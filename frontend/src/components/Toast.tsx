"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  action?: ToastAction;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType, action?: ToastAction) => void;
  success: (message: string, action?: ToastAction) => void;
  error: (message: string, action?: ToastAction) => void;
  info: (message: string, action?: ToastAction) => void;
  warning: (message: string, action?: ToastAction) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (message: string, type: ToastType = "info", action?: ToastAction) => {
      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      setToasts((prev) => [...prev, { id, message, type, action }]);

      setTimeout(() => {
        removeToast(id);
      }, 4500);
    },
    [removeToast]
  );

  const success = useCallback(
    (msg: string, action?: ToastAction) => addToast(msg, "success", action),
    [addToast]
  );
  const error = useCallback(
    (msg: string, action?: ToastAction) => addToast(msg, "error", action),
    [addToast]
  );
  const info = useCallback(
    (msg: string, action?: ToastAction) => addToast(msg, "info", action),
    [addToast]
  );
  const warning = useCallback(
    (msg: string, action?: ToastAction) => addToast(msg, "warning", action),
    [addToast]
  );

  return (
    <ToastContext.Provider value={{ toast: addToast, success, error, info, warning }}>
      {children}
      {/* Toast Overlay Container */}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col space-y-2.5 max-w-md w-full px-4 sm:px-0 pointer-events-none">
        {toasts.map((t) => {
          const bgColors = {
            success: "bg-zinc-900/95 border-emerald-500/40 text-emerald-400 shadow-emerald-950/30",
            error: "bg-zinc-900/95 border-rose-500/40 text-rose-400 shadow-rose-950/30",
            warning: "bg-zinc-900/95 border-amber-500/40 text-amber-400 shadow-amber-950/30",
            info: "bg-zinc-900/95 border-sky-500/40 text-sky-400 shadow-sky-950/30",
          };

          const icons = {
            success: <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />,
            error: <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />,
            warning: <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />,
            info: <Info className="w-5 h-5 text-sky-400 flex-shrink-0" />,
          };

          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-center justify-between p-4 rounded-xl border backdrop-blur-md shadow-xl transition-all duration-200 animate-in fade-in slide-in-from-bottom-3 ${
                bgColors[t.type]
              }`}
            >
              <div className="flex items-center space-x-3 mr-2">
                {icons[t.type]}
                <span className="text-sm font-medium text-zinc-100 leading-snug">
                  {t.message}
                </span>
              </div>

              <div className="flex items-center space-x-2 flex-shrink-0">
                {t.action && (
                  <button
                    onClick={() => {
                      t.action?.onClick();
                      removeToast(t.id);
                    }}
                    className="px-2.5 py-1 text-xs font-semibold rounded-md bg-white/10 hover:bg-white/20 text-white transition-all active:scale-95"
                  >
                    {t.action.label}
                  </button>
                )}
                <button
                  onClick={() => removeToast(t.id)}
                  className="p-1 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-white/5 transition-all"
                  aria-label="Dismiss notification"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

