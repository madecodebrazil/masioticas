"use client";

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { firestore } from '../../lib/firebaseConfig';
import { getDocs, collection } from 'firebase/firestore';

import Layout from '@/components/Layout';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';

export default function ProductsPage() {
    const { user, userData, loading, userPermissions } = useAuth();
    const router = useRouter();
    const [totalArmacoes, setTotalArmacoes] = useState(0);
    const [totalLentes, setTotalLentes] = useState(0);
    const [totalOculosDeSol, setTotalOculosDeSol] = useState(0);
    const [lojaAtual, setLojaAtual] = useState('loja1');
    
    const fetchProductTotals = async () => {
        try {
            if (userPermissions && userPermissions.lojas.length > 0) {
                if (userPermissions.isAdmin || userPermissions.acesso_total) {
                    // Para admins, buscar de todas as lojas às quais tem acesso
                    const armacoesCounts = await Promise.all(
                        userPermissions.lojas.map(async (loja) => {
                            const snapshot = await getDocs(collection(firestore, `${loja}_armacoes`));
                            return snapshot.size;
                        })
                    );

                    const lentesCounts = await Promise.all(
                        userPermissions.lojas.map(async (loja) => {
                            const snapshot = await getDocs(collection(firestore, `${loja}_lentes`));
                            return snapshot.size;
                        })
                    );

                    const solaresCounts = await Promise.all(
                        userPermissions.lojas.map(async (loja) => {
                            const snapshot = await getDocs(collection(firestore, `${loja}_solares`));
                            return snapshot.size;
                        })
                    );

                    setTotalArmacoes(armacoesCounts.reduce((sum, count) => sum + count, 0));
                    setTotalLentes(lentesCounts.reduce((sum, count) => sum + count, 0));
                    setTotalOculosDeSol(solaresCounts.reduce((sum, count) => sum + count, 0));
                } else {
                    // Para usuários normais, buscar apenas da loja especificada
                    const loja = userPermissions.lojas[0]; // Pega a primeira loja do usuário

                    const armacoesSnapshot = await getDocs(collection(firestore, `${loja}_armacoes`));
                    const lentesSnapshot = await getDocs(collection(firestore, `${loja}_lentes`));
                    const solaresSnapshot = await getDocs(collection(firestore, `${loja}_solares`));

                    setTotalArmacoes(armacoesSnapshot.size);
                    setTotalLentes(lentesSnapshot.size);
                    setTotalOculosDeSol(solaresSnapshot.size);
                }
            }
        } catch (error) {
            console.error("Erro ao buscar os dados dos produtos:", error);
        }
    };

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push('/login');
            } else {
                fetchProductTotals();
            }
        }
    }, [user, loading, router, userPermissions, lojaAtual]);

    // Função para alternar a loja atual (para admins)
    const alternarLoja = (loja) => {
        if (userPermissions && userPermissions.lojas.includes(loja)) {
            setLojaAtual(loja);
        }
    };

    // Verifique o carregamento
    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#81059e]"></div>
            </div>
        );
    }

    // Se o usuário não estiver autenticado
    if (!user || !userData) {
        return (
            <div className="flex justify-center items-center h-screen">
                <p>Usuário não encontrado ou não autenticado.</p>
            </div>
        );
    }

    // Defina os ícones e rótulos dos products_and_services
    const productsItems = [
        { icon: '/images/products_and_services/Armacoes.png', label: 'Armações', route: '/products_and_services/frames/add-frame' },
        { icon: '/images/products_and_services/lentes.png', label: 'Lentes', route: '/products_and_services/lenses/add-lense' },
        { icon: '/images/products_and_services/solares.png', label: 'Solares', route: '/products_and_services/solar/list-solares' },
        { icon: '/images/products_and_services/garantia.png', label: 'Garantia', route: '/products_and_services/warranty' },
        { icon: '/images/products_and_services/Brindes.png', label: 'Brindes', route: '/products_and_services/giftes' },
        { icon: '/images/products_and_services/pedido.png', label: 'Pedidos', route: '/products_and_services/OS/list-os' },
        { icon: '/images/products_and_services/reparo.png', label: 'Reparos', route: '/products_and_services/repair/list-repairs' },
        { icon: '/images/products_and_services/malote.png', label: 'Malotes', route: '/products_and_services/pouch/list-pouches' },
        { icon: '/images/products_and_services/distribuidor.png', label: 'Distribuidores', route: '/products_and_services/service_provider' },
        { icon: '/images/products_and_services/prestador.png', label: 'Prestadores', route: '/products_and_services/service_provider' },
        { icon: '/images/products_and_services/laboratorio.png', label: 'Laboratórios', route: '/products_and_services/laboratory' },
        { icon: '/images/products_and_services/industria.png', label: 'Indústrias', route: '/products_and_services/industry' },
    ];

    return (
        <Layout>
            <div className="w-full mb-28">
                <div className="grid items-center grid-cols-2 gap-8 sm:grid-cols-3 md:grid-cols-2">
                    <h1 className='text-4xl ml-0 md:ml-4 font-bold text-[#9a5fc7] text-center md:text-left'>Produtos</h1>
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