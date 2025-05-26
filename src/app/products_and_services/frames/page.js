"use client";

import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faGlasses,
  faDollarSign,
  faBoxes,
  faTags,
  faFilter,
  faX,
  faEdit,
  faTrash
} from '@fortawesome/free-solid-svg-icons';
import { collection, getDocs, doc, deleteDoc, getDoc } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
import { firestore } from '@/lib/firebaseConfig';
import jsPDF from 'jspdf';
import { useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';

export default function ListaArmacoes() {
  const router = useRouter();
  const { userPermissions, userData } = useAuth();
  const [armacoes, setArmacoes] = useState([]);
  const [filteredArmacoes, setFilteredArmacoes] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLoja, setSelectedLoja] = useState('Ambas');
  const [selectedArmacao, setSelectedArmacao] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalArmacoes, setTotalArmacoes] = useState(0);
  const [selectedForDeletion, setSelectedForDeletion] = useState([]);
  const [sortField, setSortField] = useState('codigo');
  const [sortDirection, setSortDirection] = useState('asc');
  const [marcaFilter, setMarcaFilter] = useState('Todas');
  const [generoFilter, setGeneroFilter] = useState('Todos');
  const [materialFilter, setMaterialFilter] = useState('Todos');
  const [availableMarcas, setAvailableMarcas] = useState(['Todas']);
  const generos = ['Todos', 'Masculino', 'Feminino', 'Unissex'];
  const [availableMateriais, setAvailableMateriais] = useState(['Todos']);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingArmacao, setEditingArmacao] = useState(null);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  useEffect(() => {
    const fetchArmacoes = async () => {
      try {
        setLoading(true);
        const fetchedArmacoes = [];

        // Usar o caminho correto para lojas específicas
        if (selectedLoja !== 'Ambas') {
          // Caminho para uma loja específica
          const armacoesDocRef = collection(firestore, `/estoque/${selectedLoja}/armacoes/`);
          const armacoesSnapshot = await getDocs(armacoesDocRef);

          armacoesSnapshot.docs.forEach((docItem) => {
            const armacaoData = docItem.data();
            fetchedArmacoes.push({
              id: docItem.id,
              ...armacaoData,
              loja: selectedLoja // Garantir que a loja seja definida corretamente
            });
          });
        } else {
          // Se for "Ambas", buscar de todas as lojas que o usuário tem acesso
          const lojas = userPermissions?.lojas || [];

          for (const loja of lojas) {
            const armacoesDocRef = collection(firestore, `/estoque/${loja}/armacoes`);
            const armacoesSnapshot = await getDocs(armacoesDocRef);

            armacoesSnapshot.docs.forEach((docItem) => {
              const armacaoData = docItem.data();
              fetchedArmacoes.push({
                id: docItem.id,
                ...armacaoData,
                loja: loja
              });
            });
          }
        }

        // Extrair marcas e materiais disponíveis para filtros
        const marcas = ['Todas'];
        const materiais = ['Todos'];

        fetchedArmacoes.forEach(armacao => {
          if (armacao.marca && !marcas.includes(armacao.marca)) {
            marcas.push(armacao.marca);
          }
          if (armacao.material && !materiais.includes(armacao.material)) {
            materiais.push(armacao.material);
          }
        });

        setAvailableMarcas(marcas);
        setAvailableMateriais(materiais);

        // Aplicar ordenação inicial
        const sortedArmacoes = sortArmacoes(fetchedArmacoes, sortField, sortDirection);
        setArmacoes(sortedArmacoes);
        setFilteredArmacoes(sortedArmacoes);
        setTotalArmacoes(sortedArmacoes.length); // Atualizar o contador total de armações
        setLoading(false);
      } catch (err) {
        console.error('Erro ao carregar as armações:', err);
        setError(`Erro ao carregar os dados das armações: ${err.message}`);
        setLoading(false);
      }
    };

    fetchArmacoes();
  }, [selectedLoja, userPermissions]);

  // Função para filtrar armações com base na busca e loja
  useEffect(() => {
    const filterBySearchAndLojaAndFilters = () => {
      let filtered = armacoes;

      // Filtro por loja
      if (selectedLoja !== 'Ambas') {
        filtered = filtered.filter((armacao) => armacao.loja === selectedLoja);
      }

      // Filtro por busca
      if (searchQuery !== '') {
        filtered = filtered.filter(
          (armacao) =>
            (armacao.codigo?.toLowerCase().includes(searchQuery.toLowerCase()) || '') ||
            (armacao.marca?.toLowerCase().includes(searchQuery.toLowerCase()) || '') ||
            (armacao.codigoBarras?.toLowerCase().includes(searchQuery.toLowerCase()) || '') ||
            (armacao.codigoFabricante?.toLowerCase().includes(searchQuery.toLowerCase()) || '')
        );
      }

      // Filtro por marca
      if (marcaFilter !== 'Todas') {
        filtered = filtered.filter(armacao =>
          armacao.marca === marcaFilter
        );
      }

      // Filtro por gênero
      if (generoFilter !== 'Todos') {
        filtered = filtered.filter(armacao =>
          armacao.genero === generoFilter
        );
      }

      // Filtro por material
      if (materialFilter !== 'Todos') {
        filtered = filtered.filter(armacao =>
          armacao.material === materialFilter
        );
      }

      // Aplicar ordenação
      filtered = sortArmacoes(filtered, sortField, sortDirection);
      setFilteredArmacoes(filtered);
    };

    filterBySearchAndLojaAndFilters();
  }, [searchQuery, selectedLoja, armacoes, sortField, sortDirection, marcaFilter, generoFilter, materialFilter]);

  // Função para ordenar armações
  const sortArmacoes = (armacoesToSort, field, direction) => {
    return [...armacoesToSort].sort((a, b) => {
      let aValue = a[field];
      let bValue = b[field];

      // Tratar datas
      if (field === 'data') {
        aValue = new Date(aValue || '');
        bValue = new Date(bValue || '');
      }
      // Tratar números
      else if (field === 'valor' || field === 'custo' || field === 'quantidade') {
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

    // Reordenar as armações filtradas
    const sorted = sortArmacoes(filteredArmacoes, field, direction);
    setFilteredArmacoes(sorted);
  };

  // Renderizar seta de ordenação - apenas quando a coluna estiver selecionada
  const renderSortArrow = (field) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ?
      <span className="ml-1">↑</span> :
      <span className="ml-1">↓</span>;
  };

  const getEstoqueColor = (quantidade) => {
    if (!quantidade) return 'bg-gray-200 text-gray-800';

    const qtd = parseInt(quantidade);
    if (qtd <= 3) return 'bg-red-200 text-red-800'; // Crítico
    if (qtd <= 10) return 'bg-yellow-200 text-yellow-800'; // Atenção
    return 'bg-green-200 text-green-800'; // Normal
  };

  // Função para formatar data
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';

    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR');
    } catch (error) {
      return dateString;
    }
  };

  // Função para abrir o modal e definir a armação selecionada
  const openModal = (armacao) => {
    setSelectedArmacao(armacao);
    setIsModalOpen(true);
  };

  // Função para fechar o modal
  const closeModal = () => {
    setSelectedArmacao(null);
    setIsModalOpen(false);
  };

  // Função para gerar PDF
  const generatePDF = () => {
    if (!selectedArmacao) return;

    const doc = new jsPDF();
    doc.text(`Detalhes da Armação`, 10, 10);
    doc.text(`Código: ${selectedArmacao.codigo || 'N/A'}`, 10, 20);
    doc.text(`SKU: ${selectedArmacao.sku || 'N/A'}`, 10, 30);
    doc.text(`Marca: ${selectedArmacao.marca || 'N/A'}`, 10, 40);
    doc.text(`Valor: R$ ${parseFloat(selectedArmacao.valor || 0).toFixed(2)}`, 10, 50);
    doc.text(`Custo: R$ ${parseFloat(selectedArmacao.custo || 0).toFixed(2)}`, 10, 60);
    doc.text(`Quantidade: ${selectedArmacao.quantidade || 0}`, 10, 70);
    doc.text(`Data de Cadastro: ${formatDate(selectedArmacao.data)}`, 10, 80);
    doc.text(`Loja: ${selectedArmacao.loja || 'N/A'}`, 10, 90);
    doc.text(`Material: ${selectedArmacao.material || 'N/A'}`, 10, 100);
    doc.text(`Gênero: ${selectedArmacao.genero || 'N/A'}`, 10, 110);
    doc.text(`Cor: ${selectedArmacao.cor || 'N/A'}`, 10, 120);
    doc.text(`Formato: ${selectedArmacao.formato || 'N/A'}`, 10, 130);

    doc.save(`Armacao_${selectedArmacao.codigo || selectedArmacao.id}.pdf`);
  };

  // Função para lidar com a impressão
  const handlePrint = () => {
    window.print();
  };

  // Função para marcar ou desmarcar armação para exclusão
  const toggleDeletion = (e, armacaoId) => {
    e.stopPropagation(); // Evitar abrir o modal

    setSelectedForDeletion(prev => {
      if (prev.includes(armacaoId)) {
        return prev.filter(id => id !== armacaoId);
      } else {
        return [...prev, armacaoId];
      }
    });
  };

  // Função para navegar para página de edição
  const handleEdit = () => {
    if (selectedForDeletion.length !== 1) {
      alert('Selecione apenas uma armação para editar.');
      return;
    }

    // Encontrar a armação selecionada
    const armacaoToEdit = armacoes.find(armacao => armacao.id === selectedForDeletion[0]);

    if (armacaoToEdit) {
      // Navegar para a página de formulário passando os dados da armação
      router.push(`/products_and_services/frames/add?cloneId=${armacaoToEdit.codigo}&loja=${armacaoToEdit.loja}`);
    }
  };

  // Função para excluir as armações selecionadas
  const handleDeleteSelected = async () => {
    if (selectedForDeletion.length === 0) {
      alert('Selecione pelo menos uma armação para excluir.');
      return;
    }

    if (confirm(`Deseja realmente excluir ${selectedForDeletion.length} armações selecionadas?`)) {
      try {
        for (const armacaoId of selectedForDeletion) {
          // Encontrar a loja da armação
          const armacao = armacoes.find(a => a.id === armacaoId);
          if (armacao && armacao.loja) {
            // Excluir a armação
            const armacaoRef = doc(firestore, `/estoque/${armacao.loja}/armacoes/`, armacaoId);
            await deleteDoc(armacaoRef);
          }
        }

        // Atualizar as listas de armações
        const updatedArmacoes = armacoes.filter(armacao => !selectedForDeletion.includes(armacao.id));
        setArmacoes(updatedArmacoes);
        setFilteredArmacoes(updatedArmacoes.filter(a =>
          (selectedLoja === 'Ambas' || a.loja === selectedLoja) &&
          (!searchQuery ||
            a.codigo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            a.marca?.toLowerCase().includes(searchQuery.toLowerCase()))
        ));
        setTotalArmacoes(updatedArmacoes.length);
        setSelectedForDeletion([]);

        alert('Armações excluídas com sucesso!');
      } catch (error) {
        console.error('Erro ao excluir armações:', error);
        alert('Erro ao excluir as armações selecionadas.');
      }
    }
  };

  // Calcular armações para a página atual
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentArmacoes = filteredArmacoes.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredArmacoes.length / itemsPerPage);

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

    if (marcaFilter !== 'Todas') {
      activeFilters.push({ type: 'Marca', value: marcaFilter });
    }

    if (generoFilter !== 'Todos') {
      activeFilters.push({ type: 'Gênero', value: generoFilter });
    }

    if (materialFilter !== 'Todos') {
      activeFilters.push({ type: 'Material', value: materialFilter });
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
                if (filter.type === 'Marca') setMarcaFilter('Todas');
                if (filter.type === 'Gênero') setGeneroFilter('Todos');
                if (filter.type === 'Material') setMaterialFilter('Todos');
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
            setMarcaFilter('Todas');
            setGeneroFilter('Todos');
            setMaterialFilter('Todos');
          }}
        >
          Limpar todos
        </button>
      </div>
    );
  };

  // Renderiza nome da loja formatado
  const renderLojaName = (lojaId) => {
    const lojaNames = {
      'loja1': 'Loja 1 - Centro',
      'loja2': 'Loja 2 - Caramuru'
    };

    return lojaNames[lojaId] || lojaId;
  };

  const generateQRCodeData = (armacao) => {
    return JSON.stringify({
      codigo: armacao.codigo,
      marca: armacao.marca,
      valor: armacao.valor,
      loja: armacao.loja
    });
  };

  const downloadQRCode = (armacao) => {
    const canvas = document.createElement('canvas');
    const qrCode = new QRCodeSVG({
      value: generateQRCodeData(armacao),
      size: 200,
      level: 'H',
      includeMargin: true
    });

    const svg = qrCode.toString();
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);

      const link = document.createElement('a');
      link.download = `QRCode_${armacao.codigo}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(svg);
  };

  return (
    <Layout>
      <div className="min-h-screen p-0 md:p-2 mb-20">
        <div className="w-full max-w-5xl mx-auto rounded-lg">
          <div className="mb-4">
            <h2 className="text-3xl font-bold text-[#81059e] mb-8 mt-8">ARMAÇÕES REGISTRADAS</h2>
          </div>

          {/* Dashboard compacto com estatísticas essenciais */}
          <div className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              {/* Card - Total de Armações */}
              <div className="border-2 rounded-lg p-4 border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <FontAwesomeIcon
                    icon={faGlasses}
                    className="h-8 w-8 text-[#81059e] bg-purple-300 p-2 rounded-2xl"
                  />
                  <span className="text-lg font-medium text-gray-700 flex-grow ml-3">Total de Armações</span>
                </div>
                <p className="text-2xl font-semibold text-center mt-2">{totalArmacoes}</p>
              </div>

              {/* Card - Valor Total do Estoque */}
              <div className="border-2 rounded-lg p-4 border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <FontAwesomeIcon
                    icon={faDollarSign}
                    className="h-8 w-8 text-[#81059e] bg-purple-300 p-2 rounded-2xl"
                  />
                  <span className="text-lg font-medium text-gray-700 flex-grow ml-3">Valor do Estoque</span>
                </div>
                <p className="text-2xl font-semibold text-center mt-2">
                  R$ {armacoes.reduce((total, armacao) =>
                    total + (parseFloat(armacao.valor || 0) * parseInt(armacao.quantidade || 0)), 0).toFixed(2)}
                </p>
              </div>

              {/* Card - Estoque Crítico */}
              <div className="border-2 rounded-lg p-4 border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <FontAwesomeIcon
                    icon={faBoxes}
                    className="h-8 w-8 text-[#81059e] bg-purple-300 p-2 rounded-2xl"
                  />
                  <span className="text-lg font-medium text-gray-700 flex-grow ml-3">Estoque Crítico</span>
                </div>
                <p className="text-2xl font-semibold text-center mt-2">
                  {armacoes.filter(armacao => parseInt(armacao.quantidade || 0) <= 3).length}
                </p>
                <p className="text-sm text-gray-500 text-center mt-1">
                  Repor urgentemente
                </p>
              </div>

              {/* Card - Categorias */}
              <div className="border-2 rounded-lg p-4 border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <FontAwesomeIcon
                    icon={faTags}
                    className="h-8 w-8 text-[#81059e] bg-purple-300 p-2 rounded-2xl"
                  />
                  <span className="text-lg font-medium text-gray-700 flex-grow ml-3">Marcas</span>
                </div>
                <p className="text-2xl font-semibold text-center mt-2">
                  {availableMarcas.length - 1} {/* -1 para desconsiderar "Todas" */}
                </p>
                <p className="text-sm text-gray-500 text-center mt-1">
                  Diferentes marcas
                </p>
              </div>
            </div>
          </div>

          {/* Barra de busca e filtros com dropdown */}
          <div className="flex flex-wrap gap-2 items-center mb-4">
            {/* Barra de busca */}
            <input
              type="text"
              placeholder="Busque por código, marca ou barras"
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
                {(marcaFilter !== 'Todas' || generoFilter !== 'Todos' || materialFilter !== 'Todos') && (
                  <span className="ml-1 bg-[#81059e] text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                    {(marcaFilter !== 'Todas' ? 1 : 0) + (generoFilter !== 'Todos' ? 1 : 0) + (materialFilter !== 'Todos' ? 1 : 0)}
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
                        setMarcaFilter('Todas');
                        setGeneroFilter('Todos');
                        setMaterialFilter('Todos');
                      }}
                      className="text-xs text-[#81059e] hover:underline"
                    >
                      Limpar Filtros
                    </button>
                  </div>

                  <div className="space-y-3">
                    {/* Filtro de marca */}
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Marca</label>
                      <select
                        value={marcaFilter}
                        onChange={(e) => setMarcaFilter(e.target.value)}
                        className="p-2 h-9 w-full border border-gray-200 rounded-lg text-gray-800 text-sm"
                      >
                        {availableMarcas.map(marca => (
                          <option key={marca} value={marca}>{marca}</option>
                        ))}
                      </select>
                    </div>

                    {/* Filtro de gênero */}
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Gênero</label>
                      <select
                        value={generoFilter}
                        onChange={(e) => setGeneroFilter(e.target.value)}
                        className="p-2 h-9 w-full border border-gray-200 rounded-lg text-gray-800 text-sm"
                      >
                        {generos.map(genero => (
                          <option key={genero} value={genero}>{genero}</option>
                        ))}
                      </select>
                    </div>

                    {/* Filtro de material */}
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Material</label>
                      <select
                        value={materialFilter}
                        onChange={(e) => setMaterialFilter(e.target.value)}
                        className="p-2 h-9 w-full border border-gray-200 rounded-lg text-gray-800 text-sm"
                      >
                        {availableMateriais.map(material => (
                          <option key={material} value={material}>{material}</option>
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
              <Link href="/products_and_services/frames/add-frame">
                <button className="bg-green-400 text-white h-10 w-10 rounded-md flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </Link>

              {/* Botão Editar - aparece apenas quando há armações selecionadas */}
              <button
                onClick={() => handleEdit()}
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

          {/* Tabela de armações */}
          {loading ? (
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#81059e]"></div>
          ) : error ? (
            <p>{error}</p>
          ) : (
            <div className="w-full overflow-x-auto">
              {filteredArmacoes.length === 0 ? (
                <p>Nenhuma armação encontrada.</p>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="min-w-full table-auto select-none">
                      <thead>
                        <tr className="bg-[#81059e] text-white">
                          <th className="px-3 py-2 w-12">
                            <span className="sr-only">Selecionar</span>
                          </th>
                          <th className="px-3 py-2">QR</th>
                          <th className="px-3 py-2 cursor-pointer whitespace-nowrap" onClick={() => handleSort('codigo')}>
                            Código {renderSortArrow('codigo')}
                          </th>
                          <th className="px-3 py-2 cursor-pointer" onClick={() => handleSort('marca')}>
                            Marca {renderSortArrow('marca')}
                          </th>
                          <th className="px-3 py-2 cursor-pointer" onClick={() => handleSort('genero')}>
                            Gênero {renderSortArrow('genero')}
                          </th>
                          <th className="px-3 py-2 cursor-pointer" onClick={() => handleSort('cor')}>
                            Cor {renderSortArrow('cor')}
                          </th>
                          <th className="px-3 py-2 cursor-pointer" onClick={() => handleSort('valor')}>
                            Valor {renderSortArrow('valor')}
                          </th>
                          <th className="px-3 py-2 cursor-pointer whitespace-nowrap" onClick={() => handleSort('custo')}>
                            Custo {renderSortArrow('custo')}
                          </th>
                          <th className="px-3 py-2 cursor-pointer whitespace-nowrap" onClick={() => handleSort('quantidade')}>
                            Estoque {renderSortArrow('quantidade')}
                          </th>
                          <th className="px-3 py-2">Loja</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentArmacoes.map((armacao) => (
                          <tr
                            key={armacao.id}
                            className="text-black text-left hover:bg-gray-100 cursor-pointer"
                          >
                            <td className="border px-2 py-2 text-center">
                              <input
                                type="checkbox"
                                checked={selectedForDeletion.includes(armacao.id)}
                                onChange={(e) => toggleDeletion(e, armacao.id)}
                                className="h-4 w-4 cursor-pointer"
                                onClick={(e) => e.stopPropagation()}
                              />
                            </td>
                            <td className="border px-3 py-2 text-center">
                              <div className="flex justify-center">
                                <QRCodeSVG
                                  value={generateQRCodeData(armacao)}
                                  size={40}
                                  level="H"
                                  includeMargin={true}
                                  className="cursor-pointer"
                                  onClick={() => openModal(armacao)}
                                />
                              </div>
                            </td>
                            <td className="border px-3 py-2 whitespace-nowrap" onClick={() => openModal(armacao)}>
                              {armacao.codigo || 'N/A'}
                            </td>
                            <td className="border px-4 py-2 max-w-[300px] truncate" onClick={() => openModal(armacao)}>
                              {armacao.marca || 'N/A'}
                            </td>
                            <td className="border px-3 py-2" onClick={() => openModal(armacao)}>
                              {armacao.genero || 'N/A'}
                            </td>
                            <td className="border px-3 py-2" onClick={() => openModal(armacao)}>
                              {armacao.cor || 'N/A'}
                            </td>
                            <td className="border px-3 py-2 whitespace-nowrap" onClick={() => openModal(armacao)}>
                              R$ {parseFloat(armacao.valor || 0).toFixed(2)}
                            </td>
                            <td className="border px-3 py-2 whitespace-nowrap" onClick={() => openModal(armacao)}>
                              R$ {parseFloat(armacao.custo || 0).toFixed(2)}
                            </td>
                            <td className={`border px-3 py-2 whitespace-nowrap text-center ${getEstoqueColor(armacao.quantidade)}`} onClick={() => openModal(armacao)}>
                              {armacao.quantidade || '0'}
                            </td>
                            <td className="border px-3 py-2 whitespace-nowrap" onClick={() => openModal(armacao)}>
                              {renderLojaName(armacao.loja)}
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
                        {Math.min(indexOfLastItem, filteredArmacoes.length)}
                      </span>{' '}
                      de <span className="font-medium">{filteredArmacoes.length}</span> registros
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

          {/* Modal de Detalhamento de Armação */}
          {isModalOpen && selectedArmacao && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
              <div className="bg-white rounded-lg shadow-lg w-full max-w-md flex flex-col h-3/5 overflow-hidden">
                <div className="bg-[#81059e] text-white p-4 flex justify-between items-center">
                  <h3 className="text-xl font-bold">Detalhes da Armação</h3>

                  <FontAwesomeIcon
                    icon={faX}
                    className="h-5 w-5 text-white cursor-pointer hover:text-gray-200"
                    onClick={closeModal}
                  />
                </div>
                <div className="space-y-3 p-4 overflow-y-auto flex-grow">
                  {selectedArmacao.imagem && (
                    <div className="flex justify-center mb-4">
                      <img
                        src={selectedArmacao.imagem} // URL do Firebase Storage
                        alt={`Imagem de ${selectedArmacao.marca}`}
                        className="max-h-32 object-contain rounded"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '/api/placeholder/200/200'; // Fallback para imagem placeholder
                          console.error('Erro ao carregar imagem:', selectedArmacao.imagem);
                        }}
                      />
                    </div>
                  )}

                  {/* QR Code Section */}
                  <div className="flex flex-col items-center mb-4">
                    <div className="bg-white p-4 rounded-lg shadow-md">
                      <QRCodeSVG
                        value={generateQRCodeData(selectedArmacao)}
                        size={150}
                        level="H"
                        includeMargin={true}
                      />
                    </div>
                    <button
                      onClick={() => downloadQRCode(selectedArmacao)}
                      className="mt-2 text-sm text-[#81059e] hover:text-[#690480] flex items-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Baixar QR Code
                    </button>
                  </div>

                  <p><strong>
                    Código:</strong> {selectedArmacao.codigo || 'N/A'}
                  </p>
                  <p>
                    <strong>SKU:</strong> {selectedArmacao.sku || 'N/A'}
                  </p>
                  <p>
                    <strong>Marca:</strong> {selectedArmacao.marca || 'N/A'}
                  </p>
                  <p>
                    <strong>Gênero:</strong> {selectedArmacao.genero || 'N/A'}
                  </p>
                  <p>
                    <strong>Material:</strong> {selectedArmacao.material || 'N/A'}
                  </p>
                  <p>
                    <strong>Cor:</strong> {selectedArmacao.cor || 'N/A'}
                  </p>
                  <p>
                    <strong>Formato:</strong> {selectedArmacao.formato || 'N/A'}
                  </p>
                  <p>
                    <strong>Valor:</strong> R$ {parseFloat(selectedArmacao.valor || 0).toFixed(2)}
                  </p>
                  <p>
                    <strong>Custo:</strong> R$ {parseFloat(selectedArmacao.custo || 0).toFixed(2)}
                  </p>
                  <p>
                    <strong>Margem:</strong> {selectedArmacao.percentual_lucro || '0'}%
                  </p>
                  <p>
                    <strong>Quantidade:</strong> {selectedArmacao.quantidade || '0'}
                  </p>
                  <p>
                    <strong>Data de Cadastro:</strong> {formatDate(selectedArmacao.data)}
                  </p>
                  <p>
                    <strong>Loja:</strong> {renderLojaName(selectedArmacao.loja)}
                  </p>

                  {/* Dimensões */}
                  <div className="mt-4 pt-2 border-t border-gray-200">
                    <h4 className="font-semibold text-[#81059e]">Dimensões</h4>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      <div>
                        <p className="text-sm text-gray-600">Lente</p>
                        <p className="font-medium">{selectedArmacao.lente || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Ponte</p>
                        <p className="font-medium">{selectedArmacao.ponte || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Haste</p>
                        <p className="font-medium">{selectedArmacao.haste || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Dados Fiscais */}
                  <div className="mt-4 pt-2 border-t border-gray-200">
                    <h4 className="font-semibold text-[#81059e]">Informações Fiscais</h4>
                    <p className="mt-2">
                      <strong>NCM:</strong> {selectedArmacao.NCM || 'N/A'}
                    </p>
                    <p>
                      <strong>Código de Barras:</strong> {selectedArmacao.codigoBarras || 'N/A'}
                    </p>
                  </div>

                  <div className="flex justify-around mt-6">
                    <button
                      onClick={generatePDF}
                      className="bg-[#81059e] text-white px-4 py-2 rounded-md flex items-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      Gerar PDF
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

                  <div className="flex justify-around mt-4">
                    <Link href={`/products_and_services/frames/add?cloneId=${selectedArmacao.codigo}&loja=${selectedArmacao.loja}`}>
                      <button className="bg-blue-500 text-white px-4 py-2 rounded-md flex items-center">
                        <FontAwesomeIcon
                          icon={faEdit}
                          className="h-5 w-5 mr-2"
                        />
                        Editar
                      </button>
                    </Link>

                    <button
                      onClick={() => {
                        if (confirm('Tem certeza que deseja excluir esta armação?')) {
                          handleDeleteSelected([selectedArmacao.id]);
                          closeModal();
                        }
                      }}
                      className="bg-red-500 text-white px-4 py-2 rounded-md flex items-center"
                    >
                      <FontAwesomeIcon
                        icon={faTrash}
                        className="h-5 w-5 mr-2"
                      />
                      Excluir
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