import React, { useState, useEffect } from "react";
import Layout from "../../components/Layout";
import { useAuth } from "../../context/AuthContext";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../firebase/config";

export default function LecturerMonitoring() {
  const { currentUser } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, [currentUser]);

  const loadReports = async () => {
    if (!currentUser?.uid) {
      setLoading(false);
      return;
    }
    try {
      const q = query(collection(db, "reports"), where("lecturerId", "==", currentUser.uid));
      const snapshot = await getDocs(q);
      const reportsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setReports(reportsData);
    } catch (error) {
      console.warn("Error loading reports:", error);
    } finally {
      setLoading(false);
    }
  };

  const totalReports = reports.length;
  const reviewed = reports.filter(r => r.status === "reviewed").length;
  const avgAttendance = reports.length ? Math.round(reports.reduce((s, r) => s + (r.registeredStudents ? (r.actualStudents / r.registeredStudents) * 100 : 0), 0) / reports.length) : 0;
  const uniqueCourses = [...new Set(reports.map(r => r.courseCode))].length;

  const weeklyData = reports.reduce((acc, r) => {
    const week = `Week ${r.weekOfReporting}`;
    const existing = acc.find(a => a.week === week);
    if (existing) {
      existing.actual += r.actualStudents || 0;
      existing.registered += r.registeredStudents || 0;
      existing.count++;
    } else {
      acc.push({ week, actual: r.actualStudents || 0, registered: r.registeredStudents || 0, count: 1 });
    }
    return acc;
  }, []).sort((a, b) => parseInt(a.week.split(" ")[1]) - parseInt(b.week.split(" ")[1]));

  const courseStats = [...new Set(reports.map(r => r.courseCode))].map(code => {
    const cr = reports.filter(r => r.courseCode === code);
    const avgPresent = Math.round(cr.reduce((s, r) => s + (r.actualStudents || 0), 0) / cr.length);
    const avgReg = Math.round(cr.reduce((s, r) => s + (r.registeredStudents || 0), 0) / cr.length);
    const rate = avgReg ? Math.round((avgPresent / avgReg) * 100) : 0;
    return { code, name: cr[0]?.courseName, reports: cr.length, avgPresent, avgReg, rate };
  });

  return (
    <Layout title="Monitoring">
      <div className="page-header"><div><h1 className="page-title">Monitoring</h1><p className="page-subtitle">Track your lecture performance and attendance trends</p></div></div>
      <div className="stat-grid" style={{ marginBottom: 24 }}>{[ { label: "Total Reports", value: totalReports, color: "purple" }, { label: "Reviewed", value: reviewed, color: "green" }, { label: "Avg Attendance", value: `${avgAttendance}%`, color: "blue" }, { label: "Courses Taught", value: uniqueCourses, color: "orange" } ].map((c, i) => (<div key={i} className={`stat-card ${c.color}`}><div className="stat-value">{c.value}</div><div className="stat-label">{c.label}</div></div>))}</div>
      {loading ? (<div className="loading-overlay"><div className="loading-spinner" /><span>Loading charts...</span></div>) : reports.length === 0 ? (<div className="empty-state"><div className="empty-state-icon">No Data</div><h3>No data available</h3><p>Submit reports to see monitoring charts</p></div>) : (
        <div className="card"><div className="card-header"><div className="card-title">Weekly Attendance Summary</div></div><div className="table-container"><table className="table"><thead><tr><th>Week</th><th>Present Students</th><th>Registered Students</th><th>Attendance Rate</th></tr></thead><tbody>{weeklyData.map(w => (<tr key={w.week}><td>{w.week}</td><td>{w.actual}</td><td>{w.registered}</td><td><span className={`badge ${(w.registered ? Math.round((w.actual / w.registered) * 100) : 0) >= 80 ? "badge-green" : (w.registered ? Math.round((w.actual / w.registered) * 100) : 0) >= 60 ? "badge-yellow" : "badge-red"}`}>{w.registered ? Math.round((w.actual / w.registered) * 100) : 0}%</span></td></tr>))}</tbody></table></div></div>
      )}
      {!loading && reports.length > 0 && (<div className="card" style={{ marginTop: 20 }}><div className="card-header"><div className="card-title">Course Performance Summary</div></div><div className="table-container"><table className="table"><thead><tr><th>Course</th><th>Code</th><th>Reports</th><th>Avg Present</th><th>Avg Registered</th><th>Avg Rate</th></tr></thead><tbody>{courseStats.map(c => (<tr key={c.code}><td style={{ fontWeight: 600 }}>{c.name}</td><td><span className="badge badge-blue">{c.code}</span></td><td>{c.reports}</td><td>{c.avgPresent}</td><td>{c.avgReg}</td><td><span className={`badge ${c.rate >= 80 ? "badge-green" : c.rate >= 60 ? "badge-yellow" : "badge-red"}`}>{c.rate}%</span></td></tr>))}</tbody></table></div></div>)}
    </Layout>
  );
}