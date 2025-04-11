"use client";
import React, { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Layout from "@/components/Layout";
import { firestore } from "@/lib/firebaseConfig";
import { collection, addDoc } from "firebase/firestore";

// Função para formatar a data para dd-mm-yyyy
const formatDate = (dateString) => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return dateString;
  }
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

// Função para formatar a hora para HORA:MIN
const formatTime = (dateString) => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return dateString;
  }
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

export function ConfirmarRegistro() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // Estado para controle do spinner

  // Estado para armazenar os dados recebidos pela URL
  const formData = Object.fromEntries(searchParams.entries());

  const handleEdit = () => {
    const query = new URLSearchParams(formData).toString();
    router.push(`/products_and_services/warranty/add-warranty?${query}`);
  };

  const handleConfirm = async () => {
    try {
      setIsLoading(true); // Ativar o spinner
      await addDoc(collection(firestore, "warranties"), formData);
      console.log("Registro confirmado", formData);

      // Exibir o popup de sucesso
      setShowSuccessPopup(true);

      // Esperar 2 segundos e redirecionar
      setTimeout(() => {
        setShowSuccessPopup(false);
        router.push("/products_and_services/warranty");
      }, 2000);
    } catch (error) {
      console.error("Erro ao confirmar o registro: ", error);
    } finally {
      setIsLoading(false); // Desativar o spinner
    }
  };

  return (
    <Layout>
      <div className="container mx-auto p-6 bg-white rounded-lg shadow min-h-screen flex justify-center items-center">
        <div className="bg-white w-full sm:w-[90%] md:w-[70%] lg:w-[50%] p-8 rounded-xl shadow-md border border-gray-300">
          <h1 className="text-[#81059e] text-2xl font-bold mb-8 text-center">
            Confirmar Registro
          </h1>

          {/* Exibição dos dados formatada */}
          <div className="space-y-6">
            <div className="flex flex-col">
              <span className="text-[#81059e] font-semibold">Nome do Cliente:</span>
              <p className="text-black">{formData.nomeCliente}</p>
            </div>
            <div className="flex flex-col">
              <span className="text-[#81059e] font-semibold">Código do Produto:</span>
              <p className="text-black">{formData.codigoProduto}</p>
            </div>
            <div className="flex flex-col">
              <span className="text-[#81059e] font-semibold">NCM:</span>
              <p className="text-black">{formData.ncm}</p>
            </div>
            <div className="flex flex-col">
              <span className="text-[#81059e] font-semibold">SKU:</span>
              <p className="text-black">{formData.sku}</p>
            </div>
            <div className="flex flex-col">
              <span className="text-[#81059e] font-semibold">Produto:</span>
              <p className="text-black">{formData.produto}</p>
            </div>
            <div className="flex flex-col">
              <span className="text-[#81059e] font-semibold">Descrição:</span>
              <p className="text-black">{formData.descricao}</p>
            </div>
            <div className="flex flex-col">
              <span className="text-[#81059e] font-semibold">Data da Garantia:</span>
              <p className="text-black">{formatDate(formData.dataGarantia)}</p>
            </div>
            <div className="flex flex-col">
              <span className="text-[#81059e] font-semibold">Hora da Garantia:</span>
              <p className="text-black">{formatTime(formData.horaGarantia)}</p>
            </div>
            <div className="flex flex-col">
              <span className="text-[#81059e] font-semibold">Loja:</span>
              <p className="text-black">{formData.loja}</p>
            </div>
            <div className="flex flex-col">
              <span className="text-[#81059e] font-semibold">Data de Vencimento:</span>
              <p className="text-black">{formatDate(formData.dataVencimento)}</p>
            </div>
          </div>

          {/* Botões */}
          <div className="flex justify-between gap-4 mt-8">
            <button
              onClick={handleEdit}
              className="w-full sm:w-1/2 bg-[#81059e] text-white py-2 rounded-md hover:bg-[#781e6a] font-bold"
            >
              EDITAR
            </button>
            <button
              onClick={handleConfirm}
              className="w-full sm:w-1/2 bg-[#81059e] text-white py-2 rounded-md hover:bg-[#781e6a] font-bold flex items-center justify-center"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-6 w-6 mr-2"></div>
              ) : (
                "CONFIRMAR"
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Popup de Sucesso */}
      {showSuccessPopup && (
        <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50">
          <div className="bg-green-500 text-white py-4 px-6 rounded shadow-lg">
            <p className="text-lg font-bold">Registro confirmado com sucesso!</p>
          </div>
        </div>
      )}

      {/* Spinner CSS */}
      <style jsx>{`
        .loader {
          border-top-color: #932a83;
          animation: spinner 0.6s linear infinite;
        }
        @keyframes spinner {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </Layout>
  );
}
export default function Page() {
  return (
    <Suspense fallback={<div> <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#81059e]"></div></div>}>
      <ConfirmarRegistro />
    </Suspense>
  );
}