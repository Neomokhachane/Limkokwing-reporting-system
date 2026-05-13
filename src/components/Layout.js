import React, { useState } from "react";
import Sidebar from "./Sidebar";

export default function Layout({ children, title }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="app-layout">
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="main-content">
        <div className="topbar">
          <button
            className="btn btn-icon btn-secondary"
            onClick={() => setMobileOpen((o) => !o)}
            style={{ display: "flex" }}
            aria-label="Toggle menu"
          >
            Menu
          </button>
          <h2 className="topbar-title">{title}</h2>
        </div>
        <div className="page-container">{children}</div>
      </div>
    </div>
  );
}