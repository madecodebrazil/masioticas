"use client";

import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { useRouter } from 'next/navigation';
import { getDocs, collection, deleteDoc, doc } from 'firebase/firestore';
import { firestore } from '../../../../lib/firebaseConfig';

const LentesRegistradas = () => {
  const [lentes, setLentes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isRemoving, setIsRemoving] = useState(false);
  const [lenteToRemove, setLenteToRemove] = useState(null);

  const router = useRouter();

  // Função para buscar as lentes de ambas as lojas
  const fetchLentes = async () => {
    try {
      setIsLoading(true);
      const loja1Snapshot = await getDocs(collection(firestore, 'loja1_lentes'));
      const loja2Snapshot = await getDocs(collection(firestore, 'loja2_lentes'));

      const loja1Lentes = loja1Snapshot.docs.map(doc => ({ id: doc.id, loja: 'Loja 1', ...doc.data() }));
      const loja2Lentes = loja2Snapshot.docs.map(doc => ({ id: doc.id, loja: 'Loja 2', ...doc.data() }));

      setLentes([...loja1Lentes, ...loja2Lentes]);
      setIsLoading(false);
    } catch (err) {
      setError('Erro ao carregar os dados das lentes.');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLentes();
  }, []);


  const confirmRemove = (lente) => {
    setLenteToRemove(lente);
  };

  // Função para agrupar lentes por título e loja
  const groupLentes = () => {
    const groupedLentes = lentes.reduce((acc, lente) => {
      const key = lente.produto;

      if (!acc[key]) {
        acc[key] = {
          produto: lente.produto,
          fabricante: lente.fabricante,
          valor: lente.valor,
          tipo: lente.tipo,
          marca: lente.marca,
          material: lente.material,
          indice: lente.indice,
          data: lente.data,
          hora: lente.hora,
          lojas: [],
        };
      }

      acc[key].lojas.push(lente.loja);
      return acc;
    }, {});

    return Object.values(groupedLentes);
  };

  // Função para remover uma lente
  const handleRemoveLente = async (produto, loja) => {
    try {
      const collectionName = loja === 'Loja 1' ? 'loja1_lentes' : 'loja2_lentes';
      const docRef = doc(firestore, collectionName, produto);

      await deleteDoc(docRef);

      setLentes((prev) => prev.filter((lente) => !(lente.produto === produto && lente.loja === loja)));
      setLenteToRemove(null);
    } catch (err) {
      console.error('Erro ao remover a lente:', err);
    }
  };

  // Renderizar as linhas da tabela
  const renderTableRows = () => {
    const groupedLentes = groupLentes();

    return groupedLentes.map((lente) => {
      const lojas = lente.lojas.join(', ');
      return (
        <tr key={lente.produto} className="border-t border-gray-300">
          <td className="p-2 sm:p-4 text-black">{lojas}</td>
          <td className="p-2 sm:p-4 text-black">{lente.produto}</td>
          <td className="p-2 sm:p-4 text-black">{lente.data}</td>
          <td className="p-2 sm:p-4 text-black">{lente.hora}</td>
          <td className="p-2 sm:p-4 text-black">{lente.fabricante}</td>
          <td className="p-2 sm:p-4 text-black">R${lente.valor}</td>
          <td className="p-2 sm:p-4 text-black">{lente.tipo}</td>
          <td className="p-2 sm:p-4 text-black">{lente.marca}</td>
          <td className="p-2 sm:p-4 text-black">{lente.material}</td>
          <td className="p-2 sm:p-4 text-black">{lente.indice}</td>
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
    });
  };

  if (isLoading) {
    return <div className="text-center text-xl text-[#800080]">Carregando dados...</div>;
  }

  if (error) {
    return <div className="text-center text-xl text-red-600">{error}</div>;
  }

  return (
    <Layout>
      <div className="p-4 sm:p-6">
        <h1 className="text-2xl font-bold text-[#800080] mb-4">LENTES REGISTRADAS</h1>
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
              onClick={() => router.push('/products_and_services/lenses/add.lente')}
            >
              ADICIONAR
            </button>

            <button
              className={`${isRemoving ? 'bg-yellow-500' : 'bg-red-600'
                } text-white font-bold py-2 px-6 rounded-lg w-full sm:w-auto`}
              onClick={() => setIsRemoving(!isRemoving)}
            >
              {isRemoving ? 'CANCELAR REMOÇÃO' : 'REMOVER'}
            </button>
          </div>
        </div>

        {/* Tabela com scroll horizontal para dispositivos móveis */}
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
                {isRemoving && <th className="p-2 sm:p-4 text-black">Ações</th>}
              </tr>
            </thead>
            <tbody>{renderTableRows()}</tbody>
          </table>
        </div>

        {/* Pop-up de confirmação de remoção */}
        {lenteToRemove && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
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
