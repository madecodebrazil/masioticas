// src/components/ClienteSelecao.js
import React, { useState } from 'react';
import { FiUser, FiSearch, FiPlus, FiX, FiUserPlus } from 'react-icons/fi';

const ClienteSelecao = ({
  searchTerm,
  setSearchTerm,
  filteredClients,
  selectedClient,
  setSelectedClient,
  handleSelectClient,
  showClientForm,
  setShowClientForm,
  fetchClients,
  selectedLoja,
  ClientForm
}) => {


  // Função para adicionar cliente rápido (apenas nome)
  const handleQuickAddClient = () => {
    if (!quickClientName.trim()) return;

    // Criar cliente temporário apenas com nome
    const tempClient = {
      id: `temp-${Date.now()}`, // ID temporário
      nome: quickClientName,
      isTemp: true, // Marcar como cliente temporário
      createdAt: new Date().toISOString()
    };

    handleSelectClient(tempClient);
    setQuickClientName('');
    setShowQuickAdd(false);
  };

  return (
    <div className="mb-8">
      <label className="block text-[#81059e] text-xl font-medium mb-1 flex items-center gap-1">
        <FiUser /> Cliente
      </label>
      <>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border-2 border-[#81059e] pl-10 p-2 rounded-sm w-full"
              placeholder="Buscar cliente por nome ou CPF"
            />
            {/* Lista de sugestões de clientes - Corrigida a verificação */}
            {searchTerm && filteredClients && filteredClients.length > 0 && (
              <div className="absolute z-10 mt-1 w-full bg-white border-2 border-[#81059e] rounded-sm max-h-20 overflow-y-auto shadow-lg">
                {filteredClients
                  .filter(client => {
                    const searchTermLower = searchTerm.toLowerCase();
                    return (
                      client.nome.toLowerCase().includes(searchTermLower) ||
                      (client.cpf && client.cpf.includes(searchTermLower)) ||
                      (client.telefone && client.telefone.includes(searchTermLower))
                    );
                  })
                  .map(client => (
                    <div
                      key={client.id}
                      className="px-3 py-2 hover:bg-purple-50 cursor-pointer border-b last:border-b-0 text-sm leading-tight"
                      onClick={() => handleSelectClient(client)}
                    >
                      <div className="font-semibold text-black">{client.nome}</div>
                      <div className="text-gray-500">
                        {client.cpf && <>CPF: {client.cpf} </>}
                        {client.telefone && <>• Tel: {client.telefone}</>}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => {
                if (searchTerm.trim()) {
                  const tempClient = {
                    id: `temp-${Date.now()}`,
                    nome: searchTerm.trim(),
                    isTemp: true,
                    createdAt: new Date().toISOString()
                  };
                  handleSelectClient(tempClient);
                  setSearchTerm('');
                }
              }}
              disabled={
                !searchTerm.trim() || filteredClients.some(c =>
                  c.nome.toLowerCase().trim() === searchTerm.toLowerCase().trim()
                )
              }
              className="bg-green-600 text-white p-2 rounded-sm flex items-center disabled:bg-purple-300"
              title={`Adicionar cliente '${searchTerm.trim()}'`}
            >
              <FiUserPlus />
            </button>
            <button
              onClick={() => setShowClientForm(true)}
              className="bg-[#81059e] text-white p-2 rounded-sm flex items-center"
              title="Adicionar novo cliente completo"
            >
              <FiPlus />
            </button>
          </div>
        </div>

        {/* Cliente selecionado */}
        {selectedClient && (
          <div className="mt-2 p-3 border-2 border-purple-100 rounded-sm bg-purple-50">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-[#81059e]">{selectedClient.nome}</h3>
                {selectedClient.isTemp && (
                  <p className="text-gray-400 text-sm">Cliente só apresentou o nome.</p>
                )}
                {selectedClient.cpf && <p className="text-gray-600 text-sm">CPF: {selectedClient.cpf}</p>}
                {selectedClient.telefone && <p className="text-gray-600 text-sm">Tel: {selectedClient.telefone}</p>}
              </div>
              <button
                onClick={() => setSelectedClient(null)}
                className="text-[#81059e] hover:text-[#6f0486]"
              >
                <FiX size={20} />
              </button>
            </div>
          </div>
        )}
      </>
    </div>
  );
};

export default ClienteSelecao;