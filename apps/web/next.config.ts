import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: process.env.AUTH_URL ? [new URL(process.env.AUTH_URL).hostname] : [],
};

export default nextConfig;
