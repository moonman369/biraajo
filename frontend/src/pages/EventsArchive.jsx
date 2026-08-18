import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { CHAPTERS } from "@/lib/chapters";
import { isVideoUrl } from "@/lib/media";

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
              A series of chapters,
              <br />
              <span className="italic text-[#D9772B]">never repeated.</span>
            </h1>
            <p className="mt-8 text-[#B5A79E] text-lg leading-relaxed max-w-2xl">
              Every chapter runs its own menu, until the next one begins. Here's how the work has evolved, from the first home to where the table sits today.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="pb-24 sm:pb-32">
        <div className="max-w-5xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="border-0 md:border md:border-[#2D1D1A] space-y-6 md:space-y-0 md:divide-y md:divide-[#2D1D1A]" data-testid="archive-chapter-list">
            {CHAPTERS.map((c, i) => (
              <motion.div
                key={c.name}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.7, delay: i * 0.08 }}
                className="border border-[#2D1D1A] md:border-0"
              >
                <Link
                  to={c.href}
                  className="group grid grid-cols-1 md:grid-cols-12 bg-[#0A0504] hover:bg-[#140A09] transition-colors duration-500"
                  data-testid={`archive-chapter-${c.number}`}
                >
                  <div className="md:col-span-5 relative aspect-[4/3] md:aspect-auto overflow-hidden img-zoom">
                    {isVideoUrl(c.image) ? (
                      <video
                        src={c.image}
                        className="w-full h-full object-cover"
                        autoPlay
                        muted
                        loop
                        playsInline
                        preload="metadata"
                        onCanPlay={(e) => { try { e.currentTarget.play(); } catch { /* ignore */ } }}
                      />
                    ) : (
                      <img src={c.image} alt={c.name} className="w-full h-full object-cover" loading="lazy" />
                    )}
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
