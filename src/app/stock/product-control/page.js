"use client";

import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBox,
  faBoxes,
  faExclamationTriangle,
  faFilter,
  faPlus,
  faSearch,
  faSync,
  faEdit,
  faTimes,
  faExchange,
  faArrowUp,
  faArrowDown
} from '@fortawesome/free-solid-svg-icons';
import { collection, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
import { firestore } from '../../../lib/firebaseConfig';

export default function GerenciamentoEstoque() {
  const { userPermissions, userData } = useAuth();
  const [produtos, setProdutos] = useState([]);
  const [filteredProdutos, setFilteredProdutos] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLoja, setSelectedLoja] = useState('Ambas');
  const [selectedCategoria, setSelectedCategoria] = useState('Todas');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalProdutos, setTotalProdutos] = useState(0);
  const [produtosLoja1, setProdutosLoja1] = useState(0);
  const [produtosLoja2, setProdutosLoja2] = useState(0);
  const [produtosBaixoEstoque, setProdutosBaixoEstoque] = useState(0);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedProduto, setSelectedProduto] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);
  const [sortField, setSortField] = useState('nome');
  const [sortDirection, setSortDirection] = useState('asc');
  const [editingId, setEditingId] = useState(null);
  const [editingField, setEditingField] = useState(null);
  const [editingValue, setEditingValue] = useState('');
  const [transferQuantidade, setTransferQuantidade] = useState(1);
  const [transferDestino, setTransferDestino] = useState('');
  const [categoriaFilter, setCategoriaFilter] = useState('Todas');
  const [estoqueFilter, setEstoqueFilter] = useState('Todos');

  // Função para buscar os produtos do estoque de todas as lojas
  useEffect(() => {
    const fetchProdutos = async () => {
      try {
        setLoading(true);
        const produtosData = [];
        const categoriasEstoque = ['armacoes', 'lentes', 'solares'];
        const lojas = userPermissions?.lojas || ['loja1', 'loja2'];

        // Para cada loja e categoria, buscar os produtos
        for (const loja of lojas) {
          for (const categoria of categoriasEstoque) {
            const produtosRef = collection(firestore, `lojas/${loja}/estoque/${categoria}`);
            const produtosSnapshot = await getDocs(produtosRef);

            produtosSnapshot.docs.forEach((docProduto) => {
              const produtoData = docProduto.data();
              produtosData.push({
                id: docProduto.id,
                ...produtoData,
                loja: loja,
                categoria: categoria
              });
            });
          }
        }

        // Calcular estatísticas
        const produtosLoja1Count = produtosData.filter(p => p.loja === 'loja1').length;
        const produtosLoja2Count = produtosData.filter(p => p.loja === 'loja2').length;
        const produtosBaixoEstoqueCount = produtosData.filter(p => p.quantidade < 10).length;

        // Aplicar ordenação inicial
        const sortedProdutos = sortProdutos(produtosData, sortField, sortDirection);

        setProdutos(sortedProdutos);
        setFilteredProdutos(sortedProdutos);
        setTotalProdutos(sortedProdutos.length);
        setProdutosLoja1(produtosLoja1Count);
        setProdutosLoja2(produtosLoja2Count);
        setProdutosBaixoEstoque(produtosBaixoEstoqueCount);
        setLoading(false);
      } catch (err) {
        console.error('Erro ao carregar os produtos do estoque:', err);
        setError(`Erro ao carregar os dados do estoque: ${err.message}`);
        setLoading(false);
      }
    };

    fetchProdutos();
  }, [userPermissions]);

  // Função para ordenar produtos
  const sortProdutos = (produtosToSort, field, direction) => {
    return [...produtosToSort].sort((a, b) => {
      let aValue = a[field];
      let bValue = b[field];

      // Tratar números
      if (field === 'quantidade' || field === 'preco' || field === 'precoCusto') {
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

  // Função para alternar a ordenação
  const handleSort = (field) => {
    const direction = field === sortField && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortDirection(direction);

    // Reordenar os produtos filtrados
    const sorted = sortProdutos(filteredProdutos, field, direction);
    setFilteredProdutos(sorted);
  };

  // Renderizar seta de ordenação
  const renderSortArrow = (field) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? 
      <FontAwesomeIcon icon={faArrowUp} className="ml-1 text-xs" /> : 
      <FontAwesomeIcon icon={faArrowDown} className="ml-1 text-xs" />;
  };

  // Atualizar produtos filtrados quando os filtros mudam
  useEffect(() => {
    const filterProdutos = () => {
      let filtered = produtos;

      // Filtro por busca
      if (searchQuery !== '') {
        filtered = filtered.filter(
          (produto) =>
            (produto.codigo?.toLowerCase().includes(searchQuery.toLowerCase()) || '') ||
            (produto.nome?.toLowerCase().includes(searchQuery.toLowerCase()) || '') ||
            (produto.marca?.toLowerCase().includes(searchQuery.toLowerCase()) || '')
        );
      }

      // Filtro por loja
      if (selectedLoja !== 'Ambas') {
        filtered = filtered.filter((produto) => produto.loja === selectedLoja);
      }

      // Filtro por categoria
      if (categoriaFilter !== 'Todas') {
        filtered = filtered.filter((produto) => produto.categoria === categoriaFilter);
      }

      // Filtro por nível de estoque
      if (estoqueFilter === 'Baixo') {
        filtered = filtered.filter((produto) => produto.quantidade < 10);
      } else if (estoqueFilter === 'Normal') {
        filtered = filtered.filter((produto) => produto.quantidade >= 10 && produto.quantidade < 50);
      } else if (estoqueFilter === 'Alto') {
        filtered = filtered.filter((produto) => produto.quantidade >= 50);
      }

      // Aplicar ordenação
      filtered = sortProdutos(filtered, sortField, sortDirection);
      setFilteredProdutos(filtered);
    };

    filterProdutos();
  }, [searchQuery, selectedLoja, categoriaFilter, estoqueFilter, produtos, sortField, sortDirection]);

  // Funções para gerenciar paginação
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentProdutos = filteredProdutos.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredProdutos.length / itemsPerPage);

  const goToPage = (pageNumber) => {
    setCurrentPage(Math.max(1, Math.min(pageNumber, totalPages)));
  };

  // Função para atualizar a quantidade de um produto
  const handleUpdateQuantidade = async () => {
    if (!editingId || !editingField || editingValue === '') return;

    try {
      const produto = produtos.find(p => p.id === editingId);
      if (!produto) return;

      const produtoRef = doc(firestore, `lojas/${produto.loja}/estoque/${produto.categoria}`, produto.id);
      await updateDoc(produtoRef, { [editingField]: Number(editingValue) });

      // Atualizar o estado local
      const updatedProdutos = produtos.map(p => {
        if (p.id === editingId && p.loja === produto.loja && p.categoria === produto.categoria) {
          return { ...p, [editingField]: Number(editingValue) };
        }
        return p;
      });

      setProdutos(updatedProdutos);
      setFilteredProdutos(sortProdutos(updatedProdutos, sortField, sortDirection));
      
      // Limpar estados de edição
      setEditingId(null);
      setEditingField(null);
      setEditingValue('');
    } catch (error) {
      console.error('Erro ao atualizar quantidade:', error);
      alert('Erro ao atualizar o produto. Por favor, tente novamente.');
    }
  };

  // Função para iniciar edição de um campo
  const startEditing = (id, field, value) => {
    setEditingId(id);
    setEditingField(field);
    setEditingValue(value.toString());
  };

  // Função para cancelar a edição
  const cancelEditing = () => {
    setEditingId(null);
    setEditingField(null);
    setEditingValue('');
  };

  // Função para abrir o modal de transferência
  const openTransferModal = (produto) => {
    setSelectedProduto(produto);
    setTransferQuantidade(1);
    setTransferDestino(produto.loja === 'loja1' ? 'loja2' : 'loja1');
    setShowTransferModal(true);
  };

  // Função para realizar a transferência de estoque
  const handleTransferencia = async () => {
    if (!selectedProduto || transferQuantidade <= 0) return;

    try {
      // Verificar se o produto existe na loja de destino
      const produtoOrigemRef = doc(firestore, `lojas/${selectedProduto.loja}/estoque/${selectedProduto.categoria}`, selectedProduto.id);
      const produtoDestinoRef = doc(firestore, `lojas/${transferDestino}/estoque/${selectedProduto.categoria}`, selectedProduto.id);
      
      const produtoOrigemSnap = await getDoc(produtoOrigemRef);
      const produtoDestinoSnap = await getDoc(produtoDestinoRef);
      
      if (!produtoOrigemSnap.exists()) {
        alert('Produto não encontrado na loja de origem.');
        return;
      }
      
      const produtoOrigemData = produtoOrigemSnap.data();
      
      // Verificar se há estoque suficiente
      if (produtoOrigemData.quantidade < transferQuantidade) {
        alert('Quantidade insuficiente para transferência.');
        return;
      }
      
      // Atualizar estoque na origem
      await updateDoc(produtoOrigemRef, {
        quantidade: produtoOrigemData.quantidade - transferQuantidade
      });
      
      // Se o produto existe no destino, adicionar à quantidade. Caso contrário, criar.
      if (produtoDestinoSnap.exists()) {
        const produtoDestinoData = produtoDestinoSnap.data();
        await updateDoc(produtoDestinoRef, {
          quantidade: produtoDestinoData.quantidade + transferQuantidade
        });
      } else {
        // Criar produto na loja de destino com os mesmos dados mas quantidade transferida
        const newProdutoData = {
          ...produtoOrigemData,
          quantidade: transferQuantidade
        };
        await setDoc(produtoDestinoRef, newProdutoData);
      }
      
      // Atualizar estado local
      const updatedProdutos = produtos.map(p => {
        if (p.id === selectedProduto.id && p.loja === selectedProduto.loja && p.categoria === selectedProduto.categoria) {
          return { ...p, quantidade: p.quantidade - transferQuantidade };
        }
        
        if (p.id === selectedProduto.id && p.loja === transferDestino && p.categoria === selectedProduto.categoria) {
          return { ...p, quantidade: p.quantidade + transferQuantidade };
        }
        
        return p;
      });
      
      // Se o produto não existia na loja de destino, adicionar à lista
      const produtoExisteEmDestino = produtos.some(
        p => p.id === selectedProduto.id && p.loja === transferDestino && p.categoria === selectedProduto.categoria
      );
      
      if (!produtoExisteEmDestino) {
        const novoProduto = {
          ...selectedProduto,
          loja: transferDestino,
          quantidade: transferQuantidade
        };
        updatedProdutos.push(novoProduto);
      }
      
      setProdutos(updatedProdutos);
      setFilteredProdutos(sortProdutos(updatedProdutos, sortField, sortDirection));
      
      alert('Transferência realizada com sucesso!');
      setShowTransferModal(false);
    } catch (error) {
      console.error('Erro ao transferir estoque:', error);
      alert('Erro ao realizar a transferência. Por favor, tente novamente.');
    }
  };

  // Renderizar status de estoque com cor baseada na quantidade
  const renderEstoqueStatus = (quantidade) => {
    if (quantidade < 10) {
      return <span className="text-red-600 font-bold">{quantidade}</span>;
    } else if (quantidade < 50) {
      return <span className="text-yellow-600">{quantidade}</span>;
    } else {
      return <span className="text-green-600">{quantidade}</span>;
    }
  };

  // Filtros para categoria de produtos
  const categorias = [
    { value: 'Todas', label: 'Todas Categorias' },
    { value: 'armacoes', label: 'Armações' },
    { value: 'lentes', label: 'Lentes' },
    { value: 'solares', label: 'Óculos Solares' }
  ];

  // Filtros para nível de estoque
  const niveisEstoque = [
    { value: 'Todos', label: 'Todos Níveis' },
    { value: 'Baixo', label: 'Estoque Baixo (<10)' },
    { value: 'Normal', label: 'Estoque Normal (10-49)' },
    { value: 'Alto', label: 'Estoque Alto (50+)' }
  ];

  // Componente para exibir badges de filtros ativos
  const FilterActiveBadges = () => {
    const activeFilters = [];

    if (categoriaFilter !== 'Todas') {
      activeFilters.push({ type: 'Categoria', value: categorias.find(c => c.value === categoriaFilter)?.label });
    }

    if (estoqueFilter !== 'Todos') {
      activeFilters.push({ type: 'Nível', value: niveisEstoque.find(e => e.value === estoqueFilter)?.label });
    }

    if (selectedLoja !== 'Ambas') {
      activeFilters.push({ type: 'Loja', value: selectedLoja });
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
                if (filter.type === 'Categoria') setCategoriaFilter('Todas');
                if (filter.type === 'Nível') setEstoqueFilter('Todos');
                if (filter.type === 'Loja') setSelectedLoja('Ambas');
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
            setCategoriaFilter('Todas');
            setEstoqueFilter('Todos');
            setSelectedLoja('Ambas');
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
        <div className="w-full max-w-6xl mx-auto rounded-lg">
          <div className="mb-4">
            <h2 className="text-3xl font-bold text-[#81059e] mb-8 mt-8">GERENCIAMENTO DE ESTOQUE</h2>
          </div>

          {/* Dashboard com estatísticas de estoque */}
          <div className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              {/* Card - Total de Produtos */}
              <div className="border-2 rounded-lg p-4 border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <FontAwesomeIcon
                    icon={faBoxes}
                    className="h-8 w-8 text-[#81059e] bg-purple-300 p-2 rounded-2xl"
                  />
                  <span className="text-lg font-medium text-gray-700 flex-grow ml-3">Total de Produtos</span>
                </div>
                <p className="text-2xl font-semibold text-center mt-2">{totalProdutos}</p>
              </div>

              {/* Card - Produtos Loja 1 */}
              <div className="border-2 rounded-lg p-4 border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <FontAwesomeIcon
                    icon={faBox}
                    className="h-8 w-8 text-[#81059e] bg-purple-300 p-2 rounded-2xl"
                  />
                  <span className="text-lg font-medium text-gray-700 flex-grow ml-3">Loja 1</span>
                </div>
                <p className="text-2xl font-semibold text-center mt-2">{produtosLoja1}</p>
              </div>

              {/* Card - Produtos Loja 2 */}
              <div className="border-2 rounded-lg p-4 border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <FontAwesomeIcon
                    icon={faBox}
                    className="h-8 w-8 text-[#81059e] bg-purple-300 p-2 rounded-2xl"
                  />
                  <span className="text-lg font-medium text-gray-700 flex-grow ml-3">Loja 2</span>
                </div>
                <p className="text-2xl font-semibold text-center mt-2">{produtosLoja2}</p>
              </div>

              {/* Card - Produtos com Estoque Baixo */}
              <div className="border-2 rounded-lg p-4 border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <FontAwesomeIcon
                    icon={faExclamationTriangle}
                    className="h-8 w-8 text-[#81059e] bg-purple-300 p-2 rounded-2xl"
                  />
                  <span className="text-lg font-medium text-gray-700 flex-grow ml-3">Estoque Baixo</span>
                </div>
                <p className="text-2xl font-semibold text-center mt-2 text-red-600">{produtosBaixoEstoque}</p>
              </div>
            </div>
          </div>

          {/* Barra de busca e filtros */}
          <div className="flex flex-wrap gap-2 items-center mb-4">
            {/* Barra de busca */}
            <div className="relative flex-grow min-w-[200px]">
              <input
                type="text"
                placeholder="Busque por código, nome ou marca"
                className="p-2 pl-10 h-10 w-full border-2 border-gray-200 rounded-lg text-black"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <FontAwesomeIcon 
                icon={faSearch} 
                className="absolute left-3 top-3 text-gray-400"
              />
            </div>

            {/* Filtro por loja */}
            <select
              value={selectedLoja}
              onChange={(e) => setSelectedLoja(e.target.value)}
              className="p-2 h-10 border-2 border-gray-200 rounded-lg text-gray-800 w-32"
            >
              {userPermissions?.isAdmin && <option value="Ambas">Ambas Lojas</option>}
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
                {(categoriaFilter !== 'Todas' || estoqueFilter !== 'Todos') && (
                  <span className="ml-1 bg-[#81059e] text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                    {(categoriaFilter !== 'Todas' ? 1 : 0) + (estoqueFilter !== 'Todos' ? 1 : 0)}
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
                        setCategoriaFilter('Todas');
                        setEstoqueFilter('Todos');
                      }}
                      className="text-xs text-[#81059e] hover:underline"
                    >
                      Limpar Filtros
                    </button>
                  </div>

                  <div className="space-y-3">
                    {/* Filtro de categoria */}
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Categoria</label>
                      <select
                        value={categoriaFilter}
                        onChange={(e) => setCategoriaFilter(e.target.value)}
                        className="p-2 h-9 w-full border border-gray-200 rounded-lg text-gray-800 text-sm"
                      >
                        {categorias.map(categoria => (
                          <option key={categoria.value} value={categoria.value}>
                            {categoria.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Filtro de nível de estoque */}
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Nível de Estoque</label>
                      <select
                        value={estoqueFilter}
                        onChange={(e) => setEstoqueFilter(e.target.value)}
                        className="p-2 h-9 w-full border border-gray-200 rounded-lg text-gray-800 text-sm"
                      >
                        {niveisEstoque.map(nivel => (
                          <option key={nivel.value} value={nivel.value}>
                            {nivel.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="pt-2">
                      <button
                        onClick={() => setShowFilterDropdown(false)}
                        className="w-full bg-[#81059e] text-white rounded-lg p-2 text-sm hover:bg-[#690480]"
                      >
                        Aplicar Filtros
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Botões de ação */}
            <div className="flex gap-2">
              {/* Botão Adicionar Produto */}
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-green-500 text-white h-10 px-4 rounded-lg flex items-center justify-center gap-1 hover:bg-green-600 transition"
              >
                <FontAwesomeIcon icon={faPlus} className="h-4 w-4" />
                <span className="hidden sm:inline">Adicionar</span>
              </button>

              {/* Botão Atualizar */}
              <button
                onClick={() => window.location.reload()}
                className="bg-blue-500 text-white h-10 w-10 rounded-lg flex items-center justify-center hover:bg-blue-600 transition"
              >
                <FontAwesomeIcon icon={faSync} className="h-4 w-4" />
              </button>
            </div>
          </div>

          <FilterActiveBadges />

          {/* Tabela de produtos */}
          {loading ? (
            <div className="flex justify-center items-center py-10">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#81059e]"></div>
            </div>
          ) : error ? (
            <div className="bg-red-100 text-red-700 p-4 rounded-lg">
              {error}
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              {filteredProdutos.length === 0 ? (
                <div className="bg-gray-100 p-6 rounded-lg text-center">
                  <p className="text-lg text-gray-600">Nenhum produto encontrado com os filtros atuais.</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="min-w-full table-auto select-none">
                      <thead>
                        <tr className="bg-[#81059e] text-white">
                          <th className="px-3 py-2 cursor-pointer" onClick={() => handleSort('loja')}>
                            Loja {renderSortArrow('loja')}
                          </th>
                          <th className="px-3 py-2 cursor-pointer" onClick={() => handleSort('categoria')}>
                            Categoria {renderSortArrow('categoria')}
                          </th>
                          <th className="px-3 py-2 cursor-pointer" onClick={() => handleSort('codigo')}>
                            Código {renderSortArrow('codigo')}
                          </th>
                          <th className="px-3 py-2 cursor-pointer" onClick={() => handleSort('nome')}>
                            Nome {renderSortArrow('nome')}
                          </th>
                          <th className="px-3 py-2 cursor-pointer" onClick={() => handleSort('marca')}>
                            Marca {renderSortArrow('marca')}
                          </th>
                          <th className="px-3 py-2 cursor-pointer" onClick={() => handleSort('quantidade')}>
                            Quantidade {renderSortArrow('quantidade')}
                          </th>
                          <th className="px-3 py-2 cursor-pointer" onClick={() => handleSort('precoCusto')}>
                            Preço Custo {renderSortArrow('precoCusto')}
                          </th>
                          <th className="px-3 py-2 cursor-pointer" onClick={() => handleSort('preco')}>
                            Preço Venda {renderSortArrow('preco')}
                          </th>
                          <th className="px-3 py-2">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentProdutos.map((produto) => (
                          <tr key={`${produto.id}-${produto.loja}-${produto.categoria}`} className="text-black text-left hover:bg-gray-100">
                            <td className="border px-3 py-2">
                              {produto.loja === 'loja1' ? 'Loja 1' : 'Loja 2'}
                            </td>
                            <td className="border px-3 py-2 capitalize">
                              {produto.categoria === 'armacoes' ? 'Armação' : 
                               produto.categoria === 'lentes' ? 'Lente' : 'Solar'}
                            </td>
                            <td className="border px-3 py-2">
                              {produto.codigo || 'N/A'}
                            </td>
                            <td className="border px-3 py-2 max-w-[250px] truncate">
                              {produto.nome || 'N/A'}
                            </td>
                            <td className="border px-3 py-2">
                              {produto.marca || 'N/A'}
                            </td>
                            <td className="border px-3 py-2">
                              {editingId === produto.id && editingField === 'quantidade' ? (
                                <div className="flex items-center">
                                  <input
                                    type="number"
                                    min="0"
                                    className="w-16 border rounded px-2 py-1 text-center"
                                    value={editingValue}
                                    onChange={(e) => setEditingValue(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleUpdateQuantidade();
                                      if (e.key === 'Escape') cancelEditing();
                                    }}
                                    autoFocus
                                  />
                                  <button
                                    onClick={handleUpdateQuantidade}
                                    className="ml-1 text-green-600 hover:text-green-800"
                                    title="Salvar"
                                  >
                                    <FontAwesomeIcon icon={faCheck} className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={cancelEditing}
                                    className="ml-1 text-red-600 hover:text-red-800"
                                    title="Cancelar"
                                  >
                                    <FontAwesomeIcon icon={faTimes} className="h-4 w-4" />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center">
                                  {renderEstoqueStatus(produto.quantidade)}
                                  <button
                                    onClick={() => startEditing(produto.id, 'quantidade', produto.quantidade)}
                                    className="ml-2 text-blue-500 hover:text-blue-700"
                                  >
                                    <FontAwesomeIcon icon={faEdit} className="h-4 w-4" />
                                  </button>
                                </div>
                              )}
                            </td>
                            <td className="border px-3 py-2">
                              {editingId === produto.id && editingField === 'precoCusto' ? (
                                <div className="flex items-center">
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    className="w-20 border rounded px-2 py-1 text-center"
                                    value={editingValue}
                                    onChange={(e) => setEditingValue(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleUpdateQuantidade();
                                      if (e.key === 'Escape') cancelEditing();
                                    }}
                                    autoFocus
                                  />
                                  <button
                                    onClick={handleUpdateQuantidade}
                                    className="ml-1 text-green-600 hover:text-green-800"
                                    title="Salvar"
                                  >
                                    <FontAwesomeIcon icon={faCheck} className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={cancelEditing}
                                    className="ml-1 text-red-600 hover:text-red-800"
                                    title="Cancelar"
                                  >
                                    <FontAwesomeIcon icon={faTimes} className="h-4 w-4" />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center">
                                  <span>R$ {parseFloat(produto.precoCusto || 0).toFixed(2)}</span>
                                  <button
                                    onClick={() => startEditing(produto.id, 'precoCusto', produto.precoCusto || 0)}
                                    className="ml-2 text-blue-500 hover:text-blue-700"
                                  >
                                    <FontAwesomeIcon icon={faEdit} className="h-4 w-4" />
                                  </button>
                                </div>
                              )}
                            </td>
                            <td className="border px-3 py-2">
                              {editingId === produto.id && editingField === 'preco' ? (
                                <div className="flex items-center">
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    className="w-20 border rounded px-2 py-1 text-center"
                                    value={editingValue}
                                    onChange={(e) => setEditingValue(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleUpdateQuantidade();
                                      if (e.key === 'Escape') cancelEditing();
                                    }}
                                    autoFocus
                                  />
                                  <button
                                    onClick={handleUpdateQuantidade}
                                    className="ml-1 text-green-600 hover:text-green-800"
                                    title="Salvar"
                                  >
                                    <FontAwesomeIcon icon={faCheck} className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={cancelEditing}
                                    className="ml-1 text-red-600 hover:text-red-800"
                                    title="Cancelar"
                                  >
                                    <FontAwesomeIcon icon={faTimes} className="h-4 w-4" />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center">
                                  <span>R$ {parseFloat(produto.preco || 0).toFixed(2)}</span>
                                  <button
                                    onClick={() => startEditing(produto.id, 'preco', produto.preco || 0)}
                                    className="ml-2 text-blue-500 hover:text-blue-700"
                                  >
                                    <FontAwesomeIcon icon={faEdit} className="h-4 w-4" />
                                  </button>
                                </div>
                              )}
                            </td>
                            <td className="border px-3 py-2">
                              <div className="flex items-center space-x-1">
                                <button
                                  onClick={() => openTransferModal(produto)}
                                  className="p-1 bg-orange-500 text-white rounded hover:bg-orange-600 transition"
                                  title="Transferir para outra loja"
                                >
                                  <FontAwesomeIcon icon={faExchange} className="h-4 w-4" />
                                </button>
                              </div>
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
                        {Math.min(indexOfLastItem, filteredProdutos.length)}
                      </span>{' '}
                      de <span className="font-medium">{filteredProdutos.length}</span> produtos
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

          {/* Modal de Adicionar Produto */}
          {showAddModal && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
              <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
                <div className="bg-[#81059e] text-white p-4 rounded-t-lg">
                  <h3 className="text-xl font-bold">Adicionar Novo Produto</h3>
                </div>

                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <h4 className="text-lg font-semibold text-center">Selecione o tipo de produto:</h4>
                    
                    <Link href="/products_and_services/frames/add-frame">
                      <div className="p-4 border-2 border-gray-200 rounded-lg hover:border-[#81059e] hover:bg-purple-50 cursor-pointer transition">
                        <h5 className="text-center font-medium text-[#81059e]">Armação</h5>
                      </div>
                    </Link>
                    
                    <Link href="/products_and_services/lenses/add-lense">
                      <div className="p-4 border-2 border-gray-200 rounded-lg hover:border-[#81059e] hover:bg-purple-50 cursor-pointer transition">
                        <h5 className="text-center font-medium text-[#81059e]">Lente</h5>
                      </div>
                    </Link>
                    
                    <Link href="/products_and_services/solar">
                      <div className="p-4 border-2 border-gray-200 rounded-lg hover:border-[#81059e] hover:bg-purple-50 cursor-pointer transition">
                        <h5 className="text-center font-medium text-[#81059e]">Óculos Solar</h5>
                      </div>
                    </Link>
                  </div>
                </div>

                <div className="bg-gray-100 px-6 py-4 rounded-b-lg flex justify-end">
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modal de Transferência de Estoque */}
          {showTransferModal && selectedProduto && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
              <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
                <div className="bg-[#81059e] text-white p-4 rounded-t-lg">
                  <h3 className="text-xl font-bold">Transferir Produto</h3>
                </div>

                <div className="p-6 space-y-4">
                  <div>
                    <p className="text-lg font-semibold mb-2">{selectedProduto.nome}</p>
                    <p>
                      <span className="font-medium">Código:</span> {selectedProduto.codigo}
                    </p>
                    <p>
                      <span className="font-medium">Marca:</span> {selectedProduto.marca}
                    </p>
                    <p>
                      <span className="font-medium">Loja Atual:</span> {selectedProduto.loja === 'loja1' ? 'Loja 1' : 'Loja 2'}
                    </p>
                    <p>
                      <span className="font-medium">Quantidade Disponível:</span> {selectedProduto.quantidade}
                    </p>
                  </div>

                  <div className="border-t pt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Transferir para:
                    </label>
                    <select
                      value={transferDestino}
                      onChange={(e) => setTransferDestino(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    >
                      {selectedProduto.loja === 'loja1' ? (
                        <option value="loja2">Loja 2</option>
                      ) : (
                        <option value="loja1">Loja 1</option>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quantidade a transferir:
                    </label>
                    <input
                      type="number"
                      min="1"
                      max={selectedProduto.quantidade}
                      value={transferQuantidade}
                      onChange={(e) => setTransferQuantidade(parseInt(e.target.value))}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                    {transferQuantidade > selectedProduto.quantidade && (
                      <p className="text-red-500 text-sm mt-1">
                        Quantidade excede o estoque disponível.
                      </p>
                    )}
                  </div>
                </div>

                <div className="bg-gray-100 px-6 py-4 rounded-b-lg flex justify-end space-x-2">
                  <button
                    onClick={() => setShowTransferModal(false)}
                    className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleTransferencia}
                    disabled={transferQuantidade <= 0 || transferQuantidade > selectedProduto.quantidade}
                    className={`px-4 py-2 rounded-md ${
                      transferQuantidade <= 0 || transferQuantidade > selectedProduto.quantidade
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-[#81059e] hover:bg-[#690480]'
                    } text-white transition`}
                  >
                    Transferir
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