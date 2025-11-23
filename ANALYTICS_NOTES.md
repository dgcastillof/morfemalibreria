# Analytics overview

This project now records basic usage analytics directly in Firebase Firestore to keep everything self-contained and privacy-friendly.

## Tracking
- `src/analytics-esm.js` is loaded on every page via `load-gtm.js` and stores:
  - Daily and weekly visit counts (with per-device unique visitor approximations).
  - Page-view totals per route for daily and weekly windows.
  - Navigation transitions (from → to) using session navigation history.
- Visitor uniqueness is device-based via a locally stored anonymous ID; no PII is collected.

## Storage
- Collections created in Firestore:
  - `analytics_daily` / `analytics_weekly` for totals and unique visitors.
  - `analytics_routes_daily` / `analytics_routes_weekly` for per-route views.
  - `analytics_navigation_daily` / `analytics_navigation_weekly` for transitions between pages.
  - `analytics_visitors` stores a lightweight heartbeat (last route + window) keyed by a local anonymous ID.

## Dashboard
- Visit `/analytics.html` to see a simple dashboard with daily/weekly tables, top pages, and navigation flows.
- Data is fetched client-side from Firestore via `src/analytics-dashboard.js`.

## Configuration
- Uses the existing Firebase config in `public/firebase-config.js`. No new environment variables are required.
- Analytics writes/logging are best-effort; failures are reported to the console without impacting user flows.
