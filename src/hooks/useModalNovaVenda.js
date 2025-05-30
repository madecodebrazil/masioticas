// src/hooks/useModalNovaVenda.js - Completo e corrigido
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

    // NOVO: Estado para armazenar coleções
    const [collections, setCollections] = useState([
        { id: 1, name: "Coleção 1", items: [] }
    ]);
    const [activeCollectionId, setActiveCollectionId] = useState(1);

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

    // AQUI: Implementação da função fetchClients corrigida
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

    // AQUI: Implementação da função filterClients
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

    // useEffect para filtrar clientes quando o termo de busca muda
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

    // AQUI: Implementação corrigida da função fetchProducts
    const fetchProducts = async () => {
        try {
            setLoading(true);
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
            setLoading(false);
        } catch (error) {
            console.error('Erro ao buscar produtos:', error);
            setError('Erro ao carregar lista de produtos');
            setLoading(false);
        }
    };

    // MODIFICAÇÃO: Função calculateSubtotal atualizada para considerar todas as coleções
    const calculateSubtotal = () => {
        // Se temos coleções com itens, calcular baseado em todas as coleções
        if (collections && collections.length > 0 && collections.some(c => c.items && c.items.length > 0)) {
            return collections.reduce((total, collection) => {
                if (!collection.items) return total;
                
                const collectionSubtotal = collection.items.reduce(
                    (colTotal, item) => colTotal + ((item.valor || item.preco || 0) * (item.quantity || 1)), 
                    0
                );
                return total + collectionSubtotal;
            }, 0);
        }
        
        // Fallback para o método original usando apenas cartItems
        return cartItems.reduce(
            (total, item) => total + ((item.valor || item.preco || 0) * (item.quantity || 1)), 
            0
        );
    };

    // Função calculateDiscount modificada para trabalhar com o novo calculateSubtotal
    const calculateDiscount = () => {
        if (!discount) return 0;
        
        const subtotal = calculateSubtotal();
        
        if (discountType === 'percentage') {
            return subtotal * (discount / 100);
        }
        return discount;
    };

    // Função calculateTotal modificada 
    const calculateTotal = () => {
        const subtotal = calculateSubtotal();
        const discountValue = calculateDiscount();
        return subtotal - discountValue;
    };

    // Função para obter todos os itens de todas as coleções para a finalização da venda
    const getAllItemsFromCollections = () => {
        return collections.reduce((allItems, collection) => {
            if (!collection.items) return allItems;
            
            // Adicionar id da coleção em cada item
            const itemsWithCollectionId = collection.items.map(item => ({
                ...item,
                collectionId: collection.id,
                collectionName: collection.name
            }));
            
            return [...allItems, ...itemsWithCollectionId];
        }, []);
    };

    // Função calculateTotalAllocated para pagamentos
    const calculateTotalAllocated = () => {
        return paymentMethods.reduce((total, method) => total + (method.value || 0), 0);
    };

    // Função calculateRemainingValue para pagamentos
    const calculateRemainingValue = () => {
        // Usar o total editado se disponível, caso contrário calcular
        const total = totalEditado !== null ? totalEditado : calculateTotal();
        return total - calculateTotalAllocated();
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

    // AQUI: Implementação corrigida da função handleSelectClient
    const handleSelectClient = (client) => {
        setSelectedClient(client);
        setSearchTerm('');
    };

    // Função handleOSChange
    const handleOSChange = (data) => {
        setOsStatus(data);
        setOsFormsCompleted(data.allCompleted);
    };

    // Funções para gestão de pagamento (apenas para vendas)
    const allPaymentsProcessed = () => {
        if (tipoTransacao !== 'venda') return true;
        return paymentMethods.every(p => p.processed);
    };

    // Função isPaymentComplete atualizada para usar o valor total editado quando disponível
    const isPaymentComplete = () => {
        if (tipoTransacao !== 'venda') return true;
        if (paymentMethods.length === 0) return false;

        // Verifica se todos os métodos de pagamento foram processados
        const todosProcessados = paymentMethods.every(method => method.processed);

        // Usa o valor total editado se disponível
        const total = totalEditado !== null ? totalEditado : calculateTotal();
        const totalPago = calculateTotalAllocated();

        // Considerar um pequeno delta para evitar problemas de arredondamento
        return todosProcessados && Math.abs(total - totalPago) < 0.01;
    };

    // Função canFinalizeSale
    const canFinalizeSale = () => {
        if (tipoTransacao === 'venda') {
            // Para vendas, verificar pagamentos e OS
            const hasItems = collections.some(c => c.items && c.items.length > 0);
            
            return hasItems && 
                selectedClient &&
                allPaymentsProcessed() &&
                isPaymentComplete() &&
                (osStatus.tipo === 'sem_os' || osFormsCompleted);
        } else {
            // Para orçamentos, apenas verificar itens e cliente
            const hasItems = collections.some(c => c.items && c.items.length > 0);
            return hasItems && selectedClient;
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
        if (!product) return;

        const existingItemIndex = cartItems.findIndex(item => item.id === product.id);

        if (existingItemIndex >= 0) {
            // Atualizar quantidade se o item já estiver no carrinho
            const updatedItems = [...cartItems];
            updatedItems[existingItemIndex].quantity += quantity;
            setCartItems(updatedItems);
        } else {
            // Adicionar novo item ao carrinho
            const newItem = {
                ...product,
                quantity,
                collectionId: activeCollectionId
            };
            setCartItems([...cartItems, newItem]);
        }

        // Atualizar também na coleção ativa
        const updatedCollections = collections.map(c => {
            if (c.id === activeCollectionId) {
                const existingItem = c.items?.find(item => item.id === product.id);
                if (existingItem) {
                    // Atualizar quantidade do item existente
                    return {
                        ...c,
                        items: c.items.map(item => 
                            item.id === product.id 
                                ? {...item, quantity: item.quantity + quantity}
                                : item
                        )
                    };
                } else {
                    // Adicionar novo item à coleção
                    return {
                        ...c,
                        items: [...(c.items || []), {...product, quantity, collectionId: activeCollectionId}]
                    };
                }
            }
            return c;
        });
        
        setCollections(updatedCollections);
    };

    // Função para remover item do carrinho
    const removeFromCart = (itemId) => {
        // Remover do cartItems
        setCartItems(cartItems.filter(item => item.id !== itemId));

        // Remover também de todas as coleções
        const updatedCollections = collections.map(collection => ({
            ...collection,
            items: collection.items?.filter(item => item.id !== itemId) || []
        }));

        setCollections(updatedCollections);
    };

    // Função para atualizar quantidade de um item no carrinho
    const updateQuantity = (itemId, newQuantity) => {
        if (newQuantity <= 0) {
            removeFromCart(itemId);
            return;
        }

        // Atualizar em cartItems
        const updatedCartItems = cartItems.map(item =>
            item.id === itemId ? { ...item, quantity: newQuantity } : item
        );
        setCartItems(updatedCartItems);

        // Atualizar em todas as coleções
        const updatedCollections = collections.map(collection => ({
            ...collection,
            items: collection.items?.map(item =>
                item.id === itemId ? { ...item, quantity: newQuantity } : item
            ) || []
        }));

        setCollections(updatedCollections);
    };

    // Função para formatar moeda
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    // Função handleValorPagoChange para lidar com valor pago
    const handleValorPagoChange = (value) => {
        const valorNumerico = parseFloat(value);
        if (!isNaN(valorNumerico)) {
            setValorPago(valorNumerico);
            const trocoCalculado = valorNumerico - calculateTotal();
            setTroco(trocoCalculado > 0 ? trocoCalculado : 0);
        }
    };

    // Função handleCreditCardSubmit para processar cartão de crédito
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

    // MODIFICAÇÃO: Função handleFinalizarClicked atualizada para aceitar valor total personalizado
    const handleFinalizarClicked = async (valorTotalPersonalizado = null) => {
        // Resetar erro
        setError('');

        // Verificar se há itens em qualquer coleção
        const hasItems = collections.some(c => c.items && c.items.length > 0);
        
        // Validações básicas
        if (!hasItems) {
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
                    // Criar o cliente na coleção com dados mínimos
                    const clienteRef = doc(collection(firestore, `lojas/clientes/users`));

                    await setDoc(clienteRef, {
                        nome: selectedClient.nome,
                        createdAt: new Date().toISOString(),
                        isTemp: true,
                        dataUltimaCompra: new Date().toISOString(),
                        tipo: 'pessoa_fisica',
                        status: 'ativo'
                    });

                    // Atualizar o cliente selecionado com o ID correto
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
                if (!isPaymentComplete()) {
                    setError('O valor total dos pagamentos deve ser igual ao valor da venda');
                    setLoading(false);
                    return;
                }
            }

            // Processar a finalização com o valor personalizado ou calculado
            const valorTotalFinal = valorTotalPersonalizado !== null ? 
                valorTotalPersonalizado : (totalEditado !== null ? totalEditado : calculateTotal());
            
            const resultId = await finalizeSale(valorTotalFinal);
            console.log(`${tipoTransacao} finalizado com ID: ${resultId}`);

        } catch (error) {
            console.error(`Erro ao finalizar ${tipoTransacao}:`, error);
            setError(`Erro ao finalizar ${tipoTransacao}: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    // MODIFICAÇÃO: Função finalizeSale atualizada para usar itens de todas as coleções
    const finalizeSale = async (valorTotalFinal) => {
        try {
            setLoading(true);

            // Obter TODOS os itens de TODAS as coleções
            const todosOsItens = getAllItemsFromCollections();

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

                    // Remover valores undefined
                    const dadosOSLimpos = Object.fromEntries(
                        Object.entries(dadosOS).filter(([_, v]) => v !== undefined)
                    );
                    
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
            const dadosTransacao = {
                data_criacao: new Date(),
                data_venda: dataVenda ? new Date(dataVenda) : new Date(),
                cliente: selectedClient ? {
                    id: selectedClient.id,
                    nome: selectedClient.nome,
                    cpf: selectedClient.cpf || '',
                    telefone: selectedClient.telefone || ''
                } : null,
                itens: todosOsItens.map(item => ({
                    id: item.id,
                    nome: item.nome || item.titulo || '',
                    quantidade: item.quantity || 1,
                    valor_unitario: item.valor || 0,
                    valor_total: (item.valor || 0) * (item.quantity || 1),
                    categoria: item.categoria || '',
                    // Informações da coleção para rastreabilidade
                    colecao_id: item.collectionId,
                    colecao_nome: item.collectionName
                })),
                subtotal: calculateSubtotal(),
                desconto: calculateDiscount(),
                desconto_tipo: discountType,
                valor_total: valorTotalFinal, // Usar o valor total final passado como parâmetro
                valor_editado: valorTotalFinal !== calculateTotal(), // Flag para indicar se o valor foi editado manualmente
                observacoes: observation,
                vendedor: vendedor || 'Admin',
                status: tipoTransacao === 'venda' ? 'paga' : 'aguardando_aprovacao',
                metodos_pagamento: tipoTransacao === 'venda' ? paymentMethods : [],
                // Salvar informações sobre as coleções
                colecoes: collections.map(c => ({
                    id: c.id,
                    nome: c.name,
                    quantidade_itens: c.items?.length || 0
                }))
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

    // ADICIONADO: Função para atualizar as coleções a partir do componente filho
    const updateCollections = (newCollections) => {
        setCollections(newCollections);
    };

    // ADICIONADO: Função para atualizar a coleção ativa a partir do componente filho
    const setActiveCollection = (collectionId) => {
        setActiveCollectionId(collectionId);
    };

    // MODIFICAÇÃO: Return com os estados e funções adicionais para coleções
    return {
        // Estados originais
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

        // NOVO: Estados para coleções
        collections,
        activeCollectionId,

        // Setters originais
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
        setTotalEditado,
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

        // NOVO: Setters para coleções
        setCollections,
        setActiveCollectionId,

        // Funções originais
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
        fetchClients,  // Esta é a função que estava causando o erro
        fetchProducts, // Agora está implementada corretamente
        handleSelectClient, // Agora está implementada corretamente
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
        handleCreditCardSubmit,
        
        // NOVO: Funções para coleções
        updateCollections,
        setActiveCollection,
        getAllItemsFromCollections
    };
};

export default useModalNovaVenda;


