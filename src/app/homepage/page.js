"use client";
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { auth, firestore } from '../../lib/firebaseConfig';
import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { motion } from 'framer-motion';
import SidebarHomepage from '../../components/SidebarHomepage';
import Dashboard from '@/components/Dashboard';
import CarrouselPromo from '../../components/CarrouselPromo';
import MobileHeader from '@/components/MB_Homeheader';
import BottomMobileNav from '../../components/MB_BottomNav';

export default function Home() {
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [loadingOS, setLoadingOS] = useState(true);
    const [loadingVendas, setLoadingVendas] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const [osPendentes, setOsPendentes] = useState(0);
    const [osConcluidas, setOsConcluidas] = useState(0);
    const [osAtrasadas, setOsAtragisadas] = useState(0);

    // Contagem das vendas por dia, semana e mês
    const [salesToday, setSalesToday] = useState(0);
    const [salesThisWeek, setSalesThisWeek] = useState(0);
    const [salesThisMonth, setSalesThisMonth] = useState(0);

    // Contagem das consultas
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
        const fetchUserData = async (uid) => {
            try {
                // Verifica em qual loja o usuário está
                const docRefLoja1 = doc(firestore, `loja1/users/${uid}/dados`);
                const docRefLoja2 = doc(firestore, `loja2/users/${uid}/dados`);
                const docSnapLoja1 = await getDoc(docRefLoja1);
                const docSnapLoja2 = await getDoc(docRefLoja2);

                if (docSnapLoja1.exists()) {
                    setUserData(docSnapLoja1.data());
                    await contarVendasDoUsuario(uid);
                } else if (docSnapLoja2.exists()) {
                    setUserData(docSnapLoja2.data());
                    await contarVendasDoUsuario(uid);
                } else {
                    console.log('Nenhum documento encontrado para o UID:', uid);
                    setLoadingVendas(false);
                }
            } catch (error) {
                console.error("Erro ao buscar dados do usuário:", error);
                setLoadingVendas(false);
            }
        };

        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setUser(user);
                await fetchUserData(user.uid);
            } else {
                router.push('/login');
            }
        });

        return () => unsubscribe();
    }, [router, contarVendasDoUsuario]);

    const toggleSidebar = () => {
        if (!loadingOS && !loadingVendas && userData) {
            setIsSidebarOpen(!isSidebarOpen);
        }
    };

    const items = [
        { label: <>Finanças</>, img: '/images/homepage/Coins.png', href: '/finance' },
        { label: <>Estoque</>, img: '/images/homepage/Boxes.png', href: '/stock' },
        { label: <>Produtos e <br /> Serviços</>, img: '/images/homepage/Product.png', href: '/products_and_services' },
        { label: <>Consulta</>, img: '/images/homepage/Stethoscope.png', href: '/consultation' },
        { label: <>Clientes</>, img: '/images/homepage/User.png', href: 'register/consumers' },
        { label: <>Comercial</>, img: '/images/homepage/Shopping.png', href: '/commercial' },
        { label: <>Cobranças</>, img: '/images/homepage/Receipt_Dollar.png', href: '/billing' },
        { label: <>Cadastro</>, img: '/images/homepage/Task.png', href: '/register' },
    ];

    const userPhotoURL = userData?.imageUrl || '/images/default-avatar.png';

    return (
        <div className="flex flex-col md:flex-row min-h-screen bg-gradient-to-b from-[#9000ff] to-[#B7328C]">
            
            {/* MobileHeader apenas no mobile */}
            <div className="block md:hidden">
                <MobileHeader userPhotoURL={userPhotoURL} userData={userData} />
            </div>

            {/* Sidebar como um dropdown lateral */}
            <aside className={`fixed top-0 right-0 w-[250px] h-full bg-[#9000ff] text-white p-4 shadow-xl transform ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'} transition-transform duration-300 z-50`}>
                <button
                    className="absolute top-4 right-4 text-white"
                    onClick={toggleSidebar}
                >
                    <Image src="/images/close-icon.png" alt="Close" width={24} height={24} />
                </button>

                <SidebarHomepage userPhotoURL={userPhotoURL} userData={userData} />
            </aside>

            {/* Sidebar normal para desktop (768px+) */}
            <aside className="hidden md:block md:w-[300px] lg:w-[350px] bg-[#9000ff] text-white p-4 shadow-xl rounded-tr-xl rounded-br-lg">
                <SidebarHomepage userPhotoURL={userPhotoURL} userData={userData} currentPage="dashboard" />
            </aside>

            {/* Conteúdo principal */}
            <div className="flex-1 flex flex-col bg-white p-4 sm:p-8 overflow-auto shadow-xl rounded-tl-xl rounded-bl-xl">
                {/* Feedback de carregamento */}
                {(loadingOS || loadingVendas) && (
                    <div className="flex justify-center items-center mb-8">
                        <p>Carregando dados...</p>
                    </div>
                )}

                {/* Informações principais */}
               <Dashboard />

             {/* Banners promocionais */}
             <div className="flex flex-col p-4">
          <CarrouselPromo />
        </div>

                {/* Grid de opções */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-4 md:grid-cols-4 mb-20 justify-center mx-auto lg:gap-x-10 lg:gap-y-6">
                    {items.map((item, index) => (
                        <div key={index} className="flex justify-center">
                            <Link href={item.href} className="w-full max-w-[180px]">
                            <motion.div
    className="relative flex justify-center items-center bg-gradient-to-r from-[#9000ff] to-[#B7328C] text-white w-full h-[100px] md:h-[80px] lg:h-[100px] rounded-xl transition-transform transform hover:scale-105 hover:shadow-2xl cursor-pointer p-6"
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
        <span className="text-white font-medium text-lg flex-grow text-center pointer-events-none p-0 m-0">
            {item.label}
        </span>
        <Image
            src={item.img}
            alt={item.label}
            width={70}
            height={70}
            className=" object-contain pointer-events-none p-0 m-0"
        />
    </div>
</motion.div>

                            </Link>
                        </div>
                    ))}
                </div>
            </div>

            {/* Barra de navegação inferior no mobile */}
            <div className="mt-auto">
                <BottomMobileNav />
            </div>
        </div>
    );
}
