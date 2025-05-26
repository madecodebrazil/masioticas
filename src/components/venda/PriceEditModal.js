import React, { useState, useEffect, useRef } from 'react';
import { FiX } from 'react-icons/fi';

const PriceEditModal = ({ product, onSave, onClose }) => {
  const [priceValue, setPriceValue] = useState(product ? (product.valor || product.preco || 0) : 0);
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, []);

  const handlePriceChange = (e) => {
    const onlyNumbers = e.target.value.replace(/\D/g, '');
    const parsedValue = onlyNumbers ? Number(onlyNumbers) / 100 : 0;
    setPriceValue(parsedValue);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex justify-between items-center p-4 border-b bg-[#81059e]">
          <h3 className="text-xl font-bold text-white">Editar Preço</h3>
          <button onClick={onClose} className="text-white">
            <FiX size={24} />
          </button>
        </div>
        
        <div className="p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Produto: <span className="font-bold">{product?.nome || product?.titulo || "Produto"}</span>
            </label>
            <input
              ref={inputRef}
              type="text"
              inputMode="numeric"
              value={priceValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              onChange={handlePriceChange}
              className="border-2 border-[#81059e] p-3 rounded-md w-full text-lg"
              placeholder="Valor em R$"
            />
            <p className="mt-2 text-sm text-gray-500">
              Preço original: {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              }).format(product ? (product.valor_original || product.valor || product.preco || 0) : 0)}
            </p>
          </div>
          
          <div className="flex justify-end space-x-3">
            <button onClick={onClose} className="px-4 py-2 hover:bg-gray-50 text-[#81059e]">
              Cancelar
            </button>
            <button
              onClick={() => onSave(priceValue)}
              className="px-4 py-2 bg-[#81059e] hover:bg-[#6a0484] text-white rounded-sm"
            >
              Salvar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PriceEditModal;