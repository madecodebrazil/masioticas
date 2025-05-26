// components/Layout.js
"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import BackButton from '@/components/BackButton';
import { useNotifications } from '@/hooks/useNotifications';
import { usePathname, useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import MobileNavSidebar from '@/components/MB_NavSidebar';
import BottomMobileNav from '@/components/MB_BottomNav';
import NotificationsModal from '@/components/NotificationsModal';
import Image from 'next/image';
import Head from 'next/head';
import { BellIcon } from '@heroicons/react/24/outline';

const Layout = ({ children }) => {
    const { user, userData, loading, userPermissions, hasAccessToLoja } = useAuth();
    const { notifications, unreadCount, markAllAsRead } = useNotifications();
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!loading) {
            // Se não estiver logado e não estiver na página de login
            if (!user && !pathname.includes('/login')) {
                router.push('/login');
                return;
            }

            // Se estiver logado
            if (user && userPermissions) {
                // Verifica se é admin tentando acessar registro de usuários
                if (pathname.includes('/login_register') && !userPermissions.isAdmin) {
                    router.push('/acesso-negado');
                    return;
                }

                // Verifica acesso às lojas
                if (pathname.includes('/loja1') && !hasAccessToLoja('loja1')) {
                    router.push('/acesso-negado');
                    return;
                }

                if (pathname.includes('/loja2') && !hasAccessToLoja('loja2')) {
                    router.push('/acesso-negado');
                    return;
                }
            }
        }
    }, [loading, user, pathname, userPermissions, hasAccessToLoja, router]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#81059e]"></div>
            </div>
        );
    }

    return (
        <>
            <Head>
                <link rel="icon" type="image/x-icon" href="/favicon.ico" />
            </Head>
            <div className={`${'lg:fixed lg:inset-0 lg:bg-[#81059e] lg:overflow-hidden'
                } min-h-screen`}>
                <div className="flex flex-col lg:flex-row h-full">
                    <div className="hidden lg:block w-64 flex-shrink-0 z-10">
                        <Sidebar userPermissions={userPermissions} />
                    </div>

                    <div className="lg:hidden flex-shrink-0 bg-[#81059e]">
                        <MobileNavSidebar
                            userPhotoURL={userData?.imageUrl || '/images/default-avatar.png'}
                            userData={userData}
                            userPermissions={userPermissions}
                        />
                    </div>

                    <div className="absolute top-2 right-8 z-30 hidden lg:flex items-center gap-4">
                        <button
                            onClick={() => setIsNotificationsOpen(true)}
                            className="relative p-2 rounded-full hover:bg-purple-50 transition-colors"
                        >
                            <BellIcon className="h-10 w-10 text-white" />
                            {unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                    {unreadCount}
                                </span>
                            )}
                        </button>
                        <Image
                            src={userData?.imageUrl || '/images/default-avatar.png'}
                            alt="User Avatar"
                            width={60}
                            height={60}
                            className="rounded-full object-cover border-2 border-purple-400 shadow-md bg-white"
                        />
                    </div>

                    <div className="flex-1 relative">
                        <main className={`
                                lg:absolute lg:inset-0 lg:overflow-auto lg:bg-white lg:rounded-sm
                                lg:p-6 lg:m-10 lg:ml-14 lg:mt-20 overflow-y-auto custom-scroll
                                p-4 bg-white min-h-screen pb-10
                            `}>
                            <BackButton label="Voltar" size={36} />
                            {children}

                        </main>
                        <BottomMobileNav />
                    </div>
                </div>
            </div>

            <NotificationsModal
                isOpen={isNotificationsOpen}
                onClose={() => {
                    setIsNotificationsOpen(false);
                    markAllAsRead();
                }}
                notifications={notifications}
            />
        </>
    );
};

export default Layout;