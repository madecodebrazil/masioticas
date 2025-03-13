"use client";
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { auth, firestore } from '../../lib/firebaseConfig';
import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { motion } from 'framer-motion';
import SidebarHomepage from '../../components/SidebarHomepage';
import Dashboard from '@/components/Dashboard';
import CarrouselPromo from '../../components/CarrouselPromo';
import MobileHeader from '@/components/MB_NavSidebar';
import BottomMobileNav from '../../components/MB_BottomNav';

export default function Home() {
    const { user, userData, loading: authLoading, userPermissions } = useAuth();
    const [loadingOS, setLoadingOS] = useState(true);
    const [loadingVendas, setLoadingVendas] = useState(true);

    const [osPendentes, setOsPendentes] = useState(0);
    const [osConcluidas, setOsConcluidas] = useState(0);
    const [osAtrasadas, setOsAtrasadas] = useState(0);
    const [salesToday, setSalesToday] = useState(0);
    const [salesThisWeek, setSalesThisWeek] = useState(0);
    const [salesThisMonth, setSalesThisMonth] = useState(0);
    const [consultationsToday, setConsultationsToday] = useState(0);
    const [consultationsThisMonth, setConsultationsThisMonth] = useState(0);


    const router = useRouter();

    // Lógica para contagem das OS
    const statusPendente = [
        "processamentoInicial",
        "encaminhadoLaboratorio",
        "montagemProgresso"
    ];

    const statusConcluida = "entregueCliente";
    const statusAtrasada = ["prontoEntrega", "montagemProgresso"];

    const verificarSeAtrasada = (dataMontagemFinal) => {
        const hoje = new Date();
        const dataFinal = new Date(dataMontagemFinal);
        return dataFinal < hoje; // Retorna true se a OS estiver atrasada
    };

    const contarOsPorStatus = useCallback(async (loja) => {
        try {
            const osCollection = collection(firestore, `${loja}/services/os`);

            // Contar as OS Pendentes
            const pendentesQuery = query(osCollection, where("status", "in", statusPendente));
            const pendentesSnapshot = await getDocs(pendentesQuery);
            const pendentesCount = pendentesSnapshot.size;

            // Contar as OS Concluídas
            const concluidasQuery = query(osCollection, where("status", "==", statusConcluida));
            const concluidasSnapshot = await getDocs(concluidasQuery);
            const concluidasCount = concluidasSnapshot.size;

            // Contar as OS Atrasadas
            const atrasadasQuery = query(osCollection, where("status", "in", statusAtrasada));
            const atrasadasSnapshot = await getDocs(atrasadasQuery);

            // Verificar se as OS estão atrasadas baseado na dataMontagemFinal
            let atrasadasCount = 0;
            atrasadasSnapshot.forEach((doc) => {
                const osData = doc.data();
                if (verificarSeAtrasada(osData.dataMontagemFinal)) {
                    atrasadasCount++;
                }
            });

            return { pendentesCount, concluidasCount, atrasadasCount };
        } catch (error) {
            console.error("Erro ao contar OS:", error);
            return { pendentesCount: 0, concluidasCount: 0, atrasadasCount: 0 };
        }
    }, []);

    const contarVendas = useCallback(async (vendasCollection, uid, inicio, fim) => {
        try {
            const vendasQuery = query(
                vendasCollection,
                where("userId", "==", uid),
                where("data", ">=", inicio),
                where("data", "<=", fim)
            );
            const vendasSnapshot = await getDocs(vendasQuery);
            return vendasSnapshot.size;
        } catch (error) {
            console.error("Erro ao contar vendas:", error);
            return 0;
        }
    }, []);

    // Função para contar vendas do usuário por dia, semana e mês
    const contarVendasDoUsuario = useCallback(async (uid) => {
        if (!uid) return;
        try {
            const vendasCollection = collection(firestore, 'vendas');
            const hoje = new Date();
            const primeiroDiaDaSemana = new Date(hoje);
            primeiroDiaDaSemana.setDate(hoje.getDate() - hoje.getDay());
            const primeiroDiaDoMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

            // Vendas do dia
            const inicioDia = new Date(hoje);
            inicioDia.setHours(0, 0, 0, 0);
            const fimDia = new Date(hoje);
            fimDia.setHours(23, 59, 59, 999);
            const vendasHoje = await contarVendas(vendasCollection, uid, inicioDia, fimDia);
            setSalesToday(vendasHoje);

            // Vendas da semana
            const vendasSemana = await contarVendas(vendasCollection, uid, primeiroDiaDaSemana, hoje);
            setSalesThisWeek(vendasSemana);

            // Vendas do mês
            const vendasMes = await contarVendas(vendasCollection, uid, primeiroDiaDoMes, hoje);
            setSalesThisMonth(vendasMes);
        } catch (error) {
            console.error("Erro ao contar as vendas do usuário:", error);
        } finally {
            setLoadingVendas(false);
        }
    }, [contarVendas]);

    // Função para contar consultas
    const contarConsultas = useCallback(async () => {
        try {
            const consultationsCollection = collection(firestore, 'consultations');
            const hoje = new Date();
            const primeiroDiaDoMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

            // Consultas do dia
            const inicioDia = new Date(hoje);
            inicioDia.setHours(0, 0, 0, 0);
            const fimDia = new Date(hoje);
            fimDia.setHours(23, 59, 59, 999);

            const consultasDiaQuery = query(
                consultationsCollection,
                where("data", "==", inicioDia.toISOString().split('T')[0])
            );
            const consultasDiaSnapshot = await getDocs(consultasDiaQuery);
            setConsultationsToday(consultasDiaSnapshot.size);

            // Consultas do mês
            const consultasMesQuery = query(
                consultationsCollection,
                where("data", ">=", primeiroDiaDoMes.toISOString().split('T')[0])
            );
            const consultasMesSnapshot = await getDocs(consultasMesQuery);
            setConsultationsThisMonth(consultasMesSnapshot.size);
        } catch (error) {
            console.error("Erro ao contar consultas:", error);
        }
    }, []);

    // Função para contar OS
    const contarOS = useCallback(async () => {
        setLoadingOS(true);
        try {
            // Contar OS de loja1
            const loja1 = await contarOsPorStatus("loja1");
            // Contar OS de loja2
            const loja2 = await contarOsPorStatus("loja2");

            // Somar os resultados de ambas as lojas
            setOsPendentes(loja1.pendentesCount + loja2.pendentesCount);
            setOsConcluidas(loja1.concluidasCount + loja2.concluidasCount);
            setOsAtrasadas(loja1.atrasadasCount + loja2.atrasadasCount);
        } catch (error) {
            console.error("Erro ao contar as OS:", error);
        } finally {
            setLoadingOS(false);
        }
    }, [contarOsPorStatus]);

    useEffect(() => {
        contarOS();
        contarConsultas(); // Adicionando chamada para contar consultas
    }, [contarOS, contarConsultas]);

    useEffect(() => {
        if (user) {
            contarOS();
            contarConsultas();
            contarVendasDoUsuario(user.uid);
        }
    }, [user, contarOS, contarConsultas, contarVendasDoUsuario]);

    const items = [
        { label: <>Financeiro</>, img: '/images/homepage/Coins.png', href: '/finance' },
        { label: <>Vendas</>, img: '/images/homepage/Product.png', href: '/commercial/sales' },
        { label: <>Estoque</>, img: '/images/homepage/Boxes.png', href: '/stock' },
        { label: <>Serviços</>, img: '/images/homepage/Product.png', href: '/products_and_services' },
        { label: <>Cadastros</>, img: '/images/homepage/Task.png', href: '/register' },
        { label: <>Consultas</>, img: '/images/homepage/Stethoscope.png', href: '/consultation' },
        { label: <>Clientes</>, img: '/images/homepage/User.png', href: 'register/consumers' },
        { label: <>Comercial</>, img: '/images/homepage/Shopping.png', href: '/commercial' },
        { label: <>Cobranças</>, img: '/images/homepage/Receipt_Dollar.png', href: '/billing' },

    ];

    const userPhotoURL = userData?.imageUrl || '/images/default-avatar.png';


    if (authLoading) {
        return (
            <div className="flex justify-center items-center w-full h-screen">
                <p>Carregando...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col md:flex-row min-h-screen bg-gradient-to-b from-[#81059e] to-[#B7328C]">
            {/* MobileHeader apenas no mobile */}
            <div className="block md:hidden">
                <MobileHeader
                    userPhotoURL={userPhotoURL}
                    userData={userData}
                    userPermissions={userPermissions}
                />
            </div>

            {/* Sidebar fixa para desktop */}
            <aside className="hidden md:block md:w-[300px] lg:w-[350px] bg-[#81059e] text-white p-4 pl-10 shadow-xl rounded-tr-xl rounded-br-lg fixed h-screen overflow-y-auto">
                <SidebarHomepage
                    userPhotoURL={userData?.imageUrl || '/images/default-avatar.png'}
                    userData={{
                        name: userData?.nome,
                        email: userData?.email,
                        cargo: userData?.cargo, // Corrigir para usar cargo ao invés de profession
                        store: userPermissions?.isAdmin ? 'Todas as lojas' : userPermissions?.lojas[0]
                    }}
                    userPermissions={userPermissions}
                    currentPage="dashboard"
                />
            </aside>

            {/* Conteúdo principal */}
            <div className="flex-1 flex flex-col bg-white p-0 md:p-4 overflow-auto shadow-xl rounded-tl-xl rounded-bl-xl md:ml-[300px] lg:ml-[350px]">
                {/* Feedback de carregamento */}
                {(loadingOS || loadingVendas) && (
                    <div className="flex justify-center items-center mb-8">
                        <p>Carregando...</p>
                    </div>
                )}

                <Dashboard />

                <div className="flex flex-col p-2">
                    <CarrouselPromo />
                </div>

                <div className="grid grid-cols-2 gap-x-2 gap-y-4 md:grid-cols-4 mb-32 justify-center mx-auto lg:gap-x-14 lg:gap-y-6 mt-10">
                    {items.map((item, index) => (
                        <div key={index} className="flex justify-center">
                            <Link href={item.href} className="w-full max-w-[180px]">
                                <motion.div
                                    className="relative flex justify-center items-center bg-gradient-to-r from-[#81059e] to-[#B7328C] text-white w-full h-[100px] md:h-[80px] lg:h-[100px] rounded-xl transition-transform transform hover:scale-105 hover:shadow-2xl cursor-pointer p-6"
                                    style={{
                                        boxShadow: '0px 10px 25px rgba(0, 0, 0, 0.5)',
                                        boxSizing: 'border-box'
                                    }}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    whileHover={{ scale: 1.1, boxShadow: "0px 15px 30px rgba(0, 0, 0, 0.6)" }} // Aumenta a escala e adiciona uma sombra mais intensa ao passar o mouse
                                    transition={{ duration: 0.3 }}
                                >
                                    <div
                                        className="absolute inset-0 opacity-10 pointer-events-none"
                                        style={{
                                            backgroundImage: `url('/images/fundo.png')`,
                                            backgroundSize: 'cover',
                                            backgroundRepeat: 'no-repeat',
                                            backgroundPosition: 'center'
                                        }}
                                    ></div>

                                    <div className="relative z-10 flex flex-row justify-between items-center w-full h-full p-0 m-0">
                                        <span className="text-white font-medium text-base md:text-sm w-1/2 text-left pointer-events-none p-0 m-0">
                                            {item.label}
                                        </span>
                                        <Image
                                            src={item.img}
                                            alt={item.label}
                                            width={65}
                                            height={65}
                                            className="w-1/2 h-[60px] object-contain pointer-events-none"
                                            style={{ width: 'auto', height: 'auto' }}
                                        />
                                    </div>
                                </motion.div>

                            </Link>
                        </div>
                    ))}
                </div>
            </div>

            {/* Barra de navegação inferior no mobile */}
            <div className="mt-auto md:hidden">
                <BottomMobileNav />
            </div>
        </div>
    );
}
