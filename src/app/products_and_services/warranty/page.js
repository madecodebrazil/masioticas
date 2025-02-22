"use client";
import React, { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { useRouter } from "next/navigation";
import { getFirestore, collection, getDocs } from "firebase/firestore";

// Função para formatar a data para dd-mm-yyyy
const formatDate = (dateString) => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return dateString;
  }
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

// Função para formatar a hora para HH:mm
const formatTime = (dateString) => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return dateString;
  }
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
};

export default function GarantiaDosClientes() {
  const [warranties, setWarranties] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredWarranties, setFilteredWarranties] = useState([]);
  const db = getFirestore();
  const router = useRouter();

  useEffect(() => {
    const fetchWarranties = async () => {
      const warrantiesCollection = collection(db, "warranties");
      const warrantiesSnapshot = await getDocs(warrantiesCollection);
      const warrantiesList = warrantiesSnapshot.docs.map((doc) => doc.data());
      setWarranties(warrantiesList);
      setFilteredWarranties(warrantiesList);
    };

    fetchWarranties();
  }, []);

  useEffect(() => {
    const lowerCaseQuery = searchQuery.toLowerCase();
    const filteredResults = warranties.filter(
      (warranty) =>
        (warranty.nomeCliente &&
          warranty.nomeCliente.toLowerCase().includes(lowerCaseQuery)) ||
        (warranty.codigoProduto &&
          warranty.codigoProduto.toLowerCase().includes(lowerCaseQuery))
    );
    setFilteredWarranties(filteredResults);
  }, [searchQuery, warranties]);

  const handleAddWarranty = () => {
    router.push(`warranty/add-warranty`);
  };

  return (
    <Layout>
      <div className="container mx-auto p-4 bg-white rounded-lg shadow">
        {/* Cabeçalho */}
        <div className="flex flex-col md:flex-row items-center justify-between pb-4">
          <div className="text-lg font-bold text-[#81059e] mb-4 md:mb-0">
            GARANTIA DOS CLIENTES
          </div>
          <button
            onClick={handleAddWarranty}
            className="bg-[#81059e] text-white px-4 py-2 rounded-md hover:bg-[#781e6a]"
          >
            ADICIONAR
          </button>
        </div>

        {/* Barra de busca */}
        <div className="flex flex-col md:flex-row items-center mt-4 space-y-4 md:space-y-0 md:space-x-4">
          <input
            type="text"
            placeholder="Busque por código ou nome"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full md:w-1/2 p-2 border border-[#81059e] rounded-md focus:outline-none text-black"
          />
        </div>

        {/* Tabela de Garantias */}
        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full table-auto border-collapse">
            <thead>
              <tr className="text-left text-black border-b border-black">
                <th className="px-4 py-2">NCM</th>
                <th className="px-4 py-2">Nome</th>
                <th className="px-4 py-2">Produto</th>
                <th className="px-4 py-2">Vencimento da Garantia</th>
                <th className="px-4 py-2">Hora da Garantia</th>
                <th className="px-4 py-2">Descrição</th>
                <th className="px-4 py-2">Loja</th>
              </tr>
            </thead>
            <tbody>
              {filteredWarranties.length > 0 ? (
                filteredWarranties.map((warranty, index) => (
                  <tr key={index} className="text-black">
                    <td className="border-t px-4 py-2 border-[#81059e]">
                      {warranty.ncm}
                    </td>
                    <td className="border-t px-4 py-2 border-[#81059e]">
                      {warranty.nomeCliente}
                    </td>
                    <td className="border-t px-4 py-2 border-[#81059e]">
                      {warranty.produto}
                    </td>
                    <td className="border-t px-4 py-2 border-[#81059e]">
                      {formatDate(warranty.dataVencimento)}
                    </td>
                    <td className="border-t px-4 py-2 border-[#81059e]">
                      {formatTime(warranty.horaGarantia)}
                    </td>
                    <td className="border-t px-4 py-2 border-[#81059e]">
                      {warranty.descricao}
                    </td>
                    <td className="border-t px-4 py-2 border-[#81059e]">
                      {warranty.loja}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-4 text-black">
                    Nenhuma garantia encontrada
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
