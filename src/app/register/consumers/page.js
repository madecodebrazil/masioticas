"use client";

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import React from 'react';
import { motion } from 'framer-motion';
import Layout from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';

export default function ClientsPage() {
    const { user, userData, loading, userPermissions } = useAuth();
    const router = useRouter();

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <p>Carregando...</p>
            </div>
        );
    }

    if (!user || !userData) {
        router.push('/login');
        return null;
    }

    const clientItems = [
        { icon: '/images/clientes/cad.client.png', label: 'Adicionar Cliente', route: '/register/consumers/add.client' },
        { icon: '/images/clientes/reg.client.png', label: 'Registro de Clientes', route: '/register/consumers/list-clients' },
    ];

    return (
        <Layout>
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
                <div className="grid items-center grid-cols-1 gap-8 sm:grid-cols-3 md:grid-cols-1 lg:grid-cols-5 xl:grid-cols-2 mb-20 md:mb-0">
                    <h1 className='text-4xl ml-0 md:ml-4 font-bold text-[#9a5fc7] text-center md:text-left'>Clientes</h1>
                    {clientItems.map((item, index) => (
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
                                <div
                                    className="absolute inset-0 opacity-10 pointer-events-none"
                                    style={{
                                        backgroundImage: 'url("/images/fundo.png")',
                                        backgroundSize: 'cover',
                                        backgroundRepeat: 'no-repeat',
                                        backgroundPosition: 'center',
                                    }}
                                />
                                <div className="relative z-10 flex flex-row justify-start items-center w-full h-full">
                                    <Image
                                        src={item.icon}
                                        alt={item.label}
                                        width={50}
                                        height={50}
                                        className="object-contain mr-2"
                                    />
                                    <span className="font-semibold text-sm sm:text-base lg:text-lg flex-grow text-left">
                                        {item.label}
                                    </span>
                                </div>
                            </motion.div>
                        </Link>
                    ))}
                </div>
            </div>
        </Layout>
    );
}