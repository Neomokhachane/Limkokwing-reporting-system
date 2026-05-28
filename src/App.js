import "react-native-gesture-handler";
import React, { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import AppErrorBoundary from "./components/AppErrorBoundary";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./components/Toast";
import AppNavigator from "./navigation/AppNavigator";

export default function App() {
  const rootStyle = Platform.OS === "web"
    ? { flex: 1, minHeight: "100vh", width: "100%" }
    : { flex: 1 };

  useEffect(() => {
    if (Platform.OS !== "web" || typeof document === "undefined") return;

    document.documentElement.style.backgroundColor = "#0f0f1a";
    document.documentElement.style.colorScheme = "dark";
    document.body.style.backgroundColor = "#0f0f1a";
    document.body.style.color = "#f0f0ff";
    document.body.style.colorScheme = "dark";

    let style = document.getElementById("luct-web-root-style");
    if (!style) {
      style = document.createElement("style");
      style.id = "luct-web-root-style";
      document.head.appendChild(style);
    }
    style.textContent = `
      html, body, #root {
        height: 100%;
        min-height: 100%;
        margin: 0;
        background: #0f0f1a !important;
        color-scheme: dark !important;
      }
      #root {
        display: flex;
      }
      #root > div {
        min-height: 100vh;
        width: 100%;
      }
    `;
  }, []);

  return (
    <GestureHandlerRootView style={rootStyle}>
      <AppErrorBoundary>
        <SafeAreaProvider style={{ flex: 1 }}>
          <AuthProvider>
            <ToastProvider>
              <StatusBar style="light" />
              <AppNavigator />
            </ToastProvider>
          </AuthProvider>
        </SafeAreaProvider>
      </AppErrorBoundary>
    </GestureHandlerRootView>
  );
}
