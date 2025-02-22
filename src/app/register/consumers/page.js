"use client";

import Link from 'next/link'; // Importando Link do Next.js para navegação
import Sidebar from '../../../components/Sidebar'; // Importando o MobileNavSidebar para navegação mobile
import Image from 'next/image'; // Importando Image para a foto de perfil do usuário
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { auth, firestore } from '../../../lib/firebaseConfig'; // Importe a instância do Firebase e Firestore
import { doc, getDoc } from 'firebase/firestore';
import { motion } from 'framer-motion'; // Importando o motion para animações
import MobileNavSidebar from '../../../components/MB_NavSidebar';
import BottomMobileNav from '../../../components/MB_BottomNav';


export default function ProductsPage() {
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true); // Estado de carregamento
    const router = useRouter();

    // Função para buscar os dados do usuário logado no Firestore
    const fetchUserData = async (uid) => {
        try {
            const docRef = doc(firestore, `loja1/users/${uid}/dados`);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                setUserData(docSnap.data());
            } else {
                console.log('Nenhum documento encontrado para o UID:', uid);
            }
        } catch (error) {
            console.error("Erro ao buscar os dados do usuário:", error);
        } finally {
            setLoading(false); // Conclui o carregamento
        }
    };

    useEffect(() => {
        // Verifica se o usuário está autenticado
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (user) {
                // Busca os dados do Firestore usando o UID do usuário logado
                fetchUserData(user.uid);
            } else {
                router.push('/login'); // Redireciona para a página de login se não estiver logado
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
                    <Sidebar /> {/* Instanciando o componente Sidebar em telas grandes */}
                </div>

                <MobileNavSidebar
                    userPhotoURL={userPhotoURL}
                    userData={userData}  // Certifique-se de passar o userData aqui
                    handleLogout={() => router.push("/login")}  // Função de logout que redireciona para a página de login
                /> {/* Instanciando o MobileNavSidebar em telas pequenas */}

                {/* Main Content */}
                <div className="absolute top-2 right-8 z-30 hidden lg:block">
                    <Image
                        src={userPhotoURL}
                        alt="User Avatar"
                        width={60} // Largura da imagem
                        height={60} // Altura da imagem
                        className="rounded-full object-cover border-4 border-purple-200 shadow-md bg-white"
                    />
                </div>
                <main className="bg-white rounded-[25px] p-4 lg:p-6 w-full max-w-5xl mx-auto relative z-20 m-10 ml-0 md:ml-14 mt-20">
                    {/* Container para a foto do usuário - visível apenas em telas grandes */}

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
                                                className="object-contain mr-4" // Adiciona margem à direita do ícone
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
