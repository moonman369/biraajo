import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronDown, ChevronRight, Eye, EyeOff, ExternalLink, History, RotateCcw, Send, X } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";

const PREVIEW_PAGES = [
  { label: "Home", path: "/" },
  { label: "About the Chef", path: "/about-the-chef" },
  { label: "Naani Ghar", path: "/supper-club/naani-ghar" },
  { label: "Barsaat", path: "/supper-club/barsaat" },
];

// Schema describes WHICH fields are editable in the side panel.
// Each section is rendered as a collapsible group. Each field has a type.
const SCHEMA = {
  landing: {
    label: "Landing page",
    sections: {
      hero: {
        label: "Hero",
        fields: [
          { key: "brand", label: "Giant wordmark", type: "text" },
          { key: "eyebrow", label: "Top meta", type: "text" },
          { key: "title", label: "Main title (italic line)", type: "text" },
          { key: "body", label: "Subtitle / body", type: "textarea" },
          { key: "primary_cta_label", label: "Primary button label", type: "text" },
          { key: "primary_cta_href", label: "Primary button link", type: "text" },
          { key: "secondary_cta_label", label: "Secondary button label", type: "text" },
          { key: "secondary_cta_href", label: "Secondary button link", type: "text" },
          { key: "image", label: "Background image URL (fallback)", type: "url" },
        ],
      },
      about: {
        label: "About",
        fields: [
          { key: "eyebrow", label: "Eyebrow", type: "text" },
          { key: "title", label: "Title", type: "text" },
          { key: "title_italic", label: "Title (italic)", type: "text" },
        ],
        list: {
          key: "chapters",
          label: "Chapters",
          itemLabel: (i) => `Chapter ${i + 1}`,
          fields: [
            { key: "no", label: "No.", type: "text" },
            { key: "eyebrow", label: "Eyebrow", type: "text" },
            { key: "title", label: "Title", type: "text" },
            { key: "body", label: "Body", type: "textarea" },
            { key: "image", label: "Image URL", type: "url" },
            { key: "align", label: "Align (left/right)", type: "text" },
          ],
        },
        nested: {
          meaning: {
            label: "The Meaning section",
            fields: [
              { key: "eyebrow", label: "Eyebrow", type: "text" },
              { key: "title", label: "Title", type: "text" },
              { key: "title_italic", label: "Title (italic)", type: "text" },
              { key: "body_1", label: "Body line 1", type: "textarea" },
              { key: "body_2", label: "Body line 2", type: "text" },
              { key: "body_3", label: "Body line 3", type: "textarea" },
              { key: "pull_quote", label: "Pull quote", type: "textarea" },
              { key: "primary_cta_label", label: "Primary CTA label", type: "text" },
              { key: "secondary_cta_label", label: "Secondary CTA label", type: "text" },
            ],
          },
        },
      },
      experiences: {
        label: "Experiences",
        fields: [
          { key: "eyebrow", label: "Eyebrow", type: "text" },
          { key: "title", label: "Title", type: "text" },
          { key: "title_italic", label: "Title (italic)", type: "text" },
          { key: "body", label: "Intro body", type: "textarea" },
        ],
        list: {
          key: "cards",
          label: "Cards",
          itemLabel: (i) => `Card ${i + 1}`,
          fields: [
            { key: "tag", label: "Tag", type: "text" },
            { key: "title", label: "Title", type: "text" },
            { key: "body", label: "Body", type: "textarea" },
            { key: "image", label: "Image URL", type: "url" },
          ],
        },
      },
      newsletter: {
        label: "Newsletter",
        fields: [
          { key: "eyebrow", label: "Eyebrow", type: "text" },
          { key: "title", label: "Title", type: "text" },
          { key: "body", label: "Body", type: "textarea" },
          { key: "button_label", label: "Button label", type: "text" },
        ],
      },
      contact: {
        label: "Contact",
        fields: [
          { key: "eyebrow", label: "Eyebrow", type: "text" },
          { key: "title", label: "Title", type: "text" },
          { key: "body", label: "Body", type: "textarea" },
          { key: "address", label: "Address", type: "text" },
          { key: "phone", label: "Phone (WhatsApp)", type: "text" },
          { key: "email", label: "Email", type: "text" },
          { key: "instagram", label: "Instagram handle", type: "text" },
          { key: "instagram_url", label: "Instagram URL", type: "url" },
        ],
      },
      footer: {
        label: "Footer",
        fields: [
          { key: "tagline", label: "Tagline", type: "textarea" },
          { key: "copyright", label: "Copyright label", type: "text" },
        ],
      },
    },
  },
  about_the_chef: {
    label: "About the Chef · page",
    sections: {
      hero: {
        label: "Hero",
        fields: [
          { key: "eyebrow", label: "Eyebrow", type: "text" },
          { key: "title", label: "Title", type: "text" },
          { key: "title_italic", label: "Title (italic)", type: "text" },
          { key: "body", label: "Body", type: "textarea" },
          { key: "portrait", label: "Portrait URL", type: "url" },
        ],
      },
      chapter_1: { label: "Chapter 1 · Where it began", fields: chapterFields() },
      chapter_2: { label: "Chapter 2 · Switzerland", fields: chapterFields() },
      philosophy: {
        label: "Philosophy",
        fields: [
          { key: "eyebrow", label: "Eyebrow", type: "text" },
          { key: "quote_1", label: "Quote line 1", type: "text" },
          { key: "quote_2_italic", label: "Quote line 2 (italic)", type: "text" },
          { key: "footer_body", label: "Body below quote", type: "textarea" },
        ],
      },
      today: {
        label: "Today",
        fields: [
          { key: "eyebrow", label: "Eyebrow", type: "text" },
          { key: "title", label: "Title", type: "text" },
          { key: "title_italic", label: "Title (italic)", type: "text" },
          { key: "body_1", label: "Body line 1", type: "textarea" },
          { key: "body_2", label: "Body line 2", type: "textarea" },
          { key: "pull_quote", label: "Pull quote", type: "textarea" },
          { key: "primary_cta_label", label: "Primary CTA", type: "text" },
          { key: "secondary_cta_label", label: "Secondary CTA", type: "text" },
        ],
      },
    },
  },
  naani_ghar: {
    label: "Naani Ghar · page",
    sections: {
      hero: {
        label: "Hero",
        fields: [
          { key: "eyebrow", label: "Eyebrow", type: "text" },
          { key: "title", label: "Title", type: "text" },
          { key: "title_italic", label: "Title (italic)", type: "text" },
          { key: "body", label: "Body", type: "textarea" },
          { key: "meta", label: "Meta line", type: "text" },
          { key: "image", label: "Hero image URL", type: "url" },
        ],
      },
      menu: {
        label: "Menu block",
        fields: [
          { key: "eyebrow", label: "Eyebrow", type: "text" },
          { key: "title", label: "Title", type: "text" },
          { key: "title_italic", label: "Title (italic)", type: "text" },
        ],
        list: {
          key: "items",
          label: "Courses",
          itemLabel: (i) => `Course ${i + 1}`,
          fields: [
            { key: "course", label: "Course", type: "text" },
            { key: "dish", label: "Dish", type: "text" },
            { key: "note", label: "Note", type: "textarea" },
          ],
        },
      },
      photos_block: {
        label: "Photos",
        fields: [
          { key: "eyebrow", label: "Eyebrow", type: "text" },
          { key: "title", label: "Title", type: "text" },
          { key: "title_italic", label: "Title (italic)", type: "text" },
        ],
        list: {
          key: "photos",
          label: "Photo URLs",
          itemLabel: (i) => `Photo ${i + 1}`,
          fields: [{ key: "_self", label: "URL", type: "url" }],
        },
      },
      closer: {
        label: "Closer",
        fields: [
          { key: "eyebrow", label: "Eyebrow", type: "text" },
          { key: "title", label: "Title", type: "text" },
          { key: "title_italic", label: "Title (italic)", type: "text" },
        ],
      },
    },
  },
  barsaat: {
    label: "Barsaat · page",
    sections: {
      hero: {
        label: "Hero",
        fields: [
          { key: "eyebrow", label: "Eyebrow", type: "text" },
          { key: "title", label: "Title", type: "text" },
          { key: "title_italic", label: "Title (italic)", type: "text" },
          { key: "body", label: "Body", type: "textarea" },
          { key: "image", label: "Hero image URL", type: "url" },
        ],
      },
      dates_block: {
        label: "Dates & reserve block",
        fields: [
          { key: "eyebrow", label: "Eyebrow", type: "text" },
          { key: "title", label: "Title (before italic)", type: "text" },
          { key: "title_italic", label: "Title (italic)", type: "text" },
          { key: "schedule_note", label: "Schedule note", type: "textarea" },
          { key: "price_eyebrow", label: "Price eyebrow", type: "text" },
          { key: "price_footnote", label: "Price footnote", type: "textarea" },
        ],
      },
      chef_note: {
        label: "Chef's signature quote",
        fields: [
          { key: "eyebrow", label: "Eyebrow", type: "text" },
          { key: "quote", label: "The quote", type: "textarea" },
          { key: "signature", label: "Signature (— name)", type: "text" },
        ],
      },
      sensory: {
        label: "Sensory journey",
        fields: [
          { key: "eyebrow", label: "Eyebrow", type: "text" },
          { key: "title", label: "Title (before italic)", type: "text" },
          { key: "title_italic", label: "Title (italic)", type: "text" },
          { key: "intro", label: "Intro paragraph", type: "textarea" },
        ],
        list: {
          key: "items",
          label: "Sensory pillars (cards)",
          itemLabel: (i, it) => it?.title || `Card ${i + 1}`,
          fields: [
            { key: "eyebrow", label: "Eyebrow", type: "text" },
            { key: "title", label: "Card title", type: "text" },
            { key: "body", label: "Card body", type: "textarea" },
          ],
        },
      },
      rajneesh: {
        label: "Rajneesh collaboration",
        fields: [
          { key: "eyebrow", label: "Eyebrow", type: "text" },
          { key: "title", label: "Title (before italic)", type: "text" },
          { key: "title_italic", label: "Title (italic name)", type: "text" },
          { key: "credit_line", label: "Credit line", type: "text" },
          { key: "note", label: "Long-form note", type: "textarea" },
        ],
        list: {
          key: "bullets",
          label: "Soundscape bullets",
          itemLabel: (i, it) => (typeof it === "string" ? it : `Bullet ${i + 1}`),
          fields: [{ key: "_self", label: "Bullet text", type: "text" }],
        },
      },
      reels: {
        label: "Reels grid",
        fields: [
          { key: "visible", label: "Show block?", type: "toggle" },
          { key: "eyebrow", label: "Eyebrow", type: "text" },
          { key: "title", label: "Title (before italic)", type: "text" },
          { key: "title_italic", label: "Title (italic)", type: "text" },
        ],
        list: {
          key: "items",
          label: "Reels",
          itemLabel: (i, it) => it?.label || `Reel ${i + 1}`,
          fields: [
            { key: "url", label: "Video URL (.mp4)", type: "url" },
            { key: "label", label: "Label", type: "text" },
          ],
        },
      },
      closer: {
        label: "Closer",
        fields: [
          { key: "eyebrow", label: "Eyebrow", type: "text" },
          { key: "title", label: "Title (before italic)", type: "text" },
          { key: "title_italic", label: "Title (italic)", type: "text" },
          { key: "body", label: "Body", type: "textarea" },
          { key: "cta_label", label: "CTA label", type: "text" },
        ],
      },
    },
  },
};

function chapterFields() {
  return [
    { key: "eyebrow", label: "Eyebrow", type: "text" },
    { key: "title_html", label: "Title (HTML, italic with <em>)", type: "text" },
    { key: "body_1", label: "Body line 1", type: "textarea" },
    { key: "body_2", label: "Body line 2", type: "textarea" },
    { key: "image", label: "Image URL", type: "url" },
  ];
}

function setPath(obj, path, val) {
  const next = JSON.parse(JSON.stringify(obj));
  let cur = next;
  for (let i = 0; i < path.length - 1; i++) {
    cur[path[i]] = cur[path[i]] ?? {};
    cur = cur[path[i]];
  }
  cur[path[path.length - 1]] = val;
  return next;
}

function getPath(obj, path) {
  let cur = obj;
  for (const p of path) {
    if (cur == null) return undefined;
    cur = cur[p];
  }
  return cur;
}

export default function EditWebsite() {
  const navigate = useNavigate();
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [previewPath, setPreviewPath] = useState("/");
  const [previewKey, setPreviewKey] = useState(0);
  const saveTimer = useRef(null);
  const iframeRef = useRef(null);

  // Auth gate
  useEffect(() => {
    if (!localStorage.getItem("biraajo_admin_token")) {
      navigate("/admin/login");
    }
  }, [navigate]);

  // Recovery flag if a session-recovery banner should show
  const [recoveryAvailable, setRecoveryAvailable] = useState(false);
  const [authExpired, setAuthExpired] = useState(false);
  const [reLoginEmail, setReLoginEmail] = useState("");
  const [reLoginPwd, setReLoginPwd] = useState("");

  // Load draft + check for unsaved local backup
  useEffect(() => {
    api.get("/site-content", { params: { mode: "draft" } })
      .then((r) => {
        setContent(r.data);
        // If we have an unsaved local backup that's newer than server draft, offer to restore
        try {
          const raw = localStorage.getItem("biraajo_unsaved_draft");
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed && parsed.savedAt && parsed.content) setRecoveryAvailable(true);
          }
        } catch { /* ignore */ }
      })
      .catch(() => toast.error("Could not load site content"))
      .finally(() => setLoading(false));
  }, []);

  // Expose for emergency console rescue: window.__biraajoDumpDraft()
  useEffect(() => {
    window.__biraajoDumpDraft = () => {
      try {
        const blob = new Blob([JSON.stringify(content, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `biraajo-draft-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        return "Downloaded to your Downloads folder.";
      } catch (e) { return String(e); }
    };
    return () => { delete window.__biraajoDumpDraft; };
  }, [content]);

  const queueAutosave = (next) => {
    setContent(next);
    setDirty(true);
    // Local backup on every change so a browser refresh / network failure cannot lose anything
    try {
      localStorage.setItem("biraajo_unsaved_draft", JSON.stringify({ savedAt: Date.now(), content: next }));
    } catch { /* quota */ }
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => doSave(next), 600);
  };

  const doSave = async (data) => {
    setSaving(true);
    try {
      await api.put("/admin/site-content/draft", data);
      setDirty(false);
      // Successful — clear local backup
      try { localStorage.removeItem("biraajo_unsaved_draft"); } catch { /* ignore */ }
      // Tell iframe to refresh content
      iframeRef.current?.contentWindow?.postMessage("biraajo:content-changed", "*");
    } catch (err) {
      if (err?.response?.status === 401) {
        setAuthExpired(true);
        toast.error("Your session expired — re-login to save (your edits are safe).");
      } else {
        toast.error("Save failed — your edits are kept locally, click Save now to retry.");
      }
    } finally {
      setSaving(false);
    }
  };

  // Re-login from inside the editor without losing in-memory content
  const reLogin = async (e) => {
    e?.preventDefault?.();
    try {
      const r = await api.post("/auth/login", { email: reLoginEmail, password: reLoginPwd });
      const tok = r.data?.access_token || r.data?.token;
      if (!tok) throw new Error("no token");
      localStorage.setItem("biraajo_admin_token", tok);
      setAuthExpired(false);
      setReLoginPwd("");
      // Immediately push current in-memory state back to server
      await doSave(content);
      toast.success("Logged back in and saved.");
    } catch {
      toast.error("Login failed. Check email & password.");
    }
  };

  const restoreLocalBackup = () => {
    try {
      const raw = localStorage.getItem("biraajo_unsaved_draft");
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed?.content) {
        setContent(parsed.content);
        setDirty(true);
        setRecoveryAvailable(false);
        // Push it to server right away
        doSave(parsed.content);
        toast.success("Restored from local backup.");
      }
    } catch { toast.error("Could not restore"); }
  };

  const dismissRecovery = () => {
    try { localStorage.removeItem("biraajo_unsaved_draft"); } catch { /* ignore */ }
    setRecoveryAvailable(false);
  };

  const saveNow = () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    if (content) doSave(content);
  };

  const publish = async () => {
    if (!window.confirm("Publish the current draft to the live site?")) return;
    try {
      await api.post("/admin/site-content/publish");
      toast.success("Published. Live site updated.");
      // Refresh iframe too
      setPreviewKey((k) => k + 1);
    } catch {
      toast.error("Publish failed");
    }
  };

  const discard = async () => {
    if (!window.confirm("Discard all draft changes and revert to the live site content?")) return;
    try {
      await api.post("/admin/site-content/discard");
      const { data } = await api.get("/site-content", { params: { mode: "draft" } });
      setContent(data);
      setDirty(false);
      iframeRef.current?.contentWindow?.postMessage("biraajo:content-changed", "*");
      toast.success("Draft reverted.");
    } catch {
      toast.error("Could not discard");
    }
  };

  // ─── Version history ───
  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const r = await api.get("/admin/site-content/history");
      setHistory(r.data || []);
    } catch { toast.error("Could not load history"); }
    finally { setHistoryLoading(false); }
  };

  const openHistory = async () => {
    setHistoryOpen(true);
    await loadHistory();
  };

  const restoreSnapshot = async (snapId) => {
    if (!window.confirm("Restore this version? Your current draft will be snapshotted first so you can undo this.")) return;
    try {
      await api.post(`/admin/site-content/restore/${snapId}`);
      const { data } = await api.get("/site-content", { params: { mode: "draft" } });
      setContent(data);
      setDirty(false);
      setPreviewKey((k) => k + 1);
      setHistoryOpen(false);
      toast.success("Version restored. Live site updated.");
    } catch { toast.error("Restore failed"); }
  };

  const fmtTime = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    return d.toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  };

  if (loading) return <div className="p-12 text-[#B5A79E] bg-[#0A0504] min-h-screen">Loading content…</div>;
  if (!content) return <div className="p-12 text-[#B5A79E] bg-[#0A0504] min-h-screen">Could not load content.</div>;

  return (
    <div className="bg-[#0A0504] text-[#F3EFE7] min-h-screen" data-testid="page-edit-website">
      {/* Top bar */}
      <div className="sticky top-0 z-30 bg-[#140A09] border-b border-[#2D1D1A] px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-5">
          <Link to="/admin" className="text-overline hover:text-[#D9772B]" data-testid="edit-back-admin">← Admin</Link>
          <h1 className="font-display text-2xl">Edit website</h1>
          <span className="text-[11px] tracking-[0.18em] uppercase text-[#B5A79E]" data-testid="edit-save-status">
            {saving ? "Saving…" : dirty ? "Unsaved" : "All changes saved"}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={openHistory} data-testid="edit-history" className="px-4 py-2 border border-[#2D1D1A] text-[11px] tracking-[0.18em] uppercase hover:border-[#D9772B] hover:text-[#D9772B] inline-flex items-center gap-2">
            <History size={12} /> Version history
          </button>
          <button onClick={saveNow} data-testid="edit-save-now" disabled={!dirty} className="px-4 py-2 border border-[#D9772B] text-[#D9772B] text-[11px] tracking-[0.18em] uppercase hover:bg-[#D9772B] hover:text-[#0A0504] inline-flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed">
            <Send size={12} /> Save now
          </button>
          <button onClick={discard} data-testid="edit-discard" className="px-4 py-2 border border-[#2D1D1A] text-[11px] tracking-[0.18em] uppercase hover:border-[#D94A3D] hover:text-[#D94A3D] inline-flex items-center gap-2">
            <RotateCcw size={12} /> Discard draft
          </button>
          <button onClick={publish} data-testid="edit-publish" className="px-5 py-2 bg-[#D9772B] text-[#0A0504] text-[11px] tracking-[0.18em] uppercase hover:bg-[#F3EFE7] inline-flex items-center gap-2">
            <Send size={12} /> Publish to live
          </button>
        </div>
      </div>

      {/* Recovery banner — appears when a local backup is detected */}
      {recoveryAvailable && (
        <div className="bg-[#D9772B]/15 border-y border-[#D9772B]/50 px-6 py-3 flex items-center justify-between gap-3 flex-wrap" data-testid="recovery-banner">
          <p className="text-sm text-[#F3EFE7]">
            <strong className="text-[#D9772B]">Unsaved edits found in this browser.</strong> Looks like saves failed previously. Restore them?
          </p>
          <div className="flex gap-2">
            <button onClick={restoreLocalBackup} data-testid="recovery-restore" className="px-4 py-2 bg-[#D9772B] text-[#0A0504] text-[11px] tracking-[0.18em] uppercase hover:bg-[#F3EFE7]">
              Restore unsaved edits
            </button>
            <button onClick={dismissRecovery} data-testid="recovery-dismiss" className="px-4 py-2 border border-[#2D1D1A] text-[11px] tracking-[0.18em] uppercase hover:border-[#D94A3D] hover:text-[#D94A3D]">
              Discard
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 min-h-[calc(100vh-72px)]">
        {/* Side panel — editor */}
        <div className="lg:col-span-5 xl:col-span-4 border-r border-[#2D1D1A] overflow-y-auto max-h-[calc(100vh-72px)]">
          <div className="p-6 space-y-4">
            {Object.entries(SCHEMA).map(([pageKey, page]) => (
              <PageEditor
                key={pageKey}
                pageKey={pageKey}
                page={page}
                content={content}
                onChange={(path, val) => queueAutosave(setPath(content, [pageKey, ...path], val))}
              />
            ))}
          </div>
        </div>

        {/* Iframe preview */}
        <div className="lg:col-span-7 xl:col-span-8 bg-[#0A0504] flex flex-col">
          <div className="px-5 py-3 border-b border-[#2D1D1A] flex items-center justify-between gap-3 flex-wrap">
            <div className="flex gap-2 flex-wrap">
              {PREVIEW_PAGES.map((p) => (
                <button
                  key={p.path}
                  onClick={() => { setPreviewPath(p.path); setPreviewKey((k) => k + 1); }}
                  data-testid={`preview-tab-${p.path.replace(/\//g, "-")}`}
                  className={`px-3 py-1.5 text-[10px] tracking-[0.18em] uppercase border ${
                    previewPath === p.path
                      ? "border-[#D9772B] text-[#F3EFE7] bg-[#5A1A1F]/30"
                      : "border-[#2D1D1A] text-[#B5A79E] hover:border-[#5A1A1F]"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <a
              href={`${previewPath}?preview=draft`}
              target="_blank"
              rel="noreferrer"
              className="text-[11px] tracking-[0.18em] uppercase text-[#B5A79E] hover:text-[#F3EFE7] inline-flex items-center gap-1"
              data-testid="preview-open-new-tab"
            >
              <ExternalLink size={12} /> Open in new tab
            </a>
          </div>
          <iframe
            ref={iframeRef}
            key={`${previewPath}-${previewKey}`}
            src={`${previewPath}?preview=draft`}
            title="preview"
            className="w-full flex-1 bg-[#0A0504]"
            data-testid="preview-iframe"
          />
        </div>
      </div>

      {/* ─── Auth expired modal — keeps in-memory edits, just need to re-login ─── */}
      {authExpired && (
        <div className="fixed inset-0 z-50 bg-[#0A0504]/90 backdrop-blur-sm flex items-center justify-center p-6" data-testid="auth-expired-modal">
          <form onSubmit={reLogin} className="bg-[#140A09] border border-[#D9772B]/60 w-full max-w-md p-7">
            <p className="text-overline text-[#D9772B]">Session expired</p>
            <h2 className="font-display text-2xl mt-2 leading-tight">Re-login to save your work</h2>
            <p className="text-sm text-[#B5A79E] mt-3">
              Your edits are still here in memory — sign back in and we&apos;ll save them immediately.
            </p>
            <input
              type="email"
              required
              autoFocus
              value={reLoginEmail}
              onChange={(e) => setReLoginEmail(e.target.value)}
              placeholder="Email"
              data-testid="relogin-email"
              className="mt-5 w-full bg-[#0A0504] border border-[#2D1D1A] px-3 py-2.5 text-[#F3EFE7] focus:border-[#D9772B] outline-none"
            />
            <input
              type="password"
              required
              value={reLoginPwd}
              onChange={(e) => setReLoginPwd(e.target.value)}
              placeholder="Password"
              data-testid="relogin-password"
              className="mt-3 w-full bg-[#0A0504] border border-[#2D1D1A] px-3 py-2.5 text-[#F3EFE7] focus:border-[#D9772B] outline-none"
            />
            <button type="submit" data-testid="relogin-submit"
              className="mt-5 w-full px-5 py-3 bg-[#D9772B] text-[#0A0504] text-[11px] tracking-[0.22em] uppercase hover:bg-[#F3EFE7]">
              Re-login & save
            </button>
          </form>
        </div>
      )}

      {/* ─── Version history modal ─── */}
      {historyOpen && (
        <div className="fixed inset-0 z-50 bg-[#0A0504]/85 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-6" data-testid="history-modal">
          <div className="bg-[#140A09] border border-[#2D1D1A] w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#2D1D1A]">
              <div>
                <p className="text-overline">Version history</p>
                <h2 className="font-display text-2xl mt-1">Restore a previous version</h2>
              </div>
              <button onClick={() => setHistoryOpen(false)} data-testid="history-close" className="p-2 border border-[#2D1D1A] hover:border-[#D9772B]">
                <X size={16} />
              </button>
            </div>
            <p className="px-6 pt-4 text-sm text-[#B5A79E]">
              A snapshot is taken automatically every time you publish or reset. Pick a version to restore — your current draft will also be snapshotted first so this is reversible.
            </p>
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-2">
              {historyLoading && <p className="text-[#B5A79E]">Loading…</p>}
              {!historyLoading && history.length === 0 && (
                <p className="text-[#B5A79E] italic">No snapshots yet — publish or reset once and your first snapshot will appear here.</p>
              )}
              {!historyLoading && history.map((h) => (
                <div key={h.id} className="grid grid-cols-12 gap-3 items-center p-3 bg-[#0A0504] border border-[#2D1D1A]" data-testid={`history-row-${h.id}`}>
                  <div className="col-span-7">
                    <p className="font-display text-base text-[#F3EFE7]">{fmtTime(h.created_at)}</p>
                    <p className="text-[10px] tracking-[0.22em] uppercase text-[#B5A79E] mt-1">
                      {h.reason === "publish" ? "Before publish" : h.reason === "reset" ? "Before reset" : h.reason === "pre_restore" ? "Before restore" : h.reason}
                      {h.actor && h.actor !== "system" ? ` · ${h.actor}` : ""}
                    </p>
                  </div>
                  <div className="col-span-5 text-right">
                    <button
                      onClick={() => restoreSnapshot(h.id)}
                      data-testid={`history-restore-${h.id}`}
                      className="px-4 py-2 bg-[#5A1A1F] text-[#F3EFE7] text-[10px] tracking-[0.22em] uppercase hover:bg-[#D9772B] hover:text-[#0A0504]"
                    >
                      Restore
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PageEditor({ pageKey, page, content, onChange }) {
  const [open, setOpen] = useState(pageKey === "landing");
  return (
    <div className="border border-[#2D1D1A]">
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-4 py-3 flex items-center justify-between bg-[#140A09] hover:bg-[#1a0e0c]"
        data-testid={`edit-page-toggle-${pageKey}`}
      >
        <span className="font-display text-lg">{page.label}</span>
        {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
      </button>
      {open && (
        <div className="p-3 space-y-3">
          {Object.entries(page.sections).map(([secKey, sec]) => (
            <SectionEditor
              key={secKey}
              secKey={secKey}
              sec={sec}
              value={content[pageKey]?.[secKey] || {}}
              parentVisible={content[pageKey]?.visible !== false}
              onChange={(path, val) => onChange([secKey, ...path], val)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SectionEditor({ secKey, sec, value, onChange }) {
  const [open, setOpen] = useState(false);
  const visible = value?.visible !== false;
  return (
    <div className={`border ${visible ? "border-[#2D1D1A]" : "border-[#5A1A1F]"}`}>
      <div className="flex items-center justify-between bg-[#0A0504] px-3 py-2.5">
        <button onClick={() => setOpen(!open)} className="flex items-center gap-2 text-left flex-1" data-testid={`edit-section-toggle-${secKey}`}>
          {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          <span className="text-sm">{sec.label}</span>
          {!visible && <span className="text-[10px] tracking-[0.18em] uppercase text-[#D9772B] ml-2">hidden</span>}
        </button>
        {Array.isArray(value) ? null : (
          <button
            onClick={() => onChange(["visible"], !visible)}
            className={`p-1.5 ${visible ? "text-[#B5A79E] hover:text-[#F3EFE7]" : "text-[#D9772B]"}`}
            title={visible ? "Hide this section on the live site" : "Show this section"}
            data-testid={`edit-section-visibility-${secKey}`}
          >
            {visible ? <Eye size={14} /> : <EyeOff size={14} />}
          </button>
        )}
      </div>
      {open && (
        <div className="p-3 space-y-3 bg-[#140A09]">
          {(sec.fields || []).map((f) => (
            <Field
              key={f.key}
              field={f}
              value={value?.[f.key] ?? ""}
              onChange={(v) => onChange([f.key], v)}
            />
          ))}

          {sec.list && (
            <ListEditor
              listKey={sec.list.key === "_self" ? null : sec.list.key}
              listMeta={sec.list}
              value={sec.list.key === "_self" ? (Array.isArray(value) ? value : []) : (value?.[sec.list.key] ?? [])}
              onChange={(arr) => {
                if (sec.list.key === "_self") {
                  onChange([], arr);
                } else {
                  onChange([sec.list.key], arr);
                }
              }}
            />
          )}

          {sec.nested && Object.entries(sec.nested).map(([nKey, n]) => (
            <NestedSection
              key={nKey}
              meta={n}
              value={value?.[nKey] || {}}
              onChange={(path, val) => onChange([nKey, ...path], val)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function NestedSection({ meta, value, onChange }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-[#2D1D1A]">
      <button onClick={() => setOpen(!open)} className="w-full px-3 py-2 text-left flex items-center gap-2 bg-[#0A0504]" data-testid={`edit-nested-${meta.label}`}>
        {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        <span className="text-xs tracking-[0.18em] uppercase text-[#B5A79E]">{meta.label}</span>
      </button>
      {open && (
        <div className="p-3 space-y-3 bg-[#140A09]">
          {meta.fields.map((f) => (
            <Field key={f.key} field={f} value={value?.[f.key] ?? ""} onChange={(v) => onChange([f.key], v)} />
          ))}
        </div>
      )}
    </div>
  );
}

function ListEditor({ listMeta, value, onChange }) {
  return (
    <div className="border border-[#2D1D1A] p-3 bg-[#0A0504]">
      <p className="text-[10px] tracking-[0.22em] uppercase text-[#B5A79E] mb-2">{listMeta.label}</p>
      {(value || []).map((item, i) => (
        <div key={i} className="border-t border-[#2D1D1A] pt-3 mt-3 first:border-t-0 first:pt-0 first:mt-0">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] tracking-[0.18em] uppercase text-[#D9772B]">{listMeta.itemLabel(i)}</p>
            <button
              onClick={() => {
                const next = (value || []).filter((_, idx) => idx !== i);
                onChange(next);
              }}
              className="text-[10px] tracking-[0.18em] uppercase text-[#B5A79E] hover:text-[#D94A3D]"
              data-testid={`edit-list-remove-${i}`}
            >
              Remove
            </button>
          </div>
          {listMeta.fields.map((f) => (
            <Field
              key={f.key}
              field={f}
              value={f.key === "_self" ? item : (item?.[f.key] ?? "")}
              onChange={(v) => {
                const next = [...(value || [])];
                next[i] = f.key === "_self" ? v : { ...(next[i] || {}), [f.key]: v };
                onChange(next);
              }}
            />
          ))}
        </div>
      ))}
      <button
        onClick={() => {
          const blank = listMeta.fields[0]?.key === "_self"
            ? ""
            : Object.fromEntries(listMeta.fields.map((f) => [f.key, ""]));
          onChange([...(value || []), blank]);
        }}
        className="mt-3 px-3 py-1.5 border border-[#2D1D1A] text-[10px] tracking-[0.18em] uppercase hover:border-[#D9772B]"
        data-testid="edit-list-add"
      >
        + Add {listMeta.label.replace(/s$/, "").toLowerCase()}
      </button>
    </div>
  );
}

function Field({ field, value, onChange }) {
  const cls = "w-full bg-[#0A0504] border border-[#2D1D1A] px-3 py-2 text-sm text-[#F3EFE7] focus:border-[#5A1A1F] outline-none";
  return (
    <label className="block">
      <span className="block text-[10px] tracking-[0.18em] uppercase text-[#B5A79E] mb-1">{field.label}</span>
      {field.type === "textarea" ? (
        <textarea
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className={`${cls} resize-y`}
          data-testid={`edit-field-${field.key}`}
        />
      ) : (
        <input
          type={field.type === "url" ? "url" : "text"}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className={cls}
          data-testid={`edit-field-${field.key}`}
        />
      )}
    </label>
  );
}
