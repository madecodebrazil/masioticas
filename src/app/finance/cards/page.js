"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation'; // Importando o hook useRouter
import { collection, setDoc, doc, getDocs, query, where } from 'firebase/firestore'; 
import { firestore } from '../../../lib/firebaseConfig'; 
import Layout from '@/components/Layout';

const CardPaymentForm = () => {
  const router = useRouter(); // Inicializando o useRouter para navegação

  const [cardData, setCardData] = useState({
    cardNumber: '',
    cardHolder: '',
    expiration: '',
    cvv: '',
    installments: '',
    cpf: '',
    cardBrand: '', 
  });

  const [suggestions, setSuggestions] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const suggestionRef = useRef(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCardData({ ...cardData, [name]: value });

    if (name === 'cardHolder') {
      setShowSuggestions(true);
      fetchConsumers(value);
    }
  };

  const fetchConsumers = async (searchTerm) => {
    try {
      const consumersRef = collection(firestore, 'consumers');
      const consumersSnapshot = await getDocs(consumersRef);

      const filteredConsumers = consumersSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(consumer => 
          consumer.nome && 
          consumer.nome.toLowerCase().startsWith(searchTerm.toLowerCase())
        );

      setSuggestions(filteredConsumers);
    } catch (error) {
      console.error('Erro ao buscar consumidores:', error);
    }
  };

  const handleSuggestionClick = (consumer) => {
    setCardData({ ...cardData, cardHolder: consumer.nome, cpf: consumer.cpf });
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleClickOutside = (event) => {
    if (suggestionRef.current && !suggestionRef.current.contains(event.target)) {
      setShowSuggestions(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleBrandSelect = (brand) => {
    setCardData({ ...cardData, cardBrand: brand });
  };

  const handleExpirationInput = (e) => {
    let value = e.target.value.replace(/\D/g, ''); 
    if (value.length > 2) {
      value = value.slice(0, 2) + '/' + value.slice(2);
    }
    if (value.length > 7) {
      value = value.slice(0, 7); 
    }
    setCardData({ ...cardData, expiration: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const cardsRef = collection(firestore, 'cards');
    const q = query(cardsRef, where('cardNumber', '==', cardData.cardNumber));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      setErrorMessage('Este cartão já está registrado.');
      return;
    }

    try {
      const docRef = doc(firestore, 'cards', cardData.cpf);
      await setDoc(docRef, {
        cardNumber: cardData.cardNumber,
        cardHolder: cardData.cardHolder,
        expiration: cardData.expiration,
        cvv: cardData.cvv,
        installments: cardData.installments,
        cpf: cardData.cpf,
        cardBrand: cardData.cardBrand, 
      });
      setErrorMessage('');
      alert('Cartão registrado com sucesso!');
    } catch (error) {
      setErrorMessage('Erro ao registrar o cartão. Tente novamente.');
    }
  };

  const handleDisplayCards = () => {
    router.push('/finance/cards/display-cards'); // Navega para a rota desejada
  };

  return (
    <Layout>
      <div className="flex justify-center items-center min-h-screen p-4">
        <div className="bg-white shadow-lg rounded-lg p-6 w-full max-w-lg">
          <h2 className="text-[#932A83] text-2xl font-bold mb-6 text-center">Lançar no Cartão</h2>

          <form onSubmit={handleSubmit}>
            {/* Seletor de Bandeira */}
            <div className="mb-6">
              <label className="block text-[#932A8387] mb-2">Emissor</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {['VISA', 'MASTERCARD', 'AMEX', 'ELO', 'HIPERCARD', 'DINNER CLUB', 'DISCOVER'].map((brand) => (
                  <button
                    type="button"
                    key={brand}
                    onClick={() => handleBrandSelect(brand)}
                    className={`border border-[#932A8387] py-2 md:py-4 rounded transition-colors duration-300 
                    ${cardData.cardBrand === brand 
                      ? 'bg-[#932A83] text-white' 
                      : 'bg-white text-[#932A8387] hover:bg-[#e0b1d2] hover:text-white'
                    }`}
                  >
                    {brand}
                  </button>
                ))}
              </div>
            </div>

            {/* Nome do Titular */}
            <div className="mb-6 relative" ref={suggestionRef}>
              <label className="block text-[#932A8387] mb-2">Nome do Titular</label>
              <input
                type="text"
                name="cardHolder"
                className="w-full p-2 border border-[#932A8387] rounded text-black"
                placeholder="Nome do Titular"
                value={cardData.cardHolder}
                onChange={handleInputChange}
                onFocus={() => setShowSuggestions(true)} 
                required
              />
              {/* Sugestões de consumidores */}
              {showSuggestions && suggestions.length > 0 && (
                <ul className="absolute z-50 bg-white border border-[#932A8387] mt-1 w-full rounded shadow-lg max-h-60 overflow-y-auto">
                  {suggestions.map((consumer) => (
                    <li
                      key={consumer.id}
                      className="p-2 cursor-pointer hover:bg-[#932A83] hover:text-white text-black"
                      onClick={() => handleSuggestionClick(consumer)}
                    >
                      {consumer.nome} - {consumer.cpf}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Dados do Cartão */}
            <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[#932A8387] mb-2">Número do Cartão</label>
                <input
                  type="text"
                  name="cardNumber"
                  className="w-full p-2 border border-[#932A8387] rounded text-black"
                  placeholder="Número do Cartão"
                  value={cardData.cardNumber}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <label className="block text-[#932A8387] mb-2">Validade</label>
                <input
                  type="text"
                  name="expiration"
                  className="w-full p-2 border border-[#932A8387] rounded text-black"
                  placeholder="MM/AAAA"
                  value={cardData.expiration}
                  onChange={handleExpirationInput} 
                  required
                />
              </div>
            </div>

            <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[#932A8387] mb-2">Código de Autenticação</label>
                <input
                  type="text"
                  name="cvv"
                  className="w-full p-2 border border-[#932A8387] rounded text-black"
                  placeholder="CVV"
                  value={cardData.cvv}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <label className="block text-[#932A8387] mb-2">Qtd de Parcelas</label>
                <input
                  type="text"
                  name="installments"
                  className="w-full p-2 border border-[#932A8387] rounded text-black"
                  placeholder="Parcelas"
                  value={cardData.installments}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            {/* CPF do Cliente */}
            <div className="mb-6">
              <label className="block text-[#932A8387] mb-2">CPF do Cliente</label>
              <input
                type="text"
                name="cpf"
                className="w-full p-2 border border-[#932A8387] rounded text-black"
                placeholder="CPF"
                value={cardData.cpf}
                onChange={handleInputChange}
                required
              />
            </div>

            {/* Mensagem de erro */}
            {errorMessage && (
              <div className="text-red-500 mb-4">{errorMessage}</div>
            )}

            {/* Botões */}
            <div className="flex justify-between">
              <button className="bg-[#932A83] text-white py-2 px-4 rounded">
                Registrar
              </button>
              <button
                type="button"
                onClick={handleDisplayCards}
                className="bg-[#932A83] text-white py-2 px-4 rounded"
              >
                Reg. de Cartões
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default CardPaymentForm;
