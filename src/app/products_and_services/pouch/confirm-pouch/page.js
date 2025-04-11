"use client";
import React, { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Layout from '@/components/Layout';
import Image from 'next/image'; // Importa o componente de imagem do Next.js
import { firestore } from '../../../../lib/firebaseConfig';
import { collection, setDoc, doc } from "firebase/firestore";

export function ConfirmAssembly() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showSuccessPopup, setShowSuccessPopup] = useState(false); // Estado para controle do popup de sucesso
  const [isSubmitting, setIsSubmitting] = useState(false); // Controle do estado de envio

  // Converte os parâmetros de URL em objeto
  const formDataFromQuery = searchParams.get('formData') ? JSON.parse(decodeURIComponent(searchParams.get('formData'))) : {};

  const handleEdit = () => {
    // Redireciona de volta ao formulário preenchido com os dados atuais
    const queryString = encodeURIComponent(JSON.stringify(formDataFromQuery));
    router.push(`/products_and_services/pouch?formData=${queryString}`);
  };

  const handleConfirm = async () => {
    setIsSubmitting(true); // Inicia o estado de envio
    try {
      const assemblyData = {
        ...formDataFromQuery,
        createdAt: new Date(), // Adiciona a data de criação
      };

      // Agora, adiciona os dados na coleção 'malotes'
      const docRef = doc(collection(firestore, 'malotes'), 'malote_' + new Date().getTime()); // Adiciona um malote com um ID único

      await setDoc(docRef, assemblyData);

      setShowSuccessPopup(true); // Exibe o popup de sucesso

      setTimeout(() => {
        setIsSubmitting(false); // Finaliza o estado de envio
        // Redireciona após 2 segundos
        router.push('/products_and_services/pouch/list-pouches');
      }, 2000);
    } catch (error) {
      console.error('Erro ao registrar o malote: ', error);
      setIsSubmitting(false); // Finaliza o estado de envio em caso de erro
    }
  };

  return (
    <Layout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold" style={{ color: '#81059e' }}>CONFIRMAR MALOTE</h1>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg mt-6">
          <h2 className="text-lg font-bold mb-4" style={{ color: '#81059e' }}>Resumo do Malote:</h2>

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
            <p><span className="font-semibold">Tipo de Serviço:</span> {formDataFromQuery.tipo}</p>
            <p><span className="font-semibold">Prestador:</span> {formDataFromQuery.prestador}</p>
            <p><span className="font-semibold">Valor:</span> R${formDataFromQuery.valor}</p>
          </div>

          <div className="mt-8 flex justify-center space-x-4">
            {/* Botão de Editar */}
            <button
              onClick={handleEdit}
              className="flex items-center px-6 py-3 bg-[#81059e] text-white font-bold rounded-lg hover:bg-purple-600 transition"
            >
              <Image src="/images/edit.png" alt="Edit" width={20} height={20} className="mr-2" />
              Editar
            </button>

            {/* Botão de Confirmar */}
            <button
              onClick={handleConfirm}
              className="flex items-center px-6 py-3 bg-[#81059e] text-white font-bold rounded-lg hover:bg-green-700 transition"
              disabled={isSubmitting} // Desabilita o botão durante o envio
            >
              <Image src="/images/check.png" alt="Confirm" width={20} height={20} className="mr-2" />
              {isSubmitting ? 'Confirmando...' : 'Confirmar'}
            </button>
          </div>
        </div>

        {/* Popup de sucesso */}
        {showSuccessPopup && (
          <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50">
            <div className="bg-white p-4 rounded shadow">
              <p className="text-green-600 font-bold">Malote registrado com sucesso!</p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
export default function Page() {
  return (
    <Suspense fallback={<div> <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#81059e]"></div></div>}>
      <ConfirmAssembly />
    </Suspense>
  );
}
