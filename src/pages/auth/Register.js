import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../../firebase/authService";
import toast from "../../components/Toast";
import { FACULTIES, PROGRAMMES_BY_FACULTY } from "../../constants/academic";

const ROLES = [
  { value: "student", label: "Student" },
  { value: "lecturer", label: "Lecturer" },
  { value: "prl", label: "Principal Lecturer (PRL)" },
  { value: "pl", label: "Program Leader (PL)" },
];

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "student",
    faculty: "",
    programme: "",
    studentId: "",
    registeredCourses: "",
    assignedCourses: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [availableProgrammes, setAvailableProgrammes] = useState([]);

  const handleFacultyChange = (e) => {
    const faculty = e.target.value;
    setForm(prev => ({ ...prev, faculty, programme: "" }));
    setAvailableProgrammes(PROGRAMMES_BY_FACULTY[faculty] || []);
    if (errors.faculty) setErrors(prev => ({ ...prev, faculty: "" }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Full name is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Invalid email address";
    if (!form.password) e.password = "Password is required";
    else if (form.password.length < 6) e.password = "Password must be at least 6 characters";
    if (form.password !== form.confirmPassword) e.confirmPassword = "Passwords do not match";
    if (!form.role) e.role = "Please select a role";
    if ((form.role === "lecturer" || form.role === "prl") && !form.faculty) e.faculty = "Please select a faculty";
    if (form.role === "lecturer" && !form.programme) e.programme = "Please select your programme";
    return e;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    
    setLoading(true);
    try {
      const userData = {
        name: form.name,
        fullName: form.name,
        email: form.email,
        role: form.role,
        faculty: form.role === "pl" ? "" : form.faculty,
        programme: form.programme,
        registeredCourses: form.registeredCourses.split(",").map((item) => item.trim()).filter(Boolean),
        assignedCourses: form.assignedCourses.split(",").map((item) => item.trim()).filter(Boolean),
      };

      if (form.role === "student" && form.studentId.trim()) {
        userData.studentId = form.studentId;
        userData.studentNumber = form.studentId;
      }

      await registerUser(form.email, form.password, userData);
      toast.success("Account created successfully!");
      navigate("/login");
    } catch (err) {
      console.warn("Registration error:", err);
      switch (err.code) {
        case 'auth/email-already-in-use':
          toast.error("Email is already registered");
          break;
        case 'auth/invalid-email':
          toast.error("Invalid email address");
          break;
        case 'auth/weak-password':
          toast.error("Password is too weak");
          break;
        default:
          toast.error(err.message || "Registration failed");
      }
    } finally {
      setLoading(false);
    }
  };

  const hc = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    if (errors[field]) setErrors((er) => ({ ...er, [field]: "" }));
  };

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: 520 }}>
        <div className="auth-logo">
          <div className="auth-logo-icon">LU</div>
          <div><div style={{ fontWeight: 800, fontSize: 18 }}>LUCT</div><div style={{ fontSize: 12, color: "var(--text-muted)" }}>Reporting System</div></div>
        </div>
        <h1 className="auth-title">Create Account</h1>
        <p className="auth-subtitle" style={{ marginBottom: 28 }}>Join the LUCT reporting system</p>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Full Name *</label><input className={`form-control ${errors.name ? "error" : ""}`} placeholder="Neo Mokhachane" value={form.name} onChange={hc("name")} />{errors.name && <div className="form-error">{errors.name}</div>}</div>
            <div className="form-group"><label className="form-label">Role *</label><select className={`form-control ${errors.role ? "error" : ""}`} value={form.role} onChange={hc("role")}><option value="">Select role...</option>{ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}</select>{errors.role && <div className="form-error">{errors.role}</div>}</div>
          </div>
          
          {form.role !== "pl" && (
            <div className="form-group"><label className="form-label">Faculty {form.role === "student" ? "" : "*"}</label><select className={`form-control ${errors.faculty ? "error" : ""}`} value={form.faculty} onChange={handleFacultyChange}><option value="">Select faculty...</option>{FACULTIES.map(f => <option key={f} value={f}>{f}</option>)}</select>{errors.faculty && <div className="form-error">{errors.faculty}</div>}</div>
          )}
          
          {form.role === "lecturer" && (
            <div className="form-group"><label className="form-label">Programme *</label><select className={`form-control ${errors.programme ? "error" : ""}`} value={form.programme} onChange={hc("programme")} disabled={!form.faculty}><option value="">Select programme...</option>{availableProgrammes.map(p => <option key={p} value={p}>{p}</option>)}</select>{errors.programme && <div className="form-error">{errors.programme}</div>}</div>
          )}
          
          {form.role === "student" && (
            <>
              <div className="form-group"><label className="form-label">Student Number</label><input className={`form-control ${errors.studentId ? "error" : ""}`} placeholder="e.g., STU2024001" value={form.studentId} onChange={hc("studentId")} />{errors.studentId && <div className="form-error">{errors.studentId}</div>}</div>
              <div className="form-group"><label className="form-label">Registered Course Codes</label><input className="form-control" placeholder="Optional: separate course codes with commas" value={form.registeredCourses} onChange={hc("registeredCourses")} /></div>
            </>
          )}

          {form.role === "lecturer" && (
            <div className="form-group"><label className="form-label">Assigned Course Codes</label><input className="form-control" placeholder="Optional: separate course codes with commas" value={form.assignedCourses} onChange={hc("assignedCourses")} /></div>
          )}
          
          <div className="form-group"><label className="form-label">Email Address *</label><input type="email" className={`form-control ${errors.email ? "error" : ""}`} placeholder="your@email.com" value={form.email} onChange={hc("email")} />{errors.email && <div className="form-error">{errors.email}</div>}</div>
          
          <div className="form-row">
            <div className="form-group"><label className="form-label">Password *</label><input type="password" className={`form-control ${errors.password ? "error" : ""}`} placeholder="Min 6 characters" value={form.password} onChange={hc("password")} />{errors.password && <div className="form-error">{errors.password}</div>}</div>
            <div className="form-group"><label className="form-label">Confirm Password *</label><input type="password" className={`form-control ${errors.confirmPassword ? "error" : ""}`} placeholder="Repeat password" value={form.confirmPassword} onChange={hc("confirmPassword")} />{errors.confirmPassword && <div className="form-error">{errors.confirmPassword}</div>}</div>
          </div>
          
          <button type="submit" className="btn btn-primary" style={{ width: "100%", padding: "13px" }} disabled={loading}>{loading ? <span className="loading-spinner" style={{ width: 16, height: 16 }} /> : "Create Account"}</button>
        </form>
        <div style={{ textAlign: "center", marginTop: 20, fontSize: 14, color: "var(--text-muted)" }}>Already have an account? <Link to="/login" className="auth-link">Sign In</Link></div>
      </div>
    </div>
  );
}
