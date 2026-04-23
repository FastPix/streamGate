import { NextResponse } from "next/server";
import fastpix from "@/lib/fastpix";

export async function POST() {
  try {
    const result = await fastpix.inputVideo.upload({
      corsOrigin: "*",
      pushMediaSettings: {
        accessPolicy: "public",
        mediaQuality: "premium",
        maxResolution: "1080p",
      },
    });

    const data = "data" in result ? result.data : undefined;

    if (!data?.uploadId || !data?.url) {
      console.error("FastPix upload error — unexpected response:", result);
      return NextResponse.json({ error: "Failed to create upload URL" }, { status: 500 });
    }

    return NextResponse.json({ uploadId: data.uploadId, url: data.url });
  } catch (err) {
    console.error("FastPix upload creation error:", err);
    return NextResponse.json({ error: "Failed to create upload URL" }, { status: 500 });
  }
}
