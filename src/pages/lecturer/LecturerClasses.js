import React, { useState, useEffect } from "react";
import Layout from "../../components/Layout";
import { useAuth } from "../../context/AuthContext";
import { collection, addDoc, getDocs, query, where, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "../../firebase/config";
import toast from "../../components/Toast";

const INITIAL_FORM = {
  className: "",
  year: "",
  semester: "",
  venue: "",
  scheduledTime: "",
  registeredStudents: ""
};

export default function LecturerClasses() {
  const { userProfile, currentUser } = useAuth();
  const [classes, setClasses] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState(null);

  const loadClasses = async () => {
    if (!currentUser?.uid) {
      setLoading(false);
      return;
    }
    try {
      const q = query(collection(db, "classes"), where("lecturerId", "==", currentUser.uid));
      const snapshot = await getDocs(q);
      const classesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setClasses(classesData);

      const coursesQuery = query(collection(db, "courses"), where("lecturerId", "==", currentUser.uid));
      const coursesSnapshot = await getDocs(coursesQuery);
      setCourses(coursesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.warn("Error loading classes:", error);
      toast.error("Failed to load classes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClasses();
  }, [currentUser]);

  const validate = () => {
    const newErrors = {};
    if (!form.className.trim()) newErrors.className = "Class name is required";
    if (!form.year) newErrors.year = "Please select a year";
    if (!form.semester) newErrors.semester = "Please select a semester";
    if (!form.venue.trim()) newErrors.venue = "Venue is required";
    if (!form.registeredStudents) newErrors.registeredStudents = "Number of students is required";
    else if (Number(form.registeredStudents) < 0) newErrors.registeredStudents = "Number of students cannot be negative";
    return newErrors;
  };

  const handleSave = async () => {
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Please fill all required fields");
      return;
    }

    setSubmitting(true);
    try {
      const selectedCourse = courses[0];
      const classData = {
        className: form.className.trim(),
        courseId: selectedCourse?.id || "",
        courseName: selectedCourse?.name || selectedCourse?.courseName || userProfile?.programme || "",
        courseCode: selectedCourse?.code || selectedCourse?.courseCode || "",
        programmeName: userProfile?.programme || "",
        programmeCode: selectedCourse?.code || "",
        faculty: userProfile?.faculty || "",
        year: parseInt(form.year),
        semester: parseInt(form.semester),
        venue: form.venue.trim(),
        scheduledTime: form.scheduledTime || "",
        registeredStudents: parseInt(form.registeredStudents),
        lecturerId: currentUser.uid,
        lecturerName: userProfile?.name || "",
        createdAt: new Date().toISOString()
      };

      if (editItem) {
        await updateDoc(doc(db, "classes", editItem.id), { ...classData, updatedAt: new Date().toISOString() });
        toast.success("Class updated successfully");
      } else {
        await addDoc(collection(db, "classes"), classData);
        toast.success("Class added successfully");
      }

      setShowModal(false);
      setForm(INITIAL_FORM);
      setEditItem(null);
      setErrors({});
      await loadClasses();
    } catch (error) {
      console.warn("Error saving class:", error);
      toast.error(error.message || "Failed to save class");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this class?")) return;
    setDeleting(id);
    try {
      await deleteDoc(doc(db, "classes", id));
      toast.success("Class deleted successfully");
      await loadClasses();
    } catch (error) {
      console.warn("Error deleting class:", error);
      toast.error("Failed to delete class");
    } finally {
      setDeleting(null);
    }
  };

  const openEdit = (classItem) => {
    setEditItem(classItem);
    setForm({
      className: classItem.className || "",
      year: classItem.year?.toString() || "",
      semester: classItem.semester?.toString() || "",
      venue: classItem.venue || "",
      scheduledTime: classItem.scheduledTime || "",
      registeredStudents: classItem.registeredStudents?.toString() || ""
    });
    setErrors({});
    setShowModal(true);
  };

  const filteredClasses = classes.filter(c =>
    c.className?.toLowerCase().includes(search.toLowerCase()) ||
    c.courseName?.toLowerCase().includes(search.toLowerCase()) ||
    c.courseCode?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout title="My Classes">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Classes</h1>
          <p className="page-subtitle">Programme: <strong>{userProfile?.programme || "Not assigned"}</strong> | Faculty: {userProfile?.faculty?.split(" ").slice(-2).join(" ") || ""}</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditItem(null); setForm(INITIAL_FORM); setErrors({}); setShowModal(true); }}>
          Add Class
        </button>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="search-bar">
          <span>Search</span>
          <input type="text" placeholder="Search by class name..." value={search} onChange={(e) => setSearch(e.target.value)} />
          {search && <button onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer" }}>Clear</button>}
        </div>
      </div>

      {loading ? (
        <div className="loading-overlay"><div className="loading-spinner" /><span>Loading classes...</span></div>
      ) : filteredClasses.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">No Classes</div>
          <h3>No Classes Yet</h3>
          <p>Click Add Class to create your first class</p>
        </div>
      ) : (
        <div className="grid-2">
          {filteredClasses.map((classItem) => (
            <div key={classItem.id} className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div><h3 style={{ margin: 0, fontSize: 16 }}>{classItem.className}</h3><div className="text-muted" style={{ fontSize: 12 }}>{classItem.courseName || classItem.programmeName} {classItem.courseCode ? `(${classItem.courseCode})` : ""}</div></div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => openEdit(classItem)}>Edit</button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(classItem.id)} disabled={deleting === classItem.id}>
                    {deleting === classItem.id ? <span className="loading-spinner" style={{ width: 12, height: 12 }} /> : "Delete"}
                  </button>
                </div>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                <span className="badge badge-blue">Year {classItem.year}  Semester {classItem.semester}</span>
                <span className="badge badge-info">Venue: {classItem.venue}</span>
                {classItem.scheduledTime && <span className="badge badge-purple">Time: {classItem.scheduledTime}</span>}
                <span className="badge badge-green">Students: {classItem.registeredStudents}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" style={{ maxWidth: 500, maxHeight: "90vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h3>{editItem ? "Edit Class" : "Add New Class"}</h3><button className="btn btn-icon btn-secondary" onClick={() => setShowModal(false)}>Close</button></div>
            <div className="modal-body">
              <div className="form-group"><label className="form-label">Class Name *</label><input type="text" className={`form-control ${errors.className ? "error" : ""}`} placeholder="e.g., BBA Year 1 Section A" value={form.className} onChange={(e) => { setForm({ ...form, className: e.target.value }); if (errors.className) setErrors({ ...errors, className: "" }); }} />{errors.className && <div className="form-error">{errors.className}</div>}</div>
              <div className="form-group"><label className="form-label">Programme</label><input type="text" className="form-control" value={userProfile?.programme || "Not assigned"} disabled style={{ background: "rgba(255,255,255,0.05)" }} /></div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Year *</label><select className={`form-control ${errors.year ? "error" : ""}`} value={form.year} onChange={(e) => { setForm({ ...form, year: e.target.value }); if (errors.year) setErrors({ ...errors, year: "" }); }}><option value="">-- Select Year --</option><option value="1">Year 1</option><option value="2">Year 2</option><option value="3">Year 3</option></select>{errors.year && <div className="form-error">{errors.year}</div>}</div>
                <div className="form-group"><label className="form-label">Semester *</label><select className={`form-control ${errors.semester ? "error" : ""}`} value={form.semester} onChange={(e) => { setForm({ ...form, semester: e.target.value }); if (errors.semester) setErrors({ ...errors, semester: "" }); }}><option value="">-- Select Semester --</option><option value="1">Semester 1</option><option value="2">Semester 2</option></select>{errors.semester && <div className="form-error">{errors.semester}</div>}</div>
              </div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Venue *</label><input type="text" className={`form-control ${errors.venue ? "error" : ""}`} placeholder="e.g., MM1, Room 3, Hall 6" value={form.venue} onChange={(e) => { setForm({ ...form, venue: e.target.value }); if (errors.venue) setErrors({ ...errors, venue: "" }); }} />{errors.venue && <div className="form-error">{errors.venue}</div>}</div>
                <div className="form-group"><label className="form-label">Schedule Time</label><input type="text" className="form-control" placeholder="e.g., Monday 9:00-11:00" value={form.scheduledTime} onChange={(e) => setForm({ ...form, scheduledTime: e.target.value })} /></div>
              </div>
              <div className="form-group"><label className="form-label">Registered Students *</label><input type="number" min="0" className={`form-control ${errors.registeredStudents ? "error" : ""}`} placeholder="e.g., 35" value={form.registeredStudents} onChange={(e) => { setForm({ ...form, registeredStudents: e.target.value }); if (errors.registeredStudents) setErrors({ ...errors, registeredStudents: "" }); }} />{errors.registeredStudents && <div className="form-error">{errors.registeredStudents}</div>}</div>
            </div>
            <div className="modal-footer"><button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button><button className="btn btn-primary" onClick={handleSave} disabled={submitting}>{submitting ? <span className="loading-spinner" style={{ width: 16, height: 16 }} /> : (editItem ? "Update Class" : "Add Class")}</button></div>
          </div>
        </div>
      )}
    </Layout>
  );
}

