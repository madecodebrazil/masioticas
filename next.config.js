const { securityConfig } = require('./src/lib/security');

/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    reactStrictMode: true,
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'firebasestorage.googleapis.com',
                port: '',
                pathname: '/v0/b/**',
            },
        ],
    },
    async headers() {
        return [
            {
                source: '/:path*',
                headers: Object.entries(securityConfig.securityHeaders).map(([key, value]) => ({
                    key,
                    value,
                })),
            },
        ];
    },
    async rewrites() {
        return [
            {
                source: '/api/:path*',
                destination: '/api/:path*',
            },
        ];
    },
};

module.exports = nextConfig;