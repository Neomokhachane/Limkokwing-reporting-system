import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  updateProfile 
} from "./authApi";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { db, getAuthInstance } from "./config";

export const registerUser = async (email, password, userData) => {
  try {
    const auth = getAuthInstance();
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    const fullName = userData.fullName || userData.name || "";
    await updateProfile(user, { displayName: fullName });
    
    const profileData = {
      uid: user.uid,
      name: fullName,
      fullName,
      email: userData.email,
      role: userData.role,
      faculty: userData.faculty || "",
      programme: userData.programme || "",
      assignedCourses: userData.assignedCourses || [],
      registeredCourses: userData.registeredCourses || [],
      createdAt: serverTimestamp(),
    };

    if (userData.role === "student" && userData.studentId) {
      profileData.studentId = userData.studentId;
      profileData.studentNumber = userData.studentNumber || userData.studentId;
    }

    await setDoc(doc(db, "users", user.uid), profileData);
    
    return user;
  } catch (error) {
    throw error;
  }
};

export const loginUser = async (email, password) => {
  try {
    const auth = getAuthInstance();
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    throw error;
  }
};

export const logoutUser = async () => {
  try {
    const auth = getAuthInstance();
    await signOut(auth);
  } catch (error) {
    throw error;
  }
};

export const getUserData = async (uid) => {
  try {
    const docRef = doc(db, "users", uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return null;
  } catch (error) {
    return null;
  }
};

export const onAuthChange = (callback) => {
  try {
    return onAuthStateChanged(getAuthInstance(), callback, () => callback(null));
  } catch (error) {
    callback(null);
    return () => {};
  }
};
