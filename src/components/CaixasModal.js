// components/CaixasModal.js
import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, doc, deleteDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { firestore } from '@/lib/firebaseConfig';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faPen, faRotateLeft, faTrash, faX } from '@fortawesome/free-solid-svg-icons';

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


  // Renderiza o modal de edição como um modal sobreposto se estiver editando
  if (editingCaixa) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
        <div className="bg-white rounded-lg shadow-lg w-full max-w-md flex flex-col h-auto overflow-hidden">
          {/* Cabeçalho do Modal */}
          <div className="bg-[#81059e] text-white p-4 flex justify-between items-center">
            <h3 className="text-xl font-bold">Editar Caixa</h3>
            <FontAwesomeIcon
              icon={faX}
              className="h-5 w-5 text-white cursor-pointer hover:text-gray-200"
              onClick={() => setEditingCaixa(null)}
            />
          </div>

          <div className="p-4 space-y-3">
            <div>
              <label className="text-[#81059e] font-medium">Nome do Caixa*</label>
              <input
                type="text"
                value={editingCaixa.nome}
                onChange={(e) => setEditingCaixa({ ...editingCaixa, nome: e.target.value })}
                className="w-full border-2 border-[#81059e] rounded-sm p-2 text-black"
                required
              />
            </div>
            <div>
              <label className="text-[#81059e] font-medium">Descrição</label>
              <textarea
                value={editingCaixa.descricao || ''}
                onChange={(e) => setEditingCaixa({ ...editingCaixa, descricao: e.target.value })}
                className="w-full border-2 border-[#81059e] rounded-sm p-2 text-black"
                rows="3"
                placeholder="Descrição opcional"
              ></textarea>
            </div>
          </div>

          {/* Botões do Modal */}
          <div className="p-4 bg-gray-50 border-t flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setEditingCaixa(null)}
              className="text-gray-500 px-4 py-2 rounded-md"
            >
              Cancelar
            </button>
            <button
              onClick={handleUpdateCaixa}
              className="bg-[#81059e] text-white px-4 py-2 rounded-sm hover:bg-[#690480]"
            >
              Salvar
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isAddingCaixa) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
        <div className="bg-white rounded-lg shadow-lg w-full max-w-md flex flex-col h-auto overflow-hidden">
          {/* Cabeçalho do Modal */}
          <div className="bg-[#81059e] text-white p-4 flex justify-between items-center">
            <h3 className="text-xl font-bold">Adicionar Novo Caixa</h3>
            <FontAwesomeIcon
              icon={faX}
              className="h-5 w-5 text-white cursor-pointer hover:text-gray-200"
              onClick={() => setIsAddingCaixa(false)}
            />
          </div>

          <div className="p-4 space-y-3">
            <div>
              <label className="text-[#81059e] font-medium">Nome do Caixa*</label>
              <input
                type="text"
                value={novoCaixa.nome}
                onChange={(e) => setNovoCaixa({ ...novoCaixa, nome: e.target.value })}
                className="w-full border-2 border-[#81059e] rounded-sm p-2 text-black"
                placeholder="Ex: Caixa Principal"
                required
              />
            </div>
            <div>
              <label className="text-[#81059e] font-medium">Descrição</label>
              <textarea
                value={novoCaixa.descricao}
                onChange={(e) => setNovoCaixa({ ...novoCaixa, descricao: e.target.value })}
                className="w-full border-2 border-[#81059e] rounded-sm p-2 text-black"
                placeholder="Descrição opcional"
                rows="3"
              ></textarea>
            </div>
          </div>

          {/* Botões do Modal */}
          <div className="p-4 bg-gray-50 border-t flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsAddingCaixa(false)}
              className="text-gray-500 px-4 py-2 rounded-md"
            >
              Cancelar
            </button>
            <button
              onClick={handleAddCaixa}
              className="bg-[#81059e] text-white px-4 py-2 rounded-sm hover:bg-[#690480]"
            >
              Adicionar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md flex flex-col h-auto overflow-hidden">
        {/* Cabeçalho do Modal */}
        <div className="bg-[#81059e] text-white p-4 flex justify-between items-center">
          <h3 className="text-xl font-bold">Gerenciar Caixas</h3>
          <FontAwesomeIcon
            icon={faX}
            className="h-5 w-5 text-white cursor-pointer hover:text-gray-200"
            onClick={onClose}
          />
        </div>

        <div className="space-y-4 flex-grow overflow-y-auto p-4">
          {loading ? (
            <div className="text-center py-4">Carregando caixas...</div>
          ) : (
            <>
              <button
                onClick={() => setIsAddingCaixa(true)}
                className="bg-[#81059e] text-white px-4 py-2 rounded-md hover:bg-[#690480]"
              >
                Adicionar Novo Caixa
              </button>

              {caixas.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  Nenhum caixa cadastrado. Adicione um novo caixa.
                </div>
              ) : (
                <div className="space-y-3 mt-4">
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
                          >
                            <FontAwesomeIcon
                              icon={faPen}
                              className="h-5 w-5 text-[#81059e] cursor-pointer hover:text-purple-300"

                            />
                          </button>
                          <button
                            onClick={() => handleToggleCaixaStatus(caixa)}
                            className={caixa.ativo ? "text-red-500 hover:text-red-700" : "text-[#81059e] hover:text-green-700"}
                            title={caixa.ativo ? "Desativar" : "Ativar"}
                          >
                            {caixa.ativo ? (
                              <FontAwesomeIcon
                              icon={faTrash}
                              className="h-5 w-5 text-[#81059e] cursor-pointer hover:text-purple-300"

                            />
                            ) : (
                              <FontAwesomeIcon
                                icon={faRotateLeft}
                                className="h-5 w-5 text-green-400 cursor-pointer hover:text-purple-300"

                              />
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
        </div>
      </div>
    </div>
  );
};

export default CaixasModal;