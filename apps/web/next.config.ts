import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Workspace packages ship TypeScript source.
  transpilePackages: [
    '@mycoach/api',
    '@mycoach/api-client',
    '@mycoach/core',
    '@mycoach/db',
    '@mycoach/i18n',
    '@mycoach/jobs',
  ],
  serverExternalPackages: ['pino'],
}

export default nextConfig
