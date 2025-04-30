"use client";

import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faGlasses,
  faClock,
  faExclamationTriangle,
  faFilter,
  faX,
  faCheck,
  faEdit,
  faTrash,
  faPlus,
  faEye,
  faFilePdf,
  faPrint
} from '@fortawesome/free-solid-svg-icons';
import { collection, getDocs, doc, deleteDoc, getDoc } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
import { firestore } from '@/lib/firebaseConfig';
import jsPDF from 'jspdf';

export default function ListaPedidos() {
  const { userPermissions, userData } = useAuth();
  const [ordens, setOrdens] = useState([]);
  const [filteredOrdens, setFilteredOrdens] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLoja, setSelectedLoja] = useState('Ambas');
  const [selectedOrdem, setSelectedOrdem] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalOrdens, setTotalOrdens] = useState(0);
  const [selectedForDeletion, setSelectedForDeletion] = useState([]);
  const [sortField, setSortField] = useState('dataCriacao');
  const [sortDirection, setSortDirection] = useState('desc');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [tipoOSFilter, setTipoOSFilter] = useState('Todos');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  // Status das ordens de serviço
  const statusOptions = [
    'Todos', 
    'processamentoInicial', 
    'aguardandoCliente', 
    'encaminhadoLaboratorio', 
    'montagemProgresso', 
    'prontoEntrega', 
    'entregue'
  ];

  // Tipos de OS
  const tiposOS = [
    'Todos',
    'completa',
    'somente_armacao',
    'somente_lente'
  ];

  // Função para traduzir status para exibição
  const translateStatus = (status) => {
    const statusMap = {
      'processamentoInicial': 'Em processamento inicial',
      'aguardandoCliente': 'Aguardando cliente',
      'encaminhadoLaboratorio': 'Encaminhado ao laboratório',
      'montagemProgresso': 'Montagem em progresso',
      'prontoEntrega': 'Pronto para entrega',
      'entregue': 'Entregue'
    };
    return statusMap[status] || status;
  };

  // Função para traduzir tipo de OS para exibição
  const translateTipoOS = (tipo) => {
    const tipoMap = {
      'completa': 'Completa',
      'somente_armacao': 'Somente armação',
      'somente_lente': 'Somente lente'
    };
    return tipoMap[tipo] || tipo;
  };

  useEffect(() => {
    const fetchOrdens = async () => {
      try {
        setLoading(true);
        const fetchedOrdens = [];

        if (selectedLoja !== 'Ambas') {
          // Buscar ordens de uma loja específica
          const ordensRef = collection(firestore, `lojas/${selectedLoja}/pedidos/ordens/items`);
          const ordensSnapshot = await getDocs(ordensRef);

          ordensSnapshot.docs.forEach((docItem) => {
            const ordemData = docItem.data();
            fetchedOrdens.push({
              id: docItem.id,
              ...ordemData,
              loja: selectedLoja
            });
          });
        } else {
          // Buscar de todas as lojas que o usuário tem acesso
          const lojas = userPermissions?.lojas || [];

          for (const loja of lojas) {
            const ordensRef = collection(firestore, `lojas/${loja}/pedidos/ordens/items`);
            const ordensSnapshot = await getDocs(ordensRef);

            ordensSnapshot.docs.forEach((docItem) => {
              const ordemData = docItem.data();
              fetchedOrdens.push({
                id: docItem.id,
                ...ordemData,
                loja: loja
              });
            });
          }
        }

        // Aplicar ordenação inicial
        const sortedOrdens = sortOrdens(fetchedOrdens, sortField, sortDirection);
        setOrdens(sortedOrdens);
        setFilteredOrdens(sortedOrdens);
        setTotalOrdens(sortedOrdens.length);
        setLoading(false);
      } catch (err) {
        console.error('Erro ao carregar as ordens de serviço:', err);
        setError(`Erro ao carregar os dados: ${err.message}`);
        setLoading(false);
      }
    };

    fetchOrdens();
  }, [selectedLoja, userPermissions]);

  // Função para filtrar ordens com base na busca e filtros
  useEffect(() => {
    const filterBySearchAndFilters = () => {
      let filtered = ordens;

      // Filtro por loja
      if (selectedLoja !== 'Ambas') {
        filtered = filtered.filter((ordem) => ordem.loja === selectedLoja);
      }

      // Filtro por busca
      if (searchQuery !== '') {
        filtered = filtered.filter(
          (ordem) =>
            (ordem.numeroOS?.toLowerCase().includes(searchQuery.toLowerCase()) || '') ||
            (ordem.cliente?.toLowerCase().includes(searchQuery.toLowerCase()) || '')
        );
      }

      // Filtro por status
      if (statusFilter !== 'Todos') {
        filtered = filtered.filter((ordem) => ordem.status === statusFilter);
      }

      // Filtro por tipo de OS
      if (tipoOSFilter !== 'Todos') {
        filtered = filtered.filter((ordem) => ordem.tipoOS === tipoOSFilter);
      }

      // Aplicar ordenação
      filtered = sortOrdens(filtered, sortField, sortDirection);
      setFilteredOrdens(filtered);
    };

    filterBySearchAndFilters();
  }, [searchQuery, selectedLoja, ordens, sortField, sortDirection, statusFilter, tipoOSFilter]);

  // Função para ordenar ordens de serviço
  const sortOrdens = (ordensToSort, field, direction) => {
    return [...ordensToSort].sort((a, b) => {
      let aValue = a[field];
      let bValue = b[field];

      // Tratar datas (objetos Firestore Timestamp ou strings de data)
      if (field === 'dataCriacao' || field === 'dataPrevistaEntrega' || field === 'dataEntrega') {
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
    if (!date) return new Date(0); // Valor mínimo para datas vazias

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

    // Reordenar as ordens filtradas
    const sorted = sortOrdens(filteredOrdens, field, direction);
    setFilteredOrdens(sorted);
  };

  // Renderizar seta de ordenação
  const renderSortArrow = (field) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ?
      <span className="ml-1">↑</span> :
      <span className="ml-1">↓</span>;
  };

  // Obter cor de status baseado no status da OS
  const getStatusColor = (status) => {
    const statusColors = {
      'processamentoInicial': 'bg-gray-200 text-gray-800',
      'aguardandoCliente': 'bg-yellow-200 text-yellow-800',
      'encaminhadoLaboratorio': 'bg-blue-200 text-blue-800',
      'montagemProgresso': 'bg-purple-200 text-purple-800',
      'prontoEntrega': 'bg-green-200 text-green-800',
      'entregue': 'bg-green-500 text-white'
    };
    
    return statusColors[status] || 'bg-gray-200 text-gray-800';
  };

  // Formatar data do Firebase
  const formatFirestoreDate = (firestoreDate) => {
    if (!firestoreDate) return 'N/A';

    // Se for um timestamp do Firestore
    if (firestoreDate && typeof firestoreDate === 'object' && firestoreDate.seconds) {
      const date = new Date(firestoreDate.seconds * 1000);
      return date.toLocaleDateString('pt-BR');
    }

    // Se já for uma string de data ou outro formato
    try {
      const date = new Date(firestoreDate);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('pt-BR');
      }
    } catch (e) {}

    // Retornar como está se não conseguir converter
    return firestoreDate;
  };

  // Função para abrir o modal e definir a ordem selecionada
  const openModal = (ordem) => {
    setSelectedOrdem(ordem);
    setIsModalOpen(true);
  };

  // Função para fechar o modal
  const closeModal = () => {
    setSelectedOrdem(null);
    setIsModalOpen(false);
  };

  // Função para gerar PDF
  const generatePDF = () => {
    if (!selectedOrdem) return;

    const doc = new jsPDF();
    doc.text(`Ordem de Serviço #${selectedOrdem.numeroOS || selectedOrdem.id}`, 10, 10);
    doc.text(`Cliente: ${selectedOrdem.cliente || 'N/A'}`, 10, 20);
    doc.text(`Tipo: ${translateTipoOS(selectedOrdem.tipoOS || 'completa')}`, 10, 30);
    doc.text(`Status: ${translateStatus(selectedOrdem.status || 'processamentoInicial')}`, 10, 40);
    doc.text(`Laboratório: ${selectedOrdem.laboratorio || 'N/A'}`, 10, 50);
    doc.text(`Data Prevista: ${formatFirestoreDate(selectedOrdem.dataPrevistaEntrega)}`, 10, 60);
    doc.text(`Loja: ${selectedOrdem.loja || 'N/A'}`, 10, 70);

    // Adicionar receita
    doc.text('Receita Médica:', 10, 90);
    doc.text(`OD: ${selectedOrdem.esferaDireito || '0'} ${selectedOrdem.cilindroDireito || '0'} ${selectedOrdem.eixoDireito || '0'} ${selectedOrdem.adicaoDireito || ''}`, 10, 100);
    doc.text(`OE: ${selectedOrdem.esferaEsquerdo || '0'} ${selectedOrdem.cilindroEsquerdo || '0'} ${selectedOrdem.eixoEsquerdo || '0'} ${selectedOrdem.adicaoEsquerdo || ''}`, 10, 110);
    
    // Medidas
    doc.text(`Distância Interpupilar: ${selectedOrdem.distanciaInterpupilar || 'N/A'}`, 10, 130);
    doc.text(`Altura: ${selectedOrdem.altura || 'N/A'}`, 10, 140);

    // Observações
    if (selectedOrdem.observacoes) {
      doc.text('Observações:', 10, 160);
      doc.text(selectedOrdem.observacoes, 10, 170);
    }

    doc.save(`OS_${selectedOrdem.numeroOS || selectedOrdem.id}.pdf`);
  };

  // Função para lidar com a impressão
  const handlePrint = () => {
    window.print();
  };

  // Função para marcar ou desmarcar ordem para exclusão
  const toggleDeletion = (e, ordemId) => {
    e.stopPropagation(); // Evitar abrir o modal

    setSelectedForDeletion(prev => {
      if (prev.includes(ordemId)) {
        return prev.filter(id => id !== ordemId);
      } else {
        return [...prev, ordemId];
      }
    });
  };

  // Função para excluir as ordens selecionadas
  const handleDeleteSelected = async () => {
    if (selectedForDeletion.length === 0) {
      alert('Selecione pelo menos uma ordem para excluir.');
      return;
    }

    if (confirm(`Deseja realmente excluir ${selectedForDeletion.length} ordens selecionadas?`)) {
      try {
        for (const ordemId of selectedForDeletion) {
          // Encontrar a loja da ordem
          const ordem = ordens.find(o => o.id === ordemId);
          if (ordem && ordem.loja) {
            // Excluir a ordem
            const ordemRef = doc(firestore, `lojas/${ordem.loja}/pedidos/ordens/items`, ordemId);
            await deleteDoc(ordemRef);
          }
        }

        // Atualizar as listas de ordens
        const updatedOrdens = ordens.filter(ordem => !selectedForDeletion.includes(ordem.id));
        setOrdens(updatedOrdens);
        setFilteredOrdens(updatedOrdens.filter(o =>
          (selectedLoja === 'Ambas' || o.loja === selectedLoja) &&
          (statusFilter === 'Todos' || o.status === statusFilter) &&
          (tipoOSFilter === 'Todos' || o.tipoOS === tipoOSFilter) &&
          (!searchQuery ||
            o.numeroOS?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            o.cliente?.toLowerCase().includes(searchQuery.toLowerCase()))
        ));
        setTotalOrdens(updatedOrdens.length);
        setSelectedForDeletion([]);

        alert('Ordens excluídas com sucesso!');
      } catch (error) {
        console.error('Erro ao excluir ordens:', error);
        alert('Erro ao excluir as ordens selecionadas.');
      }
    }
  };

  // Calcular ordens para a página atual
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentOrdens = filteredOrdens.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredOrdens.length / itemsPerPage);

  // Funções de navegação
  const goToPage = (pageNumber) => {
    setCurrentPage(Math.max(1, Math.min(pageNumber, totalPages)));
  };

  useEffect(() => {
    // Controlar o overflow do body quando o dropdown de filtros está aberto
    if (showFilterDropdown) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [showFilterDropdown]);

  useEffect(() => {
    // Fechar o dropdown de filtros quando clicar fora dele
    const handleClickOutside = (event) => {
      const dropdownElement = document.getElementById('filter-dropdown');
      const filterToggleElement = document.querySelector('button[data-filter-toggle="true"]');

      if (showFilterDropdown &&
        dropdownElement &&
        !dropdownElement.contains(event.target) &&
        filterToggleElement &&
        !filterToggleElement.contains(event.target)) {
        setShowFilterDropdown(false);
      }
    };

    // Adicionar manipulador de cliques
    document.addEventListener('mousedown', handleClickOutside);

    // Adicionar manipulador para fechar ao pressionar ESC
    const handleEscKey = (event) => {
      if (event.key === 'Escape' && showFilterDropdown) {
        setShowFilterDropdown(false);
      }
    };

    document.addEventListener('keydown', handleEscKey);

    // Limpar os event listeners ao desmontar o componente
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [showFilterDropdown]);

  // Componente que mostra os filtros ativos como badges
  const FilterActiveBadges = () => {
    const activeFilters = [];

    if (statusFilter !== 'Todos') {
      activeFilters.push({ type: 'Status', value: translateStatus(statusFilter) });
    }

    if (tipoOSFilter !== 'Todos') {
      activeFilters.push({ type: 'Tipo', value: translateTipoOS(tipoOSFilter) });
    }

    if (activeFilters.length === 0) return null;

    const handleRemoveFilter = (filterType) => {
      switch (filterType) {
        case 'Status':
          setStatusFilter('Todos');
          break;
        case 'Tipo':
          setTipoOSFilter('Todos');
          break;
        default:
          break;
      }
    };

    return (
      <div className="flex flex-wrap gap-1 mt-2">
        {activeFilters.map((filter, index) => (
          <span
            key={index}
            className="inline-flex items-center px-2 py-1 rounded text-xs bg-purple-100 text-[#81059e]"
          >
            <span>{filter.type}: {filter.value}</span>
            <button
              className="ml-1 text-[#81059e] hover:text-[#690480]"
              onClick={() => handleRemoveFilter(filter.type)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </span>
        ))}
        <button
          className="text-xs text-[#81059e] hover:underline px-2 py-1"
          onClick={() => {
            setStatusFilter('Todos');
            setTipoOSFilter('Todos');
          }}
        >
          Limpar todos
        </button>
      </div>
    );
  };

  return (
    <Layout>
      <div className="min-h-screen p-0 md:p-2 mb-20">
        <div className="w-full max-w-7xl mx-auto rounded-lg">
          <div className="mb-4">
            <h2 className="text-3xl font-bold text-[#81059e] mb-8 mt-8">
              PEDIDOS
            </h2>
          </div>

          {/* Dashboard com estatísticas */}
          <div className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Card - Total de Ordens */}
              <div className="border-2 rounded-lg p-4 border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <FontAwesomeIcon
                    icon={faGlasses}
                    className="h-8 w-8 text-[#81059e] bg-purple-300 p-2 rounded-2xl"
                  />
                  <span className="text-lg font-medium text-gray-700 flex-grow ml-3">Total de Pedidos</span>
                </div>
                <p className="text-2xl font-semibold text-center mt-2">{totalOrdens}</p>
              </div>

              {/* Card - Em Processamento */}
              <div className="border-2 rounded-lg p-4 border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <FontAwesomeIcon
                    icon={faClock}
                    className="h-8 w-8 text-[#81059e] bg-purple-300 p-2 rounded-2xl"
                  />
                  <span className="text-lg font-medium text-gray-700 flex-grow ml-3">Em Processamento</span>
                </div>
                <p className="text-2xl font-semibold text-center mt-2">
                  {ordens.filter(ordem => 
                    ordem.status === 'processamentoInicial' || 
                    ordem.status === 'encaminhadoLaboratorio' || 
                    ordem.status === 'montagemProgresso'
                  ).length}
                </p>
              </div>

              {/* Card - Prontos para Entrega */}
              <div className="border-2 rounded-lg p-4 border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <FontAwesomeIcon
                    icon={faExclamationTriangle}
                    className="h-8 w-8 text-[#81059e] bg-purple-300 p-2 rounded-2xl"
                  />
                  <span className="text-lg font-medium text-gray-700 flex-grow ml-3">Prontos para Entrega</span>
                </div>
                <p className="text-2xl font-semibold text-center mt-2">
                  {ordens.filter(ordem => ordem.status === 'prontoEntrega').length}
                </p>
              </div>
            </div>
          </div>

          {/* Barra de busca e filtros */}
          <div className="flex flex-wrap gap-2 items-center mb-4">
            {/* Barra de busca */}
            <input
              type="text"
              placeholder="Busque por código ou cliente"
              className="p-2 h-10 flex-grow min-w-[200px] border-2 border-gray-200 rounded-lg text-black"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            {/* Filtro por loja */}
            <select
              value={selectedLoja}
              onChange={(e) => setSelectedLoja(e.target.value)}
              className="p-2 h-10 border-2 border-gray-200 rounded-lg text-gray-800 w-24"
            >
              {userPermissions?.isAdmin && <option value="Ambas">Ambas</option>}
              {userPermissions?.lojas?.includes('loja1') && <option value="loja1">Loja 1</option>}
              {userPermissions?.lojas?.includes('loja2') && <option value="loja2">Loja 2</option>}
            </select>

            {/* Dropdown de filtros */}
            <div className="relative">
              <button
                data-filter-toggle="true"
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                className="p-2 h-10 border-2 border-gray-200 rounded-lg bg-white flex items-center gap-1 text-[#81059e]"
              >
                <FontAwesomeIcon icon={faFilter} className="h-4 w-4" />
                <span className="hidden sm:inline">Filtrar</span>
                {(statusFilter !== 'Todos' || tipoOSFilter !== 'Todos') && (
                  <span className="ml-1 bg-[#81059e] text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                    {(statusFilter !== 'Todos' ? 1 : 0) + (tipoOSFilter !== 'Todos' ? 1 : 0)}
                  </span>
                )}
              </button>

              {showFilterDropdown && (
                <div
                  id="filter-dropdown"
                  className="fixed z-30 inset-x-4 top-24 sm:absolute sm:inset-x-auto sm:top-full sm:right-0 sm:mt-1 bg-white shadow-lg rounded-lg border p-4 w-auto sm:w-64 max-w-[calc(100vw-32px)] max-h-[80vh] overflow-y-auto"
                >
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-sm font-semibold text-gray-700">Filtros</h3>
                    <button
                      onClick={() => {
                        setStatusFilter('Todos');
                        setTipoOSFilter('Todos');
                      }}
                      className="text-xs text-[#81059e] hover:underline"
                    >
                      Limpar Filtros
                    </button>
                  </div>

                  <div className="space-y-3">
                    {/* Filtro de status */}
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Status</label>
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="p-2 h-9 w-full border border-gray-200 rounded-lg text-gray-800 text-sm"
                      >
                        {statusOptions.map(status => (
                          <option key={status} value={status}>{status === 'Todos' ? 'Todos' : translateStatus(status)}</option>
                        ))}
                      </select>
                    </div>

                    {/* Filtro de tipo de OS */}
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Tipo de OS</label>
                      <select
                        value={tipoOSFilter}
                        onChange={(e) => setTipoOSFilter(e.target.value)}
                        className="p-2 h-9 w-full border border-gray-200 rounded-lg text-gray-800 text-sm"
                      >
                        {tiposOS.map(tipo => (
                          <option key={tipo} value={tipo}>{tipo === 'Todos' ? 'Todos' : translateTipoOS(tipo)}</option>
                        ))}
                      </select>
                    </div>

                    <div className="pt-2">
                      <button
                        onClick={() => setShowFilterDropdown(false)}
                        className="w-full bg-[#81059e] text-white rounded-lg p-2 text-sm hover:bg-[#690480]"
                      >
                        Fechar
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Botões de ação */}
            <div className="flex gap-2">
              {/* Botão Adicionar */}
              <Link href="/servicos/add-os">
                <button className="bg-green-500 text-white h-10 w-10 rounded-md flex items-center justify-center">
                  <FontAwesomeIcon icon={faPlus} className="h-4 w-4" />
                </button>
              </Link>

              {/* Botão Editar */}
              <Link href={selectedForDeletion.length === 1 ? `/servicos/edit-os/${selectedForDeletion[0]}` : "#"}>
                <button
                  className={`${selectedForDeletion.length !== 1 ? 'bg-blue-300' : 'bg-blue-500'} text-white h-10 w-10 rounded-md flex items-center justify-center`}
                  disabled={selectedForDeletion.length !== 1}
                >
                  <FontAwesomeIcon icon={faEdit} className="h-4 w-4" />
                </button>
              </Link>

              {/* Botão Excluir */}
              <button
                onClick={handleDeleteSelected}
                className={`${selectedForDeletion.length === 0 ? 'bg-red-300' : 'bg-red-500'} text-white h-10 w-10 rounded-md flex items-center justify-center`}
                disabled={selectedForDeletion.length === 0}
              >
                <FontAwesomeIcon icon={faTrash} className="h-4 w-4" />
              </button>
            </div>
          </div>

          <FilterActiveBadges />

          {/* Tabela de ordens */}
          {loading ? (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#81059e]"></div>
            </div>
          ) : error ? (
            <p>{error}</p>
          ) : (
            <div className="w-full overflow-x-auto">
              {filteredOrdens.length === 0 ? (
                <p className="text-center py-4">Nenhuma ordem de serviço encontrada.</p>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="min-w-full table-auto select-none">
                      <thead>
                        <tr className="bg-[#81059e] text-white">
                          <th className="px-3 py-2 w-12">
                            <span className="sr-only">Selecionar</span>
                          </th>
                          <th className="px-3 py-2 cursor-pointer whitespace-nowrap" onClick={() => handleSort('numeroOS')}>
                            Código {renderSortArrow('numeroOS')}
                          </th>
                          <th className="px-3 py-2 cursor-pointer" onClick={() => handleSort('cliente')}>
                            Cliente {renderSortArrow('cliente')}
                          </th>
                          <th className="px-3 py-2 cursor-pointer" onClick={() => handleSort('tipoOS')}>
                            Tipo {renderSortArrow('tipoOS')}
                          </th>
                          <th className="px-3 py-2 cursor-pointer" onClick={() => handleSort('status')}>
                            Status {renderSortArrow('status')}
                          </th>
                          <th className="px-3 py-2 cursor-pointer whitespace-nowrap" onClick={() => handleSort('dataPrevistaEntrega')}>
                            Previsão Entrega {renderSortArrow('dataPrevistaEntrega')}
                          </th>
                          <th className="px-3 py-2 cursor-pointer whitespace-nowrap" onClick={() => handleSort('laboratorio')}>
                            Laboratório {renderSortArrow('laboratorio')}
                          </th>
                          <th className="px-3 py-2">Loja</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentOrdens.map((ordem) => (
                          <tr
                            key={ordem.id}
                            className="text-black text-left hover:bg-gray-100 cursor-pointer"
                          >
                            <td className="border px-2 py-2 text-center">
                              <input
                                type="checkbox"
                                checked={selectedForDeletion.includes(ordem.id)}
                                onChange={(e) => toggleDeletion(e, ordem.id)}
                                className="h-4 w-4 cursor-pointer"
                                onClick={(e) => e.stopPropagation()}
                              />
                            </td>
                            <td className="border px-3 py-2 whitespace-nowrap" onClick={() => openModal(ordem)}>
                              {ordem.numeroOS || 'N/A'}
                            </td>
                            <td className="border px-4 py-2 max-w-[300px] truncate" onClick={() => openModal(ordem)}>
                              {typeof ordem.cliente === 'object' ? ordem.cliente.nome || 'N/A' : ordem.cliente || 'N/A'}
                            </td>
                            <td className="border px-3 py-2 whitespace-nowrap" onClick={() => openModal(ordem)}>
                              {translateTipoOS(ordem.tipoOS || 'completa')}
                            </td>
                            <td className={`border px-3 py-2 whitespace-nowrap ${getStatusColor(ordem.status || 'processamentoInicial')}`} onClick={() => openModal(ordem)}>
                              {translateStatus(ordem.status || 'processamentoInicial')}
                            </td>
                            <td className="border px-3 py-2 whitespace-nowrap" onClick={() => openModal(ordem)}>
                              {formatFirestoreDate(ordem.dataPrevistaEntrega)}
                            </td>
                            <td className="border px-3 py-2 whitespace-nowrap" onClick={() => openModal(ordem)}>
                              {ordem.laboratorio || 'N/A'}
                            </td>
                            <td className="border px-3 py-2 whitespace-nowrap" onClick={() => openModal(ordem)}>
                              {ordem.loja || 'N/A'}
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
                        {Math.min(indexOfLastItem, filteredOrdens.length)}
                      </span>{' '}
                      de <span className="font-medium">{filteredOrdens.length}</span> registros
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

          {/* Modal de Detalhamento da Ordem de Serviço */}
          {isModalOpen && selectedOrdem && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
              <div className="bg-white rounded-lg shadow-lg w-full max-w-xl flex flex-col h-4/5 overflow-hidden">
                <div className="bg-[#81059e] text-white p-4 flex justify-between items-center">
                  <h3 className="text-xl font-bold">
                    Ordem de Serviço #{selectedOrdem.numeroOS || selectedOrdem.id}
                  </h3>
                  <FontAwesomeIcon
                    icon={faX}
                    className="h-5 w-5 text-white cursor-pointer hover:text-gray-200"
                    onClick={closeModal}
                  />
                </div>
                <div className="space-y-3 p-4 overflow-y-auto flex-grow">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="font-medium text-gray-700">Cliente:</p>
                      <p>{typeof selectedOrdem.cliente === 'object' ? selectedOrdem.cliente.nome || 'N/A' : selectedOrdem.cliente || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-700">Status:</p>
                      <p className={`inline-block px-2 py-1 rounded-full ${getStatusColor(selectedOrdem.status || 'processamentoInicial')}`}>
                        {translateStatus(selectedOrdem.status || 'processamentoInicial')}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="font-medium text-gray-700">Tipo de OS:</p>
                      <p>{translateTipoOS(selectedOrdem.tipoOS || 'completa')}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-700">Laboratório:</p>
                      <p>{selectedOrdem.laboratorio || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="font-medium text-gray-700">Data Prevista para Entrega:</p>
                      <p>{formatFirestoreDate(selectedOrdem.dataPrevistaEntrega)}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-700">Loja:</p>
                      <p>{selectedOrdem.loja || 'N/A'}</p>
                    </div>
                  </div>

                  {/* Alerta para OS especiais */}
                  {(selectedOrdem.tipoOS === "somente_armacao" || selectedOrdem.tipoOS === "somente_lente") && (
                    <div className="mb-4 p-3 bg-yellow-50 border-l-4 border-yellow-500 text-yellow-700">
                      <h3 className="font-medium">Atenção: Kit Incompleto</h3>
                      <p className="text-sm">
                        {selectedOrdem.tipoOS === "somente_armacao"
                          ? "Cliente comprou apenas a armação e vai trazer suas próprias lentes."
                          : "Cliente comprou apenas as lentes e vai trazer sua própria armação."}
                      </p>
                    </div>
                  )}

                  {/* Seção de produtos */}
                  <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <h3 className="text-md font-medium text-[#81059e] mb-2">Produtos</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Armação */}
                      <div>
                        <div className="flex justify-between">
                          <label className="block text-sm font-medium text-gray-700">Armação</label>
                          {selectedOrdem.tipoOS === "somente_lente" && (
                            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                              Cliente traz
                            </span>
                          )}
                        </div>
                        <div className="mt-2 p-3 bg-white border border-gray-200 rounded-md">
                          {selectedOrdem.tipoOS === "somente_lente" 
                            ? selectedOrdem.armacaoClienteDescricao || "Descrição não fornecida"
                            : selectedOrdem.armacaoDados || "Nenhuma armação selecionada"}
                        </div>
                      </div>

                      {/* Lentes */}
                      <div>
                        <div className="flex justify-between">
                          <label className="block text-sm font-medium text-gray-700">Lentes</label>
                          {selectedOrdem.tipoOS === "somente_armacao" && (
                            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                              Cliente traz
                            </span>
                          )}
                        </div>
                        <div className="mt-2 p-3 bg-white border border-gray-200 rounded-md">
                          {selectedOrdem.tipoOS === "somente_armacao" 
                            ? selectedOrdem.lentesClienteDescricao || "Descrição não fornecida"
                            : selectedOrdem.lenteDados || "Nenhuma lente selecionada"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Receita médica */}
                  <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <h3 className="text-md font-medium text-[#81059e] mb-2">Receita Médica</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-700">Olho Direito</h4>
                        <div className="grid grid-cols-4 gap-2 mt-1">
                          <div>
                            <p className="text-xs text-gray-600">Esfera</p>
                            <p className="text-sm font-medium">{selectedOrdem.esferaDireito || '0'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600">Cilindro</p>
                            <p className="text-sm font-medium">{selectedOrdem.cilindroDireito || '0'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600">Eixo</p>
                            <p className="text-sm font-medium">{selectedOrdem.eixoDireito || '0'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600">Adição</p>
                            <p className="text-sm font-medium">{selectedOrdem.adicaoDireito || '-'}</p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-gray-700">Olho Esquerdo</h4>
                        <div className="grid grid-cols-4 gap-2 mt-1">
                          <div>
                            <p className="text-xs text-gray-600">Esfera</p>
                            <p className="text-sm font-medium">{selectedOrdem.esferaEsquerdo || '0'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600">Cilindro</p>
                            <p className="text-sm font-medium">{selectedOrdem.cilindroEsquerdo || '0'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600">Eixo</p>
                            <p className="text-sm font-medium">{selectedOrdem.eixoEsquerdo || '0'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600">Adição</p>
                            <p className="text-sm font-medium">{selectedOrdem.adicaoEsquerdo || '-'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Medidas pupilares */}
                  <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <h3 className="text-md font-medium text-[#81059e] mb-2">Medidas Pupilares</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Distância Interpupilar:</p>
                        <p>{selectedOrdem.distanciaInterpupilar || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Altura:</p>
                        <p>{selectedOrdem.altura || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Observações */}
                  {selectedOrdem.observacoes && (
                    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <h3 className="text-md font-medium text-[#81059e] mb-2">Observações</h3>
                      <p className="text-sm">{selectedOrdem.observacoes}</p>
                    </div>
                  )}

                  {/* Botões de ação */}
                  <div className="flex justify-around mt-6">
                    <button
                      onClick={generatePDF}
                      className="bg-[#81059e] text-white px-4 py-2 rounded-md flex items-center"
                    >
                      <FontAwesomeIcon icon={faFilePdf} className="h-5 w-5 mr-2" />
                      Gerar PDF
                    </button>
                    <button
                      onClick={handlePrint}
                      className="bg-[#81059e] text-white px-4 py-2 rounded-md flex items-center"
                    >
                      <FontAwesomeIcon icon={faPrint} className="h-5 w-5 mr-2" />
                      Imprimir
                    </button>
                    <Link href={`/servicos/edit-os/${selectedOrdem.id}`}>
                      <button
                        className="bg-blue-500 text-white px-4 py-2 rounded-md flex items-center"
                      >
                        <FontAwesomeIcon icon={faEdit} className="h-5 w-5 mr-2" />
                        Editar
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}