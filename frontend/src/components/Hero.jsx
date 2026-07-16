import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useSiteContent, read } from "@/lib/siteContent";

export default function Hero() {
  const { content } = useSiteContent();
  const [hasUpcoming, setHasUpcoming] = useState(true);
  const [registrationsOpen, setRegistrationsOpen] = useState(true);
  const [videoReady, setVideoReady] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/events", { params: { upcoming: "true" } })
      .then((r) => setHasUpcoming(((r.data || []).length) > 0)).catch(() => {});
    api.get("/settings")
      .then((r) => setRegistrationsOpen(r.data?.registrations_open !== false)).catch(() => {});
  }, []);

  const onReserveClick = () => {
    if (!registrationsOpen) {
      toast.info("Reservations are currently closed — join the list to be notified.");
      window.location.hash = "#newsletter";
      return;
    }
    if (!hasUpcoming) {
      toast.info("No supper open for reservations right now — join the list to be notified.");
      window.location.hash = "#newsletter";
      return;
    }
    navigate("/supper-club/barsaat#dates");
  };

  const h = content?.landing?.hero;
  if (h && h.visible === false) return null;

  const HERO_IMG = read(content, "landing.hero.image", "/api/media/biraajo/media/4d82c167b3dc090f.jpg");
  const HERO_VIDEO = "/api/media/biraajo/media/3057f27be4caad94.mp4";

  let primaryLabel = read(content, "landing.hero.primary_cta_label", "Reserve a seat");
  if (!registrationsOpen) primaryLabel = "Reservations closed · Join list";
  else if (!hasUpcoming) primaryLabel = "Be first to know · Join list";

  return (
    <section id="top" className="relative min-h-screen w-full overflow-hidden" data-testid="hero-section">
      <div className="absolute inset-0">
        <img src={HERO_IMG} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover" />
        <video
          src={HERO_VIDEO}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          onCanPlay={(e) => { setVideoReady(true); try { e.currentTarget.play(); } catch { /* ignore */ } }}
          onError={() => setVideoReady(false)}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${videoReady ? "opacity-100" : "opacity-0"}`}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A0504]/55 via-[#0A0504]/40 to-[#0A0504]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(10,5,4,0.9))]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 min-h-screen flex flex-col">
        <div className="pt-32 sm:pt-36 grid grid-cols-2 gap-6 text-overline">
          <motion.span initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.6 }}>
            <span className="ember-dot mr-3 align-middle" />
            {read(content, "landing.hero.eyebrow", "Biraajo · A personal chef supper club")}
          </motion.span>
          <motion.span className="text-right hidden sm:inline" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.7 }}>
            not quite a restaurant · not just a home
          </motion.span>
        </div>

        <div className="flex-1 flex flex-col justify-center pb-20 pt-16">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}>
            <p className="text-overline mb-6">Chef · Storyteller</p>
          </motion.div>

          <motion.h1 className="font-display text-[15vw] sm:text-[12vw] lg:text-[10rem] leading-[0.92] text-[#F3EFE7] tracking-[-0.04em]" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.55 }} data-testid="hero-title">
            {read(content, "landing.hero.brand", "biraajo")}<span className="italic text-[#D9772B]">.</span>
          </motion.h1>

          <motion.div className="mt-6 sm:mt-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-end" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.85 }}>
            <div className="lg:col-span-7">
              <p className="font-display text-2xl sm:text-3xl lg:text-4xl text-[#F3EFE7] leading-snug italic font-light">
                {read(content, "landing.hero.title", "A table is being set")}{" "}
                <span className="not-italic text-[#B5A79E]">
                  {read(content, "landing.hero.body", "Eight seats. A couple of times a month. Cooked by hand, plated with care.")}
                </span>
              </p>
            </div>

            <div className="lg:col-span-5 lg:text-right">
              <p className="text-overline mb-5 lg:mb-4">Take a seat</p>
              <div className="flex flex-col sm:flex-row gap-4 lg:justify-end">
                <button onClick={onReserveClick} data-testid="hero-reserve-seat-button" className="inline-flex items-center justify-center px-7 py-4 bg-[#5A1A1F] text-[#F3EFE7] tracking-[0.18em] uppercase text-[11px] hover:bg-[#D9772B] hover:text-[#0A0504] transition-all duration-500">
                  {primaryLabel}
                </button>
                <Link to="/menus" data-testid="hero-see-menu-button" className="inline-flex items-center justify-center px-7 py-4 border border-[#F3EFE7]/40 text-[#F3EFE7] tracking-[0.18em] uppercase text-[11px] hover:bg-[#F3EFE7] hover:text-[#0A0504] transition-all duration-500">
                  {read(content, "landing.hero.secondary_cta_label", "See the menu")}
                </Link>
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div className="pb-10 flex items-center gap-4 text-overline text-[#B5A79E]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 1.4 }}>
          <span>scroll</span>
          <span className="w-12 h-px bg-[#B5A79E]" />
          <span className="italic font-display text-base text-[#F3EFE7] normal-case tracking-normal">
            a table set for stories
          </span>
        </motion.div>
      </div>
    </section>
  );
}
