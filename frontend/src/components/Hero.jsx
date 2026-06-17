import { motion } from "framer-motion";

const HERO_IMG =
  "https://customer-assets.emergentagent.com/job_adaec391-d42f-41ce-b775-ff2b784b7b8b/artifacts/kpwk8ol3__DSC4913-2%20%281%29.jpg";
const HERO_VIDEO =
  "https://customer-assets.emergentagent.com/job_feast-studio-1/artifacts/6469flkz_biraajo%206th%20june%2000101268_prob4.mp4";

export default function Hero() {
  return (
    <section
      id="top"
      className="relative min-h-screen w-full overflow-hidden"
      data-testid="hero-section"
    >
      {/* Background video with image poster fallback */}
      <div className="absolute inset-0">
        <video
          src={HERO_VIDEO}
          poster={HERO_IMG}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <img
          src={HERO_IMG}
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover -z-10"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A0504]/55 via-[#0A0504]/40 to-[#0A0504]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(10,5,4,0.9))]" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 min-h-screen flex flex-col">
        {/* Top meta row */}
        <div className="pt-32 sm:pt-36 grid grid-cols-2 gap-6 text-overline">
          <motion.span
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.6 }}
          >
            <span className="ember-dot mr-3 align-middle" />
            south calcutta · since 2024
          </motion.span>
          <motion.span
            className="text-right hidden sm:inline"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.7 }}
          >
            not quite a restaurant · not just a home
          </motion.span>
        </div>

        {/* Main title block */}
        <div className="flex-1 flex flex-col justify-center pb-20 pt-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}
          >
            <p className="text-overline mb-6">Chef · Storyteller · Culinary Consultant</p>
          </motion.div>

          <motion.h1
            className="font-display text-[15vw] sm:text-[12vw] lg:text-[10rem] leading-[0.92] text-[#F3EFE7] tracking-[-0.04em]"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.55 }}
            data-testid="hero-title"
          >
            biraajo<span className="italic text-[#D9772B]">.</span>
          </motion.h1>

          <motion.div
            className="mt-6 sm:mt-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-end"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.85 }}
          >
            <div className="lg:col-span-7">
              <p className="font-display text-2xl sm:text-3xl lg:text-4xl text-[#F3EFE7] leading-snug italic font-light">
                Not quite a restaurant.{" "}
                <span className="not-italic text-[#B5A79E]">
                  Not just a home. A young chef cooking out of a restored family apartment in South Calcutta — and inviting you in.
                </span>
              </p>
            </div>

            <div className="lg:col-span-5 lg:text-right">
              <p className="text-overline mb-5 lg:mb-4">Take a seat</p>
              <div className="flex flex-col sm:flex-row gap-4 lg:justify-end">
                <a
                  href="#events"
                  data-testid="hero-view-experiences-button"
                  className="inline-flex items-center justify-center px-7 py-4 bg-[#9C3527] text-[#F3EFE7] tracking-[0.18em] uppercase text-[11px] hover:bg-[#D9772B] hover:text-[#0A0504] transition-all duration-500"
                >
                  Join the Table
                </a>
                <a
                  href="#experiences"
                  data-testid="hero-join-events-button"
                  className="inline-flex items-center justify-center px-7 py-4 border border-[#F3EFE7]/40 text-[#F3EFE7] tracking-[0.18em] uppercase text-[11px] hover:bg-[#F3EFE7] hover:text-[#0A0504] transition-all duration-500"
                >
                  View Experiences
                </a>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Bottom scroll indicator */}
        <motion.div
          className="pb-10 flex items-center gap-4 text-overline text-[#B5A79E]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.4 }}
        >
          <span>scroll</span>
          <span className="w-12 h-px bg-[#B5A79E]" />
          <span className="italic font-display text-base text-[#F3EFE7] normal-case tracking-normal">
            a table set for stories
          </span>
        </motion.div>
      </div>
    </section>
  );
}
