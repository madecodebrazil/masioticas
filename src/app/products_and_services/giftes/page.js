'use client';
import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { useRouter } from 'next/navigation';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

export default function ExibirBrindes() {
  const [giftes, setGiftes] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredGiftes, setFilteredGiftes] = useState([]);
  const db = getFirestore();
  const router = useRouter();

  useEffect(() => {
    const fetchGiftes = async () => {
      const giftesCollection = collection(db, 'giftes');
      const giftesSnapshot = await getDocs(giftesCollection);
      const giftesList = giftesSnapshot.docs.map(doc => doc.data());
      setGiftes(giftesList);
      setFilteredGiftes(giftesList);
    };
    fetchGiftes();
  }, []);

  useEffect(() => {
    const lowerCaseQuery = searchQuery.toLowerCase();
    const filteredResults = giftes.filter(
      (brinde) =>
        (brinde.nomeCliente && brinde.nomeCliente.toLowerCase().includes(lowerCaseQuery)) ||
        (brinde.sku && brinde.sku.toLowerCase().includes(lowerCaseQuery))
    );
    setFilteredGiftes(filteredResults);
  }, [searchQuery, giftes]);

  // Função para redirecionar para a página de adicionar brinde
  const handleAddGift = () => {
    router.push('/products_and_services/giftes/add-gift');
  };

  return (
    <Layout>
      <div className="container mx-auto p-4 bg-white rounded-lg shadow">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between pb-4">
          <div className="text-lg font-bold text-[#81059e]">BRINDES DOS CLIENTES</div>
          <button
            onClick={handleAddGift}
            className="bg-[#81059e] text-white px-4 py-2 rounded-md hover:bg-[#781e6a]"
          >
            ADICIONAR BRINDE
          </button>
        </div>

        {/* Barra de busca */}
        <div className="flex items-center mt-4">
          <input
            type="text"
            placeholder="Busque por SKU ou nome"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full p-2 border border-[#81059e] rounded-l-md focus:outline-none text-black"
          />
        </div>

        {/* Tabela de Brindes */}
        <div className="mt-6">
          <table className="min-w-full table-auto border-collapse">
            <thead>
              <tr className="text-left text-black border-b border-black">
                <th className="px-4 py-2">SKU</th>
                <th className="px-4 py-2">Nome</th>
                <th className="px-4 py-2">Produto</th>
                <th className="px-4 py-2">Descrição</th>
                <th className="px-4 py-2">Data</th>
                <th className="px-4 py-2">Loja</th>
              </tr>
            </thead>
            <tbody>
              {filteredGiftes.length > 0 ? (
                filteredGiftes.map((brinde, index) => (
                  <tr key={index} className="text-black">
                    <td className="border-t px-4 py-2 border-[#81059e]">{brinde.sku}</td>
                    <td className="border-t px-4 py-2 border-[#81059e]">{brinde.nomeCliente}</td>
                    <td className="border-t px-4 py-2 border-[#81059e]">{brinde.produtoComprado}</td>
                    <td className="border-t px-4 py-2 border-[#81059e]">{brinde.descricaoBrinde}</td>
                    <td className="border-t px-4 py-2 border-[#81059e]">{brinde.dataBrinde}</td>
                    <td className="border-t px-4 py-2 border-[#81059e]">{brinde.loja}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-4 text-black">
                    Nenhum brinde encontrado
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
