import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Copy, Check, Upload, Smartphone, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { api, formatApiError } from "@/lib/api";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const UPI_ID = "vidipshah14-1@oksbi";
const PAYEE_NAME = "Vidip Shah";

export default function BookingStatus() {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const load = async () => {
    try {
      const { data } = await api.get(`/registrations/${id}/status`);
      setBooking(data);
    } catch (err) {
      setError(formatApiError(err.response?.data?.detail) || "Booking not found");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const copyUpi = async () => {
    try {
      await navigator.clipboard.writeText(UPI_ID);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy. Long-press the UPI ID to copy manually.");
    }
  };

  const openUpi = () => {
    if (!booking) return;
    const note = `Biraajo · ${booking.event.title}`;
    const url = `upi://pay?pa=${encodeURIComponent(UPI_ID)}&pn=${encodeURIComponent(PAYEE_NAME)}&am=${booking.total_amount}&cu=INR&tn=${encodeURIComponent(note)}`;
    window.location.href = url;
  };

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
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      await api.post(`/registrations/${id}/payment-screenshot`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Payment confirmed. Your seat is locked.");
      await load();
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail) || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-[#0A0504] text-[#F3EFE7] min-h-screen film-grain" data-testid="page-booking-status">
      <Navbar />

      <section className="pt-32 pb-24 sm:pt-44 sm:pb-32">
        <div className="max-w-2xl mx-auto px-6 sm:px-8">
          <Link to="/" className="text-overline inline-flex items-center gap-2 mb-10 hover:text-[#D9772B] transition-colors" data-testid="booking-back-home">
            <ArrowLeft size={14} /> back to home
          </Link>

          {loading && <p className="text-[#B5A79E]">Looking up your booking…</p>}

          {!loading && error && (
            <div data-testid="booking-not-found">
              <p className="text-overline text-[#D9772B]">We couldn&apos;t find this booking</p>
              <h1 className="font-display text-4xl mt-4 leading-tight">That link doesn&apos;t match any booking on file.</h1>
              <p className="mt-4 text-[#B5A79E]">Please check the URL from your confirmation email, or start a fresh booking from the events page.</p>
              <Link to="/#events"
                className="mt-8 inline-flex items-center justify-center px-7 py-4 bg-[#5A1A1F] text-[#F3EFE7] tracking-[0.18em] uppercase text-[11px] hover:bg-[#D9772B] hover:text-[#0A0504] transition-all duration-500">
                See upcoming events
              </Link>
            </div>
          )}

          {!loading && booking && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
              <p className="text-overline">Your booking</p>
              <h1 className="font-display text-4xl sm:text-5xl mt-4 leading-[1.05]" data-testid="booking-title">
                {booking.payment_status === "confirmed" ? (
                  <>See you soon, <span className="italic text-[#D9772B]">{booking.full_name.split(" ")[0]}.</span></>
                ) : (
                  <>Almost there, <span className="italic text-[#D9772B]">{booking.full_name.split(" ")[0]}.</span></>
                )}
              </h1>

              <div className="mt-8 border border-[#2D1D1A] bg-[#140A09]">
                <div className="p-6 border-b border-[#2D1D1A] flex items-center justify-between">
                  <div>
                    <p className="text-overline">Status</p>
                    <p className={`font-display text-2xl mt-1 ${booking.payment_status === "confirmed" ? "text-[#9FD79F]" : "text-[#D9772B]"}`} data-testid="booking-status-badge">
                      {booking.payment_status === "confirmed" ? "Confirmed" : "Pending payment"}
                    </p>
                  </div>
                  <p className="font-display text-3xl text-[#F3EFE7]" data-testid="booking-total">
                    ₹{Number(booking.total_amount).toLocaleString("en-IN")}
                  </p>
                </div>

                <div className="p-6 grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
                  <Detail label="Event" value={booking.event.title} />
                  <Detail label="When" value={`${booking.event.date} · ${booking.event.time}`} />
                  <Detail label="Where" value={booking.event.venue} />
                  <Detail label="Guests" value={booking.guests} />
                  <Detail label="Menu" value={booking.menu_preference} />
                  <Detail label="Email" value={booking.email} />
                </div>
              </div>

              {booking.payment_status === "pending" && (
                <div className="mt-8 border border-[#2D1D1A] bg-[#0A0504] p-6" data-testid="booking-pay-section">
                  <p className="text-overline text-[#D9772B]">Step 1 · Pay via UPI</p>
                  <p className="mt-2 text-[#B5A79E] text-sm">
                    Send <strong className="text-[#F3EFE7]">₹{Number(booking.total_amount).toLocaleString("en-IN")}</strong> to the UPI ID below using any UPI app.
                  </p>

                  <div className="mt-4 flex items-center justify-between gap-3 bg-[#140A09] border border-[#2D1D1A] px-4 py-3">
                    <code className="text-[#F3EFE7] text-sm break-all" data-testid="booking-upi-id">{UPI_ID}</code>
                    <button onClick={copyUpi} data-testid="booking-copy-upi"
                      className="text-[#D9772B] hover:text-[#F3EFE7] flex items-center gap-1 text-xs tracking-[0.18em] uppercase">
                      {copied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy</>}
                    </button>
                  </div>

                  <button onClick={openUpi} data-testid="booking-open-upi"
                    className="mt-4 w-full px-6 py-4 bg-[#5A1A1F] text-[#F3EFE7] hover:bg-[#D9772B] hover:text-[#0A0504] transition-all duration-500 tracking-[0.18em] uppercase text-[11px] inline-flex items-center justify-center gap-2">
                    <Smartphone size={14} /> Open UPI app to pay
                  </button>

                  <div className="mt-7 pt-6 border-t border-[#2D1D1A]">
                    <p className="text-overline text-[#D9772B]">Step 2 · Upload screenshot</p>
                    <p className="mt-2 text-[#B5A79E] text-sm">
                      Once you&apos;ve paid, attach the screenshot — you&apos;ll be confirmed instantly.
                    </p>
                    <input ref={fileInputRef} type="file" accept="image/*"
                      onChange={onFileChange} className="hidden" data-testid="booking-file-input" />
                    <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
                      data-testid="booking-upload-screenshot"
                      className="mt-4 w-full px-6 py-4 border border-[#F3EFE7]/40 text-[#F3EFE7] hover:bg-[#F3EFE7] hover:text-[#0A0504] transition-all duration-500 tracking-[0.18em] uppercase text-[11px] inline-flex items-center justify-center gap-2 disabled:opacity-60">
                      <Upload size={14} />
                      {uploading ? "Uploading…" : "Choose screenshot (JPG/PNG)"}
                    </button>
                  </div>
                </div>
              )}

              {booking.payment_status === "confirmed" && (
                <div className="mt-8 border border-[#3A7D44]/40 bg-[#3A7D44]/10 p-6" data-testid="booking-confirmed-block">
                  <p className="text-overline text-[#9FD79F]">All set</p>
                  <p className="mt-2 text-[#F3EFE7]">
                    Your seat is locked. If anything changes between now and the evening, we&apos;ll reach you on WhatsApp.
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div>
      <p className="text-overline">{label}</p>
      <p className="font-display text-lg text-[#F3EFE7] mt-1">{value || "—"}</p>
    </div>
  );
}
