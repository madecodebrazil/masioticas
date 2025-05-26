"use client";

import { Suspense, useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { firestore } from '../../../../../lib/firebaseConfig';
import { addDoc, collection, Timestamp } from 'firebase/firestore';
import { useRouter, useSearchParams } from 'next/navigation';
import { format } from 'date-fns';

export function LancarDespesa() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  const [store, setStore] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const storeParam = searchParams.get('loja');
    const dateParam = searchParams.get('date');

    if (storeParam) {
      const mappedStore = storeParam === 'loja1' ? 'Loja 1' : storeParam === 'loja2' ? 'Loja 2' : storeParam;
      setStore(mappedStore);
    }

    if (dateParam) {
      setDate(dateParam);
    } else {
      const today = new Date();
      const formattedDate = `${today.getDate().toString().padStart(2, '0')}-${(today.getMonth() + 1)
        .toString()
        .padStart(2, '0')}-${today.getFullYear()}`;
      setDate(formattedDate);
    }
  }, [searchParams]);

  const handleSubmit = async () => {
    setLoading(true);

    try {
      const now = new Date();
      let vendaDate = now;

      if (now.getHours() >= 18) {
        vendaDate.setDate(vendaDate.getDate() + 1);
      }

      const saleTimestamp = Timestamp.fromDate(vendaDate);

      // Dados da despesa
      const despesaData = {
        descricao: description,
        data: saleTimestamp,
        formaPagamento: 'Despesa',
        valorFinal: -Math.abs(parseFloat(amount)),
        lojas: store,
      };

      console.log("Dados da Despesa:", despesaData);

      // Envia os dados para a coleção 'despesas'
      const despesaRef = await addDoc(collection(firestore, 'despesas'), despesaData);
      const despesaId = despesaRef.id;

      // Dados para o cashflow
      const cashflowData = {
        despesaId: despesaId,
        data: saleTimestamp,
        descricao: `Despesa para ${description}`,
        formaPagamento: 'Despesa',
        valorFinal: -Math.abs(parseFloat(amount)),
        lojas: store,
      };

      console.log("Dados do Cashflow:", cashflowData);

      await addDoc(collection(firestore, 'cashflow'), cashflowData);

      const storeForFirestore = store === 'Loja 1' ? 'loja1' : 'loja2';

      const caixaPath = `${storeForFirestore}/finances/caixas/${format(vendaDate, 'dd-MM-yyyy')}/transactions`;
      const caixaTransactionData = {
        despesaId: despesaId,
        data: saleTimestamp,
        valorFinal: -Math.abs(parseFloat(amount)),
        descricao: `Despesa para ${description}`,
        formaPagamento: 'Despesa',
      };

      console.log("Dados da Transação no Caixa:", caixaTransactionData);

      await addDoc(collection(firestore, caixaPath), caixaTransactionData);

      setLoading(false);
      alert('Despesa registrada com sucesso!');
      router.back(); // Redireciona para a página anterior
    } catch (error) {
      setLoading(false);
      console.error('Erro ao registrar a despesa:', error);
      alert('Erro ao registrar a despesa. Tente novamente.');
    }
  };

  return (
    <Layout>
      <div className="p-8">
        <h2 className="text-2xl font-bold text-[#81059e87] mb-4">Lançar Despesa</h2>
        <div>
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
                value={date}
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
              value={store}
              className="border rounded w-full py-2 px-3 text-black"
              readOnly
            />
          </div>
          <button onClick={handleSubmit} className="bg-[#81059e] text-white px-4 py-2 rounded-lg hover:bg-[#81059e87]" disabled={loading}>
            {loading ? 'Registrando...' : 'REGISTRAR DESPESA'}
          </button>
        </div>
      </div>
    </Layout>
  );
}
export default function Page() {
  return (
    <Suspense fallback={<div> <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#81059e]"></div></div>}>
      <LancarDespesa />
    </Suspense>
  );
}
