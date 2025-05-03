const { securityConfig } = require('./src/lib/security');

/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        domains: ['firebasestorage.googleapis.com'],
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'firebasestorage.googleapis.com',
                port: '',
                pathname: '/**',
            },
        ],
    },
    reactStrictMode: true,
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
    // Configurações de CORS
    async cors(req, res) {
        res.setHeader('Access-Control-Allow-Credentials', securityConfig.corsOptions.credentials);
        res.setHeader('Access-Control-Allow-Origin', securityConfig.corsOptions.origin);
        res.setHeader('Access-Control-Allow-Methods', securityConfig.corsOptions.methods.join(','));
        res.setHeader('Access-Control-Allow-Headers', securityConfig.corsOptions.allowedHeaders.join(','));

        if (req.method === 'OPTIONS') {
            res.status(200).end();
            return;
        }
    },
}

module.exports = nextConfig 