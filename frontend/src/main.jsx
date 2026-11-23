import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import "./index.css";
function Home() {
  const { user, loading } = useAuth();
  if (loading) return <div className="login-wrap">Loading…</div>;
  return <Navigate to={user ? `/${user.role}` : "/login"} replace />;
}
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Home />} />
          {["student", "teacher", "admin"].map((role) => (
            <Route
              key={role}
              path={`/${role}`}
              element={
                <ProtectedRoute roles={[role]}>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
          ))}
          <Route
            path="/profile"
            element={
              <ProtectedRoute roles={["student", "teacher", "admin"]}>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
