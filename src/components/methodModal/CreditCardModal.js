import React, { useState } from 'react';
import { FiCreditCard, FiX } from 'react-icons/fi';

const CreditCardModal = ({ isOpen, onClose, onConfirm, value, formatCurrency }) => {
    const [cardNumber, setCardNumber] = useState('');
    const [cardName, setCardName] = useState('');
    const [expiryDate, setExpiryDate] = useState('');
    const [cvv, setCvv] = useState('');
    const [parcelas, setParcelas] = useState('1');

    if (!isOpen) return null;

    const handleConfirm = () => {
        const lastDigits = cardNumber.slice(-4);
        const bandeira = getCardBrand(cardNumber);

        onConfirm({
            ultimos_digitos: lastDigits,
            bandeira,
            parcelas: parseInt(parcelas)
        });
    };

    const getCardBrand = (number) => {
        // Lógica simplificada para identificar bandeira
        if (/^4/.test(number)) return 'Visa';
        if (/^5[1-5]/.test(number)) return 'Mastercard';
        if (/^3[47]/.test(number)) return 'American Express';
        return 'Outra';
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-[#81059e] flex items-center">
                        <FiCreditCard className="mr-2" /> Pagamento com Cartão
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
                            Número do Cartão
                        </label>
                        <input
                            type="text"
                            value={cardNumber}
                            onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, '').slice(0, 16))}
                            className="w-full p-2 border border-gray-300 rounded-md"
                            placeholder="0000 0000 0000 0000"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nome no Cartão
                        </label>
                        <input
                            type="text"
                            value={cardName}
                            onChange={(e) => setCardName(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md"
                            placeholder="Nome como está no cartão"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Validade
                            </label>
                            <input
                                type="text"
                                value={expiryDate}
                                onChange={(e) => setExpiryDate(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                className="w-full p-2 border border-gray-300 rounded-md"
                                placeholder="MM/AA"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                CVV
                            </label>
                            <input
                                type="text"
                                value={cvv}
                                onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                className="w-full p-2 border border-gray-300 rounded-md"
                                placeholder="123"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Parcelas
                        </label>
                        <select
                            value={parcelas}
                            onChange={(e) => setParcelas(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md"
                        >
                            {[1, 2, 3, 4, 5, 6, 10, 12].map((num) => (
                                <option key={num} value={num}>
                                    {num}x de {formatCurrency(value / num)}
                                </option>
                            ))}
                        </select>
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
                        disabled={!cardNumber || !cardName || !expiryDate || !cvv}
                    >
                        Confirmar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreditCardModal; 