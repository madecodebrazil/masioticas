"use client";

import Link from 'next/link'; // Importando Link do Next.js para navegação
import Sidebar from '../../components/Sidebar'; // Importando o MobileNavSidebar para navegação mobile
import Image from 'next/image'; // Importando Image para a foto de perfil do usuário
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { auth, firestore } from '../../lib/firebaseConfig'; // Importe a instância do Firebase e Firestore
import { doc, getDoc } from 'firebase/firestore';
import { motion } from 'framer-motion'; // Importando o motion para animações
import MobileNavSidebar from '../../components/MB_NavSidebar';
import BottomMobileNav from '../../components/MB_BottomNav';

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

    // Defina os ícones e rótulos dos items de estoque
    const stockItems = [
        { icon: '/images/pessoa.png', label: 'Clientes', route: '/register/consumers/add.client' },
        { icon: '/images/colaborador.png', label: 'Colaborador', route: '/login_register' },
        { icon: '/images/estoque/Supplier.png', label: 'Fornecedores', route: '/stock/suppliers/add-supplier' },
        { icon: '/images/produtos.png', label: 'Produtos', route: '/products_and_services' },
    ];

    // Defina os ícones e rótulos dos items de consulta
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

    return (
        <div className="relative min-h-screen bg-[#932A83]">
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
                    <div className="absolute top-4 right-4 z-30 hidden lg:block">
                        <Image
                            src={userPhotoURL}
                            alt="User Avatar"
                            width={80} // Largura da imagem
                            height={80} // Altura da imagem
                            className="rounded-full object-cover border-2 border-white shadow-md"
                        />
                    </div>
                <main className="bg-white rounded-[25px] p-4 lg:p-6 w-full max-w-6xl mx-auto flex items-center justify-center relative z-20 min-h-[400px] mt-8 mb-8">
                    {/* Container para a foto do usuário - visível apenas em telas grandes */}

                    <div className="w-full max-w-4xl flex flex-col items-center justify-center space-y-12">

                        {/* Estoque com contorno */}
                        <div className="w-full border-2 border-[#932A83] rounded-xl p-4">
                            <h2 className="text-2xl font-bold text-[#932A83] mb-4 text-center">Estoque</h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {stockItems.map((item, index) => (
                                    <Link key={index} href={item.route}>
                                        <motion.div
                                            className="relative flex items-center bg-gradient-to-r from-[#932A83] to-[#B7328C] text-white w-full h-[100px] rounded-xl transition-transform transform hover:scale-110 hover:shadow-2xl hover:brightness-110 cursor-pointer px-6 overflow-hidden"
                                            style={{
                                                boxShadow: '0px 10px 25px rgba(0, 0, 0, 0.5)',
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

                                            <Image
                                                src={item.icon}
                                                alt={item.label}
                                                width={50}
                                                height={50}
                                                className="object-contain mr-2" // Ícone à esquerda com margem à direita
                                            />
                                            <span className="text-white font-bold text-lg flex-grow text-left">
                                                {item.label}
                                            </span>
                                        </motion.div>
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {/* Consulta com contorno */}
                        <div className="w-full border-2 border-[#932A83] rounded-xl p-4">
                            <h2 className="text-2xl font-bold text-[#932A83] mb-4 text-center">Consulta</h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {consultationItems.map((item, index) => (
                                    <Link key={index} href={item.route}>
                                        <motion.div
                                            className="relative flex items-center bg-gradient-to-r from-[#932A83] to-[#B7328C] text-white w-full h-[100px] rounded-xl transition-transform transform hover:scale-110 hover:shadow-2xl hover:brightness-110 cursor-pointer px-6 overflow-hidden"
                                            style={{
                                                boxShadow: '0px 10px 25px rgba(0, 0, 0, 0.5)',
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

                                            <Image
                                                src={item.icon}
                                                alt={item.label}
                                                width={50}
                                                height={50}
                                                className="object-contain mr-2" // Ícone à esquerda com margem à direita
                                            />
                                            <span className="text-white font-bold text-lg flex-grow text-left">
                                                {item.label}
                                            </span>
                                        </motion.div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                        
                        {/* Finanças com contorno */}
                        <div className="w-full border-2 border-[#932A83] rounded-xl p-4">
                            <h2 className="text-2xl font-bold text-[#932A83] mb-4 text-center">Finanças</h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {financeItems.map((item, index) => (
                                    <Link key={index} href={item.route}>
                                        <motion.div
                                            className="relative flex items-center bg-gradient-to-r from-[#932A83] to-[#B7328C] text-white w-full h-[100px] rounded-xl transition-transform transform hover:scale-110 hover:shadow-2xl hover:brightness-110 cursor-pointer px-6 overflow-hidden"
                                            style={{
                                                boxShadow: '0px 10px 25px rgba(0, 0, 0, 0.5)',
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

                                            <Image
                                                src={item.icon}
                                                alt={item.label}
                                                width={50}
                                                height={50}
                                                className="object-contain mr-2" // Ícone à esquerda com margem à direita
                                            />
                                            <span className="text-white font-bold text-lg flex-grow text-left">
                                                {item.label}
                                            </span>
                                        </motion.div>
                                    </Link>
                                ))}
                            </div>
                        </div>


                        {<BottomMobileNav />} {/* Navegação mobile */}
                    </div>
                </main>
            </div>
        </div>
    );
}
