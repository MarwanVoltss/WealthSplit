# WealthSplit

A personal finance dashboard that applies **Mark Tilbury's 25-50-15-10 rule** to automatically split your monthly income into four buckets:

- **25% — Growth** (investments)
- **50% — Essentials** (living costs)
- **15% — Stability** (emergency fund)
- **10% — Joy**

Built with **React 19, Vite 8, Tailwind CSS v4, framer-motion**, and **Firebase** for authentication and per-user data storage. Supports **English & Arabic** with a layout that always stays English (LTR).

## Features

- 🔐 Email/password sign-up & login (Firebase Auth)
- 💾 Per-user data saved to Firestore (each account has its own numbers)
- 💱 Multi-currency, 🌙 dark/light theme, 🌐 EN ↔ العربية toggle
- 📊 Animated SVG donut chart + hover tooltips (no Chart.js dependency)
- 🛡️ Stability (emergency fund) tracker with milestones
- 🚀 One-command deploy to GitHub Pages

---

## Quick start (local)

```bash
npm install
npm run dev        # http://localhost:5173
```

Without a Firebase config the app runs in **demo mode** — you can sign up/log in and data is stored only in your browser's localStorage.

## Connecting Firebase (per-user accounts)

1. Go to **https://console.firebase.google.com** and add a project (e.g. `wealthsplit`).
2. Enable **Authentication → Sign-in method → Email/Password**.
3. Create a **Firestore Database** (Production mode).
4. In **Project settings → Your apps**, add a **Web app** and copy the SDK config.
5. Create a `.env` file in the project root (copy `.env.example`):

```bash
cp .env.example .env
# then fill in your values
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

6. Run `npm run dev` again — you're now on real accounts.

### Secure Firestore rules (IMPORTANT)

In Firestore → **Rules**, replace with (so users can only read/write their own data):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

> Note: the Firebase `apiKey` in your client config is **public by design** and safe to share. Security comes from the Firestore/Auth **rules**, not the config.

---

## Deploying to GitHub Pages

1. Put this project in a GitHub repository (the app builds with a relative `./` base, so it works on `username.github.io/repo-name` and any custom domain).
2. Create a fresh private GitHub repo and push the code.
3. In the repo on GitHub: **Settings → Pages → Source: "GitHub Actions"**.
4. Add these **repository variables** (Settings → Secrets and variables → Actions → Variables) so the deploy workflow can build with your Firebase config:

   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`

5. Push to `main`. The `.github/workflows/deploy.yml` workflow builds and deploys automatically.
   Your site will be live at `https://<username>.github.io/<repo-name>/`.

> The workflow reads the config from **repository variables** using `${{ vars.VITE_... }}`. If a variable is missing, the build still works but the app ships in demo mode.

---

## Scripts

| Command          | Description                    |
| ---------------- | ------------------------------ |
| `npm run dev`    | Start dev server               |
| `npm run build`  | Production build → `dist/`     |
| `npm run preview`| Preview the production build   |
| `npm run lint`   | Run Oxlint                     |
