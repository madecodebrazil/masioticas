"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getFirestore, collection, setDoc, doc } from "firebase/firestore";
import Layout from "@/components/Layout"; // Certifique-se de ajustar o caminho correto
import { app } from '../../../../lib/firebaseConfig'; // Ajuste o caminho conforme necessário
import Image from 'next/image';

const firestore = getFirestore(app); // Inicializando o Firestore

export function ConfirmSupplierPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Função para editar os dados e voltar para a página de formulário
  const handleEdit = () => {
    const queryParams = new URLSearchParams({
      razaoSocial: searchParams.get('razaoSocial'),
      nomeFantasia: searchParams.get('nomeFantasia'),
      cnpj: searchParams.get('cnpj'),
      email: searchParams.get('email'),
      telefone: searchParams.get('telefone'),
      celular: searchParams.get('celular'),
      representante: searchParams.get('representante'),
      cep: searchParams.get('cep'),
      numero: searchParams.get('numero'),
      logradouro: searchParams.get('logradouro'),
      cidade: searchParams.get('cidade'),
      estado: searchParams.get('estado')
    }).toString();

    // Redirecionar para a página de edição com os dados passados via URL
    router.push(`/stock/suppliers/add-supplier?${queryParams}`);
  };

  // Função para confirmar os dados e salvar no Firestore
  const handleConfirm = async () => {
    const fornecedorData = {
      razaoSocial: searchParams.get('razaoSocial'),
      celular: searchParams.get('celular'),
      representante: searchParams.get('representante'),
      nomeFantasia: searchParams.get('nomeFantasia'),
      cnpj: searchParams.get('cnpj'),
      email: searchParams.get('email'),
      telefone: searchParams.get('telefone'),
      cep: searchParams.get('cep'),
      numero: searchParams.get('numero'),
      logradouro: searchParams.get('logradouro'),
      cidade: searchParams.get('cidade'),
      estado: searchParams.get('estado'),
      name: searchParams.get('nomeFantasia') // Adicionando o campo name
    };

    try {
      // Adicionando o fornecedor à coleção armacoes_fornecedores
      const docRef = doc(collection(firestore, "fornecedores"));
      await setDoc(docRef, fornecedorData);

      alert("Fornecedor registrado com sucesso!");
      router.push("/stock/suppliers"); // Redirecionar para a página de fornecedores
    } catch (error) {
      console.error("Erro ao registrar fornecedor:", error);
      alert("Houve um erro ao registrar o fornecedor.");
    }
  };

  return (
    <Layout>
      <div className="flex flex-col items-center justify-start py-8 px-4 sm:px-6 lg:px-8">
        <div className="relative w-full bg-white rounded-lg shadow-lg p-6 max-w-4xl">
          <h2 className="text-2xl font-extrabold text-[#81059e] mb-6">
            CONFIRMAR REGISTRO
          </h2>

          <div className="space-y-2">
            <div className="text-[#81059e87] flex items-center">
              <strong className="mr-2">Razão Social:</strong>
              <span className="text-black font-bold">{searchParams.get('razaoSocial')}</span>
            </div>
            <div className="text-[#81059e87] flex items-center">
              <strong className="mr-2">Representante:</strong>
              <span className="text-black font-bold">{searchParams.get('representante')}</span>
            </div>
            <div className="text-[#81059e87] flex items-center">
              <strong className="mr-2">CNPJ:</strong>
              <span className="text-black font-bold">{searchParams.get('cnpj')}</span>
            </div>
            <div className="text-[#81059e87] flex items-center">
              <strong className="mr-2">Celular:</strong>
              <span className="text-black font-bold">{searchParams.get('celular')}</span>
            </div>
            <div className="text-[#81059e87] flex items-center">
              <strong className="mr-2">Nome Fantasia:</strong>
              <span className="text-black font-bold">{searchParams.get('nomeFantasia')}</span>
            </div>
            <div className="text-[#81059e87] flex items-center">
              <strong className="mr-2">Email:</strong>
              <span className="text-black font-bold">{searchParams.get('email')}</span>
            </div>
            <div className="text-[#81059e87] flex items-center space-x-2">
              <div className="flex items-center">
                <strong className="mr-2">Telefone:</strong>
                <span className="text-black font-bold">{searchParams.get('telefone')}</span>
              </div>
              <div className="flex items-center">
                <strong className="mr-2">CEP:</strong>
                <span className="text-black font-bold">{searchParams.get('cep')}</span>
              </div>
              <div className="flex items-center">
                <strong className="mr-2">Número:</strong>
                <span className="text-black font-bold">{searchParams.get('numero')}</span>
              </div>
            </div>
            <div className="text-[#81059e87] flex items-center space-x-2">
              <div className="flex items-center">
                <strong className="mr-2">Logradouro:</strong>
                <span className="text-black font-bold">{searchParams.get('logradouro')}</span>
              </div>
              <div className="flex items-center">
                <strong className="mr-2">Cidade:</strong>
                <span className="text-black font-bold">{searchParams.get('cidade')}</span>
              </div>
            </div>
            <div className="text-[#81059e87] flex items-center">
              <strong className="mr-2">Estado:</strong>
              <span className="text-black font-bold">{searchParams.get('estado')}</span>
            </div>
          </div>

          <div className="mt-6 flex justify-center space-x-4">
            <button
              className="px-6 py-2 bg-[#81059e] text-white font-bold rounded-md flex items-center"
              onClick={handleEdit}
            >
              <Image src="/images/edit.png" alt="Editar" width={20} height={20} className="mr-2" />
              EDITAR
            </button>

            <button
              className="px-6 py-2 bg-[#81059e] text-white font-bold rounded-md flex items-center"
              onClick={handleConfirm}
            >
              <Image src="/images/check.png" alt="Confirmar" width={20} height={20} className="mr-2" />
              CONFIRMAR
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
      <ConfirmSupplierPage />
    </Suspense>
  );
}