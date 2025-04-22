'use client'
import React, { useState, useEffect } from 'react';
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import Layout from '@/components/Layout';
import { app } from '@/lib/firebaseConfig';
import { useRouter } from 'next/navigation';
import { FaTrash, FaFilter, FaFileInvoice, FaUserMd, FaEnvelope, FaMapMarkerAlt } from 'react-icons/fa';
import jsPDF from 'jspdf';

const db = getFirestore(app);

const ListOphthalmologist = () => {
  const [ophthalmologists, setOphthalmologists] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOphthalmologist, setSelectedOphthalmologist] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(15);
  const [sortField, setSortField] = useState('nomeMedico');
  const [sortDirection, setSortDirection] = useState('asc');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const router = useRouter();

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
    fetchOphthalmologists();
  }, []);

  const filteredOphthalmologists = ophthalmologists.filter(
    (ophthalmologist) =>
      ophthalmologist.crm.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ophthalmologist.nomeMedico.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdd = () => {
    router.push('/consultation/ophthalmologist');
  };

  const handleRemove = async (id) => {
    try {
      await deleteDoc(doc(db, 'oftalmologistas', id));
      fetchOphthalmologists();
    } catch (error) {
      console.error('Erro ao remover oftalmologista:', error);
    }
  };

  const openModal = (ophthalmologist) => {
    setSelectedOphthalmologist(ophthalmologist);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedOphthalmologist(null);
    setIsModalOpen(false);
  };

  const generatePDF = () => {
    if (!selectedOphthalmologist) return;

    const doc = new jsPDF();
    doc.text(`Detalhes do Oftalmologista`, 10, 10);
    doc.text(`CRM: ${selectedOphthalmologist.crm || 'N/A'}`, 10, 20);
    doc.text(`Nome: ${selectedOphthalmologist.nomeMedico || 'N/A'}`, 10, 30);
    doc.text(`Gênero: ${selectedOphthalmologist.genero || 'N/A'}`, 10, 40);
    doc.text(`Email: ${selectedOphthalmologist.email || 'N/A'}`, 10, 50);
    doc.text(`Logradouro: ${selectedOphthalmologist.logradouro || 'N/A'}`, 10, 60);
    doc.text(`Bairro: ${selectedOphthalmologist.bairro || 'N/A'}`, 10, 70);

    doc.save(`Oftalmologista_${selectedOphthalmologist.crm || selectedOphthalmologist.id}.pdf`);
  };

  const handlePrint = () => {
    window.print();
  };

  const sortOphthalmologists = (field) => {
    const direction = field === sortField && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortDirection(direction);
  };

  const renderSortArrow = (field) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  // Paginação
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentOphthalmologists = filteredOphthalmologists.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredOphthalmologists.length / itemsPerPage);

  const goToPage = (pageNumber) => {
    setCurrentPage(Math.max(1, Math.min(pageNumber, totalPages)));
  };

  return (
    <Layout>
      <div className="min-h-screen p-0 md:p-2 mb-20">
        <div className="w-full max-w-5xl mx-auto rounded-lg">
          <div className="mb-4">
            <h2 className="text-3xl font-bold text-[#81059e] mb-8 mt-8">
              OFTALMOLOGISTAS REGISTRADOS
            </h2>
          </div>

          {/* Cards de Estatísticas */}
          <div className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              <div className="border-2 rounded-lg p-4 border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <FaUserMd className="h-8 w-8 text-[#81059e] bg-purple-300 p-2 rounded-2xl" />
                  <span className="text-lg font-medium text-gray-700 flex-grow ml-3">Total de Médicos</span>
                </div>
                <p className="text-2xl font-semibold text-center mt-2">{ophthalmologists.length}</p>
              </div>

              <div className="border-2 rounded-lg p-4 border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <FaEnvelope className="h-8 w-8 text-[#81059e] bg-purple-300 p-2 rounded-2xl" />
                  <span className="text-lg font-medium text-gray-700 flex-grow ml-3">Emails Registrados</span>
                </div>
                <p className="text-2xl font-semibold text-center mt-2">
                  {ophthalmologists.filter(o => o.email).length}
                </p>
              </div>

              <div className="border-2 rounded-lg p-4 border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <FaMapMarkerAlt className="h-8 w-8 text-[#81059e] bg-purple-300 p-2 rounded-2xl" />
                  <span className="text-lg font-medium text-gray-700 flex-grow ml-3">Endereços</span>
                </div>
                <p className="text-2xl font-semibold text-center mt-2">
                  {ophthalmologists.filter(o => o.logradouro).length}
                </p>
              </div>

              <div className="border-2 rounded-lg p-4 border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <FaFileInvoice className="h-8 w-8 text-[#81059e] bg-purple-300 p-2 rounded-2xl" />
                  <span className="text-lg font-medium text-gray-700 flex-grow ml-3">CRMs Ativos</span>
                </div>
                <p className="text-2xl font-semibold text-center mt-2">
                  {ophthalmologists.filter(o => o.crm).length}
                </p>
              </div>
            </div>
          </div>

          {/* Barra de busca e filtros */}
          <div className="flex flex-wrap gap-2 items-center mb-4">
            <input
              type="text"
              placeholder="Busque por CRM ou nome"
              className="p-2 h-10 flex-grow min-w-[200px] border-2 border-gray-200 rounded-lg text-black"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            <button
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className="p-2 h-10 border-2 border-gray-200 rounded-lg bg-white flex items-center gap-1 text-[#81059e]"
            >
              <FaFilter className="h-4 w-4" />
              <span className="hidden sm:inline">Filtrar</span>
            </button>

            <button
              onClick={handleAdd}
              className="bg-[#81059e] text-white px-4 py-2 rounded-lg hover:bg-[#690480]"
            >
              ADICIONAR
            </button>
          </div>

          {/* Tabela */}
          {isLoading ? (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#81059e]"></div>
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="min-w-full table-auto select-none">
                <thead>
                  <tr className="bg-[#81059e] text-white">
                    <th className="px-3 py-2 cursor-pointer" onClick={() => sortOphthalmologists('crm')}>
                      CRM {renderSortArrow('crm')}
                    </th>
                    <th className="px-3 py-2 cursor-pointer" onClick={() => sortOphthalmologists('nomeMedico')}>
                      Médico {renderSortArrow('nomeMedico')}
                    </th>
                    <th className="px-3 py-2 cursor-pointer" onClick={() => sortOphthalmologists('genero')}>
                      Gênero {renderSortArrow('genero')}
                    </th>
                    <th className="px-3 py-2 cursor-pointer" onClick={() => sortOphthalmologists('email')}>
                      Email {renderSortArrow('email')}
                    </th>
                    <th className="px-3 py-2 cursor-pointer" onClick={() => sortOphthalmologists('logradouro')}>
                      Logradouro {renderSortArrow('logradouro')}
                    </th>
                    <th className="px-3 py-2 cursor-pointer" onClick={() => sortOphthalmologists('bairro')}>
                      Bairro {renderSortArrow('bairro')}
                    </th>
                    <th className="px-3 py-2">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {currentOphthalmologists.map((ophthalmologist) => (
                    <tr
                      key={ophthalmologist.id}
                      className="text-black text-left hover:bg-gray-100 cursor-pointer"
                      onClick={() => openModal(ophthalmologist)}
                    >
                      <td className="border px-3 py-2">{ophthalmologist.crm}</td>
                      <td className="border px-3 py-2">{ophthalmologist.nomeMedico}</td>
                      <td className="border px-3 py-2">{ophthalmologist.genero}</td>
                      <td className="border px-3 py-2">{ophthalmologist.email}</td>
                      <td className="border px-3 py-2">{ophthalmologist.logradouro}</td>
                      <td className="border px-3 py-2">{ophthalmologist.bairro}</td>
                      <td className="border px-3 py-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemove(ophthalmologist.id);
                          }}
                          className="text-red-500 hover:text-red-700"
                        >
                          <FaTrash size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Paginação */}
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-700">
                  Mostrando <span className="font-medium">{indexOfFirstItem + 1}</span> a{' '}
                  <span className="font-medium">
                    {Math.min(indexOfLastItem, filteredOphthalmologists.length)}
                  </span>{' '}
                  de <span className="font-medium">{filteredOphthalmologists.length}</span> registros
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
            </div>
          )}

          {/* Modal de Detalhes */}
          {isModalOpen && selectedOphthalmologist && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
              <div className="bg-white rounded-lg shadow-lg w-full max-w-md flex flex-col h-3/5 overflow-hidden">
                <div className="bg-[#81059e] text-white p-4 flex justify-between items-center">
                  <h3 className="text-xl font-bold">Detalhes do Oftalmologista</h3>
                  <button onClick={closeModal} className="text-white hover:text-gray-200">
                    ✕
                  </button>
                </div>
                <div className="space-y-3 p-4 overflow-y-auto flex-grow">
                  <p><strong>CRM:</strong> {selectedOphthalmologist.crm}</p>
                  <p><strong>Nome:</strong> {selectedOphthalmologist.nomeMedico}</p>
                  <p><strong>Gênero:</strong> {selectedOphthalmologist.genero}</p>
                  <p><strong>Email:</strong> {selectedOphthalmologist.email}</p>
                  <p><strong>Logradouro:</strong> {selectedOphthalmologist.logradouro}</p>
                  <p><strong>Bairro:</strong> {selectedOphthalmologist.bairro}</p>
                </div>
                <div className="flex justify-around p-4 bg-gray-50">
                  <button
                    onClick={generatePDF}
                    className="bg-[#81059e] text-white px-4 py-2 rounded-md"
                  >
                    Gerar PDF
                  </button>
                  <button
                    onClick={handlePrint}
                    className="bg-[#81059e] text-white px-4 py-2 rounded-md"
                  >
                    Imprimir
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ListOphthalmologist;
