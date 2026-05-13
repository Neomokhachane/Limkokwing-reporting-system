import React, { useState, useEffect } from "react";
import Layout from "../../components/Layout";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase/config";

function Stars({ value }) {
  return (<div className="stars">{[1,2,3,4,5].map(n => (<span key={n} className={`star ${n <= Math.round(value) ? "filled" : "empty"}`}></span>))}<span style={{ fontSize: 12, marginLeft: 6 }}>{Number(value).toFixed(1)}</span></div>);
}

export default function PLRating() {
  const [ratings, setRatings] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [ratingsSnap, usersSnap] = await Promise.all([getDocs(collection(db, "ratings")), getDocs(collection(db, "users"))]);
      setRatings(ratingsSnap.docs.map(d => ({ id: d.id, ...d.data() })).filter(r => r.requestType !== "enrollment"));
      setLecturers(usersSnap.docs.map(d => ({ id: d.id, ...d.data() })).filter(u => u.role === "lecturer"));
    } catch (error) { console.warn(error); } finally { setLoading(false); }
  };

  const lecturerRatings = lecturers.map(l => {
    const lr = ratings.filter(r => r.lecturerId === l.id);
    const avgRating = lr.length ? lr.reduce((s, r) => s + (r.rating || 0), 0) / lr.length : 0;
    return { ...l, avgRating, reviewCount: lr.length };
  }).sort((a, b) => b.avgRating - a.avgRating);

  const filtered = lecturerRatings.filter(l => l.name?.toLowerCase().includes(search.toLowerCase()));

  return (<Layout title="Lecturer Ratings"><div className="page-header"><div><h1 className="page-title">Lecturer Ratings</h1><p className="page-subtitle">View all lecturer ratings from students</p></div></div><div className="card" style={{ marginBottom: 16 }}><div className="search-bar"><span>Search</span><input placeholder="Search lecturers..." value={search} onChange={(e) => setSearch(e.target.value)} /></div></div><div className="card"><div className="card-header"><div className="card-title">All Lecturers</div><span className="badge badge-purple">{filtered.length} lecturers</span></div>{loading ? (<div className="loading-overlay" />) : (<div className="table-container"><table className="table"><thead><tr><th>Rank</th><th>Lecturer</th><th>Faculty</th><th>Average Rating</th><th>Reviews</th><th>Performance</th></tr></thead><tbody>{filtered.map((l, i) => (<tr key={l.id}><td>{i === 0 ? "1st" : i === 1 ? "2nd" : i === 2 ? "3rd" : i + 1}</td><td><div style={{ fontWeight: 600 }}>{l.name}</div><div className="text-muted">{l.email}</div></td><td className="text-muted">{l.faculty?.split(" ").slice(-2).join(" ")}</td><td>{l.reviewCount > 0 ? <Stars value={l.avgRating} /> : "-"}</td><td><span className="badge badge-purple">{l.reviewCount}</span></td><td>{l.reviewCount === 0 ? <span className="badge badge-gray">No Data</span> : l.avgRating >= 4 ? <span className="badge badge-green">Excellent</span> : l.avgRating >= 3 ? <span className="badge badge-blue">Good</span> : <span className="badge badge-yellow">Fair</span>}</td></tr>))}</tbody></table></div>)}</div></Layout>);
}
