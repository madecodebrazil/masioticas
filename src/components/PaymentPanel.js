import React from 'react';
import { FiDollarSign, FiCreditCard, FiPieChart } from 'react-icons/fi';

const PaymentPanel = ({
    total,
    paymentMethod,
    setPaymentMethod,
    discount,
    setDiscount,
    handleFinalizeSale
}) => {
    const paymentMethods = [
        { id: 'dinheiro', label: 'Dinheiro', icon: <FiDollarSign /> },
        { id: 'cartao', label: 'Cartão', icon: <FiCreditCard /> },
        { id: 'pix', label: 'PIX', icon: <FiPieChart /> }
    ];

    // Função de formatação de moeda
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    return (
        <div className="bg-white p-4 rounded-sm shadow-sm">
            <h3 className="text-lg font-medium text-[#81059e] mb-4">Pagamento</h3>

            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Forma de Pagamento
                </label>
                <div className="grid grid-cols-3 gap-2">
                    {paymentMethods.map(method => (
                        <button
                            key={method.id}
                            onClick={() => setPaymentMethod(method.id)}
                            className={`flex items-center justify-center p-2 border rounded-sm ${paymentMethod === method.id
                                    ? 'border-[#81059e] bg-[#81059e] text-white'
                                    : 'border-gray-300 hover:border-[#81059e]'
                                }`}
                        >
                            <span className="mr-2">{method.icon}</span>
                            {method.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Desconto (R$)
                </label>
                <input
                    type="number"
                    value={discount}
                    onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 border rounded-sm"
                    min="0"
                    step="0.01"
                />
            </div>

            <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">Subtotal:</span>
                    <span>{formatCurrency(total)}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">Desconto:</span>
                    <span>- {formatCurrency(discount)}</span>
                </div>
                <div className="flex justify-between items-center text-lg font-bold">
                    <span>Total:</span>
                    <span>{formatCurrency(total - discount)}</span>
                </div>
            </div>

            <button
                onClick={handleFinalizeSale}
                className="w-full mt-4 bg-[#81059e] text-white py-2 px-4 rounded-sm hover:bg-[#6a0483] transition-colors"
            >
                Finalizar Venda
            </button>
        </div>
    );
};

export default PaymentPanel;