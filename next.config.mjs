/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  async redirects() {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL
      ? process.env.NEXT_PUBLIC_API_URL.replace('/api/v1', '')
      : 'https://crackbackend.onrender.com';
    return [
      {
        source: '/admin',
        destination: `${backendUrl}/admin/`,
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
