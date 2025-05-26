"use client";

import React, { useState } from 'react';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { firestore } from '@/lib/firebaseConfig';
import { FiX, FiDollarSign, FiUnlock, FiUser, FiFileText } from 'react-icons/fi';
import { useAuth } from '@/hooks/useAuth';

const AberturaCaixaModal = ({ isOpen, onClose, onAbertura, loja }) => {
  const { userData } = useAuth();
  const [saldoInicial, setSaldoInicial] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  if (!isOpen) return null;
  
  const handleSaldoChange = (e) => {
    const valor = e.target.value.replace(/\D/g, '');
    setSaldoInicial(valor ? (Number(valor) / 100) : '');
  };
  
  const formatarValor = (valor) => {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!loja) {
      alert("Selecione uma loja antes de abrir o caixa!");
      return;
    }
    
    if (saldoInicial === '') {
      alert("Informe o saldo inicial do caixa!");
      return;
    }
    
    setIsLoading(true);
    
    try {
      const dataAtual = new Date();
      const dataFormatada = dataAtual.toISOString().split('T')[0];
      
      // Criar documento de abertura de caixa
      await setDoc(doc(firestore, `lojas/${loja}/financeiro/caixa/status`, dataFormatada), {
        aberto: true,
        saldoInicial: Number(saldoInicial),
        dataAbertura: Timestamp.now(),
        responsavelAbertura: userData?.nome || 'Usuário do sistema',
        observacoes: observacoes || 'Abertura normal de caixa'
      });
      
      // Atualizar saldo atual do caixa
      await setDoc(doc(firestore, `lojas/${loja}/financeiro`, 'caixa'), {
        saldoAtual: Number(saldoInicial),
        ultimaAtualizacao: Timestamp.now()
      }, { merge: true });
      
      // Limpar campos
      setSaldoInicial('');
      setObservacoes('');
      
      // Notificar componente pai
      onAbertura(Number(saldoInicial));
      
    } catch (error) {
      console.error("Erro ao abrir caixa:", error);
      alert("Erro ao abrir o caixa. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md relative text-black">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold" style={{ color: "#81059e" }}>
            <FiUnlock className="inline-block mr-2" /> Abertura de Caixa
          </h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <FiX size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="text-[#81059e] font-medium flex items-center gap-2">
                <FiDollarSign /> Saldo Inicial
              </label>
              <div className="relative">
                <span className="absolute left-3 top-3">R$</span>
                <input
                  type="text"
                  value={saldoInicial ? formatarValor(saldoInicial).replace('R$', '').trim() : ''}
                  onChange={handleSaldoChange}
                  className="border-2 border-[#81059e] p-3 pl-10 rounded-lg w-full text-black"
                  placeholder="0,00"
                  required
                />
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Informe o valor em dinheiro disponível no caixa no início do dia
              </p>
            </div>
            
            <div>
              <label className="text-[#81059e] font-medium flex items-center gap-2">
                <FiUser /> Responsável
              </label>
              <input
                type="text"
                value={userData?.nome || 'Usuário do sistema'}
                className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black bg-gray-100"
                readOnly
              />
            </div>
            
            <div>
              <label className="text-[#81059e] font-medium flex items-center gap-2">
                <FiFileText /> Observações (opcional)
              </label>
              <textarea
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black h-24"
                placeholder="Adicione observações sobre a abertura do caixa..."
              ></textarea>
            </div>
            
            <div className="p-4 bg-yellow-50 rounded-md border border-yellow-200 mt-4 mb-2">
              <p className="text-yellow-800 text-sm">
                <strong>Atenção!</strong> Ao abrir o caixa, você está confirmando que verificou o valor em dinheiro 
                disponível e que o montante inserido corresponde ao valor real em caixa.
              </p>
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
                type="submit"
                className="px-4 py-2 rounded-md text-white bg-green-500 hover:bg-green-600 flex items-center gap-2"
                disabled={isLoading}
              >
                {isLoading ? 'Processando...' : (
                  <>
                    <FiUnlock /> Abrir Caixa
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AberturaCaixaModal;