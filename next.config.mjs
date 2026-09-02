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

if (process.env.DOCKER_BUILD === "1") {
  nextConfig.output = "standalone";
}

export default nextConfig;
