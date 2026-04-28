import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

const WEBHOOK_SECRET = process.env.FASTPIX_WEBHOOK_SECRET ?? "";

async function verifySignature(rawBody: string, signatureHeader: string): Promise<boolean> {
  if (!WEBHOOK_SECRET) return true; // skip verification if not configured

  try {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      enc.encode(WEBHOOK_SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const sig = await crypto.subtle.sign("HMAC", key, enc.encode(rawBody));
    const expected = btoa(String.fromCharCode(...new Uint8Array(sig)));
    return expected === signatureHeader;
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signatureHeader = req.headers.get("fastpix-signature") ?? "";

  if (!(await verifySignature(rawBody, signatureHeader))) {
    console.warn("FastPix webhook signature verification failed");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: { type: string; object?: { id?: string } };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { type, object } = event;
  const mediaId = object?.id ?? "(unknown)";

  switch (type) {
    case "video.media.ready":
      console.log(`[FastPix] Media ready: ${mediaId}`);
      break;
    case "video.media.failed":
      console.error(`[FastPix] Media failed: ${mediaId}`);
      break;
    case "video.media.created":
      console.log(`[FastPix] Media created: ${mediaId}`);
      break;
    default:
      console.log(`[FastPix] Event: ${type} | id: ${mediaId}`);
  }

  return NextResponse.json({ received: true });
}
