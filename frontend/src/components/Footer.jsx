import { Instagram, MessageCircle, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import { useSiteContent, read } from "@/lib/siteContent";

export default function Footer() {
  const { content } = useSiteContent();
  if (content?.landing?.footer?.visible === false) return null;

  const tagline = read(content, "landing.footer.tagline", "A project by Vidip Shah, a young chef cooking out of a restored family apartment in South Calcutta. Curious about more than one cuisine.");
  const copyright = read(content, "landing.footer.copyright", "Biraajo by Vidip Shah");
  const ig = read(content, "landing.contact.instagram", "@biraajo_");
  const igUrl = read(content, "landing.contact.instagram_url", `https://www.instagram.com/${ig.replace(/^@/, "")}/`);
  const email = read(content, "landing.contact.email", "reachbiraajo@gmail.com");
  const phone = read(content, "landing.contact.phone", "+91 93313 08405");
  const wa = phone.replace(/\D/g, "");

  return (
    <footer className="relative bg-[#0A0504] pt-20 pb-10 border-t border-[#2D1D1A]" data-testid="footer">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">
          <div className="md:col-span-6">
            <p className="font-display text-6xl sm:text-7xl text-[#F3EFE7] leading-none">
              biraajo<span className="italic text-[#D9772B]">.</span>
            </p>
            <p className="mt-6 text-[#B5A79E] max-w-md leading-relaxed">{tagline}</p>
          </div>

          <div className="md:col-span-3">
            <p className="text-overline mb-4">Wander</p>
            <ul className="space-y-3 text-[#B5A79E] text-sm">
              <li><a href="#about" className="hover:text-[#F3EFE7]">The Story</a></li>
              <li><a href="#events" className="hover:text-[#F3EFE7]">Events</a></li>
              <li><Link to="/menus" className="hover:text-[#F3EFE7]">Menu</Link></li>
              <li><a href="#gallery" className="hover:text-[#F3EFE7]">Gallery</a></li>
            </ul>
          </div>

          <div className="md:col-span-3">
            <p className="text-overline mb-4">Reach</p>
            <ul className="space-y-3 text-[#B5A79E] text-sm">
              <li>
                <a href={igUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 hover:text-[#F3EFE7]">
                  <Instagram size={14} /> {ig}
                </a>
              </li>
              <li>
                <a href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 hover:text-[#F3EFE7]">
                  <MessageCircle size={14} /> WhatsApp
                </a>
              </li>
              <li>
                <a href={`mailto:${email}`} className="inline-flex items-center gap-2 hover:text-[#F3EFE7]">
                  <Mail size={14} /> {email}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-[#2D1D1A] pt-8 flex flex-col sm:flex-row justify-between gap-4 text-[11px] tracking-[0.18em] uppercase text-[#B5A79E]">
          <span>© {new Date().getFullYear()} {copyright}</span>
          <span className="flex gap-6 items-center">
            <a href="/admin/login" className="hover:text-[#D9772B]" data-testid="footer-admin-link">Admin</a>
            <span className="opacity-60">Set the table. Tell the story.</span>
          </span>
        </div>
      </div>
    </footer>
  );
}
