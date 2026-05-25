import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const ToastContext = createContext(null);

let toastId = 0;
let externalToast = null;

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "info") => {
    const id = ++toastId;
    setToasts((items) => [...items, { id, message, type }]);
    setTimeout(() => setToasts((items) => items.filter((item) => item.id !== id)), 3500);
  }, []);

  useEffect(() => {
    externalToast = addToast;
    return () => {
      externalToast = null;
    };
  }, [addToast]);

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <View pointerEvents="box-none" style={styles.wrap}>
        {toasts.map((item) => (
          <View key={item.id} style={[styles.toast, styles[item.type] || styles.info]}>
            <Text style={styles.message}>{item.message}</Text>
            <TouchableOpacity onPress={() => setToasts((items) => items.filter((toast) => toast.id !== item.id))}>
              <Text style={styles.close}>X</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);

const toast = {
  success: (message) => externalToast && externalToast(message, "success"),
  error: (message) => externalToast && externalToast(message, "error"),
  info: (message) => externalToast && externalToast(message, "info"),
  warning: (message) => externalToast && externalToast(message, "warning"),
};

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    top: 48,
    left: 16,
    right: 16,
    zIndex: 999,
    gap: 8,
  },
  toast: {
    borderRadius: 10,
    borderLeftWidth: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "#151827",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  success: { borderLeftColor: "#10b981" },
  error: { borderLeftColor: "#ef4444" },
  info: { borderLeftColor: "#6c63ff" },
  warning: { borderLeftColor: "#f59e0b" },
  message: { color: "#f8fafc", flex: 1, fontSize: 14 },
  close: { color: "#94a3b8", fontWeight: "700", paddingLeft: 12 },
});

export default toast;
