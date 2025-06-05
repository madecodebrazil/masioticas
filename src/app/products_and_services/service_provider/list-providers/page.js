"use client";

import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUserCheck,
  faUsers,
  faMapMarkerAlt,
  faPhone,
  faX,
  faEdit,
  faTrash,
  faPlus
} from '@fortawesome/free-solid-svg-icons';
import { collection, getDocs, doc, deleteDoc, setDoc } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
import { firestore } from '../../../../lib/firebaseConfig';
import jsPDF from 'jspdf';

export default function ListaPrestadores() {
  const { userPermissions, userData } = useAuth();
  const [prestadores, setPrestadores] = useState([]);
  const [filteredPrestadores, setFilteredPrestadores] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPrestador, setSelectedPrestador] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalPrestadores, setTotalPrestadores] = useState(0);
  const [selectedForDeletion, setSelectedForDeletion] = useState([]);
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPrestador, setEditingPrestador] = useState(null);
  
  // Estados para estatísticas
  const [prestadoresAtivos, setPrestadoresAtivos] = useState(0);
  const [cidadesUnicas, setCidadesUnicas] = useState(0);
  const [prestadoresPorCidade, setPrestadoresPorCidade] = useState({});

  useEffect(() => {
    const fetchPrestadores = async () => {
      try {
        setLoading(true);
        const prestadoresRef = collection(firestore, 'reparo_prestador');
        const prestadoresSnapshot = await getDocs(prestadoresRef);
        
        const fetchedPrestadores = [];
        prestadoresSnapshot.docs.forEach((docItem) => {
          const prestadorData = docItem.data();
          fetchedPrestadores.push({
            id: docItem.id,
            ...prestadorData
          });
        });

        // Aplicar ordenação inicial
        const sortedPrestadores = sortPrestadores(fetchedPrestadores, sortField, sortDirection);
        setPrestadores(sortedPrestadores);
        setFilteredPrestadores(sortedPrestadores);
        setTotalPrestadores(sortedPrestadores.length);
        
        // Calcular estatísticas
        calcularEstatisticas(sortedPrestadores);
        
        setLoading(false);
      } catch (err) {
        console.error('Erro ao carregar prestadores:', err);
        setError(`Erro ao carregar os dados dos prestadores: ${err.message}`);
        setLoading(false);
      }
    };

    fetchPrestadores();
  }, [sortField, sortDirection]);

  // Função para calcular estatísticas
  const calcularEstatisticas = (prestadoresList) => {
    const ativos = prestadoresList.filter(p => p.status === 'ativo' || !p.status).length;
    setPrestadoresAtivos(ativos);

    const cidades = new Set();
    const cidadeCount = {};
    
    prestadoresList.forEach(prestador => {
      const cidade = prestador.endereco?.cidade || prestador.cidade;
      if (cidade) {
        cidades.add(cidade);
        cidadeCount[cidade] = (cidadeCount[cidade] || 0) + 1;
      }
    });
    
    setCidadesUnicas(cidades.size);
    setPrestadoresPorCidade(cidadeCount);
  };

  // Função para filtrar prestadores com base na busca
  useEffect(() => {
    const filterBySearch = () => {
      let filtered = prestadores;

      if (searchQuery !== '') {
        filtered = filtered.filter(
          (prestador) =>
            (prestador.name?.toLowerCase().includes(searchQuery.toLowerCase()) || '') ||
            (prestador.apelido?.toLowerCase().includes(searchQuery.toLowerCase()) || '') ||
            (prestador.cpf?.includes(searchQuery.replace(/\D/g, '')) || '') ||
            (prestador.endereco?.cidade?.toLowerCase().includes(searchQuery.toLowerCase()) || '') ||
            (prestador.cidade?.toLowerCase().includes(searchQuery.toLowerCase()) || '') ||
            (prestador.email?.toLowerCase().includes(searchQuery.toLowerCase()) || '')
        );
      }

      // Aplicar ordenação
      filtered = sortPrestadores(filtered, sortField, sortDirection);
      setFilteredPrestadores(filtered);
      setCurrentPage(1); // Reset para primeira página ao filtrar
    };

    filterBySearch();
  }, [searchQuery, prestadores, sortField, sortDirection]);

  // Função para ordenar prestadores
  const sortPrestadores = (prestadoresToSort, field, direction) => {
    return [...prestadoresToSort].sort((a, b) => {
      let aValue = a[field];
      let bValue = b[field];

      // Tratar campos aninhados
      if (field.includes('.')) {
        const keys = field.split('.');
        aValue = keys.reduce((obj, key) => obj?.[key], a);
        bValue = keys.reduce((obj, key) => obj?.[key], b);
      }

      // Tratar datas
      if (field === 'createdAt' || field === 'updatedAt') {
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

  // Formatar CPF
  const formatCPF = (cpf) => {
    if (!cpf) return 'N/A';
    const numericCPF = cpf.replace(/\D/g, '');
    if (numericCPF.length === 11) {
      return numericCPF.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    return cpf;
  };

  // Formatar telefone
  const formatPhone = (phone) => {
    if (!phone) return 'N/A';
    const numericPhone = phone.replace(/\D/g, '');
    if (numericPhone.length === 11) {
      return numericPhone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
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
  const openModal = (prestador) => {
    setSelectedPrestador(prestador);
    setIsModalOpen(true);
  };

  // Função para fechar o modal
  const closeModal = () => {
    setSelectedPrestador(null);
    setIsModalOpen(false);
  };

  // Função para gerar PDF
  const generatePDF = () => {
    if (!selectedPrestador) return;

    const doc = new jsPDF();
    doc.text(`Detalhes do Prestador`, 10, 10);
    doc.text(`Nome: ${selectedPrestador.name || 'N/A'}`, 10, 20);
    doc.text(`Apelido: ${selectedPrestador.apelido || 'N/A'}`, 10, 30);
    doc.text(`CPF: ${formatCPF(selectedPrestador.cpf)}`, 10, 40);
    doc.text(`Email: ${selectedPrestador.email || 'N/A'}`, 10, 50);
    doc.text(`Telefone: ${formatPhone(selectedPrestador.telefone)}`, 10, 60);
    
    if (selectedPrestador.endereco || selectedPrestador.cidade) {
      doc.text(`Endereço:`, 10, 70);
      doc.text(`${selectedPrestador.endereco?.logradouro || ''} ${selectedPrestador.endereco?.numero || ''}`, 10, 80);
      doc.text(`${selectedPrestador.endereco?.bairro || ''} - ${selectedPrestador.endereco?.cidade || selectedPrestador.cidade || ''}`, 10, 90);
      doc.text(`${selectedPrestador.endereco?.estado || ''} - CEP: ${selectedPrestador.endereco?.cep || ''}`, 10, 100);
    }
    
    doc.text(`Status: ${selectedPrestador.status || 'Ativo'}`, 10, 110);
    doc.text(`Cadastrado em: ${formatDate(selectedPrestador.createdAt)}`, 10, 120);

    doc.save(`Prestador_${selectedPrestador.name || selectedPrestador.id}.pdf`);
  };

  // Função para lidar com a impressão
  const handlePrint = () => {
    window.print();
  };

  // Função para marcar ou desmarcar prestador para exclusão
  const toggleDeletion = (e, prestadorId) => {
    e.stopPropagation();
    setSelectedForDeletion(prev => {
      if (prev.includes(prestadorId)) {
        return prev.filter(id => id !== prestadorId);
      } else {
        return [...prev, prestadorId];
      }
    });
  };

  // Função para excluir prestadores selecionados
  const handleDeleteSelected = async () => {
    if (selectedForDeletion.length === 0) {
      alert('Selecione pelo menos um prestador para excluir.');
      return;
    }

    if (confirm(`Deseja realmente excluir ${selectedForDeletion.length} prestador(es) selecionado(s)?`)) {
      try {
        for (const prestadorId of selectedForDeletion) {
          const prestadorRef = doc(firestore, 'reparo_prestador', prestadorId);
          await deleteDoc(prestadorRef);
        }

        const updatedPrestadores = prestadores.filter(prestador => !selectedForDeletion.includes(prestador.id));
        setPrestadores(updatedPrestadores);
        setFilteredPrestadores(updatedPrestadores.filter(p =>
          !searchQuery ||
          p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.apelido?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.cpf?.includes(searchQuery.replace(/\D/g, '')) ||
          p.endereco?.cidade?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.email?.toLowerCase().includes(searchQuery.toLowerCase())
        ));
        setTotalPrestadores(updatedPrestadores.length);
        calcularEstatisticas(updatedPrestadores);
        setSelectedForDeletion([]);

        alert('Prestadores excluídos com sucesso!');
      } catch (error) {
        console.error('Erro ao excluir prestadores:', error);
        alert('Erro ao excluir os prestadores selecionados.');
      }
    }
  };

  // Função para abrir modal de edição
  const openEditModal = () => {
    if (selectedForDeletion.length !== 1) return;
    const prestadorToEdit = prestadores.find(prestador => prestador.id === selectedForDeletion[0]);
    if (prestadorToEdit) {
      setEditingPrestador({ ...prestadorToEdit });
      setIsEditModalOpen(true);
    }
  };

  // Função para salvar edição
  const handleSaveEdit = async () => {
    try {
      const prestadorRef = doc(firestore, 'reparo_prestador', editingPrestador.id);
      await setDoc(prestadorRef, { ...editingPrestador, updatedAt: new Date() }, { merge: true });

      setPrestadores(prevPrestadores =>
        prevPrestadores.map(prestador => prestador.id === editingPrestador.id ? editingPrestador : prestador)
      );

      setFilteredPrestadores(prevFiltered =>
        prevFiltered.map(prestador => prestador.id === editingPrestador.id ? editingPrestador : prestador)
      );

      setSelectedForDeletion([]);
      setIsEditModalOpen(false);
      alert('Prestador atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar prestador:', error);
      alert('Erro ao atualizar o prestador.');
    }
  };

  // Calcular prestadores para a página atual
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentPrestadores = filteredPrestadores.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredPrestadores.length / itemsPerPage);

  // Funções de navegação
  const goToPage = (pageNumber) => {
    setCurrentPage(Math.max(1, Math.min(pageNumber, totalPages)));
  };

  // Renderizar prestadores na tabela
  const renderPrestadores = () => {
    return currentPrestadores.map((prestador) => (
      <tr
        key={prestador.id}
        className="text-black text-left hover:bg-gray-100 cursor-pointer"
        onClick={() => openModal(prestador)}
      >
        <td className="border px-2 py-2 text-center" onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={selectedForDeletion.includes(prestador.id)}
            onChange={(e) => toggleDeletion(e, prestador.id)}
            className="h-4 w-4 cursor-pointer"
          />
        </td>
        <td className="border px-3 py-2 max-w-[200px] truncate">
          {prestador.name || 'N/A'}
        </td>
        <td className="border px-3 py-2">
          {prestador.apelido || 'N/A'}
        </td>
        <td className="border px-3 py-2 font-mono text-sm">
          {formatCPF(prestador.cpf)}
        </td>
        <td className="border px-3 py-2 font-mono text-sm">
          {formatPhone(prestador.telefone)}
        </td>
        <td className="border px-3 py-2 max-w-[150px] truncate">
          {prestador.email || 'N/A'}
        </td>
        <td className="border px-3 py-2">
          {prestador.endereco?.cidade || prestador.cidade || 'N/A'}
        </td>
        <td className="border px-3 py-2 text-center">
          <span className={`px-2 py-1 rounded text-xs ${
            (prestador.status === 'ativo' || !prestador.status) 
              ? 'bg-green-200 text-green-800' 
              : 'bg-red-200 text-red-800'
          }`}>
            {prestador.status === 'ativo' || !prestador.status ? 'Ativo' : 'Inativo'}
          </span>
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
              PRESTADORES DE SERVIÇO
            </h2>
          </div>

          {/* Dashboard com estatísticas */}
          <div className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              {/* Card - Total de Prestadores */}
              <div className="border-2 rounded-lg p-4 border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <FontAwesomeIcon
                    icon={faUsers}
                    className="h-8 w-8 text-[#81059e] bg-purple-300 p-2 rounded-2xl"
                  />
                  <span className="text-lg font-medium text-gray-700 flex-grow ml-3">Total de Prestadores</span>
                </div>
                <p className="text-2xl font-semibold text-center mt-2">{totalPrestadores}</p>
              </div>

              {/* Card - Prestadores Ativos */}
              <div className="border-2 rounded-lg p-4 border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <FontAwesomeIcon
                    icon={faUserCheck}
                    className="h-8 w-8 text-[#81059e] bg-purple-300 p-2 rounded-2xl"
                  />
                  <span className="text-lg font-medium text-gray-700 flex-grow ml-3">Ativos</span>
                </div>
                <p className="text-2xl font-semibold text-center mt-2">{prestadoresAtivos}</p>
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

              {/* Card - Contatos */}
              <div className="border-2 rounded-lg p-4 border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <FontAwesomeIcon
                    icon={faPhone}
                    className="h-8 w-8 text-[#81059e] bg-purple-300 p-2 rounded-2xl"
                  />
                  <span className="text-lg font-medium text-gray-700 flex-grow ml-3">Com Telefone</span>
                </div>
                <p className="text-2xl font-semibold text-center mt-2">
                  {prestadores.filter(p => p.telefone).length}
                </p>
              </div>
            </div>
          </div>

          {/* Barra de busca e botões de ação */}
          <div className="flex flex-wrap gap-2 items-center mb-4">
            {/* Barra de busca */}
            <input
              type="text"
              placeholder="Busque por nome, CPF, telefone ou cidade"
              className="p-2 h-10 flex-grow min-w-[200px] border-2 border-gray-200 rounded-lg text-black"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            {/* Botões de ação */}
            <div className="flex gap-2">
              {/* Botão Adicionar */}
              <Link href="/products_and_services/service_provider">
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

          {/* Tabela de prestadores */}
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#81059e]"></div>
            </div>
          ) : error ? (
            <div className="text-red-600 text-center py-8">{error}</div>
          ) : (
            <div className="w-full overflow-x-auto">
              {filteredPrestadores.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Nenhum prestador encontrado.
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
                          <th className="px-3 py-2 cursor-pointer" onClick={() => handleSort('name')}>
                            Nome {renderSortArrow('name')}
                          </th>
                          <th className="px-3 py-2 cursor-pointer" onClick={() => handleSort('apelido')}>
                            Apelido {renderSortArrow('apelido')}
                          </th>
                          <th className="px-3 py-2 cursor-pointer" onClick={() => handleSort('cpf')}>
                            CPF {renderSortArrow('cpf')}
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
                          <th className="px-3 py-2 cursor-pointer" onClick={() => handleSort('status')}>
                            Status {renderSortArrow('status')}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {renderPrestadores()}
                      </tbody>
                    </table>
                  </div>

                  {/* Paginação */}
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-gray-700">
                      Mostrando <span className="font-medium">{indexOfFirstItem + 1}</span> a{' '}
                      <span className="font-medium">
                        {Math.min(indexOfLastItem, filteredPrestadores.length)}
                      </span>{' '}
                      de <span className="font-medium">{filteredPrestadores.length}</span> registros
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
          {isModalOpen && selectedPrestador && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
              <div className="bg-white rounded-lg shadow-lg w-full max-w-md flex flex-col h-3/5 overflow-hidden">
                <div className="bg-[#81059e] text-white p-4 flex justify-between items-center">
                  <h3 className="text-xl font-bold">Detalhes do Prestador</h3>
                  <FontAwesomeIcon
                    icon={faX}
                    className="h-5 w-5 text-white cursor-pointer hover:text-gray-200"
                    onClick={closeModal}
                  />
                </div>
                <div className="space-y-3 p-4 overflow-y-auto flex-grow">
                  <p><strong>Nome:</strong> {selectedPrestador.name || 'N/A'}</p>
                  <p><strong>Apelido:</strong> {selectedPrestador.apelido || 'N/A'}</p>
                  <p><strong>CPF:</strong> {formatCPF(selectedPrestador.cpf)}</p>
                  <p><strong>Email:</strong> {selectedPrestador.email || 'N/A'}</p>
                  <p><strong>Telefone:</strong> {formatPhone(selectedPrestador.telefone)}</p>
                  
                  {(selectedPrestador.endereco || selectedPrestador.cidade) && (
                    <div className="mt-4">
                      <strong>Endereço:</strong>
                      <div className="ml-4 text-sm text-gray-600">
                        {selectedPrestador.endereco?.logradouro && (
                          <p>{selectedPrestador.endereco.logradouro}, {selectedPrestador.endereco.numero}</p>
                        )}
                        {selectedPrestador.endereco?.complemento && (
                          <p>{selectedPrestador.endereco.complemento}</p>
                        )}
                        <p>{selectedPrestador.endereco?.bairro || ''}</p>
                        <p>{selectedPrestador.endereco?.cidade || selectedPrestador.cidade || ''} - {selectedPrestador.endereco?.estado || ''}</p>
                        {selectedPrestador.endereco?.cep && (
                          <p>CEP: {selectedPrestador.endereco.cep}</p>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <p><strong>Status:</strong> 
                    <span className={`ml-2 px-2 py-1 rounded text-xs ${
                      (selectedPrestador.status === 'ativo' || !selectedPrestador.status) 
                        ? 'bg-green-200 text-green-800' 
                        : 'bg-red-200 text-red-800'
                    }`}>
                      {selectedPrestador.status === 'ativo' || !selectedPrestador.status ? 'Ativo' : 'Inativo'}
                    </span>
                  </p>
                  
                  <p><strong>Cadastrado em:</strong> {formatDate(selectedPrestador.createdAt)}</p>
                  
                  {selectedPrestador.updatedAt && (
                    <p><strong>Última atualização:</strong> {formatDate(selectedPrestador.updatedAt)}</p>
                  )}

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
          {isEditModalOpen && editingPrestador && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
              <div className="bg-white rounded-lg shadow-lg w-full max-w-md flex flex-col h-3/5 overflow-hidden">
                <div className="bg-[#81059e] text-white p-4 flex justify-between items-center">
                  <h3 className="text-xl font-bold">Editar Prestador</h3>
                  <FontAwesomeIcon
                    icon={faX}
                    className="h-5 w-5 text-white cursor-pointer hover:text-gray-200"
                    onClick={() => setIsEditModalOpen(false)}
                  />
                </div>

                <div className="space-y-3 p-4 overflow-y-auto flex-grow">
                  <div>
                    <label className="text-[#81059e] font-medium">Nome:</label>
                    <input
                      type="text"
                      value={editingPrestador.name || ''}
                      onChange={(e) => setEditingPrestador({ ...editingPrestador, name: e.target.value })}
                      className="w-full p-2 border-2 border-[#81059e] rounded-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="text-[#81059e] font-medium">Apelido:</label>
                    <input
                      type="text"
                      value={editingPrestador.apelido || ''}
                      onChange={(e) => setEditingPrestador({ ...editingPrestador, apelido: e.target.value })}
                      className="w-full p-2 border-2 border-[#81059e] rounded-sm"
                    />
                  </div>

                  <div>
                    <label className="text-[#81059e] font-medium">Email:</label>
                    <input
                      type="email"
                      value={editingPrestador.email || ''}
                      onChange={(e) => setEditingPrestador({ ...editingPrestador, email: e.target.value })}
                      className="w-full p-2 border-2 border-[#81059e] rounded-sm"
                    />
                  </div>

                  <div>
                    <label className="text-[#81059e] font-medium">Telefone:</label>
                    <input
                      type="text"
                      value={editingPrestador.telefone || ''}
                      onChange={(e) => setEditingPrestador({ ...editingPrestador, telefone: e.target.value })}
                      className="w-full p-2 border-2 border-[#81059e] rounded-sm"
                    />
                  </div>

                  <div>
                    <label className="text-[#81059e] font-medium">Status:</label>
                    <select
                      value={editingPrestador.status || 'ativo'}
                      onChange={(e) => setEditingPrestador({ ...editingPrestador, status: e.target.value })}
                      className="w-full p-2 border-2 border-[#81059e] rounded-sm"
                    >
                      <option value="ativo">Ativo</option>
                      <option value="inativo">Inativo</option>
                    </select>
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