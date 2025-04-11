'use client'
import React, { useState, useEffect } from 'react';
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import Layout from '@/components/Layout'; // Importa seu Layout já instanciado
import { app } from '@/lib/firebaseConfig'; // Certifique-se de que o Firebase está corretamente inicializado
import { useRouter } from 'next/navigation'; // Para navegação
import { FaTrash } from 'react-icons/fa'; // Importa ícone de remover

const db = getFirestore(app); // Inicializando Firestore

const ListOphthalmologist = () => {
  const [ophthalmologists, setOphthalmologists] = useState([]); // Armazenar os oftalmologistas
  const [isLoading, setIsLoading] = useState(true); // Estado de carregamento
  const [searchTerm, setSearchTerm] = useState(''); // Estado para gerenciar a pesquisa
  const router = useRouter(); // Instancia o router para navegação

  // Função para buscar os oftalmologistas no Firestore
  const fetchOphthalmologists = async () => {
    setIsLoading(true);
    try {
      const ophthalmologistsCollection = collection(db, 'oftalmologistas');
      const querySnapshot = await getDocs(ophthalmologistsCollection);

      const ophthalmologistsData = [];
      querySnapshot.forEach((doc) => {
        ophthalmologistsData.push({ id: doc.id, ...doc.data() });
      });

      setOphthalmologists(ophthalmologistsData);
    } catch (error) {
      console.error('Erro ao buscar oftalmologistas:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOphthalmologists(); // Chama a função para buscar os oftalmologistas quando o componente é montado
  }, []);

  // Função para filtrar os resultados da busca
  const filteredOphthalmologists = ophthalmologists.filter(
    (ophthalmologist) =>
      ophthalmologist.crm.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ophthalmologist.nomeMedico.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Função para redirecionar para a página de adicionar
  const handleAdd = () => {
    router.push('/consultation/ophthalmologist');
  };

  // Função para remover um oftalmologista
  const handleRemove = async (id) => {
    try {
      await deleteDoc(doc(db, 'oftalmologistas', id));
      fetchOphthalmologists(); // Atualiza a lista após remover
    } catch (error) {
      console.error('Erro ao remover oftalmologista:', error);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen flex flex-col bg-gray-50">
        <div className="flex justify-between items-center p-4">
          <h2 className="text-2xl font-semibold text-[#81059e]">OFTALMOLOGISTAS REGISTRADOS</h2>
        </div>

        {/* Campo de busca e botão adicionar */}
        <div className="flex justify-between items-center px-4 py-2">
          <input
            type="text"
            placeholder="Busque por CRM ou nome"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border rounded-lg px-4 py-2 border-[#81059e] focus:ring-2 focus:ring-[#81059e] text-black w-1/2"
          />

          <button
            onClick={handleAdd}
            className="px-6 py-2 bg-[#81059e] text-white rounded-lg hover:bg-[#820f76] ml-4"
          >
            ADICIONAR
          </button>
        </div>

        {/* Tabela de resultados */}
        <div className="p-4 overflow-x-auto">
          {isLoading ? (
            <p className="text-center"> <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#81059e]"></div></p>
          ) : (
            <table className="min-w-full bg-white rounded-lg">
              <thead>
                <tr className="bg-[#81059e] text-white rounded-lg">
                  <th className="py-2 px-4 text-left">CRM</th>
                  <th className="py-2 px-4 text-left">Médico</th>
                  <th className="py-2 px-4 text-left">Gênero</th>
                  <th className="py-2 px-4 text-left">Email</th>
                  <th className="py-2 px-4 text-left">Logradouro</th>
                  <th className="py-2 px-4 text-left">Bairro</th>
                  <th className="py-2 px-4 text-left"></th> {/* Coluna para o botão de remover */}
                </tr>
              </thead>
              <tbody>
                {filteredOphthalmologists.length > 0 ? (
                  filteredOphthalmologists.map((ophthalmologist) => (
                    <tr key={ophthalmologist.id} className="border-t hover:bg-gray-200">
                      <td className="py-2 px-4 text-black">{ophthalmologist.crm}</td>
                      <td className="py-2 px-4 text-black">{ophthalmologist.nomeMedico}</td>
                      <td className="py-2 px-4 text-black">{ophthalmologist.genero}</td>
                      <td className="py-2 px-4 text-black">{ophthalmologist.email}</td>
                      <td className="py-2 px-4 text-black">{ophthalmologist.logradouro}</td>
                      <td className="py-2 px-4 text-black">{ophthalmologist.bairro}</td>
                      <td className="py-2 px-4">
                        <button
                          onClick={() => handleRemove(ophthalmologist.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <FaTrash size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center py-4 text-gray-500">
                      Nenhum oftalmologista registrado.
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

export default ListOphthalmologist;
