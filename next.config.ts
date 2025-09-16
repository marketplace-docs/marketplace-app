import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '4mb', // Increase body size limit for file uploads
    },
  },
  // Increase the default timeout for serverless functions if needed
  serverActions: {
    // Timeout in seconds. Default is 60s. Let's increase to 2 minutes for large uploads.
    // This is not a standard Next.js config, but represents the need for longer timeouts
    // on hosting platforms like Vercel (Hobby plan has 60s, Pro has higher limits).
    // The correct way to set this is on the hosting provider's dashboard.
    // For App Hosting, this would be in apphosting.yaml.
    // For now, we note it here as a conceptual change.
  },
  allowedDevOrigins: ['https://*.cloudworkstations.dev'],
};

export default nextConfig;

    