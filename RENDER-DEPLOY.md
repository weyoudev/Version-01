# Fix 404: Redeploy the API on Render

If the mobile app shows **"Request failed (404). The API may need to be redeployed"**, the live API on Render is running old code that doesn’t have the `GET /api` (and `GET /`) routes.

## Steps

1. **Push latest code** (if you haven’t already):
   ```bash
   git add -A
   git commit -m "API: GET / and GET /api for mobile connection test"
   git push origin master
   ```

2. **In Render Dashboard**
   - Open [dashboard.render.com](https://dashboard.render.com)
   - Open the **weyou-api** service
   - If it didn’t auto-deploy: click **Manual Deploy** → **Clear build cache & deploy**
   - Wait until the deploy status is **Live** (and the build log shows no errors)

3. **Check that the API responds**
   - In a browser, open: **https://weyou-api.onrender.com/api**
   - You should see JSON like: `{"message":"Weyou API","api":"/api",...}`
   - If you see 404 or an error page, the deploy didn’t pick up the latest code (wrong branch or failed build).

4. **Retry in the mobile app**
   - Restart or reload the app and try again.

## If you use a different branch

In Render: **weyou-api** → **Settings** → **Build & Deploy** → set **Branch** to the one you push to (e.g. `master` or `main`), then trigger a deploy from that branch.

---

# Admin: "Failed to load analytics" with 404

If the admin dashboard shows **"The endpoint was not found (404)"** for analytics, the **weyou-api** service on Render is serving an old deploy that doesn’t include the analytics routes.

**Do this:**

1. Open [dashboard.render.com](https://dashboard.render.com) and select the **weyou-api** service (the API, not the admin).
2. Go to **Settings** → **Build & Deploy**. Confirm **Branch** is the one you use (e.g. `main` or `master`).
3. Go back to the service and click **Manual Deploy** → **Clear build cache & deploy**.
4. Wait until the deploy is **Live** and the build log has no errors.
5. Test the analytics route (requires no auth):
   - Open: **https://weyou-api.onrender.com/api**
   - You should see JSON. Then try (in browser or Postman; 401 is OK, 404 means route missing):
   - **https://weyou-api.onrender.com/api/admin/analytics/dashboard-kpis**  
     (You should get 401 Unauthorized if the API is new; 404 means the route still isn’t there.)
6. Reload the admin dashboard and hard refresh (Ctrl+Shift+R).

If you still get 404 after a clean deploy, check the **weyou-api** build log for errors and that the correct branch is deployed.

---

# Admin frontend on Render (weyou-admin)

If the admin at **https://weyou-admin.onrender.com** shows "Failed to load analytics" or "Cannot connect to the API" with old text (e.g. localhost:3005), the deployed app was built **without** the correct API URL. Next.js bakes `NEXT_PUBLIC_*` into the client bundle at **build time**, so the env var must be set on Render **before** the build runs.

## Build: "The module 'react' was not found"

If the build fails with **Cannot find module 'react'**, the monorepo workspace install isn't being used correctly. Use:

- **Root Directory:** leave **empty** (repo root), so the build runs from the repo root.
- **Build Command:** `npm install && cd apps/admin-web && npx next build`
- **Start Command:** `cd apps/admin-web && npx next start -p 3004`

Or from repo root: **Build Command** `npm run build:admin:render` and **Start Command** `cd apps/admin-web && npx next start -p 3004`.

## Steps

1. **Set the env var on Render**
   - Open [dashboard.render.com](https://dashboard.render.com) → your **admin** service (e.g. **weyou-admin**).
   - Go to **Environment**.
   - Add or edit:
     - **Key:** `NEXT_PUBLIC_API_URL`
     - **Value:** `https://weyou-api.onrender.com/api` (no trailing slash after `api`)
   - Save changes.

2. **Clear build cache and redeploy**
   - In the same service, go to **Manual Deploy** (or **Deploy**).
   - Use **Clear build cache & deploy** (or **Deploy** with “Clear build cache” if shown).
   - Wait until the deploy is **Live**.

3. **Hard refresh the browser**
   - Open https://weyou-admin.onrender.com/dashboard and do a hard refresh (Ctrl+Shift+R) or open in an incognito window.

After this, the admin will call the Render API and show the updated error messages.

**Network Error fix (same-origin proxy):** The admin app proxies API requests via a Route Handler (`/api-proxy/...`) when the app is on Render and the API URL is on Render. The browser only talks to the admin origin; the server forwards requests (including `Authorization`) to the API. Set `NEXT_PUBLIC_API_URL` as above. If the hostname check fails (e.g. custom domain), add **`NEXT_PUBLIC_USE_API_PROXY`** = **`true`** to the admin service env. Clear build cache, redeploy, then hard refresh. If the API is cold, wait 30–60s and refresh again.
