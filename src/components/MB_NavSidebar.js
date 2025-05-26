"use client";
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
import Sidebar from '../components/Sidebar'; // Mantendo o import do Sidebar original

// Importações dos novos componentes modais
import ConfigurationsModal from './ConfigurationsModal';
import LogoutConfirmationModal from './LogoutConfirmationModal';

// Componente MobileNavSidebar com userPhotoURL sendo passado como prop
export default function MobileNavSidebar({ handleLogout, userPhotoURL, userData, userPermissions }) {
    const [isDropdownOpen, setDropdownOpen] = useState(false);
    const [isMenuOpen, setMenuOpen] = useState(false); // Estado para o menu hambúrguer
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

    // Configurações de animação para o dropdown do perfil
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
            {/* Navbar Superior - Mantendo o layout original */}
            <div className="flex justify-between bg-[#81059e] p-4 ">
                {/* Menu Sanduíche - Mantido como estava */}
                <button className="text-white focus:outline-none" onClick={toggleMenu}>
                    <FontAwesomeIcon icon={faBars} className="text-3xl" />
                </button>

                {/* Logo centralizada - Mantida como estava */}
                <div className='flex items-center justify-center ml-12'>
                    <Link href="/homepage">
                        <Image
                            src="/images/masioticas.png"
                            alt="Logo"
                            width={100}
                            height={50}
                            className="object-contain max-w-[100px] max-h-[50px]"
                        />
                    </Link></div>

                {/* Notificações e perfil - Aumentando o tamanho da imagem */}
                <div className="flex items-center">
                    <button className="text-white focus:outline-none mr-6">
                        <FontAwesomeIcon icon={faBell} className="text-2xl" />
                    </button>

                    <Image
                        src={userPhotoURL}
                        alt="User Avatar"
                        width={40}  // Aumentado de 10 para 40
                        height={40} // Aumentado de 10 para 40
                        className="rounded-full border-2 border-white cursor-pointer w-12 h-12" // Aumentado de w-10 h-10 para w-12 h-12
                        onClick={toggleDropdown}
                    />
                </div>
            </div>

            {/* Mantendo o componente Sidebar original */}
            <Sidebar
                showSidebar={isMenuOpen}
                hideSidebar={hideSidebar}
            />

            {/* Dropdown lateral que aparece ao clicar no avatar - Versão atualizada em tela cheia */}
            <AnimatePresence>
                {isDropdownOpen && (
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        variants={dropdownVariants}
                        className="fixed inset-0 bg-white z-[9999] overflow-y-auto"
                    >
                        {/* Menu Header */}
                        <div className="flex justify-between items-center p-4 border-b border-[#84207B] bg-purple-300">
                            <div className="flex items-center gap-4">
                                <Image
                                    src={userPhotoURL}
                                    alt="User Avatar"
                                    width={60}
                                    height={60}
                                    className="rounded-full border-2 border-white"
                                />
                                <div>
                                    <h2 className="text-black text-lg font-bold">
                                        {userData?.name}
                                        Marcelo Porto
                                    </h2>
                                    {renderUserInfo()}
                                </div>
                            </div>
                            <button onClick={toggleDropdown} className="text-black">
                                <FontAwesomeIcon icon={faX} className="text-2xl" />
                            </button>
                        </div>

                        {/* Menu Items */}
                        <div className="p-4">
                            <nav className="space-y-2">
                                <Link href="/homepage" className="block py-4 px-4 rounded-lg hover:bg-purple-100 transition-colors text-lg">
                                    <FontAwesomeIcon icon={faChartSimple} className="mr-3" />
                                    Dashboard
                                </Link>
                                <Link href="/homepage/agenda" className="block py-4 px-4 rounded-lg hover:bg-purple-100 transition-colors text-lg">
                                    <FontAwesomeIcon icon={faCalendarDay} className="mr-3" />
                                    Agenda
                                </Link>
                                <Link href="/finance" className="block py-4 px-4 rounded-lg hover:bg-purple-100 transition-colors text-lg">
                                    <FontAwesomeIcon icon={faCoins} className="mr-3" />
                                    Financeiro
                                </Link>
                                <Link href="/sales" className="block py-4 px-4 rounded-lg hover:bg-purple-100 transition-colors text-lg">
                                    <FontAwesomeIcon icon={faMoneyBillTransfer} className="mr-3" />
                                    Vendas
                                </Link>
                                <Link href="/homepage/cadastros" className="block py-4 px-4 rounded-lg hover:bg-purple-100 transition-colors text-lg">
                                    <FontAwesomeIcon icon={faUserPlus} className="mr-3" />
                                    Cadastros
                                </Link>
                                <Link href="/homepage/estoque" className="block py-4 px-4 rounded-lg hover:bg-purple-100 transition-colors text-lg">
                                    <FontAwesomeIcon icon={faCartFlatbed} className="mr-3" />
                                    Estoque
                                </Link>
                                <Link href="'/homepage/store" className="block py-4 px-4 rounded-lg hover:bg-purple-100 transition-colors text-lg">
                                    <FontAwesomeIcon icon={faShop} className="mr-3" />
                                    Loja Online
                                </Link>
                                <Link href="/homepage/contracts" className="block py-4 px-4 rounded-lg hover:bg-purple-100 transition-colors text-lg">
                                    <FontAwesomeIcon icon={faFileSignature} className="mr-3" />
                                    Contratos
                                </Link>
                                <Link href="/homepage/crm" className="block py-4 px-4 rounded-lg hover:bg-purple-100 transition-colors text-lg">
                                    <FontAwesomeIcon icon={faPeopleRoof} className="mr-3" />
                                    CRM
                                </Link>
                                <Link href="/homepage/rh" className="block py-4 px-4 rounded-lg hover:bg-purple-100 transition-colors text-lg">
                                    <FontAwesomeIcon icon={faIdBadge} className="mr-3" />
                                    RH
                                </Link>
                                <Link href="/homepage/integrations" className="block py-4 px-4 rounded-lg hover:bg-purple-100 transition-colors text-lg">
                                    <FontAwesomeIcon icon={faCode} className="mr-3" />
                                    Integrações
                                </Link>
                            </nav>

                            {/* Action Buttons */}
                            <div className="mt-6 space-y-2">
                                <button
                                    onClick={() => {
                                        setDropdownOpen(false);
                                        setIsConfigOpen(true);
                                    }}
                                    className="block py-4 px-4 rounded-lg hover:bg-purple-100 transition-colors text-lg"
                                >
                                    <FontAwesomeIcon icon={faCog} className="mr-3" />
                                    Configurações
                                </button>
                                <button
                                    onClick={() => {
                                        setDropdownOpen(false);
                                        setIsLogoutOpen(true);
                                    }}
                                    className="block py-4 px-4 rounded-lg hover:bg-purple-100 transition-colors text-lg"
                                >
                                    <FontAwesomeIcon icon={faRightFromBracket} className="mr-3" />
                                    Sair
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Modais da nova versão */}
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