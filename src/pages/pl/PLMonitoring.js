import React, { useState, useEffect } from "react";
import Layout from "../../components/Layout";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase/config";

export default function PLMonitoring() {
  const [reports, setReports] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [reportsSnap, usersSnap] = await Promise.all([
        getDocs(collection(db, "reports")),
        getDocs(collection(db, "users"))
      ]);
      setReports(reportsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setUsers(usersSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (error) {
      console.warn("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const totalReports = reports.length;
  const reviewedReports = reports.filter(r => r.status === "reviewed").length;
  const totalLecturers = users.filter(u => u.role === "lecturer").length;
  const totalStudents = users.filter(u => u.role === "student").length;
  const avgAttendance = reports.length ? Math.round(reports.reduce((s, r) => s + (r.registeredStudents ? (r.actualStudents / r.registeredStudents) * 100 : 0), 0) / reports.length) : 0;

  const facultyStats = [...new Set(reports.map(r => r.facultyName))].map(fac => {
    const facReports = reports.filter(r => r.facultyName === fac);
    const avgRate = facReports.length ? Math.round(facReports.reduce((s, r) => s + (r.registeredStudents ? (r.actualStudents / r.registeredStudents) * 100 : 0), 0) / facReports.length) : 0;
    return { faculty: fac, reportCount: facReports.length, avgRate };
  });

  return (
    <Layout title="System Monitoring">
      <div className="page-header"><div><h1 className="page-title">System Monitoring</h1><p className="page-subtitle">Overview of all faculties and reports</p></div></div>
      <div className="stat-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card purple"><div className="stat-value">{totalReports}</div><div className="stat-label">Total Reports</div></div>
        <div className="stat-card green"><div className="stat-value">{reviewedReports}</div><div className="stat-label">Reviewed</div></div>
        <div className="stat-card blue"><div className="stat-value">{totalLecturers}</div><div className="stat-label">Lecturers</div></div>
        <div className="stat-card orange"><div className="stat-value">{totalStudents}</div><div className="stat-label">Students</div></div>
        <div className="stat-card purple"><div className="stat-value">{avgAttendance}%</div><div className="stat-label">Avg Attendance</div></div>
      </div>
      <div className="card"><div className="card-header"><div className="card-title">Faculty Performance</div></div><div className="table-container"><table className="table"><thead><tr><th>Faculty</th><th>Reports</th><th>Avg Attendance Rate</th><th>Status</th></tr></thead><tbody>{facultyStats.map(f => (<tr key={f.faculty}><td style={{ fontWeight: 600 }}>{f.faculty?.split(" ").slice(-2).join(" ")}</td><td>{f.reportCount}</td><td>{f.avgRate}%</td><td><span className={`badge ${f.avgRate >= 80 ? "badge-green" : f.avgRate >= 60 ? "badge-yellow" : "badge-red"}`}>{f.avgRate >= 80 ? "Good" : f.avgRate >= 60 ? "Fair" : "Needs Improvement"}</span></td></tr>))}</tbody></table></div></div>
    </Layout>
  );
}