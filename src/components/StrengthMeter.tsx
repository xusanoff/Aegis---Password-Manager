"use client";

import type { Strength } from "@/lib/types";

const MAP: Record<Strength, { label: string; color: string; fill: number }> = {
  weak: { label: "Weak", color: "#E5674F", fill: 33 },
  fair: { label: "Fair", color: "#E5A94F", fill: 66 },
  strong: { label: "Strong", color: "#4FD6A0", fill: 100 },
};

export function StrengthDot({ score }: { score: Strength }) {
  const m = MAP[score];
  return (
    <span className="inline-flex items-center gap-1.5" style={{ width: 64 }}>
      <span
        className="h-[7px] w-[7px] rounded-full"
        style={{ background: m.color }}
      />
      <span className="text-[11px]" style={{ color: m.color }}>
        {m.label}
      </span>
    </span>
  );
}

export function StrengthMeter({
  score,
  bits,
}: {
  score: Strength;
  bits?: number;
}) {
  const m = MAP[score];
  return (
    <div className="mt-2">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-panel2">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${m.fill}%`, background: m.color }}
        />
      </div>
      <div className="mt-1.5 flex items-center justify-between">
        <span className="text-[12px]" style={{ color: m.color }}>
          {m.label}
        </span>
        {bits !== undefined && bits > 0 && (
          <span className="text-[11px] text-faint">{bits} bits entropy</span>
        )}
      </div>
    </div>
  );
}
