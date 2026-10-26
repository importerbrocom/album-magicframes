import { createContext, useCallback, useContext, useState } from 'react';

const ToastContext = createContext(null);
export const useToast = () => useContext(ToastContext);

let idSeq = 0;

/**
 * Lightweight success/error notification system. Matches the admin theme
 * (uses the same CSS variables + rounded surfaces as the rest of the panel).
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const push = useCallback(
    (message, type = 'success', ttl = 4000) => {
      const id = ++idSeq;
      setToasts((t) => [...t, { id, message, type }]);
      if (ttl) setTimeout(() => dismiss(id), ttl);
      return id;
    },
    [dismiss],
  );

  const toast = {
    success: (m, ttl) => push(m, 'success', ttl),
    error: (m, ttl) => push(m, 'error', ttl),
    info: (m, ttl) => push(m, 'info', ttl),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed right-4 top-4 z-[100] flex w-[min(92vw,22rem)] flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            onClick={() => dismiss(t.id)}
            className={`animate-fadeUp cursor-pointer rounded-lg px-4 py-3 text-sm shadow-lg ${
              t.type === 'error'
                ? 'bg-red-600 text-white'
                : t.type === 'info'
                  ? 'bg-charcoal text-white'
                  : 'bg-green-600 text-white'
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
