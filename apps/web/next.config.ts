import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@lumora/ui', '@lumora/contracts', '@lumora/ledger'],
  reactStrictMode: true,
  poweredByHeader: false,
};

export default nextConfig;
