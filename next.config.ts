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
  // Optimization for cPanel build
  experimental: {
    parallelServerBuildTraces: false,
    webpackBuildWorker: true, // Re-habilitado ya que tienes 6GB
  }
};

export default nextConfig;
