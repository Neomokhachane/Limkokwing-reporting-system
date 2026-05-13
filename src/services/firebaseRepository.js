import {
  addDoc,
  collection,
  getDocs,
  query,
  serverTimestamp,
  doc,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../firebase/config";

export const COLLECTIONS = {
  users: "users",
  faculties: "faculties",
  courses: "courses",
  enrollments: "enrollments",
  enrollmentRequests: "enrollmentRequests",
  reports: "reports",
  attendance: "attendance",
  ratings: "ratings",
  feedback: "feedback",
};

const buildQuery = (collectionName, filters = []) => {
  const constraints = filters
    .filter((filter) => filter.value !== undefined && filter.value !== null && filter.value !== "")
    .map((filter) => where(filter.field, filter.operator || "==", filter.value));

  return constraints.length
    ? query(collection(db, collectionName), ...constraints)
    : collection(db, collectionName);
};

export const fetchCollection = async (collectionName, filters = []) => {
  const snapshot = await getDocs(buildQuery(collectionName, filters));
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
};

export const courseService = {
  getAvailableForStudent: (faculty) =>
    fetchCollection(COLLECTIONS.courses, [{ field: "faculty", value: faculty }]),

  getAssignedToLecturer: (lecturerId) =>
    fetchCollection(COLLECTIONS.courses, [{ field: "lecturerId", value: lecturerId }]),
};

export const enrollmentService = {
  getByStudent: (studentId) =>
    fetchCollection(COLLECTIONS.enrollments, [{ field: "studentId", value: studentId }]),

  getByCourse: (courseId) =>
    fetchCollection(COLLECTIONS.enrollments, [{ field: "courseId", value: courseId }]),

  enrollStudent: async ({ student, course }) => {
    const docRef = await addDoc(collection(db, COLLECTIONS.enrollments), {
      studentId: student.uid,
      studentName: student.fullName || student.name || "",
      studentNumber: student.studentNumber || student.studentId || "",
      courseId: course.id,
      courseName: course.name || course.courseName || "",
      courseCode: course.code || course.courseCode || "",
      faculty: student.faculty || course.faculty || "",
      enrolledAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return docRef.id;
  },
};

export const enrollmentRequestService = {
  getByStudent: (studentId) =>
    fetchCollection(COLLECTIONS.enrollmentRequests, [{ field: "studentId", value: studentId }]),

  requestEnrollment: async ({ student, course }) => {
    const docRef = await addDoc(collection(db, COLLECTIONS.enrollmentRequests), {
      studentId: student.uid,
      studentName: student.fullName || student.name || "",
      studentNumber: student.studentNumber || student.studentId || "",
      courseId: course.id,
      courseName: course.name || course.courseName || "",
      courseCode: course.code || course.courseCode || "",
      faculty: student.faculty || course.faculty || "",
      status: "pending",
      createdAt: serverTimestamp(),
    });

    return docRef.id;
  },
};

export const attendanceService = {
  getByStudent: (studentId) =>
    fetchCollection(COLLECTIONS.attendance, [{ field: "studentId", value: studentId }]),

  getByLecturer: (lecturerId) =>
    fetchCollection(COLLECTIONS.attendance, [{ field: "lecturerId", value: lecturerId }]),

  markAttendance: async ({ student, course, lecturer, status, date }) => {
    const existing = await fetchCollection(COLLECTIONS.attendance, [
      { field: "studentId", value: student.studentId },
      { field: "courseId", value: course.id },
      { field: "date", value: date },
    ]);

    const payload = {
      studentId: student.studentId,
      studentName: student.studentName,
      studentNumber: student.studentNumber || "",
      courseId: course.id,
      courseName: course.name || course.courseName || "",
      courseCode: course.code || course.courseCode || "",
      lecturerId: lecturer.uid,
      lecturerName: lecturer.fullName || lecturer.name || "",
      faculty: course.faculty || lecturer.faculty || "",
      date,
      status,
      markedBy: lecturer.uid,
      updatedAt: serverTimestamp(),
    };

    if (existing.length) {
      await updateDoc(doc(db, COLLECTIONS.attendance, existing[0].id), payload);
      return existing[0].id;
    }

    const docRef = await addDoc(collection(db, COLLECTIONS.attendance), {
      ...payload,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  },
};

export const reportService = {
  getByFaculty: (faculty) =>
    fetchCollection(COLLECTIONS.reports, [{ field: "facultyName", value: faculty }]),

  getByLecturer: (lecturerId) =>
    fetchCollection(COLLECTIONS.reports, [{ field: "lecturerId", value: lecturerId }]),
};
