"use client";
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartSimple, faMoneyBillTransfer, faCalendarDay, faCoins, faGear } from '@fortawesome/free-solid-svg-icons';


export default function SidebarHomepage({ userPhotoURL, userData, currentPage }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Estado para controlar a exibição da sidebar no mobile

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

    return (
        <>
            {/* Sidebar no mobile como um dropdown na lateral direita */}
            <aside
                className={`fixed top-0 right-0 w-[250px] h-full bg-green-300 text-white p-4 shadow-xl transition-transform duration-300 z-50 ${isSidebarOpen ? 'block' : 'hidden'
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
                        src={userPhotoURL}
                        alt="User Avatar"
                        width={80}
                        height={80}
                        className="rounded-full mb-4 border-2 border-white"
                    />
                    <div className="text-center mb-6">
                        <h2 className="text-white text-xl font-bold mb-1">
                            {userData?.name || 'Dev Account'}
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
                </div>
            </aside>

            {/* Sidebar padrão para desktop */}
            <aside className="w-[250px] h-full text-white flex-col items-center p-4 hidden md:flex">
                {/* Logotipo com link para /homepage */}
                <Link href="/homepage">
                    <Image
                        src="/images/logomasi_branca.png"
                        alt="Logo Masi Eyewear"
                        width={120}
                        height={60}
                        className="mb-8 cursor-pointer transition-all duration-300 hover:drop-shadow-[0_0_10px_rgba(255,255,0,0.8)]"
                    />
                </Link>

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
                        <h3 className="text-white-600 text-base">
                            Desenvolvedor(a)
                        </h3>
                    )}
                </div>

                {/* Menu lateral */}
                <nav className="flex flex-col gap-4 w-full">
                    <Link href="/homepage">
                        <div className={`${getLinkStyle('dashboard')} text-white text-lg rounded-lg py-2 px-4 w-full text-center shadow-lg flex items-center justify-start gap-4 hover:bg-[#D4A017] transition-colors duration-300`}>
                            <FontAwesomeIcon icon={faChartSimple} />

                            <span className="text-white font-medium">Dashboard</span>
                        </div>
                    </Link>


                    <Link href="/homepage/agenda">
                        <div className={`${getLinkStyle('agenda')} text-white rounded-lg py-2 px-4 w-full text-center shadow-lg flex items-center justify-start gap-4 hover:bg-[#D4A017] transition-colors duration-300`}>
                        <FontAwesomeIcon icon={faCalendarDay} />
                            <span className="text-white text-lg font-medium">Agenda</span>
                        </div>
                    </Link>


                    <Link href="/commercial/sales">
                        <div className={`${getLinkStyle('agenda')} text-white rounded-lg py-2 px-4 w-full text-center shadow-lg flex items-center justify-start gap-4 hover:bg-[#D4A017] transition-colors duration-300`}>
                        <FontAwesomeIcon icon={faMoneyBillTransfer} />
                            <span className="text-white text-lg font-medium">Vendas</span>
                        </div>
                    </Link>

                    <Link href="/finance">
                        <div className={`${getLinkStyle('agenda')} text-white rounded-lg py-2 px-4 w-full text-center shadow-lg flex items-center justify-start gap-4 hover:bg-[#D4A017] transition-colors duration-300`}>
                        <FontAwesomeIcon icon={faCoins} />
                            <span className="text-white text-lg font-medium">Financeiro</span>
                        </div>
                    </Link>

                    <Link href="/homepage/agenda">
                        <div className={`${getLinkStyle('agenda')} text-white rounded-lg py-2 px-4 w-full text-center shadow-lg flex items-center justify-start gap-4 hover:bg-[#D4A017] transition-colors duration-300`}>
                        <FontAwesomeIcon icon={faGear} />
                            <span className="text-white text-lg font-medium">Configurações</span>
                        </div>
                    </Link>



                </nav>
            </aside>
        </>
    );
}
