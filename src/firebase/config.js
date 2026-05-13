import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAp8l0giMWsBdN9bzBBRjy5_KAEc6nUaYk",
  authDomain: "luct-reporting-application.firebaseapp.com",
  projectId: "luct-reporting-application",
  storageBucket: "luct-reporting-application.firebasestorage.app",
  messagingSenderId: "988856680838",
  appId: "1:988856680838:web:979483f13d2a9128786c07",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;