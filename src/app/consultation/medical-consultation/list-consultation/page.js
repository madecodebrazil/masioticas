"use client";
import React, { useState, useEffect } from "react";
import {
  getFirestore,
  collection,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { useRouter } from "next/navigation"; // Para redirecionar
import Layout from "@/components/Layout"; // Seu layout instanciado
import { app } from "@/lib/firebaseConfig"; // Certifique-se de que o Firebase está corretamente inicializado
import { FaTrash, FaEdit, FaFilePdf, FaPrint } from "react-icons/fa"; // Ícones da biblioteca react-icons
import jsPDF from "jspdf"; // Para gerar o PDF
import "jspdf-autotable"; // Plugin para tabelas no jsPDF

const db = getFirestore(app); // Inicializando Firestore

const ListConsultation = () => {
  const [consultations, setConsultations] = useState([]); // Armazenar as consultas
  const [filteredConsultations, setFilteredConsultations] = useState([]); // Consultas filtradas
  const [isLoading, setIsLoading] = useState(true); // Estado de carregamento
  const [searchTerm, setSearchTerm] = useState(""); // Termo de busca
  const [isRemoving, setIsRemoving] = useState(false); // Estado para ativar/desativar modo de remoção
  const [showModal, setShowModal] = useState(false); // Controle do modal
  const [selectedConsultation, setSelectedConsultation] = useState(null); // Consulta selecionada
  const [formData, setFormData] = useState({}); // Dados do formulário para edição

  const router = useRouter(); // Para redirecionar

  // Função para buscar as consultas no Firestore
  const fetchConsultations = async () => {
    setIsLoading(true); // Inicia o estado de carregamento
    try {
      const consultationsCollection = collection(db, "consultations"); // Referência à coleção consultations
      const querySnapshot = await getDocs(consultationsCollection);

      const consultationsData = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        consultationsData.push({ id: doc.id, ...data }); // Atribuir os dados ao array
      });

      setConsultations(consultationsData); // Armazenar os dados
      setFilteredConsultations(consultationsData); // Inicializar consultas filtradas com todos os dados
    } catch (error) {
      console.error("Erro ao buscar consultas:", error);
    } finally {
      setIsLoading(false); // Para o estado de carregamento
    }
  };

  // useEffect para buscar as consultas quando a página carregar
  useEffect(() => {
    fetchConsultations();
  }, []);

  // Função para filtrar as consultas por nome ou CPF
  const handleSearch = (e) => {
    setSearchTerm(e.target.value); // Atualizar o termo de busca
    const filtered = consultations.filter(
      (consultation) =>
        consultation.nomePaciente
          .toLowerCase()
          .includes(e.target.value.toLowerCase()) ||
        consultation.cpf.includes(e.target.value)
    );
    setFilteredConsultations(filtered); // Atualizar as consultas filtradas
  };

  // Função para redirecionar para a página de adicionar consulta
  const handleAddClick = () => {
    router.push("/consultation/medical-consultation"); // Redireciona para a página de adicionar consulta
  };

  // Função para deletar uma consulta do Firestore
  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Tem certeza de que deseja deletar esta consulta?"
    );
    if (confirmDelete) {
      try {
        await deleteDoc(doc(db, "consultations", id)); // Deletar o documento da consulta pelo ID
        setConsultations(
          consultations.filter((consultation) => consultation.id !== id)
        ); // Remover a consulta do estado
        setFilteredConsultations(
          filteredConsultations.filter((consultation) => consultation.id !== id)
        ); // Remover a consulta da lista filtrada
        console.log("Consulta removida:", id);
      } catch (error) {
        console.error("Erro ao remover consulta:", error);
      }
    }
  };

  // Função para abrir o modal de visualização
  const handleModal = (consultation) => {
    setSelectedConsultation(consultation);
    setShowModal(true);
  };

  // Função para gerar o PDF
  const generatePDF = (consultation) => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(`Relatório de Consulta`, 10, 10);

    doc.setFontSize(12);
    doc.text(`Nome do Paciente: ${consultation.nomePaciente}`, 10, 20);
    doc.text(`CPF: ${consultation.cpf}`, 10, 30);
    doc.text(`RG: ${consultation.rg}`, 10, 40);
    doc.text(`Logradouro: ${consultation.logradouro}`, 10, 50);
    doc.text(`Bairro: ${consultation.bairro}`, 10, 60);
    doc.text(`Nº: ${consultation.numeroCasa}`, 10, 70);
    doc.text(`Ametropia: ${consultation.ametropia}`, 10, 80);
    doc.text(`Data: ${consultation.data}`, 10, 90);
    doc.text(`Hora: ${consultation.hora}`, 10, 100);
    doc.text(`Clínica: ${consultation.clinica}`, 10, 110);

    doc.save(`consulta_${consultation.id}.pdf`);
  };

  const handlePrint = () => {
    window.print();
  };

  // Função para lidar com as alterações nos campos do formulário
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Função para abrir o modal de edição
  const handleEdit = (consultation) => {
    setFormData(consultation); // Preencher o formulário com dados da consulta selecionada
    setShowModal(false); // Fechar o modal de visualização
  };

  // Função para atualizar a consulta no Firestore
  const handleUpdate = async () => {
    try {
      const docRef = doc(db, "consultations", selectedConsultation.id);
      await updateDoc(docRef, formData);

      setConsultations((prevConsultations) =>
        prevConsultations.map((consultation) =>
          consultation.id === selectedConsultation.id
            ? { ...consultation, ...formData }
            : consultation
        )
      );

      setFormData({}); // Limpar os dados do formulário
      setShowModal(false); // Fechar o modal de edição
    } catch (error) {
      console.error("Erro ao atualizar consulta: ", error);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-full max-w-6xl p-4 md:p-8 bg-white rounded-lg shadow-md">
          <h2 className="text-xl md:text-2xl font-semibold text-[#81059e] mb-6 text-center md:text-left">
            CONSULTAS REGISTRADAS
          </h2>

          <div className="flex flex-col md:flex-row justify-between items-center mb-6 space-y-4 md:space-y-0">
            <input
              type="text"
              placeholder="Busque por CPF ou nome"
              value={searchTerm}
              onChange={handleSearch}
              className="border border-gray-300 px-4 py-2 rounded-lg w-full md:w-1/3 text-black"
            />

            <div className="flex space-x-4">
              <button
                onClick={handleAddClick}
                className="bg-[#81059e] text-white px-6 py-2 rounded-lg w-full md:w-auto"
              >
                ADICIONAR
              </button>
              <button
                onClick={() => setIsRemoving(!isRemoving)}
                className="bg-[#81059e] text-white px-6 py-2 rounded-lg w-full md:w-auto"
              >
                {isRemoving ? "CANCELAR" : "REMOVER"}
              </button>
            </div>
          </div>

          {isLoading ? (
            <p className="text-center text-gray-500">Carregando consultas...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border">
                <thead className="border-b bg-gray-100">
                  <tr>
                    <th className="text-left px-4 py-2 text-[#81059e]">CPF</th>
                    <th className="text-left px-4 py-2 text-[#81059e]">
                      Paciente
                    </th>
                    <th className="text-left px-4 py-2 text-[#81059e]">RG</th>
                    <th className="text-left px-4 py-2 text-[#81059e]">
                      Logradouro
                    </th>
                    <th className="text-left px-4 py-2 text-[#81059e]">
                      Bairro
                    </th>
                    <th className="text-left px-4 py-2 text-[#81059e]">Nº</th>
                    <th className="text-left px-4 py-2 text-[#81059e]">
                      Ametropia
                    </th>
                    <th className="text-left px-4 py-2 text-[#81059e]">Data</th>
                    <th className="text-left px-4 py-2 text-[#81059e]">Hora</th>
                    <th className="text-left px-4 py-2 text-[#81059e]">
                      Clínica
                    </th>
                    <th className="text-left px-4 py-2 text-[#81059e]">
                      Valor
                    </th>{" "}
                    {/* Nova coluna para Valor da Consulta */}
                    {isRemoving && (
                      <th className="text-left px-4 py-2 text-[#81059e]">
                        Ação
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {filteredConsultations.length > 0 ? (
                    filteredConsultations.map((consultation) => (
                      <tr
                        key={consultation.id}
                        onClick={() => handleModal(consultation)}
                        className="cursor-pointer"
                      >
                        <td className="border-t px-4 py-2 text-black">
                          {consultation.cpf}
                        </td>
                        <td className="border-t px-4 py-2 text-black">
                          {consultation.nomePaciente}
                        </td>
                        <td className="border-t px-4 py-2 text-black">
                          {consultation.rg}
                        </td>
                        <td className="border-t px-4 py-2 text-black">
                          {consultation.logradouro}
                        </td>
                        <td className="border-t px-4 py-2 text-black">
                          {consultation.bairro}
                        </td>
                        <td className="border-t px-4 py-2 text-black">
                          {consultation.numeroCasa}
                        </td>
                        <td className="border-t px-4 py-2 text-black">
                          {consultation.ametropia}
                        </td>
                        <td className="border-t px-4 py-2 text-black">
                          {consultation.data}
                        </td>
                        <td className="border-t px-4 py-2 text-black">
                          {consultation.hora}
                        </td>
                        <td className="border-t px-4 py-2 text-black">
                          {consultation.clinica === "loja2"
                            ? "Óticas Popular 2"
                            : "Óticas Popular 1"}
                        </td>
                        <td className="border-t px-4 py-2 text-black">
                          R$ {consultation.valorConsulta || "N/A"}
                        </td>{" "}
                        {/* Exibindo o Valor da Consulta */}
                        {isRemoving && (
                          <td className="border-t px-4 py-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation(); // Impede que o clique propague para a linha
                                handleDelete(consultation.id);
                              }}
                            >
                              <FaTrash className="text-red-500" />{" "}
                              {/* Ícone de lixeira */}
                            </button>
                          </td>
                        )}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={isRemoving ? 12 : 11}
                        className="text-center text-gray-500 py-4"
                      >
                        Nenhuma consulta encontrada.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal para visualização */}
        {showModal && selectedConsultation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
            <div className="bg-white p-4 rounded-lg shadow-lg w-[450px] max-h-[80vh] overflow-auto relative">
              <button
                className="absolute top-2 right-2 text-gray-600"
                onClick={() => setShowModal(false)}
              >
                X
              </button>

              <div className="space-y-4">
                <h2
                  className="text-lg font-bold mb-4"
                  style={{ color: "#81059e" }}
                >
                  Detalhes da Consulta
                </h2>
                <p className="text-black">
                  <span className="font-semibold">Nome do Paciente:</span>{" "}
                  {selectedConsultation.nomePaciente}
                </p>
                <p className="text-black">
                  <span className="font-semibold">CPF:</span>{" "}
                  {selectedConsultation.cpf}
                </p>
                <p className="text-black">
                  <span className="font-semibold">RG:</span>{" "}
                  {selectedConsultation.rg}
                </p>
                <p className="text-black">
                  <span className="font-semibold">Logradouro:</span>{" "}
                  {selectedConsultation.logradouro}
                </p>
                <p className="text-black">
                  <span className="font-semibold">Bairro:</span>{" "}
                  {selectedConsultation.bairro}
                </p>
                <p className="text-black">
                  <span className="font-semibold">Nº:</span>{" "}
                  {selectedConsultation.numeroCasa}
                </p>
                <p className="text-black">
                  <span className="font-semibold">Ametropia:</span>{" "}
                  {selectedConsultation.ametropia}
                </p>
                <p className="text-black">
                  <span className="font-semibold">Data:</span>{" "}
                  {selectedConsultation.data}
                </p>
                <p className="text-black">
                  <span className="font-semibold">Hora:</span>{" "}
                  {selectedConsultation.hora}
                </p>
                <p className="text-black">
                  <span className="font-semibold">Clínica:</span>{" "}
                  {selectedConsultation.clinica}
                </p>
                <p className="text-black">
                  <span className="font-semibold">Status:</span>{" "}
                  {selectedConsultation.status}
                </p>{" "}
                {/* Exibir status */}
              </div>

              <div className="mt-8 flex justify-center space-x-4">
                <button
                  onClick={() => generatePDF(selectedConsultation)}
                  className="flex items-center px-6 py-3 bg-[#81059e] text-white font-bold rounded-lg hover:bg-green-700 transition"
                >
                  <FaFilePdf className="mr-2" /> PDF
                </button>

                <button
                  onClick={handlePrint}
                  className="flex items-center px-6 py-3 bg-[#81059e] text-white font-bold rounded-lg hover:bg-blue-700 transition"
                >
                  <FaPrint className="mr-2" /> Imprimir
                </button>

                <button
                  onClick={() => handleEdit(selectedConsultation)}
                  className="flex items-center px-6 py-3 bg-[#81059e] text-white font-bold rounded-lg hover:bg-purple-600 transition"
                >
                  <FaEdit className="mr-2" /> Editar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de edição */}
        {formData && Object.keys(formData).length > 0 && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
            <div className="bg-white p-4 rounded-lg shadow-lg w-[450px] max-h-[80vh] overflow-auto relative">
              <button
                className="absolute top-2 right-2 text-gray-600"
                onClick={() => setFormData({})}
              >
                X
              </button>

              <h2
                className="text-lg font-bold mb-4"
                style={{ color: "#81059e" }}
              >
                Editar Consulta
              </h2>

              <div className="space-y-4">
                <label className="text-[#81059e87] block">
                  Nome do Paciente
                </label>
                <input
                  type="text"
                  name="nomePaciente"
                  value={formData.nomePaciente || ""}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded text-black"
                />
                <label className="text-[#81059e87] block">CPF</label>
                <input
                  type="text"
                  name="cpf"
                  value={formData.cpf || ""}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded text-black"
                />
                <label className="block text-[#81059e87] ">RG</label>
                <input
                  type="text"
                  name="rg"
                  value={formData.rg || ""}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded text-black"
                />
                <label className="block text-[#81059e87]">Logradouro</label>
                <input
                  type="text"
                  name="logradouro"
                  value={formData.logradouro || ""}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded text-black"
                />
                <label className="block text-[#81059e87]">Bairro</label>
                <input
                  type="text"
                  name="bairro"
                  value={formData.bairro || ""}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded text-black"
                />
                <label className="block text-[#81059e87]">Nº</label>
                <input
                  type="text"
                  name="numeroCasa"
                  value={formData.numeroCasa || ""}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded text-black"
                />
                <label className="block text-[#81059e87]">Ametropia</label>
                <input
                  type="text"
                  name="ametropia"
                  value={formData.ametropia || ""}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded text-black"
                />
                <label className="block text-[#81059e87]">Data</label>
                <input
                  type="date"
                  name="data"
                  value={formData.data || ""}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded text-black"
                />
                <label className="block text-[#81059e87]">Hora</label>
                <input
                  type="time"
                  name="hora"
                  value={formData.hora || ""}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded text-black"
                />
                <label className="block text-[#81059e87]">Clínica</label>
                <input
                  type="text"
                  name="clinica"
                  value={formData.clinica || ""}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded text-black"
                />

                {/* Dropdown para editar status */}
                <label className="block text-[#81059e87]">Status</label>
                <select
                  name="status"
                  value={formData.status || "agendada"}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded text-black"
                >
                  <option value="agendada">agendada</option>
                  <option value="realizada">realizada</option>
                  <option value="cancelada">cancelada</option>
                </select>
              </div>

              <div className="mt-8 flex justify-end space-x-4">
                <button
                  onClick={() => setFormData({})}
                  className="bg-gray-400 text-white px-4 py-2 rounded"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleUpdate}
                  className="bg-[#81059e] text-white px-4 py-2 rounded"
                >
                  Salvar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ListConsultation;
