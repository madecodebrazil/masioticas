import React, { useState } from 'react';
import { FiCalendar, FiX } from 'react-icons/fi';

const CrediarioModal = ({ isOpen, onClose, onConfirm, value, formatCurrency }) => {
    const [installments, setInstallments] = useState('2');
    const [dueDate, setDueDate] = useState(
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    );
    const [interestRate, setInterestRate] = useState('0');

    if (!isOpen) return null;

    const calculateInstallmentValue = () => {
        const totalValue = parseFloat(value);
        const numInstallments = parseInt(installments);
        const rate = parseFloat(interestRate) / 100;

        if (rate === 0) {
            return totalValue / numInstallments;
        }

        // Cálculo de juros simples
        const totalWithInterest = totalValue * (1 + rate);
        return totalWithInterest / numInstallments;
    };

    const handleConfirm = () => {
        onConfirm({
            parcelas: parseInt(installments),
            data_vencimento: dueDate,
            taxa_juros: parseFloat(interestRate),
            valor_parcela: calculateInstallmentValue()
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-[#81059e] flex items-center">
                        <FiCalendar className="mr-2" /> Pagamento com Crediário
                    </h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <FiX size={24} />
                    </button>
                </div>

                <div className="mb-4">
                    <p className="text-lg font-semibold text-gray-700">
                        Valor Total: {formatCurrency(value)}
                    </p>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Número de Parcelas
                        </label>
                        <select
                            value={installments}
                            onChange={(e) => setInstallments(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md"
                        >
                            {[2, 3, 4, 5, 6, 10, 12].map((num) => (
                                <option key={num} value={num}>{num}x</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Data de Vencimento
                        </label>
                        <input
                            type="date"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md"
                            min={new Date().toISOString().split('T')[0]}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Taxa de Juros (%)
                        </label>
                        <input
                            type="number"
                            value={interestRate}
                            onChange={(e) => setInterestRate(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md"
                            min="0"
                            step="0.01"
                        />
                    </div>

                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                        <p className="text-sm font-medium text-gray-700">
                            Valor da Parcela: {formatCurrency(calculateInstallmentValue())}
                        </p>
                        <p className="text-sm text-gray-600">
                            Total com Juros: {formatCurrency(calculateInstallmentValue() * parseInt(installments))}
                        </p>
                    </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                    <button
                        onClick={onClose}
                        className="text-[#81059e] hover:opacity-70 p-2"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="px-4 py-2 bg-[#81059e] text-white rounded-sm hover:bg-[#6f0486]"
                        disabled={!dueDate}
                    >
                        Confirmar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CrediarioModal;