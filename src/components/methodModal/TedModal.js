import React, { useState } from 'react';
import { FiActivity, FiX } from 'react-icons/fi';

const TedModal = ({ isOpen, onClose, onConfirm, value, formatCurrency }) => {
    const [bankName, setBankName] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [agency, setAgency] = useState('');
    const [accountHolder, setAccountHolder] = useState('');
    const [cpfCnpj, setCpfCnpj] = useState('');

    if (!isOpen) return null;

    const handleConfirm = () => {
        onConfirm({
            banco: bankName,
            conta: accountNumber,
            agencia: agency,
            titular: accountHolder,
            cpf_cnpj: cpfCnpj
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-[#81059e] flex items-center">
                        <FiActivity className="mr-2" /> Pagamento via TEV
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
                            Nome do Banco
                        </label>
                        <input
                            type="text"
                            value={bankName}
                            onChange={(e) => setBankName(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md"
                            placeholder="Ex: Banco do Brasil"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Agência
                            </label>
                            <input
                                type="text"
                                value={agency}
                                onChange={(e) => setAgency(e.target.value.replace(/\D/g, ''))}
                                className="w-full p-2 border border-gray-300 rounded-md"
                                placeholder="0000"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Conta
                            </label>
                            <input
                                type="text"
                                value={accountNumber}
                                onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                                className="w-full p-2 border border-gray-300 rounded-md"
                                placeholder="00000-0"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nome do Titular
                        </label>
                        <input
                            type="text"
                            value={accountHolder}
                            onChange={(e) => setAccountHolder(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md"
                            placeholder="Nome completo do titular"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            CPF/CNPJ do Titular
                        </label>
                        <input
                            type="text"
                            value={cpfCnpj}
                            onChange={(e) => setCpfCnpj(e.target.value.replace(/\D/g, ''))}
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
                        disabled={!bankName || !accountNumber || !agency || !accountHolder || !cpfCnpj}
                    >
                        Confirmar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TedModal; 