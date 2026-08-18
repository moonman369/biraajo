import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import EventRegistrationModal from "@/components/EventRegistrationModal";
import { api } from "@/lib/api";
import { useSiteContent, read } from "@/lib/siteContent";

export default function WhenThereWasntEnoughMenu() {
  const { content } = useSiteContent();
  const [events, setEvents] = useState([]);
  const [registrationsOpen, setRegistrationsOpen] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    api.get("/events", { params: { upcoming: "true" } })
      .then((r) => {
        const list = (r.data || []).filter((e) => e.id.startsWith("wtwe-"));
        list.sort((a, b) => (a.date > b.date ? 1 : -1));
        setEvents(list);
      }).catch(() => {});
    api.get("/settings")
      .then((r) => setRegistrationsOpen(r.data?.registrations_open !== false)).catch(() => {});
  }, []);

  const items = read(content, "wtwe.menu.items", []);
  const hasMenu = Array.isArray(items) && items.length > 0;
  const menuEyebrow = read(content, "wtwe.menu.eyebrow", "The Menu");
  const menuTitle = read(content, "wtwe.menu.title", "");
  const menuTitleItalic = read(content, "wtwe.menu.title_italic", "");
  const menuIntro = read(content, "wtwe.menu.intro", "");

  const onBook = () => {
    if (!registrationsOpen) {
      toast.info("Reservations are paused for now. Please reach out via WhatsApp.");
      return;
    }
    if (!events.length) {
      toast.info("No seats are open right now. Check back soon.");
      return;
    }
    setOpen(true);
  };

  return (
    <div className="bg-[#0A0504] text-[#F3EFE7] min-h-screen film-grain" data-testid="page-wtwe-menu">
      <Navbar />

      <section className="pt-32 pb-12 sm:pt-44 sm:pb-16">
        <div className="max-w-4xl mx-auto px-6 sm:px-8 lg:px-12">
          <Link to="/menus" className="text-overline inline-flex items-center gap-2 mb-8 hover:text-[#D9772B] transition-colors" data-testid="wtwe-menu-back">
            <ArrowLeft size={14} /> back to menus
          </Link>
          <p className="text-overline">{menuEyebrow}</p>
          <h1 className="font-display uppercase text-5xl sm:text-6xl mt-6 leading-[1.05] tracking-wide">
            {hasMenu && menuTitle ? menuTitle : "Abhāv Ke Bhāv"}
          </h1>
          <p className="text-sm sm:text-base tracking-[0.35em] uppercase text-[#D9772B] font-body mt-4">
            {hasMenu && menuTitleItalic ? menuTitleItalic : "When there wasn't enough"}
          </p>
          <p className="mt-4 text-[#B5A79E] text-sm tracking-[0.16em] uppercase">Now booking · Five dates</p>
          {hasMenu && menuIntro && (
            <p className="mt-6 text-[#B5A79E] leading-relaxed max-w-2xl" data-testid="wtwe-menu-intro">{menuIntro}</p>
          )}
        </div>
      </section>

      <section className="pb-24">
        <div className="max-w-3xl mx-auto px-6 sm:px-8 lg:px-12">
          {hasMenu ? (
            <>
              <div className="divide-y divide-[#2D1D1A] border-y border-[#2D1D1A]">
                {items.map((m, i) => (
                  <motion.div
                    key={`${m.dish}-${i}`}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ duration: 0.6, delay: i * 0.04 }}
                    className="grid grid-cols-12 gap-4 py-8 sm:py-10"
                    data-testid={`wtwe-menu-item-${i}`}
                  >
                    <p className="col-span-12 sm:col-span-3 text-overline pt-1">{m.course}</p>
                    <div className="col-span-12 sm:col-span-9 space-y-5">
                      <div>
                        <p className="font-display text-2xl sm:text-3xl text-[#F3EFE7] tracking-tight">{m.dish}</p>
                        {m.note && (
                          <p className="text-sm sm:text-base text-[#B5A79E] mt-2 leading-relaxed max-w-2xl">{m.note}</p>
                        )}
                      </div>
                      {(m.alt_dish || m.alt_note) && (
                        <div className="pt-4 border-t border-dashed border-[#2D1D1A]" data-testid={`wtwe-menu-veg-${i}`}>
                          <p className="text-[10px] tracking-[0.28em] uppercase text-[#D9772B] mb-1.5">Vegetarian</p>
                          {m.alt_dish && (
                            <p className="font-display italic text-lg sm:text-xl text-[#F3EFE7]/90">{m.alt_dish}</p>
                          )}
                          {m.alt_note && (
                            <p className="text-sm text-[#B5A79E] mt-1.5 leading-relaxed max-w-2xl">{m.alt_note}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
              <div className="mt-14 flex flex-wrap justify-center gap-4">
                <button
                  onClick={onBook}
                  disabled={!registrationsOpen}
                  data-testid="wtwe-menu-book-btn"
                  className="inline-flex items-center justify-center px-8 py-4 bg-[#5A1A1F] text-[#F3EFE7] tracking-[0.18em] uppercase text-[11px] hover:bg-[#D9772B] hover:text-[#0A0504] transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {registrationsOpen ? "Book a seat" : "Reservations paused"}
                </button>
                <Link
                  to="/supper-club/when-there-wasnt-enough"
                  className="inline-flex items-center justify-center px-8 py-4 border border-[#F3EFE7]/40 text-[#F3EFE7] tracking-[0.18em] uppercase text-[11px] hover:bg-[#F3EFE7] hover:text-[#0A0504] transition-all duration-500"
                  data-testid="wtwe-menu-read-more"
                >
                  Read about the series
                </Link>
              </div>
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="border border-[#2D1D1A] bg-[#140A09] p-10 sm:p-16 text-center"
              data-testid="wtwe-menu-wip"
            >
              <Loader2 className="mx-auto text-[#D9772B] animate-spin" size={28} />
              <p className="mt-6 text-overline">Still being written</p>
              <h2 className="font-display text-3xl sm:text-4xl mt-4 leading-[1.15]">
                Work in <span className="italic text-[#D9772B]">progress.</span>
              </h2>
              <div className="mt-10 flex flex-wrap gap-4 justify-center">
                <button
                  onClick={onBook}
                  disabled={!registrationsOpen}
                  data-testid="wtwe-menu-book-btn"
                  className="inline-flex items-center justify-center px-8 py-4 bg-[#5A1A1F] text-[#F3EFE7] tracking-[0.18em] uppercase text-[11px] hover:bg-[#D9772B] hover:text-[#0A0504] transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {registrationsOpen ? "Book a seat" : "Reservations paused"}
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </section>

      <Footer />

      {open && events.length > 0 && (
        <EventRegistrationModal
          events={events}
          onClose={() => setOpen(false)}
          onSuccess={() => setOpen(false)}
        />
      )}
    </div>
  );
}
