import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import EventRegistrationModal from "@/components/EventRegistrationModal";
import { api } from "@/lib/api";
import { useSiteContent, read } from "@/lib/siteContent";

// Fallback chapters (used only if CMS hasn't loaded yet)
const DEFAULT_CHAPTERS = [
  {
    no: "01",
    eyebrow: "Before there was a name",
    title: "Before there was Biraajo, there was a dining table.",
    body: "In 2024, while working in a Bengali restaurant in New Delhi, I started inviting friends over for dinner. There was no concept behind it and certainly no business plan. I just wanted a place to cook.",
    image: "/api/media/biraajo/media/6a6d9d936ab71fa4.jpg",
    align: "left",
  },
];

export default function About() {
  const { content } = useSiteContent();
  const [event, setEvent] = useState(null);
  const [registrationsOpen, setRegistrationsOpen] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    api.get("/events", { params: { upcoming: "true" } })
      .then((r) => {
        const list = r.data || [];
        const match = list.find((e) => /barsaat|monsoon/i.test(`${e.title} ${e.tag || ""}`));
        setEvent(match || list[0] || null);
      }).catch(() => {});
    api.get("/settings")
      .then((r) => setRegistrationsOpen(r.data?.registrations_open !== false)).catch(() => {});
  }, []);

  const onReserve = (e) => {
    e.preventDefault();
    if (!registrationsOpen) {
      toast.info("Reservations are paused for now. Please reach out via WhatsApp.");
      return;
    }
    if (!event) {
      toast.info("No upcoming supper open for reservations right now.");
      return;
    }
    setOpen(true);
  };

  const about = content?.landing?.about;
  if (about && about.visible === false) return null;

  const chapters = (about?.chapters && about.chapters.length > 0 ? about.chapters : DEFAULT_CHAPTERS)
    .filter((c) => c?.visible !== false);

  const meaning = content?.landing?.about?.meaning;
  const meaningVisible = meaning?.visible !== false;

  return (
    <section id="about" className="relative bg-[#0A0504] py-24 sm:py-36 lg:py-44 overflow-hidden" data-testid="about-section">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 mb-20 lg:mb-32">
        <p className="text-overline">{read(content, "landing.about.eyebrow", "The Story · So Far")}</p>
        <h2 className="font-display text-5xl sm:text-6xl lg:text-7xl mt-6 text-[#F3EFE7] leading-[1.02] tracking-tight max-w-5xl">
          {read(content, "landing.about.title", "Still becoming something,")}
          <br />
          <span className="italic text-[#D9772B]">{read(content, "landing.about.title_italic", "Come witness.")}</span>
        </h2>
      </div>

      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 space-y-28 lg:space-y-40">
        {chapters.map((c, idx) => (
          <Chapter key={`${c.no}-${idx}`} chapter={c} />
        ))}
      </div>

      {meaningVisible && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 1 }}
          className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start mt-28 lg:mt-40"
          data-testid="why-biraajo"
        >
          <div className="lg:col-span-5">
            <p className="text-overline">{read(content, "landing.about.meaning.eyebrow", "04 — The meaning of Biraajo")}</p>
            <h3 className="font-display text-5xl sm:text-6xl mt-6 text-[#F3EFE7] leading-[1.02] tracking-tight">
              {read(content, "landing.about.meaning.title", "An invitation to ")}
              <span className="italic text-[#D9772B]">{read(content, "landing.about.meaning.title_italic", "take a seat.")}</span>
            </h3>
          </div>
          <div className="lg:col-span-7 space-y-5 text-[#B5A79E] text-base lg:text-lg leading-relaxed lg:pt-8">
            <p dangerouslySetInnerHTML={{ __html: read(content, "landing.about.meaning.body_1", "The name <em>Biraajo</em> comes from a Sanskrit word used to invite someone to take a seat.").replace(/<em>/g, '<em class="font-display italic text-[#F3EFE7]">') }} />
            <p>{read(content, "landing.about.meaning.body_2", "It's a simple gesture, but an important one.")}</p>
            <p>{read(content, "landing.about.meaning.body_3", "More than anything, this is an ongoing project.")}</p>
            <p className="font-display text-2xl text-[#F3EFE7] italic leading-snug pt-2">
              {read(content, "landing.about.meaning.pull_quote", "A little old Calcutta. A little experimentation. And always a place for one more person.")}
            </p>
            <div className="pt-6 flex flex-wrap gap-4">
              <button
                type="button"
                onClick={onReserve}
                className="inline-flex items-center justify-center px-7 py-4 bg-[#5A1A1F] text-[#F3EFE7] tracking-[0.18em] uppercase text-[11px] hover:bg-[#D9772B] hover:text-[#0A0504] transition-all duration-500"
                data-testid="about-join-table">
                {read(content, "landing.about.meaning.primary_cta_label", "Pull up a chair")}
              </button>
              <a href={read(content, "landing.about.meaning.secondary_cta_href", "#gallery")}
                className="inline-flex items-center justify-center px-7 py-4 border border-[#F3EFE7]/40 text-[#F3EFE7] tracking-[0.18em] uppercase text-[11px] hover:bg-[#F3EFE7] hover:text-[#0A0504] transition-all duration-500">
                {read(content, "landing.about.meaning.secondary_cta_label", "See past suppers")}
              </a>
            </div>
          </div>
        </motion.div>
      )}

      {open && event && (
        <EventRegistrationModal
          event={event}
          onClose={() => setOpen(false)}
          onSuccess={() => setOpen(false)}
        />
      )}
    </section>
  );
}

function Chapter({ chapter }) {
  const reverse = chapter.align === "right";
  // Body may come as a string from CMS or array from the old shape
  const body = Array.isArray(chapter.body) ? chapter.body : [chapter.body];
  return (
    <motion.article
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
      className={`grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center ${reverse ? "lg:[direction:rtl]" : ""}`}
      data-testid={`about-chapter-${chapter.no}`}
    >
      <div className="lg:col-span-6 [direction:ltr]">
        <div className="img-zoom relative aspect-[4/5] w-full overflow-hidden">
          <img src={chapter.image} alt={chapter.eyebrow} className="w-full h-full object-cover" loading="lazy" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0504]/60 to-transparent" />
          <span className="absolute top-5 left-5 text-overline text-[#F3EFE7]">section {chapter.no}</span>
        </div>
      </div>
      <div className="lg:col-span-6 [direction:ltr]">
        <p className="text-overline">{chapter.eyebrow}</p>
        <h3 className="font-display text-4xl sm:text-5xl mt-5 leading-[1.04] tracking-tight text-[#F3EFE7]">{chapter.title}</h3>
        <div className="mt-7 space-y-4 text-[#B5A79E] text-base lg:text-lg leading-relaxed">
          {body.filter(Boolean).map((p, i) => <p key={i}>{p}</p>)}
        </div>
      </div>
    </motion.article>
  );
}
