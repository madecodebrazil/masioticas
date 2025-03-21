// components/CaixasModal.js
import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, doc, deleteDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { firestore } from '@/lib/firebaseConfig';

const CaixasModal = ({ isOpen, onClose, selectedLoja, onCaixaUpdated }) => {
  const [caixas, setCaixas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [novoCaixa, setNovoCaixa] = useState({ nome: '', descricao: '' });
  const [isAddingCaixa, setIsAddingCaixa] = useState(false);
  const [editingCaixa, setEditingCaixa] = useState(null);

  useEffect(() => {
    if (isOpen && selectedLoja) {
      fetchCaixas();
    }
  }, [isOpen, selectedLoja]);

  const fetchCaixas = async () => {
    if (!selectedLoja) return;
    
    setLoading(true);
    try {
      const caixasCollection = collection(firestore, `lojas/${selectedLoja}/financeiro/controle_caixa/caixas`);
      const caixasSnapshot = await getDocs(caixasCollection);
      
      const caixasData = [];
      caixasSnapshot.forEach((doc) => {
        caixasData.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      setCaixas(caixasData);
    } catch (error) {
      console.error("Erro ao buscar caixas:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCaixa = async () => {
    if (!novoCaixa.nome.trim()) {
      alert("O nome do caixa é obrigatório!");
      return;
    }

    try {
      const caixasCollection = collection(firestore, `lojas/${selectedLoja}/financeiro/controle_caixa/caixas`);
      await addDoc(caixasCollection, {
        nome: novoCaixa.nome,
        descricao: novoCaixa.descricao,
        ativo: true,
        createdAt: Timestamp.now()
      });
      
      setNovoCaixa({ nome: '', descricao: '' });
      setIsAddingCaixa(false);
      fetchCaixas();
      if (onCaixaUpdated) onCaixaUpdated();
    } catch (error) {
      console.error("Erro ao adicionar caixa:", error);
      alert("Erro ao adicionar o caixa. Tente novamente.");
    }
  };

  const handleUpdateCaixa = async () => {
    if (!editingCaixa || !editingCaixa.nome.trim()) {
      alert("O nome do caixa é obrigatório!");
      return;
    }

    try {
      const caixaRef = doc(firestore, `lojas/${selectedLoja}/financeiro/controle_caixa/caixas`, editingCaixa.id);
      await updateDoc(caixaRef, {
        nome: editingCaixa.nome,
        descricao: editingCaixa.descricao,
        updatedAt: Timestamp.now()
      });
      
      setEditingCaixa(null);
      fetchCaixas();
      if (onCaixaUpdated) onCaixaUpdated();
    } catch (error) {
      console.error("Erro ao atualizar caixa:", error);
      alert("Erro ao atualizar o caixa. Tente novamente.");
    }
  };

  const handleToggleCaixaStatus = async (caixa) => {
    try {
      const caixaRef = doc(firestore, `lojas/${selectedLoja}/financeiro/controle_caixa/caixas`, caixa.id);
      await updateDoc(caixaRef, {
        ativo: !caixa.ativo,
        updatedAt: Timestamp.now()
      });
      
      fetchCaixas();
      if (onCaixaUpdated) onCaixaUpdated();
    } catch (error) {
      console.error("Erro ao atualizar status do caixa:", error);
      alert("Erro ao atualizar o status do caixa. Tente novamente.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="bg-[#81059e] text-white p-4 flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Gerenciar Caixas</h3>
          <button 
            onClick={onClose}
            className="text-gray-100 hover:text-gray-400"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Lista de Caixas */}
        {loading ? (
          <div className="text-center py-4">Carregando caixas...</div>
        ) : (
          <>
            <div className="mb-4">
              <button 
                onClick={() => setIsAddingCaixa(true)}
                className="bg-[#81059e] text-white px-4 py-2 rounded-md hover:bg-[#690480]"
              >
                Adicionar Novo Caixa
              </button>
            </div>

            {caixas.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                Nenhum caixa cadastrado. Adicione um novo caixa.
              </div>
            ) : (
              <div className="space-y-3">
                {caixas.map((caixa) => (
                  <div 
                    key={caixa.id} 
                    className={`border-2 rounded-md p-3 ${caixa.ativo ? 'border-[#81059e]' : 'border-gray-300 opacity-75'}`}
                  >
                    <div className="flex justify-between">
                      <div>
                        <h4 className="font-medium">{caixa.nome}</h4>
                        <p className="text-sm text-gray-600">{caixa.descricao}</p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setEditingCaixa(caixa)}
                          className="text-blue-500 hover:text-blue-700"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleToggleCaixaStatus(caixa)}
                          className={caixa.ativo ? "text-red-500 hover:text-red-700" : "text-[#81059e] hover:text-green-700"}
                          title={caixa.ativo ? "Desativar" : "Ativar"}
                        >
                          {caixa.ativo ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Formulário para Adicionar Novo Caixa */}
        {isAddingCaixa && (
          <div className="mt-4 border-t pt-4">
            <h4 className="font-medium mb-2">Adicionar Novo Caixa</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Caixa*</label>
                <input
                  type="text"
                  value={novoCaixa.nome}
                  onChange={(e) => setNovoCaixa({ ...novoCaixa, nome: e.target.value })}
                  className="w-full p-2 border rounded-md focus:ring-[#81059e] focus:border-[#81059e]"
                  placeholder="Ex: Caixa Principal"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <textarea
                  value={novoCaixa.descricao}
                  onChange={(e) => setNovoCaixa({ ...novoCaixa, descricao: e.target.value })}
                  className="w-full p-2 border rounded-md focus:ring-[#81059e] focus:border-[#81059e]"
                  placeholder="Descrição opcional"
                  rows="2"
                ></textarea>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setIsAddingCaixa(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAddCaixa}
                  className="px-4 py-2 bg-[#81059e] text-white rounded-md hover:bg-[#690480]"
                >
                  Adicionar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Formulário para Editar Caixa */}
        {editingCaixa && (
          <div className="mt-4 border-t pt-4">
            <h4 className="font-medium mb-2">Editar Caixa</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Caixa*</label>
                <input
                  type="text"
                  value={editingCaixa.nome}
                  onChange={(e) => setEditingCaixa({ ...editingCaixa, nome: e.target.value })}
                  className="w-full p-2 border rounded-md focus:ring-[#81059e] focus:border-[#81059e]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <textarea
                  value={editingCaixa.descricao}
                  onChange={(e) => setEditingCaixa({ ...editingCaixa, descricao: e.target.value })}
                  className="w-full p-2 border rounded-md focus:ring-[#81059e] focus:border-[#81059e]"
                  rows="2"
                ></textarea>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setEditingCaixa(null)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleUpdateCaixa}
                  className="px-4 py-2 bg-[#81059e] text-white rounded-md hover:bg-[#690480]"
                >
                  Salvar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CaixasModal;