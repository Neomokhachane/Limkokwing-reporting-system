import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser } from "../../firebase/authService";
import toast from "../../components/Toast";

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Invalid email address";
    if (!form.password) e.password = "Password is required";
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setLoading(true);
    try {
      await loginUser(form.email, form.password);
      toast.success("Welcome back!");
      navigate("/dashboard");
    } catch (err) {
      const msg =
        err.code === "auth/invalid-credential" ||
        err.code === "auth/wrong-password"
          ? "Invalid email or password"
          : err.code === "auth/user-not-found"
          ? "No account found with this email"
          : err.code === "auth/too-many-requests"
          ? "Too many attempts. Please try again later."
          : "Login failed. Please try again.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    if (errors[field]) setErrors((er) => ({ ...er, [field]: "" }));
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">LU</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 18 }}>LUCT</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
              Reporting System
            </div>
          </div>
        </div>
        <h1 className="auth-title">Sign In</h1>
        <p className="auth-subtitle" style={{ marginBottom: 28 }}>
          Access your LUCT faculty reporting dashboard
        </p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className={`form-control ${errors.email ? "error" : ""}`}
              placeholder="your@email.com"
              value={form.email}
              onChange={handleChange("email")}
            />
            {errors.email && <div className="form-error">{errors.email}</div>}
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className={`form-control ${errors.password ? "error" : ""}`}
              placeholder="Enter your password"
              value={form.password}
              onChange={handleChange("password")}
            />
            {errors.password && <div className="form-error">{errors.password}</div>}
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: "100%", marginTop: 8, padding: "13px" }}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="loading-spinner" style={{ width: 16, height: 16 }} />{" "}
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>
        <div
          style={{
            textAlign: "center",
            marginTop: 24,
            fontSize: 14,
            color: "var(--text-muted)",
          }}
        >
          Don't have an account?{" "}
          <Link to="/register" className="auth-link">
            Register
          </Link>
        </div>
        <div style={{ textAlign: "center", marginTop: 12, fontSize: 12 }}>
          <span className="text-muted">Lecturers: Use the credentials provided by your Program Leader</span>
        </div>
      </div>
    </div>
  );
}
