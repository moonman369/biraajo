import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";

const links = [
  { href: "#about", label: "Story" },
  { href: "#experiences", label: "Experiences" },
  { href: "#events", label: "Events" },
  { href: "#menu", label: "Menu" },
  { href: "#gallery", label: "Gallery" },
  { href: "#contact", label: "Reach out" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-[#0A0504]/85 backdrop-blur-xl border-b border-[#2D1D1A]"
          : "bg-transparent"
      }`}
      data-testid="main-navbar"
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-5 flex items-center justify-between">
        <a
          href="#top"
          className="font-display text-xl sm:text-2xl tracking-tight text-[#F3EFE7]"
          data-testid="nav-logo"
        >
          biraajo<span className="text-[#D9772B]">.</span>
        </a>

        <nav className="hidden md:flex items-center gap-9">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              data-testid="nav-menu-link"
              className="text-[12px] tracking-[0.22em] uppercase text-[#B5A79E] hover:text-[#F3EFE7] transition-colors duration-300"
            >
              {l.label}
            </a>
          ))}
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
              {links.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="text-sm tracking-[0.18em] uppercase text-[#B5A79E] hover:text-[#D9772B] py-3 border-b border-[#2D1D1A]"
                  data-testid="mobile-nav-link"
                >
                  {l.label}
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
