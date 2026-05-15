/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["@neondatabase/serverless", "@prisma/adapter-neon", "pg"],
};

export default nextConfig;
