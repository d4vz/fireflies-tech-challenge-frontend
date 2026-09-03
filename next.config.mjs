/** @type {import('next').NextConfig} */
const nextConfig = {
  agentRules: false,
  allowedDevOrigins: ["127.0.0.1"],
  distDir: process.env.NEXT_DIST_DIR || ".next",
  experimental: {
    proxyClientMaxBodySize: "5gb",
    optimizePackageImports: ["lucide-react"],
  },
};

export default nextConfig;
