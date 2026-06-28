import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import EventRegistrationModal from "@/components/EventRegistrationModal";
import { api } from "@/lib/api";

const HERO = "https://customer-assets.emergentagent.com/job_feast-studio-1/artifacts/kpwk8ol3__DSC4913-2%20%281%29.jpg";
const REEL = "https://customer-assets.emergentagent.com/job_feast-studio-1/artifacts/l41d744x_biraajo%206th%20june%2000097020_prob4.mp4";

const NOTES = [
  {
    head: "The weather, on a plate",
    body: "Barsaat is built around the monsoon — its slow afternoons, its sudden squalls. Rain-soaked greens, river fish, jaggery, smoke. The menu drinks the season in.",
  },
  {
    head: "Inside the restored apartment",
    body: "Twelve seats, one long table. Lit candles. The windows stay open if the rain permits. The chef cooks where you sit.",
  },
  {
    head: "What has been confirmed so far",
    body: "Hilsa, two ways. A monsoon dal that uses something foraged. A burnt-sugar pudding with kalo jam. The rest is decided week by week.",
  },
];

export default function Barsaat() {
  const [event, setEvent] = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    api.get("/events", { params: { upcoming: "true" } }).then((r) => {
      const list = r.data || [];
      // Prefer one tagged "Barsaat" or "Monsoon", else most-imminent upcoming
      const match = list.find((e) => /barsaat|monsoon/i.test(`${e.title} ${e.tag || ""}`));
      setEvent(match || list[0] || null);
    }).catch(() => {});
  }, []);

  const seatsLeft = event ? Math.max(0, event.seats_total - (event.seats_booked || 0)) : 0;

  return (
    <div className="bg-[#0A0504] text-[#F3EFE7] min-h-screen film-grain" data-testid="page-barsaat">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-32 pb-16 sm:pt-44 sm:pb-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <Link to="/" className="text-overline inline-flex items-center gap-2 mb-8 hover:text-[#D9772B] transition-colors" data-testid="back-to-home">
            <ArrowLeft size={14} /> back to home
          </Link>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-end">
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1 }} className="lg:col-span-7">
              <p className="text-overline">Upcoming Supper</p>
              <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl mt-6 leading-[1.02] tracking-tight">
                Barsaat.
                <br />
                <span className="italic text-[#D9772B]">A supper with the rain.</span>
              </h1>
              <p className="mt-8 text-[#B5A79E] text-lg leading-relaxed max-w-xl">
                Biraajo&apos;s monsoon edition. A long, slow evening for twelve, plated entirely from what the season gives —
                hilsa, jaggery, smoke, foraged green. The kind of meal that asks you to slow down.
              </p>
              {event && (
                <div className="mt-8 inline-flex flex-wrap items-baseline gap-x-7 gap-y-3 border border-[#2D1D1A] px-6 py-4">
                  <div>
                    <p className="text-overline">When</p>
                    <p className="font-display text-2xl mt-1">{event.date}</p>
                  </div>
                  <div>
                    <p className="text-overline">Time</p>
                    <p className="font-display text-2xl mt-1">{event.time}</p>
                  </div>
                  <div>
                    <p className="text-overline">Seats</p>
                    <p className="font-display text-2xl mt-1">{seatsLeft} of {event.seats_total} left</p>
                  </div>
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
                <img src={HERO} alt="Barsaat preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0504]/55 to-transparent" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* The reel */}
      <section className="py-20 sm:py-28 border-t border-[#2D1D1A] bg-[#140A09]">
        <div className="max-w-5xl mx-auto px-6 sm:px-8 lg:px-12">
          <p className="text-overline">A glimpse</p>
          <h2 className="font-display text-3xl sm:text-4xl mt-4 mb-10">
            From the kitchen, <span className="italic text-[#D9772B]">last week.</span>
          </h2>
          <div className="aspect-video w-full overflow-hidden bg-[#0A0504] border border-[#2D1D1A]">
            <video src={REEL} className="w-full h-full object-cover" autoPlay muted loop playsInline data-testid="barsaat-reel" />
          </div>
        </div>
      </section>

      {/* Three notes */}
      <section className="py-24 sm:py-32">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 grid grid-cols-1 lg:grid-cols-3 gap-px bg-[#2D1D1A]">
          {NOTES.map((n, i) => (
            <motion.div
              key={n.head}
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

      {/* Final CTA */}
      <section className="py-24 sm:py-32 border-t border-[#2D1D1A]">
        <div className="max-w-3xl mx-auto px-6 sm:px-8 lg:px-12 text-center">
          <p className="text-overline mb-6">If the table is calling</p>
          <p className="font-display text-3xl sm:text-4xl leading-[1.15]">
            Twelve seats. Once a month. <span className="italic text-[#D9772B]">First come, first served.</span>
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

      <Footer />

      {open && event && (
        <EventRegistrationModal
          event={event}
          onClose={() => setOpen(false)}
          onSuccess={() => setOpen(false)}
        />
      )}
    </div>
  );
}
