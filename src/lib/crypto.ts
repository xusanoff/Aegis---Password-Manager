import type { EncBlob } from "./types";

/**
 * All cryptography runs in the browser via the Web Crypto API.
 * The master password is never stored and never leaves the device.
 *
 * Model:
 *  - A random 16-byte salt is generated once per vault.
 *  - The master password + salt are stretched with PBKDF2 (SHA-256, 310k
 *    iterations) into a 256-bit AES-GCM key. The key is non-extractable.
 *  - Each secret is encrypted with AES-GCM using a fresh random 12-byte IV.
 *
 * Note: PBKDF2 is used because it is native to Web Crypto (no wasm), which
 * keeps the build dependency-free and deployment trivial. Argon2id would be
 * the stronger choice and is listed as a planned upgrade in the README.
 */

export const PBKDF2_ITERATIONS = 310_000;
const MARKER = "aegis-vault-verifier-v1";

const enc = new TextEncoder();
const dec = new TextDecoder();

export function toBase64(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let bin = "";
  for (let i = 0; i < arr.length; i++) bin += String.fromCharCode(arr[i]);
  return btoa(bin);
}

export function fromBase64(b64: string): Uint8Array {
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return arr;
}

export function randomBytes(len: number): Uint8Array {
  const arr = new Uint8Array(len);
  crypto.getRandomValues(arr);
  return arr;
}

export function newSalt(): string {
  return toBase64(randomBytes(16));
}

/** Stretch the master password into an AES-GCM key. */
export async function deriveKey(
  password: string,
  saltB64: string,
  iterations: number = PBKDF2_ITERATIONS
): Promise<CryptoKey> {
  const baseKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: fromBase64(saltB64),
      iterations,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encrypt(key: CryptoKey, plaintext: string): Promise<EncBlob> {
  const iv = randomBytes(12);
  const ct = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    enc.encode(plaintext)
  );
  return { iv: toBase64(iv), ct: toBase64(ct) };
}

export async function decrypt(key: CryptoKey, blob: EncBlob): Promise<string> {
  const plain = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: fromBase64(blob.iv) },
    key,
    fromBase64(blob.ct)
  );
  return dec.decode(plain);
}

export async function encryptJSON(key: CryptoKey, value: unknown): Promise<EncBlob> {
  return encrypt(key, JSON.stringify(value));
}

export async function decryptJSON<T>(key: CryptoKey, blob: EncBlob): Promise<T> {
  return JSON.parse(await decrypt(key, blob)) as T;
}

/** Encrypts a known marker so the master password can be verified on unlock. */
export async function makeVerifier(key: CryptoKey): Promise<EncBlob> {
  return encrypt(key, MARKER);
}

/** Returns true if the derived key correctly decrypts the verifier. */
export async function checkVerifier(key: CryptoKey, blob: EncBlob): Promise<boolean> {
  try {
    return (await decrypt(key, blob)) === MARKER;
  } catch {
    return false;
  }
}

/** SHA-256 hex of a string — used in-memory to compare passwords for reuse. */
export async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", enc.encode(value));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
