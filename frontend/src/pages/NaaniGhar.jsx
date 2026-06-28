import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const HERO = "https://customer-assets.emergentagent.com/job_feast-studio-1/artifacts/ozdq9xth__DSC4892-2%20%281%29.jpg";
const PHOTOS = [
  "https://customer-assets.emergentagent.com/job_feast-studio-1/artifacts/kpwk8ol3__DSC4913-2%20%281%29.jpg",
  "https://customer-assets.emergentagent.com/job_feast-studio-1/artifacts/ctn50bz1__DSC4913-2%20%281%29%20%281%29.jpg",
  "https://customer-assets.emergentagent.com/job_feast-studio-1/artifacts/knt2zl0v__DSC4971-2%20%281%29.jpg",
  "https://customer-assets.emergentagent.com/job_feast-studio-1/artifacts/xw1h2s8n_IMG_0183%20%283%29%20%281%29.jpg",
];

const MENU = [
  { course: "Amuse", dish: "Bel-Phuljhadi", note: "Wood-apple sphere, kala namak air, mustard oil pearls" },
  { course: "Small plate", dish: "Bombil Croquette", note: "Konkan bombay duck, gunpowder, lime aioli" },
  { course: "Small plate", dish: "Chana Chaat 2.0", note: "Black chickpea, tomato confit, mint emulsion" },
  { course: "Main", dish: "Dak Bungalow Lamb", note: "Slow-braised lamb shank, raj masala, burnt onion jus" },
  { course: "Main", dish: "Malvani Pomfret", note: "Whole roasted pomfret, kokum-coconut curry, red rice" },
  { course: "Dessert", dish: "Mishti Doi Cheesecake", note: "Bengali jaggery yoghurt, nolen gur, palm sugar tuile" },
];

export default function NaaniGhar() {
  return (
    <div className="bg-[#0A0504] text-[#F3EFE7] min-h-screen film-grain" data-testid="page-naani-ghar">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-32 pb-12 sm:pt-44 sm:pb-20">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <Link to="/" className="text-overline inline-flex items-center gap-2 mb-8 hover:text-[#D9772B] transition-colors" data-testid="back-to-home">
            <ArrowLeft size={14} /> back to home
          </Link>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-end">
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1 }} className="lg:col-span-7">
              <p className="text-overline">Past Supper · A memory</p>
              <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl mt-6 leading-[1.02] tracking-tight">
                Naani Ghar.
                <br />
                <span className="italic text-[#D9772B]">Grandmother&apos;s house.</span>
              </h1>
              <p className="mt-8 text-[#B5A79E] text-lg leading-relaxed max-w-xl">
                The first Biraajo supper held inside the restored family apartment. A nine-course evening built entirely
                from the dishes Vidip grew up eating — re-imagined, re-plated, but never re-named.
              </p>
              <p className="mt-4 text-[#B5A79E] text-sm tracking-[0.16em] uppercase">June 2026 · South Calcutta · 12 guests</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.2, delay: 0.2 }} className="lg:col-span-5">
              <div className="img-zoom relative aspect-[4/5] w-full overflow-hidden">
                <img src={HERO} alt="Naani Ghar — the room" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0504]/55 to-transparent" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* The menu — what was served */}
      <section className="py-24 sm:py-32 border-t border-[#2D1D1A]">
        <div className="max-w-5xl mx-auto px-6 sm:px-8 lg:px-12">
          <p className="text-overline">The Menu · As it was served</p>
          <h2 className="font-display text-4xl sm:text-5xl mt-6 leading-[1.04] tracking-tight">
            Nine courses, <span className="italic text-[#D9772B]">six remembered.</span>
          </h2>

          <div className="mt-12 divide-y divide-[#2D1D1A] border-y border-[#2D1D1A]">
            {MENU.map((m, i) => (
              <motion.div
                key={m.dish}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.7, delay: i * 0.04 }}
                className="grid grid-cols-12 gap-4 py-7"
              >
                <p className="col-span-12 sm:col-span-3 text-overline">{m.course}</p>
                <div className="col-span-12 sm:col-span-9">
                  <p className="font-display text-2xl text-[#F3EFE7]">{m.dish}</p>
                  <p className="text-sm text-[#B5A79E] mt-1 leading-relaxed">{m.note}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Photo gallery */}
      <section className="py-24 sm:py-32 bg-[#140A09]">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <p className="text-overline">In photographs</p>
          <h2 className="font-display text-4xl sm:text-5xl mt-6 leading-[1.04] tracking-tight max-w-3xl">
            How the room <span className="italic text-[#D9772B]">remembered itself.</span>
          </h2>

          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-[#2D1D1A]">
            {PHOTOS.map((p, i) => (
              <motion.div
                key={p}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: i * 0.05 }}
                className="bg-[#0A0504] aspect-[4/5] overflow-hidden img-zoom"
              >
                <img src={p} alt="Naani Ghar moment" loading="lazy" className="w-full h-full object-cover" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Closer */}
      <section className="py-24 sm:py-32">
        <div className="max-w-3xl mx-auto px-6 sm:px-8 lg:px-12 text-center">
          <p className="text-overline mb-6">Until the next one</p>
          <p className="font-display text-3xl sm:text-4xl leading-[1.15]">
            Some suppers are returns. <span className="italic text-[#D9772B]">This one was a return home.</span>
          </p>
          <div className="pt-10 flex flex-wrap gap-4 justify-center">
            <Link to="/supper-club/barsaat"
              data-testid="naani-cta-barsaat"
              className="inline-flex items-center justify-center px-7 py-4 bg-[#5A1A1F] text-[#F3EFE7] tracking-[0.18em] uppercase text-[11px] hover:bg-[#D9772B] hover:text-[#0A0504] transition-all duration-500">
              See the next supper · Barsaat
            </Link>
            <Link to="/"
              className="inline-flex items-center justify-center px-7 py-4 border border-[#F3EFE7]/40 text-[#F3EFE7] tracking-[0.18em] uppercase text-[11px] hover:bg-[#F3EFE7] hover:text-[#0A0504] transition-all duration-500">
              Back to home
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
