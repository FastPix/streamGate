# StreamGate

**Live demo: [streamgate.dev](https://streamgate.dev)**

A self-hostable video sharing web app built on [Next.js](https://nextjs.org) and powered by [FastPix](https://fastpix.io). Upload a video or record your screen/camera directly in the browser — get a shareable link in seconds.


## Introduction

StreamGate demonstrates a complete video upload and playback workflow using FastPix APIs. It provides drag-and-drop file uploading, in-browser screen and camera recording, adaptive HLS playback, and webhook event handling — all without a database. Every video gets a permanent shareable URL and is delivered via FastPix's global CDN with an adaptive bitrate ladder.

## Prerequisites

### Environment and Version Support

| Requirement | Version | Description |
|---|---:|---|
| Node.js | `18+` | Core runtime environment |
| npm / pnpm / yarn | `Latest` | Package manager for dependencies |
| FastPix account | `Required` | API credentials and media storage |
| Internet | `Required` | API communication and media delivery |

> Pro Tip: Use Node.js 20 LTS for optimal compatibility with Next.js 16 and local development.

### Getting Started with FastPix

To run StreamGate, you need a FastPix account and API credentials:

- FastPix APIs authenticate with a **Username** (Access Token ID) and a **Password** (Secret Key).
- Follow the [Authentication with Basic Auth](https://docs.fastpix.io/docs/basic-authentication) guide to generate your credentials from the FastPix dashboard.


## Table of Contents

* [StreamGate](#streamgate)
  * [Introduction](#introduction)
  * [Prerequisites](#prerequisites)
  * [Setup](#setup)
  * [Available Routes and Operations](#available-routes-and-operations)
  * [Integrating into Your Existing App](#integrating-into-your-existing-app)
  * [Webhooks](#webhooks)
  * [Error Handling](#error-handling)
  * [Deployment](#deployment)
  * [Environment Variables Reference](#environment-variables-reference)


## Setup

### 1. Clone and install

```bash
git clone https://github.com/FastPix/streamgate.git
cd streamgate
npm install
```

### 2. Configure environment variables

Create a `.env.local` file in the project root:

```bash
touch .env.local
```

Open it and add:

```env
FASTPIX_ACCESS_TOKEN_ID=your-access-token-id
FASTPIX_SECRET_KEY=your-secret-key
FASTPIX_WEBHOOK_SECRET=your-webhook-secret   # optional but recommended
NEXT_PUBLIC_BASE_URL=http://localhost:3000   # set to your real domain in production
```

Get your Access Token ID and Secret Key from the [FastPix Dashboard](https://dashboard.fastpix.io) under **Settings → Access Tokens**.

> Security Note: Never commit `.env.local` to version control. It is already included in `.gitignore`.

### 3. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).


<!-- Start Available Routes and Operations [operations] -->
## Available Routes and Operations

### Upload API

Manage the full video upload lifecycle — from creating a FastPix upload session to polling for asset readiness.

#### Upload
- **Create Upload** — `POST /api/uploads` — creates a FastPix upload and returns `uploadId` + `url` for the browser upload SDK
- **Poll Upload Status** — `GET /api/uploads/[id]` — checks the upload status and returns `mediaId` once the asset is created

#### Assets
- **Get Asset Status** — `GET /api/assets/[id]` — returns the media `status` and `playbackId` once processing is complete

### Playback

Every video is accessible at a permanent URL once its status reaches `ready`.

- **Watch Page** — `/share/[mediaId]` — embeds the FastPix HLS player with Open Graph metadata for rich link previews
- **Terms Page** — `/terms` — terms of use and media retention policy

### Recording

In-browser recording via the [MediaRecorder API](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder) — no plugins or extensions required.

- **Record Page** — `/record` — choose between screen capture or webcam; recording uploads automatically on stop

### Webhooks

- **Receive Events** — `POST /api/webhooks/fastpix` — verifies HMAC-SHA256 signatures and handles `video.media.ready`, `video.media.created`, and `video.media.failed` events
<!-- End Available Routes and Operations [operations] -->


## Integrating into Your Existing App

You can copy individual pieces of StreamGate into your own project rather than running it standalone.

### Option A — API routes only (backend)

Copy these files into your Next.js project for server-side FastPix integration:

```
app/api/uploads/route.ts
app/api/uploads/[id]/route.ts
app/api/assets/[id]/route.ts
app/api/webhooks/fastpix/route.ts     # optional
```

No extra FastPix server SDK is required for these routes. Then call the routes from your existing frontend:

```js
import { Uploader } from "@fastpix/resumable-uploads";

// 1. Create an upload
const { uploadId, url } = await fetch('/api/uploads', { method: 'POST' }).then(r => r.json());

// 2. Upload the file with FastPix's resumable web SDK
await new Promise((resolve, reject) => {
  const upload = Uploader.init({ endpoint: url, file });
  upload.on('success', resolve);
  upload.on('error', (event) => reject(new Error(event.detail?.message || 'Upload failed')));
});

// 3. Poll until the media asset is ready (with a 2-minute timeout)
let mediaId;
for (let i = 0; i < 60; i++) {
  await new Promise(r => setTimeout(r, 2000));
  const data = await fetch(`/api/uploads/${uploadId}`).then(r => r.json());
  if (data.mediaId && data.status !== 'waiting') { mediaId = data.mediaId; break; }
}

// 4. Get the playback ID and embed the player
const { playbackId } = await fetch(`/api/assets/${mediaId}`).then(r => r.json());
```

### Option B — React components

Copy the ready-made components into your own Next.js / React project:

**`<Uploader />`** — drag-and-drop file upload with progress bar:
```tsx
import Uploader from '@/components/Uploader';

<Uploader />
```

**`<Player />`** — FastPix HLS player web component:
```tsx
import Player from '@/components/Player';

<Player playbackId="your-playback-id" />
```

**`<Recorder />`** — in-browser screen/camera recorder:
```tsx
import Recorder from '@/components/Recorder';

<Recorder />
```

Additional dependencies:
```bash
npm install @fastpix/fp-player @fastpix/resumable-uploads swr fix-webm-duration
```

### Option C — FastPix API directly

For non-Next.js backends, call the FastPix API directly:

```bash
curl -X POST "https://api.fastpix.io/v1/on-demand/upload" \
  -u "$FASTPIX_ACCESS_TOKEN_ID:$FASTPIX_SECRET_KEY" \
  -H "Content-Type: application/json" \
  -H "X-Client-Type: web-browser" \
  -d '{
    "corsOrigin": "http://localhost:3000",
    "pushMediaSettings": {
      "accessPolicy": "public",
      "mediaQuality": "premium",
      "maxResolution": "1080p"
    }
  }'
```

See the [FastPix API reference](https://docs.fastpix.io/reference/signingkeys-overview) and the resumable uploads SDK for web docs for the full upload flow.


<!-- Start Webhooks [webhooks] -->
## Webhooks

StreamGate verifies incoming FastPix webhook payloads using HMAC-SHA256. Set `FASTPIX_WEBHOOK_SECRET` in your environment to enable signature verification.

Register your webhook endpoint in the [FastPix Dashboard](https://dashboard.fastpix.io) under **Settings → Webhooks**:

```
https://your-domain.com/api/webhooks/fastpix
```

### Supported Events

| Event | Description |
|---|---|
| `video.media.created` | FastPix has accepted the uploaded file |
| `video.media.ready` | Media has been processed and is ready to stream |
| `video.media.failed` | Processing failed |

> Note: If `FASTPIX_WEBHOOK_SECRET` is not set, signature verification is skipped. This is fine for local development but not recommended in production.
<!-- End Webhooks [webhooks] -->


<!-- Start Error Handling [errors] -->
## Error Handling

All API routes return JSON error responses with an `error` field and an appropriate HTTP status code.

| Status | Cause |
|---|---|
| `401` | Webhook signature verification failed |
| `500` | FastPix API error or unexpected server failure |

### Example

```ts
const res = await fetch('/api/uploads', { method: 'POST' });

if (!res.ok) {
  const { error } = await res.json();
  console.error('Upload failed:', error);
}
```

FastPix API errors are logged to the server console with full detail including status code, response body, and headers.
<!-- End Error Handling [errors] -->


## Deployment

### Cloudflare Workers (recommended)

StreamGate is a full-stack Next.js App Router app with SSR routes and API handlers. Deploy it with the current Cloudflare Workers + OpenNext flow rather than the older Cloudflare Pages + `next-on-pages` setup.

Official references:
- [Cloudflare Workers: Next.js guide](https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/)
- [Cloudflare Pages: Next.js overview](https://developers.cloudflare.com/pages/framework-guides/nextjs/)

#### 1. Install Wrangler

```bash
npm install --save-dev wrangler@latest
```

#### 2. Configure environment variables

In the Cloudflare dashboard, add these variables for both preview and production builds:

```env
FASTPIX_ACCESS_TOKEN_ID=your-access-token-id
FASTPIX_SECRET_KEY=your-secret-key
FASTPIX_WEBHOOK_SECRET=your-webhook-secret
NEXT_PUBLIC_BASE_URL=https://your-domain.example
```

`NEXT_PUBLIC_BASE_URL` should be your final deployed URL so Open Graph metadata and server-rendered share links use the correct host.

#### 3. Deploy an existing project

With Wrangler 4.68.0+ you can deploy this repo directly:

```bash
npx wrangler deploy
```

Wrangler will detect Next.js, configure the OpenNext adapter, and deploy the app to Cloudflare Workers.

#### 4. Optional: commit the generated config

If you want deployment config checked into git, run the deploy once locally and commit the generated Cloudflare files (`wrangler.jsonc`, OpenNext config, and related updates) after verifying they work for your account and domain setup.

#### 5. Preview locally in the Workers runtime

For production-like testing after Cloudflare configuration is in place:

```bash
npx wrangler dev
```

For normal app development, `npm run dev` is still the fastest local workflow.


## Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `FASTPIX_ACCESS_TOKEN_ID` | Yes | Basic Auth username for the FastPix API |
| `FASTPIX_SECRET_KEY` | Yes | Basic Auth password for the FastPix API |
| `FASTPIX_WEBHOOK_SECRET` | No | HMAC-SHA256 key for verifying webhook payloads |
| `NEXT_PUBLIC_BASE_URL` | Recommended | Base URL used for share links and metadata. Use `http://localhost:3000` locally and your real domain in deployed environments. |


## License

MIT
