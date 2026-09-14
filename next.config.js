/** @type {import('next').NextConfig} */

const nextConfig = {
  reactStrictMode: false,
  compiler: { styledComponents: true },
  images: {
    domains: [
      "flowbite.s3.amazonaws.com",
      "firebasestorage.googleapis.com",
      "lh3.googleusercontent.com",
      "res.cloudinary.com",
    ],
  },
  async redirects() {
    return [
      {
        source: '/smartshare/:id',
        destination: '/smartshow?id=:id',
        permanent: false,
      },
    ]
  },
};

module.exports = nextConfig;
