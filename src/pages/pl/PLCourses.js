import React, { useState, useEffect } from "react";
import Layout from "../../components/Layout";
import { useAuth } from "../../context/AuthContext";
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where } from "firebase/firestore";
import { db } from "../../firebase/config";
import toast from "../../components/Toast";
import { exportToExcel as downloadExcel } from "../../utils/exportCsv";
import { FACULTIES } from "../../constants/academic";

export default function PLCourses() {
  const { userProfile, currentUser } = useAuth();
  const [courses, setCourses] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ name: "", code: "", faculty: "", lecturerId: "", registeredStudents: "", status: "active", description: "" });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const coursesSnapshot = await getDocs(collection(db, "courses"));
      const coursesData = coursesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCourses(coursesData);

      const lecturersQuery = query(collection(db, "users"), where("role", "==", "lecturer"));
      const lecturersSnapshot = await getDocs(lecturersQuery);
      const lecturersData = lecturersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLecturers(lecturersData);
    } catch (error) {
      console.warn("Error loading data:", error);
      toast.error("Failed to load courses");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!form.name || !form.code || !form.faculty) {
      toast.error("Course name, code and faculty are required");
      return;
    }
    if (Number(form.registeredStudents || 0) < 0) {
      toast.error("Registered students cannot be negative");
      return;
    }
    setSubmitting(true);
    try {
      const lecturer = lecturers.find((l) => l.id === form.lecturerId);
      const courseData = {
        ...form,
        courseName: form.name,
        courseCode: form.code,
        faculty: form.faculty,
        lecturerName: lecturer?.name || "",
        lecturerEmail: lecturer?.email || "",
        programLeaderId: currentUser?.uid || "",
        registeredStudents: Number(form.registeredStudents) || 0,
        totalRegisteredStudents: Number(form.registeredStudents) || 0
      };
      if (editItem) {
        await updateDoc(doc(db, "courses", editItem.id), { ...courseData, updatedAt: new Date().toISOString() });
        toast.success("Course updated");
      } else {
        await addDoc(collection(db, "courses"), { ...courseData, createdAt: new Date().toISOString() });
        toast.success("Course added");
      }
      setShowModal(false);
      setForm({ name: "", code: "", faculty: "", lecturerId: "", registeredStudents: "", status: "active", description: "" });
      setEditItem(null);
      await loadData();
    } catch (error) {
      console.warn("Error saving course:", error);
      toast.error("Failed to save course");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this course?")) return;
    try {
      await deleteDoc(doc(db, "courses", id));
      toast.success("Course deleted");
      await loadData();
    } catch (error) {
      console.warn("Error deleting course:", error);
      toast.error("Failed to delete course");
    }
  };

  const exportToExcel = () => {
    const exportData = courses.map(c => ({
      "Course Name": c.name,
      "Course Code": c.code,
      "Faculty": c.faculty,
      "Assigned Lecturer": lecturers.find(l => l.id === c.lecturerId)?.name || "Unassigned",
      "Registered Students": c.registeredStudents,
      "Status": c.status
    }));
    downloadExcel(exportData, `courses-${new Date().toISOString().slice(0, 10)}`, "Courses");
  };

  const filteredCourses = courses.filter(c => c.name?.toLowerCase().includes(search.toLowerCase()) || c.code?.toLowerCase().includes(search.toLowerCase()));
  const filteredLecturers = form.faculty
    ? lecturers.filter((l) => l.faculty === form.faculty)
    : lecturers;

  return (
    <Layout title="Course Management">
      <div className="page-header">
        <div><h1 className="page-title">Course Management</h1><p className="page-subtitle">Add and assign course modules to lecturers</p></div>
        <div style={{ display: "flex", gap: 12 }}>
          <button className="btn btn-secondary" onClick={exportToExcel}>Export Excel</button>
          <button className="btn btn-primary" onClick={() => { setEditItem(null); setForm({ name: "", code: "", faculty: userProfile?.faculty || "", lecturerId: "", registeredStudents: "", status: "active", description: "" }); setShowModal(true); }}>Add Course</button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="search-bar"><span>Search</span><input placeholder="Search by name or code..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>
      </div>

      <div className="card">
        <div className="card-header"><div className="card-title">All Courses</div><span className="badge badge-purple">{filteredCourses.length} courses</span></div>
        {loading ? (<div className="loading-overlay"><div className="loading-spinner" /></div>) : filteredCourses.length === 0 ? (<div className="empty-state"><p>No courses found</p></div>) : (
          <div className="table-container">
            <table className="table">
              <thead><tr><th>Course Name</th><th>Code</th><th>Faculty</th><th>Assigned Lecturer</th><th>Students</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {filteredCourses.map(c => (
                  <tr key={c.id}>
                    <td><div style={{ fontWeight: 600 }}>{c.name}</div>{c.description && <div className="text-muted" style={{ fontSize: 12 }}>{c.description.slice(0, 50)}</div>}</td>
                    <td><span className="badge badge-blue">{c.code}</span></td>
                    <td className="text-muted" style={{ fontSize: 12 }}>{c.faculty || "-"}</td>
                    <td>{lecturers.find(l => l.id === c.lecturerId)?.name || <span className="badge badge-yellow">Unassigned</span>}</td>
                    <td>{c.registeredStudents || 0}</td>
                    <td><span className={`badge ${c.status === "active" ? "badge-green" : "badge-red"}`}>{c.status || "active"}</span></td>
                    <td><button className="btn btn-secondary btn-sm" onClick={() => { setEditItem(c); setForm({ name: c.name || "", code: c.code || "", faculty: c.faculty || userProfile?.faculty || "", lecturerId: c.lecturerId || "", registeredStudents: c.registeredStudents || "", status: c.status || "active", description: c.description || "" }); setShowModal(true); }}>Edit</button><button className="btn btn-danger btn-sm" onClick={() => handleDelete(c.id)}>Delete</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" style={{ maxWidth: 500 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h3>{editItem ? "Edit Course" : "Add Course"}</h3><button className="btn btn-icon btn-secondary" onClick={() => setShowModal(false)}>Close</button></div>
            <div className="modal-body">
              <div className="form-group"><label className="form-label">Course Name *</label><input className="form-control" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div className="form-group"><label className="form-label">Course Code *</label><input className="form-control" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} /></div>
              <div className="form-group"><label className="form-label">Faculty *</label><select className="form-control" value={form.faculty} onChange={(e) => setForm({ ...form, faculty: e.target.value, lecturerId: "" })}><option value="">Select faculty...</option>{FACULTIES.map(f => <option key={f} value={f}>{f}</option>)}</select></div>
              <div className="form-group"><label className="form-label">Assign Lecturer</label><select className="form-control" value={form.lecturerId} onChange={(e) => setForm({ ...form, lecturerId: e.target.value })} disabled={!form.faculty}><option value="">{form.faculty ? "Select Lecturer" : "Select a faculty first"}</option>{filteredLecturers.map(l => (<option key={l.id} value={l.id}>{l.name}</option>))}</select></div>
              <div className="form-group"><label className="form-label">Registered Students</label><input type="number" min="0" className="form-control" value={form.registeredStudents} onChange={(e) => setForm({ ...form, registeredStudents: e.target.value })} /></div>
              <div className="form-group"><label className="form-label">Description</label><textarea className="form-control" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div className="form-group"><label className="form-label">Status</label><select className="form-control" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><option value="active">Active</option><option value="inactive">Inactive</option></select></div>
            </div>
            <div className="modal-footer"><button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button><button className="btn btn-primary" onClick={handleSave} disabled={submitting}>{submitting ? <span className="loading-spinner" /> : (editItem ? "Update" : "Add")}</button></div>
          </div>
        </div>
      )}
    </Layout>
  );
}
