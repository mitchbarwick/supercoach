# Phase 3 deployment — accounts, feedback & admin

The frontend stays on GitHub Pages. Accounts/sync/feedback run on an Azure
Functions API + Cosmos DB (both free tiers), with Google sign-in verified
server-side. Until the two repo variables below exist, the deployed app
builds in **guest-only mode** — identical to phase 2 — so it's safe to push
the code before provisioning.

## 1. Azure resources (once)

```bash
az group create -n supercoach-rg -l australiaeast
az cosmosdb create -n supercoach-db -g supercoach-rg --enable-free-tier true
az storage account create -n supercoachfn -g supercoach-rg -l australiaeast --sku Standard_LRS
az functionapp create -n supercoach-api -g supercoach-rg --storage-account supercoachfn \
  --consumption-plan-location australiaeast --runtime node --runtime-version 20 --functions-version 4
```

App settings on the Function App (Portal → supercoach-api → Environment variables):

| Setting | Value |
|---|---|
| `COSMOS_CONNECTION_STRING` | Cosmos → Keys → Primary connection string |
| `GOOGLE_CLIENT_ID` | from step 2 |
| `JWT_SECRET` | any long random string (e.g. `openssl rand -hex 32`) |
| `ADMIN_EMAILS` | `mitch.j.barwick@gmail.com` |
| `ALLOWED_ORIGINS` | `https://mitchbarwick.github.io,http://localhost:5173` |

Leave the platform **CORS list empty** — the API sets CORS headers itself and
platform CORS would override them.

## 2. Google OAuth client (once)

console.cloud.google.com → APIs & Services → Credentials → Create credentials
→ OAuth client ID → Web application:

- Authorized JavaScript origins: `https://mitchbarwick.github.io` and `http://localhost:5173`
- No redirect URIs needed (Google Identity Services button, not a redirect flow).

Copy the client ID (ends `.apps.googleusercontent.com`).

## 3. Wire up GitHub

Repo → Settings → Secrets and variables → Actions:

- **Variables**: `VITE_API_BASE` = `https://supercoach-api.azurewebsites.net/api`,
  `VITE_GOOGLE_CLIENT_ID` = the client ID from step 2.
- **Secrets**: `AZURE_FUNCTIONAPP_PUBLISH_PROFILE` = contents of the publish
  profile (Function App → Overview → Get publish profile).

## 4. Deploy

1. Push to `main` → Pages workflow rebuilds the frontend with account UI enabled.
2. Actions tab → "Deploy API to Azure Functions" → Run workflow.

## Smoke test

- `curl -X POST https://supercoach-api.azurewebsites.net/api/feedback -H 'Content-Type: application/json' -d '{"text":"hello"}'` → `{"ok":true}`
- Site: sign in with Google on Settings → build a session → it appears under
  Recent sessions on Home → sign in as `mitch.j.barwick@gmail.com` → 📊 Admin
  appears in the nav.

## Local dev

`npm run dev` runs guest-only. To test accounts locally create `.env.local`:

```
VITE_API_BASE=https://supercoach-api.azurewebsites.net/api
VITE_GOOGLE_CLIENT_ID=<client id>
```
