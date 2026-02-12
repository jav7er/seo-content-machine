import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  output: 'standalone',
  experimental: {
    cpus: 1,
    workerThreads: false,
  },
};

export default nextConfig;
