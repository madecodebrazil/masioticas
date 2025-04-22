"use client";

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { motion } from 'framer-motion';
import Layout from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';
import { firestore } from '@/lib/firebaseConfig';

export default function CobrancasPage() {
    const { user, userData, userPermissions, loading } = useAuth();
    const [totalCasos, setTotalCasos] = useState({
        emAberto: 0,
        advogado: 0,
        judicial: 0,
        total: 0
    });
    const [loadingStats, setLoadingStats] = useState(true);
    const router = useRouter();

    const fetchCobrancasStats = async () => {
        try {
            setLoadingStats(true);
            let emAberto = 0;
            let advogado = 0;
            let judicial = 0;
            let total = 0;

            // Determinar quais lojas o usuário tem acesso
            const lojas = userPermissions?.lojas || [];

            // Buscar estatísticas para cada loja que o usuário tem acesso
            for (const loja of lojas) {
                // Buscar todos os casos de cobrança
                const casosRef = collection(firestore, `lojas/${loja}/cobrancas/casos`);
                const casosSnapshot = await getDocs(casosRef);
                
                // Filtrar por status
                const emAbertoSnapshot = await getDocs(query(casosRef, where('status', '==', 'Em aberto')));
                const advogadoSnapshot = await getDocs(query(casosRef, where('status', '==', 'Advogado')));
                const judicialSnapshot = await getDocs(query(casosRef, where('status', '==', 'Judicial')));
                
                // Contar resultados
                emAberto += emAbertoSnapshot.size;
                advogado += advogadoSnapshot.size;
                judicial += judicialSnapshot.size;
                total += casosSnapshot.size;
            }

            setTotalCasos({
                emAberto,
                advogado,
                judicial,
                total
            });
        } catch (error) {
            console.error("Erro ao buscar estatísticas de cobrança:", error);
        } finally {
            setLoadingStats(false);
        }
    };

    useEffect(() => {
        if (user && userPermissions) {
            fetchCobrancasStats();
        }
    }, [user, userPermissions]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#81059e]"></div>
            </div>
        );
    }

    if (!user || !userData) {
        router.push('/login');
        return null;
    }

    const menuItems = [
        { 
            icon: '/images/cobranca/Agreement.png', 
            label: 'Novo Caso', 
            route: '/billing/create-agreement',
            description: 'Registrar um novo caso de cobrança'
        },
        { 
            icon: '/images/cobranca/Sign.Document.png', 
            label: 'Listar Casos', 
            route: '/billing/list_agreements',
            description: 'Visualizar e gerenciar todos os casos de cobrança'
        },
        { 
            icon: '/images/cobranca/Calendar.png', 
            label: 'Acompanhamento', 
            route: '/billing/track_agreements',
            description: 'Calendário de ações e prazos para cobrança'
        },
    ];

    return (
        <Layout>
            <div className="w-full max-w-6xl mx-auto px-4">
                <h1 className='text-4xl ml-0 md:ml-4 font-bold text-[#9a5fc7] text-center md:text-left mb-10'>Setor de Cobranças</h1>
                
                {/* Cards de estatísticas */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                    {/* Card Total de Casos */}
                    <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-[#9a5fc7]">
                        <h3 className="text-lg font-semibold text-gray-700">Total de Casos</h3>
                        <p className="text-3xl font-bold text-[#9a5fc7] mt-2">
                            {loadingStats ? (
                                <span className="animate-pulse">...</span>
                            ) : (
                                totalCasos.total
                            )}
                        </p>
                    </div>
                    
                    {/* Card Casos em Aberto */}
                    <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-500">
                        <h3 className="text-lg font-semibold text-gray-700">Em Aberto</h3>
                        <p className="text-3xl font-bold text-yellow-500 mt-2">
                            {loadingStats ? (
                                <span className="animate-pulse">...</span>
                            ) : (
                                totalCasos.emAberto
                            )}
                        </p>
                    </div>
                    
                    {/* Card Casos com Advogado */}
                    <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-orange-500">
                        <h3 className="text-lg font-semibold text-gray-700">Com Advogado</h3>
                        <p className="text-3xl font-bold text-orange-500 mt-2">
                            {loadingStats ? (
                                <span className="animate-pulse">...</span>
                            ) : (
                                totalCasos.advogado
                            )}
                        </p>
                    </div>
                    
                    {/* Card Casos Judiciais */}
                    <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-500">
                        <h3 className="text-lg font-semibold text-gray-700">Judiciais</h3>
                        <p className="text-3xl font-bold text-red-500 mt-2">
                            {loadingStats ? (
                                <span className="animate-pulse">...</span>
                            ) : (
                                totalCasos.judicial
                            )}
                        </p>
                    </div>
                </div>
                
                {/* Menu de Navegação */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {menuItems.map((item, index) => (
                        <Link key={index} href={item.route}>
                            <motion.div
                                className="relative flex flex-col justify-center items-center text-white h-[180px] rounded-lg transition-transform transform hover:scale-105 hover:shadow-2xl hover:brightness-110 cursor-pointer px-6 overflow-hidden"
                                style={{
                                    background: 'linear-gradient(to right, #9a5fc7, #81059e)',
                                    boxShadow: '0px 10px 20px rgba(0, 0, 0, 0.2)',
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
                                <div className="relative z-10 flex flex-col justify-center items-center text-center h-full">
                                    <Image
                                        src={item.icon}
                                        alt={item.label}
                                        width={50}
                                        height={50}
                                        className="object-contain mb-4"
                                    />
                                    <h3 className="font-bold text-xl mb-2">{item.label}</h3>
                                    <p className="text-sm opacity-80">{item.description}</p>
                                </div>
                            </motion.div>
                        </Link>
                    ))}
                </div>
            </div>
        </Layout>
    );
}