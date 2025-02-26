"use client";

import Link from 'next/link';
import Sidebar from '../../../components/Sidebar';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import MobileNavSidebar from '../../../components/MB_NavSidebar';
import BottomMobileNav from '../../../components/MB_BottomNav';
import { useAuth } from '@/hooks/useAuth'; // Importando o hook useAuth

export default function ProductsPage() {
    const { user, userData, loading, userPermissions } = useAuth(); // Usando o hook useAuth
    const router = useRouter();

    useEffect(() => {
        // Verifica se o usuário está autenticado
        if (!loading && !user) {
            router.push('/login'); // Redireciona para a página de login se não estiver logado
        }
    }, [user, loading, router]);

    // Verifique o carregamento
    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <p>Carregando...</p>
            </div>
        );
    }

    // Se os dados do usuário não forem encontrados
    if (!user || !userData) {
        return (
            <div className="flex justify-center items-center h-screen">
                <p>Usuário não encontrado ou não autenticado.</p>
            </div>
        );
    }

    // Definindo a URL da foto do usuário. Se não houver imagem, será usado um avatar padrão.
    const userPhotoURL = userData?.imageUrl || '/default-avatar.png';

    // Defina os ícones e rótulos dos products_and_services
    const productsItems = [
        { icon: '/images/clientes/cad.client.png', label: 'Adicionar Cliente', route: '/register/consumers/add.client' },
        { icon: '/images/clientes/reg.client.png', label: 'Registro de Clientes', route: '/register/consumers/list-clients' },
    ];

    return (
        <div className="relative min-h-screen bg-[#81059e]">
            <div className="flex flex-col lg:flex-row relative min-h-screen">
                {/* Sidebar para telas grandes */}
                <div className="hidden lg:block w-64 z-10">
                    <Sidebar />
                </div>

                <MobileNavSidebar
                    userPhotoURL={userPhotoURL}
                    userData={userData}
                    handleLogout={() => router.push("/login")}
                />

                {/* Main Content */}
                <div className="absolute top-2 right-8 z-30 hidden lg:block">
                    <Image
                        src={userPhotoURL}
                        alt="User Avatar"
                        width={60}
                        height={60}
                        className="rounded-full object-cover border-4 border-purple-200 shadow-md bg-white"
                    />
                </div>
                
                <main className="bg-white rounded-[25px] p-4 lg:p-6 w-full max-w-5xl mx-auto relative z-20 m-10 ml-0 md:ml-14 mt-20">
                    {/* Seletor de loja para admins */}
                    {userPermissions && (userPermissions.isAdmin || userPermissions.acesso_total) && userPermissions.lojas.length > 1 && (
                        <div className="mb-6 p-3 bg-purple-100 rounded-lg shadow">
                            <h3 className="text-purple-700 font-medium mb-2">Selecionar Loja:</h3>
                            <div className="flex flex-wrap gap-2">
                                {userPermissions.lojas.map((loja) => (
                                    <button
                                        key={loja}
                                        className="px-4 py-2 rounded-md transition-colors bg-purple-600 text-white hover:bg-purple-700"
                                    >
                                        {loja.charAt(0).toUpperCase() + loja.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="w-full">
                        {/* Cards de Produtos com imagem de fundo opaca e animações */}
                        <div className="grid items-center grid-cols-2 gap-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-2">
                            {productsItems.map((item, index) => (
                                <Link key={index} href={item.route}>
                                    <motion.div
                                        className="relative flex justify-center items-center text-white w-full h-[100px] sm:h-[90px] rounded-md transition-transform transform hover:scale-110 hover:shadow-2xl hover:brightness-110 cursor-pointer px-6 overflow-hidden"
                                        style={{
                                            background: 'linear-gradient(to right, #9a5fc7, #9a5fc7)',
                                            boxShadow: '0px 10px 20px rgba(0, 0, 0, 0.5)',
                                        }}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ duration: 0.5, delay: index * 0.1 }}
                                    >
                                        {/* Imagem de fundo sutil */}
                                        <div
                                            className="absolute inset-0 opacity-10 pointer-events-none"
                                            style={{
                                                backgroundImage: `url('/images/fundo.png')`,
                                                backgroundSize: 'cover',
                                                backgroundRepeat: 'no-repeat',
                                                backgroundPosition: 'center',
                                            }}
                                        ></div>

                                        <div className="relative z-10 flex flex-row justify-start items-center w-full h-full">
                                            <Image
                                                src={item.icon}
                                                alt={item.label}
                                                width={50}
                                                height={50}
                                                className="object-contain mr-4"
                                            />
                                            <span className="text-white font-bold text-lg text-left flex-grow">
                                                {item.label}
                                            </span>
                                        </div>
                                    </motion.div>
                                </Link>
                            ))}

                            {<BottomMobileNav />}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}