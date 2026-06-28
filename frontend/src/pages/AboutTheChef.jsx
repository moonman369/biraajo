import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const PORTRAIT = "https://customer-assets.emergentagent.com/job_feast-studio-1/artifacts/kmlg9mxe__DSC3343%20%281%29.jpg";
const SECOND = "https://customer-assets.emergentagent.com/job_feast-studio-1/artifacts/ctn50bz1__DSC4913-2%20%281%29%20%281%29.jpg";
const THIRD = "https://customer-assets.emergentagent.com/job_feast-studio-1/artifacts/knt2zl0v__DSC4971-2%20%281%29.jpg";

export default function AboutTheChef() {
  return (
    <div className="bg-[#0A0504] text-[#F3EFE7] min-h-screen film-grain" data-testid="page-about-chef">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-32 pb-16 sm:pt-44 sm:pb-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-end">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-7"
          >
            <Link to="/" className="text-overline inline-flex items-center gap-2 mb-8 hover:text-[#D9772B] transition-colors" data-testid="back-to-home">
              <ArrowLeft size={14} /> back to home
            </Link>
            <p className="text-overline">A portrait · in his own words</p>
            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl mt-6 leading-[1.02] tracking-tight">
              Vidip Shah is twenty-two,
              <br />
              <span className="italic text-[#D9772B]">still becoming.</span>
            </h1>
            <p className="mt-8 text-[#B5A79E] text-lg leading-relaxed max-w-xl">
              He cooks the way he travels — without a fixed itinerary. Trained in Switzerland, raised on his grandmother&apos;s
              Bengali kitchen, sharpened by stints in Delhi&apos;s restaurants. Biraajo is where those threads come undone and
              are tied back together, every supper a slightly different knot.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
            className="lg:col-span-5"
          >
            <div className="img-zoom relative aspect-[4/5] w-full overflow-hidden">
              <img src={PORTRAIT} alt="Chef Vidip Shah" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A0504]/60 to-transparent" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Chapter — the early years */}
      <Chapter
        eyebrow="Where it began"
        title={<>A kitchen at home, long before <span className="italic text-[#D9772B]">a kitchen at work.</span></>}
        body={[
          "Vidip grew up in Calcutta, where afternoons spent at his grandmother's elbow were a kind of education no school could compete with. She didn't write things down. Her recipes lived in her hands — the precise pinch, the patient stir, the smell that told her when something was ready.",
          "By the time he was twelve, he was making the household breakfasts on weekends. By sixteen, he was the one his cousins called when they wanted something more interesting than what was on the table.",
        ]}
        image={SECOND}
      />

      {/* Chapter — the Swiss years */}
      <Chapter
        eyebrow="Switzerland — the broader table"
        title={<>Culinary school was not about <span className="italic text-[#D9772B]">technique.</span></>}
        body={[
          "It was about people. Classmates from Mexico, Russia, Turkey, Thailand — each carrying memories of home in their cooking. Vidip's worldview widened over those years not in the kitchen itself but in the dorm rooms, the late-night conversations over student-budget meals where someone was always teaching someone else a dish from home.",
          "He returned with no allegiance to a single cuisine. What he brought back instead was a way of working: ingredient-first, story-first, ego-last.",
        ]}
        image={THIRD}
        reverse
      />

      {/* The philosophy block */}
      <section className="py-24 sm:py-36 border-y border-[#2D1D1A]" data-testid="chef-philosophy">
        <div className="max-w-5xl mx-auto px-6 sm:px-8 lg:px-12 text-center">
          <p className="text-overline mb-6">The way he cooks</p>
          <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl leading-[1.08] tracking-tight">
            &ldquo;I don&apos;t really think in cuisines anymore.
            <br />
            I think in <span className="italic text-[#D9772B]">memories, ingredients, and weather.</span>&rdquo;
          </h2>
          <p className="mt-10 text-[#B5A79E] max-w-2xl mx-auto leading-relaxed">
            What this means in practice: no menu is ever printed twice. A childhood favourite might become something else
            entirely. A family recipe might pick up an influence from a dorm-room evening in Lucerne. A dish that opened
            one supper may never appear again. The point is the process, not the product.
          </p>
        </div>
      </section>

      {/* Today */}
      <section className="py-24 sm:py-32">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
          <div className="lg:col-span-5">
            <p className="text-overline">Today</p>
            <h2 className="font-display text-4xl sm:text-5xl mt-6 leading-[1.04] tracking-tight">
              The table is set in <span className="italic text-[#D9772B]">old Calcutta.</span>
            </h2>
          </div>
          <div className="lg:col-span-7 space-y-5 text-[#B5A79E] text-base lg:text-lg leading-relaxed lg:pt-6">
            <p>Biraajo lives inside a restored family apartment in South Calcutta. The easier choice would have been a commercial kitchen. Vidip chose the harder one — a place with its own memory.</p>
            <p>The furniture is old. The walls are old. The stories are older still. Onto this stage, every few weeks, Vidip plates whatever interests him at the moment — bombil from the Konkan, lamb from a long-forgotten dak bungalow recipe, a phirni that may or may not be entirely traditional. Strangers become diners; diners become friends.</p>
            <p className="font-display text-2xl text-[#F3EFE7] italic leading-snug pt-2">
              &ldquo;I&apos;m twenty-two. I haven&apos;t figured out the kind of cook I want to be. Biraajo is where I&apos;m doing the figuring.&rdquo;
            </p>
            <div className="pt-6 flex flex-wrap gap-4">
              <Link to="/supper-club/barsaat"
                data-testid="chef-cta-barsaat"
                className="inline-flex items-center justify-center px-7 py-4 bg-[#5A1A1F] text-[#F3EFE7] tracking-[0.18em] uppercase text-[11px] hover:bg-[#D9772B] hover:text-[#0A0504] transition-all duration-500">
                See the next supper
              </Link>
              <Link to="/supper-club/naani-ghar"
                className="inline-flex items-center justify-center px-7 py-4 border border-[#F3EFE7]/40 text-[#F3EFE7] tracking-[0.18em] uppercase text-[11px] hover:bg-[#F3EFE7] hover:text-[#0A0504] transition-all duration-500">
                Past suppers
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function Chapter({ eyebrow, title, body, image, reverse }) {
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
          <h3 className="font-display text-4xl sm:text-5xl mt-5 leading-[1.04] tracking-tight">{title}</h3>
          <div className="mt-7 space-y-4 text-[#B5A79E] text-base lg:text-lg leading-relaxed">
            {body.map((p) => <p key={p.slice(0, 40)}>{p}</p>)}
          </div>
        </div>
      </div>
    </motion.section>
  );
}
