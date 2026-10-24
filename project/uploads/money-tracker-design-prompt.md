# Design Prompt: Personal Money Tracker (Salary + Savings)

## 1. Goal
Design a **mobile-first web app** (installable to the home screen) that helps one person track spending from their **monthly salary** and their **savings**, which are held across **multiple real bank accounts / e-wallets**.

It solves two problems:
1. **Forgotten entries.** The user forgets to log spending, so the app's balances drift away from reality.
2. **No salary vs savings split.** When the user spends from savings, they can't see how much savings is left.

Please design the full set of screens below. Mobile is the primary layout (~390px wide), plus one responsive desktop layout for the Dashboard.

---

## 2. Product Settings (fixed for v1)
- **Single user.** No login, no accounts. Data is stored **locally in the browser**.
- **Language:** English UI.
- **Currency:** IDR only, formatted as `Rp1.250.000` (dot as thousands separator, no decimals).
- **Monthly cycle:** runs **payday to payday**, not the 1st to the 31st (e.g. the 25th to the 24th). The user sets their payday in Settings.
- **Backup:** because data is local-only, Export/Import Backup (JSON) and Export CSV must be easy to find.

---

## 3. Core Concepts & Data Model

### Account
Represents a real bank account or e-wallet (e.g. "BCA", "Maybank", "GoPay").

| Field | Notes |
|---|---|
| name | e.g. "BCA Salary" |
| type | Bank / E-wallet / Cash |
| role | **Salary** or **Savings** |
| starting balance | entered at setup |
| savings target | optional; Savings accounts only |
| color / icon | for quick visual recognition |

- Exactly **one** account is the primary Salary account. There can be **many** Savings accounts.
- **Balance** = starting balance + income − expenses ± transfers ± adjustments.

### Transaction types
1. **Expense:** amount, account (where the money came from), category, date, optional note.
2. **Income:** amount, account, source (Salary, Bonus, Other), date.
3. **Transfer:** from-account, to-account, amount, date. A transfer is **not** spending, so it never counts in expense totals.
4. **Adjustment (Untracked):** created by reconciliation. It records the difference between the app balance and the real balance.

### Category
Includes default categories (Food, Transport, Bills, Shopping, Entertainment, Health, Other), and the user can add, rename, or archive their own.
- **Budget:** an optional monthly limit per category.

### Recurring rule
Defines a recurring expense or income: amount, account, category, frequency (monthly, or a specific day of the month), and next due date.
- On the due date it is **logged automatically** and shown in an "Auto-logged" feed so the user can review it.

### Month-end sweep
At the end of each cycle, any leftover in the Salary account is handled like this:
1. The app automatically creates a **Pending Transfer** for the leftover amount to the user's chosen default savings account.
2. A Pending transfer does **not** change balances yet. It appears as a card: "Move Rp850.000 to BCA Savings. Did you transfer it in your bank app?" with the actions **[Done] [Edit amount] [Skip]**.
3. Tapping **Done** confirms the transfer and updates both balances.

---

## 4. Key Business Rules
- **Salary pocket view.** "Available this month" = Salary account balance minus the sum of upcoming recurring expenses in this cycle. This is the hero number.
- **Savings is shown separately.** Total Savings is the sum of all Savings accounts. Each Savings account shows its balance, its target progress, and any spending from it this month (e.g. "−Rp1.200.000 spent from savings this month").
- **Warn on savings spending.** When the user picks a Savings account for an expense, show an inline notice: "This will reduce your savings: BCA Savings Rp5.000.000 → Rp3.800.000."
- **Budget alerts.** A category budget bar turns amber at 80% and red at 100% or more.
- **Reconciliation.** The user enters the real balance for an account, and the app shows the difference. If the user confirms, an "Untracked" adjustment is created. Untracked totals appear in reports so the user can see how much they forget to log.
- **Daily reminder.** At a time the user sets, a browser notification fires if the app is installed as a PWA. Separately, an in-app banner appears if nothing was logged today: "Nothing logged today. Did you spend anything?" with the actions [Quick add] [No spending today].

---

## 5. Screens to Design

### 5.1 Onboarding (first launch, 4 steps)
1. **Welcome:** explains local-only storage and the backup reminder.
2. **Add accounts:** name, type, role (Salary/Savings), starting balance. At least one Salary account is required.
3. **Payday + monthly salary amount + default savings account** for the month-end sweep.
4. **Daily reminder time.** This step can be skipped.

### 5.2 Home / Dashboard (most important)
- **Hero card:** "Available this month" (Salary), days left in the cycle, and a suggested daily spend (available ÷ days left).
- **Savings card:** total savings, a horizontal scroller of savings accounts showing balance and target progress, and "Spent from savings this cycle."
- **Pending actions area:** pending month-end transfer, reconciliation suggestion (shown if an account hasn't been reconciled in 14+ days), and the "nothing logged today" banner.
- **Budget snapshot:** the top 3 categories by usage, with progress bars.
- **Recent transactions:** the last 5, plus a "See all" link.
- **Floating Quick Add button**, always visible.

### 5.3 Quick Add (bottom sheet; target is 3 taps)
- Large amount keypad first, with shortcut chips (+10rb, +50rb, +100rb).
- Category chips, with the most-used categories first.
- Account selector, defaulting to the last-used or Salary account. Savings accounts are visually marked, and the savings-impact warning from Section 4 applies.
- Date defaults to today; a note field is optional.
- A small tab switch for Expense / Income / Transfer.
- After saving: a toast with an **Undo** action.

### 5.4 Transactions
- List grouped by day, with filters for account, category, type, and date range.
- Swipe to edit or delete.
- Visual distinctions: expense (−), income (+), transfer (⇄, neutral color), untracked adjustment (dashed / "?" icon), auto-logged recurring item (repeat icon).

### 5.5 Accounts
- List of all accounts with balances, grouped into **Salary** and **Savings**.
- Account detail screen: balance, target progress (Savings only), transactions for that account, and a **[Reconcile]** button.
- Reconcile flow: "Enter real balance from your bank app" → shows the difference → **[Record as Untracked]** or **[I'll find it]**.

### 5.6 Budgets
- A category list with this cycle's budget, spent amount, remaining amount, and a progress bar.
- Edit budget amounts per category.

### 5.7 Recurring
- List of rules with their next due dates; add, edit, or pause each rule.
- An "Auto-logged this cycle" history.

### 5.8 Reports (monthly, per cycle)
- Spending by category (donut chart).
- Spending trend over the last 6 cycles (bar chart).
- Salary vs Savings spending split.
- Untracked total ("Unlogged spending: Rp320.000").
- Savings growth over time (line chart).
- A cycle switcher (‹ Sep 25 – Oct 24 ›).

### 5.9 Settings
- Payday, default savings account for the sweep, reminder time, and categories.
- **Data:** Export CSV, Export Backup (JSON), Import Backup, Reset all data (requires confirmation).
- A "Last backup: 12 days ago" indicator, with a nudge if it's been more than 30 days.

---

## 6. Key User Flows to Show
1. **Daily logging:** notification → open app → Quick Add → saved in under 10 seconds.
2. **Spending from savings:** Quick Add → select a Savings account → see the impact warning → save → the Savings card on the dashboard updates.
3. **Forgot to log:** a reconcile suggestion appears → enter the real balance → difference recorded as Untracked.
4. **Month-end:** cycle ends → Pending transfer card → user transfers in their bank app → taps Done → balances update.

## 7. Empty, Edge & Error States
- No transactions yet, no budgets set, or no savings target set.
- Salary "Available" goes **negative**: show a red state with the message "You're Rp200.000 over this month."
- Expense amount is larger than the selected account's balance: show a warning, but still allow saving.
- Pending sweep was skipped: it is removed from the dashboard and kept in history.
- Import backup fails or the file is invalid.
- Browser notifications are blocked: show a fallback explanation in Settings.

---

## 8. Visual Direction
- **Calm, trustworthy finance feel.** Clean and minimal, with generous spacing and large, readable numbers.
- Use **two distinct accent colors**, one for **Salary** and one for **Savings**, applied consistently across cards, chips, and charts.
- Semantic colors: green for income, red/coral for expenses, neutral gray for transfers, amber for warnings.
- Thumb-friendly layout: primary actions in the bottom half of the screen, and a bottom navigation bar with **Home · Transactions · Reports · Accounts**, with Budgets, Recurring, and Settings reached through a More menu.
- Provide light and dark mode.
- Use tabular (monospaced) figures for amounts so numbers line up.

## 9. Sample Data (use in mockups)
- **Accounts:**
  - BCA Salary (Salary, Bank): Rp6.450.000
  - Maybank Savings (Savings, Bank): Rp12.000.000, target Rp20.000.000
  - Jago Emergency (Savings, Bank): Rp8.500.000, target Rp15.000.000
  - GoPay (Salary, E-wallet): Rp350.000
- **Settings:** payday on the 25th; salary Rp9.000.000.
- **Recent transactions:**
  - Lunch Rp45.000 (Food, BCA)
  - Grab Rp32.000 (Transport, GoPay)
  - New headphones Rp1.200.000 (Shopping, **Maybank Savings**)
  - Internet bill Rp350.000 (Bills, recurring)
- **Budgets:** Food Rp2.000.000 (78% used), Transport Rp800.000 (45% used), Entertainment Rp500.000 (104% used).
- **Pending sweep:** Rp850.000 → Maybank Savings.

## 10. Out of Scope for v1
Login and cloud sync, bank API or bank-statement import, multiple currencies, shared or family accounts, investments, and debt tracking.
