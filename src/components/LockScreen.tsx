"use client";

import { useState } from "react";
import { ShieldCheck, Lock, Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react";
import { useVault } from "@/context/VaultProvider";

export function LockScreen() {
  const { unlock, error } = useVault();
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!password || busy) return;
    setBusy(true);
    await unlock(password);
    setBusy(false);
    setPassword("");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent">
        <Lock size={28} className="text-white" />
      </div>
      <div className="text-xl font-medium tracking-wide text-ink">Aegis</div>
      <div className="mb-7 mt-0.5 text-[13px] text-faint">Team vault</div>

      <div className="mb-1 text-[17px] font-medium text-ink">Vault locked</div>
      <div className="mb-6 text-[13px] text-dim">
        Enter your master password to unlock
      </div>

      <div className="w-full max-w-[340px]">
        <div className="mb-3 flex h-[46px] items-center gap-2.5 rounded-xl border border-line2 bg-panel px-3">
          <Lock size={18} className="text-faint" />
          <input
            type={show ? "text" : "password"}
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="Master password"
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

        {error && (
          <div className="mb-3 text-center text-[12px] text-weak">{error}</div>
        )}

        <button
          onClick={submit}
          disabled={busy || !password}
          className="flex h-[46px] w-full items-center justify-center gap-2 rounded-xl bg-accent text-[15px] font-medium text-white transition hover:bg-accentHover disabled:opacity-60"
        >
          {busy ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <>
              Unlock vault
              <ArrowRight size={18} />
            </>
          )}
        </button>
      </div>

      <div className="mt-7 flex items-center gap-1.5 text-[12px] text-faint">
        <ShieldCheck size={15} className="text-strong" />
        End-to-end encrypted · AES-256
      </div>
    </div>
  );
}
