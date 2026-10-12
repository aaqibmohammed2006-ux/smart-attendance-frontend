# Smart Attendance Frontend

Vite + React frontend for the Smart Attendance Management System.

## Run locally

Requires Node.js and npm. From this repository:

```powershell
npm ci
npm run dev
```

The development server runs at `http://localhost:5173` and uses `http://localhost:8080/api` by default. To use another API, copy `.env.example` to `.env` and set `VITE_API_BASE_URL` to the backend API base URL, including `/api`.

## Deploy this repository to Render

1. Push this folder as the root of the `smart-attendance-frontend` GitHub repository.
2. In Render, create a **Static Site** and connect that repository. Set the Root Directory to `.`, Build Command to `npm ci && npm run build`, and Publish Directory to `dist`.
3. Set the build-time environment variable `VITE_API_BASE_URL` to `https://<your-backend-service>.onrender.com/api`. Vite embeds this value when it builds, so redeploy the static site after changing it.
4. The included `render.yaml` rewrites unknown paths to `/index.html` for SPA fallback. After the first deploy, open the service URL, refresh the page, and verify the dashboard loads backend data.
5. Add the exact deployed frontend origin (scheme and hostname, without a path) to the backend's `CORS_ALLOWED_ORIGINS` variable, then redeploy the backend. For a custom frontend domain, allow that exact origin too.

If using a `.env` file for a local production build, set:

```env
VITE_API_BASE_URL=https://<your-backend-service>.onrender.com/api
```

Never put database credentials or backend secrets in frontend variables; `VITE_*` values are public in the built JavaScript.

Render service prices and limits vary. Check current pricing and static-site limitations before deploying: https://render.com/pricing and https://render.com/docs/free

## Production build

```powershell
npm ci
npm run build
```

The static output is written to `dist`.
