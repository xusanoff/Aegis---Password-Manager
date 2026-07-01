"use client";

import { useState } from "react";
import {
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  KeyRound,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { useVault } from "@/context/VaultProvider";
import { estimateStrength } from "@/lib/strength";
import { StrengthMeter } from "./StrengthMeter";

export function Onboarding() {
  const { createVault } = useVault();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [touched, setTouched] = useState(false);

  const strength = estimateStrength(password);
  const tooShort = password.length > 0 && password.length < 8;
  const mismatch = confirm.length > 0 && confirm !== password;
  const canSubmit =
    password.length >= 8 && confirm === password && !busy;

  async function submit() {
    setTouched(true);
    if (!canSubmit) return;
    setBusy(true);
    await createVault(password);
    setBusy(false);
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-[400px]">
        <div className="mb-5 flex flex-col items-center text-center">
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent">
            <KeyRound size={28} className="text-white" />
          </div>
          <div className="text-xl font-medium tracking-wide text-ink">
            Create your vault
          </div>
          <p className="mt-2 max-w-[320px] text-[13px] leading-relaxed text-dim">
            Choose a master password. It encrypts everything and never leaves
            this device — so there is no way to recover it. Make it strong and
            memorable.
          </p>
        </div>

        <label className="mb-1.5 block text-[13px] text-dim">
          Master password
        </label>
        <div className="mb-2 flex h-[46px] items-center gap-2.5 rounded-xl border border-line2 bg-panel px-3">
          <Lock size={18} className="text-faint" />
          <input
            type={show ? "text" : "password"}
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            className="flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-faint"
          />
          <button
            onClick={() => setShow((s) => !s)}
            aria-label={show ? "Hide password" : "Show password"}
            className="text-faint transition hover:text-dim"
          >
            {show ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {password && <StrengthMeter score={strength.score} bits={strength.bits} />}
        {tooShort && (
          <div className="mt-1.5 text-[12px] text-weak">
            Use at least 8 characters.
          </div>
        )}

        <label className="mb-1.5 mt-4 block text-[13px] text-dim">
          Confirm master password
        </label>
        <div className="flex h-[46px] items-center gap-2.5 rounded-xl border border-line2 bg-panel px-3">
          <Lock size={18} className="text-faint" />
          <input
            type={show ? "text" : "password"}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="Type it again"
            className="flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-faint"
          />
        </div>
        {mismatch && (
          <div className="mt-1.5 text-[12px] text-weak">
            Passwords do not match.
          </div>
        )}

        <div className="mt-4 flex items-start gap-2 rounded-lg border border-line bg-panel/60 px-3 py-2.5">
          <AlertTriangle size={15} className="mt-0.5 shrink-0 text-fair" />
          <span className="text-[12px] leading-relaxed text-dim">
            There is no password reset. If you lose your master password, the
            vault cannot be decrypted. Keep a backup.
          </span>
        </div>

        <button
          onClick={submit}
          disabled={touched && !canSubmit}
          className="mt-5 flex h-[46px] w-full items-center justify-center gap-2 rounded-xl bg-accent text-[15px] font-medium text-white transition hover:bg-accentHover disabled:opacity-60"
        >
          {busy ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <>
              Create vault
              <ArrowRight size={18} />
            </>
          )}
        </button>

        <div className="mt-6 flex items-center justify-center gap-1.5 text-[12px] text-faint">
          <ShieldCheck size={15} className="text-strong" />
          Encrypted locally with AES-256 · zero-knowledge
        </div>
      </div>
    </div>
  );
}
