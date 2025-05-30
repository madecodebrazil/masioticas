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
  faFilter,
  faX,
  faEdit,
  faTrash
} from '@fortawesome/free-solid-svg-icons';
import { collection, getDocs, doc, setDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
import { firestore } from '../../../../lib/firebaseConfig';
import jsPDF from 'jspdf';

// FilterModal component 
const FilterModal = ({ 
  isOpen, 
  onClose, 
  yearFilter, 
  setYearFilter, 
  monthFilter, 
  setMonthFilter, 
  dayFilter, 
  setDayFilter, 
  availableYears, 
  months, 
  availableDays 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md animate-fadeIn">
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-semibold text-[#81059e]">Filtros</h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-5 space-y-4">
          {/* Filtro de ano */}
          <div>
            <label className="block text-sm text-gray-700 mb-1 font-medium">Ano</label>
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md text-gray-800 bg-white focus:border-[#81059e] focus:ring focus:ring-purple-200 transition-colors"
            >
              {availableYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          {/* Filtro de mês */}
          <div>
            <label className="block text-sm text-gray-700 mb-1 font-medium">Mês</label>
            <select
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md text-gray-800 bg-white focus:border-[#81059e] focus:ring focus:ring-purple-200 transition-colors"
            >
              {months.map(month => (
                <option key={month} value={month}>{month}</option>
              ))}
            </select>
          </div>

          {/* Filtro de dia */}
          <div>
            <label className="block text-sm text-gray-700 mb-1 font-medium">Dia</label>
            <select
              value={dayFilter}
              onChange={(e) => setDayFilter(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md text-gray-800 bg-white focus:border-[#81059e] focus:ring focus:ring-purple-200 transition-colors"
            >
              {availableDays.map(day => (
                <option key={day} value={day}>{day}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="p-4 bg-gray-50 border-t flex justify-between rounded-b-lg">
          <button
            onClick={() => {
              setYearFilter('Todos');
              setMonthFilter('Todos');
              setDayFilter('Todos');
            }}
            className="text-[#81059e] hover:text-[#690480] px-4 py-2 rounded-md transition-colors"
          >
            Limpar Filtros
          </button>
          <button
            onClick={onClose}
            className="bg-[#81059e] hover:bg-[#690480] text-white px-5 py-2 rounded-md transition-colors"
          >
            Aplicar
          </button>
        </div>
      </div>
    </div>
  );
};

export default function ListaLaboratorios() {
  const { userPermissions, userData } = useAuth();
  const [laboratorios, setLaboratorios] = useState([]);
  const [filteredLaboratorios, setFilteredLaboratorios] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLoja, setSelectedLoja] = useState('Ambas');
  const [selectedLaboratorio, setSelectedLaboratorio] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalLaboratorios, setTotalLaboratorios] = useState(0);
  const [selectedForDeletion, setSelectedForDeletion] = useState([]);
  const [sortField, setSortField] = useState('razaoSocial');
  const [sortDirection, setSortDirection] = useState('asc');
  const [yearFilter, setYearFilter] = useState('Todos');
  const [monthFilter, setMonthFilter] = useState('Todos');
  const [dayFilter, setDayFilter] = useState('Todos');
  const [availableYears, setAvailableYears] = useState(['Todos']);
  const months = ['Todos', 'Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const [availableDays, setAvailableDays] = useState(['Todos']);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingLaboratorio, setEditingLaboratorio] = useState(null);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  useEffect(() => {
    const fetchLaboratorios = async () => {
      try {
        setLoading(true);
        const fetchedLaboratorios = [];

        // Usar o caminho correto para lojas específicas
        if (selectedLoja !== 'Ambas') {
          // Caminho para uma loja específica
          const laboratoriosRef = collection(firestore, `lojas/laboratorio/items`);
          const laboratoriosSnapshot = await getDocs(laboratoriosRef);

          laboratoriosSnapshot.docs.forEach((docItem) => {
            const laboratorioData = docItem.data();
            fetchedLaboratorios.push({
              id: docItem.id,
              ...laboratorioData,
              loja: selectedLoja
            });
          });
        } else {
          // Se for "Ambas", buscar de todas as lojas que o usuário tem acesso
          const lojas = userPermissions?.lojas || [];

          for (const loja of lojas) {
            const laboratoriosRef = collection(firestore, `lojas/laboratorio/items`);
            const laboratoriosSnapshot = await getDocs(laboratoriosRef);

            laboratoriosSnapshot.docs.forEach((docItem) => {
              const laboratorioData = docItem.data();
              fetchedLaboratorios.push({
                id: docItem.id,
                ...laboratorioData,
                loja: loja
              });
            });
          }
        }

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
  }, [selectedLoja, userPermissions]);

  // Extrair anos disponíveis dos dados
  useEffect(() => {
    if (laboratorios.length > 0) {
      const years = ['Todos'];
      laboratorios.forEach(lab => {
        if (lab.dataRegistro) {
          const date = lab.dataRegistro.seconds
            ? new Date(lab.dataRegistro.seconds * 1000)
            : new Date(lab.dataRegistro);
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
  }, [laboratorios]);

  // Função para filtrar laboratórios com base na busca e loja
  useEffect(() => {
    const filterBySearchAndLojaAndDate = () => {
      let filtered = laboratorios;

      // Filtro por loja
      if (selectedLoja !== 'Ambas') {
        filtered = filtered.filter((lab) => lab.loja === selectedLoja);
      }

      // Filtro por busca
      if (searchQuery !== '') {
        filtered = filtered.filter(
          (lab) =>
            (lab.razaoSocial?.toLowerCase().includes(searchQuery.toLowerCase()) || '') ||
            (lab.nomeFantasia?.toLowerCase().includes(searchQuery.toLowerCase()) || '') ||
            (lab.cnpj?.toLowerCase().includes(searchQuery.toLowerCase()) || '')
        );
      }

      // Filtro por data
      filtered = filtered.filter(lab => {
        if (!lab.dataRegistro && (yearFilter !== 'Todos' || monthFilter !== 'Todos' || dayFilter !== 'Todos')) {
          return false;
        }

        if (!lab.dataRegistro) return true;

        const labDate = lab.dataRegistro.seconds
          ? new Date(lab.dataRegistro.seconds * 1000)
          : new Date(lab.dataRegistro);

        // Filtrar por ano se não for "Todos"
        if (yearFilter !== 'Todos' && labDate.getFullYear().toString() !== yearFilter) {
          return false;
        }

        // Filtrar por mês se não for "Todos"
        if (monthFilter !== 'Todos') {
          const monthIndex = months.indexOf(monthFilter) - 1;
          if (labDate.getMonth() !== monthIndex) {
            return false;
          }
        }

        // Filtrar por dia se não for "Todos"
        if (dayFilter !== 'Todos' && labDate.getDate().toString() !== dayFilter) {
          return false;
        }

        return true;
      });

      // Aplicar ordenação
      filtered = sortLaboratorios(filtered, sortField, sortDirection);
      setFilteredLaboratorios(filtered);
    };

    filterBySearchAndLojaAndDate();
  }, [searchQuery, selectedLoja, laboratorios, sortField, sortDirection, yearFilter, monthFilter, dayFilter]);

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
    doc.text(`Loja: ${selectedLaboratorio.loja || 'N/A'}`, 10, 80);
    doc.text(`Data de Registro: ${formatFirestoreDate(selectedLaboratorio.dataRegistro) || 'N/A'}`, 10, 90);

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
          // Encontrar a loja do laboratório
          const lab = laboratorios.find(l => l.id === labId);
          if (lab && lab.loja) {
            // Excluir o laboratório
            const labRef = doc(firestore, `lojas/laboratorio/items`, labId);
            await deleteDoc(labRef);
          }
        }

        // Atualizar as listas de laboratórios
        const updatedLaboratorios = laboratorios.filter(lab => !selectedForDeletion.includes(lab.id));
        setLaboratorios(updatedLaboratorios);
        setFilteredLaboratorios(updatedLaboratorios.filter(l =>
          (selectedLoja === 'Ambas' || l.loja === selectedLoja) &&
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
          }}
        >
          Limpar todos
        </button>
      </div>
    );
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

              {/* Outros cards podem ser adicionados conforme a necessidade */}
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
                    if (!lab.dataRegistro) return false;
                    const now = new Date();
                    const labDate = lab.dataRegistro.seconds
                      ? new Date(lab.dataRegistro.seconds * 1000)
                      : new Date(lab.dataRegistro);
                    return labDate.getMonth() === now.getMonth() && labDate.getFullYear() === now.getFullYear();
                  }).length}
                </p>
              </div>

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

          {/* Barra de busca e filtros com dropdown */}
          <div className="flex flex-wrap gap-2 items-center mb-4">
            {/* Barra de busca */}
            <input
              type="text"
              placeholder="Busque por CNPJ, Razão Social ou Nome Fantasia"
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

            {/* Dropdown de filtros de data */}
            <div className="relative">
              <button
                onClick={() => setIsFilterModalOpen(true)}
                className="p-2 h-10 border-2 border-gray-200 rounded-lg bg-white flex items-center gap-1 text-[#81059e] hover:border-[#81059e] transition-colors"
                data-filter-toggle="true"
              >
                <FontAwesomeIcon icon={faFilter} className="h-4 w-4" />
                <span className="hidden sm:inline">Filtrar</span>
                {(yearFilter !== 'Todos' || monthFilter !== 'Todos' || dayFilter !== 'Todos') && (
                  <span className="ml-1 bg-[#81059e] text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                    {(yearFilter !== 'Todos' ? 1 : 0) + (monthFilter !== 'Todos' ? 1 : 0) + (dayFilter !== 'Todos' ? 1 : 0)}
                  </span>
                )}
              </button>
            </div>

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
                className={`${selectedForDeletion.length === 0 ? 'bg-red-400' : 'bg-red-400'} text-white h-10 w-10 rounded-md flex items-center justify-center`}
                disabled={selectedForDeletion.length === 0}
              >
                <FontAwesomeIcon icon={faTrash} className="h-5 w-5" />
              </button>
            </div>
          </div>

          <FilterActiveBadges />

          {/* Tabela de laboratórios */}
          {loading ? (
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#81059e]"></div>
          ) : error ? (
            <p>{error}</p>
          ) : (
            <div className="w-full overflow-x-auto">
              {filteredLaboratorios.length === 0 ? (
                <p>Nenhum laboratório encontrado.</p>
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
                    <strong>Loja:</strong> {selectedLaboratorio.loja || 'N/A'}
                  </p>

                  <p>
                    <strong>Data de Registro:</strong> {formatFirestoreDate(selectedLaboratorio.dataRegistro) || 'N/A'}
                  </p>

                  {selectedLaboratorio.dataAtualizacao && (
                    <p>
                      <strong>Última Atualização:</strong> {formatFirestoreDate(selectedLaboratorio.dataAtualizacao)}
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

          {/* FilterModal component */}
          <FilterModal 
            isOpen={isFilterModalOpen}
            onClose={() => setIsFilterModalOpen(false)}
            yearFilter={yearFilter}
            setYearFilter={setYearFilter}
            monthFilter={monthFilter}
            setMonthFilter={setMonthFilter}
            dayFilter={dayFilter}
            setDayFilter={setDayFilter}
            availableYears={availableYears}
            months={months}
            availableDays={availableDays}
          />
        </div>
      </div>
    </Layout>
  );
}