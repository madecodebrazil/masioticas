'use client';
import React, { Suspense, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation'; // Para pegar os parâmetros da URL e redirecionar
import Image from 'next/image'; // Para usar as imagens
import { getFirestore, collection, doc, setDoc } from 'firebase/firestore'; // Importa o Firestore
import { app } from '@/lib/firebaseConfig'; // Certifique-se de que o Firebase está corretamente inicializado
import Layout from '@/components/Layout'; // Seu layout instanciado
import { useAuth } from '@/hooks/useAuth';
import { FiUser, FiMapPin, FiEdit2, FiCheck } from 'react-icons/fi';

const db = getFirestore(app); // Inicializando Firestore

const ConfirmAddOphthalmologist = () => {
  const searchParams = useSearchParams(); // Para pegar os parâmetros da URL
  const router = useRouter();
  const { userPermissions, userData } = useAuth();
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
      await setDoc(docRef, {
        ...formData,
        registradoPor: userData?.nome || 'Sistema',
        createdAt: new Date(),
        updatedAt: new Date()
      });
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
      <div className="min-h-screen mb-32">
        <div className="w-full max-w-5xl mx-auto rounded-lg">
          <h2 className="text-3xl font-bold text-[#81059e] mb-8 mt-8">CONFIRMAR REGISTRO</h2>

          <div className="space-y-6">
            {/* Seção Informações Pessoais */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-semibold text-[#81059e] mb-4 flex items-center gap-2">
                <FiUser /> Informações Pessoais
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <span className="text-[#81059e] font-medium">Nome do Médico</span>
                  <p className="text-black mt-1">{formData.nomeMedico}</p>
                </div>
                <div>
                  <span className="text-[#81059e] font-medium">CRM</span>
                  <p className="text-black mt-1">{formData.crm}</p>
                </div>
                <div>
                  <span className="text-[#81059e] font-medium">Email</span>
                  <p className="text-black mt-1">{formData.email}</p>
                </div>
                <div>
                  <span className="text-[#81059e] font-medium">Telefone</span>
                  <p className="text-black mt-1">{formData.telefone}</p>
                </div>
                <div>
                  <span className="text-[#81059e] font-medium">Gênero</span>
                  <p className="text-black mt-1">{formData.genero}</p>
                </div>
              </div>
            </div>

            {/* Seção Endereço */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-semibold text-[#81059e] mb-4 flex items-center gap-2">
                <FiMapPin /> Endereço
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <span className="text-[#81059e] font-medium">Logradouro</span>
                  <p className="text-black mt-1">{formData.logradouro}</p>
                </div>
                <div>
                  <span className="text-[#81059e] font-medium">Bairro</span>
                  <p className="text-black mt-1">{formData.bairro}</p>
                </div>
              </div>
            </div>

            {/* Botões de ação */}
            <div className="flex justify-center gap-6 mt-8">
              <button
                onClick={handleEdit}
                disabled={isLoading}
                className="border-2 border-[#81059e] p-2 px-3 rounded-sm text-[#81059e] flex items-center gap-2"
              >
                <FiEdit2 /> EDITAR
              </button>
              <button
                onClick={handleConfirm}
                disabled={isLoading}
                className="bg-[#81059e] p-2 px-3 rounded-sm text-white flex items-center gap-2"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                ) : (
                  <FiCheck />
                )}
                CONFIRMAR
              </button>
            </div>
          </div>

          {/* Popup de confirmação */}
          {showPopup && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
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
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#81059e]"></div>
      </div>
    }>
      <ConfirmAddOphthalmologist />
    </Suspense>
  );
}
