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
import { firestore } from "../../../lib/firebaseConfig";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";

const LentesRegistradas = () => {
  const [lentes, setLentes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [lenteToRemove, setLenteToRemove] = useState(null);
  const [selectedLente, setSelectedLente] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editedLente, setEditedLente] = useState(null);
  const [newImage, setNewImage] = useState(null);
  const [fetchedTratamentos, setFetchedTratamentos] = useState([]);
  const [fetchedRecursos, setFetchedRecursos] = useState([]);

  const router = useRouter();
  const storage = getStorage();

  const availableTratamentos = ["Anti-reflexo", "UV", "Blue Cut", "Polarizada"];
  const availableRecursos = ["Fotossensível", "Transitions", "High-Index"];

  const fetchLentes = async () => {
    try {
      setIsLoading(true);
      const loja1Snapshot = await getDocs(collection(firestore, "loja1_lentes"));
      const loja2Snapshot = await getDocs(collection(firestore, "loja2_lentes"));

      const loja1Lentes = loja1Snapshot.docs.map((doc) => ({
        id: doc.id,
        loja: "Loja 1",
        ...doc.data(),
      }));
      const loja2Lentes = loja2Snapshot.docs.map((doc) => ({
        id: doc.id,
        loja: "Loja 2",
        ...doc.data(),
      }));

      console.log("loja1_lentes encontrados:", loja1Lentes);
      console.log("loja2_lentes encontrados:", loja2Lentes);

      const allLentes = [...loja1Lentes, ...loja2Lentes];
      console.log("Todas as lentes combinadas:", allLentes);

      if (allLentes.length === 0) {
        console.log("Nenhuma lente encontrada no Firestore.");
      }

      setLentes(allLentes);
      setIsLoading(false);
    } catch (err) {
      console.error("Erro ao carregar dados das lentes:", err);
      setError("Erro ao carregar os dados das lentes.");
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLentes();
  }, []);
  const fetchTratamentos = async () => {
    try {
      const snap = await getDocs(collection(firestore, "lentes_tratamentos"));
      const lista = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setFetchedTratamentos(lista);
    } catch (error) {
      console.error("Erro ao carregar tratamentos:", error);
    }
  };
  const fetchRecursos = async () => {
    try {
      const snap = await getDocs(collection(firestore, "lentes_tecnologias"));
      const lista = snap.docs.map(d => ({ id: d.name, ...d.data() }));
      setFetchedRecursos(lista);
    } catch (error) {
      console.error("Erro ao carregar recursos:", error);
    }
  };
  useEffect(() => {
    fetchTratamentos();
    fetchRecursos();
  }, []);

  const confirmRemove = (lente) => {
    setLenteToRemove(lente);
  };

  const groupLentes = () => {
    const groupedLentes = lentes.reduce((acc, lente) => {
      const key = lente.produto || lente.id || ("lente-" + lente.id);

      const tratamentos = Array.isArray(lente.tratamentos)
        ? lente.tratamentos
        : Array.isArray(lente.tipoTratamento)
        ? lente.tipoTratamento
        : [];
      const recursos = Array.isArray(lente.recursos)
        ? lente.recursos
        : Array.isArray(lente.tecnologia)
        ? lente.tecnologia
        : [];

      if (!acc[key]) {
        acc[key] = {
          produto: lente.produto || `Lente ${lente.id}`,
          fabricante: lente.fabricante || "",
          valor: lente.valor ? parseFloat(lente.valor) : 0,
          tipo: Array.isArray(lente.tipo)
            ? lente.tipo
            : lente.tipo
            ? [lente.tipo]
            : [],
          marca: lente.marca || "",
          material: lente.material || "",
          indice: lente.indice || "",
          data: lente.data || "",
          hora: lente.hora || "",
          imagem: lente.imagem || "",
          lojas: [],
          tratamentos,
          recursos,
          ids: {},
        };
      }

      acc[key].lojas.push(lente.loja);
      acc[key].ids[lente.loja] = lente.id;
      return acc;
    }, {});

    const result = Object.values(groupedLentes);
    console.log("Lentes agrupadas:", result);
    return result;
  };

  const handleRemoveLente = async (produto, loja) => {
    try {
      const collectionName = loja === "Loja 1" ? "loja1_lentes" : "loja2_lentes";
      const docRef = doc(firestore, collectionName, produto);

      console.log(`Removendo lente: produto=${produto}, loja=${loja}`);
      await deleteDoc(docRef);
      setLentes((prev) =>
        prev.filter(
          (lente) => !(lente.produto === produto && lente.loja === loja)
        )
      );
      setLenteToRemove(null);
    } catch (err) {
      console.error("Erro ao remover a lente:", err);
    }
  };

  const handleLenteClick = (lente) => {
    console.log("Lente clicada:", lente);
    setSelectedLente(lente);
    setEditedLente({ ...lente });
    setEditMode(false);
    setNewImage(null);
  };

  const handleEditClick = () => {
    console.log("Entrando no modo de edição da lente:", selectedLente);
    setEditMode(true);
  };

  const handleInputChange = (field, value) => {
    setEditedLente((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (e) => {
    if (e.target.files[0]) {
      console.log("Nova imagem selecionada:", e.target.files[0].name);
      setNewImage(e.target.files[0]);
    }
  };

  const handleTratamentoChange = (tratamento) => {
    const current = editedLente.tratamentos || [];
    if (current.includes(tratamento)) {
      setEditedLente((prev) => ({
        ...prev,
        tratamentos: current.filter((t) => t !== tratamento),
      }));
    } else {
      setEditedLente((prev) => ({
        ...prev,
        tratamentos: [...current, tratamento],
      }));
    }
  };

  const handleRecursoChange = (recurso) => {
    const current = editedLente.recursos || [];
    if (current.includes(recurso)) {
      setEditedLente((prev) => ({
        ...prev,
        recursos: current.filter((r) => r !== recurso),
      }));
    } else {
      setEditedLente((prev) => ({
        ...prev,
        recursos: [...current, recurso],
      }));
    }
  };

  const handleSaveChanges = async () => {
    if (!selectedLente || !selectedLente.lojas || selectedLente.lojas.length === 0) {
      console.error("Não é possível salvar as alterações, nenhuma loja encontrada para esta lente.");
      return;
    }

    const collectionName =
      selectedLente.lojas[0] === "Loja 1" ? "loja1_lentes" : "loja2_lentes";
    const firstLoja = selectedLente.lojas[0];
    const docId = selectedLente.ids[firstLoja];

    console.log("Salvando alterações para a lente:", docId, "na coleção:", collectionName);

    try {
      const docRef = doc(firestore, collectionName, docId);

      if (newImage) {
        const imageRef = ref(storage, `images/${newImage.name}`);
        await uploadBytes(imageRef, newImage);
        const imageUrl = await getDownloadURL(imageRef);
        editedLente.imagem = imageUrl;
        console.log("Imagem atualizada:", imageUrl);
      }

      await updateDoc(docRef, editedLente);
      console.log("Lente atualizada com sucesso no Firestore.");

      setLentes((prevLentes) =>
        prevLentes.map((lente) => {
          if (lente.id === docId) {
            return { ...lente, ...editedLente };
          }
          return lente;
        })
      );

      setSelectedLente(editedLente);
      setEditMode(false);
      setNewImage(null);
    } catch (error) {
      console.error("Erro ao salvar as alterações:", error);
    }
  };

  const handleClone = () => {
    if (selectedLente && selectedLente.lojas && selectedLente.lojas.length > 0) {
      setSelectedLente(null);
      const firstLoja = selectedLente.lojas[0];
      const cloneId = selectedLente.ids[firstLoja];

      console.log("Clonando lente:", cloneId, "da loja:", firstLoja);
      router.push(
        `/products_and_services/lenses/add-lense?cloneId=${encodeURIComponent(
          cloneId
        )}&loja=${encodeURIComponent(firstLoja)}`
      );
    }
  };

  const groupedLentes = groupLentes();

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
          LENTES REGISTRADAS
        </h1>
        <div className="flex justify-end mb-4">
          <button
            className="bg-[#932A83] text-white py-2 px-4 rounded-lg"
            onClick={() =>
              router.push("/products_and_services/lenses/add-lense")
            }
          >
            Adicionar Nova Lente
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-gray-200 text-left">
                <th className="p-2 sm:p-4 text-black">Lojas</th>
                <th className="p-2 sm:p-4 text-black">Título</th>
                <th className="p-2 sm:p-4 text-black">Data</th>
                <th className="p-2 sm:p-4 text-black">Hora</th>
                <th className="p-2 sm:p-4 text-black">Fábrica</th>
                <th className="p-2 sm:p-4 text-black">Preço</th>
                <th className="p-2 sm:p-4 text-black">Tipo</th>
                <th className="p-2 sm:p-4 text-black">Marca</th>
                <th className="p-2 sm:p-4 text-black">Material</th>
                <th className="p-2 sm:p-4 text-black">Índice</th>
                <th className="p-2 sm:p-4 text-black">Tratamentos</th>
                <th className="p-2 sm:p-4 text-black">Recursos</th>
                {isRemoving && <th className="p-2 sm:p-4 text-black">Ações</th>}
              </tr>
            </thead>
            <tbody>
              {groupedLentes.length === 0 ? (
                <tr>
                  <td colSpan={12} className="p-4 text-center text-[#800080]">
                    Nenhuma lente encontrada.
                  </td>
                </tr>
              ) : (
                groupedLentes.map((lente) => {
                  const lojas = lente.lojas.join(", ");
                  const tratamentos =
                    lente.tratamentos.length > 0
                      ? lente.tratamentos.join(", ")
                      : "Nenhum";
                  const recursos =
                    lente.recursos.length > 0
                      ? lente.recursos.join(", ")
                      : "Nenhum";

                  return (
                    <tr key={lente.produto} className="border-t border-gray-300">
                      <td className="p-2 sm:p-4 text-black">{lojas}</td>
                      <td className="p-2 sm:p-4 text-black">
                        <button
                          onClick={() => handleLenteClick(lente)}
                          className="text-[#932A83] underline"
                        >
                          {lente.produto}
                        </button>
                      </td>
                      <td className="p-2 sm:p-4 text-black">{lente.data || ""}</td>
                      <td className="p-2 sm:p-4 text-black">{lente.hora || ""}</td>
                      <td className="p-2 sm:p-4 text-black">{lente.fabricante || ""}</td>
                      <td className="p-2 sm:p-4 text-black">R${lente.valor || 0}</td>
                      <td className="p-2 sm:p-4 text-black">
                        {Array.isArray(lente.tipo) && lente.tipo.length > 0
                          ? lente.tipo.join(", ")
                          : lente.tipo || ""}
                      </td>
                      <td className="p-2 sm:p-4 text-black">{lente.marca || ""}</td>
                      <td className="p-2 sm:p-4 text-black">{lente.material || ""}</td>
                      <td className="p-2 sm:p-4 text-black">{lente.indice || ""}</td>
                      <td className="p-2 sm:p-4 text-black">{tratamentos}</td>
                      <td className="p-2 sm:p-4 text-black">{recursos}</td>
                      {isRemoving && (
                        <td className="p-2 sm:p-4 text-black">
                          {lente.lojas.map((loja) => (
                            <button
                              key={`${lente.produto}-${loja}`}
                              onClick={() => confirmRemove({ produto: lente.produto, loja })}
                              className="text-red-600"
                            >
                              🗑️ {loja}
                            </button>
                          ))}
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {selectedLente && (
          <div className="fixed inset-0 bg-gray-700 bg-opacity-80 flex items-center justify-center z-50">
            <div className="bg-white p-4 md:p-6 rounded-lg shadow-lg max-w-full sm:max-w-md md:max-w-lg lg:max-w-2xl w-full mx-2 overflow-y-auto max-h-full">
            {editMode ? (
  <div className="space-y-6">
    <h2 className="text-lg font-bold text-[#932A83] mb-4">
      Editar Lente
    </h2>
    {/* Informações Básicas */}
    <div>
      <label className="block font-bold text-[#932A83] mb-1">Produto</label>
      <input
        type="text"
        value={editedLente.produto}
        onChange={(e) => handleInputChange("produto", e.target.value)}
        className="border p-2 rounded w-full text-black"
      />
    </div>
    <div>
      <label className="block font-bold text-[#932A83] mb-1">Valor (R$)</label>
      <input
        type="number"
        value={editedLente.valor}
        onChange={(e) => handleInputChange("valor", e.target.value)}
        className="border p-2 rounded w-full text-black"
      />
    </div>
    <div>
      <label className="block font-bold text-[#932A83] mb-1">Fabricante</label>
      <input
        type="text"
        value={editedLente.fabricante}
        onChange={(e) => handleInputChange("fabricante", e.target.value)}
        className="border p-2 rounded w-full text-black"
      />
    </div>
    <div>
      <label className="block font-bold text-[#932A83] mb-1">Tipo (separar por vírgulas)</label>
      <input
        type="text"
        value={
          Array.isArray(editedLente.tipo)
            ? editedLente.tipo.join(", ")
            : editedLente.tipo
        }
        onChange={(e) =>
          handleInputChange(
            "tipo",
            e.target.value.split(",").map((t) => t.trim())
          )
        }
        className="border p-2 rounded w-full text-black"
      />
    </div>
    <div>
      <label className="block font-bold text-[#932A83] mb-1">Marca</label>
      <input
        type="text"
        value={editedLente.marca}
        onChange={(e) => handleInputChange("marca", e.target.value)}
        className="border p-2 rounded w-full text-black"
      />
    </div>
    <div>
      <label className="block font-bold text-[#932A83] mb-1">Material</label>
      <input
        type="text"
        value={editedLente.material}
        onChange={(e) => handleInputChange("material", e.target.value)}
        className="border p-2 rounded w-full text-black"
      />
    </div>
    <div>
      <label className="block font-bold text-[#932A83] mb-1">Índice</label>
      <input
        type="text"
        value={editedLente.indice}
        onChange={(e) => handleInputChange("indice", e.target.value)}
        className="border p-2 rounded w-full text-black"
      />
    </div>
    <div className="flex space-x-2">
      <div className="flex-1">
        <label className="block font-bold text-[#932A83] mb-1">Data</label>
        <input
          type="date"
          value={editedLente.data}
          onChange={(e) => handleInputChange("data", e.target.value)}
          className="border p-2 rounded w-full text-black"
        />
      </div>
      <div className="flex-1">
        <label className="block font-bold text-[#932A83] mb-1">Hora</label>
        <input
          type="time"
          value={editedLente.hora}
          onChange={(e) => handleInputChange("hora", e.target.value)}
          className="border p-2 rounded w-full text-black"
        />
      </div>
    </div>

    {/* Tratamentos do Firestore */}
    <div>
      <label className="block font-bold text-[#932A83] mb-2">Tratamentos</label>
      <div className="flex flex-wrap gap-2">
        {fetchedTratamentos.map((t) => (
          <label
            key={t.name}
            className="flex items-center space-x-1 text-sm text-black"
          >
            <input
              type="checkbox"
              checked={editedLente.tratamentos.includes(t.name)}
              onChange={() => handleTratamentoChange(t.name)}
            />
            <span>{t.name || t.name}</span>
          </label>
        ))}
      </div>
    </div>

    {/* Recursos (Tecnologias) do Firestore */}
    <div>
      <label className="block font-bold text-[#932A83] mb-2">Recursos</label>
      <div className="flex flex-wrap gap-2">
        {fetchedRecursos.map((r) => (
          <label
            key={r.name}
            className="flex items-center space-x-1 text-sm text-black"
          >
            <input
              type="checkbox"
              checked={editedLente.recursos.includes(r.name)}
              onChange={() => handleRecursoChange(r.name)}
            />
            <span>{r.name || r.id}</span>
          </label>
        ))}
      </div>
    </div>

    {/* Imagem */}
    <div>
      <label className="block font-bold text-[#932A83] mb-1">Imagem</label>
      <input
        type="file"
        onChange={handleImageUpload}
        className="border p-2 rounded w-full text-black"
      />
      {!newImage && editedLente.imagem && (
        <img
          src={editedLente.imagem}
          alt={`Imagem da lente ${editedLente.produto}`}
          className="mt-2 w-full max-h-40 object-contain rounded-md"
        />
      )}
      {newImage && (
        <p className="text-xs text-gray-500 mt-2">
          Nova imagem selecionada: {newImage.name}
        </p>
      )}
    </div>

    <div className="mt-8 flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-4">
      <button
        className="bg-green-500 text-white py-2 px-4 rounded-lg w-full sm:w-auto text-sm md:text-base"
        onClick={handleSaveChanges}
      >
        Salvar
      </button>
      <button
        className="bg-gray-500 text-white py-2 px-4 rounded-lg w-full sm:w-auto text-sm md:text-base"
        onClick={() => setEditMode(false)}
      >
        Cancelar
      </button>
    </div>
  </div>
) : (
  <div className="space-y-6">
    <h2 className="text-lg font-bold text-[#932A83] mb-4">
      Detalhes da Lente
    </h2>
    <p className="text-black"><strong>Produto:</strong> {selectedLente.produto}</p>
    <p className="text-black"><strong>Valor:</strong> R${selectedLente.valor}</p>
    <p className="text-black"><strong>Fabricante:</strong> {selectedLente.fabricante}</p>
    <p className="text-black"><strong>Tipo:</strong> {Array.isArray(selectedLente.tipo) ? selectedLente.tipo.join(", ") : selectedLente.tipo}</p>
    <p className="text-black"><strong>Marca:</strong> {selectedLente.marca}</p>
    <p className="text-black"><strong>Material:</strong> {selectedLente.material}</p>
    <p className="text-black"><strong>Índice:</strong> {selectedLente.indice}</p>
    <p className="text-black"><strong>Data:</strong> {selectedLente.data}</p>
    <p className="text-black"><strong>Hora:</strong> {selectedLente.hora}</p>
    <p className="text-black"><strong>Tratamentos:</strong> {selectedLente.tratamentos.length > 0 ? selectedLente.tratamentos.join(", ") : "Nenhum"}</p>
    <p className="text-black"><strong>Recursos:</strong> {selectedLente.recursos.length > 0 ? selectedLente.recursos.join(", ") : "Nenhum"}</p>
    {selectedLente.imagem && (
      <img
        src={selectedLente.imagem}
        alt={`Imagem da lente ${selectedLente.produto}`}
        className="mt-2 w-full max-h-40 object-contain rounded-md"
      />
    )}
    <div className="mt-8 flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-4">
      <button
        className="bg-blue-500 text-white py-2 px-4 rounded-lg w-full sm:w-auto text-sm md:text-base"
        onClick={handleEditClick}
      >
        Editar
      </button>
      <button
        className="bg-yellow-500 text-white py-2 px-4 rounded-lg w-full sm:w-auto text-sm md:text-base"
        onClick={handleClone}
      >
        Clonar
      </button>
      <button
        className="bg-gray-500 text-white py-2 px-4 rounded-lg w-full sm:w-auto text-sm md:text-base"
        onClick={() => setSelectedLente(null)}
      >
        Fechar
      </button>
    </div>
  </div>
)}
            </div>
          </div>
        )}

        {lenteToRemove && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h2 className="text-xl font-bold mb-4">Confirmação</h2>
              <p>Tem certeza de que deseja remover esta lente?</p>
              <div className="mt-4 flex space-x-4">
                <button
                  className="bg-red-600 text-white font-bold py-2 px-4 rounded-lg"
                  onClick={() => handleRemoveLente(lenteToRemove.produto, lenteToRemove.loja)}
                >
                  Sim, remover
                </button>
                <button
                  className="bg-gray-400 text-white font-bold py-2 px-4 rounded-lg"
                  onClick={() => setLenteToRemove(null)}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default LentesRegistradas;
