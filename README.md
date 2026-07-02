# Expense & Investment Tracker

A mobile-first, installable **PWA** to track personal expenses and investments. Built for Android (Add to Home Screen), works fully **offline**, and stores everything **locally** in the browser (IndexedDB via localForage). No backend, no auth, no external APIs.

## Features

- **Dashboard** — monthly in-hand, fixed expenses, invested, spent and remaining balance, with a color-coded donut chart and recent activity.
- **Log Expense** — Material-style bottom sheet: category grid → amount → optional note.
- **Log Investment** — pick a bucket (with live progress), enter amount, get "Above target!" nudges.
- **Investment Progress** — monthly targets (On Track / Done / Behind) + cumulative goals with ETA.
- **Expense History** — filter by month/category, category bar chart, month-over-month comparison, swipe-to-delete with undo.
- **Settings** — edit salary & fixed expenses, toggle phase (Auto / Phase 1 / Phase 2), export CSV, reset month, clear all.
- **Month Rollover** — on a new month, summarises the last month (spent / invested / savings rate) and resets monthly counters while carrying forward cumulative goals.
- **Reminders** — daily 9pm, 25th and 1st (Web Notifications with in-app toast fallback).
- **PWA shortcuts** — long-press the home-screen icon to jump straight to "Log Expense" or "Log Investment".

## Tech Stack

React 18 · Vite · Tailwind CSS · Recharts · Framer Motion · date-fns · localForage · vite-plugin-pwa (Workbox)

## Getting Started

```bash
npm install
npm run dev        # start dev server (PWA enabled in dev)
npm run build      # production build (generates service worker + manifest)
npm run preview    # preview the production build
```

Open the dev URL on your phone (same network) or use Chrome DevTools device mode. To install: Chrome menu → **Add to Home Screen**.

## Regenerating icons

Icons are generated from inline SVG into `public/icons/`:

```bash
node scripts/gen-icons.mjs
```

## Data model

All state lives under a single IndexedDB key (`tracker-data-v1`):

- `salary`, `fixedExpenses[]`, `phaseMode` (`auto | 1 | 2`)
- `months[YYYY-MM]` → `{ expenses[], investments[] }` (reset each month)
- `cumulative` → persistent per-goal totals (carried forward)

Everything is Indian-number formatted (₹1,10,000) throughout.

## Phase logic

- **Phase 1** (Jul–Dec 2026) and **Phase 2** (Jan 2027+) allocations live in `src/constants/allocations.js`.
- Phase auto-detects from the current date, or can be forced in Settings.
