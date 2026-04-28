import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

const FP_BASE = "https://api.fastpix.io/v1";

function getAuth() {
  const id = process.env.FASTPIX_ACCESS_TOKEN_ID;
  const secret = process.env.FASTPIX_SECRET_KEY;
  if (!id || !secret) throw new Error("Missing FastPix credentials");
  return "Basic " + btoa(`${id}:${secret}`);
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    // Poll the upload status endpoint to get the associated mediaId.
    // The uploadId returned at upload creation is different from the mediaId
    // assigned once FastPix processes the file.
    const uploadRes = await fetch(`${FP_BASE}/on-demand/upload/${id}`, {
      headers: { Authorization: getAuth() },
      cache: "no-store",
    });

    if (uploadRes.ok) {
      const uploadJson = await uploadRes.json();
      const upload = uploadJson.data;
      const mediaId: string | null = upload?.mediaId ?? null;

      if (!mediaId) {
        // Upload found but media not yet created
        return NextResponse.json({ mediaId: null, status: "waiting", playbackId: null });
      }

      // Media was created — fetch its current status
      const mediaRes = await fetch(`${FP_BASE}/on-demand/${mediaId}`, {
        headers: { Authorization: getAuth() },
        cache: "no-store",
      });

      if (!mediaRes.ok) {
        return NextResponse.json({ mediaId, status: "waiting", playbackId: null });
      }

      const mediaJson = await mediaRes.json();
      const media = mediaJson.data;
      const playbackId = media?.playbackIds?.[0]?.id ?? null;
      const status: string = media?.status ?? "waiting";
      return NextResponse.json({ mediaId, status, playbackId });
    }

    // Fallback: some FastPix plans allow querying by uploadId directly
    const mediaRes = await fetch(`${FP_BASE}/on-demand/${id}`, {
      headers: { Authorization: getAuth() },
      cache: "no-store",
    });

    if (!mediaRes.ok) {
      return NextResponse.json({ mediaId: null, status: "waiting", playbackId: null });
    }

    const json = await mediaRes.json();
    const media = json.data;
    const playbackId = media?.playbackIds?.[0]?.id ?? null;
    const status: string = media?.status ?? "waiting";
    return NextResponse.json({ mediaId: media?.id ?? id, status, playbackId });
  } catch {
    return NextResponse.json({ mediaId: null, status: "waiting", playbackId: null });
  }
}
