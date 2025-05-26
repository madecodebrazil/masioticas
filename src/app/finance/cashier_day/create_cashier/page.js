"use client";

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { firestore } from '../../../../lib/firebaseConfig';
import { doc, getDoc, collection, getDocs, setDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

export default function CreateCashier() {
  const router = useRouter();
  const [observations, setObservations] = useState('');
  const [loja, setLoja] = useState('loja1'); // Inicializa com loja1
  const [colaborador, setColaborador] = useState(''); // Inicializa colaborador
  const [colaboradores, setColaboradores] = useState([]); // Estado para armazenar colaboradores
  const [colaboradorError, setColaboradorError] = useState(''); // Estado para mensagem de erro do colaborador
  const [date, setDate] = useState(''); // Inicializa com string vazia
  const [time, setTime] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })); // Hora atual
  const [initialBalance, setInitialBalance] = useState('');
  const [errorMessage, setErrorMessage] = useState(''); // Estado para mensagens de erro
  const [caixaExists, setCaixaExists] = useState(false); // Estado para verificar existência de caixa

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const dateParam = params.get('date');
    const lojaParam = params.get('loja'); // Pega o parâmetro da loja

    if (dateParam) {
      const formattedDate = formatDateFromURL(dateParam); // Converte a data para "dd/mm/yyyy"
      setDate(formattedDate);
      checkExistingCashier(formattedDate); // Verifica se já existe um caixa para essa data
    }

    // Se uma loja for passada na URL, defina o estado da loja
    if (lojaParam) {
      setLoja(lojaParam);
    }

    // Função para buscar colaboradores
    const fetchColaboradores = async () => {
      try {
        const colaboradoresCollection = collection(firestore, 'colaboradores');
        const colaboradoresSnapshot = await getDocs(colaboradoresCollection);

        const colaboradoresList = colaboradoresSnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name || 'Nome não encontrado', // Valor padrão caso o nome não exista
        }));

        setColaboradores(colaboradoresList);
      } catch (error) {
        console.error('Erro ao buscar colaboradores:', error.message); // Mensagem de erro mais específica
        alert('Ocorreu um erro ao carregar os colaboradores. Por favor, tente novamente mais tarde.');
      }
    };

    fetchColaboradores(); // Chama a função para buscar colaboradores
  }, []); // Executa apenas uma vez após a montagem do componente

  // Função para formatar a data no formato "dd/mm/yyyy"
  const formatDateFromURL = (urlDate) => {
    const [day, month, year] = urlDate.split('-');
    return `${day}/${month}/${year}`; // Retorna no formato "dd/mm/yyyy"
  };

  // Função para verificar se existe um caixa na loja selecionada
  const checkExistingCashier = async (formattedDate) => {
    const dateParts = formattedDate.split('/'); // Assume que a data está no formato 'dd/mm/yyyy'
    const dateObject = new Date(`${dateParts[2]}-${dateParts[1]}-${dateParts[0]}T00:00:00`); // Formato ISO 'yyyy-mm-dd'
    const formattedFirestoreDate = `${dateObject.getUTCDate().toString().padStart(2, '0')}|${(dateObject.getUTCMonth() + 1).toString().padStart(2, '0')}|${dateObject.getUTCFullYear()}`; // "dia|mes|ano"

    try {
      const cashierDocRef = doc(firestore, `${loja}/finances/caixas/${formattedFirestoreDate}`);
      const cashierDocSnapshot = await getDoc(cashierDocRef); // Verifica a existência do caixa
      setCaixaExists(cashierDocSnapshot.exists());
    } catch (error) {
      console.error('Erro ao verificar a existência do caixa:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Verifica se um colaborador foi selecionado
    if (!colaborador) {
      setColaboradorError('Por favor, selecione um colaborador.');
      return;
    } else {
      setColaboradorError('');
    }

    const cashierData = {
      observations,
      loja,
      colaborador,
      date,
      time,
      initialBalance: parseFloat(initialBalance)
    };

    // Cria um objeto de data a partir da string 'date'
    const dateParts = date.split('/'); // Assume que a data está no formato 'dd/mm/yyyy'
    const dateObject = new Date(`${dateParts[2]}-${dateParts[1]}-${dateParts[0]}T00:00:00`); // Formato ISO 'yyyy-mm-dd'

    // Formata a data como "dd-mm-yyyy"
    const formattedDate = `${dateObject.getUTCDate().toString().padStart(2, '0')}-${(dateObject.getUTCMonth() + 1).toString().padStart(2, '0')}-${dateObject.getUTCFullYear()}`; // "dd-mm-yyyy"

    try {
      // Verifica se já existe um caixa para a data selecionada
      if (caixaExists) {
        setErrorMessage('Já existe um caixa aberto para esta data.');
        return;
      }

      // Salva o caixa na estrutura desejada: loja > finances > caixas > "dd-mm-yyyy"
      await setDoc(doc(firestore, `${loja}/finances/caixas/${formattedDate}`), cashierData);
      alert('Caixa aberto com sucesso!');

      // Redireciona para a página daily_cashier_overview com a loja e a data no formato correto
      router.push(`/finance/cashier_day/daily_cashier_overview?date=${formattedDate}&loja=${loja}`);
    } catch (error) {
      console.error('Erro ao abrir o caixa:', error);
      alert('Erro ao abrir o caixa. Verifique o console para mais detalhes.');
    }
  };


  return (
    <Layout>
      <div className="p-8">
        <h2 className="text-2xl font-bold text-[#81059e87] mb-4">ABERTURA DE CAIXA</h2>
        {errorMessage && <p className="text-red-500 mb-4">{errorMessage}</p>} {/* Exibe mensagem de erro */}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-[#81059e87] mb-2">Observações</label>
            <input
              type="text"
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              className="border rounded w-full py-2 px-3 text-black" // Texto em preto
            />
          </div>
          <div className="mb-4 flex space-x-4"> {/* Alinha os campos "Loja" e "Colaborador" lado a lado */}
            <div className="w-1/2">
              <label className="block text-[#81059e87] mb-2">Loja</label>
              <select
                value={loja}
                onChange={(e) => setLoja(e.target.value)}
                className="border rounded w-full py-2 px-3 text-black"
                disabled={true}
              >
                <option value="loja1">Óticas Popular 1</option>
                <option value="loja2">Óticas Popular 2</option>
              </select>
            </div>
            <div className="w-1/2">
              <label className="block text-[#81059e87] mb-2">Colaborador</label>
              <select
                value={colaborador}
                onChange={(e) => setColaborador(e.target.value)}
                className="border rounded w-full py-2 px-3 text-black"
                required
              >
                <option value="">Selecione um colaborador</option>
                {colaboradores.map((colab) => (
                  <option key={colab.id} value={colab.name}>{colab.name}</option>
                ))}
              </select>
              {colaboradorError && <p className="text-red-500 text-sm mt-1">{colaboradorError}</p>}
            </div>
          </div>
          <div className="mb-4 flex space-x-4"> {/* Alinha os campos "Data" e "Hora" lado a lado */}
            <div className="w-1/2">
              <label className="block text-[#81059e87] mb-2">Data</label>
              <input
                type="text"
                value={date}
                className="border rounded w-full py-2 px-3 text-black"
                readOnly
              />
            </div>
            <div className="w-1/2">
              <label className="block text-[#81059e87] mb-2">Hora</label>
              <input
                type="text"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="border rounded w-full py-2 px-3 text-black"
              />
            </div>
          </div>
          <h2 className='text-[#81059e87] font-bold mb-2'>INSIRA O SALDO INICIAL DO CAIXA</h2>
          <div className="mb-4 flex items-center">
            <input
              type="number"
              value={initialBalance}
              onChange={(e) => setInitialBalance(e.target.value)}
              className="border rounded w-1/3 py-2 px-3 text-black"
              placeholder="R$"
              required
            />
            <button type="submit" className={`bg-[#81059e] text-white px-4 py-2 rounded-lg hover:bg-[#81059e87] ml-2 ${caixaExists ? 'opacity-50 cursor-not-allowed' : ''}`} disabled={caixaExists}>
              ABRIR CAIXA
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
