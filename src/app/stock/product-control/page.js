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
  faExchange,
  faArrowUp,
  faArrowDown,
  faEye,
  faPencilAlt,
  faTable,
  faThLarge,
  faTrash,
  faTimes,
  faQrcode
} from '@fortawesome/free-solid-svg-icons';
import { collection, getDocs, doc, updateDoc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
import { firestore } from '../../../lib/firebaseConfig';
import QRCode from 'qrcodejs';

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
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);
  const [sortField, setSortField] = useState('titulo');
  const [sortDirection, setSortDirection] = useState('asc');
  const [transferQuantidade, setTransferQuantidade] = useState(1);
  const [transferDestino, setTransferDestino] = useState('');
  const [categoriaFilter, setCategoriaFilter] = useState('Todas');
  const [estoqueFilter, setEstoqueFilter] = useState('Todos');
  const [viewMode, setViewMode] = useState('table'); // 'table' ou 'grid'
  const [faixaPrecoFilter, setFaixaPrecoFilter] = useState('Todas');
  const [selectedItems, setSelectedItems] = useState({});
  const [selectAll, setSelectAll] = useState(false);

  // Função para buscar os produtos do estoque de todas as lojas
  useEffect(() => {
    const fetchProdutos = async () => {
      try {
        setLoading(true);
        const produtosData = [];

        // Mapeamento de categorias para o caminho correto no banco de dados
        const categoriasMapeadas = {
          'armacoes': 'armacoes',
          'lentes': 'lentes',
          'solares': 'solares'
        };

        const categoriasEstoque = ['armacoes', 'lentes', 'solares'];
        const lojas = userPermissions?.lojas || ['loja1', 'loja2'];

        // Para cada loja e categoria, buscar os produtos
        for (const loja of lojas) {
          for (const categoria of categoriasEstoque) {
            try {
              // Caminho para o Firestore
              const produtosRef = collection(firestore, `estoque/${loja}/${categoria}`);
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
            } catch (err) {
              console.error(`Erro ao buscar produtos da categoria ${categoria} na loja ${loja}:`, err);
            }
          }
        }

        // Calcular estatísticas
        const produtosLoja1Count = produtosData.filter(p => p.loja === 'loja1').length;
        const produtosLoja2Count = produtosData.filter(p => p.loja === 'loja2').length;

        // Considerando que a quantidade está armazenada como string, convertemos para número
        const produtosBaixoEstoqueCount = produtosData.filter(p => parseInt(p.quantidade) < 10).length;

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
      if (field === 'quantidade' || field === 'valor' || field === 'custo' || field === 'custo_medio') {
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
            (produto.titulo?.toLowerCase().includes(searchQuery.toLowerCase()) || '') ||
            (produto.marca?.toLowerCase().includes(searchQuery.toLowerCase()) || '') ||
            (produto.sku?.toLowerCase().includes(searchQuery.toLowerCase()) || '')
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
        filtered = filtered.filter((produto) => parseInt(produto.quantidade) < 10);
      } else if (estoqueFilter === 'Normal') {
        filtered = filtered.filter((produto) => parseInt(produto.quantidade) >= 10 && parseInt(produto.quantidade) < 50);
      } else if (estoqueFilter === 'Alto') {
        filtered = filtered.filter((produto) => parseInt(produto.quantidade) >= 50);
      }

      // Filtro por faixa de preço
      if (faixaPrecoFilter === 'Baixo') {
        filtered = filtered.filter((produto) => parseFloat(produto.valor) < 100);
      } else if (faixaPrecoFilter === 'Médio') {
        filtered = filtered.filter((produto) => parseFloat(produto.valor) >= 100 && parseFloat(produto.valor) < 300);
      } else if (faixaPrecoFilter === 'Alto') {
        filtered = filtered.filter((produto) => parseFloat(produto.valor) >= 300);
      }

      // Aplicar ordenação
      filtered = sortProdutos(filtered, sortField, sortDirection);
      setFilteredProdutos(filtered);
    };

    filterProdutos();
  }, [searchQuery, selectedLoja, categoriaFilter, estoqueFilter, faixaPrecoFilter, produtos, sortField, sortDirection]);

  // Funções para gerenciar paginação
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentProdutos = filteredProdutos.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredProdutos.length / itemsPerPage);

  const goToPage = (pageNumber) => {
    setCurrentPage(Math.max(1, Math.min(pageNumber, totalPages)));
  };

  // Seleção de produtos
  const toggleItemSelection = (produto) => {
    const produtoKey = `${produto.id}-${produto.loja}-${produto.categoria}`;
    setSelectedItems(prev => ({
      ...prev,
      [produtoKey]: !prev[produtoKey]
    }));

    // Verificar se todos estão selecionados
    const allSelected = Object.values(selectedItems).every(selected => selected === true);
    setSelectAll(allSelected);
  };

  const toggleSelectAll = () => {
    const newSelectAll = !selectAll;
    setSelectAll(newSelectAll);

    const newSelectedItems = {};
    currentProdutos.forEach(produto => {
      const produtoKey = `${produto.id}-${produto.loja}-${produto.categoria}`;
      newSelectedItems[produtoKey] = newSelectAll;
    });

    setSelectedItems(newSelectedItems);
  };

  // Verificar se algum item está selecionado
  const hasSelectedItems = () => {
    return Object.values(selectedItems).some(selected => selected === true);
  };

  // Contar quantos itens estão selecionados
  const countSelectedItems = () => {
    return Object.values(selectedItems).filter(selected => selected === true).length;
  };

  // Funções para abrir modais
  const openDetailModal = (produto) => {
    setSelectedProduto(produto);
    setShowDetailModal(true);
  };

  const openTransferModal = () => {
    // Encontrar o primeiro produto selecionado
    const selectedKeys = Object.keys(selectedItems).filter(key => selectedItems[key]);
    if (selectedKeys.length > 0) {
      const [id, loja, categoria] = selectedKeys[0].split('-');
      const produto = produtos.find(p => p.id === id && p.loja === loja && p.categoria === categoria);
      setSelectedProduto(produto);
      setTransferQuantidade(1);
      setTransferDestino(produto.loja === 'loja1' ? 'loja2' : 'loja1');
      setShowTransferModal(true);
    }
  };

  const openDeleteModal = () => {
    // Se apenas um produto está selecionado, mostra esse produto no modal
    const selectedKeys = Object.keys(selectedItems).filter(key => selectedItems[key]);
    if (selectedKeys.length === 1) {
      const [id, loja, categoria] = selectedKeys[0].split('-');
      const produto = produtos.find(p => p.id === id && p.loja === loja && p.categoria === categoria);
      setSelectedProduto(produto);
    } else {
      // Se vários produtos estão selecionados, deixa selectedProduto como null
      setSelectedProduto(null);
    }
    setShowDeleteModal(true);
  };

  // Obter produtos selecionados
  const getSelectedProducts = () => {
    return Object.keys(selectedItems)
      .filter(key => selectedItems[key])
      .map(key => {
        const [id, loja, categoria] = key.split('-');
        return produtos.find(p => p.id === id && p.loja === loja && p.categoria === categoria);
      });
  };

  // Função para realizar a transferência de estoque
  const handleTransferencia = async () => {
    if (!selectedProduto || transferQuantidade <= 0) return;

    try {
      // Verificar se o produto existe na loja de destino
      const produtoOrigemRef = doc(firestore, `estoque/${selectedProduto.loja}/${selectedProduto.categoria}`, selectedProduto.id);
      const produtoDestinoRef = doc(firestore, `estoque/${transferDestino}/${selectedProduto.categoria}`, selectedProduto.id);

      const produtoOrigemSnap = await getDoc(produtoOrigemRef);
      const produtoDestinoSnap = await getDoc(produtoDestinoRef);

      if (!produtoOrigemSnap.exists()) {
        alert('Produto não encontrado na loja de origem.');
        return;
      }

      const produtoOrigemData = produtoOrigemSnap.data();

      // Verificar se há estoque suficiente
      if (parseInt(produtoOrigemData.quantidade) < transferQuantidade) {
        alert('Quantidade insuficiente para transferência.');
        return;
      }

      // Atualizar estoque na origem
      await updateDoc(produtoOrigemRef, {
        quantidade: (parseInt(produtoOrigemData.quantidade) - transferQuantidade).toString()
      });

      // Se o produto existe no destino, adicionar à quantidade. Caso contrário, criar.
      if (produtoDestinoSnap.exists()) {
        const produtoDestinoData = produtoDestinoSnap.data();
        await updateDoc(produtoDestinoRef, {
          quantidade: (parseInt(produtoDestinoData.quantidade) + transferQuantidade).toString()
        });
      } else {
        // Criar produto na loja de destino com os mesmos dados mas quantidade transferida
        const newProdutoData = {
          ...produtoOrigemData,
          quantidade: transferQuantidade.toString()
        };
        await setDoc(produtoDestinoRef, newProdutoData);
      }

      // Atualizar estado local
      const updatedProdutos = produtos.map(p => {
        if (p.id === selectedProduto.id && p.loja === selectedProduto.loja && p.categoria === selectedProduto.categoria) {
          return { ...p, quantidade: (parseInt(p.quantidade) - transferQuantidade).toString() };
        }

        if (p.id === selectedProduto.id && p.loja === transferDestino && p.categoria === selectedProduto.categoria) {
          return { ...p, quantidade: (parseInt(p.quantidade) + transferQuantidade).toString() };
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
          quantidade: transferQuantidade.toString()
        };
        updatedProdutos.push(novoProduto);
      }

      setProdutos(updatedProdutos);
      setFilteredProdutos(sortProdutos(updatedProdutos, sortField, sortDirection));

      // Limpar seleções
      setSelectedItems({});
      setSelectAll(false);

      alert('Transferência realizada com sucesso!');
      setShowTransferModal(false);
    } catch (error) {
      console.error('Erro ao transferir estoque:', error);
      alert('Erro ao realizar a transferência. Por favor, tente novamente.');
    }
  };

  // Função para excluir produtos
  const handleDelete = async () => {
    const selectedProducts = getSelectedProducts();

    if (selectedProducts.length === 0) return;

    try {
      // Excluir cada produto selecionado
      for (const produto of selectedProducts) {
        const produtoRef = doc(firestore, `estoque/${produto.loja}/${produto.categoria}`, produto.id);
        await deleteDoc(produtoRef);
      }

      // Atualizar o estado local removendo os produtos excluídos
      const updatedProdutos = produtos.filter(produto => {
        const produtoKey = `${produto.id}-${produto.loja}-${produto.categoria}`;
        return !selectedItems[produtoKey];
      });

      setProdutos(updatedProdutos);
      setFilteredProdutos(sortProdutos(updatedProdutos, sortField, sortDirection));

      // Recalcular estatísticas
      const produtosLoja1Count = updatedProdutos.filter(p => p.loja === 'loja1').length;
      const produtosLoja2Count = updatedProdutos.filter(p => p.loja === 'loja2').length;
      const produtosBaixoEstoqueCount = updatedProdutos.filter(p => parseInt(p.quantidade) < 10).length;

      setTotalProdutos(updatedProdutos.length);
      setProdutosLoja1(produtosLoja1Count);
      setProdutosLoja2(produtosLoja2Count);
      setProdutosBaixoEstoque(produtosBaixoEstoqueCount);

      // Limpar seleções
      setSelectedItems({});
      setSelectAll(false);

      alert(`${selectedProducts.length} produto(s) excluído(s) com sucesso!`);
      setShowDeleteModal(false);
    } catch (error) {
      console.error('Erro ao excluir produtos:', error);
      alert('Erro ao excluir produtos. Por favor, tente novamente.');
    }
  };

  // Renderizar status de estoque com cor baseada na quantidade
  const renderEstoqueStatus = (quantidade) => {
    const qtd = parseInt(quantidade);
    if (qtd < 10) {
      return <span className="text-red-600 font-bold">{quantidade}</span>;
    } else if (qtd < 50) {
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

  // Filtros para faixa de preço
  const faixasPreco = [
    { value: 'Todas', label: 'Todas Faixas' },
    { value: 'Baixo', label: 'Preço Baixo (<R$100)' },
    { value: 'Médio', label: 'Preço Médio (R$100-R$300)' },
    { value: 'Alto', label: 'Preço Alto (>R$300)' }
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

    if (faixaPrecoFilter !== 'Todas') {
      activeFilters.push({ type: 'Preço', value: faixasPreco.find(f => f.value === faixaPrecoFilter)?.label });
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
                if (filter.type === 'Preço') setFaixaPrecoFilter('Todas');
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
            setFaixaPrecoFilter('Todas');
          }}
        >
          Limpar todos
        </button>
      </div>
    );
  };

  // Renderização da visualização em grid/cards
  const renderGridView = () => {
    if (currentProdutos.length === 0) {
      return (
        <div className="bg-gray-100 p-6 rounded-lg text-center">
          <p className="text-lg text-gray-600">Nenhum produto encontrado com os filtros atuais.</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {currentProdutos.map((produto) => {
          const produtoKey = `${produto.id}-${produto.loja}-${produto.categoria}`;
          return (
            <div
              key={produtoKey}
              className="bg-white rounded-sm shadow-md overflow-hidden border-2 border-purple-200 hover:shadow-lg transition-shadow"
            >
              <div className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <input
                      type="checkbox"
                      checked={!!selectedItems[produtoKey]}
                      onChange={() => toggleItemSelection(produto)}
                      className="mr-2"
                    />
                  </div>
                  <div className="flex justify-center mb-3 flex-grow">
                    {produto.imagem ? (
                      <img
                        src={produto.imagem}
                        alt={produto.titulo || 'Produto'}
                        className="h-32 w-32 object-contain cursor-pointer"
                        onClick={() => openDetailModal(produto)}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '/api/placeholder/200/200';
                        }}
                      />
                    ) : (
                      <div
                        className="h-32 w-32 bg-gray-200 flex items-center justify-center cursor-pointer"
                        onClick={() => openDetailModal(produto)}
                      >
                        <FontAwesomeIcon icon={faBox} className="text-gray-400 text-4xl" />
                      </div>
                    )}
                  </div>
                </div>

                <h3
                  className="font-bold text-[#81059e] truncate cursor-pointer"
                  title={produto.titulo}
                  onClick={() => openDetailModal(produto)}
                >
                  {produto.titulo || 'Sem título'}
                </h3>

                <div className="mt-2 text-sm">
                  <p className="text-gray-700">
                    <span className="font-semibold">Código:</span> {produto.codigo || 'N/A'}
                  </p>
                  <p className="text-gray-700">
                    <span className="font-semibold">Marca:</span> {produto.marca || 'N/A'}
                  </p>
                  <p className="text-gray-700">
                    <span className="font-semibold">Loja:</span> {produto.loja === 'loja1' ? 'Loja 1' : 'Loja 2'}
                  </p>
                  <p className="text-gray-700">
                    <span className="font-semibold">Qtd:</span> {renderEstoqueStatus(produto.quantidade)}
                  </p>
                  <p className="text-gray-700">
                    <span className="font-semibold">Preço:</span> R$ {parseFloat(produto.valor || 0).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Renderização da visualização em tabela
  const renderTableView = () => {
    if (filteredProdutos.length === 0) {
      return (
        <div className="bg-gray-100 p-6 rounded-lg text-center">
          <p className="text-lg text-gray-600">Nenhum produto encontrado com os filtros atuais.</p>
        </div>
      );
    }

    return (
      <table className="min-w-full table-auto select-none">
        <thead>
          <tr className="bg-[#81059e] text-white">
            <th className="px-3 py-2 w-10">
              <input
                type="checkbox"
                checked={selectAll}
                onChange={toggleSelectAll}
              />
            </th>
            <th className="px-3 py-2 w-14"></th> {/* Coluna para imagem */}
            <th className="px-3 py-2 cursor-pointer" onClick={() => handleSort('loja')}>
              Loja {renderSortArrow('loja')}
            </th>
            <th className="px-3 py-2 cursor-pointer" onClick={() => handleSort('categoria')}>
              Categoria {renderSortArrow('categoria')}
            </th>
            <th className="px-3 py-2 cursor-pointer" onClick={() => handleSort('codigo')}>
              Código {renderSortArrow('codigo')}
            </th>
            <th className="px-3 py-2 cursor-pointer" onClick={() => handleSort('titulo')}>
              Título {renderSortArrow('titulo')}
            </th>
            <th className="px-3 py-2 cursor-pointer" onClick={() => handleSort('marca')}>
              Marca {renderSortArrow('marca')}
            </th>
            <th className="px-3 py-2 cursor-pointer" onClick={() => handleSort('quantidade')}>
              Quantidade {renderSortArrow('quantidade')}
            </th>
            <th className="px-3 py-2 cursor-pointer" onClick={() => handleSort('custo')}>
              Preço Custo {renderSortArrow('custo')}
            </th>
            <th className="px-3 py-2 cursor-pointer" onClick={() => handleSort('valor')}>
              Preço Venda {renderSortArrow('valor')}
            </th>
          </tr>
        </thead>
        <tbody>
          {currentProdutos.map((produto) => {
            const produtoKey = `${produto.id}-${produto.loja}-${produto.categoria}`;
            return (
              <tr
                key={produtoKey}
                className="text-black text-left hover:bg-gray-100 cursor-pointer"
                onClick={() => openDetailModal(produto)}
              >
                <td className="border px-1 py-1 text-center" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={!!selectedItems[produtoKey]}
                    onChange={() => toggleItemSelection(produto)}
                    className="cursor-pointer"
                  />
                </td>
                <td className="border px-1 py-1 text-center">
                  <div className="w-10 h-10 mx-auto">
                    {produto.imagem ? (
                      <img
                        src={produto.imagem}
                        alt={produto.titulo || 'Produto'}
                        className="w-10 h-10 object-contain rounded"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '/api/placeholder/40/40';
                        }}
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gray-200 flex items-center justify-center rounded">
                        <FontAwesomeIcon icon={faBox} className="text-gray-400" />
                      </div>
                    )}
                  </div>
                </td>
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
                  <div className="flex items-center">
                    <span className="truncate hover:text-[#81059e]">
                      {produto.titulo || 'N/A'}
                    </span>
                  </div>
                </td>
                <td className="border px-3 py-2">
                  {produto.marca || 'N/A'}
                </td>
                <td className="border px-3 py-2">
                  {renderEstoqueStatus(produto.quantidade)}
                </td>
                <td className="border px-3 py-2">
                  <span>R$ {parseFloat(produto.custo || 0).toFixed(2)}</span>
                </td>
                <td className="border px-3 py-2">
                  <span>R$ {parseFloat(produto.valor || 0).toFixed(2)}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  };

  // Adicionar esta função antes do componente principal
  const generateQRCode = (data) => {
    if (!data) return null;

    const qrCodeData = {
      id: data.codigo,
      nome: data.titulo,
      marca: data.marca,
      tipo: data.categoria
    };

    return JSON.stringify(qrCodeData);
  };

  // Adicionar este useEffect para gerar o QR code quando o modal é aberto
  useEffect(() => {
    if (showDetailModal && selectedProduto) {
      const qrData = generateQRCode(selectedProduto);
      if (qrData) {
        // Limpar o elemento QR code existente
        const qrElement = document.getElementById(`qrcode-${selectedProduto.id}`);
        if (qrElement) {
          qrElement.innerHTML = '';

          // Criar novo QR code
          const qr = new QRCode(qrElement, {
            text: qrData,
            width: 192,
            height: 192,
            colorDark: '#81059e',
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.H
          });
        }
      }
    }
  }, [showDetailModal, selectedProduto]);

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
                placeholder="Busque por código, título, marca ou SKU"
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

            {/* Modo de visualização */}
            <div className="flex h-10 border-2 border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('table')}
                className={`flex items-center justify-center px-3 ${viewMode === 'table' ? 'bg-[#81059e] text-white' : 'bg-white text-gray-700'}`}
                title="Visualização em Tabela"
              >
                <FontAwesomeIcon icon={faTable} />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center justify-center px-3 ${viewMode === 'grid' ? 'bg-[#81059e] text-white' : 'bg-white text-gray-700'}`}
                title="Visualização em Grade"
              >
                <FontAwesomeIcon icon={faThLarge} />
              </button>
            </div>

            {/* Dropdown de filtros */}
            <div className="relative">
              <button
                data-filter-toggle="true"
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                className="p-2 h-10 border-2 border-gray-200 rounded-lg bg-white flex items-center gap-1 text-[#81059e]"
              >
                <FontAwesomeIcon icon={faFilter} className="h-4 w-4" />
                <span className="hidden sm:inline">Filtrar</span>
                {(categoriaFilter !== 'Todas' || estoqueFilter !== 'Todos' || faixaPrecoFilter !== 'Todas') && (
                  <span className="ml-1 bg-[#81059e] text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                    {(categoriaFilter !== 'Todas' ? 1 : 0) +
                      (estoqueFilter !== 'Todos' ? 1 : 0) +
                      (faixaPrecoFilter !== 'Todas' ? 1 : 0)}
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
                        setFaixaPrecoFilter('Todas');
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

                    {/* Filtro de faixa de preço */}
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Faixa de Preço</label>
                      <select
                        value={faixaPrecoFilter}
                        onChange={(e) => setFaixaPrecoFilter(e.target.value)}
                        className="p-2 h-9 w-full border border-gray-200 rounded-lg text-gray-800 text-sm"
                      >
                        {faixasPreco.map(faixa => (
                          <option key={faixa.value} value={faixa.value}>
                            {faixa.label}
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

          <FilterActiveBadges />

          {/* Barra de Ações */}
          <div className={`flex gap-2 items-center py-3 px-4 bg-gray-100 rounded-lg mb-4 ${hasSelectedItems() ? 'visible' : 'invisible'}`}>
            <span className="text-sm text-gray-700 mr-3">
              {countSelectedItems()} item(s) selecionado(s)
            </span>

            <button
              onClick={openDetailModal}
              disabled={countSelectedItems() !== 1}
              className={`flex items-center gap-1 px-3 py-1 rounded ${countSelectedItems() !== 1 ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
            >
              <FontAwesomeIcon icon={faEye} className="h-3 w-3" />
              <span className="text-sm">Ver</span>
            </button>

            <Link href={
              countSelectedItems() === 1
                ? (() => {
                  const selected = getSelectedProducts()[0];
                  return `/products_and_services/${selected.categoria === 'armacoes' ? 'frames' : selected.categoria === 'lentes' ? 'lenses' : 'solar'}/edit?id=${selected.id}&loja=${selected.loja}`;
                })()
                : '#'
            }>
              <button
                disabled={countSelectedItems() !== 1}
                className={`flex items-center gap-1 px-3 py-1 rounded ${countSelectedItems() !== 1 ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-green-500 text-white hover:bg-green-600'}`}
              >
                <FontAwesomeIcon icon={faPencilAlt} className="h-3 w-3" />
                <span className="text-sm">Editar</span>
              </button>
            </Link>

            <button
              onClick={openTransferModal}
              disabled={countSelectedItems() !== 1}
              className={`flex items-center gap-1 px-3 py-1 rounded ${countSelectedItems() !== 1 ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-orange-500 text-white hover:bg-orange-600'}`}
            >
              <FontAwesomeIcon icon={faExchange} className="h-3 w-3" />
              <span className="text-sm">Transferir</span>
            </button>

            <button
              onClick={openDeleteModal}
              className="flex items-center gap-1 px-3 py-1 rounded bg-red-500 text-white hover:bg-red-600"
            >
              <FontAwesomeIcon icon={faTrash} className="h-3 w-3" />
              <span className="text-sm">Excluir</span>
            </button>
          </div>

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
                    {viewMode === 'table' ? renderTableView() : renderGridView()}
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
                <div className="bg-[#81059e] text-white p-4 rounded-t-lg flex justify-between items-center">
                  <h3 className="text-xl font-bold">Adicionar Novo Produto</h3>
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="text-white hover:text-gray-200 focus:outline-none"
                  >
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
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
                <div className="bg-[#81059e] text-white p-4 rounded-t-lg flex justify-between items-center">
                  <h3 className="text-xl font-bold">Transferir Produto</h3>
                  <button
                    onClick={() => setShowTransferModal(false)}
                    className="text-white hover:text-gray-200 focus:outline-none"
                  >
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                </div>

                <div className="p-6 space-y-4">
                  <div>
                    <p className="text-lg font-semibold mb-2">{selectedProduto.titulo}</p>
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
                    {transferQuantidade > parseInt(selectedProduto.quantidade) && (
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
                    disabled={transferQuantidade <= 0 || transferQuantidade > parseInt(selectedProduto.quantidade)}
                    className={`px-4 py-2 rounded-md ${transferQuantidade <= 0 || transferQuantidade > parseInt(selectedProduto.quantidade)
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

          {/* Modal de Detalhes do Produto */}
          {showDetailModal && selectedProduto && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
              <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="bg-[#81059e] text-white p-4 rounded-t-lg flex justify-between items-center">
                  <h3 className="text-xl font-bold">Detalhes do Produto</h3>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="text-white hover:text-gray-200 focus:outline-none"
                  >
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                </div>

                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Detalhes do produto */}
                    <div>
                      <h4 className="text-xl font-bold text-[#81059e] mb-4">{selectedProduto.titulo || 'Produto sem título'}</h4>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                          <div className="font-medium">Código:</div>
                          <div>{selectedProduto.codigo || 'N/A'}</div>

                          <div className="font-medium">SKU:</div>
                          <div>{selectedProduto.sku || 'N/A'}</div>

                          <div className="font-medium">Categoria:</div>
                          <div>
                            {selectedProduto.categoria === 'armacoes' ? 'Armação' :
                              selectedProduto.categoria === 'lentes' ? 'Lente' : 'Solar'}
                          </div>

                          <div className="font-medium">Marca:</div>
                          <div>{selectedProduto.marca || 'N/A'}</div>

                          <div className="font-medium">Loja:</div>
                          <div>{selectedProduto.loja === 'loja1' ? 'Loja 1' : 'Loja 2'}</div>

                          <div className="font-medium">Fornecedor:</div>
                          <div>{selectedProduto.fornecedor || 'N/A'}</div>

                          <div className="font-medium">Fabricante:</div>
                          <div>{selectedProduto.fabricante || 'N/A'}</div>

                          <div className="font-medium">Quantidade:</div>
                          <div>{selectedProduto.quantidade} unidades</div>

                          <div className="font-medium">Preço de Custo:</div>
                          <div>R$ {parseFloat(selectedProduto.custo || 0).toFixed(2)}</div>

                          <div className="font-medium">Preço de Venda:</div>
                          <div>R$ {parseFloat(selectedProduto.valor || 0).toFixed(2)}</div>

                          <div className="font-medium">Margem de Lucro:</div>
                          <div>{selectedProduto.percentual_lucro || 'N/A'}%</div>
                        </div>

                        {/* Propriedades específicas por categoria */}
                        {(selectedProduto.categoria === 'armacoes' || selectedProduto.categoria === 'solares') && (
                          <div className="mt-4">
                            <h5 className="font-semibold text-[#81059e] mb-2">Especificações Técnicas</h5>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                              {selectedProduto.material && (
                                <>
                                  <div className="font-medium">Material:</div>
                                  <div>{selectedProduto.material}</div>
                                </>
                              )}
                              {selectedProduto.formato && (
                                <>
                                  <div className="font-medium">Formato:</div>
                                  <div>{selectedProduto.formato}</div>
                                </>
                              )}
                              {selectedProduto.cor && (
                                <>
                                  <div className="font-medium">Cor:</div>
                                  <div>{selectedProduto.cor}</div>
                                </>
                              )}
                              {selectedProduto.aro && (
                                <>
                                  <div className="font-medium">Aro:</div>
                                  <div>{selectedProduto.aro}</div>
                                </>
                              )}
                              {selectedProduto.ponte && (
                                <>
                                  <div className="font-medium">Ponte:</div>
                                  <div>{selectedProduto.ponte}</div>
                                </>
                              )}
                              {selectedProduto.haste && (
                                <>
                                  <div className="font-medium">Haste:</div>
                                  <div>{selectedProduto.haste}</div>
                                </>
                              )}
                              {selectedProduto.lente && (
                                <>
                                  <div className="font-medium">Lente:</div>
                                  <div>{selectedProduto.lente}</div>
                                </>
                              )}
                              {selectedProduto.genero && (
                                <>
                                  <div className="font-medium">Gênero:</div>
                                  <div>{selectedProduto.genero}</div>
                                </>
                              )}
                            </div>
                          </div>
                        )}

                        {selectedProduto.categoria === 'lentes' && (
                          <div className="mt-4">
                            <h5 className="font-semibold text-[#81059e] mb-2">Especificações Técnicas</h5>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                              {selectedProduto.material && (
                                <>
                                  <div className="font-medium">Material:</div>
                                  <div>{selectedProduto.material}</div>
                                </>
                              )}
                              {selectedProduto.indice && (
                                <>
                                  <div className="font-medium">Índice:</div>
                                  <div>{selectedProduto.indice}</div>
                                </>
                              )}
                              {selectedProduto.design && (
                                <>
                                  <div className="font-medium">Design:</div>
                                  <div>{selectedProduto.design}</div>
                                </>
                              )}
                              {selectedProduto.diametroDe && selectedProduto.diametroPara && (
                                <>
                                  <div className="font-medium">Diâmetro:</div>
                                  <div>De {selectedProduto.diametroDe} a {selectedProduto.diametroPara}</div>
                                </>
                              )}
                              {selectedProduto.esfericoDe && selectedProduto.esfericoPara && (
                                <>
                                  <div className="font-medium">Esférico:</div>
                                  <div>De {selectedProduto.esfericoDe} a {selectedProduto.esfericoPara}</div>
                                </>
                              )}
                              {selectedProduto.cilindroDe && selectedProduto.cilindroPara && (
                                <>
                                  <div className="font-medium">Cilindro:</div>
                                  <div>De {selectedProduto.cilindroDe} a {selectedProduto.cilindroPara}</div>
                                </>
                              )}
                              {selectedProduto.tecnologia && selectedProduto.tecnologia.length > 0 && (
                                <>
                                  <div className="font-medium">Tecnologias:</div>
                                  <div>{Array.isArray(selectedProduto.tecnologia) ? selectedProduto.tecnologia.join(', ') : selectedProduto.tecnologia}</div>
                                </>
                              )}
                              {selectedProduto.tratamento && selectedProduto.tratamento.length > 0 && (
                                <>
                                  <div className="font-medium">Tratamentos:</div>
                                  <div>{Array.isArray(selectedProduto.tratamento) ? selectedProduto.tratamento.join(', ') : selectedProduto.tratamento}</div>
                                </>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Informações fiscais */}
                        <div className="mt-4">
                          <h5 className="font-semibold text-[#81059e] mb-2">Informações Fiscais</h5>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                            <div className="font-medium">NCM:</div>
                            <div>{selectedProduto.NCM || 'N/A'}</div>

                            <div className="font-medium">CEST:</div>
                            <div>{selectedProduto.CEST || selectedProduto.cest || 'N/A'}</div>

                            <div className="font-medium">CSOSN:</div>
                            <div>{selectedProduto.CSOSN || selectedProduto.csosn || 'N/A'}</div>
                          </div>
                        </div>
                      </div>

                      {/* Botões de ação */}
                      <div className="mt-6 flex space-x-3">
                        <Link href={`/products_and_services/${selectedProduto.categoria === 'armacoes' ? 'frames' : selectedProduto.categoria === 'lentes' ? 'lenses' : 'solar'}/edit?id=${selectedProduto.id}&loja=${selectedProduto.loja}`}>
                          <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition">
                            <FontAwesomeIcon icon={faPencilAlt} className="mr-2" /> Editar Produto
                          </button>
                        </Link>
                        <button
                          onClick={() => {
                            setShowDetailModal(false);
                            openTransferModal();
                          }}
                          className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 transition"
                        >
                          <FontAwesomeIcon icon={faExchange} className="mr-2" /> Transferir
                        </button>
                      </div>
                    </div>

                    {/* Imagem do produto */}
                    <div>
                      <div className="bg-gray-100 rounded-lg p-4 h-full flex flex-col justify-between">
                        <div className="flex-grow flex items-center justify-center">
                          {selectedProduto.imagem ? (
                            <img
                              src={selectedProduto.imagem}
                              alt={selectedProduto.titulo || 'Produto'}
                              className="max-w-full max-h-80 object-contain"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = '/api/placeholder/400/400';
                              }}
                            />
                          ) : (
                            <div className="h-64 w-64 bg-gray-200 flex items-center justify-center">
                              <FontAwesomeIcon icon={faBox} className="text-gray-400 text-6xl" />
                            </div>
                          )}
                        </div>

                        <div className="mt-4 text-center">
                          <div className="font-semibold text-gray-700">Código: {selectedProduto.codigo}</div>
                          <div className="text-gray-600">
                            {selectedProduto.categoria === 'armacoes' ? 'Armação' :
                              selectedProduto.categoria === 'lentes' ? 'Lente' : 'Óculos Solar'} -
                            {selectedProduto.loja === 'loja1' ? ' Loja 1' : ' Loja 2'}
                          </div>
                          <div className="mt-2 font-bold text-lg">
                            R$ {parseFloat(selectedProduto.valor || 0).toFixed(2)}
                          </div>
                          <div className={`mt-1 font-semibold ${parseInt(selectedProduto.quantidade) < 10 ? 'text-red-600' : parseInt(selectedProduto.quantidade) < 50 ? 'text-yellow-600' : 'text-green-600'}`}>
                            Estoque: {selectedProduto.quantidade} unidades
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-100 px-6 py-4 rounded-b-lg flex justify-end">
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modal de Confirmação de Exclusão */}
          {showDeleteModal && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
              <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
                <div className="bg-red-500 text-white p-4 rounded-t-lg flex justify-between items-center">
                  <h3 className="text-xl font-bold">Confirmar Exclusão</h3>
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="text-white hover:text-gray-200 focus:outline-none"
                  >
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                </div>

                <div className="p-6">
                  {selectedProduto ? (
                    <p className="text-gray-700">
                      Você está prestes a excluir o produto <strong>{selectedProduto.titulo}</strong>.
                      Esta ação não pode ser desfeita. Deseja continuar?
                    </p>
                  ) : (
                    <p className="text-gray-700">
                      Você está prestes a excluir <strong>{countSelectedItems()} produtos</strong> selecionados.
                      Esta ação não pode ser desfeita. Deseja continuar?
                    </p>
                  )}
                </div>

                <div className="bg-gray-100 px-6 py-4 rounded-b-lg flex justify-end space-x-2">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleDelete}
                    className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition"
                  >
                    Excluir
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