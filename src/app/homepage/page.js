//Homepage.js
"use client";
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { firestore } from '../../lib/firebaseConfig';
import { collection, getDocs, query, where } from 'firebase/firestore';
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
        { label: <>Financeiro</>, img: '/images/dock/finance_icon.png', href: '/finance' },
        { label: <>Vendas</>, img: '/images/dock/sales_icon.png', href: '/sales' },
        { label: <>Estoque</>, img: '/images/dock/stock_icon.png', href: '/stock' },
        { label: <>Produtos</>, img: '/images/dock/products_icon.png', href: '/products_and_services' },
        { label: <>Cadastros</>, img: '/images/dock/cadastro_icon.png', href: '/register' },
        { label: <>Consultas</>, img: '/images/dock/consultas_icon.png', href: '/consultation' },
        { label: <>Clientes</>, img: '/images/dock/clients_icon.png', href: 'register/consumers' },
        { label: <>Comercial</>, img: '/images/dock/commercial_icon.png', href: '/commercial' },
        { label: <>Cobranças</>, img: '/images/dock/bills_icon.png', href: '/billing' },

    ];

    const userPhotoURL = userData?.imageUrl || '/images/default-avatar.png';


    if (authLoading) {
        return (
            <div className="flex justify-center items-center py-10">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#81059e]"></div>
            </div>
        );
    }

    return (
        <div className="flex flex-col md:flex-row min-h-screen ">
            {/* MobileHeader apenas no mobile */}
            <div className="block md:hidden">
                <MobileHeader
                    userPhotoURL={userPhotoURL}
                    userData={userData}
                    userPermissions={userPermissions}
                />
            </div>

            {/* Sidebar fixa para desktop */}
            <aside className="hidden md:block md:w-[300px] lg:w-[300px] bg-gradient-to-b from-[#81059e] to-[#B7328C] text-white p-4 shadow-xl rounded-tr-xl rounded-br-lg fixed h-screen overflow-y-auto">
                <SidebarHomepage
                    userPhotoURL={userPhotoURL}
                    userData={userData}
                    currentPage="agenda"
                />
            </aside>

            {/* Conteúdo principal */}
            <div className="flex-1 flex flex-col bg-white p-0 md:p-4 overflow-auto shadow-xl rounded-tl-xl rounded-bl-xl md:ml-[300px] lg:ml-[300px]">
                {/* Feedback de carregamento */}
                {(loadingOS || loadingVendas) && (
                    <div className="flex justify-center items-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#81059e]"></div>
                    </div>
                )}

                <Dashboard />

                <div className="flex flex-col">
                    <CarrouselPromo />
                </div>

                <div className="grid grid-cols-2 gap-2 md:grid-cols-3 md:gap-8 lg:grid-cols-4 lg:gap-4 px-2 sm:px-8 md:px-12 lg:px-16 my-10 mb-32">
                    {items.map((item, index) => (
                        <div key={index} className="flex justify-center">
                            <Link href={item.href} className="w-full">
                                <motion.div
                                    className="relative flex justify-center items-center bg-gradient-to-r from-[#81059e] to-[#B7328C] text-white w-full h-[100px] md:h-[90px] lg:h-[100px] rounded-sm shadow-lg hover:shadow-2xl"
                                    style={{ boxShadow: '0px 6px 15px rgba(0, 0, 0, 0.3)' }}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    whileHover={{ scale: 1.05, boxShadow: "0px 10px 20px rgba(0, 0, 0, 0.4)" }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <div
                                        className="absolute inset-0 opacity-10 rounded-sm pointer-events-none overflow-hidden"
                                        style={{
                                            backgroundImage: `url('/images/fundo.png')`,
                                            backgroundSize: 'cover',
                                            backgroundPosition: 'center',
                                            borderRadius: 'inherit'
                                        }}
                                    />

                                    <div className="flex items-center justify-between w-full px-4">
                                        <span className="text-white font-medium text-sm md:text-base w-2/5">
                                            {item.label}
                                        </span>
                                        <div className="flex justify-end w-3/5">
                                            <Image
                                                src={item.img}
                                                alt={item.label}
                                                width={55}
                                                height={55}
                                                className="object-contain"
                                                priority
                                            />
                                        </div>
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
