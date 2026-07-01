export function uid(): string {
  return (
    Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
  );
}

/** Deterministic accent for a tag so colors stay consistent across the app. */
const TAG_COLORS: { text: string; bg: string }[] = [
  { text: "#7FB0FF", bg: "#182338" }, // blue
  { text: "#E5A94F", bg: "#332616" }, // amber
  { text: "#4FD6A0", bg: "#16291F" }, // green
  { text: "#D89BFF", bg: "#2A1F3A" }, // violet
  { text: "#FF9BB0", bg: "#3A1F27" }, // pink
  { text: "#7FE0E5", bg: "#16292B" }, // teal
];

export function tagColor(tag: string): { text: string; bg: string } {
  if (!tag) return { text: "#9BA1AD", bg: "#1B1E26" };
  let h = 0;
  for (let i = 0; i < tag.length; i++) h = (h * 31 + tag.charCodeAt(i)) >>> 0;
  return TAG_COLORS[h % TAG_COLORS.length];
}

export function initials(name: string): string {
  const clean = name.trim();
  if (!clean) return "??";
  const parts = clean.split(/\s+/);
  if (parts.length === 1) return clean.slice(0, 2);
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through to legacy path
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

export function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const min = Math.round(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  if (day < 30) return `${day}d ago`;
  return new Date(ts).toLocaleDateString();
}
