// /src/lib/security.js
const crypto = require('crypto');

// Configurações de segurança
const securityConfig = {
    // Tempo de expiração do token em segundos (1 hora)
    tokenExpiration: 3600,

    // Configurações de CORS
    corsOptions: {
        origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true,
    },

    // Configurações de rate limiting
    rateLimit: {
        windowMs: 15 * 60 * 1000, // 15 minutos
        max: 100, // limite de 100 requisições por IP
    },

    // Headers de segurança para Next.js
    securityHeaders: {
        'X-DNS-Prefetch-Control': 'on',
        'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
        'X-XSS-Protection': '1; mode=block',
        'X-Frame-Options': 'DENY',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'origin-when-cross-origin',
        'Content-Security-Policy': [
            "default-src 'self';",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval';",
            "style-src 'self' 'unsafe-inline' fonts.googleapis.com;",
            "font-src 'self' fonts.gstatic.com data:;",
            "img-src 'self' data: blob: https: http: *;",  // Permite todas as fontes de imagens
            "connect-src 'self' https://identitytoolkit.googleapis.com https://firebasestorage.googleapis.com https://firestore.googleapis.com https://*.googleapis.com https://firebase.googleapis.com https://*.firebaseio.com https://viacep.com.br;",
            "frame-src 'self';"
        ].join(' ')
    }
};

// Função para validar senha
const validatePassword = (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return {
        isValid: password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar,
        requirements: {
            minLength,
            hasUpperCase,
            hasLowerCase,
            hasNumbers,
            hasSpecialChar,
        },
    };
};

// Função para sanitizar inputs
const sanitizeInput = (input) => {
    if (typeof input !== 'string') return input;

    // Remove tags HTML
    const sanitized = input.replace(/<[^>]*>/g, '');

    // Escapa caracteres especiais
    return sanitized
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
};

// Função para gerar token CSRF
const generateCsrfToken = () => {
    return crypto.randomBytes(32).toString('hex');
};

module.exports = {
    securityConfig,
    validatePassword,
    sanitizeInput,
    generateCsrfToken
};