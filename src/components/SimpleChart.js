import React from "react";

const colors = ["var(--primary)", "var(--secondary)", "var(--success)", "var(--warning)", "var(--danger)"];

export function BarChart({ data = [], labelKey = "label", valueKey = "value" }) {
  const max = Math.max(...data.map((item) => Number(item[valueKey]) || 0), 1);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {data.map((item, index) => {
        const value = Number(item[valueKey]) || 0;
        return (
          <div key={`${item[labelKey]}-${index}`}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 12 }}>
              <span>{item[labelKey]}</span>
              <strong>{value}</strong>
            </div>
            <div style={{ height: 8, background: "rgba(255,255,255,0.08)", borderRadius: 8, overflow: "hidden" }}>
              <div style={{ width: `${(value / max) * 100}%`, height: "100%", background: colors[index % colors.length] }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function PieChart({ data = [], labelKey = "label", valueKey = "value" }) {
  const total = data.reduce((sum, item) => sum + (Number(item[valueKey]) || 0), 0) || 1;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {data.map((item, index) => {
        const value = Number(item[valueKey]) || 0;
        const percent = Math.round((value / total) * 100);
        return (
          <div key={`${item[labelKey]}-${index}`} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 10, height: 10, borderRadius: 10, background: colors[index % colors.length], display: "inline-block" }} />
              <span>{item[labelKey]}</span>
            </div>
            <strong>{percent}%</strong>
          </div>
        );
      })}
    </div>
  );
}
