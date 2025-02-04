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
import { firestore, storage } from "../../../../lib/firebaseConfig";
import {
  ref as firebaseStorageRef,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";

const SolaresRegistrados = () => {
  const [solares, setSolares] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isRemoving, setIsRemoving] = useState(false);
  const [solarToRemove, setSolarToRemove] = useState(null);
  const [selectedSolar, setSelectedSolar] = useState(null);
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

  // Função para buscar os solares de ambas as lojas
  const fetchSolares = async () => {
    try {
      setIsLoading(true);
      const loja1Snapshot = await getDocs(
        collection(firestore, "loja1_solares")
      );
      const loja2Snapshot = await getDocs(
        collection(firestore, "loja2_solares")
      );

      const loja1Solares = loja1Snapshot.docs.map((doc) => ({
        id: doc.id,
        loja: "Loja 1",
        ...doc.data(),
      }));
      const loja2Solares = loja2Snapshot.docs.map((doc) => ({
        id: doc.id,
        loja: "Loja 2",
        ...doc.data(),
      }));

      const combinedSolares = [...loja1Solares, ...loja2Solares];
      console.log("Solares carregados:", combinedSolares);
      setSolares(combinedSolares);
      setIsLoading(false);
    } catch (err) {
      console.error("Erro ao carregar os solares:", err);
      setError("Erro ao carregar os dados dos solares.");
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSolares();
  }, []);

  // Função para filtrar os solares com base no termo de busca
  const filterSolares = () => {
    return solares.filter((solar) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        (solar.codigo && solar.codigo.toLowerCase().includes(searchLower)) ||
        (solar.cor && solar.cor.toLowerCase().includes(searchLower)) ||
        (solar.marca && solar.marca.toLowerCase().includes(searchLower)) ||
        (solar.data && solar.data.includes(searchLower))
      );
    });
  };

  // Função para remover um solar em uma loja específica
  const handleRemoveSolar = async (id, loja) => {
    try {
      console.log("Tentando remover solar com ID:", id, "da loja:", loja);

      const collectionName =
        loja === "Loja 1" ? "loja1_solares" : "loja2_solares";

      await deleteDoc(doc(firestore, collectionName, id));
      console.log("Documento deletado com sucesso:", id);

      // Atualiza a lista de solares após a exclusão
      setSolares((prev) => prev.filter((solar) => solar.id !== id));
      setSolarToRemove(null);
    } catch (err) {
      console.error("Erro ao remover o solar:", err);
    }
  };

  // Função para exibir o pop-up de confirmação de exclusão
  const confirmRemove = (solar) => {
    setSolarToRemove(solar);
  };

  // Função para abrir o modal exibindo detalhes do solar
  const openModal = (solar) => {
    setSelectedSolar(solar);
    setFormData({
      codigo: solar.codigo || "",
      valor: solar.valor || "",
      data: solar.data || "",
      hora: solar.hora || "",
      cor: solar.cor || "",
      marca: solar.marca || "",
      material: solar.material || "",
      genero: solar.genero || "",
      imagem: solar.imagem || "",
    });
    setNewImageFile(null);
    setNewImagePreview(null);
    setIsEditing(false);
  };

  // Função para fechar o modal
  const closeModal = () => {
    setSelectedSolar(null);
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

  // Função para atualizar o solar
  const handleUpdateSolar = async (e) => {
    e.preventDefault();

    try {
      let imagem = formData.imagem;

      if (newImageFile) {
        // Upload da nova imagem para o Firebase Storage
        const storageRef = firebaseStorageRef(
          storage,
          `solares/${selectedSolar.id}/${newImageFile.name}`
        );
        await uploadBytes(storageRef, newImageFile);
        imagem = await getDownloadURL(storageRef);
      }

      // Atualiza o documento no Firestore
      const docRef = doc(
        firestore,
        selectedSolar.loja === "Loja 1" ? "loja1_solares" : "loja2_solares",
        selectedSolar.id
      );
      await updateDoc(docRef, {
        ...formData,
        imagem,
      });

      // Atualiza o estado solares
      setSolares((prev) =>
        prev.map((solar) =>
          solar.id === selectedSolar.id
            ? { ...solar, ...formData, imagem }
            : solar
        )
      );

      closeModal();
    } catch (err) {
      console.error("Erro ao atualizar o solar:", err);
    }
  };

  // Função para clonar o solar
  const handleClone = () => {
    if (selectedSolar) {
      // Fecha o modal
      closeModal();
      // Redireciona para a página de criação com os parâmetros cloneId e loja
      router.push(
        `/products_and_services/solar?cloneId=${selectedSolar.id}&loja=${encodeURIComponent(
          selectedSolar.loja
        )}`
      );
    }
  };

  // Renderiza as linhas da tabela
  const renderTableRows = () => {
    const filteredSolares = filterSolares();

    return filteredSolares.map((solar) => (
      <tr
        key={`${solar.loja}-${solar.id}`}
        className="border-t border-gray-300 cursor-pointer hover:bg-gray-100"
        onClick={() => openModal(solar)}
      >
        <td className="p-2 sm:p-4 text-black">{solar.codigo}</td>
        <td className="p-2 sm:p-4 text-black">{solar.valor}</td>
        <td className="p-2 sm:p-4 text-black">{solar.data}</td>
        <td className="p-2 sm:p-4 text-black">{solar.hora}</td>
        <td className="p-2 sm:p-4 text-black">{solar.cor}</td>
        <td className="p-2 sm:p-4 text-black">{solar.marca}</td>
        <td className="p-2 sm:p-4 text-black">{solar.material}</td>
        <td className="p-2 sm:p-4 text-black">{solar.genero}</td>
        <td className="p-2 sm:p-4 text-black">
          <div className="flex items-center justify-between">
            <span>{solar.loja}</span>
            {isRemoving && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  confirmRemove(solar);
                }}
                className="text-red-600"
              >
                🗑️
              </button>
            )}
          </div>
        </td>
      </tr>
    ));
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
          SOLARES REGISTRADOS
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
              className="bg-[#932A83] text-white font-bold py-2 px-6 rounded-lg w-full sm:w-auto"
              onClick={() => router.push("/products_and_services/solar")}
            >
              ADICIONAR
            </button>

            <button
              className={`${
                isRemoving ? "bg-yellow-500" : "bg-red-600"
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
        {solarToRemove && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h2 className="text-xl font-bold mb-4 text-black">Confirmação</h2>
              <p className="text-black">
                Tem certeza de que deseja remover este solar da{" "}
                {solarToRemove.loja}?
              </p>
              <div className="mt-4 flex space-x-4">
                <button
                  className="bg-red-600 text-white font-bold py-2 px-4 rounded-lg"
                  onClick={() =>
                    handleRemoveSolar(solarToRemove.id, solarToRemove.loja)
                  }
                >
                  Sim, remover
                </button>
                <button
                  className="bg-gray-400 text-white font-bold py-2 px-4 rounded-lg"
                  onClick={() => setSolarToRemove(null)}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de visualização e edição */}
        {selectedSolar && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-4 md:p-5 rounded-lg shadow-lg max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg w-full mx-2 overflow-y-auto max-h-[80vh]">
              {isEditing ? (
                <>
                  {/* Formulário de edição */}
                  <form onSubmit={handleUpdateSolar}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-black block text-xs sm:text-sm font-medium text-gray-700">
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
                      <div>
                        <label className="text-black block text-xs sm:text-sm font-medium text-gray-700">
                          Preço
                        </label>
                        <input
                          type="text"
                          name="valor"
                          value={formData.valor}
                          onChange={handleInputChange}
                          className="mt-1 text-black block w-full border-gray-300 rounded-md shadow-sm"
                        />
                      </div>
                      <div>
                        <label className="text-black block text-xs sm:text-sm font-medium text-gray-700">
                          Data
                        </label>
                        <input
                          type="text"
                          name="data"
                          value={formData.data}
                          onChange={handleInputChange}
                          className="mt-1 text-black block w-full border-gray-300 rounded-md shadow-sm"
                        />
                      </div>
                      <div>
                        <label className="text-black block text-xs sm:text-sm font-medium text-gray-700">
                          Hora
                        </label>
                        <input
                          type="text"
                          name="hora"
                          value={formData.hora}
                          onChange={handleInputChange}
                          className="mt-1 text-black block w-full border-gray-300 rounded-md shadow-sm"
                        />
                      </div>
                      <div>
                        <label className="text-black block text-xs sm:text-sm font-medium text-gray-700">
                          Cor
                        </label>
                        <input
                          type="text"
                          name="cor"
                          value={formData.cor}
                          onChange={handleInputChange}
                          className="mt-1 text-black block w-full border-gray-300 rounded-md shadow-sm"
                        />
                      </div>
                      <div>
                        <label className="text-black block text-xs sm:text-sm font-medium text-gray-700">
                          Marca
                        </label>
                        <input
                          type="text"
                          name="marca"
                          value={formData.marca}
                          onChange={handleInputChange}
                          className="mt-1 text-black block w-full border-gray-300 rounded-md shadow-sm"
                        />
                      </div>
                      <div>
                        <label className="text-black block text-xs sm:text-sm font-medium text-gray-700">
                          Material
                        </label>
                        <input
                          type="text"
                          name="material"
                          value={formData.material}
                          onChange={handleInputChange}
                          className="mt-1 text-black block w-full border-gray-300 rounded-md shadow-sm"
                        />
                      </div>
                      <div>
                        <label className="text-black block text-xs sm:text-sm font-medium text-gray-700">
                          Gênero
                        </label>
                        <input
                          type="text"
                          name="genero"
                          value={formData.genero}
                          onChange={handleInputChange}
                          className="mt-1 text-black block w-full border-gray-300 rounded-md shadow-sm"
                        />
                      </div>
                      <div className="col-span-1 md:col-span-2">
                        <label className="text-black block text-xs sm:text-sm font-medium text-gray-700">
                          Imagem
                        </label>
                        <div className="mt-2 flex justify-center">
                          {newImagePreview ? (
                            <img
                              src={newImagePreview}
                              alt="Nova Imagem"
                              className="h-32 w-32 object-cover rounded-md"
                            />
                          ) : formData.imagem ? (
                            <img
                              src={formData.imagem}
                              alt="Imagem Atual"
                              className="h-32 w-32 object-cover rounded-md"
                            />
                          ) : (
                            <div className="h-32 w-32 bg-gray-200 flex items-center justify-center rounded-md">
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
                      </div>
                    </div>
                    <div className="mt-6 flex flex-col space-y-2">
                      <button
                        type="submit"
                        className="bg-green-600 text-white font-bold py-2 px-4 rounded-lg w-full"
                      >
                        Salvar
                      </button>
                      <button
                        type="button"
                        className="bg-gray-400 text-white font-bold py-2 px-4 rounded-lg w-full"
                        onClick={() => setIsEditing(false)}
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <>
                  <h2 className="text-lg text-purple-700 font-bold mb-4">
                    Detalhes do Solar
                  </h2>
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <span className="text-purple-700 font-semibold">
                        Código:
                      </span>{" "}
                      <span className="text-black">{selectedSolar.codigo}</span>
                    </div>
                    <div>
                      <span className="text-purple-700 font-semibold">
                        Preço:
                      </span>{" "}
                      <span className="text-black">{selectedSolar.valor}</span>
                    </div>
                    <div>
                      <span className="text-purple-700 font-semibold">
                        Data:
                      </span>{" "}
                      <span className="text-black">{selectedSolar.data}</span>
                    </div>
                    <div>
                      <span className="text-purple-700 font-semibold">
                        Hora:
                      </span>{" "}
                      <span className="text-black">{selectedSolar.hora}</span>
                    </div>
                    <div>
                      <span className="text-purple-700 font-semibold">
                        Cor:
                      </span>{" "}
                      <span className="text-black">{selectedSolar.cor}</span>
                    </div>
                    <div>
                      <span className="text-purple-700 font-semibold">
                        Marca:
                      </span>{" "}
                      <span className="text-black">{selectedSolar.marca}</span>
                    </div>
                    <div>
                      <span className="text-purple-700 font-semibold">
                        Material:
                      </span>{" "}
                      <span className="text-black">
                        {selectedSolar.material}
                      </span>
                    </div>
                    <div>
                      <span className="text-purple-700 font-semibold">
                        Gênero:
                      </span>{" "}
                      <span className="text-black">{selectedSolar.genero}</span>
                    </div>
                    <div>
                      <span className="text-purple-700 font-semibold">
                        Imagem:
                      </span>
                      {selectedSolar.imagem ? (
                        <img
                          src={selectedSolar.imagem}
                          alt="Imagem do Solar"
                          className="h-32 w-32 object-cover mt-2"
                        />
                      ) : (
                        <div className="h-32 w-32 bg-gray-200 flex items-center justify-center mt-2">
                          Sem Imagem
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 flex space-x-2">
                    <button
                      onClick={() => setIsEditing(true)}
                      className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg w-full"
                    >
                      Editar
                    </button>
                    <button
                      onClick={handleClone}
                      className="bg-yellow-500 text-white font-bold py-2 px-4 rounded-lg w-full"
                    >
                      Clonar
                    </button>
                    <button
                      onClick={closeModal}
                      className="bg-gray-400 text-white font-bold py-2 px-4 rounded-lg w-full"
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

export default SolaresRegistrados;
  