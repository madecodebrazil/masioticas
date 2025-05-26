'use client';
import React, { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation'; // Para pegar parâmetros da URL e redirecionar
import Layout from '@/components/Layout'; // Seu layout instanciado
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { app } from '@/lib/firebaseConfig'; // Certifique-se de que o Firebase está corretamente inicializado
import Image from 'next/image'; // Para importar as imagens

const db = getFirestore(app); // Inicializando Firestore

const ConfirmOptometrist = () => {
  const searchParams = useSearchParams(); // Para pegar os parâmetros da URL
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false); // Estado de carregamento
  const [showPopup, setShowPopup] = useState(false); // Estado do popup de confirmação

  // Pegando os dados passados pela URL
  const formData = {
    nomeOptometrista: searchParams.get('nomeOptometrista') || '',
    registroOptometrista: searchParams.get('registroOptometrista') || '',
    email: searchParams.get('email') || '',
    genero: searchParams.get('genero') || '',
    telefone: searchParams.get('telefone') || '',
    logradouro: searchParams.get('logradouro') || '',
    bairro: searchParams.get('bairro') || ''
  };

  // Função para confirmar e enviar os dados para o Firestore
  const handleConfirm = async () => {
    setIsLoading(true); // Ativa o estado de carregamento
    try {
      const optometristDocRef = doc(db, 'optometristas', formData.registroOptometrista); // Documento com o CRM como ID
      await setDoc(optometristDocRef, formData); // Envia os dados para o Firestore

      console.log('Optometrista registrado com sucesso:', formData);

      setShowPopup(true); // Mostra o popup de confirmação
      setTimeout(() => {
        setShowPopup(false);
        router.push('/consultation/optometrist/list-optometrist'); // Redireciona para a lista de optometristas
      }, 2000); // Oculta o popup após 2 segundos
    } catch (error) {
      console.error('Erro ao registrar o optometrista:', error);
    } finally {
      setIsLoading(false); // Para o estado de carregamento
    }
  };

  // Função para redirecionar para a página de edição
  const handleEdit = () => {
    const queryString = new URLSearchParams(formData).toString();
    router.push(`/consultation/optometrist?${queryString}`);
  };

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-full max-w-lg p-8 bg-white rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold text-[#81059e] mb-6">
            CONFIRMAR REGISTRO
          </h2>

          <div className="space-y-4">
            <div>
              <span className="font-bold text-[#81059e]">Nome do Optometrista</span>
              <p className="text-black">{formData.nomeOptometrista}</p>
            </div>
            <div>
              <span className="font-bold text-[#81059e]">Registro</span>
              <p className="text-black">{formData.registroOptometrista}</p>
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
              disabled={isLoading} // Desabilita o botão enquanto carrega
            >
              <Image src="/images/edit.png" alt="Editar" width={20} height={20} className="mr-2" />
              EDITAR
            </button>
            <button
              className="flex-1 px-4 py-2 bg-[#81059e] text-white rounded hover:bg-[#820f76] flex items-center justify-center"
              onClick={handleConfirm}
              disabled={isLoading} // Desabilita o botão enquanto carrega
            >
              {isLoading ? (
                <span className="spinner-border spinner-border-sm"></span> // Exibe um spinner enquanto carrega
              ) : (
                <>
                  <Image src="/images/check.png" alt="Confirmar" width={20} height={20} className="mr-2" />
                  CONFIRMAR
                </>
              )}
            </button>
          </div>
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
    </Layout>
  );
};

export default function Page() {
  return (
    <Suspense fallback={<div> <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#81059e]"></div></div>}>
      <ConfirmOptometrist />
    </Suspense>
  );
}