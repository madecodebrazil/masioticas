import React, { useState, useEffect } from 'react';
import { FiPercent, FiX, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';

const CashbackModal = ({ isOpen, onClose, onConfirm, value, formatCurrency, availableCashback = 0 }) => {
    const [useFullAmount, setUseFullAmount] = useState(false);
    const [customAmount, setCustomAmount] = useState('');
    const [useCustomAmount, setUseCustomAmount] = useState(false);

    // Reset states when modal opens
    useEffect(() => {
        if (isOpen) {
            setUseFullAmount(false);
            setUseCustomAmount(false);
            setCustomAmount('');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const maxUsable = Math.min(value, availableCashback);
    const customAmountValue = customAmount ? parseFloat(customAmount.replace(/[^\d,]/g, '').replace(',', '.')) || 0 : 0;
    
    const getAmountToUse = () => {
        if (availableCashback <= 0) {
            return 0;
        }
        
        if (useCustomAmount) {
            return Math.min(customAmountValue, maxUsable);
        } else if (useFullAmount) {
            return maxUsable;
        } else {
            return Math.min(value, availableCashback);
        }
    };

    const handleConfirm = () => {
        const amountToUse = getAmountToUse();
        
        // Permite confirmar mesmo com valor 0 quando não há cashback
        if (availableCashback <= 0) {
            onConfirm({
                valor_utilizado: 0,
                saldo_restante: 0,
                cashback_original: availableCashback
            });
            return;
        }

        if (amountToUse > availableCashback) {
            alert('Valor excede o cashback disponível');
            return;
        }

        onConfirm({
            valor_utilizado: amountToUse,
            saldo_restante: availableCashback - amountToUse,
            cashback_original: availableCashback
        });
    };

    const handleCustomAmountChange = (e) => {
        let inputValue = e.target.value;
        
        // Remove caracteres não numéricos exceto vírgula
        inputValue = inputValue.replace(/[^\d,]/g, '');
        
        // Garante que só há uma vírgula
        const parts = inputValue.split(',');
        if (parts.length > 2) {
            inputValue = parts[0] + ',' + parts.slice(1).join('');
        }
        
        // Limita a 2 casas decimais
        if (parts[1] && parts[1].length > 2) {
            inputValue = parts[0] + ',' + parts[1].substring(0, 2);
        }
        
        setCustomAmount(inputValue);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-[#81059e] flex items-center">
                        <FiPercent className="mr-2" /> Pagamento com Cashback
                    </h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <FiX size={24} />
                    </button>
                </div>

                {/* Informações principais */}
                <div className="mb-6 space-y-2">
                    <div className="flex justify-between items-center">
                        <span className="text-gray-600">Valor da Compra:</span>
                        <span className="text-lg font-semibold text-gray-800">{formatCurrency(value)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-gray-600">Cashback Disponível:</span>
                        <span className={`text-lg font-semibold ${availableCashback > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(availableCashback)}
                        </span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-gray-600">Máximo Utilizável:</span>
                        <span className="text-lg font-semibold text-blue-600">{formatCurrency(maxUsable)}</span>
                    </div>
                </div>

                {/* Verificação se há cashback disponível */}
                {availableCashback <= 0 ? (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md mb-4">
                        <div className="flex items-center">
                            <FiAlertCircle className="text-yellow-600 mr-2" />
                            <div>
                                <p className="text-yellow-800 font-medium">Sem Saldo de Cashback</p>
                                <p className="text-yellow-700 text-sm">
                                    Você pode continuar e confirmar mesmo sem saldo. O valor será R$ 0,00.
                                </p>
                            </div>
                        </div>
                    </div>
                ) : null}
                        {/* Opções de uso do cashback */}
                        <div className="space-y-4 mb-6">{availableCashback > 0 ? (
                            <>
                            {/* Usar valor total da compra */}
                            <div className="border border-gray-200 rounded-md p-3">
                                <div className="flex items-start">
                                    <input
                                        type="radio"
                                        id="useCompraAmount"
                                        name="cashbackOption"
                                        checked={!useFullAmount && !useCustomAmount}
                                        onChange={() => {
                                            setUseFullAmount(false);
                                            setUseCustomAmount(false);
                                        }}
                                        className="mr-2 mt-1"
                                    />
                                    <label htmlFor="useCompraAmount" className="flex-1">
                                        <div className="font-medium text-gray-800">
                                            Usar para cobrir a compra
                                        </div>
                                        <div className="text-sm text-gray-600">
                                            Utilizar {formatCurrency(Math.min(value, availableCashback))} do cashback
                                        </div>
                                    </label>
                                </div>
                            </div>

                            {/* Usar valor máximo disponível */}
                            {maxUsable > Math.min(value, availableCashback) && (
                                <div className="border border-gray-200 rounded-md p-3">
                                    <div className="flex items-start">
                                        <input
                                            type="radio"
                                            id="useFullAmount"
                                            name="cashbackOption"
                                            checked={useFullAmount}
                                            onChange={() => {
                                                setUseFullAmount(true);
                                                setUseCustomAmount(false);
                                            }}
                                            className="mr-2 mt-1"
                                        />
                                        <label htmlFor="useFullAmount" className="flex-1">
                                            <div className="font-medium text-gray-800">
                                                Usar valor máximo disponível
                                            </div>
                                            <div className="text-sm text-gray-600">
                                                Utilizar {formatCurrency(maxUsable)} do cashback
                                            </div>
                                        </label>
                                    </div>
                                </div>
                            )}

                            {/* Usar valor personalizado */}
                            <div className="border border-gray-200 rounded-md p-3">
                                <div className="flex items-start">
                                    <input
                                        type="radio"
                                        id="useCustomAmount"
                                        name="cashbackOption"
                                        checked={useCustomAmount}
                                        onChange={() => {
                                            setUseFullAmount(false);
                                            setUseCustomAmount(true);
                                        }}
                                        className="mr-2 mt-1"
                                    />
                                    <label htmlFor="useCustomAmount" className="flex-1">
                                        <div className="font-medium text-gray-800 mb-2">
                                            Usar valor personalizado
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="0,00"
                                            value={customAmount}
                                            onChange={handleCustomAmountChange}
                                            onFocus={() => {
                                                setUseFullAmount(false);
                                                setUseCustomAmount(true);
                                            }}
                                            className="w-full p-2 border border-gray-300 rounded-sm focus:border-[#81059e] focus:ring-1 focus:ring-[#81059e]"
                                        />
                                        <div className="text-xs text-gray-500 mt-1">
                                            Máximo: {formatCurrency(maxUsable)}
                                        </div>
                                    </label>
                                </div>
                            </div>
                            </>
                            ) : (
                                <div className="border border-gray-200 rounded-md p-3">
                                    <div className="text-center text-gray-500">
                                        <p className="font-medium">Nenhum cashback para utilizar</p>
                                        <p className="text-sm">O valor do cashback será R$ 0,00</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Resumo da operação */}
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-md mb-4">
                            <div className="flex items-center mb-2">
                                <FiCheckCircle className="text-blue-600 mr-2" />
                                <span className="font-medium text-blue-800">Resumo da Operação</span>
                            </div>
                            <div className="text-sm text-blue-700 space-y-1">
                                <div className="flex justify-between">
                                    <span>Valor a ser utilizado:</span>
                                    <span className="font-medium">{formatCurrency(getAmountToUse())}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Saldo restante após a compra:</span>
                                    <span className="font-medium">{formatCurrency(Math.max(0, availableCashback - getAmountToUse()))}</span>
                                </div>
                                {getAmountToUse() < value && (
                                    <div className="flex justify-between text-orange-600">
                                        <span>Valor restante a pagar:</span>
                                        <span className="font-medium">{formatCurrency(value - getAmountToUse())}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Avisos */}
                        {availableCashback > 0 && value > availableCashback && (
                            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md mb-4">
                                <div className="flex items-center">
                                    <FiAlertCircle className="text-yellow-600 mr-2 flex-shrink-0" />
                                    <p className="text-sm text-yellow-800">
                                        O valor da compra excede o saldo de cashback disponível.
                                        Será necessário usar outra forma de pagamento para o restante.
                                    </p>
                                </div>
                            </div>
                        )}

                        {useCustomAmount && customAmountValue > maxUsable && availableCashback > 0 && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-md mb-4">
                                <div className="flex items-center">
                                    <FiAlertCircle className="text-red-600 mr-2 flex-shrink-0" />
                                    <p className="text-sm text-red-800">
                                        O valor personalizado excede o máximo utilizável.
                                        Será usado apenas {formatCurrency(maxUsable)}.
                                    </p>
                                </div>
                            </div>
                        )}

                {/* Botões de ação */}
                <div className="mt-6 flex justify-end space-x-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="px-4 py-2 bg-[#81059e] text-white rounded-md hover:bg-[#6f0486] transition-colors"
                    >
                        Confirmar Cashback
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CashbackModal;