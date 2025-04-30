import React, { useState } from 'react';
import { FiX } from 'react-icons/fi';
import { FaBitcoin, FaEthereum } from 'react-icons/fa';

const CryptoModal = ({ isOpen, onClose, onConfirm, value, formatCurrency }) => {
    const [selectedCrypto, setSelectedCrypto] = useState('bitcoin');
    const [walletAddress, setWalletAddress] = useState('');

    if (!isOpen) return null;

    const getExchangeRate = () => {
        // Taxas de câmbio fictícias
        return selectedCrypto === 'bitcoin' ? 217391.30 : 11904.76;
    };

    const calculateCryptoAmount = () => {
        const rate = getExchangeRate();
        return value / rate;
    };

    const handleConfirm = () => {
        onConfirm({
            moeda: selectedCrypto,
            endereco: walletAddress,
            valor_cripto: calculateCryptoAmount(),
            taxa_cambio: getExchangeRate()
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-[#81059e] flex items-center">
                        {selectedCrypto === 'bitcoin' ? (
                            <FaBitcoin className="mr-2 text-amber-500" />
                        ) : (
                            <FaEthereum className="mr-2 text-blue-500" />
                        )}
                        Pagamento com {selectedCrypto === 'bitcoin' ? 'Bitcoin' : 'Ethereum'}
                    </h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <FiX size={24} />
                    </button>
                </div>

                <div className="mb-4">
                    <p className="text-lg font-semibold text-gray-700">
                        Valor em Reais: {formatCurrency(value)}
                    </p>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Selecione a Criptomoeda
                        </label>
                        <div className="flex space-x-2">
                            <button
                                type="button"
                                onClick={() => setSelectedCrypto('bitcoin')}
                                className={`p-2 border rounded-md flex items-center justify-center flex-1 ${selectedCrypto === 'bitcoin'
                                        ? 'bg-amber-500 text-white border-amber-500'
                                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                    }`}
                            >
                                <FaBitcoin className="mr-1" /> Bitcoin
                            </button>

                            <button
                                type="button"
                                onClick={() => setSelectedCrypto('ethereum')}
                                className={`p-2 border rounded-md flex items-center justify-center flex-1 ${selectedCrypto === 'ethereum'
                                        ? 'bg-blue-500 text-white border-blue-500'
                                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                    }`}
                            >
                                <FaEthereum className="mr-1" /> Ethereum
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Endereço da Carteira
                        </label>
                        <input
                            type="text"
                            value={walletAddress}
                            onChange={(e) => setWalletAddress(e.target.value)}
                            placeholder={`Endereço de ${selectedCrypto === 'bitcoin' ? 'Bitcoin' : 'Ethereum'}`}
                            className="w-full p-2 border border-gray-300 rounded-md font-mono"
                        />
                    </div>

                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                        <p className="text-sm font-medium text-gray-700">
                            Valor em {selectedCrypto === 'bitcoin' ? 'BTC' : 'ETH'}:{' '}
                            {calculateCryptoAmount().toFixed(8)}
                        </p>
                        <p className="text-sm text-gray-600">
                            Taxa de câmbio: 1 {selectedCrypto === 'bitcoin' ? 'BTC' : 'ETH'} ={' '}
                            {formatCurrency(getExchangeRate())}
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
                        disabled={!walletAddress}
                    >
                        Confirmar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CryptoModal; 