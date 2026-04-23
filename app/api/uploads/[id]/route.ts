import { NextRequest, NextResponse } from "next/server";

const FP_BASE = "https://api.fastpix.io/v1";

function getAuth() {
  const id = process.env.FASTPIX_ACCESS_TOKEN_ID;
  const secret = process.env.FASTPIX_SECRET_KEY;
  if (!id || !secret) throw new Error("Missing FastPix credentials");
  return "Basic " + Buffer.from(`${id}:${secret}`).toString("base64");
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const res = await fetch(`${FP_BASE}/on-demand/${id}`, {
      headers: { Authorization: getAuth() },
      cache: "no-store",
    });

    if (!res.ok) {
      // Media not yet created (upload still in progress)
      return NextResponse.json({ mediaId: null, status: "waiting", playbackId: null });
    }

    const json = await res.json();
    const media = json.data;
    const playbackId = media?.playbackIds?.[0]?.id ?? null;
    const status: string = media?.status ?? "waiting";

    return NextResponse.json({ mediaId: media?.id ?? id, status, playbackId });
  } catch {
    return NextResponse.json({ mediaId: null, status: "waiting", playbackId: null });
  }
}
