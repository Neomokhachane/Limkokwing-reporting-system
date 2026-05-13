import React, { useMemo, useState } from "react";
import Layout from "../../components/Layout";
import { useAuth } from "../../context/AuthContext";
import useFirestoreCollection from "../../hooks/useFirestoreCollection";
import { COLLECTIONS } from "../../services/firebaseRepository";

const getRate = (records) => {
  if (!records.length) return 0;
  const attended = records.filter((item) => item.status === "present" || item.status === "late").length;
  return Math.round((attended / records.length) * 100);
};

export default function StudentMonitoring() {
  const { currentUser } = useAuth();
  const [search, setSearch] = useState("");
  const { data: attendance, loading } = useFirestoreCollection(
    COLLECTIONS.attendance,
    [{ field: "studentId", value: currentUser?.uid || "" }]
  );

  const courseStats = useMemo(() => {
    const grouped = attendance.reduce((acc, item) => {
      const key = item.courseId || item.courseCode || "unknown";
      if (!acc[key]) {
        acc[key] = {
          courseId: key,
          courseName: item.courseName || "Unknown Course",
          courseCode: item.courseCode || "",
          records: [],
        };
      }
      acc[key].records.push(item);
      return acc;
    }, {});

    return Object.values(grouped).map((item) => {
      const attended = item.records.filter((record) => record.status === "present" || record.status === "late").length;
      const missed = item.records.filter((record) => record.status === "absent").length;
      return {
        ...item,
        totalLectures: item.records.length,
        attended,
        missed,
        rate: getRate(item.records),
      };
    });
  }, [attendance]);

  const filteredStats = courseStats.filter((item) => {
    const term = search.toLowerCase();
    return item.courseName.toLowerCase().includes(term) || item.courseCode.toLowerCase().includes(term);
  });

  const overallRate = getRate(attendance);

  return (
    <Layout title="Attendance Monitoring">
      <div className="page-header">
        <div>
          <h1 className="page-title">Attendance Monitoring</h1>
          <p className="page-subtitle">Track your attendance percentage per enrolled course</p>
        </div>
      </div>

      <div className="stat-grid" style={{ marginBottom: 20 }}>
        <div className="stat-card purple"><div className="stat-value">{overallRate}%</div><div className="stat-label">Overall Attendance</div></div>
        <div className="stat-card green"><div className="stat-value">{attendance.filter((item) => item.status === "present").length}</div><div className="stat-label">Attended Lectures</div></div>
        <div className="stat-card red"><div className="stat-value">{attendance.filter((item) => item.status === "absent").length}</div><div className="stat-label">Missed Lectures</div></div>
        <div className="stat-card blue"><div className="stat-value">{courseStats.length}</div><div className="stat-label">Courses Tracked</div></div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="search-bar">
          <span>Search</span>
          <input placeholder="Search attendance by course..." value={search} onChange={(event) => setSearch(event.target.value)} />
        </div>
      </div>

      {loading ? (
        <div className="loading-overlay"><div className="loading-spinner" /><span>Loading attendance...</span></div>
      ) : filteredStats.length === 0 ? (
        <div className="empty-state"><h3>No attendance data</h3><p>Your attendance records will appear after lecturers mark attendance</p></div>
      ) : (
        <div className="grid-2">
          {filteredStats.map((item) => (
            <div key={item.courseId} className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">{item.courseName}</div>
                  <div className="card-subtitle">{item.courseCode}</div>
                </div>
                <span className={`badge ${item.rate >= 80 ? "badge-green" : item.rate >= 60 ? "badge-yellow" : "badge-red"}`}>{item.rate}%</span>
              </div>
              <div style={{ height: 8, background: "rgba(255,255,255,0.08)", borderRadius: 8, overflow: "hidden", marginBottom: 14 }}>
                <div style={{ width: `${item.rate}%`, height: "100%", background: item.rate >= 80 ? "var(--success)" : item.rate >= 60 ? "var(--warning)" : "var(--danger)" }} />
              </div>
              <div className="grid-3">
                <div><div className="text-muted">Total</div><div style={{ fontWeight: 800 }}>{item.totalLectures}</div></div>
                <div><div className="text-muted">Attended</div><div style={{ fontWeight: 800 }}>{item.attended}</div></div>
                <div><div className="text-muted">Missed</div><div style={{ fontWeight: 800 }}>{item.missed}</div></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
