'use client';
import React, { Suspense, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation'; // Para pegar os parâmetros da URL e redirecionar
import Image from 'next/image'; // Para usar as imagens
import { getFirestore, collection, doc, setDoc } from 'firebase/firestore'; // Importa o Firestore
import { app } from '@/lib/firebaseConfig'; // Certifique-se de que o Firebase está corretamente inicializado
import Layout from '@/components/Layout'; // Seu layout instanciado

const db = getFirestore(app); // Inicializando Firestore

const ConfirmAddOphthalmologist = () => {
  const searchParams = useSearchParams(); // Para pegar os parâmetros da URL
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false); // Estado de carregamento
  const [showPopup, setShowPopup] = useState(false); // Estado do popup de confirmação

  // Pegando os dados passados pela URL
  const formData = {
    nomeMedico: searchParams.get('nomeMedico') || '',
    crm: searchParams.get('crm') || '',
    email: searchParams.get('email') || '',
    genero: searchParams.get('genero') || '',
    telefone: searchParams.get('telefone') || '',
    logradouro: searchParams.get('logradouro') || '',
    bairro: searchParams.get('bairro') || ''
  };

  // Função para redirecionar de volta para a página de edição
  const handleEdit = () => {
    const queryString = new URLSearchParams(formData).toString();
    router.push(`/consultation/ophthalmologist?${queryString}`);
  };

  // Função para confirmar e salvar os dados no Firestore
  const handleConfirm = async () => {
    setIsLoading(true); // Ativa o estado de carregamento
    try {
      // Criando a referência para o documento com o CRM como identificador único
      const docRef = doc(collection(db, 'oftalmologistas'), formData.crm);

      // Salvando os dados no Firestore
      await setDoc(docRef, formData);
      console.log('Dados confirmados e enviados ao Firestore:', formData);

      // Exibe o popup de confirmação
      setShowPopup(true);
      setTimeout(() => {
        setShowPopup(false);
        router.push('/consultation/ophthalmologist/list-ophthalmo'); // Redireciona após 2 segundos
      }, 2000);
    } catch (error) {
      console.error('Erro ao enviar os dados para o Firestore:', error);
    } finally {
      setIsLoading(false); // Desativa o estado de carregamento
    }
  };

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-full max-w-4xl p-8 bg-white rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold text-[#81059e] mb-6">CONFIRMAR REGISTRO</h2>

          <div className="space-y-4">
            <div>
              <span className="font-bold text-[#81059e]">Nome do Médico</span>
              <p className="text-black">{formData.nomeMedico}</p>
            </div>
            <div>
              <span className="font-bold text-[#81059e]">CRM</span>
              <p className="text-black">{formData.crm}</p>
            </div>
            <div>
              <span className="font-bold text-[#81059e]">Gênero</span>
              <p className="text-black">{formData.genero}</p>
            </div>
            <div>
              <span className="font-bold text-[#81059e]">Email</span>
              <p className="text-black">{formData.email}</p>
            </div>
            <div>
              <span className="font-bold text-[#81059e]">Telefone</span>
              <p className="text-black">{formData.telefone}</p>
            </div>
            <div>
              <span className="font-bold text-[#81059e]">Logradouro</span>
              <p className="text-black">{formData.logradouro}</p>
            </div>
            <div>
              <span className="font-bold text-[#81059e]">Bairro</span>
              <p className="text-black">{formData.bairro}</p>
            </div>
          </div>

          <div className="mt-6 flex space-x-4">
            <button
              className="flex-1 px-4 py-2 bg-[#81059e] text-white rounded hover:bg-[#820f76] flex items-center justify-center"
              onClick={handleEdit}
              disabled={isLoading} // Desabilita o botão durante o carregamento
            >
              <Image src="/images/edit.png" alt="Editar" width={20} height={20} className="mr-2" />
              EDITAR
            </button>
            <button
              className="flex-1 px-4 py-2 bg-[#81059e] text-white rounded hover:bg-[#820f76] flex items-center justify-center"
              onClick={handleConfirm}
              disabled={isLoading} // Desabilita o botão durante o carregamento
            >
              {isLoading ? (
                <span className="spinner-border spinner-border-sm"></span> // Exibe o spinner durante o carregamento
              ) : (
                <>
                  <Image src="/images/check.png" alt="Confirmar" width={20} height={20} className="mr-2" />
                  CONFIRMAR
                </>
              )}
            </button>
          </div>

          {/* Popup de confirmação */}
          {showPopup && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
              <div className="bg-green-500 text-white p-4 rounded-lg shadow-lg">
                Registro confirmado com sucesso!
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default function Page() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <ConfirmAddOphthalmologist />
    </Suspense>
  );
}
