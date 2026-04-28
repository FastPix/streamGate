import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

const FP_BASE = "https://api.fastpix.io/v1";

function getAuth() {
  const id = process.env.FASTPIX_ACCESS_TOKEN_ID;
  const secret = process.env.FASTPIX_SECRET_KEY;
  if (!id || !secret) throw new Error("Missing FastPix credentials. Add FASTPIX_ACCESS_TOKEN_ID and FASTPIX_SECRET_KEY to your environment variables.");
  return "Basic " + btoa(`${id}:${secret}`);
}

export async function POST(req: NextRequest) {
  // Use the browser's actual origin so FastPix configures the correct
  // Access-Control-Allow-Origin on the signed GCS upload URL.
  // Without this, the PUT response is blocked by CORS in the browser
  // even though the upload reaches FastPix (onerror fires → "Upload failed").
  const origin = req.headers.get("origin") ?? "*";

  try {
    const res = await fetch(`${FP_BASE}/on-demand/upload`, {
      method: "POST",
      headers: {
        Authorization: getAuth(),
        "Content-Type": "application/json",
        "X-Client-Type": "web-browser"
      },
      body: JSON.stringify({
        corsOrigin: origin,
        pushMediaSettings: {
          accessPolicy: "public",
          mediaQuality: "premium",
          maxResolution: "1080p",
        },
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("FastPix upload error:", res.status, text);
      return NextResponse.json({ error: "Failed to create upload URL" }, { status: 500 });
    }

    const json = await res.json();
    const data = json.data;

    if (!data?.uploadId || !data?.url) {
      console.error("FastPix upload error — unexpected response:", json);
      return NextResponse.json({ error: "Failed to create upload URL" }, { status: 500 });
    }

    return NextResponse.json({ uploadId: data.uploadId, url: data.url });
  } catch (err) {
    console.error("FastPix upload creation error:", err);
    return NextResponse.json({ error: "Failed to create upload URL" }, { status: 500 });
  }
}
