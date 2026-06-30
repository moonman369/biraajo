import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, CloudRain, Music2, Sparkles } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import EventRegistrationModal from "@/components/EventRegistrationModal";
import { api } from "@/lib/api";
import { useSiteContent, read } from "@/lib/siteContent";

const SENSES = [
  {
    icon: CloudRain,
    eyebrow: "Sight & space",
    title: "A room that sounds like rain",
    body:
      "The room is dressed so the monsoon feels like it is right outside the window. Light, shadow and a few quiet objects do the rest.",
  },
  {
    icon: Music2,
    eyebrow: "Sound",
    title: "A composed chronology",
    body:
      "A bespoke soundscape by sound designer Rajneesh — ambient cues open the evening, nostalgic instrumentals build with the courses, and the room comes to rest with dessert.",
  },
  {
    icon: Sparkles,
    eyebrow: "Smell",
    title: "Camphor and vetiver",
    body:
      "Two scents that hold monsoon memory in this part of the world. They lead you in before the first plate ever lands.",
  },
];

const RAJNEESH_NOTE =
  "The soundscape is a collaboration. I came in with a stack of tracks and ambient cues — rain on a tin roof, distant thunder, the chatter of an old radio. Rajneesh wove them into a single chronology that travels with the food: ambient at the start, nostalgic instrumentals through the middle, a peak that lifts with the main courses, then a gentle drop into dessert. What he composed is impossible without him.";

const SIGNATURE_QUOTE =
  "Barsaat, to me, is an irreplaceable feeling — a yearning that returns the moment the clouds turn. This menu is that feeling, plated. A room that is entirely my own making.";

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "long", year: "numeric" });
}

export default function Barsaat() {
  const { content } = useSiteContent();
  const [events, setEvents] = useState([]);
  const [settings, setSettings] = useState({ price_veg: 2200, price_nonveg: 2800, registrations_open: true });
  const [selectedId, setSelectedId] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    api.get("/events", { params: { upcoming: "true" } })
      .then((r) => {
        const list = (r.data || []).filter((e) => /barsaat|monsoon/i.test(`${e.title} ${e.tag || ""}`));
        list.sort((a, b) => (a.date < b.date ? -1 : 1));
        setEvents(list);
        const firstAvailable = list.find((e) => (e.seats_total - (e.seats_booked || 0)) > 0);
        setSelectedId((firstAvailable || list[0])?.id || "");
      }).catch(() => {});
    api.get("/settings")
      .then((r) => setSettings(r.data || {})).catch(() => {});
  }, []);

  const selectedEvent = useMemo(() => events.find((e) => e.id === selectedId) || null, [events, selectedId]);
  const heroImg = read(content, "barsaat.hero.image", "");
  const reelUrl = read(content, "barsaat.reel.video_url", "");
  const reelVisible = read(content, "barsaat.reel.visible", true);
  const reelsBlockVisible = read(content, "barsaat.reels.visible", true);
  const reelsItems = read(content, "barsaat.reels.items", []);
  const reelsEyebrow = read(content, "barsaat.reels.eyebrow", "Glimpses");
  const reelsTitle = read(content, "barsaat.reels.title", "From the kitchen,");
  const reelsTitleItalic = read(content, "barsaat.reels.title_italic", "two evenings ago.");
  const hasReels = reelsBlockVisible && Array.isArray(reelsItems) && reelsItems.filter((r) => r && r.url).length > 0;

  if (content?.barsaat?.visible === false) return null;

  const onReserve = () => {
    if (!settings.registrations_open) return;
    if (!selectedEvent) return;
    setOpen(true);
  };

  const priceVeg = Number(settings.price_veg || 2200);
  const priceNonVeg = Number(settings.price_nonveg || 2800);

  return (
    <div className="bg-[#0A0504] text-[#F3EFE7] min-h-screen film-grain" data-testid="page-barsaat">
      <Navbar />

      {/* ─────────────────────────────────────────── HERO */}
      <section className="relative pt-32 pb-16 sm:pt-44 sm:pb-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <Link to="/" className="text-overline inline-flex items-center gap-2 mb-8 hover:text-[#D9772B] transition-colors" data-testid="back-to-home">
            <ArrowLeft size={14} /> back to home
          </Link>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-end">
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1 }} className="lg:col-span-7">
              <p className="text-overline">An immersive supper</p>
              <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl mt-6 leading-[1.02] tracking-tight">
                Barsaat.
                <br />
                <span className="italic text-[#D9772B]">A supper with the rain.</span>
              </h1>
              <p className="mt-8 text-[#B5A79E] text-lg leading-relaxed max-w-xl">
                Ten courses written from monsoon memory — Gujarati at its core, modern and European at its edges.
                A composed soundscape, a perfumed room, a long table set for twelve.
              </p>

              <div className="mt-10 flex flex-wrap gap-4">
                <a href="#dates"
                  data-testid="barsaat-jump-dates"
                  className="inline-flex items-center justify-center px-8 py-4 bg-[#5A1A1F] text-[#F3EFE7] tracking-[0.18em] uppercase text-[11px] hover:bg-[#D9772B] hover:text-[#0A0504] transition-all duration-500">
                  Reserve a seat <ArrowRight size={14} className="ml-2" />
                </a>
                <Link to="/menus/barsaat"
                  data-testid="barsaat-view-menu"
                  className="inline-flex items-center justify-center px-8 py-4 border border-[#F3EFE7]/40 text-[#F3EFE7] tracking-[0.18em] uppercase text-[11px] hover:bg-[#F3EFE7] hover:text-[#0A0504] transition-all duration-500">
                  View the menu
                </Link>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.2, delay: 0.2 }} className="lg:col-span-5">
              <div className="img-zoom relative aspect-[4/5] w-full overflow-hidden">
                {heroImg && <img src={heroImg} alt="Barsaat" className="w-full h-full object-cover" />}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0504]/55 to-transparent" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────── CHEF'S NOTE / SIGNATURE */}
      <section className="py-20 sm:py-28 border-t border-[#2D1D1A] bg-[#140A09]" data-testid="barsaat-chef-note">
        <div className="max-w-3xl mx-auto px-6 sm:px-8 lg:px-12 text-center">
          <p className="text-overline">A note from the chef</p>
          <p className="font-display italic text-2xl sm:text-3xl mt-7 leading-[1.35] text-[#F3EFE7]">
            &ldquo;{SIGNATURE_QUOTE}&rdquo;
          </p>
          <p className="text-overline mt-7 text-[#D9772B]">— Vidip Shah</p>
        </div>
      </section>

      {/* ─────────────────────────────────────────── SENSORY JOURNEY */}
      <section className="py-24 sm:py-32 border-t border-[#2D1D1A]" data-testid="barsaat-sensory">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 mb-14">
            <div className="lg:col-span-5">
              <p className="text-overline">The experience</p>
              <h2 className="font-display text-4xl sm:text-5xl mt-6 leading-[1.05] tracking-tight">
                Not just dinner.
                <br />
                <span className="italic text-[#D9772B]">A monsoon, indoors.</span>
              </h2>
            </div>
            <div className="lg:col-span-7 lg:pt-3">
              <p className="text-[#B5A79E] text-lg leading-relaxed">
                Every element of Barsaat is composed to lift the food from the plate into the room. From the moment you step in,
                the senses are spoken to in sequence — sight, sound, smell — until the table feels less like a restaurant and more
                like a memory being shared.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[#2D1D1A] border border-[#2D1D1A]">
            {SENSES.map((s, i) => {
              const Icon = s.icon;
              return (
                <motion.div
                  key={s.title}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.7, delay: i * 0.08 }}
                  className="bg-[#0A0504] p-9 sm:p-12"
                  data-testid={`barsaat-sense-${i}`}
                >
                  <Icon className="text-[#D9772B]" size={22} strokeWidth={1.4} />
                  <p className="text-overline mt-6">{s.eyebrow}</p>
                  <h3 className="font-display text-2xl sm:text-[28px] mt-3 leading-tight">{s.title}</h3>
                  <p className="text-[#B5A79E] mt-4 leading-relaxed text-[15px]">{s.body}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────── RAJNEESH SOUNDSCAPE */}
      <section className="py-24 sm:py-32 border-t border-[#2D1D1A] bg-[#140A09]" data-testid="barsaat-rajneesh">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
            <div className="lg:col-span-5">
              <p className="text-overline">A collaboration</p>
              <h2 className="font-display text-4xl sm:text-5xl mt-6 leading-[1.05] tracking-tight">
                The soundscape, by
                <br />
                <span className="italic text-[#D9772B]">Rajneesh.</span>
              </h2>
              <div className="mt-8 inline-flex items-center gap-3 px-4 py-3 border border-[#2D1D1A]">
                <Music2 className="text-[#D9772B]" size={16} />
                <p className="text-[12px] tracking-[0.22em] uppercase text-[#B5A79E]">Sound designer · Rajneesh</p>
              </div>
            </div>
            <div className="lg:col-span-7 space-y-5 text-[#B5A79E] text-lg leading-relaxed">
              <p>{RAJNEESH_NOTE}</p>
              <ul className="space-y-2 text-[15px] pt-4 border-t border-[#2D1D1A]">
                <li><span className="text-[#D9772B] mr-3">·</span> Rain on a tin roof, distant thunder, the chatter of an old radio</li>
                <li><span className="text-[#D9772B] mr-3">·</span> Nostalgic music blended with live instrumentals</li>
                <li><span className="text-[#D9772B] mr-3">·</span> Intensity rises with the mains, then settles toward dessert</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────── REELS (multi) */}
      {hasReels && (
        <section className="py-20 sm:py-28 border-t border-[#2D1D1A]" data-testid="barsaat-reels-section">
          <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12">
            <p className="text-overline">{reelsEyebrow}</p>
            <h2 className="font-display text-3xl sm:text-4xl mt-4 mb-10">
              {reelsTitle} <span className="italic text-[#D9772B]">{reelsTitleItalic}</span>
            </h2>
            <div className={`grid gap-6 sm:gap-8 ${reelsItems.length > 1 ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"}`}>
              {reelsItems.filter((r) => r && r.url).map((r, i) => (
                <div key={`${r.url}-${i}`} className="relative aspect-[9/16] sm:aspect-video w-full overflow-hidden bg-[#0A0504] border border-[#2D1D1A]" data-testid={`barsaat-reel-${i}`}>
                  <video
                    src={r.url}
                    poster={r.poster || undefined}
                    className="w-full h-full object-cover"
                    autoPlay muted loop playsInline preload="metadata"
                  />
                  {r.label && (
                    <span className="absolute bottom-3 left-3 px-3 py-1 text-[10px] tracking-[0.22em] uppercase bg-[#0A0504]/85 text-[#F3EFE7] border border-[#2D1D1A]">
                      {r.label}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─────────────────────────────────────────── LEGACY single REEL fallback */}
      {!hasReels && reelVisible && reelUrl && (
        <section className="py-20 sm:py-28 border-t border-[#2D1D1A]" data-testid="barsaat-reel-section">
          <div className="max-w-5xl mx-auto px-6 sm:px-8 lg:px-12">
            <p className="text-overline">A glimpse</p>
            <h2 className="font-display text-3xl sm:text-4xl mt-4 mb-10">
              From the kitchen, <span className="italic text-[#D9772B]">last week.</span>
            </h2>
            <div className="aspect-video w-full overflow-hidden bg-[#0A0504] border border-[#2D1D1A]">
              <video src={reelUrl} className="w-full h-full object-cover" autoPlay muted loop playsInline data-testid="barsaat-reel" />
            </div>
          </div>
        </section>
      )}

      {/* ─────────────────────────────────────────── DATES + RESERVE */}
      <section id="dates" className="py-24 sm:py-32 border-t border-[#2D1D1A] bg-[#140A09]" data-testid="barsaat-dates-section">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-end mb-14">
            <div className="lg:col-span-7">
              <p className="text-overline">Reserve your seat</p>
              <h2 className="font-display text-4xl sm:text-5xl mt-6 leading-[1.05] tracking-tight">
                Three tables. <span className="italic text-[#D9772B]">Twelve seats each.</span>
              </h2>
              <p className="text-[#B5A79E] mt-5 max-w-xl leading-relaxed">
                Doors open at <span className="text-[#F3EFE7]">7:00 PM</span>. The first course lands at <span className="text-[#F3EFE7]">7:15 PM</span> sharp. The evening closes by <span className="text-[#F3EFE7]">10:00 PM</span>.
              </p>
            </div>
            <div className="lg:col-span-5 border border-[#2D1D1A] bg-[#0A0504] p-6" data-testid="barsaat-price-box">
              <p className="text-overline text-[#D9772B]">Early-bird · first 10 seats</p>
              <div className="mt-4 flex items-baseline gap-6 flex-wrap">
                <div>
                  <p className="text-[10px] tracking-[0.22em] uppercase text-[#B5A79E]">Vegetarian</p>
                  <p className="font-display text-3xl mt-1">₹{priceVeg.toLocaleString("en-IN")}</p>
                </div>
                <div>
                  <p className="text-[10px] tracking-[0.22em] uppercase text-[#B5A79E]">Non-vegetarian</p>
                  <p className="font-display text-3xl mt-1">₹{priceNonVeg.toLocaleString("en-IN")}</p>
                </div>
              </div>
              <p className="text-[12px] text-[#B5A79E] mt-4 leading-relaxed">
                Per seat, all-inclusive. Pricing revises after the first ten seats are confirmed across the three tables.
              </p>
            </div>
          </div>

          {events.length === 0 ? (
            <p className="text-[#B5A79E]">Dates will be published shortly.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[#2D1D1A] border border-[#2D1D1A]" data-testid="barsaat-date-grid">
              {events.map((e, i) => {
                const left = Math.max(0, e.seats_total - (e.seats_booked || 0));
                const soldOut = left === 0;
                const isSelected = e.id === selectedId;
                return (
                  <button
                    key={e.id}
                    onClick={() => !soldOut && setSelectedId(e.id)}
                    disabled={soldOut}
                    data-testid={`barsaat-date-${i}`}
                    className={`text-left bg-[#0A0504] p-8 sm:p-10 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed
                      ${isSelected ? "ring-2 ring-[#D9772B] -ring-offset-1" : "hover:bg-[#140A09]"}`}
                  >
                    <p className="text-overline">Table {String.fromCharCode(73 + i)}{/* I, J, K */}</p>
                    <p className="font-display text-3xl mt-4 leading-tight">{formatDate(e.date)}</p>
                    <p className="text-[#B5A79E] mt-3 text-sm">{e.time}</p>
                    <div className="mt-6 flex items-center justify-between pt-5 border-t border-[#2D1D1A]">
                      <p className="text-[11px] tracking-[0.18em] uppercase text-[#B5A79E]">
                        {soldOut ? "Sold out" : `${left} of ${e.seats_total} left`}
                      </p>
                      <span className={`text-[10px] tracking-[0.22em] uppercase px-2.5 py-1 border ${isSelected ? "border-[#D9772B] text-[#D9772B]" : "border-[#2D1D1A] text-[#B5A79E]"}`}>
                        {isSelected ? "Selected" : "Choose"}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          <div className="mt-12 flex flex-wrap items-center gap-4 justify-between">
            <p className="text-[#B5A79E] text-sm">
              {selectedEvent
                ? <>Selected: <span className="text-[#F3EFE7]">{formatDate(selectedEvent.date)}</span></>
                : "Select a date above to reserve."}
            </p>
            <button
              onClick={onReserve}
              disabled={!selectedEvent || !settings.registrations_open}
              data-testid="barsaat-reserve-main-cta"
              className="inline-flex items-center justify-center px-8 py-4 bg-[#5A1A1F] text-[#F3EFE7] tracking-[0.18em] uppercase text-[11px] hover:bg-[#D9772B] hover:text-[#0A0504] transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {settings.registrations_open ? "Reserve this date" : "Reservations paused"} <ArrowRight size={14} className="ml-2" />
            </button>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────── CLOSER */}
      <section className="py-24 sm:py-32 border-t border-[#2D1D1A]" data-testid="barsaat-closer">
        <div className="max-w-3xl mx-auto px-6 sm:px-8 lg:px-12 text-center">
          <p className="text-overline mb-6">If the table is calling</p>
          <p className="font-display text-3xl sm:text-4xl leading-[1.15]">
            Twelve seats. <span className="italic text-[#D9772B]">Three rainy evenings.</span>
          </p>
          <p className="mt-6 text-[#B5A79E] leading-relaxed">
            We hold a small house. We cook one menu. We light a single room. If any of that calls to you, the door is open.
          </p>
          <a href="#dates"
            data-testid="barsaat-closer-cta"
            className="mt-10 inline-flex items-center justify-center px-8 py-4 bg-[#5A1A1F] text-[#F3EFE7] tracking-[0.18em] uppercase text-[11px] hover:bg-[#D9772B] hover:text-[#0A0504] transition-all duration-500">
            Pick a date <ArrowRight size={14} className="ml-2" />
          </a>
        </div>
      </section>

      <Footer />

      {open && selectedEvent && (
        <EventRegistrationModal event={selectedEvent} onClose={() => setOpen(false)} onSuccess={() => setOpen(false)} />
      )}
    </div>
  );
}
