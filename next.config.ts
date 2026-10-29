import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // SQLite db file nu serverless bundle ch shaamil karo
  outputFileTracingIncludes: {
    "/api/**/*": ["./db/**/*", "./prisma/**/*"],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
