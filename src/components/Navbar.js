import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars } from '@fortawesome/free-solid-svg-icons';
import Image from 'next/image';

// Componente Navbar, apenas para mobile
const Navbar = ({ toggleSidebar }) => {
    return (
        <nav className="bg-yellow-400 text-white fixed w-full top-0 z-50 lg:hidden"> {/* Cor atualizada e removida a sombra */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
                {/* Logo Centralizada */}
                <div className="flex justify-center w-full">
                    <Image src="/images/logomasi_Branca.png" alt="Logo" width={120} height={40} /> {/* Redimensionada para 120x40 */}
                </div>
                {/* Ícone de menu para abrir a Sidebar em mobile */}
                <button
                    onClick={toggleSidebar}
                    className="p-2  hover:bg-pink-600 text-white rounded-md absolute right-4"
                >
                    <FontAwesomeIcon icon={faBars} size="lg" /> {/* Ícone de menu do Font Awesome */}
                </button>
            </div>
        </nav>
    );
};

export default Navbar;
