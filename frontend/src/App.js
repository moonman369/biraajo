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
import EventsArchive from "@/pages/EventsArchive";
import WhenThereWasntEnough from "@/pages/WhenThereWasntEnough";
import WhenThereWasntEnoughMenu from "@/pages/WhenThereWasntEnoughMenu";
import { getToken } from "@/lib/api";
import { trackPageView } from "@/lib/analytics";
import "@/App.css";

function AnalyticsTracker() {
  const { pathname } = useLocation();
  useEffect(() => {
    trackPageView(pathname);
  }, [pathname]);
  return null;
}

function RequireAdmin({ children }) {
  return getToken() ? children : <Navigate to="/admin/login" replace />;
}

// Scroll to hash on route/hash change (fixes /#gallery, /#contact links from other pages)
// Uses a ResizeObserver-driven re-scroll loop so mid-document targets stay aligned
// even as lazy-loaded content above them grows the document.
function ScrollToHash() {
  const { hash, pathname } = useLocation();
  useEffect(() => {
    if (hash) {
      let attempts = 0;
      let observer = null;
      let stopTimer = null;
      let started = false;

      const align = () => {
        const el = document.querySelector(hash);
        if (el) el.scrollIntoView({ behavior: "auto", block: "start" });
      };

      const beginObserving = () => {
        if (started) return;
        started = true;
        align();
        // Re-align whenever the document height changes (lazy media loading, etc.)
        observer = new ResizeObserver(() => align());
        observer.observe(document.body);
        // Stop the observer after 3s once layout has settled.
        stopTimer = setTimeout(() => {
          align();
          if (observer) observer.disconnect();
        }, 3000);
      };

      const tryStart = () => {
        if (document.querySelector(hash)) {
          beginObserving();
          return;
        }
        if (++attempts < 30) setTimeout(tryStart, 100);
      };
      setTimeout(tryStart, 60);

      return () => {
        if (observer) observer.disconnect();
        if (stopTimer) clearTimeout(stopTimer);
      };
    } else {
      // Guard the pathname-before-hash race: only scroll to top if no hash
      // appears shortly after (React Router may commit pathname before hash).
      const t = setTimeout(() => {
        if (!window.location.hash) window.scrollTo({ top: 0, behavior: "instant" });
      }, 80);
      return () => clearTimeout(t);
    }
  }, [hash, pathname]);
  return null;
}

export default function App() {
  return (
    <div className="App film-grain">
      <BrowserRouter>
        <ScrollToHash />
        <AnalyticsTracker />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/events" element={<EventsArchive />} />
          <Route path="/about-the-chef" element={<AboutTheChef />} />
          <Route path="/supper-club/naani-ghar" element={<NaaniGhar />} />
          <Route path="/supper-club/barsaat" element={<Barsaat />} />
          <Route path="/supper-club/when-there-wasnt-enough" element={<WhenThereWasntEnough />} />
          <Route path="/booking/:id" element={<BookingStatus />} />
          <Route path="/suppers" element={<Suppers />} />
          <Route path="/menus" element={<Menus />} />
          <Route path="/menus/naani-ghar" element={<NaaniGharMenu />} />
          <Route path="/menus/barsaat" element={<BarsaatMenu />} />
          <Route path="/menus/when-there-wasnt-enough" element={<WhenThereWasntEnoughMenu />} />
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
