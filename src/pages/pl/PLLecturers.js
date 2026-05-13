import React, { useState, useEffect } from "react";
import Layout from "../../components/Layout";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../firebase/config";
import { exportToExcel as downloadExcel } from "../../utils/exportCsv";

export default function PLLecturers() {
  const [lecturers, setLecturers] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [reports, setReports] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const [lects, rats, reps, crs] = await Promise.all([
        getDocs(query(collection(db, "users"), where("role", "==", "lecturer"))),
        getDocs(collection(db, "ratings")),
        getDocs(collection(db, "reports")),
        getDocs(collection(db, "courses"))
      ]);
      setLecturers(lects.docs.map(d => ({ id: d.id, ...d.data() })));
      setRatings(rats.docs.map(d => ({ id: d.id, ...d.data() })).filter(r => r.requestType !== "enrollment"));
      setReports(reps.docs.map(d => ({ id: d.id, ...d.data() })));
      setCourses(crs.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    };
    fetchData();
  }, []);

  const getLecturerStats = (id) => {
    const lr = ratings.filter(r => r.lecturerId === id);
    const lReps = reports.filter(r => r.lecturerId === id);
    const lCourses = courses.filter(c => c.lecturerId === id);
    return {
      avgRating: lr.length ? (lr.reduce((s, r) => s + (r.rating || 0), 0) / lr.length).toFixed(1) : "-",
      reportCount: lReps.length,
      courseCount: lCourses.length,
      reviewCount: lr.length
    };
  };

  const exportToExcel = () => {
    const data = lecturers.map(l => {
      const stats = getLecturerStats(l.id);
      return { Name: l.name, Email: l.email, Faculty: l.faculty, "Reports": stats.reportCount, "Courses": stats.courseCount, "Avg Rating": stats.avgRating, "Reviews": stats.reviewCount };
    });
    downloadExcel(data, `lecturers-${new Date().toISOString().slice(0, 10)}`, "Lecturers");
  };

  const filtered = lecturers.filter(l => l.name?.toLowerCase().includes(search.toLowerCase()) || l.email?.toLowerCase().includes(search.toLowerCase()));
  const selectedStats = selected ? getLecturerStats(selected.id) : null;

  return (
    <Layout title="Lecturers">
      <div className="page-header">
        <div><h1 className="page-title">Lecturers</h1><p className="page-subtitle">View and manage all lecturers</p></div>
        <button className="btn btn-secondary" onClick={exportToExcel}>Export Excel</button>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="search-bar"><span>Search</span><input placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>
      </div>

      <div className={selected ? "grid-2" : ""} style={{ gap: 20 }}>
        <div className="card">
          <div className="card-header"><div className="card-title">All Lecturers</div><span className="badge badge-purple">{filtered.length} lecturers</span></div>
          {loading ? (<div className="loading-overlay" />) : filtered.length === 0 ? (<div className="empty-state"><p>No lecturers found</p></div>) : (
            <div className="table-container">
              <table className="table">
                <thead><tr><th>Lecturer</th><th>Faculty</th><th>Reports</th><th>Courses</th><th>Rating</th><th>Action</th></tr></thead>
                <tbody>
                  {filtered.map(l => {
                    const stats = getLecturerStats(l.id);
                    return (<tr key={l.id} style={{ background: selected?.id === l.id ? "rgba(108,99,255,0.06)" : undefined }}>
                      <td><div><div style={{ fontWeight: 600 }}>{l.name}</div><div className="text-muted" style={{ fontSize: 12 }}>{l.email}</div></div></td>
                      <td className="text-muted" style={{ fontSize: 12 }}>{l.faculty?.split(" ").slice(-2).join(" ")}</td>
                      <td>{stats.reportCount}</td><td>{stats.courseCount}</td>
                      <td>{stats.avgRating !== "-" ? ` ${stats.avgRating}` : "-"}</td>
                      <td><button className="btn btn-secondary btn-sm" onClick={() => setSelected(selected?.id === l.id ? null : l)}>{selected?.id === l.id ? "Close" : "Details"}</button></td>
                    </tr>);
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {selected && selectedStats && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="card">
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
                <div className="user-avatar" style={{ width: 52, height: 52, fontSize: 20 }}>{(selected.name || "L").charAt(0).toUpperCase()}</div>
                <div><div style={{ fontWeight: 700, fontSize: 17 }}>{selected.name}</div><div className="text-muted">{selected.email}</div><div className="text-muted" style={{ fontSize: 12 }}>{selected.faculty}</div></div>
              </div>
              <div className="grid-2" style={{ gap: 10 }}>
                {[["Reports", selectedStats.reportCount], ["Courses", selectedStats.courseCount], ["Avg Rating", selectedStats.avgRating], ["Reviews", selectedStats.reviewCount]].map(([k, v]) => (<div key={k} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: "10px 14px" }}><div className="text-muted" style={{ fontSize: 11 }}>{k}</div><div style={{ fontWeight: 700, fontSize: 16 }}>{v}</div></div>))}
              </div>
            </div>
            <div className="card"><div className="card-title">Assigned Courses</div>{courses.filter(c => c.lecturerId === selected.id).length === 0 ? <div className="text-muted">No courses assigned</div> : courses.filter(c => c.lecturerId === selected.id).map(c => (<div key={c.id} style={{ padding: "8px 0", borderBottom: "1px solid var(--border)" }}><div style={{ fontWeight: 600 }}>{c.name}</div><div className="text-muted">{c.code}</div></div>))}</div>
          </div>
        )}
      </div>
    </Layout>
  );
}

