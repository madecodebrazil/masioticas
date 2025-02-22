"use client";
import { useState, useEffect } from "react";
import Layout from "@/components/Layout"; // Instancie o seu layout
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { app } from "../../../lib/firebaseConfig"; // Certifique-se de que o Firebase foi configurado corretamente
import { useRouter } from "next/navigation"; // Importe o useRouter

const firestore = getFirestore(app);

export default function FornecedoresPage() {
  const [fornecedores, setFornecedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(""); // Estado para armazenar a busca
  const router = useRouter(); // Instanciar o hook useRouter

  useEffect(() => {
    const fetchFornecedores = async () => {
      try {
        const querySnapshot = await getDocs(collection(firestore, "fornecedores"));
        const fornecedoresList = querySnapshot.docs.map((doc) => doc.data());
        console.log("Fornecedores:", fornecedoresList); // Adicionando o console log para verificar o fetch
        setFornecedores(fornecedoresList);
        setLoading(false);
      } catch (error) {
        console.error("Erro ao buscar fornecedores: ", error);
        setLoading(false);
      }
    };

    fetchFornecedores();
  }, []);

  // Função para buscar fornecedores
  const handleSearch = (e) => {
    setSearchQuery(e.target.value); // Atualiza o estado da busca
  };

  // Filtrando os fornecedores com base na busca
  const filteredFornecedores = fornecedores.filter((fornecedor) => {
    return (
      fornecedor.cnpj?.includes(searchQuery) ||
      fornecedor.nomeFantasia?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fornecedor.razaoSocial?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  // Função para navegar para a página de adicionar fornecedor
  const handleAddSupplier = () => {
    router.push("/stock/suppliers/add-supplier");
  };

  return (
    <Layout>
      <div className="w-full">
        <div className="w-full">
          <div className="flex justify-between items-center">
            <h2 className="text-lg sm:text-2xl font-light" style={{ color: "#81059e" }}>FORNECEDORES</h2>
            <button
              className="px-3 sm:px-4 py-2 bg-purple-700 text-white rounded-lg text-sm sm:text-base"
              onClick={handleAddSupplier} // Adicionando a função para navegação
            >
              ADICIONAR
            </button>
          </div>

          <div className="mt-4">
            <input
              type="text"
              placeholder="Busque por código ou título"
              className="w-full h-10 px-4 rounded-md border border-gray-300"
              value={searchQuery} // Define o valor do input como o estado da busca
              onChange={handleSearch} // Chama a função de busca ao alterar
            />
          </div>

          <div className=" mt-4 overflow-x-auto">
            <table className=" min-w-full text-left table-auto border-collapse text-black" style={{ backgroundColor: "#F0F4FD" }}>
              <thead className="bg-gray-200">
                <tr className="text-xs sm:text-sm">
                  <th className="px-2 sm:px-4 py-2">CNPJ</th>
                  <th className="px-2 sm:px-4 py-2">Nome Fantasia</th>
                  <th className="px-2 sm:px-4 py-2">Razão Social</th>
                  <th className="px-2 sm:px-4 py-2">Email</th>
                  <th className="px-2 sm:px-4 py-2">Telefone</th>
                  <th className="px-2 sm:px-4 py-2">CEP</th>
                  <th className="px-2 sm:px-4 py-2">Número</th>
                  <th className="px-2 sm:px-4 py-2">Logradouro</th>
                  <th className="px-2 sm:px-4 py-2">Cidade</th>
                  <th className="px-2 sm:px-4 py-2">Estado</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {loading ? (
                  <tr>
                    <td colSpan="10" className="text-center py-4">Carregando...</td>
                  </tr>
                ) : (
                  filteredFornecedores.length > 0 ? (
                    filteredFornecedores.map((fornecedor, index) => (
                      <tr key={index} className="text-xs sm:text-sm">
                        <td className="px-2 sm:px-4 py-2">{fornecedor.cnpj}</td>
                        <td className="px-2 sm:px-4 py-2">{fornecedor.nomeFantasia}</td>
                        <td className="px-2 sm:px-4 py-2">{fornecedor.razaoSocial}</td>
                        <td className="px-2 sm:px-4 py-2">{fornecedor.email}</td>
                        <td className="px-2 sm:px-4 py-2">{fornecedor.telefone}</td>
                        <td className="px-2 sm:px-4 py-2">{fornecedor.cep}</td>
                        <td className="px-2 sm:px-4 py-2">{fornecedor.numero}</td>
                        <td className="px-2 sm:px-4 py-2">{fornecedor.logradouro}</td>
                        <td className="px-2 sm:px-4 py-2">{fornecedor.cidade}</td>
                        <td className="px-2 sm:px-4 py-2">{fornecedor.estado}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="10" className="text-center py-4">Nenhum fornecedor encontrado.</td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
