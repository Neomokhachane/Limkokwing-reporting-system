import React, { useState, useEffect } from "react";
import Layout from "../../components/Layout";
import { useAuth } from "../../context/AuthContext";
import { getUsers, getRatings } from "../../firebase/firestoreService";

function Stars({ value }) {
  return (
    <div className="stars">
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          className={`star ${n <= Math.round(value) ? "filled" : "empty"}`}
          style={{ cursor: "default", fontSize: 14 }}
        >
          
        </span>
      ))}
      <span style={{ fontSize: 13, color: "var(--text-muted)", marginLeft: 6 }}>
        {Number(value).toFixed(1)}
      </span>
    </div>
  );
}

export default function PRLRating() {
  const { userProfile } = useAuth();
  const [lecturers, setLecturers] = useState([]);
  const [allRatings, setAllRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      const [lects, ratings] = await Promise.all([
        getUsers("lecturer"),
        getRatings({}),
      ]);
      setLecturers(lects);
      setAllRatings(ratings.filter((rating) => rating.requestType !== "enrollment"));
      setLoading(false);
    };
    fetch();
  }, []);

  const getLecturerStats = (uid) => {
    const lr = allRatings.filter((r) => r.lecturerId === uid);
    if (!lr.length)
      return { count: 0, overall: 0, teaching: 0, punctuality: 0 };
    return {
      count: lr.length,
      overall: lr.reduce((s, r) => s + (r.rating || 0), 0) / lr.length,
      teaching: lr.reduce((s, r) => s + (r.teaching || 0), 0) / lr.length,
      punctuality: lr.reduce((s, r) => s + (r.punctuality || 0), 0) / lr.length,
      reviews: lr,
    };
  };

  const filtered = lecturers.filter(
    (l) =>
      l.name?.toLowerCase().includes(search.toLowerCase()) ||
      l.faculty?.toLowerCase().includes(search.toLowerCase())
  );

  const selectedStats = selected ? getLecturerStats(selected.uid) : null;

  return (
    <Layout title="Rating">
      <div className="page-header">
        <div>
          <h1 className="page-title"> Lecturer Ratings</h1>
          <p className="page-subtitle">
            View all lecturer ratings and feedback from students
          </p>
        </div>
      </div>
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="search-bar">
          <span></span>
          <input
            placeholder="Search lecturers..."
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
      <div className={selected ? "grid-2" : ""} style={{ gap: 20 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {loading ? (
            <div className="loading-overlay">
              <div className="loading-spinner" />
              <span>Loading...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"></div>
              <h3>No lecturers found</h3>
            </div>
          ) : (
            filtered.map((l) => {
              const stats = getLecturerStats(l.uid);
              return (
                <div
                  key={l.uid}
                  className={`card ${selected?.uid === l.uid ? "active" : ""}`}
                  style={{
                    cursor: "pointer",
                    borderColor:
                      selected?.uid === l.uid ? "var(--primary)" : undefined,
                  }}
                  onClick={() =>
                    setSelected(selected?.uid === l.uid ? null : l)
                  }
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 14 }}
                  >
                    <div
                      className="user-avatar"
                      style={{ width: 44, height: 44, fontSize: 16 }}
                    >
                      {(l.name || "L")
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700 }}>{l.name}</div>
                      <div className="text-muted" style={{ fontSize: 12 }}>
                        {l.faculty}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      {stats.count > 0 ? (
                        <>
                          <Stars value={stats.overall} />
                          <div
                            className="text-muted"
                            style={{ fontSize: 11, marginTop: 2 }}
                          >
                            {stats.count} review{stats.count !== 1 ? "s" : ""}
                          </div>
                        </>
                      ) : (
                        <span className="badge badge-gray">No ratings yet</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {selected && selectedStats && (
          <div
            className="card"
            style={{ alignSelf: "flex-start", position: "sticky", top: 80 }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                marginBottom: 20,
              }}
            >
              <div
                className="user-avatar"
                style={{ width: 52, height: 52, fontSize: 20 }}
              >
                {(selected.name || "L")
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 17 }}>
                  {selected.name}
                </div>
                <div className="text-muted" style={{ fontSize: 12 }}>
                  {selectedStats.count} reviews
                </div>
              </div>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
                marginBottom: 20,
              }}
            >
              {[
                ["Overall", selectedStats.overall],
                ["Teaching Quality", selectedStats.teaching],
                ["Punctuality", selectedStats.punctuality],
              ].map(([k, v]) => (
                <div
                  key={k}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span className="text-muted">{k}</span>
                  <Stars value={v} />
                </div>
              ))}
            </div>
            <div className="divider" />
            <div className="card-title" style={{ marginBottom: 12 }}>
              Student Reviews
            </div>
            {selectedStats.reviews?.length ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  maxHeight: 360,
                  overflowY: "auto",
                }}
              >
                {selectedStats.reviews.map((r) => (
                  <div
                    key={r.id}
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      borderRadius: 8,
                      padding: "10px 14px",
                    }}
                  >
                    <div
                      style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}
                    >
                      Anonymous Student
                    </div>
                    <Stars value={r.rating} />
                    {r.comment && (
                      <div
                        className="text-muted"
                        style={{
                          fontSize: 12,
                          marginTop: 6,
                          fontStyle: "italic",
                        }}
                      >
                        "{r.comment}"
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-muted">No detailed reviews</div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}

