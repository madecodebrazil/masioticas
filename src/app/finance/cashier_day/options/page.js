"use client";

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import Link from 'next/link';
import { firestore } from '../../../../lib/firebaseConfig'; // Importe seu arquivo de configuração do Firestore
import { doc, getDoc } from 'firebase/firestore';

export default function OpcoesCaixa() {
  const [date, setDate] = useState('');
  const [caixaExistsInLoja1, setCaixaExistsInLoja1] = useState(false);
  const [caixaExistsInLoja2, setCaixaExistsInLoja2] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const dateParam = params.get('date');
    if (dateParam) {
      setDate(dateParam);
      checkCaixaExists(dateParam);
    }
  }, []); // Executa apenas uma vez após a montagem do componente

  // Função para verificar se existe um caixa nas duas lojas
  const checkCaixaExists = async (dateString) => {
    // Corrige o formato da data de "dd-mm-yyyy" para "yyyy-mm-dd"
    const [day, month, year] = dateString.split('-');
    const formattedDate = `${day.padStart(2, '0')}-${month.padStart(2, '0')}-${year}`;

    try {
      // Verifica nas duas lojas
      const loja1Ref = doc(firestore, `loja1/finances/caixas/${formattedDate}`);
      const loja2Ref = doc(firestore, `loja2/finances/caixas/${formattedDate}`);

      const [loja1Doc, loja2Doc] = await Promise.all([getDoc(loja1Ref), getDoc(loja2Ref)]);

      // Verifica se já existe caixa em cada loja
      setCaixaExistsInLoja1(loja1Doc.exists());
      setCaixaExistsInLoja2(loja2Doc.exists());
    } catch (error) {
      console.error("Erro ao verificar a existência do caixa:", error);
      setCaixaExistsInLoja1(false);
      setCaixaExistsInLoja2(false);
    }
  };

  // Formata a data para visualização
  const formattedDate = date ? `${date.split('-').reverse().join('/')}` : '';

  return (
    <Layout>
      <div className="max-w-7xl mx-auto bg-white mt-8 mb-20 text-center">
        <h2 className="text-4xl font-bold text-[#81059e] mb-4">
          CAIXA DO DIA {formattedDate}
        </h2>
        <p className="text-lg mb-8">Escolha uma opção para a data selecionada.</p>

        <div className="flex justify-center space-x-4">
          {caixaExistsInLoja1 || caixaExistsInLoja2 ? (
            <>
              {caixaExistsInLoja1 && (
                <Link href={`/finance/cashier_day/daily_cashier_overview?date=${date}&loja=loja1`}>
                <button className="bg-[#81059e] text-white px-6 py-3 rounded-lg shadow-lg hover:bg-purple-500">
                  Visualizar Caixa da Loja 1
                </button>
              </Link>
              )}
              {caixaExistsInLoja2 && (
                <Link href={`/finance/cashier_day/daily_cashier_overview?date=${date}&loja=loja2`}>
                <button className="bg-[#81059e] text-white px-6 py-3 rounded-lg shadow-lg hover:bg-purple-500">
                  Visualizar Caixa da Loja 2
                </button>
              </Link>
              )}
              {!caixaExistsInLoja1 && (
                <Link href={`/finance/cashier_day/create_cashier?date=${date}&loja=loja1`}>
                  <button
                    className="bg-[#81059e] text-white px-6 py-3 rounded-lg shadow-lg hover:bg-purple-500"
                  >
                    Abrir Novo Caixa na Loja 1
                  </button>
                </Link>
              )}
              {!caixaExistsInLoja2 && (
                <Link href={`/finance/cashier_day/create_cashier?date=${date}&loja=loja2`}>
                  <button
                    className="bg-[#81059e] text-white px-6 py-3 rounded-lg shadow-lg hover:bg-purple-500"
                  >
                    Abrir Novo Caixa na Loja 2
                  </button>
                </Link>
              )}
            </>
          ) : (
            <>
              <Link href={`/finance/cashier_day/create_cashier?date=${date}&loja=loja1`}>
                <button
                  className="bg-[#81059e] text-white px-6 py-3 rounded-lg shadow-lg hover:bg-purple-500"
                >
                  Abrir Novo Caixa na Loja 1
                </button>
              </Link>
              <Link href={`/finance/cashier_day/create_cashier?date=${date}&loja=loja2`}>
                <button
                  className="bg-[#81059e] text-white px-6 py-3 rounded-lg shadow-lg hover:bg-purple-500"
                >
                  Abrir Novo Caixa na Loja 2
                </button>
              </Link>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
