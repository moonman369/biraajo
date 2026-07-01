import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Toaster } from "sonner";
import LandingPage from "@/pages/LandingPage";
import AdminLogin from "@/pages/AdminLogin";
import AdminDashboard from "@/pages/AdminDashboard";
import AboutTheChef from "@/pages/AboutTheChef";
import NaaniGhar from "@/pages/NaaniGhar";
import Barsaat from "@/pages/Barsaat";
import BookingStatus from "@/pages/BookingStatus";
import EditWebsite from "@/pages/EditWebsite";
import Suppers from "@/pages/Suppers";
import Menus from "@/pages/Menus";
import NaaniGharMenu from "@/pages/NaaniGharMenu";
import BarsaatMenu from "@/pages/BarsaatMenu";
import { getToken } from "@/lib/api";
import "@/App.css";

function RequireAdmin({ children }) {
  return getToken() ? children : <Navigate to="/admin/login" replace />;
}

// Scroll to hash on route/hash change (fixes /#gallery, /#contact links from other pages)
function ScrollToHash() {
  const { hash, pathname } = useLocation();
  useEffect(() => {
    if (hash) {
      // Retry a few times because target may not be mounted yet after route change
      let attempts = 0;
      const tryScroll = () => {
        const el = document.querySelector(hash);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
          return;
        }
        if (++attempts < 30) setTimeout(tryScroll, 100);
      };
      setTimeout(tryScroll, 60);
    } else {
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  }, [hash, pathname]);
  return null;
}

export default function App() {
  return (
    <div className="App film-grain">
      <BrowserRouter>
        <ScrollToHash />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/about-the-chef" element={<AboutTheChef />} />
          <Route path="/supper-club/naani-ghar" element={<NaaniGhar />} />
          <Route path="/supper-club/barsaat" element={<Barsaat />} />
          <Route path="/booking/:id" element={<BookingStatus />} />
          <Route path="/suppers" element={<Suppers />} />
          <Route path="/menus" element={<Menus />} />
          <Route path="/menus/naani-ghar" element={<NaaniGharMenu />} />
          <Route path="/menus/barsaat" element={<BarsaatMenu />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/edit" element={<EditWebsite />} />
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
