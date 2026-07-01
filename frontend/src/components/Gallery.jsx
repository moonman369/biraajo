import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Play } from "lucide-react";
import { api } from "@/lib/api";

const isVideo = (url = "") => /\.(mp4|webm|mov|m4v)(\?|$)/i.test(url);

export default function Gallery() {
  const [images, setImages] = useState([]);
  const [openIndex, setOpenIndex] = useState(null);

  useEffect(() => {
    api
      .get("/gallery")
      .then((r) => setImages(r.data || []))
      .catch(() => setImages([]));
  }, []);

  const next = () => setOpenIndex((i) => (i + 1) % images.length);
  const prev = () => setOpenIndex((i) => (i - 1 + images.length) % images.length);

  if (images.length === 0) return null;

  return (
    <section
      id="gallery"
      className="relative bg-[#140A09] py-24 sm:py-36 lg:py-44 border-t border-[#2D1D1A]"
      data-testid="gallery-section"
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="flex items-end justify-between mb-14 flex-wrap gap-6">
          <div>
            <p className="text-overline">05 — Gallery</p>
            <h2 className="font-display text-5xl sm:text-6xl lg:text-7xl mt-6 text-[#F3EFE7] leading-[1.02] tracking-tight">
              Evenings,
              <br />
              <span className="italic text-[#D9772B]">slowly remembered.</span>
            </h2>
          </div>
          <p className="text-[#B5A79E] max-w-sm">
            A scrapbook of suppers past — tap any image to look closer.
          </p>
        </div>

        {/* Masonry */}
        <div className="columns-2 md:columns-3 lg:columns-4 gap-3 lg:gap-4 [column-fill:_balance]">
          {images.map((img, i) => (
            <motion.button
              key={img.id}
              onClick={() => setOpenIndex(i)}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.8, delay: (i % 6) * 0.05 }}
              className="block mb-3 lg:mb-4 w-full break-inside-avoid img-zoom overflow-hidden bg-[#0A0504] group relative"
              data-testid={`gallery-thumb-${i}`}
            >
              {isVideo(img.url) ? (
                <video
                  src={img.url}
                  className="w-full aspect-[4/5] object-cover bg-[#140A09]"
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  poster={img.poster || undefined}
                  onCanPlay={(e) => { try { e.currentTarget.play(); } catch { /* ignore */ } }}
                  onError={(e) => { /* keep dark placeholder if source fails */ }}
                />
              ) : (
                <img
                  src={img.url}
                  alt={img.caption || "Biraajo"}
                  className="w-full h-auto object-cover"
                  loading="lazy"
                />
              )}
              {isVideo(img.url) && (
                <span className="absolute top-3 left-3 flex items-center gap-1 px-2 py-1 bg-[#0A0504]/80 backdrop-blur-sm text-overline text-[#F3EFE7]">
                  <Play size={10} /> Video
                </span>
              )}
              <div className="absolute inset-0 bg-[#0A0504]/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-4">
                <span className="text-overline text-[#F3EFE7]">view</span>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {openIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 z-[80] bg-[#0A0504]/96 backdrop-blur-sm flex items-center justify-center p-6"
            onClick={() => setOpenIndex(null)}
            data-testid="lightbox"
          >
            <button
              onClick={(e) => { e.stopPropagation(); setOpenIndex(null); }}
              aria-label="Close"
              className="absolute top-6 right-6 text-[#F3EFE7] hover:text-[#D9772B] transition-colors"
              data-testid="lightbox-close"
            >
              <X size={26} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); prev(); }}
              className="absolute left-4 sm:left-10 text-[#F3EFE7] hover:text-[#D9772B] transition-colors"
              aria-label="Previous"
              data-testid="lightbox-prev"
            >
              <ChevronLeft size={36} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); next(); }}
              className="absolute right-4 sm:right-10 text-[#F3EFE7] hover:text-[#D9772B] transition-colors"
              aria-label="Next"
              data-testid="lightbox-next"
            >
              <ChevronRight size={36} />
            </button>
            <motion.div
              key={images[openIndex].id}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="max-h-[88vh] max-w-[88vw]"
              onClick={(e) => e.stopPropagation()}
            >
              {isVideo(images[openIndex].url) ? (
                <video
                  src={images[openIndex].url}
                  className="max-h-[88vh] max-w-[88vw] object-contain"
                  controls
                  autoPlay
                  playsInline
                />
              ) : (
                <img
                  src={images[openIndex].url}
                  alt=""
                  className="max-h-[88vh] max-w-[88vw] object-contain"
                />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
