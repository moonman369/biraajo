import { motion } from "framer-motion";

const chapters = [
  {
    no: "01",
    eyebrow: "Before there was a name",
    title: (
      <>Before there was Biraajo, there was a <span className="italic text-[#D9772B]">dining table.</span></>
    ),
    body: [
      "In 2024, while working in a Bengali restaurant in New Delhi, I started inviting friends over for dinner. There was no concept behind it and certainly no business plan. I just wanted a place to cook.",
      "Some nights the food leaned Bengali. Other nights it went somewhere else entirely. We'd cook, eat, argue over ideas, lose track of time, and spend far too much of it talking about food.",
      "Many of those evenings were shared with other chefs. Looking back, those dinners quietly became the foundation for what would eventually become Biraajo.",
    ],
    image: "https://customer-assets.emergentagent.com/job_feast-studio-1/artifacts/ozdq9xth__DSC4892-2%20%281%29.jpg",
    align: "left",
  },
  {
    no: "02",
    eyebrow: "A borderless kitchen",
    title: (
      <>I don't really think in <span className="italic text-[#D9772B]">cuisines</span> anymore.</>
    ),
    body: [
      "Culinary school in Switzerland had a bigger influence on me than any single kitchen ever could.",
      "For the first time, I was surrounded by people from completely different parts of the world. A conversation over lunch could move from Mexico to Russia, from Turkey to Thailand in a matter of minutes. Everyone carried different memories of home and different ways of cooking, eating and gathering around a table. Watching those worlds collide was fascinating.",
      "Today I think in terms of ingredients, memories, techniques and ideas that happen to interest me at the time. A childhood favourite might become something entirely different. A family recipe may pick up influences from somewhere unexpected. A dish that appears on one menu may never appear again.",
      "At twenty-two, I'm still figuring out the kind of cook I want to become. Biraajo gives me a place to do that. Some guests arrive expecting a chef to present his finished philosophy. What they'll find instead is a chef in the middle of the process. The menu changes because I do.",
    ],
    image: "https://customer-assets.emergentagent.com/job_feast-studio-1/artifacts/knt2zl0v__DSC4971-2%20%281%29.jpg",
    align: "right",
  },
  {
    no: "03",
    eyebrow: "A home restored",
    title: (
      <>Old furniture. Old stories. <span className="italic text-[#D9772B]">Old Calcutta.</span></>
    ),
    body: [
      "Today, Biraajo takes place inside a restored family apartment in South Calcutta.",
      "The easier option would have been to find a commercial space. Instead, I chose a place that already had a history. The apartment still carries the character it always had. Very little was stripped away.",
      "That's what I love about it.",
    ],
    image: "https://customer-assets.emergentagent.com/job_feast-studio-1/artifacts/xw1h2s8n_IMG_0183%20%283%29%20%281%29.jpg",
    align: "left",
  },
];

export default function About() {
  return (
    <section
      id="about"
      className="relative bg-[#0A0504] py-24 sm:py-36 lg:py-44 overflow-hidden"
      data-testid="about-section"
    >
      {/* Section opener */}
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 mb-20 lg:mb-32">
        <p className="text-overline">The Story · So Far</p>
        <h2 className="font-display text-5xl sm:text-6xl lg:text-7xl mt-6 text-[#F3EFE7] leading-[1.02] tracking-tight max-w-5xl">
          Still becoming something,
          <br />
          a project, not a brand.
          <br />
          <span className="italic text-[#D9772B]">Come witness.</span>
        </h2>
      </div>

      {/* Chapters 01 → 02 → 03 */}
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 space-y-28 lg:space-y-40">
        {chapters.map((c, idx) => (
          <Chapter key={c.no} chapter={c} index={idx} />
        ))}
      </div>

      {/* Bridge — the rooted-vs-restless line */}
      <motion.blockquote
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 1.2 }}
        className="max-w-5xl mx-auto px-6 sm:px-8 lg:px-12 my-28 lg:my-40 text-center"
      >
        <p className="text-overline mb-6">A line that fits</p>
        <p className="font-display text-3xl sm:text-5xl lg:text-6xl text-[#F3EFE7] leading-[1.1] tracking-tight">
          The setting feels familiar and <span className="italic text-[#B5A79E]">rooted.</span>
          <br />
          The food often <span className="italic text-[#D9772B]">doesn't.</span>
        </p>
        <p className="mt-8 text-[#B5A79E] max-w-xl mx-auto leading-relaxed">
          Somewhere between the two is where Biraajo lives.
        </p>
      </motion.blockquote>

      {/* Section 04 — The meaning of Biraajo (closer) */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 1 }}
        className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start mt-8"
        data-testid="why-biraajo"
      >
        <div className="lg:col-span-5">
          <p className="text-overline">04 — The meaning of Biraajo</p>
          <h3 className="font-display text-5xl sm:text-6xl mt-6 text-[#F3EFE7] leading-[1.02] tracking-tight">
            An invitation to <span className="italic text-[#D9772B]">take a seat.</span>
          </h3>
        </div>
        <div className="lg:col-span-7 space-y-5 text-[#B5A79E] text-base lg:text-lg leading-relaxed lg:pt-8">
          <p>
            The name <em className="font-display not-italic text-[#F3EFE7]">Biraajo</em> comes from a Sanskrit word used to invite someone to take a seat.
          </p>
          <p>It's a simple gesture, but an important one.</p>
          <p>
            More than anything, this is an ongoing project. Not a restaurant that has found its final form. A table that's still being set — by someone who thinks the process of setting it is as interesting as the meal itself. That's what this is about.
          </p>
          <p className="font-display text-2xl text-[#F3EFE7] italic leading-snug pt-2">
            A little old Calcutta. A little experimentation. And always a place for one more person.
          </p>
          <div className="pt-6 flex flex-wrap gap-4">
            <a
              href="#events"
              className="inline-flex items-center justify-center px-7 py-4 bg-[#5A1A1F] text-[#F3EFE7] tracking-[0.18em] uppercase text-[11px] hover:bg-[#D9772B] hover:text-[#0A0504] transition-all duration-500"
              data-testid="about-join-table"
            >
              Pull up a chair
            </a>
            <a
              href="#gallery"
              className="inline-flex items-center justify-center px-7 py-4 border border-[#F3EFE7]/40 text-[#F3EFE7] tracking-[0.18em] uppercase text-[11px] hover:bg-[#F3EFE7] hover:text-[#0A0504] transition-all duration-500"
            >
              See past suppers
            </a>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

function Chapter({ chapter, index }) {
  const reverse = chapter.align === "right";
  return (
    <motion.article
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
      className={`grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center ${
        reverse ? "lg:[direction:rtl]" : ""
      }`}
      data-testid={`about-chapter-${chapter.no}`}
    >
      <div className="lg:col-span-6 [direction:ltr]">
        <div className="img-zoom relative aspect-[4/5] w-full overflow-hidden">
          <img
            src={chapter.image}
            alt={chapter.eyebrow}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0504]/60 to-transparent" />
          <span className="absolute top-5 left-5 text-overline text-[#F3EFE7]">
            section {chapter.no}
          </span>
        </div>
      </div>
      <div className="lg:col-span-6 [direction:ltr]">
        <p className="text-overline">{chapter.eyebrow}</p>
        <h3 className="font-display text-4xl sm:text-5xl lg:text-6xl mt-5 text-[#F3EFE7] leading-[1.04] tracking-tight">
          {chapter.title}
        </h3>
        <div className="mt-7 space-y-4 text-[#B5A79E] text-base lg:text-lg leading-relaxed">
          {chapter.body.map((p) => (
            <p key={p.slice(0, 40)}>{p}</p>
          ))}
        </div>
      </div>
    </motion.article>
  );
}
