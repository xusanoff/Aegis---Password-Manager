"use client";

import { useEffect, useState } from "react";
import {
  X,
  Eye,
  EyeOff,
  Copy,
  Wand2,
  Trash2,
  Check,
} from "lucide-react";
import type { Credential } from "@/lib/types";
import type { CredentialInput } from "@/context/VaultProvider";
import { estimateStrength } from "@/lib/strength";
import { copyToClipboard } from "@/lib/format";
import { StrengthMeter } from "./StrengthMeter";
import { Generator } from "./Generator";
import { toast } from "./Toaster";

const EMPTY: CredentialInput = {
  service: "",
  url: "",
  username: "",
  password: "",
  notes: "",
  tag: "",
};

export function CredentialModal({
  entry,
  knownTags,
  onClose,
  onSave,
  onDelete,
}: {
  entry: Credential | null;
  knownTags: string[];
  onClose: () => void;
  onSave: (input: CredentialInput) => void;
  onDelete?: () => void;
}) {
  const [form, setForm] = useState<CredentialInput>(EMPTY);
  const [show, setShow] = useState(false);
  const [showGen, setShowGen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (entry) {
      setForm({
        service: entry.service,
        url: entry.url,
        username: entry.username,
        password: entry.password,
        notes: entry.notes,
        tag: entry.tag,
        favorite: entry.favorite,
      });
    } else {
      setForm(EMPTY);
    }
  }, [entry]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const strength = estimateStrength(form.password);
  const canSave = form.service.trim().length > 0;

  function set<K extends keyof CredentialInput>(
    key: K,
    value: CredentialInput[K]
  ) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function copyPassword() {
    const ok = await copyToClipboard(form.password);
    if (ok) toast("Password copied");
  }

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/55 p-4 py-10"
      style={{ animation: "overlayIn 0.15s ease-out" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[480px] rounded-2xl border border-line2 bg-[#0E1016]"
        style={{ animation: "modalIn 0.18s ease-out" }}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="text-[16px] font-medium text-ink">
            {entry ? "Edit credential" : "New credential"}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1 text-faint transition hover:bg-panel2 hover:text-ink"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 px-5 py-5">
          <Field label="Service name">
            <input
              autoFocus
              value={form.service}
              onChange={(e) => set("service", e.target.value)}
              placeholder="Salesforce CRM"
              className="input"
            />
          </Field>

          <Field label="URL">
            <input
              value={form.url}
              onChange={(e) => set("url", e.target.value)}
              placeholder="login.salesforce.com"
              className="input"
            />
          </Field>

          <Field label="Username">
            <input
              value={form.username}
              onChange={(e) => set("username", e.target.value)}
              placeholder="admin@acme.com"
              className="input"
            />
          </Field>

          <Field label="Password">
            <div className="flex items-center gap-1 rounded-lg border border-line2 bg-panel px-3">
              <input
                type={show ? "text" : "password"}
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
                placeholder="••••••••••••"
                className="h-[42px] flex-1 bg-transparent font-mono text-[14px] text-ink outline-none placeholder:font-sans placeholder:text-faint"
              />
              <IconBtn
                label={show ? "Hide" : "Show"}
                onClick={() => setShow((s) => !s)}
              >
                {show ? <EyeOff size={16} /> : <Eye size={16} />}
              </IconBtn>
              <IconBtn label="Copy password" onClick={copyPassword}>
                <Copy size={16} />
              </IconBtn>
              <IconBtn
                label="Open generator"
                onClick={() => setShowGen((g) => !g)}
                active={showGen}
              >
                <Wand2 size={16} />
              </IconBtn>
            </div>
            {form.password && (
              <StrengthMeter score={strength.score} bits={strength.bits} />
            )}
            {showGen && (
              <div className="mt-3 rounded-xl border border-line bg-panel p-4">
                <Generator
                  compact
                  onUse={(v) => {
                    set("password", v);
                    setShowGen(false);
                    setShow(true);
                  }}
                />
              </div>
            )}
          </Field>

          <Field label="Tag">
            <input
              value={form.tag}
              onChange={(e) => set("tag", e.target.value)}
              placeholder="Engineering"
              list="known-tags"
              className="input"
            />
            <datalist id="known-tags">
              {knownTags.map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>
          </Field>

          <Field label="Notes">
            <textarea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Optional notes"
              rows={2}
              className="input resize-none py-2"
            />
          </Field>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-line px-5 py-4">
          {entry && onDelete ? (
            confirmDelete ? (
              <button
                onClick={onDelete}
                className="flex items-center gap-1.5 rounded-lg bg-[#3A1F1F] px-3 py-2 text-[13px] text-weak transition hover:bg-[#4A2525]"
              >
                <Trash2 size={15} />
                Confirm delete
              </button>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                aria-label="Delete credential"
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] text-faint transition hover:bg-panel2 hover:text-weak"
              >
                <Trash2 size={15} />
                Delete
              </button>
            )
          ) : (
            <span />
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="rounded-lg border border-line2 px-4 py-2 text-[13px] text-dim transition hover:text-ink"
            >
              Cancel
            </button>
            <button
              onClick={() => canSave && onSave(form)}
              disabled={!canSave}
              className="flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-[13px] font-medium text-white transition hover:bg-accentHover disabled:opacity-50"
            >
              <Check size={15} />
              {entry ? "Save changes" : "Add credential"}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .input {
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
        .input::placeholder { color: #6B7180; }
        .input:focus { border-color: rgba(124,92,255,0.6); }
        textarea.input { height: auto; }
      `}</style>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[12px] text-dim">{label}</label>
      {children}
    </div>
  );
}

function IconBtn({
  children,
  label,
  onClick,
  active,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={`rounded-md p-1.5 transition hover:bg-panel2 ${
        active ? "text-accentInk" : "text-faint hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}
