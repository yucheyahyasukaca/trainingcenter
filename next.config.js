/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
<<<<<<< HEAD
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
=======
  output: 'standalone',
>>>>>>> 7e58b714b740dc7ecbaa8344804c32ee93b9e847
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'supabase.garuda-21.com',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
}

module.exports = nextConfig

