/** @type {import('next').NextConfig} */
const nextConfig = {
  agentRules: false,
  experimental: {
    proxyClientMaxBodySize: "5gb",
  },
};

export default nextConfig;
