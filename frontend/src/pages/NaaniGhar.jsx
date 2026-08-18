import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, Home, Heart, Sparkles } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useSiteContent, read } from "@/lib/siteContent";

const APPROACH_ICONS = { home: Home, heart: Heart, sparkles: Sparkles };

export default function NaaniGhar() {
  const { content } = useSiteContent();
  if (content?.naani_ghar?.visible === false) return null;

  const heroImg = read(content, "naani_ghar.hero.image", "/api/media/biraajo/media/6a6d9d936ab71fa4.jpg");
  const items = read(content, "naani_ghar.menu.items", []);
  const photos = read(content, "naani_ghar.photos_block.photos", []);
  const heroVisible = read(content, "naani_ghar.hero.visible", true) !== false;
  const menuVisible = read(content, "naani_ghar.menu.visible", true) !== false;
  const photosVisible = read(content, "naani_ghar.photos_block.visible", true) !== false;
  const closerVisible = read(content, "naani_ghar.closer.visible", true) !== false;
  const chefNoteVisible = read(content, "naani_ghar.chef_note.visible", true) !== false;
  const approachVisible = read(content, "naani_ghar.approach.visible", true) !== false;
  const approachItems = read(content, "naani_ghar.approach.items", []);

  return (
    <div className="bg-[#0A0504] text-[#F3EFE7] min-h-screen film-grain" data-testid="page-naani-ghar">
      <Navbar />

      {heroVisible && (
        <section className="relative pt-32 pb-12 sm:pt-44 sm:pb-20">
          <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
            <Link to="/" className="text-overline inline-flex items-center gap-2 mb-8 hover:text-[#D9772B] transition-colors" data-testid="back-to-home">
              <ArrowLeft size={14} /> back to home
            </Link>
            <Link to="/events" className="text-overline inline-flex items-center gap-2 mb-8 ml-6 hover:text-[#D9772B] transition-colors" data-testid="naani-all-concepts">
              all concepts
            </Link>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-end">
              <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1 }} className="lg:col-span-7">
                <p className="text-overline">{read(content, "naani_ghar.hero.eyebrow", "Past Supper")}</p>
                <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl mt-6 leading-[1.02] tracking-tight">
                  {read(content, "naani_ghar.hero.title", "Naani Ghar.")}
                  <br />
                  <span className="italic text-[#D9772B]">{read(content, "naani_ghar.hero.title_italic", "Grandmother's house.")}</span>
                </h1>
                <p className="mt-8 text-[#B5A79E] text-lg leading-relaxed max-w-xl">
                  {read(content, "naani_ghar.hero.body", "")}
                </p>
                <p className="mt-4 text-[#B5A79E] text-sm tracking-[0.16em] uppercase">{read(content, "naani_ghar.hero.meta", "")}</p>
              </motion.div>
              <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.2, delay: 0.2 }} className="lg:col-span-5">
                <div className="img-zoom relative aspect-[4/5] w-full overflow-hidden">
                  <img src={heroImg} alt="Naani Ghar" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0A0504]/55 to-transparent" />
                </div>
              </motion.div>
            </div>
          </div>
        </section>
      )}

      {chefNoteVisible && (
        <section className="py-20 sm:py-28 border-t border-[#2D1D1A] bg-[#140A09]" data-testid="naani-chef-note">
          <div className="max-w-3xl mx-auto px-6 sm:px-8 lg:px-12 text-center">
            <p className="text-overline">{read(content, "naani_ghar.chef_note.eyebrow", "A note from the chef")}</p>
            <p className="font-display italic text-2xl sm:text-3xl mt-7 leading-[1.35] text-[#F3EFE7]">
              &ldquo;{read(content, "naani_ghar.chef_note.quote", "")}&rdquo;
            </p>
            <p className="text-overline mt-7 text-[#D9772B]">— {read(content, "naani_ghar.chef_note.signature", "Vidip Shah")}</p>
          </div>
        </section>
      )}

      {approachVisible && approachItems.length > 0 && (
        <section className="py-24 sm:py-32 border-t border-[#2D1D1A]" data-testid="naani-approach">
          <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 mb-14">
              <div className="lg:col-span-5">
                <p className="text-overline">{read(content, "naani_ghar.approach.eyebrow", "The concept")}</p>
                <h2 className="font-display text-4xl sm:text-5xl mt-6 leading-[1.05] tracking-tight">
                  {read(content, "naani_ghar.approach.title", "Homecoming,")}
                  <br />
                  <span className="italic text-[#D9772B]">{read(content, "naani_ghar.approach.title_italic", "reinterpreted.")}</span>
                </h2>
              </div>
              <div className="lg:col-span-7 lg:pt-3">
                <p className="text-[#B5A79E] text-lg leading-relaxed">{read(content, "naani_ghar.approach.intro", "")}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[#2D1D1A] border border-[#2D1D1A]">
              {approachItems.map((s, i) => {
                const Icon = APPROACH_ICONS[s.icon] || Home;
                return (
                  <motion.div
                    key={s.title || i}
                    initial={{ opacity: 0, y: 18 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7, delay: i * 0.08 }}
                    className="bg-[#0A0504] p-9 sm:p-12"
                    data-testid={`naani-approach-${i}`}
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

      {menuVisible && (
        <section className="py-24 sm:py-32 border-t border-[#2D1D1A]">
          <div className="max-w-5xl mx-auto px-6 sm:px-8 lg:px-12">
            <p className="text-overline">{read(content, "naani_ghar.menu.eyebrow", "The Menu")}</p>
            <h2 className="font-display text-4xl sm:text-5xl mt-6 leading-[1.04] tracking-tight">
              {read(content, "naani_ghar.menu.title", "Nine courses,")}{" "}
              <span className="italic text-[#D9772B]">{read(content, "naani_ghar.menu.title_italic", "six remembered.")}</span>
            </h2>

            <div className="mt-12 divide-y divide-[#2D1D1A] border-y border-[#2D1D1A]">
              {(items || []).map((m, i) => (
                <motion.div
                  key={`${m.dish}-${i}`}
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
      )}

      {photosVisible && (
        <section className="py-24 sm:py-32 bg-[#140A09]">
          <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
            <p className="text-overline">{read(content, "naani_ghar.photos_block.eyebrow", "In photographs")}</p>
            <h2 className="font-display text-4xl sm:text-5xl mt-6 leading-[1.04] tracking-tight max-w-3xl">
              {read(content, "naani_ghar.photos_block.title", "How the room")}{" "}
              <span className="italic text-[#D9772B]">{read(content, "naani_ghar.photos_block.title_italic", "remembered itself.")}</span>
            </h2>

            <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-[#2D1D1A]">
              {(photos || []).map((p, i) => (
                <motion.div
                  key={`${p}-${i}`}
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
      )}

      {closerVisible && (
        <section className="py-24 sm:py-32">
          <div className="max-w-3xl mx-auto px-6 sm:px-8 lg:px-12 text-center">
            <p className="text-overline mb-6">{read(content, "naani_ghar.closer.eyebrow", "Until the next one")}</p>
            <p className="font-display text-3xl sm:text-4xl leading-[1.15]">
              {read(content, "naani_ghar.closer.title", "Some suppers are returns.")}{" "}
              <span className="italic text-[#D9772B]">{read(content, "naani_ghar.closer.title_italic", "This one was a return home.")}</span>
            </p>
            <div className="pt-10 flex flex-wrap gap-4 justify-center">
              <Link to="/supper-club/barsaat" data-testid="naani-cta-barsaat"
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
      )}

      <Footer />
    </div>
  );
}
