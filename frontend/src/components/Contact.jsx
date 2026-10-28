import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, MessageCircle } from "lucide-react";
import Instagram from "@/components/icons/Instagram";
import { toast } from "sonner";
import { api, formatApiError } from "@/lib/api";
import { useSiteContent, read } from "@/lib/siteContent";

export default function Contact() {
  const { content } = useSiteContent();
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [submitting, setSubmitting] = useState(false);

  if (content?.landing?.contact?.visible === false) return null;

  const phone = read(content, "landing.contact.phone", "+91 93313 08405");
  const email = read(content, "landing.contact.email", "reachbiraajo@gmail.com");
  const ig = read(content, "landing.contact.instagram", "@biraajo_");
  const igUrl = read(content, "landing.contact.instagram_url", `https://www.instagram.com/${ig.replace(/^@/, "")}/`);
  const wa = phone.replace(/\D/g, "");

  const handle = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post("/contact", form);
      toast.success("Thank you. We read every note personally.");
      setForm({ name: "", email: "", phone: "", message: "" });
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail) || "Could not send");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      id="contact"
      className="relative bg-[#0A0504] py-24 sm:py-36 lg:py-44 border-t border-[#2D1D1A]"
      data-testid="contact-section"
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
        <motion.div
          className="lg:col-span-5"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 1 }}
        >
          <p className="text-overline">{read(content, "landing.contact.eyebrow", "Reach out")}</p>
          <h2 className="font-display text-5xl sm:text-6xl lg:text-7xl mt-6 text-[#F3EFE7] leading-[1.02] tracking-tight">
            {read(content, "landing.contact.title", "Drop us a line.")}
          </h2>
          <p className="mt-6 text-[#B5A79E] leading-relaxed">
            {read(content, "landing.contact.body", "For private dinners, press, or just to say hi.")}
          </p>

          <div className="mt-10 space-y-4">
            <ContactLink
              href={`https://wa.me/${wa}`}
              icon={<MessageCircle size={18} />}
              label="WhatsApp"
              value={phone}
              testid="contact-whatsapp"
            />
            <ContactLink
              href={igUrl}
              icon={<Instagram size={18} />}
              label="Instagram"
              value={ig}
              testid="contact-instagram"
            />
            <ContactLink
              href={`mailto:${email}`}
              icon={<Mail size={18} />}
              label="Email"
              value={email}
              testid="contact-email"
            />
          </div>
        </motion.div>

        <motion.form
          onSubmit={submit}
          className="lg:col-span-7 bg-[#140A09] border border-[#2D1D1A] p-8 sm:p-12 space-y-5"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 1, delay: 0.1 }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Input label="Your name" required value={form.name} onChange={handle("name")} testid="contact-name-input" />
            <Input label="Email" required type="email" value={form.email} onChange={handle("email")} testid="contact-email-input" />
          </div>
          <Input label="Phone (optional)" value={form.phone} onChange={handle("phone")} testid="contact-phone-input" />
          <div>
            <span className="text-overline block mb-2">Tell us about your idea<span className="text-[#D9772B]"> *</span></span>
            <textarea
              required rows={5} value={form.message} onChange={handle("message")}
              data-testid="contact-message-input"
              className="w-full bg-[#0A0504] border border-[#2D1D1A] px-4 py-3 text-[#F3EFE7] focus:border-[#5A1A1F] outline-none resize-none"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            data-testid="contact-form-submit"
            className="w-full px-6 py-4 bg-[#5A1A1F] text-[#F3EFE7] hover:bg-[#D9772B] hover:text-[#0A0504] transition-all duration-500 tracking-[0.18em] uppercase text-[11px] disabled:opacity-60"
          >
            {submitting ? "Sending..." : "Send message"}
          </button>
        </motion.form>
      </div>
    </section>
  );
}

function ContactLink({ href, icon, label, value, testid }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      data-testid={testid}
      className="flex items-center justify-between gap-4 p-5 border border-[#2D1D1A] hover:border-[#D9772B] transition-colors duration-500 group"
    >
      <span className="flex items-center gap-4">
        <span className="text-[#D9772B] group-hover:text-[#F3EFE7] transition-colors">{icon}</span>
        <span>
          <span className="text-overline block">{label}</span>
          <span className="text-[#F3EFE7] block mt-1">{value}</span>
        </span>
      </span>
      <span className="text-[#B5A79E] group-hover:text-[#F3EFE7] transition-colors">→</span>
    </a>
  );
}

function Input({ label, required, testid, ...props }) {
  return (
    <label className="block">
      <span className="text-overline block mb-2">{label}{required && <span className="text-[#D9772B]"> *</span>}</span>
      <input
        required={required}
        data-testid={testid}
        {...props}
        className="w-full bg-[#0A0504] border border-[#2D1D1A] px-4 py-3 text-[#F3EFE7] focus:border-[#5A1A1F] outline-none"
      />
    </label>
  );
}
