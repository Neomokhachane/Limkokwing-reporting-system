import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, roles }) {
  const { currentUser, userProfile, loading } = useAuth();

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          background: "var(--bg-dark)",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            className="loading-spinner"
            style={{ width: 40, height: 40, margin: "0 auto 16px" }}
          />
          <div style={{ color: "var(--text-muted)" }}>Loading...</div>
        </div>
      </div>
    );
  }

  if (!currentUser) return <Navigate to="/login" replace />;
  if (roles && userProfile && !roles.includes(userProfile.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
