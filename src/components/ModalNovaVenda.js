// components/ModalNovaVenda.js
import { useState, useEffect, useRef } from 'react';
import {
    collection, getDocs, doc, getDoc, addDoc, updateDoc, query, where, serverTimestamp
} from 'firebase/firestore';
import { FiClock, FiRefreshCw, FiMessageSquare, FiPrinter } from 'react-icons/fi';
import CreditCardForm from './CreditCardForm';
import CarrinhoCompras from './CarrinhoCompras';
import { firestore } from '@/lib/firebaseConfig';
import { useAuth } from '@/hooks/useAuth';
import {
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
    FiPercent
} from 'react-icons/fi';
import { FaBitcoin, FaEthereum } from 'react-icons/fa';
import ClientForm from './ClientForm';

function removerValoresUndefined(obj) {
    // Se for null, undefined ou não for um objeto, retornar um valor padrão apropriado
    if (obj === null || obj === undefined) {
        return null;
    }

    if (typeof obj !== 'object') {
        return obj;
    }

    // Se for uma data, retornar como está
    if (obj instanceof Date) {
        return obj;
    }

    // Se for um array, processar cada item
    if (Array.isArray(obj)) {
        const arrayLimpo = obj.map(item => removerValoresUndefined(item)).filter(item => item !== null);
        return arrayLimpo.length > 0 ? arrayLimpo : null;
    }

    // Se for um objeto, processar cada propriedade
    const resultado = {};
    let temPropriedade = false;

    for (const chave in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, chave)) {
            const valor = removerValoresUndefined(obj[chave]);
            if (valor !== null && valor !== undefined) {
                resultado[chave] = valor;
                temPropriedade = true;
            }
        }
    }

    return temPropriedade ? resultado : null;
}


const ModalNovaVenda = ({ isOpen, onClose, selectedLoja }) => {
    // Estado para gerenciamento de clientes
    const [searchTerm, setSearchTerm] = useState('');
    const [clients, setClients] = useState([]);
    const [filteredClients, setFilteredClients] = useState([]);
    const [selectedClient, setSelectedClient] = useState(null);
    const [showClientForm, setShowClientForm] = useState(false);

    // Estados para gerenciamento de produtos
    const [products, setProducts] = useState([]);
    const [productSearchTerm, setProductSearchTerm] = useState('');
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [cartItems, setCartItems] = useState([]);

    // Estado para controle da tabela de produtos no carrinho
    const [focusedRow, setFocusedRow] = useState(null);
    const [newProductQty, setNewProductQty] = useState(1);
    const produtoInputRef = useRef(null);

    // Estados para pagamento e descontos
    const [discount, setDiscount] = useState(0);
    const [discountType, setDiscountType] = useState('percentage'); // 'percentage' ou 'value'
    const [observation, setObservation] = useState('');
    const [valorPago, setValorPago] = useState('');
    const [troco, setTroco] = useState(0);

    // Estados para controle de processamento
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [saleId, setSaleId] = useState(null);
    const [osId, setOsId] = useState(null);

    // Estados para múltiplos métodos de pagamento
    const [paymentMethods, setPaymentMethods] = useState([{
        method: 'dinheiro',
        value: 0,
        details: {},
        processed: false
    }]);
    const [currentPaymentIndex, setCurrentPaymentIndex] = useState(0);
    const [valueDistribution, setValueDistribution] = useState('auto'); // 'auto' ou 'manual'

    const [showCreditCardForm, setShowCreditCardForm] = useState(false);
    const [dadosCartao, setDadosCartao] = useState(null);
    const [boletoData, setBoletoData] = useState(null);
    const [boletoVencimento, setBoletoVencimento] = useState(
        new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    );
    const [parcelasCredario, setParcelasCredario] = useState("3");
    const [statusPagamentoFinal, setStatusPagamentoFinal] = useState("");
    const [statusVendaFinal, setStatusVendaFinal] = useState("");

    // Novos estados para cashback e criptomoedas
    const [cashbackDisponivel, setCashbackDisponivel] = useState(0);
    const [selectedCrypto, setSelectedCrypto] = useState('bitcoin');
    const [cryptoAddress, setCryptoAddress] = useState('');

    // Informações sobre a venda
    const [vendedor, setVendedor] = useState('');
    const [dataVenda, setDataVenda] = useState(new Date());

    // Obtém informações do usuário atual
    const { user, userData } = useAuth();

    // Buscar dados iniciais quando o componente montar
    useEffect(() => {
        if (isOpen && selectedLoja) {
            fetchClients();
            fetchProducts();
            fetchCashbackDisponivel();

            // Definir vendedor automaticamente
            if (userData) {
                setVendedor(userData.nome || user?.email || 'Vendedor');
            }

            // Definir data atual
            setDataVenda(new Date());

            // Inicializar o primeiro método de pagamento com o valor total
            updatePaymentMethodValue(0);
        }
    }, [isOpen, selectedLoja, userData, user]);

    // Atualizar o valor do método de pagamento atual quando o total mudar
    useEffect(() => {
        if (valueDistribution === 'auto' && paymentMethods.length === 1) {
            updatePaymentMethodValue(0);
        }
    }, [cartItems, discount, discountType]);

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

    // Buscar cashback disponível do cliente
    const fetchCashbackDisponivel = async () => {
        // Esta função seria implementada para buscar o saldo de cashback do cliente
        // Por enquanto, usando um valor fictício para demonstração
        setCashbackDisponivel(50.75);
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
                    // Note que o caminho está correto conforme sua estrutura mostrada na captura de tela
                    const productsRef = collection(firestore, `estoque/${selectedLoja}/${categoria}`);
                    const querySnapshot = await getDocs(productsRef);

                    console.log(`Categoria ${categoria}: encontrados ${querySnapshot.size} produtos`);

                    // Mapear documentos para o formato esperado
                    const categoryProducts = querySnapshot.docs.map(doc => {
                        const data = doc.data();
                        return {
                            id: doc.id,
                            categoria: categoria,
                            nome: data.nome || data.info_geral?.nome || `Produto ${doc.id}`,
                            marca: data.marca || data.info_geral?.marca || "Sem marca",
                            codigo: data.codigo || data.info_geral?.codigo || doc.id,
                            preco: data.preco || data.info_geral?.preco || 0,
                            quantidade: data.quantidade || 0,
                            info_geral: data.info_geral || {
                                nome: data.nome || `Produto ${doc.id}`,
                                marca: data.marca || "Sem marca",
                                codigo: data.codigo || doc.id,
                                preco: data.preco || 0
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

    // Funções de manipulação de pagamento com cartão
    const handleCreditCardSubmit = (paymentResult) => {
        const newPaymentMethods = [...paymentMethods];
        newPaymentMethods[currentPaymentIndex] = {
            ...newPaymentMethods[currentPaymentIndex],
            details: {
                ultimos_digitos: paymentResult.card.last4,
                bandeira: paymentResult.card.brand,
                parcelas: paymentResult.installments,
                codigo_autorizacao: paymentResult.auth_code,
                tipo: paymentResult.type
            },
            processed: true
        };

        setPaymentMethods(newPaymentMethods);
        setShowCreditCardForm(false);
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

    // Filtrar produtos com base no termo de busca
    useEffect(() => {
        if (productSearchTerm.trim() === '') {
            setFilteredProducts([]);
        } else {
            // Atualizar este trecho do modal de vendas
            const filtered = products.filter(product =>
                product.nome?.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
                product.codigo?.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
                product.marca?.toLowerCase().includes(productSearchTerm.toLowerCase())
            );
            setFilteredProducts(filtered);
        }
    }, [productSearchTerm, products]);

    // Calcular subtotal
    const calculateSubtotal = () => {
        return cartItems.reduce((total, item) =>
            total + ((item.preco || item.info_geral?.preco || 0) * item.quantity), 0
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

    // Calcular o total já atribuído aos meios de pagamento
    const calculateTotalAllocated = () => {
        return paymentMethods.reduce((sum, method) => sum + (parseFloat(method.value) || 0), 0);
    };

    // Calcular valor restante a ser pago
    const calculateRemainingValue = () => {
        const total = calculateTotal();
        const allocated = calculateTotalAllocated();
        return Math.max(0, total - allocated);
    };

    // Atualizar valor de um método de pagamento
    const updatePaymentMethodValue = (index, customValue = null) => {
        const total = calculateTotal();
        let newValue;

        if (customValue !== null) {
            newValue = customValue;
        } else if (valueDistribution === 'auto') {
            // Se for o único método de pagamento, atribui o valor total
            if (paymentMethods.length === 1) {
                newValue = total;
            } else {
                // Calcula o valor restante para distribuir
                const allocated = paymentMethods.reduce((sum, method, i) =>
                    i !== index ? sum + (parseFloat(method.value) || 0) : sum, 0);
                newValue = Math.max(0, total - allocated);
            }
        } else {
            // Em modo manual, mantém o valor atual ou zero para novos métodos
            newValue = paymentMethods[index]?.value || 0;
        }

        const newMethods = [...paymentMethods];
        newMethods[index] = {
            ...newMethods[index],
            value: newValue
        };

        setPaymentMethods(newMethods);
    };

    // Adicionar método de pagamento
    const addPaymentMethod = () => {
        // Adiciona um novo método e define como atual
        setPaymentMethods([...paymentMethods, { method: 'dinheiro', value: 0, details: {}, processed: false }]);
        setCurrentPaymentIndex(paymentMethods.length);

        // Se estiver em distribuição automática, redistribui os valores
        if (valueDistribution === 'auto') {
            const newIndex = paymentMethods.length;
            setTimeout(() => updatePaymentMethodValue(newIndex), 0);
        }
    };

    // Remover método de pagamento
    const removePaymentMethod = (indexToRemove) => {
        // Evitar remover o último método de pagamento
        if (paymentMethods.length <= 1) {
            return;
        }

        // Criar um novo array sem o método a ser removido
        const updatedMethods = paymentMethods.filter((_, index) => index !== indexToRemove);

        // Ajustar o índice atual selecionado
        let newIndex = currentPaymentIndex;
        if (currentPaymentIndex >= updatedMethods.length) {
            // Se o índice atual é maior ou igual ao novo tamanho do array
            newIndex = updatedMethods.length - 1;
        } else if (currentPaymentIndex === indexToRemove) {
            // Se estamos removendo o item atualmente selecionado
            newIndex = Math.max(0, indexToRemove - 1);
        } else if (currentPaymentIndex > indexToRemove) {
            // Se estamos removendo um item antes do atualmente selecionado
            newIndex = currentPaymentIndex - 1;
        }

        // Atualizar o estado dos métodos de pagamento e o índice atual
        setPaymentMethods(updatedMethods);
        setCurrentPaymentIndex(newIndex);

        // Redistribuir os valores se estiver em modo automático
        // Usar um timeout maior para garantir que os estados sejam atualizados primeiro
        if (valueDistribution === 'auto') {
            setTimeout(() => {
                const currentMethods = [...updatedMethods];
                currentMethods.forEach((_, idx) => {
                    const total = calculateTotal();
                    let newValue;

                    if (currentMethods.length === 1) {
                        // Se houver apenas um método, atribui o valor total
                        newValue = total;
                    } else {
                        // Caso contrário, calcula o valor restante
                        const allocated = currentMethods.reduce((sum, method, i) =>
                            i !== idx ? sum + (parseFloat(method.value) || 0) : sum, 0);
                        newValue = Math.max(0, total - allocated);
                    }

                    // Atualiza o valor do método atual
                    currentMethods[idx] = {
                        ...currentMethods[idx],
                        value: newValue
                    };
                });

                // Atualiza o estado com os novos valores
                setPaymentMethods(currentMethods);
            }, 100);
        }
    };

    // Modificar método de um pagamento
    const changePaymentMethod = (index, method) => {
        const newMethods = [...paymentMethods];

        // Resetar detalhes quando mudar o método
        newMethods[index] = {
            ...newMethods[index],
            method: method,
            details: {},
            processed: method !== 'cartao' && method !== 'crypto' // Cartão e crypto precisam de processamento adicional
        };

        setPaymentMethods(newMethods);
    };

    // Adicionar produto ao carrinho
    const addToCart = (product) => {
        if (!product) return;

        // Verificar se o produto já está no carrinho
        const existingItem = cartItems.find(item => item.id === product.id);

        if (existingItem) {
            // Aumentar a quantidade se já estiver no carrinho
            setCartItems(cartItems.map(item =>
                item.id === product.id
                    ? { ...item, quantity: item.quantity + newProductQty }
                    : item
            ));
        } else {
            // Adicionar novo item ao carrinho
            setCartItems([...cartItems, { ...product, quantity: newProductQty }]);
        }

        // Limpar campos
        setProductSearchTerm('');
        setFilteredProducts([]);
        setNewProductQty(1);
        if (produtoInputRef.current) {
            produtoInputRef.current.focus();
        }
    };

    // Remover produto do carrinho
    const removeFromCart = (productId) => {
        setCartItems(cartItems.filter(item => item.id !== productId));
    };

    // Atualizar quantidade de produto no carrinho
    const updateQuantity = (productId, newQuantity) => {
        if (newQuantity < 1) return;

        // Verificar se a quantidade não excede o estoque
        const product = products.find(p => p.id === productId);
        const stockQuantity = product?.por_loja?.[selectedLoja]?.quantidade || 0;

        if (newQuantity > stockQuantity) {
            setError(`Quantidade máxima disponível: ${stockQuantity}`);
            return;
        }

        setCartItems(cartItems.map(item =>
            item.id === productId
                ? { ...item, quantity: newQuantity }
                : item
        ));

        // Limpar mensagem de erro após 3 segundos
        setTimeout(() => setError(''), 3000);
    };

    // Handler para selecionar cliente
    const handleSelectClient = (client) => {
        setSelectedClient(client);
        setSearchTerm('');
        setFilteredClients([]);

        // Buscar cashback do cliente quando selecionado
        fetchCashbackDisponivel();
    };

    // Atualizar valor de troco quando valor pago mudar
    useEffect(() => {
        if (valorPago && paymentMethods.some(p => p.method === 'dinheiro')) {
            const dinheiroPagamentos = paymentMethods
                .filter(p => p.method === 'dinheiro')
                .reduce((sum, p) => sum + parseFloat(p.value || 0), 0);

            const valorPagoNum = parseFloat(valorPago.replace(/[^\d,]/g, '').replace(',', '.'));

            if (valorPagoNum > dinheiroPagamentos) {
                setTroco(valorPagoNum - dinheiroPagamentos);
            } else {
                setTroco(0);
            }
        }
    }, [valorPago, paymentMethods]);

    // Formatar valor como moeda
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    // Verificar se todos os métodos de pagamento estão processados
    const allPaymentsProcessed = () => {
        return paymentMethods.every(method => method.processed);
    };

    // Verificar se o total alocado é igual ao total da venda
    const isPaymentComplete = () => {
        const total = calculateTotal();
        const allocated = calculateTotalAllocated();
        // Usando uma pequena margem de erro para evitar problemas com números decimais
        return Math.abs(total - allocated) < 0.01;
    };

    // Processar um método de pagamento
    const processPaymentMethod = (index) => {
        const method = paymentMethods[index];

        if (method.method === 'cartao' && !method.processed) {
            setCurrentPaymentIndex(index);
            setShowCreditCardForm(true);
            return;
        }

        if (method.method === 'crypto' && !method.processed) {
            // Simulação do processamento de pagamento em cripto
            const newMethods = [...paymentMethods];
            newMethods[index] = {
                ...newMethods[index],
                details: {
                    moeda: selectedCrypto,
                    endereco: cryptoAddress,
                    taxa_cambio: selectedCrypto === 'bitcoin' ? 0.0000046 : 0.00084, // Simulação
                    valor_crypto: selectedCrypto === 'bitcoin'
                        ? (method.value * 0.0000046).toFixed(8)
                        : (method.value * 0.00084).toFixed(6)
                },
                processed: true
            };
            setPaymentMethods(newMethods);
            return;
        }

        // Para outros métodos, apenas marca como processado
        const newMethods = [...paymentMethods];
        newMethods[index] = {
            ...newMethods[index],
            processed: true
        };
        setPaymentMethods(newMethods);
    };

    // Finalizar venda
    const finalizeSale = async () => {
        if (cartItems.length === 0) {
            setError('Adicione pelo menos um produto ao carrinho');
            return;
        }

        if (!selectedClient) {
            setError('Selecione um cliente para continuar');
            return;
        }

        if (!allPaymentsProcessed()) {
            setError('Todos os métodos de pagamento precisam ser processados');
            return;
        }

        if (!isPaymentComplete()) {
            setError('O valor total dos pagamentos deve ser igual ao valor da venda');
            return;
        }

        try {
            setLoading(true);

            const subtotal = calculateSubtotal();
            const discountAmount = calculateDiscount();
            const total = calculateTotal();

            // Gerar ID da OS
            const osPrefix = 'OS';
            const timestamp = Date.now().toString().slice(-6);
            const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
            const newOsId = `${osPrefix}${timestamp}${random}`;

            // Definir status inicial com base nos métodos de pagamento
            let statusVenda = 'paga'; // Padrão para pagamentos imediatos
            let statusPagamento = 'aprovado';

            // Se algum método de pagamento não for imediato, ajusta o status
            const temPagamentoPendente = paymentMethods.some(payment => {
                return ['boleto', 'ted', 'crypto'].includes(payment.method);
            });

            if (temPagamentoPendente) {
                statusVenda = 'aguardando_pagamento';
                statusPagamento = 'pendente';
            }

            // Preparar dados de pagamento para Firebase
            const dadosPagamento = paymentMethods.map(payment => {
                const dadosEspecificos = {};

                if (payment.method === 'boleto') {
                    const dataVencimento = boletoVencimento ? new Date(boletoVencimento) : new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
                    dadosEspecificos.codigo_barras = '00000000000000000000000000000000000000000000';
                    dadosEspecificos.linha_digitavel = '00000.00000 00000.000000 00000.000000 0 00000000000000';
                    dadosEspecificos.url_boleto = null;
                    dadosEspecificos.data_vencimento = dataVencimento;
                }
                else if (payment.method === 'cartao' && payment.details) {
                    dadosEspecificos.ultimos_digitos = payment.details.ultimos_digitos || '0000';
                    dadosEspecificos.bandeira = payment.details.bandeira || 'indefinida';
                    dadosEspecificos.parcelas = payment.details.parcelas || 1;
                    dadosEspecificos.gateway_id = 'simulacao_gateway';
                    dadosEspecificos.transaction_id = `tx_${Date.now()}`;
                }
                else if (payment.method === 'crediario') {
                    const numeroParcelas = parseInt(parcelasCredario) || 3;
                    const valorParcela = (payment.value || 0) / numeroParcelas;

                    const parcelas = [];
                    let dataProximaParcela = new Date();

                    for (let i = 0; i < numeroParcelas; i++) {
                        dataProximaParcela = new Date(dataProximaParcela);
                        dataProximaParcela.setMonth(dataProximaParcela.getMonth() + 1);

                        parcelas.push({
                            numero: i + 1,
                            valor: valorParcela || 0,
                            status: i === 0 ? 'paga' : 'pendente',
                            data_vencimento: new Date(dataProximaParcela),
                            data_pagamento: i === 0 ? new Date() : null
                        });
                    }

                    dadosEspecificos.status_parcelas = parcelas;
                    dadosEspecificos.data_primeira_parcela = new Date();
                }
                else if (payment.method === 'cashback') {
                    dadosEspecificos.saldo_anterior = cashbackDisponivel || 0;
                    dadosEspecificos.saldo_utilizado = payment.value || 0;
                    dadosEspecificos.saldo_restante = (cashbackDisponivel || 0) - (payment.value || 0);
                }
                else if (payment.method === 'crypto' && payment.details) {
                    dadosEspecificos.moeda = payment.details.moeda || 'bitcoin';
                    dadosEspecificos.endereco = payment.details.endereco || '';
                    dadosEspecificos.taxa_cambio = payment.details.taxa_cambio || 0;
                    dadosEspecificos.valor_crypto = payment.details.valor_crypto || '0';
                    dadosEspecificos.status_transacao = 'aguardando';
                    dadosEspecificos.transaction_id = `crypto_${Date.now()}`;
                }

                return {
                    metodo: payment.method || 'dinheiro',
                    valor: payment.value || 0,
                    status: payment.method === 'boleto' || payment.method === 'ted' || payment.method === 'crypto'
                        ? 'pendente'
                        : 'aprovado',
                    data_processamento: new Date(),
                    dados_especificos: removerValoresUndefined(dadosEspecificos)
                };
            });

            // 1. Estruturar dados da venda com os novos campos de pagamento
            const venda = {
                cliente: {
                    id: selectedClient.id || '',
                    nome: selectedClient.nome || '',
                    cpf: selectedClient.cpf || ''
                },
                produtos: cartItems.map(item => ({
                    id: item.id || '',
                    categoria: item.categoria || '',
                    nome: item.nome || item.info_geral?.nome || '',
                    codigo: item.codigo || item.info_geral?.codigo || '',
                    marca: item.marca || item.info_geral?.marca || '',
                    preco: item.preco || item.info_geral?.preco || 0,
                    quantidade: item.quantity || 0,
                    total: ((item.preco || item.info_geral?.preco || 0) * (item.quantity || 0)) || 0
                })),
                pagamentos: dadosPagamento,
                pagamento_resumo: {
                    valor_total: total || 0,
                    metodos_utilizados: paymentMethods.map(p => p.method || ''),
                    status_geral: statusPagamento || 'pendente',
                    data_criacao: serverTimestamp(),
                    data_aprovacao: statusPagamento === 'aprovado' ? serverTimestamp() : null
                },
                subtotal: subtotal || 0,
                desconto: {
                    tipo: discountType || 'percentage',
                    valor: discount || 0,
                    total: discountAmount || 0
                },
                total: total || 0,
                data: serverTimestamp(),
                vendedor: {
                    id: user?.uid || '',
                    nome: vendedor || ''
                },
                observacao: observation || '',
                status_venda: statusVenda || 'pendente',
                os_id: newOsId || '',
                // Removendo o campo requer_montagem que é redundante
            };

            // Remover valores undefined antes de salvar
            const vendaLimpa = removerValoresUndefined(venda);

            // 2. Registrar venda no Firebase
            const vendaRef = collection(firestore, `lojas/${selectedLoja}/vendas/items/items`);
            const novaVendaRef = await addDoc(vendaRef, vendaLimpa);

            // 3. Atualizar estoque apenas se o pagamento for aprovado ou for crediário
            if (statusVenda === 'paga') {
                await Promise.all(cartItems.map(async (item) => {
                    // Caminho correto para atualizar o estoque
                    const productRef = doc(firestore, `estoque/${selectedLoja}/${item.categoria}`, item.id);

                    try {
                        const productDoc = await getDoc(productRef);

                        if (productDoc.exists()) {
                            const productData = productDoc.data();
                            const currentStock = productData.quantidade || 0;

                            // Garantir que não ficará negativo
                            const newStock = Math.max(0, currentStock - item.quantity);

                            // Atualizar estoque
                            await updateDoc(productRef, {
                                quantidade: newStock
                            });

                            console.log(`Estoque atualizado: ${item.nome || item.id} - Novo estoque: ${newStock}`);
                        } else {
                            console.warn(`Produto não encontrado no estoque: ${item.id} (${item.categoria})`);
                        }
                    } catch (error) {
                        console.error(`Erro ao atualizar estoque do produto ${item.id}:`, error);
                        // Continuar mesmo com erro em um produto específico
                    }
                }));
            }

            // 4. Registrar ordem de serviço apenas se pagamento aprovado
            if (statusVenda === 'paga') {
                // Prepare os dados da OS
                const dadosOS = {
                    id_os: newOsId,
                    id_venda: novaVendaRef.id,
                    cliente: {
                        id: selectedClient.id,
                        nome: selectedClient.nome,
                        cpf: selectedClient.cpf,
                        contato: selectedClient.telefone || ''
                    },
                    status: 'em_montagem', // Mudando status inicial para em_montagem
                    data_criacao: new Date(),
                    data_previsao: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // +2 dias
                    produtos: cartItems.map(item => ({
                        id: item.id,
                        nome: item.info_geral?.nome,
                        marca: item.info_geral?.marca
                    })),
                    observacoes: observation
                };

                // Remover valores undefined
                const dadosOSLimpos = removerValoresUndefined(dadosOS);

                // E então use os dados limpos
                const osRef = collection(firestore, `lojas/${selectedLoja}/servicos/items/items`);
                await addDoc(osRef, dadosOSLimpos);
            }

            // 5. Registrar no controle de caixa para pagamentos imediatos
            for (const payment of paymentMethods) {
                if (payment.status !== 'pendente' && payment.method !== 'cashback') {
                    const caixaRef = collection(firestore, `lojas/${selectedLoja}/financeiro/controle_caixa/items`);
                    await addDoc(caixaRef, {
                        tipo: 'entrada',
                        valor: payment.value,
                        descricao: `Venda #${novaVendaRef.id} - Cliente: ${selectedClient.nome} - Pagamento: ${payment.method}`,
                        formaPagamento: payment.method,
                        data: new Date(), // Modificar se estava usando serverTimestamp() dentro de algum array
                        registradoPor: {
                            id: user?.uid,
                            nome: vendedor
                        },
                        vendaId: novaVendaRef.id
                    });
                }
            }

            // 6. Para boletos e TEDs, adicionar no controle de contas a receber
            for (const payment of paymentMethods) {
                if (payment.method === 'boleto' || payment.method === 'ted') {
                    const contasReceberRef = collection(firestore, `lojas/${selectedLoja}/financeiro/contas_receber/items`);
                    await addDoc(contasReceberRef, {
                        tipo: 'venda',
                        valor: payment.value,
                        descricao: `Venda #${novaVendaRef.id} - Cliente: ${selectedClient.nome}`,
                        forma_pagamento: payment.method,
                        data_criacao: new Date(), // Modificar se estava usando serverTimestamp() dentro de algum array
                        data_vencimento: payment.method === 'boleto' ?
                            (boletoVencimento ? new Date(boletoVencimento) : new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)) :
                            new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
                        status: 'pendente',
                        cliente: {
                            id: selectedClient.id,
                            nome: selectedClient.nome
                        },
                        registrado_por: {
                            id: user?.uid,
                            nome: vendedor
                        },
                        venda_id: novaVendaRef.id
                    });
                }
            }

            // 7. Para crediário, adicionar cada parcela no controle de contas a receber
            for (const payment of paymentMethods) {
                if (payment.method === 'crediario') {
                    const contasReceberRef = collection(firestore, `lojas/${selectedLoja}/financeiro/contas_receber/items`);

                    // Pular a primeira parcela se for considerada como entrada
                    const parcelasAPagar = payment.dados_especificos?.status_parcelas?.filter(p => p.status === 'pendente') || [];

                    await Promise.all(parcelasAPagar.map(async (parcela) => {
                        await addDoc(contasReceberRef, {
                            tipo: 'crediario',
                            valor: parcela.valor,
                            descricao: `Parcela ${parcela.numero}/${parcelasAPagar.length + 1} - Venda #${novaVendaRef.id}`,
                            forma_pagamento: 'crediario',
                            data_criacao: serverTimestamp(),
                            data_vencimento: parcela.data_vencimento,
                            status: 'pendente',
                            cliente: {
                                id: selectedClient.id,
                                nome: selectedClient.nome
                            },
                            registrado_por: {
                                id: user?.uid,
                                nome: vendedor
                            },
                            venda_id: novaVendaRef.id,
                            parcela: parcela.numero
                        });
                    }));
                }
            }

            // 8. Para cashback, atualizar o saldo do cliente
            const temCashback = paymentMethods.some(p => p.method === 'cashback');
            if (temCashback) {
                const totalCashback = paymentMethods
                    .filter(p => p.method === 'cashback')
                    .reduce((sum, p) => sum + parseFloat(p.value || 0), 0);

                // Atualizar saldo de cashback do cliente
                if (totalCashback > 0) {
                    const clienteRef = doc(firestore, `lojas/clientes/users/${selectedClient.id}`);

                    try {
                        await updateDoc(clienteRef, {
                            'cashback.saldo': cashbackDisponivel - totalCashback,
                            'cashback.ultima_atualizacao': serverTimestamp()
                        });
                    } catch (err) {
                        console.error('Erro ao atualizar saldo de cashback:', err);
                    }
                }
            }

            // 9. Para pagamentos em crypto, registrar transação pendente
            const temCrypto = paymentMethods.some(p => p.method === 'crypto');
            if (temCrypto) {
                const cryptoRef = collection(firestore, `lojas/${selectedLoja}/financeiro/crypto_transacoes`);
                await addDoc(cryptoRef, {
                    venda_id: novaVendaRef.id,
                    cliente_id: selectedClient.id,
                    cliente_nome: selectedClient.nome,
                    valor_brl: payment.value,
                    moeda: payment.dados_especificos?.moeda || 'bitcoin',
                    endereco: payment.dados_especificos?.endereco || '',
                    valor_crypto: payment.dados_especificos?.valor_crypto || '0',
                    taxa_cambio: payment.dados_especificos?.taxa_cambio || 0,
                    status: 'aguardando_confirmacao',
                    data_criacao: new Date(), // Modificar se estava usando serverTimestamp() dentro de algum array
                    data_confirmacao: null,
                    registrado_por: {
                        id: user?.uid,
                        nome: vendedor
                    }
                });
            }

            setSaleId(novaVendaRef.id);
            setOsId(newOsId);

            // Definir dados de retorno específicos para cada método de pagamento
            // Por exemplo, para boleto:
            const pagamentoBoleto = paymentMethods.find(p => p.method === 'boleto');
            if (pagamentoBoleto) {
                setBoletoData({
                    url: pagamentoBoleto.dados_especificos?.url_boleto || '#',
                    linhaDigitavel: pagamentoBoleto.dados_especificos?.linha_digitavel || '',
                    dataVencimento: pagamentoBoleto.dados_especificos?.data_vencimento || new Date()
                });
            }

            setSuccess(true);
            setStatusPagamentoFinal(statusPagamento);
            setStatusVendaFinal(statusVenda);

        } catch (err) {
            console.error('Erro ao finalizar venda:', err);
            setError('Falha ao processar a venda. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    // Verificar se todos os pagamentos estão prontos para finalizar
    const canFinalizeSale = () => {
        return cartItems.length > 0 &&
            selectedClient &&
            allPaymentsProcessed() &&
            isPaymentComplete();
    };

    // Processar pagamento atual ou finalizar venda
    const handleFinalizarClicked = () => {
        // Verificar se todos os métodos estão processados
        if (!allPaymentsProcessed()) {
            // Encontrar o primeiro método não processado
            const indexToProcess = paymentMethods.findIndex(p => !p.processed);
            if (indexToProcess >= 0) {
                processPaymentMethod(indexToProcess);
            }
            return;
        }

        // Verificar se o valor total está distribuído corretamente
        if (!isPaymentComplete()) {
            setError('O valor total dos pagamentos deve ser igual ao valor da venda');
            return;
        }

        // Se tudo estiver ok, finalizar a venda
        finalizeSale();
    };

    // Fechar modal e redefinir estados
    const handleClose = () => {
        setSearchTerm('');
        setSelectedClient(null);
        setCartItems([]);
        setShowClientForm(false);
        setDadosCartao(null);
        setBoletoData(null);
        setBoletoVencimento(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
        setParcelasCredario("3");
        setStatusPagamentoFinal("");
        setStatusVendaFinal("");
        setProductSearchTerm('');
        setFilteredProducts([]);
        setDiscount(0);
        setDiscountType('percentage');
        setObservation('');
        setValorPago('');
        setTroco(0);
        setError('');
        setSuccess(false);
        setSaleId(null);
        setOsId(null);
        setPaymentMethods([{ method: 'dinheiro', value: 0, details: {}, processed: false }]);
        setCurrentPaymentIndex(0);
        setValueDistribution('auto');
        setCashbackDisponivel(0);
        setSelectedCrypto('bitcoin');
        setCryptoAddress('');
        onClose();
    };

    // Formatar valor monetário para exibição
    const handleValorPagoChange = (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value === '') {
            setValorPago('');
            return;
        }

        value = (parseFloat(value) / 100).toFixed(2);
        setValorPago(value.replace('.', ','));
    };

    // Atualizar valor de um método de pagamento manualmente
    const handlePaymentValueChange = (index, valueStr) => {
        let value = valueStr.replace(/[^\d,]/g, '').replace(',', '.');
        value = parseFloat(value) || 0;

        const newMethods = [...paymentMethods];
        newMethods[index] = {
            ...newMethods[index],
            value: value
        };

        setPaymentMethods(newMethods);

        // Se for o último pagamento e estiver em modo automático, ajusta o valor
        if (valueDistribution === 'auto' && index === paymentMethods.length - 1) {
            updatePaymentMethodValue(index);
        }
    };

    // Renderizar informações de sucesso após finalizar a venda
    const renderSuccess = () => {
        // Definir título com base no status da venda
        let titulo = 'Venda Finalizada com Sucesso!';
        let corTitulo = 'text-green-600';
        let icone = <FiCheck className="h-6 w-6 text-green-600" />;

        if (statusVendaFinal === 'aguardando_pagamento') {
            titulo = 'Venda Registrada - Aguardando Pagamento';
            corTitulo = 'text-yellow-600';
            icone = <FiClock className="h-6 w-6 text-yellow-600" />;
        } else if (statusVendaFinal === 'em_processamento') {
            titulo = 'Venda Registrada - Processando Pagamento';
            corTitulo = 'text-blue-600';
            icone = <FiRefreshCw className="h-6 w-6 text-blue-600" />;
        }

        return (
            <div className="p-8 text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                    {icone}
                </div>
                <h3 className={`text-lg font-medium ${corTitulo} mb-2`}>{titulo}</h3>
                <p className="text-sm text-gray-500 mb-1">Venda #{saleId}</p>

                {statusVendaFinal === 'paga' && (
                    <>
                        <p className="text-sm text-gray-500 mb-4">Ordem de Serviço: {osId}</p>
                        <p className="text-sm text-gray-600 mb-6">
                            A ordem de serviço foi registrada e está aguardando montagem.
                        </p>
                    </>
                )}

                {/* Resumo dos métodos de pagamento utilizados */}
                <div className="mb-6 p-4 border-2 border-gray-200 bg-gray-50 rounded-sm">
                    <h4 className="font-medium text-gray-700 mb-3">Resumo dos Pagamentos</h4>

                    <div className="space-y-3">
                        {paymentMethods.map((payment, idx) => {
                            let methodIcon, methodColor, methodName;

                            switch (payment.method) {
                                case 'dinheiro':
                                    methodIcon = <FiDollarSign />;
                                    methodColor = 'text-green-600';
                                    methodName = 'Dinheiro';
                                    break;
                                case 'cartao':
                                    methodIcon = <FiCreditCard />;
                                    methodColor = 'text-blue-600';
                                    methodName = 'Cartão';
                                    break;
                                case 'pix':
                                    methodIcon = <span className="font-bold">PIX</span>;
                                    methodColor = 'text-purple-600';
                                    methodName = 'PIX';
                                    break;
                                case 'boleto':
                                    methodIcon = <FiFileText />;
                                    methodColor = 'text-yellow-600';
                                    methodName = 'Boleto';
                                    break;
                                case 'ted':
                                    methodIcon = <FiActivity />;
                                    methodColor = 'text-blue-500';
                                    methodName = 'TED';
                                    break;
                                case 'crediario':
                                    methodIcon = <FiClipboard />;
                                    methodColor = 'text-purple-700';
                                    methodName = 'Crediário';
                                    break;
                                case 'cashback':
                                    methodIcon = <FiPercent />;
                                    methodColor = 'text-orange-500';
                                    methodName = 'Cashback';
                                    break;
                                case 'crypto':
                                    methodIcon = payment.details?.moeda === 'bitcoin' ? <FaBitcoin /> : <FaEthereum />;
                                    methodColor = 'text-amber-500';
                                    methodName = payment.details?.moeda === 'bitcoin' ? 'Bitcoin' : 'Ethereum';
                                    break;
                                default:
                                    methodIcon = <FiDollarSign />;
                                    methodColor = 'text-gray-600';
                                    methodName = payment.method;
                            }

                            return (
                                <div key={idx} className="flex justify-between items-center p-2 rounded border border-gray-200">
                                    <div className="flex items-center">
                                        <span className={`mr-2 ${methodColor}`}>{methodIcon}</span>
                                        <span className="font-medium">{methodName}</span>
                                    </div>
                                    <span className="font-semibold">{formatCurrency(payment.value)}</span>
                                </div>
                            );
                        })}

                        <div className="flex justify-between items-center p-2 mt-2 font-bold border-t border-gray-300">
                            <span>Total</span>
                            <span className="text-[#81059e]">{formatCurrency(calculateTotal())}</span>
                        </div>
                    </div>
                </div>

                {/* Conteúdo específico para boleto */}
                {paymentMethods.some(p => p.method === 'boleto') && boletoData && (
                    <div className="mb-6 p-4 border-2 border-dashed border-yellow-400 bg-yellow-50 rounded-sm">
                        <h4 className="font-medium text-yellow-700 mb-2">Boleto Gerado</h4>
                        <p className="text-sm text-gray-700 mb-1">Vencimento: {new Date(boletoData.dataVencimento).toLocaleDateString('pt-BR')}</p>
                        <p className="text-xs font-mono bg-white p-2 border border-gray-200 rounded mb-2 overflow-x-auto">
                            {boletoData.linhaDigitavel}
                        </p>
                        <div className="flex justify-center mb-2">
                            <button
                                onClick={() => window.open(boletoData.url, '_blank')}
                                className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-yellow-500 border border-transparent rounded-md hover:bg-yellow-600"
                            >
                                <FiPrinter className="mr-2" /> Imprimir Boleto
                            </button>
                        </div>
                        <p className="text-xs text-gray-500">
                            O boleto também foi enviado para o e-mail do cliente. O pagamento será confirmado em até 2 dias úteis.
                        </p>
                    </div>
                )}

                {/* Conteúdo específico para TED */}
                {paymentMethods.some(p => p.method === 'ted') && (
                    <div className="mb-6 p-4 border-2 border-dashed border-blue-400 bg-blue-50 rounded-sm">
                        <h4 className="font-medium text-blue-700 mb-2">Transferência Bancária (TED)</h4>
                        <p className="text-sm text-gray-700 mb-3">Por favor, realize a transferência para:</p>
                        <div className="text-sm bg-white p-3 border border-gray-200 rounded-sm mb-3 text-left">
                            <p><strong>Banco:</strong> Banco do Brasil</p>
                            <p><strong>Agência:</strong> 1234-5</p>
                            <p><strong>Conta:</strong> 67890-1</p>
                            <p><strong>CNPJ:</strong> 12.345.678/0001-90</p>
                            <p><strong>Favorecido:</strong> MASI Óticas LTDA</p>
                            <p><strong>Valor:</strong> {formatCurrency(paymentMethods.find(p => p.method === 'ted')?.value || 0)}</p>
                        </div>
                        <p className="text-xs text-gray-500 mb-2">
                            Após realizar a transferência, envie o comprovante para nosso WhatsApp ou e-mail
                            para agilizar a confirmação do pagamento.
                        </p>
                        <button
                            onClick={() => {
                                // Implementar função para enviar dados por WhatsApp
                                const message = `Olá! Realizei o pagamento da venda #${saleId}. Segue o comprovante.`;
                                window.open(`https://wa.me/5500000000000?text=${encodeURIComponent(message)}`, '_blank');
                            }}
                            className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-green-500 border border-transparent rounded-md hover:bg-green-600"
                        >
                            <FiMessageSquare className="mr-2" /> Enviar via WhatsApp
                        </button>
                    </div>
                )}

                {/* Conteúdo específico para crypto */}
                {paymentMethods.some(p => p.method === 'crypto') && (
                    <div className="mb-6 p-4 border-2 border-dashed border-amber-400 bg-amber-50 rounded-sm">
                        <h4 className="font-medium text-amber-700 mb-2">Pagamento com Criptomoedas</h4>
                        {paymentMethods.filter(p => p.method === 'crypto').map((payment, idx) => (
                            <div key={idx} className="mb-3 last:mb-0">
                                <p className="text-sm mb-1">
                                    <span className="font-medium">Moeda:</span> {payment.details?.moeda === 'bitcoin' ? 'Bitcoin (BTC)' : 'Ethereum (ETH)'}
                                </p>
                                <p className="text-sm mb-1">
                                    <span className="font-medium">Valor em {payment.details?.moeda === 'bitcoin' ? 'BTC' : 'ETH'}:</span> {payment.details?.valor_crypto}
                                </p>
                                <p className="text-sm mb-1">
                                    <span className="font-medium">Endereço:</span> <span className="font-mono text-xs bg-white px-2 py-1 rounded">{payment.details?.endereco}</span>
                                </p>
                                <p className="text-xs text-gray-600 mt-2">
                                    Aguardando confirmação da transação na blockchain. Este processo pode levar até 30 minutos.
                                </p>
                            </div>
                        ))}
                    </div>
                )}

                <div className="flex justify-center space-x-4">
                    <button
                        onClick={handleClose}
                        className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-[#81059e] border border-transparent rounded-md hover:bg-[#6f0486]"
                    >
                        Concluir
                    </button>

                    <button
                        onClick={() => {
                            // Lógica para imprimir comprovante
                            // Por enquanto apenas fecha o modal
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
                </div>
            </div>
        );
    };

    // Renderizar painel de métodos de pagamento
    const renderPaymentMethodsPanel = () => {
        return (
            <div className="mb-6">
                <div className="flex justify-between items-center mb-3">
                    <label className="block text-[#81059e] font-medium flex items-center gap-1">
                        <FiCreditCard /> Formas de Pagamento
                    </label>

                    <div className="flex items-center space-x-2">
                        <div className="flex items-center">
                            <input
                                type="radio"
                                id="auto-distribution"
                                checked={valueDistribution === 'auto'}
                                onChange={() => {
                                    setValueDistribution('auto');
                                    // Recalcular valores automaticamente
                                    setTimeout(() => {
                                        paymentMethods.forEach((_, i) => updatePaymentMethodValue(i));
                                    }, 0);
                                }}
                                className="mr-1"
                            />
                            <label htmlFor="auto-distribution" className="text-sm">Auto</label>
                        </div>
                        <div className="flex items-center">
                            <input
                                type="radio"
                                id="manual-distribution"
                                checked={valueDistribution === 'manual'}
                                onChange={() => setValueDistribution('manual')}
                                className="mr-1"
                            />
                            <label htmlFor="manual-distribution" className="text-sm">Manual</label>
                        </div>
                    </div>
                </div>

                {/* Lista de métodos de pagamento */}
                <div className="space-y-3">
                    {paymentMethods.map((payment, index) => (
                        <div
                            key={index}
                            className={`p-3 border-2 rounded-sm ${currentPaymentIndex === index ? 'border-[#81059e] bg-purple-50' : 'border-gray-200'
                                }`}
                        >
                            <div className="flex justify-between items-center mb-2">
                                <div className="flex items-center">
                                    <button
                                        onClick={() => setCurrentPaymentIndex(index)}
                                        className={`mr-2 p-1 rounded-full ${currentPaymentIndex === index ? 'bg-[#81059e] text-white' : 'bg-gray-200'
                                            }`}
                                    >
                                        {index + 1}
                                    </button>
                                    <span className="font-medium">Pagamento {index + 1}</span>
                                </div>

                                {paymentMethods.length > 1 && (
                                    <button
                                        onClick={() => removePaymentMethod(index)}
                                        className="text-red-500 hover:text-red-700"
                                    >
                                        <FiTrash2 size={16} />
                                    </button>
                                )}
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-3">
                                <button
                                    type="button"
                                    onClick={() => changePaymentMethod(index, 'dinheiro')}
                                    className={`p-2 border rounded-md flex items-center justify-center ${payment.method === 'dinheiro'
                                        ? 'bg-[#81059e] text-white border-[#81059e]'
                                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                        }`}
                                >
                                    <FiDollarSign className="mr-1" /> Dinheiro
                                </button>

                                <button
                                    type="button"
                                    onClick={() => changePaymentMethod(index, 'cartao')}
                                    className={`p-2 border rounded-md flex items-center justify-center ${payment.method === 'cartao'
                                        ? 'bg-[#81059e] text-white border-[#81059e]'
                                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                        }`}
                                >
                                    <FiCreditCard className="mr-1" /> Cartão
                                </button>

                                <button
                                    type="button"
                                    onClick={() => changePaymentMethod(index, 'pix')}
                                    className={`p-2 border rounded-md flex items-center justify-center ${payment.method === 'pix'
                                        ? 'bg-[#81059e] text-white border-[#81059e]'
                                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                        }`}
                                >
                                    PIX
                                </button>

                                <button
                                    type="button"
                                    onClick={() => changePaymentMethod(index, 'crediario')}
                                    className={`p-2 border rounded-md flex items-center justify-center ${payment.method === 'crediario'
                                        ? 'bg-[#81059e] text-white border-[#81059e]'
                                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                        }`}
                                >
                                    Crediário
                                </button>

                                <button
                                    type="button"
                                    onClick={() => changePaymentMethod(index, 'boleto')}
                                    className={`p-2 border rounded-md flex items-center justify-center ${payment.method === 'boleto'
                                        ? 'bg-[#81059e] text-white border-[#81059e]'
                                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                        }`}
                                >
                                    <FiFileText className="mr-1" /> Boleto
                                </button>

                                <button
                                    type="button"
                                    onClick={() => changePaymentMethod(index, 'ted')}
                                    className={`p-2 border rounded-md flex items-center justify-center ${payment.method === 'ted'
                                        ? 'bg-[#81059e] text-white border-[#81059e]'
                                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                        }`}
                                >
                                    TED
                                </button>

                                <button
                                    type="button"
                                    onClick={() => changePaymentMethod(index, 'cashback')}
                                    className={`p-2 border rounded-md flex items-center justify-center ${payment.method === 'cashback'
                                        ? 'bg-[#81059e] text-white border-[#81059e]'
                                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                        }`}
                                    disabled={cashbackDisponivel <= 0}
                                    title={cashbackDisponivel <= 0 ? "Cliente não possui saldo de cashback" : ""}
                                >
                                    <FiPercent className="mr-1" /> Cashback
                                </button>

                                <button
                                    type="button"
                                    onClick={() => changePaymentMethod(index, 'crypto')}
                                    className={`p-2 border rounded-md flex items-center justify-center ${payment.method === 'crypto'
                                        ? 'bg-[#81059e] text-white border-[#81059e]'
                                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                        }`}
                                >
                                    <FaBitcoin className="mr-1" /> Crypto
                                </button>
                            </div>

                            <div className="grid ">
                                <label className="text-sm font-medium text-gray-700 mb-2">Valor:</label>
                                <input
                                    type="text"
                                    value={formatCurrency(payment.value)}
                                    onChange={(e) => handlePaymentValueChange(index, e.target.value)}
                                    className={`border p-2 w-32 mb-4 ${valueDistribution === 'auto' ? 'bg-gray-100' : ''
                                        }`}
                                    readOnly={valueDistribution === 'auto'}
                                />

                                {/* Botão para configurar valor total */}
                                {valueDistribution === 'manual' && (
                                    <button
                                        onClick={() => handlePaymentValueChange(index, calculateTotal().toString())}
                                        className="p-2 border rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 text-sm"
                                        title="Definir valor total"
                                    >
                                        Total
                                    </button>
                                )}

                                {/* Botão para processar o pagamento quando necessário */}
                                {!payment.processed && (
                                    <button
                                        onClick={() => processPaymentMethod(index)}
                                        className="p-2 border rounded-md bg-[#81059e] text-white hover:bg-[#6f0486] text-sm"
                                    >
                                        Processar
                                    </button>
                                )}

                                {/* Indicador de processado */}
                                {payment.processed && (
                                    <span className="text-green-600 flex items-center text-sm">
                                        <FiCheck className="mr-1" /> Processado
                                    </span>
                                )}
                            </div>

                            {/* Campos específicos para cada método de pagamento */}
                            {payment.method === 'cartao' && !payment.processed && (
                                <div className="p-2 border border-gray-200 rounded-sm mt-2 bg-gray-50">
                                    <p className="text-sm">Clique em "Processar" para inserir os dados do cartão.</p>
                                </div>
                            )}

                            {payment.method === 'cartao' && payment.processed && payment.details && (
                                <div className="p-2 border border-gray-200 rounded-sm mt-2 bg-green-50">
                                    <p className="text-sm mb-1">
                                        <span className="font-medium">Cartão:</span> **** **** **** {payment.details.ultimos_digitos}
                                    </p>
                                    <p className="text-sm mb-1">
                                        <span className="font-medium">Bandeira:</span> {payment.details.bandeira}
                                    </p>
                                    {payment.details.parcelas > 1 && (
                                        <p className="text-sm">
                                            <span className="font-medium">Parcelamento:</span> {payment.details.parcelas}x
                                        </p>
                                    )}
                                </div>
                            )}

                            {payment.method === 'cashback' && (
                                <div className="p-2 border border-gray-200 rounded-sm mt-2 bg-amber-50">
                                    <div className="flex justify-between items-center">
                                        <p className="text-sm font-medium">Saldo disponível:</p>
                                        <p className="text-sm font-semibold text-green-700">{formatCurrency(cashbackDisponivel)}</p>
                                    </div>

                                    {payment.value > cashbackDisponivel && (
                                        <p className="text-xs text-red-600 mt-1">
                                            Valor excede o saldo disponível. Ajuste o valor ou use outro método.
                                        </p>
                                    )}
                                </div>
                            )}

                            {payment.method === 'crypto' && !payment.processed && (
                                <div className="p-2 border border-gray-200 rounded-sm mt-2 bg-gray-50">
                                    <div className="mb-2">
                                        <label className="text-sm font-medium block mb-1">Selecione a criptomoeda:</label>
                                        <div className="flex space-x-2">
                                            <button
                                                type="button"
                                                onClick={() => setSelectedCrypto('bitcoin')}
                                                className={`p-2 border rounded-md flex items-center justify-center ${selectedCrypto === 'bitcoin'
                                                    ? 'bg-amber-500 text-white border-amber-500'
                                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                                    }`}
                                            >
                                                <FaBitcoin className="mr-1" /> Bitcoin
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => setSelectedCrypto('ethereum')}
                                                className={`p-2 border rounded-md flex items-center justify-center ${selectedCrypto === 'ethereum'
                                                    ? 'bg-blue-500 text-white border-blue-500'
                                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                                    }`}
                                            >
                                                <FaEthereum className="mr-1" /> Ethereum
                                            </button>
                                        </div>
                                    </div>

                                    <div className="mb-2">
                                        <label className="text-sm font-medium block mb-1">Endereço da carteira:</label>
                                        <input
                                            type="text"
                                            value={cryptoAddress}
                                            onChange={(e) => setCryptoAddress(e.target.value)}
                                            placeholder={`Endereço de ${selectedCrypto === 'bitcoin' ? 'Bitcoin' : 'Ethereum'}`}
                                            className="border p-2 rounded-sm w-full text-sm font-mono"
                                        />
                                    </div>

                                    <div className="text-xs text-gray-500">
                                        Taxa de câmbio: 1 {selectedCrypto === 'bitcoin' ? 'BTC' : 'ETH'} =
                                        {selectedCrypto === 'bitcoin' ? ' R$ 217.391,30' : ' R$ 11.904,76'}
                                    </div>
                                </div>
                            )}

                            {payment.method === 'boleto' && (
                                <div className="p-2 border border-gray-200 rounded-sm mt-2 bg-gray-50">
                                    <label className="text-sm font-medium block mb-1">Data de Vencimento:</label>
                                    <input
                                        type="date"
                                        className="border border-gray-300 rounded-md p-2 w-full"
                                        value={boletoVencimento}
                                        onChange={(e) => setBoletoVencimento(e.target.value)}
                                        min={new Date().toISOString().split('T')[0]}
                                    />
                                </div>
                            )}

                            {payment.method === 'crediario' && (
                                <div className="p-2 border border-gray-200 rounded-sm mt-2 bg-gray-50">
                                    <label className="text-sm font-medium block mb-1">Número de Parcelas:</label>
                                    <select
                                        className="border border-gray-300 rounded-md p-2 w-full"
                                        value={parcelasCredario}
                                        onChange={(e) => setParcelasCredario(e.target.value)}
                                    >
                                        <option value="2">2x</option>
                                        <option value="3">3x</option>
                                        <option value="4">4x</option>
                                        <option value="5">5x</option>
                                        <option value="6">6x</option>
                                        <option value="10">10x</option>
                                        <option value="12">12x</option>
                                    </select>

                                    <div className="mt-2 text-sm">
                                        <p>Valor por parcela: <span className="font-semibold text-[#81059e]">
                                            {formatCurrency(payment.value / parseInt(parcelasCredario))}
                                        </span></p>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Botão para adicionar mais um método de pagamento */}
                <button
                    onClick={addPaymentMethod}
                    className="mt-3 flex items-center justify-center w-full p-2 border-2 border-dashed border-[#81059e] rounded-sm text-[#81059e] hover:bg-purple-50"
                >
                    <FiPlusCircle className="mr-2" /> Adicionar Forma de Pagamento
                </button>

                {/* Resumo dos valores */}
                <div className="mt-4 p-3 bg-gray-100 rounded-sm">
                    <div className="flex justify-between items-center text-sm">
                        <span>Total da venda:</span>
                        <span className="font-medium">{formatCurrency(calculateTotal())}</span>
                    </div>

                    <div className="flex justify-between items-center text-sm mt-1">
                        <span>Total alocado:</span>
                        <span className={`font-medium ${isPaymentComplete() ? 'text-green-600' : 'text-red-600'
                            }`}>
                            {formatCurrency(calculateTotalAllocated())}
                        </span>
                    </div>

                    {!isPaymentComplete() && (
                        <div className="flex justify-between items-center text-sm mt-1">
                            <span>Valor restante:</span>
                            <span className="font-medium text-red-600">{formatCurrency(calculateRemainingValue())}</span>
                        </div>
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
                            <FiShoppingCart className="mr-1" /> Nova Venda
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
                                {/* Coluna da esquerda: Detalhes da venda */}
                                <div>
                                    {/* Data e Vendedor */}
                                    <div className="mb-4">
                                        <div className="flex">
                                            <div className="flex items-center gap-2">
                                                <FiCalendar className="text-[#81059e]" />
                                                <span className="font-medium">Data:</span>
                                                <span>{dataVenda.toLocaleDateString('pt-BR')}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <FiUser className="text-[#81059e]" />
                                            <span className="font-medium">Vendedor:</span>
                                            <span>{vendedor}</span>
                                        </div>
                                    </div>

                                    {/* Seleção de Cliente */}
                                    <div className="mb-8 mt-8">
                                        <label className="block text-[#81059e] text-2xl font-medium mb-1 flex items-center gap-1">
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
                                                    userId={user?.uid}
                                                    userName={userData?.nome || user?.email}
                                                />
                                            </div>
                                        ) : (
                                            <>
                                                <div className="flex gap-2 ">
                                                    <div className="relative flex-1mb-32">
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
                                                            <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-300 max-h-60 overflow-auto">
                                                                {filteredClients.map(client => (
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

                                        {/* Tabela de Itens no Carrinho */}
                                        <div className="border-2 border-gray-200 rounded-sm overflow-hidden">
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
                                        <label className="block text-lg  mb-1 flex items-center gap-1 text-xl">
                                            <FiFileText /> <p className=''>Observações</p>
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
                                            <label className="block text-[#81059e] font-medium flex items-center gap-1">
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
                                            type="number"
                                            min="0"
                                            value={discount}
                                            onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                                            className="border-2 border-[#81059e] p-2 rounded-sm w-full"
                                            placeholder={discountType === 'percentage' ? "Desconto em %" : "Desconto em R$"}
                                        />
                                    </div>

                                    {/* Resumo da Venda */}
                                    <div className="bg-gray-50 p-4 rounded-sm mb-4">
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

                                    {/* Painel de múltiplos pagamentos */}
                                    {renderPaymentMethodsPanel()}

                                    {/* Botão de finalizar venda */}
                                    <button
                                        onClick={handleFinalizarClicked}
                                        disabled={loading || cartItems.length === 0 || !selectedClient || !isPaymentComplete()}
                                        className="w-full bg-[#81059e] text-white py-3 px-4 rounded-sm flex items-center justify-center font-medium hover:bg-[#6f0486] disabled:bg-purple-300 disabled:cursor-not-allowed"
                                    >
                                        {loading ? (
                                            <>
                                                <div className="animate-spin h-5 w-5 border-2 border-white rounded-full border-t-transparent mr-2"></div>
                                                Processando...
                                            </>
                                        ) : (
                                            <>
                                                <FiCheck className="mr-2" /> Finalizar Venda
                                            </>
                                        )}
                                    </button>

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

export default ModalNovaVenda;
