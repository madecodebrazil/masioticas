// components/ModalOrcamento.js
import { useState, useEffect, useRef } from 'react';
import {
    collection, getDocs, doc, getDoc, addDoc, serverTimestamp
} from 'firebase/firestore';
import { FiPrinter, FiUser, FiSearch, FiPlus, FiX, FiShoppingCart, 
         FiDollarSign, FiCheck, FiFileText, FiCalendar, FiClock, 
         FiPercent, FiSend, FiAlertCircle} from 'react-icons/fi';
import { firestore } from '@/lib/firebaseConfig';
import { useAuth } from '@/hooks/useAuth';
import CarrinhoCompras from './CarrinhoCompras';
import ClientForm from './ClientForm';

function removerValoresUndefined(obj) {
    // Se for null, undefined ou não for um objeto, retornar null
    if (obj === null || obj === undefined || typeof obj !== 'object') {
        return obj === undefined ? null : obj;
    }

    // Se for um array, processar cada item
    if (Array.isArray(obj)) {
        return obj.map(item => removerValoresUndefined(item));
    }

    // Se for um objeto, processar cada propriedade
    const resultado = {};
    for (const chave in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, chave)) {
            // Substituir undefined por null
            const valor = obj[chave] === undefined ? null : removerValoresUndefined(obj[chave]);
            resultado[chave] = valor;
        }
    }

    return resultado;
}

const ModalOrcamento = ({ isOpen, onClose, selectedLoja }) => {
    // Estado para gerenciamento de clientes
    const [searchTerm, setSearchTerm] = useState('');
    const [clients, setClients] = useState([]);
    const [filteredClients, setFilteredClients] = useState([]);
    const [selectedClient, setSelectedClient] = useState(null);
    const [showClientForm, setShowClientForm] = useState(false);

    // Estados para gerenciamento de produtos
    const [products, setProducts] = useState([]);
    const [cartItems, setCartItems] = useState([]);

    // Estados para descontos e observações
    const [discount, setDiscount] = useState(0);
    const [discountType, setDiscountType] = useState('percentage'); // 'percentage' ou 'value'
    const [observation, setObservation] = useState('');

    // Estados para validade do orçamento
    const [validadeOrcamento, setValidadeOrcamento] = useState(7); // Padrão: 7 dias

    // Estados para controle de processamento
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [orcamentoId, setOrcamentoId] = useState(null);

    // Informações sobre o orçamento
    const [responsavel, setResponsavel] = useState('');
    const [dataOrcamento, setDataOrcamento] = useState(new Date());

    // Obtém informações do usuário atual
    const { user, userData } = useAuth();

    // Buscar dados iniciais quando o componente montar
    useEffect(() => {
        if (isOpen && selectedLoja) {
            fetchClients();
            fetchProducts();

            // Definir responsável automaticamente
            if (userData) {
                setResponsavel(userData.nome || user?.email || 'Atendente');
            }

            // Definir data atual
            setDataOrcamento(new Date());
        }
    }, [isOpen, selectedLoja, userData, user]);

    // Carregar clientes do Firebase
    const fetchClients = async () => {
        try {
            setLoading(true);
            const clientsRef = collection(firestore, 'lojas/clientes/users');
            const querySnapshot = await getDocs(clientsRef);

            const clientsList = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            setClients(clientsList);
        } catch (err) {
            console.error('Erro ao buscar clientes:', err);
            setError('Falha ao carregar lista de clientes');
        } finally {
            setLoading(false);
        }
    };

    // Carregar produtos do estoque
    const fetchProducts = async () => {
        try {
            setLoading(true);
            setError('');

            // Categorias de produtos a serem buscadas
            const categorias = ['armacoes', 'lentes', 'solares'];
            let allProducts = [];

            // Caminho correto conforme a estrutura do Firebase: estoque > loja1 > armacoes
            for (const categoria of categorias) {
                try {
                    const productsRef = collection(firestore, `estoque/${selectedLoja}/${categoria}`);
                    const querySnapshot = await getDocs(productsRef);

                    console.log(`Categoria ${categoria}: encontrados ${querySnapshot.size} produtos`);

                    // Mapear documentos para o formato esperado
                    const categoryProducts = querySnapshot.docs.map(doc => {
                        const data = doc.data();
                        return {
                            id: doc.id,
                            categoria: categoria,
                            nome: data.nome || data.titulo || data.info_geral?.nome || `Produto ${doc.id}`,
                            marca: data.marca || data.info_geral?.marca || "Sem marca",
                            codigo: data.codigo || data.info_geral?.codigo || doc.id,
                            preco: data.preco || data.valor || data.info_geral?.preco || 0,
                            quantidade: data.quantidade || 0,
                            info_geral: data.info_geral || {
                                nome: data.nome || `Produto ${doc.id}`,
                                marca: data.marca || "Sem marca",
                                codigo: data.codigo || doc.id,
                                preco: data.preco || data.valor || 0
                            },
                            info_adicional: data.info_adicional || {}
                        };
                    });

                    allProducts = [...allProducts, ...categoryProducts];
                } catch (err) {
                    console.error(`Erro ao buscar categoria ${categoria}:`, err);
                }
            }

            // Se encontrou produtos, define no estado
            if (allProducts.length > 0) {
                // Filtrar produtos com quantidade disponível
                const productsWithStock = allProducts.filter(product =>
                    (product.quantidade || 0) > 0
                );

                // Se não houver produtos com estoque, usar todos os produtos
                if (productsWithStock.length === 0) {
                    console.log('Nenhum produto com estoque. Mostrando todos os produtos.');
                    setProducts(allProducts);
                } else {
                    setProducts(productsWithStock);
                }
            } else {
                console.error('Nenhum produto encontrado no estoque!');
                setError('Nenhum produto encontrado no estoque. Verifique a estrutura do banco de dados.');
            }

        } catch (err) {
            console.error('Erro ao buscar produtos:', err);
            setError('Falha ao carregar lista de produtos');
        } finally {
            setLoading(false);
        }
    };

    // Filtrar clientes com base no termo de busca
    useEffect(() => {
        if (searchTerm.trim() === '') {
            setFilteredClients([]);
        } else {
            const filtered = clients.filter(client =>
                client.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                client.cpf?.includes(searchTerm.replace(/\D/g, ''))
            );
            setFilteredClients(filtered);
        }
    }, [searchTerm, clients]);

    // Calcular subtotal
    const calculateSubtotal = () => {
        return cartItems.reduce((total, item) =>
            total + ((item.preco || item.valor || item.info_geral?.preco || 0) * item.quantity), 0
        );
    };

    // Calcular desconto
    const calculateDiscount = () => {
        const subtotal = calculateSubtotal();
        if (discountType === 'percentage') {
            return (subtotal * discount) / 100;
        } else {
            return discount;
        }
    };

    // Calcular total
    const calculateTotal = () => {
        const subtotal = calculateSubtotal();
        const discountAmount = calculateDiscount();
        return subtotal - discountAmount;
    };

    // Handler para selecionar cliente
    const handleSelectClient = (client) => {
        setSelectedClient(client);
        setSearchTerm('');
        setFilteredClients([]);
    };

    // Formatar valor como moeda
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    // Calcular data de validade
    const calcularDataValidade = () => {
        const dataValidade = new Date(dataOrcamento);
        dataValidade.setDate(dataValidade.getDate() + validadeOrcamento);
        return dataValidade;
    };

    // Gerar código de orçamento
    const gerarCodigoOrcamento = () => {
        const prefix = 'ORC';
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `${prefix}${timestamp}${random}`;
    };

    // Finalizar orçamento
    const finalizarOrcamento = async () => {
        if (cartItems.length === 0) {
            setError('Adicione pelo menos um produto ao orçamento');
            return;
        }

        if (!selectedClient) {
            setError('Selecione um cliente para continuar');
            return;
        }

        try {
            setLoading(true);

            const subtotal = calculateSubtotal();
            const discountAmount = calculateDiscount();
            const total = calculateTotal();
            const codigoOrcamento = gerarCodigoOrcamento();
            const dataValidade = calcularDataValidade();

            // Estrutura do orçamento
            const orcamento = {
                codigo: codigoOrcamento,
                cliente: {
                    id: selectedClient.id,
                    nome: selectedClient.nome,
                    cpf: selectedClient.cpf,
                    telefone: selectedClient.telefone || '',
                    email: selectedClient.email || ''
                },
                produtos: cartItems.map(item => ({
                    id: item.id,
                    categoria: item.categoria,
                    nome: item.nome || item.info_geral?.nome,
                    codigo: item.codigo || item.info_geral?.codigo,
                    marca: item.marca || item.info_geral?.marca,
                    preco: item.preco || item.valor || item.info_geral?.preco,
                    quantidade: item.quantity,
                    total: (item.preco || item.valor || item.info_geral?.preco || 0) * item.quantity
                })),
                subtotal: subtotal,
                desconto: {
                    tipo: discountType,
                    valor: discount,
                    total: discountAmount
                },
                total: total,
                data_criacao: serverTimestamp(),
                validade: dataValidade,
                dias_validade: validadeOrcamento,
                status: 'ativo', // ativo, expirado, convertido
                observacao: observation,
                responsavel: {
                    id: user?.uid,
                    nome: responsavel
                },
                loja: selectedLoja,
                historico: [
                    {
                        data: serverTimestamp(),
                        acao: 'criacao',
                        responsavel: responsavel,
                        detalhes: 'Orçamento criado'
                    }
                ]
            };

            // Salvar no Firestore
            const orcamentoRef = collection(firestore, `lojas/${selectedLoja}/orcamentos`);
            const novoOrcamentoRef = await addDoc(orcamentoRef, orcamento);

            // Atualizar estado para mostrar sucesso
            setOrcamentoId(codigoOrcamento);
            setSuccess(true);

        } catch (err) {
            console.error('Erro ao finalizar orçamento:', err);
            setError('Falha ao processar o orçamento. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    // Fechar modal e redefinir estados
    const handleClose = () => {
        setSearchTerm('');
        setSelectedClient(null);
        setCartItems([]);
        setShowClientForm(false);
        setDiscount(0);
        setDiscountType('percentage');
        setObservation('');
        setError('');
        setSuccess(false);
        setOrcamentoId(null);
        setValidadeOrcamento(7);
        onClose();
    };

    // Verificar se há itens no orçamento e um cliente selecionado
    const canFinalize = () => {
        return cartItems.length > 0 && selectedClient;
    };

    // Enviar orçamento por WhatsApp
    const enviarPorWhatsApp = () => {
        if (!selectedClient || !selectedClient.telefone) {
            setError('O cliente selecionado não tem telefone cadastrado');
            return;
        }

        const telefone = selectedClient.telefone.replace(/\D/g, '');
        
        // Construir a mensagem para o WhatsApp
        let mensagem = `*Orçamento MASI Óticas - ${orcamentoId}*\n\n`;
        mensagem += `Olá ${selectedClient.nome}, segue o orçamento solicitado:\n\n`;
        
        // Adicionar produtos
        mensagem += "*Produtos:*\n";
        cartItems.forEach((item, index) => {
            mensagem += `${index + 1}. ${item.nome} - ${item.marca || 'Sem marca'}\n`;
            mensagem += `   ${item.quantity} x ${formatCurrency(item.preco || item.valor || 0)} = ${formatCurrency((item.preco || item.valor || 0) * item.quantity)}\n`;
        });
        
        // Adicionar valores
        mensagem += `\n*Subtotal:* ${formatCurrency(calculateSubtotal())}\n`;
        if (discount > 0) {
            mensagem += `*Desconto${discountType === 'percentage' ? ` (${discount}%)` : ''}:* ${formatCurrency(calculateDiscount())}\n`;
        }
        mensagem += `*Valor Total:* ${formatCurrency(calculateTotal())}\n\n`;
        
        // Adicionar validade
        const dataValidadeFormatada = calcularDataValidade().toLocaleDateString('pt-BR');
        mensagem += `Este orçamento é válido até ${dataValidadeFormatada} (${validadeOrcamento} dias).\n\n`;
        
        // Adicionar observação se houver
        if (observation) {
            mensagem += `*Observações:* ${observation}\n\n`;
        }
        
        // Adicionar mensagem de fechamento
        mensagem += "Agradecemos a preferência. Para confirmar este orçamento ou tirar dúvidas, entre em contato conosco.";
        
        // Criar URL para o WhatsApp
        const whatsappUrl = `https://wa.me/55${telefone}?text=${encodeURIComponent(mensagem)}`;
        
        // Abrir em uma nova janela
        window.open(whatsappUrl, '_blank');
    };

    // Renderizar informações de sucesso após finalizar o orçamento
    const renderSuccess = () => {
        const dataValidadeFormatada = calcularDataValidade().toLocaleDateString('pt-BR');
        
        return (
            <div className="p-8 text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                    <FiCheck className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-lg font-medium text-green-600 mb-2">Orçamento Criado com Sucesso!</h3>
                <p className="text-sm text-gray-500 mb-1">Código: {orcamentoId}</p>
                <p className="text-sm text-gray-500 mb-4">Válido até: {dataValidadeFormatada}</p>

                {/* Resumo dos produtos */}
                <div className="mb-6 p-4 border-2 border-gray-200 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-700 mb-3">Resumo do Orçamento</h4>

                    <table className="w-full text-sm text-left mb-4">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                            <tr>
                                <th className="px-4 py-2">Produto</th>
                                <th className="px-4 py-2">Qtd</th>
                                <th className="px-4 py-2 text-right">Valor</th>
                            </tr>
                        </thead>
                        <tbody>
                            {cartItems.map((item, index) => (
                                <tr key={index} className="border-b">
                                    <td className="px-4 py-2">
                                        <div className="font-medium">{item.nome || "Produto sem nome"}</div>
                                        <div className="text-xs text-gray-500">{item.marca}</div>
                                    </td>
                                    <td className="px-4 py-2">{item.quantity}</td>
                                    <td className="px-4 py-2 text-right">{formatCurrency((item.preco || item.valor || 0) * item.quantity)}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="bg-gray-50">
                                <td colSpan="2" className="px-4 py-2 font-medium">Subtotal</td>
                                <td className="px-4 py-2 text-right">{formatCurrency(calculateSubtotal())}</td>
                            </tr>
                            {discount > 0 && (
                                <tr className="bg-gray-50">
                                    <td colSpan="2" className="px-4 py-2 font-medium text-green-600">
                                        Desconto {discountType === 'percentage' ? `(${discount}%)` : ''}
                                    </td>
                                    <td className="px-4 py-2 text-right text-green-600">
                                        -{formatCurrency(calculateDiscount())}
                                    </td>
                                </tr>
                            )}
                            <tr className="bg-gray-50">
                                <td colSpan="2" className="px-4 py-2 font-bold text-[#81059e]">Total</td>
                                <td className="px-4 py-2 text-right font-bold text-[#81059e]">{formatCurrency(calculateTotal())}</td>
                            </tr>
                        </tfoot>
                    </table>

                    {observation && (
                        <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                            <h5 className="font-medium text-yellow-700 mb-1">Observações:</h5>
                            <p className="text-sm text-gray-700">{observation}</p>
                        </div>
                    )}
                </div>

                <div className="flex justify-center space-x-4">
                    <button
                        onClick={handleClose}
                        className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-[#81059e] border border-transparent rounded-md hover:bg-[#6f0486]"
                    >
                        Concluir
                    </button>

                    <button
                        onClick={() => {
                            // Lógica para imprimir orçamento
                            // Por enquanto apenas simula a impressão
                            window.print();
                        }}
                        className="inline-flex justify-center px-4 py-2 text-sm font-medium text-[#81059e] bg-white border border-[#81059e] rounded-md hover:bg-purple-50"
                    >
                        <FiPrinter className="mr-2" /> Imprimir Orçamento
                    </button>

                    {selectedClient?.telefone && (
                        <button
                            onClick={enviarPorWhatsApp}
                            className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700"
                        >
                            <FiSend className="mr-2" /> Enviar por WhatsApp
                        </button>
                    )}
                </div>
            </div>
        );
    };

    // Se o modal não estiver aberto, não renderiza nada
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                    <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                </div>

                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-5xl sm:w-full">
                    {/* Cabeçalho do modal */}
                    <div className="bg-[#81059e] px-4 py-3 sm:px-6 flex justify-between items-center">
                        <h3 className="text-lg leading-6 font-medium text-white flex items-center gap-2">
                            <FiFileText className="mr-1" /> Novo Orçamento
                        </h3>
                        <button
                            onClick={handleClose}
                            className="bg-[#81059e] rounded-md text-white hover:text-gray-200 focus:outline-none"
                        >
                            <FiX size={24} />
                        </button>
                    </div>

                    {/* Corpo do modal */}
                    {success ? (
                        renderSuccess()
                    ) : (
                        <div className="bg-white p-6">
                            {/* Exibir mensagem de erro */}
                            {error && (
                                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
                                    <p>{error}</p>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Coluna da esquerda: Detalhes do orçamento */}
                                <div>
                                    {/* Data e Responsável */}
                                    <div className="mb-4">
                                        <div className="flex">
                                            <div className="flex items-center gap-2">
                                                <FiCalendar className="text-[#81059e]" />
                                                <span className="font-medium">Data:</span>
                                                <span>{dataOrcamento.toLocaleDateString('pt-BR')}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <FiUser className="text-[#81059e]" />
                                            <span className="font-medium">Responsável:</span>
                                            <span>{responsavel}</span>
                                        </div>
                                    </div>

                                    {/* Seleção de Cliente */}
                                    <div className="mb-8 mt-8">
                                        <label className="block text-[#81059e] font-medium mb-1 flex items-center gap-1">
                                            <FiUser /> Cliente
                                        </label>

                                        {showClientForm ? (
                                            <div className="border-2 border-[#81059e] rounded-lg p-4">
                                                <div className="flex justify-between items-center mb-4">
                                                    <h3 className="font-medium text-[#81059e]">Adicionar Novo Cliente</h3>
                                                    <button
                                                        onClick={() => setShowClientForm(false)}
                                                        className="text-gray-500 hover:text-gray-700"
                                                    >
                                                        <FiX size={20} />
                                                    </button>
                                                </div>
                                                <ClientForm
                                                    selectedLoja={selectedLoja}
                                                    onSuccessRedirect={() => {
                                                        setShowClientForm(false);
                                                        fetchClients(); // Atualizar a lista após adicionar
                                                    }}
                                                    userId={user?.uid}
                                                    userName={userData?.nome || user?.email}
                                                />
                                            </div>
                                        ) : (
                                            <>
                                                <div className="flex gap-2">
                                                    <div className="relative flex-1">
                                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                            <FiSearch className="text-gray-400" />
                                                        </div>
                                                        <input
                                                            type="text"
                                                            value={searchTerm}
                                                            onChange={(e) => setSearchTerm(e.target.value)}
                                                            className="border-2 border-[#81059e] pl-10 p-2 rounded-lg w-full"
                                                            placeholder="Buscar cliente por nome ou CPF"
                                                        />
                                                        {filteredClients.length > 0 && (
                                                            <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-300 max-h-60 overflow-auto">
                                                                {filteredClients.map(client => (
                                                                    <div
                                                                        key={client.id}
                                                                        className="p-2 hover:bg-purple-50 cursor-pointer border-b last:border-b-0"
                                                                        onClick={() => handleSelectClient(client)}
                                                                    >
                                                                        <div className="font-medium">{client.nome}</div>
                                                                        {client.cpf && <div className="text-sm text-gray-600">CPF: {client.cpf}</div>}
                                                                        {client.telefone && <div className="text-sm text-gray-600">Tel: {client.telefone}</div>}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <button
                                                        onClick={() => setShowClientForm(true)}
                                                        className="bg-[#81059e] text-white p-2 rounded-lg flex items-center"
                                                        title="Adicionar novo cliente"
                                                    >
                                                        <FiPlus />
                                                    </button>
                                                </div>

                                                {selectedClient && (
                                                    <div className="mt-2 p-3 border-2 border-purple-100 rounded-lg bg-purple-50">
                                                        <div className="flex justify-between items-center">
                                                            <div>
                                                                <h3 className="font-semibold text-[#81059e]">{selectedClient.nome}</h3>
                                                                {selectedClient.cpf && <p className="text-gray-600 text-sm">CPF: {selectedClient.cpf}</p>}
                                                                {selectedClient.telefone && <p className="text-gray-600 text-sm">Tel: {selectedClient.telefone}</p>}
                                                                {selectedClient.email && <p className="text-gray-600 text-sm">Email: {selectedClient.email}</p>}
                                                            </div>
                                                            <button
                                                                onClick={() => setSelectedClient(null)}
                                                                className="text-[#81059e] hover:text-[#6f0486]"
                                                            >
                                                                <FiX size={20} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>

                                    {/* Seleção e Lista de Produtos */}
                                    <div className="mb-4">
                                        <label className="block text-[#81059e] font-medium mb-1 flex items-center gap-1">
                                            <FiShoppingCart /> Produtos
                                        </label>

                                        {/* Tabela de Itens no Carrinho */}
                                        <div className="border-2 border-gray-200 rounded-lg overflow-hidden">
                                            <CarrinhoCompras
                                                products={products}
                                                cartItems={cartItems}
                                                setCartItems={setCartItems}
                                                selectedLoja={selectedLoja}
                                                updateCartValue={(subtotal) => {
                                                    // Esta função propaga os valores calculados no carrinho para o modal principal
                                                    // Não precisa fazer nada aqui, pois o cálculo já é feito corretamente em calculateSubtotal
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {/* Observações */}
                                    <div className="mb-4">
                                        <label className="block text-[#81059e] font-medium mb-1 flex items-center gap-1">
                                            <FiFileText /> Observações
                                        </label>
                                        <textarea
                                            value={observation}
                                            onChange={(e) => setObservation(e.target.value)}
                                            className="border-2 border-[#81059e] p-2 rounded-lg w-full h-20"
                                            placeholder="Observações sobre o orçamento ou especificações para montagem do óculos..."
                                        />
                                    </div>
                                </div>

                                {/* Coluna da direita: Validade e Totais */}
                                <div>
                                    {/* Validade do orçamento */}
                                    <div className="mb-4">
                                        <label className="block text-[#81059e] font-medium mb-1 flex items-center gap-1">
                                            <FiClock /> Validade do Orçamento
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                min="1"
                                                max="90"
                                                value={validadeOrcamento}
                                                onChange={(e) => setValidadeOrcamento(parseInt(e.target.value) || 7)}
                                                className="border-2 border-[#81059e] p-2 rounded-lg w-24"
                                            />
                                            <span className="text-gray-600">dias</span>
                                            <span className="ml-2 text-sm text-gray-500">
                                                (válido até {calcularDataValidade().toLocaleDateString('pt-BR')})
                                            </span>
                                        </div>
                                    </div>

                                    {/* Desconto */}
                                    <div className="mb-4">
                                        <div className="flex justify-between items-center mb-2">
                                            <label className="block text-[#81059e] font-medium flex items-center gap-1">
                                                <FiPercent /> Desconto
                                            </label>
                                            <div className="flex">
                                                <button
                                                    type="button"
                                                    onClick={() => setDiscountType('percentage')}
                                                    className={`px-3 py-1 border first:rounded-l-md last:rounded-r-md ${discountType === 'percentage'
                                                        ? 'bg-[#81059e] text-white border-[#81059e]'
                                                        : 'bg-white text-gray-700 border-gray-300'
                                                        }`}
                                                >
                                                    %
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setDiscountType('value')}
                                                    className={`px-3 py-1 border first:rounded-l-md last:rounded-r-md ${discountType === 'value'
                                                        ? 'bg-[#81059e] text-white border-[#81059e]'
                                                        : 'bg-white text-gray-700 border-gray-300'
                                                        }`}
                                                >
                                                    R$
                                                </button>
                                            </div>
                                        </div>

                                        <input
                                            type="number"
                                            min="0"
                                            value={discount}
                                            onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                                            className="border-2 border-[#81059e] p-2 rounded-lg w-full"
                                            placeholder={discountType === 'percentage' ? "Desconto em %" : "Desconto em R$"}
                                        />
                                    </div>

                                    {/* Resumo do Orçamento */}
                                    <div className="bg-gray-50 p-4 rounded-lg mb-4">
                                        <h3 className="text-lg font-medium text-[#81059e] mb-4">Resumo do Orçamento</h3>

                                        <div className="space-y-2">
                                            <div className="flex justify-between">
                                                <span>Subtotal:</span>
                                                <span>{formatCurrency(calculateSubtotal())}</span>
                                            </div>

                                            {discount > 0 && (
                                                <div className="flex justify-between text-green-600">
                                                    <span>Desconto{discountType === 'percentage' ? ` (${discount}%)` : ''}:</span>
                                                    <span>- {formatCurrency(calculateDiscount())}</span>
                                                </div>
                                            )}

                                            <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-300">
                                                <span>Total:</span>
                                                <span className="text-[#81059e]">{formatCurrency(calculateTotal())}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Confirmação de Cliente */}
                                    {!selectedClient && (
                                        <div className="bg-yellow-50 p-4 rounded-lg mb-4 border border-yellow-200">
                                            <div className="flex items-start gap-2">
                                                <FiAlertCircle className="text-yellow-500 mt-0.5" />
                                                <div>
                                                    <h4 className="font-medium text-yellow-700">Cliente não selecionado</h4>
                                                    <p className="text-sm text-yellow-600">
                                                        Selecione um cliente para criar o orçamento.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Confirmação de Produtos */}
                                    {cartItems.length === 0 && (
                                        <div className="bg-yellow-50 p-4 rounded-lg mb-4 border border-yellow-200">
                                            <div className="flex items-start gap-2">
                                                <FiAlertCircle className="text-yellow-500 mt-0.5" />
                                                <div>
                                                    <h4 className="font-medium text-yellow-700">Orçamento vazio</h4>
                                                    <p className="text-sm text-yellow-600">
                                                        Adicione pelo menos um produto ao orçamento.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Botão de finalizar orçamento */}
                                    <button
                                        onClick={finalizarOrcamento}
                                        disabled={loading || !canFinalize()}
                                        className="w-full bg-[#81059e] text-white py-3 px-4 rounded-lg flex items-center justify-center font-medium hover:bg-[#6f0486] disabled:bg-purple-300 disabled:cursor-not-allowed"
                                    >
                                        {loading ? (
                                            <>
                                                <div className="animate-spin h-5 w-5 border-2 border-white rounded-full border-t-transparent mr-2"></div>
                                                Processando...
                                            </>
                                        ) : (
                                            <>
                                                <FiCheck className="mr-2" /> Finalizar Orçamento
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal de cadastro de cliente */}
            {showClientForm && (
                <div className="fixed inset-0 z-[60] overflow-y-auto bg-black bg-opacity-50">
                    <div className="flex items-center justify-center min-h-screen">
                        <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold text-[#81059e]">Cadastrar Novo Cliente</h2>
                                <button
                                    onClick={() => setShowClientForm(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <FiX size={24} />
                                </button>
                            </div>
                            <ClientForm
                                selectedLoja={selectedLoja}
                                onSuccessRedirect={() => {
                                    setShowClientForm(false);
                                    fetchClients(); // Atualizar a lista após adicionar
                                }}
                                userId={user?.uid}
                                userName={userData?.nome || user?.email}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ModalOrcamento;