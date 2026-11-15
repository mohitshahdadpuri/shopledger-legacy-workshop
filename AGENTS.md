# Repository Guidelines

## Stack & Module Map

- Runtime target: Node 22 (unverified); the current shell runs Node v24.21.0, and package.json does not pin Node.
- Stack: Express 4, body-parser, CommonJS JavaScript, and a JSON file database.
- `server.js`: serves browser assets, mounts `/api` routers, and renders invoices.
- `routes/`: products, orders, customers, and reports HTTP handlers.
- `lib/pricing.js`, `tax.js`, `coupons.js`: checkout totals, GST rates/splits, and discounts.
- `lib/inventory.js`, `orders.js`, `ledger.js`: stock, order lifecycle, and Khata accounts.
- `lib/invoice.js`, `reports.js`: printable invoice calculations and reporting/reconciliation.
- `lib/store.js`, `dates.js`: JSON persistence and date helpers.
- `public/`: HTML, CSS, and browser JavaScript; `config.js`: application settings.
- `data/db.json`: persisted records; `docs/`: architecture SVG and Mermaid source.

## Commands

- `npm install`: install declared dependencies; ask first if network access is needed.
- `npm start`: start the Express app (default port 3000; override with `PORT`).
- `node --test`: run Node's built-in test runner. No tests currently exist; Node 22 execution is unverified.

## Change & Test Rules

- Write characterization tests before changing behaviour; capture current behaviour first.
- Change only the module the ticket is about, plus its tests. Avoid unrelated fixes.
- Tests must never touch `data/db.json`; use in-memory fixtures.
- Add no dependencies.

## Money Rules

- Amounts are rupees; round monetary calculations with `round2`.
- Compare money with a 0.01 rupee tolerance rather than exact floating-point equality.
- GST splits into CGST and SGST; preserve the rounded total across the split.

## Known Traps

- Placing an order changes `data/db.json`.
- Undo accidental database changes with `git checkout data/db.json`; this discards uncommitted changes to that file, so inspect them first.
- Never commit `package-lock.json`.
- `lib/pricing.js` and `lib/invoice.js` independently compute GST using different rules.

## Definition of Done

- Characterization tests were added before behaviour changes.
- All tests are green under `node --test`.
- `data/db.json` is unchanged.
- The diff is limited to the ticket's module plus tests.

## Ask Before

- Using the network.
- Creating branches.
- Editing `package.json`.
