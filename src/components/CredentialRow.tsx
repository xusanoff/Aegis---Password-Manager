"use client";

import { User, Copy, AlertTriangle, Star } from "lucide-react";
import type { Credential } from "@/lib/types";
import { estimateStrength } from "@/lib/strength";
import { copyToClipboard, initials, tagColor } from "@/lib/format";
import { StrengthDot } from "./StrengthMeter";
import { toast } from "./Toaster";

export function CredentialRow({
  entry,
  reused,
  onOpen,
  onToggleFavorite,
}: {
  entry: Credential;
  reused: boolean;
  onOpen: () => void;
  onToggleFavorite: () => void;
}) {
  const c = tagColor(entry.tag);
  const strength = estimateStrength(entry.password).score;

  async function copy(value: string, label: string, e: React.MouseEvent) {
    e.stopPropagation();
    const ok = await copyToClipboard(value);
    if (ok) toast(`${label} copied`);
  }

  return (
    <div
      onClick={onOpen}
      className={`group flex cursor-pointer items-center gap-3 border-b border-line px-4 py-3 transition hover:bg-panel/50 ${
        reused ? "bg-[#170F14]" : ""
      }`}
    >
      <div
        className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[9px] text-[13px] font-medium"
        style={{ background: c.bg, color: c.text }}
      >
        {initials(entry.service)}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-[14px] text-ink">{entry.service}</span>
          {reused && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-[5px] bg-[#3A1F1F] px-1.5 py-0.5 text-[10px] text-weak">
              <AlertTriangle size={12} />
              Reused
            </span>
          )}
        </div>
        <div className="truncate text-[12px] text-faint">
          {entry.username || entry.url || "—"}
        </div>
      </div>

      {entry.tag && (
        <span
          className="hidden shrink-0 rounded-md px-2 py-0.5 text-[11px] sm:inline"
          style={{ background: c.bg, color: c.text }}
        >
          {entry.tag}
        </span>
      )}

      <div className="hidden shrink-0 md:block">
        <StrengthDot score={strength} />
      </div>

      <div className="flex shrink-0 items-center gap-0.5">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite();
          }}
          aria-label="Toggle favorite"
          className={`rounded-md p-1.5 transition hover:bg-panel2 ${
            entry.favorite
              ? "text-fair"
              : "text-faint opacity-0 group-hover:opacity-100"
          }`}
        >
          <Star size={16} fill={entry.favorite ? "#E5A94F" : "none"} />
        </button>
        {entry.username && (
          <button
            onClick={(e) => copy(entry.username, "Username", e)}
            aria-label="Copy username"
            className="rounded-md p-1.5 text-faint transition hover:bg-panel2 hover:text-dim"
          >
            <User size={16} />
          </button>
        )}
        <button
          onClick={(e) => copy(entry.password, "Password", e)}
          aria-label="Copy password"
          className="rounded-md p-1.5 text-dim transition hover:bg-panel2 hover:text-ink"
        >
          <Copy size={16} />
        </button>
      </div>
    </div>
  );
}
