"use client";
import React, { Suspense, useState } from 'react';
import Layout from '@/components/Layout';
import { useRouter, useSearchParams } from 'next/navigation';
import { doc, getDoc, updateDoc, collection, addDoc } from 'firebase/firestore';
import { firestore } from '../../../../../lib/firebaseConfig';

export function ConfirmBreakdown() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Converte os parâmetros de URL em objeto
  const formDataFromQuery = searchParams.get('formData') ? JSON.parse(decodeURIComponent(searchParams.get('formData'))) : {};

  const [isLoading, setIsLoading] = useState(false);

  const handleConfirmSubmit = async () => {
    setIsLoading(true);
    const collectionName = formDataFromQuery.produto.includes('Armação') ? 'armacoes_avariadas' :
      formDataFromQuery.produto.includes('Lentes') ? 'lentes_avariadas' :
        'solares_avariadas'; // Seleciona o tipo de avaria

    try {
      // Referência ao documento original do produto
      const productRef = doc(firestore, `loja1_armacoes`, formDataFromQuery.codigo); // Ajustar para a loja correta, se necessário
      const productDoc = await getDoc(productRef);

      if (productDoc.exists()) {
        const productData = productDoc.data();

        // Verificar a quantidade
        if (productData.quantidade > 0) {
          const newQuantity = productData.quantidade - 1;

          // Atualiza o produto original com a nova quantidade
          await updateDoc(productRef, { quantidade: newQuantity });

          // Se a quantidade for 0 após a atualização, bloqueia futuras operações
          if (newQuantity === 0) {
            await updateDoc(productRef, { quantidade: 0 });
            console.log("Estoque zerado.");
          }

          // Cria um novo documento na coleção de avarias com um documento gerado automaticamente
          const avariaData = {
            ...formDataFromQuery,
            ...productData, // Copia os dados do produto
            dataAvaria: new Date().toISOString(), // Adiciona uma data de avaria
          };

          // Cria o documento dentro da coleção de avarias com o tipo correspondente
          const avariaRef = collection(firestore, `avarias/${collectionName}/items`);
          await addDoc(avariaRef, avariaData);

          // Exibe um pop-up indicando sucesso e redireciona de volta
          alert("Avaria registrada com sucesso!");
          router.push('/stock/breakdown'); // Redireciona para a tela de avarias registradas
        } else {
          alert("Não é possível registrar a avaria. O estoque está zerado.");
        }
      } else {
        console.error("Produto não encontrado!");
      }
    } catch (error) {
      console.error("Erro ao registrar a avaria:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="p-6">
        <h1 className="text-2xl font-bold text-purple-800">CONFIRMAR AVARIA</h1>

        <div className="bg-white p-6 rounded-lg shadow-lg mt-6">
          <h2 className="text-lg font-bold mb-4 text-[#81059e]">Resumo da Avaria:</h2>

          <div className="space-y-2 text-gray-700">
            <p><span className="font-semibold">Nome do Produto:</span> {formDataFromQuery.nomeProduto}</p>
            <p><span className="font-semibold">Código:</span> {formDataFromQuery.codigo}</p>
            <p><span className="font-semibold">NCM:</span> {formDataFromQuery.NCM}</p>
            <p><span className="font-semibold">SKU:</span> {formDataFromQuery.sku}</p>
            <p><span className="font-semibold">Produto:</span> {formDataFromQuery.produto}</p>
            <p><span className="font-semibold">Loja:</span> {formDataFromQuery.loja}</p>
            <p><span className="font-semibold">Tipo de Avaria:</span> {formDataFromQuery.tipoAvaria}</p>
            <p><span className="font-semibold">Descrição:</span> {formDataFromQuery.descricao}</p>
            <p><span className="font-semibold">Data:</span> {formDataFromQuery.data}</p>
            <p><span className="font-semibold">Hora:</span> {formDataFromQuery.hora}</p>
          </div>

          <div className="mt-8 flex justify-center space-x-4">
            {/* Botão de Confirmar */}
            <button
              onClick={handleConfirmSubmit}
              className="px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition"
              disabled={isLoading}
            >
              {isLoading ? 'Processando...' : 'Confirmar Avaria'}
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
      <ConfirmBreakdown />
    </Suspense>
  );
}