import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // FastPix player is a browser-only web component — skip SSR for it
  transpilePackages: ["@fastpix/fp-player"],
};

export default nextConfig;
