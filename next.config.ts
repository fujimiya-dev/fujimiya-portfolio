import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
    ],
  },
  experimental: {
    serverActions: {
      // Next.js defaults Server Action request bodies to 1MB, well under the
      // 4.5MB cap the upload action itself enforces (uploadScreenshot in
      // src/actions/upload.ts) — any screenshot between 1MB and 4.5MB was
      // rejected by this framework-level limit before that check ever ran.
      bodySizeLimit: "6mb",
    },
  },
};

export default nextConfig;
