"use client";
import React, { useState, useEffect } from "react";
import {
  getFirestore,
  collection,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { useRouter } from "next/navigation"; // Para redirecionar
import { useAuth } from "@/hooks/useAuth"; // Importe o hook useAuth
import Layout from "@/components/Layout"; // Seu layout instanciado
import { app } from "@/lib/firebaseConfig"; // Certifique-se de que o Firebase está corretamente inicializado
import { FaTrash, FaEdit, FaFilePdf, FaPrint, FaFilter, FaTimes, FaCheck, FaDollarSign, FaClock, FaExclamationTriangle, FaPlus } from "react-icons/fa"; // Ícones da biblioteca react-icons
import jsPDF from "jspdf"; // Para gerar o PDF
import "jspdf-autotable"; // Plugin para tabelas no jsPDF
import Link from "next/link";

const db = getFirestore(app); // Inicializando Firestore

function ListConsultation() {
  const [consultations, setConsultations] = useState([]); // Armazenar as consultas
  const [filteredConsultations, setFilteredConsultations] = useState([]); // Consultas filtradas
  const [isLoading, setIsLoading] = useState(true); // Estado de carregamento
  const [searchTerm, setSearchTerm] = useState(""); // Termo de busca
  const [selectedConsultation, setSelectedConsultation] = useState(null); // Consulta selecionada
  const [currentLoja, setCurrentLoja] = useState(null);
  const { user, userData, userPermissions } = useAuth(); // Use o hook useAuth
  const [isModalOpen, setIsModalOpen] = useState(false); // Controle do modal
  const [selectedForDeletion, setSelectedForDeletion] = useState([]); // Estado para seleção de remoção
  const [sortField, setSortField] = useState('data'); // Campo de ordenação
  const [sortDirection, setSortDirection] = useState('asc'); // Direção de ordenação
  const [yearFilter, setYearFilter] = useState('Todos'); // Filtro de ano
  const [monthFilter, setMonthFilter] = useState('Todos'); // Filtro de mês
  const [dayFilter, setDayFilter] = useState('Todos'); // Filtro de dia
  const [availableYears, setAvailableYears] = useState(['Todos']); // Anos disponíveis para filtro
  const [availableDays, setAvailableDays] = useState(['Todos']); // Dias disponíveis para filtro
  const [currentPage, setCurrentPage] = useState(1); // Página atual
  const [itemsPerPage, setItemsPerPage] = useState(15); // Itens por página
  const [showFilterDropdown, setShowFilterDropdown] = useState(false); // Controle do dropdown de filtro
  const [viewCompletedConsultations, setViewCompletedConsultations] = useState(false); // Controle para exibir consultas concluídas
  const [completedConsultations, setCompletedConsultations] = useState([]); // Consultas concluídas

  const months = ['Todos', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  const router = useRouter(); // Para redirecionar

  // Função para buscar as consultas
  const fetchConsultations = async () => {
    setIsLoading(true);
    try {
      if (!currentLoja) {
        console.error("Nenhuma loja selecionada");
        setIsLoading(false);
        return;
      }

      const consultationsCollection = collection(db, `lojas/${currentLoja}/consultas`);
      const querySnapshot = await getDocs(consultationsCollection);

      const consultationsData = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        consultationsData.push({ id: doc.id, ...data });
      });

      // Separar consultas pendentes e concluídas
      const pendingConsultations = consultationsData.filter(
        (consultation) => consultation.status !== "Concluída"
      );
      const completedConsultationsList = consultationsData.filter(
        (consultation) => consultation.status === "Concluída"
      );

      setConsultations(pendingConsultations);
      setCompletedConsultations(completedConsultationsList);
      setFilteredConsultations(
        viewCompletedConsultations ? completedConsultationsList : pendingConsultations
      );

      // Extrair anos únicos das consultas para o filtro
      const years = ['Todos'];
      consultationsData.forEach(consultation => {
        if (consultation.data) {
          const date = consultation.data.seconds
            ? new Date(consultation.data.seconds * 1000)
            : new Date(consultation.data);
          const year = date.getFullYear().toString();
          if (!years.includes(year)) {
            years.push(year);
          }
        }
      });
      setAvailableYears(years);

      setIsLoading(false);
    } catch (error) {
      console.error("Erro ao buscar consultas:", error);
      setIsLoading(false);
    }
  };

  // useEffect para definir a loja atual com base nas permissões
  useEffect(() => {
    if (userPermissions?.lojas?.length > 0) {
      setCurrentLoja(userPermissions.lojas[0]);
    }
  }, [userPermissions]);

  // useEffect para buscar as consultas quando a loja atual mudar
  useEffect(() => {
    if (currentLoja) {
      fetchConsultations();
    }
  }, [currentLoja]);

  // Função para formatar data do Firestore
  const formatFirestoreDate = (firestoreDate) => {
    if (!firestoreDate) return 'N/A';

    if (firestoreDate && typeof firestoreDate === 'object' && firestoreDate.seconds) {
      const date = new Date(firestoreDate.seconds * 1000);
      return date.toLocaleDateString('pt-BR');
    }

    return firestoreDate;
  };

  // Função para filtrar as consultas por nome ou CPF
  const handleSearch = (e) => {
    setSearchTerm(e.target.value); // Atualizar o termo de busca
    const filtered = consultations.filter(
      (consultation) =>
        consultation.nomePaciente
          .toLowerCase()
          .includes(e.target.value.toLowerCase()) ||
        consultation.cpf.includes(e.target.value)
    );
    setFilteredConsultations(filtered); // Atualizar as consultas filtradas
  };

  // Função para redirecionar para a página de adicionar consulta
  const handleAddClick = () => {
    router.push("/consultation/medical-consultation"); // Redireciona para a página de adicionar consulta
  };

  // Função para deletar uma consulta
  const handleDelete = async (id) => {
    if (!currentLoja) return;

    const confirmDelete = window.confirm(
      "Tem certeza de que deseja deletar esta consulta?"
    );
    if (confirmDelete) {
      try {
        await deleteDoc(doc(db, `lojas/${currentLoja}/consultas`, id));
        setConsultations(
          consultations.filter((consultation) => consultation.id !== id)
        );
        setFilteredConsultations(
          filteredConsultations.filter((consultation) => consultation.id !== id)
        );
        console.log("Consulta removida:", id);
      } catch (error) {
        console.error("Erro ao remover consulta:", error);
      }
    }
  };

  // Função para abrir o modal
  const openModal = (consultation) => {
    setSelectedConsultation(consultation);
    setIsModalOpen(true);
  };

  // Adicionar a função openEditModal que está faltando
  const openEditModal = () => {
    if (selectedForDeletion.length === 1) {
      // Encontrar a consulta selecionada
      const consultationToEdit = consultations.find(
        (consultation) => consultation.id === selectedForDeletion[0]
      );
      setSelectedConsultation(consultationToEdit);
      setIsModalOpen(true);
    }
  };

  // Função para fechar o modal
  const closeModal = () => {
    setSelectedConsultation(null);
    setIsModalOpen(false);
  };

  // Função para gerar PDF
  const generatePDF = () => {
    if (!selectedConsultation) return;

    const doc = new jsPDF();
    doc.text(`Detalhes da Consulta`, 10, 10);
    doc.text(`Paciente: ${selectedConsultation.nomePaciente || 'N/A'}`, 10, 20);
    doc.text(`CPF: ${selectedConsultation.cpf || 'N/A'}`, 10, 30);
    doc.text(`Data: ${formatFirestoreDate(selectedConsultation.data)}`, 10, 40);
    doc.text(`Hora: ${selectedConsultation.hora || 'N/A'}`, 10, 50);
    doc.text(`Clínica: ${selectedConsultation.clinica || 'N/A'}`, 10, 60);
    doc.text(`Valor: R$ ${parseFloat(selectedConsultation.valorConsulta || 0).toFixed(2)}`, 10, 70);
    doc.text(`Status: ${selectedConsultation.status || 'N/A'}`, 10, 80);

    doc.save(`consulta_${selectedConsultation.id}.pdf`);
  };

  // Função para lidar com a impressão
  const handlePrint = () => {
    window.print();
  };

  // Função para marcar ou desmarcar consulta para exclusão
  const toggleDeletion = (e, consultationId) => {
    e.stopPropagation();
    setSelectedForDeletion(prev => {
      if (prev.includes(consultationId)) {
        return prev.filter(id => id !== consultationId);
      } else {
        return [...prev, consultationId];
      }
    });
  };

  // Função para excluir as consultas selecionadas
  const handleDeleteSelected = async () => {
    if (!currentLoja || selectedForDeletion.length === 0) {
      alert('Selecione pelo menos uma consulta para excluir.');
      return;
    }

    if (confirm(`Deseja realmente excluir ${selectedForDeletion.length} consultas selecionadas?`)) {
      try {
        for (const consultationId of selectedForDeletion) {
          await deleteDoc(doc(db, `lojas/${currentLoja}/consultas`, consultationId));
        }

        await fetchConsultations(); // Recarregar as consultas após exclusão
        setSelectedForDeletion([]);
        alert('Consultas excluídas com sucesso!');
      } catch (error) {
        console.error('Erro ao excluir consultas:', error);
        alert('Erro ao excluir as consultas selecionadas.');
      }
    }
  };

  // Função para lidar com as alterações nos campos do formulário
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSelectedConsultation({
      ...selectedConsultation,
      [name]: value,
    });
  };

  // Função para abrir o modal de edição
  const handleEdit = (consultation) => {
    setSelectedConsultation(consultation); // Preencher o formulário com dados da consulta selecionada
    setIsModalOpen(false); // Fechar o modal de visualização
  };

  // Função para atualizar a consulta
  const handleUpdate = async () => {
    if (!currentLoja || !selectedConsultation?.id) return;

    try {
      const docRef = doc(db, `lojas/${currentLoja}/consultas`, selectedConsultation.id);
      await updateDoc(docRef, selectedConsultation);

      setConsultations((prevConsultations) =>
        prevConsultations.map((consultation) =>
          consultation.id === selectedConsultation.id
            ? { ...consultation, ...selectedConsultation }
            : consultation
        )
      );

      setSelectedConsultation(null);
      setIsModalOpen(false);
      await fetchConsultations(); // Recarregar as consultas após atualização
    } catch (error) {
      console.error("Erro ao atualizar consulta: ", error);
    }
  };

  // Função para ordenar consultas
  const sortConsultations = (consultationsToSort, field, direction) => {
    return [...consultationsToSort].sort((a, b) => {
      let aValue = a[field];
      let bValue = b[field];

      if (field === 'data' || field === 'dataConsulta') {
        aValue = convertToDate(aValue);
        bValue = convertToDate(bValue);
      } else if (field === 'valorConsulta') {
        aValue = parseFloat(aValue || 0);
        bValue = parseFloat(bValue || 0);
      } else {
        aValue = String(aValue || '').toLowerCase();
        bValue = String(bValue || '').toLowerCase();
      }

      if (aValue < bValue) return direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  // Função para converter diferentes formatos de data
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
    const sorted = sortConsultations(filteredConsultations, field, direction);
    setFilteredConsultations(sorted);
  };

  // Renderizar seta de ordenação
  const renderSortArrow = (field) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ?
      <span className="ml-1">↑</span> :
      <span className="ml-1">↓</span>;
  };

  // Função para filtrar consultas
  useEffect(() => {
    const filterBySearchAndDate = () => {
      let filtered = consultations;

      if (searchTerm !== '') {
        filtered = filtered.filter(
          (consultation) =>
            (consultation.nomePaciente?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
            (consultation.cpf?.toLowerCase().includes(searchTerm.toLowerCase()) || '')
        );
      }

      filtered = filtered.filter(consultation => {
        if (!consultation.data && (yearFilter !== 'Todos' || monthFilter !== 'Todos' || dayFilter !== 'Todos')) {
          return false;
        }

        if (!consultation.data) return true;

        const consultationDate = consultation.data.seconds
          ? new Date(consultation.data.seconds * 1000)
          : new Date(consultation.data);

        if (yearFilter !== 'Todos' && consultationDate.getFullYear().toString() !== yearFilter) {
          return false;
        }

        if (monthFilter !== 'Todos') {
          const monthIndex = months.indexOf(monthFilter) - 1;
          if (consultationDate.getMonth() !== monthIndex) {
            return false;
          }
        }

        if (dayFilter !== 'Todos' && consultationDate.getDate().toString() !== dayFilter) {
          return false;
        }

        return true;
      });

      filtered = sortConsultations(filtered, sortField, sortDirection);
      setFilteredConsultations(filtered);
    };

    filterBySearchAndDate();
  }, [searchTerm, consultations, sortField, sortDirection, yearFilter, monthFilter, dayFilter]);

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
              <FaTimes className="h-3 w-3" />
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

  return (
    <Layout>
      <div className="min-h-screen p-0 md:p-2 mb-20">
        <div className="w-full max-w-5xl mx-auto rounded-lg">
          <div className="mb-4">
            <h2 className="text-3xl font-bold text-[#81059e] mb-8 mt-8">
              {viewCompletedConsultations ? "CONSULTAS CONCLUÍDAS" : "CONSULTAS PENDENTES"}
            </h2>
            <div className="flex justify-start mb-8">
              <button
                onClick={() => setViewCompletedConsultations(!viewCompletedConsultations)}
                className="bg-[#81059e] text-white px-4 py-2 rounded-md hover:bg-[#690480] transition"
              >
                {viewCompletedConsultations ? "Ver Pendentes" : "Ver Concluídas"}
              </button>
            </div>
          </div>

          {/* Dashboard compacto com estatísticas */}
          <div className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              {/* Card - Total de Consultas */}
              <div className="border-2 rounded-lg p-4 border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <FaFilePdf className="h-8 w-8 text-[#81059e] bg-purple-300 p-2 rounded-2xl" />
                  <span className="text-lg font-medium text-gray-700 flex-grow ml-3">Total de Consultas</span>
                </div>
                <p className="text-2xl font-semibold text-center mt-2">{consultations.length}</p>
              </div>

              {/* Card - Valor Total */}
              <div className="border-2 rounded-lg p-4 border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <FaDollarSign className="h-8 w-8 text-[#81059e] bg-purple-300 p-2 rounded-2xl" />
                  <span className="text-lg font-medium text-gray-700 flex-grow ml-3">Valor Total</span>
                </div>
                <p className="text-2xl font-semibold text-center mt-2">
                  R$ {consultations.reduce((total, consultation) => total + parseFloat(consultation.valorConsulta || 0), 0).toFixed(2)}
                </p>
              </div>

              {/* Card - Consultas Hoje */}
              <div className="border-2 rounded-lg p-4 border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <FaClock className="h-8 w-8 text-[#81059e] bg-purple-300 p-2 rounded-2xl" />
                  <span className="text-lg font-medium text-gray-700 flex-grow ml-3">Consultas Hoje</span>
                </div>
                <p className="text-2xl font-semibold text-center mt-2">
                  {consultations.filter(consultation => {
                    const today = new Date();
                    const consultationDate = consultation.data?.seconds
                      ? new Date(consultation.data.seconds * 1000)
                      : new Date(consultation.data);
                    return consultationDate.toDateString() === today.toDateString();
                  }).length}
                </p>
              </div>

              {/* Card - Próximas 7 dias */}
              <div className="border-2 rounded-lg p-4 border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <FaExclamationTriangle className="h-8 w-8 text-[#81059e] bg-purple-300 p-2 rounded-2xl" />
                  <span className="text-lg font-medium text-gray-700 flex-grow ml-3">Próximas 7 dias</span>
                </div>
                <p className="text-2xl font-semibold text-center mt-2">
                  {consultations.filter(consultation => {
                    const now = new Date();
                    const consultationDate = consultation.data?.seconds
                      ? new Date(consultation.data.seconds * 1000)
                      : new Date(consultation.data);
                    const diffTime = consultationDate - now;
                    return consultationDate >= now && diffTime <= 7 * 24 * 60 * 60 * 1000;
                  }).length}
                </p>
              </div>
            </div>
          </div>

          {/* Barra de busca e filtros */}
          <div className="flex flex-wrap gap-2 items-center mb-4">
            <input
              type="text"
              placeholder="Busque por nome ou CPF"
              className="p-2 h-10 flex-grow min-w-[200px] border-2 border-gray-200 rounded-lg text-black"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            <div className="relative">
              <button
                data-filter-toggle="true"
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                className="p-2 h-10 border-2 border-gray-200 rounded-lg bg-white flex items-center gap-1 text-[#81059e]"
              >
                <FaFilter className="h-4 w-4" />
                <span className="hidden sm:inline">Filtrar</span>
                {(yearFilter !== 'Todos' || monthFilter !== 'Todos' || dayFilter !== 'Todos') && (
                  <span className="ml-1 bg-[#81059e] text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                    {(yearFilter !== 'Todos' ? 1 : 0) + (monthFilter !== 'Todos' ? 1 : 0) + (dayFilter !== 'Todos' ? 1 : 0)}
                  </span>
                )}
              </button>

              {showFilterDropdown && (
                <div
                  id="filter-dropdown"
                  className="fixed z-30 inset-x-4 top-24 sm:absolute sm:inset-x-auto sm:top-full sm:right-0 sm:mt-1 bg-white shadow-lg rounded-lg border p-4 w-auto sm:w-64 max-w-[calc(100vw-32px)] max-h-[80vh] overflow-y-auto"
                >
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-sm font-semibold text-gray-700">Filtros de Data</h3>
                    <button
                      onClick={() => {
                        setYearFilter('Todos');
                        setMonthFilter('Todos');
                        setDayFilter('Todos');
                      }}
                      className="text-xs text-[#81059e] hover:underline"
                    >
                      Limpar Filtros
                    </button>
                  </div>

                  <div className="space-y-3">
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
              <Link href="/consultation/medical-consultation">
                <button className="bg-green-400 text-white h-10 w-10 rounded-md flex items-center justify-center">
                  <FaPlus className="h-6 w-6" />
                </button>
              </Link>

              <button
                onClick={() => openEditModal()}
                className={`${selectedForDeletion.length !== 1 ? 'bg-blue-300' : 'bg-blue-500'} text-white h-10 w-10 rounded-md flex items-center justify-center`}
                disabled={selectedForDeletion.length !== 1}
              >
                <FaEdit className="h-6 w-6" />
              </button>

              <button
                onClick={handleDeleteSelected}
                className={`${selectedForDeletion.length === 0 ? 'bg-red-400' : 'bg-red-400'} text-white h-10 w-10 rounded-md flex items-center justify-center`}
                disabled={selectedForDeletion.length === 0}
              >
                <FaTrash className="h-6 w-6" />
              </button>
            </div>
          </div>

          <FilterActiveBadges />

          {/* Tabela de consultas */}
          {isLoading ? (
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#81059e]"></div>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="min-w-full table-auto select-none">
                <thead>
                  <tr className="bg-[#81059e] text-white">
                    <th className="px-3 py-2 w-12">
                      <span className="sr-only">Selecionar</span>
                    </th>
                    <th className="px-3 py-2 cursor-pointer whitespace-nowrap" onClick={() => handleSort('nomePaciente')}>
                      Paciente {renderSortArrow('nomePaciente')}
                    </th>
                    <th className="px-3 py-2 cursor-pointer" onClick={() => handleSort('cpf')}>
                      CPF {renderSortArrow('cpf')}
                    </th>
                    <th className="px-3 py-2 cursor-pointer" onClick={() => handleSort('valorConsulta')}>
                      Valor {renderSortArrow('valorConsulta')}
                    </th>
                    <th className="px-3 py-2 cursor-pointer whitespace-nowrap" onClick={() => handleSort('data')}>
                      Data {renderSortArrow('data')}
                    </th>
                    <th className="px-3 py-2 cursor-pointer whitespace-nowrap" onClick={() => handleSort('hora')}>
                      Hora {renderSortArrow('hora')}
                    </th>
                    <th className="px-3 py-2 cursor-pointer" onClick={() => handleSort('status')}>
                      Status {renderSortArrow('status')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredConsultations.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((consultation) => (
                    <tr
                      key={consultation.id}
                      className="text-black text-left hover:bg-gray-100 cursor-pointer"
                      onClick={() => openModal(consultation)}
                    >
                      <td className="border px-2 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={selectedForDeletion.includes(consultation.id)}
                          onChange={(e) => toggleDeletion(e, consultation.id)}
                          className="h-4 w-4 cursor-pointer"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </td>
                      <td className="border px-3 py-2 whitespace-nowrap">
                        {consultation.nomePaciente || 'N/A'}
                      </td>
                      <td className="border px-3 py-2 whitespace-nowrap">
                        {consultation.cpf || 'N/A'}
                      </td>
                      <td className="border px-3 py-2 whitespace-nowrap">
                        R$ {parseFloat(consultation.valorConsulta || 0).toFixed(2)}
                      </td>
                      <td className="border px-3 py-2 whitespace-nowrap">
                        {formatFirestoreDate(consultation.data)}
                      </td>
                      <td className="border px-3 py-2 whitespace-nowrap">
                        {consultation.hora || 'N/A'}
                      </td>
                      <td className="border px-3 py-2 whitespace-nowrap">
                        {consultation.status || 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Paginação */}
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-700">
                  Mostrando <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> a{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * itemsPerPage, filteredConsultations.length)}
                  </span>{' '}
                  de <span className="font-medium">{filteredConsultations.length}</span> registros
                </div>
                <div className="flex space-x-1">
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className={`px-3 py-1 rounded ${currentPage === 1
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : 'bg-[#81059e] text-white hover:bg-[#690480]'
                      }`}
                  >
                    &laquo;
                  </button>
                  <button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`px-3 py-1 rounded ${currentPage === 1
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : 'bg-[#81059e] text-white hover:bg-[#690480]'
                      }`}
                  >
                    &lt;
                  </button>

                  <span className="px-3 py-1 text-gray-700">
                    {currentPage} / {Math.ceil(filteredConsultations.length / itemsPerPage)}
                  </span>

                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === Math.ceil(filteredConsultations.length / itemsPerPage)}
                    className={`px-3 py-1 rounded ${currentPage === Math.ceil(filteredConsultations.length / itemsPerPage)
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : 'bg-[#81059e] text-white hover:bg-[#690480]'
                      }`}
                  >
                    &gt;
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.ceil(filteredConsultations.length / itemsPerPage))}
                    disabled={currentPage === Math.ceil(filteredConsultations.length / itemsPerPage)}
                    className={`px-3 py-1 rounded ${currentPage === Math.ceil(filteredConsultations.length / itemsPerPage)
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

          {/* Modal de Detalhamento */}
          {isModalOpen && selectedConsultation && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
              <div className="bg-white rounded-lg shadow-lg w-full max-w-md flex flex-col h-3/5 overflow-hidden">
                <div className="bg-[#81059e] text-white p-4 flex justify-between items-center">
                  <h3 className="text-xl font-bold">Detalhes da Consulta</h3>
                  <FaX
                    className="h-5 w-5 text-white cursor-pointer hover:text-gray-200"
                    onClick={closeModal}
                  />
                </div>
                <div className="space-y-3 p-4 overflow-y-auto flex-grow">
                  <p>
                    <strong>Paciente:</strong> {selectedConsultation.nomePaciente || 'N/A'}
                  </p>
                  <p>
                    <strong>CPF:</strong> {selectedConsultation.cpf || 'N/A'}
                  </p>
                  <p>
                    <strong>Valor:</strong> R$ {parseFloat(selectedConsultation.valorConsulta || 0).toFixed(2)}
                  </p>
                  <p>
                    <strong>Data:</strong> {formatFirestoreDate(selectedConsultation.data)}
                  </p>
                  <p>
                    <strong>Hora:</strong> {selectedConsultation.hora || 'N/A'}
                  </p>
                  <p>
                    <strong>Status:</strong> {selectedConsultation.status || 'N/A'}
                  </p>
                  <p>
                    <strong>Clínica:</strong> {selectedConsultation.clinica || 'N/A'}
                  </p>

                  <div className="flex justify-around mt-6">
                    <button
                      onClick={generatePDF}
                      className="bg-[#81059e] text-white px-4 py-2 rounded-md flex items-center"
                    >
                      <FaFilePdf className="h-5 w-5 mr-2" />
                      Ver PDF
                    </button>
                    <button
                      onClick={handlePrint}
                      className="bg-[#81059e] text-white px-4 py-2 rounded-md flex items-center"
                    >
                      <FaPrint className="h-5 w-5 mr-2" />
                      Imprimir
                    </button>
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

export default ListConsultation;
