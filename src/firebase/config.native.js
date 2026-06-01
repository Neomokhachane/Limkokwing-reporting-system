import { getApp, getApps, initializeApp } from "@firebase/app";
import { getFirestore } from "firebase/firestore";
import { firebaseConfig } from "./appConfig";

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
let authInstance = null;

export const getAuthInstance = () => {
  if (authInstance) return authInstance;
  const { getAuth } = require("./authApi");
  authInstance = getAuth(app);
  return authInstance;
};

export const db = getFirestore(app);
export default app;
