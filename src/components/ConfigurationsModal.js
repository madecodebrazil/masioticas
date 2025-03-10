"use client";
import React, { useState, useEffect } from 'react';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { firestore } from '@/lib/firebaseConfig';
import { FiSettings, FiX, FiSave, FiClock, FiAlertCircle } from 'react-icons/fi';
import { useAuth } from '@/hooks/useAuth';
const ConfiguracoesModal = ({ isOpen, onClose, configuracoes, onSave }) => {
  const { userPermissions } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState({
    abertura: '08:00',
    fechamento: '18:00',
    aberturaSabado: '08:00',
    fechamentoSabado: '13:00',
    domingoFechado: true
  });

  useEffect(() => {
    // Verificar se o usuário é administrador
    setIsAdmin(userPermissions?.isAdmin || false);

    // Carregar configurações existentes
    if (configuracoes) {
      setConfig({
        abertura: configuracoes.abertura || '08:00',
        fechamento: configuracoes.fechamento || '18:00',
        aberturaSabado: configuracoes.aberturaSabado || '08:00',
        fechamentoSabado: configuracoes.fechamentoSabado || '13:00',
        domingoFechado: configuracoes.domingoFechado !== undefined ? configuracoes.domingoFechado : true
      });
    }
  }, [configuracoes, userPermissions]);

  const handleSalvar = async () => {
    if (!isAdmin) {
      alert("Apenas administradores podem alterar as configurações do sistema.");
      return;
    }

    setIsLoading(true);

    try {
      // Salvar configurações no Firestore
      await setDoc(doc(firestore, 'configuracoes', 'horarios'), config);

      // Notificar o componente pai
      onSave(config);

      alert("Configurações salvas com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar configurações:", error);
      alert("Erro ao salvar configurações. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setConfig(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-lg relative text-black">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold" style={{ color: "#81059e" }}>
          <FiSettings className="inline-block mr-2" /> Configurações do Sistema
          </h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <FiX size={24} />
          </button>
        </div>
        
        <div className="overflow-y-auto max-h-[70vh]">
          <div className="space-y-6">
            {/* Horários durante a semana */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-[#81059e] mb-3">Horário de Funcionamento (Seg-Sex)</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Horário de Abertura</label>
                  <input
                    type="time"
                    name="abertura"
                    value={config.abertura}
                    onChange={handleInputChange}
                    className="border border-gray-300 p-2 rounded w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Horário de Fechamento</label>
                  <input
                    type="time"
                    name="fechamento"
                    value={config.fechamento}
                    onChange={handleInputChange}
                    className="border border-gray-300 p-2 rounded w-full"
                  />
                </div>
              </div>
            </div>
            
            {/* Horários aos sábados */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-[#81059e] mb-3">Horário de Funcionamento (Sábados)</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Horário de Abertura</label>
                  <input
                    type="time"
                    name="aberturaSabado"
                    value={config.aberturaSabado}
                    onChange={handleInputChange}
                    className="border border-gray-300 p-2 rounded w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Horário de Fechamento</label>
                  <input
                    type="time"
                    name="fechamentoSabado"
                    value={config.fechamentoSabado}
                    onChange={handleInputChange}
                    className="border border-gray-300 p-2 rounded w-full"
                  />
                </div>
              </div>
            </div>
            
            {/* Opção para domingo */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="domingoFechado"
                  name="domingoFechado"
                  checked={config.domingoFechado}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-[#81059e] border-gray-300 rounded"
                />
                <label htmlFor="domingoFechado" className="ml-2 text-gray-700">
                  Loja não funciona aos domingos
                </label>
              </div>
            </div>
            
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <div className="flex">
                <div className="flex-shrink-0">
                  <FiAlertCircle className="h-5 w-5 text-yellow-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Observação importante
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>
                      As configurações de horário afetam a permissão para abertura de caixa.
                      Fora dos horários configurados, não será possível abrir o caixa.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
            disabled={isLoading}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSalvar}
            className="px-4 py-2 rounded-md text-white bg-[#81059e] hover:bg-[#690480] flex items-center gap-2"
            disabled={isLoading || !isAdmin}
          >
            {isLoading ? 'Salvando...' : (
              <>
                <FiSave /> Salvar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfiguracoesModal;