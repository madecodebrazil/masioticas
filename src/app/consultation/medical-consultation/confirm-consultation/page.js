"use client";
import { Suspense } from "react";
import React, { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { app } from "@/lib/firebaseConfig";
import Image from "next/image";
import Layout from "@/components/Layout";

const db = getFirestore(app);

const ConfirmConsultation = () => {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pegando os dados passados pela URL, incluindo valorConsulta
  const formData = {
    nomePaciente: searchParams.get("nomePaciente") || "",
    cpf: searchParams.get("cpf") || "",
    logradouro: searchParams.get("logradouro") || "",
    rg: searchParams.get("rg") || "",
    bairro: searchParams.get("bairro") || "",
    numeroCasa: searchParams.get("numeroCasa") || "",
    ametropia: searchParams.get("ametropia") || "",
    data: searchParams.get("data") || "",
    hora: searchParams.get("hora") || "",
    clinica: searchParams.get("clinica") || "Óticas Popular 1",
    loja: searchParams.get("loja") || "loja1",
    status: "agendada",
    valorConsulta: searchParams.get("valorConsulta") || "", // Novo campo valorConsulta
  };

  const handleEdit = () => {
    const queryString = new URLSearchParams(formData).toString();
    router.push(`/consultation/medical-consultation?${queryString}`);
  };

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      const consultationRef = doc(db, "consultations", formData.cpf);
      await setDoc(consultationRef, formData);
      console.log("Consulta confirmada e enviada:", formData);

      router.push("/consultation/medical-consultation/list-consultation");
    } catch (error) {
      console.error("Erro ao enviar os dados para o Firestore:", error);
    } finally {
      setIsSubmitting(false);
    }
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
              <span className="font-bold text-[#81059e]">Nome do Paciente</span>
              <p className="text-black">{formData.nomePaciente}</p>
            </div>
            <div>
              <span className="font-bold text-[#81059e]">CPF</span>
              <p className="text-black">{formData.cpf}</p>
            </div>
            <div>
              <span className="font-bold text-[#81059e]">Logradouro</span>
              <p className="text-black">{formData.logradouro}</p>
            </div>
            <div>
              <span className="font-bold text-[#81059e]">Bairro</span>
              <p className="text-black">{formData.bairro}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="font-bold text-[#81059e]">Número</span>
                <p className="text-black">{formData.numeroCasa}</p>
              </div>
              <div>
                <span className="font-bold text-[#81059e]">Ametropia</span>
                <p className="text-black">{formData.ametropia}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="font-bold text-[#81059e]">Data</span>
                <p className="text-black">{formData.data}</p>
              </div>
              <div>
                <span className="font-bold text-[#81059e]">Hora</span>
                <p className="text-black">{formData.hora}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="font-bold text-[#81059e]">Clínica</span>
                <p className="text-black">{formData.clinica}</p>
              </div>
              <div>
                <span className="font-bold text-[#81059e]">Loja</span>
                <p className="text-black">
                  {formData.loja === "loja2"
                    ? "Óticas Popular 2"
                    : "Óticas Popular 1"}
                </p>
              </div>
            </div>
            <div>
              <span className="font-bold text-[#81059e]">
                Valor da Consulta
              </span>
              <p className="text-black">R$ {formData.valorConsulta}</p>
            </div>
          </div>

          <div className="mt-6 flex space-x-4">
            <button
              className="flex-1 px-4 py-2 bg-[#81059e] text-white rounded hover:bg-[#820f76] flex items-center justify-center"
              onClick={handleEdit}
            >
              <Image
                src="/images/edit.png"
                alt="Editar"
                width={20}
                height={20}
                className="mr-2"
              />
              EDITAR
            </button>
            <button
              className="flex-1 px-4 py-2 bg-[#81059e] text-white rounded hover:bg-[#820f76] flex items-center justify-center"
              onClick={handleConfirm}
              disabled={isSubmitting}
            >
              <Image
                src="/images/check.png"
                alt="Confirmar"
                width={20}
                height={20}
                className="mr-2"
              />
              {isSubmitting ? "CONFIRMANDO..." : "CONFIRMAR"}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

// Envolvendo o componente com Suspense
export default function Page() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <ConfirmConsultation />
    </Suspense>
  );
}
