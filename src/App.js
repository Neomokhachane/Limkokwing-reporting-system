import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ToastProvider } from "./components/Toast";
import ProtectedRoute from "./components/ProtectedRoute";
import "./styles/global.css";

// Auth
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";

// Shared
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";

// Student
import StudentMonitoring from "./pages/student/StudentMonitoring";
import StudentRating from "./pages/student/StudentRating";
import StudentAttendance from "./pages/student/StudentAttendance";
import StudentCourses from "./pages/student/StudentCourses";

// Lecturer
import LecturerClasses from "./pages/lecturer/LecturerClasses";
import LecturerReports from "./pages/lecturer/LecturerReports";
import LecturerMonitoring from "./pages/lecturer/LecturerMonitoring";
import LecturerRating from "./pages/lecturer/LecturerRating";
import LecturerAttendance from "./pages/lecturer/LecturerAttendance";

// PRL (Principal Lecturer)
import PRLCourses from "./pages/prl/PRLCourses";
import PRLReports from "./pages/prl/PRLReports";
import PRLMonitoring from "./pages/prl/PRLMonitoring";
import PRLRating from "./pages/prl/PRLRating";

// PL (Program Leader)
import PLCourses from "./pages/pl/PLCourses";
import PLReports from "./pages/pl/PLReports";
import PLMonitoring from "./pages/pl/PLMonitoring";
import PLClasses from "./pages/pl/PLClasses";
import PLLecturers from "./pages/pl/PLLecturers";
import PLRating from "./pages/pl/PLRating";
import PLUserManagement from "./pages/pl/PLUserManagement";

function RoleRedirect() {
  const { userProfile, loading } = useAuth();
  if (loading) return null;
  return <Navigate to="/dashboard" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={<RoleRedirect />} />

      {/* Shared Dashboard */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />

      {/* Student Routes */}
      <Route
        path="/student/courses"
        element={
          <ProtectedRoute roles={["student"]}>
            <StudentCourses />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/monitoring"
        element={
          <ProtectedRoute roles={["student"]}>
            <StudentMonitoring />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/rating"
        element={
          <ProtectedRoute roles={["student"]}>
            <StudentRating />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/attendance"
        element={
          <ProtectedRoute roles={["student"]}>
            <StudentAttendance />
          </ProtectedRoute>
        }
      />

      {/* Lecturer Routes */}
      <Route
        path="/lecturer/classes"
        element={
          <ProtectedRoute roles={["lecturer"]}>
            <LecturerClasses />
          </ProtectedRoute>
        }
      />
      <Route
        path="/lecturer/reports"
        element={
          <ProtectedRoute roles={["lecturer"]}>
            <LecturerReports />
          </ProtectedRoute>
        }
      />
      <Route
        path="/lecturer/monitoring"
        element={
          <ProtectedRoute roles={["lecturer"]}>
            <LecturerMonitoring />
          </ProtectedRoute>
        }
      />
      <Route
        path="/lecturer/rating"
        element={
          <ProtectedRoute roles={["lecturer"]}>
            <LecturerRating />
          </ProtectedRoute>
        }
      />
      <Route
        path="/lecturer/attendance"
        element={
          <ProtectedRoute roles={["lecturer"]}>
            <LecturerAttendance />
          </ProtectedRoute>
        }
      />

      {/* PRL Routes */}
      <Route
        path="/prl/courses"
        element={
          <ProtectedRoute roles={["prl"]}>
            <PRLCourses />
          </ProtectedRoute>
        }
      />
      <Route
        path="/prl/reports"
        element={
          <ProtectedRoute roles={["prl"]}>
            <PRLReports />
          </ProtectedRoute>
        }
      />
      <Route
        path="/prl/monitoring"
        element={
          <ProtectedRoute roles={["prl"]}>
            <PRLMonitoring />
          </ProtectedRoute>
        }
      />
      <Route
        path="/prl/rating"
        element={
          <ProtectedRoute roles={["prl"]}>
            <PRLRating />
          </ProtectedRoute>
        }
      />
      {/* PL Routes */}
      <Route
        path="/pl/users"
        element={
          <ProtectedRoute roles={["pl"]}>
            <PLUserManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/pl/courses"
        element={
          <ProtectedRoute roles={["pl"]}>
            <PLCourses />
          </ProtectedRoute>
        }
      />
      <Route
        path="/pl/reports"
        element={
          <ProtectedRoute roles={["pl"]}>
            <PLReports />
          </ProtectedRoute>
        }
      />
      <Route
        path="/pl/monitoring"
        element={
          <ProtectedRoute roles={["pl"]}>
            <PLMonitoring />
          </ProtectedRoute>
        }
      />
      <Route
        path="/pl/classes"
        element={
          <ProtectedRoute roles={"pl"}>
            <PLClasses />
          </ProtectedRoute>
        }
      />
      <Route
        path="/pl/lecturers"
        element={
          <ProtectedRoute roles={["pl"]}>
            <PLLecturers />
          </ProtectedRoute>
        }
      />
      <Route
        path="/pl/rating"
        element={
          <ProtectedRoute roles={["pl"]}>
            <PLRating />
          </ProtectedRoute>
        }
      />

      {/* Fallback Route */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
