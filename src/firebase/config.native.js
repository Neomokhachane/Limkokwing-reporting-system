import { getApp, getApps, initializeApp } from "firebase/app";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getFirestore } from "firebase/firestore";
import { getAuth, getReactNativePersistence, initializeAuth } from "./authApi";
import { firebaseConfig } from "./appConfig";

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const authSingletonKey = "__LUCT_REPORTING_FIREBASE_AUTH__";

const createNativeAuth = () => {
  if (globalThis[authSingletonKey]) {
    return globalThis[authSingletonKey];
  }

  try {
    const nativeAuth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
    globalThis[authSingletonKey] = nativeAuth;
    return nativeAuth;
  } catch (error) {
    const alreadyInitialized =
      error?.code === "auth/already-initialized" ||
      String(error?.message || "").toLowerCase().includes("already");

    if (alreadyInitialized) {
      const existingAuth = getAuth(app);
      globalThis[authSingletonKey] = existingAuth;
      return existingAuth;
    }

    throw error;
  }
};

export const auth = createNativeAuth();
export const db = getFirestore(app);
export default app;
