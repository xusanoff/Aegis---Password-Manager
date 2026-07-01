"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw, Copy, Check } from "lucide-react";
import {
  generatePassword,
  estimateStrength,
  type GeneratorOptions,
} from "@/lib/strength";
import { copyToClipboard } from "@/lib/format";
import { StrengthMeter } from "./StrengthMeter";
import { toast } from "./Toaster";

const DEFAULTS: GeneratorOptions = {
  length: 20,
  uppercase: true,
  lowercase: true,
  numbers: true,
  symbols: true,
};

export function Generator({
  onUse,
  compact = false,
}: {
  onUse?: (value: string) => void;
  compact?: boolean;
}) {
  const [opts, setOpts] = useState<GeneratorOptions>(DEFAULTS);
  const [value, setValue] = useState("");
  const [copied, setCopied] = useState(false);

  const regenerate = useCallback(() => {
    setValue(generatePassword(opts));
  }, [opts]);

  useEffect(() => {
    setValue(generatePassword(opts));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opts]);

  const strength = estimateStrength(value);

  async function handleCopy() {
    const ok = await copyToClipboard(value);
    if (ok) {
      setCopied(true);
      toast("Password copied");
      setTimeout(() => setCopied(false), 1200);
    }
  }

  function toggle(key: keyof GeneratorOptions) {
    setOpts((o) => {
      const next = { ...o, [key]: !o[key] };
      const anyOn =
        next.uppercase || next.lowercase || next.numbers || next.symbols;
      if (!anyOn) return o; // keep at least one set on
      return next;
    });
  }

  return (
    <div className={compact ? "" : "rounded-xl border border-line bg-panel p-5"}>
      <div className="flex items-center gap-2 rounded-lg border border-line2 bg-base px-3 py-3">
        <code className="flex-1 break-all font-mono text-[15px] text-ink">
          {value}
        </code>
        <button
          onClick={regenerate}
          aria-label="Regenerate password"
          className="rounded-md p-1.5 text-dim transition hover:bg-panel2 hover:text-ink"
        >
          <RefreshCw size={16} />
        </button>
        <button
          onClick={handleCopy}
          aria-label="Copy password"
          className="rounded-md p-1.5 text-dim transition hover:bg-panel2 hover:text-ink"
        >
          {copied ? <Check size={16} className="text-strong" /> : <Copy size={16} />}
        </button>
      </div>

      <StrengthMeter score={strength.score} bits={strength.bits} />

      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between text-[13px]">
          <label htmlFor="len" className="text-dim">
            Length
          </label>
          <span className="font-mono text-ink">{opts.length}</span>
        </div>
        <input
          id="len"
          type="range"
          min={8}
          max={48}
          step={1}
          value={opts.length}
          onChange={(e) =>
            setOpts((o) => ({ ...o, length: Number(e.target.value) }))
          }
          className="w-full accent-accent"
        />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        {(
          [
            ["uppercase", "A–Z"],
            ["lowercase", "a–z"],
            ["numbers", "0–9"],
            ["symbols", "!@#$"],
          ] as [keyof GeneratorOptions, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => toggle(key)}
            className={`flex items-center justify-between rounded-lg border px-3 py-2 text-[13px] transition ${
              opts[key]
                ? "border-accent/50 bg-accentDim text-accentInk"
                : "border-line bg-base text-dim hover:border-line2"
            }`}
          >
            <span>{label}</span>
            <span
              className={`h-2 w-2 rounded-full ${
                opts[key] ? "bg-accent" : "bg-faint/40"
              }`}
            />
          </button>
        ))}
      </div>

      {onUse && (
        <button
          onClick={() => onUse(value)}
          className="mt-4 w-full rounded-lg bg-accent py-2.5 text-[14px] font-medium text-white transition hover:bg-accentHover"
        >
          Use this password
        </button>
      )}
    </div>
  );
}
