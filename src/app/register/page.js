"use client";

import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import React from 'react';
import { motion } from 'framer-motion';
import MobileNavSidebar from '@/components/MB_NavSidebar';
import BottomMobileNav from '@/components/MB_BottomNav';
import { useAuth } from '@/hooks/useAuth';

export default function ProductsPage() {
    const { user, userData, loading } = useAuth();
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

    const userPhotoURL = userData?.imageUrl || '/default-avatar.png';

    const stockItems = [
        { icon: '/images/pessoa.png', label: 'Clientes', route: '/register/consumers/add.client' },
        { icon: '/images/colaborador.png', label: 'Colaborador', route: '/login_register' },
        { icon: '/images/estoque/Supplier.png', label: 'Fornecedores', route: '/stock/suppliers/add-supplier' },
        { icon: '/images/produtos.png', label: 'Produtos', route: '/products_and_services' },
    ];

    const consultationItems = [
        { icon: '/images/cadastro/Heart.Monitor.png', label: 'Pacientes', route: '/consultation/medical-consultation' },
        { icon: '/images/cadastro/Ophthalmology.png', label: 'Oftalmologista', route: '/consultation/ophthalmologist' },
        { icon: '/images/cadastro/Glasses.png', label: 'Optometrista', route: '/consultation/optometrist' },
    ];

    const financeItems = [
        { icon: '/images/financeiro/pagar.png', label: 'Pagar', route: '/finance/add-pay' },
        { icon: '/images/financeiro/receber.png', label: 'Receber', route: '/finance/add-receive/list-receives' },
        { icon: '/images/financeiro/caixa.png', label: 'Caixa', route: '/finance/cashier_day' },
        { icon: '/images/financeiro/vendas.png', label: 'Vendas', route: '/commercial/sales' },
        { icon: '/images/financeiro/cartoes.png', label: 'Cartões', route: '/finance/cards' },
        { icon: '/images/estoque/graph.png', label: 'Fluxo de caixa', route: '/finance/cashflow' },
    ];

    const renderSection = (title, items) => (
        <div className="w-full border-2 border-[#81059e] rounded-xl p-4">
            <h2 className="text-2xl font-bold text-[#81059e] mb-4 text-center">{title}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {items.map((item, index) => (
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
                            <Image
                                src={item.icon}
                                alt={item.label}
                                width={50}
                                height={50}
                                className="object-contain mr-2"
                            />
                            <span className="text-white font-bold text-lg flex-grow text-left">
                                {item.label}
                            </span>
                        </motion.div>
                    </Link>
                ))}
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-[#81059e] overflow-hidden">
            <div className="flex flex-col lg:flex-row h-full">
                <div className="hidden lg:block w-64 z-10">
                    <Sidebar />
                </div>

                <MobileNavSidebar
                    userPhotoURL={userPhotoURL}
                    userData={userData}
                    handleLogout={() => router.push("/login")}
                />

                <div className="absolute top-2 right-8 z-30 hidden lg:block">
                    <Image
                        src={userPhotoURL}
                        alt="User Avatar"
                        width={60}
                        height={60}
                        className="rounded-full object-cover border-4 border-purple-200 shadow-md bg-white"
                    />
                </div>

                <main className="bg-white rounded-[25px] p-12 w-full max-w-5xl mx-auto relative z-20 m-10 ml-0 md:ml-14 mt-20 overflow-auto custom-scroll">
                    <div className="w-full max-w-4xl flex flex-col items-center justify-center space-y-12">
                        {renderSection('Estoque', stockItems)}
                        {renderSection('Consulta', consultationItems)}
                        {renderSection('Finanças', financeItems)}
                    </div>
                </main>
            </div>

            <BottomMobileNav />
        </div>
    );
}