import React, { useState, useEffect } from "react";
import Layout from "../../components/Layout";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase/config";
import { exportToExcel as downloadExcel } from "../../utils/exportCsv";

export default function PLReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [viewReport, setViewReport] = useState(null);

  useEffect(() => { loadReports(); }, []);

  const loadReports = async () => {
    try {
      const snapshot = await getDocs(collection(db, "reports"));
      const reportsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setReports(reportsData);
    } catch (error) { console.warn(error); } finally { setLoading(false); }
  };

  const exportToExcel = () => {
    const data = filtered.map(r => ({
      Faculty: r.facultyName, Class: r.className, Week: r.weekOfReporting, Date: r.dateOfLecture,
      Course: r.courseName, Code: r.courseCode, Lecturer: r.lecturerName,
      Present: r.actualStudents, Registered: r.registeredStudents,
      "Attendance Rate": r.registeredStudents ? Math.round((r.actualStudents / r.registeredStudents) * 100) : 0,
      Topic: r.topicTaught, Status: r.status || "Pending"
    }));
    downloadExcel(data, `pl-reports-${new Date().toISOString().slice(0, 10)}`, "PL Reports");
  };

  const filtered = reports.filter(r => {
    const matchSearch = r.courseName?.toLowerCase().includes(search.toLowerCase()) || r.lecturerName?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || r.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalReports = reports.length;
  const reviewed = reports.filter(r => r.status === "reviewed").length;
  const pending = reports.length - reviewed;

  return (
    <Layout title="Reports">
      <div className="page-header">
        <div><h1 className="page-title">All Reports</h1><p className="page-subtitle">View reports from Principal Lecturers</p></div>
        <button className="btn btn-secondary" onClick={exportToExcel}>Export Excel</button>
      </div>

      <div className="stat-grid" style={{ marginBottom: 20 }}>
        <div className="stat-card purple"><div className="stat-value">{totalReports}</div><div className="stat-label">Total Reports</div></div>
        <div className="stat-card green"><div className="stat-value">{reviewed}</div><div className="stat-label">Reviewed</div></div>
        <div className="stat-card orange"><div className="stat-value">{pending}</div><div className="stat-label">Pending</div></div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 12 }}>
          <div className="search-bar" style={{ flex: 1 }}><span>Search</span><input placeholder="Search by course or lecturer..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>
          <select className="form-control" style={{ width: 160 }} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}><option value="all">All Status</option><option value="pending">Pending</option><option value="reviewed">Reviewed</option></select>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><div className="card-title">Reports from PRL</div><span className="badge badge-purple">{filtered.length} reports</span></div>
        {loading ? (<div className="loading-overlay" />) : filtered.length === 0 ? (<div className="empty-state"><p>No reports found</p></div>) : (
          <div className="table-container">
            <table className="table">
              <thead><tr><th>Course</th><th>Lecturer</th><th>Week</th><th>Date</th><th>Attendance</th><th>Status</th><th>View</th></tr></thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r.id}>
                    <td><div style={{ fontWeight: 600 }}>{r.courseName}</div><div className="text-muted">{r.courseCode}</div></td>
                    <td>{r.lecturerName}</td>
                    <td><span className="badge badge-blue">Week {r.weekOfReporting}</span></td>
                    <td>{r.dateOfLecture}</td>
                    <td>{r.actualStudents}/{r.registeredStudents}</td>
                    <td>{r.status === "reviewed" ? <span className="badge badge-green">Reviewed</span> : <span className="badge badge-yellow">Pending</span>}</td>
                    <td><button className="btn btn-secondary btn-sm" onClick={() => setViewReport(r)}>View</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {viewReport && (
        <div className="modal-overlay" onClick={() => setViewReport(null)}>
          <div className="modal" style={{ maxWidth: 600 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h3>Report Details</h3><button className="btn btn-icon btn-secondary" onClick={() => setViewReport(null)}>Close</button></div>
            <div className="modal-body">
              <div className="grid-2" style={{ gap: 10, marginBottom: 16 }}>
                {[["Faculty", viewReport.facultyName], ["Class", viewReport.className], ["Course", viewReport.courseName], ["Code", viewReport.courseCode], ["Lecturer", viewReport.lecturerName], ["Week", `Week ${viewReport.weekOfReporting}`], ["Date", viewReport.dateOfLecture], ["Venue", viewReport.venue], ["Attendance", `${viewReport.actualStudents}/${viewReport.registeredStudents}`]].map(([k, v]) => (<div key={k} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: "10px 14px" }}><div className="text-muted" style={{ fontSize: 11 }}>{k}</div><div style={{ fontWeight: 600 }}>{v || "-"}</div></div>))}
              </div>
              <div><strong>Topic Taught:</strong><p>{viewReport.topicTaught}</p></div>
              <div><strong>Learning Outcomes:</strong><p>{viewReport.learningOutcomes}</p></div>
              {viewReport.recommendations && <div><strong>Recommendations:</strong><p>{viewReport.recommendations}</p></div>}
              {viewReport.feedback && <div style={{ background: "rgba(16,185,129,0.08)", padding: 12, borderRadius: 8 }}><strong>PRL Feedback:</strong><p>{viewReport.feedback}</p></div>}
            </div>
            <div className="modal-footer"><button className="btn btn-secondary" onClick={() => setViewReport(null)}>Close</button></div>
          </div>
        </div>
      )}
    </Layout>
  );
}
