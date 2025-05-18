// src/hooks/useModalNovaVenda.js
import { useState, useEffect } from 'react';
import { collection, doc, setDoc, getDocs, query, limit, orderBy, where, addDoc } from 'firebase/firestore';
import { firestore } from '../lib/firebaseConfig';

const useModalNovaVenda = ({ isOpen, onClose, selectedLoja }) => {
    // Estados para gerenciamento geral
    const [cartItems, setCartItems] = useState([]);
    const [selectedClient, setSelectedClient] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [observation, setObservation] = useState('');
    const [tipoTransacao, setTipoTransacao] = useState('venda');
    const [dataVenda, setDataVenda] = useState(new Date().toISOString().split('T')[0]);
    const [vendedor, setVendedor] = useState('Admin');
    const [totalEditado, setTotalEditado] = useState(null);


    // Estados para gerenciamento de ID
    const [saleId, setSaleId] = useState('');
    const [osId, setOsId] = useState('');
    const [newOsId, setNewOsId] = useState(Math.floor(Math.random() * 1000000).toString());
    const [novaVendaRef, setNovaVendaRef] = useState(null);

    // Estados para gerenciamento de clientes
    const [searchTerm, setSearchTerm] = useState('');
    const [clients, setClients] = useState([]);
    const [filteredClients, setFilteredClients] = useState([]);
    const [showClientForm, setShowClientForm] = useState(false);

    // Estados para gerenciamento de produtos
    const [products, setProducts] = useState([]);
    const [productSearchTerm, setProductSearchTerm] = useState('');
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [focusedRow, setFocusedRow] = useState(null);
    const [newProductQty, setNewProductQty] = useState(1);
    const [produtoInputRef, setProdutoInputRef] = useState(null);

    // Estados para gerenciamento de descontos
    const [discount, setDiscount] = useState(0);
    const [discountType, setDiscountType] = useState('percentage');

    // Estados para gerenciamento de pagamento (apenas para vendas)
    const [paymentMethods, setPaymentMethods] = useState([]);
    const [valorPago, setValorPago] = useState(0);
    const [troco, setTroco] = useState(0);
    const [currentPaymentIndex, setCurrentPaymentIndex] = useState(0);
    const [valueDistribution, setValueDistribution] = useState('auto');
    const [showCreditCardForm, setShowCreditCardForm] = useState(false);
    const [dadosCartao, setDadosCartao] = useState(null);
    const [boletoData, setBoletoData] = useState(null);
    const [boletoVencimento, setBoletoVencimento] = useState(null);
    const [parcelasCredario, setParcelasCredario] = useState(1);
    const [statusPagamentoFinal, setStatusPagamentoFinal] = useState('');
    const [statusVenda, setStatusVenda] = useState('');
    const [statusVendaFinal, setStatusVendaFinal] = useState('');
    const [cashbackDisponivel, setCashbackDisponivel] = useState(0);
    const [selectedCrypto, setSelectedCrypto] = useState('bitcoin');
    const [cryptoAddress, setCryptoAddress] = useState('');
    const [showPixModal, setShowPixModal] = useState(false);
    const [pixQRCode, setPixQRCode] = useState('');

    // Estados para OS (Ordem de Serviço)
    const [osStatus, setOsStatus] = useState({
        tipo: 'sem_os',
        status: 'em_montagem',
        observacoes: '',
        colecoes: [],
        osData: {},
        allCompleted: true
    });
    const [osFormsCompleted, setOsFormsCompleted] = useState(true);

    // Implementações das funções de cálculo
    const calculateSubtotal = () => {
        return cartItems.reduce((total, item) => total + (item.valor || 0) * (item.quantity || 1), 0);
    };

    const calculateDiscount = () => {
        if (!discount) return 0;
        if (discountType === 'percentage') {
            return calculateSubtotal() * (discount / 100);
        }
        return discount;
    };

    const calculateTotal = () => {
        const subtotal = calculateSubtotal();
        const discountValue = calculateDiscount();
        return subtotal - discountValue;
    };

    const calculateTotalAllocated = () => {
        return paymentMethods.reduce((total, method) => total + (method.value || 0), 0);
    };

    const calculateRemainingValue = () => {
        return calculateTotal() - calculateTotalAllocated();
    };

    // Função fetchClients melhorada para carregar e mostrar clientes corretamente
    const fetchClients = async () => {
        try {
            setLoading(true);
            console.log("Buscando clientes...");

            // Caminho correto: lojas/clientes/users
            const clientsRef = collection(firestore, `lojas/clientes/users`);

            // Limitar a 10 resultados e ordenar por nome
            const q = query(clientsRef, orderBy("nome"), limit(10));
            const querySnapshot = await getDocs(q);

            const clientsList = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            console.log(`Clientes carregados: ${clientsList.length}`);
            setClients(clientsList);

            // Se houver um termo de busca, aplicar filtro imediatamente
            if (searchTerm && searchTerm.trim() !== '') {
                filterClients(searchTerm, clientsList);
            } else {
                setFilteredClients([]);
            }

            setLoading(false);
        } catch (error) {
            console.error('Erro ao buscar clientes:', error);
            setError('Erro ao carregar lista de clientes');
            setLoading(false);
        }
    };

    // Função separada para filtrar clientes - mais eficiente
    const filterClients = (term, clientsList = clients) => {
        if (!term || term.trim() === '') {
            setFilteredClients([]);
            return;
        }

        console.log(`Filtrando clientes com termo: "${term}"`);
        const searchTermLower = term.toLowerCase().trim();

        // Filtrar clientes que correspondem ao termo de busca
        const filtered = clientsList
            .filter(client => {
                // Verificar se client e client.nome existem para evitar erros
                if (!client || !client.nome) return false;

                return (
                    client.nome.toLowerCase().includes(searchTermLower) ||
                    (client.cpf && client.cpf.includes(searchTermLower)) ||
                    (client.telefone && client.telefone.includes(searchTermLower))
                );
            })
            .slice(0, 10); // Limite de 10 resultados para melhor performance

        console.log(`Resultados filtrados: ${filtered.length}`);
        setFilteredClients(filtered);
    };

    // useEffect atualizado para filtrar em tempo real
    useEffect(() => {
        // Se não houver termo de busca, não mostrar resultados
        if (!searchTerm || searchTerm.trim() === '') {
            setFilteredClients([]);
            return;
        }

        // Se houver termo de busca e clientes carregados, filtrar
        if (clients.length > 0) {
            filterClients(searchTerm);
        } else {
            // Se não houver clientes carregados, buscar do banco
            fetchClients();
        }
    }, [searchTerm]);

    // Função para buscar produtos
    const fetchProducts = async () => {
        try {
            // Buscar produtos do estoque
            const categorias = ['armacoes', 'lentes', 'solares', 'acessorios'];
            let todosOsProdutos = [];

            for (const categoria of categorias) {
                const produtosRef = collection(firestore, `estoque/${selectedLoja}/${categoria}`);
                const snapshot = await getDocs(produtosRef);
                const produtosDaCategoria = snapshot.docs.map(doc => ({
                    id: doc.id,
                    categoria: categoria,
                    ...doc.data()
                }));
                todosOsProdutos = [...todosOsProdutos, ...produtosDaCategoria];
            }

            setProducts(todosOsProdutos);
        } catch (error) {
            console.error('Erro ao buscar produtos:', error);
            setError('Erro ao carregar lista de produtos');
        }
    };

    // Função para verificar se um item precisa de OS
    const precisaDeOS = (item) => {
        if (!item || !item.categoria) return false;

        const categoriasComOS = ['armacoes', 'lentes', 'solares'];
        // Para solares, verificar se tem grau
        if (item.categoria === 'solares') {
            return item.info_geral?.tem_grau || item.info_adicional?.tem_grau || false;
        }
        return categoriasComOS.includes(item.categoria);
    };

    // Função para verificar se uma coleção de itens precisa de OS
    const colecaoPrecisaDeOS = (colecao) => {
        if (!colecao || !colecao.items) return false;
        return colecao.items.some(item => precisaDeOS(item));
    };

    // Função auxiliar para remover valores undefined de um objeto
    const removerValoresUndefined = (obj) => {
        return Object.fromEntries(
            Object.entries(obj).filter(([_, v]) => v !== undefined)
        );
    };

    // Função para selecionar cliente
    const handleSelectClient = (client) => {
        setSelectedClient(client);
        setSearchTerm('');
    };

    // Função para lidar com mudanças na OS
    const handleOSChange = (data) => {
        setOsStatus(data);
        setOsFormsCompleted(data.allCompleted);
    };

    // Funções para gestão de pagamento (apenas para vendas)
    const allPaymentsProcessed = () => {
        if (tipoTransacao !== 'venda') return true;
        return paymentMethods.every(p => p.processed);
    };

    const isPaymentComplete = () => {
        if (tipoTransacao !== 'venda') return true;
        if (paymentMethods.length === 0) return false;

        // Verifica se todos os métodos de pagamento foram processados
        const todosProcessados = paymentMethods.every(method => method.processed);

        // Usa o valor total editado se disponível, caso contrário usa o valor calculado
        const total = totalEditado !== null ? totalEditado : calculateTotal();
        const totalPago = calculateTotalAllocated();

        return todosProcessados && Math.abs(total - totalPago) < 0.01;
    };

    const canFinalizeSale = () => {
        if (tipoTransacao === 'venda') {
            return cartItems.length > 0 &&
                selectedClient &&
                allPaymentsProcessed() &&
                isPaymentComplete() &&
                (osStatus.tipo === 'sem_os' || osFormsCompleted);
        } else {
            // Para orçamentos, apenas verificamos se há itens e cliente selecionado
            return cartItems.length > 0 && selectedClient;
        }
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
                details: {},
                processed: false
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
            details: {},
            processed: false
        };
        setPaymentMethods(updatedMethods);
    };

    // Função para processar método de pagamento
    const processPaymentMethod = (index) => {
        if (tipoTransacao !== 'venda') return;

        const updatedMethods = [...paymentMethods];
        const method = updatedMethods[index];

        // Simulação de processamento bem-sucedido
        method.processed = true;
        method.details = { ...method.details, pagamento_confirmado: true };

        setPaymentMethods(updatedMethods);
    };

    // Função para adicionar item ao carrinho
    const addToCart = (product, quantity = 1) => {
        const existingItemIndex = cartItems.findIndex(item => item.id === product.id);

        if (existingItemIndex >= 0) {
            // Atualizar quantidade se o item já estiver no carrinho
            const updatedItems = [...cartItems];
            updatedItems[existingItemIndex].quantity += quantity;
            setCartItems(updatedItems);
        } else {
            // Adicionar novo item ao carrinho
            setCartItems([...cartItems, { ...product, quantity }]);
        }
    };

    // Função para remover item do carrinho
    const removeFromCart = (itemId) => {
        setCartItems(cartItems.filter(item => item.id !== itemId));
    };

    // Função para atualizar quantidade de um item no carrinho
    const updateQuantity = (itemId, newQuantity) => {
        if (newQuantity <= 0) {
            removeFromCart(itemId);
            return;
        }

        const updatedItems = cartItems.map(item =>
            item.id === itemId ? { ...item, quantity: newQuantity } : item
        );

        setCartItems(updatedItems);
    };

    // Função para formatar moeda
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    // Função para lidar com mudança no valor pago
    const handleValorPagoChange = (value) => {
        const valorNumerico = parseFloat(value);
        if (!isNaN(valorNumerico)) {
            setValorPago(valorNumerico);
            const trocoCalculado = valorNumerico - calculateTotal();
            setTroco(trocoCalculado > 0 ? trocoCalculado : 0);
        }
    };

    // Função para lidar com submissão de dados de cartão de crédito
    const handleCreditCardSubmit = (cardData) => {
        setDadosCartao(cardData);
        setShowCreditCardForm(false);

        // Marcar o método como processado
        const updatedMethods = [...paymentMethods];
        const index = currentPaymentIndex;

        if (updatedMethods[index]) {
            updatedMethods[index].processed = true;
            updatedMethods[index].details = {
                ...updatedMethods[index].details,
                card: cardData,
                pagamento_confirmado: true
            };

            setPaymentMethods(updatedMethods);
        }
    };

    // Função para finalizar a venda ou orçamento
    const finalizeSale = async (valorTotalFinal) => {
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
            const colecao = tipoTransacao === 'venda'
                ? `lojas/${selectedLoja}/vendas/items/items`
                : `lojas/${selectedLoja}/orcamentos/items/items`;

            console.log(`Salvando ${tipoTransacao} na coleção:`, colecao);

            // Criar objeto com dados da transação
            // Usar o valor total passado como parâmetro em vez de calculateTotal()
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
                valor_total: valorTotalFinal, // Aqui usamos o valor total passado como parâmetro
                valor_editado: valorTotalFinal !== calculateTotal(), // Flag para indicar se o valor foi editado manualmente
                observacoes: observation,
                vendedor: vendedor || 'Admin',
                status: tipoTransacao === 'venda' ? 'paga' : 'aguardando_aprovacao',
                metodos_pagamento: tipoTransacao === 'venda' ? paymentMethods : []
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
    };

    // Função handleFinalizarClicked atualizada para usar o valor total editado
    const handleFinalizarClicked = async () => {
        // Resetar erro
        setError('');

        // Validações básicas
        if (cartItems.length === 0) {
            setError('Adicione pelo menos um item ao carrinho');
            return;
        }

        if (!selectedClient) {
            setError('Selecione um cliente');
            return;
        }

        try {
            setLoading(true);

            // Verificar se é um cliente temporário (apenas nome)
            if (selectedClient.isTemp) {
                try {
                    // Criar o cliente na coleção com dados mínimos - Caminho correto
                    const clienteRef = doc(collection(firestore, `lojas/clientes/users`));

                    await setDoc(clienteRef, {
                        nome: selectedClient.nome,
                        createdAt: new Date().toISOString(),
                        isTemp: true, // Marcar como cliente temporário para futuras referências
                        dataUltimaCompra: new Date().toISOString(),
                        tipo: 'pessoa_fisica',
                        status: 'ativo'
                    });

                    // Atualizar o cliente selecionado com o ID correto do banco de dados
                    setSelectedClient({
                        ...selectedClient,
                        id: clienteRef.id,
                    });

                    console.log('Cliente temporário salvo com sucesso:', clienteRef.id);
                } catch (error) {
                    console.error('Erro ao salvar cliente temporário:', error);
                    setError('Erro ao salvar informações do cliente');
                    setLoading(false);
                    return;
                }
            }

            // Validações específicas para venda
            if (tipoTransacao === 'venda') {
                if (osStatus.tipo !== 'sem_os' && !osFormsCompleted) {
                    setError('Preencha todos os formulários de OS antes de finalizar');
                    setLoading(false);
                    return;
                }

                // Validações de pagamento para venda
                // Aqui usamos o valor total editado, se disponível
                if (!isPaymentComplete()) {
                    setError('O valor total dos pagamentos deve ser igual ao valor da venda');
                    setLoading(false);
                    return;
                }
            }

            // Processar a finalização
            // Obter o valor total, priorizando o valor editado se estiver disponível
            const valorTotalFinal = totalEditado !== null ? totalEditado : calculateTotal();

            // Passar o valor total final para a função de finalização
            const resultId = await finalizeSale(valorTotalFinal);
            console.log(`${tipoTransacao} finalizado com ID: ${resultId}`);

        } catch (error) {
            console.error(`Erro ao finalizar ${tipoTransacao}:`, error);
            setError(`Erro ao finalizar ${tipoTransacao}: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    // ATENÇÃO: Este return deve ser adicionado ao final da função useModalNovaVenda (antes do último }):
    return {
        // Estados
        cartItems,
        selectedClient,
        tipoTransacao,
        searchTerm,
        clients,
        filteredClients,
        showClientForm,
        products,
        productSearchTerm,
        filteredProducts,
        focusedRow,
        newProductQty,
        produtoInputRef,
        discount,
        discountType,
        observation,
        loading,
        error,
        success,
        saleId,
        osId,
        newOsId,
        novaVendaRef,
        paymentMethods,
        valorPago,
        totalEditado,
        setTotalEditado,
        troco,
        currentPaymentIndex,
        valueDistribution,
        showCreditCardForm,
        dadosCartao,
        boletoData,
        boletoVencimento,
        parcelasCredario,
        statusPagamentoFinal,
        statusVenda,
        statusVendaFinal,
        cashbackDisponivel,
        selectedCrypto,
        cryptoAddress,
        vendedor,
        dataVenda,
        showPixModal,
        pixQRCode,
        osStatus,
        osFormsCompleted,

        // Setters
        setCartItems,
        setSelectedClient,
        setTipoTransacao,
        setSearchTerm,
        setClients,
        setFilteredClients,
        setShowClientForm,
        setProducts,
        setProductSearchTerm,
        setFilteredProducts,
        setFocusedRow,
        setNewProductQty,
        setProdutoInputRef,
        setDiscount,
        setDiscountType,
        setObservation,
        setLoading,
        setError,
        setSuccess,
        setSaleId,
        setOsId,
        setNewOsId,
        setNovaVendaRef,
        setPaymentMethods,
        setValorPago,
        setTroco,
        setCurrentPaymentIndex,
        setValueDistribution,
        setShowCreditCardForm,
        setDadosCartao,
        setBoletoData,
        setBoletoVencimento,
        setParcelasCredario,
        setStatusPagamentoFinal,
        setStatusVenda,
        setStatusVendaFinal,
        setCashbackDisponivel,
        setSelectedCrypto,
        setCryptoAddress,
        setVendedor,
        setDataVenda,
        setShowPixModal,
        setPixQRCode,
        setOsStatus,
        setOsFormsCompleted,

        // Funções
        handleOSChange,
        precisaDeOS,
        colecaoPrecisaDeOS,
        allPaymentsProcessed,
        isPaymentComplete,
        canFinalizeSale,
        handleFinalizarClicked,
        finalizeSale,
        processPaymentMethod,
        handleClose: onClose,
        fetchClients,
        fetchProducts,
        handleSelectClient,
        calculateSubtotal,
        calculateDiscount,
        calculateTotal,
        calculateTotalAllocated,
        calculateRemainingValue,
        updatePaymentMethodValue,
        addPaymentMethod,
        removePaymentMethod,
        changePaymentMethod,
        addToCart,
        removeFromCart,
        updateQuantity,
        formatCurrency,
        handleValorPagoChange,
        handleCreditCardSubmit
    };
};

export default useModalNovaVenda;