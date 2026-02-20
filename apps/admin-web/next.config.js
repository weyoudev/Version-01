/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Avoid monorepo root ESLint config (tsconfig.base.json path) breaking Vercel build
  eslint: { ignoreDuringBuilds: true },
};

module.exports = nextConfig;
