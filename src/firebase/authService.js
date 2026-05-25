import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  updateProfile 
} from "./authApi";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./config";

export const registerUser = async (email, password, userData) => {
  try {
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
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    throw error;
  }
};

export const logoutUser = async () => {
  try {
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
  return onAuthStateChanged(auth, callback);
};
