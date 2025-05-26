import React, { useState } from 'react';
import { FiDollarSign, FiX } from 'react-icons/fi';

const CashModal = ({ isOpen, onClose, onConfirm, value, formatCurrency }) => {
    const [receivedValue, setReceivedValue] = useState('');
    const [change, setChange] = useState(0);

    if (!isOpen) return null;

    const calculateChange = (received) => {
        const receivedNum = parseFloat(received.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
        const changeValue = receivedNum - value;
        setChange(changeValue > 0 ? changeValue : 0);
    };

    const handleConfirm = () => {
        onConfirm({
            valor_recebido: parseFloat(receivedValue.replace(/[^\d,]/g, '').replace(',', '.')) || 0,
            troco: change
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-[#81059e] flex items-center">
                        <FiDollarSign className="mr-2" /> Pagamento em Dinheiro
                    </h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <FiX size={24} />
                    </button>
                </div>

                <div className="mb-4">
                    <p className="text-lg font-semibold text-gray-700">
                        Valor a pagar: {formatCurrency(value)}
                    </p>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Valor Recebido
                        </label>
                        <input
                            type="text"
                            value={receivedValue}
                            onChange={(e) => {
                                setReceivedValue(e.target.value);
                                calculateChange(e.target.value);
                            }}
                            className="w-full p-2 border border-gray-300 rounded-md"
                            placeholder={formatCurrency(0)}
                        />
                    </div>

                    {change > 0 && (
                        <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                            <p className="text-green-700 font-medium">
                                Troco: {formatCurrency(change)}
                            </p>
                        </div>
                    )}

                    {parseFloat(receivedValue.replace(/[^\d,]/g, '').replace(',', '.')) < value && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                            <p className="text-red-700 font-medium">
                                Valor insuficiente
                            </p>
                        </div>
                    )}
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                    <button
                        onClick={onClose}
                        className="text-[#81059e] hover:opacity-70"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="px-4 py-2 bg-[#81059e] text-white rounded-sm hover:bg-[#6f0486]"
                        disabled={!receivedValue || parseFloat(receivedValue.replace(/[^\d,]/g, '').replace(',', '.')) < value}
                    >
                        Confirmar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CashModal; 