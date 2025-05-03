"use client";
import React, { useState, useEffect } from 'react';
import { collection, getDocs, deleteDoc, doc, query, where } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { firestore } from '../../../../lib/firebaseConfig';
import Layout from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCreditCard,
  faUser,
  faSort,
  faBuildingColumns
} from '@fortawesome/free-solid-svg-icons';

export default function DisplayCardsPage() {
  const { userPermissions, userData } = useAuth();
  const [cards, setCards] = useState([]);
  const [filteredCards, setFilteredCards] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCards, setSelectedCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedLoja, setSelectedLoja] = useState('');
  const [sortField, setSortField] = useState('cardHolder');
  const [sortDirection, setSortDirection] = useState('asc');
  const router = useRouter();

  useEffect(() => {
    // Definir a loja inicial baseado nas permissões do usuário
    if (userPermissions?.lojas && userPermissions.lojas.length > 0) {
      setSelectedLoja(userPermissions.lojas[0]);
    }
  }, [userPermissions]);

  useEffect(() => {
    if (selectedLoja) {
      fetchCards();
    }
  }, [selectedLoja, userPermissions]);

  const fetchCards = async () => {
    try {
      setLoading(true);
      
      if (!selectedLoja) {
        setLoading(false);
        return;
      }

      // Verificar se o usuário tem acesso à loja
      if (!userPermissions?.lojas?.includes(selectedLoja)) {
        setError('Você não tem permissão para acessar esta loja');
        setLoading(false);
        return;
      }

      // Caminho correto no Firebase - seguindo a estrutura de banco de dados
      const cardsRef = collection(firestore, `lojas/${selectedLoja}/financeiro/cartoes/items`);
      
      try {
        const cardsSnapshot = await getDocs(cardsRef);
        const cardsList = cardsSnapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        }));
        
        setCards(cardsList);
        setFilteredCards(cardsList);
        setError(null);
      } catch (firestoreError) {
        console.error('Erro específico do Firestore:', firestoreError);
        
        // Se a coleção não existir, criar vazia
        if (firestoreError.code === 'failed-precondition') {
          setCards([]);
          setFilteredCards([]);
          setError('Nenhum cartão cadastrado nesta loja ainda.');
        } else {
          setError(`Erro ao acessar cartões: ${firestoreError.message}`);
        }
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Erro geral ao buscar cartões:', error);
      setError(`Erro ao carregar os dados dos cartões: ${error.message}`);
      setLoading(false);
    }
  };

  // Máscara para mostrar apenas 4 últimos dígitos
  const maskCardNumber = (cardNumber) => {
    if (!cardNumber) return 'N/A';
    const cleanNumber = cardNumber.toString().replace(/\D/g, '');
    if (cleanNumber.length < 4) return cardNumber;
    return `**** **** **** ${cleanNumber.slice(-4)}`;
  };

  const handleSelectCard = (id) => {
    if (selectedCards.includes(id)) {
      setSelectedCards(selectedCards.filter((cardId) => cardId !== id));
    } else {
      setSelectedCards([...selectedCards, id]);
    }
  };

  const handleDeleteSelectedCards = async () => {
    if (selectedCards.length === 0) {
      alert('Selecione pelo menos um cartão para excluir.');
      return;
    }

    if (confirm(`Deseja realmente excluir ${selectedCards.length} cartão(ões) selecionado(s)?`)) {
      try {
        // Verificar permissões antes de excluir
        for (const cardId of selectedCards) {
          const cardRef = doc(firestore, `lojas/${selectedLoja}/financeiro/cartoes/items/${cardId}`);
          await deleteDoc(cardRef);
        }
        setSelectedCards([]);
        fetchCards();
        alert('Cartões excluídos com sucesso!');
      } catch (error) {
        console.error('Erro ao deletar cartões:', error);
        alert(`Erro ao excluir cartões: ${error.message}`);
      }
    }
  };

  // Filtrar cartões
  useEffect(() => {
    let filtered = [...cards];

    if (searchTerm) {
      filtered = filtered.filter(card =>
        card.cardHolder?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        maskCardNumber(card.cardNumber).includes(searchTerm)
      );
    }

    // Aplicar ordenação
    filtered = sortCards(filtered, sortField, sortDirection);
    setFilteredCards(filtered);
  }, [searchTerm, cards, sortField, sortDirection]);

  // Função para ordenar cartões
  const sortCards = (cardsToSort, field, direction) => {
    return [...cardsToSort].sort((a, b) => {
      let aValue = a[field];
      let bValue = b[field];

      // Tratar strings
      aValue = String(aValue || '').toLowerCase();
      bValue = String(bValue || '').toLowerCase();

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
  };

  // Renderizar seta de ordenação
  const renderSortArrow = (field) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ?
      <span className="ml-1">↑</span> :
      <span className="ml-1">↓</span>;
  };

  return (
    <Layout>
      <div className="min-h-screen p-0 md:p-2 mb-20">
        <div className="w-full max-w-5xl mx-auto rounded-lg">
          <h2 className="text-3xl font-bold text-[#81059e] mb-8 mt-8">CARTÕES REGISTRADOS</h2>

          {/* Dashboard resumido */}
          <div className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Card - Total de Cartões */}
              <div className="border-2 rounded-lg p-4 border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <FontAwesomeIcon
                    icon={faCreditCard}
                    className="h-8 w-8 text-[#81059e] bg-purple-300 p-2 rounded-2xl"
                  />
                  <span className="text-lg font-medium text-gray-700 flex-grow ml-3">Total de Cartões</span>
                </div>
                <p className="text-2xl font-semibold text-center mt-2">{cards.length}</p>
              </div>

              {/* Card - Loja Atual */}
              <div className="border-2 rounded-lg p-4 border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <FontAwesomeIcon
                    icon={faBuildingColumns}
                    className="h-8 w-8 text-[#81059e] bg-purple-300 p-2 rounded-2xl"
                  />
                  <span className="text-lg font-medium text-gray-700 flex-grow ml-3">Loja Atual</span>
                </div>
                <p className="text-2xl font-semibold text-center mt-2">{selectedLoja || 'N/A'}</p>
              </div>

              {/* Card - Tipos de Cartão */}
              <div className="border-2 rounded-lg p-4 border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <FontAwesomeIcon
                    icon={faUser}
                    className="h-8 w-8 text-[#81059e] bg-purple-300 p-2 rounded-2xl"
                  />
                  <span className="text-lg font-medium text-gray-700 flex-grow ml-3">Titulares Únicos</span>
                </div>
                <p className="text-2xl font-semibold text-center mt-2">
                  {new Set(cards.map(card => card.cardHolder)).size}
                </p>
              </div>
            </div>
          </div>

          {/* Barra de busca e filtros */}
          <div className="flex flex-wrap gap-2 items-center mb-4">
            {/* Barra de busca */}
            <input
              type="text"
              placeholder="Busque por titular ou número do cartão"
              className="p-2 h-10 flex-grow min-w-[200px] border-2 border-gray-200 rounded-lg text-black"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            {/* Seletor de loja */}
            <select
              value={selectedLoja}
              onChange={(e) => setSelectedLoja(e.target.value)}
              className="p-2 h-10 border-2 border-gray-200 rounded-lg text-gray-800 w-24"
            >
              {userPermissions?.lojas?.map(loja => (
                <option key={loja} value={loja}>
                  {loja.charAt(0).toUpperCase() + loja.slice(1)}
                </option>
              ))}
            </select>

            {/* Botões de ação */}
            <div className="flex gap-2">
              {/* Botão Adicionar */}
              <button
                onClick={() => router.push('/finance/cards')}
                className="bg-green-400 text-white h-10 w-10 rounded-md flex items-center justify-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>

              {/* Botão Excluir */}
              <button
                onClick={handleDeleteSelectedCards}
                className={`${selectedCards.length === 0 ? 'bg-red-400' : 'bg-red-600'} text-white h-10 w-10 rounded-md flex items-center justify-center`}
                disabled={selectedCards.length === 0}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>

          {/* Tabela de cartões */}
          {loading ? (
            <div className="flex justify-center items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#81059e]"></div>
            </div>
          ) : error ? (
            <p className="text-center py-4 text-red-500 bg-red-50 rounded-lg">{error}</p>
          ) : (
            <div className="w-full overflow-x-auto">
              {filteredCards.length === 0 ? (
                <p className="text-center text-gray-500 py-4">Nenhum cartão encontrado.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full table-auto select-none">
                    <thead>
                      <tr className="bg-[#81059e] text-white">
                        <th className="px-3 py-2 w-12">
                          <span className="sr-only">Selecionar</span>
                        </th>
                        <th className="px-3 py-2 cursor-pointer whitespace-nowrap" onClick={() => handleSort('cardNumber')}>
                          Nº do Cartão {renderSortArrow('cardNumber')}
                        </th>
                        <th className="px-3 py-2 cursor-pointer" onClick={() => handleSort('cardHolder')}>
                          Titular {renderSortArrow('cardHolder')}
                        </th>
                        <th className="px-3 py-2 cursor-pointer whitespace-nowrap" onClick={() => handleSort('expiration')}>
                          Vencimento {renderSortArrow('expiration')}
                        </th>
                        <th className="px-3 py-2 cursor-pointer" onClick={() => handleSort('cardBrand')}>
                          Bandeira {renderSortArrow('cardBrand')}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCards.map((card) => (
                        <tr key={card.id} className="text-black text-left hover:bg-gray-100">
                          <td className="border px-2 py-2 text-center">
                            <input
                              type="checkbox"
                              checked={selectedCards.includes(card.id)}
                              onChange={() => handleSelectCard(card.id)}
                              className="h-4 w-4 cursor-pointer"
                            />
                          </td>
                          <td className="border px-3 py-2 whitespace-nowrap">
                            {maskCardNumber(card.cardNumber)}
                          </td>
                          <td className="border px-4 py-2 max-w-[300px] truncate">
                            {card.cardHolder || 'N/A'}
                          </td>
                          <td className="border px-3 py-2 whitespace-nowrap">
                            {card.expiration || 'N/A'}
                          </td>
                          <td className="border px-3 py-2 whitespace-nowrap">
                            {card.cardBrand || 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}