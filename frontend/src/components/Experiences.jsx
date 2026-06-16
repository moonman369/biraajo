import { motion } from "framer-motion";

const items = [
  {
    no: "01",
    title: "Supper Clubs",
    desc: "Twelve-seat candle-lit dinners with a rotating, story-led menu. The original Biraajo experience.",
    img: "https://customer-assets.emergentagent.com/job_feast-studio-1/artifacts/xw1h2s8n_IMG_0183%20%283%29%20%281%29.jpg",
  },
  {
    no: "02",
    title: "Private Dining",
    desc: "A bespoke evening for your home, terrace or trip. Plated, served and remembered.",
    img: "https://customer-assets.emergentagent.com/job_feast-studio-1/artifacts/ozdq9xth__DSC4892-2%20%281%29.jpg",
  },
  {
    no: "03",
    title: "Consulting",
    desc: "Concept, kitchen architecture and operational consulting for restaurants and hospitality brands.",
    img: "https://customer-assets.emergentagent.com/job_feast-studio-1/artifacts/knt2zl0v__DSC4971-2%20%281%29.jpg",
  },
  {
    no: "04",
    title: "Pop-Ups",
    desc: "City-hopping residencies and one-night-only takeovers in venues that fit the mood.",
    img: "https://customer-assets.emergentagent.com/job_adaec391-d42f-41ce-b775-ff2b784b7b8b/artifacts/kpwk8ol3__DSC4913-2%20%281%29.jpg",
  },
  {
    no: "05",
    title: "Brand Collaborations",
    desc: "Culinary direction, recipe development and event programming with brands we love.",
    img: "https://images.unsplash.com/photo-1606471191009-63994c53433b",
  },
  {
    no: "06",
    title: "Menu Development",
    desc: "From a single seasonal tasting card to a full restaurant menu — written, tested, plated.",
    img: "https://images.unsplash.com/photo-1588644525273-f37b60d78512",
  },
];

export default function Experiences() {
  return (
    <section
      id="experiences"
      className="relative bg-[#140A09] py-24 sm:py-36 lg:py-44 border-y border-[#2D1D1A]"
      data-testid="experiences-section"
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end mb-16 lg:mb-24">
          <div className="lg:col-span-7">
            <p className="text-overline">02 — Experiences</p>
            <h2 className="font-display text-5xl sm:text-6xl lg:text-7xl mt-6 text-[#F3EFE7] leading-[1.02] tracking-tight">
              Six ways to{" "}
              <span className="italic text-[#D9772B]">share a table.</span>
            </h2>
          </div>
          <div className="lg:col-span-5 lg:text-right">
            <p className="text-[#B5A79E] max-w-md lg:ml-auto leading-relaxed">
              From a single seat at a long supper-club table to a year-long
              consulting engagement — each experience is hand-built, slow-cooked
              and warmly hosted.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-[#2D1D1A]">
          {items.map((it, i) => (
            <motion.article
              key={it.no}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{
                duration: 0.9,
                delay: i * 0.07,
                ease: [0.16, 1, 0.3, 1],
              }}
              data-testid={`experience-card-${it.no}`}
              className="group relative bg-[#0A0504] p-8 sm:p-10 lg:p-12 hover-lift overflow-hidden"
            >
              <div className="img-zoom relative aspect-[4/3] mb-8 overflow-hidden">
                <img
                  src={it.img}
                  alt={it.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0504]/60 to-transparent" />
                <span className="absolute top-4 left-4 text-overline text-[#F3EFE7]">
                  {it.no}
                </span>
              </div>
              <h3 className="font-display text-3xl text-[#F3EFE7] tracking-tight">
                {it.title}
              </h3>
              <p className="mt-4 text-[#B5A79E] text-sm leading-relaxed">
                {it.desc}
              </p>
              <a
                href="#contact"
                className="mt-6 inline-flex items-center gap-2 text-overline text-[#D9772B] hover:text-[#F3EFE7] transition-colors"
              >
                Enquire <span aria-hidden>→</span>
              </a>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
