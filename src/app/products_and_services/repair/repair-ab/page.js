"use client";
import React, { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { collection, getDocs, addDoc } from "firebase/firestore";
import { firestore } from "@/lib/firebaseConfig";
import { useRouter } from "next/navigation"; // Importa o useRouter para navegação

export default function ManageRepairs() {
  const router = useRouter(); // Definindo o useRouter para navegação
  const [repairTypes, setRepairTypes] = useState([]);
  const [prestadores, setPrestadores] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchRepairTypes();
    fetchPrestadores();
  }, []);

  // Função para buscar tipos de reparo da coleção "reparo_tipos"
  const fetchRepairTypes = async () => {
    try {
      const snapshot = await getDocs(collection(firestore, "reparo_tipos"));
      const types = snapshot.docs.map((doc) => ({ id: doc.id, name: doc.data().name }));
      setRepairTypes(types);
    } catch (error) {
      console.error("Erro ao buscar tipos de reparo: ", error);
    }
  };

  // Função para buscar prestadores da coleção "reparo_prestador"
  const fetchPrestadores = async () => {
    try {
      const snapshot = await getDocs(collection(firestore, "reparo_prestador"));
      const prestadoresData = snapshot.docs.map((doc) => ({ id: doc.id, name: doc.data().name }));
      setPrestadores(prestadoresData);
    } catch (error) {
      console.error("Erro ao buscar prestadores: ", error);
    }
  };

  // Função para adicionar um novo tipo de reparo
  const addNewItem = async (collectionName) => {
    if (collectionName === "reparo_prestador") {
      // Redireciona para a rota products_and_services/service_provider quando o + de prestadores é clicado
      router.push("/products_and_services/service_provider");
      return;
    }

    // Para os tipos de reparo, mantém o comportamento original de adicionar diretamente via prompt
    const newItem = prompt("Digite o nome do novo tipo de reparo");
    if (!newItem) return;

    setIsLoading(true);
    try {
      await addDoc(collection(firestore, collectionName), { name: newItem });
      fetchRepairTypes(); // Atualiza a lista de tipos de reparo
    } catch (error) {
      console.error(`Erro ao adicionar tipo de reparo:`, error);
    }
    setIsLoading(false);
  };

  return (
    <Layout>
      <div className="p-6">
        <h1 className="text-2xl font-bold" style={{ color: "#81059e" }}>
          Gerenciar Tipos de Reparo e Prestadores
        </h1>

        {/* Seção de Tipos de Reparo */}
        <div className="mt-6">
          <h2 className="text-lg font-bold" style={{ color: "#81059e87" }}>Tipos de Reparo</h2>
          <div className="flex flex-wrap gap-2 mt-2">
            {repairTypes.map((type) => (
              <button
                key={type.id}
                className="px-4 py-2 border rounded-lg border-[#81059e] text-black hover:bg-[#81059e] hover:text-white"
              >
                {type.name}
              </button>
            ))}
            <button
              onClick={() => addNewItem("reparo_tipos")} // Adiciona diretamente um tipo de reparo
              className="px-4 py-2 bg-[#81059e] text-white font-bold rounded-lg"
              disabled={isLoading}
            >
              {isLoading ? "..." : "+"}
            </button>
          </div>
        </div>

        {/* Seção de Prestadores */}
        <div className="mt-6">
          <h2 className="text-lg font-bold" style={{ color: "#81059e87" }}>Prestadores</h2>
          <div className="flex flex-wrap gap-2 mt-2">
            {prestadores.map((prestador) => (
              <button
                key={prestador.id}
                className="px-4 py-2 border rounded-lg border-[#81059e] text-black hover:bg-[#81059e] hover:text-white"
              >
                {prestador.name}
              </button>
            ))}
            <button
              onClick={() => addNewItem("reparo_prestador")} // Agora redireciona para outra página
              className="px-4 py-2 bg-[#81059e] text-white font-bold rounded-lg"
              disabled={isLoading}
            >
              {isLoading ? "..." : "+"}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
