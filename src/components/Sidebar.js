import Link from 'next/link';
import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faX } from '@fortawesome/free-solid-svg-icons';
import FinanceIcon from './icons/FinanceIcon';
import {
  Wallet,
  ShoppingCart,
  Package,
  Wrench,
  FileText,
  Search,
  Users,
  Briefcase,
  CreditCard
} from 'lucide-react';

const MenuItem = ({ icon: Icon, label, route }) => {
  return (
    <li className="p-2 cursor-pointer">
      <Link href={route} className="flex items-center hover:bg-purple-300 transition-colors duration-300 rounded-lg p-2 max-w-xs inline-block">
        <Icon className="w-6 h-6 text-white" />
        <span className="ml-4 text-white">{label}</span>
      </Link>
    </li>
  );
};

const Sidebar = ({ showSidebar, hideSidebar }) => {
  const menuItems = [
    { icon: Wallet, label: "Financeiro", route: "/finance" },
    { icon: ShoppingCart, label: "Vendas", route: "/commercial/sales" },
    { icon: Package, label: "Estoque", route: "/stock" },
    { icon: Wrench, label: "Serviços", route: "/products_and_services" },
    { icon: FileText, label: "Cadastro", route: "/register" },
    { icon: Search, label: "Consultas", route: "/commercial" },
    { icon: Users, label: "Clientes", route: "/register/consumers" },
    { icon: Briefcase, label: "Comercial", route: "/commercial" },
    { icon: CreditCard, label: "Cobrança", route: "/billing" }
  ];

  return (
    <aside
      className={`fixed top-0 left-0 h-[600px] w-[80vw] max-w-[300px] bg-[#81059e] transform ${
        showSidebar ? "translate-x-0" : "-translate-x-full"
      } transition-transform duration-300 ease-in-out lg:translate-x-0 z-50`}
    >
      <div className="flex flex-col h-full">
        <div className="p-4 flex justify-between items-center">
          <Link href="/homepage">
            <Image
              src="/images/logomasi_branca.png"
              alt="Logo"
              width={80}
              height={40}
              className="object-contain hover:filter hover:brightness-0 hover:invert hover:drop-shadow-lg transition-all duration-300"
            />
          </Link>

          <FontAwesomeIcon
            icon={faX}
            className="text-xl p-2 hover:rounded-lg cursor-pointer text-white lg:hidden"
            onClick={hideSidebar}
          />
        </div>

        <div className="flex-grow overflow-y-auto custom-scroll">
          <ul className="space-y-4 mt-4 mb-4 px-4 ">
            {menuItems.map((item, index) => (
              <MenuItem
                key={index}
                icon={item.icon}
                label={item.label}
                route={item.route}
              />
            ))}
          </ul>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;