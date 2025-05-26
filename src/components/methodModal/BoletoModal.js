import React, { useState } from 'react';
import { FiFileText, FiX } from 'react-icons/fi';

const BoletoModal = ({ isOpen, onClose, onConfirm, value, formatCurrency }) => {
    const [dueDate, setDueDate] = useState('');
    const [payerName, setPayerName] = useState('');
    const [payerDocument, setPayerDocument] = useState('');

    if (!isOpen) return null;

    const handleConfirm = () => {
        onConfirm({
            data_vencimento: dueDate,
            nome_pagador: payerName,
            documento_pagador: payerDocument
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-[#81059e] flex items-center">
                        <FiFileText className="mr-2" /> Pagamento com Boleto
                    </h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <FiX size={24} />
                    </button>
                </div>

                <div className="mb-4">
                    <p className="text-lg font-semibold text-gray-700">
                        Valor: {formatCurrency(value)}
                    </p>
                </div>

                <div className="space-y-4">
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
                            Nome do Pagador
                        </label>
                        <input
                            type="text"
                            value={payerName}
                            onChange={(e) => setPayerName(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md"
                            placeholder="Nome completo do pagador"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            CPF/CNPJ do Pagador
                        </label>
                        <input
                            type="text"
                            value={payerDocument}
                            onChange={(e) => setPayerDocument(e.target.value.replace(/\D/g, ''))}
                            className="w-full p-2 border border-gray-300 rounded-md"
                            placeholder="000.000.000-00 ou 00.000.000/0000-00"
                        />
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
                        disabled={!dueDate || !payerName || !payerDocument}
                    >
                        Gerar Boleto
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BoletoModal; 