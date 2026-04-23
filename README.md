# StreamGate

A self-hostable video sharing app powered by [FastPix](https://fastpix.io). Upload a video or record your screen/camera and get a shareable link in seconds — no account required for viewers.


![StreamGate](https://img.shields.io/badge/powered%20by-FastPix-orange)

---

## Features

- **Drag-and-drop upload** — drop any MP4, MOV, WebM, or AVI file
- **In-browser recording** — record your screen or camera directly, no plugins needed
- **Shareable links** — every video gets a permanent `/v/[id]` URL
- **Adaptive playback** — HLS ABR ladder (1080p → 720p → 480p → 270p) via FastPix player
- **Stateless** — no database; all state lives in FastPix
- **Webhook support** — HMAC-SHA256 verified FastPix event handling

---

## Tech Stack

| Concern | Library |
|---|---|
| Framework | Next.js 16 (App Router, TypeScript) |
| Styling | Tailwind CSS v4 |
| FastPix server SDK | `@fastpix/fastpix-node` |
| FastPix player | `@fastpix/fp-player` (web component) |
| WebM duration fix | `fix-webm-duration` |
| Polling | `swr` |

---

## Getting Started

### 1. Clone and install

```bash
git clone <your-repo-url>
cd streamgate
npm install
```

### 2. Configure environment variables

```bash
touch .env.local
```

Open `.env.local` and fill in your credentials:

```env
FASTPIX_ACCESS_TOKEN_ID=your-access-token-id
FASTPIX_SECRET_KEY=your-secret-key
FASTPIX_WEBHOOK_SECRET=your-webhook-secret   # optional but recommended
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

Get your API Access Tokens from the [FastPix dashboard](https://dashboard.fastpix.io) under **Settings → Manage → Access Tokens**.

### 3. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## How It Works

```
User drops file / stops recording
        │
        ▼
POST /api/uploads         ← creates a signed GCS upload URL via FastPix SDK
        │
        ▼
PUT <signed-url>          ← browser uploads directly to FastPix storage (XHR)
        │
        ▼
GET /api/uploads/[id]     ← polls until FastPix creates the media asset
        │
        ▼
Redirect to /v/[mediaId]
        │
        ▼
GET /api/assets/[id]      ← SWR polls until status = "Ready"
        │
        ▼
<fastpix-player>          ← streams via HLS with ABR
```

---

## Project Structure

```
streamgate/
├── app/
│   ├── layout.tsx                    # Root layout + global metadata
│   ├── page.tsx                      # Home: upload zone + record link
│   ├── globals.css                   # Tailwind + base styles
│   ├── record/
│   │   └── page.tsx                  # Screen/camera recorder page
│   ├── v/[id]/
│   │   └── page.tsx                  # Video playback page (OG tags + player)
│   └── api/
│       ├── uploads/
│       │   ├── route.ts              # POST → create FastPix upload URL
│       │   └── [id]/route.ts         # GET → poll upload → return mediaId
│       ├── assets/
│       │   └── [id]/route.ts         # GET → media status + playbackId
│       └── webhooks/
│           └── fastpix/route.ts      # POST → verify signature + handle events
├── components/
│   ├── CopyLink.tsx                  # Copy-to-clipboard button
│   ├── Player.tsx                    # <fastpix-player> wrapper
│   ├── PlayerLoader.tsx              # SWR polling → renders Player when ready
│   ├── Recorder.tsx                  # MediaRecorder screen/camera UI
│   └── Uploader.tsx                  # Drag-and-drop file upload UI
├── lib/
│   └── fastpix.ts                    # FastPix SDK lazy singleton
├── types/
│   └── fastpix-player.d.ts           # Type declarations for FastPix SDKs
├── .env.local
├── next.config.ts
└── package.json
```

---

## API Routes

| Method | Route | Description |
|---|---|---|
| `POST` | `/api/uploads` | Creates a signed FastPix upload URL |
| `GET` | `/api/uploads/[id]` | Polls FastPix for the media ID after upload |
| `GET` | `/api/assets/[id]` | Returns media status and playback ID |
| `POST` | `/api/webhooks/fastpix` | Receives and verifies FastPix webhook events |

---

## Integrating into Your Existing App

You don't have to run this as a standalone app. You can copy individual pieces into your own Next.js project.

### Option A — Copy the API routes only (backend only)

If you already have a frontend and just want FastPix video upload in your app:

**1. Copy these files into your project:**
```
lib/fastpix.ts                        ← FastPix SDK singleton
app/api/uploads/route.ts              ← creates signed upload URL
app/api/uploads/[id]/route.ts         ← polls until media asset is ready
app/api/assets/[id]/route.ts          ← returns playback ID + status
app/api/webhooks/fastpix/route.ts     ← optional: receive FastPix events
```

**2. Add your env vars:**
```env .env.local
FASTPIX_ACCESS_TOKEN_ID=your-token-id
FASTPIX_SECRET_KEY=your-secret-key
FASTPIX_WEBHOOK_SECRET=your-webhook-secret
```

### Option A — Call the API from your existing form

Use these four steps to upload a file and get a playback ID:

```js
// 1. Request a signed upload URL
const { uploadId, url } = await fetch('/api/uploads', { method: 'POST' }).then(r => r.json());

// 2. Upload the file directly to FastPix
await fetch(url, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });

// 3. Wait for the media asset to finish processing
let mediaId;
while (!mediaId) {
  await new Promise(r => setTimeout(r, 2000));
  const data = await fetch(`/api/uploads/${uploadId}`).then(r => r.json());
  if (data.mediaId) mediaId = data.mediaId;
}

// 4. Fetch the playback ID and render the player
const { playbackId } = await fetch(`/api/assets/${mediaId}`).then(r => r.json());
```

---

### Option B — Copy the components

For Next.js / React apps, drop in these pre-built components:

**Drag-and-drop uploader with progress bar:**

```tsx
import { Uploader } from "@fastpix/resumable-uploads";

const fileUploader = Uploader.init({
  endpoint: 'https://example.com/signed-url', // your signed URL
  file: mediaFile,
  chunkSize: 5120, // minimum 5120 KB (5 MB)
  // add any other optional params here
});
```

**HLS video player:**

```tsx
import "@fastpix/fp-player";

<fastpix-player playback-id="PLAYBACK_ID" stream-type="on-demand"></fastpix-player>
```

Pass the `playbackId` returned from `/api/assets/[id]`.

---

### Option C — Use the FastPix SDK directly

If you're not using Next.js, integrate via the [FastPix Upload SDK](https://github.com/FastPix/web-uploads-sdk) in your own application. See the [full SDK reference](https://docs.fastpix.io/docs/resumable-uploads-sdk-for-web) for details.

## Deploying to Cloudflare Pages

### 1. Install the Cloudflare adapter

```bash
npm install --save-dev @cloudflare/next-on-pages wrangler
```

### 2. Create a `wrangler.toml` in the project root

```toml
name = "streamgate"
compatibility_date = "2024-09-23"
compatibility_flags = ["nodejs_compat"]
pages_build_output_dir = ".vercel/output/static"
```

> `nodejs_compat` is required for the FastPix SDK and crypto APIs used in webhook verification.

### 3. Add the build script to `package.json`

```json
"scripts": {
  "pages:build": "npx @cloudflare/next-on-pages",
  "pages:deploy": "npm run pages:build && wrangler pages deploy"
}
```

### 4. Build and deploy

```bash
npm run build           # verify the Next.js build passes locally first
npm run pages:deploy    # builds for Cloudflare and deploys
```

On first run, Wrangler will prompt you to log in and select or create a Cloudflare Pages project.

### 5. Set environment variables

In the [Cloudflare Dashboard](https://dash.cloudflare.com) go to **Pages → your project → Settings → Environment variables** and add:

| Variable | Value |
|---|---|
| `FASTPIX_ACCESS_TOKEN_ID` | Your FastPix access token ID |
| `FASTPIX_SECRET_KEY` | Your FastPix secret key |
| `FASTPIX_WEBHOOK_SECRET` | Your webhook signing secret |
| `NEXT_PUBLIC_BASE_URL` | Your production URL, e.g. `https://stream.yourdomain.com` |

Set these for both **Production** and **Preview** environments.

### 6. Configure the FastPix webhook

Once deployed, copy your Cloudflare Pages URL and register it in the [FastPix dashboard](https://dashboard.fastpix.io) under **Dashboard → Webhooks**:

```
https://streamgate.pages.dev/api/webhooks/fastpix
```

Replace `streamgate.pages.dev` with your actual Pages domain or custom domain.

### Custom domain (optional)

In the Cloudflare Dashboard go to **Pages → your project → Custom domains** and add your domain. Cloudflare handles SSL automatically.

> **Note:** Cloudflare Pages runs Next.js via Edge Runtime. If you add server-side features that require Node.js APIs not covered by `nodejs_compat`, they will need to be adapted for the Edge runtime.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `FASTPIX_ACCESS_TOKEN_ID` | Yes | Basic Auth username for FastPix API |
| `FASTPIX_SECRET_KEY` | Yes | Basic Auth password for FastPix API |
| `FASTPIX_WEBHOOK_SECRET` | No | HMAC-SHA256 signing key for webhook verification |
| `NEXT_PUBLIC_BASE_URL` | Yes | Base URL used in shareable links |

---

## License

MIT
