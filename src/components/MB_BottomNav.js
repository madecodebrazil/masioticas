import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHandshake, faCalendar } from '@fortawesome/free-solid-svg-icons';

const BottomMobileNav = ({ sidebarOpen }) => {
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
        <nav className={`fixed bottom-0 left-0 right-0 bg-[#81059e]/70 backdrop-filter backdrop-blur-sm flex justify-around items-center ${sidebarOpen ? 'z-30' : 'z-40'}`}>
            <Link href="/homepage">
                <div className="flex flex-col items-center hover:bg-purple-400 rounded-full p-2 transition-all duration-300 transform hover:p-1">
                <Image 
                        src="/images/nav-mobile/home.png" 
                        alt="Home" 
                        width={70} 
                        height={70} 
                        className="text-white"
                    />
                </div>
            </Link>
            <Link href="/finance">
                <div className="flex flex-col items-center hover:bg-purple-400 rounded-full p-2 transition-all duration-300 transform hover:p-1">
                <Image 
                        src="/images/nav-mobile/finance.png" 
                        alt="Home" 
                        width={70} 
                        height={70} 
                        className="text-white"
                    />
                </div>
            </Link>

            <Link href="/sales">
                <div className="flex flex-col items-center hover:bg-purple-400 rounded-full p-2 transition-all duration-300 transform hover:p-1">
                <Image 
                        src="/images/nav-mobile/sales.png" 
                        alt="Home" 
                        width={70} 
                        height={70} 
                        className="text-white"
                    />
                </div>
            </Link>
           
            <Link href="/commercial">
                <div className="flex flex-col items-center hover:bg-purple-400 rounded-full p-2 transition-all duration-300 transform hover:p-1">
                <Image 
                        src="/images/nav-mobile/agenda.png" 
                        alt="Home" 
                        width={70} 
                        height={70} 
                        className="text-white"
                    />
                </div>
            </Link>
        </nav>
    );
};

export default BottomMobileNav;