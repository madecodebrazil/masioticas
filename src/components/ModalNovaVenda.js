// src/components/ModalNovaVenda.js
import React, { useState, useEffect } from 'react';
import useModalNovaVenda from '../hooks/useModalNovaVenda';
import CarrinhoCompras from './CarrinhoCompras';
import PaymentMethodPanel from './PaymentMethodPanel';
import ClientSelectionPanel from './ClientSelectionPanel';
import CreditCardForm from './CreditCardForm';
import ClientForm from './ClientForm';
import PixQRCodeModal from './PixQRCodeModal';
import OSManager from './OSManager';
import TipoTransacaoSelector from './TipoTransacaoSelector';
import {
    FiClock,
    FiRefreshCw,
    FiMessageSquare,
    FiPrinter,
    FiUser,
    FiSearch,
    FiPlus,
    FiX,
    FiShoppingCart,
    FiDollarSign,
    FiCheck,
    FiFileText,
    FiTrash2,
    FiCreditCard,
    FiClipboard,
    FiCalendar,
    FiPlusCircle,
    FiGift,
    FiActivity,
    FiPercent,
    FiAlertTriangle
} from 'react-icons/fi';
import { FaBitcoin, FaEthereum } from 'react-icons/fa';
import { collection, addDoc } from 'firebase/firestore';
import { firestore } from '../lib/firebaseConfig';

const ModalNovaVenda = ({ isOpen, onClose, selectedLoja }) => {
    const {
        cartItems,
        setCartItems,
        selectedClient,
        setSelectedClient,
        paymentMethods,
        setPaymentMethods,
        error,
        setError,
        statusVenda,
        setStatusVenda,
        newOsId,
        setNewOsId,
        novaVendaRef,
        setNovaVendaRef,
        searchTerm,
        setSearchTerm,
        clients,
        setClients,
        filteredClients,
        setFilteredClients,
        showClientForm,
        setShowClientForm,
        products,
        setProducts,
        productSearchTerm,
        setProductSearchTerm,
        filteredProducts,
        setFilteredProducts,
        focusedRow,
        setFocusedRow,
        newProductQty,
        setNewProductQty,
        produtoInputRef,
        setProdutoInputRef,
        discount,
        setDiscount,
        discountType,
        setDiscountType,
        observation,
        setObservation,
        valorPago,
        setValorPago,
        troco,
        setTroco,
        success,
        setSuccess,
        saleId,
        setSaleId,
        osId,
        setOsId,
        currentPaymentIndex,
        setCurrentPaymentIndex,
        valueDistribution,
        setValueDistribution,
        showCreditCardForm,
        setShowCreditCardForm,
        dadosCartao,
        setDadosCartao,
        boletoData,
        setBoletoData,
        fetchClients,
        handleSelectClient,
        tipoTransacao,
        setTipoTransacao
    } = useModalNovaVenda({ isOpen, onClose, selectedLoja });

    // Buscar clientes quando o modal abrir ou quando a loja selecionada mudar
    useEffect(() => {
        if (isOpen && selectedLoja) {
            fetchClients();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, selectedLoja]);

    // Garante que sempre exista pelo menos um método de pagamento ao abrir o modal
    useEffect(() => {
        if (isOpen && paymentMethods.length === 0 && cartItems.length > 0) {
            setPaymentMethods([
                {
                    method: 'dinheiro',
                    value: calculateTotal(),
                    processed: true,
                    details: { pagamento_confirmado: true }
                }
            ]);
        } else if (isOpen && paymentMethods.length === 1 && cartItems.length > 0) {
            // Atualiza o valor do método de pagamento quando o total mudar
            setPaymentMethods([
                {
                    ...paymentMethods[0],
                    value: calculateTotal()
                }
            ]);
        }
        // eslint-disable-next-line
    }, [isOpen, cartItems, discount, discountType]);

    const [osData, setOsData] = useState({});
    const [dataVenda, setDataVenda] = useState(new Date().toISOString().split('T')[0]);
    const [vendedor] = useState('Admin'); // Você pode substituir isso pelo vendedor real do sistema
    const [statusVendaFinal, setStatusVendaFinal] = useState('');
    const [osFormsCompleted, setOsFormsCompleted] = useState(false);
    const [osStatus, setOsStatus] = useState({ tipo: 'sem_os' });
    const [boletoVencimento, setBoletoVencimento] = useState('');
    const [parcelasCredario, setParcelasCredario] = useState(1);
    const [selectedCrypto, setSelectedCrypto] = useState('bitcoin');
    const [cryptoAddress, setCryptoAddress] = useState('');
    const [showPixModal, setShowPixModal] = useState(false);
    const [pixQRCode, setPixQRCode] = useState('');
    const [cashbackDisponivel] = useState(0);
    const [loading, setLoading] = useState(true);
    const [collections, setCollections] = useState([
        {
            id: 1,
            name: "Coleção 1",
            items: []
        }
    ]);
    const [activeCollection, setActiveCollection] = useState(1);
    const [isFinalizando, setIsFinalizando] = useState(false); // Novo estado local para controlar o carregamento do botão
    const [localSaleId, setLocalSaleId] = useState('');
    const [localOsId, setLocalOsId] = useState('');
    const [localError, setLocalError] = useState(''); // Estado local para erros
    const [localSuccess, setLocalSuccess] = useState(false); // Estado local para sucesso

    // Função auxiliar para formatar a data
    const getFormattedDate = () => {
        return new Date(dataVenda).toLocaleDateString('pt-BR');
    };

    // Função para fechar o modal
    const handleClose = () => {
        // Limpar todos os estados
        setCartItems([]);
        setOsData({});
        // Chamar a função onClose passada como prop
        onClose();
    };

    // Função para lidar com mudanças na OS
    const handleOSDataChange = (colecaoId, osData) => {
        setOsData(prev => ({
            ...prev,
            [colecaoId]: osData
        }));
    };

    // Função para finalizar a venda ou orçamento
    const finalizeSale = async () => {
        try {
            setLoading(true);

            // Se for uma venda e tiver OS, processe as OS
            if (tipoTransacao === 'venda' && osStatus.tipo !== 'sem_os') {
                const colecoesPrecisandoOS = osStatus.colecoes.filter(colecao =>
                    colecaoPrecisaDeOS(colecao)
                );

                for (const colecao of colecoesPrecisandoOS) {
                    const osDados = osStatus.osData[colecao.id];

                    if (!osDados || !osDados.isCompleted) continue;

                    const dadosOS = {
                        id_os: `${newOsId}-${colecao.id}`,
                        id_venda: novaVendaRef?.id || 'temp-' + Date.now(),
                        cliente: {
                            id: selectedClient.id,
                            nome: selectedClient.nome,
                            cpf: selectedClient.cpf || '',
                            contato: selectedClient.telefone || ''
                        },
                        tipo: osStatus.tipo,
                        status: osStatus.status,
                        data_criacao: new Date(),
                        data_previsao: osDados.dataPrevistaEntrega
                            ? new Date(osDados.dataPrevistaEntrega)
                            : new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
                        produtos: colecao.items
                            .filter(item => precisaDeOS(item))
                            .map(item => ({
                                id: item.id,
                                categoria: item.categoria,
                                nome: item.nome || item.titulo || '',
                                marca: item.marca || '',
                                quantidade: item.quantity || 1
                            })),
                        receita: {
                            olho_direito: {
                                esfera: osDados.esferaDireito || '',
                                cilindro: osDados.cilindroDireito || '',
                                eixo: osDados.eixoDireito || '',
                                adicao: osDados.adicaoDireito || ''
                            },
                            olho_esquerdo: {
                                esfera: osDados.esferaEsquerdo || '',
                                cilindro: osDados.cilindroEsquerdo || '',
                                eixo: osDados.eixoEsquerdo || '',
                                adicao: osDados.adicaoEsquerdo || ''
                            },
                            distancia_interpupilar: osDados.distanciaInterpupilar || '',
                            altura: osDados.altura || ''
                        },
                        observacoes: osDados.observacoes || osStatus.observacoes,
                        laboratorio: osDados.laboratorio || '',
                        detalhes_adicionais: {
                            armacao_cliente: osDados.armacaoClienteDescricao || '',
                            lentes_cliente: osDados.lentesClienteDescricao || ''
                        }
                    };

                    const dadosOSLimpos = removerValoresUndefined(dadosOS);
                    const osRef = collection(firestore, `lojas/${selectedLoja}/servicos/items/items`);
                    await addDoc(osRef, dadosOSLimpos);
                }
            }

            // Determinar a coleção correta com base no tipo de transação
            // CORREÇÃO: Caminho correto para salvar orçamentos
            const colecao = tipoTransacao === 'venda'
                ? `lojas/${selectedLoja}/vendas/items/items`
                : `lojas/${selectedLoja}/orcamentos/items/items`;

            console.log(`Salvando ${tipoTransacao} na coleção:`, colecao);

            // Criar objeto com dados da transação
            const dadosTransacao = {
                data_criacao: new Date(),
                data_venda: dataVenda ? new Date(dataVenda) : new Date(),
                cliente: selectedClient ? {
                    id: selectedClient.id,
                    nome: selectedClient.nome,
                    cpf: selectedClient.cpf || '',
                    telefone: selectedClient.telefone || ''
                } : null,
                itens: cartItems.map(item => ({
                    id: item.id,
                    nome: item.nome || item.titulo || '',
                    quantidade: item.quantity || 1,
                    valor_unitario: item.valor || 0,
                    valor_total: (item.valor || 0) * (item.quantity || 1),
                    categoria: item.categoria || ''
                })),
                subtotal: calculateSubtotal(),
                desconto: calculateDiscount(),
                desconto_tipo: discountType,
                valor_total: calculateTotal(),
                observacoes: observation,
                vendedor: vendedor || 'Admin',
                status: tipoTransacao === 'venda' ? 'paga' : 'aguardando_aprovacao',
                metodos_pagamento: tipoTransacao === 'venda' ? paymentMethods : [],
                // Adicionar a validade para orçamentos (30 dias por padrão)
                validade: tipoTransacao === 'orcamento' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null
            };

            // Registrar no Firebase
            const transacaoRef = collection(firestore, colecao);
            const docRef = await addDoc(transacaoRef, dadosTransacao);

            // Gerar IDs
            const idGerado = docRef.id;

            // Atualizar estados
            setSaleId(idGerado);
            if (tipoTransacao === 'venda') {
                const osIdGenerated = Math.floor(Math.random() * 1000000).toString();
                setOsId(osIdGenerated);
                setStatusVendaFinal('paga');
            } else {
                // Configurações específicas para orçamento
                setOsId('');
                setStatusVendaFinal('orcamento');
            }

            setSuccess(true);
            setLoading(false);
            return idGerado;  // Retornar o ID gerado
        } catch (error) {
            console.error(`Erro ao finalizar ${tipoTransacao}:`, error);
            setError(`Erro ao finalizar ${tipoTransacao}: ${error.message}`);
            setLoading(false);
            throw error;
        }
    }

    // Função para formatar o valor do desconto
    const handleDescontoChange = (e) => {
        const valor = e.target.value.replace(/\D/g, '');
        if (valor === '') {
            setDiscount(0);
            return;
        }

        if (discountType === 'value') {
            // Formata como valor monetário
            setDiscount(Number(valor) / 100);
        } else {
            // Formata como percentual (mantém o valor em centavos para consistência)
            setDiscount(Number(valor) / 100);
        }
    };

    // Função para formatar o valor exibido
    const formatDescontoValue = () => {
        if (discount === 0) return '';

        if (discountType === 'percentage') {
            // Para percentual, formata apenas o número com duas casas decimais
            return discount.toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
        } else {
            // Para valor monetário, mantém a formatação com R$
            return discount.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL'
            });
        }
    };

    // Função para formatar moeda
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    // Função para calcular subtotal
    const calculateSubtotal = () => {
        return cartItems.reduce((total, item) => total + (item.valor || 0) * item.quantity, 0);
    };

    // Função para calcular total
    const calculateTotal = () => {
        const subtotal = calculateSubtotal();
        const discountValue = calculateDiscount();
        return subtotal - discountValue;
    };

    // Função para calcular desconto
    const calculateDiscount = () => {
        if (!discount) return 0;
        if (discountType === 'percentage') {
            return calculateSubtotal() * (discount / 100);
        }
        return discount;
    };

    // Função para verificar se o pagamento está completo
    const isPaymentComplete = () => {
        if (paymentMethods.length === 0) return false;

        // Verifica se todos os métodos de pagamento foram processados
        const todosProcessados = paymentMethods.every(method => method.processed && method.details);

        // Se estiver no modo automático, verifique se o valor total é igual
        if (valueDistribution === 'auto') {
            const total = calculateTotal();
            const totalPago = paymentMethods.reduce((sum, method) => sum + (method.value || 0), 0);
            return todosProcessados && Math.abs(total - totalPago) < 0.01;
        }

        // No modo manual, basta que estejam processados
        return todosProcessados;
    };

    // Função para calcular total alocado
    const calculateTotalAllocated = () => {
        return paymentMethods.reduce((total, method) => total + (method.value || 0), 0);
    };

    // Função para calcular valor restante
    const calculateRemainingValue = () => {
        return calculateTotal() - calculateTotalAllocated();
    };

    // Função para atualizar valor do método de pagamento
    const updatePaymentMethodValue = (index, value) => {
        const updatedMethods = [...paymentMethods];
        updatedMethods[index].value = value;
        setPaymentMethods(updatedMethods);
    };

    // Função para adicionar método de pagamento
    const addPaymentMethod = () => {
        setPaymentMethods([
            ...paymentMethods,
            {
                method: 'dinheiro',
                value: calculateRemainingValue(),
                details: {}
            }
        ]);
        setCurrentPaymentIndex(paymentMethods.length);
    };

    // Função para remover método de pagamento
    const removePaymentMethod = (index) => {
        const updatedMethods = paymentMethods.filter((_, i) => i !== index);
        setPaymentMethods(updatedMethods);
        if (currentPaymentIndex >= updatedMethods.length) {
            setCurrentPaymentIndex(Math.max(0, updatedMethods.length - 1));
        }
    };

    // Função para mudar método de pagamento
    const changePaymentMethod = (index, newMethod) => {
        const updatedMethods = [...paymentMethods];
        updatedMethods[index] = {
            ...updatedMethods[index],
            method: newMethod,
            details: {}
        };
        setPaymentMethods(updatedMethods);
    };

    // Função para processar método de pagamento
    const processPaymentMethod = async (index) => {
        const method = paymentMethods[index];

        switch (method.method) {
            case 'cartao':
                setShowCreditCardForm(true);
                break;
            case 'pix':
                try {
                    // Aqui você implementaria a geração do QR Code do PIX
                    setPixQRCode('QR_CODE_SIMULADO');
                    setShowPixModal(true);
                } catch (error) {
                    console.error('Erro ao gerar QR Code PIX:', error);
                    setError('Erro ao gerar QR Code PIX');
                }
                break;
            case 'boleto':
                if (!boletoVencimento) {
                    setError('Por favor, selecione a data de vencimento do boleto');
                    return;
                }
                // Aqui você implementaria a geração do boleto
                break;
            case 'crediario':
                if (!parcelasCredario || parcelasCredario < 1) {
                    setError('Por favor, selecione o número de parcelas');
                    return;
                }
                // Aqui você implementaria a lógica do crediário
                break;
            case 'crypto':
                if (!selectedCrypto || !cryptoAddress) {
                    setError('Por favor, selecione a criptomoeda e forneça o endereço');
                    return;
                }
                // Aqui você implementaria a lógica de pagamento com crypto
                break;
            default:
                // Para métodos como dinheiro, não é necessário processamento adicional
                break;
        }
    };

    // Função para lidar com submissão do cartão de crédito
    const handleCreditCardSubmit = (cardData) => {
        setDadosCartao(cardData);
        setShowCreditCardForm(false);
        // Aqui você implementaria o processamento do cartão
    };

    // Função para verificar se pode finalizar a venda
    const canFinalizeSale = () => {
        // Verificações básicas
        const basicChecks = cartItems.length > 0 &&
            selectedClient &&
            (osStatus.tipo === 'sem_os' || osStatus.allCompleted === true);

        return basicChecks;
    };

    // Função para lidar com o clique em finalizar
    const handleFinalizarClicked = async () => {
        // Limpar erros anteriores
        setLocalError('');

        // Validações comuns
        if (cartItems.length === 0) {
            setLocalError('Adicione pelo menos um item ao carrinho');
            return;
        }

        if (!selectedClient) {
            setLocalError('Selecione um cliente');
            return;
        }

        try {
            setIsFinalizando(true); // Ativar estado de carregamento local

            // Validações específicas para venda
            if (tipoTransacao === 'venda') {
                if (osStatus.tipo !== 'sem_os' && !osFormsCompleted) {
                    setLocalError('Preencha todos os formulários de OS antes de finalizar');
                    setIsFinalizando(false);
                    return;
                }

                // Validações de pagamento para venda
                if (!isPaymentComplete()) {
                    setLocalError('O valor total dos pagamentos deve ser igual ao valor da venda');
                    setIsFinalizando(false);
                    return;
                }
            }

            // Processar a finalização
            const resultId = await finalizeSale();
            console.log(`${tipoTransacao} finalizado com ID: ${resultId}`);

            // Atualizar estados locais
            setLocalSaleId(resultId);
            setLocalSuccess(true);

            // Para vendas, gere também o ID da OS
            if (tipoTransacao === 'venda' && osStatus.tipo !== 'sem_os') {
                const osIdGenerated = Math.floor(Math.random() * 1000000).toString();
                setLocalOsId(osIdGenerated);
                setStatusVendaFinal('paga');
            } else if (tipoTransacao === 'orcamento') {
                // Configurações específicas para orçamento
                setStatusVendaFinal('orcamento');
            }

        } catch (error) {
            console.error(`Erro ao finalizar ${tipoTransacao}:`, error);
            setLocalError(`Erro ao finalizar ${tipoTransacao}: ${error.message}`);
        } finally {
            setIsFinalizando(false);
        }
    };

    // Função para obter o texto do botão de finalizar
    const getBotaoFinalizarTexto = () => {
        if (tipoTransacao === 'venda') {
            return 'Finalizar Venda';
        } else {
            return 'Salvar Orçamento';
        }
    };

    // Função para receber coleções atualizadas pelo CarrinhoCompras
    const updateCollections = (updatedCollections) => {
        setCollections(updatedCollections);
    };

    // Renderizar informações de sucesso após finalizar
    const renderSuccess = () => {
        // Definir título com base no tipo
        let titulo = tipoTransacao === 'venda'
            ? 'Venda Finalizada com Sucesso!'
            : 'Orçamento Salvo com Sucesso!';
        let corTitulo = 'text-green-600';
        let icone = <FiCheck className="h-6 w-6 text-green-600" />;

        if (tipoTransacao === 'venda') {
            // Lógica existente para diferentes status de venda
            if (statusVendaFinal === 'aguardando_pagamento') {
                titulo = 'Venda Registrada - Aguardando Pagamento';
                corTitulo = 'text-yellow-600';
                icone = <FiClock className="h-6 w-6 text-yellow-600" />;
            } else if (statusVendaFinal === 'em_processamento') {
                titulo = 'Venda Registrada - Processando Pagamento';
                corTitulo = 'text-blue-600';
                icone = <FiRefreshCw className="h-6 w-6 text-blue-600" />;
            }
        }

        return (
            <div className="p-8 text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                    {icone}
                </div>
                <h3 className={`text-lg font-medium ${corTitulo} mb-2`}>{titulo}</h3>
                <p className="text-sm text-gray-500 mb-1">
                    {tipoTransacao === 'venda' ? 'Venda' : 'Orçamento'} #{localSaleId}
                </p>

                {tipoTransacao === 'venda' && statusVendaFinal === 'paga' && (
                    <>
                        <p className="text-sm text-gray-500 mb-4">Ordem de Serviço: {localOsId}</p>
                        <p className="text-sm text-gray-600 mb-6">
                            A ordem de serviço foi registrada e está aguardando montagem.
                        </p>
                    </>
                )}

                {tipoTransacao === 'orcamento' && (
                    <p className="text-sm text-gray-600 mb-6">
                        O orçamento foi salvo e pode ser acessado posteriormente para conversão em venda.
                    </p>
                )}

                {/* Resumo dos itens */}
                <div className="mb-6 p-4 border-2 border-gray-200 bg-gray-50 rounded-sm">
                    <h4 className="font-medium text-gray-700 mb-3">Resumo dos Itens</h4>
                    {/* ... conteúdo existente ... */}
                </div>

                <div className="flex justify-center space-x-4">
                    <button
                        onClick={handleClose}
                        className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-[#81059e] border border-transparent rounded-md hover:bg-[#6f0486]"
                    >
                        Concluir
                    </button>

                    {tipoTransacao === 'venda' && (
                        <>
                            <button
                                onClick={() => {
                                    // Lógica para imprimir comprovante
                                    handleClose();
                                }}
                                className="inline-flex justify-center px-4 py-2 text-sm font-medium text-[#81059e] bg-white border border-[#81059e] rounded-md hover:bg-purple-50"
                            >
                                <FiPrinter className="mr-2" /> Imprimir Comprovante
                            </button>

                            {statusVendaFinal === 'paga' && (
                                <button
                                    onClick={() => {
                                        handleClose();
                                        window.location.href = '/products_and_services/OS/list-os';
                                    }}
                                    className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700"
                                >
                                    <FiClipboard className="mr-2" /> Ver Ordem de Serviço
                                </button>
                            )}
                        </>
                    )}

                    {tipoTransacao === 'orcamento' && (
                        <button
                            onClick={() => {
                                // Lógica para imprimir orçamento
                                handleClose();
                            }}
                            className="inline-flex justify-center px-4 py-2 text-sm font-medium text-[#81059e] bg-white border border-[#81059e] rounded-md hover:bg-purple-50"
                        >
                            <FiPrinter className="mr-2" /> Imprimir Orçamento
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

                <div className="inline-block align-bottom bg-white rounded-sm text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-5xl sm:w-full">
                    {/* Cabeçalho do modal */}
                    <div className="bg-[#81059e] px-4 py-3 sm:px-6 flex justify-between items-center">
                        <h3 className="text-lg leading-6 font-medium text-white flex items-center gap-2">
                            {tipoTransacao === 'venda' ? (
                                <><FiShoppingCart className="mr-1" /> Nova Venda</>
                            ) : (
                                <><FiFileText className="mr-1" /> Novo Orçamento</>
                            )}
                        </h3>
                        <button
                            onClick={handleClose}
                            className="bg-[#81059e] rounded-md text-white hover:text-gray-200 focus:outline-none"
                        >
                            <FiX size={24} />
                        </button>
                    </div>

                    {/* Corpo do modal */}
                    {localSuccess ? (
                        renderSuccess()
                    ) : (
                        <div className="bg-white p-6">
                            {/* Exibir mensagem de erro */}
                            {error && (
                                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
                                    <p>{error}</p>
                                </div>
                            )}

                            {/* Seletor de tipo de transação */}
                            <TipoTransacaoSelector
                                tipoSelecionado={tipoTransacao}
                                setTipoSelecionado={setTipoTransacao}
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Coluna da esquerda: Detalhes da venda */}
                                <div>
                                    {/* Data e Vendedor */}
                                    <div className="mb-4">
                                        <div className="flex">
                                            <div className="flex items-center gap-2">
                                                <FiCalendar className="text-[#81059e]" />
                                                <span className="font-medium text-xl">Data:</span>
                                                <input
                                                    type="date"
                                                    value={dataVenda}
                                                    onChange={(e) => setDataVenda(e.target.value)}
                                                    className="border border-[#81059e] rounded-sm px-2 py-1"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <FiUser className="text-[#81059e]" />
                                            <span className="font-medium text-xl">Vendedor:</span>
                                            <span>{vendedor}</span>
                                        </div>
                                    </div>

                                    {/* Seleção de Cliente */}
                                    <div className="mb-36 mt-8">
                                        <label className="block text-[#81059e] text-xl font-medium mb-1 flex items-center gap-1">
                                            <FiUser /> Cliente
                                        </label>

                                        {showClientForm ? (
                                            <div className="border-2 border-[#81059e] rounded-sm p-4">
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
                                                            className="border-2 border-[#81059e] pl-10 p-2 rounded-sm w-full"
                                                            placeholder="Buscar cliente por nome ou CPF"
                                                        />
                                                        {filteredClients.length > 0 && (
                                                            <div className="absolute z-10 mt-1 w-full bg-white border-2 border-[#81059e] rounded-lg w-full max-h-[104px] overflow-y-auto shadow-lg custom-scroll">
                                                                {filteredClients
                                                                    .filter(client => {
                                                                        const searchTermLower = searchTerm.toLowerCase();
                                                                        return (
                                                                            client.nome.toLowerCase().includes(searchTermLower) ||
                                                                            (client.cpf && client.cpf.includes(searchTermLower)) ||
                                                                            (client.telefone && client.telefone.includes(searchTermLower))
                                                                        );
                                                                    })
                                                                    .map(client => (
                                                                        <div
                                                                            key={client.id}
                                                                            className="p-2 hover:bg-purple-50 cursor-pointer border-b last:border-b-0"
                                                                            onClick={() => handleSelectClient(client)}
                                                                        >
                                                                            <div className="font-medium">{client.nome}</div>
                                                                            {client.cpf && <div className="text-sm text-gray-600">CPF: {client.cpf}</div>}
                                                                        </div>
                                                                    ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <button
                                                        onClick={() => setShowClientForm(true)}
                                                        className="bg-[#81059e] text-white p-2 rounded-sm flex items-center"
                                                        title="Adicionar novo cliente"
                                                    >
                                                        <FiPlus />
                                                    </button>
                                                </div>

                                                {selectedClient && (
                                                    <div className="mt-2 p-3 border-2 border-purple-100 rounded-sm bg-purple-50">
                                                        <div className="flex justify-between items-center">
                                                            <div>
                                                                <h3 className="font-semibold text-[#81059e]">{selectedClient.nome}</h3>
                                                                {selectedClient.cpf && <p className="text-gray-600 text-sm">CPF: {selectedClient.cpf}</p>}
                                                                {selectedClient.telefone && <p className="text-gray-600 text-sm">Tel: {selectedClient.telefone}</p>}
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
                                        <label className="block text-[#81059e] text-xl font-medium mb-1 flex items-center gap-1">
                                            <FiShoppingCart /> Produtos
                                        </label>

                                        <div>
                                            <CarrinhoCompras
                                                cartItems={cartItems}
                                                setCartItems={setCartItems}
                                                selectedLoja={selectedLoja}
                                                formatCurrency={formatCurrency}
                                                calculateTotal={calculateTotal}
                                                updateCollections={updateCollections}
                                                setActiveCollection={setActiveCollection}
                                            />
                                        </div>
                                    </div>

                                    {/* Gerenciamento de OS */}
                                    {cartItems.length > 0 && (
                                        <OSManager
                                            cartItems={cartItems}
                                            selectedClient={selectedClient}
                                            onOSChange={handleOSDataChange}
                                            collections={collections}
                                            activeCollection={activeCollection}
                                        />
                                    )}

                                    {/* Aviso sobre OS pendentes */}
                                    {osStatus.tipo !== 'sem_os' && !osFormsCompleted && (
                                        <div className="mb-4 p-3 bg-yellow-50 border-l-4 border-yellow-500 text-yellow-700 flex items-center">
                                            <FiAlertTriangle className="mr-2" />
                                            <span>Existem formulários de OS pendentes de preenchimento</span>
                                        </div>
                                    )}

                                    {/* Observações */}
                                    <div className="mb-4">
                                        <label className="block text-xl mb-1 flex items-center gap-1">
                                            <FiFileText /> <p className='text-[#81059e]'>Observações</p>
                                        </label>
                                        <textarea
                                            value={observation}
                                            onChange={(e) => setObservation(e.target.value)}
                                            className="border-2 border-[#81059e] p-2 rounded-sm w-full h-20"
                                            placeholder="Observações sobre a venda ou montagem do óculos..."
                                        />
                                    </div>
                                </div>

                                {/* Coluna da direita: Pagamento e Totais */}
                                <div>
                                    {/* Desconto */}
                                    <div className="mb-4">
                                        <div className="flex justify-between items-center mb-2">
                                            <label className="block text-[#81059e] font-medium flex text-xl items-center gap-1">
                                                <FiDollarSign /> Desconto
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
                                            type="text"
                                            value={formatDescontoValue()}
                                            onChange={handleDescontoChange}
                                            className="border-2 border-[#81059e] p-2 rounded-sm w-full"
                                            placeholder={discountType === 'percentage' ? "Desconto em %" : "Desconto em R$"}
                                        />
                                    </div>

                                    {/* Resumo da Venda */}
                                    <div className="bg-gray-50 p-4 rounded-sm mb-14">
                                        <h3 className="text-lg font-medium text-[#81059e] mb-4">Resumo da Venda</h3>

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

                                    {/* Mensagem de erro */}
                                    {localError && (
                                        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
                                            <p className="font-medium">Erro</p>
                                            <p>{localError}</p>
                                        </div>
                                    )}

                                    {/* Painel de métodos de pagamento - apenas mostrar para vendas */}
                                    {tipoTransacao === 'venda' && (
                                        <PaymentMethodPanel
                                            paymentMethods={paymentMethods}
                                            setPaymentMethods={setPaymentMethods}
                                            currentPaymentIndex={currentPaymentIndex}
                                            setCurrentPaymentIndex={setCurrentPaymentIndex}
                                            valueDistribution={valueDistribution}
                                            setValueDistribution={setValueDistribution}
                                            calculateTotal={calculateTotal}
                                            calculateTotalAllocated={calculateTotalAllocated}
                                            calculateRemainingValue={calculateRemainingValue}
                                            updatePaymentMethodValue={updatePaymentMethodValue}
                                            addPaymentMethod={addPaymentMethod}
                                            removePaymentMethod={removePaymentMethod}
                                            changePaymentMethod={changePaymentMethod}
                                            cashbackDisponivel={cashbackDisponivel}
                                            formatCurrency={formatCurrency}
                                            processPaymentMethod={processPaymentMethod}
                                            boletoVencimento={boletoVencimento}
                                            setBoletoVencimento={setBoletoVencimento}
                                            parcelasCredario={parcelasCredario}
                                            setParcelasCredario={setParcelasCredario}
                                            selectedCrypto={selectedCrypto}
                                            setSelectedCrypto={setSelectedCrypto}
                                            cryptoAddress={cryptoAddress}
                                            setCryptoAddress={setCryptoAddress}
                                        />
                                    )}

                                    {/* Botão de finalizar */}
                                    <button
                                        onClick={handleFinalizarClicked}
                                        disabled={cartItems.length === 0 || !selectedClient ||
                                            (tipoTransacao === 'venda' &&
                                                ((osStatus.tipo !== 'sem_os' && !osFormsCompleted) ||
                                                    isFinalizando))}
                                        className="w-full bg-[#81059e] text-white py-3 px-4 rounded-sm flex items-center justify-center font-medium hover:bg-[#6f0486] disabled:bg-purple-300 disabled:cursor-not-allowed"
                                    >
                                        {isFinalizando ? (
                                            <>
                                                <div className="animate-spin h-5 w-5 border-2 border-white rounded-full border-t-transparent mr-2"></div>
                                                Processando...
                                            </>
                                        ) : (
                                            <>
                                                <FiCheck className="mr-2" /> {getBotaoFinalizarTexto()}
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
                        <div className="bg-white rounded-sm shadow-xl w-full max-w-4xl p-6">
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
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de pagamento com cartão */}
            {showCreditCardForm && (
                <div className="fixed inset-0 z-[70] overflow-y-auto bg-black bg-opacity-50">
                    <div className="flex items-center justify-center min-h-screen p-4">
                        <CreditCardForm
                            onSubmit={handleCreditCardSubmit}
                            onCancel={() => setShowCreditCardForm(false)}
                            valorTotal={paymentMethods[currentPaymentIndex]?.value || 0}
                        />
                    </div>
                </div>
            )}

            {/* Modal do PIX */}
            <PixQRCodeModal
                isOpen={showPixModal}
                onClose={() => setShowPixModal(false)}
                valor={paymentMethods[currentPaymentIndex]?.value || 0}
                qrCode={pixQRCode}
            />
        </div>
    );
};

export default ModalNovaVenda;