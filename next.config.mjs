/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      // Supabase Storage (add each hostname that appears in your image URLs)
      { protocol: 'https', hostname: 'jzhzmjqwqjbjndvbcuau.supabase.co', pathname: '/storage/v1/object/public/**' },
      { protocol: 'https', hostname: 'your-project.supabase.co', pathname: '/storage/v1/object/public/**' },
    ],
  },
};

export default nextConfig;

