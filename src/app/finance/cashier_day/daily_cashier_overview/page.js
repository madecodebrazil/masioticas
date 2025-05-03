"use client";

import { useEffect, Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Layout from '@/components/Layout';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { firestore } from '../../../../lib/firebaseConfig';

export function ListaTransacoes() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const loja = searchParams.get('loja');

  const [caixaData, setCaixaData] = useState(null);
  const [transacoes, setTransacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterDate, setFilterDate] = useState(new Date());
  const [saldoFinal, setSaldoFinal] = useState(0);
  const [isAfterHours, setIsAfterHours] = useState(false);

  const formatDate = (date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const formatDateForDisplay = (date) => {
    if (!date) return 'Não disponível';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const calcularSaldoFinal = (initialBalance, transacoes) => {
    const totalTransacoes = transacoes.reduce((acc, transacao) => {
      if (transacao.formaPagamento === 'Crediário') {
        return acc + (transacao.entrada ? parseFloat(transacao.entrada) : 0);
      }
      return acc + (transacao.valorFinal ? parseFloat(transacao.valorFinal) : 0);
    }, 0);
    return (initialBalance ? parseFloat(initialBalance) : 0) + totalTransacoes;
  };

  useEffect(() => {
    const currentTime = new Date();
    const currentHour = currentTime.getHours();
    if (currentHour >= 18) {
      setIsAfterHours(true);
    }
  }, []);

  useEffect(() => {
    const fetchCaixaAndTransacoes = async () => {
      try {
        setLoading(true);
        const formattedDate = formatDate(filterDate);

        const caixaDocRef = doc(firestore, `${loja}/finances/caixas/${formattedDate}`);
        const caixaDoc = await getDoc(caixaDocRef);

        if (!caixaDoc.exists()) {
          setError("Nenhum dado encontrado para a data e loja selecionada.");
          setLoading(false);
          return;
        }

        const caixaData = caixaDoc.data();
        setCaixaData(caixaData);

        const transacoesSnapshot = await getDocs(collection(firestore, `${loja}/finances/caixas/${formattedDate}/transactions`));
        const fetchedTransacoes = transacoesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          entrada: doc.data().entrada ? parseFloat(doc.data().entrada) : 0,
          valorFinal: doc.data().valorFinal ? parseFloat(doc.data().valorFinal) : 0,
          data: doc.data().data && doc.data().data.seconds ? doc.data().data.toDate() : null
        }));

        setTransacoes(fetchedTransacoes);
        const saldo = calcularSaldoFinal(caixaData.initialBalance, fetchedTransacoes);
        setSaldoFinal(saldo);

        setLoading(false);
      } catch (err) {
        setError('Erro ao carregar os dados do caixa.');
        setLoading(false);
      }
    };

    fetchCaixaAndTransacoes();
  }, [filterDate, loja]);

  const handleAddCredit = () => {
    const formattedDate = formatDate(filterDate);
    router.push(`/finance/cashier_day/daily_cashier_overview/launch_credit?date=${formattedDate}&loja=${loja}`);
  };

  const handleAddDebit = () => {
    const formattedDate = formatDate(filterDate);
    router.push(`/finance/cashier_day/daily_cashier_overview/launch_debit?date=${formattedDate}&loja=${loja}`);
  };

  const handleAddSangria = () => {
    const formattedDate = formatDate(filterDate);
    router.push(`/finance/cashier_day/daily_cashier_overview/launch_sangria?date=${formattedDate}&loja=${loja}`);
  };

  return (
    <Layout>
      <div className="flex flex-col items-center h-full p-4 sm:p-8">
        <div className="flex-1 w-full max-w-6xl bg-[#F7F7F9] rounded-lg p-4 sm:p-8 shadow-lg">
          <h2 className="text-2xl sm:text-3xl font-semibold text-[#81059e] mb-4 sm:mb-6">Detalhes do Caixa do Dia</h2>

          {/* Filtro por data */}
          <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row items-start sm:items-center">
            <label className="text-lg font-semibold text-[#81059e] mb-2 sm:mb-0">Selecionar Data: </label>
            <input
              type="date"
              value={filterDate.toISOString().substring(0, 10)}
              onChange={(e) => setFilterDate(new Date(e.target.value))}
              className="ml-0 sm:ml-4 p-2 border border-purple-300 rounded-md text-black"
            />
          </div>

          {loading ? (
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#81059e]"></div>
          ) : error ? (
            <p>{error}</p>
          ) : (
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
              {caixaData && (
                <div className="mb-4 sm:mb-6">
                  <h3 className="text-xl sm:text-2xl text-[#81059e] font-semibold mb-4">Informações do Caixa</h3>
                  <p className="text-black"><strong>Data:</strong> {caixaData.date}</p>
                  <p className="text-black">
                    <strong>Saldo Inicial:</strong> R$ {caixaData.initialBalance !== undefined ? caixaData.initialBalance.toFixed(2) : 'Não disponível'}
                  </p>
                  <p className="text-black"><strong>Loja:</strong> {caixaData.loja}</p>
                  <p className="text-black"><strong>Observações:</strong> {caixaData.observations || 'Nenhuma'}</p>
                  <p className="text-black"><strong>Hora de Abertura:</strong> {caixaData.time}</p>
                </div>
              )}

              {transacoes.length === 0 ? (
                <p className="text-black">Nenhuma transação encontrada para o dia selecionado.</p>
              ) : (
                <div>
                  <h3 className="text-xl sm:text-2xl text-[#81059e] font-semibold mb-4">Transações do Caixa</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full table-auto">
                      <thead>
                        <tr className="bg-[#81059e] text-white">
                          <th className="px-4 py-2">ID da Transação</th>
                          <th className="px-4 py-2">Descrição</th>
                          <th className="px-4 py-2">Valor</th>
                          <th className="px-4 py-2">Método de Pagamento</th>
                          <th className="px-4 py-2">Data</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transacoes.map((transacao) => (
                          <tr key={transacao.id} className="text-black text-center">
                            <td className="border px-4 py-2">{transacao.id}</td>
                            <td className="border px-4 py-2">{transacao.descricao}</td>
                            <td className="border px-4 py-2">
                              {`R$ ${isNaN(parseFloat(transacao.valorFinal)) ? 'Valor inválido' : parseFloat(transacao.valorFinal).toFixed(2)}`}
                            </td>
                            <td className="border px-4 py-2">{transacao.formaPagamento}</td>
                            <td className="border px-4 py-2">
                              {transacao.data ? formatDateForDisplay(transacao.data) : 'Não disponível'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="text-right mt-4 sm:mt-6">
                <h3 className="text-lg sm:text-xl font-bold">Saldo Final:</h3>
                <p className={`text-xl sm:text-2xl font-bold ${saldoFinal >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  R$ {saldoFinal.toFixed(2)}
                </p>
              </div>
            </div>
          )}

          <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row justify-between space-y-2 sm:space-y-0 sm:space-x-4">
            <button
              onClick={handleAddCredit}
              className="bg-green-500 text-white px-6 py-2 rounded-md hover:bg-green-600 w-full sm:w-auto"
              disabled={isAfterHours}
            >
              Adicionar Entrada
            </button>
            <button
              onClick={handleAddDebit}
              className="bg-red-500 text-white px-6 py-2 rounded-md hover:bg-red-600 w-full sm:w-auto"
              disabled={isAfterHours}
            >
              Adicionar Despesa
            </button>
            <button
              onClick={handleAddSangria}
              className="bg-yellow-500 text-white px-6 py-2 rounded-md hover:bg-yellow-600 w-full sm:w-auto"
              disabled={isAfterHours}
            >
              Sangria
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
export default function Page() {
  return (
    <Suspense fallback={<div> <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#81059e]"></div></div>}>
      <ListaTransacoes />
    </Suspense>
  );
}