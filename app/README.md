# Money Tracker

Track spending from your monthly salary and your savings separately. Built from the Claude Design handoff in `../project/Money Tracker.dc.html`.

React + Vite + TypeScript as an installable PWA. Single user, no login: data lives in this browser's `localStorage`. Use Settings › Export backup to keep a copy.

```sh
npm install
npm run dev       # local dev server
npm test          # unit tests for cycles, balances, recurring, sweep, reports, backup
npm run build     # production build in dist/ (static, works from any path)
```

Live: https://monosik.github.io/Money_Tracker/ — every push to `main` is tested, built and deployed by `.github/workflows/deploy.yml`.

## How it works

- **Cycle:** runs payday to payday (`lib/dates.ts › cycleFor`).
- **Available this month:** Salary-account balances minus unpaused recurring expenses still due in this cycle.
- **Recurring rules:** each stores `nextDue`. When the app opens or the date changes, due items are logged as auto-logged transactions (`lib/maintenance.ts`). Paused rules skip ahead without logging.
- **Month-end sweep:** when a new cycle starts, the primary Salary account's (the first one) balance at the end of the last cycle becomes a pending transfer to the default savings account. Nothing changes until you tap **Done**.
- **Reconcile:** records the difference as an `adjust` ("Untracked") transaction. Negative ones count as "Unlogged spending" in Reports.
- **Layout:** below 1024px it's the mobile app with bottom nav. At 1024px and wider, a sidebar plus the desktop Dashboard; other screens show in a centered column.

## Limits

- The daily reminder notification is scheduled in the page, so it only fires while the app is open or in the background. It can't wake a closed app without a push server. The in-app "Nothing logged today" banner always works.
- Accounts can be added after onboarding but not edited or deleted yet.
