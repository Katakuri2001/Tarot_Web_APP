/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  compress: true,
  poweredByHeader: false,
  images: {
    unoptimized: true,
  },
  webpack: (config) => {
    config.resolve.alias.canvas = "canvas";
    config.resolve.alias.stream = "stream-browserify";
    config.resolve.alias.buffer = "buffer";
    return config;
  },
};

module.exports = nextConfig;