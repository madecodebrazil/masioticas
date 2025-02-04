import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

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
        <nav className="fixed bottom-0 left-0 right-0 bg-[#932A83] p-4 flex justify-around items-center z-50">
            <Link href="/homepage">
                <div className="flex flex-col items-center hover:bg-[#D4A017] rounded-full p-3 transition-all duration-300 transform hover:scale-110">
                    <Image src="/images/nav-mobile/home.png" alt="Dashboard" width={24} height={24} />
                </div>
            </Link>
            <Link href="/finance">
                <div className="flex flex-col items-center hover:bg-[#D4A017] rounded-full p-3 transition-all duration-300 transform hover:scale-110">
                    <Image src="/images/nav-mobile/vendas.png" alt="Finance" width={24} height={24} />
                </div>
            </Link>
           
            <Link href="/homepage/agenda">
                <div className="flex flex-col items-center hover:bg-[#D4A017] rounded-full p-3 transition-all duration-300 transform hover:scale-110">
                    <Image src="/images/nav-mobile/agenda.png" alt="Calendar" width={24} height={24} />
                </div>
            </Link>
        </nav>
    );
};

export default BottomMobileNav;
