"use client";

import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { collection, getDocs, query, where, orderBy, addDoc, Timestamp, doc, getDoc, updateDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { firestore } from '@/lib/firebaseConfig';
import { useAuth } from '@/hooks/useAuth';
import CaixasModal from '@/components/CaixasModal';
import { useCaixas } from '@/hooks/useCaixas';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faX } from '@fortawesome/free-solid-svg-icons';
import { FiCalendar, FiDollarSign, FiArrowUp, FiArrowDown, FiPrinter, FiRefreshCw, FiHome, FiFilter, FiTrash2, FiCodepen, FiEdit, FiEdit2, FiEdit3 } from 'react-icons/fi';

export default function ControleCaixa() {
  const { userPermissions, userData } = useAuth();
  const [selectedLoja, setSelectedLoja] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dataInicio, setDataInicio] = useState(new Date());
  const [dataFim, setDataFim] = useState(new Date());
  const [movimentacoes, setMovimentacoes] = useState([]);
  const [saldoAnterior, setSaldoAnterior] = useState(0);
  const [showCaixasModal, setShowCaixasModal] = useState(false);
  const { caixas, loading: loadingCaixas, refreshCaixas } = useCaixas(selectedLoja);
  const [saldoAtual, setSaldoAtual] = useState(0);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingMovimentacao, setEditingMovimentacao] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedForDeletion, setSelectedForDeletion] = useState([]);
  const [tipoMovimentacao, setTipoMovimentacao] = useState('entrada');
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [isLoading, setIsLoading] = useState(false);
  const [sortField, setSortField] = useState('data');
  const [sortDirection, setSortDirection] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);
  const [filteredMovimentacoes, setFilteredMovimentacoes] = useState([]);

  const [showFilters, setShowFilters] = useState(false);
  const [meiosPagamento, setMeiosPagamento] = useState({
    dinheiro: 0,
    cartao_credito: 0,
    cartao_debito: 0,
    pix: 0,
    outros: 0
  });

  const [formData, setFormData] = useState({
    tipo: 'entrada',
    valor: '',
    data: new Date(),
    categoria: '',
    descricao: '',
    metodoPagamento: 'dinheiro',
    responsavel: userData?.nome || '',
    numeroDocumento: '', // Novo campo para N° do Documento
    caixa: '', // Novo campo para Caixa
    numeroOS: '', // Novo campo para OS
  });
  useEffect(() => {
    if (userPermissions) {
      // Se não for admin, usa a primeira loja que tem acesso
      if (!userPermissions.isAdmin && userPermissions.lojas.length > 0) {
        setSelectedLoja(userPermissions.lojas[0]);
      }
      // Se for admin, usa a primeira loja da lista
      else if (userPermissions.isAdmin && userPermissions.lojas.length > 0) {
        setSelectedLoja(userPermissions.lojas[0]);
      }
    }
  }, [userPermissions]);

  useEffect(() => {
    if (selectedLoja) {
      fetchMovimentacoes();
    }
  }, [selectedLoja, dataInicio, dataFim, filtroTipo]);

  useEffect(() => {
    // Aplicar filtros e ordenação
    if (movimentacoes.length > 0) {
      // Ordenar as movimentações conforme o campo e direção atual
      const sortedMovimentacoes = sortMovimentacoes(movimentacoes, sortField, sortDirection);
      setFilteredMovimentacoes(sortedMovimentacoes);

    } else {
      setFilteredMovimentacoes([]);
    }
  }, [movimentacoes, sortField, sortDirection]);

  const formatarData = (data) => {
    return new Date(data.setHours(0, 0, 0, 0));
  };

  const formatarDataFim = (data) => {
    const novaData = new Date(data);
    return new Date(novaData.setHours(23, 59, 59, 999));
  };

  const fetchMovimentacoes = async () => {
    if (!selectedLoja) return;

    setLoading(true);
    try {
      // Buscar todas as movimentações para o período filtrado
      let itemsRef = collection(firestore, `lojas/${selectedLoja}/financeiro/controle_caixa/items`);

      // Query para movimentações no período selecionado
      let movimentacoesQuery;
      let baseQuery = query(
        itemsRef,
        where('data', '>=', formatarData(new Date(dataInicio))),
        where('data', '<=', formatarDataFim(new Date(dataFim)))
      );

      // Aplicar filtro por tipo se não for "todos"
      if (filtroTipo !== 'todos') {
        movimentacoesQuery = query(
          baseQuery,
          where('tipo', '==', filtroTipo),
          orderBy('data', 'desc')
        );
      } else {
        movimentacoesQuery = query(
          baseQuery,
          orderBy('data', 'desc')
        );
      }

      const querySnapshot = await getDocs(movimentacoesQuery);

      const movimentacoesData = [];
      const meiosPagamentoTemp = {
        dinheiro: 0,
        cartao_credito: 0,
        cartao_debito: 0,
        pix: 0,
        outros: 0
      };

      // Processa movimentações do período
      querySnapshot.forEach((doc) => {
        const movData = doc.data();
        const movItem = {
          id: doc.id,
          ...movData,
          data: movData.data ? new Date(movData.data.seconds * 1000) : new Date()
        };
        movimentacoesData.push(movItem);

        // Calcular totais por método de pagamento (apenas entradas)
        if (movItem.tipo === 'entrada') {
          const metodo = movItem.metodoPagamento || 'outros';
          if (meiosPagamentoTemp[metodo] !== undefined) {
            meiosPagamentoTemp[metodo] += parseFloat(movItem.valor || 0);
          } else {
            meiosPagamentoTemp.outros += parseFloat(movItem.valor || 0);
          }
        }
      });

      setMeiosPagamento(meiosPagamentoTemp);
      setMovimentacoes(movimentacoesData);

      // Calcular movimentações ANTES do período selecionado
      const saldoAnteriorQuery = query(
        collection(firestore, `lojas/${selectedLoja}/financeiro/controle_caixa/items`),
        where('data', '<', formatarData(new Date(dataInicio)))
      );

      const saldoAnteriorSnapshot = await getDocs(saldoAnteriorQuery);
      let saldoAnt = 0;

      saldoAnteriorSnapshot.forEach((doc) => {
        const movData = doc.data();
        if (movData.tipo === 'entrada') {
          saldoAnt += parseFloat(movData.valor || 0);
        } else if (movData.tipo === 'saida') {
          saldoAnt -= parseFloat(movData.valor || 0);
        }
      });

      // Atualizar o estado do saldo anterior
      setSaldoAnterior(saldoAnt);

      // Calcular saldo do período atual
      let totalEntradasPeriodo = 0;
      let totalSaidasPeriodo = 0;

      movimentacoesData.forEach(mov => {
        if (mov.tipo === 'entrada') {
          totalEntradasPeriodo += parseFloat(mov.valor || 0);
        } else if (mov.tipo === 'saida') {
          totalSaidasPeriodo += parseFloat(mov.valor || 0);
        }
      });

      const saldoPeriodoCalc = totalEntradasPeriodo - totalSaidasPeriodo;

      // Definir o saldo atual como a soma do saldo anterior e do período atual
      // Não armazena mais no Firestore, apenas calcula para exibição
      setSaldoAtual(saldoAnt + saldoPeriodoCalc);

    } catch (error) {
      console.error("Erro ao buscar movimentações:", error);
    } finally {
      setLoading(false);
    }
  };

  // Função para ordenar movimentações
  const sortMovimentacoes = (movimentacoesToSort, field, direction) => {
    return [...movimentacoesToSort].sort((a, b) => {
      let aValue = a[field];
      let bValue = b[field];

      // Tratar datas
      if (field === 'data') {
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

    // Se já for uma Date
    if (date instanceof Date) {
      return date;
    }

    // Se for uma string ou outro formato, tentar converter para Date
    return new Date(date);
  };

  // Função para alternar a ordenação
  const handleSort = (field) => {
    const direction = field === sortField && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortDirection(direction);

    // Reordenar as movimentações filtradas
    const sorted = sortMovimentacoes(filteredMovimentacoes, field, direction);
    setFilteredMovimentacoes(sorted);
  };

  const openEditModal = () => {
    if (selectedForDeletion.length !== 1) return;

    // Encontrar a movimentação selecionada
    const movToEdit = movimentacoes.find(mov => mov.id === selectedForDeletion[0]);

    if (movToEdit) {
      setEditingMovimentacao({
        ...movToEdit,
        // Converter para formato de formulário se necessário
        valor: parseFloat(movToEdit.valor || 0),
        data: movToEdit.data instanceof Date ? movToEdit.data : new Date(movToEdit.data)
      });
      setIsEditModalOpen(true);
    }
  };

  const handleSaveEdit = async () => {
    try {
      if (!editingMovimentacao || !selectedLoja) return;

      // Preparar dados para atualizar
      const movimentacaoData = {
        ...editingMovimentacao,
        data: Timestamp.fromDate(editingMovimentacao.data),
        valor: parseFloat(editingMovimentacao.valor) || 0,
        updatedAt: Timestamp.now()
      };

      // Referência ao documento
      const movRef = doc(firestore, `lojas/${selectedLoja}/financeiro/controle_caixa/items`, editingMovimentacao.id);

      // Atualizar o documento
      await setDoc(movRef, movimentacaoData, { merge: true });

      // Atualizar estado local
      setMovimentacoes(prevMovs =>
        prevMovs.map(mov => mov.id === editingMovimentacao.id ? movimentacaoData : mov)
      );

      // Fechar modal e limpar seleção
      setIsEditModalOpen(false);
      setSelectedForDeletion([]);

      // Recarregar dados para refletir as mudanças e recalcular o saldo
      await fetchMovimentacoes();

      alert('Movimentação atualizada com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar movimentação:', error);
      alert('Erro ao atualizar a movimentação.');
    }
  };

  // Renderizar seta de ordenação - apenas quando a coluna estiver selecionada
  const renderSortArrow = (field) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ?
      <span className="ml-1">↑</span> :
      <span className="ml-1">↓</span>;
  };

  // Função para marcar ou desmarcar movimentação para exclusão
  const toggleDeletion = (e, movId) => {
    e.stopPropagation(); // Evitar abrir o modal se houver

    setSelectedForDeletion(prev => {
      if (prev.includes(movId)) {
        return prev.filter(id => id !== movId);
      } else {
        return [...prev, movId];
      }
    });
  };

  // Função para excluir as movimentações selecionadas
  const handleDeleteSelected = async () => {
    if (selectedForDeletion.length === 0) {
      alert('Selecione pelo menos um registro para excluir.');
      return;
    }

    if (confirm(`Deseja realmente excluir ${selectedForDeletion.length} registros selecionados?`)) {
      try {
        for (const movId of selectedForDeletion) {
          // Excluir a movimentação
          const movRef = doc(firestore, `lojas/${selectedLoja}/financeiro/controle_caixa/items`, movId);
          await deleteDoc(movRef);
        }

        // Atualizar as listas e recalcular o saldo
        await fetchMovimentacoes();
        setSelectedForDeletion([]);

        alert('Registros excluídos com sucesso!');
      } catch (error) {
        console.error('Erro ao excluir registros:', error);
        alert('Erro ao excluir os registros selecionados.');
      }
    }
  };


  // Calcular movimentações para a página atual
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentMovimentacoes = filteredMovimentacoes.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredMovimentacoes.length / itemsPerPage);

  // Funções de navegação
  const goToPage = (pageNumber) => {
    setCurrentPage(Math.max(1, Math.min(pageNumber, totalPages)));
  };

  const handleValorChange = (e) => {
    const valor = e.target.value.replace(/\D/g, '');
    setFormData(prev => ({
      ...prev,
      valor: valor ? (Number(valor) / 100) : ''
    }));
  };

  const abrirModal = (tipo) => {
    setTipoMovimentacao(tipo);
    setFormData(prev => ({
      ...prev,
      tipo: tipo,
      data: new Date(),
      responsavel: userData?.nome || '',
      numeroDocumento: '',
      caixa: '',
      numeroOS: '',
    }));
    setShowModal(true);
  };

  const fecharModal = () => {
    setShowModal(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDataChange = (date) => {
    setFormData(prev => ({ ...prev, data: date }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedLoja) {
      alert("Selecione uma loja primeiro!");
      return;
    }

    if (!formData.valor || formData.valor <= 0) {
      alert("O valor deve ser maior que zero!");
      return;
    }

    setIsLoading(true);

    try {
      // Preparar dados para salvar, incluindo os novos campos
      const movimentacaoData = {
        tipo: formData.tipo,
        valor: Number(formData.valor),
        data: Timestamp.fromDate(formData.data),
        categoria: formData.categoria,
        descricao: formData.descricao,
        metodoPagamento: formData.metodoPagamento,
        responsavel: formData.responsavel,
        registradoPor: userData?.nome || 'Sistema',
        loja: selectedLoja,
        createdAt: Timestamp.now(),
        numeroDocumento: formData.numeroDocumento,
        caixa: formData.caixa,
        numeroOS: formData.numeroOS,
      };

      // Adicionar movimentação
      const movimentacoesCollectionRef = collection(firestore, `lojas/${selectedLoja}/financeiro/controle_caixa/items`);
      await addDoc(movimentacoesCollectionRef, movimentacaoData);

      // Recarregar movimentações para atualizar o saldo calculado
      await fetchMovimentacoes();

      // Fechar modal e limpar formulário
      setShowModal(false);
      setFormData({
        tipo: 'entrada',
        valor: '',
        data: new Date(),
        categoria: '',
        descricao: '',
        metodoPagamento: 'dinheiro',
        responsavel: userData?.nome || '',
        numeroDocumento: '',
        caixa: '',
        numeroOS: '',
      });

      alert(formData.tipo === 'entrada' ? "Entrada registrada com sucesso!" : "Saída registrada com sucesso!");
    } catch (error) {
      console.error("Erro ao registrar movimentação:", error);
      alert("Erro ao registrar movimentação. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const calcularTotais = () => {
    let totalEntradas = 0;
    let totalSaidas = 0;

    movimentacoes.forEach(mov => {
      if (mov.tipo === 'entrada') {
        totalEntradas += parseFloat(mov.valor || 0);
      } else if (mov.tipo === 'saida') {
        totalSaidas += parseFloat(mov.valor || 0);
      }
    });

    const saldoPeriodo = totalEntradas - totalSaidas;

    return {
      totalEntradas,
      totalSaidas,
      saldoPeriodo
    };
  };


  const imprimirRelatorio = () => {
    window.print();
  };

  const { totalEntradas, totalSaidas, saldoPeriodo } = calcularTotais();

  const getCategorias = (tipo) => {
    if (tipo === 'entrada') {
      return [
        'Venda',
        'Recebimento',
        'Empréstimo',
        'Investimento',
        'Outro'
      ];
    } else {
      return [
        'Fornecedor',
        'Salário',
        'Aluguel',
        'Imposto',
        'Material de Escritório',
        'Manutenção',
        'Publicidade',
        'Outro'
      ];
    }
  };

  const renderLojaName = (lojaId) => {
    const lojaNames = {
      'loja1': 'Loja 1 - Centro',
      'loja2': 'Loja 2 - Caramuru'
    };

    return lojaNames[lojaId] || lojaId;
  };

  const formatarValor = (valor) => {
    return `R$ ${parseFloat(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatarDataExibicao = (data) => {
    return data.toLocaleDateString('pt-BR');
  };

  return (
    <Layout>
      <div className="min-h-screen mb-20">
        <div className="w-full max-w-6xl mx-auto rounded-lg">
          <h2 className="text-3xl font-bold text-[#81059e] mb-8 mt-8">CONTROLE DE CAIXA</h2>

          {/* Seletor de Loja para Admins - mais compacto */}
          {userPermissions?.isAdmin && (
            <div className="mb-4">
              <select
                value={selectedLoja || ''}
                onChange={(e) => setSelectedLoja(e.target.value)}
                className="border-2 border-[#81059e] p-2 rounded-sm w-full md:w-1/3 text-black"
              >
                <option value="">Selecione uma loja</option>
                {userPermissions.lojas.map((loja) => (
                  <option key={loja} value={loja}>
                    {renderLojaName(loja)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Dashboard responsivo - otimizado para caber em uma linha no PC */}
          <div className="grid grid-cols-2 md:flex md:flex-nowrap md:space-x-4 mb-4 overflow-x-auto">
            {/* Saldo Anterior */}
            <div className="rounded-sm p-2 border-l-4 border-l-blue-500 md:flex-1 min-w-[100px] mb-2 md:mb-0">
              <p className="text-black text-sm font-bold whitespace-nowrap">Saldo Anterior</p>
              <p className={`text-base ${saldoAnterior >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {saldoAnterior >= 0
                  ? formatarValor(saldoAnterior)
                  : `- ${formatarValor(Math.abs(saldoAnterior))}`
                }
              </p>
            </div>

            {/* Entradas */}
            <div className="rounded-sm p-2 border-l-4 border-green-500 md:flex-1 min-w-[100px] mb-2 md:mb-0">
              <p className="text-black text-sm font-bold whitespace-nowrap">Entradas</p>
              <p className="text-base text-green-600">{formatarValor(totalEntradas)}</p>
            </div>

            {/* Saídas */}
            <div className="rounded-sm p-2 border-l-4 border-red-500 md:flex-1 min-w-[100px] mb-2 md:mb-0">
              <p className="text-black text-sm font-bold whitespace-nowrap">Saídas</p>
              <p className="text-base text-red-600">{formatarValor(totalSaidas)}</p>
            </div>

            {/* Dinheiro */}
            <div className="rounded-sm p-2 border-l-4 border-yellow-500 md:flex-1 min-w-[100px] mb-2 md:mb-0">
              <p className="text-black text-sm font-bold whitespace-nowrap">Dinheiro</p>
              <p className="text-base text-gray-500">{formatarValor(meiosPagamento.dinheiro)}</p>
            </div>

            {/* Cartão */}
            <div className="rounded-sm p-2 border-l-4 border-purple-500 md:flex-1 min-w-[100px] mb-2 md:mb-0">
              <p className="text-black text-sm font-bold whitespace-nowrap">Cartão</p>
              <p className="text-base text-gray-500">{formatarValor(meiosPagamento.cartao_credito + meiosPagamento.cartao_debito)}</p>
            </div>

            {/* PIX */}
            <div className="rounded-sm p-2 border-l-4 border-indigo-500 md:flex-1 min-w-[100px] mb-2 md:mb-0">
              <p className="text-black text-sm font-bold whitespace-nowrap">PIX</p>
              <p className="text-base text-gray-500">{formatarValor(meiosPagamento.pix)}</p>
            </div>
          </div>


          {/* Barra de filtros (compacta) */}
          <div className="flex flex-wrap gap-2 mb-4">
            <div className="flex flex-grow flex-wrap md:flex-nowrap gap-2">
              <div className="flex items-center space-x-1 h-10 border-2 rounded-sm px-2 bg-white flex-grow md:flex-grow-0">
                <FiCalendar className="text-[#81059e]" />
                <input
                  type="date"
                  value={dataInicio instanceof Date ? dataInicio.toISOString().substring(0, 10) : dataInicio}
                  onChange={e => setDataInicio(new Date(e.target.value))}
                  className="border-0 p-1 w-32 text-black text-sm bg-transparent"
                />
              </div>

              <div className="flex items-center space-x-1 h-10 border-2 rounded-sm px-2 bg-white flex-grow md:flex-grow-0">
                <FiCalendar className="text-[#81059e]" />
                <input
                  type="date"
                  value={dataFim instanceof Date ? dataFim.toISOString().substring(0, 10) : dataFim}
                  onChange={e => setDataFim(new Date(e.target.value))}
                  className="border-0 p-1 w-32 text-black text-sm bg-transparent"
                />
              </div>

              <select
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
                className="h-10 border-2 rounded-sm px-2 text-black text-sm bg-white"
              >
                <option value="todos">Todos</option>
                <option value="entrada">Entradas</option>
                <option value="saida">Saídas</option>
              </select>
            </div>

            <div className="flex gap-1">
              {/* Botão Excluir */}
              <button
                onClick={handleDeleteSelected}
                className={`${selectedForDeletion.length === 0 ? 'text-red-300' : 'text-red-500'} text-red-500 border-2 h-10 w-10 rounded-md flex items-center justify-center`}
                disabled={selectedForDeletion.length === 0}
                title="Excluir Selecionados"
              >
                <FiTrash2 className='h-6 w-6' />
              </button>

              {/* Botão Editar */}
              <button
                onClick={openEditModal}
                className={`${selectedForDeletion.length !== 1 ? 'text-purple-300' : 'text-purple-500'} text-purple-500 border-2 h-10 w-10 rounded-md flex items-center justify-center`}
                disabled={selectedForDeletion.length !== 1}
                title="Editar Selecionado"
              >
                <FiEdit3 className='h-6 w-6' />
              </button>

              {/* Botão Atualizar (que já existe) */}
              <button
                onClick={() => fetchMovimentacoes()}
                className="border-2 text-purple-600 h-10 w-10 rounded-md flex items-center justify-center"
                title="Atualizar"
              >
                <FiRefreshCw className='h-5 w-5' />
              </button>

              {/* Botão Imprimir (que já existe) */}
              <button
                onClick={imprimirRelatorio}
                className="border-2 text-purple-600 h-10 w-10 rounded-md flex items-center justify-center"
                title="Imprimir"
              >
                <FiPrinter className='h-5 w-5' />
              </button>
            </div>
          </div>

          {/* Botões de Ação com Saldo Atual - Versão responsiva */}
          <div className="flex flex-col md:flex-row md:items-center mb-4 gap-3">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => abrirModal('entrada')}
                className="bg-green-500 hover:bg-green-600 px-2 md:px-3 py-2 rounded-md text-white flex items-center gap-1 text-base md:text-sm flex-grow md:flex-grow-0"
              >
                <FiArrowUp /> Nova Entrada
              </button>

              <button
                onClick={() => abrirModal('saida')}
                className="bg-red-500 hover:bg-red-600 px-2 md:px-3 py-2 rounded-md text-white flex items-center gap-1 text-base md:text-sm flex-grow md:flex-grow-0"
              >
                <FiArrowDown /> Nova Saída
              </button>

              {/* Botão para gerenciar caixas */}
              <button
                onClick={() => setShowCaixasModal(true)}
                className="bg-blue-500 hover:bg-blue-600 px-2 md:px-3 py-2 rounded-md text-white flex items-center gap-1 text-base md:text-sm flex-grow md:flex-grow-0"
              >
                <FiDollarSign /> Caixas
              </button>
            </div>

            <div className="flex items-center justify-start md:justify-end mt-2 md:mt-0 md:ml-auto">
              <span className="text-xl md:text-base mr-1 text-gray-400">SALDO TOTAL:</span>
              <span className={`text-base md:text-lg ${(saldoAnterior + saldoPeriodo) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {(saldoAnterior + saldoPeriodo) >= 0
                  ? `R$ ${(saldoAnterior + saldoPeriodo).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  : `- R$ ${Math.abs(saldoAnterior + saldoPeriodo).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                }
              </span>
            </div>
          </div>

          {/* Tabela de Movimentações - Colunas ajustadas para melhor visualização */}
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto select-none">
              <thead className="bg-[#81059e] text-white">
                <tr>
                  <th className="px-3 py-2 w-12">
                    <span className="sr-only">Selecionar</span>
                  </th>
                  <th className="px-3 py-2 cursor-pointer whitespace-nowrap" onClick={() => handleSort('data')}>
                    Data {renderSortArrow('data')}
                  </th>
                  <th className="px-3 py-2 cursor-pointer" onClick={() => handleSort('descricao')}>
                    Descrição {renderSortArrow('descricao')}
                  </th>
                  <th className="px-3 py-2 cursor-pointer" onClick={() => handleSort('valor')}>
                    Valor {renderSortArrow('valor')}
                  </th>
                  <th className="px-3 py-2 cursor-pointer" onClick={() => handleSort('categoria')}>
                    Categoria {renderSortArrow('categoria')}
                  </th>
                  <th className="px-3 py-2 cursor-pointer whitespace-nowrap" onClick={() => handleSort('metodoPagamento')}>
                    Método {renderSortArrow('metodoPagamento')}
                  </th>
                  <th className="px-3 py-2 cursor-pointer" onClick={() => handleSort('responsavel')}>
                    Responsável {renderSortArrow('responsavel')}
                  </th>

                  <th className="px-3 py-2 cursor-pointer" onClick={() => handleSort('numeroDocumento')}>
                    Documento {renderSortArrow('numeroDocumento')}
                  </th>
                  <th className="px-3 py-2 cursor-pointer whitespace-nowrap" onClick={() => handleSort('caixa')}>
                    Caixa {renderSortArrow('caixa')}
                  </th>
                  <th className="px-3 py-2 cursor-pointer" onClick={() => handleSort('numeroOS')}>
                    O.S {renderSortArrow('numeroOS')}
                  </th>
                </tr>
              </thead>
              <tbody className="text-black">
                {loading ? (
                  <tr>
                    <td colSpan="10" className="px-4 py-4 text-center"> <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#81059e]"></div></td>
                  </tr>
                ) : currentMovimentacoes.length > 0 ? (
                  currentMovimentacoes.map((mov) => (
                    <tr key={mov.id} className="text-black text-left hover:bg-gray-100 cursor-pointer">
                      <td className="border px-2 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={selectedForDeletion.includes(mov.id)}
                          onChange={(e) => toggleDeletion(e, mov.id)}
                          className="h-4 w-4 cursor-pointer"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </td>
                      <td className="border px-3 py-2 whitespace-nowrap">{formatarDataExibicao(mov.data)}</td>
                      <td className="border px-4 py-2 max-w-[300px] truncate">{mov.descricao}</td>
                      <td className="border px-6 py-2 whitespace-nowrap text-right font-medium">
                        {mov.tipo === 'entrada'
                          ? <span className="text-green-600">+ R$ {parseFloat(mov.valor).toFixed(2)}</span>
                          : <span className="text-red-600">- R$ {parseFloat(mov.valor).toFixed(2)}</span>
                        }
                      </td>
                      <td className="border px-3 py-2 whitespace-nowrap">{mov.categoria}</td>
                      <td className="border px-3 py-2 whitespace-nowrap">{mov.metodoPagamento}</td>
                      <td className="border px-3 py-2 whitespace-nowrap">{mov.responsavel}</td>

                      <td className="border px-3 py-2 whitespace-nowrap">{mov.numeroDocumento || '-'}</td>
                      <td className="border px-3 py-2 whitespace-nowrap">{mov.caixa || 'Principal'}</td>
                      <td className="border px-3 py-2 whitespace-nowrap">{mov.numeroOS || '-'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="10" className="px-2 py-1 text-center">Nenhuma movimentação encontrada.</td>
                  </tr>
                )}
              </tbody>
            </table>


          </div>
          {/* Paginação responsiva */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mt-4 gap-2">
            <div className="text-base md:text-sm text-gray-700">
              Mostrando <span className="font-medium">{indexOfFirstItem + 1}</span> a{' '}
              <span className="font-medium">
                {Math.min(indexOfLastItem, filteredMovimentacoes.length)}
              </span>{' '}
              de <span className="font-medium">{filteredMovimentacoes.length}</span> registros
            </div>
            <div className="flex space-x-1 self-end md:self-auto">
              <button
                onClick={() => goToPage(1)}
                disabled={currentPage === 1}
                className={`px-3 md:px-3 py-2 rounded text-base ${currentPage === 1
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-[#81059e] text-white hover:bg-[#690480]'
                  }`}
                aria-label="Primeira página"
              >
                &laquo;
              </button>
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className={`px-3 md:px-3 py-2 rounded text-sm ${currentPage === 1
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-[#81059e] text-white hover:bg-[#690480]'
                  }`}
                aria-label="Página anterior"
              >
                &lt;
              </button>

              <span className="px-3 md:px-3 py-2 text-gray-700 text-sm">
                {currentPage} / {totalPages}
              </span>

              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`px-3 md:px-3 py-2 rounded text-sm ${currentPage === totalPages
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-[#81059e] text-white hover:bg-[#690480]'
                  }`}
                aria-label="Próxima página"
              >
                &gt;
              </button>
              <button
                onClick={() => goToPage(totalPages)}
                disabled={currentPage === totalPages}
                className={`px-3 md:px-3 py-2 rounded text-sm ${currentPage === totalPages
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-[#81059e] text-white hover:bg-[#690480]'
                  }`}
                aria-label="Última página"
              >
                &raquo;
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal para Nova Movimentação - Com os novos campos */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md flex flex-col h-3/5 overflow-hidden">
            {/* Cabeçalho do Modal */}
            <div className="bg-[#81059e] text-white p-4 flex justify-between items-center">
              <h3 className="text-xl font-bold">
                {tipoMovimentacao === 'entrada' ? 'Nova Entrada de Caixa' : 'Nova Saída de Caixa'}
              </h3>

              <FontAwesomeIcon
                icon={faX}
                className="h-5 w-5 text-white cursor-pointer hover:text-gray-200"
                onClick={fecharModal}
              />
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 overflow-y-auto flex-grow">
              <div className="space-y-3 p-4">
                {/* Valor */}
                <div className="mb-3">
                  <label className="text-[#81059e] font-medium">Valor</label>
                  <div className="relative">
                    <span className="absolute left-2 top-2.5 text-gray-600">R$</span>
                    <input
                      type="text"
                      name="valor"
                      value={formData.valor ? formatarValor(formData.valor).replace('R$', '').trim() : ''}
                      onChange={handleValorChange}
                      className="w-full border-2 border-[#81059e] rounded-sm p-2 pl-8  text-black"
                      placeholder="0,00"
                      required
                    />
                  </div>
                </div>

                {/* Data */}
                <div className="mb-3">
                  <label className="block text-[#81059e] font-medium mb-1">Data</label>
                  <input
                    type="date"
                    name="data"
                    value={formData.data instanceof Date ? formData.data.toISOString().substring(0, 10) : formData.data}
                    onChange={e => handleDataChange(new Date(e.target.value))}
                    className="w-full border-2 border-[#81059e] rounded-sm p-2 text-black"
                    required
                  />
                </div>

                {/* Categoria */}
                <div className="mb-3">
                  <label className="block text-[#81059e] font-medium mb-1">Categoria</label>
                  <select
                    name="categoria"
                    value={formData.categoria}
                    onChange={handleInputChange}
                    className="w-full border-2 border-[#81059e] rounded-sm p-2 text-black"
                    required
                  >
                    <option value="">Selecione</option>
                    {getCategorias(formData.tipo).map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Método de Pagamento */}
                <div className="mb-3">
                  <label className="block text-[#81059e] font-medium mb-1">Método de Pagamento</label>
                  <select
                    name="metodoPagamento"
                    value={formData.metodoPagamento}
                    onChange={handleInputChange}
                    className="w-full border-2 border-[#81059e] rounded-sm p-2 text-black"
                    required
                  >
                    <option value="dinheiro">Dinheiro</option>
                    <option value="cartao_debito">Cartão de Débito</option>
                    <option value="cartao_credito">Cartão de Crédito</option>
                    <option value="pix">PIX</option>
                    <option value="transferencia">Transferência</option>
                    <option value="cheque">Cheque</option>
                    <option value="boleto">Boleto</option>
                  </select>
                </div>

                {/* Número do Documento - Novo Campo */}
                <div className="mb-3">
                  <label className="block text-[#81059e] font-medium mb-1">N° do Documento</label>
                  <input
                    type="text"
                    name="numeroDocumento"
                    value={formData.numeroDocumento}
                    onChange={handleInputChange}
                    className="w-full border-2 border-[#81059e] rounded-sm p-2 text-black"
                    placeholder="Ex: NF12345"
                  />
                </div>

                {/* Caixa - Campo Modificado */}
                <div className="mb-3">
                  <label className="block text-[#81059e] font-medium mb-1">Caixa</label>
                  <div className="flex items-center">
                    <select
                      name="caixa"
                      value={formData.caixa}
                      onChange={handleInputChange}
                      className="w-full border-2 border-[#81059e] rounded-sm p-2 text-black"
                      required
                    >
                      <option value="">Selecione um caixa</option>
                      {loadingCaixas ? (
                        <option value="" disabled>Carregando caixas...</option>
                      ) : caixas.length > 0 ? (
                        caixas.map(caixa => (
                          <option key={caixa.id} value={caixa.id}>
                            {caixa.nome}
                          </option>
                        ))
                      ) : (
                        <option value="" disabled>Nenhum caixa disponível</option>
                      )}
                    </select>
                  </div>
                </div>

                {/* Número OS - Novo Campo (condicionalmente exibido) */}
                {(formData.tipo === 'entrada' && formData.categoria === 'Venda') && (
                  <div className="mb-3">
                    <label className="block text-[#81059e] font-medium mb-1">
                      Número da O.S
                      <span className="text-xs text-gray-500 ml-1">(Apenas para vendas)</span>
                    </label>
                    <input
                      type="text"
                      name="numeroOS"
                      value={formData.numeroOS}
                      onChange={handleInputChange}
                      className="w-full border-2 border-[#81059e] rounded-sm p-2 text-black"
                      placeholder="Ex: OS-2025-001"
                    />
                  </div>
                )}

                {/* Responsável */}
                <div className="mb-3">
                  <label className="block text-[#81059e] font-medium mb-1">Responsável</label>
                  <input
                    type="text"
                    name="responsavel"
                    value={formData.responsavel}
                    onChange={handleInputChange}
                    className="w-full border-2 border-[#81059e] rounded-sm p-2 text-black"
                    required
                    readOnly
                  />
                </div>

                {/* Descrição */}
                <div className="mb-3">
                  <label className="block text-[#81059e] font-medium mb-1">Descrição</label>
                  <textarea
                    name="descricao"
                    value={formData.descricao}
                    onChange={handleInputChange}
                    className="w-full border-2 border-[#81059e] rounded-sm p-2 text-black"
                    placeholder="Adicione uma descrição detalhada..."
                    required
                  ></textarea>
                </div>
              </div>

              {/* Botões do Modal */}
              <div className="p-4 bg-gray-50 border-t flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={fecharModal}
                  className="text-gray-500 px-4 py-2 rounded-md"
                  disabled={isLoading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`text-white px-4 py-2 rounded-sm ${formData.tipo === 'entrada'
                    ? 'bg-green-500 hover:bg-green-600'
                    : 'bg-red-500 hover:bg-red-600'
                    }`}
                  disabled={isLoading}
                >
                  {isLoading ? 'Salvando...' : 'Confirmar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* Modal de Edição de Movimentação */}
      {isEditModalOpen && editingMovimentacao && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md flex flex-col h-4/5 overflow-hidden text-black">
            <div className="bg-[#81059e] text-white p-4 flex justify-between items-center">
              <h3 className="text-xl font-bold">Editar Movimentação</h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-white hover:text-gray-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-grow">
              <div className="space-y-3">
                {/* Tipo de Movimentação (não editável) */}
                <div>
                  <label className="block text-[#81059e] font-medium">Tipo:</label>
                  <input
                    type="text"
                    value={editingMovimentacao.tipo === 'entrada' ? 'Entrada' : 'Saída'}
                    className="w-full p-2 border-2 border-gray-200 rounded-sm bg-gray-100"
                    disabled
                  />
                </div>

                {/* Valor */}
                <div>
                  <label className="block text-[#81059e] font-medium">Valor:</label>
                  <div className="relative">
                    <span className="absolute left-2 top-2.5 text-gray-600">R$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={editingMovimentacao.valor || 0}
                      onChange={(e) => setEditingMovimentacao({
                        ...editingMovimentacao,
                        valor: parseFloat(e.target.value) || 0
                      })}
                      className="w-full p-2 pl-8 border-2 border-[#81059e] rounded-sm"
                    />
                  </div>
                </div>

                {/* Data */}
                <div>
                  <label className="block text-[#81059e] font-medium">Data:</label>
                  <input
                    type="date"
                    value={editingMovimentacao.data instanceof Date ? editingMovimentacao.data.toISOString().substring(0, 10) : editingMovimentacao.data}
                    onChange={e => setEditingMovimentacao({
                      ...editingMovimentacao,
                      data: new Date(e.target.value)
                    })}
                    className="w-full p-2 border-2 border-[#81059e] rounded-sm"
                    required
                  />
                </div>

                {/* Categoria */}
                <div>
                  <label className="block text-[#81059e] font-medium">Categoria:</label>
                  <select
                    value={editingMovimentacao.categoria || ''}
                    onChange={(e) => setEditingMovimentacao({
                      ...editingMovimentacao,
                      categoria: e.target.value
                    })}
                    className="w-full p-2 border-2 border-[#81059e] rounded-sm"
                  >
                    <option value="">Selecione</option>
                    {getCategorias(editingMovimentacao.tipo).map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Método de Pagamento */}
                <div>
                  <label className="block text-[#81059e] font-medium">Método de Pagamento:</label>
                  <select
                    value={editingMovimentacao.metodoPagamento || 'dinheiro'}
                    onChange={(e) => setEditingMovimentacao({
                      ...editingMovimentacao,
                      metodoPagamento: e.target.value
                    })}
                    className="w-full p-2 border-2 border-[#81059e] rounded-sm"
                  >
                    <option value="dinheiro">Dinheiro</option>
                    <option value="cartao_debito">Cartão de Débito</option>
                    <option value="cartao_credito">Cartão de Crédito</option>
                    <option value="pix">PIX</option>
                    <option value="transferencia">Transferência</option>
                    <option value="cheque">Cheque</option>
                    <option value="boleto">Boleto</option>
                  </select>
                </div>

                {/* Número do Documento */}
                <div>
                  <label className="block text-[#81059e] font-medium">N° do Documento:</label>
                  <input
                    type="text"
                    value={editingMovimentacao.numeroDocumento || ''}
                    onChange={(e) => setEditingMovimentacao({
                      ...editingMovimentacao,
                      numeroDocumento: e.target.value
                    })}
                    className="w-full p-2 border-2 border-[#81059e] rounded-sm"
                    placeholder="Ex: NF12345"
                  />
                </div>

                {/* Caixa */}
                <div>
                  <label className="block text-[#81059e] font-medium">Caixa:</label>
                  <select
                    value={editingMovimentacao.caixa || ''}
                    onChange={(e) => setEditingMovimentacao({
                      ...editingMovimentacao,
                      caixa: e.target.value
                    })}
                    className="w-full p-2 border-2 border-[#81059e] rounded-sm"
                  >
                    <option value="">Selecione um caixa</option>
                    {loadingCaixas ? (
                      <option value="" disabled>Carregando caixas...</option>
                    ) : caixas.length > 0 ? (
                      caixas.map(caixa => (
                        <option key={caixa.id} value={caixa.id}>
                          {caixa.nome}
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>Nenhum caixa disponível</option>
                    )}
                  </select>
                </div>

                {/* Número OS - Apenas para vendas */}
                {(editingMovimentacao.tipo === 'entrada' &&
                  editingMovimentacao.categoria === 'Venda') && (
                    <div>
                      <label className="block text-[#81059e] font-medium">Número da O.S:</label>
                      <input
                        type="text"
                        value={editingMovimentacao.numeroOS || ''}
                        onChange={(e) => setEditingMovimentacao({
                          ...editingMovimentacao,
                          numeroOS: e.target.value
                        })}
                        className="w-full p-2 border-2 border-[#81059e] rounded-sm"
                        placeholder="Ex: OS-2025-001"
                      />
                    </div>
                  )}

                {/* Descrição */}
                <div>
                  <label className="block text-[#81059e] font-medium">Descrição:</label>
                  <textarea
                    value={editingMovimentacao.descricao || ''}
                    onChange={(e) => setEditingMovimentacao({
                      ...editingMovimentacao,
                      descricao: e.target.value
                    })}
                    className="w-full p-2 border-2 border-[#81059e] rounded-sm h-20"
                    placeholder="Descrição detalhada..."
                  ></textarea>
                </div>
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

      {/* Modal de Caixas */}
      <CaixasModal
        isOpen={showCaixasModal}
        onClose={() => setShowCaixasModal(false)}
        selectedLoja={selectedLoja}
        onCaixaUpdated={refreshCaixas}
      />
    </Layout>
  );
}