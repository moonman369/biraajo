import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const CHAPTERS = [
  {
    number: "03",
    name: "Abhav Ke Bhav",
    tagline: "When there wasn't enough",
    status: "Now booking",
    active: true,
    description: "The current chapter — eight courses built entirely from necessity, scarcity and upcycled memory.",
    image: "https://customer-assets-gfyr7b9c.emergentagent.net/job_5694519e-f9bb-446a-a36e-fdf292c1f3e4/artifacts/eofl6aqm_when.jpg",
    href: "/supper-club/when-there-wasnt-enough",
  },
  {
    number: "02",
    name: "Barsaat",
    tagline: "A supper with the rain",
    status: "Series concluded",
    active: false,
    description: "A monsoon-season menu built from Gujarat and Rajasthan's micro-regional traditions, woven through with Bengali influence — and a live three-hour soundscape composed by Rajneesh.",
    image: "/api/media/biraajo/media/31cf3839eeb74061.jpg",
    href: "/supper-club/barsaat",
  },
  {
    number: "01",
    name: "Naani Ghar",
    tagline: "Grandmother's house",
    status: "Series concluded",
    active: false,
    description: "Biraajo's first chapter — childhood memory and Nani's own recipes, rebuilt through a contemporary European format.",
    image: "/api/media/biraajo/media/6a6d9d936ab71fa4.jpg",
    href: "/supper-club/naani-ghar",
  },
];

export default function EventsArchive() {
  return (
    <div className="bg-[#0A0504] text-[#F3EFE7] min-h-screen film-grain" data-testid="page-events-archive">
      <Navbar />

      <section className="relative pt-32 pb-16 sm:pt-44 sm:pb-20">
        <div className="max-w-5xl mx-auto px-6 sm:px-8 lg:px-12">
          <Link to="/" className="text-overline inline-flex items-center gap-2 mb-8 hover:text-[#D9772B] transition-colors" data-testid="archive-back-home">
            <ArrowLeft size={14} /> back to home
          </Link>
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1 }}>
            <p className="text-overline">Every chapter, so far</p>
            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl mt-6 leading-[1.02] tracking-tight">
              Not one menu.
              <br />
              <span className="italic text-[#D9772B]">A series of chapters.</span>
            </h1>
            <p className="mt-8 text-[#B5A79E] text-lg leading-relaxed max-w-2xl">
              Biraajo doesn't repeat a menu. Each supper is its own concept — its own story, season and soundscape.
              Here's how the work has evolved, from the first home to where the table sits today.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="pb-24 sm:pb-32">
        <div className="max-w-5xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="border border-[#2D1D1A] divide-y divide-[#2D1D1A]" data-testid="archive-chapter-list">
            {CHAPTERS.map((c, i) => (
              <motion.div
                key={c.name}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.7, delay: i * 0.08 }}
              >
                <Link
                  to={c.href}
                  className="group grid grid-cols-1 md:grid-cols-12 bg-[#0A0504] hover:bg-[#140A09] transition-colors duration-500"
                  data-testid={`archive-chapter-${c.number}`}
                >
                  <div className="md:col-span-5 relative aspect-[4/3] md:aspect-auto overflow-hidden img-zoom">
                    <img src={c.image} alt={c.name} className="w-full h-full object-cover" loading="lazy" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0A0504]/50 to-transparent md:hidden" />
                  </div>
                  <div className="md:col-span-7 p-8 sm:p-12 flex flex-col justify-center">
                    <div className="flex items-center gap-4 flex-wrap">
                      <span className="text-overline">Chapter {c.number}</span>
                      <span
                        className={`text-[10px] tracking-[0.22em] uppercase px-2.5 py-1 border ${
                          c.active ? "border-[#D9772B] text-[#D9772B]" : "border-[#2D1D1A] text-[#6E625B]"
                        }`}
                        data-testid={`archive-status-${c.number}`}
                      >
                        {c.status}
                      </span>
                    </div>
                    <h2 className="font-display text-4xl sm:text-5xl mt-4 leading-tight tracking-tight">{c.name}</h2>
                    <p className="text-[13px] tracking-[0.2em] uppercase text-[#D9772B] mt-2">{c.tagline}</p>
                    <p className="mt-5 text-[#B5A79E] leading-relaxed max-w-xl">{c.description}</p>
                    <p className="mt-6 text-overline inline-flex items-center gap-2 group-hover:text-[#D9772B] transition-colors">
                      Read the story <ArrowRight size={13} />
                    </p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
