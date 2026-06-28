import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import EventRegistrationModal from "@/components/EventRegistrationModal";
import { api } from "@/lib/api";
import { useSiteContent, read } from "@/lib/siteContent";

export default function Barsaat() {
  const { content } = useSiteContent();
  const [event, setEvent] = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    api.get("/events", { params: { upcoming: "true" } }).then((r) => {
      const list = r.data || [];
      const match = list.find((e) => /barsaat|monsoon/i.test(`${e.title} ${e.tag || ""}`));
      setEvent(match || list[0] || null);
    }).catch(() => {});
  }, []);

  if (content?.barsaat?.visible === false) return null;
  const heroVisible = read(content, "barsaat.hero.visible", true) !== false;
  const reelVisible = read(content, "barsaat.reel.visible", true) !== false;
  const closerVisible = read(content, "barsaat.closer.visible", true) !== false;
  const notes = read(content, "barsaat.notes", []);
  const heroImg = read(content, "barsaat.hero.image", "");
  const reelUrl = read(content, "barsaat.reel.video_url", "");

  const seatsLeft = event ? Math.max(0, event.seats_total - (event.seats_booked || 0)) : 0;

  return (
    <div className="bg-[#0A0504] text-[#F3EFE7] min-h-screen film-grain" data-testid="page-barsaat">
      <Navbar />

      {heroVisible && (
        <section className="relative pt-32 pb-16 sm:pt-44 sm:pb-24 overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
            <Link to="/" className="text-overline inline-flex items-center gap-2 mb-8 hover:text-[#D9772B] transition-colors" data-testid="back-to-home">
              <ArrowLeft size={14} /> back to home
            </Link>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-end">
              <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1 }} className="lg:col-span-7">
                <p className="text-overline">{read(content, "barsaat.hero.eyebrow", "Upcoming Supper")}</p>
                <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl mt-6 leading-[1.02] tracking-tight">
                  {read(content, "barsaat.hero.title", "Barsaat.")}
                  <br />
                  <span className="italic text-[#D9772B]">{read(content, "barsaat.hero.title_italic", "A supper with the rain.")}</span>
                </h1>
                <p className="mt-8 text-[#B5A79E] text-lg leading-relaxed max-w-xl">
                  {read(content, "barsaat.hero.body", "")}
                </p>
                {event && (
                  <div className="mt-8 inline-flex flex-wrap items-baseline gap-x-7 gap-y-3 border border-[#2D1D1A] px-6 py-4">
                    <div><p className="text-overline">When</p><p className="font-display text-2xl mt-1">{event.date}</p></div>
                    <div><p className="text-overline">Time</p><p className="font-display text-2xl mt-1">{event.time}</p></div>
                    <div><p className="text-overline">Seats</p><p className="font-display text-2xl mt-1">{seatsLeft} of {event.seats_total} left</p></div>
                  </div>
                )}
                <div className="mt-10 flex flex-wrap gap-4">
                  {event ? (
                    <button onClick={() => setOpen(true)} disabled={seatsLeft === 0}
                      data-testid="barsaat-reserve-cta"
                      className="inline-flex items-center justify-center px-8 py-4 bg-[#5A1A1F] text-[#F3EFE7] tracking-[0.18em] uppercase text-[11px] hover:bg-[#D9772B] hover:text-[#0A0504] transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed">
                      {seatsLeft === 0 ? "Sold out · join waitlist" : "Reserve a seat"}
                    </button>
                  ) : (
                    <Link to="/#contact"
                      className="inline-flex items-center justify-center px-8 py-4 bg-[#5A1A1F] text-[#F3EFE7] tracking-[0.18em] uppercase text-[11px] hover:bg-[#D9772B] hover:text-[#0A0504] transition-all duration-500">
                      Get notified
                    </Link>
                  )}
                  <Link to="/supper-club/naani-ghar"
                    className="inline-flex items-center justify-center px-8 py-4 border border-[#F3EFE7]/40 text-[#F3EFE7] tracking-[0.18em] uppercase text-[11px] hover:bg-[#F3EFE7] hover:text-[#0A0504] transition-all duration-500">
                    See past supper
                  </Link>
                </div>
              </motion.div>
              <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.2, delay: 0.2 }} className="lg:col-span-5">
                <div className="img-zoom relative aspect-[4/5] w-full overflow-hidden">
                  <img src={heroImg} alt="Barsaat preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0A0504]/55 to-transparent" />
                </div>
              </motion.div>
            </div>
          </div>
        </section>
      )}

      {reelVisible && reelUrl && (
        <section className="py-20 sm:py-28 border-t border-[#2D1D1A] bg-[#140A09]">
          <div className="max-w-5xl mx-auto px-6 sm:px-8 lg:px-12">
            <p className="text-overline">{read(content, "barsaat.reel.eyebrow", "A glimpse")}</p>
            <h2 className="font-display text-3xl sm:text-4xl mt-4 mb-10">
              {read(content, "barsaat.reel.title", "From the kitchen,")}{" "}
              <span className="italic text-[#D9772B]">{read(content, "barsaat.reel.title_italic", "last week.")}</span>
            </h2>
            <div className="aspect-video w-full overflow-hidden bg-[#0A0504] border border-[#2D1D1A]">
              <video src={reelUrl} className="w-full h-full object-cover" autoPlay muted loop playsInline data-testid="barsaat-reel" />
            </div>
          </div>
        </section>
      )}

      {notes && notes.length > 0 && (
        <section className="py-24 sm:py-32">
          <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 grid grid-cols-1 lg:grid-cols-3 gap-px bg-[#2D1D1A]">
            {notes.map((n, i) => (
              <motion.div
                key={`${n.head}-${i}`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: i * 0.08 }}
                className="bg-[#0A0504] p-9 sm:p-12"
              >
                <p className="text-overline">0{i + 1}</p>
                <h3 className="font-display text-2xl mt-4 leading-tight">{n.head}</h3>
                <p className="text-[#B5A79E] mt-4 leading-relaxed">{n.body}</p>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {closerVisible && (
        <section className="py-24 sm:py-32 border-t border-[#2D1D1A]">
          <div className="max-w-3xl mx-auto px-6 sm:px-8 lg:px-12 text-center">
            <p className="text-overline mb-6">{read(content, "barsaat.closer.eyebrow", "If the table is calling")}</p>
            <p className="font-display text-3xl sm:text-4xl leading-[1.15]">
              {read(content, "barsaat.closer.title", "Twelve seats. Once a month.")}{" "}
              <span className="italic text-[#D9772B]">{read(content, "barsaat.closer.title_italic", "First come, first served.")}</span>
            </p>
            {event && (
              <button onClick={() => setOpen(true)} disabled={seatsLeft === 0}
                data-testid="barsaat-reserve-cta-bottom"
                className="mt-10 inline-flex items-center justify-center px-8 py-4 bg-[#5A1A1F] text-[#F3EFE7] tracking-[0.18em] uppercase text-[11px] hover:bg-[#D9772B] hover:text-[#0A0504] transition-all duration-500 disabled:opacity-50">
                {seatsLeft === 0 ? "Sold out" : "Reserve a seat"}
              </button>
            )}
          </div>
        </section>
      )}

      <Footer />

      {open && event && (
        <EventRegistrationModal event={event} onClose={() => setOpen(false)} onSuccess={() => setOpen(false)} />
      )}
    </div>
  );
}
