/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '15mb'
    },
    serverComponentsExternalPackages: ['node-sqlite3-wasm']
  }
};

module.exports = nextConfig;
