import { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Calendar, Users, Mail, MessageSquare, LogOut, Plus, Trash2, Download, Edit2, Edit3, BarChart3, Eye, Smartphone, Monitor, Tablet, Archive } from "lucide-react";
import { api, clearToken, formatApiError } from "@/lib/api";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "traffic", label: "Traffic" },
  { id: "events", label: "Events" },
  { id: "registrations", label: "Registrations" },
  { id: "offsite", label: "Off-site sales" },
  { id: "menu", label: "Menu" },
  { id: "newsletter", label: "Newsletter" },
  { id: "contacts", label: "Messages" },
  { id: "gallery", label: "Gallery" },
];

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function AdminDashboard() {
  const [tab, setTab] = useState("overview");
  const navigate = useNavigate();

  const logout = () => {
    clearToken();
    navigate("/admin/login");
  };

  return (
    <div className="min-h-screen bg-[#0A0504] text-[#F3EFE7] film-grain" data-testid="admin-dashboard">
      <header className="border-b border-[#2D1D1A] bg-[#0A0504]/90 backdrop-blur-xl sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-5 flex items-center justify-between gap-6 flex-wrap">
          <div>
            <p className="text-overline text-[#D9772B]">Biraajo Studio</p>
            <h1 className="font-display text-2xl mt-1">Admin · Vidip Shah</h1>
          </div>
          <nav className="flex flex-wrap gap-1">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                data-testid={`admin-tab-${t.id}`}
                className={`px-4 py-2 text-[11px] tracking-[0.22em] uppercase border transition-all ${
                  tab === t.id
                    ? "bg-[#5A1A1F] border-[#5A1A1F] text-[#F3EFE7]"
                    : "bg-transparent border-[#2D1D1A] text-[#B5A79E] hover:text-[#F3EFE7] hover:border-[#5A1A1F]"
                }`}
              >
                {t.label}
              </button>
            ))}
            <Link
              to="/admin/edit"
              data-testid="admin-tab-edit-website"
              className="px-4 py-2 text-[11px] tracking-[0.22em] uppercase border border-[#D9772B] text-[#D9772B] hover:bg-[#D9772B] hover:text-[#0A0504] inline-flex items-center gap-2"
            >
              <Edit3 size={14} /> Edit Website
            </Link>
            <button
              onClick={logout}
              data-testid="admin-logout"
              className="ml-2 px-4 py-2 text-[11px] tracking-[0.22em] uppercase border border-[#2D1D1A] text-[#B5A79E] hover:text-[#F3EFE7] hover:border-[#D9772B] inline-flex items-center gap-2"
            >
              <LogOut size={14} /> Logout
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 lg:px-10 py-10">
        {tab === "overview" && <Overview />}
        {tab === "traffic" && <Traffic />}
        {tab === "events" && <Events />}
        {tab === "registrations" && <Registrations />}
        {tab === "offsite" && <OffsiteSales />}
        {tab === "menu" && <MenuAdmin />}
        {tab === "newsletter" && <Subscribers />}
        {tab === "contacts" && <ContactMessages />}
        {tab === "gallery" && <GalleryAdmin />}
      </main>
    </div>
  );
}

function Overview() {
  const [stats, setStats] = useState(null);
  const [regsOpen, setRegsOpen] = useState(null);
  const [savingToggle, setSavingToggle] = useState(false);
  const [prices, setPrices] = useState(null);
  const [savingPrice, setSavingPrice] = useState(false);

  useEffect(() => {
    api.get("/stats").then((r) => setStats(r.data)).catch(() => {});
    api.get("/settings").then((r) => {
      setRegsOpen(r.data?.registrations_open !== false);
      setPrices({ price_veg: r.data?.price_veg ?? 2500, price_nonveg: r.data?.price_nonveg ?? 2800 });
    }).catch(() => {});
  }, []);

  const savePrices = async () => {
    setSavingPrice(true);
    try {
      const res = await api.put("/admin/settings", {
        price_veg: Number(prices.price_veg),
        price_nonveg: Number(prices.price_nonveg),
      });
      setPrices({ price_veg: res.data.price_veg, price_nonveg: res.data.price_nonveg });
      toast.success("Menu prices updated — live on the site now.");
    } catch {
      toast.error("Could not save prices");
    } finally {
      setSavingPrice(false);
    }
  };

  const toggleRegs = async () => {
    setSavingToggle(true);
    try {
      const next = !regsOpen;
      await api.put("/admin/settings", { registrations_open: next });
      setRegsOpen(next);
      toast.success(next ? "Reservations are now OPEN on the site." : "Reservations are now CLOSED on the site.");
    } catch {
      toast.error("Could not save the setting");
    } finally {
      setSavingToggle(false);
    }
  };

  if (!stats) return <p className="text-[#B5A79E]">Loading...</p>;
  const cards = [
    { label: "Total Events", value: stats.total_events, icon: Calendar },
    { label: "Upcoming", value: stats.upcoming_events, icon: Calendar },
    { label: "Registrations", value: stats.total_registrations, icon: Users },
    { label: "Confirmed", value: stats.confirmed_registrations ?? 0, icon: Users },
    { label: "Pending", value: stats.pending_registrations ?? 0, icon: Users },
    { label: "Revenue", value: `₹${Number(stats.revenue ?? 0).toLocaleString("en-IN")}`, icon: Users },
    { label: "Subscribers", value: stats.total_subscribers, icon: Mail },
    { label: "Messages", value: stats.total_contacts, icon: MessageSquare },
  ];
  return (
    <div>
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <h2 className="font-display text-4xl">At a glance</h2>
        {regsOpen !== null && (
          <div className="flex items-center gap-4 border border-[#2D1D1A] bg-[#140A09] px-5 py-3" data-testid="registrations-toggle-wrap">
            <div className="text-right">
              <p className="text-[10px] tracking-[0.22em] uppercase text-[#B5A79E]">Site reservations</p>
              <p className={`font-display text-lg ${regsOpen ? "text-[#9FD79F]" : "text-[#D9772B]"}`}>
                {regsOpen ? "OPEN — accepting" : "CLOSED — not accepting"}
              </p>
            </div>
            <button
              onClick={toggleRegs}
              disabled={savingToggle}
              data-testid="registrations-toggle"
              className={`relative w-14 h-7 rounded-full transition-colors ${regsOpen ? "bg-[#3A7D44]" : "bg-[#5A1A1F]"} disabled:opacity-50`}
              aria-pressed={regsOpen}
              aria-label="Toggle reservations"
            >
              <span className={`absolute top-1 ${regsOpen ? "left-8" : "left-1"} w-5 h-5 bg-[#F3EFE7] rounded-full transition-all`} />
            </button>
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-[#2D1D1A]">
        {cards.map((c) => (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#140A09] p-7"
            data-testid={`stat-${c.label.toLowerCase().replace(/\s/g, "-")}`}
          >
            <c.icon size={20} className="text-[#D9772B]" />
            <p className="font-display text-4xl mt-4">{c.value}</p>
            <p className="text-overline mt-3 text-[#B5A79E]">{c.label}</p>
          </motion.div>
        ))}
      </div>
      {prices && (
        <div className="mt-8 bg-[#140A09] border border-[#2D1D1A] p-7" data-testid="pricing-editor">
          <p className="text-overline text-[#D9772B] mb-1">Menu pricing — per seat</p>
          <p className="text-[12px] text-[#B5A79E] mb-6">Set the price for each menu. Changes go live on the site immediately.</p>
          <div className="flex items-end gap-6 flex-wrap">
            <label className="block">
              <span className="text-[10px] tracking-[0.22em] uppercase text-[#B5A79E]">Vegetarian ₹</span>
              <input
                type="number" min="0" value={prices.price_veg}
                onChange={(e) => setPrices((p) => ({ ...p, price_veg: e.target.value }))}
                data-testid="price-veg-input"
                className="mt-2 w-44 bg-[#0A0504] border border-[#2D1D1A] px-4 py-3 text-[#F3EFE7] font-display text-2xl focus:border-[#5A1A1F] outline-none"
              />
            </label>
            <label className="block">
              <span className="text-[10px] tracking-[0.22em] uppercase text-[#B5A79E]">Non-vegetarian ₹</span>
              <input
                type="number" min="0" value={prices.price_nonveg}
                onChange={(e) => setPrices((p) => ({ ...p, price_nonveg: e.target.value }))}
                data-testid="price-nonveg-input"
                className="mt-2 w-44 bg-[#0A0504] border border-[#2D1D1A] px-4 py-3 text-[#F3EFE7] font-display text-2xl focus:border-[#5A1A1F] outline-none"
              />
            </label>
            <button
              onClick={savePrices} disabled={savingPrice}
              data-testid="price-save-button"
              className="px-6 py-3 bg-[#5A1A1F] hover:bg-[#D9772B] hover:text-[#0A0504] text-[11px] tracking-[0.22em] uppercase transition-colors disabled:opacity-50"
            >
              {savingPrice ? "Saving…" : "Save prices"}
            </button>
          </div>
        </div>
      )}
      <p className="mt-10 text-[#B5A79E] max-w-2xl">
        Manage events, view registrations, export your guest list, curate the
        gallery and read every message — all from here.
      </p>
    </div>
  );
}

const PAGE_NAMES = {
  "/": "Home",
  "/about-the-chef": "About the Chef",
  "/suppers": "Suppers",
  "/menus": "Menus",
  "/menus/naani-ghar": "Menu · Naani Ghar",
  "/menus/barsaat": "Menu · Barsaat",
  "/supper-club/naani-ghar": "Naani Ghar",
  "/supper-club/barsaat": "Barsaat",
};
const prettyPage = (p) => PAGE_NAMES[p] || (p.startsWith("/booking/") ? "Booking status" : p);

const DEVICE_META = {
  mobile: { label: "Mobile", icon: Smartphone },
  desktop: { label: "Desktop", icon: Monitor },
  tablet: { label: "Tablet", icon: Tablet },
};

function BarList({ rows, total, testid, labelFn }) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  if (!rows.length) return <p className="text-[#6E625B] text-sm">No data yet.</p>;
  return (
    <div className="space-y-3" data-testid={testid}>
      {rows.map((r) => (
        <div key={r.label}>
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-[#F3EFE7] truncate pr-3">{labelFn ? labelFn(r.label) : r.label}</span>
            <span className="text-[#B5A79E] tabular-nums">
              {r.count}
              {total ? <span className="text-[#6E625B]"> · {Math.round((r.count / total) * 100)}%</span> : null}
            </span>
          </div>
          <div className="h-1.5 bg-[#2D1D1A]">
            <div className="h-full bg-[#D9772B]" style={{ width: `${(r.count / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function Traffic() {
  const [range, setRange] = useState(7);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get(`/analytics/summary?days=${range}`)
      .then((r) => setData(r.data))
      .catch(() => toast.error("Could not load traffic data"))
      .finally(() => setLoading(false));
  }, [range]);

  if (loading && !data) return <p className="text-[#B5A79E]">Loading traffic…</p>;
  if (!data) return null;

  const maxDaily = Math.max(1, ...data.daily.map((d) => d.views));
  const cards = [
    { label: "Visitors today", value: data.visitors_today, icon: Users },
    { label: "Views today", value: data.views_today, icon: Eye },
    { label: `Unique visitors · ${range}d`, value: data.unique_visitors, icon: Users },
    { label: `Page views · ${range}d`, value: data.total_views, icon: BarChart3 },
  ];
  const deviceRows = Object.entries(data.devices || {}).map(([k, v]) => ({ label: k, count: v }));
  const deviceTotal = deviceRows.reduce((a, b) => a + b.count, 0);

  return (
    <div data-testid="traffic-panel">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <h2 className="font-display text-4xl">Website traffic</h2>
        <div className="flex gap-1" data-testid="traffic-range">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setRange(d)}
              data-testid={`traffic-range-${d}`}
              className={`px-4 py-2 text-[11px] tracking-[0.22em] uppercase border transition-all ${
                range === d
                  ? "bg-[#5A1A1F] border-[#5A1A1F] text-[#F3EFE7]"
                  : "bg-transparent border-[#2D1D1A] text-[#B5A79E] hover:border-[#5A1A1F]"
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-[#2D1D1A]">
        {cards.map((c) => (
          <div key={c.label} className="bg-[#140A09] p-7" data-testid={`traffic-stat-${c.label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+$/, "")}`}>
            <c.icon size={20} className="text-[#D9772B]" />
            <p className="font-display text-4xl mt-4">{c.value}</p>
            <p className="text-overline mt-3 text-[#B5A79E]">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Daily trend */}
      <div className="mt-px bg-[#140A09] p-7">
        <p className="text-overline text-[#B5A79E] mb-6">Daily page views</p>
        {data.total_views === 0 ? (
          <p className="text-[#6E625B] text-sm">No visits recorded yet in this range. Data appears as people visit your site.</p>
        ) : (
          <div className="flex items-end gap-1 h-40" data-testid="traffic-daily-chart">
            {data.daily.map((d) => (
              <div key={d.date} className="flex-1 flex flex-col items-center justify-end group" title={`${d.date}: ${d.views} views, ${d.visitors} visitors`}>
                <div
                  className="w-full bg-[#D9772B] group-hover:bg-[#e8873a] transition-colors min-h-[2px]"
                  style={{ height: `${(d.views / maxDaily) * 100}%` }}
                />
              </div>
            ))}
          </div>
        )}
        {data.total_views > 0 && (
          <div className="flex justify-between mt-3 text-[10px] text-[#6E625B]">
            <span>{data.daily[0]?.date}</span>
            <span>{data.daily[data.daily.length - 1]?.date}</span>
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-px bg-[#2D1D1A] mt-px">
        <div className="bg-[#140A09] p-7">
          <p className="text-overline text-[#B5A79E] mb-6">Top pages</p>
          <BarList rows={data.top_pages} total={data.total_views} testid="traffic-top-pages" labelFn={prettyPage} />
        </div>
        <div className="bg-[#140A09] p-7">
          <p className="text-overline text-[#B5A79E] mb-6">Where visitors come from</p>
          <BarList rows={data.referrers} total={data.total_views} testid="traffic-referrers" />
        </div>
        <div className="bg-[#140A09] p-7">
          <p className="text-overline text-[#B5A79E] mb-6">Devices</p>
          {deviceRows.length === 0 ? (
            <p className="text-[#6E625B] text-sm">No data yet.</p>
          ) : (
            <div className="space-y-4" data-testid="traffic-devices">
              {deviceRows.map((r) => {
                const meta = DEVICE_META[r.label] || { label: r.label, icon: Monitor };
                return (
                  <div key={r.label} className="flex items-center gap-4">
                    <meta.icon size={22} className="text-[#D9772B] shrink-0" />
                    <div className="flex-1">
                      <div className="flex justify-between text-sm mb-1">
                        <span>{meta.label}</span>
                        <span className="text-[#B5A79E] tabular-nums">{deviceTotal ? Math.round((r.count / deviceTotal) * 100) : 0}%</span>
                      </div>
                      <div className="h-1.5 bg-[#2D1D1A]">
                        <div className="h-full bg-[#D9772B]" style={{ width: `${deviceTotal ? (r.count / deviceTotal) * 100 : 0}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <p className="mt-10 text-[#6E625B] text-sm max-w-2xl">
        Privacy-friendly analytics — no cookies, no personal data. Counts began when this feature was installed, so historical traffic from before then isn't shown.
      </p>
    </div>
  );
}

function emptyEvent() {
  return {
    title: "", date: "", time: "19:30", venue: "", description: "",
    price: 3500, seats_total: 8, image_url: "", tag: "Supper Club",
  };
}

function Events() {
  const [events, setEvents] = useState([]);
  const [editing, setEditing] = useState(null);

  const load = () => api.get("/events").then((r) => {
    const sorted = [...(r.data || [])].sort((a, b) => (b.date || "").localeCompare(a.date || ""));
    setEvents(sorted);
  });
  useEffect(() => { load(); }, []);

  const save = async (ev) => {
    try {
      if (ev.id) {
        await api.put(`/events/${ev.id}`, ev);
        toast.success("Event updated");
      } else {
        await api.post("/events", ev);
        toast.success("Event created");
      }
      setEditing(null); load();
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail) || "Save failed");
    }
  };
  const del = async (id) => {
    if (!window.confirm("Delete this event and all its registrations?")) return;
    await api.delete(`/events/${id}`);
    toast.success("Event deleted"); load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <h2 className="font-display text-4xl">Events</h2>
        <button
          onClick={() => setEditing(emptyEvent())}
          data-testid="admin-create-event-button"
          className="px-5 py-3 bg-[#5A1A1F] hover:bg-[#D9772B] hover:text-[#0A0504] text-[11px] tracking-[0.22em] uppercase inline-flex items-center gap-2 transition-all"
        >
          <Plus size={14} /> New event
        </button>
      </div>

      {editing && (
        <EventForm
          event={editing}
          onCancel={() => setEditing(null)}
          onSave={save}
        />
      )}

      {(() => {
        const yaadein = events.filter((e) => e.coming_soon);
        const regular = events.filter((e) => !e.coming_soon);
        return (
          <>
            {yaadein.length > 0 && (
              <div className="bg-[#140A09] border border-[#2D1D1A] p-6 mt-6" data-testid="admin-yaadein-group">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <p className="text-overline text-[#D9772B]">Yaadein</p>
                    <h3 className="font-display text-2xl mt-1">Next series · {yaadein.length} dates</h3>
                  </div>
                  <span className="text-[11px] tracking-[0.22em] uppercase text-[#6E625B]">Coming soon</span>
                </div>
                <div className="mt-5 divide-y divide-[#2D1D1A] border-t border-[#2D1D1A]">
                  {yaadein.map((ev) => (
                    <div key={ev.id} className="flex items-center justify-between gap-4 py-3 flex-wrap" data-testid={`admin-event-row-${ev.id}`}>
                      <div className="min-w-0">
                        <p className="text-sm text-[#F3EFE7] truncate">{ev.title}</p>
                        <p className="text-xs text-[#B5A79E] mt-1">{ev.date} · {ev.time} · {ev.venue}</p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button onClick={() => setEditing(ev)} className="px-3 py-2 border border-[#2D1D1A] text-xs inline-flex items-center gap-2 hover:border-[#D9772B]">
                          <Edit2 size={12} /> Edit
                        </button>
                        <button onClick={() => del(ev.id)} data-testid={`delete-event-${ev.id}`} className="px-3 py-2 border border-[#2D1D1A] text-xs inline-flex items-center gap-2 hover:border-[#D94A3D] hover:text-[#D94A3D]">
                          <Trash2 size={12} /> Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-[#2D1D1A] mt-6">
              {events.length === 0 && (
                <p className="bg-[#140A09] p-8 text-[#B5A79E] md:col-span-3">No events yet. Create your first supper.</p>
              )}
              {regular.map((ev) => (
                <div key={ev.id} className="bg-[#140A09] p-6" data-testid={`admin-event-row-${ev.id}`}>
                  <p className="text-overline text-[#D9772B]">{ev.tag}</p>
                  <h3 className="font-display text-2xl mt-2">{ev.title}</h3>
                  <p className="text-sm text-[#B5A79E] mt-2">{ev.date} · {ev.time} · {ev.venue}</p>
                  <p className="text-sm text-[#B5A79E] mt-3">
                    {ev.seats_booked || 0} / {ev.seats_total} booked · ₹{ev.price}
                  </p>
                  <div className="mt-4 flex gap-2">
                    <button onClick={() => setEditing(ev)} className="px-3 py-2 border border-[#2D1D1A] text-xs inline-flex items-center gap-2 hover:border-[#D9772B]">
                      <Edit2 size={12} /> Edit
                    </button>
                    <button onClick={() => del(ev.id)} data-testid={`delete-event-${ev.id}`} className="px-3 py-2 border border-[#2D1D1A] text-xs inline-flex items-center gap-2 hover:border-[#D94A3D] hover:text-[#D94A3D]">
                      <Trash2 size={12} /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        );
      })()}
    </div>
  );
}

function EventForm({ event, onCancel, onSave }) {
  const [f, setF] = useState(event);
  const [uploading, setUploading] = useState(false);
  const h = (k) => (e) => setF((v) => ({ ...v, [k]: e.target.value }));

  const onPickImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await api.post("/admin/media", fd);
      setF((v) => ({ ...v, image_url: res.data.url }));
      toast.success("Thumbnail uploaded — remember to save the event.");
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail) || "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); onSave({ ...f, price: Number(f.price) || 0, seats_total: Number(f.seats_total) || 1 }); }}
      className="bg-[#140A09] border border-[#2D1D1A] p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-2 gap-4"
    >
      <Inp label="Title" value={f.title} onChange={h("title")} required />
      <Inp label="Tag" value={f.tag || ""} onChange={h("tag")} />
      <Inp label="Date" type="date" value={f.date} onChange={h("date")} required />
      <Inp label="Time" value={f.time} onChange={h("time")} placeholder="19:30" required />
      <Inp label="Venue" value={f.venue} onChange={h("venue")} required />
      <Inp label="Price (INR)" type="number" value={f.price} onChange={h("price")} />
      <Inp label="Seats total (fixed at 10)" type="number" value={10} readOnly disabled data-testid="event-seats-total-input" />
      <Inp label="Image URL" value={f.image_url} onChange={h("image_url")} />

      <div className="sm:col-span-2">
        <span className="text-overline block mb-2">Thumbnail image</span>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="w-28 h-20 bg-[#0A0504] border border-[#2D1D1A] overflow-hidden shrink-0">
            {f.image_url ? (
              <img src={f.image_url} alt="thumbnail preview" className="w-full h-full object-cover" data-testid="event-image-preview" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[10px] text-[#6E625B] uppercase tracking-widest">No image</div>
            )}
          </div>
          <label className={`px-5 py-3 border border-[#D9772B] text-[#D9772B] text-[11px] tracking-[0.22em] uppercase cursor-pointer hover:bg-[#D9772B] hover:text-[#0A0504] transition-all ${uploading ? "opacity-60 pointer-events-none" : ""}`}>
            {uploading ? "Uploading…" : "Upload from device"}
            <input type="file" accept="image/*" onChange={onPickImage} className="hidden" data-testid="event-image-upload-input" />
          </label>
        </div>
        <p className="text-[11px] text-[#6E625B] mt-2">Upload a new thumbnail from your device, or paste a URL above. Changes go live once you save the event.</p>
      </div>

      <div className="sm:col-span-2">
        <span className="text-overline block mb-2">Description</span>
        <textarea
          rows={4} value={f.description} onChange={h("description")} required
          className="w-full bg-[#0A0504] border border-[#2D1D1A] px-4 py-3 text-[#F3EFE7] focus:border-[#5A1A1F] outline-none"
        />
      </div>
      <div className="sm:col-span-2 flex gap-3">
        <button type="submit" data-testid="admin-event-save" className="px-6 py-3 bg-[#5A1A1F] hover:bg-[#D9772B] hover:text-[#0A0504] text-[11px] tracking-[0.22em] uppercase">Save event</button>
        <button type="button" onClick={onCancel} className="px-6 py-3 border border-[#2D1D1A] text-[11px] tracking-[0.22em] uppercase text-[#B5A79E] hover:text-[#F3EFE7]">Cancel</button>
      </div>
    </form>
  );
}

function Inp({ label, ...props }) {
  return (
    <label className="block">
      <span className="text-overline block mb-2">{label}</span>
      <input
        {...props}
        className="w-full bg-[#0A0504] border border-[#2D1D1A] px-4 py-3 text-[#F3EFE7] focus:border-[#5A1A1F] outline-none"
      />
    </label>
  );
}

function downloadFromApi(path, filename) {
  const token = localStorage.getItem("biraajo_admin_token");
  fetch(`${BACKEND_URL}/api${path}`, { headers: { Authorization: `Bearer ${token}` } })
    .then((r) => r.blob())
    .then((blob) => {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob); a.download = filename; a.click();
    });
}

function Registrations() {
  const [rows, setRows] = useState([]);
  const [events, setEvents] = useState([]);
  const [eventId, setEventId] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [viewing, setViewing] = useState(null); // {id, blobUrl}
  const [sendingId, setSendingId] = useState(null);
  const [archived, setArchived] = useState([]);
  const [showArchived, setShowArchived] = useState(false);

  useEffect(() => { api.get("/events").then((r) => setEvents(r.data)); }, []);

  const load = () => {
    const params = {};
    if (eventId) params.event_id = eventId;
    const regParams = { ...params };
    if (statusFilter) regParams.payment_status = statusFilter;
    Promise.all([
      api.get("/registrations", { params: regParams }),
      statusFilter === "pending"
        ? Promise.resolve({ data: [] })
        : api.get("/admin/offsite-bookings", { params }),
    ]).then(([regRes, offRes]) => {
      const direct = (regRes.data || []).map((r) => ({ ...r, is_offsite: false }));
      const offsite = (offRes.data || []).map((b) => ({
        ...b,
        is_offsite: true,
        payment_status: "offsite",
        email: b.contact || "",
        phone: "",
        instagram_handle: "",
        dietary_preferences: "",
        total_amount: 0,
      }));
      const merged = [...direct, ...offsite].sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );
      setRows(merged);
    });
  };
  const loadArchived = () => api.get("/registrations/archived").then((r) => setArchived(r.data)).catch(() => {});
  useEffect(load, [eventId, statusFilter]);
  useEffect(() => { loadArchived(); }, []);

  const restore = async (r) => {
    try {
      await api.post(`/registrations/${r.id}/restore`);
      toast.success(`Restored ${r.full_name}'s registration`);
      load(); loadArchived();
    } catch {
      toast.error("Could not restore this registration");
    }
  };

  const titleOf = (id) => events.find((e) => e.id === id)?.title || id;

  const viewScreenshot = async (reg) => {
    try {
      const token = localStorage.getItem("biraajo_admin_token");
      const res = await fetch(`${BACKEND_URL}/api/registrations/${reg.id}/screenshot`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Not available");
      const blob = await res.blob();
      setViewing({ id: reg.id, blobUrl: URL.createObjectURL(blob), name: reg.full_name });
    } catch {
      toast.error("Screenshot not available");
    }
  };

  const closeViewer = () => {
    if (viewing?.blobUrl) URL.revokeObjectURL(viewing.blobUrl);
    setViewing(null);
  };

  const remind = (r) => {
    const phone = (r.phone || "").replace(/\D/g, "");
    if (!phone) { toast.error("No phone on file"); return; }
    const msg = encodeURIComponent(
      `Hi ${r.full_name.split(" ")[0]}, just a gentle nudge — your Biraajo seat for "${titleOf(r.event_id)}" is held but payment is pending. Pay ₹${Number(r.total_amount || 0).toLocaleString("en-IN")} to UPI: vidipshah14-1@oksbi and reply with the screenshot to lock it. — Biraajo`
    );
    window.open(`https://wa.me/${phone}?text=${msg}`, "_blank");
  };

  const sendConfirmation = async (r) => {
    if (!window.confirm(`Send the booking confirmation email (with date, time & address) to ${r.full_name} at ${r.email}?`)) return;
    setSendingId(r.id);
    try {
      const res = await api.post(`/registrations/${r.id}/send-confirmation`);
      toast.success(`Confirmation email sent to ${res.data.sent_to}`);
      load();
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail) || "Could not send email");
    } finally {
      setSendingId(null);
    }
  };

  const del = async (r) => {
    const isOff = r.is_offsite;
    if (!window.confirm(`Delete ${isOff ? "off-site booking" : "registration"} for ${r.full_name}? This releases the seats.`)) return;
    await api.delete(isOff ? `/admin/offsite-bookings/${r.id}` : `/registrations/${r.id}`);
    toast.success("Deleted");
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <h2 className="font-display text-4xl">Registrations</h2>
        <div className="flex gap-3 items-center flex-wrap">
          <button
            onClick={() => {
              const pending = rows.filter((r) => r.payment_status === "pending");
              if (pending.length === 0) { toast.info("No pending guests right now."); return; }
              if (!window.confirm(`Open ${pending.length} WhatsApp tab(s) to nudge every pending guest?`)) return;
              pending.forEach((r) => {
                const phone = (r.phone || "").replace(/\D/g, "");
                if (!phone) return;
                const msg = encodeURIComponent(
                  `Hi ${r.full_name.split(" ")[0]}, gentle nudge — your Biraajo seat for "${titleOf(r.event_id)}" is held but payment is pending. Pay ₹${Number(r.total_amount || 0).toLocaleString("en-IN")} to UPI: vidipshah14-1@oksbi and reply with the screenshot to lock it. — Biraajo`
                );
                window.open(`https://wa.me/${phone}?text=${msg}`, "_blank");
              });
              toast.success(`Opened ${pending.length} WhatsApp tab(s).`);
            }}
            data-testid="nudge-all-pending"
            className="px-4 py-3 border border-[#D9772B] text-[11px] tracking-[0.22em] uppercase text-[#D9772B] hover:bg-[#D9772B] hover:text-[#0A0504] transition-all"
          >
            Nudge all pending
          </button>
          <select
            value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            data-testid="reg-filter-status"
            className="bg-[#0A0504] border border-[#2D1D1A] px-4 py-3 text-sm text-[#F3EFE7]"
          >
            <option value="">All payments</option>
            <option value="confirmed">Confirmed</option>
            <option value="pending">Pending</option>
          </select>
          <select
            value={eventId} onChange={(e) => setEventId(e.target.value)}
            data-testid="reg-filter-event"
            className="bg-[#0A0504] border border-[#2D1D1A] px-4 py-3 text-sm text-[#F3EFE7]"
          >
            <option value="">All events</option>
            {events.map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}
          </select>
          <button
            onClick={() => {
              const qs = new URLSearchParams();
              if (eventId) qs.set("event_id", eventId);
              if (statusFilter) qs.set("payment_status", statusFilter);
              downloadFromApi(`/registrations/export${qs.toString() ? `?${qs}` : ""}`, "registrations.csv");
            }}
            data-testid="reg-export-csv"
            className="px-4 py-3 border border-[#2D1D1A] text-[11px] tracking-[0.22em] uppercase inline-flex items-center gap-2 hover:border-[#D9772B]"
          >
            <Download size={14} /> Export CSV
          </button>
          <button
            onClick={() => setShowArchived((s) => !s)}
            data-testid="toggle-archived"
            className={`px-4 py-3 text-[11px] tracking-[0.22em] uppercase border inline-flex items-center gap-2 transition-all ${showArchived ? "bg-[#5A1A1F] border-[#5A1A1F] text-[#F3EFE7]" : "border-[#2D1D1A] text-[#B5A79E] hover:border-[#D9772B]"}`}
          >
            <Archive size={14} /> Archived {archived.length ? `(${archived.length})` : ""}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto bg-[#140A09] border border-[#2D1D1A]">
        <table className="w-full text-sm">
          <thead className="bg-[#0A0504] text-overline">
            <tr>
              <Th>Status</Th><Th>Event</Th><Th>Name</Th><Th>Email</Th><Th>Phone</Th>
              <Th>Instagram</Th><Th>Menu</Th><Th>Guests</Th><Th>Total</Th><Th>Dietary</Th>
              <Th>Submitted</Th><Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={12} className="p-8 text-center text-[#B5A79E]">No registrations match.</td></tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-[#2D1D1A]" data-testid={`reg-row-${r.id}`}>
                <Td>{r.is_offsite ? <OffsiteBadge /> : <PaymentBadge status={r.payment_status} />}</Td>
                <Td>{titleOf(r.event_id)}</Td>
                <Td>
                  {r.full_name}
                  {r.is_offsite && r.source ? (
                    <span className="block text-[10px] text-[#B5A79E] tracking-wide">via {r.source}</span>
                  ) : null}
                </Td>
                <Td>{r.email}</Td>
                <Td>{r.phone}</Td>
                <Td>{r.instagram_handle}</Td>
                <Td>{r.menu_preference}</Td>
                <Td>{r.guests}</Td>
                <Td>{r.is_offsite ? "—" : `₹${Number(r.total_amount || 0).toLocaleString("en-IN")}`}</Td>
                <Td>{r.dietary_preferences}</Td>
                <Td>{new Date(r.created_at).toLocaleDateString()}</Td>
                <Td>
                  <div className="flex gap-2 flex-wrap">
                    {!r.is_offsite && (
                      <button
                        onClick={() => sendConfirmation(r)}
                        disabled={sendingId === r.id}
                        data-testid={`send-confirmation-${r.id}`}
                        className={`px-2 py-1 border text-[10px] tracking-[0.18em] uppercase transition-all disabled:opacity-50 ${r.confirmation_email_sent ? "border-[#3A7D44] text-[#9FD79F]" : "border-[#5B7B9A] text-[#A9C6DE] hover:bg-[#5B7B9A] hover:text-[#0A0504]"}`}
                      >
                        {sendingId === r.id ? "Sending…" : r.confirmation_email_sent ? "✓ Resend confirmation" : "Send confirmation"}
                      </button>
                    )}
                    {r.payment_status === "confirmed" && r.payment_screenshot_path && (
                      <button onClick={() => viewScreenshot(r)} data-testid={`view-screenshot-${r.id}`}
                        className="px-2 py-1 border border-[#2D1D1A] text-[10px] tracking-[0.18em] uppercase hover:border-[#D9772B]">
                        Receipt
                      </button>
                    )}
                    {r.payment_status === "pending" && (
                      <button onClick={() => remind(r)} data-testid={`remind-${r.id}`}
                        className="px-2 py-1 border border-[#D9772B] text-[10px] tracking-[0.18em] uppercase text-[#D9772B] hover:bg-[#D9772B] hover:text-[#0A0504]">
                        Nudge
                      </button>
                    )}
                    <button onClick={() => del(r)} data-testid={`delete-reg-${r.id}`}
                      className="px-2 py-1 border border-[#2D1D1A] text-[10px] tracking-[0.18em] uppercase hover:border-[#D94A3D] hover:text-[#D94A3D]">
                      Del
                    </button>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showArchived && (
        <div className="mt-8" data-testid="archived-panel">
          <div className="flex items-center gap-3 mb-3 flex-wrap">
            <h3 className="font-display text-2xl">Archived registrations</h3>
            <span className="text-[11px] text-[#B5A79E]">Recoverable — deleting an event or a booking now moves guests here instead of erasing them.</span>
          </div>
          <div className="overflow-x-auto bg-[#140A09] border border-[#2D1D1A]">
            <table className="w-full text-sm">
              <thead className="bg-[#0A0504] text-overline">
                <tr>
                  <Th>Name</Th><Th>Email</Th><Th>Phone</Th><Th>Guests</Th><Th>Total</Th>
                  <Th>Reason</Th><Th>Archived on</Th><Th>Actions</Th>
                </tr>
              </thead>
              <tbody>
                {archived.length === 0 && (
                  <tr><td colSpan={8} className="p-8 text-center text-[#B5A79E]">No archived registrations — nothing has been lost.</td></tr>
                )}
                {archived.map((r) => (
                  <tr key={r.id} className="border-t border-[#2D1D1A]" data-testid={`archived-row-${r.id}`}>
                    <Td>{r.full_name}</Td>
                    <Td>{r.email}</Td>
                    <Td>{r.phone}</Td>
                    <Td>{r.guests}</Td>
                    <Td>₹{Number(r.total_amount || 0).toLocaleString("en-IN")}</Td>
                    <Td>{r.archive_reason}</Td>
                    <Td>{r.archived_at ? new Date(r.archived_at).toLocaleDateString() : "—"}</Td>
                    <Td>
                      <button onClick={() => restore(r)} data-testid={`restore-reg-${r.id}`}
                        className="px-3 py-1 border border-[#3A7D44] text-[10px] tracking-[0.18em] uppercase text-[#9FD79F] hover:bg-[#3A7D44] hover:text-[#0A0504]">
                        Restore
                      </button>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {viewing && (
        <div className="fixed inset-0 z-[100] bg-[#0A0504]/95 backdrop-blur-md flex items-center justify-center p-6"
          onClick={closeViewer} data-testid="screenshot-viewer">
          <div className="max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-overline text-[#D9772B]">{viewing.name} · Payment receipt</p>
              <button onClick={closeViewer} className="text-[#F3EFE7]" data-testid="close-screenshot">Close</button>
            </div>
            <img src={viewing.blobUrl} alt="Payment screenshot" className="w-full max-h-[80vh] object-contain border border-[#2D1D1A] bg-[#140A09]" />
          </div>
        </div>
      )}
    </div>
  );
}

function PaymentBadge({ status }) {
  const isConfirmed = status === "confirmed";
  return (
    <span className={`px-2 py-1 text-[10px] tracking-[0.18em] uppercase border inline-block ${
      isConfirmed
        ? "border-[#3A7D44] text-[#9FD79F] bg-[#3A7D44]/10"
        : "border-[#D9772B] text-[#D9772B] bg-[#D9772B]/10"
    }`}>
      {isConfirmed ? "Confirmed" : "Pending"}
    </span>
  );
}

function OffsiteBadge() {
  return (
    <span className="px-2 py-1 text-[10px] tracking-[0.18em] uppercase border inline-block border-[#5B7B9A] text-[#A9C6DE] bg-[#5B7B9A]/10">
      Off-site
    </span>
  );
}

function Th({ children }) { return <th className="text-left p-4 font-medium">{children}</th>; }
function Td({ children }) { return <td className="p-4 text-[#F3EFE7]/90">{children || "—"}</td>; }

function OffsiteSales() {
  const [events, setEvents] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [form, setForm] = useState({ event_id: "", full_name: "", guests: 1, menu_preference: "Vegetarian", source: "", contact: "", notes: "" });
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    const [evRes, bkRes] = await Promise.all([
      api.get("/events", { params: { upcoming: "true" } }),
      api.get("/admin/offsite-bookings"),
    ]);
    setEvents(evRes.data || []);
    setBookings(bkRes.data || []);
    if (!form.event_id && (evRes.data || []).length) {
      setForm((f) => ({ ...f, event_id: (evRes.data[0] || {}).id || "" }));
    }
  };
  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.event_id) return toast.error("Pick a date");
    if (!form.full_name.trim()) return toast.error("Guest name is required");
    setSubmitting(true);
    try {
      await api.post("/admin/offsite-bookings", { ...form, guests: Math.max(1, Number(form.guests) || 1) });
      toast.success(`Added ${form.guests} seat(s) for ${form.full_name}`);
      setForm({ ...form, full_name: "", guests: 1, source: form.source, contact: "", notes: "" });
      load();
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail) || "Could not add booking");
    } finally { setSubmitting(false); }
  };

  const remove = async (id) => {
    if (!window.confirm("Remove this off-site booking? The seats will be released.")) return;
    try {
      await api.delete(`/admin/offsite-bookings/${id}`);
      toast.success("Removed.");
      load();
    } catch { toast.error("Could not remove"); }
  };

  // Group bookings by event for the list view
  const byEvent = bookings.reduce((m, b) => { (m[b.event_id] = m[b.event_id] || []).push(b); return m; }, {});

  return (
    <div data-testid="offsite-sales">
      <div className="mb-8 flex items-baseline justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-display text-4xl">Off-site sales</h2>
          <p className="text-[#B5A79E] mt-2 max-w-xl">
            Add seats sold through aggregators, partners or direct DMs. These count toward total booked seats in real-time.
          </p>
        </div>
      </div>

      {/* Add form */}
      <form onSubmit={submit} className="border border-[#2D1D1A] bg-[#140A09] p-6 mb-10" data-testid="offsite-form">
        <p className="text-overline mb-5">Log a new off-site seat</p>
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
          <div className="sm:col-span-4">
            <label className="text-overline">Date</label>
            <select
              required
              value={form.event_id}
              onChange={(e) => setForm({ ...form, event_id: e.target.value })}
              data-testid="offsite-event"
              className="mt-2 w-full bg-[#0A0504] border border-[#2D1D1A] px-3 py-2.5 text-[#F3EFE7] focus:border-[#D9772B] outline-none"
            >
              <option value="">— pick a date —</option>
              {events.map((e) => {
                const left = Math.max(0, e.seats_total - (e.seats_booked || 0));
                return (
                  <option key={e.id} value={e.id} disabled={left === 0}>
                    {e.title} · {e.date} {left === 0 ? "· SOLD OUT" : `· ${left} left`}
                  </option>
                );
              })}
            </select>
          </div>
          <Inp12 col={4} label="Guest name" value={form.full_name} onChange={(v) => setForm({ ...form, full_name: v })} testid="offsite-name" required />
          <Inp12 col={2} label="Guests" type="number" min={1} value={form.guests} onChange={(v) => setForm({ ...form, guests: v })} testid="offsite-guests" />
          <div className="sm:col-span-2">
            <label className="text-overline">Preference</label>
            <select
              value={form.menu_preference}
              onChange={(e) => setForm({ ...form, menu_preference: e.target.value })}
              data-testid="offsite-pref"
              className="mt-2 w-full bg-[#0A0504] border border-[#2D1D1A] px-3 py-2.5 text-[#F3EFE7] focus:border-[#D9772B] outline-none"
            >
              <option value="Vegetarian">Vegetarian</option>
              <option value="Non-Vegetarian">Non-Vegetarian</option>
              <option value="Mixed">Mixed</option>
            </select>
          </div>
          <Inp12 col={4} label="Source / Aggregator" placeholder="e.g. SupperClubsIN" value={form.source} onChange={(v) => setForm({ ...form, source: v })} testid="offsite-source" />
          <Inp12 col={4} label="Contact (optional)" value={form.contact || ""} onChange={(v) => setForm({ ...form, contact: v })} testid="offsite-contact" />
          <Inp12 col={4} label="Notes (optional)" value={form.notes || ""} onChange={(v) => setForm({ ...form, notes: v })} testid="offsite-notes" />
        </div>
        <div className="mt-6 flex justify-end">
          <button type="submit" disabled={submitting} data-testid="offsite-submit"
            className="px-5 py-3 bg-[#D9772B] text-[#0A0504] text-[11px] tracking-[0.22em] uppercase hover:bg-[#F3EFE7] disabled:opacity-50 inline-flex items-center gap-2">
            <Plus size={14} /> {submitting ? "Adding…" : "Add off-site booking"}
          </button>
        </div>
      </form>

      {/* List grouped by event */}
      {events.length === 0 && <p className="text-[#B5A79E]">No upcoming events.</p>}
      <div className="space-y-8">
        {events.map((e) => {
          const list = byEvent[e.id] || [];
          const offsiteSeats = list.reduce((s, b) => s + Number(b.guests || 1), 0);
          const left = Math.max(0, e.seats_total - (e.seats_booked || 0));
          return (
            <div key={e.id} className="border border-[#2D1D1A] bg-[#140A09]" data-testid={`offsite-event-block-${e.id}`}>
              <div className="px-5 py-4 flex items-center justify-between flex-wrap gap-3 border-b border-[#2D1D1A]">
                <div>
                  <p className="font-display text-2xl text-[#F3EFE7]">{e.title}</p>
                  <p className="text-[11px] tracking-[0.18em] uppercase text-[#B5A79E] mt-1">
                    {e.date} · total booked {e.seats_booked || 0}/{e.seats_total} · {left} left · off-site contribution {offsiteSeats}
                  </p>
                </div>
              </div>
              {list.length === 0 ? (
                <p className="px-5 py-5 text-[#B5A79E] italic text-sm">No off-site bookings yet for this date.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-[#0A0504] text-[#B5A79E]">
                    <tr><Th>Name</Th><Th>Guests</Th><Th>Preference</Th><Th>Source</Th><Th>Contact</Th><Th>Notes</Th><Th></Th></tr>
                  </thead>
                  <tbody>
                    {list.map((b) => (
                      <tr key={b.id} className="border-t border-[#2D1D1A]" data-testid={`offsite-row-${b.id}`}>
                        <Td>{b.full_name}</Td>
                        <Td>{b.guests}</Td>
                        <Td>{b.menu_preference || "—"}</Td>
                        <Td>{b.source || "—"}</Td>
                        <Td>{b.contact || "—"}</Td>
                        <Td>{b.notes || "—"}</Td>
                        <Td>
                          <button onClick={() => remove(b.id)} data-testid={`offsite-delete-${b.id}`} className="p-2 border border-[#2D1D1A] hover:border-[#D94A3D] hover:text-[#D94A3D]">
                            <Trash2 size={14} />
                          </button>
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Inp12({ col, label, value, onChange, testid, type = "text", placeholder, required, min }) {
  return (
    <div className={`sm:col-span-${col}`}>
      <label className="text-overline">{label}</label>
      <input
        type={type}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        data-testid={testid}
        placeholder={placeholder}
        required={required}
        min={min}
        className="mt-2 w-full bg-[#0A0504] border border-[#2D1D1A] px-3 py-2.5 text-[#F3EFE7] focus:border-[#D9772B] outline-none"
      />
    </div>
  );
}



function Subscribers() {
  const [rows, setRows] = useState([]);
  useEffect(() => { api.get("/newsletter").then((r) => setRows(r.data)); }, []);
  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <h2 className="font-display text-4xl">Newsletter</h2>
        <button
          onClick={() => downloadFromApi("/newsletter/export", "subscribers.csv")}
          data-testid="news-export-csv"
          className="px-4 py-3 border border-[#2D1D1A] text-[11px] tracking-[0.22em] uppercase inline-flex items-center gap-2 hover:border-[#D9772B]"
        >
          <Download size={14} /> Export CSV
        </button>
      </div>
      <div className="bg-[#140A09] border border-[#2D1D1A] overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-[#0A0504] text-overline"><tr><Th>Email</Th><Th>Name</Th><Th>Subscribed</Th></tr></thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={3} className="p-8 text-center text-[#B5A79E]">No subscribers yet.</td></tr>}
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-[#2D1D1A]">
                <Td>{r.email}</Td><Td>{r.name}</Td><Td>{new Date(r.created_at).toLocaleDateString()}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ContactMessages() {
  const [rows, setRows] = useState([]);
  useEffect(() => { api.get("/contact").then((r) => setRows(r.data)); }, []);
  return (
    <div>
      <h2 className="font-display text-4xl mb-6">Messages</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rows.length === 0 && <p className="text-[#B5A79E]">No messages yet.</p>}
        {rows.map((r) => (
          <div key={r.id} className="bg-[#140A09] border border-[#2D1D1A] p-6">
            <p className="text-overline text-[#D9772B]">{new Date(r.created_at).toLocaleString()}</p>
            <p className="font-display text-2xl mt-2">{r.name}</p>
            <p className="text-sm text-[#B5A79E] mt-1">{r.email} · {r.phone || "—"}</p>
            <p className="mt-4 text-[#F3EFE7] text-sm whitespace-pre-wrap">{r.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function isVideoUrl(u) {
  return /\.(mp4|webm|mov|m4v|ogg)(\?|$)/i.test(u || "");
}

function GalleryAdmin() {
  const [items, setItems] = useState([]);
  const [url, setUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const load = () => api.get("/gallery").then((r) => setItems(r.data));
  useEffect(() => { load(); }, []);

  const addToGallery = async (finalUrl, cap) => {
    await api.post("/gallery", { url: finalUrl, caption: cap || "", order: items.length });
    await load();
  };

  const addByUrl = async (e) => {
    e.preventDefault();
    try {
      await addToGallery(url, caption);
      setUrl(""); setCaption("");
      toast.success("Added to the gallery — live on the site.");
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail) || "Failed");
    }
  };

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await api.post("/admin/media", fd);
      await addToGallery(res.data.url, caption);
      setCaption("");
      toast.success(`${res.data.kind === "video" ? "Video" : "Image"} uploaded — live on the site.`);
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail) || "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const del = async (id) => { await api.delete(`/gallery/${id}`); load(); };

  return (
    <div>
      <h2 className="font-display text-4xl mb-2">Gallery</h2>
      <p className="text-[12px] text-[#B5A79E] mb-6">Upload images or videos from your device — they appear on the live site instantly.</p>

      <div className="bg-[#140A09] border border-[#2D1D1A] p-6 mb-4" data-testid="gallery-upload-box">
        <p className="text-overline text-[#D9772B] mb-3">Upload from your device</p>
        <div className="flex items-center gap-4 flex-wrap">
          <input
            ref={fileRef} type="file" accept="image/*,video/*" onChange={onFile} disabled={uploading}
            data-testid="gallery-file-input"
            className="text-sm text-[#B5A79E] file:mr-4 file:py-2 file:px-4 file:border-0 file:cursor-pointer file:bg-[#5A1A1F] file:text-[#F3EFE7] file:uppercase file:text-[11px] file:tracking-[0.18em] hover:file:bg-[#D9772B] hover:file:text-[#0A0504] disabled:opacity-50"
          />
          {uploading && <span className="text-[#D9772B] text-sm animate-pulse" data-testid="gallery-uploading">Uploading…</span>}
        </div>
        <p className="text-[11px] text-[#6E625B] mt-2">Images &amp; videos up to 50MB · JPG, PNG, WebP, MP4, WebM</p>
      </div>

      <form onSubmit={addByUrl} className="bg-[#140A09] border border-[#2D1D1A] p-6 grid grid-cols-1 sm:grid-cols-12 gap-3 mb-8">
        <input
          required value={url} onChange={(e) => setUrl(e.target.value)} placeholder="…or paste an image / video URL"
          data-testid="gallery-url-input"
          className="sm:col-span-6 bg-[#0A0504] border border-[#2D1D1A] px-4 py-3 text-[#F3EFE7] focus:border-[#5A1A1F] outline-none"
        />
        <input
          value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Caption (optional)"
          className="sm:col-span-4 bg-[#0A0504] border border-[#2D1D1A] px-4 py-3 text-[#F3EFE7] focus:border-[#5A1A1F] outline-none"
        />
        <button type="submit" data-testid="gallery-add-button" className="sm:col-span-2 px-4 py-3 bg-[#5A1A1F] hover:bg-[#D9772B] hover:text-[#0A0504] text-[11px] tracking-[0.22em] uppercase">Add</button>
      </form>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3" data-testid="gallery-grid">
        {items.map((i) => (
          <div key={i.id} className="relative group bg-[#140A09] border border-[#2D1D1A]" data-testid={`gallery-item-${i.id}`}>
            {isVideoUrl(i.url) ? (
              <video src={i.url} className="w-full aspect-square object-cover" muted playsInline preload="metadata" />
            ) : (
              <img src={i.url} alt="" className="w-full aspect-square object-cover" />
            )}
            {isVideoUrl(i.url) && (
              <span className="absolute bottom-2 left-2 px-2 py-0.5 bg-[#0A0504]/80 text-[9px] tracking-[0.18em] uppercase text-[#D9772B]">Video</span>
            )}
            <button
              onClick={() => del(i.id)} aria-label="Delete" data-testid={`gallery-delete-${i.id}`}
              className="absolute top-2 right-2 p-2 bg-[#0A0504]/80 text-[#F3EFE7] opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}


function MenuAdmin() {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get("/site-content", { params: { mode: "draft" } })
      .then((r) => setContent(r.data))
      .catch(() => toast.error("Could not load menus"))
      .finally(() => setLoading(false));
  }, []);

  const publish = async (next) => {
    setSaving(true);
    try {
      await api.put("/admin/site-content/draft", next);
      await api.post("/admin/site-content/publish");
      setContent(next);
      toast.success("Menu saved and published.");
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail) || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-[#B5A79E]">Loading menus…</p>;
  if (!content) return <p className="text-[#B5A79E]">Could not load menus.</p>;

  const updateMenu = (pageKey, items) => {
    const next = JSON.parse(JSON.stringify(content));
    next[pageKey] = next[pageKey] || {};
    next[pageKey].menu = { ...(next[pageKey].menu || {}), items };
    publish(next);
  };

  const naaniItems = content?.naani_ghar?.menu?.items || [];
  const barsaatItems = content?.barsaat?.menu?.items || [];

  return (
    <div>
      <div className="mb-6 flex items-baseline justify-between gap-4 flex-wrap">
        <h2 className="font-display text-4xl">Series menus</h2>
        <p className="text-[11px] tracking-[0.18em] uppercase text-[#B5A79E]" data-testid="menu-admin-save-state">
          {saving ? "Saving…" : "Changes publish instantly"}
        </p>
      </div>
      <p className="text-[#B5A79E] mb-8 max-w-2xl">
        Edit the menu courses for each supper series. Adds, edits and deletes are saved and published live.
      </p>

      <div className="space-y-10">
        <SeriesMenuEditor
          pageKey="naani_ghar"
          title="Naani Ghar"
          badge="Series concluded"
          badgeClass="text-[#9FD79F] border-[#3A7D44]/60"
          items={naaniItems}
          onChange={(items) => updateMenu("naani_ghar", items)}
        />
        <SeriesMenuEditor
          pageKey="barsaat"
          title="Barsaat"
          badge="Work in progress"
          badgeClass="text-[#D9772B] border-[#D9772B]/60"
          items={barsaatItems}
          onChange={(items) => updateMenu("barsaat", items)}
        />
      </div>
    </div>
  );
}

function SeriesMenuEditor({ pageKey, title, badge, badgeClass, items, onChange }) {
  const [draft, setDraft] = useState(items);
  useEffect(() => { setDraft(items); }, [items]);

  const dirty = JSON.stringify(draft) !== JSON.stringify(items);

  const updateItem = (idx, patch) => {
    const next = [...draft];
    next[idx] = { ...next[idx], ...patch };
    setDraft(next);
  };
  const addItem = () => setDraft([...draft, { course: "Course", dish: "New dish", note: "" }]);
  const removeItem = (idx) => {
    if (!window.confirm("Remove this course?")) return;
    setDraft(draft.filter((_, i) => i !== idx));
  };
  const moveItem = (idx, dir) => {
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= draft.length) return;
    const next = [...draft];
    [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
    setDraft(next);
  };

  return (
    <div className="border border-[#2D1D1A] bg-[#140A09]" data-testid={`menu-series-${pageKey}`}>
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#2D1D1A] flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <h3 className="font-display text-3xl">{title}</h3>
          <span className={`text-[10px] tracking-[0.22em] uppercase px-3 py-1 border ${badgeClass}`}>{badge}</span>
        </div>
        <p className="text-sm text-[#B5A79E]">{draft.length} course{draft.length === 1 ? "" : "s"}</p>
      </div>

      <div className="p-5 space-y-3">
        {draft.length === 0 && (
          <p className="text-sm text-[#B5A79E] italic">No courses yet. Add the first one below.</p>
        )}

        {draft.map((it, idx) => (
          <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start bg-[#0A0504] border border-[#2D1D1A] p-4" data-testid={`menu-${pageKey}-row-${idx}`}>
            <Input12 col={2} label="Course" value={it.course || ""} onChange={(v) => updateItem(idx, { course: v })} testid={`menu-${pageKey}-course-${idx}`} />
            <Input12 col={3} label="Dish" value={it.dish || ""} onChange={(v) => updateItem(idx, { dish: v })} testid={`menu-${pageKey}-dish-${idx}`} />
            <Input12 col={3} label="Note" value={it.note || ""} onChange={(v) => updateItem(idx, { note: v })} testid={`menu-${pageKey}-note-${idx}`} />
            <Input12 col={3} label="Veg variant — dish (optional)" value={it.alt_dish || ""} onChange={(v) => updateItem(idx, { alt_dish: v })} testid={`menu-${pageKey}-altdish-${idx}`} />
            <div className="sm:col-span-1 flex sm:flex-col gap-1 sm:justify-start sm:pt-7">
              <button onClick={() => moveItem(idx, -1)} disabled={idx === 0} className="p-1.5 border border-[#2D1D1A] hover:border-[#D9772B] disabled:opacity-30" aria-label="Move up" data-testid={`menu-${pageKey}-up-${idx}`}>↑</button>
              <button onClick={() => moveItem(idx, 1)} disabled={idx === draft.length - 1} className="p-1.5 border border-[#2D1D1A] hover:border-[#D9772B] disabled:opacity-30" aria-label="Move down" data-testid={`menu-${pageKey}-down-${idx}`}>↓</button>
              <button onClick={() => removeItem(idx)} className="p-1.5 border border-[#2D1D1A] hover:border-[#D94A3D] hover:text-[#D94A3D]" aria-label="Remove course" data-testid={`menu-${pageKey}-remove-${idx}`}>
                <Trash2 size={14} />
              </button>
            </div>
            <div className="sm:col-span-11 sm:col-start-1">
              <Input12 col={8} label="Veg variant — note (optional)" value={it.alt_note || ""} onChange={(v) => updateItem(idx, { alt_note: v })} testid={`menu-${pageKey}-altnote-${idx}`} />
            </div>
          </div>
        ))}

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            onClick={addItem}
            data-testid={`menu-${pageKey}-add`}
            className="px-4 py-2.5 border border-[#2D1D1A] text-[11px] tracking-[0.18em] uppercase hover:border-[#D9772B] inline-flex items-center gap-2"
          >
            <Plus size={12} /> Add course
          </button>
          <button
            onClick={() => onChange(draft)}
            disabled={!dirty}
            data-testid={`menu-${pageKey}-save`}
            className="px-5 py-2.5 bg-[#D9772B] text-[#0A0504] text-[11px] tracking-[0.18em] uppercase hover:bg-[#F3EFE7] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {dirty ? "Save & publish" : "Saved"}
          </button>
          {dirty && (
            <button
              onClick={() => setDraft(items)}
              data-testid={`menu-${pageKey}-revert`}
              className="px-4 py-2.5 border border-[#2D1D1A] text-[11px] tracking-[0.18em] uppercase hover:border-[#5A1A1F]"
            >
              Revert
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Input12({ col, label, value, onChange, testid }) {
  const colMap = { 1: "sm:col-span-1", 2: "sm:col-span-2", 3: "sm:col-span-3", 4: "sm:col-span-4", 5: "sm:col-span-5", 6: "sm:col-span-6", 7: "sm:col-span-7", 8: "sm:col-span-8" };
  return (
    <label className={`${colMap[col] || "sm:col-span-6"} block`}>
      <span className="text-[10px] tracking-[0.18em] uppercase text-[#B5A79E] mb-1 block">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        data-testid={testid}
        className="w-full bg-[#0A0504] border border-[#2D1D1A] px-3 py-2 text-sm text-[#F3EFE7] focus:border-[#5A1A1F] outline-none"
      />
    </label>
  );
}
