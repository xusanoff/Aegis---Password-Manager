export type Strength = "weak" | "fair" | "strong";

export interface Credential {
  id: string;
  service: string;
  url: string;
  username: string;
  password: string;
  notes: string;
  tag: string; // department / project / category label
  favorite: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface VaultSettings {
  autoLockMinutes: number; // 0 = never
}

/** Encrypted blob stored on disk (localStorage). Server, if ever added, sees only this. */
export interface EncBlob {
  iv: string; // base64
  ct: string; // base64 ciphertext
}

/** The full persisted vault file. Nothing here is readable without the master password. */
export interface VaultFile {
  version: 1;
  kdf: {
    name: "PBKDF2";
    hash: "SHA-256";
    iterations: number;
    salt: string; // base64
  };
  verifier: EncBlob; // encrypts a known marker; used to check the master password
  vault: EncBlob; // encrypts Credential[]
  settings: VaultSettings; // non-sensitive, stored in clear
}

export type VaultStatus = "loading" | "onboarding" | "locked" | "unlocked";
