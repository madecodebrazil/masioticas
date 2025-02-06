import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {  faHome, faHandshake, faCalendar } from '@fortawesome/free-solid-svg-icons';

const BottomMobileNav = () => {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkIsMobile = () => {
            // Define o estado isMobile como true se a largura da janela for menor ou igual a 768px
            setIsMobile(window.innerWidth <= 768);
        };

        // Verifica se é mobile na montagem do componente
        checkIsMobile();

        // Adiciona o listener para detectar quando a janela é redimensionada
        window.addEventListener('resize', checkIsMobile);

        // Remove o listener ao desmontar o componente
        return () => {
            window.removeEventListener('resize', checkIsMobile);
        };
    }, []);

    // Se não for mobile, não renderiza o menu
    if (!isMobile) return null;

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-[#81059e]/70 backdrop-filter backdrop-blur-sm p-2 flex justify-around items-center z-50">
            <Link href="/homepage">
                <div className="flex flex-col items-center hover:bg-purple-400 rounded-full p-3 transition-all duration-300 transform hover:p-1">
                   <FontAwesomeIcon icon={faHome} className='text-2xl flex items-center pl-2 pr-2 pt-2 pb-2 hover:rounded-lg'/>
                </div>
            </Link>
            <Link href="/finance">
                <div className="flex flex-col items-center hover:bg-purple-400 rounded-full p-3 transition-all duration-300 transform hover:p-1">
                <FontAwesomeIcon icon={faHandshake} className='text-2xl flex items-center pl-2 pr-2 pt-2 pb-2 hover:rounded-lg'/>
                </div>
            </Link>
           
            <Link href="/homepage/agenda">
                <div className="flex flex-col items-center hover:bg-purple-400 rounded-full p-3 transition-all duration-300 transform hover:p-1">
                <FontAwesomeIcon icon={faCalendar} className='text-2xl flex items-center pl-2 pr-2 pt-2 pb-2 hover:rounded-lg'/>
                </div>
            </Link>
        </nav>
    );
};

export default BottomMobileNav;
