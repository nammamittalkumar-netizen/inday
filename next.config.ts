import type { NextConfig } from "next";

// Image hosts allowlisted for next/image (Cloudinary uploads + demo assets).
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
