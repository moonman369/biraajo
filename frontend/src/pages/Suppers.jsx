import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import EventRegistrationModal from "@/components/EventRegistrationModal";
import { api } from "@/lib/api";

export default function Suppers() {
  const [event, setEvent] = useState(null);
  const [registrationsOpen, setRegistrationsOpen] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    api.get("/events", { params: { upcoming: "true" } })
      .then((r) => {
        const list = r.data || [];
        const match = list.find((e) => /barsaat|monsoon/i.test(`${e.title} ${e.tag || ""}`));
        setEvent(match || null);
      }).catch(() => {});
    api.get("/settings")
      .then((r) => setRegistrationsOpen(r.data?.registrations_open !== false)).catch(() => {});
  }, []);

  const onReserve = () => {
    if (!registrationsOpen) {
      toast.info("Reservations are paused for now. Please reach out via WhatsApp.");
      return;
    }
    if (!event) {
      toast.info("No seats are open right now — check back soon.");
      return;
    }
    setOpen(true);
  };

  return (
    <div className="bg-[#0A0504] text-[#F3EFE7] min-h-screen film-grain" data-testid="page-suppers">
      <Navbar />

      <section className="pt-32 pb-12 sm:pt-44 sm:pb-20">
        <div className="max-w-5xl mx-auto px-6 sm:px-8 lg:px-12">
          <Link to="/" className="text-overline inline-flex items-center gap-2 mb-8 hover:text-[#D9772B] transition-colors" data-testid="suppers-back-home">
            <ArrowLeft size={14} /> back to home
          </Link>
          <p className="text-overline">Our suppers</p>
          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl mt-6 leading-[1.02] tracking-tight">
            Past tables,
            <br />
            <span className="italic text-[#D9772B]">next tables.</span>
          </h1>
          <p className="mt-6 text-[#B5A79E] max-w-2xl leading-relaxed">
            Each series at Biraajo is a chapter — a new menu, a new mood, a fresh room set. Below are our chapters so far. View past menus, or reserve a seat at what&apos;s next.
          </p>
        </div>
      </section>

      <section className="pb-32">
        <div className="max-w-5xl mx-auto px-6 sm:px-8 lg:px-12 space-y-10">
          {/* Naani Ghar — completed */}
          <motion.article
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}
            className="border border-[#2D1D1A] bg-[#140A09] grid grid-cols-1 md:grid-cols-12 overflow-hidden"
            data-testid="supper-card-naani-ghar"
          >
            <div className="md:col-span-5 relative aspect-[4/3] md:aspect-auto img-zoom">
              <img src="/api/media/biraajo/media/6a6d9d936ab71fa4.jpg" alt="Naani Ghar" className="w-full h-full object-cover" />
              <span className="absolute top-4 left-4 px-3 py-1 text-[10px] tracking-[0.22em] uppercase bg-[#0A0504]/80 text-[#9FD79F] border border-[#3A7D44]/60">Series concluded</span>
            </div>
            <div className="md:col-span-7 p-8 sm:p-12 flex flex-col justify-between gap-8">
              <div>
                <p className="text-overline">First series</p>
                <h2 className="font-display text-4xl mt-3 leading-tight">
                  Naani Ghar. <span className="italic text-[#D9772B]">Biraajo Suppers tasting.</span>
                </h2>
                <p className="mt-4 text-[#B5A79E] leading-relaxed">
                  Eight courses across summer 2026 — cucumber-ashgourd soda, dahi bhalla summer salad, koji-cured stews,
                  coconut-chickoo tres leches. The series has officially ended, but the menu lives on.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link to="/supper-club/naani-ghar" data-testid="supper-naani-view-menu"
                  className="inline-flex items-center justify-center px-6 py-3 bg-[#5A1A1F] text-[#F3EFE7] tracking-[0.18em] uppercase text-[11px] hover:bg-[#D9772B] hover:text-[#0A0504] transition-all duration-500">
                  View menu
                </Link>
              </div>
            </div>
          </motion.article>

          {/* Barsaat — WIP */}
          <motion.article
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.08 }}
            className="border border-[#2D1D1A] bg-[#140A09] grid grid-cols-1 md:grid-cols-12 overflow-hidden"
            data-testid="supper-card-barsaat"
          >
            <div className="md:col-span-5 relative aspect-[4/3] md:aspect-auto img-zoom">
              <img src="/api/media/biraajo/media/31cf3839eeb74061.jpg" alt="Barsaat" className="w-full h-full object-cover" />
              <span className="absolute top-4 left-4 px-3 py-1 text-[10px] tracking-[0.22em] uppercase bg-[#0A0504]/80 text-[#D9772B] border border-[#D9772B]/60">Reservations open</span>
            </div>
            <div className="md:col-span-7 p-8 sm:p-12 flex flex-col justify-between gap-8">
              <div>
                <p className="text-overline">Next series</p>
                <h2 className="font-display text-4xl mt-3 leading-tight">
                  Barsaat. <span className="italic text-[#D9772B]">A supper with the rain.</span>
                </h2>
                <p className="mt-4 text-[#B5A79E] leading-relaxed">
                  Our monsoon edition — ten courses written for the rain. Both vegetarian and non-vegetarian
                  variants are served. Eight seats only, first come, first served.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link to="/menus/barsaat" data-testid="supper-barsaat-learn-more"
                  className="inline-flex items-center justify-center px-6 py-3 border border-[#F3EFE7]/40 text-[#F3EFE7] tracking-[0.18em] uppercase text-[11px] hover:bg-[#F3EFE7] hover:text-[#0A0504] transition-all duration-500">
                  View menu
                </Link>
                <button onClick={onReserve} disabled={!registrationsOpen} data-testid="supper-barsaat-prebook"
                  className="inline-flex items-center justify-center px-6 py-3 bg-[#5A1A1F] text-[#F3EFE7] tracking-[0.18em] uppercase text-[11px] hover:bg-[#D9772B] hover:text-[#0A0504] transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed">
                  {registrationsOpen ? "Reserve a seat" : "Reservations paused"}
                </button>
              </div>
            </div>
          </motion.article>

          {/* When There Wasn't Enough — now booking */}
          <motion.article
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.16 }}
            className="border border-[#2D1D1A] bg-[#140A09] grid grid-cols-1 md:grid-cols-12 overflow-hidden"
            data-testid="supper-card-wtwe"
          >
            <div className="md:col-span-5 relative aspect-[4/3] md:aspect-auto img-zoom">
              <img src="https://images.unsplash.com/photo-1567934124115-2eca8953796b?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200" alt="When There Wasn't Enough" className="w-full h-full object-cover" />
              <span className="absolute top-4 left-4 px-3 py-1 text-[10px] tracking-[0.22em] uppercase bg-[#0A0504]/80 text-[#D9772B] border border-[#D9772B]/60">Now booking</span>
            </div>
            <div className="md:col-span-7 p-8 sm:p-12 flex flex-col justify-between gap-8">
              <div>
                <p className="text-overline">Next series</p>
                <h2 className="font-display text-4xl mt-3 leading-tight">
                  When There Wasn&apos;t Enough.
                </h2>
                <p className="mt-4 text-[#B5A79E] leading-relaxed">
                  Eight courses built from necessity — scarce seasons, upcycled leftovers, a traveller's rations.
                  Same price for veg and non-veg. Eight seats only, five dates.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link to="/menus/when-there-wasnt-enough" data-testid="supper-wtwe-view-menu"
                  className="inline-flex items-center justify-center px-6 py-3 border border-[#F3EFE7]/40 text-[#F3EFE7] tracking-[0.18em] uppercase text-[11px] hover:bg-[#F3EFE7] hover:text-[#0A0504] transition-all duration-500">
                  View menu
                </Link>
                <Link to="/supper-club/when-there-wasnt-enough" data-testid="supper-wtwe-join-table"
                  className="inline-flex items-center justify-center px-6 py-3 bg-[#5A1A1F] text-[#F3EFE7] tracking-[0.18em] uppercase text-[11px] hover:bg-[#D9772B] hover:text-[#0A0504] transition-all duration-500">
                  Join the table
                </Link>
              </div>
            </div>
          </motion.article>
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
