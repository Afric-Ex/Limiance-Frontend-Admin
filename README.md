# Limiance Admin Console

Internal operations console for Limiance staff.

## Setup

```bash
npm install
npm run dev        # http://localhost:3001
npm run build
```

## Environment

| File | Purpose |
|---|---|
| `.env.local` | Local/staging API URL (gitignored) |

Set `VITE_API_BASE_URL=https://api.staging.celvios.site` in `.env.local`.

## Production

- Admin app: `https://admin.staging.celvios.site`
- API: `https://api.staging.celvios.site`
- Requires its own CORS allowlist and staff-session policy on the backend.
- Never share an origin with the customer frontend.

## Role access

| Role | Access |
|---|---|
| `support` | Read-only lookup |
| `compliance` | KYC decisions |
| `treasury_operator` | Withdrawal preparation |
| `treasury_approver` | Four-eyes approval |
| `auditor` | Audit/reconciliation read |
| `platform_administrator` | Full access + role management |
