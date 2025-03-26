"use client";
import { useEffect, useState } from "react";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  updateDoc,
} from "firebase/firestore";
import Layout from "@/components/Layout";
import Link from "next/link";
import Image from "next/image";
import jsPDF from "jspdf";

const LentesFabricantes = () => {
  const [fabricantes, setFabricantes] = useState([]);
  const [selectedFabricante, setSelectedFabricante] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editableData, setEditableData] = useState({});

  useEffect(() => {
    const fetchFabricantes = async () => {
      const db = getFirestore();
      const querySnapshot = await getDocs(
        collection(db, "armacoes_fabricantes")
      );
      const fabricantesList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setFabricantes(fabricantesList);
    };
    fetchFabricantes();
  }, []);

  const handleRowClick = (fabricante) => {
    setSelectedFabricante(fabricante);
    setEditableData(fabricante);
    setIsEditing(false);
  };

  const closeModal = () => {
    setSelectedFabricante(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditableData({
      ...editableData,
      [name]: value,
    });
  };

  const handleSaveChanges = async () => {
    const db = getFirestore();
    const fabricanteRef = doc(db, "armacoes_fabricantes", editableData.id);

    try {
      await updateDoc(fabricanteRef, editableData);
      alert("Alterações salvas com sucesso!");
      setIsEditing(false);
    } catch (error) {
      console.error("Erro ao salvar as alterações:", error);
      alert("Ocorreu um erro ao salvar as alterações.");
    }
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(12);
    doc.text(`Nome Fantasia: ${selectedFabricante.nomeFantasia}`, 10, 10);
    doc.text(`Razão Social: ${selectedFabricante.razaoSocial}`, 10, 20);
    doc.text(`CNPJ: ${selectedFabricante.cnpj}`, 10, 30);
    doc.text(`Email: ${selectedFabricante.email}`, 10, 40);
    doc.text(`Telefone: ${selectedFabricante.telefone}`, 10, 50);
    doc.text(`CEP: ${selectedFabricante.cep}`, 10, 60);
    doc.text(`Número: ${selectedFabricante.numero}`, 10, 70);
    doc.text(`Logradouro: ${selectedFabricante.logradouro}`, 10, 80);
    doc.text(`Cidade: ${selectedFabricante.cidade}`, 10, 90);
    doc.text(`Estado: ${selectedFabricante.estado}`, 10, 100);
    doc.save(`${selectedFabricante.nomeFantasia}.pdf`);
  };

  const printContent = () => {
    const printWindow = window.open("", "_blank");
    const content = `
      <html>
        <head>
          <title>Imprimir Fabricante</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .title { font-size: 20px; color: #81059e; font-weight: bold; }
            .field { font-weight: bold; color: #81059e; }
            .value { margin-bottom: 10px; }
          </style>
        </head>
        <body>
          <div class="title">${selectedFabricante.nomeFantasia}</div>
          <div class="field">Razão Social:</div><div class="value">${selectedFabricante.razaoSocial}</div>
          <div class="field">CNPJ:</div><div class="value">${selectedFabricante.cnpj}</div>
          <div class="field">Email:</div><div class="value">${selectedFabricante.email}</div>
          <div class="field">Telefone:</div><div class="value">${selectedFabricante.telefone}</div>
          <div class="field">CEP:</div><div class="value">${selectedFabricante.cep}</div>
          <div class="field">Número:</div><div class="value">${selectedFabricante.numero}</div>
          <div class="field">Logradouro:</div><div class="value">${selectedFabricante.logradouro}</div>
          <div class="field">Cidade:</div><div class="value">${selectedFabricante.cidade}</div>
          <div class="field">Estado:</div><div class="value">${selectedFabricante.estado}</div>
        </body>
      </html>
    `;
    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  return (
    <Layout>
      <div className="p-4">
        <div className="flex flex-col md:flex-row justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-[#81059e] mb-4 md:mb-0">
            Fabricantes de Lentes Registrados
          </h1>
          <Link href="/products_and_services/industry/add-industry">
            <button className="bg-[#81059e] text-white py-2 px-4 rounded hover:bg-[#7a206b] transition-colors">
              ADICIONAR
            </button>
          </Link>
        </div>

        <input
          type="text"
          placeholder="Busque por nome"
          className="border rounded p-2 mb-4 w-full shadow-sm focus:outline-none focus:ring focus:ring-[#81059e]"
        />

        <div className="overflow-x-auto">
          <table className="table-auto w-full border-collapse shadow-lg">
            <thead>
              <tr className="bg-[#81059e] text-white">
                <th className="px-4 py-2">CNPJ</th>
                <th className="px-4 py-2">Nome Fantasia</th>
                <th className="px-4 py-2">Razão Social</th>
                <th className="px-4 py-2">Email</th>
                <th className="px-4 py-2">Telefone</th>
                <th className="px-4 py-2">CEP</th>
                <th className="px-4 py-2">Número</th>
              </tr>
            </thead>
            <tbody>
              {fabricantes.map((fabricante, index) => (
                <tr
                  key={index}
                  className={`cursor-pointer hover:bg-gray-100 transition-colors ${index % 2 === 0 ? "bg-gray-50" : ""
                    }`}
                  onClick={() => handleRowClick(fabricante)}
                >
                  <td className="px-4 py-2 text-black whitespace-nowrap overflow-hidden text-ellipsis">
                    {fabricante.cnpj || ""}
                  </td>
                  <td className="px-4 py-2 text-black whitespace-nowrap overflow-hidden text-ellipsis">
                    {fabricante.nomeFantasia || ""}
                  </td>
                  <td className="px-4 py-2 text-black whitespace-nowrap overflow-hidden text-ellipsis">
                    {fabricante.razaoSocial || ""}
                  </td>
                  <td className="px-4 py-2 text-black whitespace-nowrap overflow-hidden text-ellipsis">
                    {fabricante.email || ""}
                  </td>
                  <td className="px-4 py-2 text-black whitespace-nowrap overflow-hidden text-ellipsis">
                    {fabricante.telefone || ""}
                  </td>
                  <td className="px-4 py-2 text-black whitespace-nowrap overflow-hidden text-ellipsis">
                    {fabricante.cep || ""}
                  </td>
                  <td className="px-4 py-2 text-black whitespace-nowrap overflow-hidden text-ellipsis">
                    {fabricante.numero || ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {selectedFabricante && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg p-6 shadow-lg w-full md:w-1/2 lg:w-1/3 relative">
              <button
                className="absolute top-2 right-2 text-black"
                onClick={closeModal}
              >
                X
              </button>
              <div className="flex items-center mb-4">
                <h2 className="text-2xl font-bold text-[#81059e] mr-2">
                  {selectedFabricante.nomeFantasia}
                </h2>
                <Image
                  src="/images/user-avatar.png"
                  alt="Avatar"
                  width={40}
                  height={40}
                  className="rounded-full"
                />
              </div>

              <div className="flex flex-col mb-2">
                <label className="font-bold text-[#81059e]">Razão Social</label>
                <input
                  name="razaoSocial"
                  value={editableData.razaoSocial}
                  onChange={handleInputChange}
                  className="border rounded p-2"
                  style={{ color: "black" }}
                  disabled={!isEditing}
                />
              </div>

              <div className="flex flex-col mb-2">
                <label className="font-bold text-[#81059e]">CNPJ</label>
                <input
                  name="cnpj"
                  value={editableData.cnpj}
                  onChange={handleInputChange}
                  className="border rounded p-2"
                  style={{ color: "black" }}
                  disabled={!isEditing}
                />
              </div>

              <div className="flex flex-col mb-2">
                <label className="font-bold text-[#81059e]">Email</label>
                <input
                  name="email"
                  value={editableData.email}
                  onChange={handleInputChange}
                  className="border rounded p-2"
                  style={{ color: "black" }}
                  disabled={!isEditing}
                />
              </div>

              <div className="flex flex-wrap justify-between mt-4 space-y-2 md:space-y-0 md:space-x-4">
                <button
                  className="bg-[#81059e] text-white py-2 px-4 rounded flex items-center"
                  onClick={() => setIsEditing(!isEditing)}
                >
                  <Image
                    src="/images/edit.png"
                    alt="Editar"
                    width={20}
                    height={20}
                    className="mr-2"
                  />{" "}
                  {isEditing ? "Cancelar" : "Editar"}
                </button>
                {isEditing && (
                  <button
                    className="bg-[#81059e] text-white py-2 px-4 rounded"
                    onClick={handleSaveChanges}
                  >
                    Salvar
                  </button>
                )}
                <button
                  className="bg-[#81059e] text-white py-2 px-4 rounded flex items-center"
                  onClick={generatePDF}
                >
                  <Image
                    src="/images/PDF.png"
                    alt="PDF"
                    width={20}
                    height={20}
                    className="mr-2"
                  />{" "}
                  PDF
                </button>
                <button
                  className="bg-[#81059e] text-white py-2 px-4 rounded flex items-center"
                  onClick={printContent}
                >
                  <Image
                    src="/images/print.png"
                    alt="Imprimir"
                    width={20}
                    height={20}
                    className="mr-2"
                  />{" "}
                  Imprimir
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default LentesFabricantes;
