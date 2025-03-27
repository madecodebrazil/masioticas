import React, { useState } from 'react';
import { FiPlus, FiChevronDown } from 'react-icons/fi';

/**
 * SelectWithAddOption - Componente de select que permite adicionar novas opções diretamente
 * 
 * @param {Object} props
 * @param {string} props.label - Rótulo do campo
 * @param {Array} props.options - Array de opções para o select
 * @param {string} props.value - Valor selecionado
 * @param {Function} props.onChange - Função chamada quando o valor mudar
 * @param {string} props.collectionName - Nome da coleção no Firebase (opcional)
 * @param {Function} props.addNewOption - Função para adicionar nova opção
 * @param {string} props.placeholder - Placeholder para o campo de input (opcional)
 * @param {boolean} props.required - Se o campo é obrigatório (opcional)
 */
const SelectWithAddOption = ({ 
  label, 
  options, 
  value, 
  onChange, 
  collectionName, 
  addNewOption,
  placeholder,
  required = false 
}) => {
  const [showAddInput, setShowAddInput] = useState(false);
  const [newItemValue, setNewItemValue] = useState("");

  const handleAddItem = async () => {
    if (!newItemValue.trim()) return;
    
    try {
      await addNewOption(newItemValue);
      setNewItemValue("");
      setShowAddInput(false);
    } catch (error) {
      console.error("Erro ao adicionar novo item:", error);
    }
  };

  // Tratar tecla Enter para adicionar o item
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddItem();
    }
  };

  return (
    <div className="space-y-2 relative">
      <label className="text-lg font-semibold text-[#81059e]">{label}:</label>
      
      {!showAddInput ? (
        <div className="relative">
          <select
            value={value || ""}
            onChange={(e) => {
              if (e.target.value === "add_new") {
                setShowAddInput(true);
              } else {
                onChange(e.target.value);
              }
            }}
            className="bg-gray-100 w-full px-4 py-3 border-2 border-[#81059e] rounded-lg text-black focus:outline-none focus:border-[#81059e] focus:ring-1 focus:ring-[#81059e]"
            required={required}
          >
            <option value="">{placeholder || `Selecione ${label.toLowerCase()}`}</option>
            {options && options.map((option) => (
              <option key={option} value={option}>
                {option ? (typeof option === 'string' ? option.toUpperCase() : option) : ""}
              </option>
            ))}
            <option value="add_new">+ ADICIONAR NOVO</option>
          </select>
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
            <FiChevronDown className="text-[#81059e]" />
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newItemValue}
            onChange={(e) => setNewItemValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="bg-gray-100 w-full px-4 py-3 border-2 border-[#81059e] rounded-lg text-black focus:outline-none focus:border-[#81059e] focus:ring-1 focus:ring-[#81059e]"
            placeholder={`Adicionar novo ${label.toLowerCase()}`}
            autoFocus
          />
          <button
            type="button"
            onClick={handleAddItem}
            className="bg-[#81059e] text-white p-3 rounded-lg hover:bg-[#6a0485] transition-colors"
          >
            <FiPlus />
          </button>
          <button
            type="button"
            onClick={() => setShowAddInput(false)}
            className="border-2 border-[#81059e] text-[#81059e] p-3 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Cancelar
          </button>
        </div>
      )}
    </div>
  );
};

export default SelectWithAddOption;