"use client";
import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { getDocs, collection, deleteDoc, doc } from 'firebase/firestore'; // Importa deleteDoc e doc
import { firestore } from '../../../lib/firebaseConfig';
import { useRouter } from 'next/navigation';
import { FaFilter, FaTrashAlt } from 'react-icons/fa'; // Importa o ícone de funil e lixeira

export default function AvariasRegistradas() {
  const [avarias, setAvarias] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterLoja, setFilterLoja] = useState("");
  const [filterTipoAvaria, setFilterTipoAvaria] = useState("");
  const [filterData, setFilterData] = useState("");
  const [showFilter, setShowFilter] = useState(false); // Estado para mostrar ou ocultar o menu de filtro
  const router = useRouter();

  // Função para buscar avarias nas coleções criadas
  const fetchAvarias = async () => {
    try {
      setIsLoading(true);

      // Buscar avarias em armacoes_avariadas
      const armacoesQuerySnapshot = await getDocs(collection(firestore, 'avarias/armacoes_avariadas/items'));
      const armacoesAvarias = armacoesQuerySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), tipo: 'Armação' }));

      // Buscar avarias em lentes_avariadas
      const lentesQuerySnapshot = await getDocs(collection(firestore, 'avarias/lentes_avariadas/items'));
      const lentesAvarias = lentesQuerySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), tipo: 'Lentes' }));

      // Buscar avarias em solares_avariadas
      const solaresQuerySnapshot = await getDocs(collection(firestore, 'avarias/solares_avariadas/items'));
      const solaresAvarias = solaresQuerySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), tipo: 'Óculos de Sol' }));

      // Combinar todos os resultados de avarias
      const combinedAvarias = [...armacoesAvarias, ...lentesAvarias, ...solaresAvarias];
      setAvarias(combinedAvarias);
      setIsLoading(false);
    } catch (error) {
      console.error('Erro ao carregar as avarias:', error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAvarias();
  }, []);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value.toLowerCase());
  };

  // Função para deletar avaria
  const handleDelete = async (id, tipo) => {
    try {
      let collectionPath = '';

      // Define o caminho da coleção com base no tipo de avaria
      if (tipo === 'Armação') {
        collectionPath = 'avarias/armacoes_avariadas/items';
      } else if (tipo === 'Lentes') {
        collectionPath = 'avarias/lentes_avariadas/items';
      } else if (tipo === 'Óculos de Sol') {
        collectionPath = 'avarias/solares_avariadas/items';
      }

      // Apaga o documento no Firestore
      await deleteDoc(doc(firestore, collectionPath, id));

      // Atualiza o estado após a remoção
      setAvarias(prevAvarias => prevAvarias.filter(avaria => avaria.id !== id));
      alert('Avaria removida com sucesso!');
    } catch (error) {
      console.error('Erro ao remover a avaria:', error);
    }
  };

  // Função para aplicar os filtros
  const filteredAvarias = avarias.filter((avaria) => {
    return (
      (avaria.produto.toLowerCase().includes(searchTerm) ||
        avaria.nomeProduto?.toLowerCase().includes(searchTerm) ||
        avaria.codigo?.toLowerCase().includes(searchTerm)) &&
      (filterLoja ? avaria.loja === filterLoja : true) &&
      (filterTipoAvaria ? avaria.tipoAvaria === filterTipoAvaria : true) &&
      (filterData ? avaria.data === filterData : true)
    );
  });

  if (isLoading) {
    return <div>Carregando dados...</div>;
  }

  return (
    <Layout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold" style={{ color: '#81059e' }}>AVARIAS REGISTRADAS</h1>
          <button
            className="text-white font-bold px-4 py-2 rounded-lg"
            style={{ backgroundColor: '#81059e' }} // Mudança da cor para #81059e
            onClick={() => router.push('/stock/breakdown/add-breakdown')}
          >
            ADICIONAR
          </button>
        </div>

        {/* Barra de busca e botão de filtro */}
        <div className="flex space-x-4 mb-4">
          <input
            type="text"
            placeholder="Busque por código ou título"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            value={searchTerm}
            onChange={handleSearch}
          />
          <button
            className="text-white px-4 py-2 rounded-lg flex items-center"
            style={{ backgroundColor: '#81059e' }} // Mudança da cor para #81059e
            onClick={() => setShowFilter(!showFilter)}
          >
            <FaFilter className="mr-2" /> {/* Ícone de funil */}
            Filtrar por
          </button>
        </div>

        {/* Filtros - mostrados quando showFilter é true */}
        {showFilter && (
          <div className="bg-gray-200 p-4 rounded-lg mb-4">
            <div className="grid grid-cols-3 gap-4">
              {/* Filtro por Loja */}
              <div>
                <label className="block text-sm font-bold mb-2">Filtrar por Loja</label>
                <select
                  value={filterLoja}
                  onChange={(e) => setFilterLoja(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Todas</option>
                  <option value="Loja 1">Loja 1</option>
                  <option value="Loja 2">Loja 2</option>
                </select>
              </div>

              {/* Filtro por Tipo de Avaria */}
              <div>
                <label className="block text-sm font-bold mb-2">Filtrar por Tipo de Avaria</label>
                <select
                  value={filterTipoAvaria}
                  onChange={(e) => setFilterTipoAvaria(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Todos</option>
                  <option value="Desbotando">Desbotando</option>
                  <option value="Descascando">Descascando</option>
                  <option value="Fissuras">Fissuras</option>
                  <option value="Oxidado">Oxidado</option>
                </select>
              </div>

              {/* Filtro por Data */}
              <div>
                <label className="block text-sm font-bold mb-2">Filtrar por Data</label>
                <input
                  type="date"
                  value={filterData}
                  onChange={(e) => setFilterData(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tabela de resultados */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead style={{ backgroundColor: '#e0e0e0' }}>
              <tr>
                <th className="px-4 py-2 text-left text-black">NCM</th>
                <th className="px-4 py-2 text-left text-black">Nome do Produto</th>
                <th className="px-4 py-2 text-left text-black">Produto</th>
                <th className="px-4 py-2 text-left text-black">Tipo de Avaria</th>
                <th className="px-4 py-2 text-left text-black">Descrição</th>
                <th className="px-4 py-2 text-left text-black">Data</th>
                <th className="px-4 py-2 text-left text-black">Loja</th>
                <th className="px-4 py-2 text-left text-black">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredAvarias.length > 0 ? (
                filteredAvarias.map((avaria, index) => (
                  <tr key={index} className="border-t">
                    <td className="px-4 py-2 text-black">{avaria.NCM}</td>
                    <td className="px-4 py-2 text-black">{avaria.nomeProduto}</td>
                    <td className="px-4 py-2 text-black">{avaria.produto}</td>
                    <td className="px-4 py-2 text-black">{avaria.tipoAvaria}</td>
                    <td className="px-4 py-2 text-black">{avaria.descricao}</td>
                    <td className="px-4 py-2 text-black">{avaria.data}</td>
                    <td className="px-4 py-2 text-black">{avaria.loja}</td>
                    <td className="px-4 py-2 text-black">
                      <button
                        className="text-red-600 hover:text-red-800"
                        onClick={() => handleDelete(avaria.id, avaria.tipo)}
                      >
                        <FaTrashAlt />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="text-center py-4 text-black">
                    Nenhuma avaria registrada encontrada.
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
