/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Output format for Cloudflare
  output: "standalone",
  // Compress HTML
  compress: true,
  // Enable static optimization where possible
  poweredByHeader: false,
  // Enable images
  images: {
    unoptimized: true,
  },
  // webpack configuration
  webpack: (config) => {
    // Fix for Cloudflare Assets
    config.resolve.alias.canvas = "canvas";
    config.resolve.alias.stream = "stream-browserify";
    config.resolve.alias.buffer = "buffer";
    return config;
  },
};

module.exports = nextConfig;