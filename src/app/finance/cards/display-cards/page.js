"use client";
import React, { useState, useEffect } from 'react';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { useRouter } from 'next/navigation'; // Importa o hook useRouter
import { firestore } from '../../../../lib/firebaseConfig';
import Layout from '@/components/Layout';

export default function DisplayCardsPage() {
  const [cards, setCards] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCards, setSelectedCards] = useState([]);
  const [deletingMode, setDeletingMode] = useState(false);
  const router = useRouter(); // Hook useRouter para navegação

  useEffect(() => {
    fetchCards();
  }, []);

  const fetchCards = async () => {
    try {
      const cardsCollection = collection(firestore, 'cards');
      const cardsSnapshot = await getDocs(cardsCollection);
      const cardsList = cardsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCards(cardsList);
    } catch (error) {
      console.error('Erro ao buscar cartões:', error);
    }
  };

  const handleSelectCard = (id) => {
    if (selectedCards.includes(id)) {
      setSelectedCards(selectedCards.filter((cardId) => cardId !== id));
    } else {
      setSelectedCards([...selectedCards, id]);
    }
  };

  const handleDeleteSelectedCards = async () => {
    try {
      for (const cardId of selectedCards) {
        await deleteDoc(doc(firestore, 'cards', cardId));
      }
      setSelectedCards([]);
      setDeletingMode(false);
      fetchCards(); // Atualiza a lista após exclusão
    } catch (error) {
      console.error('Erro ao deletar cartões:', error);
    }
  };

  const filteredCards = cards.filter(card =>
    card.cardHolder.toLowerCase().includes(searchTerm.toLowerCase()) ||
    card.cardNumber.includes(searchTerm)
  );

  return (
    <Layout>
      <div className="flex justify-center items-start min-h-screen p-4 sm:p-8">
        <div className=" w-full max-w-5xl mx-auto rounded-lg">
          <h2 className="text-3xl font-bold text-[#81059e] mb-8 mt-8">LANÇAMENTOS REGISTRADOS</h2>

          <div className="flex flex-col sm:flex-row justify-between mb-6">
            <input
              type="text"
              placeholder="Busque por código ou título"
              className="p-2 h-10 flex-grow min-w-[200px] border-2 border-gray-200 rounded-lg text-black"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="flex space-x-4 justify-end">
              <button
                className="bg-[#81059e] text-white py-2 px-4 rounded"
                onClick={() => router.push('/finance/cards')}
              >
                ADICIONAR
              </button>
              <button
                className="bg-[#81059e] text-white py-2 px-4 rounded"
                onClick={() => setDeletingMode(!deletingMode)}
              >
                {deletingMode ? 'CANCELAR' : 'DELETAR'}
              </button>
              {deletingMode && (
                <button
                  className="bg-red-500 text-white py-2 px-4 rounded"
                  onClick={handleDeleteSelectedCards}
                >
                  EXCLUIR SELECIONADOS
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#81059e] text-white">
                  {deletingMode && <th className="border p-2">Selecionar</th>}
                  <th className="border p-2">Nº do Cartão</th>
                  <th className="border p-2">Titular</th>
                  <th className="border p-2">Vencimento</th>
                  <th className="border p-2">Bandeira</th>
                </tr>
              </thead>
              <tbody>
                {filteredCards.length > 0 ? (
                  filteredCards.map((card) => (
                    <tr key={card.id} className="text-center text-[#8D8D8D]">
                      {deletingMode && (
                        <td className="border p-2">
                          <input
                            type="checkbox"
                            checked={selectedCards.includes(card.id)}
                            onChange={() => handleSelectCard(card.id)}
                          />
                        </td>
                      )}
                      <td className="border p-2">{card.cardNumber}</td>
                      <td className="border p-2">{card.cardHolder}</td>
                      <td className="border p-2">{`R$${parseFloat(card.valor || 0).toFixed(2)}`}</td>
                      <td className="border p-2">{card.expiration}</td>
                      <td className="border p-2">{card.cardBrand}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={deletingMode ? 6 : 5} className="text-[#8D8D8D] border p-2 text-center">Nenhum cartão encontrado</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
