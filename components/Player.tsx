"use client";

import { useEffect, useRef } from "react";

interface PlayerProps {
  playbackId: string;
}

export default function Player({ playbackId }: PlayerProps) {
  const imported = useRef(false);

  useEffect(() => {
    if (imported.current) return;
    imported.current = true;
    import("@fastpix/fp-player").catch(console.error);
  }, []);

  return (
    <fastpix-player
      playback-id={playbackId}
      stream-type="on-demand"
      style={{ width: "100%", aspectRatio: "16/9", display: "block" }}
    />
  );
}
