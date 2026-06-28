import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useSiteContent, read } from "@/lib/siteContent";

export default function NaaniGharMenu() {
  const { content } = useSiteContent();
  const items = read(content, "naani_ghar.menu.items", []);

  return (
    <div className="bg-[#0A0504] text-[#F3EFE7] min-h-screen film-grain" data-testid="page-naani-ghar-menu">
      <Navbar />

      <section className="pt-32 pb-12 sm:pt-44 sm:pb-16">
        <div className="max-w-4xl mx-auto px-6 sm:px-8 lg:px-12">
          <Link to="/menus" className="text-overline inline-flex items-center gap-2 mb-8 hover:text-[#D9772B] transition-colors" data-testid="naani-menu-back">
            <ArrowLeft size={14} /> back to menus
          </Link>
          <p className="text-overline">{read(content, "naani_ghar.menu.eyebrow", "The Menu")}</p>
          <h1 className="font-display text-5xl sm:text-6xl mt-6 leading-[1.02] tracking-tight">
            {read(content, "naani_ghar.menu.title", "Nine courses,")}{" "}
            <span className="italic text-[#D9772B]">{read(content, "naani_ghar.menu.title_italic", "six remembered.")}</span>
          </h1>
          <p className="mt-4 text-[#B5A79E] text-sm tracking-[0.16em] uppercase">Naani Ghar · First series</p>
        </div>
      </section>

      <section className="pb-20">
        <div className="max-w-4xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="divide-y divide-[#2D1D1A] border-y border-[#2D1D1A]">
            {(items || []).map((m, i) => (
              <motion.div
                key={`${m.dish}-${i}`}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.6, delay: i * 0.04 }}
                className="grid grid-cols-12 gap-4 py-7"
                data-testid={`naani-menu-item-${i}`}
              >
                <p className="col-span-12 sm:col-span-3 text-overline">{m.course}</p>
                <div className="col-span-12 sm:col-span-9">
                  <p className="font-display text-2xl text-[#F3EFE7]">{m.dish}</p>
                  {m.note && (
                    <p className="text-sm text-[#B5A79E] mt-1 leading-relaxed">{m.note}</p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-14 flex justify-center">
            <button
              disabled
              aria-disabled="true"
              data-testid="naani-menu-concluded-btn"
              className="inline-flex items-center justify-center px-8 py-4 bg-transparent border border-[#3A7D44]/60 text-[#9FD79F] tracking-[0.18em] uppercase text-[11px] cursor-not-allowed select-none"
            >
              Series has been concluded
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
