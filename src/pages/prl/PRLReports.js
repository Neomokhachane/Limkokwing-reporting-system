import React, { useState, useEffect } from "react";
import Layout from "../../components/Layout";
import { useAuth } from "../../context/AuthContext";
import { collection, getDocs, query, where, updateDoc, doc } from "firebase/firestore";
import { db } from "../../firebase/config";
import toast from "../../components/Toast";
import { exportToExcel } from "../../utils/exportCsv";

export default function PRLReports() {
  const { userProfile, currentUser } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [viewReport, setViewReport] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [saving, setSaving] = useState(false);

  const loadReports = async () => {
    if (!userProfile?.faculty) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const q = query(collection(db, "reports"), where("facultyName", "==", userProfile.faculty));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
      data.sort((a, b) => new Date(b.createdAt || b.dateOfLecture || 0) - new Date(a.createdAt || a.dateOfLecture || 0));
      setReports(data);
    } catch (error) {
      console.warn("Error loading PRL reports:", error);
      toast.error("Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [userProfile]);

  const openReport = (report) => {
    setViewReport(report);
    setFeedback(report.feedback || "");
  };

  const saveFeedback = async () => {
    if (!viewReport) return;
    if (!feedback.trim()) {
      toast.error("Please enter feedback before saving");
      return;
    }

    setSaving(true);
    try {
      await updateDoc(doc(db, "reports", viewReport.id), {
        feedback: feedback.trim(),
        feedbackBy: currentUser?.uid || "",
        feedbackByName: userProfile?.name || "Principal Lecturer",
        feedbackAt: new Date().toISOString(),
        status: "reviewed"
      });
      toast.success("Feedback saved");
      setViewReport(null);
      setFeedback("");
      await loadReports();
    } catch (error) {
      console.warn("Error saving feedback:", error);
      toast.error("Failed to save feedback");
    } finally {
      setSaving(false);
    }
  };

  const filtered = reports.filter((report) => {
    const term = search.toLowerCase();
    const matchesSearch =
      report.courseName?.toLowerCase().includes(term) ||
      report.courseCode?.toLowerCase().includes(term) ||
      report.lecturerName?.toLowerCase().includes(term) ||
      report.className?.toLowerCase().includes(term) ||
      report.topicTaught?.toLowerCase().includes(term);
    const matchesStatus = filterStatus === "all" || (report.status || "pending") === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const exportReports = () => {
    const data = filtered.map((report) => ({
      Faculty: report.facultyName,
      Class: report.className,
      Week: report.weekOfReporting,
      Date: report.dateOfLecture,
      Course: report.courseName,
      Code: report.courseCode,
      Lecturer: report.lecturerName,
      Present: report.actualStudents,
      Registered: report.registeredStudents,
      "Attendance Rate": report.registeredStudents ? `${Math.round((report.actualStudents / report.registeredStudents) * 100)}%` : "0%",
      Topic: report.topicTaught,
      Feedback: report.feedback || "",
      Status: report.status || "pending"
    }));
    exportToExcel(data, `prl-reports-${new Date().toISOString().slice(0, 10)}`, "PRL Reports");
  };

  const reviewed = reports.filter((report) => report.status === "reviewed").length;
  const pending = reports.length - reviewed;

  return (
    <Layout title="Reports">
      <div className="page-header">
        <div>
          <h1 className="page-title">Faculty Reports</h1>
          <p className="page-subtitle">Review lecturer reports and add PRL feedback</p>
        </div>
        <button className="btn btn-secondary" onClick={exportReports}>Export Excel</button>
      </div>

      <div className="stat-grid" style={{ marginBottom: 20 }}>
        <div className="stat-card purple"><div className="stat-value">{reports.length}</div><div className="stat-label">Total Reports</div></div>
        <div className="stat-card green"><div className="stat-value">{reviewed}</div><div className="stat-label">Reviewed</div></div>
        <div className="stat-card orange"><div className="stat-value">{pending}</div><div className="stat-label">Pending</div></div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <div className="search-bar" style={{ flex: 1, minWidth: 240 }}>
            <span>Search</span>
            <input placeholder="Search course, lecturer, class or topic..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className="form-control" style={{ width: 160 }} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="reviewed">Reviewed</option>
          </select>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Reports</div>
          <span className="badge badge-purple">{filtered.length} reports</span>
        </div>
        {loading ? (
          <div className="loading-overlay"><div className="loading-spinner" /><span>Loading reports...</span></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state"><h3>No reports found</h3><p>Lecturer reports for your faculty will appear here</p></div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead><tr><th>Course</th><th>Lecturer</th><th>Class</th><th>Week</th><th>Attendance</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>
                {filtered.map((report) => (
                  <tr key={report.id}>
                    <td><div style={{ fontWeight: 600 }}>{report.courseName}</div><div className="text-muted">{report.courseCode}</div></td>
                    <td>{report.lecturerName}</td>
                    <td>{report.className}</td>
                    <td><span className="badge badge-blue">Week {report.weekOfReporting}</span></td>
                    <td>{report.actualStudents}/{report.registeredStudents}</td>
                    <td>{report.status === "reviewed" ? <span className="badge badge-green">Reviewed</span> : <span className="badge badge-yellow">Pending</span>}</td>
                    <td><button className="btn btn-secondary btn-sm" onClick={() => openReport(report)}>Review</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {viewReport && (
        <div className="modal-overlay" onClick={() => setViewReport(null)}>
          <div className="modal" style={{ maxWidth: 720, maxHeight: "90vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h3>Review Report</h3><button className="btn btn-icon btn-secondary" onClick={() => setViewReport(null)}>Close</button></div>
            <div className="modal-body">
              <div className="grid-2" style={{ gap: 10, marginBottom: 16 }}>
                {[["Faculty", viewReport.facultyName], ["Class", viewReport.className], ["Course", viewReport.courseName], ["Code", viewReport.courseCode], ["Lecturer", viewReport.lecturerName], ["Week", `Week ${viewReport.weekOfReporting}`], ["Date", viewReport.dateOfLecture], ["Venue", viewReport.venue], ["Time", viewReport.scheduledTime || "-"], ["Attendance", `${viewReport.actualStudents}/${viewReport.registeredStudents}`]].map(([label, value]) => (
                  <div key={label} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: "10px 14px" }}><div className="text-muted" style={{ fontSize: 11 }}>{label}</div><div style={{ fontWeight: 600 }}>{value || "-"}</div></div>
                ))}
              </div>
              <div className="form-group"><label className="form-label">Topic Taught</label><div style={{ lineHeight: 1.6 }}>{viewReport.topicTaught || "-"}</div></div>
              <div className="form-group"><label className="form-label">Learning Outcomes</label><div style={{ lineHeight: 1.6 }}>{viewReport.learningOutcomes || "-"}</div></div>
              <div className="form-group"><label className="form-label">Lecturer Recommendations</label><div style={{ lineHeight: 1.6 }}>{viewReport.recommendations || "-"}</div></div>
              <div className="form-group"><label className="form-label">PRL Feedback *</label><textarea className="form-control" rows={4} value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Add feedback for this lecturer report..." /></div>
            </div>
            <div className="modal-footer"><button className="btn btn-secondary" onClick={() => setViewReport(null)}>Cancel</button><button className="btn btn-primary" onClick={saveFeedback} disabled={saving}>{saving ? <span className="loading-spinner" /> : "Save Feedback"}</button></div>
          </div>
        </div>
      )}
    </Layout>
  );
}
