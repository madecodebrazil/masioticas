"use client";
import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { useRouter } from 'next/navigation';
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { firestore } from '../../../../lib/firebaseConfig';
import { FaTrash } from 'react-icons/fa'; // Importa o ícone de lixeira

export default function ListAssemblies() {
  const router = useRouter();
  const [assemblies, setAssemblies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchAssemblies();
  }, []);

  const fetchAssemblies = async () => {
    try {
      setIsLoading(true);
      console.log("Fetching assemblies..."); // Log para indicar que a busca está começando
      const loja1Snapshot = await getDocs(collection(firestore, 'montagens', 'loja1', 'dados'));
      const loja2Snapshot = await getDocs(collection(firestore, 'montagens', 'loja2', 'dados'));

      const assembliesData = [];

      // Percorre cada loja e suas montagens
      loja1Snapshot.forEach((doc) => {
        const data = doc.data();
        assembliesData.push({ ...data, id: doc.id, loja: 'Óticas Popular 1' }); // Adiciona a loja e ID
      });

      loja2Snapshot.forEach((doc) => {
        const data = doc.data();
        assembliesData.push({ ...data, id: doc.id, loja: 'Óticas Popular 2' }); // Adiciona a loja e ID
      });

      console.log("Assemblies Data:", assembliesData); // Adicione esse log para depuração

      setAssemblies(assembliesData);
      setIsLoading(false);
    } catch (error) {
      console.error('Erro ao carregar montagens:', error);
      setIsLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value.toLowerCase());
  };

  const filteredAssemblies = assemblies.filter((assembly) => {
    return (
      assembly.nomeCliente?.toLowerCase().includes(searchTerm) ||
      assembly.produto?.toLowerCase().includes(searchTerm) ||
      assembly.prestador?.toLowerCase().includes(searchTerm) // Adiciona busca por prestador
    );
  });

  const handleDelete = async (id, lojaNome) => {
    // Mapeamento dos nomes das lojas para os IDs corretos
    const lojaIdMap = {
      'Óticas Popular 1': 'loja1',
      'Óticas Popular 2': 'loja2'
    };

    // Obtém o ID correto da loja
    const lojaId = lojaIdMap[lojaNome];

    if (!lojaId) {
      console.error('Loja não encontrada no mapeamento:', lojaNome);
      return;
    }

    console.log(`Deleting assembly with ID: ${id} from store: ${lojaId}`); // Log para verificação dos IDs
    if (window.confirm("Você tem certeza que deseja remover esta montagem?")) {
      try {
        const docRef = doc(firestore, 'montagens', lojaId, 'dados', id); // Usando o ID correto da loja
        console.log(`Document reference to delete: ${docRef.path}`); // Verifica o caminho do documento

        // Remove o documento usando o ID correto
        await deleteDoc(docRef);
        console.log(`Successfully deleted assembly with ID: ${id}`); // Log de sucesso

        // Atualiza o estado local removendo o item deletado
        setAssemblies((prevAssemblies) => prevAssemblies.filter(assembly => assembly.id !== id));
      } catch (error) {
        console.error('Erro ao remover montagem:', error);
      }
    }
  };

  if (isLoading) {
    return <div>Carregando dados...</div>;
  }

  return (
    <Layout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold" style={{ color: '#81059e' }}>LISTA DE MONTAGENS</h1>
          <button
            className="bg-[#81059e] text-white font-bold px-4 py-2 rounded-lg"
            onClick={() => router.push('/stock/assembly')}
          >
            ADICIONAR MONTAGEM
          </button>
        </div>

        <div className="text-black flex space-x-4 mb-4">
          <input
            type="text"
            placeholder="Busque por cliente, produto ou prestador"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead style={{ backgroundColor: '#e0e0e0' }}>
              <tr>
                <th className="px-4 py-2 text-left text-black">Nome do Cliente</th>
                <th className="px-4 py-2 text-left text-black">Produto</th>
                <th className="px-4 py-2 text-left text-black">Tipo de Serviço</th>
                <th className="px-4 py-2 text-left text-black">Prestador</th>
                <th className="px-4 py-2 text-left text-black">Valor</th>
                <th className="px-4 py-2 text-left text-black">Data</th>
                <th className="px-4 py-2 text-left text-black">Loja</th>
                <th className="px-4 py-2 text-left text-black">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredAssemblies.length > 0 ? (
                filteredAssemblies.map((assembly, index) => (
                  <tr key={index} className="border-t">
                    <td className="px-4 py-2 text-black">{assembly.nomeCliente}</td>
                    <td className="px-4 py-2 text-black">{assembly.produto}</td>
                    <td className="px-4 py-2 text-black">{assembly.tipo}</td>
                    <td className="px-4 py-2 text-black">{assembly.prestador}</td>
                    <td className="px-4 py-2 text-black">R${assembly.valor}</td>
                    <td className="px-4 py-2 text-black">{assembly.data}</td>
                    <td className="px-4 py-2 text-black">{assembly.loja}</td>
                    <td className="px-4 py-2 text-black flex space-x-2">
                      <button
                        className="text-blue-600 hover:underline"
                        onClick={() => router.push(`/stock/assembly/edit-assembly?id=${assembly.pessoaId}`)}
                      >
                        Editar
                      </button>
                      <button
                        className="text-red-600 hover:underline"
                        onClick={() => handleDelete(assembly.id, assembly.loja)} // Passa o ID e a loja para a função de deletar
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="text-center py-4 text-black">
                    Nenhuma montagem registrada encontrada.
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
