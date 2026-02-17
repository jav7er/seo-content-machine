/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Disable source maps in production to save memory during build
  productionBrowserSourceMaps: false,
  // Experimental optimizations for low-memory environments
  experimental: {
    parallelServerBuildTraces: false,
    webpackBuildWorker: false,
  }
};

export default nextConfig;
