import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { api, formatApiError } from "@/lib/api";
import { useSiteContent, read } from "@/lib/siteContent";

export default function Newsletter() {
  const { content } = useSiteContent();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (content?.landing?.newsletter?.visible === false) return null;

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post("/newsletter", { email, name });
      toast.success("You're in. The next supper will land in your inbox first.");
      setEmail(""); setName("");
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail) || "Could not subscribe");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      id="newsletter"
      className="relative bg-[#140A09] py-24 sm:py-32 lg:py-40 border-t border-[#2D1D1A]"
      data-testid="newsletter-section"
    >
      <div className="max-w-4xl mx-auto px-6 sm:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 1 }}
        >
          <p className="text-overline">{read(content, "landing.newsletter.eyebrow", "The list")}</p>
          <h2 className="font-display text-5xl sm:text-6xl lg:text-7xl mt-6 text-[#F3EFE7] leading-[1.02] tracking-tight">
            {read(content, "landing.newsletter.title", "Hear when the next supper is")}
          </h2>
          <p className="mt-6 text-[#B5A79E] max-w-xl mx-auto leading-relaxed">
            {read(content, "landing.newsletter.body", "We send one short email a month — only when a new supper opens. No spam, no noise.")}
          </p>

          <form
            onSubmit={submit}
            className="mt-10 grid grid-cols-1 sm:grid-cols-12 gap-3 max-w-xl mx-auto"
          >
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              data-testid="newsletter-name-input"
              className="sm:col-span-5 bg-[#0A0504] border border-[#2D1D1A] px-4 py-4 text-[#F3EFE7] placeholder-[#B5A79E] focus:border-[#5A1A1F] outline-none"
            />
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email"
              data-testid="newsletter-email-input"
              className="sm:col-span-7 bg-[#0A0504] border border-[#2D1D1A] px-4 py-4 text-[#F3EFE7] placeholder-[#B5A79E] focus:border-[#5A1A1F] outline-none"
            />
            <button
              type="submit"
              disabled={submitting}
              data-testid="newsletter-submit-button"
              className="sm:col-span-12 px-6 py-4 bg-[#5A1A1F] text-[#F3EFE7] hover:bg-[#D9772B] hover:text-[#0A0504] transition-all duration-500 tracking-[0.18em] uppercase text-[11px] disabled:opacity-60"
            >
              {submitting ? "Adding you..." : (read(content, "landing.newsletter.button_label", "Join the list"))}
            </button>
          </form>
        </motion.div>
      </div>
    </section>
  );
}
