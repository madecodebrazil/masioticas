"use client";
import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { useRouter } from 'next/navigation';
import { collection, getDocs, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { firestore } from '../../../../lib/firebaseConfig';
import { FaTrash, FaEdit, FaFilePdf, FaPrint } from 'react-icons/fa'; // Ícones para ações
import jsPDF from 'jspdf'; // Para gerar o PDF
import 'jspdf-autotable'; // Plugin para tabelas no jsPDF

export default function ListMalotes() {
  const router = useRouter();
  const [malotes, setMalotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false); // Controle do modal
  const [selectedMalote, setSelectedMalote] = useState(null); // Malote selecionado
  const [isEditing, setIsEditing] = useState(false); // Controle do modo de edição
  const [formData, setFormData] = useState({}); // Dados do formulário para edição

  useEffect(() => {
    fetchMalotes();
  }, []);

  const fetchMalotes = async () => {
    try {
      setIsLoading(true);

      const malotesSnapshot = await getDocs(collection(firestore, 'malotes')); // Busca diretamente da coleção /malotes

      const malotesData = [];

      malotesSnapshot.forEach((doc) => {
        const data = doc.data();
        malotesData.push({ ...data, id: doc.id });
      });

      setMalotes(malotesData);
      setIsLoading(false);
    } catch (error) {
      console.error('Erro ao carregar malotes:', error);
      setIsLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value.toLowerCase());
  };

  const filteredMalotes = malotes.filter((malote) => {
    return (
      malote.nomeCliente?.toLowerCase().includes(searchTerm) ||
      malote.produto?.toLowerCase().includes(searchTerm) ||
      malote.prestador?.toLowerCase().includes(searchTerm)
    );
  });

  const handleModal = (malote) => {
    setSelectedMalote(malote);
    setFormData(malote);
    setShowModal(true);
    setIsEditing(false);
  };

  const generatePDF = (malote) => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text(`Relatório do Malote`, 10, 10);

    doc.setFontSize(12);
    doc.text(`Nome do Cliente: ${malote.nomeCliente}`, 10, 20);
    doc.text(`Produto: ${malote.produto}`, 10, 30);
    doc.text(`Prestador: ${malote.prestador}`, 10, 40);
    doc.text(`Valor: R$ ${malote.valor}`, 10, 50);
    doc.text(`Data de Entrada: ${malote.data}`, 10, 60);
    doc.text(`Descrição: ${malote.descricao}`, 10, 70);

    doc.save(`malote_${malote.id}.pdf`);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleUpdate = async () => {
    try {
      const docRef = doc(firestore, 'malotes', selectedMalote.id);
      await updateDoc(docRef, formData);

      setMalotes((prevMalotes) =>
        prevMalotes.map((malote) =>
          malote.id === selectedMalote.id ? { ...malote, ...formData } : malote
        )
      );

      setIsEditing(false);
      setShowModal(false);
    } catch (error) {
      console.error("Erro ao atualizar o malote: ", error);
    }
  };

  if (isLoading) {
    return <div>Carregando dados...</div>;
  }

  return (
    <Layout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold" style={{ color: '#81059e' }}>LISTA DE MALOTES</h1>
        </div>

        <div className="text-black flex space-x-4 mb-4">
          <input
            type="text"
            placeholder="Busque por cliente, produto ou prestador"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead style={{ backgroundColor: '#e0e0e0' }}>
              <tr>
                <th className="px-4 py-2 text-left text-black">Nome do Cliente</th>
                <th className="px-4 py-2 text-left text-black">Produto</th>
                <th className="px-4 py-2 text-left text-black">Prestador</th>
                <th className="px-4 py-2 text-left text-black">Valor</th>
                <th className="px-4 py-2 text-left text-black">Data</th>
                <th className="px-4 py-2 text-left text-black">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredMalotes.length > 0 ? (
                filteredMalotes.map((malote, index) => (
                  <tr
                    key={index}
                    className="border-t cursor-pointer hover:bg-gray-100"
                    onClick={() => handleModal(malote)}
                  >
                    <td className="px-4 py-2 text-black">{malote.nomeCliente || 'Não informado'}</td>
                    <td className="px-4 py-2 text-black">{malote.produto || 'Não informado'}</td>
                    <td className="px-4 py-2 text-black">{malote.prestador || 'Prestador não informado'}</td>
                    <td className="px-4 py-2 text-black">R${malote.valor || 'Valor não informado'}</td>
                    <td className="px-4 py-2 text-black">{malote.data || 'Data não informada'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-4 text-black">
                    Nenhum malote registrado encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Visualização e Edição */}
      {showModal && selectedMalote && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-12 rounded-lg shadow-lg w-[550px] relative"> {/* Aumentei a largura para w-[550px] e mantive o padding para dar mais espaço */}
            {/* Botão de fechar modal */}
            <button
              className="absolute top-2 right-2 text-gray-600"
              onClick={() => setShowModal(false)}
            >
              X
            </button>

            {!isEditing ? (
              <div>
                <div className="text-center">
                  <h2 className="text-lg font-bold mb-4" style={{ color: '#81059e' }}>{selectedMalote.nomeCliente}</h2>
                </div>

                <div className="space-y-4 text-black"> {/* Aumentei o espaçamento entre os elementos para space-y-4 */}
                  <p><span className="font-semibold">Nome do Cliente:</span> {selectedMalote.nomeCliente}</p>
                  <p><span className="font-semibold">Produto:</span> {selectedMalote.produto}</p>
                  <p><span className="font-semibold">Prestador:</span> {selectedMalote.prestador}</p>
                  <p><span className="font-semibold">Valor:</span> R$ {selectedMalote.valor}</p>
                  <p><span className="font-semibold">Data de Entrada:</span> {selectedMalote.data}</p>
                  <p><span className="font-semibold">Descrição:</span> {selectedMalote.descricao}</p>
                </div>

                <div className="mt-8 flex justify-center space-x-4">
                  <button
                    onClick={() => generatePDF(selectedMalote)}
                    className="flex items-center px-6 py-3 bg-[#81059e] text-white font-bold rounded-lg hover:bg-green-700 transition"
                  >
                    <FaFilePdf className="mr-2" />
                    PDF
                  </button>

                  <button
                    onClick={handlePrint}
                    className="flex items-center px-6 py-3 bg-[#81059e] text-white font-bold rounded-lg hover:bg-blue-700 transition"
                  >
                    <FaPrint className="mr-2" />
                    Imprimir
                  </button>

                  <button
                    onClick={handleEdit}
                    className="flex items-center px-6 py-3 bg-[#81059e] text-white font-bold rounded-lg hover:bg-purple-600 transition"
                  >
                    <FaEdit className="mr-2" />
                    Editar
                  </button>
                </div>
              </div>
            ) : (
              <div>
                {/* Formulário de edição */}
                <h2 className="text-lg font-bold mb-4" style={{ color: '#81059e' }}>Editar Malote</h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-black">Nome do Cliente</label>
                    <input
                      type="text"
                      name="nomeCliente"
                      value={formData.nomeCliente || ''}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-black text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-black">Produto</label>
                    <input
                      type="text"
                      name="produto"
                      value={formData.produto || ''}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-black text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-black">Prestador</label>
                    <input
                      type="text"
                      name="prestador"
                      value={formData.prestador || ''}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-black text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-black">Valor</label>
                    <input
                      type="text"
                      name="valor"
                      value={formData.valor || ''}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-black text-white"
                    />
                  </div>
                </div>

                <div className="mt-4 flex justify-end space-x-4">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="bg-gray-400 text-white px-4 py-2 rounded-lg"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleUpdate}
                    className="bg-[#81059e] text-white px-4 py-2 rounded-lg"
                  >
                    Salvar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}




    </Layout>
  );
}
