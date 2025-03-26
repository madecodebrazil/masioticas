"use client";
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
    faSignOutAlt, // Adicionar ícone de logout
    faCog, // Ícone de configurações
    faBell,
    faRightFromBracket
} from '@fortawesome/free-solid-svg-icons';
import { auth } from '../lib/firebaseConfig'; // Ajuste o caminho conforme necessário
import { signOut } from 'firebase/auth';
import NotificationsModal from '../components/NotificationsModal';
import ConfigurationsModal from '../components/ConfigurationsModal';
import LogoutConfirmationModal from '../components/LogoutConfirmationModal';

export default function SidebarHomepage({ userPhotoURL, userData, userPermissions, currentPage }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const router = useRouter();


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
        setIsSidebarOpen(!isSidebarOpen); // Alterna entre mostrar e ocultar a sidebar
    };

    // Estilo condicional para a página ativa
    const getLinkStyle = (page) => {
        return currentPage === page
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
                        {userData?.cargo}
                    </h3>
                    <p className="text-white-400 text-sm">
                        Administrador - Acesso Total
                    </p>
                </>
            );
        }
        return (
            <>
                <h3 className="text-white-600 text-lg font-normal">
                    {userData?.cargo}
                </h3>
                <h3>
                    Loja: {userData?.store}
                </h3>
            </>
        );
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
                    onClick={toggleSidebar} // Fecha a sidebar ao clicar
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
                        src={userPhotoURL || '/images/default-avatar.png'} // Adicione uma imagem padrão
                        alt="User Avatar"
                        width={80}
                        height={80}
                        className="rounded-full mb-4 border-2 border-white p-2"
                        onError={(e) => {
                            e.target.src = '/images/default-avatar.png' // Fallback se a imagem falhar ao carregar
                        }}
                    />
                    <div className="text-center mb-6">
                        <h2 className="text-white text-xl font-bold mb-1">
                            {userData?.name || 'Dev Account'}
                        </h2>
                        <h3 className="text-white-600 text-lg font-semibold">
                            {renderUserInfo()}
                        </h3>
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
                        className="mb-6 cursor-pointer transition-all duration-300 hover:drop-shadow-[0_0_10px_rgba(255,255,0,0.8)]"
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
                            {userData?.name || 'Dev Account'}
                        </h2>
                        <h3 className="text-white-600 text-lg font-semibold">
                        </h3>
                        {renderUserInfo()} {/* Adicionar esta linha */}
                    </div>
                </div>

                {/* Menu lateral */}
                <nav className="flex flex-col gap-4 w-[250px] overflow-y-scroll p-2 custom-scroll">
                    <Link href="/homepage">
                        <div className={`${getLinkStyle('dashboard')} text-white 
                        bg-[#9b32b2] text-lg rounded-lg py-2 px-4 w-full text-center shadow-lg flex items-center justify-start gap-4 hover:bg-[#9b32b2] transition-colors duration-300`}>
                            <FontAwesomeIcon icon={faChartSimple} />

                            <span className="text-white font-medium">Dashboard</span>
                        </div>
                    </Link>


                    <Link href="/homepage/agenda">
                        <div className={`${getLinkStyle('agenda')} text-white rounded-lg py-2 px-4 w-full text-center shadow-lg flex items-center justify-start gap-4 hover:bg-[#9b32b2] transition-colors duration-300`}>
                            <FontAwesomeIcon icon={faCalendarDay} />
                            <span className="text-white text-lg font-medium">Agenda</span>
                        </div>
                    </Link>

                    <Link href="/finance">
                        <div className={`${getLinkStyle('agenda')} text-white rounded-lg py-2 px-4 w-full text-center shadow-lg flex items-center justify-start gap-4 hover:bg-[#9b32b2] transition-colors duration-300`}>
                            <FontAwesomeIcon icon={faCoins} />
                            <span className="text-white text-lg font-medium">Financeiro</span>
                        </div>
                    </Link>

                    <Link href="/sales">
                        <div className={`${getLinkStyle('agenda')} text-white rounded-lg py-2 px-4 w-full text-center shadow-lg flex items-center justify-start gap-4 hover:bg-[#9b32b2] transition-colors duration-300`}>
                            <FontAwesomeIcon icon={faMoneyBillTransfer} />
                            <span className="text-white text-lg font-medium">Vendas</span>
                        </div>
                    </Link>

                    <Link href="/homepage/agenda">
                        <div className={`${getLinkStyle('agenda')} text-white rounded-lg py-2 px-4 w-full text-center shadow-lg flex items-center justify-start gap-4 hover:bg-[#9b32b2] transition-colors duration-300`}>
                            <FontAwesomeIcon icon={faUserPlus} />
                            <span className="text-white text-lg font-medium">Cadastros</span>
                        </div>
                    </Link>

                    <Link href="/homepage/agenda">
                        <div className={`${getLinkStyle('agenda')} text-white rounded-lg py-2 px-4 w-full text-center shadow-lg flex items-center justify-start gap-4 hover:bg-[#9b32b2] transition-colors duration-300`}>
                            <FontAwesomeIcon icon={faCartFlatbed} />
                            <span className="text-white text-lg font-medium">Estoque</span>
                        </div>
                    </Link>


                    <Link href="/homepage/agenda">
                        <div className={`${getLinkStyle('agenda')} text-white rounded-lg py-2 px-4 w-full text-center shadow-lg flex items-center justify-start gap-4 hover:bg-[#9b32b2] transition-colors duration-300`}>
                            <FontAwesomeIcon icon={faShop} />
                            <span className="text-white text-lg font-medium">Loja Online</span>
                        </div>
                    </Link>

                    <Link href="/homepage/agenda">
                        <div className={`${getLinkStyle('agenda')} text-white rounded-lg py-2 px-4 w-full text-center shadow-lg flex items-center justify-start gap-4 hover:bg-[#9b32b2] transition-colors duration-300`}>
                            <FontAwesomeIcon icon={faFileSignature} />
                            <span className="text-white text-lg font-medium">Contratos</span>
                        </div>
                    </Link>

                    <Link href="/homepage/agenda">
                        <div className={`${getLinkStyle('agenda')} text-white rounded-lg py-2 px-4 w-full text-center shadow-lg flex items-center justify-start gap-4 hover:bg-[#9b32b2] transition-colors duration-300`}>
                            <FontAwesomeIcon icon={faPeopleRoof} />
                            <span className="text-white text-lg font-medium">CRM</span>
                        </div>
                    </Link>

                    <Link href="/homepage/agenda">
                        <div className={`${getLinkStyle('agenda')} text-white rounded-lg py-2 px-4 w-full text-center shadow-lg flex items-center justify-start gap-4 hover:bg-[#9b32b2] transition-colors duration-300`}>
                            <FontAwesomeIcon icon={faIdBadge} />
                            <span className="text-white text-lg font-medium">RH</span>
                        </div>
                    </Link>

                    <Link href="/homepage/agenda">
                        <div className={`${getLinkStyle('agenda')} text-white rounded-lg py-2 px-4 w-full text-center shadow-lg flex items-center justify-start gap-4 hover:bg-[#9b32b2] transition-colors duration-300`}>
                            <FontAwesomeIcon icon={faCode} />
                            <span className="text-white text-lg font-medium">Integrações</span>
                        </div>
                    </Link>
                </nav>
                {/* <button
                    onClick={handleLogout}
                    className="mt-auto mb-4 w-full bg-[#9b32b2] text-white rounded-lg py-2 px-4 text-center shadow-lg flex items-center justify-center gap-2 hover:bg-[#D291BC] transition-colors duration-300"
                >
                    <FontAwesomeIcon icon={faSignOutAlt} />
                    <span className="text-white text-lg font-medium">Sair</span>
                </button> */}
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
