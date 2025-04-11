"use client";

import { Suspense, useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { firestore } from '../../../../../lib/firebaseConfig'; // Importe a configuração do Firestore
import { addDoc, collection, Timestamp } from 'firebase/firestore';
import { useRouter, useSearchParams } from 'next/navigation'; // Usar 'useSearchParams' para ler loja e data da URL
import { format } from 'date-fns';

export function LancarCredito() {
  const router = useRouter();
  const searchParams = useSearchParams(); // Hook para pegar parâmetros da URL
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(''); // Data manualmente formatada
  const [time, setTime] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })); // Hora atual
  const [store, setStore] = useState(''); // Estado para selecionar a loja dinamicamente
  const [loading, setLoading] = useState(false); // Estado para controle de loading

  useEffect(() => {
    // Captura os parâmetros 'loja' e 'data' da URL
    const storeParam = searchParams.get('loja');
    const dateParam = searchParams.get('date');

    if (storeParam) {
      // Se 'loja1' estiver na URL, define como 'Loja 1'. Se 'loja2', define como 'Loja 2'
      const mappedStore = storeParam === 'loja1' ? 'Loja 1' : storeParam === 'loja2' ? 'Loja 2' : storeParam;
      setStore(mappedStore);
    }

    if (dateParam) {
      setDate(dateParam); // Define a data com base no valor da URL
    } else {
      // Caso não haja data na URL, define a data atual formatada como "dd-mm-yyyy"
      const today = new Date();
      const formattedDate = `${today.getDate().toString().padStart(2, '0')}-${(today.getMonth() + 1)
        .toString()
        .padStart(2, '0')}-${today.getFullYear()}`;
      setDate(formattedDate);
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault(); // Previne o comportamento padrão de envio do formulário
    setLoading(true);

    try {
      const now = new Date();
      let vendaDate = now;

      // Ajusta a data para o dia seguinte caso seja após as 18h
      if (now.getHours() >= 18) {
        vendaDate.setDate(vendaDate.getDate() + 1);
      }

      const saleTimestamp = Timestamp.fromDate(vendaDate); // Timestamp da venda

      // Dados da venda
      const saleData = {
        cliente: description, // Substitua por selectedClient.nome, se necessário
        data: saleTimestamp,
        formaPagamento: 'Entrada', // Ou outro método de pagamento
        totalVenda: amount,
        valorFinal: parseFloat(amount), // Valor do Entrada
        lojas: store, // 'Loja 1' ou 'Loja 2'
      };

      // Envia os dados para a coleção 'vendas'
      const saleRef = await addDoc(collection(firestore, 'vendas'), saleData);
      const saleId = saleRef.id;

      // Dados para o cashflow
      const cashflowData = {
        vendaId: saleId,
        data: saleTimestamp,
        cliente: description,
        formaPagamento: 'Entrada',
        valorFinal: parseFloat(amount),
        formaPagamento: 'Entrada AVULSA',
        lojas: store,
        descricao: `Venda: ${description}`, // Gera uma descrição simplificada
      };

      // Envia para a coleção 'cashflow'
      await addDoc(collection(firestore, 'cashflow'), cashflowData);

      // Conversão da loja para o formato 'loja1' ou 'loja2' para Firestore
      const storeForFirestore = store === 'Loja 1' ? 'loja1' : 'loja2';

      // Adiciona a transação no caixa do dia da loja correspondente
      const caixaPath = `${storeForFirestore}/finances/caixas/${format(vendaDate, 'dd-MM-yyyy')}/transactions`;
      const caixaTransactionData = {
        vendaId: saleId,
        data: saleTimestamp,
        valorFinal: parseFloat(amount),
        descricao: `Venda: ${description}`, // A mesma descrição do cashflow
        formaPagamento: 'Entrada AVULSA', // Tipo da transação
      };

      await addDoc(collection(firestore, caixaPath), caixaTransactionData); // Envia para o caixa do dia da loja correta

      setLoading(false);
      alert('Venda registrada com sucesso!');
      router.back(); // Redireciona para a página anterior
    } catch (error) {
      setLoading(false);
      console.error('Erro ao registrar a venda:', error);
      alert('Erro ao registrar a venda. Tente novamente.');
    }
  };

  return (
    <Layout>
      <div className="p-8">
        <h2 className="text-2xl font-bold text-[#81059e87] mb-4">Lançar Entrada</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-[#81059e87] mb-2">Descrição</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="border rounded w-full py-2 px-3 text-black"
              required
            />
          </div>
          <div className="mb-4 flex space-x-4">
            <div className="w-1/2">
              <label className="block text-[#81059e87] mb-2">Data</label>
              <input
                type="text"
                value={date} // Data formatada manualmente ou pela URL
                onChange={(e) => setDate(e.target.value)}
                className="border rounded w-full py-2 px-3 text-black"
                required
              />
            </div>
            <div className="w-1/2">
              <label className="block text-[#81059e87] mb-2">Hora</label>
              <input
                type="text"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="border rounded w-full py-2 px-3 text-black"
                required
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-[#81059e87] mb-2">Valor</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="border rounded w-full py-2 px-3 text-black"
              placeholder="R$"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-[#81059e87] mb-2">Loja</label>
            <input
              type="text"
              value={store} // Exibe "Loja 1" ou "Loja 2" no input
              className="border rounded w-full py-2 px-3 text-black"
              readOnly // O campo de loja é apenas para exibição e não deve ser editado
            />
          </div>
          <button type="submit" className="bg-[#81059e] text-white px-4 py-2 rounded-lg hover:bg-[#81059e87]" disabled={loading}>
            {loading ? 'Registrando...' : 'REGISTRAR'}
          </button>
        </form>
      </div>
    </Layout>
  );
}
export default function Page() {
  return (
    <Suspense fallback={<div> <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#81059e]"></div></div>}>
      <LancarCredito />
    </Suspense>
  );
}