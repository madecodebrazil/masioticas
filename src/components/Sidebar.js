"use client";

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faX } from '@fortawesome/free-solid-svg-icons';
import {
  Wallet,
  ShoppingCart,
  Package,
  Wrench,
  FileText,
  Activity,
  Users,
  Briefcase,
  CreditCard
} from 'lucide-react';

const MenuItem = ({ icon: Icon, label, route, isActive }) => {
  return (
    <li>
      <Link
        href={route}
        className={`flex items-center transition-colors duration-200 rounded-lg p-4 text-white relative
          ${isActive
            ? 'bg-purple-700 font-semibold shadow-md'
            : 'hover:bg-purple-700/40'}`}
      >
        <Icon className="w-6 h-6 min-w-6" />
        <span className="ml-4 text-base font-medium">{label}</span>
        {isActive && <div className="w-1.5 h-10 bg-white rounded-l-md absolute right-0"></div>}
      </Link>
    </li>
  );
};

const Sidebar = ({ showSidebar, hideSidebar }) => {
  // Use useState para guardar o pathname
  const [currentPath, setCurrentPath] = useState('');
  // Use hook usePathname do Next.js
  const pathname = usePathname();

  // Atualizar o currentPath quando o pathname mudar
  useEffect(() => {
    if (pathname) {
      setCurrentPath(pathname);
    }
  }, [pathname]);

  // Efeito para controlar o scroll do body quando o sidebar está aberto no mobile
  useEffect(() => {
    if (showSidebar) {
      // Bloqueia o scroll do body quando o sidebar está aberto no mobile
      document.body.classList.add('overflow-hidden', 'lg:overflow-auto');
    } else {
      // Reativa o scroll quando o sidebar está fechado
      document.body.classList.remove('overflow-hidden', 'lg:overflow-auto');
    }

    // Limpeza ao desmontar o componente
    return () => {
      document.body.classList.remove('overflow-hidden', 'lg:overflow-auto');
    };
  }, [showSidebar]);

  const menuItems = [
    { icon: Wallet, label: "Financeiro", route: "/finance" },
    { icon: ShoppingCart, label: "Vendas", route: "/sales" },
    { icon: Package, label: "Estoque", route: "/stock" },
    { icon: Wrench, label: "Produtos", route: "/products_and_services" },
    { icon: FileText, label: "Cadastro", route: "/register" },
    { icon: Activity, label: "Consultas", route: "/consultation" },
    { icon: Users, label: "Clientes", route: "/register/consumers" },
    { icon: Briefcase, label: "Comercial", route: "/commercial" },
    { icon: CreditCard, label: "Cobrança", route: "/billing" }
  ];

  // Função segura para verificar se a rota atual é ativa
  const checkIsActive = (itemRoute) => {
    if (!currentPath) return false;

    if (currentPath === itemRoute) return true;

    if (itemRoute !== '/' && itemRoute.length > 1 && currentPath.startsWith(itemRoute)) {
      return true;
    }

    return false;
  };

  return (
    <>
      {/* Overlay para fechar o menu no mobile */}
      {showSidebar && (
        <div
          className="fixed inset-0 bg-black/50 lg:hidden z-40 backdrop-blur-sm"
          onClick={hideSidebar}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-screen w-72  bg-[#81059e] 
          transform ${showSidebar ? "translate-x-0" : "-translate-x-full"} 
          transition-transform duration-300 ease-in-out lg:translate-x-0 z-50`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="px-6 py-4 flex justify-between items-center">
            <Link href="/homepage" className="flex items-center">
              <Image
                src="/images/masioticas.png"
                alt="Logo Masi"
                width={120}
                height={60}
                className="object-contain hover:brightness-110 transition-all duration-300 max-w-[120px] max-h-[60px]"
              />
            </Link>

            <button
              onClick={hideSidebar}
              className="p-1.5 rounded-lg hover:bg-purple-800 text-white lg:hidden"
              aria-label="Fechar menu"
            >
              <FontAwesomeIcon icon={faX} className="text-xl" />
            </button>
          </div>

          {/* Menu Items */}
          <div className="flex-1 overflow-y-auto custom-scroll">
            <nav className="px-4 py-6">
              <ul className="space-y-2">
                {menuItems.map((item, index) => (
                  <MenuItem
                    key={index}
                    icon={item.icon}
                    label={item.label}
                    route={item.route}
                    isActive={checkIsActive(item.route)}
                  />
                ))}
              </ul>
            </nav>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;