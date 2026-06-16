import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import LandingPage from "@/pages/LandingPage";
import AdminLogin from "@/pages/AdminLogin";
import AdminDashboard from "@/pages/AdminDashboard";
import { getToken } from "@/lib/api";
import "@/App.css";

function RequireAdmin({ children }) {
  return getToken() ? children : <Navigate to="/admin/login" replace />;
}

export default function App() {
  return (
    <div className="App film-grain">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin"
            element={
              <RequireAdmin>
                <AdminDashboard />
              </RequireAdmin>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster
        theme="dark"
        position="bottom-right"
        toastOptions={{
          style: {
            background: "#140A09",
            color: "#F3EFE7",
            border: "1px solid #2D1D1A",
            borderRadius: 0,
          },
        }}
      />
    </div>
  );
}
