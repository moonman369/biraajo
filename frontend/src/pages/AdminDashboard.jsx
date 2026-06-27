import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Calendar, Users, Mail, MessageSquare, LogOut, Plus, Trash2, Download, Edit2 } from "lucide-react";
import { api, clearToken, formatApiError } from "@/lib/api";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "events", label: "Events" },
  { id: "registrations", label: "Registrations" },
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
        {tab === "events" && <Events />}
        {tab === "registrations" && <Registrations />}
        {tab === "newsletter" && <Subscribers />}
        {tab === "contacts" && <ContactMessages />}
        {tab === "gallery" && <GalleryAdmin />}
      </main>
    </div>
  );
}

function Overview() {
  const [stats, setStats] = useState(null);
  useEffect(() => {
    api.get("/stats").then((r) => setStats(r.data)).catch(() => {});
  }, []);
  if (!stats) return <p className="text-[#B5A79E]">Loading...</p>;
  const cards = [
    { label: "Total Events", value: stats.total_events, icon: Calendar },
    { label: "Upcoming", value: stats.upcoming_events, icon: Calendar },
    { label: "Registrations", value: stats.total_registrations, icon: Users },
    { label: "Subscribers", value: stats.total_subscribers, icon: Mail },
    { label: "Messages", value: stats.total_contacts, icon: MessageSquare },
  ];
  return (
    <div>
      <h2 className="font-display text-4xl mb-8">At a glance</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-px bg-[#2D1D1A]">
        {cards.map((c) => (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#140A09] p-7"
            data-testid={`stat-${c.label.toLowerCase()}`}
          >
            <c.icon size={20} className="text-[#D9772B]" />
            <p className="font-display text-5xl mt-4">{c.value}</p>
            <p className="text-overline mt-3 text-[#B5A79E]">{c.label}</p>
          </motion.div>
        ))}
      </div>
      <p className="mt-10 text-[#B5A79E] max-w-2xl">
        Manage events, view registrations, export your guest list, curate the
        gallery and read every message — all from here.
      </p>
    </div>
  );
}

function emptyEvent() {
  return {
    title: "", date: "", time: "19:30", venue: "", description: "",
    price: 3500, seats_total: 12, image_url: "", tag: "Supper Club",
  };
}

function Events() {
  const [events, setEvents] = useState([]);
  const [editing, setEditing] = useState(null);

  const load = () => api.get("/events").then((r) => setEvents(r.data));
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-[#2D1D1A] mt-6">
        {events.length === 0 && (
          <p className="bg-[#140A09] p-8 text-[#B5A79E] md:col-span-3">No events yet. Create your first supper.</p>
        )}
        {events.map((ev) => (
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
    </div>
  );
}

function EventForm({ event, onCancel, onSave }) {
  const [f, setF] = useState(event);
  const h = (k) => (e) => setF((v) => ({ ...v, [k]: e.target.value }));
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
      <Inp label="Seats total" type="number" value={f.seats_total} onChange={h("seats_total")} />
      <Inp label="Image URL" value={f.image_url} onChange={h("image_url")} />
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

  useEffect(() => { api.get("/events").then((r) => setEvents(r.data)); }, []);
  useEffect(() => {
    api.get("/registrations", { params: eventId ? { event_id: eventId } : {} }).then((r) => setRows(r.data));
  }, [eventId]);

  const titleOf = (id) => events.find((e) => e.id === id)?.title || id;

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <h2 className="font-display text-4xl">Registrations</h2>
        <div className="flex gap-3 items-center">
          <select
            value={eventId} onChange={(e) => setEventId(e.target.value)}
            data-testid="reg-filter-event"
            className="bg-[#0A0504] border border-[#2D1D1A] px-4 py-3 text-sm text-[#F3EFE7]"
          >
            <option value="">All events</option>
            {events.map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}
          </select>
          <button
            onClick={() => downloadFromApi(`/registrations/export${eventId ? `?event_id=${eventId}` : ""}`, "registrations.csv")}
            data-testid="reg-export-csv"
            className="px-4 py-3 border border-[#2D1D1A] text-[11px] tracking-[0.22em] uppercase inline-flex items-center gap-2 hover:border-[#D9772B]"
          >
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      <div className="overflow-x-auto bg-[#140A09] border border-[#2D1D1A]">
        <table className="w-full text-sm">
          <thead className="bg-[#0A0504] text-overline">
            <tr>
              <Th>Event</Th><Th>Name</Th><Th>Email</Th><Th>Phone</Th>
              <Th>Instagram</Th><Th>Menu</Th><Th>Guests</Th><Th>Dietary</Th><Th>Date</Th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={9} className="p-8 text-center text-[#B5A79E]">No registrations yet.</td></tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-[#2D1D1A]">
                <Td>{titleOf(r.event_id)}</Td>
                <Td>{r.full_name}</Td>
                <Td>{r.email}</Td>
                <Td>{r.phone}</Td>
                <Td>{r.instagram_handle}</Td>
                <Td>{r.menu_preference}</Td>
                <Td>{r.guests}</Td>
                <Td>{r.dietary_preferences}</Td>
                <Td>{new Date(r.created_at).toLocaleDateString()}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({ children }) { return <th className="text-left p-4 font-medium">{children}</th>; }
function Td({ children }) { return <td className="p-4 text-[#F3EFE7]/90">{children || "—"}</td>; }

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

function GalleryAdmin() {
  const [items, setItems] = useState([]);
  const [url, setUrl] = useState("");
  const [caption, setCaption] = useState("");

  const load = () => api.get("/gallery").then((r) => setItems(r.data));
  useEffect(() => { load(); }, []);

  const add = async (e) => {
    e.preventDefault();
    try {
      await api.post("/gallery", { url, caption, order: items.length });
      setUrl(""); setCaption(""); load();
      toast.success("Image added");
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail) || "Failed");
    }
  };
  const del = async (id) => { await api.delete(`/gallery/${id}`); load(); };

  return (
    <div>
      <h2 className="font-display text-4xl mb-6">Gallery</h2>
      <form onSubmit={add} className="bg-[#140A09] border border-[#2D1D1A] p-6 grid grid-cols-1 sm:grid-cols-12 gap-3 mb-8">
        <input
          required value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Image or video URL (.jpg / .png / .mp4 / .webm)"
          data-testid="gallery-url-input"
          className="sm:col-span-6 bg-[#0A0504] border border-[#2D1D1A] px-4 py-3 text-[#F3EFE7] focus:border-[#5A1A1F] outline-none"
        />
        <input
          value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Caption (optional)"
          className="sm:col-span-4 bg-[#0A0504] border border-[#2D1D1A] px-4 py-3 text-[#F3EFE7] focus:border-[#5A1A1F] outline-none"
        />
        <button type="submit" data-testid="gallery-add-button" className="sm:col-span-2 px-4 py-3 bg-[#5A1A1F] hover:bg-[#D9772B] hover:text-[#0A0504] text-[11px] tracking-[0.22em] uppercase">Add</button>
      </form>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {items.map((i) => (
          <div key={i.id} className="relative group bg-[#140A09] border border-[#2D1D1A]">
            <img src={i.url} alt="" className="w-full aspect-square object-cover" />
            <button
              onClick={() => del(i.id)} aria-label="Delete"
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
