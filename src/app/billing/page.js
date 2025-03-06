"use client";

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { motion } from 'framer-motion';
import Layout from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';
import { firestore } from '@/lib/firebaseConfig';

export default function BillingPage() {
    const { user, userData, loading } = useAuth();
    const [totalAgreements, setTotalAgreements] = useState(0);
    const router = useRouter();

    const fetchTotalAgreements = async () => {
        try {
            const agreementsSnapshot = await getDocs(collection(firestore, 'loja1', 'agreements', 'acordos'));
            // Filtra e conta todos os documentos que não sejam o documento 'counters'
            const validAgreements = agreementsSnapshot.docs.filter(doc => doc.id !== 'counters');
            setTotalAgreements(validAgreements.length);
        } catch (error) {
            console.error("Erro ao buscar os acordos:", error);
        }
    };

    useEffect(() => {
        if (user) {
            fetchTotalAgreements();
        }
    }, [user]);

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

    const billingItems = [
        { icon: '/images/cobranca/Agreement.png', label: 'Novo Acordo', route: '/billing/create-agreement' },
        { icon: '/images/cobranca/Sign.Document.png', label: 'Listar Acordos', route: '/billing/list_agreements' },
    ];

    return (
        <Layout>
            <div className="w-full">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white rounded-md shadow p-4">
                        <h3 className="font-bold text-gray-700 mb-2">Acordos</h3>
                        <ul className="text-sm">
                            <li><span className="text-black">Total de Acordos: {totalAgreements}</span></li>
                        </ul>
                    </div>
                </div>

                <div className="grid items-center grid-cols-1 gap-8 sm:grid-cols-3 md:grid-cols-1 lg:grid-cols-5 xl:grid-cols-2 mb-20 md:mb-0">
                    <h1 className='text-4xl ml-0 md:ml-4 font-bold text-[#9a5fc7] text-center md:text-left'>Cobrança</h1>
                    {billingItems.map((item, index) => (
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