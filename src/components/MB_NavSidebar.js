//MB_NavSidebar.js
"use client";
import { useState } from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
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
    faRightFromBracket,
    faBars
} from '@fortawesome/free-solid-svg-icons';
import Image from 'next/image';
import Link from 'next/link';
import Sidebar from '../components/Sidebar'; // Importe o componente Sidebar

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

    // Função para fechar o sidebar
    const hideSidebar = () => {
        setMenuOpen(false);
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
            {/* Navbar Superior */}
            <div className="flex justify-between bg-[#81059e] p-4 ">
                {/* Menu Sanduíche*/}
                <button className="text-white focus:outline-none" onClick={toggleMenu}>
                    <FontAwesomeIcon icon={faBars} className="text-3xl"/>
                </button>

                {/* Logo centralizada */}
                <div  className='flex items-center justify-center ml-12'>
                <Link href="/homepage">
                    <Image
                        src="/images/masioticas.png"
                        alt="Logo"
                        width={100}
                        height={50}
                    />
                </Link></div>

                {/* Notificações e perfil */}
                <div className="flex">
                    <button className="text-white focus:outline-none">
                    <FontAwesomeIcon icon={faBell} className="text-2xl pr-4" /></button>

                    <Image
                        src={userPhotoURL}
                        alt="User Avatar"
                        width={50}
                        height={50}
                        className="rounded-full border-2 border-white cursor-pointer w-10 h-10"
                        onClick={toggleDropdown}
                    />
                </div>
            </div>

            {/* Renderizando o componente Sidebar com as props necessárias */}
            <Sidebar 
                showSidebar={isMenuOpen} 
                hideSidebar={hideSidebar}
            />

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
                        <FontAwesomeIcon icon={faX} className='text-2xl'>
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