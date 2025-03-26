// Componente para processamento de pagamento com cartão

import { useState } from 'react';
import { FiCreditCard, FiCalendar, FiLock, FiUser, FiX } from 'react-icons/fi';

const CreditCardForm = ({ onSubmit, onCancel, valorTotal }) => {
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [parcelas, setParcelas] = useState(1);
  const [tipoCartao, setTipoCartao] = useState('credito');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Função para formatar número do cartão

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };
  const formatCardNumber = (value) => {
    const numbers = value.replace(/\D/g, '');
    const groups = [];
    
    for (let i = 0; i < numbers.length; i += 4) {
      groups.push(numbers.slice(i, i + 4));
    }
    
    return groups.join(' ').slice(0, 19); // Limita a 16 dígitos + espaços
  };
  
  // Função para formatar data de expiração
  const formatExpiryDate = (value) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 2) return numbers;
    return numbers.slice(0, 2) + '/' + numbers.slice(2, 4);
  };
  
  // Função para detectar a bandeira do cartão
  const detectCardBrand = (number) => {
    const numberOnly = number.replace(/\D/g, '');
    
    // Regex simplificados para identificar algumas bandeiras comuns
    const patterns = {
      visa: /^4/,
      mastercard: /^5[1-5]/,
      amex: /^3[47]/,
      elo: /^(4011|4312|4389|5041|5066|5067|4576|4011)/,
      hipercard: /^(606282|637095|637599|637568)/
    };
    
    for (const [brand, pattern] of Object.entries(patterns)) {
      if (pattern.test(numberOnly)) return brand;
    }
    
    return 'generic';
  };
  
  // Ação de submissão do cartão
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validações básicas
    if (cardNumber.replace(/\D/g, '').length < 16) {
      setError('Número de cartão inválido');
      return;
    }
    
    if (!cardName.trim()) {
      setError('Nome no cartão é obrigatório');
      return;
    }
    
    if (expiryDate.length < 5) {
      setError('Data de expiração inválida');
      return;
    }
    
    if (cvv.length < 3) {
      setError('CVV inválido');
      return;
    }
    
    try {
      setLoading(true);
      
      // Aqui você integraria com um gateway de pagamento real
      // Esta é uma simulação de processamento
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Extrair mês e ano da data de expiração
      const [month, year] = expiryDate.split('/');
      
      // Detectar a bandeira
      const cardBrand = detectCardBrand(cardNumber);
      
      // Dados que seriam retornados pelo gateway
      const paymentResult = {
        success: true,
        transaction_id: `tx_${Date.now()}`,
        card: {
          last4: cardNumber.replace(/\D/g, '').slice(-4),
          brand: cardBrand,
          holder_name: cardName,
          expiration_date: expiryDate,
        },
        auth_code: Math.random().toString(36).substring(2, 10).toUpperCase(),
        installments: parcelas,
        amount: valorTotal,
        type: tipoCartao,
        status: 'approved'
      };
      
      onSubmit(paymentResult);
    } catch (err) {
      console.error('Erro ao processar pagamento:', err);
      setError('Falha ao processar o pagamento. Verifique os dados e tente novamente.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="bg-white rounded-sm border-2 border-[#81059e]">
      <div className="flex justify-between items-center mb-4">
        <div className='bg-[#81059e] text-white p-4 flex justify-between items-center w-full'>
        <h3 className="text-lg font-bold">Pagamento com Cartão</h3>

        <button 
          onClick={onCancel}
          className="text-gray-100 hover:text-gray-400 flex-justify-end "
        >
          <FiX size={20} />
        </button>
        </div>
      </div>

      <div className='p-6'>
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 mb-4">
          <p>{error}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <div className="flex gap-4 mb-3">
            <label className="flex items-center">
              <input
                type="radio"
                checked={tipoCartao === 'credito'}
                onChange={() => setTipoCartao('credito')}
                className="mr-2"
              />
              Crédito
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                checked={tipoCartao === 'debito'}
                onChange={() => setTipoCartao('debito')}
                className="mr-2"
              />
              Débito
            </label>
          </div>
          
          {tipoCartao === 'credito' && (
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Parcelas
              </label>
              <select
                value={parcelas}
                onChange={(e) => setParcelas(Number(e.target.value))}
                className="border border-gray-300 rounded-md p-2 w-full"
              >
                <option value={1}>1x de {formatCurrency(valorTotal)}</option>
                <option value={2}>2x de {formatCurrency(valorTotal / 2)}</option>
                <option value={3}>3x de {formatCurrency(valorTotal / 3)}</option>
                <option value={4}>4x de {formatCurrency(valorTotal / 4)}</option>
                <option value={5}>5x de {formatCurrency(valorTotal / 5)}</option>
                <option value={6}>6x de {formatCurrency(valorTotal / 6)}</option>
                <option value={10}>10x de {formatCurrency(valorTotal / 10)}</option>
                <option value={12}>12x de {formatCurrency(valorTotal / 12)}</option>
              </select>
            </div>
          )}
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <FiCreditCard className="inline mr-1" /> Número do Cartão
          </label>
          <input
            type="text"
            value={cardNumber}
            onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
            className="border border-gray-300 rounded-md p-2 w-full"
            placeholder="0000 0000 0000 0000"
            maxLength={19}
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <FiUser className="inline mr-1" /> Nome no Cartão
          </label>
          <input
            type="text"
            value={cardName}
            onChange={(e) => setCardName(e.target.value.toUpperCase())}
            className="border border-gray-300 rounded-md p-2 w-full"
            placeholder="NOME COMO ESTÁ NO CARTÃO"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <FiCalendar className="inline mr-1" /> Data de Validade
            </label>
            <input
              type="text"
              value={expiryDate}
              onChange={(e) => setExpiryDate(formatExpiryDate(e.target.value))}
              className="border border-gray-300 rounded-md p-2 w-full"
              placeholder="MM/AA"
              maxLength={5}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <FiLock className="inline mr-1" /> CVV
            </label>
            <input
              type="text"
              value={cvv}
              onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
              className="border border-gray-300 rounded-md p-2 w-full"
              placeholder="123"
              maxLength={4}
            />
          </div>
        </div>
        
        <div className="text-xs text-gray-500 mb-6">
          <p>• Seus dados de cartão serão processados com segurança</p>
          <p>• Apenas os 4 últimos dígitos serão armazenados no sistema</p>
          <p>• As informações são criptografadas</p>
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#81059e] text-white py-3 px-4 rounded-lg flex items-center justify-center font-medium hover:bg-[#6f0486] disabled:bg-purple-300 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <div className="animate-spin h-5 w-5 border-2 border-white rounded-full border-t-transparent mr-2"></div>
              Processando...
            </>
          ) : (
            <>
              Finalizar Pagamento {valorTotal ? `(${formatCurrency(valorTotal)})` : ''}
            </>
          )}
        </button>
      </form>
      </div>
    </div>
  );
};

export default CreditCardForm;