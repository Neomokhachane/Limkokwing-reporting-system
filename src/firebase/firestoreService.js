import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  limit,
} from "firebase/firestore";
import { db } from "./config";

//  REPORTS 
export const addReport = async (reportData) => {
  const docRef = await addDoc(collection(db, "reports"), {
    ...reportData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
};

// Fixed: Remove orderBy to avoid index requirement
export const getReports = async (filters = {}) => {
  try {
    let q = collection(db, "reports");
    const constraints = [];
    
    if (filters.lecturerId) {
      constraints.push(where("lecturerId", "==", filters.lecturerId));
    }
    if (filters.faculty) {
      constraints.push(where("facultyName", "==", filters.faculty));
    }
    if (filters.courseCode) {
      constraints.push(where("courseCode", "==", filters.courseCode));
    }
    
    if (constraints.length > 0) {
      q = query(collection(db, "reports"), ...constraints);
    }
    
    const snapshot = await getDocs(q);
    let results = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    
    // Sort on client side instead of using orderBy
    results.sort((a, b) => {
      const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0);
      const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0);
      return dateB - dateA;
    });
    
    return results;
  } catch (error) {
    console.warn("Error getting reports:", error);
    return [];
  }
};

export const getReportById = async (id) => {
  const docSnap = await getDoc(doc(db, "reports", id));
  if (docSnap.exists()) return { id: docSnap.id, ...docSnap.data() };
  return null;
};

export const updateReport = async (id, data) => {
  await updateDoc(doc(db, "reports", id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

export const deleteReport = async (id) => {
  await deleteDoc(doc(db, "reports", id));
};

export const addFeedbackToReport = async (reportId, feedback, reviewerId) => {
  await updateDoc(doc(db, "reports", reportId), {
    feedback,
    feedbackBy: reviewerId,
    feedbackAt: serverTimestamp(),
    status: "reviewed",
  });
};

export const subscribeToReports = (filters, callback) => {
  const constraints = [];
  if (filters.lecturerId) {
    constraints.push(where("lecturerId", "==", filters.lecturerId));
  }
  if (filters.faculty) {
    constraints.push(where("facultyName", "==", filters.faculty));
  }
  
  let q;
  if (constraints.length > 0) {
    q = query(collection(db, "reports"), ...constraints);
  } else {
    q = collection(db, "reports");
  }
  
  return onSnapshot(q, (snapshot) => {
    let data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    data.sort((a, b) => {
      const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0);
      const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0);
      return dateB - dateA;
    });
    callback(data);
  });
};

//  COURSES 
export const addCourse = async (courseData) => {
  const docRef = await addDoc(collection(db, "courses"), {
    ...courseData,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
};

export const getCourses = async (filters = {}) => {
  try {
    let q = collection(db, "courses");
    const constraints = [];
    
    if (filters.faculty) {
      constraints.push(where("faculty", "==", filters.faculty));
    }
    if (filters.programLeaderId) {
      constraints.push(where("programLeaderId", "==", filters.programLeaderId));
    }
    if (filters.lecturerId) {
      constraints.push(where("lecturerId", "==", filters.lecturerId));
    }
    
    if (constraints.length > 0) {
      q = query(collection(db, "courses"), ...constraints);
    }
    
    const snapshot = await getDocs(q);
    let results = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    
    results.sort((a, b) => {
      const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0);
      const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0);
      return dateB - dateA;
    });
    
    return results;
  } catch (error) {
    console.warn("Error getting courses:", error);
    return [];
  }
};

export const updateCourse = async (id, data) => {
  await updateDoc(doc(db, "courses", id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

export const deleteCourse = async (id) => {
  await deleteDoc(doc(db, "courses", id));
};

export const subscribeToCourses = (filters, callback) => {
  const constraints = [];
  if (filters.faculty) {
    constraints.push(where("faculty", "==", filters.faculty));
  }
  
  let q;
  if (constraints.length > 0) {
    q = query(collection(db, "courses"), ...constraints);
  } else {
    q = collection(db, "courses");
  }
  
  return onSnapshot(q, (snapshot) => {
    let data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    data.sort((a, b) => {
      const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0);
      const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0);
      return dateB - dateA;
    });
    callback(data);
  });
};

//  CLASSES 
export const addClass = async (classData) => {
  const docRef = await addDoc(collection(db, "classes"), {
    ...classData,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
};

export const getClasses = async (filters = {}) => {
  try {
    let q = collection(db, "classes");
    const constraints = [];
    
    if (filters.lecturerId) {
      constraints.push(where("lecturerId", "==", filters.lecturerId));
    }
    if (filters.courseCode) {
      constraints.push(where("courseCode", "==", filters.courseCode));
    }
    
    if (constraints.length > 0) {
      q = query(collection(db, "classes"), ...constraints);
    }
    
    const snapshot = await getDocs(q);
    let results = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    
    results.sort((a, b) => {
      const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0);
      const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0);
      return dateB - dateA;
    });
    
    return results;
  } catch (error) {
    console.warn("Error getting classes:", error);
    return [];
  }
};

export const subscribeToClasses = (filters, callback) => {
  const constraints = [];
  if (filters.lecturerId) {
    constraints.push(where("lecturerId", "==", filters.lecturerId));
  }
  
  let q;
  if (constraints.length > 0) {
    q = query(collection(db, "classes"), ...constraints);
  } else {
    q = collection(db, "classes");
  }
  
  return onSnapshot(q, (snapshot) => {
    let data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    data.sort((a, b) => {
      const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0);
      const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0);
      return dateB - dateA;
    });
    callback(data);
  });
};

//  ATTENDANCE 
export const addAttendance = async (data) => {
  const docRef = await addDoc(collection(db, "attendance"), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
};

export const getAttendance = async (filters = {}) => {
  try {
    let q = collection(db, "attendance");
    const constraints = [];
    
    if (filters.studentId) {
      constraints.push(where("studentId", "==", filters.studentId));
    }
    if (filters.courseCode) {
      constraints.push(where("courseCode", "==", filters.courseCode));
    }
    
    if (constraints.length > 0) {
      q = query(collection(db, "attendance"), ...constraints);
    }
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.warn("Error getting attendance:", error);
    return [];
  }
};

export const subscribeToAttendance = (filters, callback) => {
  const constraints = [];
  if (filters.studentId) {
    constraints.push(where("studentId", "==", filters.studentId));
  }
  
  let q;
  if (constraints.length > 0) {
    q = query(collection(db, "attendance"), ...constraints);
  } else {
    q = collection(db, "attendance");
  }
  
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
};

//  RATINGS 
export const addRating = async (data) => {
  const docRef = await addDoc(collection(db, "ratings"), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
};

export const getRatings = async (filters = {}) => {
  try {
    let q = collection(db, "ratings");
    const constraints = [];
    
    if (filters.lecturerId) {
      constraints.push(where("lecturerId", "==", filters.lecturerId));
    }
    if (filters.studentId) {
      constraints.push(where("studentId", "==", filters.studentId));
    }
    
    if (constraints.length > 0) {
      q = query(collection(db, "ratings"), ...constraints);
    }
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.warn("Error getting ratings:", error);
    return [];
  }
};

//  USERS 
export const getUsers = async (role) => {
  try {
    let q;
    if (role) {
      q = query(collection(db, "users"), where("role", "==", role));
    } else {
      q = collection(db, "users");
    }
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.warn("Error getting users:", error);
    return [];
  }
};

export const subscribeToUsers = (role, callback) => {
  let q;
  if (role) {
    q = query(collection(db, "users"), where("role", "==", role));
  } else {
    q = collection(db, "users");
  }
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
};
