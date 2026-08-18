import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, History, Recycle, MessageCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import EventRegistrationModal from "@/components/EventRegistrationModal";
import { api } from "@/lib/api";
import { useSiteContent, read } from "@/lib/siteContent";

const IDEA_ICONS = { history: History, recycle: Recycle, message: MessageCircle };

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "long", year: "numeric" });
}

function sessionLabel(title) {
  if (/lunch/i.test(title)) return "Lunch";
  if (/dinner/i.test(title)) return "Dinner";
  return "";
}

export default function WhenThereWasntEnough() {
  const { content } = useSiteContent();
  const [events, setEvents] = useState([]);
  const [settings, setSettings] = useState({ price_veg: 2500, price_nonveg: 2800, registrations_open: true });
  const [selectedId, setSelectedId] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    api.get("/events", { params: { upcoming: "true" } })
      .then((r) => {
        const list = (r.data || []).filter((e) => e.id.startsWith("wtwe-"));
        list.sort((a, b) => (a.date > b.date ? 1 : -1));
        setEvents(list);
        const firstAvailable = list.find((e) => (e.seats_total - (e.seats_booked || 0)) > 0);
        setSelectedId((firstAvailable || list[0])?.id || "");
      }).catch(() => {});
    api.get("/settings")
      .then((r) => setSettings(r.data || {})).catch(() => {});
  }, []);

  const selectedEvent = useMemo(() => events.find((e) => e.id === selectedId) || null, [events, selectedId]);
  if (content?.wtwe?.visible === false) return null;

  const onReserve = () => {
    if (!settings.registrations_open) return;
    if (!selectedEvent) return;
    setOpen(true);
  };

  const priceVeg = Number(selectedEvent?.price_veg ?? settings.price_veg ?? 2500);
  const priceNonVeg = Number(selectedEvent?.price_nonveg ?? settings.price_nonveg ?? 2800);
  const samePricing = priceVeg === priceNonVeg;

  const heroImg = read(content, "wtwe.hero.image", "");
  const heroEyebrow = read(content, "wtwe.hero.eyebrow", "An immersive supper");
  const heroTitle = read(content, "wtwe.hero.title", "Abhav Ke Bhav");
  const heroTitleIt = read(content, "wtwe.hero.title_italic", "When there wasn't enough");
  const heroConcept = read(content, "wtwe.hero.concept",
    "A supper built from scarcity — and the ingenuity it demanded.");
  const heroBody = read(content, "wtwe.hero.body",
    "Eight courses that each grew out of a moment of scarcity. Not just a meal, but a conversation about how — and why — we eat what we eat.");

  const datesEyebrow = read(content, "wtwe.dates_block.eyebrow", "Reserve your seat");
  const datesTitle = read(content, "wtwe.dates_block.title", "Five tables.");
  const datesTitleIt = read(content, "wtwe.dates_block.title_italic", "Eight seats each.");
  const scheduleNote = read(content, "wtwe.dates_block.schedule_note",
    "Lunches run 1:00 PM – 3:30 PM. Dinners run 7:00 PM – 10:00 PM.");
  const priceFootnote = read(content, "wtwe.dates_block.price_footnote",
    "Same price for vegetarian and non-vegetarian. All-inclusive.");

  const q = read(content, "wtwe.chef_note.quote",
    "Every dish here started as an answer to a problem — not enough of something, too much of something else, a memory that refused to be wasted.");
  const qEyebrow = read(content, "wtwe.chef_note.eyebrow", "A note from the chef");
  const qSig = read(content, "wtwe.chef_note.signature", "Vidip Shah");

  const ideaEyebrow = read(content, "wtwe.idea.eyebrow", "The idea");
  const ideaTitle = read(content, "wtwe.idea.title", "Not just dinner.");
  const ideaTitleIt = read(content, "wtwe.idea.title_italic", "A history, plated.");
  const ideaIntro = read(content, "wtwe.idea.intro",
    "Each course carries its own story of necessity — scarcity, improvisation, memory.");
  const ideaItems = (() => {
    const items = read(content, "wtwe.idea.items", []);
    return Array.isArray(items) && items.length ? items : [];
  })();

  const closerEyebrow = read(content, "wtwe.closer.eyebrow", "If the table is calling");
  const closerTitle = read(content, "wtwe.closer.title", "Eight seats.");
  const closerTitleIt = read(content, "wtwe.closer.title_italic", "Five evenings this season.");
  const closerBody = read(content, "wtwe.closer.body",
    "We hold a small house. We cook one menu, built from necessity. If that calls to you, the door is open.");
  const closerCta = read(content, "wtwe.closer.cta_label", "Reserve now");

  const csEyebrow = read(content, "wtwe.concept_statement.eyebrow", "The concept");
  const csQuote = read(content, "wtwe.concept_statement.quote",
    "Scarcity has often been one of the greatest catalysts for culinary intelligence.");
  const csBody = read(content, "wtwe.concept_statement.body", "");

  const storyEyebrow = read(content, "wtwe.story.eyebrow", "Story & inspiration");
  const storyTitle = read(content, "wtwe.story.title", "Not a lost recipe.");
  const storyTitleIt = read(content, "wtwe.story.title_italic", "A living question.");
  const storyParagraphs = (() => {
    const p = read(content, "wtwe.story.paragraphs", []);
    return Array.isArray(p) ? p : [];
  })();

  const qsEyebrow = read(content, "wtwe.questions.eyebrow", "What we're asking");
  const qsTitle = read(content, "wtwe.questions.title", "Four questions,");
  const qsTitleIt = read(content, "wtwe.questions.title_italic", "at every course.");
  const qsIntro = read(content, "wtwe.questions.intro", "");
  const qsItems = (() => {
    const it = read(content, "wtwe.questions.items", []);
    return Array.isArray(it) ? it : [];
  })();

  return (
    <div className="bg-[#0A0504] text-[#F3EFE7] min-h-screen film-grain" data-testid="page-wtwe">
      <Navbar />

      {/* HERO — recreates the original poster composition, uncropped */}
      <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-28 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <Link to="/" className="text-overline inline-flex items-center gap-2 mb-10 hover:text-[#D9772B] transition-colors" data-testid="wtwe-back-home">
            <ArrowLeft size={14} /> back to home
          </Link>
        </div>

        <div className="max-w-xl mx-auto px-6 text-center">
          <p className="text-overline">{heroEyebrow}</p>
          {heroConcept && (
            <p className="font-display italic text-2xl sm:text-3xl mt-6 leading-[1.3] text-[#F3EFE7]" data-testid="wtwe-hero-concept">
              {heroConcept}
            </p>
          )}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 28, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1.1, ease: "easeOut" }}
          className="relative mx-auto mt-8 w-full max-w-[420px] sm:max-w-[480px] lg:max-w-[540px] px-6"
        >
          <div className="relative" style={{ boxShadow: "0 50px 120px -30px rgba(0,0,0,0.7)" }}>
            {heroImg && (
              <img
                src={heroImg}
                alt={`${heroTitle} — ${heroTitleIt}`}
                className="w-full h-auto"
                data-testid="wtwe-poster-image"
              />
            )}
          </div>
        </motion.div>

        <div className="max-w-xl mx-auto px-6 mt-12 text-center">
          <p className="text-[#B5A79E] text-lg leading-relaxed">{heroBody}</p>

          <div className="mt-9 flex flex-wrap gap-4 justify-center">
            <a href="#dates" data-testid="wtwe-jump-dates"
              className="inline-flex items-center justify-center px-8 py-4 bg-[#5A1A1F] text-[#F3EFE7] tracking-[0.18em] uppercase text-[11px] hover:bg-[#D9772B] hover:text-[#0A0504] transition-all duration-500">
              Join the table <ArrowRight size={14} className="ml-2" />
            </a>
            <Link to="/menus/when-there-wasnt-enough" data-testid="wtwe-view-menu"
              className="inline-flex items-center justify-center px-8 py-4 border border-[#F3EFE7]/40 text-[#F3EFE7] tracking-[0.18em] uppercase text-[11px] hover:bg-[#F3EFE7] hover:text-[#0A0504] transition-all duration-500">
              View the menu
            </Link>
          </div>
        </div>
      </section>

      {/* CONCEPT STATEMENT */}
      {csQuote && (
        <section className="py-20 sm:py-28 border-t border-[#2D1D1A]" data-testid="wtwe-concept-statement">
          <div className="max-w-3xl mx-auto px-6 sm:px-8 lg:px-12 text-center">
            <p className="text-overline">{csEyebrow}</p>
            <p className="font-display text-3xl sm:text-4xl mt-7 leading-[1.25] tracking-tight">
              &ldquo;<span className="italic text-[#D9772B]">{csQuote}</span>&rdquo;
            </p>
            {csBody && <p className="mt-7 text-[#B5A79E] leading-relaxed max-w-2xl mx-auto">{csBody}</p>}
          </div>
        </section>
      )}

      {/* DATES + RESERVE */}
      <section id="dates" className="py-20 sm:py-28 border-t border-[#2D1D1A] bg-[#140A09]" data-testid="wtwe-dates-section">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-end mb-14">
            <div className="lg:col-span-7">
              <p className="text-overline">{datesEyebrow}</p>
              <h2 className="font-display text-4xl sm:text-5xl mt-6 leading-[1.05] tracking-tight">
                {datesTitle} <span className="italic text-[#D9772B]">{datesTitleIt}</span>
              </h2>
              <p className="text-[#B5A79E] mt-5 max-w-xl leading-relaxed">{scheduleNote}</p>
            </div>
            <div className="lg:col-span-5 border border-[#2D1D1A] bg-[#0A0504] p-6" data-testid="wtwe-price-box">
              {samePricing ? (
                <div>
                  <p className="text-[10px] tracking-[0.22em] uppercase text-[#B5A79E]">Per seat · veg & non-veg</p>
                  <p className="font-display text-3xl mt-1">₹{priceVeg.toLocaleString("en-IN")}</p>
                </div>
              ) : (
                <div className="flex items-baseline gap-6 flex-wrap">
                  <div>
                    <p className="text-[10px] tracking-[0.22em] uppercase text-[#B5A79E]">Vegetarian</p>
                    <p className="font-display text-3xl mt-1">₹{priceVeg.toLocaleString("en-IN")}</p>
                  </div>
                  <div>
                    <p className="text-[10px] tracking-[0.22em] uppercase text-[#B5A79E]">Non-vegetarian</p>
                    <p className="font-display text-3xl mt-1">₹{priceNonVeg.toLocaleString("en-IN")}</p>
                  </div>
                </div>
              )}
              <p className="text-[12px] text-[#B5A79E] mt-4 leading-relaxed">{priceFootnote}</p>
            </div>
          </div>

          {events.length === 0 ? (
            <p className="text-[#B5A79E]">Dates will be published shortly.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[#2D1D1A] border border-[#2D1D1A]" data-testid="wtwe-dates-grid">
              {events.map((e, i) => {
                const left = Math.max(0, e.seats_total - (e.seats_booked || 0));
                const soldOut = left === 0;
                const isSelected = e.id === selectedId;
                return (
                  <button
                    key={e.id}
                    onClick={() => !soldOut && setSelectedId(e.id)}
                    disabled={soldOut}
                    data-testid={`wtwe-date-${i}`}
                    className={`text-left bg-[#0A0504] p-8 sm:p-10 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed
                      ${isSelected ? "ring-2 ring-[#D9772B] -ring-offset-1" : "hover:bg-[#140A09]"}`}
                  >
                    <p className="text-overline">{sessionLabel(e.title) || "Table"}</p>
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
              data-testid="wtwe-reserve-main-cta"
              className="inline-flex items-center justify-center px-8 py-4 bg-[#5A1A1F] text-[#F3EFE7] tracking-[0.18em] uppercase text-[11px] hover:bg-[#D9772B] hover:text-[#0A0504] transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {settings.registrations_open ? "Reserve now" : "Reservations paused"} <ArrowRight size={14} className="ml-2" />
            </button>
          </div>
        </div>
      </section>

      {/* STORY & INSPIRATION */}
      {storyParagraphs.length > 0 && (
        <section className="py-24 sm:py-32 border-t border-[#2D1D1A]" data-testid="wtwe-story">
          <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
              <div className="lg:col-span-5">
                <p className="text-overline">{storyEyebrow}</p>
                <h2 className="font-display text-4xl sm:text-5xl mt-6 leading-[1.05] tracking-tight">
                  {storyTitle}
                  <br />
                  <span className="italic text-[#D9772B]">{storyTitleIt}</span>
                </h2>
              </div>
              <div className="lg:col-span-7 lg:pt-3 space-y-6">
                {storyParagraphs.map((p, i) => (
                  <p key={i} className="text-[#B5A79E] text-lg leading-relaxed" data-testid={`wtwe-story-p-${i}`}>{p}</p>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* THE QUESTIONS */}
      {qsItems.length > 0 && (
        <section className="py-24 sm:py-32 border-t border-[#2D1D1A] bg-[#140A09]" data-testid="wtwe-questions">
          <div className="max-w-4xl mx-auto px-6 sm:px-8 lg:px-12">
            <div className="text-center mb-14">
              <p className="text-overline">{qsEyebrow}</p>
              <h2 className="font-display text-4xl sm:text-5xl mt-6 leading-[1.05] tracking-tight">
                {qsTitle} <span className="italic text-[#D9772B]">{qsTitleIt}</span>
              </h2>
              {qsIntro && <p className="mt-6 text-[#B5A79E] leading-relaxed max-w-xl mx-auto">{qsIntro}</p>}
            </div>
            <div className="divide-y divide-[#2D1D1A] border-y border-[#2D1D1A]">
              {qsItems.map((q, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: i * 0.08 }}
                  className="flex items-baseline gap-6 py-7"
                  data-testid={`wtwe-question-${i}`}
                >
                  <span className="text-overline text-[#D9772B] shrink-0">{String(i + 1).padStart(2, "0")}</span>
                  <p className="font-display italic text-xl sm:text-2xl leading-snug">{q}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CHEF'S NOTE */}
      <section className="py-20 sm:py-28 border-t border-[#2D1D1A] bg-[#140A09]" data-testid="wtwe-chef-note">
        <div className="max-w-3xl mx-auto px-6 sm:px-8 lg:px-12 text-center">
          <p className="text-overline">{qEyebrow}</p>
          <p className="font-display italic text-2xl sm:text-3xl mt-7 leading-[1.35] text-[#F3EFE7]">&ldquo;{q}&rdquo;</p>
          <p className="text-overline mt-7 text-[#D9772B]">— {qSig}</p>
        </div>
      </section>

      {/* THE IDEA */}
      {ideaItems.length > 0 && (
        <section className="py-24 sm:py-32 border-t border-[#2D1D1A]" data-testid="wtwe-idea">
          <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 mb-14">
              <div className="lg:col-span-5">
                <p className="text-overline">{ideaEyebrow}</p>
                <h2 className="font-display text-4xl sm:text-5xl mt-6 leading-[1.05] tracking-tight">
                  {ideaTitle}
                  <br />
                  <span className="italic text-[#D9772B]">{ideaTitleIt}</span>
                </h2>
              </div>
              <div className="lg:col-span-7 lg:pt-3">
                <p className="text-[#B5A79E] text-lg leading-relaxed">{ideaIntro}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[#2D1D1A] border border-[#2D1D1A]">
              {ideaItems.map((s, i) => {
                const Icon = IDEA_ICONS[s.icon] || History;
                return (
                  <motion.div
                    key={s.title || i}
                    initial={{ opacity: 0, y: 18 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7, delay: i * 0.08 }}
                    className="bg-[#0A0504] p-9 sm:p-12"
                    data-testid={`wtwe-idea-${i}`}
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
      )}

      {/* CLOSER */}
      <section className="py-24 sm:py-32 border-t border-[#2D1D1A]" data-testid="wtwe-closer">
        <div className="max-w-3xl mx-auto px-6 sm:px-8 lg:px-12 text-center">
          <p className="text-overline mb-6">{closerEyebrow}</p>
          <p className="font-display text-3xl sm:text-4xl leading-[1.15]">
            {closerTitle} <span className="italic text-[#D9772B]">{closerTitleIt}</span>
          </p>
          <p className="mt-6 text-[#B5A79E] leading-relaxed">{closerBody}</p>
          <a href="#dates" data-testid="wtwe-closer-cta"
            className="mt-10 inline-flex items-center justify-center px-8 py-4 bg-[#5A1A1F] text-[#F3EFE7] tracking-[0.18em] uppercase text-[11px] hover:bg-[#D9772B] hover:text-[#0A0504] transition-all duration-500">
            {closerCta} <ArrowRight size={14} className="ml-2" />
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
