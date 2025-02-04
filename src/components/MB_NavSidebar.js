"use client";
import { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import Sidebar from './Sidebar'; // Importe o componente Sidebar

// Componente de item de menu
const MenuItem = ({ icon, label, href }) => (
    <motion.li
        whileHover={{ scale: 1.05 }}
        className="flex items-center space-x-4 hover:bg-[#CE8F00] hover:rounded-lg p-2"
    >
        <Image src={icon} width={30} height={30} alt={label} />
        <Link href={href} passHref>
            <span className="text-white">{label}</span>
        </Link>
    </motion.li>
);

// Componente MobileNavSidebar com userPhotoURL sendo passado como prop
export default function MobileNavSidebar({ handleLogout, userPhotoURL, userData }) {
    const [isDropdownOpen, setDropdownOpen] = useState(false);
    const [isMenuOpen, setMenuOpen] = useState(false); // Novo estado para o menu hambúrguer

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

    return (
        <>
            {/* Barra superior com logo centralizada e menu de hambúrguer à esquerda (mobile apenas) */}
            <div className="bg-[#932A83] w-full p-4 flex justify-between items-center lg:hidden z-50">
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
{isMenuOpen && (
    <motion.div
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={menuVariants}
        className="fixed top-0 left-0 h-full w-[250px] bg-[#932A83] z-50"
    >
        <Sidebar showSidebar={isMenuOpen} hideSidebar={toggleMenu} />
    </motion.div>
)}



            {/* Dropdown lateral que aparece ao clicar no avatar */}
            {isDropdownOpen && (
                <motion.div
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    variants={dropdownVariants}
                    className="fixed top-0 right-0 w-[250px] h-full bg-gradient-to-b from-[#932A83] to-[#B7328C] text-white p-4 shadow-xl z-[9999]" // Definindo z-index alto
                >
                    {/* Botão para fechar o dropdown */}
                    <button
                        className="absolute top-4 right-4 text-white"
                        onClick={toggleDropdown}
                    >
                        X
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
                            {/* Verifica o nível de permissão */}
                            {userData?.level_perm === 'user' && (
                                <h3 className="text-white-600 text-lg font-semibold">
                                    Vendedor(a)
                                </h3>
                            )}
                            {userData?.level_perm === 'dev' && (
                                <h3 className="text-white-600 text-lg font-semibold">
                                    Desenvolvedor(a)
                                </h3>
                            )}
                        </div>

                        {/* Navegação do Dropdown com os botões adicionais */}
                        <nav className="flex flex-col gap-4 w-full">
                            <Link href="/homepage">
                                <div className="bg-[#84207B] text-white border border-[rgba(154,42,141,0.3)] rounded-lg py-4 px-4 w-full text-center shadow-lg flex items-center justify-start gap-4 hover:bg-[#D4A017] transition-colors duration-300">
                                    <Image
                                        src="/images/sidebar_homepage/dashboard.png"
                                        alt="Dashboard"
                                        width={30}
                                        height={30}
                                        className="flex-shrink-0"
                                    />
                                    <span className="text-white font-semibold">DASHBOARD</span>
                                </div>
                            </Link>

                        

                            <Link href="/homepage/agenda">
                                <div className="bg-[#84207B] text-white border border-[rgba(154,42,141,0.3)] rounded-lg py-4 px-4 w-full text-center shadow-lg flex items-center justify-start gap-4 hover:bg-[#D4A017] transition-colors duration-300">
                                    <Image
                                        src="/images/sidebar_homepage/agenda.png"
                                        alt="Agenda"
                                        width={30}
                                        height={30}
                                        className="flex-shrink-0"
                                    />
                                    <span className="text-white font-semibold">AGENDA</span>
                                </div>
                            </Link>

                             </nav>

                        {/* Logout */}
                        <div className="mt-6">
                            <button onClick={handleLogout} className="text-yellow-300">
                                Sair
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </>
    );
}
