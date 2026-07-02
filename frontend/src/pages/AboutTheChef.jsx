import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useSiteContent, read } from "@/lib/siteContent";

export default function AboutTheChef() {
  const { content } = useSiteContent();
  if (content?.about_the_chef?.visible === false) return null;

  const portrait = read(content, "about_the_chef.hero.portrait", "/api/media/biraajo/media/7852840d19d12949.jpg");
  const ch1Visible = read(content, "about_the_chef.chapter_1.visible", true) !== false;
  const ch2Visible = read(content, "about_the_chef.chapter_2.visible", true) !== false;
  const philVisible = read(content, "about_the_chef.philosophy.visible", true) !== false;
  const todayVisible = read(content, "about_the_chef.today.visible", true) !== false;

  return (
    <div className="bg-[#0A0504] text-[#F3EFE7] min-h-screen film-grain" data-testid="page-about-chef">
      <Navbar />

      <section className="relative pt-32 pb-16 sm:pt-44 sm:pb-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-end">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }} className="lg:col-span-7">
            <Link to="/" className="text-overline inline-flex items-center gap-2 mb-8 hover:text-[#D9772B] transition-colors" data-testid="back-to-home">
              <ArrowLeft size={14} /> back to home
            </Link>
            <p className="text-overline">{read(content, "about_the_chef.hero.eyebrow", "A portrait")}</p>
            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl mt-6 leading-[1.02] tracking-tight">
              {read(content, "about_the_chef.hero.title", "Vidip Shah is twenty-two,")}
              <br />
              <span className="italic text-[#D9772B]">{read(content, "about_the_chef.hero.title_italic", "still becoming.")}</span>
            </h1>
            <p className="mt-8 text-[#B5A79E] text-lg leading-relaxed max-w-xl">
              {read(content, "about_the_chef.hero.body", "He cooks the way he travels — without a fixed itinerary.")}
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.2 }} className="lg:col-span-5">
            <div className="img-zoom relative aspect-[4/5] w-full overflow-hidden">
              <img src={portrait} alt="Chef Vidip Shah" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A0504]/60 to-transparent" />
            </div>
          </motion.div>
        </div>
      </section>

      {ch1Visible && (
        <Chapter
          eyebrow={read(content, "about_the_chef.chapter_1.eyebrow", "Where it began")}
          titleHtml={read(content, "about_the_chef.chapter_1.title_html", "A kitchen at home")}
          bodies={[read(content, "about_the_chef.chapter_1.body_1", ""), read(content, "about_the_chef.chapter_1.body_2", "")]}
          image={read(content, "about_the_chef.chapter_1.image", "")}
        />
      )}
      {ch2Visible && (
        <Chapter
          eyebrow={read(content, "about_the_chef.chapter_2.eyebrow", "Switzerland")}
          titleHtml={read(content, "about_the_chef.chapter_2.title_html", "Culinary school")}
          bodies={[read(content, "about_the_chef.chapter_2.body_1", ""), read(content, "about_the_chef.chapter_2.body_2", "")]}
          image={read(content, "about_the_chef.chapter_2.image", "")}
          reverse
        />
      )}

      {philVisible && (
        <section className="py-24 sm:py-36 border-y border-[#2D1D1A]" data-testid="chef-philosophy">
          <div className="max-w-5xl mx-auto px-6 sm:px-8 lg:px-12 text-center">
            <p className="text-overline mb-6">{read(content, "about_the_chef.philosophy.eyebrow", "The way he cooks")}</p>
            <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl leading-[1.08] tracking-tight">
              {read(content, "about_the_chef.philosophy.quote_1", "")}
              <br />
              <span className="italic text-[#D9772B]">{read(content, "about_the_chef.philosophy.quote_2_italic", "")}</span>
            </h2>
            <p className="mt-10 text-[#B5A79E] max-w-2xl mx-auto leading-relaxed">
              {read(content, "about_the_chef.philosophy.footer_body", "")}
            </p>
          </div>
        </section>
      )}

      {todayVisible && (
        <section className="py-24 sm:py-32">
          <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
            <div className="lg:col-span-5">
              <p className="text-overline">{read(content, "about_the_chef.today.eyebrow", "Today")}</p>
              <h2 className="font-display text-4xl sm:text-5xl mt-6 leading-[1.04] tracking-tight">
                {read(content, "about_the_chef.today.title", "The table is set in")}{" "}
                <span className="italic text-[#D9772B]">{read(content, "about_the_chef.today.title_italic", "old Calcutta.")}</span>
              </h2>
            </div>
            <div className="lg:col-span-7 space-y-5 text-[#B5A79E] text-base lg:text-lg leading-relaxed lg:pt-6">
              <p>{read(content, "about_the_chef.today.body_1", "")}</p>
              <p>{read(content, "about_the_chef.today.body_2", "")}</p>
              <p className="font-display text-2xl text-[#F3EFE7] italic leading-snug pt-2">
                {read(content, "about_the_chef.today.pull_quote", "")}
              </p>
              <div className="pt-6 flex flex-wrap gap-4">
                <Link to="/supper-club/barsaat" data-testid="chef-cta-barsaat"
                  className="inline-flex items-center justify-center px-7 py-4 bg-[#5A1A1F] text-[#F3EFE7] tracking-[0.18em] uppercase text-[11px] hover:bg-[#D9772B] hover:text-[#0A0504] transition-all duration-500">
                  {read(content, "about_the_chef.today.primary_cta_label", "See the next supper")}
                </Link>
                <Link to="/supper-club/naani-ghar"
                  className="inline-flex items-center justify-center px-7 py-4 border border-[#F3EFE7]/40 text-[#F3EFE7] tracking-[0.18em] uppercase text-[11px] hover:bg-[#F3EFE7] hover:text-[#0A0504] transition-all duration-500">
                  {read(content, "about_the_chef.today.secondary_cta_label", "Past suppers")}
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}

function Chapter({ eyebrow, titleHtml, bodies, image, reverse }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
      className="py-20 sm:py-28"
    >
      <div className={`max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center ${reverse ? "lg:[direction:rtl]" : ""}`}>
        <div className="lg:col-span-6 [direction:ltr]">
          <div className="img-zoom relative aspect-[4/5] w-full overflow-hidden">
            <img src={image} alt={eyebrow} className="w-full h-full object-cover" loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0504]/50 to-transparent" />
          </div>
        </div>
        <div className="lg:col-span-6 [direction:ltr]">
          <p className="text-overline">{eyebrow}</p>
          <h3
            className="font-display text-4xl sm:text-5xl mt-5 leading-[1.04] tracking-tight"
            dangerouslySetInnerHTML={{ __html: (titleHtml || "").replace(/<em>/g, '<em class="italic text-[#D9772B]">') }}
          />
          <div className="mt-7 space-y-4 text-[#B5A79E] text-base lg:text-lg leading-relaxed">
            {bodies.filter(Boolean).map((p, i) => <p key={i}>{p}</p>)}
          </div>
        </div>
      </div>
    </motion.section>
  );
}
