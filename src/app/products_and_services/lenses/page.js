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

export default function ListaLentes() {
  const router = useRouter();
  const { userPermissions, userData } = useAuth();
  const [lentes, setLentes] = useState([]);
  const [filteredLentes, setFilteredLentes] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLoja, setSelectedLoja] = useState('Ambas');
  const [selectedLente, setSelectedLente] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalLentes, setTotalLentes] = useState(0);
  const [selectedForDeletion, setSelectedForDeletion] = useState([]);
  const [sortField, setSortField] = useState('codigo');
  const [sortDirection, setSortDirection] = useState('asc');
  const [fabricanteFilter, setFabricanteFilter] = useState('Todos');
  const [tipoFilter, setTipoFilter] = useState('Todos');
  const [materialFilter, setMaterialFilter] = useState('Todos');
  const [availableFabricantes, setAvailableFabricantes] = useState(['Todos']);
  const tipos = ['Todos', 'Monofocal', 'Bifocal', 'Multifocal', 'Progressiva'];
  const [availableMateriais, setAvailableMateriais] = useState(['Todos']);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingLente, setEditingLente] = useState(null);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  useEffect(() => {
    const fetchLentes = async () => {
      try {
        setLoading(true);
        const fetchedLentes = [];

        // Usar o caminho correto para lojas específicas
        if (selectedLoja !== 'Ambas') {
          // Caminho para uma loja específica
          const lentesDocRef = collection(firestore, `/estoque/${selectedLoja}/lentes/`);
          const lentesSnapshot = await getDocs(lentesDocRef);

          lentesSnapshot.docs.forEach((docItem) => {
            const lenteData = docItem.data();
            fetchedLentes.push({
              id: docItem.id,
              ...lenteData,
              loja: selectedLoja // Garantir que a loja seja definida corretamente
            });
          });
        } else {
          // Se for "Ambas", buscar de todas as lojas que o usuário tem acesso
          const lojas = userPermissions?.lojas || [];

          for (const loja of lojas) {
            const lentesDocRef = collection(firestore, `/estoque/${loja}/lentes`);
            const lentesSnapshot = await getDocs(lentesDocRef);

            lentesSnapshot.docs.forEach((docItem) => {
              const lenteData = docItem.data();
              fetchedLentes.push({
                id: docItem.id,
                ...lenteData,
                loja: loja
              });
            });
          }
        }

        // Extrair fabricantes e materiais disponíveis para filtros
        const fabricantes = ['Todos'];
        const materiais = ['Todos'];

        fetchedLentes.forEach(lente => {
          if (lente.fabricante && !fabricantes.includes(lente.fabricante)) {
            fabricantes.push(lente.fabricante);
          }
          if (lente.material && !materiais.includes(lente.material)) {
            materiais.push(lente.material);
          }
        });

        setAvailableFabricantes(fabricantes);
        setAvailableMateriais(materiais);

        // Aplicar ordenação inicial
        const sortedLentes = sortLentes(fetchedLentes, sortField, sortDirection);
        setLentes(sortedLentes);
        setFilteredLentes(sortedLentes);
        setTotalLentes(sortedLentes.length); // Atualizar o contador total de lentes
        setLoading(false);
      } catch (err) {
        console.error('Erro ao carregar as lentes:', err);
        setError(`Erro ao carregar os dados das lentes: ${err.message}`);
        setLoading(false);
      }
    };

    fetchLentes();
  }, [selectedLoja, userPermissions]);

  // Função para filtrar lentes com base na busca e loja
  useEffect(() => {
    const filterBySearchAndLojaAndFilters = () => {
      let filtered = lentes;

      // Filtro por loja
      if (selectedLoja !== 'Ambas') {
        filtered = filtered.filter((lente) => lente.loja === selectedLoja);
      }

      // Filtro por busca
      if (searchQuery !== '') {
        filtered = filtered.filter(
          (lente) =>
            (lente.codigo?.toLowerCase().includes(searchQuery.toLowerCase()) || '') ||
            (lente.fabricante?.toLowerCase().includes(searchQuery.toLowerCase()) || '') ||
            (lente.codigoBarras?.toLowerCase().includes(searchQuery.toLowerCase()) || '') ||
            (lente.descricao?.toLowerCase().includes(searchQuery.toLowerCase()) || '')
        );
      }

      // Filtro por fabricante
      if (fabricanteFilter !== 'Todos') {
        filtered = filtered.filter(lente =>
          lente.fabricante === fabricanteFilter
        );
      }

      // Filtro por tipo
      if (tipoFilter !== 'Todos') {
        filtered = filtered.filter(lente =>
          lente.tipo === tipoFilter
        );
      }

      // Filtro por material
      if (materialFilter !== 'Todos') {
        filtered = filtered.filter(lente =>
          lente.material === materialFilter
        );
      }

      // Aplicar ordenação
      filtered = sortLentes(filtered, sortField, sortDirection);
      setFilteredLentes(filtered);
    };

    filterBySearchAndLojaAndFilters();
  }, [searchQuery, selectedLoja, lentes, sortField, sortDirection, fabricanteFilter, tipoFilter, materialFilter]);

  // Função para ordenar lentes
  const sortLentes = (lentesToSort, field, direction) => {
    return [...lentesToSort].sort((a, b) => {
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

    // Reordenar as lentes filtradas
    const sorted = sortLentes(filteredLentes, field, direction);
    setFilteredLentes(sorted);
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

  // Função para abrir o modal e definir a lente selecionada
  const openModal = (lente) => {
    setSelectedLente(lente);
    setIsModalOpen(true);
  };

  // Função para fechar o modal
  const closeModal = () => {
    setSelectedLente(null);
    setIsModalOpen(false);
  };

  // Função para gerar PDF
  const generatePDF = () => {
    if (!selectedLente) return;

    const doc = new jsPDF();
    doc.text(`Detalhes da Lente`, 10, 10);
    doc.text(`Código: ${selectedLente.codigo || 'N/A'}`, 10, 20);
    doc.text(`Fabricante: ${selectedLente.fabricante || 'N/A'}`, 10, 30);
    doc.text(`Tipo: ${selectedLente.tipo || 'N/A'}`, 10, 40);
    doc.text(`Material: ${selectedLente.material || 'N/A'}`, 10, 50);
    doc.text(`Índice: ${selectedLente.indice || 'N/A'}`, 10, 60);
    doc.text(`Diâmetro: ${selectedLente.diametro || 'N/A'}`, 10, 70);
    doc.text(`Valor: R$ ${parseFloat(selectedLente.valor || 0).toFixed(2)}`, 10, 80);
    doc.text(`Custo: R$ ${parseFloat(selectedLente.custo || 0).toFixed(2)}`, 10, 90);
    doc.text(`Quantidade: ${selectedLente.quantidade || 0}`, 10, 100);
    doc.text(`Data de Cadastro: ${formatDate(selectedLente.data)}`, 10, 110);
    doc.text(`Loja: ${selectedLente.loja || 'N/A'}`, 10, 120);

    doc.save(`Lente_${selectedLente.codigo || selectedLente.id}.pdf`);
  };

  // Função para lidar com a impressão
  const handlePrint = () => {
    window.print();
  };

  // Função para marcar ou desmarcar lente para exclusão
  const toggleDeletion = (e, lenteId) => {
    e.stopPropagation(); // Evitar abrir o modal

    setSelectedForDeletion(prev => {
      if (prev.includes(lenteId)) {
        return prev.filter(id => id !== lenteId);
      } else {
        return [...prev, lenteId];
      }
    });
  };

  // Função para navegar para página de edição
  const handleEdit = () => {
    if (selectedForDeletion.length !== 1) {
      alert('Selecione apenas uma lente para editar.');
      return;
    }

    // Encontrar a lente selecionada
    const lenteToEdit = lentes.find(lente => lente.id === selectedForDeletion[0]);

    if (lenteToEdit) {
      // Navegar para a página de formulário passando os dados da lente
      router.push(`/products_and_services/lenses/add?cloneId=${lenteToEdit.codigo}&loja=${lenteToEdit.loja}`);
    }
  };

  // Função para excluir as lentes selecionadas
  const handleDeleteSelected = async () => {
    if (selectedForDeletion.length === 0) {
      alert('Selecione pelo menos uma lente para excluir.');
      return;
    }

    if (confirm(`Deseja realmente excluir ${selectedForDeletion.length} lentes selecionadas?`)) {
      try {
        for (const lenteId of selectedForDeletion) {
          // Encontrar a loja da lente
          const lente = lentes.find(a => a.id === lenteId);
          if (lente && lente.loja) {
            // Excluir a lente
            const lenteRef = doc(firestore, `/estoque/${lente.loja}/lentes/items`, lenteId);
            await deleteDoc(lenteRef);
          }
        }

        // Atualizar as listas de lentes
        const updatedLentes = lentes.filter(lente => !selectedForDeletion.includes(lente.id));
        setLentes(updatedLentes);
        setFilteredLentes(updatedLentes.filter(a =>
          (selectedLoja === 'Ambas' || a.loja === selectedLoja) &&
          (!searchQuery ||
            a.codigo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            a.fabricante?.toLowerCase().includes(searchQuery.toLowerCase()))
        ));
        setTotalLentes(updatedLentes.length);
        setSelectedForDeletion([]);

        alert('Lentes excluídas com sucesso!');
      } catch (error) {
        console.error('Erro ao excluir lentes:', error);
        alert('Erro ao excluir as lentes selecionadas.');
      }
    }
  };

  // Calcular lentes para a página atual
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentLentes = filteredLentes.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredLentes.length / itemsPerPage);

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

    if (fabricanteFilter !== 'Todos') {
      activeFilters.push({ type: 'Fabricante', value: fabricanteFilter });
    }

    if (tipoFilter !== 'Todos') {
      activeFilters.push({ type: 'Tipo', value: tipoFilter });
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
                if (filter.type === 'Fabricante') setFabricanteFilter('Todos');
                if (filter.type === 'Tipo') setTipoFilter('Todos');
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
            setFabricanteFilter('Todos');
            setTipoFilter('Todos');
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

  return (
    <Layout>
      <div className="min-h-screen p-0 md:p-2 mb-20">
        <div className="w-full max-w-5xl mx-auto rounded-lg">
          <div className="mb-4">
            <h2 className="text-3xl font-bold text-[#81059e] mb-8 mt-8">LENTES REGISTRADAS</h2>
          </div>

          {/* Dashboard compacto com estatísticas essenciais */}
          <div className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              {/* Card - Total de Lentes */}
              <div className="border-2 rounded-lg p-4 border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <FontAwesomeIcon
                    icon={faGlasses}
                    className="h-8 w-8 text-[#81059e] bg-purple-300 p-2 rounded-2xl"
                  />
                  <span className="text-lg font-medium text-gray-700 flex-grow ml-3">Total de Lentes</span>
                </div>
                <p className="text-2xl font-semibold text-center mt-2">{totalLentes}</p>
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
                  R$ {lentes.reduce((total, lente) =>
                    total + (parseFloat(lente.valor || 0) * parseInt(lente.quantidade || 0)), 0).toFixed(2)}
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
                  {lentes.filter(lente => parseInt(lente.quantidade || 0) <= 3).length}
                </p>
                <p className="text-sm text-gray-500 text-center mt-1">
                  Repor urgentemente
                </p>
              </div>

              {/* Card - Fabricantes */}
              <div className="border-2 rounded-lg p-4 border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <FontAwesomeIcon
                    icon={faTags}
                    className="h-8 w-8 text-[#81059e] bg-purple-300 p-2 rounded-2xl"
                  />
                  <span className="text-lg font-medium text-gray-700 flex-grow ml-3">Fabricantes</span>
                </div>
                <p className="text-2xl font-semibold text-center mt-2">
                  {availableFabricantes.length - 1} {/* -1 para desconsiderar "Todos" */}
                </p>
                <p className="text-sm text-gray-500 text-center mt-1">
                  Diferentes fabricantes
                </p>
              </div>
            </div>
          </div>

          {/* Barra de busca e filtros com dropdown */}
          <div className="flex flex-wrap gap-2 items-center mb-4">
            {/* Barra de busca */}
            <input
              type="text"
              placeholder="Busque por código, fabricante ou barras"
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
                {(fabricanteFilter !== 'Todos' || tipoFilter !== 'Todos' || materialFilter !== 'Todos') && (
                  <span className="ml-1 bg-[#81059e] text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                    {(fabricanteFilter !== 'Todos' ? 1 : 0) + (tipoFilter !== 'Todos' ? 1 : 0) + (materialFilter !== 'Todos' ? 1 : 0)}
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
                        setFabricanteFilter('Todos');
                        setTipoFilter('Todos');
                        setMaterialFilter('Todos');
                      }}
                      className="text-xs text-[#81059e] hover:underline"
                    >
                      Limpar Filtros
                    </button>
                  </div>

                  <div className="space-y-3">
                    {/* Filtro de fabricante */}
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Fabricante</label>
                      <select
                        value={fabricanteFilter}
                        onChange={(e) => setFabricanteFilter(e.target.value)}
                        className="p-2 h-9 w-full border border-gray-200 rounded-lg text-gray-800 text-sm"
                      >
                        {availableFabricantes.map(fabricante => (
                          <option key={fabricante} value={fabricante}>{fabricante}</option>
                        ))}
                      </select>
                    </div>

                    {/* Filtro de tipo */}
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Tipo</label>
                      <select
                        value={tipoFilter}
                        onChange={(e) => setTipoFilter(e.target.value)}
                        className="p-2 h-9 w-full border border-gray-200 rounded-lg text-gray-800 text-sm"
                      >
                        {tipos.map(tipo => (
                          <option key={tipo} value={tipo}>{tipo}</option>
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
              <Link href="/products_and_services/lenses/add-lense">
                <button className="bg-green-400 text-white h-10 w-10 rounded-md flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </Link>

              {/* Botão Editar - aparece apenas quando há lentes selecionadas */}
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

          {/* Tabela de lentes */}
          {loading ? (
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#81059e]"></div>
          ) : error ? (
            <p>{error}</p>
          ) : (
            <div className="w-full overflow-x-auto">
              {filteredLentes.length === 0 ? (
                <p>Nenhuma lente encontrada.</p>
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
                          <th className="px-3 py-2 cursor-pointer" onClick={() => handleSort('fabricante')}>
                            Fabricante {renderSortArrow('fabricante')}
                          </th>
                          <th className="px-3 py-2 cursor-pointer" onClick={() => handleSort('tipo')}>
                            Tipo {renderSortArrow('tipo')}
                          </th>
                          <th className="px-3 py-2 cursor-pointer" onClick={() => handleSort('material')}>
                            Material {renderSortArrow('material')}
                          </th>
                          <th className="px-3 py-2 cursor-pointer" onClick={() => handleSort('indice')}>
                            Índice {renderSortArrow('indice')}
                          </th>
                          <th className="px-3 py-2 cursor-pointer" onClick={() => handleSort('valor')}>
                            Valor {renderSortArrow('valor')}
                          </th>
                          <th className="px-3 py-2 cursor-pointer whitespace-nowrap" onClick={() => handleSort('quantidade')}>
                            Estoque {renderSortArrow('quantidade')}
                          </th>
                          <th className="px-3 py-2">Loja</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentLentes.map((lente) => (
                          <tr
                            key={lente.id}
                            className="text-black text-left hover:bg-gray-100 cursor-pointer"
                          >
                            <td className="border px-2 py-2 text-center">
                              <input
                                type="checkbox"
                                checked={selectedForDeletion.includes(lente.id)}
                                onChange={(e) => toggleDeletion(e, lente.id)}
                                className="h-4 w-4 cursor-pointer"
                                onClick={(e) => e.stopPropagation()}
                              />
                            </td>
                            <td className="border px-3 py-2 whitespace-nowrap" onClick={() => openModal(lente)}>
                              {lente.codigo || 'N/A'}
                            </td>
                            <td className="border px-4 py-2 max-w-[300px] truncate" onClick={() => openModal(lente)}>
                              {lente.fabricante || 'N/A'}
                            </td>
                            <td className="border px-3 py-2" onClick={() => openModal(lente)}>
                              {lente.tipo || 'N/A'}
                            </td>
                            <td className="border px-3 py-2" onClick={() => openModal(lente)}>
                              {lente.material || 'N/A'}
                            </td>
                            <td className="border px-3 py-2" onClick={() => openModal(lente)}>
                              {lente.indice || 'N/A'}
                            </td>
                            <td className="border px-3 py-2 whitespace-nowrap" onClick={() => openModal(lente)}>
                              R$ {parseFloat(lente.valor || 0).toFixed(2)}
                            </td>
                            <td className={`border px-3 py-2 whitespace-nowrap text-center ${getEstoqueColor(lente.quantidade)}`} onClick={() => openModal(lente)}>
                              {lente.quantidade || '0'}
                            </td>
                            <td className="border px-3 py-2 whitespace-nowrap" onClick={() => openModal(lente)}>
                              {renderLojaName(lente.loja)}
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
                        {Math.min(indexOfLastItem, filteredLentes.length)}
                      </span>{' '}
                      de <span className="font-medium">{filteredLentes.length}</span> registros
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

          {/* Modal de Detalhamento de Lente */}
          {isModalOpen && selectedLente && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
              <div className="bg-white rounded-lg shadow-lg w-full max-w-md flex flex-col h-3/5 overflow-hidden">
                <div className="bg-[#81059e] text-white p-4 flex justify-between items-center">
                  <h3 className="text-xl font-bold">Detalhes da Lente</h3>

                  <FontAwesomeIcon
                    icon={faX}
                    className="h-5 w-5 text-white cursor-pointer hover:text-gray-200"
                    onClick={closeModal}
                  />
                </div>
                <div className="space-y-3 p-4 overflow-y-auto flex-grow">
                  <p><strong>
                    Código:</strong> {selectedLente.codigo || 'N/A'}
                  </p>
                  <p>
                    <strong>Descrição:</strong> {selectedLente.descricao || 'N/A'}
                  </p>
                  <p>
                    <strong>Fabricante:</strong> {selectedLente.fabricante || 'N/A'}
                  </p>
                  <p>
                    <strong>Tipo:</strong> {selectedLente.tipo || 'N/A'}
                  </p>
                  <p>
                    <strong>Material:</strong> {selectedLente.material || 'N/A'}
                  </p>
                  <p>
                    <strong>Índice:</strong> {selectedLente.indice || 'N/A'}
                  </p>
                  <p>
                    <strong>Diâmetro:</strong> {selectedLente.diametro || 'N/A'}
                  </p>
                  <p>
                    <strong>Valor:</strong> R$ {parseFloat(selectedLente.valor || 0).toFixed(2)}
                  </p>
                  <p>
                    <strong>Custo:</strong> R$ {parseFloat(selectedLente.custo || 0).toFixed(2)}
                  </p>
                  <p>
                    <strong>Margem:</strong> {selectedLente.percentual_lucro || '0'}%
                  </p>
                  <p>
                    <strong>Quantidade:</strong> {selectedLente.quantidade || '0'}
                  </p>
                  <p>
                    <strong>Data de Cadastro:</strong> {formatDate(selectedLente.data)}
                  </p>
                  <p>
                    <strong>Loja:</strong> {renderLojaName(selectedLente.loja)}
                  </p>

                  {/* Graus e Parâmetros */}
                  <div className="mt-4 pt-2 border-t border-gray-200">
                    <h4 className="font-semibold text-[#81059e]">Intervalo de Graus</h4>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div>
                        <p className="text-sm text-gray-600">Grau Mínimo</p>
                        <p className="font-medium">{selectedLente.grau_minimo || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Grau Máximo</p>
                        <p className="font-medium">{selectedLente.grau_maximo || 'N/A'}</p>
                      </div>
                      {selectedLente.adicao_minima && (
                        <div>
                          <p className="text-sm text-gray-600">Adição Mínima</p>
                          <p className="font-medium">{selectedLente.adicao_minima}</p>
                        </div>
                      )}
                      {selectedLente.adicao_maxima && (
                        <div>
                          <p className="text-sm text-gray-600">Adição Máxima</p>
                          <p className="font-medium">{selectedLente.adicao_maxima}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Dados Fiscais */}
                  <div className="mt-4 pt-2 border-t border-gray-200">
                    <h4 className="font-semibold text-[#81059e]">Informações Fiscais</h4>
                    <p className="mt-2">
                      <strong>NCM:</strong> {selectedLente.NCM || 'N/A'}
                    </p>
                    <p>
                      <strong>Código de Barras:</strong> {selectedLente.codigoBarras || 'N/A'}
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
                    <Link href={`/products_and_services/lenses/add?cloneId=${selectedLente.codigo}&loja=${selectedLente.loja}`}>
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
                        if (confirm('Tem certeza que deseja excluir esta lente?')) {
                          handleDeleteSelected([selectedLente.id]);
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