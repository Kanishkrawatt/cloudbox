/** @type {import('next').NextConfig} */

const nextConfig = {
  reactStrictMode: false,
  compiler: { styledComponents: true },
  images: {
    // Thumbnails come straight from Cloudinary's CDN at the requested width;
    // see utils/cloudinaryLoader.ts.
    loader: "custom",
    loaderFile: "./utils/cloudinaryLoader.ts",
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
