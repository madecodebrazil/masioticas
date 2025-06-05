// src/components/PaymentMethodPanel.js
import React, { useState, useEffect } from 'react';
import {
    FiPlus,
    FiTrash2,
    FiCheck,
    FiDollarSign,
    FiCreditCard,
    FiFileText,
    FiPercent,
    FiPlusCircle,
    FiActivity,
    FiAlertCircle,
    FiCheckCircle
} from 'react-icons/fi';
import { FaBitcoin, FaEthereum } from 'react-icons/fa';
import PixQRCodeModal from './PixQRCodeModal';
import CreditCardModal from './methodModal/CreditCardModal';
import CashModal from './methodModal/CashModal';
import TedModal from './methodModal/TedModal';
import BoletoModal from './methodModal/BoletoModal';
import CrediarioModal from './methodModal/CrediarioModal';
import CryptoModal from './methodModal/CryptoModal';
import CashbackModal from './methodModal/CashbackModal';

const PaymentMethodPanel = ({
    paymentMethods,
    setPaymentMethods,
    currentPaymentIndex,
    setCurrentPaymentIndex,
    valueDistribution,
    setValueDistribution,
    calculateTotal,
    calculateTotalAllocated,
    calculateRemainingValue,
    updatePaymentMethodValue,
    addPaymentMethod,
    removePaymentMethod,
    changePaymentMethod,
    cashbackDisponivel = 0, // Valor padrão para evitar undefined
    formatCurrency,
    boletoVencimento,
    setBoletoVencimento,
    parcelasCredario,
    setParcelasCredario,
    selectedCrypto,
    setSelectedCrypto,
    cryptoAddress,
    setCryptoAddress
}) => {
    // Estado para controle dos modais
    const [isPixModalOpen, setIsPixModalOpen] = useState(false);
    const [isCreditCardModalOpen, setIsCreditCardModalOpen] = useState(false);
    const [isCashModalOpen, setIsCashModalOpen] = useState(false);
    const [isTedModalOpen, setIsTedModalOpen] = useState(false);
    const [isBoletoModalOpen, setIsBoletoModalOpen] = useState(false);
    const [isCrediarioModalOpen, setIsCrediarioModalOpen] = useState(false);
    const [isCryptoModalOpen, setIsCryptoModalOpen] = useState(false);
    const [isCashbackModalOpen, setIsCashbackModalOpen] = useState(false);
    const [currentModalIndex, setCurrentModalIndex] = useState(null);
    const [editingValues, setEditingValues] = useState({});

    // Fallback para calculateTotal caso não seja passado
    const getTotal = typeof calculateTotal === 'function' ? calculateTotal : () => 0;

    // Debug: Log do cashback disponível
    useEffect(() => {
        console.log('Cashback disponível:', cashbackDisponivel);
    }, [cashbackDisponivel]);

    // Verifica se os pagamentos totalizam o valor da venda
    const isPaymentComplete = () => {
        const total = calculateTotal();
        const allocated = calculateTotalAllocated();
        return Math.abs(total - allocated) < 0.01;
    };

    // Lidar com abertura de modais para configuração de pagamento
    const handleConfigurePayment = (index) => {
        const payment = paymentMethods[index];
        setCurrentModalIndex(index);

        console.log('Configurando pagamento:', payment.method, 'Index:', index);

        switch (payment.method) {
            case 'cartao':
                setIsCreditCardModalOpen(true);
                break;
            case 'dinheiro':
                setIsCashModalOpen(true);
                break;
            case 'ted':
                setIsTedModalOpen(true);
                break;
            case 'boleto':
                setIsBoletoModalOpen(true);
                break;
            case 'crediario':
                setIsCrediarioModalOpen(true);
                break;
            case 'crypto':
                setIsCryptoModalOpen(true);
                break;
            case 'cashback':
                console.log('Abrindo modal cashback, cashback disponível:', cashbackDisponivel);
                setIsCashbackModalOpen(true);
                break;
            case 'pix':
                setIsPixModalOpen(true);
                break;
            default:
                console.warn('Método de pagamento não reconhecido:', payment.method);
                break;
        }
    };

    // Confirmar pagamento (chamado quando modal é confirmado)
    const handlePaymentConfirm = (details) => {
        if (currentModalIndex === null) return;

        const newMethods = [...paymentMethods];
        newMethods[currentModalIndex] = {
            ...newMethods[currentModalIndex],
            confirmed: true,
            details: details,
            timestamp: new Date().toISOString()
        };

        setPaymentMethods(newMethods);

        // Fechar todos os modais
        closeAllModals();
    };

    const closeAllModals = () => {
        setIsPixModalOpen(false);
        setIsCreditCardModalOpen(false);
        setIsCashModalOpen(false);
        setIsTedModalOpen(false);
        setIsBoletoModalOpen(false);
        setIsCrediarioModalOpen(false);
        setIsCryptoModalOpen(false);
        setIsCashbackModalOpen(false);
        setCurrentModalIndex(null);
    };

    // Renderizar ícone do método de pagamento
    const getPaymentMethodIcon = (method) => {
        switch (method) {
            case 'dinheiro':
                return <FiDollarSign />;
            case 'cartao':
                return <FiCreditCard />;
            case 'pix':
                return <span className="text-sm font-bold">PIX</span>;
            case 'crediario':
                return <FiFileText />;
            case 'boleto':
                return <FiFileText />;
            case 'ted':
                return <FiActivity />;
            case 'cashback':
                return <FiPercent />;
            case 'crypto':
                return <FaBitcoin />;
            default:
                return <FiDollarSign />;
        }
    };

    // Renderizar nome do método de pagamento
    const getPaymentMethodName = (method) => {
        const names = {
            dinheiro: 'Dinheiro',
            cartao: 'Cartão',
            pix: 'PIX',
            crediario: 'Crediário',
            boleto: 'Boleto',
            ted: 'TEV',
            cashback: 'Cashback',
            crypto: 'Crypto'
        };
        return names[method] || 'Outros';
    };

    // Substituir a função de adicionar pagamento
    const handleAddPaymentMethod = () => {
        // Limitar a 6 formas de pagamento
        if (paymentMethods.length >= 6) {
            return;
        }

        const total = getTotal();
        const totalAlocado = paymentMethods.reduce((sum, pm) => sum + (pm.value || 0), 0);
        const valorRestante = Math.max(total - totalAlocado, 0);

        setPaymentMethods([
            ...paymentMethods,
            {
                method: 'dinheiro',
                value: valorRestante,
                confirmed: false,
                details: null
            }
        ]);
    };

    // Distribuir valores automaticamente
    useEffect(() => {
        if (valueDistribution === 'auto' && paymentMethods.length > 0) {
            const total = calculateTotal();
            const valorDividido = total / paymentMethods.length;

            const precisaAtualizar = paymentMethods.some(pm => pm.value !== valorDividido);

            if (precisaAtualizar) {
                const novosPagamentos = paymentMethods.map(pm => ({
                    ...pm,
                    value: valorDividido
                }));
                setPaymentMethods(novosPagamentos);
            }
        }
    }, [paymentMethods.length, calculateTotal, valueDistribution]);

    const total = getTotal();
    const totalPago = paymentMethods.reduce((sum, pm) => sum + (pm.confirmed ? pm.value : 0), 0);
    const valorRestante = total - totalPago;

    return (
        <div className="mb-6">
            {/* Header com título e controles */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-[#81059e] font-semibold flex items-center gap-2 text-xl mb-1">
                        <FiCreditCard /> Formas de Pagamento
                    </h2>
                    <p className="text-lg font-medium text-gray-700">
                        {valorRestante <= 0 && (
                            <span className="text-green-600 ml-2 flex items-center gap-1">
                                <FiCheckCircle size={16} /> Pagamento Completo
                            </span>
                        )}
                    </p>
                </div>

                <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                        <div className="flex items-center">
                            <input
                                type="radio"
                                id="auto-distribution"
                                checked={valueDistribution === 'auto'}
                                onChange={() => {
                                    setValueDistribution('auto');
                                    setTimeout(() => {
                                        paymentMethods.forEach((_, i) => updatePaymentMethodValue(i));
                                    }, 0);
                                }}
                                className="mr-1"
                            />
                            <label htmlFor="auto-distribution" className="text-sm font-medium">Auto</label>
                        </div>
                        <div className="flex items-center">
                            <input
                                type="radio"
                                id="manual-distribution"
                                checked={valueDistribution === 'manual'}
                                onChange={() => setValueDistribution('manual')}
                                className="mr-1"
                            />
                            <label htmlFor="manual-distribution" className="text-sm font-medium">Manual</label>
                        </div>
                    </div>
                </div>
            </div>

            {/* Lista de métodos de pagamento */}
            <div className="space-y-4">
                {paymentMethods.map((payment, index) => (
                    <div
                        key={index}
                        className={`border-2 rounded-sm p-4 transition-all duration-200 ${
                            payment.confirmed 
                                ? 'border-green-500 bg-green-50' 
                                : currentPaymentIndex === index 
                                    ? 'border-[#81059e] bg-purple-50' 
                                    : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold mr-3 ${
                                    payment.confirmed ? 'bg-green-500' : 'bg-[#81059e]'
                                }`}>
                                    {payment.confirmed ? <FiCheck size={16} /> : index + 1}
                                </div>
                                <div>
                                    <div className="font-semibold text-lg">
                                        Pagamento {index + 1}
                                    </div>
                                    <div className="text-sm text-gray-600 flex items-center gap-2">
                                        {getPaymentMethodIcon(payment.method)}
                                        {getPaymentMethodName(payment.method)}
                                        {payment.confirmed && (
                                            <span className="text-green-600 font-medium">• Confirmado</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {paymentMethods.length > 1 && !payment.confirmed && (
                                <button
                                    type="button"
                                    onClick={() => removePaymentMethod(index)}
                                    className="p-2 rounded-full hover:bg-red-100 text-red-500 transition-colors"
                                    title="Remover forma de pagamento"
                                >
                                    <FiTrash2 size={18} />
                                </button>
                            )}
                        </div>

                        {!payment.confirmed && (
                            <>
                                {/* Seleção do método de pagamento */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                                    {[
                                        { key: 'dinheiro', label: 'Dinheiro', icon: FiDollarSign },
                                        { key: 'cartao', label: 'Cartão', icon: FiCreditCard },
                                        { key: 'pix', label: 'PIX', icon: null },
                                        { key: 'crediario', label: 'Crediário', icon: FiFileText },
                                        { key: 'boleto', label: 'Boleto', icon: FiFileText },
                                        { key: 'ted', label: 'TEV', icon: FiActivity },
                                        { 
                                            key: 'cashback', 
                                            label: `Cashback${cashbackDisponivel > 0 ? ` (${formatCurrency(cashbackDisponivel)})` : ' (Indisponível)'}`, 
                                            icon: FiPercent, 
                                            disabled: false // Removemos a condição de disable
                                        },
                                        { key: 'crypto', label: 'Crypto', icon: FaBitcoin }
                                    ].map(({ key, label, icon: Icon, disabled }) => (
                                        <button
                                            key={key}
                                            type="button"
                                            onClick={() => {
                                                console.log('Clicando em:', key, 'Disabled:', disabled);
                                                changePaymentMethod(index, key);
                                            }}
                                            disabled={disabled}
                                            className={`p-2 border rounded-sm flex items-center justify-center text-sm font-medium transition-all ${
                                                payment.method === key
                                                    ? 'bg-[#81059e] text-white border-[#81059e]'
                                                    : disabled
                                                        ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                                                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-[#81059e]'
                                            } ${key === 'cashback' && cashbackDisponivel <= 0 ? 'opacity-75' : ''}`}
                                        >
                                            {Icon && <Icon className="mr-1" size={14} />}
                                            {key === 'pix' ? 'PIX' : label}
                                        </button>
                                    ))}
                                </div>

                                {/* Aviso para cashback sem saldo */}
                                {payment.method === 'cashback' && cashbackDisponivel <= 0 && (
                                    <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-sm">
                                        <div className="flex items-center">
                                            <FiAlertCircle className="text-yellow-600 mr-2" />
                                            <span className="text-yellow-800 text-sm font-medium">
                                                Nenhum cashback disponível no momento
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {/* Configuração de valor */}
                                <div className="mb-4">
                                    <label className="text-sm font-semibold text-gray-700 mb-2 block">Total a Pagar:</label>
                                    {valueDistribution === 'auto' ? (
                                        <input
                                            type="text"
                                            value={formatCurrency(payment.value)}
                                            readOnly
                                            className="w-full p-3 border border-gray-300 rounded-sm bg-gray-100 font-medium"
                                        />
                                    ) : (
                                        <input
                                            type="text"
                                            value={
                                                editingValues[index] !== undefined
                                                    ? editingValues[index]
                                                    : formatCurrency(payment.value)
                                            }
                                            onChange={e => {
                                                let raw = e.target.value.replace(/\D/g, '');
                                                let num = parseFloat(raw) / 100 || 0;
                                                const total = getTotal();
                                                const outros = paymentMethods.reduce((sum, pm, idx) => idx !== index ? sum + (pm.value || 0) : sum, 0);
                                                const maxPermitido = Math.max(total - outros, 0);
                                                if (num > maxPermitido) num = maxPermitido;
                                                setEditingValues({
                                                    ...editingValues,
                                                    [index]: formatCurrency(num)
                                                });
                                                const newMethods = [...paymentMethods];
                                                newMethods[index] = {
                                                    ...newMethods[index],
                                                    value: num
                                                };
                                                setPaymentMethods(newMethods);
                                            }}
                                            onBlur={() => {
                                                const newEditingValues = { ...editingValues };
                                                delete newEditingValues[index];
                                                setEditingValues(newEditingValues);
                                            }}
                                            className="w-full p-3 border border-gray-300 rounded-sm focus:border-[#81059e] focus:ring-1 focus:ring-[#81059e]"
                                            inputMode="decimal"
                                        />
                                    )}
                                </div>

                                {/* Botão de configurar pagamento */}
                                <button
                                    onClick={() => {
                                        console.log('Configurar pagamento clicado para:', payment.method);
                                        handleConfigurePayment(index);
                                    }}
                                    className="w-full p-3 bg-[#81059e] text-white rounded-sm hover:bg-[#6f0486] font-medium transition-colors flex items-center justify-center gap-2"
                                >
                                    <FiCreditCard size={18} />
                                    Configurar {getPaymentMethodName(payment.method)}
                                </button>
                            </>
                        )}

                        {/* Detalhes do pagamento confirmado */}
                        {payment.confirmed && payment.details && (
                            <div className="bg-green-50 border border-green-200 rounded-sm p-4 mt-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <FiCheckCircle className="text-green-600" />
                                    <span className="font-medium text-green-800">Pagamento Confirmado</span>
                                </div>
                                <div className="text-sm text-green-700">
                                    <div className="flex justify-between">
                                        <span>Valor:</span>
                                        <span className="font-medium">{formatCurrency(payment.value)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Método:</span>
                                        <span className="font-medium">{getPaymentMethodName(payment.method)}</span>
                                    </div>
                                    {payment.details.ultimos_digitos && (
                                        <div className="flex justify-between">
                                            <span>Cartão:</span>
                                            <span className="font-medium">**** {payment.details.ultimos_digitos}</span>
                                        </div>
                                    )}
                                    {payment.details.parcelas > 1 && (
                                        <div className="flex justify-between">
                                            <span>Parcelas:</span>
                                            <span className="font-medium">{payment.details.parcelas}x</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Botão para adicionar mais um método de pagamento */}
            {valorRestante > 0 && paymentMethods.length < 6 && (
                <button
                    onClick={handleAddPaymentMethod}
                    className="mt-4 flex items-center justify-center w-full p-4 border-2 border-dashed border-[#81059e] rounded-sm text-[#81059e] hover:bg-purple-50 transition-colors font-medium"
                >
                    <FiPlusCircle className="mr-2" size={20} />
                    Adicionar Forma de Pagamento ({paymentMethods.length}/6)
                </button>
            )}

            {/* Aviso quando atingir limite máximo */}
            {paymentMethods.length >= 6 && valorRestante > 0 && (
                <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-sm text-center">
                    <p className="text-orange-700 text-sm font-medium">
                        Limite máximo de 6 formas de pagamento atingido
                    </p>
                </div>
            )}

            {/* Modais */}
            <CreditCardModal
                isOpen={isCreditCardModalOpen}
                onClose={closeAllModals}
                onConfirm={handlePaymentConfirm}
                value={currentModalIndex !== null ? paymentMethods[currentModalIndex].value : 0}
                formatCurrency={formatCurrency}
            />

            <CashModal
                isOpen={isCashModalOpen}
                onClose={closeAllModals}
                onConfirm={handlePaymentConfirm}
                value={currentModalIndex !== null ? paymentMethods[currentModalIndex].value : 0}
                formatCurrency={formatCurrency}
            />

            <TedModal
                isOpen={isTedModalOpen}
                onClose={closeAllModals}
                onConfirm={handlePaymentConfirm}
                value={currentModalIndex !== null ? paymentMethods[currentModalIndex].value : 0}
                formatCurrency={formatCurrency}
            />

            <BoletoModal
                isOpen={isBoletoModalOpen}
                onClose={closeAllModals}
                onConfirm={handlePaymentConfirm}
                value={currentModalIndex !== null ? paymentMethods[currentModalIndex].value : 0}
                formatCurrency={formatCurrency}
                vencimento={boletoVencimento}
            />

            <CrediarioModal
                isOpen={isCrediarioModalOpen}
                onClose={closeAllModals}
                onConfirm={handlePaymentConfirm}
                value={currentModalIndex !== null ? paymentMethods[currentModalIndex].value : 0}
                formatCurrency={formatCurrency}
                parcelas={parcelasCredario}
            />

            <CryptoModal
                isOpen={isCryptoModalOpen}
                onClose={closeAllModals}
                onConfirm={handlePaymentConfirm}
                value={currentModalIndex !== null ? paymentMethods[currentModalIndex].value : 0}
                formatCurrency={formatCurrency}
                selectedCrypto={selectedCrypto}
                cryptoAddress={cryptoAddress}
            />

            <CashbackModal
                isOpen={isCashbackModalOpen}
                onClose={closeAllModals}
                onConfirm={handlePaymentConfirm}
                value={currentModalIndex !== null ? paymentMethods[currentModalIndex].value : 0}
                formatCurrency={formatCurrency}
                availableCashback={cashbackDisponivel}
            />

            <PixQRCodeModal
                isOpen={isPixModalOpen}
                onClose={closeAllModals}
                onConfirm={handlePaymentConfirm}
                value={currentModalIndex !== null ? paymentMethods[currentModalIndex].value : 0}
                formatCurrency={formatCurrency}
            />
        </div>
    );
};

export default PaymentMethodPanel;