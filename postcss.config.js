/** @type {import('next').NextConfig} */
const nextConfig = {
  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },
};

export default nextConfig;