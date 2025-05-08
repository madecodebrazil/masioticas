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
  faFilter
} from '@fortawesome/free-solid-svg-icons';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
import { firestore } from '../../../../lib/firebaseConfig';
import jsPDF from 'jspdf';

export default function ListaContas() {
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
  const [formaPagamento, setFormaPagamento] = useState('');
  const [settleMessage, setSettleMessage] = useState('');
  const [selectedForDeletion, setSelectedForDeletion] = useState([]);
  const [sortField, setSortField] = useState('dataVencimento');
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
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  useEffect(() => {
    const fetchContas = async () => {
      try {
        setLoading(true);
        const fetchedContas = [];

        // Usar o caminho correto para lojas específicas
        if (selectedLoja !== 'Ambas') {
          // Caminho para uma loja específica
          const contasPagarDocRef = collection(firestore, `lojas/${selectedLoja}/financeiro/contas_pagar/items`);
          const contasSnapshot = await getDocs(contasPagarDocRef);

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
            const contasPagarDocRef = collection(firestore, `lojas/${loja}/financeiro/contas_pagar/items`);
            const contasSnapshot = await getDocs(contasPagarDocRef);

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

  // Extrair anos disponíveis dos dados
  useEffect(() => {
    if (contas.length > 0) {
      const years = ['Todos'];
      contas.forEach(conta => {
        if (conta.dataVencimento) {
          const date = conta.dataVencimento.seconds
            ? new Date(conta.dataVencimento.seconds * 1000)
            : new Date(conta.dataVencimento);
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

  // Função para filtrar contas com base na busca, loja e data
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
            (conta.documento?.toLowerCase().includes(searchQuery.toLowerCase()) || '') ||
            (conta.credor?.toLowerCase().includes(searchQuery.toLowerCase()) || '')
        );
      }

      // Filtro por data
      filtered = filtered.filter(conta => {
        // Se não tem data de vencimento e qualquer filtro está ativo, ocultar
        if (!conta.dataVencimento && (yearFilter !== 'Todos' || monthFilter !== 'Todos' || dayFilter !== 'Todos')) {
          return false;
        }

        if (!conta.dataVencimento) return true;

        const contaDate = conta.dataVencimento.seconds
          ? new Date(conta.dataVencimento.seconds * 1000)
          : new Date(conta.dataVencimento);

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
      if (field === 'dataEntrada' || field === 'dataVencimento' || field === 'dataPagamento') {
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

  // Renderizar seta de ordenação
  const renderSortArrow = (field) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ?
      <span className="ml-1">↑</span> :
      <span className="ml-1">↓</span>;
  };

  const getStatusColor = (vencimento) => {
    if (!vencimento) return 'bg-gray-200 text-gray-800';

    const now = new Date();
    // Se for um timestamp do Firestore
    const dueDate = vencimento.seconds ?
      new Date(vencimento.seconds * 1000) :
      new Date(vencimento);

    if (dueDate < now) return 'bg-red-200 text-red-800'; // Vencido
    if (dueDate - now <= 7 * 24 * 60 * 60 * 1000) return 'bg-yellow-200 text-yellow-800'; // Próximo de vencer
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
    setFormaPagamento('');
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
    doc.text(`Detalhes da Conta a Pagar`, 10, 10);
    doc.text(`Código: ${selectedConta.documento || 'N/A'}`, 10, 20);
    doc.text(`Credor: ${selectedConta.credor || 'N/A'}`, 10, 30);
    doc.text(`Valor: R$ ${parseFloat(selectedConta.valor || 0).toFixed(2)}`, 10, 40);
    doc.text(`Data de Entrada: ${formatFirestoreDate(selectedConta.dataEntrada)}`, 10, 50);
    doc.text(`Data de Vencimento: ${formatFirestoreDate(selectedConta.dataVencimento)}`, 10, 60);
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
    if (selectedConta.taxaJuros) {
      doc.text(`Taxa de Juros: ${parseFloat(selectedConta.taxaJuros || 0).toFixed(2)}%`, 10, 110);
    }
    if (selectedConta.categoriaDespesa) {
      doc.text(`Categoria: ${selectedConta.categoriaDespesa}`, 10, 120);
    }
    if (selectedConta.localPagamento) {
      doc.text(`Local de Pagamento: ${selectedConta.localPagamento}`, 10, 130);
    }
    if (selectedConta.observacoes) {
      doc.text(`Observações: ${selectedConta.observacoes}`, 10, 140);
    }

    doc.save(`ContaPagar_${selectedConta.documento || selectedConta.id}.pdf`);
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
            const contaRef = doc(firestore, `lojas/${conta.loja}/financeiro/contas_pagar/items`, contaId);
            await deleteDoc(contaRef);
          }
        }

        // Atualizar as listas de contas
        const updatedContas = contas.filter(conta => !selectedForDeletion.includes(conta.id));
        setContas(updatedContas);
        setFilteredContas(updatedContas.filter(c =>
          (selectedLoja === 'Ambas' || c.loja === selectedLoja) &&
          (!searchQuery ||
            c.documento?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.credor?.toLowerCase().includes(searchQuery.toLowerCase()))
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

  // Função para quitar o pagamento
  const handleSettlePayment = async () => {
    if (!formaPagamento) {
      alert('Por favor, selecione a forma de pagamento.');
      return;
    }

    try {
      // Preparar descrição personalizada
      const descricao = `Pagamento da conta ${selectedConta.documento || selectedConta.id} via ${formaPagamento}`;

      // Preparar dados para o cashflow
      const cashflowData = {
        nome: selectedConta.credor || 'Credor não especificado',
        formaPagamento: formaPagamento,
        data: new Date(),
        valorFinal: -Math.abs(parseFloat(selectedConta.valor || 0)), // Valor negativo (despesa)
        descricao: descricao,
        type: 'despesa'
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
        nome: selectedConta.credor || 'Credor não especificado',
        valorFinal: -Math.abs(parseFloat(selectedConta.valor || 0)), // Valor negativo (despesa)
        data: dataAtual,
        descricao: descricao,
        type: 'despesa',
        formaPagamento: formaPagamento,
      };

      // Adicionar ao caixa do dia
      await setDoc(doc(caixaRef), caixaData);

      // Remover a conta da coleção 'contas_pagar/items'
      const contaRef = doc(firestore, `lojas/${selectedConta.loja}/financeiro/contas_pagar/items`, selectedConta.id);
      await deleteDoc(contaRef);

      // Atualizar o estado local para remover a conta quitada
      setContas((prevContas) => prevContas.filter((conta) => conta.id !== selectedConta.id));
      setFilteredContas((prevContas) => prevContas.filter((conta) => conta.id !== selectedConta.id));
      setTotalContas(prevState => prevState - 1); // Decrementar o contador

      setSettleMessage('Pagamento quitado com sucesso!');
      setTimeout(() => {
        setSettleMessage('');
        closeModal();
      }, 2000);
    } catch (error) {
      console.error('Erro ao quitar pagamento:', error);
      alert('Erro ao quitar pagamento.');
    }
  };

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

  return (
    <Layout>
      <div className="min-h-screen p-0 md:p-2 mb-20">
        <div className="w-full max-w-5xl mx-auto rounded-lg">
          <div className="mb-4">
            <h2 className="text-3xl font-bold text-[#81059e] mb-8 mt-8">PAGAMENTOS PENDENTES</h2>
          </div>

          {/* Dashboard compacto com estatísticas essenciais */}
          <div className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              {/* Card - Contas a Pagar */}
              <div className="border-2 rounded-sm p-3 border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <FontAwesomeIcon
                    icon={faFileInvoice}
                    className="h-8 w-8 text-[#81059e] bg-purple-300 p-2 rounded-sm"
                  />
                  <span className="text-lg font-semibold text-gray-700 flex-grow ml-3">Contas a Pagar</span>
                </div>
                <p className="text-2xl text-center mt-2">{totalContas}</p>
              </div>

              {/* Card - Valor Total */}
              <div className="border-2 rounded-sm p-3 border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <FontAwesomeIcon
                    icon={faDollarSign}
                    className="h-8 w-8 text-[#81059e] bg-purple-300 p-2 rounded-sm"
                  />
                  <span className="text-lg font-semibold text-gray-700 flex-grow ml-3">Valor Total</span>
                </div>
                <p className="text-2xl text-center mt-2">
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
                    const dueDate = conta.dataVencimento?.seconds
                      ? new Date(conta.dataVencimento.seconds * 1000)
                      : new Date(conta.dataVencimento);
                    return dueDate < now;
                  }).length}
                </p>
                <p className="text-sm text-gray-500 text-center mt-1">
                  Estimativa de Dívida:
                  <span className="whitespace-nowrap"> R$ {contas.filter(conta => {
                    // Continuação da parte que ficou faltando do componente ListaContas

                    const now = new Date();
                    const dueDate = conta.dataVencimento?.seconds
                      ? new Date(conta.dataVencimento.seconds * 1000)
                      : new Date(conta.dataVencimento);
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
                    const dueDate = conta.dataVencimento?.seconds
                      ? new Date(conta.dataVencimento.seconds * 1000)
                      : new Date(conta.dataVencimento);
                    const diffTime = dueDate - now;
                    return dueDate >= now && diffTime <= 7 * 24 * 60 * 60 * 1000;
                  }).length}
                </p>
                <p className="text-sm text-gray-500 text-center mt-1">
                  <span className="whitespace-nowrap">R$ {contas.filter(conta => {
                    const now = new Date();
                    const dueDate = conta.dataVencimento?.seconds
                      ? new Date(conta.dataVencimento.seconds * 1000)
                      : new Date(conta.dataVencimento);
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
              placeholder="Busque por código ou credor"
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
                data-filter-toggle="true"
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                className="p-2 h-10 border-2 border-gray-200 rounded-lg bg-white flex items-center gap-1 text-[#81059e]"
              >
                <FontAwesomeIcon icon={faFilter} className="h-4 w-4" />
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
              <Link href="/finance/add-pay">
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

          <FilterActiveBadges />
          {/* Tabela de contas */}
          {loading ? (
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#81059e]"></div>
          ) : error ? (
            <p>{error}</p>
          ) : (
            <div className="w-full overflow-x-auto">
              {filteredContas.length === 0 ? (
                <p>Nenhuma conta encontrada.</p>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="min-w-full table-auto select-none">
                      <thead>
                        <tr className="bg-[#81059e] text-white">
                          <th className="px-3 py-2 w-12">
                            <span className="sr-only">Selecionar</span>
                          </th>
                          <th className="px-3 py-2 cursor-pointer whitespace-nowrap" onClick={() => handleSort('documento')}>
                            Código {renderSortArrow('documento')}
                          </th>
                          <th className="px-3 py-2 cursor-pointer" onClick={() => handleSort('credor')}>
                            Credor {renderSortArrow('credor')}
                          </th>
                          <th className="px-3 py-2 cursor-pointer" onClick={() => handleSort('valor')}>
                            Valor {renderSortArrow('valor')}
                          </th>
                          <th className="px-3 py-2 cursor-pointer whitespace-nowrap" onClick={() => handleSort('dataEntrada')}>
                            Entrada {renderSortArrow('dataEntrada')}
                          </th>
                          <th className="px-3 py-2 cursor-pointer whitespace-nowrap" onClick={() => handleSort('dataVencimento')}>
                            Vencimento {renderSortArrow('dataVencimento')}
                          </th>
                          <th className="px-3 py-2 cursor-pointer whitespace-nowrap" onClick={() => handleSort('categoriaDespesa')}>
                            Categoria {renderSortArrow('categoriaDespesa')}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentContas.map((conta) => (
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
                              {conta.documento || 'N/A'}
                            </td>
                            <td className="border px-4 py-2 max-w-[300px] truncate" onClick={() => openModal(conta)}>
                              {conta.credor || 'N/A'}
                            </td>
                            <td className="border px-3 py-2 whitespace-nowrap" onClick={() => openModal(conta)}>
                              R$ {parseFloat(conta.valor || 0).toFixed(2)}
                            </td>
                            <td className="border px-3 py-2 whitespace-nowrap" onClick={() => openModal(conta)}>
                              {formatFirestoreDate(conta.dataEntrada)}
                            </td>
                            <td className={`border px-3 py-2 whitespace-nowrap ${getStatusColor(conta.dataVencimento)}`} onClick={() => openModal(conta)}>
                              {formatFirestoreDate(conta.dataVencimento)}
                            </td>
                            <td className="border px-3 py-2 max-w-[200px] truncate" onClick={() => openModal(conta)}>
                              {conta.categoriaDespesa || 'N/A'}
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
              )}
            </div>
          )}

          {/* Modal para detalhes da conta */}
          {isModalOpen && selectedConta && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
              <div className="bg-white rounded-lg shadow-lg w-full max-w-md flex flex-col h-3/5 overflow-hidden">
                <div className="bg-[#81059e] text-white p-4 flex justify-between items-center">
                  <h3 className="text-xl font-bold">
                    Detalhes da Conta a Pagar
                  </h3>
                  <FontAwesomeIcon
                    icon={require('@fortawesome/free-solid-svg-icons').faX}
                    className="h-5 w-5 text-white cursor-pointer hover:text-gray-200"
                    onClick={closeModal}
                  />
                </div>
                <div className="space-y-3 p-4 overflow-y-auto flex-grow">
                  <p>
                    <strong>Código:</strong> {selectedConta.documento || 'N/A'}
                  </p>
                  <p>
                    <strong>Credor:</strong> {selectedConta.credor || 'N/A'}
                  </p>
                  <p>
                    <strong>Valor:</strong> R$ {parseFloat(selectedConta.valor || 0).toFixed(2)}
                  </p>
                  <p>
                    <strong>Data de Entrada:</strong> {formatFirestoreDate(selectedConta.dataEntrada)}
                  </p>
                  <p>
                    <strong>Data de Vencimento:</strong> {formatFirestoreDate(selectedConta.dataVencimento)}
                  </p>
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
                  {selectedConta.categoriaDespesa && (
                    <p>
                      <strong>Categoria da Despesa:</strong> {selectedConta.categoriaDespesa}
                    </p>
                  )}
                  {selectedConta.localPagamento && (
                    <p>
                      <strong>Local de Pagamento:</strong> {selectedConta.localPagamento}
                    </p>
                  )}
                  {selectedConta.contaBancaria && (
                    <p>
                      <strong>Conta Bancária:</strong> {selectedConta.contaBancaria}
                    </p>
                  )}
                  {selectedConta.taxaJuros && (
                    <p>
                      <strong>Taxa de Juros:</strong> {selectedConta.taxaJuros}%
                    </p>
                  )}
                  {selectedConta.observacoes && (
                    <p>
                      <strong>Observações:</strong> {selectedConta.observacoes}
                    </p>
                  )}

                  {/* Seção para registrar o pagamento */}
                  <div className="mt-6">
                    <label className="block text-black font-bold mb-2">
                      Forma de Pagamento
                    </label>
                    <select
                      value={formaPagamento}
                      onChange={(e) => setFormaPagamento(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md text-black"
                    >
                      <option value="">Selecione</option>
                      <option value="Dinheiro">Dinheiro</option>
                      <option value="Cartão de Crédito">Cartão de Crédito</option>
                      <option value="Cartão de Débito">Cartão de Débito</option>
                      <option value="Pix">Pix</option>
                      <option value="Cheque">Cheque</option>
                      <option value="Boleto">Boleto</option>
                      <option value="TED">TED</option>
                    </select>
                  </div>

                  {settleMessage && (
                    <p className="text-green-600 mt-4">{settleMessage}</p>
                  )}

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

                  <div className="flex justify-center mt-4">
                    <button
                      onClick={handleSettlePayment}
                      className="bg-green-600 text-white px-4 py-2 rounded-md"
                    >
                      Quitar Pagamento
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