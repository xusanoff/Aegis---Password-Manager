import type { Strength } from "./types";

/**
 * Lightweight entropy-based strength estimate. A heavier library like zxcvbn
 * would catch dictionary words and common patterns; that is noted as a planned
 * upgrade. This heuristic covers length + character-class diversity, which is
 * enough to separate weak / fair / strong meaningfully.
 */
export function estimateStrength(password: string): {
  score: Strength;
  bits: number;
} {
  if (!password) return { score: "weak", bits: 0 };

  let pool = 0;
  if (/[a-z]/.test(password)) pool += 26;
  if (/[A-Z]/.test(password)) pool += 26;
  if (/[0-9]/.test(password)) pool += 10;
  if (/[^a-zA-Z0-9]/.test(password)) pool += 33;

  const bits = pool > 0 ? Math.round(password.length * Math.log2(pool)) : 0;

  // Penalise obvious repetition / sequences a little.
  const hasRepeat = /(.)\1\1/.test(password);
  const adjusted = hasRepeat ? bits * 0.75 : bits;

  let score: Strength = "weak";
  if (adjusted >= 75) score = "strong";
  else if (adjusted >= 45) score = "fair";

  return { score, bits: Math.round(adjusted) };
}

export interface GeneratorOptions {
  length: number;
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  symbols: boolean;
}

const SETS = {
  lowercase: "abcdefghijkmnopqrstuvwxyz",
  uppercase: "ABCDEFGHJKLMNPQRSTUVWXYZ",
  numbers: "23456789",
  symbols: "!@#$%^&*()-_=+[]{};:,.?",
};

/** Cryptographically-random password using crypto.getRandomValues. */
export function generatePassword(opts: GeneratorOptions): string {
  let pool = "";
  if (opts.lowercase) pool += SETS.lowercase;
  if (opts.uppercase) pool += SETS.uppercase;
  if (opts.numbers) pool += SETS.numbers;
  if (opts.symbols) pool += SETS.symbols;
  if (!pool) pool = SETS.lowercase;

  const out: string[] = [];
  const rand = new Uint32Array(opts.length);
  crypto.getRandomValues(rand);
  for (let i = 0; i < opts.length; i++) {
    out.push(pool[rand[i] % pool.length]);
  }
  return out.join("");
}
