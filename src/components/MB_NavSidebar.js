//MB_NavSidebar.js
"use client";
import { useState } from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faFileInvoice,
    faDollarSign,
    faClock,
    faExclamationTriangle,
    faFilter,
    faX,
    faChartSimple,
    faMoneyBillTransfer,
    faCalendarDay,
    faCoins,
    faUserPlus,
    faCartFlatbed,
    faShop,
    faFileSignature,
    faPeopleRoof,
    faIdBadge,
    faCode,
    faSignOutAlt,
    faBell,
    faCog,
    faRightFromBracket
} from '@fortawesome/free-solid-svg-icons';
import Image from 'next/image';
import Link from 'next/link';
import Sidebar from './Sidebar'; // Importe o componente Sidebar

// Componente MobileNavSidebar com userPhotoURL sendo passado como prop
export default function MobileNavSidebar({ handleLogout, userPhotoURL, userData, userPermissions }) {
    const [isDropdownOpen, setDropdownOpen] = useState(false);
    const [isMenuOpen, setMenuOpen] = useState(false); // Novo estado para o menu hambúrguer
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [isConfigOpen, setIsConfigOpen] = useState(false);
    const [isLogoutOpen, setIsLogoutOpen] = useState(false);

    // Alterna o dropdown lateral ao clicar na foto do avatar
    const toggleDropdown = () => {
        setDropdownOpen(!isDropdownOpen);
    };

    // Alterna o menu hambúrguer (abre ou fecha o Sidebar)
    const toggleMenu = () => {
        setMenuOpen(!isMenuOpen);
    };

    // Configurações de animação para suavizar a abertura do menu
    const menuVariants = {
        hidden: { opacity: 0, x: '-100%' }, // Começa fora da tela (à esquerda)
        visible: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 200, damping: 25 } }, // Aparece na tela
        exit: { opacity: 0, x: '-100%', transition: { type: 'spring', stiffness: 200, damping: 25 } }, // Sai para a esquerda
    };

    // Configurações de animação para suavizar a abertura do dropdown
    const dropdownVariants = {
        hidden: { opacity: 0, x: 100 },
        visible: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 200, damping: 25 } },
        exit: { opacity: 0, x: 100, transition: { type: 'spring', stiffness: 200, damping: 25 } },
    };

    // Função para renderizar as informações do usuário com base nas permissões
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
                <h3 className="text-white-400 text-sm">
                    Loja: {userData?.store}
                </h3>
            </>
        );
    };

    return (
        <>
            {/* Barra superior com logo centralizada e menu de hambúrguer à esquerda (mobile apenas) */}
            <div className="bg-[#81059e] w-full p-4 flex justify-between items-center lg:hidden z-50">
                {/* Ícone de menu de hambúrguer à esquerda */}
                <button className="text-white focus:outline-none" onClick={toggleMenu}>
                    <svg
                        className="w-8 h-8"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
                        ></path>
                    </svg>
                </button>
                {/* Logo centralizada */}
                <Link href="/homepage" className="mx-auto">
                    <Image
                        src="/images/logomasi_branca.png"
                        alt="Logo"
                        width={100}
                        height={50}
                        className="object-contain transition-all duration-300 hover:drop-shadow-[0_0_10px_rgba(255,255,0,0.8)]"
                    />
                </Link>

                {/* Ícone de sino e foto do usuário no lado direito */}
                <div className="flex items-center space-x-4">
                    {/* Ícone de sino */}
                    <button className="text-white focus:outline-none">
                        <svg
                            className="w-10 h-10"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                            ></path>
                        </svg>
                    </button>

                    {/* Foto do usuário com a função de abrir o dropdown lateral ao clicar */}
                    <Image
                        src={userPhotoURL}
                        alt="User Avatar"
                        width={50}
                        height={50}
                        className="rounded-full border-2 border-white cursor-pointer"
                        onClick={toggleDropdown} // Abre o dropdown lateral ao clicar no avatar
                    />
                </div>
            </div>

            {/* Menu lateral móvel que aparece ao clicar no ícone de hambúrguer */}
            {isMenuOpen && (
                <motion.div
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    variants={menuVariants}
                    className="fixed top-0 left-0 h-full w-[250px] bg-[#81059e] z-50 p-4 overflow-y-auto"
                >
                    {/* Botão para fechar o menu */}
                    <div className="flex justify-end mb-4">
                        <button
                            className="text-white"
                            onClick={toggleMenu}
                        >
                            <FontAwesomeIcon icon={faX} className="text-xl" />
                        </button>
                    </div>

                    {/* Seção de perfil do usuário - similar ao desktop */}
                    <div className="flex flex-col items-center mb-6">
                        {/* Ícones de notificação, configuração e logout */}
                        <div className="flex justify-center mb-4 space-x-4">
                            <button className="text-white">
                                <FontAwesomeIcon icon={faBell} className="text-xl" />
                            </button>
                            <button className="text-white">
                                <FontAwesomeIcon icon={faCog} className="text-xl" />
                            </button>
                            <button className="text-white">
                                <FontAwesomeIcon icon={faRightFromBracket} className="text-xl" />
                            </button>
                        </div>

                        {/* Foto do perfil grande */}
                        <Image
                            src={userPhotoURL}
                            alt="User Avatar"
                            width={80}
                            height={80}
                            className="rounded-full mb-4 border-2 border-white p-2"
                        />

                        {/* Nome do usuário e cargo */}
                        <div className="text-center mb-6">
                            <h2 className="text-white text-xl font-bold mb-1">
                                {userData?.name || 'Dev Account'}
                            </h2>
                            {renderUserInfo()}
                        </div>
                    </div>

                    {/* Menu de navegação */}
                    <nav className="flex flex-col gap-2 w-full overflow-y-auto max-h-[calc(100vh-250px)]">
                        <Link href="/homepage">
                            <div className="bg-[#9b32b2] text-white rounded-lg py-2 px-3 w-full text-center shadow-lg flex items-center justify-start gap-3 hover:bg-[#D291BC] transition-colors duration-300">
                                <FontAwesomeIcon icon={faChartSimple} className="w-5 h-5" />
                                <span className="text-white font-medium">Dashboard</span>
                            </div>
                        </Link>

                        <Link href="/homepage/agenda">
                            <div className="bg-[#84207B] text-white rounded-lg py-2 px-3 w-full text-center shadow-lg flex items-center justify-start gap-3 hover:bg-[#9b32b2] transition-colors duration-300">
                                <FontAwesomeIcon icon={faCalendarDay} className="w-5 h-5" />
                                <span className="text-white font-medium">Agenda</span>
                            </div>
                        </Link>

                        <Link href="/finance">
                            <div className="bg-[#84207B] text-white rounded-lg py-2 px-3 w-full text-center shadow-lg flex items-center justify-start gap-3 hover:bg-[#9b32b2] transition-colors duration-300">
                                <FontAwesomeIcon icon={faCoins} className="w-5 h-5" />
                                <span className="text-white font-medium">Financeiro</span>
                            </div>
                        </Link>

                        <Link href="/commercial/sales">
                            <div className="bg-[#84207B] text-white rounded-lg py-2 px-3 w-full text-center shadow-lg flex items-center justify-start gap-3 hover:bg-[#9b32b2] transition-colors duration-300">
                                <FontAwesomeIcon icon={faMoneyBillTransfer} className="w-5 h-5" />
                                <span className="text-white font-medium">Vendas</span>
                            </div>
                        </Link>

                        <Link href="/homepage/cadastros">
                            <div className="bg-[#84207B] text-white rounded-lg py-2 px-3 w-full text-center shadow-lg flex items-center justify-start gap-3 hover:bg-[#9b32b2] transition-colors duration-300">
                                <FontAwesomeIcon icon={faUserPlus} className="w-5 h-5" />
                                <span className="text-white font-medium">Cadastros</span>
                            </div>
                        </Link>

                        <Link href="/homepage/estoque">
                            <div className="bg-[#84207B] text-white rounded-lg py-2 px-3 w-full text-center shadow-lg flex items-center justify-start gap-3 hover:bg-[#9b32b2] transition-colors duration-300">
                                <FontAwesomeIcon icon={faCartFlatbed} className="w-5 h-5" />
                                <span className="text-white font-medium">Estoque</span>
                            </div>
                        </Link>




                        <Link href="/homepage/loja-online">
                            <div className="bg-[#84207B] text-white rounded-lg py-2 px-3 w-full text-center shadow-lg flex items-center justify-start gap-3 hover:bg-[#9b32b2] transition-colors duration-300">
                                <FontAwesomeIcon icon={faShop} className="w-5 h-5" />
                                <span className="text-white font-medium">Loja Online</span>
                            </div>
                        </Link>

                        <Link href="/homepage/contratos">
                            <div className="bg-[#84207B] text-white rounded-lg py-2 px-3 w-full text-center shadow-lg flex items-center justify-start gap-3 hover:bg-[#9b32b2] transition-colors duration-300">
                                <FontAwesomeIcon icon={faFileSignature} className="w-5 h-5" />
                                <span className="text-white font-medium">Contratos</span>
                            </div>
                        </Link>

                        <Link href="/homepage/crm">
                            <div className="bg-[#84207B] text-white rounded-lg py-2 px-3 w-full text-center shadow-lg flex items-center justify-start gap-3 hover:bg-[#9b32b2] transition-colors duration-300">
                                <FontAwesomeIcon icon={faPeopleRoof} className="w-5 h-5" />
                                <span className="text-white font-medium">CRM</span>
                            </div>
                        </Link>

                        <Link href="/homepage/rh">
                            <div className="bg-[#84207B] text-white rounded-lg py-2 px-3 w-full text-center shadow-lg flex items-center justify-start gap-3 hover:bg-[#9b32b2] transition-colors duration-300">
                                <FontAwesomeIcon icon={faIdBadge} className="w-5 h-5" />
                                <span className="text-white font-medium">RH</span>
                            </div>
                        </Link>

                        <Link href="/homepage/integracoes">
                            <div className="bg-[#84207B] text-white rounded-lg py-2 px-3 w-full text-center shadow-lg flex items-center justify-start gap-3 hover:bg-[#9b32b2] transition-colors duration-300">
                                <FontAwesomeIcon icon={faCode} className="w-5 h-5" />
                                <span className="text-white font-medium">Integrações</span>
                            </div>
                        </Link>
                    </nav>

                    {/* Botões de configuração e logout */}
                    <div className="mt-4 flex justify-center space-x-6">
                        <button
                            onClick={() => setIsConfigOpen(true)}
                            className="bg-[#9b32b2] hover:bg-[#D4A017] rounded-full p-3 transition-colors duration-300">
                            <FontAwesomeIcon icon={faCog} className="text-white w-5 h-5" />
                        </button>
                        <button
                            onClick={handleLogout}
                            className="bg-[#9b32b2] hover:bg-[#D4A017] rounded-full p-3 transition-colors duration-300">
                            <FontAwesomeIcon icon={faRightFromBracket} className="text-white w-5 h-5" />
                        </button>
                    </div>
                </motion.div>
            )}

            {/* Dropdown lateral que aparece ao clicar no avatar */}
            {isDropdownOpen && (
                <motion.div
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    variants={dropdownVariants}
                    className="fixed top-0 right-0 w-[250px] h-full bg-gradient-to-b from-[#81059e] to-[#B7328C] text-white p-4 shadow-xl z-[9999]" // Definindo z-index alto
                >
                    {/* Botão para fechar o dropdown */}
                    <button
                        className="absolute top-4 right-4 text-white"
                        onClick={toggleDropdown}
                    >
                        <FontAwesomeIcon icon={faX}>
                        </FontAwesomeIcon>
                    </button>

                    {/* Conteúdo do dropdown */}
                    <div className="flex flex-col items-center mt-8">
                        {/* Avatar e Nome */}
                        <Image
                            src={userPhotoURL}
                            alt="User Avatar"
                            width={80}
                            height={80}
                            className="rounded-full mb-4 border-2 border-white"
                        />
                        <div className="text-center mb-6">
                            <h2 className="text-white text-xl font-bold mb-1">
                                {userData?.name}
                            </h2>
                            {renderUserInfo()}
                        </div>

                        {/* Navegação do Dropdown com os botões adicionais */}
                        <nav className="flex flex-col gap-3 w-full">
                            <Link href="/homepage">
                                <div className="bg-[#84207B] text-white border border-[rgba(154,42,141,0.3)] rounded-lg py-3 px-3 w-full text-center shadow-lg flex items-center justify-start gap-3 hover:bg-[#D4A017] transition-colors duration-300">
                                    <FontAwesomeIcon icon={faChartSimple} className="w-5 h-5" />
                                    <span className="text-white font-semibold">DASHBOARD</span>
                                </div>
                            </Link>

                            <Link href="/homepage/agenda">
                                <div className="bg-[#84207B] text-white border border-[rgba(154,42,141,0.3)] rounded-lg py-3 px-3 w-full text-center shadow-lg flex items-center justify-start gap-3 hover:bg-[#D4A017] transition-colors duration-300">
                                    <FontAwesomeIcon icon={faCalendarDay} className="w-5 h-5" />
                                    <span className="text-white font-semibold">AGENDA</span>
                                </div>
                            </Link>

                            <Link href="/finance">
                                <div className="bg-[#84207B] text-white border border-[rgba(154,42,141,0.3)] rounded-lg py-3 px-3 w-full text-center shadow-lg flex items-center justify-start gap-3 hover:bg-[#D4A017] transition-colors duration-300">
                                    <FontAwesomeIcon icon={faCoins} className="w-5 h-5" />
                                    <span className="text-white font-semibold">FINANCEIRO</span>
                                </div>
                            </Link>

                            <Link href="/commercial/sales">
                                <div className="bg-[#84207B] text-white border border-[rgba(154,42,141,0.3)] rounded-lg py-3 px-3 w-full text-center shadow-lg flex items-center justify-start gap-3 hover:bg-[#D4A017] transition-colors duration-300">
                                    <FontAwesomeIcon icon={faMoneyBillTransfer} className="w-5 h-5" />
                                    <span className="text-white font-semibold">VENDAS</span>
                                </div>
                            </Link>

                            <Link href="/homepage/cadastros">
                                <div className="bg-[#84207B] text-white border border-[rgba(154,42,141,0.3)] rounded-lg py-3 px-3 w-full text-center shadow-lg flex items-center justify-start gap-3 hover:bg-[#D4A017] transition-colors duration-300">
                                    <FontAwesomeIcon icon={faUserPlus} className="w-5 h-5" />
                                    <span className="text-white font-semibold">CADASTROS</span>
                                </div>
                            </Link>

                            <Link href="/homepage/estoque">
                                <div className="bg-[#84207B] text-white border border-[rgba(154,42,141,0.3)] rounded-lg py-3 px-3 w-full text-center shadow-lg flex items-center justify-start gap-3 hover:bg-[#D4A017] transition-colors duration-300">
                                    <FontAwesomeIcon icon={faCartFlatbed} className="w-5 h-5" />
                                    <span className="text-white font-semibold">ESTOQUE</span>
                                </div>
                            </Link>
                        </nav>

                        {/* Botões de Configurações e Logout */}
                        <div className="mt-4 flex justify-center space-x-6">
                            <button
                                onClick={() => setIsConfigOpen(true)}
                                className="bg-[#9b32b2] hover:bg-[#D4A017] rounded-full p-3 transition-colors duration-300">
                                <FontAwesomeIcon icon={faCog} className="text-white w-5 h-5" />
                            </button>
                            <button
                                onClick={handleLogout}
                                className="bg-[#9b32b2] hover:bg-[#D4A017] rounded-full p-3 transition-colors duration-300">
                                <FontAwesomeIcon icon={faRightFromBracket} className="text-white w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </>
    );
}