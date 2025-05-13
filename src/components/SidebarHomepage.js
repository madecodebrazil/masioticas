// SidebarHomepage.js
"use client";
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faChartSimple,
    faMoneyBillTransfer,
    faCalendarDay,
    faCoins,
    faGear,
    faAddressBook,
    faCartFlatbed,
    faUserPlus,
    faShop,
    faFileSignature,
    faPeopleRoof,
    faIdBadge,
    faCode,
    faSignOutAlt,
    faCog,
    faBell,
    faRightFromBracket
} from '@fortawesome/free-solid-svg-icons';
import { auth } from '../lib/firebaseConfig';
import { signOut } from 'firebase/auth';
import NotificationsModal from '../components/NotificationsModal';
import ConfigurationsModal from '../components/ConfigurationsModal';
import LogoutConfirmationModal from '../components/LogoutConfirmationModal';

export default function SidebarHomepage({ userPhotoURL, userData, userPermissions }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const router = useRouter();
    const pathname = usePathname(); // Hook para obter o caminho atual

    const handleLogout = async () => {
        try {
            await signOut(auth);
            router.push('/'); // Redireciona para a página inicial após logout
        } catch (error) {
            console.error("Erro ao fazer logout:", error);
        }
    };

    // Alterna a visibilidade da sidebar
    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    // Menu items com rotas correspondentes
    const menuItems = [
        { name: 'dashboard', path: '/homepage', icon: faChartSimple, label: 'Dashboard' },
        { name: 'agenda', path: '/homepage/agenda', icon: faCalendarDay, label: 'Agenda' },
        { name: 'financeiro', path: '/finance', icon: faCoins, label: 'Financeiro' },
        { name: 'vendas', path: '/sales', icon: faMoneyBillTransfer, label: 'Vendas' },
        { name: 'cadastros', path: '/register', icon: faUserPlus, label: 'Cadastros' },
        { name: 'estoque', path: '/stock', icon: faCartFlatbed, label: 'Estoque' },
        { name: 'loja-online', path: '/homepage/store', icon: faShop, label: 'Loja Online' },
        { name: 'contratos', path: '/homepage/contracts', icon: faFileSignature, label: 'Contratos' },
        { name: 'crm', path: '/homepage/crm', icon: faPeopleRoof, label: 'CRM' },
        { name: 'rh', path: '/homepage/rh', icon: faIdBadge, label: 'RH' },
        { name: 'integracoes', path: '/homepage/integrations', icon: faCode, label: 'Integrações' },
    ];

    // Estilo condicional para a página ativa
    const getLinkStyle = (path) => {
        // Verifica se o pathname atual começa com o path do menu
        // Isso permite que subpáginas também sejam destacadas
        return pathname === path || pathname.startsWith(`${path}/`)
            ? 'bg-[#D291BC]' // Cor ativa para a página atual
            : 'bg-[#84207B]'; // Cor padrão para as outras páginas
    };

    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [isConfigOpen, setIsConfigOpen] = useState(false);
    const [isLogoutOpen, setIsLogoutOpen] = useState(false);

    const renderUserInfo = () => {
        if (userPermissions?.isAdmin) {
            return (
                <>
                    <h3 className="text-white-600 text-lg font-semibold">
                        {userData?.cargo || 'Administrador'}
                    </h3>
                    <p className="text-white-400 text-sm">
                        Acesso Total
                    </p>
                </>
            );
        }

        // Para usuários normais, mostre as lojas que eles têm acesso
        const userStores = userPermissions?.lojas?.join(', ') || 'Nenhuma loja';
        return (
            <>
                <h3 className="text-white-600 text-lg font-normal">
                    {userData?.cargo || 'Funcionário'}
                </h3>
                <p className="text-white-600 text-sm">
                    Loja: {userStores}
                </p>
            </>
        );
    };

    const userMenuVariants = {
        hidden: { opacity: 0, x: '100%' },
        visible: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 200, damping: 25 } },
        exit: { opacity: 0, x: '100%', transition: { type: 'spring', stiffness: 200, damping: 25 } },
    };

    return (
        <>
            {/* Sidebar no mobile como um dropdown na lateral direita */}
            <aside
                className={`hidden md:block md:w-[300px] lg:w-[350px] bg-[#81059e] text-white p-4 pl-10 shadow-xl rounded-tr-xl rounded-br-lg fixed h-screen overflow-y-auto z-[1] ${isSidebarOpen ? 'block' : 'hidden'
                    } md:hidden`}
            >
                {/* Botão de fechar a sidebar */}
                <button
                    className="absolute top-4 right-4 text-white"
                    onClick={toggleSidebar}
                >
                    X
                </button>

                {/* Conteúdo da sidebar */}
                <div className="flex flex-col items-center">
                    {/* Logotipo com link para /homepage */}
                    <Link href="/homepage">
                        <Image
                            src="/public/images/logomasi_branca.png"
                            alt="Logo Masi Eyewear"
                            width={120}
                            height={60}
                            className="mb-8 cursor-pointer"
                        />
                    </Link>
                    {/* Avatar e Nome */}
                    <Image
                        src={userPhotoURL || '/images/default-avatar.png'}
                        alt="User Avatar"
                        width={80}
                        height={80}
                        className="rounded-full mb-4 border-2 border-white p-2"
                        onError={(e) => {
                            e.target.src = '/images/default-avatar.png'
                        }}
                    />
                    <div className="text-center mb-6">
                        <h2 className="text-white text-xl font-bold mb-1">
                            {userData?.nome || userData?.name || 'Usuário'}
                        </h2>
                        {renderUserInfo()}
                    </div>
                </div>
            </aside>

            {/* Sidebar padrão para desktop */}
            <aside className="w-[250px] h-full text-white flex-col items-center p-4 hidden md:flex">
                <Link href="/homepage">
                    <Image
                        src="/images/masioticas.png"
                        alt="Logo Masi Eyewear"
                        width={120}
                        height={60}
                        className="mb-6 cursor-pointer transition-all duration-300 hover:drop-shadow-[0_0_10px_rgba(255,255,0,0.8)] max-w-[120px] max-h-[60px] object-contain"
                    />
                </Link>

                <div className="relative w-full">
                    <div className='flex justify-center mb-10'>
                        <div className="relative">
                            <button onClick={() => setIsNotificationsOpen(true)}>
                                <FontAwesomeIcon icon={faBell} className="text-2xl pr-2" />
                            </button>

                            <button onClick={() => setIsConfigOpen(true)}>
                                <FontAwesomeIcon icon={faCog} className="text-2xl" />
                            </button>

                            <button onClick={() => setIsLogoutOpen(true)}>
                                <FontAwesomeIcon icon={faRightFromBracket} className="text-2xl pl-2" />
                            </button>
                        </div>
                    </div>

                    {/* Avatar e Nome */}
                    <div className='flex items-center justify-center'>
                        <Image
                            src={userPhotoURL}
                            alt="User Avatar"
                            width={80}
                            height={80}
                            className="rounded-full mb-4 border-2 border-white p-2"
                        />
                    </div>
                    <div className="text-center mb-6">
                        <h2 className="text-white text-xl font-bold mb-1">
                            {userData?.nome || userData?.name || 'Usuário'}
                        </h2>
                        {renderUserInfo()}
                    </div>
                </div>

                {/* Menu lateral usando mapeamento dos itens de menu */}
                <nav className="flex flex-col gap-4 w-[250px] overflow-y-scroll p-2 custom-scroll">
                    {menuItems.map((item) => (
                        <Link key={item.name} href={item.path}>
                            <div className={`${getLinkStyle(item.path)} text-white 
                            rounded-sm py-2 px-4 w-full text-center shadow-lg flex items-center justify-start gap-4 hover:bg-[#9b32b2] transition-colors duration-300`}>
                                <FontAwesomeIcon icon={item.icon} />
                                <span className="text-white text-lg font-medium">{item.label}</span>
                            </div>
                        </Link>
                    ))}
                </nav>
            </aside>

            <NotificationsModal
                isOpen={isNotificationsOpen}
                onClose={() => setIsNotificationsOpen(false)}
            />

            <ConfigurationsModal
                isOpen={isConfigOpen}
                onClose={() => setIsConfigOpen(false)}
            />

            <LogoutConfirmationModal
                isOpen={isLogoutOpen}
                onClose={() => setIsLogoutOpen(false)}
                onConfirm={handleLogout}
            />
        </>
    );
}