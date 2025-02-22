"use client";
export const dynamic = "force-dynamic";
import { useState, useEffect } from "react";
import { collection, query, getDocs, where, orderBy } from "firebase/firestore";
import { firestore } from '../../../lib/firebaseConfig';
import Layout from '@/components/Layout';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format, startOfDay, endOfDay } from 'date-fns';
import { Timestamp } from "firebase/firestore";  // Importa o Timestamp do Firestore

const CashflowPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [startDate, setStartDate] = useState(startOfDay(new Date())); // Início do dia atual
  const [endDate, setEndDate] = useState(endOfDay(new Date())); // Final do dia atual
  const [balance, setBalance] = useState(0);

  // Função para buscar transações com filtro de data
  const fetchTransactions = async () => {
    try {
      // Converte as datas selecionadas para Timestamp do Firestore
      const startTimestamp = Timestamp.fromDate(startDate);
      const endTimestamp = Timestamp.fromDate(endDate);
  
      // Query para buscar transações com base no filtro de data
      const q = query(
        collection(firestore, 'cashflow'),
        where('data', '>=', startTimestamp),
        where('data', '<=', endTimestamp),
        orderBy('data', 'asc')
      );
  
      const querySnapshot = await getDocs(q);
  
      const fetchedTransactions = [];
      let calculatedBalance = 0;
  
      querySnapshot.forEach((doc) => {
        const data = doc.data();
  
        // Verifica o método de pagamento e ajusta o valor somado
        let valorSomado = 0;
  
        // Ignorar transações de "Sangria" no cálculo do saldo, mas incluí-las na lista
        if (data.formaPagamento !== "Sangria") {
          // Se for crediário e tiver entrada, soma a entrada
          if (data.formaPagamento === "Crediário") {
            valorSomado = data.entrada ? parseFloat(data.entrada) : 0;
          } else {
            // Para os outros métodos, soma o valor total (valorFinal)
            valorSomado = data.valorFinal ? parseFloat(data.valorFinal) : 0;
          }
  
          // Soma o valor ajustado ao saldo total
          calculatedBalance += valorSomado;
        }
  
        // Adiciona a transação, independentemente de ser "Sangria" ou não
        fetchedTransactions.push({
          id: doc.id,  // Adiciona o ID do documento para chave única na renderização
          ...data
        });
      });
  
      setTransactions(fetchedTransactions);
      setBalance(calculatedBalance); // Atualiza o saldo com a soma dos valores
    } catch (error) {
      console.error("Erro ao buscar transações:", error);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [startDate, endDate]);

  return (
    <Layout>
      <div className="min-h-screen">
        <div className="w-full bg-white rounded-lg p-2">
          <h2 className="text-lg font-bold text-[#a9529c] mb-6">FLUXO DE CAIXA</h2>

          {/* Filtro de Data */}
          <div className="mb-6">
            <h2 className="text-lg font-bold text-[#a9529c] mb-2">PERÍODO</h2>
            <div className="flex flex-col md:flex-row md:space-x-4 space-y-4 md:space-y-0">
              <div>
                <label className="block text-sm text-gray-600">DE:</label>
                <DatePicker
                  selected={startDate}
                  onChange={(date) => setStartDate(startOfDay(date))} // Início do dia
                  dateFormat="dd/MM/yyyy"
                  className="w-full p-2 border border-purple-300 bg-[#932a83] text-white rounded-md custom-datepicker"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600">ATÉ:</label>
                <DatePicker
                  selected={endDate}
                  onChange={(date) => setEndDate(endOfDay(date))} // Final do dia
                  dateFormat="dd/MM/yyyy"
                  className="w-full p-2 border border-purple-300 bg-[#932a83] text-white rounded-md custom-datepicker"
                />
              </div>
              <button
                onClick={fetchTransactions}
                className="bg-[#a9529c] text-white px-4 py-2 rounded-md mt-6"
              >
                Buscar
              </button>
            </div>
          </div>

          {/* Tabela de Transações */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse mb-6">
              <thead>
                <tr className="bg-[#e8e8f3] text-left">
                  <th className="p-2 sm:p-4 text-black">Data</th>
                  <th className="p-2 sm:p-4 text-black">Cliente</th>
                  <th className="p-2 sm:p-4 text-black">Descrição</th>
                  <th className="p-2 sm:p-4 text-black">Tipo</th>
                  <th className="p-2 sm:p-4 text-black">Valor</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length > 0 ? (
                  transactions.map((transaction, index) => (
                    <tr key={transaction.id} className="border-t border-gray-300">
                      <td className="p-2 sm:p-4 text-black">
                        {transaction.data?.seconds
                          ? format(new Date(transaction.data.seconds * 1000), 'dd/MM/yyyy')
                          : 'Data inválida'}
                      </td>
                      <td className="p-2 sm:p-4 text-black">{transaction.nome || 'Sem cliente'}</td>
                      <td className="p-2 sm:p-4 text-black">{transaction.descricao || 'Sem descrição'}</td>
                      <td className="p-2 sm:p-4 text-black">
                        {transaction.formaPagamento || 'Tipo indefinido'}
                      </td>
                      <td className={`p-2 sm:p-4 text-black ${parseFloat(transaction.valorFinal) < 0 ? 'text-red-500' : ''}`}>
                        R$ {transaction.valorFinal ? parseFloat(transaction.valorFinal).toFixed(2) : "0.00"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center p-4 text-gray-500">Nenhuma transação encontrada</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Saldo Final */}
          <div className="text-right font-bold text-lg">
            <span>SALDO: </span>
            <span className={`text-lg ${balance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              R$ {balance.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CashflowPage;
