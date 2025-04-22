// components/ModalNovaVenda.js
import { useState, useEffect, useRef } from 'react';
import {
    collection, getDocs, doc, getDoc, addDoc, updateDoc, query, where, serverTimestamp, setDoc
} from 'firebase/firestore';
import { FiClock, FiRefreshCw, FiMessageSquare, FiPrinter, FiEye } from 'react-icons/fi';
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
import PaymentMethodPanel from './PaymentMethodPanel';
import Link from 'next/link';
import { createNotification } from '@/lib/notifications';
import { QrReader } from 'react-qr-reader';


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


const ModalNovaVenda = ({ isOpen, onClose, selectedLoja }) => {

    // Estado para gerenciamento de clientes
    // Obtém informações do usuário atual
    const { user, userData } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [clients, setClients] = useState([]);
    const [filteredClients, setFilteredClients] = useState([]);
    const [selectedClient, setSelectedClient] = useState(null);
    const [showClientForm, setShowClientForm] = useState(false);
    const [collections, setCollections] = useState([]);

    // Estados para gerenciamento de produtos
    const [products, setProducts] = useState([]);
    const [productSearchTerm, setProductSearchTerm] = useState('');
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [cartItems, setCartItems] = useState([]);

    // Estado adicional para controlar se os dados foram carregados
    const [initialized, setInitialized] = useState(false);

    // Estados para observações e detalhes da venda
    const [observation, setObservation] = useState('');

    // Estados para pagamento e descontos
    const [discount, setDiscount] = useState(0);
    const [discountType, setDiscountType] = useState('percentage');
    const [discountFormatted, setDiscountFormatted] = useState('');
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
    const [valueDistribution, setValueDistribution] = useState('auto');

    // Estados para formulário de cartão de crédito
    const [showCreditCardForm, setShowCreditCardForm] = useState(false);
    const [dadosCartao, setDadosCartao] = useState(null);
    const [boletoData, setBoletoData] = useState(null);
    const [boletoVencimento, setBoletoVencimento] = useState(
        new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    );
    const [parcelasCredario, setParcelasCredario] = useState("3");
    const [statusPagamentoFinal, setStatusPagamentoFinal] = useState("");
    const [statusVendaFinal, setStatusVendaFinal] = useState("");

    // Estados para cashback e criptomoedas
    const [cashbackDisponivel, setCashbackDisponivel] = useState(0);
    const [selectedCrypto, setSelectedCrypto] = useState('bitcoin');
    const [cryptoAddress, setCryptoAddress] = useState('');

    // Informações sobre a venda
    const [vendedor, setVendedor] = useState('');
    const [dataVenda, setDataVenda] = useState(new Date());

    // Estados para gerenciar OS
    const [showOSForm, setShowOSForm] = useState(false);
    const [currentOSIndex, setCurrentOSIndex] = useState(0);
    const [osFormData, setOsFormData] = useState([]);
    const [pendingOS, setPendingOS] = useState(false);

    // Novos estados para o QrReader
    const [showQrScanner, setShowQrScanner] = useState(false);
    const [scannedQrData, setScannedQrData] = useState(null);

    // Modificação do useEffect para evitar que o modal abra sozinho
    useEffect(() => {
        // Verificação rigorosa para garantir que o modal só carregue dados quando realmente for aberto
        if (isOpen && selectedLoja && !initialized) {
            const loadInitialData = async () => {
                setLoading(true);
                try {
                    setInitialized(true);
                    await fetchClients();
                    await fetchProducts();
                    await fetchCashbackDisponivel();
                    setDataVenda(new Date());
                    updatePaymentMethodValue(0);
                } catch (error) {
                    console.error('Erro ao carregar dados iniciais:', error);
                    setError('Erro ao carregar dados iniciais: ' + error.message);
                } finally {
                    setLoading(false);
                }
            };

            loadInitialData();
        }

        // Quando o modal for fechado, resetar o estado de inicialização
        if (!isOpen && initialized) {
            setInitialized(false);
            setProducts([]);
            setError('');
        }
    }, [isOpen, selectedLoja]);

    // Adicione um useEffect separado exclusivamente para atualizar o vendedor
    useEffect(() => {
        if (isOpen && initialized && userData) {
            setVendedor(userData.nome || user?.email || 'Vendedor');
        }
    }, [userData, user, isOpen, initialized]);

    // Atualizar o valor do método de pagamento atual quando o total mudar
    useEffect(() => {
        if (valueDistribution === 'auto' && paymentMethods.length === 1) {
            updatePaymentMethodValue(0);
        }
    }, [cartItems, discount, discountType]);

    // Atualizar formatação quando o tipo de desconto mudar
    useEffect(() => {
        if (discount > 0) {
            if (discountType === 'percentage') {
                setDiscountFormatted(discount.toLocaleString('pt-BR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                }));
            } else {
                setDiscountFormatted(discount.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                    minimumFractionDigits: 2
                }).replace('R$', '').trim());
            }
        } else {
            setDiscountFormatted('');
        }
    }, [discountType, discount]);

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

    // Buscar cashback disponível do cliente
    const fetchCashbackDisponivel = async () => {
        // Esta função seria implementada para buscar o saldo de cashback do cliente
        // Por enquanto, usando um valor fictício para demonstração
        setCashbackDisponivel(50.75);
    };

    // Carregar produtos do estoque
    const fetchProducts = async () => {
        try {
            const categories = ['armacoes', 'lentes', 'solares'];
            let allProducts = [];
            let totalProdutos = 0;

            for (const category of categories) {
                let queryRef;

                // Se não for admin, filtra por loja
                if (!userData?.isAdmin && selectedLoja) {
                    queryRef = query(collection(firestore, category), where('loja', '==', selectedLoja));
                } else {
                    queryRef = collection(firestore, category);
                }

                const querySnapshot = await getDocs(queryRef);
                const productsInCategory = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    category
                }));

                // Filtra produtos com quantidade maior que 0
                const availableProducts = productsInCategory.filter(product => {
                    const quantidade = parseInt(product.quantidade) || 0;
                    return quantidade > 0;
                });

                console.log(`Found ${availableProducts.length} available products in ${category} for loja ${selectedLoja}`);
                allProducts = [...allProducts, ...availableProducts];
                totalProdutos += productsInCategory.length;
            }

            if (allProducts.length === 0) {
                if (totalProdutos === 0) {
                    setError('Não há produtos cadastrados no estoque desta loja.');
                } else {
                    setError('Todos os produtos desta loja estão com estoque zerado. Por favor, atualize o estoque.');
                }
            } else {
                setError(''); // Limpa o erro se encontrou produtos
            }

            console.log('Total products loaded:', allProducts.length, 'for loja:', selectedLoja);
            setProducts(allProducts);

        } catch (error) {
            console.error('Error fetching products:', error);
            setError('Erro ao carregar produtos: ' + error.message);
            setProducts([]); // Reseta produtos em caso de erro
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

    // Função para obter as coleções que precisam de OS
    // Atualize a função getOSCollections para usar as collections deste componente
    // Função para obter as coleções que precisam de OS
    const getOSCollections = () => {
        return collections.filter(c => {
            // Verifica se tem armação E lentes (caso padrão)
            const hasFrameAndLens = c.items.some(item => item.categoria === 'armacoes') &&
                c.items.some(item => item.categoria === 'lentes');

            // Verifica se tem apenas armação ou apenas lentes mas com forceGenerateOS ativado
            const hasFrameOrLensAndForced = c.forceGenerateOS &&
                (c.items.some(item => item.categoria === 'armacoes') ||
                    c.items.some(item => item.categoria === 'lentes'));

            // Gera OS se: 
            // 1. generateOS está ativo E
            // 2. Tem armação E lentes OU tem armação OU lentes com força ativada
            return c.generateOS && (hasFrameAndLens || hasFrameOrLensAndForced);
        });
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

        // Verificar se tem estoque disponível
        const quantidadeEstoque = parseInt(product.quantidade) || 0;
        if (quantidadeEstoque < newProductQty && error !== 'Aviso: Mostrando produtos sem estoque disponível') {
            setError(`Quantidade solicitada excede o estoque disponível (${quantidadeEstoque})`);
            setTimeout(() => setError(''), 3000);
            return;
        }

        try {
            // Verificar o tipo de produto
            const isFrame = product.categoria === 'armacoes';
            const isLens = product.categoria === 'lentes';
            const isSunglass = product.categoria === 'solares';

            // Se for óculos de sol, não precisa de OS
            const requiresOS = !isSunglass;

            // Verificar se já existe uma armação no carrinho quando adicionar uma lente
            if (isLens) {
                const hasFrame = cartItems.some(item => item.categoria === 'armacoes');
                if (!hasFrame) {
                    setError('É necessário adicionar uma armação antes de adicionar lentes');
                    setTimeout(() => setError(''), 3000);
                    return;
                }
            }

            // Verificar se já existe uma lente no carrinho quando adicionar uma armação
            if (isFrame) {
                const hasLens = cartItems.some(item => item.categoria === 'lentes');
                if (hasLens) {
                    setError('Já existe uma lente no carrinho. Remova a lente antes de adicionar uma nova armação.');
                    setTimeout(() => setError(''), 3000);
                    return;
                }
            }

            // Verificar se o produto já está no carrinho
            const existingItem = cartItems.find(item =>
                item.id === product.id &&
                item.categoria === product.categoria
            );

            if (existingItem) {
                // Verificar se a nova quantidade total excede o estoque
                const newTotalQty = existingItem.quantity + newProductQty;
                if (quantidadeEstoque < newTotalQty && error !== 'Aviso: Mostrando produtos sem estoque disponível') {
                    setError(`Quantidade total excede o estoque disponível (${quantidadeEstoque})`);
                    setTimeout(() => setError(''), 3000);
                    return;
                }

                // Aumentar a quantidade se já estiver no carrinho
                setCartItems(cartItems.map(item =>
                    (item.id === product.id && item.categoria === product.categoria)
                        ? { ...item, quantity: newTotalQty }
                        : item
                ));
            } else {
                // Adicionar novo item ao carrinho
                const produtoFormatado = {
                    id: product.id,
                    categoria: product.categoria,
                    loja: product.loja || selectedLoja,
                    nome: product.nome || product.titulo || '',
                    codigo: product.codigo || '',
                    marca: product.marca || '',
                    sku: product.sku || '',
                    valor: parseFloat(product.valor) || 0,
                    preco: parseFloat(product.valor) || 0,
                    custo: parseFloat(product.custo) || 0,
                    quantidade: product.quantidade,
                    quantity: newProductQty,
                    requiresOS: requiresOS,
                    // Adicionar informações específicas por categoria
                    ...(isFrame && {
                        aro: product.aro,
                        ponte: product.ponte,
                        haste: product.haste,
                        material: product.material
                    }),
                    ...(isLens && {
                        indice: product.indice,
                        tratamento: product.tratamento,
                        material: product.material
                    }),
                    ...(isSunglass && {
                        protecao: product.protecao,
                        material: product.material
                    })
                };

                setCartItems([...cartItems, produtoFormatado]);
            }

            // Limpar campos
            setProductSearchTerm('');
            setFilteredProducts([]);
            setNewProductQty(1);

        } catch (err) {
            console.error("Erro ao adicionar produto ao carrinho:", err);
            setError("Erro ao adicionar produto. Tente novamente.");
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

    // Adicione esta função para lidar com a formatação do valor de desconto
    const handleDiscountChange = (e) => {
        // Remove qualquer caractere que não seja número
        const valor = e.target.value.replace(/\D/g, '');

        if (valor === '') {
            setDiscount(0);
            setDiscountFormatted('');
            return;
        }

        // Converte para número e divide por 100 para considerar os centavos
        const valorNumerico = Number(valor) / 100;

        // Atualiza o estado do desconto com o valor numérico para cálculos
        setDiscount(valorNumerico);

        // Formata o valor para exibição dependendo do tipo de desconto
        if (discountType === 'percentage') {
            // Para percentual, exibimos com até 2 casas decimais e o símbolo %
            setDiscountFormatted(valorNumerico.toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }));
        } else {
            // Para valor monetário, exibimos como moeda
            setDiscountFormatted(valorNumerico.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL'
            }).replace('R$', '').trim());
        }
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
        try {
            setLoading(true);
            setError('');

            // Verificar se há necessidade de gerar OS
            const osCollections = getOSCollections();

            if (osCollections.length > 0) {
                // Preparar dados iniciais para cada OS necessária
                const initialOSData = osCollections.map(collection => ({
                    armacaoDados: collection.items.find(item => item.categoria === 'armacoes')?.produto || '',
                    lenteDados: collection.items.find(item => item.categoria === 'lentes')?.produto || '',
                    cliente: selectedClient,
                    processed: false
                }));

                setOsFormData(initialOSData);
                setPendingOS(true);
                setCurrentOSIndex(0);
                setShowOSForm(true);
                return; // Interrompe aqui para mostrar o formulário de OS
            }

            // Se não houver OS, continua com a finalização normal da venda
            await processarVenda();

        } catch (error) {
            console.error('Erro ao finalizar venda:', error);
            setError('Erro ao finalizar venda: ' + error.message);
            setLoading(false);
        }
    };

    // Função para processar a venda após preenchimento das OS
    const processarVenda = async () => {
        try {
            // ... lógica existente de processamento da venda ...

            // Após salvar a venda, salvar as OS se existirem
            if (osFormData.length > 0) {
                for (const osData of osFormData) {
                    if (!osData.processed) continue;

                    const osRef = collection(firestore, `${selectedLoja}/services/os`);
                    await addDoc(osRef, {
                        ...osData,
                        id_venda: saleId,
                        data_criacao: new Date(),
                        status: 'processamentoInicial',
                        vendedor: vendedor
                    });
                }
            }

            setSuccess(true);
            setLoading(false);

        } catch (error) {
            console.error('Erro ao processar venda:', error);
            setError('Erro ao processar venda: ' + error.message);
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
        setShowQrScanner(false);
        setScannedQrData(null);
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

    // Adicionar componente de formulário de OS simplificado
    const OSForm = ({ data, onSubmit, onCancel }) => {
        const [formData, setFormData] = useState(data);

        const handleChange = (e) => {
            const { name, value } = e.target;
            setFormData(prev => ({ ...prev, [name]: value }));
        };

        const tipoOS = formData.tipoOS || "completa";

        return (
            <div className="bg-white p-6 rounded-lg shadow-lg max-h-[80vh] overflow-y-auto">
                <h2 className="text-lg font-bold text-[#81059e] mb-4">Dados da Ordem de Serviço</h2>

                {/* Alerta para OS especiais */}
                {(tipoOS === "somente_armacao" || tipoOS === "somente_lente") && (
                    <div className="mb-4 p-3 bg-yellow-50 border-l-4 border-yellow-500 text-yellow-700">
                        <h3 className="font-medium">Atenção: Kit Incompleto</h3>
                        <p className="text-sm">
                            {tipoOS === "somente_armacao"
                                ? "Cliente comprou apenas a armação e vai trazer suas próprias lentes."
                                : "Cliente comprou apenas as lentes e vai trazer sua própria armação."}
                        </p>
                    </div>
                )}

                <form onSubmit={(e) => {
                    e.preventDefault();
                    onSubmit(formData);
                }}>
                    {/* Campos comuns a todos os tipos de OS */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Laboratório</label>
                            <select
                                name="laboratorio"
                                value={formData.laboratorio}
                                onChange={handleChange}
                                className="w-full border border-gray-300 p-2 rounded-md"
                                required
                            >
                                <option value="">Selecione...</option>
                                <option value="Laboratório 1">Laboratório 1</option>
                                <option value="Laboratório 2">Laboratório 2</option>
                                <option value="Laboratório 3">Laboratório 3</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Status</label>
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                className="w-full border border-gray-300 p-2 rounded-md"
                                required
                            >
                                <option value="processamentoInicial">Em processamento inicial</option>
                                <option value="aguardandoCliente">Aguardando cliente trazer {tipoOS === "somente_armacao" ? "lentes" : "armação"}</option>
                                <option value="encaminhadoLaboratorio">Encaminhado ao Laboratório</option>
                                <option value="montagemProgresso">Montagem em Progresso</option>
                                <option value="prontoEntrega">Pronto para Entrega</option>
                            </select>
                        </div>
                    </div>

                    {/* Área de produtos */}
                    <div className="mb-4 border border-gray-200 rounded-lg p-4 bg-gray-50">
                        <h3 className="text-md font-medium text-[#81059e] mb-2">Produtos</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Armação */}
                            <div>
                                <div className="flex justify-between">
                                    <label className="block text-sm font-medium text-gray-700">Armação</label>
                                    {tipoOS === "somente_lente" && (
                                        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                                            Cliente traz
                                        </span>
                                    )}
                                </div>
                                {tipoOS === "somente_lente" ? (
                                    <div className="mt-2">
                                        <input
                                            type="text"
                                            name="armacaoClienteDescricao"
                                            value={formData.armacaoClienteDescricao || ""}
                                            onChange={handleChange}
                                            placeholder="Descrição da armação do cliente"
                                            className="w-full border border-gray-300 p-2 rounded-md"
                                        />
                                    </div>
                                ) : (
                                    <div className="mt-2 p-3 bg-white border border-gray-200 rounded-md">
                                        {formData.armacaoDados || "Nenhuma armação selecionada"}
                                    </div>
                                )}
                            </div>

                            {/* Lentes */}
                            <div>
                                <div className="flex justify-between">
                                    <label className="block text-sm font-medium text-gray-700">Lentes</label>
                                    {tipoOS === "somente_armacao" && (
                                        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                                            Cliente traz
                                        </span>
                                    )}
                                </div>
                                {tipoOS === "somente_armacao" ? (
                                    <div className="mt-2">
                                        <input
                                            type="text"
                                            name="lentesClienteDescricao"
                                            value={formData.lentesClienteDescricao || ""}
                                            onChange={handleChange}
                                            placeholder="Descrição das lentes do cliente"
                                            className="w-full border border-gray-300 p-2 rounded-md"
                                        />
                                    </div>
                                ) : (
                                    <div className="mt-2 p-3 bg-white border border-gray-200 rounded-md">
                                        {formData.lenteDados || "Nenhuma lente selecionada"}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Receita médica */}
                    <div className="mb-4">
                        <h3 className="text-md font-medium text-[#81059e] mb-2">Receita Médica</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <h4 className="text-sm font-medium text-gray-700">Olho Direito</h4>
                                <div className="grid grid-cols-4 gap-2">
                                    <div>
                                        <label className="block text-xs text-gray-600">Esfera</label>
                                        <input
                                            type="text"
                                            name="esferaDireito"
                                            value={formData.esferaDireito || ''}
                                            onChange={handleChange}
                                            className="w-full border border-gray-300 p-1 rounded-md text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-600">Cilindro</label>
                                        <input
                                            type="text"
                                            name="cilindroDireito"
                                            value={formData.cilindroDireito || ''}
                                            onChange={handleChange}
                                            className="w-full border border-gray-300 p-1 rounded-md text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-600">Eixo</label>
                                        <input
                                            type="text"
                                            name="eixoDireito"
                                            value={formData.eixoDireito || ''}
                                            onChange={handleChange}
                                            className="w-full border border-gray-300 p-1 rounded-md text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-600">Adição</label>
                                        <input
                                            type="text"
                                            name="adicaoDireito"
                                            value={formData.adicaoDireito || ''}
                                            onChange={handleChange}
                                            className="w-full border border-gray-300 p-1 rounded-md text-sm"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h4 className="text-sm font-medium text-gray-700">Olho Esquerdo</h4>
                                <div className="grid grid-cols-4 gap-2">
                                    <div>
                                        <label className="block text-xs text-gray-600">Esfera</label>
                                        <input
                                            type="text"
                                            name="esferaEsquerdo"
                                            value={formData.esferaEsquerdo || ''}
                                            onChange={handleChange}
                                            className="w-full border border-gray-300 p-1 rounded-md text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-600">Cilindro</label>
                                        <input
                                            type="text"
                                            name="cilindroEsquerdo"
                                            value={formData.cilindroEsquerdo || ''}
                                            onChange={handleChange}
                                            className="w-full border border-gray-300 p-1 rounded-md text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-600">Eixo</label>
                                        <input
                                            type="text"
                                            name="eixoEsquerdo"
                                            value={formData.eixoEsquerdo || ''}
                                            onChange={handleChange}
                                            className="w-full border border-gray-300 p-1 rounded-md text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-600">Adição</label>
                                        <input
                                            type="text"
                                            name="adicaoEsquerdo"
                                            value={formData.adicaoEsquerdo || ''}
                                            onChange={handleChange}
                                            className="w-full border border-gray-300 p-1 rounded-md text-sm"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Medidas pupilares */}
                    <div className="mb-4">
                        <h3 className="text-md font-medium text-[#81059e] mb-2">Medidas Pupilares</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Distância Interpupilar</label>
                                <input
                                    type="text"
                                    name="distanciaInterpupilar"
                                    value={formData.distanciaInterpupilar || ''}
                                    onChange={handleChange}
                                    className="w-full border border-gray-300 p-2 rounded-md"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Altura</label>
                                <input
                                    type="text"
                                    name="altura"
                                    value={formData.altura || ''}
                                    onChange={handleChange}
                                    className="w-full border border-gray-300 p-2 rounded-md"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Observações adicionais */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">Observações</label>
                        <textarea
                            name="observacoes"
                            value={formData.observacoes || formData.observacaoEspecial || ''}
                            onChange={handleChange}
                            className="w-full border border-gray-300 p-2 rounded-md h-20"
                            placeholder="Observações adicionais sobre a OS..."
                        />
                    </div>

                    {/* Data prevista para entrega */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">Data prevista para entrega</label>
                        <input
                            type="date"
                            name="dataPrevistaEntrega"
                            value={formData.dataPrevistaEntrega || ''}
                            onChange={handleChange}
                            className="w-full border border-gray-300 p-2 rounded-md"
                        />
                    </div>

                    <div className="flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-[#81059e] text-white rounded-md hover:bg-[#6f0486]"
                        >
                            Salvar OS
                        </button>
                    </div>
                </form>
            </div>
        );
    };


    // Renderizar informações de sucesso após finalizar a venda
    const renderSuccess = () => {
        if (pendingOS) {
            return (
                <div className="bg-white p-6">
                    <div className="text-center mb-6">
                        <h2 className="text-2xl font-bold text-[#81059e] mb-2">
                            Venda Registrada com Sucesso!
                        </h2>
                        <p className="text-gray-600">
                            Por favor, preencha os dados técnicos para cada Ordem de Serviço
                        </p>
                    </div>

                    {showOSForm ? (
                        <OSForm
                            data={osFormData[currentOSIndex]}
                            onSubmit={async (formData) => {
                                // Atualizar os dados da OS atual
                                const updatedOsFormData = [...osFormData];
                                updatedOsFormData[currentOSIndex] = { ...formData, processed: true };
                                setOsFormData(updatedOsFormData);

                                // Verificar se há mais OS para preencher
                                if (currentOSIndex < osFormData.length - 1) {
                                    setCurrentOSIndex(currentOSIndex + 1);
                                } else {
                                    // Todas as OS foram preenchidas
                                    setShowOSForm(false);
                                    await processarVenda();
                                }
                            }}
                            onCancel={() => setShowOSForm(false)}
                        />
                    ) : (
                        <div className="space-y-3">
                            {osFormData.map((os, idx) => (
                                <div key={idx} className="flex justify-between items-center p-2 rounded border border-gray-200 bg-white">
                                    <div className="text-left">
                                        <span className="font-medium">OS #{idx + 1}</span>
                                        <p className="text-sm text-gray-600">
                                            {os.armacaoDados} + {os.lenteDados}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setCurrentOSIndex(idx);
                                            setShowOSForm(true);
                                        }}
                                        className="px-3 py-1 text-xs bg-[#81059e] text-white rounded-md hover:bg-[#6f0486] flex items-center"
                                    >
                                        <FiEye className="mr-1" /> Ver Detalhes
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            );
        }

        // Renderização normal de sucesso para vendas sem OS
        return (
            <div className="p-8 text-center">
                {/* Conteúdo atual do renderSuccess */}

                {/* Adicionar seção para mostrar informações das OS */}
                {osFormData.length > 0 && (
                    <div className="mt-6 p-4 border-2 border-[#81059e] bg-purple-50 rounded-lg">
                        <h4 className="font-medium text-[#81059e] mb-3">Ordens de Serviço Geradas</h4>

                        <div className="mb-3">
                            <Link href="/products_and_services/OS/list-os">
                                <button className="bg-[#81059e] text-white px-4 py-2 rounded-md hover:bg-[#6f0486] flex items-center justify-center p-2">
                                    Ver Lista de OS
                                </button>
                            </Link>
                        </div>

                        <div className="space-y-3">
                            {osFormData.map((os, idx) => (
                                <div key={idx} className="flex justify-between items-center p-2 rounded border border-gray-200 bg-white">
                                    <div className="text-left">
                                        <span className="font-medium">OS #{idx + 1}</span>
                                        <p className="text-sm text-gray-600">
                                            {os.armacaoDados} + {os.lenteDados}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setCurrentOSIndex(idx);
                                            setShowOSForm(true);
                                        }}
                                        className="px-3 py-1 text-xs bg-[#81059e] text-white rounded-md hover:bg-[#6f0486] flex items-center"
                                    >
                                        <FiEye className="mr-1" /> Ver Detalhes
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="flex justify-center space-x-4 mt-6">
                    {/* Botões existentes */}
                </div>
            </div>
        );
    };

    // Adicionar modal de formulário de OS
    {
        showOSForm && (
            <div className="fixed inset-0 z-[80] overflow-y-auto bg-black bg-opacity-50">
                <div className="flex items-center justify-center min-h-screen p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold text-[#81059e]">
                                    {osFormData.length > 1
                                        ? `Ordem de Serviço ${currentOSIndex + 1} de ${osFormData.length}`
                                        : "Ordem de Serviço"}
                                </h2>
                                <div className="flex space-x-2">
                                    {osFormData.length > 1 && (
                                        <>
                                            <button
                                                onClick={() => setCurrentOSIndex(prev => Math.max(0, prev - 1))}
                                                disabled={currentOSIndex === 0}
                                                className="p-2 rounded-full text-gray-500 hover:bg-gray-100 disabled:opacity-50"
                                            >
                                                <FiChevronLeft />
                                            </button>
                                            <button
                                                onClick={() => setCurrentOSIndex(prev => Math.min(osFormData.length - 1, prev + 1))}
                                                disabled={currentOSIndex === osFormData.length - 1}
                                                className="p-2 rounded-full text-gray-500 hover:bg-gray-100 disabled:opacity-50"
                                            >
                                                <FiChevronRight />
                                            </button>
                                        </>
                                    )}
                                    <button
                                        onClick={() => setShowOSForm(false)}
                                        className="p-2 rounded-full text-gray-500 hover:bg-gray-100"
                                    >
                                        <FiX />
                                    </button>
                                </div>
                            </div>

                            <OSForm
                                data={osFormData[currentOSIndex]}
                                onSubmit={async (formData) => {
                                    try {
                                        // Salvar OS no Firebase
                                        const osRef = collection(firestore, `lojas/${selectedLoja}/servicos/items/items`);
                                        await addDoc(osRef, {
                                            ...formData,
                                            id_venda: saleId,
                                            cliente: {
                                                id: selectedClient.id,
                                                nome: selectedClient.nome,
                                                cpf: selectedClient.cpf,
                                                contato: selectedClient.telefone || ''
                                            },
                                            data_criacao: new Date(),
                                            data_previsao: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // +2 dias
                                        });

                                        // Atualizar o estado de osFormData
                                        const updatedOsFormData = [...osFormData];
                                        updatedOsFormData[currentOSIndex] = { ...formData, processed: true };
                                        setOsFormData(updatedOsFormData);

                                        // Se todas as OS foram processadas, fechar o formulário
                                        if (updatedOsFormData.every(os => os.processed)) {
                                            setShowOSForm(false);
                                        } else {
                                            // Avançar para a próxima OS não processada
                                            const nextIndex = updatedOsFormData.findIndex((os, idx) => idx > currentOSIndex && !os.processed);
                                            if (nextIndex !== -1) {
                                                setCurrentOSIndex(nextIndex);
                                            }
                                        }
                                    } catch (error) {
                                        console.error('Erro ao salvar OS:', error);
                                        setError('Falha ao salvar a Ordem de Serviço. Tente novamente.');
                                    }
                                }}
                                onCancel={() => setShowOSForm(false)}
                            />
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    const handleQrScan = async (result) => {
        if (result) {
            try {
                const qrData = JSON.parse(result);
                if (qrData.tipo === 'armacao') {
                    // Buscar a armação no Firestore
                    const armaçãoRef = doc(firestore, `estoque/${selectedLoja}/armacoes`, qrData.id);
                    const armaçãoDoc = await getDoc(armaçãoRef);

                    if (armaçãoDoc.exists()) {
                        const armaçãoData = armaçãoDoc.data();
                        // Adicionar ao carrinho
                        addToCart({
                            ...armaçãoData,
                            id: qrData.id,
                            quantidade: 1
                        });
                        setShowQrScanner(false);
                        setScannedQrData(null);
                    } else {
                        alert('Armação não encontrada!');
                    }
                }
            } catch (error) {
                console.error('Erro ao processar QR code:', error);
                alert('Erro ao processar QR code. Por favor, tente novamente.');
            }
        }
    };

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
                                                        {/* Ícone de busca */}
                                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                                                            <FiSearch className="text-gray-400" />
                                                        </div>
                                                        {/* Campo de busca */}
                                                        <input
                                                            type="text"
                                                            value={searchTerm}
                                                            onChange={(e) => setSearchTerm(e.target.value)}
                                                            className="border-2 border-[#81059e] pl-10 p-2 rounded-lg w-full"
                                                            placeholder="Buscar cliente por nome ou CPF"
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter' && searchTerm && filteredClients.length === 0) {
                                                                    // Se pressionar Enter com um termo de busca que não corresponde a clientes existentes
                                                                    const novoCliente = {
                                                                        id: `temp_${Date.now()}`,
                                                                        nome: searchTerm,
                                                                        cpf: "",
                                                                        telefone: ""
                                                                    };
                                                                    handleSelectClient(novoCliente);
                                                                }
                                                            }}
                                                        />

                                                        {/* Lista de sugestões */}
                                                        {filteredClients.length > 0 && (
                                                            <div className="absolute top-full mt-1 bg-white border-2 border-[#81059e] rounded-lg w-full max-h-[104px] overflow-y-auto shadow-lg custom-scroll z-20">
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

                                                    {/* Botões para ações */}
                                                    <div className="flex gap-2">
                                                        {/* Botão de usar cliente digitado */}
                                                        {searchTerm && (
                                                            <button
                                                                onClick={() => {
                                                                    // Criar um cliente simples apenas com o nome
                                                                    const novoCliente = {
                                                                        id: `temp_${Date.now()}`, // ID temporário
                                                                        nome: searchTerm,
                                                                        cpf: "",
                                                                        telefone: ""
                                                                    };
                                                                    handleSelectClient(novoCliente);
                                                                }}
                                                                className="bg-green-600 text-white p-2 rounded-lg flex items-center"
                                                                title="Usar cliente digitado"
                                                            >
                                                                <FiCheck />
                                                            </button>
                                                        )}

                                                        {/* Botão de adicionar cliente */}
                                                        <button
                                                            onClick={() => setShowClientForm(true)}
                                                            className="bg-[#81059e] text-white p-2 rounded-lg flex items-center"
                                                            title="Adicionar novo cliente"
                                                        >
                                                            <FiPlus />
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Espaço entre as seções (mantém o espaço mesmo com cliente selecionado) */}
                                                <div className={`mb-36 ${selectedClient ? 'mt-2' : 'mt-0'}`}>
                                                    {/* Exibição do cliente selecionado */}
                                                    {selectedClient && (
                                                        <div className="p-3 border-2 border-purple-100 rounded-lg bg-purple-50">
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
                                                </div>
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
                                                updateCartValue={(subtotal, updatedCollections) => {
                                                    // Captura as collections atualizadas do CarrinhoCompras
                                                    if (updatedCollections) {
                                                        setCollections(updatedCollections);
                                                    }
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

                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={discountFormatted}
                                                onChange={handleDiscountChange}
                                                className="border-2 border-[#81059e] p-2 rounded-lg w-full"
                                                placeholder={discountType === 'percentage' ? "0,00" : "0,00"}
                                            />
                                            {discountType === 'percentage' ? (
                                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                                    <span className="text-gray-500">%</span>
                                                </div>
                                            ) : (
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">

                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Resumo da Venda */}
                                    <div className="bg-gray-50 p-4 rounded-lg mb-4">
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
                                    <PaymentMethodPanel
                                        paymentMethods={paymentMethods}
                                        setPaymentMethods={setPaymentMethods}
                                        currentPaymentIndex={currentPaymentIndex}
                                        setCurrentPaymentIndex={setCurrentPaymentIndex}
                                        valueDistribution={valueDistribution}
                                        setValueDistribution={setValueDistribution}
                                        calculateTotal={calculateTotal}
                                        processPaymentMethod={processPaymentMethod}
                                        cashbackDisponivel={cashbackDisponivel}
                                    />

                                    {/* Botão de finalizar venda */}
                                    <button
                                        onClick={handleFinalizarClicked}
                                        disabled={loading || cartItems.length === 0 || !selectedClient || !isPaymentComplete()}
                                        className="w-full bg-[#81059e] text-white py-3 px-4 rounded-lg flex items-center justify-center font-medium hover:bg-[#6f0486] disabled:bg-purple-300 disabled:cursor-not-allowed"
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
            {
                showClientForm && (
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
                )
            }

            {/* Botão para escanear QR code */}
            <div className="mb-4">
                <button
                    onClick={() => setShowQrScanner(!showQrScanner)}
                    className="bg-[#81059e] text-white px-4 py-2 rounded-lg flex items-center gap-2"
                >
                    <FiSearch className="text-lg" />
                    {showQrScanner ? 'Fechar Scanner' : 'Escanear QR Code'}
                </button>
            </div>

            {/* Scanner de QR code */}
            {showQrScanner && (
                <div className="mb-4 p-4 bg-white rounded-lg">
                    <QrReader
                        onResult={(result, error) => {
                            if (result) {
                                handleQrScan(result?.text);
                            }
                            if (error) {
                                console.error(error);
                            }
                        }}
                        constraints={{ facingMode: 'environment' }}
                        className="w-full"
                    />
                </div>
            )}
        </div >
    );
};

export default ModalNovaVenda;