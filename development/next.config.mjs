/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_MOBILE_SERVER_URL: process.env.MOBILE_SERVER_URL ?? "",
    NEXT_PUBLIC_MOBILE_ALLOW_CLEARTEXT: process.env.MOBILE_ALLOW_CLEARTEXT ?? "false",
    NEXT_PUBLIC_MOBILE_ALLOW_RUNTIME_OVERRIDE:
      process.env.MOBILE_ALLOW_RUNTIME_OVERRIDE ?? "false",
  },
  experimental: {
    serverComponentsExternalPackages: ["@huggingface/transformers", "onnxruntime-node"],
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "fastly.picsum.photos" },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
