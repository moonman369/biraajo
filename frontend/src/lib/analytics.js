import { API } from "@/lib/api";

const VISITOR_KEY = "biraajo_visitor_id";

function getVisitorId() {
  let id = localStorage.getItem(VISITOR_KEY);
  if (!id) {
    id =
      (crypto.randomUUID && crypto.randomUUID()) ||
      `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(VISITOR_KEY, id);
  }
  return id;
}

export function trackPageView(path) {
  if (!path || path.startsWith("/admin")) return;
  try {
    const payload = JSON.stringify({
      path,
      referrer: document.referrer || "",
      visitor_id: getVisitorId(),
    });
    const url = `${API}/analytics/track`;
    if (navigator.sendBeacon) {
      navigator.sendBeacon(url, new Blob([payload], { type: "application/json" }));
    } else {
      fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: payload, keepalive: true });
    }
  } catch (e) {
    /* analytics must never break the page */
  }
}
