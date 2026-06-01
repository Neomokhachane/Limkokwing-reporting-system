import { getApp, getApps, initializeApp } from "@firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "./authApi";
import { firebaseConfig } from "./appConfig";

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
