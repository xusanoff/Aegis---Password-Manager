# Aegis — Zero-Knowledge Team Password Manager

Aegis is a secure vault for a company to store and control shared credentials
(CRM, cloud, social, internal tools). It is built so that **the master password
never leaves the browser** and the server (if one is ever added) could only ever
see ciphertext.

Live demo: _add your deployed URL here_
Screen recording: _add link here_

---

## Product brief

Teams leak credentials through Telegram chats, sticky notes, and reused
passwords. Aegis gives a company one locked vault: every secret is encrypted in
the browser with a key derived from a single master password, so plaintext never
touches storage. The interface is built to feel like a tool a team trusts —
a real lock screen, a searchable vault, one-click copy without revealing
passwords, and live alerts when a password is weak or reused. It runs entirely
client-side, which means zero-knowledge by construction: there is no backend
that can read your data.

---

## Security model (the important part)

Aegis is **zero-knowledge**. Nothing readable is ever persisted.

1. On first use you set a **master password**. A random 16-byte salt is
   generated for the vault.
2. The master password + salt are stretched with **PBKDF2 (SHA-256, 310,000
   iterations)** into a 256-bit **AES-GCM** key using the Web Crypto API. The
   key is non-extractable and lives only in memory.
3. Every credential is encrypted with **AES-GCM** using a fresh random 12-byte
   IV. Only the resulting ciphertext (plus salt and KDF parameters) is written
   to `localStorage`.
4. On unlock, the entered password re-derives the key and decrypts a small
   verifier blob. Wrong password → AES-GCM fails → vault stays locked.
5. On page refresh or auto-lock, the in-memory key is dropped and the vault
   locks again. **Locked by default on load** is a property of the design, not a
   flag.

Because encryption/decryption happens only in the browser, adding a backend
later would not weaken this: the server would receive the same ciphertext blob
and never the master password or plaintext.

### Reuse detection
Passwords are compared by their SHA-256 hash **in memory only**. Entries sharing
a hash are flagged as reused — the plaintext is never stored or transmitted to
do this.

### Password strength
An entropy estimate (length × log2(character pool), with a penalty for obvious
repetition) classifies each password as weak / fair / strong.

---

## Features

Vault & core
- Master password locks / unlocks the entire vault; locked by default on load
- All secrets encrypted with AES-GCM; never stored as plaintext
- Each credential: service, URL, username, password, notes, tag
- Tag/group credentials by department, project, or category
- Built-in generator: configurable length, toggle upper/lower/numbers/symbols,
  one-click copy, cryptographically random
- Password strength indicator (weak / fair / strong)
- One-click copy for username and password **without revealing the password**
- Reuse detection with inline alerts
- Encrypted vault backup: export **and restore** (move to a new device by
  loading the backup file, then unlocking with its master password)

Interface (multi-page)
- Lock screen — the first thing you see every time
- Vault overview — searchable, filterable, sortable list with a health summary
- Add / edit credential — clean modal with inline generator
- Settings — change master password, auto-lock, export, erase
- First-run onboarding for an empty vault; empty states guide the first action
- Smooth transitions, keyboard focus states, reduced-motion support

Extra feature (my choice): **Auto-lock on inactivity** — the vault re-locks
after a configurable idle period (1 / 5 / 15 / 30 min or never), reinforcing the
"locked by default" security posture. A vault-health summary (strong / weak /
reused counts) is also surfaced on the overview.

---

## Tech stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS
- Web Crypto API (PBKDF2 + AES-GCM) — no crypto dependencies
- lucide-react for icons
- Persistence: browser `localStorage` (encrypted blob only)

No backend, no database, no environment variables. Deploys as a static/edge app.

---

## Run locally

Requires Node.js 18.17+ (secure context needed for Web Crypto — `localhost`
counts).

```bash
npm install
npm run dev
```

Open http://localhost:3000. On first load you'll create a vault; after that
you'll see the lock screen.

Production build:

```bash
npm run build
npm run start
```

---

## Deploy

Push to GitHub, then import the repo on **Vercel** — no configuration required
(Next.js is detected automatically, no env vars). The deployed URL is your
"working app" link.

---

## What I would add with 3 more days

1. **Optional sync backend, still zero-knowledge.** A thin API (Next.js route
   handlers + Postgres) that stores only the encrypted vault blob per team, so
   credentials sync across devices and browsers. The server never sees the
   master password or plaintext — it is dumb encrypted storage. This is what
   turns a single-device tool into a real team product.
2. **Real multi-user sharing with per-item access.** Team members each unlock
   with their own credentials; the vault key is wrapped per member (public-key
   envelope) so an admin can grant or revoke access to specific items or folders
   without resharing the master password.
3. **Argon2id key derivation and audit history.** Swap PBKDF2 for Argon2id
   (memory-hard, stronger against GPU attacks) and add a per-credential change
   history plus an activity log (who copied/edited what, and when).

Smaller polish I'd also do: zxcvbn-based strength scoring (dictionary/pattern
detection), breach checking via HaveIBeenPwned's k-anonymity API, and
import from CSV.

---

## Notes / limitations

- This build stores data in `localStorage`, so a vault lives in one browser. To
  move to a new device (or after clearing browser data), use **export** on the
  old device and **restore** on the new one — the backup is encrypted, so it is
  safe to carry around and only opens with the master password. Live
  multi-device sync is the first item in the roadmap above.
- There is no password recovery by design — losing the master password means the
  vault cannot be decrypted. Keep a backup.
- Robustness: the app degrades gracefully — a non-secure context shows a clear
  notice instead of failing, clipboard copy falls back when the async API is
  unavailable, and malformed storage or backup files are rejected rather than
  crashing the app.
