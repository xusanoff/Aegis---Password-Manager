import type { VaultFile, VaultSettings } from "./types";

const KEY = "aegis.vault.v1";

export const DEFAULT_SETTINGS: VaultSettings = {
  autoLockMinutes: 5,
};

export function loadVaultFile(): VaultFile | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as VaultFile;
  } catch {
    return null;
  }
}

export function saveVaultFile(file: VaultFile): void {
  window.localStorage.setItem(KEY, JSON.stringify(file));
}

export function vaultExists(): boolean {
  return loadVaultFile() !== null;
}

/** Structural check so a bad/foreign file can't corrupt the app state. */
export function isValidVaultFile(value: unknown): value is VaultFile {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  const kdf = v.kdf as Record<string, unknown> | undefined;
  const verifier = v.verifier as Record<string, unknown> | undefined;
  const vault = v.vault as Record<string, unknown> | undefined;
  return (
    v.version === 1 &&
    !!kdf &&
    typeof kdf.salt === "string" &&
    typeof kdf.iterations === "number" &&
    !!verifier &&
    typeof verifier.ct === "string" &&
    typeof verifier.iv === "string" &&
    !!vault &&
    typeof vault.ct === "string" &&
    typeof vault.iv === "string"
  );
}

export function destroyVaultFile(): void {
  window.localStorage.removeItem(KEY);
}
