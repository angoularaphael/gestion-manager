/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { unoptimized: true },
  async redirects() {
    return [
      { source: '/favicon.ico', destination: '/favicon.png', permanent: false },
      { source: '/admin/boxeurs', destination: '/admin/entraineurs', permanent: true },
      { source: '/admin/envoyer-boxeurs', destination: '/admin/envoyer-entraineurs', permanent: true },
    ];
  },
};

export default nextConfig;
