import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // FastPix player is a browser-only web component — skip SSR for it
  transpilePackages: ["@fastpix/fp-player"],
  // Keep the FastPix Node SDK server-side only
  serverExternalPackages: ["@fastpix/fastpix-node"],
};

export default nextConfig;
