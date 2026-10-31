import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { WTWE_COVER } from "@/lib/chapters";

export default function Menus() {
  return (
    <div className="bg-[#0A0504] text-[#F3EFE7] min-h-screen film-grain" data-testid="page-menus">
      <Navbar />

      <section className="pt-32 pb-12 sm:pt-44 sm:pb-20">
        <div className="max-w-5xl mx-auto px-6 sm:px-8 lg:px-12">
          <Link to="/" className="text-overline inline-flex items-center gap-2 mb-8 hover:text-[#D9772B] transition-colors" data-testid="menus-back-home">
            <ArrowLeft size={14} /> back to home
          </Link>
          <p className="text-overline">Our menus</p>
          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl mt-6 leading-[1.02] tracking-tight">
            Past tables,
            <br />
            <span className="italic text-[#D9772B]">next courses.</span>
          </h1>
          <p className="mt-6 text-[#B5A79E] max-w-2xl leading-relaxed">
            Every Biraajo series carries its own menu, written for the season, the city, the room. Choose a chapter to read the courses.
          </p>
        </div>
      </section>

      <section className="pb-32">
        <div className="max-w-5xl mx-auto px-6 sm:px-8 lg:px-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-10">
          {/* Naani Ghar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            data-testid="menu-card-naani-ghar"
          >
            <Link to="/menus/naani-ghar" className="block group">
              <div className="relative aspect-4/5 overflow-hidden img-zoom">
                <img
                  src="/api/media/biraajo/media/6a6d9d936ab71fa4.jpg"
                  alt="Naani Ghar menu"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-linear-to-t/srgb from-[#0A0504] via-[#0A0504]/30 to-transparent" />
                <span className="absolute top-4 left-4 px-3 py-1 text-[10px] tracking-[0.22em] uppercase bg-[#0A0504]/80 text-[#9FD79F] border border-[#3A7D44]/60">
                  Series concluded
                </span>
                <div className="absolute bottom-0 left-0 right-0 p-7 sm:p-9">
                  <p className="text-overline">First series</p>
                  <h2 className="font-display text-3xl sm:text-4xl mt-3 leading-tight">
                    Naani Ghar. <span className="italic text-[#D9772B]">The menu.</span>
                  </h2>
                  <p className="mt-3 text-[#B5A79E] text-sm leading-relaxed">
                    Read the courses from our first chapter at home.
                  </p>
                </div>
              </div>
            </Link>
          </motion.div>

          {/* Barsaat */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.08 }}
            data-testid="menu-card-barsaat"
          >
            <Link to="/menus/barsaat" className="block group">
              <div className="relative aspect-4/5 overflow-hidden img-zoom">
                <img
                  src="/api/media/biraajo/media/4d82c167b3dc090f.jpg"
                  alt="Barsaat menu"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-linear-to-t/srgb from-[#0A0504] via-[#0A0504]/30 to-transparent" />
                <span className="absolute top-4 left-4 px-3 py-1 text-[10px] tracking-[0.22em] uppercase bg-[#0A0504]/80 text-[#D9772B] border border-[#D9772B]/60">
                  Reservations open
                </span>
                <div className="absolute bottom-0 left-0 right-0 p-7 sm:p-9">
                  <p className="text-overline">Next series</p>
                  <h2 className="font-display text-3xl sm:text-4xl mt-3 leading-tight">
                    Barsaat. <span className="italic text-[#D9772B]">The menu.</span>
                  </h2>
                  <p className="mt-3 text-[#B5A79E] text-sm leading-relaxed">
                    Ten monsoon courses. Veg & non-veg. Reserve early.
                  </p>
                </div>
              </div>
            </Link>
          </motion.div>

          {/* When There Wasn't Enough */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.16 }}
            data-testid="menu-card-wtwe"
          >
            <Link to="/menus/when-there-wasnt-enough" className="block group">
              <div className="relative aspect-4/5 overflow-hidden img-zoom">
                <video
                  src={WTWE_COVER}
                  className="w-full h-full object-cover"
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  onCanPlay={(e) => { try { e.currentTarget.play(); } catch { /* ignore */ } }}
                />
                <div className="absolute inset-0 bg-linear-to-t/srgb from-[#0A0504] via-[#0A0504]/30 to-transparent" />
                <span className="absolute top-4 left-4 px-3 py-1 text-[10px] tracking-[0.22em] uppercase bg-[#0A0504]/80 text-[#D9772B] border border-[#D9772B]/60">
                  Now booking
                </span>
                <div className="absolute bottom-0 left-0 right-0 p-7 sm:p-9">
                  <p className="text-overline">Next series</p>
                  <p className="mt-3 text-[#B5A79E] text-sm leading-relaxed">
                    Eight courses built from necessity. Veg & non-veg, same price. Five dates.
                  </p>
                </div>
              </div>
            </Link>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
