import { motion } from "framer-motion";

const chapters = [
  {
    no: "01",
    eyebrow: "How it started",
    title: (
      <>It started with a <span className="italic text-[#D9772B]">table.</span></>
    ),
    body: [
      "Before there was a name, there was a table.",
      "In 2024, Vidip Shah began hosting informal dinners for friends. There was no grand concept, no business plan and no intention of turning it into anything bigger. It was simply a space to experiment.",
      "Regional dishes were reimagined through modern techniques. Familiar flavours appeared in unexpected forms. Every gathering became an opportunity to explore new ideas and tell stories through food.",
      "What began as a few dinners around a shared table slowly became the foundation for something more.",
    ],
    image: "https://images.unsplash.com/photo-1606660023296-81d67734170a",
    align: "left",
  },
  {
    no: "02",
    eyebrow: "The journey",
    title: (
      <>From a kitchen in <span className="italic text-[#D9772B]">Switzerland</span> back home.</>
    ),
    body: [
      "Curiosity eventually led beyond that table.",
      "After graduating from culinary school in Switzerland, Vidip spent time working in professional kitchens, refining his craft and expanding his perspective on food, culture and hospitality.",
      "Exposure to different cuisines, techniques and philosophies reinforced a belief that continues to shape Biraajo today: the most memorable meals are rarely about food alone. They are about people, memories and the conversations that happen around the table.",
    ],
    image: "https://images.unsplash.com/photo-1566554273541-37a9ca77b91f",
    align: "right",
  },
  {
    no: "03",
    eyebrow: "The house",
    title: (
      <>A home, <span className="italic text-[#D9772B]">restored.</span></>
    ),
    body: [
      "Today, that idea lives inside a restored family apartment in South Calcutta.",
      "Rather than building a restaurant from scratch, Vidip chose to restore a space already rich with history. Original details, family memories and old-world character have been carefully preserved, allowing the apartment to remain what it has always been: a home.",
      "The setting feels familiar, intimate and lived in. The food does not.",
    ],
    image: "https://images.unsplash.com/photo-1517870662726-c1d98ee36250",
    align: "left",
  },
  {
    no: "04",
    eyebrow: "The food",
    title: (
      <>No cuisine is <span className="italic text-[#D9772B]">off limits.</span></>
    ),
    body: [
      "At Biraajo, no cuisine is off limits and no tradition is beyond conversation. The menus are shaped by memories, travels, techniques and curiosity rather than geography.",
      "A childhood favourite may be smoked. A regional classic may be fermented. A familiar flavour may return in a form you've never encountered before.",
      "Every menu begins with a story and ends around a shared table.",
    ],
    image: "https://images.unsplash.com/photo-1697659602792-31dcb2a5a4ec",
    align: "right",
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
        <p className="text-overline">01 — The Story</p>
        <h2 className="font-display text-5xl sm:text-6xl lg:text-7xl mt-6 text-[#F3EFE7] leading-[1.02] tracking-tight max-w-4xl">
          Not quite a restaurant.
          <br />
          <span className="italic text-[#D9772B]">Not just a home.</span>
        </h2>
      </div>

      {/* Chapters with the bridge quote inserted between 03 (House) and 04 (Food) */}
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 space-y-28 lg:space-y-40">
        {chapters.slice(0, 3).map((c, idx) => (
          <Chapter key={c.no} chapter={c} index={idx} />
        ))}
      </div>

      {/* Bridge quote — sits between The House and The Food */}
      <motion.blockquote
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 1.2 }}
        className="max-w-5xl mx-auto px-6 sm:px-8 lg:px-12 my-28 lg:my-40 text-center"
      >
        <p className="text-overline mb-6">A line we live by</p>
        <p className="font-display text-3xl sm:text-5xl lg:text-6xl text-[#F3EFE7] leading-[1.1] tracking-tight">
          The house <span className="italic text-[#B5A79E]">preserves</span> memories.
          <br />
          The kitchen <span className="italic text-[#D9772B]">plays</span> with them.
        </p>
      </motion.blockquote>

      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 space-y-28 lg:space-y-40">
        {chapters.slice(3).map((c, idx) => (
          <Chapter key={c.no} chapter={c} index={idx + 3} />
        ))}
      </div>

      {/* Why Biraajo */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 1 }}
        className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start mt-8"
        data-testid="why-biraajo"
      >
        <div className="lg:col-span-5">
          <p className="text-overline">05 — Why Biraajo</p>
          <h3 className="font-display text-5xl sm:text-6xl mt-6 text-[#F3EFE7] leading-[1.02] tracking-tight">
            An invitation to <span className="italic text-[#D9772B]">take a seat.</span>
          </h3>
        </div>
        <div className="lg:col-span-7 space-y-5 text-[#B5A79E] text-base lg:text-lg leading-relaxed lg:pt-8">
          <p>
            The name comes from the Sanskrit word{" "}
            <em className="font-display not-italic text-[#F3EFE7]">Biraajo</em> — an invitation to take a seat.
          </p>
          <p>
            Traditionally, it is offered with warmth and reverence, often to honoured guests, respected elders and even the divine. More than hospitality, it is an invitation to belong.
          </p>
          <p>
            That idea sits at the heart of everything we do. Guests are welcomed into a home rather than a venue. The experience is designed to feel nostalgic yet unexpected, comforting yet playful.
          </p>
          <p className="font-display text-2xl text-[#F3EFE7] italic leading-snug pt-2">
            A little old Calcutta. A little experimentation. And just enough quirk to keep things interesting.
          </p>
          <div className="pt-6 flex flex-wrap gap-4">
            <a
              href="#events"
              className="inline-flex items-center justify-center px-7 py-4 bg-[#9C3527] text-[#F3EFE7] tracking-[0.18em] uppercase text-[11px] hover:bg-[#D9772B] hover:text-[#0A0504] transition-all duration-500"
              data-testid="about-join-table"
            >
              Join the Table
            </a>
            <a
              href="#experiences"
              className="inline-flex items-center justify-center px-7 py-4 border border-[#F3EFE7]/40 text-[#F3EFE7] tracking-[0.18em] uppercase text-[11px] hover:bg-[#F3EFE7] hover:text-[#0A0504] transition-all duration-500"
            >
              View Experiences
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
          {chapter.body.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </div>
    </motion.article>
  );
}
