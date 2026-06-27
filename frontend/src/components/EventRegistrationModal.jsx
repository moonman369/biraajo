import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Copy, Check, Upload, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { api, formatApiError } from "@/lib/api";

const UPI_ID = "vidipshah14-1@oksbi";
const CONTACT = "+91 93313 08405";
const PAYEE_NAME = "Vidip Shah";

export default function EventRegistrationModal({ event, onClose, onSuccess }) {
  // step: "form" | "payment" | "done"
  const [step, setStep] = useState("form");
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
  const [uploading, setUploading] = useState(false);
  const [registration, setRegistration] = useState(null);
  const [copied, setCopied] = useState(false);
  const [screenshotName, setScreenshotName] = useState("");
  const fileInputRef = useRef(null);

  const handle = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const seatsLeft = Math.max(1, event.seats_total - (event.seats_booked || 0));

  const perSeat = form.menu_preference === "Vegetarian" ? 2200 : form.menu_preference === "Non-Vegetarian" ? 2500 : 0;
  const total = perSeat * (Number(form.guests) || 1);

  const submitForm = async (e) => {
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
      setRegistration(data);
      setStep("payment");
      toast.success("Details saved. Please complete the UPI payment to confirm.");
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

  const openUpi = () => {
    if (!registration) return;
    const amt = registration.total_amount || total;
    const note = `Biraajo · ${event.title}`;
    const url = `upi://pay?pa=${encodeURIComponent(UPI_ID)}&pn=${encodeURIComponent(PAYEE_NAME)}&am=${amt}&cu=INR&tn=${encodeURIComponent(note)}`;
    window.location.href = url;
  };

  const onFilePick = () => fileInputRef.current?.click();

  const onFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image (JPG or PNG).");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image too large (max 10MB).");
      return;
    }
    setScreenshotName(file.name);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      await api.post(`/registrations/${registration.id}/payment-screenshot`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setStep("done");
      toast.success("Payment confirmed. You're on the list.");
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail) || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const close = () => {
    onSuccess?.();
    onClose?.();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[90] bg-[#0A0504]/90 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-6"
        onClick={step === "form" ? onClose : undefined}
        data-testid="event-registration-modal"
      >
        <motion.div
          initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="bg-[#140A09] border border-[#2D1D1A] w-full max-w-2xl max-h-[92vh] overflow-y-auto p-7 sm:p-12 relative"
          onClick={(e) => e.stopPropagation()}
        >
          <button onClick={step === "done" ? close : onClose}
            className="absolute top-5 right-5 text-[#B5A79E] hover:text-[#F3EFE7]"
            aria-label="Close" data-testid="event-modal-close">
            <X size={22} />
          </button>

          {/* Step indicator */}
          <div className="flex items-center gap-3 mb-6">
            <Dot active={step === "form"} done={step !== "form"} label="1 · Details" testid="step-form" />
            <span className="h-px flex-1 bg-[#2D1D1A]" />
            <Dot active={step === "payment"} done={step === "done"} label="2 · Pay" testid="step-payment" />
            <span className="h-px flex-1 bg-[#2D1D1A]" />
            <Dot active={step === "done"} done={false} label="3 · Confirmed" testid="step-done" />
          </div>

          {step === "form" && (
            <>
              <p className="text-overline">Reserve your seat</p>
              <h3 className="font-display text-3xl sm:text-4xl mt-3 text-[#F3EFE7] leading-tight">
                {event.title}
              </h3>
              <p className="mt-2 text-[#B5A79E] text-sm">
                {event.venue} · {event.time}
              </p>

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

              <form onSubmit={submitForm} className="mt-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                            ? "border-[#D9772B] bg-[#5A1A1F]/20 text-[#F3EFE7]"
                            : "border-[#2D1D1A] text-[#B5A79E] hover:border-[#5A1A1F] hover:text-[#F3EFE7]"
                        }`}>
                        <span className="block text-overline">{o.price}</span>
                        <span className="block font-display text-xl mt-1">{o.v}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <Field label="Number of Guests" required>
                  <input required type="number" min={1} max={seatsLeft}
                    value={form.guests} onChange={handle("guests")}
                    data-testid="reg-guests-input" className={inputCls} />
                </Field>
                <Field label="Preferred Event Date" required>
                  <input readOnly value={`${event.date}${event.time ? ` · ${event.time}` : ""}`}
                    data-testid="reg-event-date" className={`${inputCls} cursor-not-allowed opacity-80`} />
                </Field>

                <div className="sm:col-span-2">
                  <Field label="Food allergies / dietary needs" required>
                    <input required value={form.dietary_preferences} onChange={handle("dietary_preferences")}
                      placeholder="None, or allergies / Jain / nuts..." data-testid="reg-dietary-input" className={inputCls} />
                  </Field>
                </div>

                <div className="sm:col-span-2">
                  <Field label="Anything else we should know">
                    <textarea rows={3} value={form.notes} onChange={handle("notes")}
                      data-testid="reg-notes-input"
                      className={`${inputCls} resize-none`} />
                  </Field>
                </div>

                {perSeat > 0 && (
                  <div className="sm:col-span-2 flex items-baseline justify-between border-t border-[#2D1D1A] pt-4">
                    <p className="text-overline">Total</p>
                    <p className="font-display text-3xl text-[#F3EFE7]" data-testid="reg-total">
                      ₹{total.toLocaleString("en-IN")}
                    </p>
                  </div>
                )}

                <div className="sm:col-span-2 mt-2">
                  <button type="submit" disabled={submitting}
                    data-testid="event-registration-submit"
                    className="w-full px-6 py-4 bg-[#5A1A1F] text-[#F3EFE7] hover:bg-[#D9772B] hover:text-[#0A0504] transition-all duration-500 tracking-[0.18em] uppercase text-[11px] disabled:opacity-60">
                    {submitting ? "Saving..." : "Continue to payment"}
                  </button>
                  <p className="mt-3 text-[11px] tracking-[0.12em] text-[#B5A79E] text-center">
                    Your details are saved. Payment confirms your seat. First come, first served.
                  </p>
                </div>
              </form>
            </>
          )}

          {step === "payment" && registration && (
            <div data-testid="reg-payment-step">
              <p className="text-overline text-[#D9772B]">Step 2 of 3 · Pay via UPI</p>
              <h3 className="font-display text-3xl sm:text-4xl mt-3 text-[#F3EFE7]">
                Almost there, {registration.full_name.split(" ")[0]}.
              </h3>
              <p className="mt-3 text-[#B5A79E]">
                A welcome note is on its way to <span className="text-[#F3EFE7]">{registration.email}</span>. To lock your seat for{" "}
                <span className="text-[#F3EFE7]">{event.title}</span>, complete the UPI payment below and upload the screenshot.
              </p>

              <div className="mt-7 border border-[#2D1D1A] bg-[#0A0504] p-6">
                <div className="flex items-baseline justify-between">
                  <p className="text-overline">Total due</p>
                  <p className="font-display text-3xl text-[#F3EFE7]" data-testid="payment-total">
                    ₹{Number(registration.total_amount || 0).toLocaleString("en-IN")}
                  </p>
                </div>
                <p className="text-sm text-[#B5A79E] mt-1">
                  {registration.guests} × {registration.menu_preference}
                </p>

                <div className="mt-5 pt-5 border-t border-[#2D1D1A]">
                  <p className="text-overline mb-2">UPI ID</p>
                  <div className="flex items-center justify-between gap-3 bg-[#140A09] border border-[#2D1D1A] px-4 py-3">
                    <code className="text-[#F3EFE7] text-sm break-all" data-testid="upi-id">{UPI_ID}</code>
                    <button onClick={copyUpi} data-testid="copy-upi"
                      className="text-[#D9772B] hover:text-[#F3EFE7] flex items-center gap-1 text-xs tracking-[0.18em] uppercase">
                      {copied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy</>}
                    </button>
                  </div>

                  <button onClick={openUpi} data-testid="open-upi-app"
                    className="mt-4 w-full px-6 py-4 bg-[#5A1A1F] text-[#F3EFE7] hover:bg-[#D9772B] hover:text-[#0A0504] transition-all duration-500 tracking-[0.18em] uppercase text-[11px] inline-flex items-center justify-center gap-2">
                    <Smartphone size={14} /> Open UPI app to pay
                  </button>
                  <p className="text-[11px] text-[#B5A79E] mt-2 text-center">
                    On desktop? Use any UPI app on your phone with the ID above.
                  </p>
                </div>
              </div>

              <div className="mt-6 border border-[#2D1D1A] bg-[#0A0504] p-6">
                <p className="text-overline mb-2">Step 3 · Upload payment screenshot</p>
                <p className="text-sm text-[#B5A79E] mb-4">
                  Once paid, attach the screenshot below. You&apos;ll be marked confirmed instantly.
                </p>
                <input ref={fileInputRef} type="file" accept="image/*"
                  onChange={onFileChange} className="hidden" data-testid="screenshot-file-input" />
                <button onClick={onFilePick} disabled={uploading}
                  data-testid="upload-screenshot-button"
                  className="w-full px-6 py-4 border border-[#F3EFE7]/40 text-[#F3EFE7] hover:bg-[#F3EFE7] hover:text-[#0A0504] transition-all duration-500 tracking-[0.18em] uppercase text-[11px] inline-flex items-center justify-center gap-2 disabled:opacity-60">
                  <Upload size={14} />
                  {uploading ? "Uploading..." : screenshotName ? `Replace · ${screenshotName.slice(0, 24)}` : "Choose screenshot (JPG/PNG)"}
                </button>
                <p className="text-[11px] text-[#B5A79E] mt-3 text-center">
                  Questions? WhatsApp {CONTACT}
                </p>
              </div>
            </div>
          )}

          {step === "done" && registration && (
            <div data-testid="reg-confirmation">
              <p className="text-overline text-[#D9772B]">Confirmed</p>
              <h3 className="font-display text-4xl mt-3 text-[#F3EFE7]">
                See you soon, {registration.full_name.split(" ")[0]}.
              </h3>
              <p className="mt-3 text-[#B5A79E]">
                Your seat for <span className="text-[#F3EFE7]">{event.title}</span> on{" "}
                <span className="text-[#F3EFE7]">{event.date}</span> is locked. A confirmation email is on its way.
                If anything changes, we&apos;ll reach you on WhatsApp.
              </p>

              <div className="mt-7 border border-[#2D1D1A] bg-[#0A0504] p-6 grid grid-cols-2 gap-4 text-sm">
                <Detail label="Guests" value={registration.guests} />
                <Detail label="Menu" value={registration.menu_preference} />
                <Detail label="Amount paid" value={`₹${Number(registration.total_amount || 0).toLocaleString("en-IN")}`} />
                <Detail label="Venue" value={event.venue} />
              </div>

              <button onClick={close}
                data-testid="reg-done-close"
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
  "w-full bg-[#0A0504] border border-[#2D1D1A] px-4 py-3 text-[#F3EFE7] focus:border-[#5A1A1F] outline-none";

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

function Dot({ active, done, label, testid }) {
  const color = done
    ? "bg-[#D9772B] text-[#0A0504] border-[#D9772B]"
    : active
    ? "bg-[#5A1A1F] text-[#F3EFE7] border-[#5A1A1F]"
    : "bg-transparent text-[#B5A79E] border-[#2D1D1A]";
  return (
    <span data-testid={testid}
      className={`px-3 py-1 border text-[10px] tracking-[0.22em] uppercase ${color}`}>
      {label}
    </span>
  );
}

function Detail({ label, value }) {
  return (
    <div>
      <p className="text-overline">{label}</p>
      <p className="font-display text-xl text-[#F3EFE7] mt-1">{value || "—"}</p>
    </div>
  );
}
