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
    FiCalendar
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
    cashbackDisponivel,
    formatCurrency,
    processPaymentMethod,
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

    // Fallback para calculateTotal caso não seja passado
    const getTotal = typeof calculateTotal === 'function' ? calculateTotal : () => 0;

    // Verifica se os pagamentos totalizam o valor da venda
    const isPaymentComplete = () => {
        const total = getTotal();
        const allocated = calculateTotalAllocated();
        return Math.abs(total - allocated) < 0.01;
    };

    // Lidar com o processamento de diferentes métodos de pagamento
    const handleProcessPayment = (index) => {
        const payment = paymentMethods[index];
        setCurrentModalIndex(index);

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
                setIsCashbackModalOpen(true);
                break;
            case 'pix':
                setIsPixModalOpen(true);
                break;
            default:
                break;
        }
    };

    const handleModalConfirm = (details) => {
        if (currentModalIndex === null) return;

        const newMethods = [...paymentMethods];
        newMethods[currentModalIndex] = {
            ...newMethods[currentModalIndex],
            processed: true,
            details: details
        };

        setPaymentMethods(newMethods);

        // Fechar todos os modais
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

    // Renderizar detalhes específicos de cada método de pagamento
    const renderPaymentMethodDetails = (payment, index) => {
        if (payment.method === 'cartao' && payment.processed && payment.details) {
            return (
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
            );
        }

        if (payment.method === 'pix' && payment.processed && payment.details) {
            return (
                <div className="p-2 border border-gray-200 rounded-sm mt-2 bg-green-50">
                    <p className="text-sm mb-1">
                        <span className="font-medium">QR Code PIX gerado</span>
                    </p>
                    <p className="text-sm">
                        <span className="font-medium">Valor:</span> {formatCurrency(payment.details.valor)}
                    </p>
                </div>
            );
        }

        if (payment.method === 'ted' && payment.processed && payment.details) {
            return (
                <div className="p-2 border border-gray-200 rounded-sm mt-2 bg-green-50">
                    <p className="text-sm mb-1">
                        <span className="font-medium">TED processado</span>
                    </p>
                    <p className="text-sm">
                        <span className="font-medium">Banco:</span> {payment.details.banco}
                    </p>
                    <p className="text-sm">
                        <span className="font-medium">Valor:</span> {formatCurrency(payment.details.valor)}
                    </p>
                </div>
            );
        }

        if (payment.method === 'boleto' && payment.processed && payment.details) {
            return (
                <div className="p-2 border border-gray-200 rounded-sm mt-2 bg-green-50">
                    <p className="text-sm mb-1">
                        <span className="font-medium">Boleto gerado</span>
                    </p>
                    <p className="text-sm">
                        <span className="font-medium">Vencimento:</span> {payment.details.vencimento}
                    </p>
                    <p className="text-sm">
                        <span className="font-medium">Valor:</span> {formatCurrency(payment.details.valor)}
                    </p>
                </div>
            );
        }

        if (payment.method === 'crediario' && payment.processed && payment.details) {
            return (
                <div className="p-2 border border-gray-200 rounded-sm mt-2 bg-green-50">
                    <p className="text-sm mb-1">
                        <span className="font-medium">Crediário processado</span>
                    </p>
                    <p className="text-sm">
                        <span className="font-medium">Parcelas:</span> {payment.details.parcelas}x
                    </p>
                    <p className="text-sm">
                        <span className="font-medium">Valor por parcela:</span> {formatCurrency(payment.details.valorParcela)}
                    </p>
                </div>
            );
        }

        if (payment.method === 'cashback' && payment.processed && payment.details) {
            return (
                <div className="p-2 border border-gray-200 rounded-sm mt-2 bg-green-50">
                    <p className="text-sm mb-1">
                        <span className="font-medium">Cashback aplicado</span>
                    </p>
                    <p className="text-sm">
                        <span className="font-medium">Valor utilizado:</span> {formatCurrency(payment.details.valor)}
                    </p>
                    <p className="text-sm">
                        <span className="font-medium">Saldo restante:</span> {formatCurrency(payment.details.saldoRestante)}
                    </p>
                </div>
            );
        }

        if (payment.method === 'crypto' && payment.processed && payment.details) {
            return (
                <div className="p-2 border border-gray-200 rounded-sm mt-2 bg-green-50">
                    <p className="text-sm mb-1">
                        <span className="font-medium">Criptomoeda processada</span>
                    </p>
                    <p className="text-sm">
                        <span className="font-medium">Moeda:</span> {payment.details.moeda}
                    </p>
                    <p className="text-sm">
                        <span className="font-medium">Valor:</span> {formatCurrency(payment.details.valor)}
                    </p>
                </div>
            );
        }

        if (payment.method === 'cashback' && !payment.processed) {
            return null;
        }

        if (payment.method === 'boleto' && !payment.processed) {
            return null;
        }

        if (payment.method === 'crediario' && !payment.processed) {
            return null;
        }

        if (payment.method === 'crypto' && !payment.processed) {
            return null;
        }

        return null;
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
    };

    return (
        <div className="mb-6">
            <div className="flex justify-between items-center mb-3">
                <label className="block text-[#81059e] font-medium flex items-center gap-1 text-xl">
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
                        className={`p-3 border-2 rounded-sm ${currentPaymentIndex === index ? 'border-[#81059e] bg-purple-50' : 'border-gray-200'}`}
                    >
                        <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center">
                                <button
                                    onClick={() => setCurrentPaymentIndex(index)}
                                    className={`mr-2 p-1 rounded-full ${currentPaymentIndex === index ? 'bg-[#81059e] text-white' : 'bg-gray-200'}`}
                                >
                                    {index + 1}
                                </button>
                                <span className="font-medium">Pagamento {index + 1}</span>
                            </div>

                            {paymentMethods.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => removePaymentMethod(index)}
                                    className="p-2 rounded-full hover:bg-red-100 text-red-500"
                                    title="Remover forma de pagamento"
                                >
                                    <FiTrash2 size={18} />
                                </button>
                            )}
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-3">
                            <button
                                type="button"
                                onClick={() => changePaymentMethod(index, 'dinheiro')}
                                className={`p-2 border rounded-sm flex items-center justify-center ${payment.method === 'dinheiro'
                                    ? 'bg-[#81059e] text-white border-[#81059e]'
                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                    }`}
                            >
                                <FiDollarSign className="mr-1" /> Dinheiro
                            </button>

                            <button
                                type="button"
                                onClick={() => changePaymentMethod(index, 'cartao')}
                                className={`p-2 border rounded-sm flex items-center justify-center ${payment.method === 'cartao'
                                    ? 'bg-[#81059e] text-white border-[#81059e]'
                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                    }`}
                            >
                                <FiCreditCard className="mr-1" /> Cartão
                            </button>

                            <button
                                type="button"
                                onClick={() => changePaymentMethod(index, 'pix')}
                                className={`p-2 border rounded-sm flex items-center justify-center ${payment.method === 'pix'
                                    ? 'bg-[#81059e] text-white border-[#81059e]'
                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                    }`}
                            >
                                PIX
                            </button>

                            <button
                                type="button"
                                onClick={() => changePaymentMethod(index, 'crediario')}
                                className={`p-2 border rounded-sm flex items-center justify-center ${payment.method === 'crediario'
                                    ? 'bg-[#81059e] text-white border-[#81059e]'
                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                    }`}
                            >
                                Crediário
                            </button>

                            <button
                                type="button"
                                onClick={() => changePaymentMethod(index, 'boleto')}
                                className={`p-2 border rounded-sm flex items-center justify-center ${payment.method === 'boleto'
                                    ? 'bg-[#81059e] text-white border-[#81059e]'
                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                    }`}
                            >
                                <FiFileText className="mr-1" /> Boleto
                            </button>

                            <button
                                type="button"
                                onClick={() => changePaymentMethod(index, 'ted')}
                                className={`p-2 border rounded-sm flex items-center justify-center ${payment.method === 'ted'
                                    ? 'bg-[#81059e] text-white border-[#81059e]'
                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                    }`}
                            >
                                <FiActivity className="mr-1" /> TEV
                            </button>

                            <button
                                type="button"
                                onClick={() => changePaymentMethod(index, 'cashback')}
                                className={`p-2 border rounded-sm flex items-center justify-center ${payment.method === 'cashback'
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
                                className={`p-2 border rounded-sm flex items-center justify-center ${payment.method === 'crypto'
                                    ? 'bg-[#81059e] text-white border-[#81059e]'
                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                    }`}
                            >
                                <FaBitcoin className="mr-1" /> Crypto
                            </button>
                        </div>

                        <div className="grid">
                            <label className="text-sm font-medium text-gray-700 mb-2">Valor:</label>
                            <input
                                type="text"
                                value={formatCurrency(payment.value)}
                                onChange={(e) => handlePaymentValueChange(index, e.target.value)}
                                className={`border p-2 w-32 mb-4 ${valueDistribution === 'auto' ? 'bg-gray-100' : ''}`}
                                readOnly={valueDistribution === 'auto'}
                            />

                            {/* Botão para configurar valor total */}
                            {valueDistribution === 'manual' && (
                                <button
                                    onClick={() => {
                                        const newMethods = [...paymentMethods];
                                        newMethods[index] = {
                                            ...newMethods[index],
                                            value: getTotal()
                                        };
                                        setPaymentMethods(newMethods);
                                    }}
                                    className="p-2 border rounded-sm bg-gray-100 text-gray-700 hover:bg-gray-200 text-sm"
                                    title="Definir valor total"
                                >
                                    Total
                                </button>
                            )}

                            {/* Botão sempre visível para permitir processamento/reprocessamento */}
                            <button
                                onClick={() => handleProcessPayment(index)}
                                className="p-2 border rounded-md bg-[#81059e] text-white hover:bg-[#6f0486] text-sm"
                            >
                                {payment.processed ? "Reprocessar" : "Processar"}
                            </button>

                            {/* Status de processado só aparece se tiver details (confirmado pelo modal) */}
                            {payment.processed && payment.details && (
                                <span className="text-green-600 flex items-center text-sm ml-2">
                                    <FiCheck className="mr-1" /> Processado
                                </span>
                            )}
                        </div>

                        {renderPaymentMethodDetails(payment, index)}
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

            {/* Modais */}
            <CreditCardModal
                isOpen={isCreditCardModalOpen}
                onClose={() => {
                    setIsCreditCardModalOpen(false);
                    setCurrentModalIndex(null);
                }}
                onConfirm={handleModalConfirm}
                value={currentModalIndex !== null ? paymentMethods[currentModalIndex].value : 0}
                formatCurrency={formatCurrency}
            />

            <CashModal
                isOpen={isCashModalOpen}
                onClose={() => {
                    setIsCashModalOpen(false);
                    setCurrentModalIndex(null);
                }}
                onConfirm={handleModalConfirm}
                value={currentModalIndex !== null ? paymentMethods[currentModalIndex].value : 0}
                formatCurrency={formatCurrency}
            />

            <TedModal
                isOpen={isTedModalOpen}
                onClose={() => {
                    setIsTedModalOpen(false);
                    setCurrentModalIndex(null);
                }}
                onConfirm={handleModalConfirm}
                value={currentModalIndex !== null ? paymentMethods[currentModalIndex].value : 0}
                formatCurrency={formatCurrency}
            />

            <BoletoModal
                isOpen={isBoletoModalOpen}
                onClose={() => {
                    setIsBoletoModalOpen(false);
                    setCurrentModalIndex(null);
                }}
                onConfirm={handleModalConfirm}
                value={currentModalIndex !== null ? paymentMethods[currentModalIndex].value : 0}
                formatCurrency={formatCurrency}
                vencimento={boletoVencimento}
            />

            <CrediarioModal
                isOpen={isCrediarioModalOpen}
                onClose={() => {
                    setIsCrediarioModalOpen(false);
                    setCurrentModalIndex(null);
                }}
                onConfirm={handleModalConfirm}
                value={currentModalIndex !== null ? paymentMethods[currentModalIndex].value : 0}
                formatCurrency={formatCurrency}
                parcelas={parcelasCredario}
            />

            <CryptoModal
                isOpen={isCryptoModalOpen}
                onClose={() => {
                    setIsCryptoModalOpen(false);
                    setCurrentModalIndex(null);
                }}
                onConfirm={handleModalConfirm}
                value={currentModalIndex !== null ? paymentMethods[currentModalIndex].value : 0}
                formatCurrency={formatCurrency}
                selectedCrypto={selectedCrypto}
                cryptoAddress={cryptoAddress}
            />

            <CashbackModal
                isOpen={isCashbackModalOpen}
                onClose={() => {
                    setIsCashbackModalOpen(false);
                    setCurrentModalIndex(null);
                }}
                onConfirm={handleModalConfirm}
                value={currentModalIndex !== null ? paymentMethods[currentModalIndex].value : 0}
                formatCurrency={formatCurrency}
                availableCashback={cashbackDisponivel}
            />

            {/* Modal de QR Code PIX */}
            <PixQRCodeModal
                isOpen={isPixModalOpen}
                onClose={() => {
                    setIsPixModalOpen(false);
                    setCurrentModalIndex(null);
                }}
                onConfirm={handleModalConfirm}
                value={currentModalIndex !== null ? paymentMethods[currentModalIndex].value : 0}
                formatCurrency={formatCurrency}
            />
        </div>
    );
};

export default PaymentMethodPanel;