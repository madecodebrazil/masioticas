"use client";
import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { useRouter } from 'next/navigation';
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { firestore } from '../../../../lib/firebaseConfig';
import { FaFilePdf, FaPrint, FaEdit } from 'react-icons/fa'; // Importa os ícones
import jsPDF from 'jspdf'; // Para gerar o PDF

export default function ListProviders() {
  const router = useRouter();
  const [prestadores, setPrestadores] = useState([]); // Para armazenar os prestadores
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false); // Controle do modal
  const [selectedProvider, setSelectedProvider] = useState(null); // Prestador selecionado
  const [formData, setFormData] = useState({}); // Dados do formulário para edição
  const [isEditing, setIsEditing] = useState(false); // Controle do modo de edição

  useEffect(() => {
    fetchPrestadores(); // Chama a função para buscar os prestadores
  }, []);

  const fetchPrestadores = async () => {
    try {
      const prestadoresSnapshot = await getDocs(collection(firestore, 'reparo_prestador'));
      const prestadoresData = prestadoresSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPrestadores(prestadoresData); // Armazena os prestadores
      setIsLoading(false);
    } catch (error) {
      console.error('Erro ao carregar prestadores:', error);
      setIsLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value.toLowerCase());
  };

  const filteredPrestadores = prestadores.filter((prestador) => {
    return (
      prestador.name?.toLowerCase().includes(searchTerm) ||
      prestador.apelido?.toLowerCase().includes(searchTerm) ||
      prestador.cpf?.toLowerCase().includes(searchTerm)
    );
  });

  const handleModal = (prestador) => {
    setSelectedProvider(prestador);
    setFormData(prestador); // Preenche o formulário com os dados atuais do prestador
    setShowModal(true);
    setIsEditing(false); // Inicia sem o modo de edição
  };

  // Função para gerar o PDF
  const generatePDF = (prestador) => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(`Relatório de Prestador`, 10, 10);

    doc.setFontSize(12);
    doc.text(`Nome: ${prestador.name}`, 10, 20);
    doc.text(`Apelido: ${prestador.apelido}`, 10, 30);
    doc.text(`CPF: ${prestador.cpf}`, 10, 40);
    doc.text(`E-mail: ${prestador.email}`, 10, 50);
    doc.text(`Telefone: ${prestador.telefone}`, 10, 60);
    doc.text(`CEP: ${prestador.cep}`, 10, 70);
    doc.text(`Logradouro: ${prestador.logradouro}`, 10, 80);
    doc.text(`Bairro: ${prestador.bairro}`, 10, 90);
    doc.text(`Cidade: ${prestador.cidade}`, 10, 100);
    doc.text(`Estado: ${prestador.estado}`, 10, 110);

    doc.save(`prestador_${prestador.id}.pdf`);
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
      const docRef = doc(firestore, 'reparo_prestador', selectedProvider.id);
      await updateDoc(docRef, formData);

      setPrestadores((prevPrestadores) =>
        prevPrestadores.map((prestador) =>
          prestador.id === selectedProvider.id ? { ...prestador, ...formData } : prestador
        )
      );

      setIsEditing(false);
      setShowModal(false);
    } catch (error) {
      console.error("Erro ao atualizar o prestador: ", error);
    }
  };

  if (isLoading) {
    return <div>Carregando dados...</div>;
  }

  return (
    <Layout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold" style={{ color: '#81059e' }}>LISTA DE PRESTADORES</h1>
          <button
            className="bg-[#81059e] text-white font-bold px-4 py-2 rounded-lg"
            onClick={() => router.push('/products_and_services/service_provider')}
          >
            ADICIONAR PRESTADOR
          </button>
        </div>

        <div className="text-black flex space-x-4 mb-4">
          <input
            type="text"
            placeholder="Busque por nome, apelido ou CPF"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead style={{ backgroundColor: '#e0e0e0' }}>
              <tr>
                <th className="px-4 py-2 text-left text-black">Nome</th>
                <th className="px-4 py-2 text-left text-black">Apelido</th>
                <th className="px-4 py-2 text-left text-black">CPF</th>
                <th className="px-4 py-2 text-left text-black">E-mail</th>
                <th className="px-4 py-2 text-left text-black">Telefone</th>
              </tr>
            </thead>
            <tbody>
              {filteredPrestadores.length > 0 ? (
                filteredPrestadores.map((prestador, index) => (
                  <tr key={index} className="border-t cursor-pointer hover:bg-gray-100" onClick={() => handleModal(prestador)}>
                    <td className="px-4 py-2 text-black">{prestador.name || 'Não informado'}</td>
                    <td className="px-4 py-2 text-black">{prestador.apelido || 'Não informado'}</td>
                    <td className="px-4 py-2 text-black">{prestador.cpf || 'Não informado'}</td>
                    <td className="px-4 py-2 text-black">{prestador.email || 'Não informado'}</td>
                    <td className="px-4 py-2 text-black">{prestador.telefone || 'Não informado'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center py-4 text-black">
                    Nenhum prestador registrado encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Visualização e Edição */}
      {showModal && selectedProvider && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-12 rounded-lg shadow-lg w-[550px] relative"> {/* Aumentado o padding */}
            <button className="absolute top-2 right-2 text-gray-600" onClick={() => setShowModal(false)}>X</button>

            {!isEditing ? (
              <div>
                <div className="text-center">
                  <h2 className="text-lg font-bold mb-4" style={{ color: '#81059e' }}>{selectedProvider.name}</h2>
                </div>

                <div className="space-y-4 text-black">
                  <p><span className="font-semibold">Nome:</span> {selectedProvider.name}</p>
                  <p><span className="font-semibold">Apelido:</span> {selectedProvider.apelido}</p>
                  <p><span className="font-semibold">CPF:</span> {selectedProvider.cpf}</p>
                  <p><span className="font-semibold">E-mail:</span> {selectedProvider.email}</p>
                  <p><span className="font-semibold">Telefone:</span> {selectedProvider.telefone}</p>
                </div>

                <div className="mt-8 flex justify-center space-x-4">
                  <button
                    onClick={() => generatePDF(selectedProvider)}
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
                <h2 className="text-lg font-bold mb-4" style={{ color: '#81059e' }}>Editar Prestador</h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-black">Nome</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name || ''}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-black text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-black">Apelido</label>
                    <input
                      type="text"
                      name="apelido"
                      value={formData.apelido || ''}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-black text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-black">CPF</label>
                    <input
                      type="text"
                      name="cpf"
                      value={formData.cpf || ''}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-black text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-black">E-mail</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email || ''}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-black text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-black">Telefone</label>
                    <input
                      type="text"
                      name="telefone"
                      value={formData.telefone || ''}
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
