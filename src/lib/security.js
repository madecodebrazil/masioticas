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
        'X-Frame-Options': 'SAMEORIGIN', // Mudado de DENY para SAMEORIGIN
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'origin-when-cross-origin',
        'Content-Security-Policy': [
            "default-src 'self';",
            // Scripts - permite Firebase e Next.js
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://www.gstatic.com https://www.google.com https://firebaseapp.com https://*.firebaseapp.com;",
            // Estilos - permite Google Fonts e CSS inline
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://www.gstatic.com;",
            // Fontes - permite Google Fonts
            "font-src 'self' https://fonts.gstatic.com https://fonts.googleapis.com data:;",
            // Imagens - permite todas as fontes necessárias
            "img-src 'self' data: blob: https: http: *;",
            // Conexões - inclui todos os domínios Firebase e APIs necessárias
            "connect-src 'self' " +
            "https://identitytoolkit.googleapis.com " +
            "https://firebasestorage.googleapis.com " +
            "https://firestore.googleapis.com " +
            "https://firebase.googleapis.com " +
            "https://www.googleapis.com " +
            "https://securetoken.googleapis.com " +
            "https://apis.google.com " +
            "https://*.firebaseio.com " +
            "https://*.cloudfunctions.net " +
            "https://*.firebaseapp.com " +
            "https://viacep.com.br " +
            "wss://*.firebaseio.com " +
            "blob: data:;",
            // Frames - permite Firebase Auth
            "frame-src 'self' https://firebase.google.com https://www.google.com https://apis.google.com https://*.firebaseapp.com;",
            // Workers - para PWA e service workers
            "worker-src 'self' blob:;",
            // Objetos - para uploads e downloads
            "object-src 'none';",
            // Base URI
            "base-uri 'self';",
            // Formulários
            "form-action 'self';"
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

// CSP para desenvolvimento (menos restritiva)
const developmentCSP = [
    "default-src 'self';",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' *;",
    "style-src 'self' 'unsafe-inline' *;",
    "font-src 'self' data: *;",
    "img-src 'self' data: blob: *;",
    "connect-src 'self' *;",
    "frame-src 'self' *;",
    "worker-src 'self' blob: *;",
    "object-src 'none';"
].join(' ');

// Use a CSP de desenvolvimento se estiver em modo de desenvolvimento
if (process.env.NODE_ENV === 'development') {
    securityConfig.securityHeaders['Content-Security-Policy'] = developmentCSP;
}

module.exports = {
    securityConfig,
    validatePassword,
    sanitizeInput,
    generateCsrfToken
};