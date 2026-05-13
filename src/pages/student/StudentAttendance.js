import React, { useMemo, useState } from "react";
import Layout from "../../components/Layout";
import { useAuth } from "../../context/AuthContext";
import useFirestoreCollection from "../../hooks/useFirestoreCollection";
import { COLLECTIONS } from "../../services/firebaseRepository";
import { exportToExcel } from "../../utils/exportCsv";

const statusBadge = (status) => {
  if (status === "present") return <span className="badge badge-green">Present</span>;
  if (status === "late") return <span className="badge badge-yellow">Late</span>;
  if (status === "absent") return <span className="badge badge-red">Absent</span>;
  return <span className="badge badge-gray">{status || "Unknown"}</span>;
};

const formatDate = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-MY", { day: "2-digit", month: "short", year: "numeric" });
};

export default function StudentAttendance() {
  const { currentUser } = useAuth();
  const [search, setSearch] = useState("");
  const { data: attendance, loading } = useFirestoreCollection(
    COLLECTIONS.attendance,
    [{ field: "studentId", value: currentUser?.uid || "" }]
  );

  const filtered = attendance.filter((item) => {
    const term = search.toLowerCase();
    return (
      item.courseName?.toLowerCase().includes(term) ||
      item.courseCode?.toLowerCase().includes(term) ||
      item.lecturerName?.toLowerCase().includes(term) ||
      item.status?.toLowerCase().includes(term)
    );
  });

  const stats = useMemo(() => {
    const attended = attendance.filter((item) => item.status === "present" || item.status === "late").length;
    const missed = attendance.filter((item) => item.status === "absent").length;
    const rate = attendance.length ? Math.round((attended / attendance.length) * 100) : 0;
    return { attended, missed, total: attendance.length, rate };
  }, [attendance]);

  const exportAttendance = () => {
    const rows = filtered.map((item) => ({
      Date: item.date,
      Course: item.courseName,
      Code: item.courseCode,
      Lecturer: item.lecturerName,
      Status: item.status,
    }));
    exportToExcel(rows, `my-attendance-${new Date().toISOString().slice(0, 10)}`, "Attendance");
  };

  return (
    <Layout title="Attendance">
      <div className="page-header">
        <div>
          <h1 className="page-title">Attendance</h1>
          <p className="page-subtitle">View attendance marked by your lecturers</p>
        </div>
        <button className="btn btn-secondary" onClick={exportAttendance}>Export Excel</button>
      </div>

      <div className="stat-grid" style={{ marginBottom: 20 }}>
        <div className="stat-card purple"><div className="stat-value">{stats.rate}%</div><div className="stat-label">Attendance Rate</div></div>
        <div className="stat-card green"><div className="stat-value">{stats.attended}</div><div className="stat-label">Attended</div></div>
        <div className="stat-card red"><div className="stat-value">{stats.missed}</div><div className="stat-label">Missed</div></div>
        <div className="stat-card blue"><div className="stat-value">{stats.total}</div><div className="stat-label">Total Lectures</div></div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="search-bar">
          <span>Search</span>
          <input placeholder="Search course, lecturer or status..." value={search} onChange={(event) => setSearch(event.target.value)} />
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Attendance History</div>
          <span className="badge badge-purple">{filtered.length} records</span>
        </div>

        {loading ? (
          <div className="loading-overlay"><div className="loading-spinner" /><span>Loading attendance...</span></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state"><h3>No attendance records</h3><p>Your lecturers have not marked attendance yet</p></div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead><tr><th>Date</th><th>Course</th><th>Code</th><th>Lecturer</th><th>Status</th></tr></thead>
              <tbody>
                {[...filtered].sort((a, b) => new Date(b.date) - new Date(a.date)).map((item) => (
                  <tr key={item.id}>
                    <td>{formatDate(item.date)}</td>
                    <td style={{ fontWeight: 600 }}>{item.courseName || "-"}</td>
                    <td>{item.courseCode || "-"}</td>
                    <td>{item.lecturerName || "-"}</td>
                    <td>{statusBadge(item.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}
