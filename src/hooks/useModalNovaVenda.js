import { useState, useEffect } from 'react';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { firestore } from '../lib/firebaseConfig';

const useModalNovaVenda = ({ isOpen, onClose, selectedLoja }) => {
    // Estados
    const [cartItems, setCartItems] = useState([]);
    const [selectedClient, setSelectedClient] = useState(null);
    const [paymentMethods, setPaymentMethods] = useState([]);
    const [error, setError] = useState('');
    const [statusVenda, setStatusVenda] = useState('');
    const [newOsId, setNewOsId] = useState('');
    const [novaVendaRef, setNovaVendaRef] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [clients, setClients] = useState([]);
    const [filteredClients, setFilteredClients] = useState([]);
    const [showClientForm, setShowClientForm] = useState(false);
    const [products, setProducts] = useState([]);
    const [productSearchTerm, setProductSearchTerm] = useState('');
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [focusedRow, setFocusedRow] = useState(null);
    const [newProductQty, setNewProductQty] = useState(1);
    const [produtoInputRef, setProdutoInputRef] = useState(null);
    const [discount, setDiscount] = useState(0);
    const [discountType, setDiscountType] = useState('percentage');
    const [observation, setObservation] = useState('');
    const [valorPago, setValorPago] = useState(0);
    const [troco, setTroco] = useState(0);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [saleId, setSaleId] = useState('');
    const [osId, setOsId] = useState('');
    const [currentPaymentIndex, setCurrentPaymentIndex] = useState(0);
    const [valueDistribution, setValueDistribution] = useState({});
    const [showCreditCardForm, setShowCreditCardForm] = useState(false);
    const [dadosCartao, setDadosCartao] = useState(null);
    const [boletoData, setBoletoData] = useState(null);
    const [boletoVencimento, setBoletoVencimento] = useState(null);
    const [parcelasCredario, setParcelasCredario] = useState(1);
    const [statusPagamentoFinal, setStatusPagamentoFinal] = useState('');
    const [statusVendaFinal, setStatusVendaFinal] = useState('');
    const [cashbackDisponivel, setCashbackDisponivel] = useState(0);
    const [selectedCrypto, setSelectedCrypto] = useState('bitcoin');
    const [cryptoAddress, setCryptoAddress] = useState('');
    const [vendedor, setVendedor] = useState('');
    const [dataVenda, setDataVenda] = useState(new Date());
    const [showPixModal, setShowPixModal] = useState(false);
    const [pixQRCode, setPixQRCode] = useState('');

    const [osStatus, setOsStatus] = useState({
        tipo: 'completa',
        status: 'em_montagem',
        observacoes: '',
        colecoes: [],
        osData: {},
        allCompleted: true
    });
    const [osFormsCompleted, setOsFormsCompleted] = useState(true);

    // Implementação da função fetchClients
    const fetchClients = async () => {
        try {
            const clientsRef = collection(firestore, `lojas/clientes/users`);
            const querySnapshot = await getDocs(clientsRef);
            const clientsList = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setClients(clientsList);
            setFilteredClients([]); // Não mostra clientes por padrão
        } catch (error) {
            console.error('Erro ao buscar clientes:', error);
            setError('Erro ao carregar lista de clientes');
        }
    };

    // Atualizar filteredClients quando searchTerm mudar
    useEffect(() => {
        if (searchTerm) {
            const filtered = clients.filter(client => {
                const searchTermLower = searchTerm.toLowerCase();
                return (
                    client.nome.toLowerCase().includes(searchTermLower) ||
                    (client.cpf && client.cpf.includes(searchTermLower)) ||
                    (client.telefone && client.telefone.includes(searchTermLower))
                );
            });
            setFilteredClients(filtered);
        } else {
            setFilteredClients([]); // Não mostra clientes se não houver busca
        }
    }, [searchTerm, clients]);

    const handleOSChange = (data) => {
        setOsStatus(data);
        setOsFormsCompleted(data.allCompleted);
    };

    const allPaymentsProcessed = () => {
        return paymentMethods.every(p => p.processed);
    };

    const isPaymentComplete = () => {
        // Implementar lógica de verificação de pagamento completo
        return true; // Temporário
    };

    const canFinalizeSale = () => {
        return cartItems.length > 0 &&
            selectedClient &&
            allPaymentsProcessed() &&
            isPaymentComplete() &&
            (osStatus.tipo === 'sem_os' || osFormsCompleted);
    };

    const handleFinalizarClicked = () => {
        if (osStatus.tipo !== 'sem_os' && !osFormsCompleted) {
            setError('É necessário preencher todos os formulários de Ordem de Serviço antes de finalizar a venda.');
            return;
        }

        if (!allPaymentsProcessed()) {
            const indexToProcess = paymentMethods.findIndex(p => !p.processed);
            if (indexToProcess >= 0) {
                processPaymentMethod(indexToProcess);
            }
            return;
        }

        if (!isPaymentComplete()) {
            setError('O valor total dos pagamentos deve ser igual ao valor da venda');
            return;
        }

        finalizeSale();
    };

    const precisaDeOS = (item) => {
        if (!item || !item.categoria) return false;

        const categoriasComOS = ['armacoes', 'lentes', 'solares'];
        if (item.categoria === 'solares') {
            return item.info_geral?.tem_grau || item.info_adicional?.tem_grau || false;
        }
        return categoriasComOS.includes(item.categoria);
    };

    const colecaoPrecisaDeOS = (colecao) => {
        return colecao.items.some(item => precisaDeOS(item));
    };

    const removerValoresUndefined = (obj) => {
        const newObj = {};
        Object.keys(obj).forEach(key => {
            if (obj[key] !== undefined) {
                newObj[key] = obj[key];
            }
        });
        return newObj;
    };

    const processPaymentMethod = (index) => {
        // Implementar processamento de método de pagamento
        console.log('Processando método de pagamento:', index);
    };

    const finalizeSale = async () => {
        if (statusVenda === 'paga' && osStatus.tipo !== 'sem_os') {
            const colecoesPrecisandoOS = osStatus.colecoes.filter(colecao =>
                colecaoPrecisaDeOS(colecao)
            );

            for (const colecao of colecoesPrecisandoOS) {
                const osDados = osStatus.osData[colecao.id];

                if (!osDados || !osDados.isCompleted) continue;

                const dadosOS = {
                    id_os: `${newOsId}-${colecao.id}`,
                    id_venda: novaVendaRef.id,
                    cliente: {
                        id: selectedClient.id,
                        nome: selectedClient.nome,
                        cpf: selectedClient.cpf,
                        contato: selectedClient.telefone || ''
                    },
                    tipo: osStatus.tipo,
                    status: osStatus.status,
                    data_criacao: new Date(),
                    data_previsao: osDados.dataPrevistaEntrega ? new Date(osDados.dataPrevistaEntrega) : new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
                    produtos: colecao.items
                        .filter(item => precisaDeOS(item))
                        .map(item => ({
                            id: item.id,
                            categoria: item.categoria,
                            nome: item.nome || item.titulo || '',
                            marca: item.marca || '',
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
    };

    // Função para selecionar cliente
    const handleSelectClient = (client) => {
        setSelectedClient(client);
        setSearchTerm('');
    };

    return {
        // Estados
        searchTerm,
        clients,
        filteredClients,
        selectedClient,
        showClientForm,
        products,
        productSearchTerm,
        filteredProducts,
        cartItems,
        focusedRow,
        newProductQty,
        produtoInputRef,
        discount,
        discountType,
        observation,
        valorPago,
        troco,
        loading,
        error,
        success,
        saleId,
        osId,
        paymentMethods,
        currentPaymentIndex,
        valueDistribution,
        showCreditCardForm,
        dadosCartao,
        boletoData,
        boletoVencimento,
        parcelasCredario,
        statusPagamentoFinal,
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
        setSearchTerm,
        setSelectedClient,
        setShowClientForm,
        setProductSearchTerm,
        setCartItems,
        setFocusedRow,
        setNewProductQty,
        setDiscount,
        setDiscountType,
        setObservation,
        setValorPago,
        setPaymentMethods,
        setCurrentPaymentIndex,
        setValueDistribution,
        setShowCreditCardForm,
        setBoletoVencimento,
        setParcelasCredario,
        setSelectedCrypto,
        setCryptoAddress,
        setShowPixModal,
        setPixQRCode,
        setOsStatus,

        // Funções
        handleOSChange,
        allPaymentsProcessed,
        isPaymentComplete,
        canFinalizeSale,
        handleFinalizarClicked,
        finalizeSale,
        precisaDeOS,
        colecaoPrecisaDeOS,
        processPaymentMethod,
        handleClose: onClose,
        fetchClients,
        handleSelectClient,
        fetchProducts: () => { }, // Implementar
        calculateSubtotal: () => 0, // Implementar
        calculateDiscount: () => 0, // Implementar
        calculateTotal: () => 0, // Implementar
        calculateTotalAllocated: () => 0, // Implementar
        calculateRemainingValue: () => 0, // Implementar
        updatePaymentMethodValue: () => { }, // Implementar
        addPaymentMethod: () => { }, // Implementar
        removePaymentMethod: () => { }, // Implementar
        changePaymentMethod: () => { }, // Implementar
        addToCart: () => { }, // Implementar
        removeFromCart: () => { }, // Implementar
        updateQuantity: () => { }, // Implementar
        formatCurrency: (value) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), // Implementar melhor
        handleValorPagoChange: () => { }, // Implementar
        handleCreditCardSubmit: () => { } // Implementar
    };
};

export default useModalNovaVenda;