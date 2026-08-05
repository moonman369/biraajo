import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

// Hash links: when not on landing, prefix with "/" so they navigate to home then scroll.
function useHashHref() {
  const loc = useLocation();
  const onLanding = loc.pathname === "/";
  return (hash) => (onLanding ? hash : `/${hash}`);
}

// For react-router Link: build "/" + "#hash" when off landing, else just "#hash"
function onLandingPath(id, loc) {
  return loc.pathname === "/" ? `#${id}` : { pathname: "/", hash: `#${id}` };
}

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const href = useHashHref();
  const loc = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
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

          <a href={href("#events")} className={linkCls} data-testid="nav-events">Events</a>

          <Link to="/menus" className={linkCls} data-testid="nav-menu">Menu</Link>
          <Link to={onLandingPath("gallery", loc)} className={linkCls} data-testid="nav-gallery">Gallery</Link>
          <Link to={onLandingPath("contact", loc)} className={linkCls} data-testid="nav-contact">Reach out</Link>
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

              <a href={href("#events")} onClick={() => setOpen(false)} className="text-sm tracking-[0.18em] uppercase text-[#B5A79E] py-3 border-b border-[#2D1D1A]" data-testid="mobile-nav-events">Events</a>

              <Link to="/menus" onClick={() => setOpen(false)} className="text-sm tracking-[0.18em] uppercase text-[#B5A79E] py-3 border-b border-[#2D1D1A]" data-testid="mobile-nav-link">Menu</Link>
              <Link to={onLandingPath("gallery", loc)} onClick={() => setOpen(false)} className="text-sm tracking-[0.18em] uppercase text-[#B5A79E] py-3 border-b border-[#2D1D1A]" data-testid="mobile-nav-link">Gallery</Link>
              <Link to={onLandingPath("contact", loc)} onClick={() => setOpen(false)} className="text-sm tracking-[0.18em] uppercase text-[#B5A79E] py-3" data-testid="mobile-nav-link">Reach out</Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
