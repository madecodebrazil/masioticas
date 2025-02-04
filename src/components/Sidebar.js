import Link from 'next/link'; // Importa o Link do Next.js
import Image from 'next/image';

// Componente MenuItem modificado para usar Link diretamente
const MenuItem = ({ image, label, route }) => {
    return (
        <li className="p-2 cursor-pointer">
            <Link href={route} className="flex items-center hover:bg-yellow-600 transition-colors duration-300 rounded-lg p-2 max-w-xs inline-block">
                <Image src={image} width={25} height={25} alt={label} />
                <span className="ml-4 text-white">{label}</span>
            </Link>
        </li>
    );
};

// Componente Sidebar atualizado para ocupar uma largura menor em telas pequenas
const Sidebar = ({ showSidebar, hideSidebar }) => {
    return (
        <aside
            className={`fixed top-0 left-0 h-full w-[80vw] max-w-[300px] bg-[#932A83] transform ${
                showSidebar ? 'translate-x-0' : '-translate-x-full'
            } transition-transform duration-300 ease-in-out lg:translate-x-0 z-50`} // Adicionada a classe z-50 para z-index alto
        >
            <div className="flex flex-col justify-between h-full">
                <div>
                    <div className="flex justify-between items-center p-4">
                        {/* Logo */}
                        <Link href="/homepage">
                            <Image
                                src="/images/logomasi_branca.png"
                                alt="Logo"
                                width={80}
                                height={40}
                                className="object-contain hover:filter hover:brightness-0 hover:invert hover:drop-shadow-[0_4px_6px_rgba(255,255,0,0.6)] transition-all duration-300"
                            />
                        </Link>

                        {/* Botão para fechar a sidebar no mobile */}
                        <Image
                            src="/images/icons8-close-26.png"
                            width={24}
                            height={24}
                            alt="Close"
                            onClick={hideSidebar}
                            className="cursor-pointer lg:hidden" // Escondido em telas grandes
                        />
                    </div>

                    <ul className="space-y-4 mt-6">
                        {/* Itens do Menu com as rotas */}
                        <MenuItem image="/images/produtos.png" label="Produtos e Serviços" route="/products_and_services" />
                        <MenuItem image="/images/comercial.png" label="Comercial" route="/commercial" />
                        <MenuItem image="/images/pessoa.png" label="Clientes" route="/register/consumers" />
                        <MenuItem image="/images/caixa.png" label="Finanças" route="/finance" />
                        <MenuItem image="/images/cadastro.png" label="Cadastro" route="/register" />
                        <MenuItem image="/images/boxes.png" label="Estoque" route="/stock" />
                        <MenuItem image="/images/cobranca.png" label="Cobrança" route="/billing" />
                        <MenuItem image="/images/consulta.png" label="Consulta" route="/consultation" />
                    </ul>
                </div>

                <div className="absolute bottom-4 left-4 text-yellow-400 cursor-pointer">
                    <Link href="/login">Sair</Link>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
