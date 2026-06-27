import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { api, setToken, formatApiError } from "@/lib/api";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { data } = await api.post("/auth/login", { email, password });
      setToken(data.access_token);
      toast.success(`Welcome back, ${data.user.name || "Chef"}.`);
      navigate("/admin");
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail) || "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0504] flex items-center justify-center px-6 film-grain" data-testid="admin-login-page">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md bg-[#140A09] border border-[#2D1D1A] p-10 sm:p-12"
      >
        <p className="text-overline">Biraajo Studio</p>
        <h1 className="font-display text-4xl sm:text-5xl mt-3 text-[#F3EFE7] tracking-tight">
          Welcome, <span className="italic text-[#D9772B]">Chef.</span>
        </h1>
        <p className="mt-3 text-[#B5A79E] text-sm">Sign in to manage your supper-club world.</p>

        <form onSubmit={submit} className="mt-10 space-y-5">
          <label className="block">
            <span className="text-overline block mb-2">Email</span>
            <input
              required type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              data-testid="admin-email-input"
              className="w-full bg-[#0A0504] border border-[#2D1D1A] px-4 py-3 text-[#F3EFE7] focus:border-[#5A1A1F] outline-none"
            />
          </label>
          <label className="block">
            <span className="text-overline block mb-2">Password</span>
            <input
              required type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              data-testid="admin-password-input"
              className="w-full bg-[#0A0504] border border-[#2D1D1A] px-4 py-3 text-[#F3EFE7] focus:border-[#5A1A1F] outline-none"
            />
          </label>
          <button
            type="submit" disabled={submitting}
            data-testid="admin-login-button"
            className="w-full px-6 py-4 bg-[#5A1A1F] text-[#F3EFE7] hover:bg-[#D9772B] hover:text-[#0A0504] transition-all duration-500 tracking-[0.18em] uppercase text-[11px] disabled:opacity-60"
          >
            {submitting ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <a href="/" className="block mt-8 text-overline text-[#B5A79E] hover:text-[#D9772B]">← back to site</a>
      </motion.div>
    </div>
  );
}
