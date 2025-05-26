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

export function ConfirmarBrinde() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  // Estado para armazenar os dados recebidos pela URL
  const formData = Object.fromEntries(searchParams.entries());

  const handleEdit = () => {
    const query = new URLSearchParams(formData).toString();
    router.push(`/products_and_services/giftes/add-gift?${query}`);
  };

  const handleConfirm = async () => {
    try {
      await addDoc(collection(firestore, "giftes"), {
        ...formData,
        dataBrinde: formatDate(formData.dataBrinde), // Formatando a data para dd-mm-yyyy
        horaBrinde: formatTime(formData.horaBrinde) // Formatando a hora para HORA:MIN
      });
      console.log("Registro confirmado", formData);

      // Exibir o popup de sucesso
      setShowSuccessPopup(true);

      // Esperar 2 segundos e redirecionar para a lista de brindes
      setTimeout(() => {
        setShowSuccessPopup(false);
        router.push("/products_and_services/giftes");
      }, 2000);
    } catch (error) {
      console.error("Erro ao confirmar o registro: ", error);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto p-6 bg-white rounded-lg shadow min-h-screen flex justify-center items-center">
        <div className="bg-white w-full sm:w-[90%] md:w-[70%] lg:w-[50%] p-8 rounded-xl shadow-md border border-gray-300">
          <h1 className="text-[#81059e] text-2xl font-bold mb-8 text-center">
            Confirmar Brinde
          </h1>

          {/* Exibição dos dados formatada */}
          <div className="space-y-6">
            <div className="flex flex-col">
              <span className="text-[#81059e] font-semibold">Nome do Cliente:</span>
              <p className="text-black">{formData.nomeCliente}</p>
            </div>
            <div className="flex flex-col">
              <span className="text-[#81059e] font-semibold">SKU:</span>
              <p className="text-black">{formData.sku}</p>
            </div>
            <div className="flex flex-col">
              <span className="text-[#81059e] font-semibold">Produto Comprado:</span>
              <p className="text-black">{formData.produtoComprado}</p>
            </div>
            <div className="flex flex-col">
              <span className="text-[#81059e] font-semibold">Descrição do Brinde:</span>
              <p className="text-black">{formData.descricaoBrinde}</p>
            </div>
            <div className="flex flex-col">
              <span className="text-[#81059e] font-semibold">Data do Brinde:</span>
              <p className="text-black">{formatDate(formData.dataBrinde)}</p>
            </div>
            <div className="flex flex-col">
              <span className="text-[#81059e] font-semibold">Hora do Brinde:</span>
              <p className="text-black">{formatTime(formData.horaBrinde)}</p>
            </div>
            <div className="flex flex-col">
              <span className="text-[#81059e] font-semibold">Loja:</span>
              <p className="text-black">{formData.loja}</p>
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
              className="w-full sm:w-1/2 bg-[#81059e] text-white py-2 rounded-md hover:bg-[#781e6a] font-bold"
            >
              CONFIRMAR
            </button>
          </div>
        </div>
      </div>

      {/* Popup de Sucesso */}
      {showSuccessPopup && (
        <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50">
          <div className="bg-green-500 text-white py-4 px-6 rounded shadow-lg">
            <p className="text-lg font-bold">Brinde registrado com sucesso!</p>
          </div>
        </div>
      )}
    </Layout>
  );
}
export default function Page() {
  return (
    <Suspense fallback={<div> <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#81059e]"></div></div>}>
      <ConfirmarBrinde />
    </Suspense>
  );
}