# Deploy API + Admin on Vercel

You can use **one project** (Admin + API on the same domain) or **two projects** (separate domains).

---

## Option A: One project (Admin + API on same domain)

**Best if:** You want a single URL like `weyouapp-v-01-admin-web-1xhg.vercel.app` for both the app and the API.

1. **Create one project** in Vercel and import this repo.
2. **Root Directory:** leave **empty** (repo root).
3. **Framework Preset:** Other.
4. The repo’s **`vercel.json`** already configures:
   - Build: `npm run prisma:generate && npm run build:api` (then Next.js builds from `apps/admin-web`).
   - All `/api/*` requests → Nest API (serverless). Everything else → Next.js admin.

**Environment variables:**

- `DATABASE_URL` – PostgreSQL (e.g. Supabase).
- `JWT_SECRET` – your JWT secret.
- `NEXT_PUBLIC_API_URL` – set to **`/api`** (same origin; admin will call `https://your-project.vercel.app/api`).

After deploy:

- **Admin:** `https://your-project.vercel.app`
- **API:** `https://your-project.vercel.app/api` (e.g. `/api/health`, `/api/admin/...`)

No CORS issues because both are on the same domain.

---

## Option B: Two projects (Admin and API on different domains)

**Best if:** You want to deploy or scale API and Admin separately.

### 1. API project (e.g. `weyou-api`)

- Import this repo, **Root Directory:** empty, **Framework:** Other.
- In **Settings → General**, set **Configuration File** to **`vercel-api-only.json`** (so only the API is built).
- **Env vars:** `DATABASE_URL`, `JWT_SECRET`, `NODE_ENV=production`, etc.
- Copy the deployed URL (e.g. `https://weyou-api-xxx.vercel.app`).

### 2. Admin project (e.g. `weyou-admin`)

- Import the **same** repo again.
- **Root Directory:** `apps/admin-web`.
- **Env:** `NEXT_PUBLIC_API_URL=https://weyou-api-xxx.vercel.app/api`.

---

## CORS

The API allows:

- `https://weyou-admin.onrender.com`
- `https://*.vercel.app`
- `http://localhost:*` and `http://127.0.0.1:*`

To add another admin domain, edit `apps/api/src/bootstrap/create-app.ts` (`allowedOrigins`).

---

## Summary

| Setup   | Root Directory   | Result |
|--------|-------------------|--------|
| **One project** | (empty) | One URL: app at `/`, API at `/api`. Set `NEXT_PUBLIC_API_URL=/api`. |
| **Two projects** | (empty) for API, `apps/admin-web` for Admin | Two URLs; set admin’s `NEXT_PUBLIC_API_URL` to the API project URL + `/api`. |
