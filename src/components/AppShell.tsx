"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  ShieldEllipsis,
  KeyRound,
  Star,
  Wand2,
  Settings,
  Lock,
  Plus,
  Menu,
  X,
} from "lucide-react";
import { useVault } from "@/context/VaultProvider";
import { tagColor } from "@/lib/format";
import { LockScreen } from "./LockScreen";
import { Onboarding } from "./Onboarding";
import { Toaster } from "./Toaster";

function Avatar() {
  return (
    <div className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-accentDim text-[12px] font-medium text-accentInk">
      AK
    </div>
  );
}

function NavItem({
  href,
  icon,
  label,
  active,
  count,
  onNavigate,
}: {
  href: string;
  icon: ReactNode;
  label: string;
  active: boolean;
  count?: number;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] transition ${
        active
          ? "bg-panel2 text-ink"
          : "text-dim hover:bg-panel2/50 hover:text-ink"
      }`}
    >
      <span className={active ? "text-accentInk" : "text-faint"}>{icon}</span>
      <span className="flex-1">{label}</span>
      {count !== undefined && (
        <span className="text-[11px] text-faint">{count}</span>
      )}
    </Link>
  );
}

function SidebarNav({
  active,
  onNavigate,
}: {
  active: string;
  onNavigate?: () => void;
}) {
  const { entries, tags } = useVault();
  const pathname = usePathname();
  const params = useSearchParams();
  const currentTag = params.get("tag");
  const currentFilter = params.get("filter");
  const onVault = pathname === "/vault";

  return (
    <>
      <Link
        href="/vault?new=1"
        onClick={onNavigate}
        className="mb-4 flex h-[34px] items-center justify-center gap-1.5 rounded-lg bg-accent text-[13px] font-medium text-white transition hover:bg-accentHover"
      >
        <Plus size={16} />
        New credential
      </Link>

      <NavItem
        href="/vault"
        icon={<KeyRound size={16} />}
        label="All items"
        active={onVault && !currentTag && !currentFilter}
        count={entries.length}
        onNavigate={onNavigate}
      />
      <NavItem
        href="/vault?filter=favorites"
        icon={<Star size={16} />}
        label="Favorites"
        active={onVault && currentFilter === "favorites"}
        count={entries.filter((e) => e.favorite).length}
        onNavigate={onNavigate}
      />

      {tags.length > 0 && (
        <>
          <div className="px-2.5 pb-1.5 pt-4 text-[11px] uppercase tracking-wide text-faint">
            Tags
          </div>
          {tags.map((tag) => {
            const c = tagColor(tag);
            return (
              <Link
                key={tag}
                href={`/vault?tag=${encodeURIComponent(tag)}`}
                onClick={onNavigate}
                className={`flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] transition ${
                  onVault && currentTag === tag
                    ? "bg-panel2 text-ink"
                    : "text-dim hover:bg-panel2/50 hover:text-ink"
                }`}
              >
                <span
                  className="h-2 w-2 rounded-[2px]"
                  style={{ background: c.text }}
                />
                <span className="flex-1 truncate">{tag}</span>
              </Link>
            );
          })}
        </>
      )}

      <div className="my-3 border-t border-line" />

      <NavItem
        href="/generator"
        icon={<Wand2 size={16} />}
        label="Generator"
        active={active === "generator"}
        onNavigate={onNavigate}
      />
      <NavItem
        href="/settings"
        icon={<Settings size={16} />}
        label="Settings"
        active={active === "settings"}
        onNavigate={onNavigate}
      />
    </>
  );
}

function Sidebar({ active }: { active: string }) {
  return (
    <aside className="hidden w-[188px] shrink-0 flex-col border-r border-line bg-[#0C0E13] p-3 md:flex">
      <SidebarNav active={active} />
    </aside>
  );
}

function MobileDrawer({
  active,
  open,
  onClose,
}: {
  active: string;
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 md:hidden">
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className="absolute left-0 top-0 flex h-full w-[248px] flex-col overflow-y-auto border-r border-line bg-[#0C0E13] p-3"
        style={{ animation: "drawerIn 0.2s ease-out" }}
      >
        <div className="mb-3 flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <div className="flex h-[26px] w-[26px] items-center justify-center rounded-[7px] bg-accent">
              <ShieldEllipsis size={15} className="text-white" />
            </div>
            <span className="text-[15px] font-medium text-ink">Aegis</span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="rounded-md p-1 text-faint transition hover:bg-panel2 hover:text-ink"
          >
            <X size={18} />
          </button>
        </div>
        <SidebarNav active={active} onNavigate={onClose} />
      </aside>
    </div>
  );
}

function Topbar({
  center,
  onMenu,
}: {
  center?: ReactNode;
  onMenu: () => void;
}) {
  const { lock } = useVault();
  return (
    <header className="flex h-[57px] shrink-0 items-center gap-2 border-b border-line bg-elev px-3 sm:gap-4 sm:px-4">
      <button
        onClick={onMenu}
        aria-label="Open menu"
        className="rounded-md p-1 text-dim transition hover:bg-panel2 hover:text-ink md:hidden"
      >
        <Menu size={20} />
      </button>

      <Link href="/vault" className="flex items-center gap-2">
        <div className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-[7px] bg-accent">
          <ShieldEllipsis size={15} className="text-white" />
        </div>
        <span className="hidden text-[15px] font-medium text-ink sm:inline">
          Aegis
        </span>
      </Link>

      <div className="flex min-w-0 flex-1 justify-center">{center}</div>

      <button
        onClick={lock}
        className="flex shrink-0 items-center gap-1.5 rounded-lg border border-line2 bg-panel px-2.5 py-1.5 text-[12px] text-dim transition hover:text-ink"
      >
        <Lock size={15} />
        <span className="hidden sm:inline">Lock</span>
      </button>
      <Avatar />
    </header>
  );
}

export function AppShell({
  active,
  center,
  children,
}: {
  active: "vault" | "generator" | "settings";
  center?: ReactNode;
  children: ReactNode;
}) {
  const { status, registerActivity } = useVault();
  const lastPing = useRef(0);
  const [secure, setSecure] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setSecure(
      typeof window === "undefined"
        ? true
        : window.isSecureContext && !!window.crypto?.subtle
    );
  }, []);

  useEffect(() => {
    function onActivity() {
      const now = Date.now();
      if (now - lastPing.current > 15000) {
        lastPing.current = now;
        registerActivity();
      }
    }
    window.addEventListener("mousemove", onActivity);
    window.addEventListener("keydown", onActivity);
    window.addEventListener("click", onActivity);
    return () => {
      window.removeEventListener("mousemove", onActivity);
      window.removeEventListener("keydown", onActivity);
      window.removeEventListener("click", onActivity);
    };
  }, [registerActivity]);

  if (!secure) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-panel text-fair">
          <Lock size={22} />
        </div>
        <h1 className="text-[16px] font-medium text-ink">Secure connection required</h1>
        <p className="mt-2 max-w-[360px] text-[13px] leading-relaxed text-dim">
          Aegis encrypts everything in your browser, which needs a secure
          context. Open the app over HTTPS or on localhost.
        </p>
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center text-faint">
        <ShieldEllipsis size={22} className="animate-pulse" />
      </div>
    );
  }
  if (status === "onboarding")
    return (
      <>
        <Onboarding />
        <Toaster />
      </>
    );
  if (status === "locked")
    return (
      <>
        <LockScreen />
        <Toaster />
      </>
    );

  return (
    <div className="flex h-screen flex-col">
      <Topbar center={center} onMenu={() => setMenuOpen(true)} />
      <div className="flex min-h-0 flex-1">
        <Sidebar active={active} />
        <MobileDrawer
          active={active}
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
        />
        <main className="min-w-0 flex-1 overflow-y-auto bg-base">{children}</main>
      </div>
      <Toaster />
    </div>
  );
}
