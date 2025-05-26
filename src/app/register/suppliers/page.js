"use client";

import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { firestore } from "@/lib/firebaseConfig";
import Layout from "@/components/Layout";
import { jsPDF } from "jspdf";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBuilding,
  faFileInvoice,
  faDollarSign,
  faTrash,
  faIndustry
} from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

const SuppliersTable = () => {
  const { userPermissions } = useAuth();
  const [suppliers, setSuppliers] = useState([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);
  const [selectedForDeletion, setSelectedForDeletion] = useState([]);

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        setLoading(true);
        const fetchedSuppliers = [];

        // Usar o caminho correto: lojas/fornecedores/users
        const suppliersCollection = collection(firestore, 'lojas/fornecedores/users');
        const snapshot = await getDocs(suppliersCollection);

        snapshot.docs.forEach((doc) => {
          fetchedSuppliers.push({
            id: doc.id,
            ...doc.data()
          });
        });

        setSuppliers(fetchedSuppliers);
        setFilteredSuppliers(fetchedSuppliers);
        setLoading(false);
      } catch (error) {
        console.error("Erro ao buscar fornecedores:", error);
        setError("Erro ao carregar os dados dos fornecedores: " + error.message);
        setLoading(false);
      }
    };

    fetchSuppliers();
  }, []);

  // Filtrar fornecedores com base na busca
  useEffect(() => {
    if (searchQuery === "") {
      setFilteredSuppliers(suppliers);
    } else {
      const filtered = suppliers.filter(
        (supplier) =>
          (supplier.razaoSocial?.toLowerCase().includes(searchQuery.toLowerCase()) || "") ||
          (supplier.nomeFantasia?.toLowerCase().includes(searchQuery.toLowerCase()) || "") ||
          (supplier.cnpj?.includes(searchQuery) || "")
      );
      setFilteredSuppliers(filtered);
    }
  }, [searchQuery, suppliers]);

  const handleModalOpen = (supplier) => {
    setSelectedSupplier(supplier);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setSelectedSupplier(null);
  };

  const handleDownloadPDF = () => {
    if (!selectedSupplier) return;

    const docPDF = new jsPDF();
    docPDF.text(`Razão Social: ${selectedSupplier.razaoSocial}`, 10, 10);
    docPDF.text(`Nome Fantasia: ${selectedSupplier.nomeFantasia}`, 10, 20);
    docPDF.text(`CNPJ: ${selectedSupplier.cnpj}`, 10, 30);
    docPDF.text(`Email: ${selectedSupplier.email || 'N/A'}`, 10, 40);
    docPDF.text(`Telefone: ${selectedSupplier.telefone || 'N/A'}`, 10, 50);
    docPDF.text(`Representante: ${selectedSupplier.representante || 'N/A'}`, 10, 60);

    if (selectedSupplier.endereco) {
      docPDF.text(`Endereço:`, 10, 70);
      docPDF.text(`CEP: ${selectedSupplier.endereco.cep || 'N/A'}`, 15, 80);
      docPDF.text(`Logradouro: ${selectedSupplier.endereco.logradouro || 'N/A'}`, 15, 90);
      docPDF.text(`Número: ${selectedSupplier.endereco.numero || 'N/A'}`, 15, 100);
      docPDF.text(`Cidade: ${selectedSupplier.endereco.cidade || 'N/A'}`, 15, 110);
      docPDF.text(`Estado: ${selectedSupplier.endereco.estado || 'N/A'}`, 15, 120);
    }

    docPDF.save(`${selectedSupplier.nomeFantasia}-dados.pdf`);
  };

  const handlePrint = () => {
    window.print();
  };

  // Função para marcar ou desmarcar fornecedor para exclusão
  const toggleDeletion = (e, supplierId) => {
    e.stopPropagation(); // Evitar abrir o modal

    setSelectedForDeletion(prev => {
      if (prev.includes(supplierId)) {
        return prev.filter(id => id !== supplierId);
      } else {
        return [...prev, supplierId];
      }
    });
  };

  // Função para excluir os fornecedores selecionados
  const handleDeleteSelected = async () => {
    if (selectedForDeletion.length === 0) {
      alert('Selecione pelo menos um fornecedor para excluir.');
      return;
    }

    if (confirm(`Deseja realmente excluir ${selectedForDeletion.length} fornecedores selecionados?`)) {
      try {
        for (const supplierId of selectedForDeletion) {
          // Excluir o fornecedor da coleção correta: lojas/fornecedores/users
          const supplierRef = doc(firestore, "lojas/fornecedores/users", supplierId);
          await deleteDoc(supplierRef);
        }

        // Atualizar as listas de fornecedores
        const updatedSuppliers = suppliers.filter(supplier => !selectedForDeletion.includes(supplier.id));
        setSuppliers(updatedSuppliers);
        setFilteredSuppliers(updatedSuppliers);
        setSelectedForDeletion([]);

        alert('Fornecedores excluídos com sucesso!');
      } catch (error) {
        console.error('Erro ao excluir fornecedores:', error);
        alert('Erro ao excluir os fornecedores selecionados.');
      }
    }
  };

  // Calcular fornecedores para a página atual
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentSuppliers = filteredSuppliers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredSuppliers.length / itemsPerPage);

  // Funções de navegação
  const goToPage = (pageNumber) => {
    setCurrentPage(Math.max(1, Math.min(pageNumber, totalPages)));
  };

  // Estatísticas para os cards
  const recentSuppliers = suppliers.filter(supplier => {
    if (!supplier.dataCadastro) return false;

    const cadastroDate = typeof supplier.dataCadastro === 'string'
      ? new Date(supplier.dataCadastro)
      : supplier.dataCadastro.seconds
        ? new Date(supplier.dataCadastro.seconds * 1000)
        : null;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return cadastroDate && cadastroDate >= thirtyDaysAgo;
  }).length;

  return (
    <Layout>
      <div className="min-h-screen p-0 md:p-2 mb-20">
        <div className="w-full max-w-5xl mx-auto rounded-lg">
          <div className="mb-4">
            <h2
              className="text-3xl font-bold mb-8 mt-8"
              style={{ color: "#81059e" }}
            >
              FORNECEDORES
            </h2>
          </div>

          {/* Dashboard compacto com estatísticas */}
          <div className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              {/* Card - Total de Fornecedores */}
              <div className="border-2 rounded-lg p-4 border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <FontAwesomeIcon
                    icon={faBuilding}
                    className="h-8 w-8 text-[#81059e] bg-purple-300 p-2 rounded-2xl"
                  />
                  <span className="text-lg font-medium text-gray-700 flex-grow ml-3">
                    Total de Fornecedores
                  </span>
                </div>
                <p className="text-2xl font-semibold text-center mt-2">
                  {suppliers.length}
                </p>
              </div>

              {/* Card - Fornecedores Recentes */}
              <div className="border-2 rounded-lg p-4 border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <FontAwesomeIcon
                    icon={faIndustry}
                    className="h-8 w-8 text-[#81059e] bg-purple-300 p-2 rounded-2xl"
                  />
                  <span className="text-lg font-medium text-gray-700 flex-grow ml-3">
                    Fornecedores Recentes
                  </span>
                </div>
                <p className="text-2xl font-semibold text-center mt-2">
                  {recentSuppliers}
                </p>
                <p className="text-sm text-gray-500 text-center mt-1">
                  Últimos 30 dias
                </p>
              </div>

              {/* Card - Pedidos em Aberto */}
              <div className="border-2 rounded-lg p-4 border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <FontAwesomeIcon
                    icon={faFileInvoice}
                    className="h-8 w-8 text-[#81059e] bg-purple-300 p-2 rounded-2xl"
                  />
                  <span className="text-lg font-medium text-gray-700 flex-grow ml-3">
                    Pedidos em Aberto
                  </span>
                </div>
                <p className="text-2xl font-semibold text-center mt-2">
                  0
                </p>
              </div>

              {/* Card - Valor Total dos Pedidos */}
              <div className="border-2 rounded-lg p-4 border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <FontAwesomeIcon
                    icon={faDollarSign}
                    className="h-8 w-8 text-[#81059e] bg-purple-300 p-2 rounded-2xl"
                  />
                  <span className="text-lg font-medium text-gray-700 flex-grow ml-3">
                    Valor de Pedidos
                  </span>
                </div>
                <p className="text-2xl font-semibold text-center mt-2">
                  R$ 0,00
                </p>
                <p className="text-sm text-gray-500 text-center mt-1">
                  Este mês
                </p>
              </div>
            </div>
          </div>

          {/* Barra de busca e filtros */}
          <div className="flex flex-wrap gap-2 items-center mb-4">
            {/* Barra de busca */}
            <input
              type="text"
              placeholder="Busque por nome, CNPJ ou razão social"
              className="p-2 h-10 flex-grow min-w-[200px] border-2 border-gray-200 rounded-lg text-black"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            {/* Botões de ação */}
            <div className="flex gap-2">
              {/* Botão Adicionar */}
              <Link href="/stock/suppliers/add-supplier">
                <button className="bg-green-400 text-white h-10 w-10 rounded-md flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </Link>

              {/* Botão Excluir */}
              <button
                onClick={handleDeleteSelected}
                className={`${selectedForDeletion.length === 0 ? 'bg-red-400' : 'bg-red-400'} text-white h-10 w-10 rounded-md flex items-center justify-center`}
                disabled={selectedForDeletion.length === 0}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>

          {/* Tabela de fornecedores */}
          {loading ? (
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#81059e]"></div>
          ) : error ? (
            <p>{error}</p>
          ) : (
            <div className="w-full overflow-x-auto">
              {filteredSuppliers.length === 0 ? (
                <p>Nenhum fornecedor encontrado.</p>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="min-w-full table-auto select-none">
                      <thead>
                        <tr className="bg-[#81059e] text-white">
                          <th className="px-3 py-2 w-12">
                            <span className="sr-only">Selecionar</span>
                          </th>
                          <th className="px-3 py-2">CNPJ</th>
                          <th className="px-3 py-2">Nome Fantasia</th>
                          <th className="px-3 py-2">Razão Social</th>
                          <th className="px-3 py-2">Telefone</th>
                          <th className="px-3 py-2">Email</th>
                          <th className="px-3 py-2">Cidade</th>
                          <th className="px-3 py-2">Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentSuppliers.map((supplier) => (
                          <tr
                            key={supplier.id}
                            className="text-black text-left hover:bg-gray-100 cursor-pointer"
                          >
                            <td className="border px-2 py-2 text-center">
                              <input
                                type="checkbox"
                                checked={selectedForDeletion.includes(supplier.id)}
                                onChange={(e) => toggleDeletion(e, supplier.id)}
                                className="h-4 w-4 cursor-pointer"
                                onClick={(e) => e.stopPropagation()}
                              />
                            </td>
                            <td className="border px-3 py-2" onClick={() => handleModalOpen(supplier)}>
                              {supplier.cnpj || 'N/A'}
                            </td>
                            <td className="border px-3 py-2" onClick={() => handleModalOpen(supplier)}>
                              {supplier.nomeFantasia || 'N/A'}
                            </td>
                            <td className="border px-3 py-2" onClick={() => handleModalOpen(supplier)}>
                              {supplier.razaoSocial || 'N/A'}
                            </td>
                            <td className="border px-3 py-2" onClick={() => handleModalOpen(supplier)}>
                              {supplier.telefone || 'N/A'}
                            </td>
                            <td className="border px-3 py-2" onClick={() => handleModalOpen(supplier)}>
                              {supplier.email || 'N/A'}
                            </td>
                            <td className="border px-3 py-2" onClick={() => handleModalOpen(supplier)}>
                              {supplier.endereco?.cidade || 'N/A'}
                            </td>
                            <td className="border px-3 py-2" onClick={() => handleModalOpen(supplier)}>
                              {supplier.endereco?.estado || 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Paginação */}
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-gray-700">
                      Mostrando <span className="font-medium">{indexOfFirstItem + 1}</span> a{' '}
                      <span className="font-medium">
                        {Math.min(indexOfLastItem, filteredSuppliers.length)}
                      </span>{' '}
                      de <span className="font-medium">{filteredSuppliers.length}</span> registros
                    </div>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => goToPage(1)}
                        disabled={currentPage === 1}
                        className={`px-3 py-1 rounded ${currentPage === 1
                          ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                          : 'bg-[#81059e] text-white hover:bg-[#690480]'
                          }`}
                      >
                        &laquo;
                      </button>
                      <button
                        onClick={() => goToPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        className={`px-3 py-1 rounded ${currentPage === 1
                          ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                          : 'bg-[#81059e] text-white hover:bg-[#690480]'
                          }`}
                      >
                        &lt;
                      </button>

                      <span className="px-3 py-1 text-gray-700">
                        {currentPage} / {totalPages}
                      </span>

                      <button
                        onClick={() => goToPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className={`px-3 py-1 rounded ${currentPage === totalPages
                          ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                          : 'bg-[#81059e] text-white hover:bg-[#690480]'
                          }`}
                      >
                        &gt;
                      </button>
                      <button
                        onClick={() => goToPage(totalPages)}
                        disabled={currentPage === totalPages}
                        className={`px-3 py-1 rounded ${currentPage === totalPages
                          ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                          : 'bg-[#81059e] text-white hover:bg-[#690480]'
                          }`}
                      >
                        &raquo;
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Modal para detalhes do fornecedor */}
          {showModal && selectedSupplier && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
              <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md relative text-black overflow-y-auto max-h-[90vh]">
                <h3 className="text-xl font-bold mb-4" style={{ color: "#81059e" }}>
                  Dados do Fornecedor
                </h3>

                <div className="space-y-2">
                  <p className="text-black">
                    <strong>ID:</strong> {selectedSupplier.id}
                  </p>
                  <p className="text-black">
                    <strong>Razão Social:</strong> {selectedSupplier.razaoSocial || 'N/A'}
                  </p>
                  <p className="text-black">
                    <strong>Nome Fantasia:</strong> {selectedSupplier.nomeFantasia || 'N/A'}
                  </p>
                  <p className="text-black">
                    <strong>CNPJ:</strong> {selectedSupplier.cnpj || 'N/A'}
                  </p>
                  <p className="text-black">
                    <strong>Email:</strong> {selectedSupplier.email || 'N/A'}
                  </p>
                  <p className="text-black">
                    <strong>Telefone:</strong> {selectedSupplier.telefone || 'N/A'}
                  </p>
                  <p className="text-black">
                    <strong>Representante:</strong> {selectedSupplier.representante || 'N/A'}
                  </p>
                  <p className="text-black">
                    <strong>Celular:</strong> {selectedSupplier.celular || 'N/A'}
                  </p>

                  <div className="pt-2 border-t mt-4">
                    <p className="text-black font-semibold">Endereço</p>
                    <p className="text-black">
                      <strong>CEP:</strong> {selectedSupplier.endereco?.cep || 'N/A'}
                    </p>
                    <p className="text-black">
                      <strong>Logradouro:</strong> {selectedSupplier.endereco?.logradouro || 'N/A'}
                    </p>
                    <p className="text-black">
                      <strong>Número:</strong> {selectedSupplier.endereco?.numero || 'N/A'}
                    </p>
                    <p className="text-black">
                      <strong>Cidade:</strong> {selectedSupplier.endereco?.cidade || 'N/A'}
                    </p>
                    <p className="text-black">
                      <strong>Estado:</strong> {selectedSupplier.endereco?.estado || 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2 justify-center">
                  <button
                    className="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 transition"
                    onClick={handlePrint}
                  >
                    Imprimir
                  </button>
                  <button
                    className="bg-[#81059e] text-white py-2 px-4 rounded hover:bg-[#690480] transition"
                    onClick={handleDownloadPDF}
                  >
                    Baixar PDF
                  </button>
                  <Link href={`/stock/suppliers/edit/${selectedSupplier.id}`}>
                    <button
                      className="bg-yellow-500 text-white py-2 px-4 rounded hover:bg-yellow-600 transition"
                    >
                      Editar
                    </button>
                  </Link>
                  <button
                    className="bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600 transition"
                    onClick={handleModalClose}
                  >
                    Fechar
                  </button>
                </div>

                <button
                  onClick={handleModalClose}
                  className="absolute top-2 right-2 text-gray-600 hover:text-gray-800"
                >
                  &times;
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default SuppliersTable;