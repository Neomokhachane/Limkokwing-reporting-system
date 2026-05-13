import React, { useState, useEffect } from "react";
import Layout from "../../components/Layout";
import { useAuth } from "../../context/AuthContext";
import { subscribeToReports, getUsers } from "../../firebase/firestoreService";
import { BarChart, PieChart } from "../../components/SimpleChart";

export default function PRLMonitoring() {
  const { userProfile } = useAuth();
  const [reports, setReports] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const filters = userProfile?.faculty
      ? { faculty: userProfile.faculty }
      : {};
    const unsub = subscribeToReports(filters, (data) => {
      setReports(data);
      setLoading(false);
    });
    getUsers("lecturer").then(setLecturers);
    return unsub;
  }, [userProfile]);

  const totalReports = reports.length;
  const reviewed = reports.filter((r) => r.status === "reviewed").length;
  const uniqueCourses = [...new Set(reports.map((r) => r.courseCode))].length;
  const avgAttendance = reports.length
    ? Math.round(
        reports.reduce(
          (s, r) =>
            s +
            (r.registeredStudents
              ? (r.actualStudents / r.registeredStudents) * 100
              : 0),
          0
        ) / reports.length
      )
    : 0;

  const lecturerStats = lecturers
    .map((l) => {
      const lReports = reports.filter((r) => r.lecturerId === l.uid);
      const avgAtt = lReports.length
        ? Math.round(
            lReports.reduce(
              (s, r) =>
                s +
                (r.registeredStudents
                  ? (r.actualStudents / r.registeredStudents) * 100
                  : 0),
              0
            ) / lReports.length
          )
        : 0;
      return {
        name: l.name?.split(" ")[0] || "N/A",
        reports: lReports.length,
        avgAttendance: avgAtt,
        fullName: l.name,
      };
    })
    .filter((l) => l.reports > 0);

  const courseStats = [...new Set(reports.map((r) => r.courseCode))].map(
    (code) => {
      const cr = reports.filter((r) => r.courseCode === code);
      return {
        name: code,
        reports: cr.length,
        avgRate: cr.length
          ? Math.round(
              cr.reduce(
                (s, r) =>
                  s +
                  (r.registeredStudents
                    ? (r.actualStudents / r.registeredStudents) * 100
                    : 0),
                0
              ) / cr.length
            )
          : 0,
        courseName: cr[0]?.courseName,
      };
    }
  );

  const statusPieData = [
    { name: "Reviewed", value: reviewed, color: "#10b981" },
    { name: "Pending", value: totalReports - reviewed, color: "#f59e0b" },
  ].filter((d) => d.value > 0);

  const filteredLecturers = lecturerStats.filter((l) =>
    l.fullName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout title="Monitoring">
      <div className="page-header">
        <div>
          <h1 className="page-title"> Monitoring</h1>
          <p className="page-subtitle">
            Overview of all lectures and performance in your stream
          </p>
        </div>
      </div>

      <div className="stat-grid" style={{ marginBottom: 24 }}>
        {[
          {
            label: "Total Reports",
            value: totalReports,
            icon: "",
            color: "purple",
          },
          { label: "Reviewed", value: reviewed, icon: "", color: "green" },
          {
            label: "Avg Attendance",
            value: `${avgAttendance}%`,
            icon: "",
            color: "blue",
          },
          {
            label: "Active Courses",
            value: uniqueCourses,
            icon: "",
            color: "orange",
          },
        ].map((c, i) => (
          <div key={i} className={`stat-card ${c.color}`}>
            <div className="stat-value">{c.value}</div>
            <div className="stat-label">{c.label}</div>
            <div className="stat-icon">{c.icon}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="loading-overlay">
          <div className="loading-spinner" />
          <span>Loading...</span>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div className="grid-2">
            <div className="card">
              <div className="card-header">
                <div className="card-title">Reports by Lecturer</div>
              </div>
              <BarChart
                data={filteredLecturers.slice(0, 10)}
                xKey="name"
                bars={[{ key: "reports", name: "Reports", color: "#6c63ff" }]}
                height={220}
              />
            </div>
            <div className="card">
              <div className="card-header">
                <div className="card-title">Report Status</div>
              </div>
              <PieChart data={statusPieData} height={220} />
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-title">Lecturer Performance</div>
              <div className="search-bar" style={{ width: 220 }}>
                <span></span>
                <input
                  placeholder="Search lecturer..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ width: "100%" }}
                />
              </div>
            </div>
            {filteredLecturers.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon"></div>
                <h3>No data</h3>
                <p>Lecturer performance will appear here</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Lecturer</th>
                      <th>Reports Submitted</th>
                      <th>Avg Attendance Rate</th>
                      <th>Performance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLecturers.map((l) => (
                      <tr key={l.fullName}>
                        <td style={{ fontWeight: 600 }}>{l.fullName}</td>
                        <td>{l.reports}</td>
                        <td>{l.avgAttendance}%</td>
                        <td>
                          <span
                            className={`badge ${
                              l.avgAttendance >= 80
                                ? "badge-green"
                                : l.avgAttendance >= 60
                                ? "badge-yellow"
                                : "badge-red"
                            }`}
                          >
                            {l.avgAttendance >= 80
                              ? " Good"
                              : l.avgAttendance >= 60
                              ? " Fair"
                              : " Low"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-title">Course Statistics</div>
            </div>
            {courseStats.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon"></div>
                <p>No course data available</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Course</th>
                      <th>Code</th>
                      <th>Reports</th>
                      <th>Avg Attendance Rate</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {courseStats.map((c) => (
                      <tr key={c.name}>
                        <td style={{ fontWeight: 600 }}>{c.courseName}</td>
                        <td>
                          <span className="badge badge-blue">{c.name}</span>
                        </td>
                        <td>{c.reports}</td>
                        <td>{c.avgRate}%</td>
                        <td>
                          <span
                            className={`badge ${
                              c.avgRate >= 80
                                ? "badge-green"
                                : c.avgRate >= 60
                                ? "badge-yellow"
                                : "badge-red"
                            }`}
                          >
                            {c.avgRate >= 80
                              ? "Good"
                              : c.avgRate >= 60
                              ? "Fair"
                              : "Low"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
}

