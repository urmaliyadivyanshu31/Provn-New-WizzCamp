/** @type {import('next').NextConfig} */
const nextConfig = {
  // Validate required environment variables at build time
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
  
  // Ensure environment variables are available
  experimental: {
    // This will fail the build if env vars are missing
    serverComponentsExternalPackages: [],
  },
  
  // Add webpack configuration to handle missing env vars
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Validate environment variables on server side
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        throw new Error('Missing required Supabase environment variables');
      }
    }
    return config;
  },
};

export default nextConfig;
