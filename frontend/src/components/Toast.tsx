import React, { createContext, useContext } from 'react';
import { useToast, Toast as ToastType } from '../hooks/useToast';

const ToastContext = createContext<ReturnType<typeof useToast> | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const toast = useToast();
  return <ToastContext.Provider value={toast}>{children}</ToastContext.Provider>;
}

export function useToastContext() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToastContext must be used within ToastProvider');
  return context;
}

export function ToastContainer() {
  const { toasts, removeToast } = useToastContext();

  if (toasts.length === 0) return null;

  const getToastStyle = (type: ToastType['type']): React.CSSProperties => {
    const base: React.CSSProperties = {
      padding: '12px 16px',
      borderRadius: 8,
      marginBottom: 8,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      minWidth: 300,
      maxWidth: 500,
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    };

    switch (type) {
      case 'success':
        return { ...base, background: '#dcfce7', color: '#166534', border: '1px solid #86efac' };
      case 'error':
        return { ...base, background: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5' };
      case 'warning':
        return { ...base, background: '#fef3c7', color: '#92400e', border: '1px solid #fde047' };
      case 'info':
      default:
        return { ...base, background: '#dbeafe', color: '#1e40af', border: '1px solid #93c5fd' };
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 20,
      right: 20,
      zIndex: 1000,
      pointerEvents: 'none',
    }}>
      {toasts.map((toast) => (
        <div
          key={toast.id}
          style={{
            ...getToastStyle(toast.type),
            pointerEvents: 'auto',
            animation: 'slideIn 0.3s ease-out',
          }}
        >
          <span>{toast.message}</span>
          <button
            onClick={() => removeToast(toast.id)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'inherit',
              cursor: 'pointer',
              marginLeft: 12,
              fontSize: 18,
              lineHeight: 1,
              padding: 0,
              width: 20,
              height: 20,
            }}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

// Export the hook for direct use (outside provider) or use useToastContext inside provider
export { useToast } from '../hooks/useToast';

