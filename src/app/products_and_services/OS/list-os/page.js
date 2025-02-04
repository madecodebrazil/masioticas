"use client";
import React, { useState, useEffect } from "react";
import { getFirestore, collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { firestore } from "../../../../lib/firebaseConfig";
import Layout from "@/components/Layout"; // Supondo que você tenha um componente Layout

export default function ListOSPage() {
  const [osList, setOsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOS, setSelectedOS] = useState(null); // Estado para armazenar a OS selecionada
  const [modalOpen, setModalOpen] = useState(false); // Estado para controlar a abertura do modal
  const [isEditing, setIsEditing] = useState(false); // Estado para controlar modo de edição
  const [formData, setFormData] = useState({}); // Estado para armazenar dados do formulário

  useEffect(() => {
    const fetchOS = async () => {
      setLoading(true);
      try {
        const loja1Snapshot = await getDocs(collection(firestore, "loja1", "services", "os"));
        const loja2Snapshot = await getDocs(collection(firestore, "loja2", "services", "os"));

        const osData = [
          ...loja1Snapshot.docs.map((doc) => ({ id: doc.id, loja: "Loja 1", ...doc.data() })),
          ...loja2Snapshot.docs.map((doc) => ({ id: doc.id, loja: "Loja 2", ...doc.data() })),
        ];

        setOsList(osData);
      } catch (error) {
        console.error("Erro ao buscar OS:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOS();
  }, []);

  const openModal = (os) => {
    setSelectedOS(os);
    setFormData(os); // Inicializa os campos com os dados da OS
    setIsEditing(false); // Define como não editável no início
    setModalOpen(true);
  };

  const closeModal = () => {
    setSelectedOS(null);
    setModalOpen(false);
  };

  const handlePrint = () => {
    if (selectedOS) {
      window.print();
    }
  };

  const handleDownloadPDF = async () => {
    if (selectedOS?.pdfUrl) {
      const link = document.createElement("a");
      link.href = selectedOS.pdfUrl;
      link.download = `OS_${selectedOS.id}.pdf`;
      link.click();
    }
  };

  const handleStatusUpdate = async () => {
    if (selectedOS && formData.status !== selectedOS.status) {
      try {
        const docRef = doc(firestore, selectedOS.loja.toLowerCase(), "services", "os", selectedOS.id);
        await updateDoc(docRef, {
          ...formData,
          oldStatus: selectedOS.status,
          statusModified: new Date().toISOString(), // Salva o timestamp da modificação
        });

        alert("Status atualizado com sucesso!");
        closeModal();
        setOsList((prevList) =>
          prevList.map((os) =>
            os.id === selectedOS.id ? { ...os, ...formData, oldStatus: selectedOS.status } : os
          )
        );
      } catch (error) {
        console.error("Erro ao atualizar o status:", error);
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  if (loading) {
    return <div>Carregando Ordens de Serviço...</div>;
  }

  return (
    <Layout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4" style={{ color: "#932A83" }}>
          Minhas Ordens de Serviço
        </h1>

        {/* Tornando a tabela responsiva no mobile */}
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-300 rounded-lg shadow-md">
            <thead className="bg-[#932A83] text-white">
              <tr>
                <th className="py-2 px-4">Loja</th>
                <th className="py-2 px-4">Cliente</th>
                <th className="py-2 px-4">Referência</th>
                <th className="py-2 px-4">Status</th>
                <th className="py-2 px-4">Data Montagem Inicial</th>
                <th className="py-2 px-4">Data Montagem Final</th>
              </tr>
            </thead>
            <tbody className="text-black">
              {osList.length > 0 ? (
                osList.map((os) => (
                  <tr
                    key={os.id}
                    className="border-t border-gray-300 hover:bg-gray-100 cursor-pointer"
                    onClick={() => openModal(os)}
                  >
                    <td className="py-2 px-4">{os.loja}</td>
                    <td className="py-2 px-4">{os.cliente}</td>
                    <td className="py-2 px-4">{os.referencia}</td>
                    <td className="py-2 px-4">{os.status}</td>
                    <td className="py-2 px-4">{os.dataMontagemInicial}</td>
                    <td className="py-2 px-4">{os.dataMontagemFinal}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-4">
                    Nenhuma Ordem de Serviço encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Modal de detalhes da OS */}
        {modalOpen && selectedOS && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
            <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-lg text-black mx-4 md:mx-auto">
              <h2 className="text-xl font-bold mb-4">Detalhes da OS</h2>

              {/* Campos editáveis */}
              <div className="mb-4">
                <label><strong>Loja:</strong></label>
                <input
                  type="text"
                  name="loja"
                  value={formData.loja}
                  onChange={handleInputChange}
                  className="form-input w-full border border-gray-400 rounded-lg px-3 py-2"
                  disabled={!isEditing} // Editável somente no modo de edição
                />
              </div>

              <div className="mb-4">
                <label><strong>Cliente:</strong></label>
                <input
                  type="text"
                  name="cliente"
                  value={formData.cliente}
                  onChange={handleInputChange}
                  className="form-input w-full border border-gray-400 rounded-lg px-3 py-2"
                  disabled={!isEditing}
                />
              </div>

              <div className="mb-4">
                <label><strong>Referência:</strong></label>
                <input
                  type="text"
                  name="referencia"
                  value={formData.referencia}
                  onChange={handleInputChange}
                  className="form-input w-full border border-gray-400 rounded-lg px-3 py-2"
                  disabled={!isEditing}
                />
              </div>

              {/* Status especial */}
              <div className="mb-4">
                <label><strong>Status:</strong></label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="form-select w-full border border-gray-400 rounded-lg px-3 py-2"
                  disabled={!isEditing}
                >
                  <option value="processamentoInicial">Em processamento inicial</option>
                  <option value="encaminhadoLaboratorio">Encaminhado ao Laboratório</option>
                  <option value="montagemProgresso">Montagem em Progresso</option>
                  <option value="prontoEntrega">Pronto para Entrega</option>
                  <option value="entregueCliente">Entregue ao cliente</option>
                  <option value="cancelada">Cancelada</option>
                </select>
              </div>

              {/* Outros campos */}
              <div className="mb-4">
                <label><strong>Data Montagem Inicial:</strong></label>
                <input
                  type="date"
                  name="dataMontagemInicial"
                  value={formData.dataMontagemInicial}
                  onChange={handleInputChange}
                  className="form-input w-full border border-gray-400 rounded-lg px-3 py-2"
                  disabled={!isEditing}
                />
              </div>

              <div className="mb-4">
                <label><strong>Data Montagem Final:</strong></label>
                <input
                  type="date"
                  name="dataMontagemFinal"
                  value={formData.dataMontagemFinal}
                  onChange={handleInputChange}
                  className="form-input w-full border border-gray-400 rounded-lg px-3 py-2"
                  disabled={!isEditing}
                />
              </div>

              {/* Botões de ação */}
              <div className="mt-4 flex justify-end space-x-2">
                <button
                  className="bg-blue-500 text-white px-4 py-2 rounded"
                  onClick={handlePrint}
                >
                  Imprimir
                </button>
                <button
                  className="bg-green-500 text-white px-4 py-2 rounded"
                  onClick={handleDownloadPDF}
                >
                  Baixar PDF
                </button>
                {!isEditing ? (
                  <button
                    className="bg-yellow-500 text-white px-4 py-2 rounded"
                    onClick={() => setIsEditing(true)}
                  >
                    Editar Status
                  </button>
                ) : (
                  <button
                    className="bg-yellow-500 text-white px-4 py-2 rounded"
                    onClick={handleStatusUpdate}
                  >
                    Salvar Alterações
                  </button>
                )}
                <button
                  className="bg-red-500 text-white px-4 py-2 rounded"
                  onClick={closeModal}
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
