import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  output: 'standalone',
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  productionBrowserSourceMaps: false,
  experimental: {
    parallelServerBuildTraces: false,
    webpackBuildWorker: true,
  }
};

export default nextConfig;
