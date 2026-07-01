"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  KeyRound,
  Star,
  ShieldCheck,
  AlertTriangle,
  Plus,
  Inbox,
} from "lucide-react";
import { useVault, type CredentialInput } from "@/context/VaultProvider";
import type { Credential } from "@/lib/types";
import { estimateStrength } from "@/lib/strength";
import { AppShell } from "@/components/AppShell";
import { CredentialRow } from "@/components/CredentialRow";
import { CredentialModal } from "@/components/CredentialModal";
import { EmptyState } from "@/components/EmptyState";
import { toast } from "@/components/Toaster";

function VaultView() {
  const {
    entries,
    reusedIds,
    tags,
    addEntry,
    updateEntry,
    deleteEntry,
    toggleFavorite,
  } = useVault();
  const router = useRouter();
  const params = useSearchParams();

  const tag = params.get("tag");
  const filter = params.get("filter");
  const isNew = params.get("new") === "1";

  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"recent" | "name">("recent");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Credential | null>(null);

  useEffect(() => {
    if (isNew) {
      setEditing(null);
      setModalOpen(true);
      router.replace("/vault");
    }
  }, [isNew, router]);

  const heading = tag
    ? tag
    : filter === "favorites"
    ? "Favorites"
    : "All items";

  const visible = useMemo(() => {
    let list = entries;
    if (tag) list = list.filter((e) => e.tag === tag);
    if (filter === "favorites") list = list.filter((e) => e.favorite);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (e) =>
          e.service.toLowerCase().includes(q) ||
          e.username.toLowerCase().includes(q) ||
          e.url.toLowerCase().includes(q) ||
          e.tag.toLowerCase().includes(q)
      );
    }
    const sorted = [...list];
    if (sort === "name")
      sorted.sort((a, b) => a.service.localeCompare(b.service));
    else sorted.sort((a, b) => b.updatedAt - a.updatedAt);
    return sorted;
  }, [entries, tag, filter, search, sort]);

  const health = useMemo(() => {
    let weak = 0;
    let strong = 0;
    for (const e of entries) {
      const s = estimateStrength(e.password).score;
      if (s === "weak") weak++;
      if (s === "strong") strong++;
    }
    return { weak, strong, reused: reusedIds.size };
  }, [entries, reusedIds]);

  function openNew() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(entry: Credential) {
    setEditing(entry);
    setModalOpen(true);
  }

  async function handleSave(input: CredentialInput) {
    if (editing) {
      await updateEntry(editing.id, input);
      toast("Credential updated");
    } else {
      await addEntry(input);
      toast("Credential added");
    }
    setModalOpen(false);
    setEditing(null);
  }

  async function handleDelete() {
    if (!editing) return;
    await deleteEntry(editing.id);
    toast("Credential deleted");
    setModalOpen(false);
    setEditing(null);
  }

  const searchBox = (
    <div className="flex h-9 w-full max-w-[360px] items-center gap-2 rounded-lg border border-line bg-panel px-3">
      <Search size={16} className="text-faint" />
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search credentials…"
        className="w-full bg-transparent text-[13px] text-ink outline-none placeholder:text-faint"
      />
    </div>
  );

  const totallyEmpty = entries.length === 0;

  return (
    <AppShell active="vault" center={searchBox}>
      {totallyEmpty ? (
        <EmptyState
          icon={<KeyRound size={26} />}
          title="Your vault is empty"
          description="Add your first shared credential. It is encrypted on this device the moment you save it — no one else can read it without the master password."
          action={
            <button
              onClick={openNew}
              className="flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2.5 text-[14px] font-medium text-white transition hover:bg-accentHover"
            >
              <Plus size={16} />
              Add first credential
            </button>
          }
        />
      ) : (
        <div className="mx-auto max-w-[860px]">
          <div className="flex items-center justify-between px-4 pb-2.5 pt-4">
            <div className="text-[14px] font-medium text-ink">
              {heading}{" "}
              <span className="font-normal text-faint">· {visible.length}</span>
            </div>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as "recent" | "name")}
              className="rounded-md border border-line bg-panel px-2 py-1 text-[12px] text-dim outline-none"
            >
              <option value="recent">Recently updated</option>
              <option value="name">Name (A–Z)</option>
            </select>
          </div>

          {!tag && !filter && !search && (
            <div className="mx-4 mb-3 flex flex-wrap items-center gap-4 rounded-xl border border-line bg-panel/50 px-4 py-3 text-[12px]">
              <span className="flex items-center gap-1.5 text-strong">
                <ShieldCheck size={15} /> {health.strong} strong
              </span>
              <span className="flex items-center gap-1.5 text-fair">
                <AlertTriangle size={15} /> {health.weak} weak
              </span>
              <span className="flex items-center gap-1.5 text-weak">
                <AlertTriangle size={15} /> {health.reused} reused
              </span>
              <span className="ml-auto text-faint">
                Vault health at a glance
              </span>
            </div>
          )}

          {visible.length === 0 ? (
            <EmptyState
              icon={<Inbox size={26} />}
              title="No matches"
              description="No credentials match this view. Try a different search or filter."
            />
          ) : (
            <div className="mx-4 overflow-hidden rounded-xl border border-line bg-[#0B0C11]">
              {visible.map((entry) => (
                <CredentialRow
                  key={entry.id}
                  entry={entry}
                  reused={reusedIds.has(entry.id)}
                  onOpen={() => openEdit(entry)}
                  onToggleFavorite={() => toggleFavorite(entry.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {modalOpen && (
        <CredentialModal
          entry={editing}
          knownTags={tags}
          onClose={() => {
            setModalOpen(false);
            setEditing(null);
          }}
          onSave={handleSave}
          onDelete={editing ? handleDelete : undefined}
        />
      )}
    </AppShell>
  );
}

export default function VaultPage() {
  return (
    <Suspense fallback={null}>
      <VaultView />
    </Suspense>
  );
}
