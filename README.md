# ShopLedger

ShopLedger is a small shop management application built with Express, CommonJS JavaScript, and a JSON file database. It provides a browser interface for products, customers, orders, inventory, GST invoices, Khata accounts, and reports.

## Run

Install dependencies and start the app:

```sh
npm install
npm start
```

Open http://localhost:3000. Set `PORT` to use a different port. The runtime target is Node 22, which is currently unverified; the workshop shell uses Node v24.21.0.

## Test

```sh
node --test
```

The test suite runs once the fix PRs below land. Tests use in-memory fixtures and must never touch `data/db.json`.

## Database warning

**Placing orders changes `data/db.json`.** To discard accidental database changes, inspect them first, then run:

```sh
git checkout data/db.json
```

This command discards all uncommitted changes to that file.

## Documentation

- [Repository guidelines and module map](AGENTS.md)
- [Architecture diagram](docs/architecture.svg)
- [Architecture source](docs/architecture.md)

## Open fix PRs

Open PRs reported by `gh pr list --repo mohitshahdadpuri/shopledger-legacy-workshop` when this README was created:

| PR | Fixes issues |
| --- | --- |
| [#14 — fix(security): remove hardcoded admin export key](https://github.com/mohitshahdadpuri/shopledger-legacy-workshop/pull/14) | [#7](https://github.com/mohitshahdadpuri/shopledger-legacy-workshop/issues/7) |
| [#13 — fix: order history sorting/filtering and Khata settlement math](https://github.com/mohitshahdadpuri/shopledger-legacy-workshop/pull/13) | [#5](https://github.com/mohitshahdadpuri/shopledger-legacy-workshop/issues/5), [#6](https://github.com/mohitshahdadpuri/shopledger-legacy-workshop/issues/6) |
| [#12 — fix(inventory): sell last sellable unit and restore stock on cancel](https://github.com/mohitshahdadpuri/shopledger-legacy-workshop/pull/12) | [#3](https://github.com/mohitshahdadpuri/shopledger-legacy-workshop/issues/3), [#4](https://github.com/mohitshahdadpuri/shopledger-legacy-workshop/issues/4), [#10](https://github.com/mohitshahdadpuri/shopledger-legacy-workshop/issues/10) |
| [#2 — fix(invoice): reuse pricing engine so invoice matches billed amount](https://github.com/mohitshahdadpuri/shopledger-legacy-workshop/pull/2) | [#1](https://github.com/mohitshahdadpuri/shopledger-legacy-workshop/issues/1) |
