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
        // Verificar se securityConfig e securityHeaders existem antes de usar Object.entries
        if (!securityConfig || !securityConfig.securityHeaders) {
            console.warn('Aviso: securityConfig ou securityHeaders está indefinido.');
            return [
                {
                    source: '/:path*',
                    headers: [
                        {
                            key: 'X-Frame-Options',
                            value: 'DENY',
                        },
                        {
                            key: 'X-Content-Type-Options',
                            value: 'nosniff',
                        }
                    ],
                },
            ];
        }
        
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