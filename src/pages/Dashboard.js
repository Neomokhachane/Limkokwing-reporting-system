import React, { useEffect, useMemo, useState } from "react";
import Layout from "../components/Layout";
import { useAuth } from "../context/AuthContext";
import { getClasses, getCourses, getReports } from "../firebase/firestoreService";
import { attendanceService, enrollmentService } from "../services/firebaseRepository";
import toast from "../components/Toast";

const roleLabels = {
  student: "Student",
  lecturer: "Lecturer",
  prl: "Principal Lecturer",
  pl: "Program Leader",
};

const statusBadge = (status) => {
  if (!status || status === "pending") return <span className="badge badge-yellow">Pending</span>;
  if (status === "reviewed") return <span className="badge badge-green">Reviewed</span>;
  return <span className="badge badge-gray">{status}</span>;
};

const safeLoad = async (loader, fallback = []) => {
  try {
    return await loader();
  } catch (error) {
    console.warn("Dashboard section failed:", error);
    return fallback;
  }
};

export default function Dashboard() {
  const { userProfile, currentUser } = useAuth();
  const [stats, setStats] = useState({ reports: 0, classes: 0, courses: 0, attendanceRate: 0, ratings: 0 });
  const [recentReports, setRecentReports] = useState([]);
  const [studentEnrollments, setStudentEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!userProfile || !currentUser) {
        setLoading(false);
        return;
      }

      try {
        if (userProfile.role === "student") {
          const [attendance, enrollments] = await Promise.all([
            safeLoad(() => attendanceService.getByStudent(currentUser.uid)),
            safeLoad(() => enrollmentService.getByStudent(currentUser.uid)),
          ]);
          const attended = attendance.filter((item) => item.status === "present" || item.status === "late").length;
          setStats({
            reports: 0,
            classes: 0,
            courses: enrollments.length,
            attendanceRate: attendance.length ? Math.round((attended / attendance.length) * 100) : 0,
            ratings: 0,
          });
          setStudentEnrollments(enrollments.slice(0, 5));
          setRecentReports([]);
          return;
        }

        let reports = [];
        let classes = [];
        let courses = [];

        if (userProfile.role === "lecturer") {
          [reports, classes, courses] = await Promise.all([
            safeLoad(() => getReports({ lecturerId: currentUser.uid })),
            safeLoad(() => getClasses({ lecturerId: currentUser.uid })),
            safeLoad(() => getCourses({ lecturerId: currentUser.uid })),
          ]);
        } else if (userProfile.role === "prl") {
          const [reportsData, classesData, coursesData] = await Promise.all([
            safeLoad(() => getReports({ faculty: userProfile.faculty })),
            safeLoad(() => getClasses({})),
            safeLoad(() => getCourses({ faculty: userProfile.faculty })),
          ]);
          reports = reportsData;
          classes = classesData.filter((item) => item.faculty === userProfile.faculty);
          courses = coursesData;
        } else if (userProfile.role === "pl") {
          [reports, courses, classes] = await Promise.all([
            safeLoad(() => getReports({})),
            safeLoad(() => getCourses({})),
            safeLoad(() => getClasses({})),
          ]);
        }

        setStats({ reports: reports.length, classes: classes.length, courses: courses.length, attendanceRate: 0, ratings: 0 });
        setRecentReports([...reports].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).slice(0, 5));
      } catch (error) {
        console.warn("Error fetching dashboard stats:", error);
        toast.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [userProfile, currentUser]);

  const role = userProfile?.role || "student";
  const cards = useMemo(() => {
    if (role === "student") {
      return [
        { label: "Attendance Rate", value: `${stats.attendanceRate}%`, color: "purple" },
        { label: "Enrolled Courses", value: stats.courses, color: "blue" },
        { label: "Ratings Given", value: stats.ratings, color: "green" },
      ];
    }
    if (role === "lecturer") {
      return [
        { label: "My Reports", value: stats.reports, color: "purple" },
        { label: "My Classes", value: stats.classes, color: "blue" },
        { label: "Assigned Courses", value: stats.courses, color: "green" },
      ];
    }
    if (role === "prl") {
      return [
        { label: "Faculty Reports", value: stats.reports, color: "purple" },
        { label: "Faculty Classes", value: stats.classes, color: "blue" },
        { label: "Faculty Courses", value: stats.courses, color: "green" },
      ];
    }
    return [
      { label: "All Reports", value: stats.reports, color: "purple" },
      { label: "Courses", value: stats.courses, color: "blue" },
      { label: "Classes", value: stats.classes, color: "green" },
    ];
  }, [role, stats]);

  if (loading) {
    return (
      <Layout title="Dashboard">
        <div className="loading-overlay" style={{ minHeight: 400 }}><div className="loading-spinner" /><span>Loading dashboard...</span></div>
      </Layout>
    );
  }

  return (
    <Layout title="Dashboard">
      <div className="page-header">
        <div>
          <h1 className="page-title">Welcome back, {userProfile?.fullName?.split(" ")[0] || userProfile?.name?.split(" ")[0] || "User"}</h1>
          <p className="page-subtitle">{userProfile?.faculty || roleLabels[role]}</p>
        </div>
        <span className={`role-chip role-${role}`}>{roleLabels[role]}</span>
      </div>

      <div className="stat-grid">
        {cards.map((card) => (
          <div key={card.label} className={`stat-card ${card.color}`}>
            <div className="stat-value">{card.value}</div>
            <div className="stat-label">{card.label}</div>
          </div>
        ))}
      </div>

      {role === "student" ? (
        <div className="grid-2">
          <div className="card">
            <div className="card-header"><div className="card-title">Enrolled Courses</div></div>
            {studentEnrollments.length === 0 ? (
              <div className="empty-state"><h3>No enrolled courses</h3><p>Enroll into faculty courses from the Courses tab</p></div>
            ) : (
              studentEnrollments.map((item) => (
                <div key={item.id} style={{ padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                  <div style={{ fontWeight: 700 }}>{item.courseName}</div>
                  <div className="text-muted">{item.courseCode}</div>
                </div>
              ))
            )}
          </div>
          <div className="card">
            <div className="card-header"><div className="card-title">Profile Summary</div></div>
            <div className="grid-2">
              <div><div className="text-muted">Name</div><div style={{ fontWeight: 700 }}>{userProfile?.fullName || userProfile?.name}</div></div>
              <div><div className="text-muted">Student Number</div><div style={{ fontWeight: 700 }}>{userProfile?.studentNumber || userProfile?.studentId || "-"}</div></div>
              <div><div className="text-muted">Faculty</div><div style={{ fontWeight: 700 }}>{userProfile?.faculty || "-"}</div></div>
              <div><div className="text-muted">Email</div><div style={{ fontWeight: 700 }}>{currentUser?.email}</div></div>
            </div>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Recent Reports</div>
              <div className="card-subtitle">Latest lecture reports submitted</div>
            </div>
          </div>
          {recentReports.length === 0 ? (
            <div className="empty-state"><h3>No reports yet</h3><p>Reports will appear here once submitted</p></div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead><tr><th>Course</th><th>Lecturer</th><th>Date</th><th>Week</th><th>Attendance</th><th>Status</th></tr></thead>
                <tbody>
                  {recentReports.map((report) => (
                    <tr key={report.id}>
                      <td><div style={{ fontWeight: 600 }}>{report.courseName}</div><div className="text-muted">{report.courseCode}</div></td>
                      <td>{report.lecturerName || "-"}</td>
                      <td>{report.dateOfLecture || report.lectureDate || "-"}</td>
                      <td><span className="badge badge-blue">Week {report.weekOfReporting}</span></td>
                      <td>{report.actualStudents || report.actualStudentsPresent || 0}/{report.registeredStudents || report.totalRegisteredStudents || 0}</td>
                      <td>{statusBadge(report.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </Layout>
  );
}
