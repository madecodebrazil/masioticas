// components/ModalNovaVenda.js
import { useState, useEffect, useRef } from 'react';
import {
    collection, getDocs, doc, getDoc, addDoc, updateDoc, query, where, serverTimestamp
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

    // Modificação do useEffect para evitar que o modal abra sozinho
    useEffect(() => {
        // Verificação rigorosa para garantir que o modal só carregue dados quando realmente for aberto
        if (isOpen === true && selectedLoja && !initialized) {
            setInitialized(true);
            fetchClients();
            fetchProducts();
            fetchCashbackDisponivel();

            // Definir data atual
            setDataVenda(new Date());

            // Inicializar o primeiro método de pagamento com o valor total
            updatePaymentMethodValue(0);

            // Não acessar userData aqui!
        }

        // Quando o modal for fechado, resetar o estado de inicialização
        if (isOpen === false && initialized) {
            setInitialized(false);
        }
    }, [isOpen, selectedLoja, initialized]); // Remova userData e user das dependências

    // Adicione um useEffect separado exclusivamente para atualizar o vendedor
    useEffect(() => {
        if (isOpen && initialized && userData) {
            setVendedor(userData.nome || user?.email || 'Vendedor');
        }
    }, [userData, user, isOpen, initialized]);

    // Estado para controle da tabela de produtos no carrinho
    const [focusedRow, setFocusedRow] = useState(null);
    const [newProductQty, setNewProductQty] = useState(1);
    const produtoInputRef = useRef(null);

    // Estados para pagamento e descontos
    const [discount, setDiscount] = useState(0);
    const [discountType, setDiscountType] = useState('percentage'); // 'percentage' ou 'value'
    const [discountFormatted, setDiscountFormatted] = useState('');
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



    const [osFormData, setOsFormData] = useState([]);
    const [currentOSIndex, setCurrentOSIndex] = useState(0);
    const [showOSForm, setShowOSForm] = useState(false);

    useEffect(() => {
        if (isOpen === true && selectedLoja && !initialized) {
            setInitialized(true);
            fetchClients();
            fetchProducts();
            fetchCashbackDisponivel();

            // Remova essa verificação daqui
            // if (userData) { ... }

            setDataVenda(new Date());
            updatePaymentMethodValue(0);
        }

        if (isOpen === false && initialized) {
            setInitialized(false);
        }
    }, [isOpen, selectedLoja, user, initialized]); // <- userData REMOVIDO


    // Adicionar outro useEffect para garantir que o vendedor seja atualizado quando userData estiver disponível
    useEffect(() => {
        if (isOpen && initialized && userData) {
            setVendedor(userData?.nome || user?.email || 'Vendedor');
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

        // Verificar se tem estoque disponível (ignorar se estivermos mostrando produtos sem estoque)
        const quantidadeEstoque = parseInt(product.quantidade) || 0;
        if (quantidadeEstoque < newProductQty && error !== 'Aviso: Mostrando produtos sem estoque disponível') {
            setError(`Quantidade solicitada excede o estoque disponível (${quantidadeEstoque})`);
            setTimeout(() => setError(''), 3000);
            return;
        }

        // Simular loading ao adicionar
        setLoadingStates(prev => ({ ...prev, [product.id]: true }));

        try {
            // Adicionar à coleção ativa
            const collection = collections.find(c => c.id === activeCollection);

            // Verificar o tipo de produto
            const productType = product.categoria;
            const isFrame = productType === 'armacoes';
            const isLens = productType === 'lentes';
            const isSunglass = productType === 'solares';

            // Se for óculos de sol, não precisa de OS
            const requiresOS = !isSunglass;

            // Verificar limitações da coleção
            if (requiresOS) {
                // Verificar se já existe uma armação na coleção
                const hasFrame = collection.items.some(item => item.categoria === 'armacoes');
                if (isFrame && hasFrame) {
                    setError('Esta coleção já possui uma armação. Crie uma nova coleção para adicionar outra armação.');
                    setTimeout(() => setError(''), 3000);
                    return;
                }

                // Verificar se já existe uma lente na coleção
                const hasLens = collection.items.some(item => item.categoria === 'lentes');
                if (isLens && hasLens) {
                    setError('Esta coleção já possui lentes. Crie uma nova coleção para adicionar outras lentes.');
                    setTimeout(() => setError(''), 3000);
                    return;
                }
            }

            // Adicionar o produto à coleção ativa
            const updatedCollections = collections.map(c => {
                if (c.id === activeCollection) {
                    return {
                        ...c,
                        items: [...c.items, { ...product, quantity: newProductQty }],
                        requiresOS: requiresOS
                    };
                }
                return c;
            });

            setCollections(updatedCollections);

            // Verificar se o produto já está no carrinho
            const existingItem = cartItems.find(item =>
                item.id === product.id &&
                item.categoria === product.categoria &&
                item.collectionId === activeCollection
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
                    (item.id === product.id && item.categoria === product.categoria && item.collectionId === activeCollection)
                        ? { ...item, quantity: newTotalQty }
                        : item
                ));
            } else {
                // Adicionar novo item ao carrinho - CORRIGIDO para usar a mesma estrutura do componente de estoque
                const produtoFormatado = {
                    id: product.id,
                    categoria: product.categoria,
                    loja: product.loja || selectedLoja,
                    titulo: product.titulo || '',
                    nome: product.titulo || '', // Manter compatibilidade com ambos os campos
                    codigo: product.codigo || '',
                    marca: product.marca || '',
                    sku: product.sku || '',
                    valor: parseFloat(product.valor) || 0,
                    preco: parseFloat(product.valor) || 0, // Manter compatibilidade com ambos os campos
                    custo: parseFloat(product.custo) || 0,
                    quantidade: product.quantidade,
                    quantity: newProductQty, // Quantidade no carrinho
                    collectionId: activeCollection // Associar à coleção ativa
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
        } finally {
            // Garantir que o estado de loading seja sempre resetado
            setLoadingStates(prev => ({ ...prev, [product.id]: false }));

            if (produtoInputRef.current) {
                produtoInputRef.current.focus();
            }
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
                else if (payment.method === 'cartao') {
                    dadosEspecificos.ultimos_digitos = payment.details.ultimos_digitos || null;
                    dadosEspecificos.bandeira = payment.details.bandeira || null;
                    dadosEspecificos.parcelas = payment.details.parcelas || 1;
                    dadosEspecificos.gateway_id = 'simulacao_gateway';
                    dadosEspecificos.transaction_id = `tx_${Date.now()}`;
                }
                else if (payment.method === 'crediario') {
                    const numeroParcelas = parseInt(parcelasCredario) || 3;
                    const valorParcela = payment.value / numeroParcelas;

                    const parcelas = [];
                    let dataProximaParcela = new Date();

                    for (let i = 0; i < numeroParcelas; i++) {
                        dataProximaParcela = new Date(dataProximaParcela);
                        dataProximaParcela.setMonth(dataProximaParcela.getMonth() + 1);

                        parcelas.push({
                            numero: i + 1,
                            valor: valorParcela,
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
                    dadosEspecificos.saldo_utilizado = payment.value;
                    dadosEspecificos.saldo_restante = (cashbackDisponivel || 0) - payment.value;
                }
                else if (payment.method === 'crypto') {
                    dadosEspecificos.moeda = payment.details.moeda || null;
                    dadosEspecificos.endereco = payment.details.endereco || null;
                    dadosEspecificos.taxa_cambio = payment.details.taxa_cambio || null;
                    dadosEspecificos.valor_crypto = payment.details.valor_crypto || null;
                    dadosEspecificos.status_transacao = 'aguardando';
                    dadosEspecificos.transaction_id = `crypto_${Date.now()}`;
                }

                return {
                    metodo: payment.method,
                    valor: payment.value,
                    status: payment.method === 'boleto' || payment.method === 'ted' || payment.method === 'crypto'
                        ? 'pendente'
                        : 'aprovado',
                    data_processamento: new Date(),
                    dados_especificos: dadosEspecificos
                };
            });

            // 1. Estruturar dados da venda com os novos campos de pagamento
            const venda = {
                cliente: {
                    id: selectedClient.id,
                    nome: selectedClient.nome,
                    cpf: selectedClient.cpf
                },
                produtos: cartItems.map(item => ({
                    id: item.id,
                    categoria: item.categoria,
                    nome: item.nome || item.info_geral?.nome || null,
                    codigo: item.codigo || item.info_geral?.codigo || null,
                    marca: item.marca || item.info_geral?.marca || null,
                    preco: item.preco || item.info_geral?.preco || 0,
                    quantidade: item.quantity,
                    total: (item.preco || item.info_geral?.preco || 0) * item.quantity
                })),
                pagamentos: dadosPagamento,
                pagamento_resumo: {
                    valor_total: total,
                    metodos_utilizados: paymentMethods.map(p => p.method),
                    status_geral: statusPagamento,
                    data_criacao: new Date(), // Modificado de serverTimestamp()
                    data_aprovacao: statusPagamento === 'aprovado' ? new Date() : null, // Modificado de serverTimestamp()
                },
                subtotal: subtotal,
                desconto: {
                    tipo: discountType,
                    valor: discount,
                    total: discountAmount
                },
                total: total,
                data: new Date(), // Modificado de serverTimestamp()
                vendedor: {
                    id: user?.uid || null,
                    nome: vendedor || null
                },
                observacao: observation || null,
                status_venda: statusVenda,
                os_id: newOsId,
                requer_montagem: true,
                historico_status: [
                    {
                        status: statusVenda,
                        data: new Date(),
                        responsavel: {
                            id: user?.uid || null,
                            nome: vendedor || null
                        }
                    }
                ],
            };

            // 2. Sanitizar o objeto para remover valores undefined
            const vendaSanitizada = removerValoresUndefined(venda);

            // 3. Registrar venda no Firebase
            const vendaRef = collection(firestore, `lojas/${selectedLoja}/vendas/items/items`);
            const novaVendaRef = await addDoc(vendaRef, vendaSanitizada);

            // 4. Atualizar estoque apenas se o pagamento for aprovado ou for crediário
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

            // 5. Registrar ordem de serviço apenas se pagamento aprovado ou crediário
            if (statusVenda === 'paga') {
                // Usar a função getOSCollections para obter as coleções que devem gerar OS
                const osCollections = getOSCollections();

                if (osCollections.length > 0) {
                    // Preparar dados para o formulário de OS
                    const osDataList = osCollections.map(collection => {
                        // Extrair dados dos produtos na coleção
                        const armacao = collection.items.find(item => item.categoria === 'armacoes') || null;
                        const lente = collection.items.find(item => item.categoria === 'lentes') || null;

                        // Determinar o tipo de OS baseado nos produtos presentes
                        let tipoOS = "completa"; // padrão
                        if (armacao && !lente) {
                            tipoOS = "somente_armacao";
                        } else if (!armacao && lente) {
                            tipoOS = "somente_lente";
                        }

                        const osData = {
                            collectionId: collection.id,
                            data: new Date().toISOString().split('T')[0],
                            hora: new Date().toTimeString().split(' ')[0].substring(0, 5),
                            loja: selectedLoja,
                            cliente: selectedClient.nome,
                            referencia: `Venda #${novaVendaRef.id}`,
                            laboratorio: "", // A ser selecionado no formulário
                            dataMontagemInicial: new Date().toISOString().split('T')[0],
                            horaMontagemInicial: new Date().toTimeString().split(' ')[0].substring(0, 5),
                            dataMontagemFinal: "", // A ser preenchido
                            status: "processamentoInicial",
                            tipoOS: tipoOS, // Novo campo indicando o tipo de OS
                            armacaoDados: armacao ? (armacao.titulo || armacao.nome || armacao.codigo || "Armação sem identificação") : "Cliente traz armação",
                            lenteDados: lente ? (lente.titulo || lente.nome || lente.codigo || "Lente sem identificação") : "Cliente traz lentes",
                            // Campos extras para casos especiais
                            clienteTraArmacao: !armacao && lente ? true : false,
                            clienteTraLentes: armacao && !lente ? true : false,
                            observacaoEspecial: !armacao || !lente ? "Atenção: Kit incompleto. Cliente vai trazer " +
                                (!armacao ? "sua própria armação" : "suas próprias lentes") : ""
                        };

                        return removerValoresUndefined(osData);
                    });

                    setOsFormData(osDataList);

                    // Se houver apenas uma OS, mostrar o formulário
                    if (osDataList.length === 1) {
                        setCurrentOSIndex(0);
                        setShowOSForm(true);
                    } else {
                        // Se houver múltiplas OS, mostrar o resumo da venda com opção para gerar as OS
                        setSaleId(novaVendaRef.id);
                        setOsId(newOsId);
                        setSuccess(true);
                        setStatusPagamentoFinal(statusPagamento);
                        setStatusVendaFinal(statusVenda);
                    }
                } else {
                    // Se não houver OS a gerar, apenas mostrar o resumo da venda
                    setSaleId(novaVendaRef.id);
                    setOsId(newOsId);
                    setSuccess(true);
                    setStatusPagamentoFinal(statusPagamento);
                    setStatusVendaFinal(statusVenda);
                }
            }

            // 6. Registrar no controle de caixa para pagamentos imediatos
            for (const payment of paymentMethods) {
                if (payment.method !== 'cashback' &&
                    (payment.status !== 'pendente' || payment.method !== 'boleto' && payment.method !== 'ted' && payment.method !== 'crypto')) {

                    const caixaData = {
                        tipo: 'entrada',
                        valor: payment.value,
                        descricao: `Venda #${novaVendaRef.id} - Cliente: ${selectedClient.nome} - Pagamento: ${payment.method}`,
                        formaPagamento: payment.method,
                        data: new Date(),
                        registradoPor: {
                            id: user?.uid || null,
                            nome: vendedor || null
                        },
                        vendaId: novaVendaRef.id
                    };

                    const caixaRef = collection(firestore, `lojas/${selectedLoja}/financeiro/controle_caixa/items`);
                    await addDoc(caixaRef, removerValoresUndefined(caixaData));
                }
            }

            // 7. Para boletos e TEDs, adicionar no controle de contas a receber
            for (const payment of paymentMethods) {
                if (payment.method === 'boleto' || payment.method === 'ted') {
                    const contaReceberData = {
                        tipo: 'venda',
                        valor: payment.value,
                        descricao: `Venda #${novaVendaRef.id} - Cliente: ${selectedClient.nome}`,
                        forma_pagamento: payment.method,
                        data_criacao: new Date(),
                        data_vencimento: payment.method === 'boleto' ?
                            (boletoVencimento ? new Date(boletoVencimento) : new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)) :
                            new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
                        status: 'pendente',
                        cliente: {
                            id: selectedClient.id,
                            nome: selectedClient.nome
                        },
                        registrado_por: {
                            id: user?.uid || null,
                            nome: vendedor || null
                        },
                        venda_id: novaVendaRef.id
                    };

                    const contasReceberRef = collection(firestore, `lojas/${selectedLoja}/financeiro/contas_receber/items`);
                    await addDoc(contasReceberRef, removerValoresUndefined(contaReceberData));
                }
            }

            // 8. Para crediário, adicionar cada parcela no controle de contas a receber
            for (const payment of paymentMethods) {
                if (payment.method === 'crediario') {
                    const contasReceberRef = collection(firestore, `lojas/${selectedLoja}/financeiro/contas_receber/items`);

                    // Pular a primeira parcela se for considerada como entrada
                    const parcelasAPagar = payment.dados_especificos?.status_parcelas?.filter(p => p.status === 'pendente') || [];

                    await Promise.all(parcelasAPagar.map(async (parcela) => {
                        const parcelaData = {
                            tipo: 'crediario',
                            valor: parcela.valor,
                            descricao: `Parcela ${parcela.numero}/${parcelasAPagar.length + 1} - Venda #${novaVendaRef.id}`,
                            forma_pagamento: 'crediario',
                            data_criacao: new Date(),
                            data_vencimento: parcela.data_vencimento,
                            status: 'pendente',
                            cliente: {
                                id: selectedClient.id,
                                nome: selectedClient.nome
                            },
                            registrado_por: {
                                id: user?.uid || null,
                                nome: vendedor || null
                            },
                            venda_id: novaVendaRef.id,
                            parcela: parcela.numero
                        };

                        await addDoc(contasReceberRef, removerValoresUndefined(parcelaData));
                    }));
                }
            }

            // 9. Para cashback, atualizar o saldo do cliente
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
                            'cashback.ultima_atualizacao': new Date()
                        });
                    } catch (err) {
                        console.error('Erro ao atualizar saldo de cashback:', err);
                    }
                }
            }

            // 10. Para pagamentos em crypto, registrar transação pendente
            const temCrypto = paymentMethods.some(p => p.method === 'crypto');
            if (temCrypto) {
                const cryptoPayment = paymentMethods.find(p => p.method === 'crypto');

                if (cryptoPayment) {
                    const cryptoData = {
                        venda_id: novaVendaRef.id,
                        cliente_id: selectedClient.id,
                        cliente_nome: selectedClient.nome,
                        valor_brl: cryptoPayment.value,
                        moeda: cryptoPayment.details?.moeda || 'bitcoin',
                        endereco: cryptoPayment.details?.endereco || '',
                        valor_crypto: cryptoPayment.details?.valor_crypto || '0',
                        taxa_cambio: cryptoPayment.details?.taxa_cambio || 0,
                        status: 'aguardando_confirmacao',
                        data_criacao: new Date(),
                        data_confirmacao: null,
                        registrado_por: {
                            id: user?.uid || null,
                            nome: vendedor || null
                        }
                    };

                    const cryptoRef = collection(firestore, `lojas/${selectedLoja}/financeiro/crypto_transacoes`);
                    await addDoc(cryptoRef, removerValoresUndefined(cryptoData));
                }
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
        </div >
    );
};

export default ModalNovaVenda;