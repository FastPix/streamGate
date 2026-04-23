"use client";

import useSWR from "swr";
import Player from "./Player";
import CopyLink from "./CopyLink";

interface AssetData {
  status: string;
  playbackId: string | null;
  failedReason?: string | null;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const READY_STATUSES = new Set(["Ready", "ready"]);
const ERROR_STATUSES = new Set(["Failed", "failed", "error"]);

interface PlayerLoaderProps {
  mediaId: string;
  shareUrl: string;
}

export default function PlayerLoader({ mediaId, shareUrl }: PlayerLoaderProps) {
  const { data, error } = useSWR<AssetData>(`/api/assets/${mediaId}`, fetcher, {
    refreshInterval: (data) => {
      if (!data) return 3000;
      if (READY_STATUSES.has(data.status) || ERROR_STATUSES.has(data.status)) return 0;
      return 3000;
    },
    revalidateOnFocus: false,
  });

  if (error) {
    return (
      <div className="text-center py-16 text-red-400">
        Failed to load video. Please refresh the page.
      </div>
    );
  }

  if (!data || (!READY_STATUSES.has(data.status) && !ERROR_STATUSES.has(data.status))) {
    return (
      <div className="flex flex-col items-center gap-4 py-16">
        <div className="w-10 h-10 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400 text-sm">
          {data?.status ? `Processing… (${data.status})` : "Loading…"}
        </p>
      </div>
    );
  }

  if (ERROR_STATUSES.has(data.status)) {
    return (
      <div className="text-center py-16 space-y-2">
        <p className="text-red-400">Video processing failed. Please try uploading again.</p>
        {data.failedReason && (
          <p className="text-gray-500 text-sm">Reason: {data.failedReason}</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl overflow-hidden bg-black">
        <Player playbackId={data.playbackId!} />
      </div>
      <div className="flex justify-end">
        <CopyLink url={shareUrl} />
      </div>
    </div>
  );
}
