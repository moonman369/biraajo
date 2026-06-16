import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { toast } from "sonner";
import { api, formatApiError } from "@/lib/api";

export default function EventRegistrationModal({ event, onClose, onSuccess }) {
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    instagram_handle: "",
    dietary_preferences: "",
    guests: 1,
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const handle = (k) => (e) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post(`/events/${event.id}/register`, {
        ...form,
        event_id: event.id,
        guests: Number(form.guests) || 1,
      });
      toast.success("Your seat is reserved. We'll be in touch on WhatsApp.");
      onSuccess?.();
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail) || "Could not register");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[90] bg-[#0A0504]/90 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-6"
        onClick={onClose}
        data-testid="event-registration-modal"
      >
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="bg-[#140A09] border border-[#2D1D1A] w-full max-w-2xl max-h-[92vh] overflow-y-auto p-7 sm:p-12 relative"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-[#B5A79E] hover:text-[#F3EFE7]"
            aria-label="Close"
            data-testid="event-modal-close"
          >
            <X size={22} />
          </button>

          <p className="text-overline">Reserve your seat</p>
          <h3 className="font-display text-3xl sm:text-4xl mt-3 text-[#F3EFE7] leading-tight">
            {event.title}
          </h3>
          <p className="mt-2 text-[#B5A79E] text-sm">
            {event.venue} · {event.time}
          </p>

          <form onSubmit={submit} className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Full name" required>
              <input
                required value={form.full_name} onChange={handle("full_name")}
                data-testid="reg-fullname-input"
                className="w-full bg-[#0A0504] border border-[#2D1D1A] px-4 py-3 text-[#F3EFE7] focus:border-[#9C3527] outline-none"
              />
            </Field>
            <Field label="Email" required>
              <input
                required type="email" value={form.email} onChange={handle("email")}
                data-testid="reg-email-input"
                className="w-full bg-[#0A0504] border border-[#2D1D1A] px-4 py-3 text-[#F3EFE7] focus:border-[#9C3527] outline-none"
              />
            </Field>
            <Field label="Phone (WhatsApp)" required>
              <input
                required value={form.phone} onChange={handle("phone")}
                data-testid="reg-phone-input"
                className="w-full bg-[#0A0504] border border-[#2D1D1A] px-4 py-3 text-[#F3EFE7] focus:border-[#9C3527] outline-none"
              />
            </Field>
            <Field label="Instagram handle">
              <input
                value={form.instagram_handle} onChange={handle("instagram_handle")}
                placeholder="@yourhandle"
                data-testid="reg-instagram-input"
                className="w-full bg-[#0A0504] border border-[#2D1D1A] px-4 py-3 text-[#F3EFE7] focus:border-[#9C3527] outline-none"
              />
            </Field>
            <Field label="Number of guests">
              <input
                type="number" min={1} max={Math.max(1, event.seats_total - (event.seats_booked || 0))}
                value={form.guests} onChange={handle("guests")}
                data-testid="reg-guests-input"
                className="w-full bg-[#0A0504] border border-[#2D1D1A] px-4 py-3 text-[#F3EFE7] focus:border-[#9C3527] outline-none"
              />
            </Field>
            <Field label="Dietary preferences">
              <input
                value={form.dietary_preferences} onChange={handle("dietary_preferences")}
                placeholder="Veg, vegan, allergies..."
                data-testid="reg-dietary-input"
                className="w-full bg-[#0A0504] border border-[#2D1D1A] px-4 py-3 text-[#F3EFE7] focus:border-[#9C3527] outline-none"
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Anything else we should know">
                <textarea
                  rows={3} value={form.notes} onChange={handle("notes")}
                  data-testid="reg-notes-input"
                  className="w-full bg-[#0A0504] border border-[#2D1D1A] px-4 py-3 text-[#F3EFE7] focus:border-[#9C3527] outline-none resize-none"
                />
              </Field>
            </div>
            <div className="sm:col-span-2 mt-2">
              <button
                type="submit"
                disabled={submitting}
                data-testid="event-registration-submit"
                className="w-full px-6 py-4 bg-[#9C3527] text-[#F3EFE7] hover:bg-[#D9772B] hover:text-[#0A0504] transition-all duration-500 tracking-[0.18em] uppercase text-[11px] disabled:opacity-60"
              >
                {submitting ? "Reserving..." : "Confirm my seat"}
              </button>
              <p className="mt-3 text-[11px] tracking-[0.12em] text-[#B5A79E] text-center">
                We confirm every seat personally on WhatsApp within 24 hours.
              </p>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function Field({ label, required, children }) {
  return (
    <label className="block">
      <span className="text-overline block mb-2">
        {label}{required && <span className="text-[#D9772B]"> *</span>}
      </span>
      {children}
    </label>
  );
}
