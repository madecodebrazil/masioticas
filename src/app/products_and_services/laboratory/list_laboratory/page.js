"use client";

import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFlask,
  faBuilding,
  faClock,
  faExclamationTriangle,
  faX,
  faEdit,
  faTrash
} from '@fortawesome/free-solid-svg-icons';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
import { firestore } from '../../../../lib/firebaseConfig';
import jsPDF from 'jspdf';

export default function ListaLaboratorios() {
  const { userPermissions, userData } = useAuth();
  const [laboratorios, setLaboratorios] = useState([]);
  const [filteredLaboratorios, setFilteredLaboratorios] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLaboratorio, setSelectedLaboratorio] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalLaboratorios, setTotalLaboratorios] = useState(0);
  const [selectedForDeletion, setSelectedForDeletion] = useState([]);
  const [sortField, setSortField] = useState('razaoSocial');
  const [sortDirection, setSortDirection] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingLaboratorio, setEditingLaboratorio] = useState(null);

  useEffect(() => {
    const fetchLaboratorios = async () => {
      try {
        setLoading(true);
        const fetchedLaboratorios = [];

        // Laboratórios são globais - buscar apenas uma vez
        const laboratoriosRef = collection(firestore, `lojas/laboratorio/items`);
        const laboratoriosSnapshot = await getDocs(laboratoriosRef);

        laboratoriosSnapshot.docs.forEach((docItem) => {
          const laboratorioData = docItem.data();
          fetchedLaboratorios.push({
            id: docItem.id,
            ...laboratorioData,
            loja: 'Global'
          });
        });

        // Aplicar ordenação inicial
        const sortedLaboratorios = sortLaboratorios(fetchedLaboratorios, sortField, sortDirection);
        setLaboratorios(sortedLaboratorios);
        setFilteredLaboratorios(sortedLaboratorios);
        setTotalLaboratorios(sortedLaboratorios.length);
        setLoading(false);
      } catch (err) {
        console.error('Erro ao carregar os laboratórios:', err);
        setError(`Erro ao carregar os dados dos laboratórios: ${err.message}`);
        setLoading(false);
      }
    };

    fetchLaboratorios();
  }, [userPermissions]);

  // Função para filtrar laboratórios apenas por busca
  useEffect(() => {
    const filterBySearch = () => {
      let filtered = laboratorios;

      // Filtro por busca
      if (searchQuery !== '') {
        filtered = filtered.filter(
          (lab) =>
            (lab.razaoSocial?.toLowerCase().includes(searchQuery.toLowerCase()) || '') ||
            (lab.nomeFantasia?.toLowerCase().includes(searchQuery.toLowerCase()) || '') ||
            (lab.cnpj?.toLowerCase().includes(searchQuery.toLowerCase()) || '')
        );
      }

      // Aplicar ordenação
      filtered = sortLaboratorios(filtered, sortField, sortDirection);
      setFilteredLaboratorios(filtered);
    };

    filterBySearch();
  }, [searchQuery, laboratorios, sortField, sortDirection]);

  // Função para ordenar laboratórios
  const sortLaboratorios = (labsToSort, field, direction) => {
    return [...labsToSort].sort((a, b) => {
      let aValue = a[field];
      let bValue = b[field];

      // Tratar datas (objetos Firestore Timestamp ou strings de data)
      if (field === 'dataRegistro') {
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

    // Se for um timestamp do Firestore
    if (typeof date === 'object' && date.seconds) {
      return new Date(date.seconds * 1000);
    }

    // Se for uma string ou outro formato, tentar converter para Date
    return new Date(date);
  };

  // Função para alternar a ordenação
  const handleSort = (field) => {
    const direction = field === sortField && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortDirection(direction);

    // Reordenar os laboratórios filtrados
    const sorted = sortLaboratorios(filteredLaboratorios, field, direction);
    setFilteredLaboratorios(sorted);
  };

  // Renderizar seta de ordenação - apenas quando a coluna estiver selecionada
  const renderSortArrow = (field) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ?
      <span className="ml-1">↑</span> :
      <span className="ml-1">↓</span>;
  };

  // Formata data do Firebase
  const formatFirestoreDate = (firestoreDate) => {
    if (!firestoreDate) return 'N/A';

    // Se for um timestamp do Firestore (com seconds e nanoseconds)
    if (firestoreDate && typeof firestoreDate === 'object' && firestoreDate.seconds) {
      const date = new Date(firestoreDate.seconds * 1000);
      return date.toLocaleDateString('pt-BR');
    }

    // Se já for uma string de data, retorne como está
    return firestoreDate;
  };

  // Formata CNPJ
  const formatCNPJ = (cnpj) => {
    if (!cnpj) return 'N/A';
    
    // Remover caracteres não numéricos
    const numericCNPJ = cnpj.replace(/\D/g, '');
    
    // Verificar se tem 14 dígitos
    if (numericCNPJ.length !== 14) return cnpj;
    
    // Formatar o CNPJ: XX.XXX.XXX/XXXX-XX
    return numericCNPJ.replace(
      /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
      '$1.$2.$3/$4-$5'
    );
  };

  // Função para abrir o modal e definir o laboratório selecionado
  const openModal = (lab) => {
    setSelectedLaboratorio(lab);
    setIsModalOpen(true);
  };

  // Função para fechar o modal
  const closeModal = () => {
    setSelectedLaboratorio(null);
    setIsModalOpen(false);
  };

  // Função para gerar PDF
  const generatePDF = () => {
    if (!selectedLaboratorio) return;

    const doc = new jsPDF();
    doc.text(`Detalhes do Laboratório`, 10, 10);
    doc.text(`CNPJ: ${formatCNPJ(selectedLaboratorio.cnpj) || 'N/A'}`, 10, 20);
    doc.text(`Razão Social: ${selectedLaboratorio.razaoSocial || 'N/A'}`, 10, 30);
    doc.text(`Nome Fantasia: ${selectedLaboratorio.nomeFantasia || 'N/A'}`, 10, 40);
    doc.text(`Email: ${selectedLaboratorio.email || 'N/A'}`, 10, 50);
    doc.text(`Telefone: ${selectedLaboratorio.telefone || 'N/A'}`, 10, 60);
    doc.text(`Endereço: ${getEnderecoCompleto(selectedLaboratorio)}`, 10, 70);
    doc.text(`Data de Registro: ${formatFirestoreDate(selectedLaboratorio.dataRegistro) || 'N/A'}`, 10, 80);

    doc.save(`Laboratorio_${selectedLaboratorio.nomeFantasia || selectedLaboratorio.id}.pdf`);
  };

  // Função para obter endereço completo formatado
  const getEnderecoCompleto = (lab) => {
    const partes = [];
    if (lab.logradouro) partes.push(lab.logradouro);
    if (lab.numero) partes.push(lab.numero);
    if (lab.bairro) partes.push(lab.bairro);
    if (lab.cidade) {
      if (lab.estado) {
        partes.push(`${lab.cidade}/${lab.estado}`);
      } else {
        partes.push(lab.cidade);
      }
    }
    if (lab.cep) partes.push(`CEP: ${lab.cep}`);
    
    return partes.length > 0 ? partes.join(', ') : 'Não informado';
  };

  // Função para lidar com a impressão
  const handlePrint = () => {
    window.print();
  };

  // Função para marcar ou desmarcar laboratório para exclusão
  const toggleDeletion = (e, labId) => {
    e.stopPropagation(); // Evitar abrir o modal

    setSelectedForDeletion(prev => {
      if (prev.includes(labId)) {
        return prev.filter(id => id !== labId);
      } else {
        return [...prev, labId];
      }
    });
  };

  // Função para excluir os laboratórios selecionados
  const handleDeleteSelected = async () => {
    if (selectedForDeletion.length === 0) {
      alert('Selecione pelo menos um laboratório para excluir.');
      return;
    }

    if (confirm(`Deseja realmente excluir ${selectedForDeletion.length} laboratório(s) selecionado(s)?`)) {
      try {
        for (const labId of selectedForDeletion) {
          // Excluir o laboratório da coleção global
          const labRef = doc(firestore, `lojas/laboratorio/items`, labId);
          await deleteDoc(labRef);
        }

        // Atualizar as listas de laboratórios
        const updatedLaboratorios = laboratorios.filter(lab => !selectedForDeletion.includes(lab.id));
        setLaboratorios(updatedLaboratorios);
        setFilteredLaboratorios(updatedLaboratorios.filter(l =>
          (!searchQuery ||
            l.razaoSocial?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            l.nomeFantasia?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            l.cnpj?.toLowerCase().includes(searchQuery.toLowerCase()))
        ));
        setTotalLaboratorios(updatedLaboratorios.length);
        setSelectedForDeletion([]);

        alert('Laboratório(s) excluído(s) com sucesso!');
      } catch (error) {
        console.error('Erro ao excluir laboratórios:', error);
        alert('Erro ao excluir os laboratórios selecionados.');
      }
    }
  };

  // Função Editar
  const openEditModal = () => {
    if (selectedForDeletion.length !== 1) return;

    // Encontrar o laboratório selecionado
    const labToEdit = laboratorios.find(lab => lab.id === selectedForDeletion[0]);

    if (labToEdit) {
      setEditingLaboratorio({ ...labToEdit });
      setIsEditModalOpen(true);
    }
  };

  const handleSaveEdit = async () => {
    try {
      // Validar os campos obrigatórios
      if (!editingLaboratorio.razaoSocial || !editingLaboratorio.cnpj) {
        alert('Razão Social e CNPJ são campos obrigatórios.');
        return;
      }

      // Adicionar data de atualização
      const updatedLab = {
        ...editingLaboratorio,
        dataAtualizacao: new Date()
      };

      // Referência ao documento
      const labRef = doc(firestore, `lojas/laboratorio/items`, editingLaboratorio.id);

      // Salvar no Firestore
      await setDoc(labRef, updatedLab, { merge: true });

      // Atualizar estados locais
      setLaboratorios(prevLabs =>
        prevLabs.map(lab => lab.id === editingLaboratorio.id ? updatedLab : lab)
      );

      setFilteredLaboratorios(prevFiltered =>
        prevFiltered.map(lab => lab.id === editingLaboratorio.id ? updatedLab : lab)
      );

      // Limpar seleção e fechar modal
      setSelectedForDeletion([]);
      setIsEditModalOpen(false);

      alert('Laboratório atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar laboratório:', error);
      alert('Erro ao atualizar o laboratório.');
    }
  };

  // Calcular laboratórios para a página atual
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentLaboratorios = filteredLaboratorios.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredLaboratorios.length / itemsPerPage);

  // Funções de navegação
  const goToPage = (pageNumber) => {
    setCurrentPage(Math.max(1, Math.min(pageNumber, totalPages)));
  };

  // Renderizar laboratórios
  const renderLaboratorios = () => {
    return currentLaboratorios.map((lab) => (
      <tr
        key={lab.id}
        className="text-black text-left hover:bg-gray-100 cursor-pointer"
      >
        <td className="border px-2 py-2 text-center">
          <input
            type="checkbox"
            checked={selectedForDeletion.includes(lab.id)}
            onChange={(e) => toggleDeletion(e, lab.id)}
            className="h-4 w-4 cursor-pointer"
            onClick={(e) => e.stopPropagation()}
          />
        </td>
        <td className="border px-3 py-2 whitespace-nowrap" onClick={() => openModal(lab)}>
          {formatCNPJ(lab.cnpj) || 'N/A'}
        </td>
        <td className="border px-4 py-2 max-w-[300px] truncate" onClick={() => openModal(lab)}>
          {lab.razaoSocial || 'N/A'}
        </td>
        <td className="border px-3 py-2 whitespace-nowrap" onClick={() => openModal(lab)}>
          {lab.nomeFantasia || 'N/A'}
        </td>
        <td className="border px-3 py-2 whitespace-nowrap" onClick={() => openModal(lab)}>
          {lab.telefone || 'N/A'}
        </td>
        <td className="border px-3 py-2 whitespace-nowrap" onClick={() => openModal(lab)}>
          {lab.email || 'N/A'}
        </td>
        <td className="border px-3 py-2 whitespace-nowrap" onClick={() => openModal(lab)}>
          {lab.cidade} {lab.estado ? `/${lab.estado}` : ''}
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
              LABORATÓRIOS
            </h2>
          </div>

          {/* Dashboard compacto com estatísticas */}
          <div className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              {/* Card - Total de Laboratórios */}
              <div className="border-2 rounded-lg p-4 border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <FontAwesomeIcon
                    icon={faFlask}
                    className="h-8 w-8 text-[#81059e] bg-purple-300 p-2 rounded-2xl"
                  />
                  <span className="text-lg font-medium text-gray-700 flex-grow ml-3">Total de Laboratórios</span>
                </div>
                <p className="text-2xl font-semibold text-center mt-2">{totalLaboratorios}</p>
              </div>

              {/* Card - Laboratórios por Cidade */}
              <div className="border-2 rounded-lg p-4 border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <FontAwesomeIcon
                    icon={faBuilding}
                    className="h-8 w-8 text-[#81059e] bg-purple-300 p-2 rounded-2xl"
                  />
                  <span className="text-lg font-medium text-gray-700 flex-grow ml-3">Cidades</span>
                </div>
                <p className="text-2xl font-semibold text-center mt-2">
                  {new Set(laboratorios.filter(lab => lab.cidade).map(lab => lab.cidade)).size}
                </p>
              </div>

              {/* Card - Registrados no Mês */}
              <div className="border-2 rounded-lg p-4 border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <FontAwesomeIcon
                    icon={faClock}
                    className="h-8 w-8 text-[#81059e] bg-purple-300 p-2 rounded-2xl"
                  />
                  <span className="text-lg font-medium text-gray-700 flex-grow ml-3">Registrados no Mês</span>
                </div>
                <p className="text-2xl font-semibold text-center mt-2">
                  {laboratorios.filter(lab => {
                    if (!lab.createdAt) return false;
                    const now = new Date();
                    const labDate = lab.createdAt.seconds
                      ? new Date(lab.createdAt.seconds * 1000)
                      : new Date(lab.createdAt);
                    return labDate.getMonth() === now.getMonth() && labDate.getFullYear() === now.getFullYear();
                  }).length}
                </p>
              </div>

              {/* Card - Sem Contato */}
              <div className="border-2 rounded-lg p-4 border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <FontAwesomeIcon
                    icon={faExclamationTriangle}
                    className="h-8 w-8 text-[#81059e] bg-purple-300 p-2 rounded-2xl"
                  />
                  <span className="text-lg font-medium text-gray-700 flex-grow ml-3">Sem Contato</span>
                </div>
                <p className="text-2xl font-semibold text-center mt-2">
                  {laboratorios.filter(lab => !lab.telefone && !lab.email).length}
                </p>
              </div>
            </div>
          </div>

          {/* Barra de busca e ações */}
          <div className="flex flex-wrap gap-2 items-center mb-4">
            {/* Barra de busca */}
            <input
              type="text"
              placeholder="Busque por CNPJ, Razão Social ou Nome Fantasia"
              className="p-2 h-10 flex-grow min-w-[200px] border-2 border-gray-200 rounded-lg text-black"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            {/* Botões de ação */}
            <div className="flex gap-2">
              {/* Botão Adicionar */}
              <Link href="/products_and_services/laboratory">
                <button className="bg-green-400 text-white h-10 w-10 rounded-md flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </Link>

              {/* Botão Editar - aparece apenas quando há laboratórios selecionados */}
              <button
                onClick={() => openEditModal()}
                className={`${selectedForDeletion.length !== 1 ? 'bg-blue-300' : 'bg-blue-500'} text-white h-10 w-10 rounded-md flex items-center justify-center`}
                disabled={selectedForDeletion.length !== 1}
              >
                <FontAwesomeIcon icon={faEdit} className="h-5 w-5" />
              </button>

              {/* Botão Excluir */}
              <button
                onClick={handleDeleteSelected}
                className={`${selectedForDeletion.length === 0 ? 'bg-red-400' : 'bg-red-500'} text-white h-10 w-10 rounded-md flex items-center justify-center`}
                disabled={selectedForDeletion.length === 0}
              >
                <FontAwesomeIcon icon={faTrash} className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Tabela de laboratórios */}
          {loading ? (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#81059e]"></div>
            </div>
          ) : error ? (
            <p className="text-red-500">{error}</p>
          ) : (
            <div className="w-full overflow-x-auto">
              {filteredLaboratorios.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Nenhum laboratório encontrado.</p>
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
                          <th className="px-3 py-2 cursor-pointer whitespace-nowrap" onClick={() => handleSort('cnpj')}>
                            CNPJ {renderSortArrow('cnpj')}
                          </th>
                          <th className="px-3 py-2 cursor-pointer" onClick={() => handleSort('razaoSocial')}>
                            Razão Social {renderSortArrow('razaoSocial')}
                          </th>
                          <th className="px-3 py-2 cursor-pointer" onClick={() => handleSort('nomeFantasia')}>
                            Nome Fantasia {renderSortArrow('nomeFantasia')}
                          </th>
                          <th className="px-3 py-2 cursor-pointer whitespace-nowrap" onClick={() => handleSort('telefone')}>
                            Telefone {renderSortArrow('telefone')}
                          </th>
                          <th className="px-3 py-2 cursor-pointer whitespace-nowrap" onClick={() => handleSort('email')}>
                            Email {renderSortArrow('email')}
                          </th>
                          <th className="px-3 py-2 cursor-pointer whitespace-nowrap" onClick={() => handleSort('cidade')}>
                            Cidade {renderSortArrow('cidade')}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {renderLaboratorios()}
                      </tbody>
                    </table>
                  </div>

                  {/* Paginação */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <div className="text-sm text-gray-700">
                        Mostrando <span className="font-medium">{indexOfFirstItem + 1}</span> a{' '}
                        <span className="font-medium">
                          {Math.min(indexOfLastItem, filteredLaboratorios.length)}
                        </span>{' '}
                        de <span className="font-medium">{filteredLaboratorios.length}</span> registros
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
                  )}
                </>
              )}
            </div>
          )}

          {/* Modal de Detalhamento de Laboratório */}
          {isModalOpen && selectedLaboratorio && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
              <div className="bg-white rounded-lg shadow-lg w-full max-w-md flex flex-col h-3/5 overflow-hidden">
                <div className="bg-[#81059e] text-white p-4 flex justify-between items-center">
                  <h3 className="text-xl font-bold">
                    Detalhes do Laboratório
                  </h3>
                  <FontAwesomeIcon
                    icon={faX}
                    className="h-5 w-5 text-white cursor-pointer hover:text-gray-200"
                    onClick={closeModal}
                  />
                </div>
                <div className="space-y-3 p-4 overflow-y-auto flex-grow">
                  <p>
                    <strong>CNPJ:</strong> {formatCNPJ(selectedLaboratorio.cnpj) || 'N/A'}
                  </p>
                  <p>
                    <strong>Razão Social:</strong> {selectedLaboratorio.razaoSocial || 'N/A'}
                  </p>
                  <p>
                    <strong>Nome Fantasia:</strong> {selectedLaboratorio.nomeFantasia || 'N/A'}
                  </p>
                  <p>
                    <strong>Email:</strong> {selectedLaboratorio.email || 'N/A'}
                  </p>
                  <p>
                    <strong>Telefone:</strong> {selectedLaboratorio.telefone || 'N/A'}
                  </p>

                  <div className="mt-4">
                    <strong>Endereço:</strong>
                    <p className="mt-1 pl-3 border-l-2 border-gray-300">
                      {selectedLaboratorio.logradouro && (
                        <>
                          {selectedLaboratorio.logradouro}, {selectedLaboratorio.numero || 'S/N'}
                          <br />
                        </>
                      )}
                      {selectedLaboratorio.bairro && (
                        <>
                          Bairro: {selectedLaboratorio.bairro}
                          <br />
                        </>
                      )}
                      {selectedLaboratorio.cidade && (
                        <>
                          {selectedLaboratorio.cidade}
                          {selectedLaboratorio.estado && ` - ${selectedLaboratorio.estado}`}
                          <br />
                        </>
                      )}
                      {selectedLaboratorio.cep && (
                        <>
                          CEP: {selectedLaboratorio.cep}
                          <br />
                        </>
                      )}
                      {selectedLaboratorio.complemento && (
                        <>
                          Complemento: {selectedLaboratorio.complemento}
                        </>
                      )}
                    </p>
                  </div>

                  <p>
                    <strong>Data de Registro:</strong> {formatFirestoreDate(selectedLaboratorio.createdAt) || 'N/A'}
                  </p>

                  {selectedLaboratorio.updatedAt && (
                    <p>
                      <strong>Última Atualização:</strong> {formatFirestoreDate(selectedLaboratorio.updatedAt)}
                    </p>
                  )}

                  {/* Botões de ação */}
                  <div className="flex justify-around mt-6">
                    <button
                      onClick={generatePDF}
                      className="bg-[#81059e] text-white px-4 py-2 rounded-md flex items-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      Ver PDF
                    </button>
                    <button
                      onClick={handlePrint}
                      className="bg-[#81059e] text-white px-4 py-2 rounded-md flex items-center"
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

          {/* Modal de Edição de laboratório */}
          {isEditModalOpen && editingLaboratorio && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
              <div className="bg-white rounded-lg shadow-lg w-full max-w-md flex flex-col h-5/6 overflow-hidden">
                <div className="bg-[#81059e] text-white p-4 flex justify-between items-center">
                  <h3 className="text-xl font-bold">Editar Laboratório</h3>
                  <FontAwesomeIcon
                    icon={faX}
                    className="h-5 w-5 text-white cursor-pointer hover:text-gray-200"
                    onClick={() => setIsEditModalOpen(false)}
                  />
                </div>

                <div className="space-y-3 p-4 overflow-y-auto flex-grow">
                  <div>
                    <label className="text-[#81059e] font-medium">CNPJ:</label>
                    <input
                      type="text"
                      value={editingLaboratorio.cnpj || ''}
                      onChange={(e) => setEditingLaboratorio({ ...editingLaboratorio, cnpj: e.target.value })}
                      className="w-full p-2 border-2 border-[#81059e] rounded-sm"
                      placeholder="00.000.000/0000-00"
                    />
                  </div>
                  <div>
                    <label className="text-[#81059e] font-medium">Razão Social:</label>
                    <input
                      type="text"
                      value={editingLaboratorio.razaoSocial || ''}
                      onChange={(e) => setEditingLaboratorio({ ...editingLaboratorio, razaoSocial: e.target.value })}
                      className="w-full p-2 border-2 border-[#81059e] rounded-sm"
                    />
                  </div>
                  <div>
                    <label className="text-[#81059e] font-medium">Nome Fantasia:</label>
                    <input
                      type="text"
                      value={editingLaboratorio.nomeFantasia || ''}
                      onChange={(e) => setEditingLaboratorio({ ...editingLaboratorio, nomeFantasia: e.target.value })}
                      className="w-full p-2 border-2 border-[#81059e] rounded-sm"
                    />
                  </div>
                  <div>
                    <label className="text-[#81059e] font-medium">Email:</label>
                    <input
                      type="email"
                      value={editingLaboratorio.email || ''}
                      onChange={(e) => setEditingLaboratorio({ ...editingLaboratorio, email: e.target.value })}
                      className="w-full p-2 border-2 border-[#81059e] rounded-sm"
                    />
                  </div>
                  <div>
                    <label className="text-[#81059e] font-medium">Telefone:</label>
                    <input
                      type="text"
                      value={editingLaboratorio.telefone || ''}
                      onChange={(e) => setEditingLaboratorio({ ...editingLaboratorio, telefone: e.target.value })}
                      className="w-full p-2 border-2 border-[#81059e] rounded-sm"
                    />
                  </div>

                  <h4 className="text-[#81059e] font-semibold mt-4">Endereço</h4>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[#81059e] font-medium">CEP:</label>
                      <input
                        type="text"
                        value={editingLaboratorio.cep || ''}
                        onChange={(e) => setEditingLaboratorio({ ...editingLaboratorio, cep: e.target.value })}
                        className="w-full p-2 border-2 border-[#81059e] rounded-sm"
                      />
                    </div>
                    <div>
                      <label className="text-[#81059e] font-medium">Logradouro:</label>
                      <input
                        type="text"
                        value={editingLaboratorio.logradouro || ''}
                        onChange={(e) => setEditingLaboratorio({ ...editingLaboratorio, logradouro: e.target.value })}
                        className="w-full p-2 border-2 border-[#81059e] rounded-sm"
                      />
                    </div>
                    <div>
                      <label className="text-[#81059e] font-medium">Número:</label>
                      <input
                        type="text"
                        value={editingLaboratorio.numero || ''}
                        onChange={(e) => setEditingLaboratorio({ ...editingLaboratorio, numero: e.target.value })}
                        className="w-full p-2 border-2 border-[#81059e] rounded-sm"
                      />
                    </div>
                    <div>
                      <label className="text-[#81059e] font-medium">Bairro:</label>
                      <input
                        type="text"
                        value={editingLaboratorio.bairro || ''}
                        onChange={(e) => setEditingLaboratorio({ ...editingLaboratorio, bairro: e.target.value })}
                        className="w-full p-2 border-2 border-[#81059e] rounded-sm"
                      />
                    </div>
                    <div>
                      <label className="text-[#81059e] font-medium">Cidade:</label>
                      <input
                        type="text"
                        value={editingLaboratorio.cidade || ''}
                        onChange={(e) => setEditingLaboratorio({ ...editingLaboratorio, cidade: e.target.value })}
                        className="w-full p-2 border-2 border-[#81059e] rounded-sm"
                      />
                    </div>
                    <div>
                      <label className="text-[#81059e] font-medium">Estado:</label>
                      <input
                        type="text"
                        value={editingLaboratorio.estado || ''}
                        onChange={(e) => setEditingLaboratorio({ ...editingLaboratorio, estado: e.target.value })}
                        className="w-full p-2 border-2 border-[#81059e] rounded-sm"
                        maxLength={2}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[#81059e] font-medium">Complemento:</label>
                    <input
                      type="text"
                      value={editingLaboratorio.complemento || ''}
                      onChange={(e) => setEditingLaboratorio({ ...editingLaboratorio, complemento: e.target.value })}
                      className="w-full p-2 border-2 border-[#81059e] rounded-sm"
                    />
                  </div>
                </div>

                <div className="p-4 bg-gray-50 border-t flex justify-end space-x-2">
                  <button
                    onClick={() => setIsEditModalOpen(false)}
                    className="text-[#81059e] px-4 py-2 rounded-md"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="bg-[#81059e] text-white px-4 py-2 rounded-sm"
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