import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { api } from "@/lib/api";

export default function MenuSection() {
  const [sections, setSections] = useState([]);
  const [active, setActive] = useState(0);

  useEffect(() => {
    api
      .get("/menu")
      .then((r) => setSections(r.data || []))
      .catch(() => setSections([]));
  }, []);

  if (sections.length === 0) return null;
  const current = sections[active];

  return (
    <section
      id="menu"
      className="relative bg-[#0A0504] py-24 sm:py-36 lg:py-44 vignette"
      data-testid="menu-section"
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="text-center max-w-3xl mx-auto mb-16 lg:mb-20">
          <p className="text-overline">04 — The Menu</p>
          <h2 className="font-display text-5xl sm:text-6xl lg:text-7xl mt-6 text-[#F3EFE7] leading-[1.02] tracking-tight">
            A <span className="italic text-[#D9772B]">tasting card</span>,
            <br />
            in four breaths.
          </h2>
          <p className="mt-6 text-[#B5A79E] leading-relaxed">
            Menus change with the season, with the city, with the mood of the
            room. This is a glimpse of what a Biraajo evening tastes like.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap justify-center gap-2 sm:gap-4 mb-14">
          {sections.map((s, i) => (
            <button
              key={s.id}
              data-testid={`menu-tab-${i}`}
              onClick={() => setActive(i)}
              className={`px-5 py-3 text-[11px] tracking-[0.22em] uppercase border transition-all duration-500 ${
                active === i
                  ? "bg-[#9C3527] border-[#9C3527] text-[#F3EFE7]"
                  : "bg-transparent border-[#2D1D1A] text-[#B5A79E] hover:text-[#F3EFE7] hover:border-[#9C3527]"
              }`}
            >
              {s.title}
            </button>
          ))}
        </div>

        {/* Menu card */}
        <motion.div
          key={current.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-3xl mx-auto bg-[#140A09] border border-[#2D1D1A] p-8 sm:p-14 lg:p-20 relative"
        >
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 bg-[#0A0504]">
            <span className="ember-dot" />
          </div>
          <div className="text-center">
            <p className="text-overline">{`Course ${active + 1}`}</p>
            <h3 className="font-display text-4xl sm:text-5xl mt-4 text-[#F3EFE7]">
              {current.title}
            </h3>
            {current.subtitle && (
              <p className="font-display italic text-xl text-[#D9772B] mt-2">
                {current.subtitle}
              </p>
            )}
          </div>

          <div className="divider-line my-10" />

          <ul className="space-y-8">
            {(current.items || []).map((it, idx) => (
              <li key={`${current.id}-${it.name}`} data-testid={`menu-item-${idx}`}>
                <div className="flex items-baseline justify-between gap-6">
                  <h4 className="font-display text-2xl text-[#F3EFE7] tracking-tight">
                    {it.name}
                  </h4>
                  {it.price && (
                    <span className="text-[#D9772B] text-sm tracking-widest">
                      {it.price}
                    </span>
                  )}
                </div>
                {it.description && (
                  <p className="mt-2 text-[#B5A79E] text-sm leading-relaxed">
                    {it.description}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </section>
  );
}
