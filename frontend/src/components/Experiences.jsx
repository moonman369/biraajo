import { motion } from "framer-motion";
import { useSiteContent, read } from "@/lib/siteContent";

const FALLBACK_CARDS = [
  { tag: "Supper Club", title: "Supper Clubs", body: "Eight-seat candle-lit dinners with a rotating, story-led menu.", image: "/api/media/biraajo/media/7b3c136adf5f5431.jpg" },
  { tag: "Private", title: "Private Dining", body: "A bespoke evening for your home, terrace or trip.", image: "/api/media/biraajo/media/6a6d9d936ab71fa4.jpg" },
];

export default function Experiences() {
  const { content } = useSiteContent();
  const sec = content?.landing?.experiences;
  if (sec && sec.visible === false) return null;
  const cards = (sec?.cards && sec.cards.length > 0 ? sec.cards : FALLBACK_CARDS).filter((c) => c?.visible !== false);

  return (
    <section id="experiences" className="relative bg-[#140A09] py-24 sm:py-36 lg:py-44 border-y border-[#2D1D1A]" data-testid="experiences-section">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end mb-16 lg:mb-24">
          <div className="lg:col-span-7">
            <p className="text-overline">{read(content, "landing.experiences.eyebrow", "02 · Experiences")}</p>
            <h2 className="font-display text-5xl sm:text-6xl lg:text-7xl mt-6 text-[#F3EFE7] leading-[1.02] tracking-tight">
              {read(content, "landing.experiences.title", "Two ways to ")}{" "}
              <span className="italic text-[#D9772B]">{read(content, "landing.experiences.title_italic", "sit down.")}</span>
            </h2>
          </div>
          <div className="lg:col-span-5 lg:text-right">
            <p className="text-[#B5A79E] max-w-md lg:ml-auto leading-relaxed">
              {read(content, "landing.experiences.body", "Each experience is hand-built, slow-cooked, and warmly hosted.")}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-[#2D1D1A]">
          {cards.map((it, i) => (
            <motion.article
              key={`${it.title}-${i}`}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.9, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] }}
              data-testid={`experience-card-${i}`}
              className="group relative bg-[#0A0504] p-8 sm:p-10 lg:p-12 hover-lift overflow-hidden"
            >
              <div className="img-zoom relative aspect-4/3 mb-8 overflow-hidden">
                <img src={it.image} alt={it.title} className="w-full h-full object-cover" loading="lazy" />
                <div className="absolute inset-0 bg-linear-to-t/srgb from-[#0A0504]/60 to-transparent" />
                <span className="absolute top-4 left-4 text-overline text-[#F3EFE7]">{it.tag}</span>
              </div>
              <h3 className="font-display text-3xl text-[#F3EFE7] tracking-tight">{it.title}</h3>
              <p className="mt-4 text-[#B5A79E] text-sm leading-relaxed">{it.body}</p>
              <a href="#contact" className="mt-6 inline-flex items-center gap-2 text-overline text-[#D9772B] hover:text-[#F3EFE7] transition-colors">
                Enquire <span aria-hidden>→</span>
              </a>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
