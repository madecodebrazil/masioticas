"use client";
import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { useRouter } from 'next/navigation';
import { collection, getDocs, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { firestore } from '../../../../lib/firebaseConfig';
import { FaFilePdf, FaPrint, FaEdit } from 'react-icons/fa'; // Importa os ícones
import jsPDF from 'jspdf'; // Para gerar o PDF
import 'jspdf-autotable'; // Plugin para tabelas no jsPDF

export default function ListRepairs() {
  const router = useRouter();
  const [repairs, setRepairs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false); // Controle do modal
  const [selectedRepair, setSelectedRepair] = useState(null); // Reparo selecionado
  const [formData, setFormData] = useState({}); // Dados do formulário para edição
  const [isEditing, setIsEditing] = useState(false); // Controle do modo de edição

  useEffect(() => {
    fetchRepairs();
  }, []);

  const fetchRepairs = async () => {
    try {
      setIsLoading(true);
      const loja1Snapshot = await getDocs(collection(firestore, 'repairs', 'loja1', 'dados'));
      const loja2Snapshot = await getDocs(collection(firestore, 'repairs', 'loja2', 'dados'));

      const repairsData = [];

      loja1Snapshot.forEach((doc) => {
        const data = doc.data();
        repairsData.push({ ...data, id: doc.id, loja: 'Óticas Popular 1' });
      });

      loja2Snapshot.forEach((doc) => {
        const data = doc.data();
        repairsData.push({ ...data, id: doc.id, loja: 'Óticas Popular 2' });
      });

      setRepairs(repairsData);
      setIsLoading(false);
    } catch (error) {
      console.error('Erro ao carregar reparos:', error);
      setIsLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value.toLowerCase());
  };

  const filteredRepairs = repairs.filter((repair) => {
    return (
      repair.nomeCliente?.toLowerCase().includes(searchTerm) ||
      repair.produto?.toLowerCase().includes(searchTerm) ||
      repair.prestador?.toLowerCase().includes(searchTerm)
    );
  });

  const handleModal = (repair) => {
    setSelectedRepair(repair);
    setFormData(repair); // Preenche o formulário com os dados atuais do reparo
    setShowModal(true);
    setIsEditing(false); // Inicia sem o modo de edição
  };

  // Função para gerar o PDF
  const generatePDF = (repair) => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(`Relatório de Reparo`, 10, 10);

    doc.setFontSize(12);
    doc.text(`Nome do Cliente: ${repair.nomeCliente}`, 10, 20);
    doc.text(`Produto: ${repair.produto}`, 10, 30);
    doc.text(`Prestador: ${repair.prestador}`, 10, 40);
    doc.text(`Valor: R$ ${repair.valor}`, 10, 50);
    doc.text(`Data de Entrada: ${repair.data}`, 10, 60);
    doc.text(`Descrição: ${repair.descricao}`, 10, 70);

    doc.save(`repair_${repair.id}.pdf`);
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
      const docRef = doc(firestore, 'repairs', selectedRepair.loja === 'Óticas Popular 1' ? 'loja1' : 'loja2', 'dados', selectedRepair.id);
      await updateDoc(docRef, formData);

      setRepairs((prevRepairs) =>
        prevRepairs.map((repair) =>
          repair.id === selectedRepair.id ? { ...repair, ...formData } : repair
        )
      );

      setIsEditing(false);
      setShowModal(false);
    } catch (error) {
      console.error("Erro ao atualizar o reparo: ", error);
    }
  };

  if (isLoading) {
    return <div>Carregando dados...</div>;
  }

  return (
    <Layout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold" style={{ color: '#81059e' }}>LISTA DE REPAROS</h1>
          {/* Botão de Adicionar Reparo */}
          <button
            onClick={() => router.push('/products_and_services/repair')}
            className="bg-[#81059e] text-white font-bold px-6 py-2 rounded-lg shadow hover:bg-[#850f56] transition"
          >
            Adicionar Reparo
          </button>
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
                <th className="px-4 py-2 text-left text-black">Loja</th>
              </tr>
            </thead>
            <tbody>
              {filteredRepairs.length > 0 ? (
                filteredRepairs.map((repair, index) => (
                  <tr key={index} className="border-t cursor-pointer hover:bg-gray-100" onClick={() => handleModal(repair)}>
                    <td className="px-4 py-2 text-black">{repair.nomeCliente || 'Não informado'}</td>
                    <td className="px-4 py-2 text-black">{repair.produto || 'Não informado'}</td>
                    <td className="px-4 py-2 text-black">{repair.prestador || 'Prestador não informado'}</td>
                    <td className="px-4 py-2 text-black">R${repair.valor || 'Valor não informado'}</td>
                    <td className="px-4 py-2 text-black">{repair.data || 'Data não informada'}</td>
                    <td className="px-4 py-2 text-black">{repair.loja || 'Loja não informada'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-4 text-black">
                    Nenhum reparo registrado encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Visualização e Edição */}
      {showModal && selectedRepair && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-10 rounded-lg shadow-lg w-[550px] relative">
            {/* Botão de fechar modal */}
            <button className="absolute top-2 right-2 text-gray-600" onClick={() => setShowModal(false)}>X</button>

            {!isEditing ? (
              <div>
                <div className="text-center">
                  <h2 className="text-lg font-bold mb-4" style={{ color: '#81059e' }}>{selectedRepair.nomeCliente}</h2>
                </div>

                <div className="space-y-4 text-black">
                  <p><span className="font-semibold">Nome do Cliente:</span> {selectedRepair.nomeCliente}</p>
                  <p><span className="font-semibold">Produto:</span> {selectedRepair.produto}</p>
                  <p><span className="font-semibold">Prestador:</span> {selectedRepair.prestador}</p>
                  <p><span className="font-semibold">Valor:</span> R$ {selectedRepair.valor}</p>
                  <p><span className="font-semibold">Data de Entrada:</span> {selectedRepair.data}</p>
                  <p><span className="font-semibold">Loja:</span> {selectedRepair.loja}</p>
                </div>

                <div className="mt-8 flex justify-center space-x-4">
                  <button
                    onClick={() => generatePDF(selectedRepair)}
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
                <h2 className="text-lg font-bold mb-4" style={{ color: '#81059e' }}>Editar Reparo</h2>

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
                  <button onClick={() => setIsEditing(false)} className="bg-gray-400 text-white px-4 py-2 rounded-lg">Cancelar</button>
                  <button onClick={handleUpdate} className="bg-[#81059e] text-white px-4 py-2 rounded-lg">Salvar</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
}
