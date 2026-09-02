/** @type {import('next').NextConfig} */
const nextConfig = {
  agentRules: false,
  distDir: process.env.NEXT_DIST_DIR || ".next",
  experimental: {
    proxyClientMaxBodySize: "5gb",
  },
};

export default nextConfig;
