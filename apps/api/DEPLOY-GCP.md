# Deploy WeYou API to Google Cloud Run

This guide deploys the NestJS API to **Google Cloud Run** so the mobile app can reach it from any network (set `EXPO_PUBLIC_API_URL` to the Cloud Run URL and rebuild the APK).

## Prerequisites

1. **Google Cloud project** – [Create one](https://console.cloud.google.com/) and note the Project ID.
2. **gcloud CLI** – [Install](https://cloud.google.com/sdk/docs/install) and log in:
   ```bash
   gcloud auth login
   gcloud config set project YOUR_PROJECT_ID
   ```
3. **Enable APIs**:
   ```bash
   gcloud services enable run.googleapis.com
   gcloud services enable artifactregistry.googleapis.com
   ```

## Environment variables (required in Cloud Run)

Set these when deploying (or in Cloud Run Console → Edit & deploy → Variables). Get values from your root `.env` (use production values for DB and secrets).

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string (e.g. Supabase) |
| `JWT_SECRET` | Secret for JWT signing (use a strong value in production) |
| `TWILIO_ACCOUNT_SID` | Twilio account SID (for OTP) |
| `TWILIO_AUTH_TOKEN` | Twilio auth token |
| `TWILIO_VERIFY_SERVICE_SID` | Twilio Verify service SID |
| `LOCAL_STORAGE_ROOT` | Writable path in container, e.g. `/tmp/storage` |
| `PORT` | Leave unset; Cloud Run sets it (default 8080) |

## Option 1: Build locally and deploy

From the **repo root** (`E:\WeYouApp`):

### 1. Build the Docker image

```bash
docker build -f apps/api/Dockerfile -t gcr.io/YOUR_PROJECT_ID/weyou-api:latest .
```

Replace `YOUR_PROJECT_ID` with your GCP project ID. If you use **Artifact Registry** instead of gcr.io:

```bash
docker build -f apps/api/Dockerfile -t REGION-docker.pkg.dev/YOUR_PROJECT_ID/REPO_NAME/weyou-api:latest .
```

### 2. Push the image

**Using Container Registry (gcr.io):**
```bash
docker push gcr.io/YOUR_PROJECT_ID/weyou-api:latest
```
(Configure Docker for gcr: `gcloud auth configure-docker`)

**Using Artifact Registry:**
```bash
gcloud auth configure-docker REGION-docker.pkg.dev
docker push REGION-docker.pkg.dev/YOUR_PROJECT_ID/REPO_NAME/weyou-api:latest
```

### 3. Deploy to Cloud Run

```bash
gcloud run deploy weyou-api \
  --image gcr.io/YOUR_PROJECT_ID/weyou-api:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars "DATABASE_URL=YOUR_DATABASE_URL" \
  --set-env-vars "JWT_SECRET=YOUR_JWT_SECRET" \
  --set-env-vars "LOCAL_STORAGE_ROOT=/tmp/storage" \
  --set-env-vars "TWILIO_ACCOUNT_SID=YOUR_SID" \
  --set-env-vars "TWILIO_AUTH_TOKEN=YOUR_TOKEN" \
  --set-env-vars "TWILIO_VERIFY_SERVICE_SID=YOUR_VERIFY_SID"
```

Use your real values; for many variables you can use `--set-env-vars "KEY=value"` or a file: `--env-vars-file apps/api/env.yaml`.

After deploy, Cloud Run prints the **service URL**, e.g. `https://weyou-api-xxxxx-uc.a.run.app`.

### 4. Point the mobile app at the API

- In `apps/customer-mobile/eas.json`, set the **preview** profile env:
  ```json
  "env": {
    "EXPO_PUBLIC_API_URL": "https://weyou-api-xxxxx-uc.a.run.app"
  }
  ```
- Rebuild the Android APK: `npm run build:android:beta -w customer-mobile`.
- Share the new APK; the app will work from any network.

---

## Option 2: Build and deploy with Cloud Build

1. **Create an Artifact Registry repo** (one time):
   ```bash
   gcloud artifacts repositories create weyou-api --repository-format=docker --location=us-central1
   ```
2. **Edit `apps/api/cloudbuild.yaml`** – set `_PROJECT_ID` to your GCP project ID and `_REGION` if different (e.g. `us-central1`).
3. **Run the build** from repo root:
   ```bash
   gcloud builds submit --config apps/api/cloudbuild.yaml .
   ```
4. **Deploy to Cloud Run** (first time or to update):
   ```bash
   gcloud run deploy weyou-api \
     --image us-central1-docker.pkg.dev/YOUR_PROJECT_ID/weyou-api/weyou-api:latest \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated \
     --set-env-vars "DATABASE_URL=...,JWT_SECRET=...,LOCAL_STORAGE_ROOT=/tmp/storage" \
     --set-env-vars "TWILIO_ACCOUNT_SID=...,TWILIO_AUTH_TOKEN=...,TWILIO_VERIFY_SERVICE_SID=..."
   ```
   Replace the image URL with your project ID and set all env vars (see table above).

---

## API base path

The API uses global prefix `/api`. So:

- Service URL: `https://weyou-api-xxxxx-uc.a.run.app`
- Health/root: `https://weyou-api-xxxxx-uc.a.run.app/` (returns JSON with `api: '/api'`)
- All routes: `https://weyou-api-xxxxx-uc.a.run.app/api/...`

Set `EXPO_PUBLIC_API_URL` to **the service URL only** (no `/api`), e.g. `https://weyou-api-xxxxx-uc.a.run.app`. The app already appends `/api` where needed.

---

## Storage (uploads)

Cloud Run’s filesystem is ephemeral. If the API writes files (e.g. branding assets, PDFs), use **Cloud Storage** in production and set the appropriate env/config so the API writes to a GCS bucket instead of `LOCAL_STORAGE_ROOT`. For a first deploy, `/tmp/storage` is fine for temporary files.
