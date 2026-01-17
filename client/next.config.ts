import config from "@/lib/config";
import type { NextConfig } from "next";

if (!config.isValid) {
  console.error("Invalid configuration. Exiting...");
  process.exit(1);
}

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
