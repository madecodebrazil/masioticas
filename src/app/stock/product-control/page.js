"use client";
import React, { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { getDocs, collection, doc, updateDoc } from "firebase/firestore";
import { firestore } from "../../../lib/firebaseConfig";
import { FiFilter } from "react-icons/fi";
import Link from "next/link"; // Importa o Link do Next.js

export default function EstoquePage() {
  const [estoque, setEstoque] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("Estoque Padrão");
  const [selectedStore, setSelectedStore] = useState("Todas"); // Estado para a loja selecionada
  const [filterVisible, setFilterVisible] = useState(false); // Controle de visibilidade do filtro
  const [productModalVisible, setProductModalVisible] = useState(false); // Controle de visibilidade do modal de entrada de produtos
  const [editingQuantityId, setEditingQuantityId] = useState(null); // Estado para controlar qual quantidade está sendo editada

  useEffect(() => {
    const fetchEstoque = async () => {
      try {
        const loja1Armacoes = await getDocs(
          collection(firestore, "loja1_armacoes")
        );
        const loja1Lentes = await getDocs(
          collection(firestore, "loja1_lentes")
        );
        const loja2Armacoes = await getDocs(
          collection(firestore, "loja2_armacoes")
        );
        const loja2Lentes = await getDocs(
          collection(firestore, "loja2_lentes")
        );
        const loja1Solares = await getDocs(
          collection(firestore, "loja1_solares")
        );
        const loja2Solares = await getDocs(
          collection(firestore, "loja2_solares")
        );

        const estoqueData = [
          ...loja1Armacoes.docs.map((doc) => ({
            id: doc.id,
            loja: "Loja 1",
            tipo: "Armação",
            collection: "loja1_armacoes",
            ...doc.data(),
          })),
          ...loja1Lentes.docs.map((doc) => ({
            id: doc.id,
            loja: "Loja 1",
            tipo: "Lente",
            collection: "loja1_lentes",
            ...doc.data(),
          })),
          ...loja2Armacoes.docs.map((doc) => ({
            id: doc.id,
            loja: "Loja 2",
            tipo: "Armação",
            collection: "loja2_armacoes",
            ...doc.data(),
          })),
          ...loja2Lentes.docs.map((doc) => ({
            id: doc.id,
            loja: "Loja 2",
            tipo: "Lente",
            collection: "loja2_lentes",
            ...doc.data(),
          })),
          ...loja1Solares.docs.map((doc) => ({
            id: doc.id,
            loja: "Loja 1",
            tipo: "Solar",
            collection: "loja1_solares",
            ...doc.data(),
          })),
          ...loja2Solares.docs.map((doc) => ({
            id: doc.id,
            loja: "Loja 2",
            tipo: "Solar",
            collection: "loja2_solares",
            ...doc.data(),
          })),
        ];

        setEstoque(estoqueData);
      } catch (error) {
        console.error("Erro ao buscar estoque:", error);
      }
    };

    fetchEstoque();
  }, []);

  // Função para atualizar a quantidade no Firestore
  const handleQuantityBlur = async (id, collection, newQuantity) => {
    try {
      const docRef = doc(firestore, collection, id);
      await updateDoc(docRef, { quantidade: Number(newQuantity) });
    } catch (error) {
      console.error("Erro ao atualizar a quantidade:", error);
    }
  };

  const filteredEstoque = estoque
    .filter(
      (item) =>
        item.produto.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.NCM.includes(searchTerm)
    )
    .filter((item) => {
      if (selectedFilter === "Menor Estoque") {
        return item.quantidade < 10;
      } else if (selectedFilter === "Maior Estoque") {
        return item.quantidade >= 100;
      } else {
        return true; // Exibe tudo no filtro padrão
      }
    })
    .filter((item) => {
      if (selectedStore === "Todas") {
        return true;
      } else {
        return item.loja === selectedStore;
      }
    });

  return (
    <Layout>
      <div className="p-6">
        <h2 className="text-2xl font-bold text-[#800080] mb-4">
          PRODUTOS EM ESTOQUE
        </h2>

        <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
          <input
            type="text"
            placeholder="Busque por código ou título"
            className="border px-4 py-2 rounded-lg w-full sm:w-64 bg-[#f9f9f9] text-black mb-4 sm:mb-0"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <div className="flex space-x-2">
            <div className="relative">
              <button
                className="bg-[#800080] text-white font-bold px-6 py-2 rounded-lg shadow hover:bg-[#660066] transition flex items-center"
                onClick={() => setFilterVisible(!filterVisible)}
              >
                <FiFilter className="mr-2" />
                Filtrar por
              </button>

              {filterVisible && (
                <div className="absolute right-0 mt-2 bg-white border border-[#800080] rounded-lg shadow-lg w-48 z-10">
                  {/* Filtro por quantidade */}
                  <button
                    className={`block w-full py-2 px-4 font-bold ${
                      selectedFilter === "Menor Estoque"
                        ? "bg-[#800080] text-white"
                        : "text-[#800080]"
                    }`}
                    onClick={() => {
                      setSelectedFilter("Menor Estoque");
                      setFilterVisible(false);
                    }}
                  >
                    MENOR ESTOQUE
                  </button>
                  <button
                    className={`block w-full py-2 px-4 font-bold ${
                      selectedFilter === "Estoque Padrão"
                        ? "bg-[#800080] text-white"
                        : "text-[#800080]"
                    }`}
                    onClick={() => {
                      setSelectedFilter("Estoque Padrão");
                      setFilterVisible(false);
                    }}
                  >
                    ESTOQUE PADRÃO
                  </button>
                  <button
                    className={`block w-full py-2 px-4 font-bold ${
                      selectedFilter === "Maior Estoque"
                        ? "bg-[#800080] text-white"
                        : "text-[#800080]"
                    }`}
                    onClick={() => {
                      setSelectedFilter("Maior Estoque");
                      setFilterVisible(false);
                    }}
                  >
                    MAIOR ESTOQUE
                  </button>

                  <hr className="my-2" />

                  {/* Filtro por loja */}
                  <button
                    className={`block w-full py-2 px-4 font-bold ${
                      selectedStore === "Todas"
                        ? "bg-[#800080] text-white"
                        : "text-[#800080]"
                    }`}
                    onClick={() => {
                      setSelectedStore("Todas");
                      setFilterVisible(false);
                    }}
                  >
                    TODAS AS LOJAS
                  </button>
                  <button
                    className={`block w-full py-2 px-4 font-bold ${
                      selectedStore === "Loja 1"
                        ? "bg-[#800080] text-white"
                        : "text-[#800080]"
                    }`}
                    onClick={() => {
                      setSelectedStore("Loja 1");
                      setFilterVisible(false);
                    }}
                  >
                    LOJA 1
                  </button>
                  <button
                    className={`block w-full py-2 px-4 font-bold ${
                      selectedStore === "Loja 2"
                        ? "bg-[#800080] text-white"
                        : "text-[#800080]"
                    }`}
                    onClick={() => {
                      setSelectedStore("Loja 2");
                      setFilterVisible(false);
                    }}
                  >
                    LOJA 2
                  </button>
                </div>
              )}
            </div>

            {/* Botão "Entrada de Produtos" */}
            <button
              className="bg-green-600 text-white font-bold px-6 py-2 rounded-lg shadow hover:bg-green-700 transition"
              onClick={() => setProductModalVisible(true)}
            >
              Entrada de Produtos
            </button>
          </div>
        </div>

        {/* Modal de Entrada de Produtos */}
        {productModalVisible && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-80">
              <h3 className="text-2xl font-bold text-center text-[#800080] mb-4">
                Entrada de Produtos
              </h3>
              <div className="space-y-4">
                <Link
                  href="/products_and_services/frames/add-frame"
                  className="block w-full px-4 py-2 bg-[#800080] text-white font-bold rounded-lg text-center hover:bg-[#660066] transition"
                >
                  Criar Armação
                </Link>
                <Link
                  href="/products_and_services/lenses/add-lense"
                  className="block w-full px-4 py-2 bg-[#800080] text-white font-bold rounded-lg text-center hover:bg-[#660066] transition"
                >
                  Criar Lente
                </Link>
                <Link
                  href="/products_and_services/solar"
                  className="block w-full px-4 py-2 bg-[#800080] text-white font-bold rounded-lg text-center hover:bg-[#660066] transition"
                >
                  Criar Solar
                </Link>
              </div>
              <button
                className="bg-gray-500 text-white px-4 py-2 rounded-lg w-full mt-4"
                onClick={() => setProductModalVisible(false)}
              >
                Fechar
              </button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse bg-[#f5f5f5]">
            <thead>
              <tr className="text-left border-b bg-[#535353] text-white">
                <th className="py-2 px-4">Loja</th>
                <th className="py-2 px-4">SKU</th>
                <th className="py-2 px-4">Produto</th>
                <th className="py-2 px-4">Quantidade</th>
                <th className="py-2 px-4">Valor de Custo</th>
                <th className="py-2 px-4">Custo Médio</th>
                <th className="py-2 px-4">Perc. de Lucro</th>
                <th className="py-2 px-4">Valor de Venda</th>
                <th className="py-2 px-4">NCM</th>
              </tr>
            </thead>
            <tbody>
              {filteredEstoque.map((item) => {
                const itemKey = `${item.collection}-${item.id}`; // Chave única para cada item
                return (
                  <tr
                    key={itemKey}
                    className="border-b text-[#8D8D8D]"
                  >
                    <td className="py-2 px-4">{item.loja}</td>
                    <td className="py-2 px-4">{item.sku}</td>
                    <td className="py-2 px-4">{item.produto}</td>
                    <td
                      className={`py-2 px-4 ${
                        item.quantidade >= 100
                          ? "text-green-500"
                          : item.quantidade < 10
                          ? "text-red-500"
                          : "text-orange-500"
                      }`}
                    >
                      {editingQuantityId === itemKey ? (
                        <input
                          type="number"
                          value={item.quantidade}
                          onChange={(e) => {
                            const newQuantity = e.target.value;
                            setEstoque((prevEstoque) =>
                              prevEstoque.map((i) =>
                                i.id === item.id &&
                                i.collection === item.collection
                                  ? { ...i, quantidade: newQuantity }
                                  : i
                              )
                            );
                          }}
                          onBlur={(e) => {
                            handleQuantityBlur(
                              item.id,
                              item.collection,
                              e.target.value
                            );
                            setEditingQuantityId(null); // Sair do modo de edição
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleQuantityBlur(
                                item.id,
                                item.collection,
                                e.target.value
                              );
                              setEditingQuantityId(null); // Sair do modo de edição
                            }
                          }}
                          className="w-16 border rounded px-2"
                          autoFocus
                        />
                      ) : (
                        <div className="flex items-center">
                          <span>{item.quantidade}</span>
                          <button
                            onClick={() => setEditingQuantityId(itemKey)}
                            className="ml-2 text-blue-500 underline"
                          >
                            Editar
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="py-2 px-4">
                      R${parseFloat(item.custo).toFixed(2)}
                    </td>
                    <td className="py-2 px-4">
                      R${parseFloat(item.custo_medio).toFixed(2)}
                    </td>
                    <td className="py-2 px-4">
                      {parseFloat(item.percentual_lucro).toFixed(2)}%
                    </td>
                    <td className="py-2 px-4">
                      R${parseFloat(item.valor).toFixed(2)}
                    </td>
                    <td className="py-2 px-4">{item.NCM}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
