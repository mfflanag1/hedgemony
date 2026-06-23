/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@hedgemony/shared", "@hedgemony/spec", "@hedgemony/db"],
  experimental: {
    typedRoutes: false,
  },
};

export default nextConfig;
