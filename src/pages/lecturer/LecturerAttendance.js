import React, { useMemo, useState } from "react";
import Layout from "../../components/Layout";
import { useAuth } from "../../context/AuthContext";
import toast from "../../components/Toast";
import useFirestoreCollection from "../../hooks/useFirestoreCollection";
import { attendanceService, COLLECTIONS } from "../../services/firebaseRepository";
import { exportToExcel } from "../../utils/exportCsv";

const today = () => new Date().toISOString().slice(0, 10);

export default function LecturerAttendance() {
  const { currentUser, userProfile } = useAuth();
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [date, setDate] = useState(today());
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState("");

  const { data: courses, loading: coursesLoading } = useFirestoreCollection(
    COLLECTIONS.courses,
    [{ field: "lecturerId", value: currentUser?.uid || "" }]
  );
  const selectedCourse = courses.find((course) => course.id === selectedCourseId) || courses[0];
  const courseId = selectedCourse?.id || "";

  const { data: enrollments, loading: enrollmentsLoading } = useFirestoreCollection(
    COLLECTIONS.enrollments,
    [{ field: "courseId", value: courseId }]
  );
  const { data: attendance, loading: attendanceLoading } = useFirestoreCollection(
    COLLECTIONS.attendance,
    [{ field: "courseId", value: courseId }]
  );

  const todaysAttendance = useMemo(
    () => attendance.filter((item) => item.date === date),
    [attendance, date]
  );

  const filteredStudents = enrollments.filter((item) => {
    const term = search.toLowerCase();
    return (
      item.studentName?.toLowerCase().includes(term) ||
      item.studentNumber?.toLowerCase().includes(term)
    );
  });

  const getStatus = (studentId) =>
    todaysAttendance.find((item) => item.studentId === studentId)?.status || "unmarked";

  const markStudent = async (student, status) => {
    if (!selectedCourse) {
      toast.error("Select a course first");
      return;
    }

    setSaving(`${student.studentId}-${status}`);
    try {
      await attendanceService.markAttendance({
        student,
        course: selectedCourse,
        lecturer: { uid: currentUser.uid, ...userProfile },
        status,
        date,
      });
      toast.success("Attendance saved");
    } catch (error) {
      console.warn("Attendance save failed:", error);
      toast.error("Failed to save attendance");
    } finally {
      setSaving("");
    }
  };

  const exportAttendance = () => {
    const rows = attendance.map((item) => ({
      Date: item.date,
      Student: item.studentName,
      "Student Number": item.studentNumber,
      Course: item.courseName,
      Code: item.courseCode,
      Status: item.status,
    }));
    exportToExcel(rows, `course-attendance-${new Date().toISOString().slice(0, 10)}`, "Attendance");
  };

  const loading = coursesLoading || enrollmentsLoading || attendanceLoading;

  return (
    <Layout title="Attendance">
      <div className="page-header">
        <div>
          <h1 className="page-title">Student Attendance</h1>
          <p className="page-subtitle">Mark attendance only for students enrolled in your assigned courses</p>
        </div>
        <button className="btn btn-secondary" onClick={exportAttendance}>Export Excel</button>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Assigned Course</label>
            <select className="form-control" value={courseId} onChange={(event) => setSelectedCourseId(event.target.value)}>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>{course.code || course.courseCode} - {course.name || course.courseName}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Lecture Date</label>
            <input type="date" className="form-control" value={date} onChange={(event) => setDate(event.target.value)} />
          </div>
        </div>
        <div className="search-bar">
          <span>Search</span>
          <input placeholder="Search student name or number..." value={search} onChange={(event) => setSearch(event.target.value)} />
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Enrolled Students</div>
            <div className="card-subtitle">{selectedCourse ? `${selectedCourse.name || selectedCourse.courseName}` : "No assigned course selected"}</div>
          </div>
          <span className="badge badge-purple">{filteredStudents.length} students</span>
        </div>

        {loading ? (
          <div className="loading-overlay"><div className="loading-spinner" /><span>Loading attendance...</span></div>
        ) : courses.length === 0 ? (
          <div className="empty-state"><h3>No assigned courses</h3><p>Ask the Program Leader to assign courses to your account</p></div>
        ) : filteredStudents.length === 0 ? (
          <div className="empty-state"><h3>No enrolled students</h3><p>Students must enroll before attendance can be marked</p></div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead><tr><th>Student</th><th>Student Number</th><th>Current Status</th><th>Mark Attendance</th></tr></thead>
              <tbody>
                {filteredStudents.map((student) => {
                  const status = getStatus(student.studentId);
                  return (
                    <tr key={student.id}>
                      <td style={{ fontWeight: 600 }}>{student.studentName}</td>
                      <td>{student.studentNumber || "-"}</td>
                      <td><span className={`badge ${status === "present" ? "badge-green" : status === "late" ? "badge-yellow" : status === "absent" ? "badge-red" : "badge-gray"}`}>{status}</span></td>
                      <td>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          {["present", "late", "absent"].map((statusOption) => (
                            <button key={statusOption} className="btn btn-secondary btn-sm" disabled={saving === `${student.studentId}-${statusOption}`} onClick={() => markStudent(student, statusOption)}>
                              {saving === `${student.studentId}-${statusOption}` ? <span className="loading-spinner" /> : statusOption}
                            </button>
                          ))}
                        </div>
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
