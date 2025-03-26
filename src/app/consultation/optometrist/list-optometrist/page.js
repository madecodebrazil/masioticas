'use client';
import React, { useState, useEffect } from 'react';
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { useRouter } from 'next/navigation'; // Importa o hook useRouter para navegação
import Layout from '@/components/Layout'; // Seu layout instanciado
import { app } from '@/lib/firebaseConfig'; // Certifique-se de que o Firebase está corretamente inicializado
import { FaTrash } from 'react-icons/fa'; // Ícone de lixeira

const db = getFirestore(app); // Inicializando Firestore

const ListOptometrist = () => {
  const [optometrists, setOptometrists] = useState([]); // Armazenar os optometristas
  const [isLoading, setIsLoading] = useState(true); // Estado de carregamento
  const [searchTerm, setSearchTerm] = useState(''); // Estado para busca
  const router = useRouter(); // Instancia o router para navegação

  // Função para buscar os optometristas no Firestore
  const fetchOptometrists = async () => {
    setIsLoading(true); // Inicia o estado de carregamento
    try {
      const optometristsCollection = collection(db, 'optometristas'); // Referência à coleção 'optometristas'
      const querySnapshot = await getDocs(optometristsCollection);
      const optometristsData = [];
      querySnapshot.forEach((doc) => {
        optometristsData.push({ id: doc.id, ...doc.data() }); // Armazenar os dados com o ID do documento
      });
      setOptometrists(optometristsData); // Atualiza o estado com os optometristas
    } catch (error) {
      console.error('Erro ao buscar optometristas:', error);
    } finally {
      setIsLoading(false); // Para o estado de carregamento
    }
  };

  // Função para remover optometrista
  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, 'optometristas', id)); // Remove o optometrista pelo ID
      fetchOptometrists(); // Atualiza a lista após remover
    } catch (error) {
      console.error('Erro ao remover optometrista:', error);
    }
  };

  // useEffect para buscar os optometristas quando a página carregar
  useEffect(() => {
    fetchOptometrists();
  }, []);

  // Função para filtrar os optometristas com base no termo de busca
  const filteredOptometrists = optometrists.filter(
    (optometrist) =>
      optometrist.nomeOptometrista.toLowerCase().includes(searchTerm.toLowerCase()) ||
      optometrist.registroOptometrista.includes(searchTerm)
  );

  return (
    <Layout>
      <div className="min-h-screen flex flex-col bg-gray-50">
        <div className="flex justify-between items-center p-4">
          <h2 className="text-2xl font-semibold text-[#81059e]">OPTOMETRISTAS REGISTRADOS</h2>

          {/* Campo de busca */}
          <div className="flex items-center space-x-4">
            <input
              type="text"
              placeholder="Busque por nome ou registro"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border rounded-lg px-4 py-2 border-[#81059e] focus:ring-2 focus:ring-[#81059e] text-black"
            />
            <button
              className="bg-[#81059e] text-white px-4 py-2 rounded hover:bg-[#820f76]"
              onClick={() => {
                router.push('/consultation/optometrist');
              }}
            >
              ADICIONAR
            </button>
          </div>
        </div>

        {/* Tabela de resultados */}
        <div className="p-4 overflow-x-auto">
          {isLoading ? (
            <p className="text-center text-gray-500">Carregando optometristas...</p>
          ) : (
            <table className="min-w-full bg-white rounded-lg">
              <thead>
                <tr className="bg-[#81059e] text-white">
                  <th className="py-2 px-4 text-left">Registro</th>
                  <th className="py-2 px-4 text-left">Optometrista</th>
                  <th className="py-2 px-4 text-left">Gênero</th>
                  <th className="py-2 px-4 text-left">Email</th>
                  <th className="py-2 px-4 text-left">Telefone</th>
                  <th className="py-2 px-4 text-left">Logradouro</th>
                  <th className="py-2 px-4 text-left">Bairro</th>
                  <th className="py-2 px-4 text-left">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredOptometrists.length > 0 ? (
                  filteredOptometrists.map((optometrist) => (
                    <tr key={optometrist.id} className="border-t">
                      <td className="py-2 px-4 text-black">{optometrist.registroOptometrista}</td>
                      <td className="py-2 px-4 text-black">{optometrist.nomeOptometrista}</td>
                      <td className="py-2 px-4 text-black">{optometrist.genero}</td>
                      <td className="py-2 px-4 text-black">{optometrist.email}</td>
                      <td className="py-2 px-4 text-black">{optometrist.telefone}</td>
                      <td className="py-2 px-4 text-black">{optometrist.logradouro}</td>
                      <td className="py-2 px-4 text-black">{optometrist.bairro}</td>
                      <td className="py-2 px-4">
                        <button
                          onClick={() => handleDelete(optometrist.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="text-center py-4 text-gray-500">
                      Nenhum optometrista registrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ListOptometrist;
