"use client";
import React, { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { firestore } from "../../../../lib/firebaseConfig";
import { collection, getDocs, addDoc } from "firebase/firestore";
import { deleteDoc, doc } from "firebase/firestore";
import { FaTrash } from "react-icons/fa";

export default function LensesCollectionsAB() {
  const [isLoading, setIsLoading] = useState(false);

  // Estados para armazenar os dados de cada coleção
  const [formatos, setFormatos] = useState([]);
  const [indices, setIndices] = useState([]);
  const [materiais, setMateriais] = useState([]);
  const [tecnologias, setTecnologias] = useState([]);
  const [tipos, setTipos] = useState([]);
  const [tratamentos, setTratamentos] = useState([]);
  const [fabricantes, setFabricantes] = useState([]);
  const [designs, setDesigns] = useState([]); // Novo estado para os designs

  const [marcas, setMarcas] = useState([]);
  // Função genérica para buscar dados do Firestore
  const fetchData = async (collectionName, setState) => {
    try {
      const snapshot = await getDocs(collection(firestore, collectionName));
      const dataList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setState(dataList); // Atualiza o estado com os dados da coleção
    } catch (error) {
      console.error(`Erro ao buscar dados de ${collectionName}: `, error);
    }
  };

  const handleDeleteItem = async (collectionName, itemId, fetchFunc) => {
    if (!window.confirm("Tem certeza de que deseja excluir este item?")) return;

    try {
      await deleteDoc(doc(firestore, collectionName, itemId));
      fetchFunc(); // Atualiza a lista após a exclusão
      console.log("Item excluído com sucesso!");
    } catch (error) {
      console.error(
        `Erro ao excluir item da coleção ${collectionName}: `,
        error
      );
    }
  };

  // Função genérica para adicionar um novo item ao Firestore
  const handleAddItem = async (
    collectionName,
    newItem,
    fetchFunc,
    isNumeric = false
  ) => {
    if (!newItem) {
      return;
    }

    const itemValue = isNumeric ? Number(newItem) : newItem;

    // Verifica se é numérico e válido antes de adicionar
    if (isNumeric && isNaN(itemValue)) {
      alert("Por favor, insira um valor numérico válido.");
      return;
    }

    setIsLoading(true);

    try {
      // Adiciona um novo item ao Firestore
      await addDoc(
        collection(firestore, collectionName),
        isNumeric ? { value: itemValue } : { name: itemValue }
      );
      fetchFunc(); // Atualiza a lista da coleção correspondente
    } catch (error) {
      console.error(`Erro ao adicionar item em ${collectionName}: `, error);
    } finally {
      setIsLoading(false);
    }
  };

  // Funções para buscar dados de cada coleção

  const fetchDesigns = () => fetchData("lentes_designs", setDesigns); // Função para buscar designs

  const fetchFormatos = () => fetchData("lentes_formatos", setFormatos);
  const fetchIndices = () => fetchData("lentes_indices", setIndices);
  const fetchMateriais = () => fetchData("lentes_materiais", setMateriais);
  const fetchTecnologias = () =>
    fetchData("lentes_tecnologias", setTecnologias);
  const fetchTipos = () => fetchData("lentes_tipos", setTipos);
  const fetchTratamentos = () =>
    fetchData("lentes_tratamentos", setTratamentos);
  const fetchFabricantes = () =>
    fetchData("lentes_fabricantes", setFabricantes);
  const fetchMarcas = () => fetchData("lentes_marcas", setMarcas); // Função para buscar fabricantes
  // Carrega os dados de todas as coleções quando o componente é montado
  useEffect(() => {
    fetchFormatos();
    fetchIndices();
    fetchMateriais();
    fetchTecnologias();
    fetchTipos();
    fetchTratamentos();
    fetchDesigns();
  }, []);

  return (
    <Layout>
      <div className="p-6">
        <h1 className="text-3xl font-bold text-center text-[#800080] mb-6">
          Gerenciar Categorias de Lentes
        </h1>
        {/* Seção para exibir e adicionar Formatos de Lentes */}
        Para adicionar o botão de exclusão na renderização dos itens para
        formatos de lentes, siga o exemplo abaixo, que utiliza o ícone de
        lixeira (FaTrash) e a função handleDeleteItem para remover o item do
        Firestore ao ser clicado: javascript Copiar código
        {/* Seção para exibir e adicionar Formatos de Lentes */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-[#800080] mb-4">
            Formatos de Lentes
          </h2>
          <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {formatos.map((formato) => (
              <li
                key={formato.id}
                className="bg-white text-black border-2 border-[#800080] p-4 rounded-lg shadow flex justify-between items-center"
              >
                <span>{formato.name}</span>
                <button
                  onClick={() =>
                    handleDeleteItem(
                      "lentes_formatos",
                      formato.id,
                      fetchFormatos
                    )
                  }
                  className="text-red-500 hover:text-red-700 ml-2"
                >
                  <FaTrash />
                </button>
              </li>
            ))}
            <li
              className="bg-[#800080] text-white border-2 border-[#800080] p-4 rounded-lg shadow cursor-pointer flex justify-center items-center hover:bg-[#660066] transition"
              onClick={() => {
                const newFormato = prompt("Digite o nome do novo formato");
                if (newFormato) {
                  handleAddItem("lentes_formatos", newFormato, fetchFormatos);
                }
              }}
            >
              <span className="text-2xl font-bold">+</span>
            </li>
          </ul>
        </div>
        {/* Seção para exibir e adicionar Marcas de Lentes */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-[#800080] mb-4">
            Marcas de Lentes
          </h2>
          <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {marcas.map((marca) => (
              <li
                key={marca.id}
                className="bg-white text-black border-2 border-[#800080] p-4 rounded-lg shadow flex justify-between items-center"
              >
                <span>{marca.name}</span>
                <button
                  onClick={() =>
                    handleDeleteItem("lentes_marcas", marca.id, fetchMarcas)
                  }
                  className="text-red-500 hover:text-red-700 ml-2"
                >
                  <FaTrash />
                </button>
              </li>
            ))}
            <li
              className="bg-[#800080] text-white border-2 border-[#800080] p-4 rounded-lg shadow cursor-pointer flex justify-center items-center hover:bg-[#660066] transition"
              onClick={() => {
                const newMarca = prompt("Digite o nome da nova marca");
                if (newMarca) {
                  handleAddItem("lentes_marcas", newMarca, fetchMarcas);
                }
              }}
            >
              <span className="text-2xl font-bold">+</span>
            </li>
          </ul>
        </div>
        {/* Seção para exibir e adicionar Índices de Lentes */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-[#800080] mb-4">
            Índices de Lentes
          </h2>
          <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {indices.map((indice) => (
              <li
                key={indice.id}
                className="bg-white text-black border-2 border-[#800080] p-4 rounded-lg shadow flex justify-between items-center"
              >
                <span>{indice.value}</span>
                <button
                  onClick={() =>
                    handleDeleteItem("lentes_indices", indice.id, fetchIndices)
                  }
                  className="text-red-500 hover:text-red-700 ml-2"
                >
                  <FaTrash />
                </button>
              </li>
            ))}
            <li
              className="bg-[#800080] text-white border-2 border-[#800080] p-4 rounded-lg shadow cursor-pointer flex justify-center items-center hover:bg-[#660066] transition"
              onClick={() => {
                const newIndice = prompt("Digite o valor do novo índice");
                if (newIndice) {
                  handleAddItem(
                    "lentes_indices",
                    newIndice,
                    fetchIndices,
                    true
                  ); // O valor é numérico
                }
              }}
            >
              <span className="text-2xl font-bold">+</span>
            </li>
          </ul>
        </div>
        {/* Seção para exibir e adicionar Fabricantes de Lentes */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-[#800080] mb-4">
            Fabricantes de Lentes
          </h2>
          <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {fabricantes.map((fabricante) => (
              <li
                key={fabricante.id}
                className="bg-white text-black border-2 border-[#800080] p-4 rounded-lg shadow flex justify-between items-center"
              >
                <span>{fabricante.name}</span>
                <button
                  onClick={() =>
                    handleDeleteItem(
                      "lentes_fabricantes",
                      fabricante.id,
                      fetchFabricantes
                    )
                  }
                  className="text-red-500 hover:text-red-700 ml-2"
                >
                  <FaTrash />
                </button>
              </li>
            ))}
            <li
              className="bg-[#800080] text-white border-2 border-[#800080] p-4 rounded-lg shadow cursor-pointer flex justify-center items-center hover:bg-[#660066] transition"
              onClick={() => {
                const newFabricante = prompt(
                  "Digite o nome do novo fabricante"
                );
                if (newFabricante) {
                  handleAddItem(
                    "lentes_fabricantes",
                    newFabricante,
                    fetchFabricantes
                  );
                }
              }}
            >
              <span className="text-2xl font-bold">+</span>
            </li>
          </ul>
        </div>
        {/* Seção para exibir e adicionar Materiais de Lentes */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-[#800080] mb-4">
            Materiais de Lentes
          </h2>
          <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {materiais.map((material) => (
              <li
                key={material.id}
                className="bg-white text-black border-2 border-[#800080] p-4 rounded-lg shadow flex justify-between items-center"
              >
                <span>{material.name}</span>
                <button
                  onClick={() =>
                    handleDeleteItem(
                      "lentes_materiais",
                      material.id,
                      fetchMateriais
                    )
                  }
                  className="text-red-500 hover:text-red-700 ml-2"
                >
                  <FaTrash />
                </button>
              </li>
            ))}
            <li
              className="bg-[#800080] text-white border-2 border-[#800080] p-4 rounded-lg shadow cursor-pointer flex justify-center items-center hover:bg-[#660066] transition"
              onClick={() => {
                const newMaterial = prompt("Digite o nome do novo material");
                if (newMaterial) {
                  handleAddItem(
                    "lentes_materiais",
                    newMaterial,
                    fetchMateriais
                  );
                }
              }}
            >
              <span className="text-2xl font-bold">+</span>
            </li>
          </ul>
        </div>
        {/* Seção para exibir e adicionar Tecnologias de Lentes */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-[#800080] mb-4">
            Tecnologias de Lentes
          </h2>
          <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {tecnologias.map((tecnologia) => (
              <li
                key={tecnologia.id}
                className="bg-white text-black border-2 border-[#800080] p-4 rounded-lg shadow flex justify-between items-center"
              >
                <span>{tecnologia.name}</span>
                <button
                  onClick={() =>
                    handleDeleteItem(
                      "lentes_tecnologias",
                      tecnologia.id,
                      fetchTecnologias
                    )
                  }
                  className="text-red-500 hover:text-red-700 ml-2"
                >
                  <FaTrash />
                </button>
              </li>
            ))}
            <li
              className="bg-[#800080] text-white border-2 border-[#800080] p-4 rounded-lg shadow cursor-pointer flex justify-center items-center hover:bg-[#660066] transition"
              onClick={() => {
                const newTecnologia = prompt(
                  "Digite o nome da nova tecnologia"
                );
                if (newTecnologia) {
                  handleAddItem(
                    "lentes_tecnologias",
                    newTecnologia,
                    fetchTecnologias
                  );
                }
              }}
            >
              <span className="text-2xl font-bold">+</span>
            </li>
          </ul>
        </div>
        {/* Seção para exibir e adicionar Tipos de Lentes */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-[#800080] mb-4">
            Tipos de Lentes
          </h2>
          <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {tipos.map((tipo) => (
              <li
                key={tipo.id}
                className="bg-white text-black border-2 border-[#800080] p-4 rounded-lg shadow flex justify-between items-center"
              >
                <span>{tipo.name}</span>
                <button
                  onClick={() =>
                    handleDeleteItem("lentes_tipos", tipo.id, fetchTipos)
                  }
                  className="text-red-500 hover:text-red-700 ml-2"
                >
                  <FaTrash />
                </button>
              </li>
            ))}
            <li
              className="bg-[#800080] text-white border-2 border-[#800080] p-4 rounded-lg shadow cursor-pointer flex justify-center items-center hover:bg-[#660066] transition"
              onClick={() => {
                const newTipo = prompt("Digite o nome do novo tipo");
                if (newTipo) {
                  handleAddItem("lentes_tipos", newTipo, fetchTipos);
                }
              }}
            >
              <span className="text-2xl font-bold">+</span>
            </li>
          </ul>
        </div>
        {/* Seção para exibir e adicionar Tratamentos de Lentes */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-[#800080] mb-4">
            Tratamentos de Lentes
          </h2>
          <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {tratamentos.map((tratamento) => (
              <li
                key={tratamento.id}
                className="bg-white text-black border-2 border-[#800080] p-4 rounded-lg shadow flex justify-between items-center"
              >
                <span>{tratamento.name}</span>
                <button
                  onClick={() =>
                    handleDeleteItem(
                      "lentes_tratamentos",
                      tratamento.id,
                      fetchTratamentos
                    )
                  }
                  className="text-red-500 hover:text-red-700 ml-2"
                >
                  <FaTrash />
                </button>
              </li>
            ))}
            <li
              className="bg-[#800080] text-white border-2 border-[#800080] p-4 rounded-lg shadow cursor-pointer flex justify-center items-center hover:bg-[#660066] transition"
              onClick={() => {
                const newTratamento = prompt(
                  "Digite o nome do novo tratamento"
                );
                if (newTratamento) {
                  handleAddItem(
                    "lentes_tratamentos",
                    newTratamento,
                    fetchTratamentos
                  );
                }
              }}
            >
              <span className="text-2xl font-bold">+</span>
            </li>
          </ul>
        </div>
      </div>
    </Layout>
  );
}
