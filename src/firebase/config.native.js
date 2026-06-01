import { getApp, getApps, initializeApp } from "firebase/app";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getFirestore } from "firebase/firestore";
import { firebaseConfig } from "./appConfig";
import {
  getAuth,
  getReactNativePersistence,
  initializeAuth,
} from "./authApi";

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
let authInstance = null;

export const getAuthInstance = () => {
  if (authInstance) return authInstance;
  try {
    authInstance = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch (error) {
    authInstance = getAuth(app);
  }
  return authInstance;
};

export const db = getFirestore(app);
export default app;
