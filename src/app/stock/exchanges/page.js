"use client";
import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { getDocs, collection } from 'firebase/firestore';
import { firestore } from '../../../lib/firebaseConfig';
import { useRouter } from 'next/navigation';

export default function TrocasRegistradas() {
  const [trocas, setTrocas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();

  // Função para buscar as trocas na coleção "/exchanges"
  const fetchTrocas = async () => {
    try {
      setIsLoading(true);

      // Buscar trocas na coleção exchanges
      const querySnapshot = await getDocs(collection(firestore, 'exchanges'));
      const fetchedTrocas = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      setTrocas(fetchedTrocas);
      setIsLoading(false);
    } catch (error) {
      console.error('Erro ao carregar as trocas:', error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTrocas();
  }, []);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value.toLowerCase());
  };

  // Filtro de trocas baseado na busca
  const filteredTrocas = trocas.filter((troca) => {
    return (
      troca.produto.toLowerCase().includes(searchTerm) ||
      troca.nomeCliente?.toLowerCase().includes(searchTerm) ||
      troca.NCM?.toLowerCase().includes(searchTerm)
    );
  });

  if (isLoading) {
    return <div>Carregando dados...</div>;
  }

  return (
    <Layout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold" style={{ color: '#81059e' }}>TROCAS REGISTRADAS</h1>
          <button
            className="bg-[#81059e] text-white font-bold px-4 py-2 rounded-lg"
            onClick={() => router.push('/stock/exchanges/add-exchange')}
          >
            ADICIONAR
          </button>
        </div>

        {/* Barra de busca */}
        <div className="flex space-x-4 mb-4">
          <input
            type="text"
            placeholder="Busque por NCM ou nome do cliente"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            value={searchTerm}
            onChange={handleSearch}
          />
          <button className="text-white px-4 py-2 rounded-lg" style={{ backgroundColor: '#81059e' }}>
            Buscar
          </button>
        </div>

        {/* Tabela de resultados */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead style={{ backgroundColor: '#e0e0e0' }}>
              <tr>
                <th className="px-4 py-2 text-left text-black">NCM</th>
                <th className="px-4 py-2 text-left text-black">Nome</th>
                <th className="px-4 py-2 text-left text-black">Produto</th>
                <th className="px-4 py-2 text-left text-black">Motivo</th>
                <th className="px-4 py-2 text-left text-black">Status</th>
                <th className="px-4 py-2 text-left text-black">Data</th>
              </tr>
            </thead>
            <tbody>
              {filteredTrocas.length > 0 ? (
                filteredTrocas.map((troca, index) => (
                  <tr key={index} className="border-t">
                    <td className="px-4 py-2 text-black">{troca.NCM}</td>
                    <td className="px-4 py-2 text-black">{troca.nomeCliente}</td>
                    <td className="px-4 py-2 text-black">{troca.produto}</td>
                    <td className="px-4 py-2 text-black">{troca.motivo}</td>
                    <td className="px-4 py-2 text-black">{troca.status}</td>
                    <td className="px-4 py-2 text-black">{troca.data}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-4 text-black">
                    Nenhuma troca registrada encontrada.
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
