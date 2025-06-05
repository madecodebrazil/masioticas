"use client";

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Layout from '@/components/Layout';
import ContasPagarModal from '@/components/ContasPagarModal';
import { motion } from 'framer-motion';
import { useState } from 'react';

export default function FinancesPage() {
    const { userData, loading, hasAccessToLoja } = useAuth();
    const [isContasPagarOpen, setIsContasPagarOpen] = useState(false);
    const router = useRouter();

    // Não precisamos mais do fetchUserData pois o hook useAuth já faz isso

    if (loading) {
        return (
            <div className="flex justify-center items-center py-10">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#81059e]"></div>
            </div>
        );
    }

    if (!userData) {
        return (
            <div className="flex justify-center items-center h-screen">
                <p>Usuário não encontrado.</p>
            </div>
        );
    }

    const productsItems = [
        {
            icon: '/images/financeiro/pagar.png',
            label: 'Contas a Pagar',
            route: '/finance/add-pay'
        },
        {
            icon: '/images/financeiro/receber.png',
            label: 'Contas a Receber',
            route: '/finance/add-receive'
        },
        {
            icon: '/images/financeiro/controle.png',
            label: 'Controle de Caixa',
            route: '/finance/cashier_day'
        },
        {
            icon: '/images/financeiro/fluxo.png',
            label: 'Fluxo de caixa',
            route: '/finance/cashflow'
        },
        {
            icon: '/images/financeiro/cartoes.png',
            label: 'Cartões',
            route: '/finance/cards/display-cards'
        },
        {
            icon: '/images/financeiro/cheques.png',
            label: 'Cheques',
            route: '/finance/cards/display-cards'
        },
        {
            icon: '/images/financeiro/vendas.png',
            label: 'Vendas',
            route: '/sales'
        },
    ];

    return (
        <Layout>
            <div>
                <div>
                    <main>
                        <div className="w-full">
                            <div className="grid items-center grid-cols-2 gap-8 sm:grid-cols-3 md:grid-cols-2">
                                <h1 className='text-4xl ml-0 md:ml-4 font-bold text-[#9a5fc7] text-center md:text-left'>Financeiro</h1>
                                {productsItems.map((item, index) => (
                                    <div
                                        key={index}
                                        onClick={() => item.action ? item.action() : router.push(item.route)}
                                        className="cursor-pointer"
                                    >
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
                                                    width={150}
                                                    height={150}
                                                    className="object-contain mr-2"
                                                />
                                                <span className="font-semibold text-sm sm:text-base lg:text-lg flex-grow text-left">
                                                    {item.label}
                                                </span>
                                            </div>
                                        </motion.div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </main>
                </div>
                <ContasPagarModal
                    isOpen={isContasPagarOpen}
                    onClose={() => setIsContasPagarOpen(false)}
                />
            </div>
        </Layout>
    );
}