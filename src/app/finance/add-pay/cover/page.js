"use client";

import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { firestore } from '../../../../lib/firebaseConfig'; // Correct
// Importando corretamente o Firestore
import Layout from "@/components/Layout"; // Importe o seu componente Layout

export default function ContasPagar() {
  const [contas, setContas] = useState([]);
  const [loading, setLoading] = useState(false);

  // Função para buscar as contas do Firestore, no estilo que você mencionou
  const fetchContas = async () => {
    try {
      setLoading(true); // Iniciar estado de carregamento
      const querySnapshot = await getDocs(collection(firestore, 'tipo_contas')); // Use firestore
      // Coletar documentos da coleção 'tipo_contas'
      const contasList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })); // Mapeando os documentos
      setContas(contasList); // Atualizar o estado com as contas
    } catch (error) {
      console.error("Erro ao buscar as contas: ", error);
    } finally {
      setLoading(false); // Finalizar estado de carregamento
    }
  };

  return (
    <Layout>
      <div className="flex h-full p-8 justify-center items-center flex-col">
        <div className="flex-1 w-full max-w-4xl">
          {/* Botões centralizados */}
          <div className="flex justify-center space-x-4 mb-6">
            <button className="px-4 py-2 bg-[#81059e] text-white rounded-md">
              REGISTRO DE CONTAS
            </button>
            <button className="px-4 py-2 bg-[#81059e] text-white rounded-md">
              LIMPAR
            </button>
            <button className="px-4 py-2 bg-[#81059e] text-white rounded-md">
              LIMPAR
            </button>
          </div>

          {/* Título centralizado */}
          <header className="text-center mb-6">
            <h2 className="text-2xl font-semibold text-[#81059e]">CONTAS A PAGAR</h2>
          </header>

          {/* Formulário */}
          <form className="bg-white p-6 rounded-lg shadow-md space-y-4 mt-6">
            <div>
              <label className="block text-[#81059e]">Nome do Credor, CPF ou CNPJ</label>
              <input
                type="text"
                className="w-full mt-1 p-2 border border-gray-300 rounded-md text-black"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[#81059e]">Código do Documento</label>
                <input
                  type="text"
                  className="w-full mt-1 p-2 border border-gray-300 rounded-md text-black"
                />
              </div>
              <div>
                <label className="block text-[#81059e]">Loja</label>
                <input
                  type="text"
                  value="Óticas Popular 1"
                  className="w-full mt-1 p-2 border border-gray-300 rounded-md text-black"
                />
              </div>
            </div>

            <div>
              <label className="block text-[#81059e]">Observações</label>
              <input
                type="text"
                className="w-full mt-1 p-2 border border-gray-300 rounded-md text-black"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[#81059e]">Conta</label>
                <div className="flex">
                  <select
                    className="w-full mt-1 p-2 border border-gray-300 rounded-md text-black"
                  >
                    {contas.length > 0 ? (
                      contas.map((conta) => (
                        <option key={conta.id} value={conta.name}>
                          {conta.name}
                        </option>
                      ))
                    ) : (
                      <option value="">Nenhuma conta encontrada</option>
                    )}
                  </select>
                  <button
                    type="button"
                    onClick={fetchContas}
                    className="ml-2 px-4 py-2 bg-[#81059e] text-white rounded-md"
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-white"></div>
                    ) : (
                      "Buscar Contas"
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[#81059e]">Caixa</label>
                <select
                  className="w-full mt-1 p-2 border border-gray-300 rounded-md text-black"
                >
                  <option value="">Selecionar</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-[#81059e]">Data da Entrada</label>
                <input
                  type="date"
                  className="w-full mt-1 p-2 border border-gray-300 rounded-md text-black"
                />
              </div>
              <div>
                <label className="block text-[#81059e]">Hora</label>
                <input
                  type="time"
                  className="w-full mt-1 p-2 border border-gray-300 rounded-md text-black"
                />
              </div>
              <div>
                <label className="block text-[#81059e]">Valor</label>
                <input
                  type="text"
                  className="w-full mt-1 p-2 border border-gray-300 rounded-md text-black"
                  placeholder="R$"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-[#81059e]">Data de Vencimento</label>
                <input
                  type="date"
                  className="w-full mt-1 p-2 border border-gray-300 rounded-md text-black"
                />
              </div>
              <div>
                <label className="block text-[#81059e]">Hora</label>
                <input
                  type="time"
                  className="w-full mt-1 p-2 border border-gray-300 rounded-md text-black"
                />
              </div>
            </div>

            <button className="mt-4 w-full bg-[#81059e] text-white py-2 rounded-md">
              REGISTRAR
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
}
