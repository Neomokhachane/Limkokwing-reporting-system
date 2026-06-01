import { getApp, getApps, initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "./authApi";
import { firebaseConfig } from "./appConfig";

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
let authInstance = null;

export const getAuthInstance = () => {
  if (!authInstance) authInstance = getAuth(app);
  return authInstance;
};

export const auth = getAuthInstance();
export const db = getFirestore(app);
export default app;
