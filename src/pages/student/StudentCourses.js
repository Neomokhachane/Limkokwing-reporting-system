import React, { useEffect, useMemo, useState } from "react";
import Layout from "../../components/Layout";
import { useAuth } from "../../context/AuthContext";
import toast from "../../components/Toast";
import useFirestoreCollection from "../../hooks/useFirestoreCollection";
import { COLLECTIONS, enrollmentRequestService } from "../../services/firebaseRepository";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../../firebase/config";
import { FACULTIES } from "../../constants/academic";

const normalizeFaculty = (value) => (value || "").trim().toLowerCase();

export default function StudentCourses() {
  const { currentUser, userProfile, loading: authLoading, refreshProfile } = useAuth();
  const [search, setSearch] = useState("");
  const [savingId, setSavingId] = useState("");
  const [detailsForm, setDetailsForm] = useState({
    studentId: userProfile?.studentId || userProfile?.studentNumber || "",
    faculty: userProfile?.faculty || "",
  });
  const [savingDetails, setSavingDetails] = useState(false);

  const hasStudentId = Boolean(userProfile?.studentId || userProfile?.studentNumber);
  const hasFaculty = Boolean(userProfile?.faculty);
  const needsDetails = !hasStudentId || !hasFaculty;

  useEffect(() => {
    setDetailsForm({
      studentId: userProfile?.studentId || userProfile?.studentNumber || "",
      faculty: userProfile?.faculty || "",
    });
  }, [userProfile]);

  const { data: courses, loading: coursesLoading, error: coursesError } = useFirestoreCollection(
    COLLECTIONS.courses,
    [{ field: "faculty", value: userProfile?.faculty || "" }],
    { enabled: hasFaculty }
  );
  const { data: enrollments, loading: enrollmentsLoading, error: enrollmentsError } = useFirestoreCollection(
    COLLECTIONS.enrollments,
    [{ field: "studentId", value: currentUser?.uid || "" }],
    { enabled: Boolean(currentUser?.uid) }
  );
  const { data: enrollmentRequests, loading: requestsLoading } = useFirestoreCollection(
    COLLECTIONS.enrollmentRequests,
    [{ field: "studentId", value: currentUser?.uid || "" }],
    { enabled: Boolean(currentUser?.uid) }
  );

  const enrolledCourseIds = useMemo(
    () => new Set(enrollments.map((item) => item.courseId)),
    [enrollments]
  );
  const requestedCourseIds = useMemo(
    () => new Set(enrollmentRequests.filter((item) => item.status === "pending").map((item) => item.courseId)),
    [enrollmentRequests]
  );

  const filteredCourses = courses.filter((course) => {
    const term = search.toLowerCase();
    if (normalizeFaculty(course.faculty) !== normalizeFaculty(userProfile?.faculty)) return false;
    return (
      course.name?.toLowerCase().includes(term) ||
      course.courseName?.toLowerCase().includes(term) ||
      course.code?.toLowerCase().includes(term) ||
      course.courseCode?.toLowerCase().includes(term) ||
      course.lecturerName?.toLowerCase().includes(term)
    );
  });

  const handleEnroll = async (course) => {
    if (authLoading) {
      toast.error("Please wait for your account to finish loading");
      return;
    }

    if (!currentUser?.uid) {
      toast.error("Please sign in before requesting enrollment");
      return;
    }

    if (!userProfile) {
      toast.error("Your student profile is still loading. Please try again in a moment");
      return;
    }

    if (needsDetails) {
      toast.error("Complete your student ID and faculty before enrolling");
      return;
    }

    setSavingId(course.id);
    try {
      if (normalizeFaculty(course.faculty) !== normalizeFaculty(userProfile?.faculty)) {
        toast.error("Your faculty does not match this course");
        return;
      }

      await enrollmentRequestService.requestEnrollment({
        student: { uid: currentUser.uid, ...userProfile },
        course,
      });
      toast.success("Enrollment request sent to Program Leader");
    } catch (error) {
      console.warn("Enrollment failed:", error);
      toast.error(error.code === "permission-denied" ? "Permission denied while sending enrollment request. Please confirm the updated Firestore rules are deployed." : (error.message || "Failed to request enrollment"));
    } finally {
      setSavingId("");
    }
  };

  const handleSaveDetails = async (event) => {
    event.preventDefault();
    if (!currentUser?.uid) {
      toast.error("Please sign in before saving student details");
      return;
    }

    if (!detailsForm.studentId.trim() || !detailsForm.faculty) {
      toast.error("Student ID and faculty are required");
      return;
    }

    setSavingDetails(true);
    try {
      const studentNumber = userProfile?.studentNumber || userProfile?.studentId || detailsForm.studentId.trim();
      const completedProfile = userProfile
        ? {
            studentId: userProfile.studentId || studentNumber,
            studentNumber,
            faculty: userProfile.faculty || detailsForm.faculty,
          }
        : {
            uid: currentUser.uid,
            email: currentUser.email || "",
            role: "student",
            studentId: studentNumber,
            studentNumber,
            faculty: detailsForm.faculty,
            enrollmentStatus: "not-enrolled",
          };

      await setDoc(doc(db, "users", currentUser.uid), completedProfile, { merge: true });
      await refreshProfile();
      toast.success("Student details saved");
    } catch (error) {
      console.warn("Student details update failed:", error);
      toast.error(error.code ? `${error.code}: ${error.message}` : "Failed to save student details");
    } finally {
      setSavingDetails(false);
    }
  };

  const loading = authLoading || coursesLoading || (!enrollmentsError && enrollmentsLoading) || requestsLoading;

  return (
    <Layout title="Courses">
      <div className="page-header">
        <div>
          <h1 className="page-title">Courses</h1>
          <p className="page-subtitle">Enroll into courses from your faculty</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="search-bar">
          <span>Search</span>
          <input
            placeholder="Search courses or lecturers..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      </div>

      {needsDetails && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header">
            <div>
              <div className="card-title">Complete Student Details</div>
              <div className="card-subtitle">These details can only be saved once. After that, only the Program Leader can change them.</div>
            </div>
          </div>
          <form onSubmit={handleSaveDetails}>
            <div className="form-row">
              {!hasStudentId && (
                <div className="form-group">
                  <label className="form-label">Student ID *</label>
                  <input className="form-control" value={detailsForm.studentId} onChange={(event) => setDetailsForm({ ...detailsForm, studentId: event.target.value })} />
                </div>
              )}
              {!hasFaculty && (
                <div className="form-group">
                  <label className="form-label">Faculty *</label>
                  <select className="form-control" value={detailsForm.faculty} onChange={(event) => setDetailsForm({ ...detailsForm, faculty: event.target.value })}>
                    <option value="">Select faculty...</option>
                    {FACULTIES.map((faculty) => <option key={faculty} value={faculty}>{faculty}</option>)}
                  </select>
                </div>
              )}
            </div>
            <button className="btn btn-primary" type="submit" disabled={savingDetails}>{savingDetails ? <span className="loading-spinner" /> : "Save Details"}</button>
          </form>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Available Courses</div>
            <div className="card-subtitle">{enrollmentsError ? "Enrollment status unavailable" : `${enrollments.length} enrolled courses`}</div>
          </div>
          <span className="badge badge-purple">{filteredCourses.length} courses</span>
        </div>

        {coursesError ? (
          <div className="empty-state"><h3>Could not load courses</h3><p>Courses: {coursesError.message}</p></div>
        ) : needsDetails ? (
          <div className="empty-state"><h3>Student details required</h3><p>Complete your Student ID and Faculty before enrolling in courses</p></div>
        ) : loading ? (
          <div className="loading-overlay"><div className="loading-spinner" /><span>Loading courses...</span></div>
        ) : filteredCourses.length === 0 ? (
          <div className="empty-state"><h3>No courses found</h3><p>Courses added by the Program Leader will appear here</p></div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead><tr><th>Course</th><th>Code</th><th>Lecturer</th><th>Students</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>
                {filteredCourses.map((course) => {
                  const isEnrolled = enrolledCourseIds.has(course.id);
                  const isRequested = requestedCourseIds.has(course.id);
                  return (
                    <tr key={course.id}>
                      <td><div style={{ fontWeight: 600 }}>{course.name || course.courseName}</div><div className="text-muted">{course.faculty}</div></td>
                      <td><span className="badge badge-blue">{course.code || course.courseCode}</span></td>
                      <td>{course.lecturerName || <span className="text-muted">Unassigned</span>}</td>
                      <td>{course.registeredStudents || course.totalRegisteredStudents || 0}</td>
                      <td>{isEnrolled ? <span className="badge badge-green">Enrolled</span> : isRequested ? <span className="badge badge-blue">Requested</span> : <span className="badge badge-yellow">Available</span>}</td>
                      <td>
                        <button className="btn btn-primary btn-sm" disabled={isEnrolled || isRequested || savingId === course.id} onClick={() => handleEnroll(course)}>
                          {savingId === course.id ? <span className="loading-spinner" /> : isEnrolled ? "Enrolled" : isRequested ? "Requested" : "Request Enrollment"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}
