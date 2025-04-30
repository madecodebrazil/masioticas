import React, { useState } from 'react';
import { FiPercent, FiX } from 'react-icons/fi';

const CashbackModal = ({ isOpen, onClose, onConfirm, value, formatCurrency, availableCashback }) => {
    const [useFullAmount, setUseFullAmount] = useState(false);

    if (!isOpen) return null;

    const handleConfirm = () => {
        const amountToUse = useFullAmount ? Math.min(value, availableCashback) : value;
        onConfirm({
            valor_utilizado: amountToUse,
            saldo_restante: availableCashback - amountToUse
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-[#81059e] flex items-center">
                        <FiPercent className="mr-2" /> Pagamento com Cashback
                    </h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <FiX size={24} />
                    </button>
                </div>

                <div className="mb-4">
                    <p className="text-lg font-semibold text-gray-700">
                        Valor da Compra: {formatCurrency(value)}
                    </p>
                    <p className="text-lg font-semibold text-green-600">
                        Saldo Disponível: {formatCurrency(availableCashback)}
                    </p>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id="useFullAmount"
                            checked={useFullAmount}
                            onChange={(e) => setUseFullAmount(e.target.checked)}
                            className="mr-2"
                        />
                        <label htmlFor="useFullAmount" className="text-sm text-gray-700">
                            Usar valor máximo disponível ({formatCurrency(Math.min(value, availableCashback))})
                        </label>
                    </div>

                    {value > availableCashback && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                            <p className="text-sm text-red-700">
                                O valor da compra excede o saldo de cashback disponível.
                                Será utilizado apenas {formatCurrency(availableCashback)}.
                            </p>
                        </div>
                    )}

                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                        <p className="text-sm font-medium text-gray-700">
                            Valor a ser utilizado: {formatCurrency(useFullAmount ? Math.min(value, availableCashback) : value)}
                        </p>
                        <p className="text-sm text-gray-600">
                            Saldo restante após a compra: {formatCurrency(availableCashback - (useFullAmount ? Math.min(value, availableCashback) : value))}
                        </p>
                    </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="px-4 py-2 bg-[#81059e] text-white rounded-md hover:bg-[#6f0486]"
                        disabled={availableCashback <= 0}
                    >
                        Confirmar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CashbackModal; 