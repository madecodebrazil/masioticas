// components/ModalNovaVenda.js
import { useState, useEffect, useRef } from 'react';
import {
    collection, getDocs, doc, getDoc, addDoc, updateDoc, query, where, serverTimestamp
} from 'firebase/firestore';
import { FiClock, FiRefreshCw, FiMessageSquare, FiPrinter } from 'react-icons/fi';
import CreditCardForm from './CreditCardForm';
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
    FiCalendar
} from 'react-icons/fi';
import ClientForm from './ClientForm';

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
    const [paymentMethod, setPaymentMethod] = useState('dinheiro');
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

    const [showCreditCardForm, setShowCreditCardForm] = useState(false);
    const [dadosCartao, setDadosCartao] = useState(null);
    const [cartaoProcessado, setCartaoProcessado] = useState(false);
    const [boletoData, setBoletoData] = useState(null);
    const [boletoVencimento, setBoletoVencimento] = useState(
        new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    );
    const [parcelasCredario, setParcelasCredario] = useState("3");
    const [statusPagamentoFinal, setStatusPagamentoFinal] = useState("");
    const [statusVendaFinal, setStatusVendaFinal] = useState("");

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

            // Definir vendedor automaticamente
            if (userData) {
                setVendedor(userData.nome || user?.email || 'Vendedor');
            }

            // Definir data atual
            setDataVenda(new Date());
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
            const productsRef = collection(firestore, 'lojas/estoque/items/items/');
            const querySnapshot = await getDocs(productsRef);

            const productsList = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })).filter(product =>
                // Filtrar apenas produtos disponíveis para a loja selecionada
                product.por_loja &&
                product.por_loja[selectedLoja] &&
                product.por_loja[selectedLoja].quantidade > 0
            );

            setProducts(productsList);
        } catch (err) {
            console.error('Erro ao buscar produtos:', err);
            setError('Falha ao carregar lista de produtos');
        } finally {
            setLoading(false);
        }
    };

    // Funções de manipulação de pagamento com cartão
    const handleCreditCardSubmit = (paymentResult) => {
        setDadosCartao({
            ultimos_digitos: paymentResult.card.last4,
            bandeira: paymentResult.card.brand,
            parcelas: paymentResult.installments,
            codigo_autorizacao: paymentResult.auth_code,
            tipo: paymentResult.type
        });
        setCartaoProcessado(true);
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
            const filtered = products.filter(product =>
                product.info_geral?.nome?.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
                product.info_geral?.codigo?.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
                product.info_geral?.marca?.toLowerCase().includes(productSearchTerm.toLowerCase())
            );
            setFilteredProducts(filtered);
        }
    }, [productSearchTerm, products]);

    // Calcular subtotal
    const calculateSubtotal = () => {
        return cartItems.reduce((total, item) =>
            total + (item.info_geral?.preco || 0) * item.quantity, 0
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
    };

    // Atualizar valor de troco quando valor pago mudar
    useEffect(() => {
        if (valorPago) {
            const valorPagoNum = parseFloat(valorPago.replace(/[^\d,]/g, '').replace(',', '.'));
            const totalVenda = calculateTotal();
            if (valorPagoNum > totalVenda) {
                setTroco(valorPagoNum - totalVenda);
            } else {
                setTroco(0);
            }
        }
    }, [valorPago, cartItems, discount, discountType]);

    // Formatar valor como moeda
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    // Finalizar venda
    // Função finalizeSale completa com suporte a todos os métodos de pagamento
    const finalizeSale = async () => {
        if (cartItems.length === 0) {
            setError('Adicione pelo menos um produto ao carrinho');
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

            // Gerar ID da OS
            const osPrefix = 'OS';
            const timestamp = Date.now().toString().slice(-6);
            const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
            const newOsId = `${osPrefix}${timestamp}${random}`;

            // Definir status inicial com base no método de pagamento
            let statusVenda = 'paga'; // Padrão para pagamentos imediatos (dinheiro, cartão presente)
            let statusPagamento = 'aprovado';

            // Ajustar status com base no método de pagamento
            switch (paymentMethod) {
                case 'boleto':
                    statusVenda = 'aguardando_pagamento';
                    statusPagamento = 'pendente';
                    break;
                case 'ted':
                    statusVenda = 'aguardando_pagamento';
                    statusPagamento = 'pendente';
                    break;
                case 'crediario':
                    statusVenda = 'paga'; // Consideramos paga mas com parcelas pendentes
                    statusPagamento = 'aprovado'; // O crediário interno já é pré-aprovado
                    break;
                case 'cartao':
                    // Para integração com gateway, o status seria "em_processamento" até receber callback
                    if (!cartaoProcessado) {
                        statusVenda = 'em_processamento';
                        statusPagamento = 'em_analise';
                    }
                    break;
            }

            // Dados específicos por método de pagamento
            const dadosEspecificos = {};

            // Configurar dados específicos com base no método de pagamento
            if (paymentMethod === 'boleto') {
                // Aqui você integraria com API de geração de boleto
                // Por enquanto, usamos dados de exemplo
                const dataVencimento = boletoVencimento ? new Date(boletoVencimento) : new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

                dadosEspecificos.codigo_barras = '00000000000000000000000000000000000000000000';
                dadosEspecificos.linha_digitavel = '00000.00000 00000.000000 00000.000000 0 00000000000000';
                dadosEspecificos.url_boleto = null; // URL seria gerada pela API de boleto
                dadosEspecificos.data_vencimento = dataVencimento;
            } else if (paymentMethod === 'cartao') {
                // Dados que viriam da integração com gateway de pagamento
                if (dadosCartao) {
                    dadosEspecificos.ultimos_digitos = dadosCartao.ultimos_digitos;
                    dadosEspecificos.bandeira = dadosCartao.bandeira;
                    dadosEspecificos.parcelas = dadosCartao.parcelas || 1;
                    dadosEspecificos.gateway_id = 'simulacao_gateway';
                    dadosEspecificos.transaction_id = `tx_${Date.now()}`;
                }
            } else if (paymentMethod === 'crediario') {
                // Configuração de parcelas para crediário interno
                const numeroParcelas = parseInt(parcelasCredario) || 3;
                const valorParcela = total / numeroParcelas;

                const parcelas = [];
                let dataProximaParcela = new Date();

                for (let i = 0; i < numeroParcelas; i++) {
                    dataProximaParcela = new Date(dataProximaParcela);
                    dataProximaParcela.setMonth(dataProximaParcela.getMonth() + 1);

                    parcelas.push({
                        numero: i + 1,
                        valor: valorParcela,
                        status: i === 0 ? 'paga' : 'pendente', // Primeira parcela considerada como entrada
                        data_vencimento: new Date(dataProximaParcela),
                        data_pagamento: i === 0 ? new Date() : null
                    });
                }

                dadosEspecificos.status_parcelas = parcelas;
                dadosEspecificos.data_primeira_parcela = new Date();
            }

            // 1. Estruturar dados da venda com os novos campos de pagamento
            const venda = {
                cliente: {
                    id: selectedClient.id,
                    nome: selectedClient.nome,
                    cpf: selectedClient.cpf
                },
                produtos: cartItems.map(item => ({
                    id: item.id,
                    nome: item.info_geral?.nome,
                    codigo: item.info_geral?.codigo,
                    marca: item.info_geral?.marca,
                    preco: item.info_geral?.preco,
                    quantidade: item.quantity,
                    total: item.info_geral?.preco * item.quantity
                })),
                pagamento: {
                    metodo: paymentMethod,
                    valorPago: valorPago ? parseFloat(valorPago.replace(/[^\d,]/g, '').replace(',', '.')) : total,
                    troco: troco,
                    status: statusPagamento,
                    data_criacao: serverTimestamp(),
                    data_aprovacao: statusPagamento === 'aprovado' ? serverTimestamp() : null,
                    dados_especificos: dadosEspecificos
                },
                subtotal: subtotal,
                desconto: {
                    tipo: discountType,
                    valor: discount,
                    total: discountAmount
                },
                total: total,
                data: serverTimestamp(),
                vendedor: {
                    id: user?.uid,
                    nome: vendedor
                },
                observacao: observation,
                status_venda: statusVenda,
                os_id: newOsId,
                requer_montagem: true,
                historico_status: [
                    {
                        status: statusVenda,
                        data: serverTimestamp(),
                        responsavel: {
                            id: user?.uid,
                            nome: vendedor
                        }
                    }
                ]
            };

            // 2. Registrar venda no Firebase
            const vendaRef = collection(firestore, `lojas/${selectedLoja}/vendas/items`);
            const novaVendaRef = await addDoc(vendaRef, venda);

            // 3. Atualizar estoque apenas se o pagamento for aprovado ou for crediário
            if (statusVenda === 'paga') {
                await Promise.all(cartItems.map(async (item) => {
                    const productRef = doc(firestore, `lojas/estoque/items/${item.id}`);
                    const productDoc = await getDoc(productRef);

                    if (productDoc.exists()) {
                        const productData = productDoc.data();
                        const currentStock = productData.por_loja?.[selectedLoja]?.quantidade || 0;
                        const newStock = Math.max(0, currentStock - item.quantity);

                        await updateDoc(productRef, {
                            [`por_loja.${selectedLoja}.quantidade`]: newStock
                        });
                    }
                }));
            }

            // 4. Registrar ordem de serviço apenas se pagamento aprovado ou crediário
            if (statusVenda === 'paga') {
                const osRef = collection(firestore, `lojas/${selectedLoja}/servicos/items`);
                await addDoc(osRef, {
                    id_os: newOsId,
                    id_venda: novaVendaRef.id,
                    cliente: {
                        id: selectedClient.id,
                        nome: selectedClient.nome,
                        cpf: selectedClient.cpf,
                        contato: selectedClient.telefone || ''
                    },
                    status: 'aguardando_montagem',
                    data_criacao: serverTimestamp(),
                    data_previsao: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // +2 dias
                    produtos: cartItems.map(item => ({
                        id: item.id,
                        nome: item.info_geral?.nome,
                        marca: item.info_geral?.marca
                    })),
                    observacoes: observation
                });
            }

            // 5. Registrar no controle de caixa apenas para pagamentos aprovados
            if (statusPagamento === 'aprovado') {
                const caixaRef = collection(firestore, `lojas/${selectedLoja}/financeiro/controle_caixa/items`);
                await addDoc(caixaRef, {
                    tipo: 'entrada',
                    valor: total,
                    descricao: `Venda #${novaVendaRef.id} - Cliente: ${selectedClient.nome}`,
                    formaPagamento: paymentMethod,
                    data: serverTimestamp(),
                    registradoPor: {
                        id: user?.uid,
                        nome: vendedor
                    },
                    vendaId: novaVendaRef.id
                });
            }

            // 6. Para boletos, adicionar no controle de contas a receber
            if (paymentMethod === 'boleto' || paymentMethod === 'ted') {
                const contasReceberRef = collection(firestore, `lojas/${selectedLoja}/financeiro/contas_receber/items`);
                await addDoc(contasReceberRef, {
                    tipo: 'venda',
                    valor: total,
                    descricao: `Venda #${novaVendaRef.id} - Cliente: ${selectedClient.nome}`,
                    forma_pagamento: paymentMethod,
                    data_criacao: serverTimestamp(),
                    data_vencimento: paymentMethod === 'boleto' ?
                        (boletoVencimento ? new Date(boletoVencimento) : new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)) :
                        new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // +1 dia para TED
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

            // 7. Para crediário, adicionar cada parcela no controle de contas a receber
            if (paymentMethod === 'crediario') {
                const contasReceberRef = collection(firestore, `lojas/${selectedLoja}/financeiro/contas_receber/items`);

                // Pular a primeira parcela se for considerada como entrada
                const parcelasAPagar = dadosEspecificos.status_parcelas.filter(p => p.status === 'pendente');

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

            setSaleId(novaVendaRef.id);
            setOsId(newOsId);

            // Definir dados de retorno específicos para cada método de pagamento
            if (paymentMethod === 'boleto') {
                setBoletoData({
                    url: dadosEspecificos.url_boleto || '#',
                    linhaDigitavel: dadosEspecificos.linha_digitavel,
                    dataVencimento: dadosEspecificos.data_vencimento
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


    const handleFinalizarClicked = () => { if (paymentMethod === 'cartao' && !cartaoProcessado) { setShowCreditCardForm(true); } else { finalizeSale(); } };

    // Fechar modal e redefinir estados
    const handleClose = () => {
        setSearchTerm('');
        setSelectedClient(null);
        setCartItems([]);
        setShowClientForm(false);
        setDadosCartao(null);
        setCartaoProcessado(false);
        setBoletoData(null);
        setBoletoVencimento(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
        setParcelasCredario("3");
        setStatusPagamentoFinal("");
        setStatusVendaFinal("");
        setProductSearchTerm('');
        setFilteredProducts([]);
        setPaymentMethod('dinheiro');
        setDiscount(0);
        setDiscountType('percentage');
        setObservation('');
        setValorPago('');
        setTroco(0);
        setError('');
        setSuccess(false);
        setSaleId(null);
        setOsId(null);
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

                {/* Conteúdo específico para boleto */}
                {paymentMethod === 'boleto' && boletoData && (
                    <div className="mb-6 p-4 border-2 border-dashed border-yellow-400 bg-yellow-50 rounded-lg">
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
                {paymentMethod === 'ted' && (
                    <div className="mb-6 p-4 border-2 border-dashed border-blue-400 bg-blue-50 rounded-lg">
                        <h4 className="font-medium text-blue-700 mb-2">Transferência Bancária (TED)</h4>
                        <p className="text-sm text-gray-700 mb-3">Por favor, realize a transferência para:</p>
                        <div className="text-sm bg-white p-3 border border-gray-200 rounded-lg mb-3 text-left">
                            <p><strong>Banco:</strong> Banco do Brasil</p>
                            <p><strong>Agência:</strong> 1234-5</p>
                            <p><strong>Conta:</strong> 67890-1</p>
                            <p><strong>CNPJ:</strong> 12.345.678/0001-90</p>
                            <p><strong>Favorecido:</strong> MASI Óticas LTDA</p>
                            <p><strong>Valor:</strong> {formatCurrency(calculateTotal())}</p>
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

                {/* Conteúdo específico para cartão */}
                {paymentMethod === 'cartao' && dadosCartao && (
                    <div className="mb-6 p-4 border-2 border-gray-200 bg-gray-50 rounded-lg">
                        <h4 className="font-medium text-gray-700 mb-2">Pagamento com Cartão</h4>
                        <p className="text-sm mb-1">
                            <span className="font-medium">Cartão:</span> **** **** **** {dadosCartao.ultimos_digitos}
                        </p>
                        <p className="text-sm mb-1">
                            <span className="font-medium">Bandeira:</span> {dadosCartao.bandeira}
                        </p>
                        {dadosCartao.parcelas > 1 && (
                            <p className="text-sm mb-1">
                                <span className="font-medium">Parcelamento:</span> {dadosCartao.parcelas}x de {formatCurrency(calculateTotal() / dadosCartao.parcelas)}
                            </p>
                        )}
                        <p className="text-sm mb-1">
                            <span className="font-medium">Autorização:</span> {dadosCartao.codigo_autorizacao}
                        </p>
                    </div>
                )}

                {/* Conteúdo específico para crediário */}
                {paymentMethod === 'crediario' && (
                    <div className="mb-6 p-4 border-2 border-dashed border-purple-400 bg-purple-50 rounded-lg">
                        <h4 className="font-medium text-[#81059e] mb-2">Crediário</h4>
                        <p className="text-sm text-gray-700 mb-2">Parcelamento em {parcelasCredario}x:</p>
                        <ul className="text-sm bg-white p-3 border border-gray-200 rounded-lg mb-3 text-left">
                            {Array.from({ length: parseInt(parcelasCredario) || 3 }).map((_, index) => {
                                const dataVencimento = new Date();
                                dataVencimento.setMonth(dataVencimento.getMonth() + index);

                                return (
                                    <li key={index} className="flex justify-between items-center mb-1 pb-1 border-b last:border-b-0">
                                        <span>
                                            {index === 0 ? 'Entrada' : `Parcela ${index + 1}`}
                                            <span className="text-xs text-gray-500 ml-2">
                                                ({dataVencimento.toLocaleDateString('pt-BR')})
                                            </span>
                                        </span>
                                        <span className={index === 0 ? 'text-green-600' : ''}>
                                            {formatCurrency(calculateTotal() / (parseInt(parcelasCredario) || 3))}
                                            {index === 0 && ' (pago)'}
                                        </span>
                                    </li>
                                );
                            })}
                        </ul>
                        <p className="text-xs text-gray-500">
                            As parcelas futuras aparecerão no sistema de contas a receber para controle.
                        </p>
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

                                        <div className="flex gap-2 mb-2">
                                            <div className="relative flex-1">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <FiSearch className="text-gray-400" />
                                                </div>
                                                <input
                                                    type="text"
                                                    value={productSearchTerm}
                                                    onChange={(e) => setProductSearchTerm(e.target.value)}
                                                    className="border-2 border-[#81059e] pl-10 p-2 rounded-lg w-full"
                                                    placeholder="Buscar produto por nome ou código"
                                                    ref={produtoInputRef}
                                                />
                                                {filteredProducts.length > 0 && (
                                                    <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-300 max-h-60 overflow-auto">
                                                        {filteredProducts.map(product => (
                                                            <div
                                                                key={product.id}
                                                                className="p-2 hover:bg-purple-50 cursor-pointer border-b last:border-b-0"
                                                                onClick={() => addToCart(product)}
                                                            >
                                                                <div className="font-medium">{product.info_geral?.nome}</div>
                                                                <div className="flex justify-between text-sm">
                                                                    <span className="text-gray-600">
                                                                        {product.info_geral?.marca} | Cód: {product.info_geral?.codigo}
                                                                    </span>
                                                                    <span className="font-semibold text-[#81059e]">
                                                                        {formatCurrency(product.info_geral?.preco || 0)}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <input
                                                type="number"
                                                min="1"
                                                value={newProductQty}
                                                onChange={(e) => setNewProductQty(parseInt(e.target.value) || 1)}
                                                className="border-2 border-[#81059e] p-2 rounded-lg w-16 text-center"
                                            />
                                        </div>

                                        {/* Tabela de Itens no Carrinho */}
                                        <div className="border-2 border-gray-200 rounded-lg overflow-hidden">
                                            <table className="min-w-full divide-y divide-gray-200">
                                                <thead className="bg-purple-100">
                                                    <tr>
                                                        <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Qtd
                                                        </th>
                                                        <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Produto
                                                        </th>
                                                        <th scope="col" className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Valor Unit.
                                                        </th>
                                                        <th scope="col" className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Valor Total
                                                        </th>
                                                        <th scope="col" className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Ações
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-200">
                                                    {cartItems.length === 0 ? (
                                                        <tr>
                                                            <td colSpan="5" className="px-4 py-4 text-center text-sm text-gray-500">
                                                                Nenhum produto adicionado
                                                            </td>
                                                        </tr>
                                                    ) : (
                                                        cartItems.map((item, index) => (
                                                            <tr
                                                                key={item.id}
                                                                className={focusedRow === index ? "bg-purple-50" : ""}
                                                                onClick={() => setFocusedRow(index)}
                                                            >
                                                                <td className="px-4 py-2 whitespace-nowrap text-sm">
                                                                    <div className="flex items-center">
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                updateQuantity(item.id, item.quantity + 1);
                                                                            }}
                                                                            className="text-gray-500 hover:text-[#81059e]"
                                                                        >
                                                                            +
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                                <td className="px-4 py-2 text-sm">
                                                                    <div className="font-medium">{item.info_geral?.nome}</div>
                                                                    <div className="text-xs text-gray-500">
                                                                        {item.info_geral?.marca} | Cód: {item.info_geral?.codigo}
                                                                    </div>
                                                                </td>
                                                                <td className="px-4 py-2 whitespace-nowrap text-sm text-right">
                                                                    {formatCurrency(item.info_geral?.preco || 0)}
                                                                </td>
                                                                <td className="px-4 py-2 whitespace-nowrap text-sm text-right font-medium">
                                                                    {formatCurrency((item.info_geral?.preco || 0) * item.quantity)}
                                                                </td>
                                                                <td className="px-4 py-2 whitespace-nowrap text-right text-sm">
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            removeFromCart(item.id);
                                                                        }}
                                                                        className="text-red-500 hover:text-red-700"
                                                                    >
                                                                        <FiTrash2 size={16} />
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))
                                                    )}
                                                </tbody>
                                            </table>
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
                                    {/* Opções de Pagamento */}
                                    <div className="mb-4">
                                        <label className="block text-[#81059e] font-medium mb-2 flex items-center gap-1">
                                            <FiCreditCard /> Forma de Pagamento
                                        </label>

                                        <div className="grid grid-cols-3 gap-2 mb-4">
                                            <button
                                                type="button"
                                                onClick={() => setPaymentMethod('dinheiro')}
                                                className={`p-2 border rounded-md flex items-center justify-center ${paymentMethod === 'dinheiro'
                                                    ? 'bg-[#81059e] text-white border-[#81059e]'
                                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                                    }`}
                                            >
                                                <FiDollarSign className="mr-1" /> Dinheiro
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setPaymentMethod('cartao');
                                                    setCartaoProcessado(false);
                                                    setDadosCartao(null);
                                                }}
                                                className={`p-2 border rounded-md flex items-center justify-center ${paymentMethod === 'cartao'
                                                    ? 'bg-[#81059e] text-white border-[#81059e]'
                                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                                    }`}
                                            >
                                                <FiCreditCard className="mr-1" /> Cartão
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => setPaymentMethod('pix')}
                                                className={`p-2 border rounded-md flex items-center justify-center ${paymentMethod === 'pix'
                                                    ? 'bg-[#81059e] text-white border-[#81059e]'
                                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                                    }`}
                                            >
                                                PIX
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => setPaymentMethod('crediario')}
                                                className={`p-2 border rounded-md flex items-center justify-center ${paymentMethod === 'crediario'
                                                    ? 'bg-[#81059e] text-white border-[#81059e]'
                                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                                    }`}
                                            >
                                                Crediário
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => setPaymentMethod('boleto')}
                                                className={`p-2 border rounded-md flex items-center justify-center ${paymentMethod === 'boleto'
                                                    ? 'bg-[#81059e] text-white border-[#81059e]'
                                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                                    }`}
                                            >
                                                <FiFileText className="mr-1" /> Boleto
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => setPaymentMethod('ted')}
                                                className={`p-2 border rounded-md flex items-center justify-center ${paymentMethod === 'ted'
                                                    ? 'bg-[#81059e] text-white border-[#81059e]'
                                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                                    }`}
                                            >
                                                TED
                                            </button>
                                        </div>

                                        {/* Opções adicionais para cartão */}
                                        {paymentMethod === 'cartao' && !cartaoProcessado && (
                                            <div className="flex flex-col gap-2 mb-4 p-3 border border-gray-200 rounded-lg">
                                                <p className="text-sm font-medium">Para finalizar a venda, você precisará inserir os dados do cartão.</p>
                                                <button
                                                    onClick={() => setShowCreditCardForm(true)}
                                                    className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-[#81059e] border border-transparent rounded-md hover:bg-[#6f0486]"
                                                >
                                                    Inserir dados do cartão
                                                </button>
                                            </div>
                                        )}

                                        {/* Mostrar informações do cartão se já processado */}
                                        {paymentMethod === 'cartao' && cartaoProcessado && dadosCartao && (
                                            <div className="flex flex-col gap-2 mb-4 p-3 border border-gray-200 rounded-lg bg-green-50">
                                                <div className="flex justify-between items-center">
                                                    <p className="text-sm font-medium text-green-700">Cartão processado com sucesso!</p>
                                                    <button
                                                        onClick={() => {
                                                            setCartaoProcessado(false);
                                                            setDadosCartao(null);
                                                        }}
                                                        className="text-red-500 hover:text-red-700"
                                                    >
                                                        <FiX size={16} />
                                                    </button>
                                                </div>
                                                <p className="text-sm">
                                                    <span className="font-medium">Cartão:</span> **** **** **** {dadosCartao.ultimos_digitos}
                                                </p>
                                                <p className="text-sm">
                                                    <span className="font-medium">Tipo:</span> {dadosCartao.tipo === 'credito' ? 'Crédito' : 'Débito'}
                                                </p>
                                                {dadosCartao.parcelas > 1 && (
                                                    <p className="text-sm">
                                                        <span className="font-medium">Parcelamento:</span> {dadosCartao.parcelas}x de {formatCurrency(calculateTotal() / dadosCartao.parcelas)}
                                                    </p>
                                                )}
                                            </div>
                                        )}

                                        {/* Opções para crediário */}
                                        {paymentMethod === 'crediario' && (
                                            <div className="flex flex-col gap-2 mb-4 p-3 border border-gray-200 rounded-lg">
                                                <p className="text-sm font-medium mb-1">Número de Parcelas:</p>
                                                <select
                                                    className="border border-gray-300 rounded-md p-2"
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
                                                <div className="mt-2">
                                                    <p className="text-sm font-medium">Valor de cada parcela:</p>
                                                    <p className="text-lg font-semibold text-[#81059e]">
                                                        {formatCurrency(calculateTotal() / parseInt(parcelasCredario))}
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Opções para boleto */}
                                        {paymentMethod === 'boleto' && (
                                            <div className="flex flex-col gap-2 mb-4 p-3 border border-gray-200 rounded-lg">
                                                <p className="text-sm font-medium mb-1">Data de Vencimento:</p>
                                                <input
                                                    type="date"
                                                    className="border border-gray-300 rounded-md p-2"
                                                    value={boletoVencimento}
                                                    onChange={(e) => setBoletoVencimento(e.target.value)}
                                                    min={new Date().toISOString().split('T')[0]} // Não permite datas passadas
                                                />
                                                <p className="text-xs text-gray-500 mt-2">
                                                    O boleto será gerado com os dados do cliente após a finalização da venda.
                                                </p>
                                            </div>
                                        )}

                                        {/* Opções para TED */}
                                        {paymentMethod === 'ted' && (
                                            <div className="flex flex-col gap-2 mb-4 p-3 border border-gray-200 rounded-lg">
                                                <p className="text-sm font-medium">Dados bancários da loja:</p>
                                                <div className="text-sm mt-1">
                                                    <p><strong>Banco:</strong> Banco do Brasil</p>
                                                    <p><strong>Agência:</strong> 1234-5</p>
                                                    <p><strong>Conta:</strong> 67890-1</p>
                                                    <p><strong>CNPJ:</strong> 12.345.678/0001-90</p>
                                                    <p><strong>Favorecido:</strong> MASI Óticas LTDA</p>
                                                </div>
                                                <p className="text-xs text-gray-500 mt-2">
                                                    Solicite o comprovante de transferência ao cliente para confirmação do pagamento.
                                                </p>
                                            </div>
                                        )}
                                    </div>
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
                                            className="border-2 border-[#81059e] p-2 rounded-lg w-full"
                                            placeholder={discountType === 'percentage' ? "Desconto em %" : "Desconto em R$"}
                                        />
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

                                    {/* Valor pago e troco (apenas para pagamento em dinheiro) */}
                                    {paymentMethod === 'dinheiro' && (
                                        <div className="bg-gray-50 p-4 rounded-lg mb-4">
                                            <div className="mb-3">
                                                <label className="block text-[#81059e] font-medium mb-1">
                                                    Valor Pago
                                                </label>
                                                <input
                                                    type="text"
                                                    value={valorPago}
                                                    onChange={handleValorPagoChange}
                                                    className="border-2 border-[#81059e] p-2 rounded-lg w-full"
                                                    placeholder="R$ 0,00"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-[#81059e] font-medium mb-1">
                                                    Troco
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formatCurrency(troco)}
                                                    className="border-2 border-[#81059e] p-2 rounded-lg w-full bg-gray-100"
                                                    readOnly
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Modificação no botão de finalizar venda para considerar processamento de cartão */}
                                    <button
                                        onClick={handleFinalizarClicked} // Substitua o finalizeSale anterior por esta função
                                        disabled={loading || cartItems.length === 0 || !selectedClient || (paymentMethod === 'cartao' && !cartaoProcessado)}
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
                                                    valorTotal={calculateTotal()}
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

export default ModalNovaVenda;