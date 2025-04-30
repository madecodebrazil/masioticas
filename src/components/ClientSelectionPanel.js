// src/components/ClientSelectionPanel.js
import React from 'react';
import { FiSearch, FiUserPlus, FiX } from 'react-icons/fi';

const ClientSelectionPanel = ({
    selectedClient,
    setSelectedClient,
    searchTerm,
    setSearchTerm,
    searchResults,
    filteredClients,
    showSearchResults,
    setShowSearchResults,
    handleAddNewClient,
    handleSelectClient,
}) => {
    const handleSearch = (e) => {
        const term = e.target.value.toLowerCase();
        setSearchTerm(term);
        if (setShowSearchResults) {
            setShowSearchResults(term.length > 0);
        }
    };

    const handleClearClient = () => {
        setSelectedClient(null);
        setSearchTerm('');
    };

    return (
        <div className="mb-6">
            <div className="flex justify-between items-center mb-3">
                <label className="block text-[#81059e] font-medium">Cliente</label>
                <button
                    onClick={handleAddNewClient}
                    className="text-sm text-[#81059e] hover:text-[#6a0483] flex items-center"
                >
                    <FiUserPlus className="mr-1" />
                    Novo Cliente
                </button>
            </div>

            {selectedClient ? (
                <div className="p-3 border rounded-sm bg-purple-50">
                    <div className="flex justify-between items-center">
                        <div>
                            <div className="font-medium">{selectedClient.nome}</div>
                            <div className="text-sm text-gray-600">
                                {selectedClient.cpf && `CPF: ${selectedClient.cpf}`}
                                {selectedClient.telefone && ` | Tel: ${selectedClient.telefone}`}
                            </div>
                        </div>
                        <button
                            onClick={handleClearClient}
                            className="p-1 text-gray-500 hover:text-gray-700"
                        >
                            <FiX size={18} />
                        </button>
                    </div>
                </div>
            ) : (
                <div className="relative">
                    <div className="relative">
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={handleSearch}
                            placeholder="Buscar cliente..."
                            className="w-full p-2 pl-10 border rounded-sm"
                        />
                        <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        {searchTerm && (
                            <button
                                onClick={() => {
                                    setSearchTerm('');
                                    if (setShowSearchResults) {
                                        setShowSearchResults(false);
                                    }
                                }}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                <FiX />
                            </button>
                        )}
                    </div>

                    {/* Resultados da pesquisa */}
                    {filteredClients && filteredClients.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-gray-500 border rounded-sm shadow-lg max-h-60 overflow-y-auto">
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
                                        className="p-2 hover:bg-gray-100 cursor-pointer"
                                        onClick={() => handleSelectClient(client)}
                                    >
                                        <div className="font-medium">{client.nome}</div>
                                        <div className="text-sm text-gray-600">
                                            {client.cpf && `CPF: ${client.cpf}`}
                                            {client.telefone && ` | Tel: ${client.telefone}`}
                                        </div>
                                    </div>
                                ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ClientSelectionPanel;