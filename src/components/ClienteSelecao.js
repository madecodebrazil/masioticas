// src/components/ClienteSelecao.js
import React from 'react';
import { FiUser, FiSearch, FiPlus, FiX } from 'react-icons/fi';

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
  return (
    <div className="mb-8">
      <label className="block text-[#81059e] text-xl font-medium mb-1 flex items-center gap-1">
        <FiUser /> Cliente
      </label>

      {showClientForm ? (
        <div className="border-2 border-[#81059e] rounded-sm p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium text-[#81059e]">Adicionar Novo Cliente</h3>
            <button
              onClick={() => setShowClientForm(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <FiX size={20} />
            </button>
          </div>
          <ClientForm
            selectedLoja={selectedLoja}
            onSuccessRedirect={() => {
              setShowClientForm(false);
              fetchClients(); // Atualizar a lista após adicionar
            }}
          />
        </div>
      ) : (
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
              {/* Lista de sugestões de clientes */}
              {filteredClients && filteredClients.length > 0 && (
                <div className="absolute z-10 mt-1 w-full bg-white border-2 border-[#81059e] rounded-lg max-h-60 overflow-y-auto shadow-lg">
                  {filteredClients.map(client => (
                    <div
                      key={client.id}
                      className="p-2 hover:bg-purple-50 cursor-pointer border-b last:border-b-0"
                      onClick={() => handleSelectClient(client)}
                    >
                      <div className="font-medium">{client.nome}</div>
                      {client.cpf && <div className="text-sm text-gray-600">CPF: {client.cpf}</div>}
                      {client.telefone && <div className="text-sm text-gray-600">Tel: {client.telefone}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() => setShowClientForm(true)}
              className="bg-[#81059e] text-white p-2 rounded-sm flex items-center"
              title="Adicionar novo cliente"
            >
              <FiPlus />
            </button>
          </div>

          {/* Cliente selecionado */}
          {selectedClient && (
            <div className="mt-2 p-3 border-2 border-purple-100 rounded-sm bg-purple-50">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-[#81059e]">{selectedClient.nome}</h3>
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
      )}
    </div>
  );
};

export default ClienteSelecao;