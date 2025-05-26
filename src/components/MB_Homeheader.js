"use client";
import { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { getAuth, signOut } from 'firebase/auth';
import Sidebar from './Sidebar';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell, faBars } from '@fortawesome/free-solid-svg-icons';

const MenuItem = ({ icon, label, href }) => (
    <motion.li
        whileHover={{ scale: 1.05 }}
        className="flex justify-start items-center w-full py-2 hover:bg-[#CE8F00] hover:rounded-lg transition-all duration-300"
    >
        <Link href={href} className="flex items-center gap-4 w-full p-4 border border-[rgba(255, 20, 147, 0.1)] rounded-lg">
            <div className="flex-shrink-0">
                {typeof icon === 'string' ? (
                    <Image
                        src={icon}
                        width={30}
                        height={30}
                        alt={label}
                        className="object-contain"
                    />
                ) : (
                    <Image
                        src="/images/default_icon.png"
                        width={30}
                        height={30}
                        alt="Ícone padrão"
                        className="object-contain"
                    />
                )}

            </div>
            <span className="text-white font-semibold">{label}</span>
        </Link>
    </motion.li>
);

export default function MobileNavSidebar({ userPhotoURL, userData }) {
    const [isDropdownOpen, setDropdownOpen] = useState(false);
    const [isMenuOpen, setMenuOpen] = useState(false);

    const toggleDropdown = () => {
        setDropdownOpen(!isDropdownOpen);
    };

    const toggleMenu = () => {
        setMenuOpen(!isMenuOpen);
    };

    const menuVariants = {
        hidden: { opacity: 0, x: '-100%' },
        visible: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 200, damping: 25 } },
        exit: { opacity: 0, x: '-100%', transition: { type: 'spring', stiffness: 200, damping: 25 } },
    };

    const dropdownVariants = {
        hidden: { opacity: 0, x: 100 },
        visible: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 200, damping: 25 } },
        exit: { opacity: 0, x: 100, transition: { type: 'spring', stiffness: 200, damping: 25 } },
    };

    const handleLogout = async () => {
        const auth = getAuth();
        try {
            await signOut(auth);
            window.location.href = '/login'; // Redireciona para a página de login
        } catch (error) {
            console.error('Erro ao fazer logout: ', error);
        }
    };

    return (
        <>
            <div className="flex items-center justify-between w-full p-4 bg-[#81059e] lg:hidden z-30">
                <button className="text-white w-8" onClick={toggleMenu}>
                    <FontAwesomeIcon icon={faBars} className="text-3xl hover:bg-purple-500 p-2 hover:rounded-lg" />
                </button>

                <div className="absolute left-1/2 transform -translate-x-1/2">
                    <Link href="/homepage">
                        <Image
                            src="/images/logomasi_branca.png"
                            alt="Logo masi"
                            width={80}
                            height={80}
                            className="p-2 object-contain transition-all duration-300 hover:drop-shadow-[0_0_10px_rgba(255,255,0,0.8)] max-w-[80px] max-h-[80px]"
                        />
                    </Link>
                </div>

                <div className="flex gap-4">
                    <button className="text-white">
                        <FontAwesomeIcon icon={faBell} className="text-2xl hover:bg-purple-500 p-2 hover:rounded-lg" />
                    </button>

                    <div className="hover:bg-purple-400 p-1 rounded-2xl">
                        <Image
                            src={userPhotoURL}
                            alt="User Avatar"
                            width={50}
                            height={50}
                            className="rounded-full border-2 border-white cursor-pointer p-2"
                            onClick={toggleDropdown}
                        />
                    </div>
                </div>
            </div>

            {isMenuOpen && (
                <motion.div
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    variants={menuVariants}
                    className="fixed top-0 left-0 h-full w-[250px] bg-[#81059e] z-50"
                >
                    <Sidebar showSidebar={isMenuOpen} hideSidebar={toggleMenu} />
                </motion.div>
            )}

            {isDropdownOpen && (
                <motion.div
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    variants={dropdownVariants}
                    className="fixed top-0 right-0 w-[250px] h-full bg-[#81059e] text-white p-4 shadow-2xl drop-shadow-lg z-50"
                >
                    <button className="absolute top-4 right-4 text-white" onClick={toggleDropdown}>
                        X
                    </button>

                    <div className="flex flex-col items-center mt-8">
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
                            {userData?.level_perm === 'user' && (
                                // Substitua por:
                                <h3 className="text-white-600 text-lg font-semibold">
                                    {userData?.profession || 'Cargo não definido'}
                                </h3>
                            )}
                            {userData?.level_perm === 'dev' && (
                                // Substitua por:
                                <h3 className="text-white-600 text-lg font-semibold">
                                    {userData?.profession || 'Cargo não definido'}
                                </h3>
                            )}
                        </div>

                        <nav className="flex flex-col gap-4 w-full">
                            <MenuItem icon="/images/sidebar_homepage/dashboard.png" label="cR" href="/homepage" />
                            <MenuItem icon="/images/sidebar_homepage/agenda.png" label="AGENDA" href="homepage/agenda" />
                        </nav>

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
