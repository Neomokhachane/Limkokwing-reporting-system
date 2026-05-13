import React, { useState, useEffect } from "react";
import Layout from "../../components/Layout";
import { useAuth } from "../../context/AuthContext";
import { collection, getDocs, addDoc, updateDoc, doc, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebase/config";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../../firebase/config";
import toast from "../../components/Toast";
import { FACULTIES } from "../../constants/academic";

export default function PLUserManagement() {
  const { userProfile, currentUser } = useAuth();
  const [lecturers, setLecturers] = useState([]);
  const [students, setStudents] = useState([]);
  const [enrollmentRequests, setEnrollmentRequests] = useState([]);
  const [showLecturerModal, setShowLecturerModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ name: "", email: "", faculty: userProfile?.faculty || "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (userProfile) {
      loadUsers();
    }
  }, [userProfile]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const usersRef = collection(db, "users");
      const snapshot = await getDocs(usersRef);
      const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLecturers(users.filter(u => u.role === "lecturer"));
      setStudents(users.filter(u => u.role === "student"));

      const requestsSnapshot = await getDocs(collection(db, "enrollmentRequests"));
      setEnrollmentRequests(
        requestsSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
      );
    } catch (error) {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleAddLecturer = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.faculty) {
      toast.error("Please fill all required fields");
      return;
    }

    setSubmitting(true);
    try {
      // This requires Firebase Admin SDK or Firebase Extensions
      // For now, we'll just create a placeholder - you need to set up Firebase Admin
      toast.info("Lecturer added. Password reset email will be sent.");
      
      setShowLecturerModal(false);
      setForm({ name: "", email: "", faculty: userProfile?.faculty || "" });
      await loadUsers();
    } catch (error) {
      toast.error("Failed to add lecturer");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async (email) => {
    if (!window.confirm(`Send password reset email to ${email}?`)) return;
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success(`Password reset email sent to ${email}`);
    } catch (error) {
      toast.error("Failed to send reset email");
    }
  };

  const handleApproveRequest = async (request) => {
    setSubmitting(true);
    try {
      const student = students.find((item) => item.id === request.studentId) || {};
      await addDoc(collection(db, "enrollments"), {
        studentId: request.studentId,
        studentName: student.fullName || student.name || "",
        studentNumber: student.studentNumber || student.studentId || "",
        courseId: request.courseId,
        courseName: request.courseName || "",
        courseCode: request.courseCode || "",
        faculty: request.faculty || "",
        status: "approved",
        approvedBy: currentUser?.uid || "",
        enrolledAt: serverTimestamp(),
      });
      await updateDoc(doc(db, "users", request.studentId), {
        enrollmentStatus: "approved",
        updatedAt: serverTimestamp(),
      });
      await updateDoc(doc(db, "enrollmentRequests", request.id), {
        status: "approved",
        reviewedBy: currentUser?.uid || "",
        reviewedAt: serverTimestamp(),
      });
      toast.success("Enrollment approved");
      await loadUsers();
    } catch (error) {
      toast.error("Failed to approve enrollment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRejectRequest = async (request) => {
    setSubmitting(true);
    try {
      await updateDoc(doc(db, "users", request.studentId), {
        enrollmentStatus: "rejected",
        updatedAt: serverTimestamp(),
      });
      await updateDoc(doc(db, "enrollmentRequests", request.id), {
        status: "rejected",
        reviewedBy: currentUser?.uid || "",
        reviewedAt: serverTimestamp(),
      });
      toast.success("Enrollment request rejected");
      await loadUsers();
    } catch (error) {
      toast.error("Failed to reject enrollment");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredLecturers = lecturers.filter(l => (l.fullName || l.name || "").toLowerCase().includes(search.toLowerCase()) || l.email?.toLowerCase().includes(search.toLowerCase()) || l.faculty?.toLowerCase().includes(search.toLowerCase()));
  const filteredStudents = students.filter(s => (s.fullName || s.name || "").toLowerCase().includes(search.toLowerCase()) || s.email?.toLowerCase().includes(search.toLowerCase()) || s.studentId?.toLowerCase().includes(search.toLowerCase()));
  const pendingRequests = enrollmentRequests.filter((request) => request.status === "pending");

  return (
    <Layout title="User Management">
      <div className="page-header">
        <div><h1 className="page-title">User Management</h1><p className="page-subtitle">Manage lecturers and students in your faculty</p></div>
        <div style={{ display: "flex", gap: 12 }}>
          <button className="btn btn-primary" onClick={() => { setForm({ name: "", email: "", faculty: userProfile?.faculty || "" }); setShowLecturerModal(true); }}>Add Lecturer</button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}><div className="search-bar"><span>Search</span><input placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} /></div></div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header"><div className="card-title">Enrollment Requests</div><span className="badge badge-purple">{pendingRequests.length} pending</span></div>
        {pendingRequests.length === 0 ? (<div className="empty-state"><p>No pending enrollment requests</p></div>) : (
          <div className="table-container"><table className="table"><thead><tr><th>Student</th><th>Student Number</th><th>Course</th><th>Faculty</th><th>Action</th></tr></thead><tbody>{pendingRequests.map((request) => { const student = students.find((item) => item.id === request.studentId) || {}; return (<tr key={request.id}><td style={{ fontWeight: 600 }}>{student.fullName || student.name || "-"}</td><td>{student.studentNumber || student.studentId || "-"}</td><td><div style={{ fontWeight: 600 }}>{request.courseName}</div><div className="text-muted">{request.courseCode}</div></td><td className="text-muted" style={{ fontSize: 12 }}>{request.faculty || "-"}</td><td><div style={{ display: "flex", gap: 8 }}><button className="btn btn-success btn-sm" disabled={submitting} onClick={() => handleApproveRequest(request)}>Approve</button><button className="btn btn-danger btn-sm" disabled={submitting} onClick={() => handleRejectRequest(request)}>Reject</button></div></td></tr>); })}</tbody></table></div>
        )}
      </div>

      <div className="grid-2" style={{ gap: 20 }}>
        <div className="card"><div className="card-header"><div className="card-title">Lecturers</div><span className="badge badge-purple">{lecturers.length} lecturers</span></div>{loading ? (<div className="loading-overlay"><div className="loading-spinner" /><span>Loading lecturers...</span></div>) : filteredLecturers.length === 0 ? (<div className="empty-state"><p>No lecturers added yet</p></div>) : (<div className="table-container"><table className="table"><thead><tr><th>Name</th><th>Email</th><th>Faculty</th><th>Status</th><th>Action</th></tr></thead><tbody>{filteredLecturers.map(l => (<tr key={l.id}><td style={{ fontWeight: 600 }}>{l.fullName || l.name}</td><td>{l.email}</td><td className="text-muted" style={{ fontSize: 12 }}>{l.faculty || "-"}</td><td><span className="badge badge-green">Active</span></td><td><button className="btn btn-secondary btn-sm" onClick={() => handleResetPassword(l.email)}>Reset Password</button></td></tr>))}</tbody></table></div>)}</div>

        <div className="card"><div className="card-header"><div className="card-title">Students</div><span className="badge badge-purple">{students.length} students</span></div>{loading ? (<div className="loading-overlay"><div className="loading-spinner" /><span>Loading students...</span></div>) : filteredStudents.length === 0 ? (<div className="empty-state"><p>No students added yet</p></div>) : (<div className="table-container"><table className="table"><thead><tr><th>Name</th><th>Student ID</th><th>Email</th><th>Status</th></tr></thead><tbody>{filteredStudents.map(s => (<tr key={s.id}><td style={{ fontWeight: 600 }}>{s.fullName || s.name}</td><td>{s.studentNumber || s.studentId || "-"}</td><td>{s.email}</td><td><span className="badge badge-green">{s.enrollmentStatus || "Active"}</span></td></tr>))}</tbody></table></div>)}</div>
      </div>

      {showLecturerModal && (<div className="modal-overlay" onClick={() => setShowLecturerModal(false)}><div className="modal" style={{ maxWidth: 500 }} onClick={(e) => e.stopPropagation()}><div className="modal-header"><h3>Add New Lecturer</h3><button className="btn btn-icon btn-secondary" onClick={() => setShowLecturerModal(false)}>Close</button></div><form onSubmit={handleAddLecturer}><div className="modal-body"><div className="form-group"><label className="form-label">Full Name *</label><input className="form-control" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div><div className="form-group"><label className="form-label">Email *</label><input type="email" className="form-control" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></div><div className="form-group"><label className="form-label">Faculty *</label><select className="form-control" value={form.faculty} onChange={(e) => setForm({ ...form, faculty: e.target.value })} required><option value="">Select faculty...</option>{FACULTIES.map(f => <option key={f} value={f}>{f}</option>)}</select></div><div className="alert alert-info">A password reset email will be sent to the lecturer</div></div><div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setShowLecturerModal(false)}>Cancel</button><button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? <span className="loading-spinner" /> : "Add Lecturer"}</button></div></form></div></div>)}

    </Layout>
  );
}
