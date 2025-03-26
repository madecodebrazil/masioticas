"use client";

import React, { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { useRouter } from "next/navigation";
import {
  getDocs,
  collection,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { firestore, storage } from "../../../lib/firebaseConfig";
import {
  ref as firebaseStorageRef,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";

const ArmacoesRegistradas = () => {
  const [armacoes, setArmacoes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isRemoving, setIsRemoving] = useState(false);
  const [armacaoToRemove, setArmacaoToRemove] = useState(null);
  const [selectedArmacao, setSelectedArmacao] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    codigo: "",
    valor: "",
    data: "",
    hora: "",
    cor: "",
    marca: "",
    material: "",
    genero: "",
    imagem: "",
  });
  const [newImageFile, setNewImageFile] = useState(null);
  const [newImagePreview, setNewImagePreview] = useState(null);

  const router = useRouter();

  // Função para buscar as armações de ambas as lojas
  const fetchArmacoes = async () => {
    try {
      setIsLoading(true);
      const loja1Snapshot = await getDocs(
        collection(firestore, "loja1_armacoes")
      );
      const loja2Snapshot = await getDocs(
        collection(firestore, "loja2_armacoes")
      );

      const loja1Armacoes = loja1Snapshot.docs.map((doc) => ({
        id: doc.id,
        loja: "Loja 1",
        ...doc.data(),
      }));
      const loja2Armacoes = loja2Snapshot.docs.map((doc) => ({
        id: doc.id,
        loja: "Loja 2",
        ...doc.data(),
      }));

      const combinedArmacoes = [...loja1Armacoes, ...loja2Armacoes];
      console.log("Armações carregadas:", combinedArmacoes);
      setArmacoes(combinedArmacoes);
      setIsLoading(false);
    } catch (err) {
      console.error("Erro ao carregar as armações:", err);
      setError("Erro ao carregar os dados das armações.");
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchArmacoes();
  }, []);

  // Função para filtrar as armações com base no termo de busca
  const filterArmacoes = () => {
    return armacoes.filter((armacao) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        (armacao.codigo &&
          armacao.codigo.toLowerCase().includes(searchLower)) ||
        (armacao.cor && armacao.cor.toLowerCase().includes(searchLower)) ||
        (armacao.marca && armacao.marca.toLowerCase().includes(searchLower)) ||
        (armacao.data && armacao.data.includes(searchLower))
      );
    });
  };

  // Função para remover uma armação
  const handleRemoveArmacao = async (id, loja) => {
    try {
      console.log("Tentando remover armação com ID:", id, "da loja:", loja);

      const collectionName =
        loja === "Loja 1" ? "loja1_armacoes" : "loja2_armacoes";

      await deleteDoc(doc(firestore, collectionName, id));
      console.log("Documento deletado com sucesso:", id);

      // Atualiza a lista de armações após a exclusão
      setArmacoes((prev) => prev.filter((armacao) => armacao.id !== id));
      setArmacaoToRemove(null);
    } catch (err) {
      console.error("Erro ao remover a armação:", err);
    }
  };

  // Função para exibir o pop-up de confirmação de exclusão
  const confirmRemove = (armacao) => {
    setArmacaoToRemove(armacao);
  };

  // Função para abrir o modal exibindo detalhes da armação
  const openModal = (armacao) => {
    setSelectedArmacao(armacao);
    setFormData({
      codigo: armacao.codigo || "",
      valor: armacao.valor || "",
      data: armacao.data || "",
      hora: armacao.hora || "",
      cor: armacao.cor || "",
      marca: armacao.marca || "",
      material: armacao.material || "",
      genero: armacao.genero || "",
      imagem: armacao.imagem || "",
    });
    setNewImageFile(null);
    setNewImagePreview(null);
    setIsEditing(false);
  };

  // Função para fechar o modal
  const closeModal = () => {
    setSelectedArmacao(null);
  };

  // Função para lidar com a mudança nos inputs
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Função para lidar com a seleção de uma nova imagem
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewImageFile(file);
      setNewImagePreview(URL.createObjectURL(file));
    }
  };

  // Função para atualizar a armação
  const handleUpdateArmacao = async (e) => {
    e.preventDefault();

    try {
      let imagem = formData.imagem;

      if (newImageFile) {
        // Upload da nova imagem para o Firebase Storage
        const storageRef = firebaseStorageRef(
          storage,
          `armacoes/${selectedArmacao.id}/${newImageFile.name}`
        );
        await uploadBytes(storageRef, newImageFile);
        imagem = await getDownloadURL(storageRef);
      }

      // Atualiza o documento no Firestore
      const docRef = doc(
        firestore,
        selectedArmacao.loja === "Loja 1"
          ? "loja1_armacoes"
          : "loja2_armacoes",
        selectedArmacao.id
      );
      await updateDoc(docRef, {
        ...formData,
        imagem,
      });

      // Atualiza o estado armacoes
      setArmacoes((prev) =>
        prev.map((armacao) =>
          armacao.id === selectedArmacao.id
            ? { ...armacao, ...formData, imagem }
            : armacao
        )
      );

      closeModal();
    } catch (err) {
      console.error("Erro ao atualizar a armação:", err);
    }
  };

  // Função para clonar a armação, passando dados via URL
  const handleClone = () => {
    if (selectedArmacao) {
      // Fecha o modal
      closeModal();
      // Redireciona para a página de criação com os parâmetros cloneId e loja
      router.push(
        `/products_and_services/frames/add-frame?cloneId=${selectedArmacao.id}&loja=${encodeURIComponent(
          selectedArmacao.loja
        )}`
      );
    }
  };

  // Renderiza as linhas da tabela
  const renderTableRows = () => {
    const filteredArmacoes = filterArmacoes();

    return filteredArmacoes.map((armacao) => {
      return (
        <tr
          key={`${armacao.loja}-${armacao.id}`} // Chave única
          className="border-t border-gray-300 cursor-pointer hover:bg-gray-100"
          onClick={() => openModal(armacao)}
        >
          <td className="p-2 sm:p-4 text-black">{armacao.codigo}</td>
          <td className="p-2 sm:p-4 text-black">{armacao.valor}</td>
          <td className="p-2 sm:p-4 text-black">{armacao.data}</td>
          <td className="p-2 sm:p-4 text-black">{armacao.hora}</td>
          <td className="p-2 sm:p-4 text-black">{armacao.cor}</td>
          <td className="p-2 sm:p-4 text-black">{armacao.marca}</td>
          <td className="p-2 sm:p-4 text-black">{armacao.material}</td>
          <td className="p-2 sm:p-4 text-black">{armacao.genero}</td>
          <td className="p-2 sm:p-4 text-black">
            <div className="flex items-center justify-between">
              <span>{armacao.loja}</span>
              {isRemoving && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    confirmRemove(armacao);
                  }}
                  className="text-red-600"
                >
                  🗑️
                </button>
              )}
            </div>
          </td>
        </tr>
      );
    });
  };

  if (isLoading) {
    return (
      <div className="text-center text-xl text-[#800080]">
        Carregando dados...
      </div>
    );
  }

  if (error) {
    return <div className="text-center text-xl text-red-600">{error}</div>;
  }

  return (
    <Layout>
      <div className="p-4 sm:p-6">
        <h1 className="text-2xl font-bold text-[#800080] mb-4">
          ARMAÇÕES REGISTRADAS
        </h1>
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 space-y-4 sm:space-y-0">
          <input
            type="text"
            placeholder="Busque por código, título, cor ou data"
            className="border-2 border-gray-300 rounded-lg px-4 py-2 w-full sm:w-1/3 text-black"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="flex space-x-4">
            <button
              className="bg-[#81059e] text-white font-bold py-2 px-6 rounded-lg w-full sm:w-auto"
              onClick={() =>
                router.push("/products_and_services/frames/add-frame")
              }
            >
              ADICIONAR
            </button>

            <button
              className={`${isRemoving ? "bg-yellow-500" : "bg-red-600"
                } text-white font-bold py-2 px-6 rounded-lg w-full sm:w-auto`}
              onClick={() => setIsRemoving(!isRemoving)}
            >
              {isRemoving ? "CANCELAR REMOÇÃO" : "REMOVER"}
            </button>
          </div>
        </div>

        {/* Tabela com scroll horizontal para dispositivos móveis */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-gray-200 text-left">
                <th className="p-2 sm:p-4 text-black">Código</th>
                <th className="p-2 sm:p-4 text-black">Preço</th>
                <th className="p-2 sm:p-4 text-black">Data</th>
                <th className="p-2 sm:p-4 text-black">Hora</th>
                <th className="p-2 sm:p-4 text-black">Cor</th>
                <th className="p-2 sm:p-4 text-black">Marca</th>
                <th className="p-2 sm:p-4 text-black">Material</th>
                <th className="p-2 sm:p-4 text-black">Gênero</th>
                <th className="p-2 sm:p-4 text-black">Loja</th>
              </tr>
            </thead>
            <tbody>{renderTableRows()}</tbody>
          </table>
        </div>

        {/* Pop-up de confirmação de remoção */}
        {armacaoToRemove && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h2 className="text-xl font-bold mb-4">Confirmação</h2>
              <p>
                Tem certeza de que deseja remover esta armação da{" "}
                {armacaoToRemove.loja}?
              </p>
              <div className="mt-4 flex space-x-4">
                <button
                  className="bg-red-600 text-white font-bold py-2 px-4 rounded-lg"
                  onClick={() =>
                    handleRemoveArmacao(
                      armacaoToRemove.id,
                      armacaoToRemove.loja
                    )
                  }
                >
                  Sim, remover
                </button>
                <button
                  className="bg-gray-400 text-white font-bold py-2 px-4 rounded-lg"
                  onClick={() => setArmacaoToRemove(null)}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de visualização e edição */}
        {selectedArmacao && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-start justify-center pt-24">
            {" "}
            {/* Alterei `pt-24` para aumentar o espaçamento superior */}
            <div className="bg-white p-4 sm:p-6 md:p-8 rounded-lg shadow-lg w-full max-w-xs sm:max-w-md md:max-w-lg lg:max-w-2xl overflow-y-auto max-h-[90vh]">
              {isEditing ? (
                <>
                  <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-4 text-purple-900 text-center sm:text-left">
                    Editar Armação
                  </h2>
                  <form onSubmit={handleUpdateArmacao}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="col-span-1">
                        <label className="block text-xs md:text-sm font-medium text-red-700">
                          Código
                        </label>
                        <input
                          type="text"
                          name="codigo"
                          value={formData.codigo}
                          onChange={handleInputChange}
                          className="mt-1 text-black block w-full border-gray-300 rounded-md shadow-sm"
                        />
                      </div>
                      <div className="col-span-1">
                        <label className="block text-xs md:text-sm font-medium text-red-700">
                          Preço
                        </label>
                        <input
                          type="text"
                          name="valor"
                          value={formData.valor}
                          onChange={handleInputChange}
                          className="text-black mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                        />
                      </div>
                      <div className="col-span-1">
                        <label className="block text-xs md:text-sm font-medium text-red-700">
                          Data
                        </label>
                        <input
                          type="date"
                          name="data"
                          value={formData.data}
                          onChange={handleInputChange}
                          className="text-black mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                        />
                      </div>
                      <div className="col-span-1">
                        <label className="block text-xs md:text-sm font-medium text-red-700">
                          Hora
                        </label>
                        <input
                          type="time"
                          name="hora"
                          value={formData.hora}
                          onChange={handleInputChange}
                          className="text-black mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                        />
                      </div>
                      <div className="col-span-1">
                        <label className="block text-xs md:text-sm font-medium text-red-700">
                          Cor
                        </label>
                        <input
                          type="text"
                          name="cor"
                          value={formData.cor}
                          onChange={handleInputChange}
                          className="text-black mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                        />
                      </div>
                      <div className="col-span-1">
                        <label className="block text-xs md:text-sm font-medium text-red-700">
                          Marca
                        </label>
                        <input
                          type="text"
                          name="marca"
                          value={formData.marca}
                          onChange={handleInputChange}
                          className="text-black mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                        />
                      </div>
                      <div className="col-span-1">
                        <label className="block text-xs md:text-sm font-medium text-red-700">
                          Material
                        </label>
                        <input
                          type="text"
                          name="material"
                          value={formData.material}
                          onChange={handleInputChange}
                          className="text-black mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                        />
                      </div>
                      <div className="col-span-1">
                        <label className="block text-xs md:text-sm font-medium text-red-700">
                          Gênero
                        </label>
                        <input
                          type="text"
                          name="genero"
                          value={formData.genero}
                          onChange={handleInputChange}
                          className="text-black mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                        />
                      </div>
                      <div className="col-span-1 md:col-span-2">
                        <label className="block text-xs md:text-sm font-medium text-red-700">
                          Imagem
                        </label>
                        <div className="mt-2 flex justify-center">
                          {newImagePreview ? (
                            <img
                              src={newImagePreview}
                              alt="Nova Imagem"
                              className="h-auto w-full md:max-w-md object-contain rounded-md"
                            />
                          ) : formData.imagem ? (
                            <img
                              src={formData.imagem}
                              alt="Imagem Atual"
                              className="h-auto w-full md:max-w-md object-contain rounded-md"
                            />
                          ) : (
                            <div className="h-48 w-full md:max-w-md bg-gray-200 flex items-center justify-center rounded-md">
                              Sem Imagem
                            </div>
                          )}
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="mt-2 block w-full text-sm"
                        />
                        <p className="mt-1 text-xs text-gray-700">
                          Nenhum ficheiro selecionado
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4">
                      <button
                        type="submit"
                        className="bg-green-600 text-white font-bold py-2 px-4 rounded-lg w-full md:w-auto"
                      >
                        Salvar
                      </button>
                      <button
                        type="button"
                        className="bg-gray-400 text-white font-bold py-2 px-4 rounded-lg w-full md:w-auto"
                        onClick={() => setIsEditing(false)}
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <>
                  <h2 className="text-xl text-purple-900 font-bold mb-4">
                    Detalhes da Armação
                  </h2>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <span className="text-purple-700 font-semibold">
                        Código:
                      </span>{" "}
                      <span className="text-black">
                        {selectedArmacao.codigo}
                      </span>
                    </div>
                    <div>
                      <span className="text-purple-700 font-semibold">
                        Preço:
                      </span>{" "}
                      <span className="text-black">
                        {selectedArmacao.valor}
                      </span>
                    </div>
                    <div>
                      <span className="text-purple-700 font-semibold">
                        Data:
                      </span>{" "}
                      <span className="text-black">
                        {selectedArmacao.data}
                      </span>
                    </div>
                    <div>
                      <span className="text-purple-700 font-semibold">
                        Hora:
                      </span>{" "}
                      <span className="text-black">
                        {selectedArmacao.hora}
                      </span>
                    </div>
                    <div>
                      <span className="text-purple-700 font-semibold">
                        Cor:
                      </span>{" "}
                      <span className="text-black">
                        {selectedArmacao.cor}
                      </span>
                    </div>
                    <div>
                      <span className="text-purple-700 font-semibold">
                        Marca:
                      </span>{" "}
                      <span className="text-black">
                        {selectedArmacao.marca}
                      </span>
                    </div>
                    <div>
                      <span className="text-purple-700 font-semibold">
                        Material:
                      </span>{" "}
                      <span className="text-black">
                        {selectedArmacao.material}
                      </span>
                    </div>
                    <div>
                      <span className="text-purple-700 font-semibold">
                        Gênero:
                      </span>{" "}
                      <span className="text-black">
                        {selectedArmacao.genero}
                      </span>
                    </div>
                    <div>
                      <span className="text-purple-700 font-semibold">
                        Imagem:
                      </span>
                      {selectedArmacao.imagem ? (
                        <img
                          src={selectedArmacao.imagem}
                          alt="Imagem da Armação"
                          className="h-32 w-32 object-cover mt-2"
                        />
                      ) : (
                        <div className="h-32 w-32 bg-gray-200 flex items-center justify-center mt-2">
                          Sem Imagem
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4">
                    <button
                      onClick={() => setIsEditing(true)}
                      className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg w-full md:w-auto"
                    >
                      Editar
                    </button>
                    <button
                      onClick={handleClone}
                      className="bg-yellow-500 text-white font-bold py-2 px-4 rounded-lg w-full md:w-auto"
                    >
                      Clonar
                    </button>
                    <button
                      onClick={closeModal}
                      className="bg-gray-400 text-white font-bold py-2 px-4 rounded-lg w-full md:w-auto"
                    >
                      Fechar
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ArmacoesRegistradas;
