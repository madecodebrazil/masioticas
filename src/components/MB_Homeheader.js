"use client";
import { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { getAuth, signOut } from 'firebase/auth';
import Sidebar from './Sidebar';

const MenuItem = ({ icon, label, href }) => (
    <motion.li
        whileHover={{ scale: 1.05 }}
        className="flex justify-start items-center w-full py-2 hover:bg-[#CE8F00] hover:rounded-lg transition-all duration-300"
    >
        <Link href={href} className="flex items-center gap-4 w-full p-4 border border-[rgba(255, 20, 147, 0.1)] rounded-lg">
            <div className="flex-shrink-0">
                <Image src={icon} width={30} height={30} alt={label} className="object-contain" />
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
            <div className="bg-[#932A83] w-full p-4 flex justify-between items-center lg:hidden z-30">
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

                <Link href="/homepage" className="mx-auto">
                    <Image
                        src="/images/logomasi_branca.png"
                        alt="Logo masi"
                        width={100}
                        height={50}
                        className="object-contain transition-all duration-300 hover:drop-shadow-[0_0_10px_rgba(255,255,0,0.8)]"
                    />
                </Link>

                <div className="flex items-center space-x-4">
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

                    <Image
                        src={userPhotoURL}
                        alt="User Avatar"
                        width={50}
                        height={50}
                        className="rounded-full border-2 border-white cursor-pointer"
                        onClick={toggleDropdown}
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

            {isDropdownOpen && (
                <motion.div
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    variants={dropdownVariants}
                    className="fixed top-0 right-0 w-[250px] h-full bg-[#932A83] text-white p-4 shadow-2xl drop-shadow-lg z-50"
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

                        <nav className="flex flex-col gap-4 w-full">
                            <MenuItem icon="/images/sidebar_homepage/dashboard.png" label="DASHBOARD" href="/homepage" />
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
