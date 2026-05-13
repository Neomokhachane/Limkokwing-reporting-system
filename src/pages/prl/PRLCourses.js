import React, { useState, useEffect } from "react";
import Layout from "../../components/Layout";
import { useAuth } from "../../context/AuthContext";
import {
  subscribeToCourses,
  getClasses,
} from "../../firebase/firestoreService";

export default function PRLCourses() {
  const { userProfile } = useAuth();
  const [courses, setCourses] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const unsub = subscribeToCourses(
      userProfile?.faculty ? { faculty: userProfile.faculty } : {},
      (data) => {
        setCourses(data);
        setLoading(false);
      }
    );
    getClasses({}).then(setClasses);
    return unsub;
  }, [userProfile]);

  const filtered = courses.filter(
    (c) =>
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.code?.toLowerCase().includes(search.toLowerCase()) ||
      c.lecturerName?.toLowerCase().includes(search.toLowerCase())
  );

  const getClassCount = (courseCode) =>
    classes.filter((cl) => cl.courseCode === courseCode).length;

  return (
    <Layout title="Courses">
      <div className="page-header">
        <div>
          <h1 className="page-title"> Courses & Lectures</h1>
          <p className="page-subtitle">
            All courses and lectures under your stream
          </p>
        </div>
      </div>
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="search-bar">
          <span></span>
          <input
            placeholder="Search by course name, code or lecturer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              style={{
                background: "none",
                border: "none",
                color: "var(--text-muted)",
                cursor: "pointer",
              }}
            >
              
            </button>
          )}
        </div>
      </div>
      <div className="card">
        <div className="card-header">
          <div className="card-title">All Courses</div>
          <span className="badge badge-purple">{filtered.length} courses</span>
        </div>
        {loading ? (
          <div className="loading-overlay">
            <div className="loading-spinner" />
            <span>Loading...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"></div>
            <h3>No courses found</h3>
            <p>Courses assigned by Program Leader will appear here</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Code</th>
                  <th>Lecturer</th>
                  <th>Faculty</th>
                  <th>Classes</th>
                  <th>Students</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 600 }}>{c.name}</td>
                    <td>
                      <span className="badge badge-blue">{c.code}</span>
                    </td>
                    <td>
                      {c.lecturerName || (
                        <span className="text-muted">Unassigned</span>
                      )}
                    </td>
                    <td className="text-muted" style={{ fontSize: 12 }}>
                      {c.faculty}
                    </td>
                    <td>{getClassCount(c.code)}</td>
                    <td>{c.registeredStudents || ""}</td>
                    <td>
                      <span
                        className={`badge ${
                          c.status === "active" ? "badge-green" : "badge-gray"
                        }`}
                      >
                        {c.status || "active"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}

