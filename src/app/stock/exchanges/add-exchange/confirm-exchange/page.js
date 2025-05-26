"use client";
import React, { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Layout from '@/components/Layout';
import { FaCheck, FaEdit } from 'react-icons/fa';
import { collection, setDoc, doc } from "firebase/firestore";
import { firestore } from '../../../../../lib/firebaseConfig';

export function ConfirmExchange() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Converte os parâmetros de URL em objeto
  const formDataFromQuery = searchParams.get('formData') ? JSON.parse(decodeURIComponent(searchParams.get('formData'))) : {};

  const handleEdit = () => {
    // Redireciona de volta ao formulário preenchido com os dados atuais
    const queryString = encodeURIComponent(JSON.stringify(formDataFromQuery));
    router.push(`/stock/exchanges/add-exchange?formData=${queryString}`);
  };

  const handleConfirm = async () => {
    try {
      // Cria o documento com os dados da troca
      const exchangeData = {
        nomeCliente: formDataFromQuery.nomeCliente,
        codigoProduto: formDataFromQuery.codigoProduto,
        NCM: formDataFromQuery.NCM,
        SKU: formDataFromQuery.SKU,
        produto: formDataFromQuery.produto,
        descricao: formDataFromQuery.descricao,
        data: formDataFromQuery.data,
        hora: formDataFromQuery.hora,
        loja: formDataFromQuery.loja,
        motivo: formDataFromQuery.motivo,
        status: formDataFromQuery.status,
      };

      // Salvar no Firestore na coleção 'exchanges'
      const docRef = doc(collection(firestore, 'exchanges'));
      await setDoc(docRef, exchangeData);

      // Redireciona para a página de trocas registradas
      router.push('/stock/exchanges');
    } catch (error) {
      console.error('Erro ao confirmar a troca: ', error);
    }
  };

  return (
    <Layout>
      <div className="p-6">
        <h1 className="text-2xl font-bold" style={{ color: '#81059e' }}>CONFIRMAR TROCA</h1>

        <div className="bg-white p-6 rounded-lg shadow-lg mt-6">
          <h2 className="text-lg font-bold mb-4" style={{ color: '#81059e' }}>Resumo da Troca:</h2>

          <div className="space-y-2 text-black">
            <p><span className="font-semibold">Nome do Cliente:</span> {formDataFromQuery.nomeCliente}</p>
            <p><span className="font-semibold">Código do Produto:</span> {formDataFromQuery.codigoProduto}</p>
            <p><span className="font-semibold">NCM:</span> {formDataFromQuery.NCM}</p>
            <p><span className="font-semibold">SKU:</span> {formDataFromQuery.SKU}</p>
            <p><span className="font-semibold">Produto:</span> {formDataFromQuery.produto}</p>
            <p><span className="font-semibold">Descrição:</span> {formDataFromQuery.descricao}</p>
            <p><span className="font-semibold">Data:</span> {formDataFromQuery.data}</p>
            <p><span className="font-semibold">Hora:</span> {formDataFromQuery.hora}</p>
            <p><span className="font-semibold">Loja:</span> {formDataFromQuery.loja}</p>
            <p><span className="font-semibold">Motivo da Troca:</span> {formDataFromQuery.motivo}</p>
            <p><span className="font-semibold">Status:</span> {formDataFromQuery.status}</p>
          </div>

          <div className="mt-8 flex justify-center space-x-4">
            {/* Botão de Editar */}
            <button
              onClick={handleEdit}
              className="flex items-center px-6 py-3 bg-yellow-500 text-white font-bold rounded-lg hover:bg-yellow-600 transition"
            >
              <FaEdit className="mr-2" /> Editar
            </button>

            {/* Botão de Confirmar */}
            <button
              onClick={handleConfirm}
              className="flex items-center px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition"
            >
              <FaCheck className="mr-2" /> Confirmar
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
      <ConfirmExchange />
    </Suspense>
  );
}