"use client";

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import React from 'react';
import { motion } from 'framer-motion';
import Layout from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';

export default function ProductsPage() {
    const { user, userData, loading } = useAuth();
    const router = useRouter();

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

    const allItems = [
        { icon: '/images/pessoa.png', label: 'Clientes', route: '/register/consumers/add.client' },
        { icon: '/images/colaborador.png', label: 'Colaborador', route: '/login_register' },
        { icon: '/images/estoque/Supplier.png', label: 'Fornecedores', route: 'register/suppliers/add-supplier' },
        { icon: '/images/produtos.png', label: 'Produtos', route: '/products_and_services' },
        { icon: '/images/cadastro/Heart.Monitor.png', label: 'Pacientes', route: '/consultation/medical-consultation' },
        { icon: '/images/cadastro/Ophthalmology.png', label: 'Oftalmologista', route: '/consultation/ophthalmologist' },
        { icon: '/images/cadastro/Glasses.png', label: 'Optometrista', route: '/consultation/optometrist' },
        { icon: '/images/financeiro/pagar.png', label: 'Contas a Pagar', route: '/finance/add-pay' },
        { icon: '/images/financeiro/receber.png', label: 'Contas a Receber', route: '/finance/add-receive/list-receives' },
        { icon: '/images/financeiro/caixa.png', label: 'Caixa', route: '/finance/cashier_day' },
        { icon: '/images/financeiro/vendas.png', label: 'Vendas', route: '/commercial/sales' },
        { icon: '/images/financeiro/cartoes.png', label: 'Cartões', route: '/finance/cards' },
        { icon: '/images/products_and_services/distribuidor.png', label: 'Distribuidores', route: '/products_and_services/service_provider' },
        { icon: '/images/products_and_services/prestador.png', label: 'Prestadores', route: '/products_and_services/service_provider' },
        { icon: '/images/products_and_services/laboratorio.png', label: 'Laboratórios', route: '/products_and_services/laboratory' },
        { icon: '/images/products_and_services/industria.png', label: 'Indústrias', route: '/products_and_services/industry' },
    ];

    return (
        <Layout>
            <div className="w-full mb-28">
                <div className="grid items-center grid-cols-2 gap-8 sm:grid-cols-3 md:grid-cols-2">
                    <h1 className='text-4xl ml-0 md:ml-4 font-bold text-[#9a5fc7] text-center md:text-left'>Cadastro</h1>
                    {allItems.map((item, index) => (
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