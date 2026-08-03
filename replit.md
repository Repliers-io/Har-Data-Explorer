# HAR Member Dashboard

A prototype dashboard for HAR (Houston Association of REALTORS) members to explore their proprietary HAR.com performance data via the Repliers API. Agents and brokers can see listing traffic, client transaction reviews, and ShowingSmart logs — all the numbers they check daily.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/har-dashboard run dev` — run the frontend (port assigned by workflow)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec

## Required Secrets

- `REPLIERS_API_KEY` — Repliers API key with HAR membership. Set in Replit Secrets. The API server reads this and forwards it as the `REPLIERS-API-KEY` header to the Repliers API.

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5 (proxy layer — no database needed)
- Frontend: React 19 + Vite + Tailwind v4 + shadcn/ui
- Data: Repliers HAR.com partner endpoints
- API codegen: Orval (from OpenAPI spec)

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for all API contracts)
- `artifacts/api-server/src/routes/har.ts` — HAR proxy routes (views, reviews, showings, summary)
- `artifacts/har-dashboard/src/pages/` — four page components (summary, views, reviews, showings)
- `artifacts/har-dashboard/src/components/layout/` — sidebar + app shell
- `artifacts/har-dashboard/src/lib/date-utils.ts` — date formatting helpers + default 30-day window
- `lib/api-client-react/src/generated/` — generated React Query hooks (do not edit manually)

## HAR Endpoints (proxied)

| Our route | Repliers upstream | Data |
|---|---|---|
| `GET /api/har/views` | `/partners/har/listings/views` | Per-listing daily web + mobile views |
| `GET /api/har/reviews` | `/partners/har/listings/reviews` | Transaction reviews with component scores |
| `GET /api/har/showings` | `/partners/har/showingsmart/logs` | ShowingSmart logs grouped by listing |
| `GET /api/har/summary` | (aggregates all three) | Rolled-up headline stats |

## Architecture decisions

- **Proxy-only backend:** The API server is a thin proxy — no database. It forwards query params to Repliers and aggregates the summary endpoint from three parallel upstream calls. This keeps the setup simple and means HAR data is always fresh.
- **API key kept server-side:** `REPLIERS_API_KEY` never reaches the browser. The frontend calls `/api/har/*` routes; the server adds the header when proxying to Repliers.
- **No `integer` types in OpenAPI spec:** Orval v8 generates `zod.int()` for `integer` types, which is Zod v4 syntax — the workspace uses Zod v3. All numeric fields use `number` instead.
- **Date defaults:** All pages default to the last 30 days. `defaultDateBegin` / `defaultDateEnd` constants are in `lib/date-utils.ts`. Interactive date pickers are a planned follow-up.

## User preferences

_Populate as you build._

## Gotchas

- After changing `lib/api-spec/openapi.yaml`, always run `pnpm --filter @workspace/api-spec run codegen` before touching route handlers or frontend hooks.
- Repliers returns listing images as relative paths (`har/IMG-12345678_1.jpg`). The full CDN base URL is not documented — treat images as unavailable and always show a fallback.
- The HAR access rules: individual agents only see their own data; requests for another agent's `boardAgentId` on views/reviews return 403. Showing logs fall back to the agent's own data instead.
