"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  Credential,
  VaultFile,
  VaultSettings,
  VaultStatus,
} from "@/lib/types";
import {
  deriveKey,
  encryptJSON,
  decryptJSON,
  makeVerifier,
  checkVerifier,
  newSalt,
  sha256Hex,
  PBKDF2_ITERATIONS,
} from "@/lib/crypto";
import {
  loadVaultFile,
  saveVaultFile,
  vaultExists,
  destroyVaultFile,
  isValidVaultFile,
  DEFAULT_SETTINGS,
} from "@/lib/storage";

export interface CredentialInput {
  service: string;
  url: string;
  username: string;
  password: string;
  notes: string;
  tag: string;
  favorite?: boolean;
}

interface VaultContextValue {
  status: VaultStatus;
  entries: Credential[];
  settings: VaultSettings;
  error: string | null;
  reusedIds: Set<string>;
  tags: string[];
  createVault: (masterPassword: string) => Promise<void>;
  unlock: (masterPassword: string) => Promise<boolean>;
  lock: () => void;
  addEntry: (input: CredentialInput) => Promise<void>;
  updateEntry: (id: string, input: CredentialInput) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  changeMasterPassword: (current: string, next: string) => Promise<boolean>;
  updateSettings: (patch: Partial<VaultSettings>) => void;
  exportVault: () => void;
  importBackup: (fileText: string) => Promise<boolean>;
  resetVault: () => void;
  registerActivity: () => void;
}

const VaultContext = createContext<VaultContextValue | null>(null);

export function useVault(): VaultContextValue {
  const ctx = useContext(VaultContext);
  if (!ctx) throw new Error("useVault must be used inside VaultProvider");
  return ctx;
}

export function VaultProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<VaultStatus>("loading");
  const [entries, setEntries] = useState<Credential[]>([]);
  const [settings, setSettings] = useState<VaultSettings>(DEFAULT_SETTINGS);
  const [error, setError] = useState<string | null>(null);
  const [reusedIds, setReusedIds] = useState<Set<string>>(new Set());

  // The derived key lives ONLY in memory (a ref), never in state/storage.
  const keyRef = useRef<CryptoKey | null>(null);
  const fileRef = useRef<VaultFile | null>(null);
  const lockTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const file = loadVaultFile();
    if (file && isValidVaultFile(file)) {
      fileRef.current = file;
      setSettings(file.settings ?? DEFAULT_SETTINGS);
      setStatus("locked");
    } else {
      setStatus("onboarding");
    }
  }, []);

  // Recompute reuse whenever entries change.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const byHash = new Map<string, string[]>();
      for (const e of entries) {
        if (!e.password) continue;
        const h = await sha256Hex(e.password);
        const list = byHash.get(h) ?? [];
        list.push(e.id);
        byHash.set(h, list);
      }
      const reused = new Set<string>();
      byHash.forEach((ids) => {
        if (ids.length > 1) ids.forEach((id) => reused.add(id));
      });
      if (!cancelled) setReusedIds(reused);
    })();
    return () => {
      cancelled = true;
    };
  }, [entries]);

  const persist = useCallback(
    async (nextEntries: Credential[], nextSettings?: VaultSettings) => {
      const key = keyRef.current;
      const file = fileRef.current;
      if (!key || !file) return;
      const vault = await encryptJSON(key, nextEntries);
      const updated: VaultFile = {
        ...file,
        vault,
        settings: nextSettings ?? file.settings,
      };
      fileRef.current = updated;
      saveVaultFile(updated);
    },
    []
  );

  const clearLockTimer = useCallback(() => {
    if (lockTimer.current) clearTimeout(lockTimer.current);
    lockTimer.current = null;
  }, []);

  const lock = useCallback(() => {
    clearLockTimer();
    keyRef.current = null;
    setEntries([]);
    setReusedIds(new Set());
    setError(null);
    setStatus("locked");
  }, [clearLockTimer]);

  const scheduleAutoLock = useCallback(() => {
    clearLockTimer();
    const mins = fileRef.current?.settings.autoLockMinutes ?? 0;
    if (mins > 0 && keyRef.current) {
      lockTimer.current = setTimeout(lock, mins * 60_000);
    }
  }, [clearLockTimer, lock]);

  const registerActivity = useCallback(() => {
    if (status === "unlocked") scheduleAutoLock();
  }, [status, scheduleAutoLock]);

  const createVault = useCallback(
    async (masterPassword: string) => {
      setError(null);
      const salt = newSalt();
      const key = await deriveKey(masterPassword, salt);
      const verifier = await makeVerifier(key);
      const vault = await encryptJSON(key, [] as Credential[]);
      const file: VaultFile = {
        version: 1,
        kdf: {
          name: "PBKDF2",
          hash: "SHA-256",
          iterations: PBKDF2_ITERATIONS,
          salt,
        },
        verifier,
        vault,
        settings: DEFAULT_SETTINGS,
      };
      keyRef.current = key;
      fileRef.current = file;
      saveVaultFile(file);
      setEntries([]);
      setSettings(DEFAULT_SETTINGS);
      setStatus("unlocked");
      scheduleAutoLock();
    },
    [scheduleAutoLock]
  );

  const unlock = useCallback(
    async (masterPassword: string): Promise<boolean> => {
      setError(null);
      const file = fileRef.current ?? loadVaultFile();
      if (!file) {
        setStatus("onboarding");
        return false;
      }
      const key = await deriveKey(
        masterPassword,
        file.kdf.salt,
        file.kdf.iterations
      );
      const ok = await checkVerifier(key, file.verifier);
      if (!ok) {
        setError("Wrong master password. Try again.");
        return false;
      }
      const data = await decryptJSON<Credential[]>(key, file.vault);
      keyRef.current = key;
      fileRef.current = file;
      setEntries(data);
      setSettings(file.settings ?? DEFAULT_SETTINGS);
      setStatus("unlocked");
      scheduleAutoLock();
      return true;
    },
    [scheduleAutoLock]
  );

  const addEntry = useCallback(
    async (input: CredentialInput) => {
      const now = Date.now();
      const entry: Credential = {
        id: crypto.randomUUID(),
        service: input.service.trim(),
        url: input.url.trim(),
        username: input.username.trim(),
        password: input.password,
        notes: input.notes.trim(),
        tag: input.tag.trim(),
        favorite: input.favorite ?? false,
        createdAt: now,
        updatedAt: now,
      };
      const next = [entry, ...entries];
      setEntries(next);
      await persist(next);
      scheduleAutoLock();
    },
    [entries, persist, scheduleAutoLock]
  );

  const updateEntry = useCallback(
    async (id: string, input: CredentialInput) => {
      const next = entries.map((e) =>
        e.id === id
          ? {
              ...e,
              service: input.service.trim(),
              url: input.url.trim(),
              username: input.username.trim(),
              password: input.password,
              notes: input.notes.trim(),
              tag: input.tag.trim(),
              favorite: input.favorite ?? e.favorite,
              updatedAt: Date.now(),
            }
          : e
      );
      setEntries(next);
      await persist(next);
      scheduleAutoLock();
    },
    [entries, persist, scheduleAutoLock]
  );

  const deleteEntry = useCallback(
    async (id: string) => {
      const next = entries.filter((e) => e.id !== id);
      setEntries(next);
      await persist(next);
      scheduleAutoLock();
    },
    [entries, persist, scheduleAutoLock]
  );

  const toggleFavorite = useCallback(
    async (id: string) => {
      const next = entries.map((e) =>
        e.id === id ? { ...e, favorite: !e.favorite } : e
      );
      setEntries(next);
      await persist(next);
    },
    [entries, persist]
  );

  const changeMasterPassword = useCallback(
    async (current: string, next: string): Promise<boolean> => {
      const file = fileRef.current;
      if (!file) return false;
      const currentKey = await deriveKey(
        current,
        file.kdf.salt,
        file.kdf.iterations
      );
      const ok = await checkVerifier(currentKey, file.verifier);
      if (!ok) {
        setError("Current master password is incorrect.");
        return false;
      }
      // Re-key: new salt, re-encrypt everything with the new key.
      const salt = newSalt();
      const newKey = await deriveKey(next, salt);
      const verifier = await makeVerifier(newKey);
      const vault = await encryptJSON(newKey, entries);
      const updated: VaultFile = {
        ...file,
        kdf: { ...file.kdf, salt, iterations: PBKDF2_ITERATIONS },
        verifier,
        vault,
      };
      keyRef.current = newKey;
      fileRef.current = updated;
      saveVaultFile(updated);
      setError(null);
      return true;
    },
    [entries]
  );

  const updateSettings = useCallback(
    (patch: Partial<VaultSettings>) => {
      const nextSettings = { ...settings, ...patch };
      setSettings(nextSettings);
      if (fileRef.current) {
        const updated = { ...fileRef.current, settings: nextSettings };
        fileRef.current = updated;
        saveVaultFile(updated);
      }
      scheduleAutoLock();
    },
    [settings, scheduleAutoLock]
  );

  const exportVault = useCallback(() => {
    const file = fileRef.current;
    if (!file) return;
    // Backup contains only ciphertext — safe to store anywhere.
    const blob = new Blob([JSON.stringify(file, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `aegis-vault-backup-${new Date()
      .toISOString()
      .slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const importBackup = useCallback(
    async (fileText: string): Promise<boolean> => {
      let parsed: unknown;
      try {
        parsed = JSON.parse(fileText);
      } catch {
        setError("That file is not readable JSON.");
        return false;
      }
      if (!isValidVaultFile(parsed)) {
        setError("That file is not a valid Aegis backup.");
        return false;
      }
      // Replace the on-device vault with the backup, then require its
      // master password to unlock. Nothing is decrypted here.
      clearLockTimer();
      saveVaultFile(parsed);
      fileRef.current = parsed;
      keyRef.current = null;
      setEntries([]);
      setReusedIds(new Set());
      setSettings(parsed.settings ?? DEFAULT_SETTINGS);
      setError(null);
      setStatus("locked");
      return true;
    },
    [clearLockTimer]
  );

  const resetVault = useCallback(() => {
    destroyVaultFile();
    clearLockTimer();
    keyRef.current = null;
    fileRef.current = null;
    setEntries([]);
    setSettings(DEFAULT_SETTINGS);
    setStatus("onboarding");
  }, [clearLockTimer]);

  const tags = useMemo(() => {
    const set = new Set<string>();
    entries.forEach((e) => e.tag && set.add(e.tag));
    return Array.from(set).sort();
  }, [entries]);

  const value: VaultContextValue = {
    status,
    entries,
    settings,
    error,
    reusedIds,
    tags,
    createVault,
    unlock,
    lock,
    addEntry,
    updateEntry,
    deleteEntry,
    toggleFavorite,
    changeMasterPassword,
    updateSettings,
    exportVault,
    importBackup,
    resetVault,
    registerActivity,
  };

  return <VaultContext.Provider value={value}>{children}</VaultContext.Provider>;
}
