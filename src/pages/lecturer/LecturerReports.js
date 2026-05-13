import React, { useState, useEffect } from "react";
import Layout from "../../components/Layout";
import { useAuth } from "../../context/AuthContext";
import { collection, addDoc, getDocs, query, where, deleteDoc, doc, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebase/config";
import toast from "../../components/Toast";
import { FACULTIES } from "../../constants/academic";

const INITIAL_FORM = {
  facultyName: "",
  className: "",
  weekOfReporting: "",
  dateOfLecture: "",
  courseName: "",
  courseCode: "",
  lecturerName: "",
  actualStudents: "",
  registeredStudents: "",
  venue: "",
  scheduledTime: "",
  topicTaught: "",
  learningOutcomes: "",
  recommendations: "",
};

export default function LecturerReports() {
  const { userProfile, currentUser } = useAuth();
  const [reports, setReports] = useState([]);
  const [classes, setClasses] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [viewReport, setViewReport] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (currentUser?.uid) {
      loadReports();
      loadClasses();
    }
  }, [currentUser]);

  const loadReports = async () => {
    try {
      const q = query(collection(db, "reports"), where("lecturerId", "==", currentUser?.uid));
      const snapshot = await getDocs(q);
      const reportsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setReports(reportsData);
    } catch (error) {
      console.warn("Error loading reports:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadClasses = async () => {
    try {
      const q = query(collection(db, "classes"), where("lecturerId", "==", currentUser?.uid));
      const snapshot = await getDocs(q);
      const classesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setClasses(classesData);
    } catch (error) {
      console.warn("Error loading classes:", error);
    }
  };

  const handleClassSelect = (e) => {
    const cls = classes.find((c) => c.id === e.target.value);
    if (cls) {
      setForm((f) => ({
        ...f,
        className: cls.className,
        courseCode: cls.courseCode || cls.programmeCode || "",
        courseName: cls.courseName || cls.programmeName || "",
        venue: cls.venue,
        scheduledTime: cls.scheduledTime,
        registeredStudents: String(cls.registeredStudents),
        facultyName: userProfile?.faculty || "",
        lecturerName: userProfile?.name || "",
      }));
    }
  };

  const validate = () => {
    const e = {};
    const facultyName = userProfile?.faculty || form.facultyName;
    if (!facultyName) e.facultyName = "Faculty required";
    if (!form.className.trim()) e.className = "Class name required";
    if (!form.weekOfReporting) e.weekOfReporting = "Week required";
    else if (Number(form.weekOfReporting) < 1 || Number(form.weekOfReporting) > 20) e.weekOfReporting = "Week must be between 1 and 20";
    if (!form.dateOfLecture) e.dateOfLecture = "Date required";
    if (!form.courseName.trim()) e.courseName = "Course name required";
    if (!form.courseCode.trim()) e.courseCode = "Course code required";
    if (!form.lecturerName.trim()) e.lecturerName = "Lecturer name required";
    if (!form.actualStudents) e.actualStudents = "Actual students required";
    else if (Number(form.actualStudents) < 0) e.actualStudents = "Actual students cannot be negative";
    if (!form.registeredStudents) e.registeredStudents = "Registered students required";
    else if (Number(form.registeredStudents) < 0) e.registeredStudents = "Registered students cannot be negative";
    if (!form.venue.trim()) e.venue = "Venue required";
    if (!form.topicTaught.trim()) e.topicTaught = "Topic required";
    if (!form.learningOutcomes.trim()) e.learningOutcomes = "Learning outcomes required";
    return e;
  };

  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      toast.error("Please fill all required fields");
      return;
    }
    
    setSubmitting(true);
    try {
      const facultyName = userProfile?.faculty || form.facultyName;
      const totalRegisteredStudents = Number(form.registeredStudents);

      const reportData = {
        ...form,
        facultyName,
        faculty: facultyName,
        actualStudents: Number(form.actualStudents),
        actualStudentsPresent: Number(form.actualStudents),
        registeredStudents: totalRegisteredStudents,
        totalRegisteredStudents: totalRegisteredStudents,
        venue: form.venue.trim(),
        weekOfReporting: Number(form.weekOfReporting),
        lectureDate: form.dateOfLecture,
        lectureTime: form.scheduledTime,
        lecturerId: currentUser.uid,
        lecturerEmail: currentUser.email,
        lecturerName: userProfile?.fullName || userProfile?.name || form.lecturerName,
        status: "pending",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      await addDoc(collection(db, "reports"), reportData);
      toast.success("Report submitted successfully");
      setShowModal(false);
      setForm(INITIAL_FORM);
      setErrors({});
      await loadReports();
    } catch (error) {
      console.warn("Error submitting report:", error);
      toast.error(error.code === "permission-denied" ? "Permission denied. Please confirm your lecturer account is assigned to the selected faculty." : (error.message || "Failed to submit report"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this report?")) return;
    setDeleting(id);
    try {
      await deleteDoc(doc(db, "reports", id));
      toast.success("Report deleted successfully");
      await loadReports();
    } catch (error) {
      console.warn("Error deleting report:", error);
      toast.error("Failed to delete report");
    } finally {
      setDeleting(null);
    }
  };

  const filtered = reports.filter(r =>
    r.courseName?.toLowerCase().includes(search.toLowerCase()) ||
    r.courseCode?.toLowerCase().includes(search.toLowerCase()) ||
    r.topicTaught?.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-MY", { day: "2-digit", month: "short", year: "numeric" });
  };

  return (
    <Layout title="Lecture Reports">
      <div className="page-header">
        <div><h1 className="page-title">Lecture Reports</h1><p className="page-subtitle">Submit and manage your weekly lecture reports</p></div>
        <div style={{ display: "flex", gap: 12 }}>
          <button className="btn btn-primary" onClick={() => { setForm({ ...INITIAL_FORM, lecturerName: userProfile?.fullName || userProfile?.name || "", facultyName: userProfile?.faculty || "" }); setErrors({}); setShowModal(true); }}>New Report</button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}><div className="search-bar"><span>Search</span><input placeholder="Search reports by course, code or topic..." value={search} onChange={(e) => setSearch(e.target.value)} /></div></div>

      <div className="card">
        <div className="card-header"><div className="card-title">My Reports</div><span className="badge badge-purple">{filtered.length} reports</span></div>
        {filtered.length === 0 ? (<div className="empty-state"><div className="empty-state-icon">No Reports</div><h3>No reports yet</h3><p>Click New Report to submit your first lecture report</p></div>) : (
          <div className="table-container"><table className="table"><thead><tr><th>Course</th><th>Week</th><th>Date</th><th>Topic</th><th>Attendance</th><th>Status</th><th>Actions</th></tr></thead><tbody>{filtered.map((r) => (<tr key={r.id}><td><div style={{ fontWeight: 600 }}>{r.courseName}</div><div className="text-muted">{r.courseCode}</div></td><td><span className="badge badge-blue">Week {r.weekOfReporting}</span></td><td>{r.dateOfLecture}</td><td style={{ maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.topicTaught}</td><td><span style={{ fontWeight: 600 }}>{r.actualStudents}</span><span className="text-muted">/{r.registeredStudents}</span><div className="text-muted" style={{ fontSize: 11 }}>{r.registeredStudents ? Math.round((r.actualStudents / r.registeredStudents) * 100) : 0}%</div></td><td>{r.status === "reviewed" ? <span className="badge badge-green">Reviewed</span> : <span className="badge badge-yellow">Pending</span>}</td><td><div className="flex gap-2"><button className="btn btn-secondary btn-sm" onClick={() => setViewReport(r)}>View</button><button className="btn btn-danger btn-sm" onClick={() => handleDelete(r.id)} disabled={deleting === r.id}>{deleting === r.id ? <span className="loading-spinner" style={{ width: 12, height: 12 }} /> : "Delete"}</button></div></td></tr>))}</tbody></table></div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" style={{ maxWidth: 700, maxHeight: "90vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h3>New Lecture Report</h3><button className="btn btn-icon btn-secondary" onClick={() => setShowModal(false)}>Close</button></div>
            <div className="modal-body">
              {classes.length > 0 && (<div className="form-group"><label className="form-label">Quick Fill from Class</label><select className="form-control" onChange={handleClassSelect} defaultValue=""><option value="">Select a class to auto-fill...</option>{classes.map((c) => (<option key={c.id} value={c.id}>{c.className}  {c.programmeName}</option>))}</select></div>)}
              <div className="divider" />
              <div className="form-row"><div className="form-group"><label className="form-label">Faculty *</label><select className={`form-control ${errors.facultyName ? "error" : ""}`} value={form.facultyName} onChange={(e) => setForm({ ...form, facultyName: e.target.value })} disabled={Boolean(userProfile?.faculty)}><option value="">Select faculty...</option>{FACULTIES.map(f => <option key={f} value={f}>{f}</option>)}</select>{errors.facultyName && <div className="form-error">{errors.facultyName}</div>}</div><div className="form-group"><label className="form-label">Class Name *</label><input className={`form-control ${errors.className ? "error" : ""}`} placeholder="e.g., BBA Year 1 Group A" value={form.className} onChange={(e) => setForm({ ...form, className: e.target.value })} />{errors.className && <div className="form-error">{errors.className}</div>}</div></div>
              <div className="form-row"><div className="form-group"><label className="form-label">Week of Reporting *</label><input type="number" min="1" max="20" className={`form-control ${errors.weekOfReporting ? "error" : ""}`} placeholder="1-20" value={form.weekOfReporting} onChange={(e) => setForm({ ...form, weekOfReporting: e.target.value })} />{errors.weekOfReporting && <div className="form-error">{errors.weekOfReporting}</div>}</div><div className="form-group"><label className="form-label">Date of Lecture *</label><input type="date" className={`form-control ${errors.dateOfLecture ? "error" : ""}`} value={form.dateOfLecture} onChange={(e) => setForm({ ...form, dateOfLecture: e.target.value })} />{errors.dateOfLecture && <div className="form-error">{errors.dateOfLecture}</div>}</div></div>
              <div className="form-row"><div className="form-group"><label className="form-label">Course Name *</label><input className={`form-control ${errors.courseName ? "error" : ""}`} placeholder="e.g., Software Engineering" value={form.courseName} onChange={(e) => setForm({ ...form, courseName: e.target.value })} />{errors.courseName && <div className="form-error">{errors.courseName}</div>}</div><div className="form-group"><label className="form-label">Course Code *</label><input className={`form-control ${errors.courseCode ? "error" : ""}`} placeholder="e.g., ICT3012" value={form.courseCode} onChange={(e) => setForm({ ...form, courseCode: e.target.value })} />{errors.courseCode && <div className="form-error">{errors.courseCode}</div>}</div></div>
              <div className="form-group"><label className="form-label">Lecturer's Name *</label><input className={`form-control ${errors.lecturerName ? "error" : ""}`} placeholder="Full name" value={form.lecturerName} onChange={(e) => setForm({ ...form, lecturerName: e.target.value })} />{errors.lecturerName && <div className="form-error">{errors.lecturerName}</div>}</div>
              <div className="form-row"><div className="form-group"><label className="form-label">Actual Students Present *</label><input type="number" min="0" className={`form-control ${errors.actualStudents ? "error" : ""}`} placeholder="e.g., 28" value={form.actualStudents} onChange={(e) => setForm({ ...form, actualStudents: e.target.value })} />{errors.actualStudents && <div className="form-error">{errors.actualStudents}</div>}</div><div className="form-group"><label className="form-label">Registered Students *</label><input type="number" min="0" className={`form-control ${errors.registeredStudents ? "error" : ""}`} placeholder="e.g., 35" value={form.registeredStudents} onChange={(e) => setForm({ ...form, registeredStudents: e.target.value })} />{errors.registeredStudents && <div className="form-error">{errors.registeredStudents}</div>}</div></div>
              <div className="form-row"><div className="form-group"><label className="form-label">Venue of Class *</label><input className={`form-control ${errors.venue ? "error" : ""}`} placeholder="e.g., MM1, Room 3, Hall 6" value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} />{errors.venue && <div className="form-error">{errors.venue}</div>}</div><div className="form-group"><label className="form-label">Scheduled Lecture Time</label><input className="form-control" placeholder="e.g., 9:00 AM - 11:00 AM" value={form.scheduledTime} onChange={(e) => setForm({ ...form, scheduledTime: e.target.value })} /></div></div>
              <div className="form-group"><label className="form-label">Topic Taught *</label><input className={`form-control ${errors.topicTaught ? "error" : ""}`} placeholder="e.g., Introduction to React Hooks" value={form.topicTaught} onChange={(e) => setForm({ ...form, topicTaught: e.target.value })} />{errors.topicTaught && <div className="form-error">{errors.topicTaught}</div>}</div>
              <div className="form-group"><label className="form-label">Learning Outcomes of the Topic *</label><textarea className={`form-control ${errors.learningOutcomes ? "error" : ""}`} rows={3} placeholder="Students will be able to..." value={form.learningOutcomes} onChange={(e) => setForm({ ...form, learningOutcomes: e.target.value })} />{errors.learningOutcomes && <div className="form-error">{errors.learningOutcomes}</div>}</div>
              <div className="form-group"><label className="form-label">Lecturer's Recommendations</label><textarea className="form-control" rows={3} placeholder="Any recommendations or notes..." value={form.recommendations} onChange={(e) => setForm({ ...form, recommendations: e.target.value })} /></div>
            </div>
            <div className="modal-footer"><button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button><button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>{submitting ? <span className="loading-spinner" style={{ width: 16, height: 16 }} /> : "Submit Report"}</button></div>
          </div>
        </div>
      )}

      {viewReport && (
        <div className="modal-overlay" onClick={() => setViewReport(null)}>
          <div className="modal" style={{ maxWidth: 700, maxHeight: "90vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h3>Report Details</h3><button className="btn btn-icon btn-secondary" onClick={() => setViewReport(null)}>Close</button></div>
            <div className="modal-body">
              <div className="grid-2" style={{ gap: 12, marginBottom: 16 }}>{[["Faculty", viewReport.facultyName], ["Class", viewReport.className], ["Course", viewReport.courseName], ["Code", viewReport.courseCode], ["Lecturer", viewReport.lecturerName], ["Week", `Week ${viewReport.weekOfReporting}`], ["Date", viewReport.dateOfLecture], ["Venue", viewReport.venue], ["Time", viewReport.scheduledTime || "-"], ["Attendance", `${viewReport.actualStudents}/${viewReport.registeredStudents} (${viewReport.registeredStudents ? Math.round((viewReport.actualStudents / viewReport.registeredStudents) * 100) : 0}%)`]].map(([k, v]) => (<div key={k} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: "10px 14px" }}><div className="text-muted" style={{ fontSize: 11, marginBottom: 3 }}>{k}</div><div style={{ fontWeight: 600, fontSize: 14 }}>{v || "-"}</div></div>))}</div>
              {[["Topic Taught", viewReport.topicTaught], ["Learning Outcomes", viewReport.learningOutcomes], ["Recommendations", viewReport.recommendations]].map(([k, v]) => v ? (<div key={k} style={{ marginBottom: 12 }}><div className="form-label">{k}</div><div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: "10px 14px", fontSize: 14, lineHeight: 1.6 }}>{v}</div></div>) : null)}
              {viewReport.feedback && (<div style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 8, padding: "12px 14px", marginTop: 12 }}><div className="form-label" style={{ color: "var(--success)", marginBottom: 8 }}>Feedback from PRL</div><div style={{ fontSize: 14, lineHeight: 1.6 }}>{viewReport.feedback}</div></div>)}
            </div>
            <div className="modal-footer"><button className="btn btn-secondary" onClick={() => setViewReport(null)}>Close</button></div>
          </div>
        </div>
      )}
    </Layout>
  );
}

