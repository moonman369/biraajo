import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { api, formatApiError } from "@/lib/api";

const UPI_ID = "vidipshah14@oksbi";
const CONTACT = "+91 93313 08405";

export default function EventRegistrationModal({ event, onClose, onSuccess }) {
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    instagram_handle: "",
    menu_preference: "",
    dietary_preferences: "",
    guests: 1,
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState(null);
  const [copied, setCopied] = useState(false);

  const handle = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.menu_preference) {
      toast.error("Please pick a menu — Vegetarian or Non-Vegetarian.");
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await api.post(`/events/${event.id}/register`, {
        ...form,
        event_id: event.id,
        guests: Number(form.guests) || 1,
      });
      setConfirmation(data);
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail) || "Could not register");
    } finally {
      setSubmitting(false);
    }
  };

  const copyUpi = async () => {
    try {
      await navigator.clipboard.writeText(UPI_ID);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn("Clipboard write failed:", err);
      toast.error("Couldn't copy. Long-press the UPI ID to copy manually.");
    }
  };

  const close = () => { setConfirmation(null); onSuccess?.(); };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[90] bg-[#0A0504]/90 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-6"
        onClick={confirmation ? close : onClose}
        data-testid="event-registration-modal"
      >
        <motion.div
          initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="bg-[#140A09] border border-[#2D1D1A] w-full max-w-2xl max-h-[92vh] overflow-y-auto p-7 sm:p-12 relative"
          onClick={(e) => e.stopPropagation()}
        >
          <button onClick={confirmation ? close : onClose}
            className="absolute top-5 right-5 text-[#B5A79E] hover:text-[#F3EFE7]"
            aria-label="Close" data-testid="event-modal-close">
            <X size={22} />
          </button>

          {!confirmation && (
            <>
              <p className="text-overline">Reserve your seat</p>
              <h3 className="font-display text-3xl sm:text-4xl mt-3 text-[#F3EFE7] leading-tight">
                {event.title}
              </h3>
              <p className="mt-2 text-[#B5A79E] text-sm">
                {event.venue} · {event.time}
              </p>

              {/* Pricing strip */}
              <div className="mt-5 grid grid-cols-2 gap-px bg-[#2D1D1A] border border-[#2D1D1A]">
                <div className="bg-[#0A0504] p-4">
                  <p className="text-overline">Vegetarian</p>
                  <p className="font-display text-2xl text-[#F3EFE7] mt-1">₹2,200<span className="text-sm text-[#B5A79E]"> / person</span></p>
                </div>
                <div className="bg-[#0A0504] p-4">
                  <p className="text-overline">Non-Vegetarian</p>
                  <p className="font-display text-2xl text-[#F3EFE7] mt-1">₹2,500<span className="text-sm text-[#B5A79E]"> / person</span></p>
                </div>
              </div>

              <form onSubmit={submit} className="mt-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Name" required>
                  <input required value={form.full_name} onChange={handle("full_name")}
                    data-testid="reg-fullname-input" className={inputCls} />
                </Field>
                <Field label="Email" required>
                  <input required type="email" value={form.email} onChange={handle("email")}
                    data-testid="reg-email-input" className={inputCls} />
                </Field>
                <Field label="Contact Number (WhatsApp)" required>
                  <input required value={form.phone} onChange={handle("phone")} placeholder="+91"
                    data-testid="reg-phone-input" className={inputCls} />
                </Field>
                <Field label="Instagram handle">
                  <input value={form.instagram_handle} onChange={handle("instagram_handle")}
                    placeholder="@yourhandle" data-testid="reg-instagram-input" className={inputCls} />
                </Field>

                <div className="sm:col-span-2">
                  <span className="text-overline block mb-2">Menu Preference<span className="text-[#D9772B]"> *</span></span>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { v: "Vegetarian", price: "₹2,200" },
                      { v: "Non-Vegetarian", price: "₹2,500" },
                    ].map((o) => (
                      <button key={o.v} type="button"
                        onClick={() => setForm((f) => ({ ...f, menu_preference: o.v }))}
                        data-testid={`reg-menu-${o.v.toLowerCase()}`}
                        className={`text-left p-4 border transition-all duration-300 ${
                          form.menu_preference === o.v
                            ? "border-[#D9772B] bg-[#9C3527]/20 text-[#F3EFE7]"
                            : "border-[#2D1D1A] text-[#B5A79E] hover:border-[#9C3527] hover:text-[#F3EFE7]"
                        }`}>
                        <span className="block text-overline">{o.price}</span>
                        <span className="block font-display text-xl mt-1">{o.v}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <Field label="Number of Guests" required>
                  <input required type="number" min={1}
                    max={Math.max(1, event.seats_total - (event.seats_booked || 0))}
                    value={form.guests} onChange={handle("guests")}
                    data-testid="reg-guests-input" className={inputCls} />
                </Field>
                <Field label="Food allergies / dietary needs" required>
                  <input required value={form.dietary_preferences} onChange={handle("dietary_preferences")}
                    placeholder="None, or allergies / Jain / nuts..." data-testid="reg-dietary-input" className={inputCls} />
                </Field>

                <div className="sm:col-span-2">
                  <Field label="Anything else we should know">
                    <textarea rows={3} value={form.notes} onChange={handle("notes")}
                      data-testid="reg-notes-input"
                      className={`${inputCls} resize-none`} />
                  </Field>
                </div>

                <div className="sm:col-span-2 mt-2">
                  <button type="submit" disabled={submitting}
                    data-testid="event-registration-submit"
                    className="w-full px-6 py-4 bg-[#9C3527] text-[#F3EFE7] hover:bg-[#D9772B] hover:text-[#0A0504] transition-all duration-500 tracking-[0.18em] uppercase text-[11px] disabled:opacity-60">
                    {submitting ? "Reserving..." : "Confirm my seat"}
                  </button>
                  <p className="mt-3 text-[11px] tracking-[0.12em] text-[#B5A79E] text-center">
                    First come, first served. Our team confirms personally on WhatsApp within 24 hours.
                  </p>
                </div>
              </form>
            </>
          )}

          {confirmation && (
            <div data-testid="reg-confirmation">
              <p className="text-overline text-[#D9772B]">Reservation received</p>
              <h3 className="font-display text-4xl mt-3 text-[#F3EFE7]">Thank you, {confirmation.full_name.split(" ")[0]}.</h3>
              <p className="mt-3 text-[#B5A79E]">
                Your seat for <span className="text-[#F3EFE7]">{event.title}</span> is held. To secure it, complete the payment below — our team will confirm on WhatsApp once received.
              </p>

              <div className="mt-7 border border-[#2D1D1A] bg-[#0A0504] p-6">
                <div className="flex items-baseline justify-between">
                  <p className="text-overline">Total due</p>
                  <p className="font-display text-3xl text-[#F3EFE7]">
                    ₹{((confirmation.menu_preference === "Vegetarian" ? 2200 : 2500) * confirmation.guests).toLocaleString("en-IN")}
                  </p>
                </div>
                <p className="text-sm text-[#B5A79E] mt-1">
                  {confirmation.guests} × {confirmation.menu_preference} menu
                </p>

                <div className="mt-5 pt-5 border-t border-[#2D1D1A]">
                  <p className="text-overline mb-2">Pay via UPI</p>
                  <div className="flex items-center justify-between gap-3 bg-[#140A09] border border-[#2D1D1A] px-4 py-3">
                    <code className="text-[#F3EFE7] text-sm break-all">{UPI_ID}</code>
                    <button onClick={copyUpi} data-testid="copy-upi"
                      className="text-[#D9772B] hover:text-[#F3EFE7] flex items-center gap-1 text-xs tracking-[0.18em] uppercase">
                      {copied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy</>}
                    </button>
                  </div>
                  <p className="text-overline mt-4 text-[#B5A79E]">
                    Questions? WhatsApp {CONTACT}
                  </p>
                </div>
              </div>

              <button onClick={close}
                className="mt-7 w-full px-6 py-4 border border-[#F3EFE7]/40 text-[#F3EFE7] hover:bg-[#F3EFE7] hover:text-[#0A0504] transition-all duration-500 tracking-[0.18em] uppercase text-[11px]">
                Close
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

const inputCls =
  "w-full bg-[#0A0504] border border-[#2D1D1A] px-4 py-3 text-[#F3EFE7] focus:border-[#9C3527] outline-none";

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
