import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronDown, ChevronRight, Eye, EyeOff, ExternalLink, RotateCcw, Send } from "lucide-react";
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
      reel: {
        label: "Reel",
        fields: [
          { key: "eyebrow", label: "Eyebrow", type: "text" },
          { key: "title", label: "Title", type: "text" },
          { key: "title_italic", label: "Title (italic)", type: "text" },
          { key: "video_url", label: "Video URL", type: "url" },
        ],
      },
      notes: {
        label: "Three notes",
        list: {
          key: "_self",
          label: "Notes",
          itemLabel: (i) => `Note ${i + 1}`,
          fields: [
            { key: "head", label: "Heading", type: "text" },
            { key: "body", label: "Body", type: "textarea" },
          ],
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

  // Load draft
  useEffect(() => {
    api.get("/site-content", { params: { mode: "draft" } })
      .then((r) => setContent(r.data))
      .catch(() => toast.error("Could not load site content"))
      .finally(() => setLoading(false));
  }, []);

  const queueAutosave = (next) => {
    setContent(next);
    setDirty(true);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => doSave(next), 600);
  };

  const doSave = async (data) => {
    setSaving(true);
    try {
      await api.put("/admin/site-content/draft", data);
      setDirty(false);
      // Tell iframe to refresh content
      iframeRef.current?.contentWindow?.postMessage("biraajo:content-changed", "*");
    } catch {
      toast.error("Save failed");
    } finally {
      setSaving(false);
    }
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
          <button onClick={discard} data-testid="edit-discard" className="px-4 py-2 border border-[#2D1D1A] text-[11px] tracking-[0.18em] uppercase hover:border-[#D94A3D] hover:text-[#D94A3D] inline-flex items-center gap-2">
            <RotateCcw size={12} /> Discard draft
          </button>
          <button onClick={publish} data-testid="edit-publish" className="px-5 py-2 bg-[#D9772B] text-[#0A0504] text-[11px] tracking-[0.18em] uppercase hover:bg-[#F3EFE7] inline-flex items-center gap-2">
            <Send size={12} /> Publish to live
          </button>
        </div>
      </div>

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
