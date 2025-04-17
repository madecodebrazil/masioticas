// Componente corrigido
// components/PaymentMethodPanel.js
import React, { useState, useEffect } from 'react';
import {
    FiPlus,
    FiTrash2,
    FiCheck,
    FiDollarSign,
    FiCreditCard,
    FiFileText,
    FiPercent
} from 'react-icons/fi';
import { FaBitcoin } from 'react-icons/fa';

const PaymentMethodPanel = ({
    paymentMethods,
    setPaymentMethods,
    currentPaymentIndex,
    setCurrentPaymentIndex,
    valueDistribution,
    setValueDistribution,
    calculateTotal,
    processPaymentMethod,
    cashbackDisponivel
}) => {
    // Calcular total já alocado nos métodos de pagamento
    const calculateTotalAllocated = () => {
        return paymentMethods.reduce((sum, method) =>
            sum + (parseFloat(method.value) || 0), 0
        );
    };

    // Verifica se os pagamentos totalizam o valor da venda
    const isPaymentComplete = () => {
        const total = calculateTotal();
        const allocated = calculateTotalAllocated();
        return Math.abs(total - allocated) < 0.01;
    };

    // Renderizar detalhes específicos de cada método de pagamento
    const renderPaymentMethodDetails = (payment) => {
        if (payment.method === 'cartao' && !payment.processed) {
            return (
                <div className="p-2 border border-gray-200 rounded-lg mt-2 bg-gray-50">
                    <p className="text-sm">Clique em "Processar" para inserir os dados do cartão.</p>
                </div>
            );
        }

        if (payment.method === 'cartao' && payment.processed && payment.details) {
            return (
                <div className="p-2 border border-gray-200 rounded-lg mt-2 bg-green-50">
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

        if (payment.method === 'cashback') {
            return (
                <div className="p-2 border border-gray-200 rounded-lg mt-2 bg-amber-50">
                    <div className="flex justify-between items-center">
                        <p className="text-sm font-medium">Saldo disponível:</p>
                        <p className="text-sm font-semibold text-green-700">
                            {new Intl.NumberFormat('pt-BR', {
                                style: 'currency',
                                currency: 'BRL'
                            }).format(cashbackDisponivel || 0)}
                        </p>
                    </div>
                </div>
            );
        }

        return null;
    };

    // Redistribuir valores automaticamente entre todos os métodos
    const redistributeValues = () => {
        if (valueDistribution !== 'auto') return;

        const total = calculateTotal();
        const numMethods = paymentMethods.length;

        // Se houver apenas um método, atribui o valor total
        if (numMethods === 1) {
            const newMethods = [...paymentMethods];
            newMethods[0].value = total;
            setPaymentMethods(newMethods);
            return;
        }

        // Versão atualizada: distribuir valor restante para o método atual
        const newMethods = [...paymentMethods];

        // Primeiro, preservar valores já definidos manualmente (se houver)
        const allocatedSum = newMethods.reduce((sum, method, idx) =>
            idx !== currentPaymentIndex ? sum + (parseFloat(method.value) || 0) : sum, 0
        );

        // Atribuir o valor restante ao método atual
        const remainingValue = Math.max(0, total - allocatedSum);
        newMethods[currentPaymentIndex].value = remainingValue;

        setPaymentMethods(newMethods);
    };

    // Atualizar valor de um método de pagamento
    const updatePaymentMethodValue = (index, customValue = null) => {
        const total = calculateTotal();
        let newValue;

        if (customValue !== null) {
            newValue = customValue;
        } else if (valueDistribution === 'auto') {
            if (paymentMethods.length === 1) {
                newValue = total;
            } else {
                // Distribuir valor restante
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

    // CORRIGIDO: Adicionar método de pagamento
    const addPaymentMethod = () => {
        // Criar novo array com o novo método adicionado
        const newMethods = [
            ...paymentMethods,
            {
                method: 'dinheiro',
                value: 0,
                details: {},
                processed: false
            }
        ];

        // Atualizar primeiro os métodos de pagamento
        setPaymentMethods(newMethods);

        // Em seguida, atualizar o índice atual para o novo método
        const newIndex = newMethods.length - 1;
        setCurrentPaymentIndex(newIndex);
    };

    useEffect(() => {
        if (valueDistribution === 'auto') {
            // Só redistribuir se houver métodos de pagamento
            if (paymentMethods.length > 0) {
                redistributeValues();
            }
        }
        // Remover paymentMethods.length da dependência para evitar possíveis loops
    }, [calculateTotal(), currentPaymentIndex, valueDistribution]);

    useEffect(() => {
        // Quando o número de métodos de pagamento mudar e estivermos em modo automático
        if (valueDistribution === 'auto') {
            // Pequeno timeout para garantir que o estado já foi atualizado
            const timer = setTimeout(() => {
                redistributeValues();
            }, 50);
            
            return () => clearTimeout(timer);
        }
    }, [paymentMethods.length, valueDistribution]);

    // Atualizar distribuição quando total ou método atual mudar
    useEffect(() => {
        if (valueDistribution === 'auto') {
            redistributeValues();
        }
    }, [calculateTotal(), currentPaymentIndex, valueDistribution, paymentMethods.length]);

    // Remover método de pagamento
    const removePaymentMethod = (indexToRemove) => {
        if (paymentMethods.length <= 1) return;

        const updatedMethods = paymentMethods.filter((_, index) => index !== indexToRemove);

        // Ajustar o índice atual selecionado
        let newIndex = currentPaymentIndex;
        if (currentPaymentIndex >= updatedMethods.length) {
            newIndex = updatedMethods.length - 1;
        } else if (currentPaymentIndex === indexToRemove) {
            newIndex = Math.max(0, indexToRemove - 1);
        } else if (currentPaymentIndex > indexToRemove) {
            newIndex = currentPaymentIndex - 1;
        }

        setPaymentMethods(updatedMethods);
        setCurrentPaymentIndex(newIndex);
    };

    // Modificar método de um pagamento
    const changePaymentMethod = (index, method) => {
        const newMethods = [...paymentMethods];
        newMethods[index] = {
            ...newMethods[index],
            method: method,
            details: {},
            processed: method !== 'cartao' && method !== 'crypto'
        };
        setPaymentMethods(newMethods);
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

    // Formatar valor monetário
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    // Calcular valor restante a ser pago
    const calculateRemainingValue = () => {
        const total = calculateTotal();
        const allocated = calculateTotalAllocated();
        return Math.max(0, total - allocated);
    };

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
                            onChange={() => setValueDistribution('auto')}
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
                        className={`p-3 border-2 rounded-lg ${currentPaymentIndex === index
                            ? 'border-[#81059e] bg-purple-50'
                            : 'border-gray-200'
                            }`}
                    >
                        <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center">
                                <button
                                    onClick={() => setCurrentPaymentIndex(index)}
                                    className={`mr-2 h-6 w-6 rounded-full flex items-center justify-center ${currentPaymentIndex === index
                                        ? 'bg-[#81059e] text-white'
                                        : 'bg-gray-200'
                                        }`}
                                >
                                    {index + 1}
                                </button>
                                <span className="font-medium">Pagamento {index + 1}</span>
                            </div>

                            {paymentMethods.length > 1 && (
                                <button
                                    onClick={() => removePaymentMethod(index)}
                                    className="text-red-500 hover:text-red-700 p-1"
                                    aria-label="Remover método de pagamento"
                                >
                                    <FiTrash2 size={16} />
                                </button>
                            )}
                        </div>

                        {/* Botões de métodos de pagamento em grid responsivo */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mb-3">
                            <PaymentMethodButton
                                active={payment.method === 'dinheiro'}
                                onClick={() => changePaymentMethod(index, 'dinheiro')}
                                icon={<FiDollarSign className="mr-1" />}
                                label="Dinheiro"
                            />

                            <PaymentMethodButton
                                active={payment.method === 'cartao'}
                                onClick={() => changePaymentMethod(index, 'cartao')}
                                icon={<FiCreditCard className="mr-1" />}
                                label="Cartão"
                            />

                            <PaymentMethodButton
                                active={payment.method === 'pix'}
                                onClick={() => changePaymentMethod(index, 'pix')}
                                label="PIX"
                            />

                            <PaymentMethodButton
                                active={payment.method === 'crediario'}
                                onClick={() => changePaymentMethod(index, 'crediario')}
                                label="Crediário"
                            />

                            <PaymentMethodButton
                                active={payment.method === 'boleto'}
                                onClick={() => changePaymentMethod(index, 'boleto')}
                                icon={<FiFileText className="mr-1" />}
                                label="Boleto"
                            />

                            <PaymentMethodButton
                                active={payment.method === 'ted'}
                                onClick={() => changePaymentMethod(index, 'ted')}
                                label="TED"
                            />

                            <PaymentMethodButton
                                active={payment.method === 'cashback'}
                                onClick={() => changePaymentMethod(index, 'cashback')}
                                icon={<FiPercent className="mr-1" />}
                                label="Cashback"
                                disabled={cashbackDisponivel <= 0}
                                title={cashbackDisponivel <= 0 ? "Cliente não possui saldo de cashback" : ""}
                            />

                            <PaymentMethodButton
                                active={payment.method === 'crypto'}
                                onClick={() => changePaymentMethod(index, 'crypto')}
                                icon={<FaBitcoin className="mr-1" />}
                                label="Crypto"
                            />
                        </div>

                        {/* Valor e botões de ação em flex responsivo */}
                        <div className="flex flex-wrap items-center gap-2">
                            <div className="flex items-center min-w-[120px] flex-grow md:flex-grow-0">
                                <label className="text-sm font-medium text-gray-700 mr-2 whitespace-nowrap">Valor:</label>
                                <input
                                    type="text"
                                    value={formatCurrency(payment.value)}
                                    onChange={(e) => handlePaymentValueChange(index, e.target.value)}
                                    className={`p-2 rounded-lg w-full bg-transparent ${valueDistribution === 'auto' ? '' : ''
                                        }`}
                                    readOnly={valueDistribution === 'auto'}
                                />
                            </div>

                            {/* Botões de ação */}
                            <div className="flex gap-2 ml-auto">
                                {valueDistribution === 'manual' && (
                                    <button
                                        onClick={() => handlePaymentValueChange(index, calculateTotal().toString())}
                                        className="px-2 py-1 border rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 text-sm whitespace-nowrap"
                                        title="Definir valor total"
                                    >
                                        Total
                                    </button>
                                )}

                                {!payment.processed ? (
                                    <button
                                        onClick={() => processPaymentMethod(index)}
                                        className="px-5 py-2 border rounded-md bg-[#81059e] text-white hover:bg-[#6f0486] text-sm whitespace-nowrap flex items-center"
                                    >
                                        Processar
                                    </button>
                                ) : (
                                    <span className="px-3 py-1 bg-green-100 text-green-600 rounded-md flex items-center text-sm whitespace-nowrap border border-green-200">
                                        <FiCheck className="mr-1" /> Processado
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Renderização condicional de detalhes específicos para cada método */}
                        {renderPaymentMethodDetails(payment)}
                    </div>
                ))}
            </div>

            {/* Botão para adicionar mais um método de pagamento */}
            <button
                onClick={addPaymentMethod}
                className="mt-3 flex items-center justify-center w-full p-2 border-2 border-dashed border-[#81059e] rounded-lg text-[#81059e] hover:bg-purple-50"
            >
                <FiPlus className="mr-2" /> Adicionar Forma de Pagamento
            </button>

            {/* Resumo dos valores */}
            <div className="mt-4 p-3 bg-gray-100 rounded-lg">
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
                        <span className="font-medium text-red-600">
                            {formatCurrency(calculateRemainingValue())}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};

// Componente de botão de método de pagamento
const PaymentMethodButton = ({ active, onClick, icon, label, disabled, title }) => (
    <button
        type="button"
        onClick={onClick}
        className={`p-2 border rounded-md flex items-center justify-center ${active
            ? 'bg-[#81059e] text-white border-[#81059e]'
            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        disabled={disabled}
        title={title}
    >
        {icon} {label}
    </button>
);

export default PaymentMethodPanel;