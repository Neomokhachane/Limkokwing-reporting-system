import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "./Toast";

const NAV_ITEMS = {
  student: [
    { icon: "H", label: "Dashboard", path: "/dashboard" },
    { icon: "C", label: "Enroll Courses", path: "/student/courses" },
    { icon: "M", label: "Monitoring", path: "/student/monitoring" },
    { icon: "R", label: "Rating", path: "/student/rating" },
    { icon: "A", label: "Attendance", path: "/student/attendance" },
    { icon: "P", label: "Profile", path: "/profile" },
  ],
  lecturer: [
    { icon: "H", label: "Dashboard", path: "/dashboard" },
    { icon: "C", label: "My Classes", path: "/lecturer/classes" },
    { icon: "P", label: "Reports", path: "/lecturer/reports" },
    { icon: "M", label: "Monitoring", path: "/lecturer/monitoring" },
    { icon: "R", label: "Ratings", path: "/lecturer/rating" },
    { icon: "A", label: "Attendance", path: "/lecturer/attendance" },
    { icon: "U", label: "Profile", path: "/profile" },
  ],
  prl: [
    { icon: "H", label: "Dashboard", path: "/dashboard" },
    { icon: "C", label: "Courses", path: "/prl/courses" },
    { icon: "P", label: "Reports", path: "/prl/reports" },
    { icon: "M", label: "Monitoring", path: "/prl/monitoring" },
    { icon: "R", label: "Ratings", path: "/prl/rating" },
    { icon: "U", label: "Profile", path: "/profile" },
  ],
  pl: [
    { icon: "H", label: "Dashboard", path: "/dashboard" },
    { icon: "U", label: "User Management", path: "/pl/users" },
    { icon: "C", label: "Courses", path: "/pl/courses" },
    { icon: "P", label: "Reports", path: "/pl/reports" },
    { icon: "M", label: "Monitoring", path: "/pl/monitoring" },
    { icon: "L", label: "Classes", path: "/pl/classes" },
    { icon: "E", label: "Lecturers", path: "/pl/lecturers" },
    { icon: "R", label: "Ratings", path: "/pl/rating" },
    { icon: "O", label: "Profile", path: "/profile" },
  ],
};

const ROLE_LABELS = {
  student: "Student",
  lecturer: "Lecturer",
  prl: "Principal Lecturer",
  pl: "Program Leader",
};

export default function Sidebar({ mobileOpen, onClose }) {
  const { userProfile, logout } = useAuth();
  const location = useLocation();
  const role = userProfile?.role || "student";
  const navItems = NAV_ITEMS[role] || NAV_ITEMS.student;

  const handleLogout = async () => {
    await logout();
    toast.success("Logged out successfully");
  };

  const getInitials = () => {
    if (!userProfile?.name) return "U";
    return userProfile.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  const getFacultyShortName = () => {
    if (!userProfile?.faculty) return "";
    const words = userProfile.faculty.split(" ");
    if (words.length >= 4) {
      return words.slice(2, 4).join(" ");
    }
    return words.slice(-2).join(" ");
  };

  return (
    <>
      {mobileOpen && (
        <div
          onClick={onClose}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 99,
          }}
        />
      )}
      <aside className={`sidebar ${mobileOpen ? "mobile-open" : ""}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">LU</div>
          <div style={{ overflow: "hidden" }}>
            <div className="sidebar-title">LUCT</div>
            <div className="sidebar-subtitle">Reporting System</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section">
            <div className="nav-section-label">Navigation</div>
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${
                  location.pathname === item.path ||
                  location.pathname.startsWith(item.path + "/")
                    ? "active"
                    : ""
                }`}
                onClick={onClose}
              >
                <span className="nav-icon">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="user-card" style={{ marginBottom: 8 }}>
            <div className="user-avatar">{getInitials()}</div>
            <div style={{ overflow: "hidden", flex: 1 }}>
              <div
                className="user-name"
                style={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {userProfile?.name || "User"}
              </div>
              <div className="user-role">{ROLE_LABELS[role]}</div>
              {userProfile?.faculty && (
                <div
                  className="text-muted"
                  style={{ fontSize: 10, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                >
                  {getFacultyShortName()}
                </div>
              )}
              {userProfile?.programme && role === "lecturer" && (
                <div
                  className="text-muted"
                  style={{ fontSize: 9, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                >
                  {userProfile.programme.length > 25 ? userProfile.programme.substring(0, 22) + "..." : userProfile.programme}
                </div>
              )}
            </div>
          </div>
          <button
            className="btn btn-secondary"
            style={{ width: "100%", justifyContent: "center" }}
            onClick={handleLogout}
          >
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
