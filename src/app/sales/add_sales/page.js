"use client";
export const dynamic = 'force-dynamic';
import React, { useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import useModalNovaVenda from '@/hooks/useModalNovaVenda';
import ClienteSelecao from '@/components/ClienteSelecao';
import ClientForm from '@/components/ClientForm';
import CarrinhoCompras from '@/components/CarrinhoCompras';
import PixQRCodeModal from '@/components/PixQRCodeModal';
import PaymentMethodPanel from '@/components/PaymentMethodPanel';
import OSManager from '@/components/OSManager';
import CreditCardForm from '@/components/CreditCardForm';
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
    FiMapPin,
    FiPlusCircle,
    FiGift,
    FiActivity,
    FiPercent,
    FiAlertTriangle,
    FiArrowLeft
} from 'react-icons/fi';
import { FaBitcoin, FaEthereum } from 'react-icons/fa';
import { useAuth } from '@/hooks/useAuth';

// Função para formatação de moeda
const formatCurrencyBR = (value) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value || 0);
};

const formatLojaNome = (lojaId) => {
    if (!lojaId) return '';
    const numero = lojaId.replace('loja', '');
    return `Loja ${numero}`;
};

// Componente principal simplificado
const NovaVendaPage = () => {
    const router = useRouter();
    const { userPermissions, userData } = useAuth();
    const [selectedLoja, setSelectedLoja] = useState('');
    const [isFinalizando, setIsFinalizando] = useState(false);
    const [collections, setCollections] = useState([
        { id: 1, name: "Coleção 1", items: [] }
    ]);
    const [activeCollection, setActiveCollection] = useState(1);
    const [osStatus, setOsStatus] = useState({ tipo: 'sem_os' });
    const [totalEditado, setTotalEditado] = useState(null);
    const [dataVenda, setDataVenda] = useState(new Date().toISOString().split('T')[0]);
    const [vendedor, setVendedor] = useState('');
    const [subtotalGlobal, setSubtotalGlobal] = useState(0);

    // Definir a loja baseada apenas nas permissões do usuário
    useEffect(() => {
        if (userPermissions?.lojas?.length > 0) {
            setSelectedLoja(userPermissions.lojas[0]);
        }
    }, [userPermissions]);

    // Definir o vendedor baseado nos dados do usuário
    useEffect(() => {
        if (userData) {
            const cargo = userData.isAdmin ? 'Administrador' : (userData.cargo || 'Usuário');
            setVendedor(`${cargo}: ${userData.nome}`);
        }
    }, [userData]);

    // Configurar as props para o hook useModalNovaVenda
    const modalProps = {
        isOpen: true, // sempre aberto, pois agora é uma página
        onClose: () => router.push('/sales'), // voltar para a lista de vendas
        selectedLoja
    };

    // Usar o hook original
    const novaVendaHook = useModalNovaVenda(modalProps);

    // Extrair as funções e states do hook com valores padrão para evitar indefinidos
    const {
        cartItems = [],
        setCartItems = () => { },
        selectedClient = null,
        setSelectedClient = () => { },
        paymentMethods = [],
        setPaymentMethods = () => { },
        error = null,
        setError = () => { },
        statusVenda = '',
        setStatusVenda = () => { },
        newOsId = null,
        setNewOsId = () => { },
        novaVendaRef = null,
        setNovaVendaRef = () => { },
        searchTerm = '',
        setSearchTerm = () => { },
        clients = [],
        setClients = () => { },
        filteredClients = [],
        setFilteredClients = () => { },
        showClientForm = false,
        setShowClientForm = () => { },
        products = [],
        setProducts = () => { },
        productSearchTerm = '',
        setProductSearchTerm = () => { },
        filteredProducts = [],
        setFilteredProducts = () => { },
        focusedRow = -1,
        setFocusedRow = () => { },
        newProductQty = 1,
        setNewProductQty = () => { },
        produtoInputRef = null,
        setProdutoInputRef = () => { },
        discount = 0,
        setDiscount = () => { },
        discountType = 'percentage',
        setDiscountType = () => { },
        observation = '',
        setObservation = () => { },
        valorPago = 0,
        setValorPago = () => { },
        troco = 0,
        setTroco = () => { },
        success = false,
        setSuccess = () => { },
        saleId = null,
        setSaleId = () => { },
        osId = null,
        setOsId = () => { },
        currentPaymentIndex = 0,
        setCurrentPaymentIndex = () => { },
        valueDistribution = {},
        setValueDistribution = () => { },
        showCreditCardForm = false,
        setShowCreditCardForm = () => { },
        dadosCartao = null,
        setDadosCartao = () => { },
        boletoData = null,
        setBoletoData = () => { },
        fetchClients = () => { },
        handleSelectClient = () => { },
        tipoTransacao = 'venda',
        setTipoTransacao = () => { },
        handleOSChange = () => { },
        osFormsCompleted = true,
        calculateTotal = () => 0,
        calculateSubtotal,
        calculateDiscount = () => 0,
        calculateTotalAllocated = () => 0,
        calculateRemainingValue = () => 0,
        updatePaymentMethodValue = () => { },
        addPaymentMethod = () => { },
        removePaymentMethod = () => { },
        changePaymentMethod = () => { },
        processPaymentMethod = () => { },
        handleFinalizarClicked = () => Promise.resolve(),
        precisaDeOS = false,
        colecaoPrecisaDeOS = false,
        formatCurrency = null,
        boletoVencimento = new Date(),
        setBoletoVencimento = () => { },
        parcelasCredario = 1,
        setParcelasCredario = () => { },
        selectedCrypto = 'bitcoin',
        setSelectedCrypto = () => { },
        cryptoAddress = '',
        setCryptoAddress = () => { },
        showPixModal = false,
        setShowPixModal = () => { },
        pixQRCode = '',
        cashbackDisponivel = 0
    } = novaVendaHook || {};

    // Função para calcular subtotal com fallback
    const calcSubtotal = calculateSubtotal || (() => {
        return Array.isArray(cartItems) && cartItems.length > 0
            ? cartItems.reduce((total, item) => total + (item.price * item.quantity), 0)
            : 0;
    });

    // Usar nossa função de formatação de moeda
    const formatCurrencyFn = formatCurrency || formatCurrencyBR;

    // Função para voltar à página anterior
    const handleBack = () => {
        router.push('/sales');
    };

    // Função para calcular o desconto sobre o subtotal global
    const calcularDescontoGlobal = () => {
        if (discountType === 'value') {
            return discount;
        } else if (discountType === 'percentage') {
            return (subtotalGlobal * discount) / 100;
        }
        return 0;
    };

    // Função para calcular o total final
    const calcularTotalGlobal = () => {
        const total = subtotalGlobal - calcularDescontoGlobal();
        return total >= 0 ? total : 0;
    };

    if (!userPermissions || !selectedLoja) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="animate-spin h-10 w-10 border-4 border-[#81059e] rounded-full border-t-transparent"></div>
                <p className="ml-3 text-[#81059e] font-medium">Carregando...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 pb-6">
            <Head>
                <title>{tipoTransacao === 'venda' ? 'Nova Venda' : 'Novo Orçamento'} | MASI Óticas</title>
            </Head>

            {/* Barra superior com título e botão voltar */}
            <div className="bg-[#81059e] px-4 py-3 shadow-md flex items-center text-white sticky top-0 z-10">
                {/* Botão voltar e tipo de transação - à esquerda */}
                <div className="w-1/3 flex items-center">
                    <button
                        onClick={handleBack}
                        className="mr-2 p-1 rounded-full hover:bg-purple-700 transition-colors"
                    >
                        <FiArrowLeft size={24} />
                    </button>
                    <span className="text-sm md:text-base ">
                        {tipoTransacao === 'venda' ? 'Nova Venda' : 'Novo Orçamento'}
                    </span>
                </div>

                {/* MASI Óticas centralizado */}
                <div className="w-1/3 flex justify-center items-center">
                    <Link href="/homepage" className="flex items-center">
                        <Image
                            src="/images/masioticas.png"
                            alt="Logo Masi"
                            width={120}
                            height={60}
                            className="object-contain hover:brightness-110 transition-all duration-300 max-w-[120px] max-h-[60px]"
                        />
                    </Link>
                </div>

                {/* Informação da loja - à direita */}
                <div className="w-1/3 flex justify-end">
                    {selectedLoja && (
                        <div className="bg-purple-800 px-3 py-1 rounded-full text-sm">
                            {formatLojaNome(selectedLoja)}
                        </div>
                    )}
                </div>
            </div>

            {/* Conteúdo principal */}
            <div className="max-w-6xl mx-auto px-4 mt-6">
                {/* Exibir mensagem de erro */}
                {error && (
                    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
                        <p>{error}</p>
                    </div>
                )}

                {/* Seletor de tipo de transação */}
                <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
                    <div className="flex justify-center">
                        <div className="grid grid-cols-2 gap-4 w-full max-w-md">
                            <button
                                type="button"
                                onClick={() => setTipoTransacao('venda')}
                                className={`p-2 border rounded-sm flex items-center justify-center ${tipoTransacao === 'venda'
                                    ? 'bg-[#81059e] text-white border-[#81059e]'
                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-purple-50'
                                    }`}
                            >
                                <FiShoppingCart className="mr-2" /> Venda
                            </button>
                            <button
                                type="button"
                                onClick={() => setTipoTransacao('orcamento')}
                                className={`p-2 border rounded-sm flex items-center justify-center ${tipoTransacao === 'orcamento'
                                    ? 'bg-[#81059e] text-white border-[#81059e]'
                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-purple-50'
                                    }`}
                            >
                                <FiFileText className="mr-2" /> Orçamento
                            </button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Coluna da esquerda: Detalhes da venda */}
                    <div>
                        {/* Data e Vendedor */}
                        <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
                            <div className="flex mb-2 gap-4">
                                <div className="flex items-center gap-2">
                                    <FiCalendar className="text-[#81059e]" />
                                    <span className="font-medium">Data:</span>
                                    <input
                                        type="date"
                                        value={dataVenda}
                                        onChange={(e) => setDataVenda(e.target.value)}
                                        className="border-2 border-gray-300 rounded-sm px-2 py-1"
                                    />
                                </div>
                            </div>
                            {vendedor && (
                                <div className="flex items-center gap-2">
                                    <FiUser className="text-[#81059e]" />
                                    <span className="font-medium">{vendedor}</span>
                                </div>
                            )}

                            {userPermissions?.isAdmin && (
                                <div className="mt-2 flex items-center gap-2">
                                    <FiMapPin className="text-[#81059e]" />
                                    <label className=" font-medium">Selecionar Loja:</label>
                                    <select
                                        value={selectedLoja}
                                        onChange={(e) => {
                                            setSelectedLoja(e.target.value);
                                        }}
                                        className="border-2 border-gray-300 rounded-sm px-2 py-1"
                                    >
                                        {userPermissions.lojas.map((loja) => (
                                            <option key={loja} value={loja}>
                                                {loja}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>

                        {/* Seleção de Cliente */}
                        <div className="bg-white h-60 p-4 rounded-lg shadow-sm mb-4">
                            <ClienteSelecao
                                searchTerm={searchTerm}
                                setSearchTerm={setSearchTerm}
                                filteredClients={filteredClients}
                                selectedClient={selectedClient}
                                setSelectedClient={setSelectedClient}
                                handleSelectClient={handleSelectClient}
                                showClientForm={showClientForm}
                                setShowClientForm={setShowClientForm}
                                fetchClients={fetchClients}
                                selectedLoja={selectedLoja}
                                ClientForm={ClientForm}
                            />
                        </div>

                        {/* Seleção e Lista de Produtos */}
                        <div className="bg-white rounded-lg shadow-sm mb-4">
                            <label className="block text-[#81059e] text-xl font-medium mb-3 flex items-center gap-1 p-4">
                                <FiShoppingCart /> Carrinho de Compras
                            </label>

                            <div>
                                <CarrinhoCompras
                                    cartItems={cartItems}
                                    setCartItems={setCartItems}
                                    selectedLoja={selectedLoja}
                                    formatCurrency={formatCurrencyFn}
                                    calculateTotal={calcularTotalGlobal}
                                    updateCollections={(updatedCollections) => setCollections(updatedCollections)}
                                    setActiveCollection={(colectionId) => setActiveCollection(colectionId)}
                                    updateCartValue={(subtotal, collections) => setSubtotalGlobal(subtotal)}
                                />
                            </div>
                        </div>

                        {/* Gerenciamento de OS */}
                        {cartItems?.length > 0 && (
                            <div className="bg-white rounded-lg shadow-sm mb-4">
                                <OSManager
                                    cartItems={cartItems}
                                    selectedClient={selectedClient}
                                    onOSChange={(data) => {
                                        setOsStatus(data);
                                        handleOSChange(data);
                                    }}
                                    collections={collections}
                                    activeCollection={activeCollection}
                                />
                            </div>
                        )}

                        {/* Aviso sobre OS pendentes */}
                        {osStatus.tipo !== 'sem_os' && !osFormsCompleted && (
                            <div className="mb-4 p-3 bg-yellow-50 border-l-4 border-yellow-500 text-yellow-700 flex items-center rounded-md shadow-sm">
                                <FiAlertTriangle className="mr-2" />
                                <span>Existem formulários de OS pendentes de preenchimento</span>
                            </div>
                        )}

                        {/* Observações */}
                        <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
                            <label className="block text-xl mb-1 flex items-center gap-1">
                                <FiFileText className="text-[#81059e]" /> <p className='text-[#81059e] font-medium'>Observações</p>
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
                        {/* ✅ DESCONTO COM LÓGICA SIMPLES - IGUAL AO R$ */}
                        <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
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

                            {/* ✅ USANDO EXATAMENTE A MESMA LÓGICA PARA AMBOS */}
                            <input
                                type="text"
                                inputMode="numeric"
                                value={
                                    discountType === 'value'
                                        ? discount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                                        : '% ' + discount.toLocaleString('pt-BR', { 
                                            style: 'decimal', 
                                            minimumFractionDigits: 2, 
                                            maximumFractionDigits: 2 
                                        })

                                }
                                onChange={(e) => {
                                    // ✅ MESMA LÓGICA PARA AMBOS OS TIPOS
                                    const onlyNumbers = e.target.value.replace(/\D/g, '');
                                    const parsedValue = onlyNumbers ? Number(onlyNumbers) / 100 : 0;
                                    
                                    // Para porcentagem, limita a 100%
                                    if (discountType === 'percentage' && parsedValue > 100) {
                                        return; // Não atualiza se for maior que 100%
                                    }
                                    
                                    setDiscount(parsedValue);
                                }}
                                className="border-2 border-[#81059e] p-2 rounded-sm w-full"
                                placeholder={discountType === 'percentage' ? 'Desconto em % (digite 050 para 0,50%)' : 'Desconto em R$'}
                            />
                        </div>

                        {/* Resumo da Venda */}
                        <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
                            <h3 className="text-lg font-medium text-[#81059e] mb-4">Resumo da Venda</h3>

                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span>Subtotal:</span>
                                    <span>{formatCurrencyFn(subtotalGlobal)}</span>
                                </div>

                                {discount > 0 && (
                                    <div className="flex justify-between text-green-600">
                                        <span>
                                            Desconto
                                            {discountType === 'percentage'
                                                ? ` (${discount.toLocaleString('pt-BR', { 
                                                    style: 'decimal', 
                                                    minimumFractionDigits: 2, 
                                                    maximumFractionDigits: 2 
                                                  })}%)`
                                                : ''}
                                            :
                                        </span>
                                        <span>- {formatCurrencyFn(calculateDiscount())}</span>
                                    </div>
                                )}

                                <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-300">
                                    <span>Total:</span>
                                    <div className="flex items-center">
                                        <input
                                            type="text"
                                            value={formatCurrencyFn(totalEditado ?? calcularTotalGlobal())}
                                            onChange={(e) => {
                                                const onlyNumbers = e.target.value.replace(/\D/g, '');
                                                const parsedValue = onlyNumbers ? Number(onlyNumbers) / 100 : 0;
                                                setTotalEditado(parsedValue);
                                            }}
                                            className="text-[#81059e] font-bold text-lg w-32 text-right focus:outline-none focus:border-b-2 focus:border-[#81059e]"
                                        />
                                        <button
                                            onClick={() => setTotalEditado(null)}
                                            className="ml-2 text-gray-400 hover:text-gray-600"
                                            title="Resetar para valor calculado"
                                        >
                                            <FiRefreshCw size={16} />
                                        </button>
                                    </div>
                                </div>

                                {totalEditado !== null && totalEditado !== calculateTotal() && (
                                    <div className="text-xs text-orange-500 flex justify-end items-center gap-1">
                                        <FiAlertTriangle size={14} />
                                        <span>Valor ajustado manualmente</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Painel de métodos de pagamento - apenas mostrar para vendas */}
                        {tipoTransacao === 'venda' && (
                            <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
                                <PaymentMethodPanel
                                    paymentMethods={paymentMethods}
                                    setPaymentMethods={setPaymentMethods}
                                    currentPaymentIndex={currentPaymentIndex}
                                    setCurrentPaymentIndex={setCurrentPaymentIndex}
                                    valueDistribution={valueDistribution}
                                    setValueDistribution={setValueDistribution}
                                    calculateTotal={calcularTotalGlobal}
                                    calculateTotalAllocated={calculateTotalAllocated}
                                    calculateRemainingValue={calculateRemainingValue}
                                    updatePaymentMethodValue={updatePaymentMethodValue}
                                    addPaymentMethod={addPaymentMethod}
                                    removePaymentMethod={removePaymentMethod}
                                    changePaymentMethod={changePaymentMethod}
                                    cashbackDisponivel={cashbackDisponivel}
                                    formatCurrency={formatCurrencyFn}
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
                            </div>
                        )}

                        {/* Botão de finalizar */}
                        <button
                            onClick={() => {
                                setIsFinalizando(true);
                                // Aqui, passamos o valor total editado para a função de finalização
                                const valorTotalFinal = totalEditado !== null ? totalEditado : calculateTotal();

                                // Verificar se handleFinalizarClicked aceita parâmetros
                                // Se não aceitar, você precisará modificar o hook useModalNovaVenda
                                handleFinalizarClicked(valorTotalFinal).finally(() => {
                                    setIsFinalizando(false);
                                });
                            }}
                            disabled={!cartItems || cartItems.length === 0 || !selectedClient ||
                                (tipoTransacao === 'venda' &&
                                    ((osStatus.tipo !== 'sem_os' && !osFormsCompleted) ||
                                        isFinalizando))}
                            className="w-full bg-[#81059e] text-white py-3 px-4 rounded-md flex items-center justify-center font-medium hover:bg-[#6f0486] disabled:bg-purple-300 disabled:cursor-not-allowed shadow-sm"
                        >
                            {isFinalizando ? (
                                <>
                                    <div className="animate-spin h-5 w-5 border-2 border-white rounded-full border-t-transparent mr-2"></div>
                                    Processando...
                                </>
                            ) : (
                                <>
                                    <FiCheck className="mr-2" /> {tipoTransacao === 'venda' ? 'Finalizar Venda' : 'Salvar Orçamento'}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Modal de cadastro de cliente */}
            {showClientForm && (
                <div className="fixed inset-0 z-[60] overflow-y-auto bg-black bg-opacity-50">
                    <div className="flex items-center justify-center min-h-screen">
                        <div className="bg-white rounded-sm shadow-xl w-full max-w-4xl">
                            <div className='bg-[#81059e] w-full p-4'>
                            <div className="flex justify-between items-center mb-2">
                                <h2 className="text-2xl font-bold text-white">Cadastrar Novo Cliente</h2>
                                <button
                                    onClick={() => setShowClientForm(false)}
                                    className="text-gray-400 hover:text-gray-300"
                                >
                                    <FiX size={24} />
                                </button>
                            </div>
                            </div>
                            <div className='p-6'>
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
                </div>
            )}

            {/* Modal de pagamento com cartão */}
            {showCreditCardForm && (
                <div className="fixed inset-0 z-[70] overflow-y-auto bg-black bg-opacity-50">
                    <div className="flex items-center justify-center min-h-screen p-4">
                        <CreditCardForm
                            onSubmit={(cardData) => {
                                setDadosCartao(cardData);
                                setShowCreditCardForm(false);
                                // Implementar processamento de cartão
                            }}
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

export default NovaVendaPage;