/**
 * Site content loader.
 *
 * - On the public site, fetches the PUBLISHED content.
 * - In the admin preview iframe (URL `?preview=draft`), fetches the DRAFT content
 *   and auto-refreshes when the parent window posts a "biraajo:content-changed" message.
 *
 * Returns `content` (the full nested object) and `loading`.
 *
 * Usage:
 *   const { content } = useSiteContent();
 *   const hero = content?.landing?.hero;
 */
import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";

export function useSiteContent() {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);

  const mode = (() => {
    if (typeof window === "undefined") return "published";
    const sp = new URLSearchParams(window.location.search);
    return sp.get("preview") === "draft" ? "draft" : "published";
  })();

  const load = useCallback(async () => {
    try {
      const { data } = await api.get(`/site-content`, { params: { mode } });
      setContent(data);
    } catch {
      setContent(null);
    } finally {
      setLoading(false);
    }
  }, [mode]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (mode !== "draft") return;
    const onMsg = (e) => {
      if (e?.data === "biraajo:content-changed") load();
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [mode, load]);

  return { content, loading, mode };
}

// Convenience reader with default fallback. `path` is dot-notation: "landing.hero.title".
export function read(content, path, fallback = "") {
  if (!content) return fallback;
  const parts = path.split(".");
  let cur = content;
  for (const p of parts) {
    if (cur == null) return fallback;
    cur = cur[p];
  }
  return cur ?? fallback;
}
