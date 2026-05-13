import React, { useState, useEffect } from "react";
import Layout from "../../components/Layout";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase/config";
import { exportToExcel } from "../../utils/exportCsv";

export default function PLClasses() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => { loadClasses(); }, []);

  const loadClasses = async () => {
    try { const snapshot = await getDocs(collection(db, "classes")); setClasses(snapshot.docs.map(d => ({ id: d.id, ...d.data() }))); } catch (error) { console.warn(error); } finally { setLoading(false); }
  };

  const filteredClasses = classes.filter((classItem) => {
    const term = search.toLowerCase();
    return (
      classItem.className?.toLowerCase().includes(term) ||
      classItem.programmeName?.toLowerCase().includes(term) ||
      classItem.courseName?.toLowerCase().includes(term) ||
      classItem.courseCode?.toLowerCase().includes(term) ||
      classItem.lecturerName?.toLowerCase().includes(term) ||
      classItem.faculty?.toLowerCase().includes(term)
    );
  });

  const grouped = filteredClasses.reduce((acc, c) => { const key = c.faculty || "Unknown"; if (!acc[key]) acc[key] = []; acc[key].push(c); return acc; }, {});

  const exportClasses = () => {
    const data = filteredClasses.map((classItem) => ({
      Faculty: classItem.faculty,
      Class: classItem.className,
      Course: classItem.courseName || classItem.programmeName,
      Code: classItem.courseCode || classItem.programmeCode || "",
      Lecturer: classItem.lecturerName || "",
      Year: classItem.year,
      Semester: classItem.semester,
      Venue: classItem.venue || "",
      "Scheduled Time": classItem.scheduledTime || "",
      Students: classItem.registeredStudents || 0
    }));
    exportToExcel(data, `classes-${new Date().toISOString().slice(0, 10)}`, "Classes");
  };

  return (<Layout title="All Classes"><div className="page-header"><div><h1 className="page-title">All Classes</h1><p className="page-subtitle">Overview of all classes across all faculties</p></div><button className="btn btn-secondary" onClick={exportClasses}>Export Excel</button></div><div className="card" style={{ marginBottom: 16 }}><div className="search-bar"><span>Search</span><input placeholder="Search class, course, lecturer or faculty..." value={search} onChange={(e) => setSearch(e.target.value)} /></div></div>{loading ? (<div className="loading-overlay" />) : Object.entries(grouped).length === 0 ? (<div className="empty-state"><p>No classes found</p></div>) : Object.entries(grouped).map(([faculty, fClasses]) => (<div key={faculty} className="card" style={{ marginBottom: 16 }}><div className="card-header"><div><div className="card-title">{faculty}</div><div className="card-subtitle">{fClasses.length} classes</div></div><span className="badge badge-purple">{fClasses.reduce((s, c) => s + (c.registeredStudents || 0), 0)} students</span></div><div className="table-container"><table className="table"><thead><tr><th>Class</th><th>Course</th><th>Lecturer</th><th>Year/Sem</th><th>Venue</th><th>Students</th></tr></thead><tbody>{fClasses.map(c => (<tr key={c.id}><td style={{ fontWeight: 600 }}>{c.className}</td><td>{c.courseName || c.programmeName}<div className="text-muted">{c.courseCode || c.programmeCode}</div></td><td>{c.lecturerName || "-"}</td><td>Year {c.year}, Sem {c.semester}</td><td>{c.venue || "-"}</td><td><span className="badge badge-green">{c.registeredStudents}</span></td></tr>))}</tbody></table></div></div>))}</Layout>);
}
