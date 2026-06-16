import { motion } from "framer-motion";

export default function About() {
  return (
    <section
      id="about"
      className="relative bg-[#0A0504] py-24 sm:py-36 lg:py-48 overflow-hidden"
      data-testid="about-section"
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
        {/* Left: image stack */}
        <motion.div
          className="lg:col-span-5 relative"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="img-zoom relative aspect-[3/4] w-full overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1566554273541-37a9ca77b91f"
              alt="Chef Vidip at work"
              className="w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0504]/60 to-transparent" />
          </div>
          <div className="hidden sm:block absolute -bottom-12 -right-10 w-40 h-52 img-zoom overflow-hidden border-4 border-[#0A0504]">
            <img
              src="https://images.unsplash.com/photo-1697659602792-31dcb2a5a4ec"
              alt="Spices"
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        </motion.div>

        {/* Right: text */}
        <motion.div
          className="lg:col-span-7 lg:pl-8"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
        >
          <p className="text-overline">01 — The Chef</p>
          <h2 className="font-display text-5xl sm:text-6xl lg:text-7xl mt-6 text-[#F3EFE7] leading-[1.02] tracking-tight">
            A kitchen
            <br />
            of <span className="italic text-[#D9772B]">memory</span>,
            <br />
            built from fire & gossip.
          </h2>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-8 text-[#B5A79E] text-base lg:text-lg leading-relaxed">
            <p>
              Vidip Shah is a contemporary Indian chef, supper club host and culinary
              consultant working between Mumbai and beyond. His cooking is rooted in
              family recipes, regional pantries and the unhurried rhythm of feeding
              people you love — re-imagined with modern technique and a quiet sense
              of restraint.
            </p>
            <p>
              Through <em className="font-display not-italic text-[#F3EFE7]">Biraajo</em>,
              he hosts intimate twelve-seat dinners, designs private dining
              experiences, develops menus for restaurants and collaborates with
              brands that take taste seriously. Every plate is half story, half
              feast.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-2 sm:grid-cols-4 gap-6 border-t border-[#2D1D1A] pt-10">
            {[
              ["80+", "suppers hosted"],
              ["12", "seats per night"],
              ["6", "cities travelled"],
              ["1", "long table"],
            ].map(([n, l]) => (
              <div key={l}>
                <div className="font-display text-4xl sm:text-5xl text-[#F3EFE7] tracking-tight">
                  {n}
                </div>
                <div className="text-overline mt-2 text-[#B5A79E]">{l}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
