import React from "react";
import Layout from "../components/Layout";
import { useAuth } from "../context/AuthContext";

const ROLE_LABELS = {
  student: "Student",
  lecturer: "Lecturer",
  prl: "Principal Lecturer",
  pl: "Program Leader",
};

export default function Profile() {
  const { currentUser, userProfile } = useAuth();
  const name = userProfile?.fullName || userProfile?.name || "User";
  const role = userProfile?.role || "student";

  return (
    <Layout title="Profile">
      <div className="page-header">
        <div>
          <h1 className="page-title">Profile</h1>
          <p className="page-subtitle">Your account and role details</p>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
            <div className="user-avatar" style={{ width: 64, height: 64, fontSize: 22 }}>
              {name.split(" ").map((item) => item[0]).join("").slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800 }}>{name}</div>
              <div className="text-muted">{currentUser?.email || userProfile?.email}</div>
            </div>
          </div>
          <div className="grid-2">
            <div><div className="text-muted">Role</div><div style={{ fontWeight: 700 }}>{ROLE_LABELS[role]}</div></div>
            <div><div className="text-muted">Faculty</div><div style={{ fontWeight: 700 }}>{userProfile?.faculty || "Not applicable"}</div></div>
            {role === "student" && <div><div className="text-muted">Student Number</div><div style={{ fontWeight: 700 }}>{userProfile?.studentNumber || userProfile?.studentId || "Not applicable"}</div></div>}
            <div><div className="text-muted">Programme</div><div style={{ fontWeight: 700 }}>{userProfile?.programme || "Not assigned"}</div></div>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><div className="card-title">Course Access</div></div>
          <div style={{ marginBottom: 16 }}>
            <div className="text-muted">Registered Courses</div>
            <div style={{ marginTop: 8 }}>
              {(userProfile?.registeredCourses || []).length
                ? userProfile.registeredCourses.map((course) => <span key={course} className="badge badge-blue" style={{ marginRight: 6 }}>{course}</span>)
                : <span className="text-muted">No registered course codes stored on profile</span>}
            </div>
          </div>
          <div>
            <div className="text-muted">Assigned Courses</div>
            <div style={{ marginTop: 8 }}>
              {(userProfile?.assignedCourses || []).length
                ? userProfile.assignedCourses.map((course) => <span key={course} className="badge badge-purple" style={{ marginRight: 6 }}>{course}</span>)
                : <span className="text-muted">No assigned course codes stored on profile</span>}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
