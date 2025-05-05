//list-receives.js

"use client";

import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFileInvoice,
  faDollarSign,
  faClock,
  faExclamationTriangle,
  faFilter,
  faX,
  faCheck
} from '@fortawesome/free-solid-svg-icons';
import { collection, getDocs, doc, setDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
import { firestore } from '../../../../lib/firebaseConfig';
import jsPDF from 'jspdf';

// Add FilterModal component before the main component
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

export default function ListaRecebimentos() {
  const { userPermissions, userData } = useAuth();
  const [contas, setContas] = useState([]);
  const [filteredContas, setFilteredContas] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLoja, setSelectedLoja] = useState('Ambas');
  const [selectedConta, setSelectedConta] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalContas, setTotalContas] = useState(0);
  const [formaRecebimento, setFormaRecebimento] = useState('');
  const [settleMessage, setSettleMessage] = useState('');
  const [selectedForDeletion, setSelectedForDeletion] = useState([]);
  const [sortField, setSortField] = useState('dataCobranca');
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
  const [editingConta, setEditingConta] = useState(null);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [viewCompletedPayments, setViewCompletedPayments] = useState(false);
  const [completedPayments, setCompletedPayments] = useState([]);
  const [taxaJurosPadrao, setTaxaJurosPadrao] = useState(0);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isSettleMultipleModalOpen, setIsSettleMultipleModalOpen] = useState(false);
  const [formaRecebimentoMultiplo, setFormaRecebimentoMultiplo] = useState('');

  useEffect(() => {
    const fetchContas = async () => {
      try {
        setLoading(true);
        const fetchedContas = [];

        // Usar o caminho correto para lojas específicas
        if (selectedLoja !== 'Ambas') {
          // Caminho para uma loja específica
          const contasReceberDocRef = collection(firestore, `lojas/${selectedLoja}/financeiro/contas_receber/items`);
          const contasSnapshot = await getDocs(contasReceberDocRef);

          contasSnapshot.docs.forEach((docItem) => {
            const contaData = docItem.data();
            fetchedContas.push({
              id: docItem.id,
              ...contaData,
              loja: selectedLoja // Garantir que a loja seja definida corretamente
            });
          });
        } else {
          // Se for "Ambas", buscar de todas as lojas que o usuário tem acesso
          const lojas = userPermissions?.lojas || [];

          for (const loja of lojas) {
            const contasReceberDocRef = collection(firestore, `lojas/${loja}/financeiro/contas_receber/items`);
            const contasSnapshot = await getDocs(contasReceberDocRef);

            contasSnapshot.docs.forEach((docItem) => {
              const contaData = docItem.data();
              fetchedContas.push({
                id: docItem.id,
                ...contaData,
                loja: loja
              });
            });
          }
        }

        // Aplicar ordenação inicial
        const sortedContas = sortContas(fetchedContas, sortField, sortDirection);
        setContas(sortedContas);
        setFilteredContas(sortedContas);
        setTotalContas(sortedContas.length); // Atualizar o contador total de contas
        setLoading(false);
      } catch (err) {
        console.error('Erro ao carregar as contas:', err);
        setError(`Erro ao carregar os dados das contas: ${err.message}`);
        setLoading(false);
      }
    };

    fetchContas();
  }, [selectedLoja, userPermissions]);

  const fetchCompletedPayments = async () => {
    try {
      setLoading(true);
      const fetchedCompletedPayments = [];

      // Se for "Ambas", buscar de todas as lojas que o usuário tem acesso
      if (selectedLoja === 'Ambas') {
        const lojas = userPermissions?.lojas || [];

        for (const loja of lojas) {
          const completedPaymentsRef = collection(firestore, `lojas/${loja}/financeiro/contas_receber_concluidas/items`);
          const completedSnapshot = await getDocs(completedPaymentsRef);

          completedSnapshot.docs.forEach((docItem) => {
            const paymentData = docItem.data();
            fetchedCompletedPayments.push({
              id: docItem.id,
              ...paymentData,
              loja: loja
            });
          });
        }
      } else {
        // Buscar de uma loja específica
        const completedPaymentsRef = collection(
          firestore,
          `lojas/${selectedLoja}/financeiro/contas_receber_concluidas/items`
        );
        const completedSnapshot = await getDocs(completedPaymentsRef);

        completedSnapshot.docs.forEach((docItem) => {
          const paymentData = docItem.data();
          fetchedCompletedPayments.push({
            id: docItem.id,
            ...paymentData,
            loja: selectedLoja
          });
        });
      }

      setCompletedPayments(sortContas(fetchedCompletedPayments, sortField, sortDirection));
      setLoading(false);
    } catch (err) {
      console.error('Erro ao carregar recebimentos concluídos:', err);
      setError(`Erro ao carregar recebimentos concluídos: ${err.message}`);
      setLoading(false);
    }
  };

  // Extrair anos disponíveis dos dados
  useEffect(() => {
    if (contas.length > 0) {
      const years = ['Todos'];
      contas.forEach(conta => {
        if (conta.dataCobranca) {
          const date = conta.dataCobranca.seconds
            ? new Date(conta.dataCobranca.seconds * 1000)
            : new Date(conta.dataCobranca);
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
  }, [contas]);


  // Função para filtrar contas com base na busca e loja
  useEffect(() => {
    const filterBySearchAndLojaAndDate = () => {
      let filtered = contas;

      // Filtro por loja
      if (selectedLoja !== 'Ambas') {
        filtered = filtered.filter((conta) => conta.loja === selectedLoja);
      }

      // Filtro por busca
      if (searchQuery !== '') {
        filtered = filtered.filter(
          (conta) =>
            (conta.numeroDocumento?.toLowerCase().includes(searchQuery.toLowerCase()) || '') ||
            (conta.cliente?.toLowerCase().includes(searchQuery.toLowerCase()) || '')
        );
      }

      // Filtro por data
      filtered = filtered.filter(conta => {
        // Se não tem data de cobrança e qualquer filtro está ativo, ocultar
        if (!conta.dataCobranca && (yearFilter !== 'Todos' || monthFilter !== 'Todos' || dayFilter !== 'Todos')) {
          return false;
        }

        if (!conta.dataCobranca) return true;

        const contaDate = conta.dataCobranca.seconds
          ? new Date(conta.dataCobranca.seconds * 1000)
          : new Date(conta.dataCobranca);

        // Filtrar por ano se não for "Todos"
        if (yearFilter !== 'Todos' && contaDate.getFullYear().toString() !== yearFilter) {
          return false;
        }

        // Filtrar por mês se não for "Todos"
        if (monthFilter !== 'Todos') {
          const monthIndex = months.indexOf(monthFilter) - 1;
          if (contaDate.getMonth() !== monthIndex) {
            return false;
          }
        }

        // Filtrar por dia se não for "Todos"
        if (dayFilter !== 'Todos' && contaDate.getDate().toString() !== dayFilter) {
          return false;
        }

        return true;
      });

      // Aplicar ordenação
      filtered = sortContas(filtered, sortField, sortDirection);
      setFilteredContas(filtered);
    };

    filterBySearchAndLojaAndDate();
  }, [searchQuery, selectedLoja, contas, sortField, sortDirection, yearFilter, monthFilter, dayFilter]);

  // Função para ordenar contas
  const sortContas = (contasToSort, field, direction) => {
    return [...contasToSort].sort((a, b) => {
      let aValue = a[field];
      let bValue = b[field];

      // Tratar datas (objetos Firestore Timestamp ou strings de data)
      if (field === 'dataRegistro' || field === 'dataCobranca' || field === 'dataPagamento') {
        aValue = convertToDate(aValue);
        bValue = convertToDate(bValue);
      }
      // Tratar números
      else if (field === 'valor' || field === 'valorPago' || field === 'juros') {
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

    // Reordenar as contas filtradas
    const sorted = sortContas(filteredContas, field, direction);
    setFilteredContas(sorted);
  };

  // Renderizar seta de ordenação - apenas quando a coluna estiver selecionada
  const renderSortArrow = (field) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ?
      <span className="ml-1">↑</span> :
      <span className="ml-1">↓</span>;
  };

  const getStatusColor = (dataCobranca) => {
    if (!dataCobranca) return 'bg-gray-200 text-gray-800';

    const now = new Date();
    // Se for um timestamp do Firestore
    const dueDate = dataCobranca.seconds ?
      new Date(dataCobranca.seconds * 1000) :
      new Date(dataCobranca);

    if (dueDate < now) return 'bg-red-200 text-red-800'; // Vencido
    if (dueDate - now <= 7 * 24 * 60 * 60 * 1000) return 'bg-yellow-200 text-yellow-800'; // Próximo
    return 'bg-green-200 text-green-800'; // Longe de vencer
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

  // Função para abrir o modal e definir a conta selecionada
  const openModal = (conta) => {
    setSelectedConta(conta);
    setIsModalOpen(true);
    setFormaRecebimento('');
    setSettleMessage('');
  };

  // Função para fechar o modal
  const closeModal = () => {
    setSelectedConta(null);
    setIsModalOpen(false);
  };

  // Função para gerar PDF
  const generatePDF = () => {
    if (!selectedConta) return;

    const doc = new jsPDF();
    doc.text(`Detalhes da Conta a Receber`, 10, 10);
    doc.text(`Código: ${selectedConta.numeroDocumento || 'N/A'}`, 10, 20);
    doc.text(`Cliente: ${selectedConta.cliente || 'N/A'}`, 10, 30);
    doc.text(`Valor: R$ ${parseFloat(selectedConta.valor || 0).toFixed(2)}`, 10, 40);
    doc.text(`Data de Registro: ${formatFirestoreDate(selectedConta.dataRegistro)}`, 10, 50);
    doc.text(`Data de Cobrança: ${formatFirestoreDate(selectedConta.dataCobranca)}`, 10, 60);
    doc.text(`Loja: ${selectedConta.loja || 'N/A'}`, 10, 70);

    // Adicionar campos adicionais
    if (selectedConta.dataPagamento) {
      doc.text(`Data de Pagamento: ${formatFirestoreDate(selectedConta.dataPagamento)}`, 10, 80);
    }
    if (selectedConta.origem) {
      doc.text(`Origem: ${selectedConta.origem || 'N/A'}`, 10, 90);
    }
    if (selectedConta.parcela) {
      doc.text(`Parcela: ${selectedConta.parcela || 'N/A'}`, 10, 100);
    }
    if (selectedConta.juros) {
      doc.text(`Juros: R$ ${parseFloat(selectedConta.juros || 0).toFixed(2)}`, 10, 110);
    }
    if (selectedConta.valorPago) {
      doc.text(`Total Pago: R$ ${parseFloat(selectedConta.valorPago || 0).toFixed(2)}`, 10, 120);
    }
    if (selectedConta.observacoes) {
      doc.text(`Observações: ${selectedConta.observacoes}`, 10, 130);
    }

    doc.save(`Conta_${selectedConta.numeroDocumento || selectedConta.id}.pdf`);
  };

  // Função para lidar com a impressão
  const handlePrint = () => {
    window.print();
  };

  // Função para marcar ou desmarcar conta para exclusão
  const toggleDeletion = (e, contaId) => {
    e.stopPropagation(); // Evitar abrir o modal

    setSelectedForDeletion(prev => {
      if (prev.includes(contaId)) {
        return prev.filter(id => id !== contaId);
      } else {
        return [...prev, contaId];
      }
    });
  };

  // Função para excluir as contas selecionadas
  const handleDeleteSelected = async () => {
    if (selectedForDeletion.length === 0) {
      alert('Selecione pelo menos uma conta para excluir.');
      return;
    }

    if (confirm(`Deseja realmente excluir ${selectedForDeletion.length} contas selecionadas?`)) {
      try {
        for (const contaId of selectedForDeletion) {
          // Encontrar a loja da conta
          const conta = contas.find(c => c.id === contaId);
          if (conta && conta.loja) {
            // Excluir a conta
            const contaRef = doc(firestore, `lojas/${conta.loja}/financeiro/contas_receber/items`, contaId);
            await deleteDoc(contaRef);
          }
        }

        // Atualizar as listas de contas
        const updatedContas = contas.filter(conta => !selectedForDeletion.includes(conta.id));
        setContas(updatedContas);
        setFilteredContas(updatedContas.filter(c =>
          (selectedLoja === 'Ambas' || c.loja === selectedLoja) &&
          (!searchQuery ||
            c.numeroDocumento?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.cliente?.toLowerCase().includes(searchQuery.toLowerCase()))
        ));
        setTotalContas(updatedContas.length);
        setSelectedForDeletion([]);

        alert('Contas excluídas com sucesso!');
      } catch (error) {
        console.error('Erro ao excluir contas:', error);
        alert('Erro ao excluir as contas selecionadas.');
      }
    }
  };

  //Função Editar

  const openEditModal = () => {
    if (selectedForDeletion.length !== 1) return;

    // Encontrar a conta selecionada
    const contaToEdit = contas.find(conta => conta.id === selectedForDeletion[0]);

    if (contaToEdit) {
      setEditingConta({ ...contaToEdit });
      setIsEditModalOpen(true);
    }
  };

  const handleSaveEdit = async () => {
    try {
      // Referência ao documento
      const contaRef = doc(firestore, `lojas/${editingConta.loja}/financeiro/contas_receber/items`, editingConta.id);

      // Salvar no Firestore
      await setDoc(contaRef, editingConta, { merge: true });

      // Atualizar estados locais
      setContas(prevContas =>
        prevContas.map(conta => conta.id === editingConta.id ? editingConta : conta)
      );

      setFilteredContas(prevFiltered =>
        prevFiltered.map(conta => conta.id === editingConta.id ? editingConta : conta)
      );

      // Limpar seleção e fechar modal
      setSelectedForDeletion([]);
      setIsEditModalOpen(false);

      alert('Conta atualizada com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar conta:', error);
      alert('Erro ao atualizar a conta.');
    }
  };

  // Função para quitar o recebimento
  const handleSettlePayment = async () => {
    if (!formaRecebimento) {
      alert('Por favor, selecione a forma de recebimento.');
      return;
    }

    try {
      // Preparar dados da conta concluída com informações adicionais
      const completedAccountData = {
        ...selectedConta,
        dataPagamento: new Date(),
        formaPagamento: formaRecebimento,
        statusPagamento: 'Concluído'
      };

      // Adicionar à coleção de contas concluídas
      const completedAccountRef = doc(
        collection(firestore, `lojas/${selectedConta.loja}/financeiro/contas_receber_concluidas/items`)
      );
      await setDoc(completedAccountRef, completedAccountData);

      // Preparar descrição personalizada
      const descricao = `Recebimento da conta ${selectedConta.numeroDocumento || selectedConta.id} via ${formaRecebimento}`;

      // Preparar dados para o cashflow
      const cashflowData = {
        nome: selectedConta.cliente || 'Cliente não especificado',
        formaPagamento: formaRecebimento,
        data: new Date(),
        valorFinal: parseFloat(selectedConta.valor || 0), // Valor positivo (receita)
        descricao: descricao,
        type: 'receita'
      };

      // Adicionar ao 'cashflow'
      await setDoc(doc(collection(firestore, 'cashflow')), cashflowData);

      // Preparar dados para o caixa do dia
      const loja = selectedConta.loja || 'loja1'; // Padrão para 'loja1' se não especificada
      const dataAtual = new Date();
      const dataFormatada = dataAtual.toLocaleDateString('pt-BR').replace(/\//g, '-');

      const caixaRef = collection(
        firestore,
        `${loja}/finances/caixas/${dataFormatada}/transactions`
      );

      const caixaData = {
        nome: selectedConta.cliente || 'Cliente não especificado',
        valorFinal: parseFloat(selectedConta.valor || 0), // Valor positivo (receita)
        data: dataAtual,
        descricao: descricao,
        type: 'receita',
        formaPagamento: formaRecebimento,
      };

      // Adicionar ao caixa do dia
      await setDoc(doc(caixaRef), caixaData);

      // Remover a conta da coleção 'contas_receber/items'
      const contaRef = doc(firestore, `lojas/${selectedConta.loja}/financeiro/contas_receber/items`, selectedConta.id);
      await deleteDoc(contaRef);

      // Atualizar o estado local para remover a conta quitada
      setContas((prevContas) => prevContas.filter((conta) => conta.id !== selectedConta.id));
      setFilteredContas((prevContas) => prevContas.filter((conta) => conta.id !== selectedConta.id));
      setTotalContas(prevState => prevState - 1); // Decrementar o contador

      // Se estiver visualizando contas concluídas, atualizar a lista
      if (viewCompletedPayments) {
        fetchCompletedPayments();
      }

      setSettleMessage('Recebimento registrado com sucesso!');
      setTimeout(() => {
        setSettleMessage('');
        closeModal();
      }, 2000);
    } catch (error) {
      console.error('Erro ao registrar recebimento:', error);
      alert('Erro ao registrar recebimento.');
    }
  };

  useEffect(() => {
    if (viewCompletedPayments) {
      fetchCompletedPayments();
    } else {
      const fetchContas = async () => {
        // ... seu código existente para buscar contas pendentes ...
      };
      fetchContas();
    }
  }, [viewCompletedPayments, selectedLoja, userPermissions]);



  // Calcular contas para a página atual
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentContas = filteredContas.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredContas.length / itemsPerPage);

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
      // Exibir o nome do mês em vez do índice
      activeFilters.push({ type: 'Mês', value: monthFilter });
    }

    if (dayFilter !== 'Todos') {
      activeFilters.push({ type: 'Dia', value: dayFilter });
    }

    if (activeFilters.length === 0) return null;

    const handleRemoveFilter = (filterType) => {
      switch (filterType) {
        case 'Ano':
          setYearFilter('Todos');
          break;
        case 'Mês':
          setMonthFilter('Todos');
          break;
        case 'Dia':
          setDayFilter('Todos');
          break;
        default:
          break;
      }
    };

    const handleClearAll = () => {
      setYearFilter('Todos');
      setMonthFilter('Todos');
      setDayFilter('Todos');
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

  useEffect(() => {
    const fetchTaxaJurosPadrao = async () => {
      try {
        const configDoc = await getDoc(doc(firestore, 'configuracoes', 'financeiro'));
        if (configDoc.exists()) {
          const taxa = configDoc.data().taxaJurosPadrao || 0;
          setTaxaJurosPadrao(taxa);
        }
      } catch (error) {
        console.error("Erro ao buscar taxa de juros padrão:", error);
      }
    };

    fetchTaxaJurosPadrao();
  }, []);

  // Função para calcular juros
  const calcularJuros = (conta) => {
    if (conta.dispensarJuros || !taxaJurosPadrao) return 0;
    
    const dataCobranca = conta.dataCobranca?.seconds
      ? new Date(conta.dataCobranca.seconds * 1000)
      : new Date(conta.dataCobranca);
    
    const hoje = new Date();
    const diasAtraso = Math.max(0, Math.floor((hoje - dataCobranca) / (1000 * 60 * 60 * 24)));
    
    const taxaDiaria = taxaJurosPadrao / 30; // Taxa mensal dividida por 30 dias
    const juros = conta.valor * (taxaDiaria / 100) * diasAtraso;
    
    return juros;
  };

  // Modificar a função que renderiza as contas para incluir os juros calculados
  const renderContas = () => {
    return currentContas.map((conta) => {
      const jurosCalculados = calcularJuros(conta);
      const valorTotal = conta.valor + jurosCalculados;

      return (
        <tr
          key={conta.id}
          className="text-black text-left hover:bg-gray-100 cursor-pointer"
        >
          <td className="border px-2 py-2 text-center">
            <input
              type="checkbox"
              checked={selectedForDeletion.includes(conta.id)}
              onChange={(e) => toggleDeletion(e, conta.id)}
              className="h-4 w-4 cursor-pointer"
              onClick={(e) => e.stopPropagation()}
            />
          </td>
          <td className="border px-3 py-2 whitespace-nowrap" onClick={() => openModal(conta)}>
            {conta.numeroDocumento || 'N/A'}
          </td>
          <td className="border px-4 py-2 max-w-[300px] truncate" onClick={() => openModal(conta)}>
            {typeof conta.cliente === 'object' ? conta.cliente.nome || 'N/A' : conta.cliente || 'N/A'}
          </td>
          <td className="border px-3 py-2 whitespace-nowrap" onClick={() => openModal(conta)}>
            R$ {parseFloat(conta.valor || 0).toFixed(2)}
          </td>
          <td className="border px-3 py-2 whitespace-nowrap" onClick={() => openModal(conta)}>
            {formatFirestoreDate(conta.dataRegistro)}
          </td>
          <td className={`border px-3 py-2 whitespace-nowrap ${getStatusColor(conta.dataCobranca)}`} onClick={() => openModal(conta)}>
            {formatFirestoreDate(conta.dataCobranca)}
          </td>
          <td className="border px-3 py-2 whitespace-nowrap" onClick={() => openModal(conta)}>
            R$ {parseFloat(jurosCalculados || 0).toFixed(2)}
          </td>
          <td className="border px-3 py-2 whitespace-nowrap" onClick={() => openModal(conta)}>
            R$ {parseFloat(valorTotal || 0).toFixed(2)}
          </td>
        </tr>
      );
    });
  };

  // Add this new function after handleSettlePayment
  const handleSettleMultiplePayments = async () => {
    if (!formaRecebimentoMultiplo) {
      alert('Por favor, selecione a forma de recebimento.');
      return;
    }

    if (selectedForDeletion.length === 0) {
      alert('Por favor, selecione pelo menos uma conta para quitar.');
      return;
    }

    // Add confirmation alert
    if (!confirm(`Deseja realmente quitar ${selectedForDeletion.length} conta(s) selecionada(s)?`)) {
      return;
    }

    try {
      const contasToSettle = contas.filter(conta => selectedForDeletion.includes(conta.id));
      let successCount = 0;
      let errorCount = 0;

      for (const conta of contasToSettle) {
        try {
          // Preparar dados da conta concluída
          const completedAccountData = {
            ...conta,
            dataPagamento: new Date(),
            formaPagamento: formaRecebimentoMultiplo,
            statusPagamento: 'Concluído'
          };

          // Adicionar à coleção de contas concluídas
          const completedAccountRef = doc(
            collection(firestore, `lojas/${conta.loja}/financeiro/contas_receber_concluidas/items`)
          );
          await setDoc(completedAccountRef, completedAccountData);

          // Preparar descrição personalizada
          const descricao = `Recebimento da conta ${conta.numeroDocumento || conta.id} via ${formaRecebimentoMultiplo}`;

          // Preparar dados para o cashflow
          const cashflowData = {
            nome: conta.cliente || 'Cliente não especificado',
            formaPagamento: formaRecebimentoMultiplo,
            data: new Date(),
            valorFinal: parseFloat(conta.valor || 0),
            descricao: descricao,
            type: 'receita'
          };

          // Adicionar ao 'cashflow'
          await setDoc(doc(collection(firestore, 'cashflow')), cashflowData);

          // Preparar dados para o caixa do dia
          const loja = conta.loja || 'loja1';
          const dataAtual = new Date();
          const dataFormatada = dataAtual.toLocaleDateString('pt-BR').replace(/\//g, '-');

          const caixaRef = collection(
            firestore,
            `${loja}/finances/caixas/${dataFormatada}/transactions`
          );

          const caixaData = {
            nome: conta.cliente || 'Cliente não especificado',
            valorFinal: parseFloat(conta.valor || 0),
            data: dataAtual,
            descricao: descricao,
            type: 'receita',
            formaPagamento: formaRecebimentoMultiplo,
          };

          // Adicionar ao caixa do dia
          await setDoc(doc(caixaRef), caixaData);

          // Remover a conta da coleção 'contas_receber/items'
          const contaRef = doc(firestore, `lojas/${conta.loja}/financeiro/contas_receber/items`, conta.id);
          await deleteDoc(contaRef);

          successCount++;
        } catch (error) {
          console.error(`Erro ao quitar conta ${conta.id}:`, error);
          errorCount++;
        }
      }

      // Atualizar o estado local
      setContas((prevContas) => prevContas.filter((conta) => !selectedForDeletion.includes(conta.id)));
      setFilteredContas((prevContas) => prevContas.filter((conta) => !selectedForDeletion.includes(conta.id)));
      setTotalContas(prevState => prevState - successCount);
      setSelectedForDeletion([]);
      setIsSettleMultipleModalOpen(false);
      setFormaRecebimentoMultiplo('');

      // Mostrar mensagem de resultado
      if (successCount > 0) {
        alert(`${successCount} conta(s) quitada(s) com sucesso!${errorCount > 0 ? `\n${errorCount} conta(s) com erro.` : ''}`);
      } else {
        alert('Nenhuma conta foi quitada. Por favor, tente novamente.');
      }

    } catch (error) {
      console.error('Erro ao quitar múltiplas contas:', error);
      alert('Erro ao quitar as contas selecionadas.');
    }
  };

  return (
    <Layout>
      <div className="min-h-screen p-0 md:p-2 mb-20">
        <div className="w-full max-w-5xl mx-auto rounded-lg">
          <div className="mb-4">
            <h2 className="text-3xl font-bold text-[#81059e] mb-8 mt-8">
              {viewCompletedPayments ? "RECEBIMENTOS CONCLUÍDOS" : "RECEBIMENTOS PENDENTES"}
            </h2>
            <div className="flex justify-start mb-8">
              <button
                onClick={() => setViewCompletedPayments(!viewCompletedPayments)}
                className="bg-[#81059e] text-white px-4 py-2 rounded-md hover:bg-[#690480] transition"
              >
                {viewCompletedPayments ? "Ver Pendentes" : "Ver Concluídos"}
              </button>
            </div>
          </div>




          {/* Dashboard compacto com estatísticas essenciais */}
          <div className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              {/* Card - Contas a Receber */}
              <div className="border-2 rounded-lg p-4 border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <FontAwesomeIcon
                    icon={faFileInvoice}
                    className="h-8 w-8 text-[#81059e] bg-purple-300 p-2 rounded-2xl"
                  />
                  <span className="text-lg font-medium text-gray-700 flex-grow ml-3">Contas a Receber</span>
                </div>
                <p className="text-2xl font-semibold text-center mt-2">{totalContas}</p>
              </div>

              {/* Card - Valor Total */}
              <div className="border-2 rounded-lg p-4 border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <FontAwesomeIcon
                    icon={faDollarSign}
                    className="h-8 w-8 text-[#81059e] bg-purple-300 p-2 rounded-2xl"
                  />
                  <span className="text-lg font-medium text-gray-700 flex-grow ml-3">Valor Total</span>
                </div>
                <p className="text-2xl font-semibold text-center mt-2">
                  R$ {contas.reduce((total, conta) => total + parseFloat(conta.valor || 0), 0).toFixed(2)}
                </p>
              </div>

              {/* Card - Vencidas */}
              <div className="border-2 rounded-lg p-4 border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <FontAwesomeIcon
                    icon={faClock}
                    className="h-8 w-8 text-[#81059e] bg-purple-300 p-2 rounded-2xl"
                  />
                  <span className="text-lg font-medium text-gray-700 flex-grow ml-3">Vencidas</span>
                </div>
                <p className="text-2xl font-semibold text-center mt-2">
                  {contas.filter(conta => {
                    const now = new Date();
                    const dueDate = conta.dataCobranca?.seconds
                      ? new Date(conta.dataCobranca.seconds * 1000)
                      : new Date(conta.dataCobranca);
                    return dueDate < now;
                  }).length}
                </p>
                <p className="text-sm text-gray-500 text-center mt-1">
                  Estimativa de Perda:
                  <span className="whitespace-nowrap"> R$ {contas.filter(conta => {
                    const now = new Date();
                    const dueDate = conta.dataCobranca?.seconds
                      ? new Date(conta.dataCobranca.seconds * 1000)
                      : new Date(conta.dataCobranca);
                    return dueDate < now;
                  }).reduce((total, conta) => total + parseFloat(conta.valor || 0), 0).toFixed(2)}</span>
                </p>
              </div>

              {/* Card - Próximos 7 dias */}
              <div className="border-2 rounded-lg p-4 border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <FontAwesomeIcon
                    icon={faExclamationTriangle}
                    className="h-8 w-8 text-[#81059e] bg-purple-300 p-2 rounded-2xl"
                  />
                  <span className="text-lg font-medium text-gray-700 flex-grow ml-3">Próximos 7 dias</span>
                </div>
                <p className="text-2xl font-semibold text-center mt-2">
                  {contas.filter(conta => {
                    const now = new Date();
                    const dueDate = conta.dataCobranca?.seconds
                      ? new Date(conta.dataCobranca.seconds * 1000)
                      : new Date(conta.dataCobranca);
                    const diffTime = dueDate - now;
                    return dueDate >= now && diffTime <= 7 * 24 * 60 * 60 * 1000;
                  }).length}
                </p>
                <p className="text-sm text-gray-500 text-center mt-1">
                  <span className="whitespace-nowrap">R$ {contas.filter(conta => {
                    const now = new Date();
                    const dueDate = conta.dataCobranca?.seconds
                      ? new Date(conta.dataCobranca.seconds * 1000)
                      : new Date(conta.dataCobranca);
                    const diffTime = dueDate - now;
                    return dueDate >= now && diffTime <= 7 * 24 * 60 * 60 * 1000;
                  }).reduce((total, conta) => total + parseFloat(conta.valor || 0), 0).toFixed(2)}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Barra de busca e filtros com dropdown */}
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

            {/* Dropdown de filtros de data */}
            <div className="relative">
              <button
                onClick={() => setIsFilterModalOpen(true)}
                className="p-2 h-10 border-2 border-gray-200 rounded-lg bg-white flex items-center gap-1 text-[#81059e] hover:border-[#81059e] transition-colors"
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
              <Link href="/finance/add-receive">
                <button className="bg-green-400 text-white h-10 w-10 rounded-md flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </Link>


              {/* Botão Editar - aparece apenas quando há contas selecionadas */}
              <button
                onClick={() => openEditModal()}
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

              {/* Add this after the filter button in the buttons section */}
              <button
                onClick={() => setIsSettleMultipleModalOpen(true)}
                disabled={selectedForDeletion.length === 0}
                className={`${
                  selectedForDeletion.length === 0 
                    ? 'bg-green-300' 
                    : 'bg-green-500 hover:bg-green-600'
                } text-white h-10 px-4 rounded-md flex items-center justify-center transition-colors`}
              >
                <FontAwesomeIcon icon={faCheck} className="h-5 w-5 mr-2" />
                <span className="hidden sm:inline">Quitar Selecionadas</span>
              </button>

            </div>
          </div>

          <FilterActiveBadges />



          {/* Tabela de contas */}
          {loading ? (
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#81059e]"></div>
          ) : error ? (
            <p>{error}</p>
          ) : (
            <div className="w-full overflow-x-auto">
              {viewCompletedPayments ? (
                // Tabela de recebimentos concluídos
                completedPayments.length === 0 ? (
                  <p>Nenhum recebimento concluído encontrado.</p>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="min-w-full table-auto select-none">
                        <thead>
                          <tr className="bg-[#81059e] text-white">
                            <th className="px-3 py-2 w-12">
                              <span className="sr-only">Selecionar</span>
                            </th>
                            <th className="px-3 py-2 cursor-pointer whitespace-nowrap" onClick={() => handleSort('numeroDocumento')}>
                              Código {renderSortArrow('numeroDocumento')}
                            </th>
                            <th className="px-3 py-2 cursor-pointer" onClick={() => handleSort('cliente')}>
                              Cliente {renderSortArrow('cliente')}
                            </th>
                            <th className="px-3 py-2 cursor-pointer" onClick={() => handleSort('valor')}>
                              Valor {renderSortArrow('valor')}
                            </th>
                            <th className="px-3 py-2 cursor-pointer whitespace-nowrap" onClick={() => handleSort('dataCobranca')}>
                              Data Cobrança {renderSortArrow('dataCobranca')}
                            </th>
                            <th className="px-3 py-2 cursor-pointer whitespace-nowrap" onClick={() => handleSort('dataPagamento')}>
                              Data Pagamento {renderSortArrow('dataPagamento')}
                            </th>
                            <th className="px-3 py-2 cursor-pointer whitespace-nowrap" onClick={() => handleSort('formaPagamento')}>
                              Forma Pagamento {renderSortArrow('formaPagamento')}
                            </th>
                            <th className="px-3 py-2">Loja</th>
                          </tr>
                        </thead>
                        <tbody>
                          {renderContas()}
                        </tbody>
                      </table>
                    </div>

                    {/* Paginação para contas concluídas */}
                    <div className="flex items-center justify-between mt-4">
                      <div className="text-sm text-gray-700">
                        Mostrando <span className="font-medium">{indexOfFirstItem + 1}</span> a{' '}
                        <span className="font-medium">
                          {Math.min(indexOfLastItem, completedPayments.length)}
                        </span>{' '}
                        de <span className="font-medium">{completedPayments.length}</span> registros
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
                          {currentPage} / {Math.ceil(completedPayments.length / itemsPerPage)}
                        </span>

                        <button
                          onClick={() => goToPage(currentPage + 1)}
                          disabled={currentPage === Math.ceil(completedPayments.length / itemsPerPage)}
                          className={`px-3 py-1 rounded ${currentPage === Math.ceil(completedPayments.length / itemsPerPage)
                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                            : 'bg-[#81059e] text-white hover:bg-[#690480]'
                            }`}
                        >
                          &gt;
                        </button>
                        <button
                          onClick={() => goToPage(Math.ceil(completedPayments.length / itemsPerPage))}
                          disabled={currentPage === Math.ceil(completedPayments.length / itemsPerPage)}
                          className={`px-3 py-1 rounded ${currentPage === Math.ceil(completedPayments.length / itemsPerPage)
                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                            : 'bg-[#81059e] text-white hover:bg-[#690480]'
                            }`}
                        >
                          &raquo;
                        </button>
                      </div>
                    </div>
                  </>
                )
              ) : (
                // Tabela de recebimentos pendentes
                filteredContas.length === 0 ? (
                  <p>Nenhuma conta pendente encontrada.</p>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="min-w-full table-auto select-none">
                        <thead>
                          <tr className="bg-[#81059e] text-white">
                            <th className="px-3 py-2 w-12">
                              <span className="sr-only">Selecionar</span>
                            </th>
                            <th className="px-3 py-2 cursor-pointer whitespace-nowrap" onClick={() => handleSort('numeroDocumento')}>
                              Código {renderSortArrow('numeroDocumento')}
                            </th>
                            <th className="px-3 py-2 cursor-pointer" onClick={() => handleSort('cliente')}>
                              Cliente {renderSortArrow('cliente')}
                            </th>
                            <th className="px-3 py-2 cursor-pointer" onClick={() => handleSort('valor')}>
                              Valor {renderSortArrow('valor')}
                            </th>
                            <th className="px-3 py-2 cursor-pointer whitespace-nowrap" onClick={() => handleSort('dataRegistro')}>
                              Registro {renderSortArrow('dataRegistro')}
                            </th>
                            <th className="px-3 py-2 cursor-pointer whitespace-nowrap" onClick={() => handleSort('dataCobranca')}>
                              Cobrança {renderSortArrow('dataCobranca')}
                            </th>
                            <th className="px-3 py-2 cursor-pointer whitespace-nowrap">
                              Juros
                            </th>
                            <th className="px-3 py-2 cursor-pointer whitespace-nowrap">
                              Total
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {renderContas()}
                        </tbody>
                      </table>
                    </div>

                    {/* Paginação para contas pendentes */}
                    <div className="flex items-center justify-between mt-4">
                      <div className="text-sm text-gray-700">
                        Mostrando <span className="font-medium">{indexOfFirstItem + 1}</span> a{' '}
                        <span className="font-medium">
                          {Math.min(indexOfLastItem, filteredContas.length)}
                        </span>{' '}
                        de <span className="font-medium">{filteredContas.length}</span> registros
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
                )
              )}
            </div>
          )}

          {/* Modal de Detalhamento de Contas */}
          {isModalOpen && selectedConta && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
              <div className="bg-white rounded-lg shadow-lg w-full max-w-md flex flex-col h-3/5 overflow-hidden">
                <div className="bg-[#81059e] text-white p-4 flex justify-between items-center">
                  <h3 className="text-xl font-bold">
                    {viewCompletedPayments ? "Detalhamento de Recebimento Concluído" : "Detalhamento de Conta a Receber"}
                  </h3>
                  <FontAwesomeIcon
                    icon={faX}
                    className="h-5 w-5 text-white cursor-pointer hover:text-gray-200"
                    onClick={closeModal}
                  />
                </div>
                <div className="space-y-3 p-4 overflow-y-auto flex-grow">
                  <p>
                    <strong>Cliente:</strong> {typeof selectedConta.cliente === 'object' ? selectedConta.cliente.nome || 'N/A' : selectedConta.cliente || 'N/A'}
                  </p>
                  <p>
                    <strong>Valor:</strong> R${' '}
                    {parseFloat(selectedConta.valor || 0).toFixed(2)}
                  </p>
                  <p>
                    <strong>Data de Registro:</strong> {formatFirestoreDate(selectedConta.dataRegistro)}
                  </p>
                  <p>
                    <strong>Data de Cobrança:</strong>{' '}
                    {formatFirestoreDate(selectedConta.dataCobranca)}
                  </p>

                  {viewCompletedPayments || selectedConta.dataPagamento ? (
                    // Campos específicos para recebimentos concluídos
                    <>
                      <p>
                        <strong>Data de Pagamento:</strong>{' '}
                        {formatFirestoreDate(selectedConta.dataPagamento)}
                      </p>
                      <p>
                        <strong>Forma de Pagamento:</strong>{' '}
                        {selectedConta.formaPagamento || 'N/A'}
                      </p>
                      <p className="bg-green-100 text-green-800 p-2 rounded">
                        <strong>Status:</strong> Concluído
                      </p>
                    </>
                  ) : (
                    // Campos apenas para recebimentos pendentes
                    <p>
                      <strong>Data de Pagamento:</strong> Pendente
                    </p>
                  )}

                  <p>
                    <strong>Loja:</strong> {selectedConta.loja || 'Não especificada'}
                  </p>

                  {selectedConta.origem && (
                    <p>
                      <strong>Origem:</strong> {selectedConta.origem}
                    </p>
                  )}

                  {selectedConta.parcela && (
                    <p>
                      <strong>Parcela:</strong> {selectedConta.parcela}
                    </p>
                  )}

                  {(selectedConta.valorPago || selectedConta.valorPago === 0) && (
                    <p>
                      <strong>Total Pago:</strong> R$ {parseFloat(selectedConta.valorPago || 0).toFixed(2)}
                    </p>
                  )}

                  {(selectedConta.juros || selectedConta.juros === 0) && (
                    <p>
                      <strong>Juros:</strong> R$ {parseFloat(selectedConta.juros || 0).toFixed(2)}
                    </p>
                  )}

                  {selectedConta.observacoes && (
                    <p>
                      <strong>Observações:</strong> {selectedConta.observacoes}
                    </p>
                  )}

                  {/* Seção para registrar o recebimento - apenas para pendentes */}
                  {!viewCompletedPayments && !selectedConta.dataPagamento && (
                    <div className="mt-6">
                      <label className="block text-black font-bold mb-2">
                        Forma de Recebimento
                      </label>
                      <select
                        value={formaRecebimento}
                        onChange={(e) => setFormaRecebimento(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md text-black"
                      >
                        <option value="">Selecione</option>
                        <option value="Dinheiro">Dinheiro</option>
                        <option value="Cartão de Crédito">Cartão de Crédito</option>
                        <option value="Cartão de Débito">Cartão de Débito</option>
                        <option value="Pix">Pix</option>
                        <option value="Cheque">Cheque</option>
                        <option value="Boleto">Boleto</option>
                      </select>
                    </div>
                  )}

                  {settleMessage && (
                    <p className="text-green-600 mt-4">{settleMessage}</p>
                  )}

                  {/* Mostrar botões diferentes para pendentes e concluídos */}
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

                  {/* Botão de registrar recebimento - apenas para pendentes */}
                  {!viewCompletedPayments && !selectedConta.dataPagamento && (
                    <div className="flex justify-center mt-4">
                      <button
                        onClick={handleSettlePayment}
                        className="bg-green-600 text-white px-4 py-2 rounded-md"
                      >
                        <FontAwesomeIcon
                          icon={faCheck}
                          className="h-5 w-5 text-white cursor-pointer hover:text-gray-200 pr-2 justify-center"
                        />
                        Registrar Recebimento
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Edição de contas */}
      {
        isEditModalOpen && editingConta && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-md flex flex-col h-3/5 overflow-hidden">
              <div className="bg-[#81059e] text-white p-4 flex justify-between items-center">
                <h3 className="text-xl font-bold">Editar Conta a Pagar</h3>

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
                    value={editingConta.documento || ''}
                    onChange={(e) => setEditingConta({ ...editingConta, documento: e.target.value })}
                    className="w-full p-2 border-2 border-[#81059e] rounded-sm"
                  />
                </div>
                <div>
                  <label className="text-[#81059e] font-medium">Credor:</label>
                  <input
                    type="text"
                    value={editingConta.credor || ''}
                    onChange={(e) => setEditingConta({ ...editingConta, credor: e.target.value })}
                    className="w-full p-2 border-2 border-[#81059e] rounded-sm"
                  />
                </div>

                <div>
                  <label className="text-[#81059e] font-medium">Valor:</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingConta.valor || 0}
                    onChange={(e) => setEditingConta({ ...editingConta, valor: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2 border-2 border-[#81059e] rounded-sm"
                  />
                </div>

                <div>
                  <label className="text-[#81059e] font-medium">Categoria:</label>
                  <input
                    type="text"
                    value={editingConta.categoriaDespesa || ''}
                    onChange={(e) => setEditingConta({ ...editingConta, categoriaDespesa: e.target.value })}
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
        )
      }

      {/* Add the FilterModal component */}
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

      {/* Add this modal before the closing Layout tag */}
      {isSettleMultipleModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-[#81059e]">
                Quitar {selectedForDeletion.length} Conta(s)
              </h3>
              <button
                onClick={() => setIsSettleMultipleModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FontAwesomeIcon icon={faX} className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Forma de Recebimento
              </label>
              <select
                value={formaRecebimentoMultiplo}
                onChange={(e) => setFormaRecebimentoMultiplo(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md text-gray-800 bg-white focus:border-[#81059e] focus:ring focus:ring-purple-200"
              >
                <option value="">Selecione</option>
                <option value="Dinheiro">Dinheiro</option>
                <option value="Cartão de Crédito">Cartão de Crédito</option>
                <option value="Cartão de Débito">Cartão de Débito</option>
                <option value="Pix">Pix</option>
                <option value="Cheque">Cheque</option>
                <option value="Boleto">Boleto</option>
              </select>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setIsSettleMultipleModalOpen(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancelar
              </button>
              <button
                onClick={handleSettleMultiplePayments}
                disabled={!formaRecebimentoMultiplo}
                className={`${
                  !formaRecebimentoMultiplo
                    ? 'bg-green-300'
                    : 'bg-green-500 hover:bg-green-600'
                } text-white px-4 py-2 rounded-md transition-colors`}
              >
                Confirmar Quitação
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout >
  );
}