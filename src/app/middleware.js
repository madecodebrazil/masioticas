import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request) {
    const token = await getToken({ req: request });
    const { pathname } = request.nextUrl;

    // Rotas públicas que não precisam de autenticação
    const publicRoutes = ['/login', '/register', '/login_register'];

    // Verifica se a rota atual é pública
    const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

    // Se a rota é pública, permite o acesso
    if (isPublicRoute) {
        return NextResponse.next();
    }

    // Se não há token e a rota não é pública, redireciona para o login
    if (!token) {
        const url = new URL('/login', request.url);
        return NextResponse.redirect(url);
    }

    return NextResponse.next();
}

// Configuração das rotas que o middleware deve proteger
export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         */
        '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
    ],
}; 