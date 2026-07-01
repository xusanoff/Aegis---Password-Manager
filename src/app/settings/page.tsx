"use client";

import { Suspense, useRef, useState } from "react";
import {
  Clock,
  Download,
  Upload,
  KeyRound,
  ShieldAlert,
  Check,
  Eye,
  EyeOff,
  Trash2,
} from "lucide-react";
import { useVault } from "@/context/VaultProvider";
import { estimateStrength } from "@/lib/strength";
import { AppShell } from "@/components/AppShell";
import { StrengthMeter } from "@/components/StrengthMeter";
import { toast } from "@/components/Toaster";

const LOCK_OPTIONS = [
  { value: 1, label: "1 min" },
  { value: 5, label: "5 min" },
  { value: 15, label: "15 min" },
  { value: 30, label: "30 min" },
  { value: 0, label: "Never" },
];

function Section({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-line bg-panel/40 p-5">
      <div className="mb-4 flex items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-panel2 text-accentInk">
          {icon}
        </div>
        <div>
          <h2 className="text-[15px] font-medium text-ink">{title}</h2>
          <p className="text-[12px] text-faint">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function SettingsView() {
  const {
    settings,
    updateSettings,
    changeMasterPassword,
    exportVault,
    importBackup,
    resetVault,
    entries,
  } = useVault();

  const fileRef = useRef<HTMLInputElement>(null);

  async function onImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const text = await file.text();
    const ok = await importBackup(text);
    if (ok) toast("Backup restored — unlock with its master password");
    else toast("That file is not a valid Aegis backup", "info");
  }

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [resetArmed, setResetArmed] = useState(false);

  const strength = estimateStrength(next);
  const canChange =
    current.length > 0 &&
    next.length >= 8 &&
    next === confirm &&
    !busy;

  async function onChangeMaster() {
    if (!canChange) return;
    setBusy(true);
    const ok = await changeMasterPassword(current, next);
    setBusy(false);
    if (ok) {
      toast("Master password changed");
      setCurrent("");
      setNext("");
      setConfirm("");
    } else {
      toast("Current master password is incorrect", "info");
    }
  }

  return (
    <AppShell active="settings">
      <div className="mx-auto max-w-[560px] space-y-4 px-6 py-8">
        <h1 className="mb-2 text-[18px] font-medium text-ink">Settings</h1>

        <Section
          icon={<Clock size={16} />}
          title="Auto-lock"
          description="Lock the vault automatically after a period of inactivity."
        >
          <div className="flex flex-wrap gap-2">
            {LOCK_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  updateSettings({ autoLockMinutes: opt.value });
                  toast("Auto-lock updated");
                }}
                className={`rounded-lg border px-3.5 py-2 text-[13px] transition ${
                  settings.autoLockMinutes === opt.value
                    ? "border-accent/50 bg-accentDim text-accentInk"
                    : "border-line bg-base text-dim hover:border-line2"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </Section>

        <Section
          icon={<KeyRound size={16} />}
          title="Change master password"
          description="Re-encrypts the whole vault with a new key. There is no reset."
        >
          <div className="space-y-3">
            <input
              type={show ? "text" : "password"}
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              placeholder="Current master password"
              className="setting-input"
            />
            <div className="relative">
              <input
                type={show ? "text" : "password"}
                value={next}
                onChange={(e) => setNext(e.target.value)}
                placeholder="New master password"
                className="setting-input pr-10"
              />
              <button
                onClick={() => setShow((s) => !s)}
                aria-label={show ? "Hide" : "Show"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-faint hover:text-dim"
              >
                {show ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {next && <StrengthMeter score={strength.score} bits={strength.bits} />}
            <input
              type={show ? "text" : "password"}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Confirm new master password"
              className="setting-input"
            />
            {confirm && confirm !== next && (
              <div className="text-[12px] text-weak">
                Passwords do not match.
              </div>
            )}
            <button
              onClick={onChangeMaster}
              disabled={!canChange}
              className="flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-[13px] font-medium text-white transition hover:bg-accentHover disabled:opacity-50"
            >
              <Check size={15} />
              Update master password
            </button>
          </div>
        </Section>

        <Section
          icon={<Download size={16} />}
          title="Export backup"
          description="Download an encrypted backup of the vault. It stays unreadable without your master password."
        >
          <button
            onClick={() => {
              exportVault();
              toast("Encrypted backup downloaded");
            }}
            className="flex items-center gap-1.5 rounded-lg border border-line2 px-4 py-2 text-[13px] text-dim transition hover:text-ink"
          >
            <Download size={15} />
            Download vault backup
          </button>
          <p className="mt-2 text-[11px] text-faint">
            {entries.length} credential{entries.length === 1 ? "" : "s"} · exported
            as ciphertext only
          </p>
        </Section>

        <Section
          icon={<Upload size={16} />}
          title="Restore from backup"
          description="Moving to a new device? Load an exported backup file, then unlock it with its master password."
        >
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            onChange={onImportFile}
            className="hidden"
          />
          <button
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-1.5 rounded-lg border border-line2 px-4 py-2 text-[13px] text-dim transition hover:text-ink"
          >
            <Upload size={15} />
            Choose backup file
          </button>
          <p className="mt-2 text-[11px] text-faint">
            This replaces the vault currently on this device.
          </p>
        </Section>

        <Section
          icon={<ShieldAlert size={16} />}
          title="Danger zone"
          description="Permanently erase this vault from this device. This cannot be undone."
        >
          {resetArmed ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  resetVault();
                  toast("Vault erased", "info");
                }}
                className="flex items-center gap-1.5 rounded-lg bg-[#3A1F1F] px-4 py-2 text-[13px] text-weak transition hover:bg-[#4A2525]"
              >
                <Trash2 size={15} />
                Yes, erase everything
              </button>
              <button
                onClick={() => setResetArmed(false)}
                className="rounded-lg border border-line2 px-4 py-2 text-[13px] text-dim hover:text-ink"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setResetArmed(true)}
              className="flex items-center gap-1.5 rounded-lg border border-weak/40 px-4 py-2 text-[13px] text-weak transition hover:bg-[#3A1F1F]"
            >
              <Trash2 size={15} />
              Erase vault
            </button>
          )}
        </Section>
      </div>

      <style>{`
        .setting-input {
          width: 100%;
          height: 42px;
          border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.12);
          background: #14161D;
          padding: 0 12px;
          font-size: 14px;
          color: #EDEEF2;
          outline: none;
        }
        .setting-input::placeholder { color: #6B7180; }
        .setting-input:focus { border-color: rgba(124,92,255,0.6); }
      `}</style>
    </AppShell>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={null}>
      <SettingsView />
    </Suspense>
  );
}
