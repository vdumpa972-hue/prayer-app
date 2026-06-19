import type { NextConfig } from "next";

const buildStamp = new Date().toISOString().replace("T", " ").replace(/\..+/, " UTC");

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_BUILD_VERSION: buildStamp,
  },
};

export default nextConfig;
