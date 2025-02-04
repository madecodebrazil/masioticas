"use client";
import React, { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { firestore } from "../../../../lib/firebaseConfig";
import { collection, getDocs, addDoc } from "firebase/firestore";
import { FaTrash } from "react-icons/fa";
import { deleteDoc, doc } from "firebase/firestore";

export default function AllCollectionsAB() {
  const [isLoading, setIsLoading] = useState(false);

  // Estados para armazenar os dados de cada coleção
  const [unidades, setUnidades] = useState([]);

  const [aros, setAros] = useState([]);
  const [cores, setCores] = useState([]);
  const [ncm, setNcm] = useState([]);
  const [fabricantes, setFabricantes] = useState([]);
  const [formatos, setFormatos] = useState([]);
  const [hastes, setHastes] = useState([]);
  const [larguraLentes, setLarguraLentes] = useState([]);
  const [materiais, setMateriais] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [pontes, setPontes] = useState([]);

  const fetchUnidades = () => fetchData("armacoes_unidades", setUnidades);

  const addUnidade = async () => {
    const newUnidade = prompt("Digite o nome da nova unidade");
    if (newUnidade) {
      await handleAddItem("armacoes_unidades", newUnidade, fetchUnidades);
    }
  };

  const deleteUnidade = async (id) => {
    if (window.confirm("Tem certeza que deseja excluir esta unidade?")) {
      await handleDeleteItem("armacoes_unidades", id, fetchUnidades);
    }
  };

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
    if (window.confirm("Tem certeza que deseja excluir este item?")) {
      try {
        await deleteDoc(doc(firestore, collectionName, itemId));
        fetchFunc(); // Atualiza a lista após exclusão
      } catch (error) {
        console.error(`Erro ao deletar item em ${collectionName}: `, error);
      }
    }
  };
  // Função para buscar dados da coleção de cores

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
  const fetchCores = () => fetchData("armacoes_cores", setCores);
  const fetchAros = () => fetchData("armacoes_aros", setAros);
  const fetchFormatos = () => fetchData("armacoes_formatos", setFormatos);
  const fetchHastes = () => fetchData("armacoes_hastes", setHastes);
  const fetchLarguraLentes = () =>
    fetchData("armacoes_largura_lentes", setLarguraLentes);
  const fetchMateriais = () => fetchData("armacoes_materiais", setMateriais);
  const fetchMarcas = () => fetchData("armacoes_marcas", setMarcas);
  const fetchNcm = () => fetchData("ncm", setNcm);
  const fetchPontes = () => fetchData("armacoes_pontes", setPontes);
  const fetchFabricantes = () =>
    fetchData("armacoes_fabricantes", setFabricantes); // Função para buscar fabricantes

  // Carrega os dados de todas as coleções quando o componente é montado
  useEffect(() => {
    fetchAros();
    fetchFormatos();
    fetchHastes();
    fetchLarguraLentes();
    fetchMateriais();
    fetchPontes();
    fetchCores();
    fetchMarcas();
    fetchNcm();
    fetchUnidades();
    fetchFabricantes();
  }, []);

  return (
    <Layout>
      <div className="p-6">
        <h1 className="text-3xl font-bold text-center text-[#800080] mb-6">
          Gerenciar Todas as Categorias
        </h1>
        {/* Seção para exibir e adicionar Fabricantes */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-[#800080] mb-4">
            Fabricantes
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
                      "armacoes_fabricantes",
                      fabricante.id,
                      fetchFabricantes
                    )
                  }
                  className="text-red-500 hover:text-red-700 transition"
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
                    "armacoes_fabricantes",
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

        {/* Seção para exibir e adicionar NCMs */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-[#800080] mb-4">NCM</h2>
          <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {ncm.map((item) => (
              <li
                key={item.id}
                className="bg-white text-black border-2 border-[#800080] p-4 rounded-lg shadow flex justify-between items-center"
              >
                <span>{item.name}</span>
                <button
                  onClick={() => handleDeleteItem("ncm", item.id, fetchNcm)}
                  className="text-red-500 hover:text-red-700 transition"
                >
                  <FaTrash />
                </button>
              </li>
            ))}
            <li
              className="bg-[#800080] text-white border-2 border-[#800080] p-4 rounded-lg shadow cursor-pointer flex justify-center items-center hover:bg-[#660066] transition"
              onClick={() => {
                const newNcm = prompt("Digite o código do novo NCM");
                if (newNcm) {
                  handleAddItem("ncm", newNcm, fetchNcm);
                }
              }}
            >
              <span className="text-2xl font-bold">+</span>
            </li>
          </ul>
        </div>
        {/* Seção para exibir e adicionar Cores */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-[#800080] mb-4">Cores</h2>
          <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {cores.map((cor) => (
              <li
                key={cor.id}
                className="bg-white text-black border-2 border-[#800080] p-4 rounded-lg shadow flex justify-between items-center"
              >
                <span>{cor.name}</span>
                <button
                  onClick={() =>
                    handleDeleteItem("armacoes_cores", cor.id, fetchCores)
                  }
                  className="text-red-500 hover:text-red-700 transition"
                >
                  <FaTrash />
                </button>
              </li>
            ))}
            <li
              className="bg-[#800080] text-white border-2 border-[#800080] p-4 rounded-lg shadow cursor-pointer flex justify-center items-center hover:bg-[#660066] transition"
              onClick={() => {
                const newCor = prompt("Digite o nome da nova cor");
                if (newCor) {
                  handleAddItem("armacoes_cores", newCor, fetchCores);
                }
              }}
            >
              <span className="text-2xl font-bold">+</span>
            </li>
          </ul>
        </div>
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-[#800080] mb-4">Marcas</h2>
          <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {marcas.map((marca) => (
              <li
                key={marca.id}
                className="bg-white text-black border-2 border-[#800080] p-4 rounded-lg shadow flex justify-between items-center"
              >
                <span>{marca.name}</span>
                <button
                  onClick={() =>
                    handleDeleteItem("armacoes_marcas", marca.id, fetchMarcas)
                  }
                  className="text-red-500 hover:text-red-700 transition"
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
                  handleAddItem("armacoes_marcas", newMarca, fetchMarcas);
                }
              }}
            >
              <span className="text-2xl font-bold">+</span>
            </li>
          </ul>
        </div>

        {/* Seção para exibir e adicionar Aros */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-[#800080] mb-4">Aros</h2>
          <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {aros.map((aro) => (
              <li
                key={aro.id}
                className="bg-white text-black border-2 border-[#800080] p-4 rounded-lg shadow flex justify-between items-center"
              >
                <span>{aro.name}</span>
                <button
                  onClick={() =>
                    handleDeleteItem("armacoes_aros", aro.id, fetchAros)
                  }
                  className="text-red-500 hover:text-red-700 transition"
                >
                  <FaTrash />
                </button>
              </li>
            ))}
            <li
              className="bg-[#800080] text-white border-2 border-[#800080] p-4 rounded-lg shadow cursor-pointer flex justify-center items-center hover:bg-[#660066] transition"
              onClick={() => {
                const newAro = prompt("Digite o nome do novo aro");
                if (newAro) {
                  handleAddItem("armacoes_aros", newAro, fetchAros);
                }
              }}
            >
              <span className="text-2xl font-bold">+</span>
            </li>
          </ul>
        </div>

        {/* Seção para exibir e adicionar Unidades */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-[#800080] mb-4">
            Unidades
          </h2>
          <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {unidades.map((unidade) => (
              <li
                key={unidade.id}
                className="bg-white text-black border-2 border-[#800080] p-4 rounded-lg shadow flex justify-between items-center"
              >
                <span>{unidade.name}</span>
                <button
                  onClick={() => deleteUnidade(unidade.id)}
                  className="text-red-500 hover:text-red-700 transition"
                >
                  <FaTrash />
                </button>
              </li>
            ))}
            <li
              className="bg-[#800080] text-white border-2 border-[#800080] p-4 rounded-lg shadow cursor-pointer flex justify-center items-center hover:bg-[#660066] transition"
              onClick={addUnidade}
            >
              <span className="text-2xl font-bold">+</span>
            </li>
          </ul>
        </div>

        {/* Seção para exibir e adicionar Formatos */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-[#800080] mb-4">
            Formatos
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
                      "armacoes_formatos",
                      formato.id,
                      fetchFormatos
                    )
                  }
                  className="text-red-500 hover:text-red-700 transition"
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
                  handleAddItem("armacoes_formatos", newFormato, fetchFormatos);
                }
              }}
            >
              <span className="text-2xl font-bold">+</span>
            </li>
          </ul>
        </div>

        {/* Seção para exibir e adicionar Hastes */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-[#800080] mb-4">Hastes</h2>
          <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {hastes.map((haste) => (
              <li
                key={haste.id}
                className="bg-white text-black border-2 border-[#800080] p-4 rounded-lg shadow flex justify-between items-center"
              >
                <span>{haste.value}</span>
                <button
                  onClick={() =>
                    handleDeleteItem("armacoes_hastes", haste.id, fetchHastes)
                  }
                  className="text-red-500 hover:text-red-700 transition"
                >
                  <FaTrash />
                </button>
              </li>
            ))}
            <li
              className="bg-[#800080] text-white border-2 border-[#800080] p-4 rounded-lg shadow cursor-pointer flex justify-center items-center hover:bg-[#660066] transition"
              onClick={() => {
                const newHaste = prompt("Digite o valor da nova haste");
                if (newHaste) {
                  handleAddItem("armacoes_hastes", newHaste, fetchHastes, true); // O valor é numérico
                }
              }}
            >
              <span className="text-2xl font-bold">+</span>
            </li>
          </ul>
        </div>

        {/* Seção para exibir e adicionar Largura das Lentes */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-[#800080] mb-4">
            Largura das Lentes
          </h2>
          <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {larguraLentes.map((lente) => (
              <li
                key={lente.id}
                className="bg-white text-black border-2 border-[#800080] p-4 rounded-lg shadow flex justify-between items-center"
              >
                <span>{lente.value}</span>
                <button
                  onClick={() =>
                    handleDeleteItem(
                      "armacoes_largura_lentes",
                      lente.id,
                      fetchLarguraLentes
                    )
                  }
                  className="text-red-500 hover:text-red-700 transition"
                >
                  <FaTrash />
                </button>
              </li>
            ))}
            <li
              className="bg-[#800080] text-white border-2 border-[#800080] p-4 rounded-lg shadow cursor-pointer flex justify-center items-center hover:bg-[#660066] transition"
              onClick={() => {
                const newLente = prompt(
                  "Digite o valor da nova largura de lente"
                );
                if (newLente) {
                  handleAddItem(
                    "armacoes_largura_lentes",
                    newLente,
                    fetchLarguraLentes,
                    true
                  ); // O valor é numérico
                }
              }}
            >
              <span className="text-2xl font-bold">+</span>
            </li>
          </ul>
        </div>

        {/* Seção para exibir e adicionar Materiais */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-[#800080] mb-4">
            Materiais
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
                      "armacoes_materiais",
                      material.id,
                      fetchMateriais
                    )
                  }
                  className="text-red-500 hover:text-red-700 transition"
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
                    "armacoes_materiais",
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

        {/* Seção para exibir e adicionar Pontes */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-[#800080] mb-4">Pontes</h2>
          <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {pontes.map((ponte) => (
              <li
                key={ponte.id}
                className="bg-white text-black border-2 border-[#800080] p-4 rounded-lg shadow flex justify-between items-center"
              >
                <span>{ponte.value}</span>
                <button
                  onClick={() =>
                    handleDeleteItem("armacoes_pontes", ponte.id, fetchPontes)
                  }
                  className="text-red-500 hover:text-red-700 transition"
                >
                  <FaTrash />
                </button>
              </li>
            ))}
            <li
              className="bg-[#800080] text-white border-2 border-[#800080] p-4 rounded-lg shadow cursor-pointer flex justify-center items-center hover:bg-[#660066] transition"
              onClick={() => {
                const newPonte = prompt("Digite o valor da nova ponte");
                if (newPonte) {
                  handleAddItem("armacoes_pontes", newPonte, fetchPontes, true);
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
