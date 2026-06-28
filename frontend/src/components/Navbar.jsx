import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ChevronDown } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

// Hash links: when not on landing, prefix with "/" so they navigate to home then scroll.
function useHashHref() {
  const loc = useLocation();
  const onLanding = loc.pathname === "/";
  return (hash) => (onLanding ? hash : `/${hash}`);
}

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [eventsOpen, setEventsOpen] = useState(false);
  const [mobileEventsOpen, setMobileEventsOpen] = useState(false);
  const eventsRef = useRef(null);
  const href = useHashHref();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const close = (e) => {
      if (eventsRef.current && !eventsRef.current.contains(e.target)) setEventsOpen(false);
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  const linkCls =
    "text-[12px] tracking-[0.22em] uppercase text-[#B5A79E] hover:text-[#F3EFE7] transition-colors duration-300";

  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? "bg-[#0A0504]/85 backdrop-blur-xl border-b border-[#2D1D1A]" : "bg-transparent"
      }`}
      data-testid="main-navbar"
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-5 flex items-center justify-between">
        <Link to="/" className="font-display text-xl sm:text-2xl tracking-tight text-[#F3EFE7]" data-testid="nav-logo">
          biraajo<span className="text-[#D9772B]">.</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 lg:gap-9">
          <a href={href("#about")} className={linkCls} data-testid="nav-story">Story</a>
          <Link to="/about-the-chef" className={linkCls} data-testid="nav-about-chef">About the Chef</Link>
          <a href={href("#experiences")} className={linkCls} data-testid="nav-experiences">Experiences</a>

          {/* Events dropdown */}
          <div className="relative" ref={eventsRef}>
            <button
              onClick={(e) => { e.stopPropagation(); setEventsOpen((v) => !v); }}
              className={`${linkCls} inline-flex items-center gap-1`}
              data-testid="nav-events-toggle"
            >
              Events <ChevronDown size={12} className={`transition-transform ${eventsOpen ? "rotate-180" : ""}`} />
            </button>
            <AnimatePresence>
              {eventsOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                  className="absolute top-full right-0 mt-3 w-64 bg-[#140A09] border border-[#2D1D1A] py-2"
                >
                  <a href={href("#events")} onClick={() => setEventsOpen(false)}
                    className="block px-5 py-3 text-[11px] tracking-[0.22em] uppercase text-[#B5A79E] hover:bg-[#0A0504] hover:text-[#F3EFE7]"
                    data-testid="nav-events-all">
                    All upcoming
                  </a>
                  <Link to="/supper-club/barsaat" onClick={() => setEventsOpen(false)}
                    className="block px-5 py-3 text-[11px] tracking-[0.22em] uppercase text-[#B5A79E] hover:bg-[#0A0504] hover:text-[#F3EFE7]"
                    data-testid="nav-events-barsaat">
                    Barsaat · Upcoming
                  </Link>
                  <Link to="/supper-club/naani-ghar" onClick={() => setEventsOpen(false)}
                    className="block px-5 py-3 text-[11px] tracking-[0.22em] uppercase text-[#B5A79E] hover:bg-[#0A0504] hover:text-[#F3EFE7]"
                    data-testid="nav-events-naani-ghar">
                    Naani Ghar · Past
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <a href={href("#menu")} className={linkCls} data-testid="nav-menu">Menu</a>
          <a href={href("#gallery")} className={linkCls} data-testid="nav-gallery">Gallery</a>
          <a href={href("#contact")} className={linkCls} data-testid="nav-contact">Reach out</a>
        </nav>

        <button
          aria-label="Toggle menu"
          onClick={() => setOpen((v) => !v)}
          className="md:hidden text-[#F3EFE7]"
          data-testid="mobile-menu-toggle"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="md:hidden overflow-hidden bg-[#0A0504] border-t border-[#2D1D1A]"
          >
            <div className="flex flex-col gap-1 px-6 py-6">
              <a href={href("#about")} onClick={() => setOpen(false)} className="text-sm tracking-[0.18em] uppercase text-[#B5A79E] py-3 border-b border-[#2D1D1A]" data-testid="mobile-nav-link">Story</a>
              <Link to="/about-the-chef" onClick={() => setOpen(false)} className="text-sm tracking-[0.18em] uppercase text-[#B5A79E] py-3 border-b border-[#2D1D1A]" data-testid="mobile-nav-link">About the Chef</Link>
              <a href={href("#experiences")} onClick={() => setOpen(false)} className="text-sm tracking-[0.18em] uppercase text-[#B5A79E] py-3 border-b border-[#2D1D1A]" data-testid="mobile-nav-link">Experiences</a>

              <button
                onClick={() => setMobileEventsOpen((v) => !v)}
                className="text-sm tracking-[0.18em] uppercase text-[#B5A79E] py-3 border-b border-[#2D1D1A] flex items-center justify-between"
                data-testid="mobile-nav-events-toggle"
              >
                Events <ChevronDown size={14} className={`transition-transform ${mobileEventsOpen ? "rotate-180" : ""}`} />
              </button>
              {mobileEventsOpen && (
                <div className="border-b border-[#2D1D1A] pb-2 pl-4">
                  <a href={href("#events")} onClick={() => setOpen(false)} className="block py-2 text-xs tracking-[0.18em] uppercase text-[#B5A79E]" data-testid="mobile-nav-events-all">All upcoming</a>
                  <Link to="/supper-club/barsaat" onClick={() => setOpen(false)} className="block py-2 text-xs tracking-[0.18em] uppercase text-[#B5A79E]" data-testid="mobile-nav-events-barsaat">Barsaat · Upcoming</Link>
                  <Link to="/supper-club/naani-ghar" onClick={() => setOpen(false)} className="block py-2 text-xs tracking-[0.18em] uppercase text-[#B5A79E]" data-testid="mobile-nav-events-naani-ghar">Naani Ghar · Past</Link>
                </div>
              )}

              <a href={href("#menu")} onClick={() => setOpen(false)} className="text-sm tracking-[0.18em] uppercase text-[#B5A79E] py-3 border-b border-[#2D1D1A]" data-testid="mobile-nav-link">Menu</a>
              <a href={href("#gallery")} onClick={() => setOpen(false)} className="text-sm tracking-[0.18em] uppercase text-[#B5A79E] py-3 border-b border-[#2D1D1A]" data-testid="mobile-nav-link">Gallery</a>
              <a href={href("#contact")} onClick={() => setOpen(false)} className="text-sm tracking-[0.18em] uppercase text-[#B5A79E] py-3" data-testid="mobile-nav-link">Reach out</a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
