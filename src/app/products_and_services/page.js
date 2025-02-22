"use client";

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { auth, firestore } from '../../lib/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { getDocs, collection } from 'firebase/firestore';

import Layout from '@/components/Layout'; // Importando o Layout criado
import { motion } from 'framer-motion';

export default function ProductsPage() {
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true); // Estado de carregamento
    const router = useRouter();
    const [totalArmacoes, setTotalArmacoes] = useState(0);
    const [totalLentes, setTotalLentes] = useState(0);
    const [totalOculosDeSol, setTotalOculosDeSol] = useState(0);

    // Função para buscar os dados do usuário logado no Firestore
    const fetchUserData = async (uid) => {
            try {
                // Novo caminho para o documento
                const docRef = doc(firestore, `lojas/loja1/users/${uid}/dados/perfil`);
                const docSnap = await getDoc(docRef);
                
                if (docSnap.exists()) {
                    setUserData(docSnap.data());
                } else {
                    console.log('Nenhum documento encontrado para o UID:', uid);
                    // Criar dados iniciais
                    await setDoc(docRef, {
                        nome: "Usuário Padrão",
                        email: auth.currentUser.email,
                        imageUrl: "/images/default-avatar.png",
                        cargo: "colaborador",
                        createdAt: new Date()
                    });
                    
                    // Buscar dados novamente
                    const newDocSnap = await getDoc(docRef);
                    setUserData(newDocSnap.data());
                }
            } catch (error) {
                console.error("Erro ao buscar os dados do usuário:", error);
            } finally {
                setLoading(false);
            }
        };

    const fetchProductTotals = async () => {
        try {
            // Buscar o total de armações da loja 1 e loja 2
            const loja1ArmacoesSnapshot = await getDocs(collection(firestore, 'loja1_armacoes'));
            const loja2ArmacoesSnapshot = await getDocs(collection(firestore, 'loja2_armacoes'));
            setTotalArmacoes(loja1ArmacoesSnapshot.size + loja2ArmacoesSnapshot.size);

            // Buscar o total de lentes da loja 1 e loja 2
            const loja1LentesSnapshot = await getDocs(collection(firestore, 'loja1_lentes'));
            const loja2LentesSnapshot = await getDocs(collection(firestore, 'loja2_lentes'));
            setTotalLentes(loja1LentesSnapshot.size + loja2LentesSnapshot.size);

            // Buscar o total de óculos de sol da loja 1 e loja 2
            const loja1OculosDeSolSnapshot = await getDocs(collection(firestore, 'loja1_solares'));
            const loja2OculosDeSolSnapshot = await getDocs(collection(firestore, 'loja2_solares'));
            setTotalOculosDeSol(loja1OculosDeSolSnapshot.size + loja2OculosDeSolSnapshot.size);
        } catch (error) {
            console.error("Erro ao buscar os dados dos produtos:", error);
        }
    };

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (user) {
                fetchUserData(user.uid);
                fetchProductTotals();  // Buscar os totais de produtos de loja1 e loja2
            } else {
                router.push('/login');
            }
        });

        return () => unsubscribe();
    }, [router]);

    // Verifique o carregamento
    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <p>Carregando...</p>
            </div>
        );
    }

    // Se os dados do usuário não forem encontrados
    if (!userData) {
        return (
            <div className="flex justify-center items-center h-screen">
                <p>Usuário não encontrado.</p>
            </div>
        );
    }

    // Definindo a URL da foto do usuário. Se não houver imagem, será usado um avatar padrão.
    // const userPhotoURL = userData?.imageUrl || '/images/default-avatar.png';

    // Defina os ícones e rótulos dos products_and_services
    const productsItems = [
        { icon: '/images/products_and_services/Armacoes.png', label: 'Armação', route: '/products_and_services/frames' },
        { icon: '/images/products_and_services/lentes.png', label: 'Lente', route: '/products_and_services/lenses' },
        { icon: '/images/products_and_services/solares.png', label: 'Solares', route: '/products_and_services/solar/list-solares' },
        { icon: '/images/products_and_services/garantia.png', label: 'Garantia', route: '/products_and_services/warranty' },
        { icon: '/images/products_and_services/Brindes.png', label: 'Brinde', route: '/products_and_services/giftes' },
        { icon: '/images/products_and_services/OS.png', label: 'OS', route: '/products_and_services/OS' },
        { icon: '/images/products_and_services/reparo.png', label: 'Reparo', route: '/products_and_services/repair/list-repairs' },
        { icon: '/images/products_and_services/malote.png', label: 'Malotes', route: '/products_and_services/pouch/list-pouches' },
        { icon: '/images/products_and_services/pedido.png', label: 'Pedidos', route: '/products_and_services/orders' },
        { icon: '/images/products_and_services/distribuidor.png', label: 'Distribuidor', route: '/products_and_services/distribuidor' },
        { icon: '/images/products_and_services/prestador.png', label: 'Prestador', route: '/products_and_services/service_provider' },
        { icon: '/images/products_and_services/laboratorio.png', label: 'Laboratório', route: '/products_and_services/laboratory' },
        { icon: '/images/products_and_services/industria.png', label: 'Indústria', route: '/products_and_services/industry' },
    ];

    return (
        <Layout>
            {/* Container para a foto do usuário - visível apenas em telas grandes */}
             {/* <div className="absolute top-2 right-8 z-30 hidden lg:block">
                               <Image
                                   src={userPhotoURL}
                                   alt="User Avatar"
                                   width={60}
                                   height={60}
                                   className="rounded-full object-cover border-4 border-purple-200 shadow-md bg-white"
                               />
                           </div> */}

            <div className="w-full">

                {/* Cards de Produtos com imagem de fundo opaca e animações */}
                <div className="grid items-center grid-cols-1 gap-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-2">
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
                                        backgroundImage: `url('/images/fundo.png')`, // Substitua pelo caminho correto da imagem
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
                                        className="object-contain mr-2" // Adiciona margem à direita do ícone
                                    />
                                    <span className="text-white font-bold text-lg flex-grow text-left">
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
