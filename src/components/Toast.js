import React, { createContext, useContext, useState, useCallback, useEffect } from "react";

const ToastContext = createContext(null);

let toastId = 0;
let externalToast = null;

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "info") => {
    const id = ++toastId;
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);

  useEffect(() => {
    externalToast = addToast;
    return () => {
      externalToast = null;
    };
  }, [addToast]);

  const icons = { success: "S", error: "E", info: "I", warning: "W" };
  const colors = {
    success: "#10b981",
    error: "#ef4444",
    info: "#6c63ff",
    warning: "#f59e0b",
  };

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <div
        style={{
          position: "fixed",
          top: 20,
          right: 20,
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          maxWidth: 360,
        }}
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "12px 16px",
              background: "var(--bg-card)",
              border: `1px solid ${colors[t.type]}40`,
              borderLeft: `4px solid ${colors[t.type]}`,
              borderRadius: 10,
              boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
              fontSize: 14,
              color: "var(--text-primary)",
              animation: "slideIn 0.2s ease",
            }}
          >
            <span>{icons[t.type]}</span>
            <span style={{ flex: 1 }}>{t.message}</span>
            <button
              onClick={() => setToasts((ts) => ts.filter((x) => x.id !== t.id))}
              style={{
                background: "none",
                border: "none",
                color: "var(--text-muted)",
                cursor: "pointer",
                fontSize: 16,
                lineHeight: 1,
              }}
            >
              X
            </button>
          </div>
        ))}
      </div>
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);

const toast = {
  success: (msg) => externalToast && externalToast(msg, "success"),
  error: (msg) => externalToast && externalToast(msg, "error"),
  info: (msg) => externalToast && externalToast(msg, "info"),
  warning: (msg) => externalToast && externalToast(msg, "warning"),
};

export default toast;