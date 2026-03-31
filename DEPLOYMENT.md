# Spades Multiplayer Deployment

This application is containerized and configured for deployment on Google Cloud Run via GitLab CI/CD.

## Prerequisites

1. Google Cloud Project with billing enabled
2. Service Account with the following roles:
   - Cloud Build Service Account
   - Cloud Run Admin
   - Storage Admin (for Container Registry)
3. GitLab repository

## Setup

### 1. Google Cloud Setup

1. Create a service account in GCP:

   ```bash
   gcloud iam service-accounts create gitlab-ci --display-name "GitLab CI"
   ```

2. Grant necessary roles:

   ```bash
   gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
     --member="serviceAccount:gitlab-ci@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
     --role="roles/cloudbuild.builds.builder"

   gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
     --member="serviceAccount:gitlab-ci@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
     --role="roles/run.admin"

   gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
     --member="serviceAccount:gitlab-ci@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
     --role="roles/storage.admin"
   ```

3. Create and download a JSON key for the service account.

### 2. GitLab Setup

1. In your GitLab repository, go to Settings > CI/CD > Variables
2. Add the following variables:
   - `GCP_PROJECT_ID`: Your Google Cloud Project ID
   - `GCP_REGION`: Cloud Run region (e.g., `us-central1`)
   - `GCP_SA_KEY`: Base64-encoded content of the service account JSON key
     ```bash
     cat key.json | base64 -w 0
     ```

### 3. Enable APIs

Enable the following APIs in your GCP project:

- Cloud Build API
- Cloud Run API
- Container Registry API

### 4. Deploy

Push your code to the `main` branch. GitLab CI/CD will automatically:

1. Build the Docker image using Cloud Build
2. Push to Google Container Registry
3. Deploy to Cloud Run

The service will be available at: `https://spades-multiplayer-YOUR_PROJECT_ID.YOUR_REGION.run.app`

## Environment Variables

You can set additional environment variables in Cloud Run:

- `ADMIN_PASSWORD`: Password for admin access (default: "admin")

## Local Development

To run locally:

```bash
npm run dev
```

To build for production:

```bash
npm run build
```
