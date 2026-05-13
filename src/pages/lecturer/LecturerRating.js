import React, { useState, useEffect } from "react";
import Layout from "../../components/Layout";
import { useAuth } from "../../context/AuthContext";
import { getRatings } from "../../firebase/firestoreService";

function Stars({ value }) {
  return (
    <div className="stars">
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          className={`star ${n <= Math.round(value) ? "filled" : "empty"}`}
          style={{ cursor: "default", fontSize: 16 }}
        >
          *
        </span>
      ))}
    </div>
  );
}

export default function LecturerRating() {
  const { currentUser } = useAuth();
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    getRatings({ lecturerId: currentUser?.uid }).then((r) => {
      setRatings(r.filter((rating) => rating.requestType !== "enrollment"));
      setLoading(false);
    });
  }, [currentUser]);

  const avg = (key) =>
    ratings.length
      ? (
          ratings.reduce((s, r) => s + (r[key] || 0), 0) / ratings.length
        ).toFixed(1)
      : "0.0";

  const filtered = ratings.filter(
    (r) =>
      r.comment?.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (ts) => {
    if (!ts) return "";
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString("en-MY", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <Layout title="My Ratings">
      <div className="page-header">
        <div>
          <h1 className="page-title"> My Ratings</h1>
          <p className="page-subtitle">View feedback from your students</p>
        </div>
      </div>

      <div className="stat-grid" style={{ marginBottom: 24 }}>
        {[
          {
            label: "Total Reviews",
            value: ratings.length,
            icon: "",
            color: "purple",
          },
          {
            label: "Overall Rating",
            value: `${avg("rating")}/5`,
            icon: "",
            color: "orange",
          },
          {
            label: "Teaching Quality",
            value: `${avg("teaching")}/5`,
            icon: "",
            color: "blue",
          },
          {
            label: "Punctuality",
            value: `${avg("punctuality")}/5`,
            icon: "",
            color: "green",
          },
        ].map((c, i) => (
          <div key={i} className={`stat-card ${c.color}`}>
            <div className="stat-value">{c.value}</div>
            <div className="stat-label">{c.label}</div>
            <div className="stat-icon">{c.icon}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="search-bar">
          <span>Search</span>
          <input
            placeholder="Search by comment..."
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
              Clear
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="loading-overlay">
          <div className="loading-spinner" />
          <span>Loading ratings...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"></div>
          <h3>No ratings yet</h3>
          <p>Student ratings will appear here</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.map((r) => (
            <div key={r.id} className="card">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>
                    Anonymous Student
                  </div>
                  <div className="text-muted" style={{ fontSize: 12 }}>
                    {formatDate(r.createdAt)}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                  <div style={{ textAlign: "center" }}>
                    <div
                      className="text-muted"
                      style={{ fontSize: 11, marginBottom: 3 }}
                    >
                      Overall
                    </div>
                    <Stars value={r.rating} />
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div
                      className="text-muted"
                      style={{ fontSize: 11, marginBottom: 3 }}
                    >
                      Teaching
                    </div>
                    <Stars value={r.teaching} />
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div
                      className="text-muted"
                      style={{ fontSize: 11, marginBottom: 3 }}
                    >
                      Punctuality
                    </div>
                    <Stars value={r.punctuality} />
                  </div>
                </div>
              </div>
              {r.comment && (
                <div
                  style={{
                    marginTop: 12,
                    padding: "10px 14px",
                    background: "rgba(255,255,255,0.04)",
                    borderRadius: 8,
                    fontSize: 14,
                    color: "var(--text-secondary)",
                    fontStyle: "italic",
                  }}
                >
                  "{r.comment}"
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}

