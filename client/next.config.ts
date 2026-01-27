import api from "@/lib/api";
import config from "@/lib/config";
import type { NextConfig } from "next";

const checkConfiguration = async () => {
  if (!config.isValid) {
    console.error("Invalid configuration. Exiting...");
    process.exit(1);
  }

  try {
    await api.get("/status", { withCredentials: true });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    console.error("Failed to reach Backend API.");
    process.exit(1);
  }
};

checkConfiguration();

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.coinlore.com',
        port: '',
        pathname: '/img/**',
      },
    ],
  },
};

export default nextConfig;
