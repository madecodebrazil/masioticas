"use client";

import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBuilding,
  faIndustry,
  faFileInvoice,
  faDollarSign,
  faX,
  faEdit,
  faTrash,
  faPlus,
  faMapMarkerAlt,
  faPhone
} from '@fortawesome/free-solid-svg-icons';
import { collection, getDocs, doc, deleteDoc, setDoc } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
import { firestore } from '@/lib/firebaseConfig';
import jsPDF from 'jspdf';

export default function ListaFornecedores() {
  const { userPermissions, userData } = useAuth();
  const [fornecedores, setFornecedores] = useState([]);
  const [filteredFornecedores, setFilteredFornecedores] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFornecedor, setSelectedFornecedor] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalFornecedores, setTotalFornecedores] = useState(0);
  const [selectedForDeletion, setSelectedForDeletion] = useState([]);
  const [sortField, setSortField] = useState('nomeFantasia');
  const [sortDirection, setSortDirection] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingFornecedor, setEditingFornecedor] = useState(null);
  
  // Estados para estatísticas
  const [fornecedoresRecentes, setFornecedoresRecentes] = useState(0);
  const [cidadesUnicas, setCidadesUnicas] = useState(0);
  const [comTelefone, setComTelefone] = useState(0);

  useEffect(() => {
    const fetchFornecedores = async () => {
      try {
        setLoading(true);
        const fornecedoresRef = collection(firestore, 'lojas/fornecedores/users');
        const fornecedoresSnapshot = await getDocs(fornecedoresRef);
        
        const fetchedFornecedores = [];
        fornecedoresSnapshot.docs.forEach((docItem) => {
          const fornecedorData = docItem.data();
          fetchedFornecedores.push({
            id: docItem.id,
            ...fornecedorData
          });
        });

        // Aplicar ordenação inicial
        const sortedFornecedores = sortFornecedores(fetchedFornecedores, sortField, sortDirection);
        setFornecedores(sortedFornecedores);
        setFilteredFornecedores(sortedFornecedores);
        setTotalFornecedores(sortedFornecedores.length);
        
        // Calcular estatísticas
        calcularEstatisticas(sortedFornecedores);
        
        setLoading(false);
      } catch (err) {
        console.error('Erro ao carregar fornecedores:', err);
        setError(`Erro ao carregar os dados dos fornecedores: ${err.message}`);
        setLoading(false);
      }
    };

    fetchFornecedores();
  }, [sortField, sortDirection]);

  // Função para calcular estatísticas
  const calcularEstatisticas = (fornecedoresList) => {
    // Fornecedores recentes (últimos 30 dias)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentes = fornecedoresList.filter(fornecedor => {
      if (!fornecedor.dataCadastro) return false;
      const cadastroDate = typeof fornecedor.dataCadastro === 'string'
        ? new Date(fornecedor.dataCadastro)
        : fornecedor.dataCadastro.seconds
          ? new Date(fornecedor.dataCadastro.seconds * 1000)
          : null;
      return cadastroDate && cadastroDate >= thirtyDaysAgo;
    }).length;
    
    setFornecedoresRecentes(recentes);

    // Cidades únicas
    const cidades = new Set();
    fornecedoresList.forEach(fornecedor => {
      const cidade = fornecedor.endereco?.cidade;
      if (cidade) {
        cidades.add(cidade);
      }
    });
    setCidadesUnicas(cidades.size);

    // Com telefone
    const telefones = fornecedoresList.filter(f => f.telefone || f.celular).length;
    setComTelefone(telefones);
  };

  // Função para filtrar fornecedores com base na busca
  useEffect(() => {
    const filterBySearch = () => {
      let filtered = fornecedores;

      if (searchQuery !== '') {
        filtered = filtered.filter(
          (fornecedor) =>
            (fornecedor.razaoSocial?.toLowerCase().includes(searchQuery.toLowerCase()) || '') ||
            (fornecedor.nomeFantasia?.toLowerCase().includes(searchQuery.toLowerCase()) || '') ||
            (fornecedor.cnpj?.includes(searchQuery.replace(/\D/g, '')) || '') ||
            (fornecedor.email?.toLowerCase().includes(searchQuery.toLowerCase()) || '') ||
            (fornecedor.endereco?.cidade?.toLowerCase().includes(searchQuery.toLowerCase()) || '') ||
            (fornecedor.representante?.toLowerCase().includes(searchQuery.toLowerCase()) || '')
        );
      }

      // Aplicar ordenação
      filtered = sortFornecedores(filtered, sortField, sortDirection);
      setFilteredFornecedores(filtered);
      setCurrentPage(1); // Reset para primeira página ao filtrar
    };

    filterBySearch();
  }, [searchQuery, fornecedores, sortField, sortDirection]);

  // Função para ordenar fornecedores
  const sortFornecedores = (fornecedoresToSort, field, direction) => {
    return [...fornecedoresToSort].sort((a, b) => {
      let aValue = a[field];
      let bValue = b[field];

      // Tratar campos aninhados
      if (field.includes('.')) {
        const keys = field.split('.');
        aValue = keys.reduce((obj, key) => obj?.[key], a);
        bValue = keys.reduce((obj, key) => obj?.[key], b);
      }

      // Tratar datas
      if (field === 'dataCadastro') {
        aValue = convertToDate(aValue);
        bValue = convertToDate(bValue);
      }
      // Tratar strings
      else {
        aValue = String(aValue || '').toLowerCase();
        bValue = String(bValue || '').toLowerCase();
      }

      // Comparação
      if (aValue < bValue) return direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  // Função para converter diferentes formatos de data para objeto Date
  const convertToDate = (date) => {
    if (!date) return new Date(0);
    if (typeof date === 'object' && date.seconds) {
      return new Date(date.seconds * 1000);
    }
    return new Date(date);
  };

  // Função para alternar a ordenação
  const handleSort = (field) => {
    const direction = field === sortField && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortDirection(direction);
  };

  // Renderizar seta de ordenação
  const renderSortArrow = (field) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ?
      <span className="ml-1">↑</span> :
      <span className="ml-1">↓</span>;
  };

  // Formatar CNPJ
  const formatCNPJ = (cnpj) => {
    if (!cnpj) return 'N/A';
    const numericCNPJ = cnpj.replace(/\D/g, '');
    if (numericCNPJ.length === 14) {
      return numericCNPJ.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
    return cnpj;
  };

  // Formatar telefone
  const formatPhone = (phone) => {
    if (!phone) return 'N/A';
    const numericPhone = phone.replace(/\D/g, '');
    if (numericPhone.length === 11) {
      return numericPhone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (numericPhone.length === 10) {
      return numericPhone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return phone;
  };

  // Formatar data
  const formatDate = (date) => {
    if (!date) return 'N/A';
    if (typeof date === 'object' && date.seconds) {
      return new Date(date.seconds * 1000).toLocaleDateString('pt-BR');
    }
    return new Date(date).toLocaleDateString('pt-BR');
  };

  // Função para abrir o modal de detalhes
  const openModal = (fornecedor) => {
    setSelectedFornecedor(fornecedor);
    setIsModalOpen(true);
  };

  // Função para fechar o modal
  const closeModal = () => {
    setSelectedFornecedor(null);
    setIsModalOpen(false);
  };

  // Função para gerar PDF
  const generatePDF = () => {
    if (!selectedFornecedor) return;

    const doc = new jsPDF();
    doc.text(`Detalhes do Fornecedor`, 10, 10);
    doc.text(`Razão Social: ${selectedFornecedor.razaoSocial || 'N/A'}`, 10, 20);
    doc.text(`Nome Fantasia: ${selectedFornecedor.nomeFantasia || 'N/A'}`, 10, 30);
    doc.text(`CNPJ: ${formatCNPJ(selectedFornecedor.cnpj)}`, 10, 40);
    doc.text(`Email: ${selectedFornecedor.email || 'N/A'}`, 10, 50);
    doc.text(`Telefone: ${formatPhone(selectedFornecedor.telefone)}`, 10, 60);
    doc.text(`Representante: ${selectedFornecedor.representante || 'N/A'}`, 10, 70);
    
    if (selectedFornecedor.endereco) {
      doc.text(`Endereço:`, 10, 80);
      doc.text(`${selectedFornecedor.endereco.logradouro || ''} ${selectedFornecedor.endereco.numero || ''}`, 10, 90);
      doc.text(`${selectedFornecedor.endereco.bairro || ''} - ${selectedFornecedor.endereco.cidade || ''}`, 10, 100);
      doc.text(`${selectedFornecedor.endereco.estado || ''} - CEP: ${selectedFornecedor.endereco.cep || ''}`, 10, 110);
    }
    
    doc.text(`Cadastrado em: ${formatDate(selectedFornecedor.dataCadastro)}`, 10, 120);

    doc.save(`Fornecedor_${selectedFornecedor.nomeFantasia || selectedFornecedor.id}.pdf`);
  };

  // Função para lidar com a impressão
  const handlePrint = () => {
    window.print();
  };

  // Função para marcar ou desmarcar fornecedor para exclusão
  const toggleDeletion = (e, fornecedorId) => {
    e.stopPropagation();
    setSelectedForDeletion(prev => {
      if (prev.includes(fornecedorId)) {
        return prev.filter(id => id !== fornecedorId);
      } else {
        return [...prev, fornecedorId];
      }
    });
  };

  // Função para excluir fornecedores selecionados
  const handleDeleteSelected = async () => {
    if (selectedForDeletion.length === 0) {
      alert('Selecione pelo menos um fornecedor para excluir.');
      return;
    }

    if (confirm(`Deseja realmente excluir ${selectedForDeletion.length} fornecedor(es) selecionado(s)?`)) {
      try {
        for (const fornecedorId of selectedForDeletion) {
          const fornecedorRef = doc(firestore, 'lojas/fornecedores/users', fornecedorId);
          await deleteDoc(fornecedorRef);
        }

        const updatedFornecedores = fornecedores.filter(fornecedor => !selectedForDeletion.includes(fornecedor.id));
        setFornecedores(updatedFornecedores);
        setFilteredFornecedores(updatedFornecedores.filter(f =>
          !searchQuery ||
          f.razaoSocial?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          f.nomeFantasia?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          f.cnpj?.includes(searchQuery.replace(/\D/g, '')) ||
          f.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          f.endereco?.cidade?.toLowerCase().includes(searchQuery.toLowerCase())
        ));
        setTotalFornecedores(updatedFornecedores.length);
        calcularEstatisticas(updatedFornecedores);
        setSelectedForDeletion([]);

        alert('Fornecedores excluídos com sucesso!');
      } catch (error) {
        console.error('Erro ao excluir fornecedores:', error);
        alert('Erro ao excluir os fornecedores selecionados.');
      }
    }
  };

  // Função para abrir modal de edição
  const openEditModal = () => {
    if (selectedForDeletion.length !== 1) return;
    const fornecedorToEdit = fornecedores.find(fornecedor => fornecedor.id === selectedForDeletion[0]);
    if (fornecedorToEdit) {
      setEditingFornecedor({ ...fornecedorToEdit });
      setIsEditModalOpen(true);
    }
  };

  // Função para salvar edição
  const handleSaveEdit = async () => {
    try {
      const fornecedorRef = doc(firestore, 'lojas/fornecedores/users', editingFornecedor.id);
      await setDoc(fornecedorRef, { ...editingFornecedor, dataAtualizacao: new Date() }, { merge: true });

      setFornecedores(prevFornecedores =>
        prevFornecedores.map(fornecedor => fornecedor.id === editingFornecedor.id ? editingFornecedor : fornecedor)
      );

      setFilteredFornecedores(prevFiltered =>
        prevFiltered.map(fornecedor => fornecedor.id === editingFornecedor.id ? editingFornecedor : fornecedor)
      );

      setSelectedForDeletion([]);
      setIsEditModalOpen(false);
      alert('Fornecedor atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar fornecedor:', error);
      alert('Erro ao atualizar o fornecedor.');
    }
  };

  // Calcular fornecedores para a página atual
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentFornecedores = filteredFornecedores.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredFornecedores.length / itemsPerPage);

  // Funções de navegação
  const goToPage = (pageNumber) => {
    setCurrentPage(Math.max(1, Math.min(pageNumber, totalPages)));
  };

  // Renderizar fornecedores na tabela
  const renderFornecedores = () => {
    return currentFornecedores.map((fornecedor) => (
      <tr
        key={fornecedor.id}
        className="text-black text-left hover:bg-gray-100 cursor-pointer"
        onClick={() => openModal(fornecedor)}
      >
        <td className="border px-2 py-2 text-center" onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={selectedForDeletion.includes(fornecedor.id)}
            onChange={(e) => toggleDeletion(e, fornecedor.id)}
            className="h-4 w-4 cursor-pointer"
          />
        </td>
        <td className="border px-3 py-2 font-mono text-sm">
          {formatCNPJ(fornecedor.cnpj)}
        </td>
        <td className="border px-3 py-2 max-w-[200px] truncate">
          {fornecedor.nomeFantasia || 'N/A'}
        </td>
        <td className="border px-3 py-2 max-w-[200px] truncate">
          {fornecedor.razaoSocial || 'N/A'}
        </td>
        <td className="border px-3 py-2 font-mono text-sm">
          {formatPhone(fornecedor.telefone)}
        </td>
        <td className="border px-3 py-2 max-w-[180px] truncate">
          {fornecedor.email || 'N/A'}
        </td>
        <td className="border px-3 py-2">
          {fornecedor.endereco?.cidade || 'N/A'}
        </td>
        <td className="border px-3 py-2 text-center">
          {fornecedor.endereco?.estado || 'N/A'}
        </td>
      </tr>
    ));
  };

  return (
    <Layout>
      <div className="min-h-screen p-0 md:p-2 mb-20">
        <div className="w-full max-w-5xl mx-auto rounded-lg">
          <div className="mb-4">
            <h2 className="text-3xl font-bold text-[#81059e] mb-8 mt-8">
              FORNECEDORES
            </h2>
          </div>

          {/* Dashboard com estatísticas */}
          <div className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              {/* Card - Total de Fornecedores */}
              <div className="border-2 rounded-lg p-4 border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <FontAwesomeIcon
                    icon={faBuilding}
                    className="h-8 w-8 text-[#81059e] bg-purple-300 p-2 rounded-2xl"
                  />
                  <span className="text-lg font-medium text-gray-700 flex-grow ml-3">Total de Fornecedores</span>
                </div>
                <p className="text-2xl font-semibold text-center mt-2">{totalFornecedores}</p>
              </div>

              {/* Card - Fornecedores Recentes */}
              <div className="border-2 rounded-lg p-4 border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <FontAwesomeIcon
                    icon={faIndustry}
                    className="h-8 w-8 text-[#81059e] bg-purple-300 p-2 rounded-2xl"
                  />
                  <span className="text-lg font-medium text-gray-700 flex-grow ml-3">Recentes</span>
                </div>
                <p className="text-2xl font-semibold text-center mt-2">{fornecedoresRecentes}</p>
                <p className="text-sm text-gray-500 text-center mt-1">Últimos 30 dias</p>
              </div>

              {/* Card - Cidades */}
              <div className="border-2 rounded-lg p-4 border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <FontAwesomeIcon
                    icon={faMapMarkerAlt}
                    className="h-8 w-8 text-[#81059e] bg-purple-300 p-2 rounded-2xl"
                  />
                  <span className="text-lg font-medium text-gray-700 flex-grow ml-3">Cidades</span>
                </div>
                <p className="text-2xl font-semibold text-center mt-2">{cidadesUnicas}</p>
              </div>

              {/* Card - Com Contato */}
              <div className="border-2 rounded-lg p-4 border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <FontAwesomeIcon
                    icon={faPhone}
                    className="h-8 w-8 text-[#81059e] bg-purple-300 p-2 rounded-2xl"
                  />
                  <span className="text-lg font-medium text-gray-700 flex-grow ml-3">Com Telefone</span>
                </div>
                <p className="text-2xl font-semibold text-center mt-2">{comTelefone}</p>
              </div>
            </div>
          </div>

          {/* Barra de busca e botões de ação */}
          <div className="flex flex-wrap gap-2 items-center mb-4">
            {/* Barra de busca */}
            <input
              type="text"
              placeholder="Busque por nome, CNPJ, email ou cidade"
              className="p-2 h-10 flex-grow min-w-[200px] border-2 border-gray-200 rounded-lg text-black"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            {/* Botões de ação */}
            <div className="flex gap-2">
              {/* Botão Adicionar */}
              <Link href="/stock/suppliers/add-supplier">
                <button className="bg-green-400 text-white h-10 w-10 rounded-md flex items-center justify-center hover:bg-green-500 transition-colors">
                  <FontAwesomeIcon icon={faPlus} className="h-5 w-5" />
                </button>
              </Link>

              {/* Botão Editar */}
              <button
                onClick={openEditModal}
                className={`${selectedForDeletion.length !== 1 ? 'bg-blue-300' : 'bg-blue-500 hover:bg-blue-600'} text-white h-10 w-10 rounded-md flex items-center justify-center transition-colors`}
                disabled={selectedForDeletion.length !== 1}
              >
                <FontAwesomeIcon icon={faEdit} className="h-5 w-5" />
              </button>

              {/* Botão Excluir */}
              <button
                onClick={handleDeleteSelected}
                className={`${selectedForDeletion.length === 0 ? 'bg-red-300' : 'bg-red-500 hover:bg-red-600'} text-white h-10 w-10 rounded-md flex items-center justify-center transition-colors`}
                disabled={selectedForDeletion.length === 0}
              >
                <FontAwesomeIcon icon={faTrash} className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Tabela de fornecedores */}
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#81059e]"></div>
            </div>
          ) : error ? (
            <div className="text-red-600 text-center py-8">{error}</div>
          ) : (
            <div className="w-full overflow-x-auto">
              {filteredFornecedores.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Nenhum fornecedor encontrado.
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="min-w-full table-auto select-none">
                      <thead>
                        <tr className="bg-[#81059e] text-white">
                          <th className="px-3 py-2 w-12">
                            <span className="sr-only">Selecionar</span>
                          </th>
                          <th className="px-3 py-2 cursor-pointer" onClick={() => handleSort('cnpj')}>
                            CNPJ {renderSortArrow('cnpj')}
                          </th>
                          <th className="px-3 py-2 cursor-pointer" onClick={() => handleSort('nomeFantasia')}>
                            Nome Fantasia {renderSortArrow('nomeFantasia')}
                          </th>
                          <th className="px-3 py-2 cursor-pointer" onClick={() => handleSort('razaoSocial')}>
                            Razão Social {renderSortArrow('razaoSocial')}
                          </th>
                          <th className="px-3 py-2 cursor-pointer" onClick={() => handleSort('telefone')}>
                            Telefone {renderSortArrow('telefone')}
                          </th>
                          <th className="px-3 py-2 cursor-pointer" onClick={() => handleSort('email')}>
                            Email {renderSortArrow('email')}
                          </th>
                          <th className="px-3 py-2 cursor-pointer" onClick={() => handleSort('endereco.cidade')}>
                            Cidade {renderSortArrow('endereco.cidade')}
                          </th>
                          <th className="px-3 py-2 cursor-pointer" onClick={() => handleSort('endereco.estado')}>
                            Estado {renderSortArrow('endereco.estado')}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {renderFornecedores()}
                      </tbody>
                    </table>
                  </div>

                  {/* Paginação */}
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-gray-700">
                      Mostrando <span className="font-medium">{indexOfFirstItem + 1}</span> a{' '}
                      <span className="font-medium">
                        {Math.min(indexOfLastItem, filteredFornecedores.length)}
                      </span>{' '}
                      de <span className="font-medium">{filteredFornecedores.length}</span> registros
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

          {/* Modal de Detalhamento */}
          {isModalOpen && selectedFornecedor && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
              <div className="bg-white rounded-lg shadow-lg w-full max-w-md flex flex-col h-3/5 overflow-hidden">
                <div className="bg-[#81059e] text-white p-4 flex justify-between items-center">
                  <h3 className="text-xl font-bold">Detalhes do Fornecedor</h3>
                  <FontAwesomeIcon
                    icon={faX}
                    className="h-5 w-5 text-white cursor-pointer hover:text-gray-200"
                    onClick={closeModal}
                  />
                </div>
                <div className="space-y-3 p-4 overflow-y-auto flex-grow">
                  <p><strong>Razão Social:</strong> {selectedFornecedor.razaoSocial || 'N/A'}</p>
                  <p><strong>Nome Fantasia:</strong> {selectedFornecedor.nomeFantasia || 'N/A'}</p>
                  <p><strong>CNPJ:</strong> {formatCNPJ(selectedFornecedor.cnpj)}</p>
                  <p><strong>Email:</strong> {selectedFornecedor.email || 'N/A'}</p>
                  <p><strong>Telefone:</strong> {formatPhone(selectedFornecedor.telefone)}</p>
                  <p><strong>Celular:</strong> {formatPhone(selectedFornecedor.celular)}</p>
                  <p><strong>Representante:</strong> {selectedFornecedor.representante || 'N/A'}</p>
                  
                  {selectedFornecedor.endereco && (
                    <div className="mt-4">
                      <strong>Endereço:</strong>
                      <div className="ml-4 text-sm text-gray-600">
                        <p>{selectedFornecedor.endereco.logradouro}, {selectedFornecedor.endereco.numero}</p>
                        {selectedFornecedor.endereco.complemento && (
                          <p>{selectedFornecedor.endereco.complemento}</p>
                        )}
                        <p>{selectedFornecedor.endereco.bairro}</p>
                        <p>{selectedFornecedor.endereco.cidade} - {selectedFornecedor.endereco.estado}</p>
                        <p>CEP: {selectedFornecedor.endereco.cep}</p>
                      </div>
                    </div>
                  )}
                  
                  <p><strong>Cadastrado em:</strong> {formatDate(selectedFornecedor.dataCadastro)}</p>

                  <div className="flex justify-around mt-6">
                    <button
                      onClick={generatePDF}
                      className="bg-[#81059e] text-white px-4 py-2 rounded-md flex items-center hover:bg-[#690480] transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      Ver PDF
                    </button>
                    <button
                      onClick={handlePrint}
                      className="bg-[#81059e] text-white px-4 py-2 rounded-md flex items-center hover:bg-[#690480] transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                      </svg>
                      Imprimir
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Modal de Edição */}
          {isEditModalOpen && editingFornecedor && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
              <div className="bg-white rounded-lg shadow-lg w-full max-w-md flex flex-col h-3/5 overflow-hidden">
                <div className="bg-[#81059e] text-white p-4 flex justify-between items-center">
                  <h3 className="text-xl font-bold">Editar Fornecedor</h3>
                  <FontAwesomeIcon
                    icon={faX}
                    className="h-5 w-5 text-white cursor-pointer hover:text-gray-200"
                    onClick={() => setIsEditModalOpen(false)}
                  />
                </div>

                <div className="space-y-3 p-4 overflow-y-auto flex-grow">
                  <div>
                    <label className="text-[#81059e] font-medium">Nome Fantasia:</label>
                    <input
                      type="text"
                      value={editingFornecedor.nomeFantasia || ''}
                      onChange={(e) => setEditingFornecedor({ ...editingFornecedor, nomeFantasia: e.target.value })}
                      className="w-full p-2 border-2 border-[#81059e] rounded-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="text-[#81059e] font-medium">Razão Social:</label>
                    <input
                      type="text"
                      value={editingFornecedor.razaoSocial || ''}
                      onChange={(e) => setEditingFornecedor({ ...editingFornecedor, razaoSocial: e.target.value })}
                      className="w-full p-2 border-2 border-[#81059e] rounded-sm"
                    />
                  </div>

                  <div>
                    <label className="text-[#81059e] font-medium">Email:</label>
                    <input
                      type="email"
                      value={editingFornecedor.email || ''}
                      onChange={(e) => setEditingFornecedor({ ...editingFornecedor, email: e.target.value })}
                      className="w-full p-2 border-2 border-[#81059e] rounded-sm"
                    />
                  </div>

                  <div>
                    <label className="text-[#81059e] font-medium">Telefone:</label>
                    <input
                      type="text"
                      value={editingFornecedor.telefone || ''}
                      onChange={(e) => setEditingFornecedor({ ...editingFornecedor, telefone: e.target.value })}
                      className="w-full p-2 border-2 border-[#81059e] rounded-sm"
                    />
                  </div>

                  <div>
                    <label className="text-[#81059e] font-medium">Representante:</label>
                    <input
                      type="text"
                      value={editingFornecedor.representante || ''}
                      onChange={(e) => setEditingFornecedor({ ...editingFornecedor, representante: e.target.value })}
                      className="w-full p-2 border-2 border-[#81059e] rounded-sm"
                    />
                  </div>
                </div>

                <div className="p-4 bg-gray-50 border-t flex justify-end space-x-2">
                  <button
                    onClick={() => setIsEditModalOpen(false)}
                    className="text-[#81059e] px-4 py-2 rounded-md hover:bg-gray-100 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="bg-[#81059e] text-white px-4 py-2 rounded-sm hover:bg-[#690480] transition-colors"
                  >
                    Salvar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}