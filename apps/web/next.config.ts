import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Remove this once all type errors are fixed
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
