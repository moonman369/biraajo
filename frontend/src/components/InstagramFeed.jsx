import { motion } from "framer-motion";
import { Instagram } from "lucide-react";

const tiles = [
  "https://images.unsplash.com/photo-1606471191009-63994c53433b",
  "https://images.unsplash.com/photo-1728910156510-77488f19b152",
  "https://images.unsplash.com/photo-1697659602792-31dcb2a5a4ec",
  "https://images.unsplash.com/photo-1588644525273-f37b60d78512",
  "https://images.unsplash.com/photo-1517870662726-c1d98ee36250",
  "https://images.unsplash.com/photo-1585937421612-70a008356fbe",
];

export default function InstagramFeed() {
  return (
    <section
      id="instagram"
      className="relative bg-[#0A0504] py-24 sm:py-32 lg:py-40 border-t border-[#2D1D1A]"
      data-testid="instagram-section"
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-end mb-12">
          <div className="lg:col-span-7">
            <p className="text-overline">06 — Follow Along</p>
            <h2 className="font-display text-5xl sm:text-6xl lg:text-7xl mt-6 text-[#F3EFE7] leading-[1.02] tracking-tight">
              Live from{" "}
              <span className="italic text-[#D9772B]">the kitchen.</span>
            </h2>
          </div>
          <div className="lg:col-span-5">
            <p className="text-[#B5A79E] leading-relaxed mb-6">
              Most of our suppers are seated via Instagram. Follow{" "}
              <span className="text-[#F3EFE7]">@biraajo_</span> for menu drops,
              behind-the-scenes and the next city.
            </p>
            <a
              href="https://www.instagram.com/biraajo_/"
              target="_blank"
              rel="noreferrer"
              data-testid="instagram-follow-button"
              className="inline-flex items-center gap-3 px-6 py-3 bg-[#F3EFE7] text-[#0A0504] tracking-[0.18em] uppercase text-[11px] hover:bg-[#D9772B] hover:text-[#0A0504] transition-all duration-500"
            >
              <Instagram size={16} /> Follow @biraajo_
            </a>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 lg:gap-4">
          {tiles.map((src, i) => (
            <motion.a
              key={i}
              href="https://www.instagram.com/biraajo_/"
              target="_blank"
              rel="noreferrer"
              data-testid={`instagram-tile-${i}`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.8, delay: i * 0.06 }}
              className="relative aspect-square img-zoom overflow-hidden group"
            >
              <img src={src} alt="" className="w-full h-full object-cover" loading="lazy" />
              <div className="absolute inset-0 bg-[#0A0504]/0 group-hover:bg-[#0A0504]/70 transition-all duration-500 flex items-center justify-center">
                <Instagram
                  className="text-[#F3EFE7] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  size={22}
                />
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}
