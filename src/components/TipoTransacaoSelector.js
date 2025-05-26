import React from 'react';
import { FiShoppingCart, FiFileText } from 'react-icons/fi';

const TipoTransacaoSelector = ({ tipoSelecionado, setTipoSelecionado }) => {
    return (
        <div className="mb-4">
            <label className="block text-[#81059e] font-medium mb-2">Tipo de Transação</label>
            <div className="flex space-x-2">
                <button
                    type="button"
                    onClick={() => setTipoSelecionado('venda')}
                    className={`flex items-center px-4 py-2 rounded-sm ${tipoSelecionado === 'venda'
                            ? 'bg-[#81059e] text-white'
                            : 'bg-white text-gray-700 border border-gray-300'
                        }`}
                >
                    <FiShoppingCart className="mr-2" /> Venda
                </button>
                <button
                    type="button"
                    onClick={() => setTipoSelecionado('orcamento')}
                    className={`flex items-center px-4 py-2 rounded-sm ${tipoSelecionado === 'orcamento'
                            ? 'bg-[#81059e] text-white'
                            : 'bg-white text-gray-700 border border-gray-300'
                        }`}
                >
                    <FiFileText className="mr-2" /> Orçamento
                </button>
            </div>
        </div>
    );
};

export default TipoTransacaoSelector; 