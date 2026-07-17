/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: __dirname,
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost', port: '8055', pathname: '/assets/**' },
      { protocol: 'https', hostname: '**', pathname: '/assets/**' }
    ]
  }
};

module.exports = nextConfig;
