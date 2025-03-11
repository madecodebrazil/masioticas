// app/configuracoes/page.js
"use client";
import React, { useState } from 'react';
import { FiSettings, FiHome, FiDollarSign, FiPackage, FiUsers } from 'react-icons/fi';
import ConfiguracoesModal from '@/components/ConfiguracoesModal'; // Seu componente atual
import { useAuth } from '@/hooks/useAuth';

export default function Configuracoes() {
  const { userPermissions } = useAuth();
  const [abaAtiva, setAbaAtiva] = useState('geral');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Menu de abas simplificado
  const abas = [
    { id: 'geral', nome: 'Geral', icon: <FiHome size={20} /> },
    { id: 'financeiro', nome: 'Financeiro', icon: <FiDollarSign size={20} /> },
    { id: 'estoque', nome: 'Estoque', icon: <FiPackage size={20} /> },
    // Apenas para admins
    ...(userPermissions?.isAdmin ? [
      { id: 'usuarios', nome: 'Usuários', icon: <FiUsers size={20} /> }
    ] : [])
  ];

  // Conteúdo da aba atual
  const renderConteudo = () => {
    switch (abaAtiva) {
      case 'geral':
        return (
          <div className="p-4">
            <h2 className="text-xl font-semibold mb-4">Configurações Gerais</h2>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-[#81059e] text-white rounded-md"
            >
              Configurar Horários
            </button>
          </div>
        );
        
      case 'financeiro':
        return (
          <div className="p-4">
            <h2 className="text-xl font-semibold mb-4">Configurações Financeiras</h2>
            <p>Configurações de finanças aparecem aqui.</p>
          </div>
        );
        
      // Outras abas...
        
      default:
        return <div>Selecione uma opção</div>;
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6 text-[#81059e]">
        <FiSettings className="inline mr-2" /> Configurações
      </h1>
      
      <div className="flex flex-col md:flex-row gap-4">
        {/* Menu lateral simplificado */}
        <div className="w-full md:w-64 bg-white rounded-lg shadow-sm">
          <ul className="divide-y">
            {abas.map((aba) => (
              <li key={aba.id}>
                <button
                  onClick={() => setAbaAtiva(aba.id)}
                  className={`w-full text-left p-3 flex items-center
                    ${abaAtiva === aba.id ? 'bg-[#f3e6f7] text-[#81059e]' : 'text-gray-700 hover:bg-gray-50'}`}
                >
                  <span className="mr-3">{aba.icon}</span>
                  {aba.nome}
                </button>
              </li>
            ))}
          </ul>
        </div>
        
        {/* Área de conteúdo */}
        <div className="flex-1 bg-white rounded-lg shadow-sm">
          {renderConteudo()}
        </div>
      </div>
      
      {/* Seu modal existente */}
      <ConfiguracoesModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        configuracoes={{}} // Passe as configurações atuais
        onSave={(config) => {
          console.log('Configurações salvas:', config);
          setIsModalOpen(false);
        }}
      />
    </div>
  );
}