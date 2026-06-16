import { Instagram, MessageCircle, Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer
      className="relative bg-[#0A0504] pt-20 pb-10 border-t border-[#2D1D1A]"
      data-testid="footer"
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">
          <div className="md:col-span-6">
            <p className="font-display text-6xl sm:text-7xl text-[#F3EFE7] leading-none">
              biraajo<span className="italic text-[#D9772B]">.</span>
            </p>
            <p className="mt-6 text-[#B5A79E] max-w-md leading-relaxed">
              A contemporary Indian supper club by Vidip Shah — Mumbai, on the move.
            </p>
          </div>

          <div className="md:col-span-3">
            <p className="text-overline mb-4">Wander</p>
            <ul className="space-y-3 text-[#B5A79E] text-sm">
              <li><a href="#about" className="hover:text-[#F3EFE7]">The Story</a></li>
              <li><a href="#experiences" className="hover:text-[#F3EFE7]">Experiences</a></li>
              <li><a href="#events" className="hover:text-[#F3EFE7]">Events</a></li>
              <li><a href="#menu" className="hover:text-[#F3EFE7]">Menu</a></li>
              <li><a href="#gallery" className="hover:text-[#F3EFE7]">Gallery</a></li>
            </ul>
          </div>

          <div className="md:col-span-3">
            <p className="text-overline mb-4">Reach</p>
            <ul className="space-y-3 text-[#B5A79E] text-sm">
              <li>
                <a href="https://www.instagram.com/biraajo_/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 hover:text-[#F3EFE7]">
                  <Instagram size={14} /> @biraajo_
                </a>
              </li>
              <li>
                <a href="https://wa.me/919331308405" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 hover:text-[#F3EFE7]">
                  <MessageCircle size={14} /> WhatsApp
                </a>
              </li>
              <li>
                <a href="mailto:reachbiraajo@gmail.com" className="inline-flex items-center gap-2 hover:text-[#F3EFE7]">
                  <Mail size={14} /> reachbiraajo@gmail.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-[#2D1D1A] pt-8 flex flex-col sm:flex-row justify-between gap-4 text-[11px] tracking-[0.18em] uppercase text-[#B5A79E]">
          <span>© {new Date().getFullYear()} Biraajo by Vidip Shah</span>
          <span className="flex gap-6 items-center">
            <a href="/admin/login" className="hover:text-[#D9772B]" data-testid="footer-admin-link">Admin</a>
            <span className="opacity-60">Set the table. Tell the story.</span>
          </span>
        </div>
      </div>
    </footer>
  );
}
