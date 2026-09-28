# JTC Master Control Admin

React, TypeScript, and Vite dashboard for JTC Master Control.

## Setup

```bash
npm install
cp .env.example .env
npm run dev
```

## Scripts

- `npm run dev`: start the Vite dev server.
- `npm run build`: type-check and build the dashboard.
- `npm run preview`: preview the production build.

## Environment Variables

- `VITE_API_BASE_URL`: backend API base URL, for example `http://localhost:4000/api`.

The Admin navigation includes `Warehouse & Inventory` for Central Warehouse overview, supplier receiving, store transfers, adjustments, stock counts, returns, and the inventory ledger. Store Manager navigation includes `Receiving & Returns` for assigned-store delivery confirmation, discrepancy reasons, store inventory, and warehouse return requests.

For local demo verification against a backend running on port 4010, start the dashboard with:

```powershell
$env:VITE_API_BASE_URL="http://localhost:4010/api"
npm run dev -- --host 127.0.0.1 --port 5174
```
