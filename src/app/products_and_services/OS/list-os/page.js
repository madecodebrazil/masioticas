"use client";

import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faClipboardList,
  faUser,
  faClock,
  faExclamationTriangle,
  faFilter,
  faX,
  faCheck,
  faPrint,
  faFilePdf
} from '@fortawesome/free-solid-svg-icons';
import { collection, getDocs, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
import { firestore } from '../../../../lib/firebaseConfig';
import jsPDF from 'jspdf';

export default function ListaOS() {
  const { userPermissions, userData } = useAuth();
  const [osList, setOsList] = useState([]);
  const [filteredOS, setFilteredOS] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLoja, setSelectedLoja] = useState('Ambas');
  const [selectedOS, setSelectedOS] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingOS, setEditingOS] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalOS, setTotalOS] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [selectedForDeletion, setSelectedForDeletion] = useState([]);
  const [sortField, setSortField] = useState('dataRegistro');
  const [sortDirection, setSortDirection] = useState('desc');
  const [yearFilter, setYearFilter] = useState('Todos');
  const [monthFilter, setMonthFilter] = useState('Todos');
  const [dayFilter, setDayFilter] = useState('Todos');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [availableYears, setAvailableYears] = useState(['Todos']);
  const months = ['Todos', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const [availableDays, setAvailableDays] = useState(['Todos']);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  // Status possíveis para uma OS
  const statusOptions = [
    'Todos',
    'Aguardando Atendimento',
    'Em Análise',
    'Aguardando Aprovação',
    'Aprovado',
    'Em Montagem',
    'Pronto para Entrega',
    'Entregue',
    'Cancelado'
  ];

  useEffect(() => {
    const fetchOS = async () => {
      try {
        setLoading(true);
        const fetchedOS = [];

        // Usar o caminho correto para lojas específicas
        if (selectedLoja !== 'Ambas') {
          // Caminho para uma loja específica
          const osDocRef = collection(firestore, `lojas/${selectedLoja}/servicos/items/items`);
          const osSnapshot = await getDocs(osDocRef);

          osSnapshot.docs.forEach((docItem) => {
            const osData = docItem.data();
            fetchedOS.push({
              id: docItem.id,
              ...osData,
              loja: selectedLoja // Garantir que a loja seja definida corretamente
            });
          });
        } else {
          // Se for "Ambas", buscar de todas as lojas que o usuário tem acesso
          const lojas = userPermissions?.lojas || [];

          for (const loja of lojas) {
            const osDocRef = collection(firestore, `lojas/${loja}/servicos/items/items`);
            const osSnapshot = await getDocs(osDocRef);

            osSnapshot.docs.forEach((docItem) => {
              const osData = docItem.data();
              fetchedOS.push({
                id: docItem.id,
                ...osData,
                loja: loja
              });
            });
          }
        }

        // Aplicar ordenação inicial
        const sortedOS = sortOS(fetchedOS, sortField, sortDirection);
        setOsList(sortedOS);
        setFilteredOS(sortedOS);
        setTotalOS(sortedOS.length); // Atualizar o contador total de OS
        setLoading(false);
      } catch (err) {
        console.error('Erro ao carregar as ordens de serviço:', err);
        setError(`Erro ao carregar os dados: ${err.message}`);
        setLoading(false);
      }
    };

    fetchOS();
  }, [selectedLoja, userPermissions]);

  // Extrair anos disponíveis dos dados
  useEffect(() => {
    if (osList.length > 0) {
      const years = ['Todos'];
      osList.forEach(os => {
        if (os.dataRegistro) {
          const date = os.dataRegistro.seconds
            ? new Date(os.dataRegistro.seconds * 1000)
            : new Date(os.dataRegistro);
          const year = date.getFullYear().toString();
          if (!years.includes(year)) {
            years.push(year);
          }
        }
      });
      setAvailableYears(years.sort());

      // Gerar dias de 1 a 31
      const days = ['Todos'];
      for (let i = 1; i <= 31; i++) {
        days.push(i.toString());
      }
      setAvailableDays(days);
    }
  }, [osList]);

  // Função para filtrar OS com base na busca, loja, data e status
  useEffect(() => {
    const filterBySearchAndLojaAndDateAndStatus = () => {
      let filtered = osList;

      // Filtro por loja
      if (selectedLoja !== 'Ambas') {
        filtered = filtered.filter((os) => os.loja === selectedLoja);
      }

      // Filtro por busca
      if (searchQuery !== '') {
        filtered = filtered.filter(
          (os) =>
            (os.codigo?.toLowerCase().includes(searchQuery.toLowerCase()) || '') ||
            (os.cliente?.toLowerCase().includes(searchQuery.toLowerCase()) || '') ||
            (os.referencia?.toLowerCase().includes(searchQuery.toLowerCase()) || '')
        );
      }

      // Filtro por status
      if (statusFilter !== 'Todos') {
        filtered = filtered.filter(os => os.status === statusFilter);
      }

      // Filtro por data
      filtered = filtered.filter(os => {
        // Se não tem data de registro e qualquer filtro está ativo, ocultar
        if (!os.dataRegistro && (yearFilter !== 'Todos' || monthFilter !== 'Todos' || dayFilter !== 'Todos')) {
          return false;
        }

        if (!os.dataRegistro) return true;

        const osDate = os.dataRegistro.seconds
          ? new Date(os.dataRegistro.seconds * 1000)
          : new Date(os.dataRegistro);

        // Filtrar por ano se não for "Todos"
        if (yearFilter !== 'Todos' && osDate.getFullYear().toString() !== yearFilter) {
          return false;
        }

        // Filtrar por mês se não for "Todos"
        if (monthFilter !== 'Todos') {
          const monthIndex = months.indexOf(monthFilter) - 1;
          if (osDate.getMonth() !== monthIndex) {
            return false;
          }
        }

        // Filtrar por dia se não for "Todos"
        if (dayFilter !== 'Todos' && osDate.getDate().toString() !== dayFilter) {
          return false;
        }

        return true;
      });

      // Aplicar ordenação
      filtered = sortOS(filtered, sortField, sortDirection);
      setFilteredOS(filtered);
    };

    filterBySearchAndLojaAndDateAndStatus();
  }, [searchQuery, selectedLoja, osList, sortField, sortDirection, yearFilter, monthFilter, dayFilter, statusFilter]);

  // Função para ordenar as ordens de serviço
  const sortOS = (osToSort, field, direction) => {
    return [...osToSort].sort((a, b) => {
      let aValue = a[field];
      let bValue = b[field];

      // Tratar datas (objetos Firestore Timestamp ou strings de data)
      if (field === 'dataRegistro' || field === 'dataPrevisao' || field === 'dataEntrega') {
        aValue = convertToDate(aValue);
        bValue = convertToDate(bValue);
      }
      // Tratar números
      else if (field === 'valor') {
        aValue = parseFloat(aValue || 0);
        bValue = parseFloat(bValue || 0);
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

    // Reordenar as OS filtradas
    const sorted = sortOS(filteredOS, field, direction);
    setFilteredOS(sorted);
  };

  // Renderizar seta de ordenação - apenas quando a coluna estiver selecionada
  const renderSortArrow = (field) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ?
      <span className="ml-1">↑</span> :
      <span className="ml-1">↓</span>;
  };

  const getStatusColor = (status) => {
    if (!status) return 'bg-gray-200 text-gray-800';

    switch (status) {
      case 'Aguardando Atendimento':
        return 'bg-yellow-200 text-yellow-800';
      case 'Em Análise':
        return 'bg-blue-200 text-blue-800';
      case 'Aguardando Aprovação':
        return 'bg-purple-200 text-purple-800';
      case 'Aprovado':
        return 'bg-indigo-200 text-indigo-800';
      case 'Em Montagem':
        return 'bg-orange-200 text-orange-800';
      case 'Pronto para Entrega':
        return 'bg-green-200 text-green-800';
      case 'Entregue':
        return 'bg-green-400 text-green-900';
      case 'Cancelado':
        return 'bg-red-200 text-red-800';
      default:
        return 'bg-gray-200 text-gray-800';
    }
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

  // Função para abrir o modal e definir a OS selecionada
  const openModal = (os) => {
    setSelectedOS(os);
    setIsModalOpen(true);
    setStatusMessage('');
  };

  // Função para fechar o modal
  const closeModal = () => {
    setSelectedOS(null);
    setIsModalOpen(false);
  };

  // Função para gerar PDF
  const generatePDF = () => {
    if (!selectedOS) return;

    const doc = new jsPDF();
    doc.text(`Detalhes da Ordem de Serviço`, 10, 10);
    doc.text(`Código: ${selectedOS.codigo ? (typeof selectedOS.codigo === 'object' ? JSON.stringify(selectedOS.codigo) : selectedOS.codigo) : 'N/A'}`, 10, 20);
    doc.text(`Cliente: ${selectedOS.cliente ? (typeof selectedOS.cliente === 'object' ? JSON.stringify(selectedOS.cliente) : selectedOS.cliente) : 'N/A'}`, 10, 30);
    doc.text(`Referência: ${selectedOS.referencia ? (typeof selectedOS.referencia === 'object' ? JSON.stringify(selectedOS.referencia) : selectedOS.referencia) : 'N/A'}`, 10, 40);
    doc.text(`Status: ${selectedOS.status ? (typeof selectedOS.status === 'object' ? JSON.stringify(selectedOS.status) : selectedOS.status) : 'N/A'}`, 10, 50);
    doc.text(`Data de Registro: ${selectedOS.dataRegistro ? formatFirestoreDate(selectedOS.dataRegistro) : 'N/A'}`, 10, 60);
    doc.text(`Data de Previsão: ${selectedOS.dataPrevisao ? formatFirestoreDate(selectedOS.dataPrevisao) : 'N/A'}`, 10, 70);
    doc.text(`Loja: ${selectedOS.loja ? (typeof selectedOS.loja === 'object' ? JSON.stringify(selectedOS.loja) : selectedOS.loja) : 'N/A'}`, 10, 80);

    // Adicionar campos adicionais
    if (selectedOS.dataEntrega) {
      doc.text(`Data de Entrega: ${formatFirestoreDate(selectedOS.dataEntrega)}`, 10, 90);
    }
    if (selectedOS.valor) {
      doc.text(`Valor: R$ ${parseFloat(typeof selectedOS.valor === 'object' ? 0 : selectedOS.valor || 0).toFixed(2)}`, 10, 100);
    }
    if (selectedOS.descricao) {
      doc.text(`Descrição: ${typeof selectedOS.descricao === 'object' ? JSON.stringify(selectedOS.descricao) : selectedOS.descricao}`, 10, 110);
    }
    if (selectedOS.observacoes) {
      doc.text(`Observações: ${typeof selectedOS.observacoes === 'object' ? JSON.stringify(selectedOS.observacoes) : selectedOS.observacoes}`, 10, 120);
    }

    doc.save(`OS_${selectedOS.codigo ? (typeof selectedOS.codigo === 'object' ? 'os' : selectedOS.codigo) : selectedOS.id}.pdf`);
  };

  // Função para lidar com a impressão
  const handlePrint = () => {
    window.print();
  };

  // Função para marcar ou desmarcar OS para exclusão
  const toggleDeletion = (e, osId) => {
    e.stopPropagation(); // Evitar abrir o modal

    setSelectedForDeletion(prev => {
      if (prev.includes(osId)) {
        return prev.filter(id => id !== osId);
      } else {
        return [...prev, osId];
      }
    });
  };

  // Função para excluir as OS selecionadas
  const handleDeleteSelected = async () => {
    if (selectedForDeletion.length === 0) {
      alert('Selecione pelo menos uma ordem de serviço para excluir.');
      return;
    }

    if (confirm(`Deseja realmente excluir ${selectedForDeletion.length} ordens de serviço selecionadas?`)) {
      try {
        for (const osId of selectedForDeletion) {
          // Encontrar a loja da OS
          const os = osList.find(o => o.id === osId);
          if (os && os.loja) {
            // Excluir a OS
            const osRef = doc(firestore, `lojas/${os.loja}/servicos/items/items`, osId);
            await deleteDoc(osRef);
          }
        }

        // Atualizar as listas de OS
        const updatedOSList = osList.filter(os => !selectedForDeletion.includes(os.id));
        setOsList(updatedOSList);
        setFilteredOS(updatedOSList.filter(o =>
          (selectedLoja === 'Ambas' || o.loja === selectedLoja) &&
          (!searchQuery ||
            o.codigo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            o.cliente?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            o.referencia?.toLowerCase().includes(searchQuery.toLowerCase()))
        ));
        setTotalOS(updatedOSList.length);
        setSelectedForDeletion([]);

        alert('Ordens de serviço excluídas com sucesso!');
      } catch (error) {
        console.error('Erro ao excluir ordens de serviço:', error);
        alert('Erro ao excluir as ordens de serviço selecionadas.');
      }
    }
  };

  // Função para abrir o modal de edição
  const openEditModal = () => {
    if (selectedForDeletion.length !== 1) return;

    // Encontrar a OS selecionada
    const osToEdit = osList.find(os => os.id === selectedForDeletion[0]);

    if (osToEdit) {
      setEditingOS({ ...osToEdit });
      setIsEditModalOpen(true);
    }
  };

  // Função para salvar a edição
  const handleSaveEdit = async () => {
    try {
      // Referência ao documento
      const osRef = doc(firestore, `lojas/${editingOS.loja}/servicos/items/items`, editingOS.id);

      // Salvar no Firestore
      await setDoc(osRef, editingOS, { merge: true });

      // Atualizar estados locais
      setOsList(prevOSList =>
        prevOSList.map(os => os.id === editingOS.id ? editingOS : os)
      );

      setFilteredOS(prevFiltered =>
        prevFiltered.map(os => os.id === editingOS.id ? editingOS : os)
      );

      // Limpar seleção e fechar modal
      setSelectedForDeletion([]);
      setIsEditModalOpen(false);

      alert('Ordem de serviço atualizada com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar ordem de serviço:', error);
      alert('Erro ao atualizar a ordem de serviço.');
    }
  };

  // Função para atualizar o status da OS
  const handleStatusUpdate = async () => {
    if (!selectedOS) return;

    try {
      // Referência ao documento
      const osRef = doc(firestore, `lojas/${selectedOS.loja}/servicos/items/items`, selectedOS.id);

      // Preparar dados para atualização
      const updateData = {
        status: editingOS.status,
        statusAntigo: selectedOS.status,
        statusAtualizado: new Date()
      };

      // Se o status for "Entregue", adicionar a data de entrega
      if (editingOS.status === 'Entregue') {
        updateData.dataEntrega = new Date();
      }

      // Atualizar no Firestore
      await updateDoc(osRef, updateData);

      // Atualizar estados locais
      const updatedOS = { ...selectedOS, ...updateData };
      setOsList(prevOSList =>
        prevOSList.map(os => os.id === selectedOS.id ? updatedOS : os)
      );

      setFilteredOS(prevFiltered =>
        prevFiltered.map(os => os.id === selectedOS.id ? updatedOS : os)
      );

      setStatusMessage('Status atualizado com sucesso!');
      setTimeout(() => {
        setStatusMessage('');
        closeModal();
      }, 2000);
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      setStatusMessage('Erro ao atualizar status.');
    }
  };

  // Calcular OS para a página atual
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentOS = filteredOS.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredOS.length / itemsPerPage);

  // Funções de navegação
  const goToPage = (pageNumber) => {
    setCurrentPage(Math.max(1, Math.min(pageNumber, totalPages)));
  };

  useEffect(() => {
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

  const FilterActiveBadges = () => {
    const activeFilters = [];

    if (yearFilter !== 'Todos') {
      activeFilters.push({ type: 'Ano', value: yearFilter });
    }

    if (monthFilter !== 'Todos') {
      activeFilters.push({ type: 'Mês', value: monthFilter });
    }

    if (dayFilter !== 'Todos') {
      activeFilters.push({ type: 'Dia', value: dayFilter });
    }

    if (statusFilter !== 'Todos') {
      activeFilters.push({ type: 'Status', value: statusFilter });
    }

    if (activeFilters.length === 0) return null;

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
              onClick={() => {
                if (filter.type === 'Ano') setYearFilter('Todos');
                if (filter.type === 'Mês') setMonthFilter('Todos');
                if (filter.type === 'Dia') setDayFilter('Todos');
                if (filter.type === 'Status') setStatusFilter('Todos');
              }}
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
            setYearFilter('Todos');
            setMonthFilter('Todos');
            setDayFilter('Todos');
            setStatusFilter('Todos');
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
        <div className="w-full max-w-5xl mx-auto rounded-lg">
          <div className="mb-4">
            <h2 className="text-3xl font-bold text-[#81059e] mb-2 mt-8">
              PEDIDOS
            </h2>
          </div>

          {/* Dashboard compacto com estatísticas essenciais */}
          <div className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              {/* Card - Total de OS */}
              <div className="border-2 rounded-lg p-4 border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <FontAwesomeIcon
                    icon={faClipboardList}
                    className="h-8 w-8 text-[#81059e] bg-purple-300 p-2 rounded-2xl"
                  />
                  <span className="text-lg font-medium text-gray-700 flex-grow ml-3">Total de OS</span>
                </div>
                <p className="text-2xl font-semibold text-center mt-2">{totalOS}</p>
              </div>

              {/* Card - Em Andamento */}
              <div className="border-2 rounded-lg p-4 border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <FontAwesomeIcon
                    icon={faClock}
                    className="h-8 w-8 text-[#81059e] bg-purple-300 p-2 rounded-2xl"
                  />
                  <span className="text-lg font-medium text-gray-700 flex-grow ml-3">Em Andamento</span>
                </div>
                <p className="text-2xl font-semibold text-center mt-2">
                  {osList.filter(os =>
                    os.status !== 'Entregue' &&
                    os.status !== 'Cancelado'
                  ).length}
                </p>
              </div>

              {/* Card - Prontas para Entrega */}
              <div className="border-2 rounded-lg p-4 border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <FontAwesomeIcon
                    icon={faCheck}
                    className="h-8 w-8 text-[#81059e] bg-purple-300 p-2 rounded-2xl"
                  />
                  <span className="text-lg font-medium text-gray-700 flex-grow ml-3">Prontas</span>
                </div>
                <p className="text-2xl font-semibold text-center mt-2">
                  {osList.filter(os => os.status === 'Pronto para Entrega').length}
                </p>
              </div>

              {/* Card - Entregues */}
              <div className="border-2 rounded-lg p-4 border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <FontAwesomeIcon
                    icon={faUser}
                    className="h-8 w-8 text-[#81059e] bg-purple-300 p-2 rounded-2xl"
                  />
                  <span className="text-lg font-medium text-gray-700 flex-grow ml-3">Entregues</span>
                </div>
                <p className="text-2xl font-semibold text-center mt-2">
                  {osList.filter(os => os.status === 'Entregue').length}
                </p>
              </div>
            </div>
          </div>

          {/* Barra de busca e filtros com dropdown */}
          <div className="flex flex-wrap gap-2 items-center mb-4">
            {/* Barra de busca */}
            <input
              type="text"
              placeholder="Busque por código, cliente ou referência"
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
                {(yearFilter !== 'Todos' || monthFilter !== 'Todos' || dayFilter !== 'Todos' || statusFilter !== 'Todos') && (
                  <span className="ml-1 bg-[#81059e] text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                    {(yearFilter !== 'Todos' ? 1 : 0) +
                      (monthFilter !== 'Todos' ? 1 : 0) +
                      (dayFilter !== 'Todos' ? 1 : 0) +
                      (statusFilter !== 'Todos' ? 1 : 0)}
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
                        setYearFilter('Todos');
                        setMonthFilter('Todos');
                        setDayFilter('Todos');
                        setStatusFilter('Todos');
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
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    </div>

                    {/* Filtro de ano */}
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Ano</label>
                      <select
                        value={yearFilter}
                        onChange={(e) => setYearFilter(e.target.value)}
                        className="p-2 h-9 w-full border border-gray-200 rounded-lg text-gray-800 text-sm"
                      >
                        {availableYears.map(year => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                    </div>

                    {/* Filtro de mês */}
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Mês</label>
                      <select
                        value={monthFilter}
                        onChange={(e) => setMonthFilter(e.target.value)}
                        className="p-2 h-9 w-full border border-gray-200 rounded-lg text-gray-800 text-sm"
                      >
                        {months.map(month => (
                          <option key={month} value={month}>{month}</option>
                        ))}
                      </select>
                    </div>

                    {/* Filtro de dia */}
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Dia</label>
                      <select
                        value={dayFilter}
                        onChange={(e) => setDayFilter(e.target.value)}
                        className="p-2 h-9 w-full border border-gray-200 rounded-lg text-gray-800 text-sm"
                      >
                        {availableDays.map(day => (
                          <option key={day} value={day}>{day}</option>
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
              <Link href="/services/add-os">
                <button className="bg-green-400 text-white h-10 w-10 rounded-md flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </Link>

              {/* Botão Editar - aparece apenas quando há OS selecionada */}
              <button
                onClick={openEditModal}
                className={`${selectedForDeletion.length !== 1 ? 'bg-blue-300' : 'bg-blue-500'} text-white h-10 w-10 rounded-md flex items-center justify-center`}
                disabled={selectedForDeletion.length !== 1}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>

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

          <FilterActiveBadges />

          {/* Tabela de ordens de serviço */}
          {loading ? (
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#81059e]"></div>
          ) : error ? (
            <p>{error}</p>
          ) : (
            <div className="w-full overflow-x-auto">
              {filteredOS.length === 0 ? (
                <p>Nenhuma ordem de serviço encontrada.</p>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="min-w-full table-auto select-none">
                      <thead>
                        <tr className="bg-[#81059e] text-white">
                          <th className="px-3 py-2 w-12">
                            <span className="sr-only">Selecionar</span>
                          </th>
                          <th className="px-3 py-2 cursor-pointer whitespace-nowrap" onClick={() => handleSort('codigo')}>
                            Código {renderSortArrow('codigo')}
                          </th>
                          <th className="px-3 py-2 cursor-pointer" onClick={() => handleSort('cliente')}>
                            Cliente {renderSortArrow('cliente')}
                          </th>
                          <th className="px-3 py-2 cursor-pointer" onClick={() => handleSort('referencia')}>
                            Referência {renderSortArrow('referencia')}
                          </th>
                          <th className="px-3 py-2 cursor-pointer whitespace-nowrap" onClick={() => handleSort('status')}>
                            Status {renderSortArrow('status')}
                          </th>
                          <th className="px-3 py-2 cursor-pointer whitespace-nowrap" onClick={() => handleSort('dataRegistro')}>
                            Data Registro {renderSortArrow('dataRegistro')}
                          </th>
                          <th className="px-3 py-2 cursor-pointer whitespace-nowrap" onClick={() => handleSort('dataPrevisao')}>
                            Previsão {renderSortArrow('dataPrevisao')}
                          </th>
                          <th className="px-3 py-2">Loja</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentOS.map((os) => (
                          <tr
                            key={os.id}
                            className="text-black text-left hover:bg-gray-100 cursor-pointer"
                          >
                            <td className="border px-2 py-2 text-center">
                              <input
                                type="checkbox"
                                checked={selectedForDeletion.includes(os.id)}
                                onChange={(e) => toggleDeletion(e, os.id)}
                                className="h-4 w-4 cursor-pointer"
                                onClick={(e) => e.stopPropagation()}
                              />
                            </td>
                            <td className="border px-3 py-2 whitespace-nowrap" onClick={() => openModal(os)}>
                              {os.codigo ? (typeof os.codigo === 'object' ? JSON.stringify(os.codigo) : os.codigo) : 'N/A'}
                            </td>
                            <td className="border px-4 py-2 max-w-[300px] truncate" onClick={() => openModal(os)}>
                              {os.cliente ? (typeof os.cliente === 'object' ? JSON.stringify(os.cliente) : os.cliente) : 'N/A'}
                            </td>
                            <td className="border px-3 py-2 whitespace-nowrap" onClick={() => openModal(os)}>
                              {os.referencia ? (typeof os.referencia === 'object' ? JSON.stringify(os.referencia) : os.referencia) : 'N/A'}
                            </td>
                            <td className={`border px-3 py-2 whitespace-nowrap ${getStatusColor(os.status)}`} onClick={() => openModal(os)}>
                              {os.status ? (typeof os.status === 'object' ? JSON.stringify(os.status) : os.status) : 'N/A'}
                            </td>
                            <td className="border px-3 py-2 whitespace-nowrap" onClick={() => openModal(os)}>
                              {os.dataRegistro ? formatFirestoreDate(os.dataRegistro) : 'N/A'}
                            </td>
                            <td className="border px-3 py-2 whitespace-nowrap" onClick={() => openModal(os)}>
                              {os.dataPrevisao ? formatFirestoreDate(os.dataPrevisao) : 'N/A'}
                            </td>
                            <td className="border px-3 py-2 whitespace-nowrap" onClick={() => openModal(os)}>
                              {os.loja ? (typeof os.loja === 'object' ? JSON.stringify(os.loja) : os.loja) : 'N/A'}
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
                        {Math.min(indexOfLastItem, filteredOS.length)}
                      </span>{' '}
                      de <span className="font-medium">{filteredOS.length}</span> registros
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

          {/* Modal de Detalhamento da OS */}
          {isModalOpen && selectedOS && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
              <div className="bg-white rounded-lg shadow-lg w-full max-w-md flex flex-col h-3/5 overflow-hidden">
                <div className="bg-[#81059e] text-white p-4 flex justify-between items-center">
                  <h3 className="text-xl font-bold">
                    Detalhes da Ordem de Serviço
                  </h3>
                  <FontAwesomeIcon
                    icon={faX}
                    className="h-5 w-5 text-white cursor-pointer hover:text-gray-200"
                    onClick={closeModal}
                  />
                </div>
                <div className="space-y-3 p-4 overflow-y-auto flex-grow">
                  <p><strong>
                    Código:</strong> {selectedOS.codigo ? (typeof selectedOS.codigo === 'object' ? JSON.stringify(selectedOS.codigo) : selectedOS.codigo) : 'N/A'}
                  </p>
                  <p>
                    <strong>Cliente:</strong> {selectedOS.cliente ? (typeof selectedOS.cliente === 'object' ? JSON.stringify(selectedOS.cliente) : selectedOS.cliente) : 'N/A'}
                  </p>
                  <p>
                    <strong>Referência:</strong> {selectedOS.referencia ? (typeof selectedOS.referencia === 'object' ? JSON.stringify(selectedOS.referencia) : selectedOS.referencia) : 'N/A'}
                  </p>
                  <p className={`${getStatusColor(selectedOS.status)} p-2 rounded`}>
                    <strong>Status:</strong> {selectedOS.status ? (typeof selectedOS.status === 'object' ? JSON.stringify(selectedOS.status) : selectedOS.status) : 'N/A'}
                  </p>
                  <p>
                    <strong>Data de Registro:</strong> {selectedOS.dataRegistro ? formatFirestoreDate(selectedOS.dataRegistro) : 'N/A'}
                  </p>
                  <p>
                    <strong>Data de Previsão:</strong>{' '}
                    {selectedOS.dataPrevisao ? formatFirestoreDate(selectedOS.dataPrevisao) : 'N/A'}
                  </p>

                  {selectedOS.dataEntrega && (
                    <p>
                      <strong>Data de Entrega:</strong>{' '}
                      {formatFirestoreDate(selectedOS.dataEntrega)}
                    </p>
                  )}

                  <p>
                    <strong>Loja:</strong> {selectedOS.loja ? (typeof selectedOS.loja === 'object' ? JSON.stringify(selectedOS.loja) : selectedOS.loja) : 'Não especificada'}
                  </p>

                  {selectedOS.valor && (
                    <p>
                      <strong>Valor:</strong> R$ {parseFloat(typeof selectedOS.valor === 'object' ? 0 : selectedOS.valor || 0).toFixed(2)}
                    </p>
                  )}

                  {selectedOS.descricao && (
                    <p>
                      <strong>Descrição:</strong> {typeof selectedOS.descricao === 'object' ? JSON.stringify(selectedOS.descricao) : selectedOS.descricao}
                    </p>
                  )}

                  {selectedOS.observacoes && (
                    <p>
                      <strong>Observações:</strong> {typeof selectedOS.observacoes === 'object' ? JSON.stringify(selectedOS.observacoes) : selectedOS.observacoes}
                    </p>
                  )}

                  {/* Seção para atualizar o status */}
                  <div className="mt-6">
                    <label className="block text-black font-bold mb-2">
                      Atualizar Status
                    </label>
                    <select
                      value={editingOS?.status || selectedOS.status}
                      onChange={(e) => setEditingOS({ ...selectedOS, status: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-md text-black"
                    >
                      {statusOptions.slice(1).map(status => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </div>

                  {statusMessage && (
                    <p className="text-green-600 mt-4">{statusMessage}</p>
                  )}

                  {/* Botões de ação */}
                  <div className="flex justify-around mt-6">
                    <button
                      onClick={generatePDF}
                      className="bg-[#81059e] text-white px-4 py-2 rounded-md flex items-center"
                    >
                      <FontAwesomeIcon icon={faFilePdf} className="h-5 w-5 mr-2" />
                      Ver PDF
                    </button>
                    <button
                      onClick={handlePrint}
                      className="bg-[#81059e] text-white px-4 py-2 rounded-md flex items-center"
                    >
                      <FontAwesomeIcon icon={faPrint} className="h-5 w-5 mr-2" />
                      Imprimir
                    </button>
                  </div>

                  {/* Botão de atualizar status */}
                  <div className="flex justify-center mt-4">
                    <button
                      onClick={handleStatusUpdate}
                      className="bg-green-600 text-white px-4 py-2 rounded-md"
                    >
                      <FontAwesomeIcon
                        icon={faCheck}
                        className="h-5 w-5 text-white cursor-pointer hover:text-gray-200 pr-2 justify-center"
                      />
                      Atualizar Status
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Modal de Edição */}
          {isEditModalOpen && editingOS && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
              <div className="bg-white rounded-lg shadow-lg w-full max-w-md flex flex-col h-3/5 overflow-hidden">
                <div className="bg-[#81059e] text-white p-4 flex justify-between items-center">
                  <h3 className="text-xl font-bold">Editar Ordem de Serviço</h3>

                  <FontAwesomeIcon
                    icon={faX}
                    className="h-5 w-5 text-white cursor-pointer hover:text-gray-200"
                    onClick={() => setIsEditModalOpen(false)}
                  />
                </div>

                <div className="space-y-3 p-4 overflow-y-auto flex-grow">
                  <div>
                    <label className="text-[#81059e] font-medium">Código:</label>
                    <input
                      type="text"
                      value={editingOS.codigo || ''}
                      onChange={(e) => setEditingOS({ ...editingOS, codigo: e.target.value })}
                      className="w-full p-2 border-2 border-[#81059e] rounded-sm"
                    />
                  </div>
                  <div>
                    <label className="text-[#81059e] font-medium">Cliente:</label>
                    <input
                      type="text"
                      value={editingOS.cliente || ''}
                      onChange={(e) => setEditingOS({ ...editingOS, cliente: e.target.value })}
                      className="w-full p-2 border-2 border-[#81059e] rounded-sm"
                    />
                  </div>

                  <div>
                    <label className="text-[#81059e] font-medium">Referência:</label>
                    <input
                      type="text"
                      value={editingOS.referencia || ''}
                      onChange={(e) => setEditingOS({ ...editingOS, referencia: e.target.value })}
                      className="w-full p-2 border-2 border-[#81059e] rounded-sm"
                    />
                  </div>

                  <div>
                    <label className="text-[#81059e] font-medium">Status:</label>
                    <select
                      value={editingOS.status || 'Aguardando Atendimento'}
                      onChange={(e) => setEditingOS({ ...editingOS, status: e.target.value })}
                      className="w-full p-2 border-2 border-[#81059e] rounded-sm"
                    >
                      {statusOptions.slice(1).map(status => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[#81059e] font-medium">Data de Previsão:</label>
                    <input
                      type="date"
                      value={editingOS.dataPrevisao ?
                        (editingOS.dataPrevisao.seconds ?
                          new Date(editingOS.dataPrevisao.seconds * 1000).toISOString().substr(0, 10) :
                          new Date(editingOS.dataPrevisao).toISOString().substr(0, 10)
                        ) : ''
                      }
                      onChange={(e) => setEditingOS({ ...editingOS, dataPrevisao: new Date(e.target.value) })}
                      className="w-full p-2 border-2 border-[#81059e] rounded-sm"
                    />
                  </div>

                  <div>
                    <label className="text-[#81059e] font-medium">Descrição:</label>
                    <textarea
                      value={editingOS.descricao || ''}
                      onChange={(e) => setEditingOS({ ...editingOS, descricao: e.target.value })}
                      className="w-full p-2 border-2 border-[#81059e] rounded-sm h-24"
                    />
                  </div>

                  <div>
                    <label className="text-[#81059e] font-medium">Observações:</label>
                    <textarea
                      value={editingOS.observacoes || ''}
                      onChange={(e) => setEditingOS({ ...editingOS, observacoes: e.target.value })}
                      className="w-full p-2 border-2 border-[#81059e] rounded-sm h-24"
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