import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { api } from "@/lib/api";
import { CHAPTERS } from "@/lib/chapters";
import { isVideoUrl } from "@/lib/media";

export default function Events() {
  const [seatInfo, setSeatInfo] = useState(null);

  useEffect(() => {
    api
      .get("/events", { params: { upcoming: true } })
      .then((r) => {
        const wtwe = (r.data || []).filter((e) => e.id.startsWith("wtwe-"));
        if (wtwe.length) {
          const left = wtwe.reduce(
            (s, e) => s + Math.max(0, (e.seats_total || 0) - (e.seats_booked || 0)),
            0
          );
          setSeatInfo({ left, evenings: wtwe.length });
        }
      })
      .catch(() => {});
  }, []);

  return (
    <section
      id="events"
      className="relative bg-[#0A0504] py-24 sm:py-36 lg:py-44 border-t border-[#2D1D1A]"
      data-testid="events-section"
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-end mb-14">
          <div className="lg:col-span-8">
            <p className="text-overline">03 · The Chapters</p>
            <h2 className="font-display text-5xl sm:text-6xl lg:text-7xl mt-6 text-[#F3EFE7] leading-[1.02] tracking-tight">
              Reserve a{" "}
              <span className="italic text-[#D9772B]">seat at the table.</span>
            </h2>
          </div>
          <div className="lg:col-span-4">
            <p className="text-[#B5A79E] leading-relaxed">
              Every chapter runs its own menu, until the next one begins.
            </p>
            <Link
              to="/events"
              className="text-overline inline-flex items-center gap-2 mt-5 hover:text-[#D9772B] transition-colors"
              data-testid="events-view-archive-link"
            >
              See every chapter <ArrowRight size={12} />
            </Link>
          </div>
        </div>

        <div
          className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-px bg-transparent md:bg-[#2D1D1A] md:border md:border-[#2D1D1A]"
          data-testid="homepage-chapters-grid"
        >
          {CHAPTERS.map((c, i) => (
            <motion.div
              key={c.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.7, delay: i * 0.1 }}
              className="bg-[#0A0504] border border-[#2D1D1A] md:border-0 flex flex-col"
              data-testid={`homepage-chapter-card-${c.number}`}
            >
              <div className="img-zoom relative aspect-4/3 overflow-hidden">
                {isVideoUrl(c.image) ? (
                  <video
                    src={c.image}
                    className="w-full h-full object-cover"
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    onCanPlay={(e) => { try { e.currentTarget.play(); } catch { /* ignore */ } }}
                  />
                ) : (
                  <img src={c.image} alt={c.name} className="w-full h-full object-cover" loading="lazy" />
                )}
                <div className="absolute inset-0 bg-linear-to-t/srgb from-[#0A0504]/70 to-transparent" />
                <span
                  className={`absolute top-4 left-4 text-[10px] tracking-[0.22em] uppercase px-2.5 py-1 border backdrop-blur-xs bg-[#0A0504]/70 ${
                    c.active ? "border-[#D9772B] text-[#D9772B]" : "border-[#2D1D1A] text-[#F3EFE7]"
                  }`}
                  data-testid={`homepage-chapter-status-${c.number}`}
                >
                  {c.status}
                </span>
              </div>
              <div className="p-7 sm:p-9 flex flex-col flex-1">
                <p className="text-overline">Chapter {c.number}</p>
                <h3 className="font-display text-3xl text-[#F3EFE7] mt-3 tracking-tight leading-tight">{c.name}</h3>
                <p className="text-[12px] tracking-[0.2em] uppercase text-[#D9772B] mt-2">{c.tagline}</p>
                <p className="mt-4 text-[#B5A79E] text-sm leading-relaxed flex-1">{c.description}</p>
                {c.active && seatInfo && (
                  <p
                    className="mt-5 text-[11px] tracking-[0.18em] uppercase text-[#B5A79E]"
                    data-testid="homepage-chapter-seat-info"
                  >
                    {seatInfo.left} seats left · {seatInfo.evenings} evenings
                  </p>
                )}
                <Link
                  to={c.href}
                  data-testid={`homepage-chapter-cta-${c.number}`}
                  className={`mt-6 inline-flex items-center justify-center gap-2 px-6 py-4 tracking-[0.18em] uppercase text-[11px] transition-all duration-500 ${
                    c.active
                      ? "bg-[#5A1A1F] text-[#F3EFE7] hover:bg-[#D9772B] hover:text-[#0A0504]"
                      : "border border-[#2D1D1A] text-[#F3EFE7] hover:border-[#D9772B] hover:text-[#D9772B]"
                  }`}
                >
                  {c.ctaLabel} <ArrowRight size={13} />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
