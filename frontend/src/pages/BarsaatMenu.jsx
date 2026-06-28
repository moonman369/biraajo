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

const PREBOOK_DISCLAIMER =
  "Barsaat is still being finalised — the menu, the exact date and a few logistical details are not set in stone. By pre-booking now, you're letting us know you want a seat. We will write to you personally with the final details, and you will be among the first invited when the date is confirmed.";

export default function BarsaatMenu() {
  const { content } = useSiteContent();
  const [event, setEvent] = useState(null);
  const [registrationsOpen, setRegistrationsOpen] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    api.get("/events", { params: { upcoming: "true" } })
      .then((r) => {
        const list = r.data || [];
        const match = list.find((e) => /barsaat|monsoon/i.test(`${e.title} ${e.tag || ""}`));
        setEvent(match || list[0] || null);
      }).catch(() => {});
    api.get("/settings")
      .then((r) => setRegistrationsOpen(r.data?.registrations_open !== false)).catch(() => {});
  }, []);

  const items = read(content, "barsaat.menu.items", []);
  const hasMenu = Array.isArray(items) && items.length > 0;

  const onBook = () => {
    if (!registrationsOpen) {
      toast.info("Pre-bookings are paused for now. Please reach out via WhatsApp.");
      return;
    }
    if (!event) {
      toast.info("Barsaat isn't accepting pre-bookings yet — check back soon.");
      return;
    }
    setOpen(true);
  };

  return (
    <div className="bg-[#0A0504] text-[#F3EFE7] min-h-screen film-grain" data-testid="page-barsaat-menu">
      <Navbar />

      <section className="pt-32 pb-12 sm:pt-44 sm:pb-16">
        <div className="max-w-4xl mx-auto px-6 sm:px-8 lg:px-12">
          <Link to="/menus" className="text-overline inline-flex items-center gap-2 mb-8 hover:text-[#D9772B] transition-colors" data-testid="barsaat-menu-back">
            <ArrowLeft size={14} /> back to menus
          </Link>
          <p className="text-overline">The Menu</p>
          <h1 className="font-display text-5xl sm:text-6xl mt-6 leading-[1.02] tracking-tight">
            Barsaat. <span className="italic text-[#D9772B]">The menu.</span>
          </h1>
          <p className="mt-4 text-[#B5A79E] text-sm tracking-[0.16em] uppercase">Next series · Monsoon edition</p>
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
                    className="grid grid-cols-12 gap-4 py-7"
                    data-testid={`barsaat-menu-item-${i}`}
                  >
                    <p className="col-span-12 sm:col-span-3 text-overline">{m.course}</p>
                    <div className="col-span-12 sm:col-span-9">
                      <p className="font-display text-2xl text-[#F3EFE7]">{m.dish}</p>
                      {m.note && (
                        <p className="text-sm text-[#B5A79E] mt-1 leading-relaxed">{m.note}</p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
              <div className="mt-14 flex flex-wrap justify-center gap-4">
                <button
                  onClick={onBook}
                  disabled={!registrationsOpen}
                  data-testid="barsaat-menu-book-btn"
                  className="inline-flex items-center justify-center px-8 py-4 bg-[#5A1A1F] text-[#F3EFE7] tracking-[0.18em] uppercase text-[11px] hover:bg-[#D9772B] hover:text-[#0A0504] transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {registrationsOpen ? "Book now" : "Pre-bookings paused"}
                </button>
              </div>
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="border border-[#2D1D1A] bg-[#140A09] p-10 sm:p-16 text-center"
              data-testid="barsaat-menu-wip"
            >
              <Loader2 className="mx-auto text-[#D9772B] animate-spin" size={28} />
              <p className="mt-6 text-overline">Still being written</p>
              <h2 className="font-display text-3xl sm:text-4xl mt-4 leading-[1.15]">
                Work in <span className="italic text-[#D9772B]">progress.</span>
              </h2>
              <p className="mt-5 text-[#B5A79E] leading-relaxed max-w-md mx-auto">
                The monsoon courses are taking shape in the kitchen. We&apos;ll publish the final menu here closer to the date.
                In the meantime, seats are open for those who&apos;d like to be at the first table.
              </p>

              <div className="mt-10 flex flex-wrap gap-4 justify-center">
                <button
                  onClick={onBook}
                  disabled={!registrationsOpen}
                  data-testid="barsaat-menu-book-btn"
                  className="inline-flex items-center justify-center px-8 py-4 bg-[#5A1A1F] text-[#F3EFE7] tracking-[0.18em] uppercase text-[11px] hover:bg-[#D9772B] hover:text-[#0A0504] transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {registrationsOpen ? "Book now" : "Pre-bookings paused"}
                </button>
                <Link
                  to="/supper-club/barsaat"
                  className="inline-flex items-center justify-center px-8 py-4 border border-[#F3EFE7]/40 text-[#F3EFE7] tracking-[0.18em] uppercase text-[11px] hover:bg-[#F3EFE7] hover:text-[#0A0504] transition-all duration-500"
                  data-testid="barsaat-menu-read-more"
                >
                  Read about Barsaat
                </Link>
              </div>
            </motion.div>
          )}
        </div>
      </section>

      <Footer />

      {open && event && (
        <EventRegistrationModal
          event={event}
          disclaimer={PREBOOK_DISCLAIMER}
          onClose={() => setOpen(false)}
          onSuccess={() => setOpen(false)}
        />
      )}
    </div>
  );
}
