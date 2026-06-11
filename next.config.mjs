/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { unoptimized: true },
  async redirects() {
    return [{ source: '/favicon.ico', destination: '/logo.png', permanent: false }];
  },
};

export default nextConfig;
