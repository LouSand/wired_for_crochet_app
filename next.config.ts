import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.0.90'],
  webpack: (config) => {
    // Prevent webpack from trying to bundle the pdf.js worker
    config.resolve.alias.canvas = false;
    return config;
  },
};

export default nextConfig;
