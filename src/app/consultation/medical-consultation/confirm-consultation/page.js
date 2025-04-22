"use client";
import { Suspense } from "react";
import React, { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { app } from "@/lib/firebaseConfig";
import { FiUser, FiCalendar, FiClock, FiMapPin, FiHome, FiFileText, FiDollarSign, FiEdit2, FiCheck } from 'react-icons/fi';
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

      router.push("/consultation/medical-consultation");
    } catch (error) {
      console.error("Erro ao enviar os dados para o Firestore:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen mb-32">
        <div className="w-full max-w-5xl mx-auto rounded-lg">
          <h2 className="text-3xl font-bold text-[#81059e] mb-8 mt-8">
            CONFIRMAR REGISTRO
          </h2>

          {/* Seção Informações do Paciente */}
          <div className="p-4 bg-gray-50 rounded-lg mb-6">
            <h3 className="text-lg font-semibold text-[#81059e] mb-4 flex items-center gap-2">
              <FiUser /> Informações do Paciente
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <span className="text-[#81059e] font-medium">Nome do Paciente</span>
                <p className="text-black mt-1">{formData.nomePaciente}</p>
              </div>
              <div>
                <span className="text-[#81059e] font-medium">CPF</span>
                <p className="text-black mt-1">{formData.cpf}</p>
              </div>
              <div>
                <span className="text-[#81059e] font-medium">Logradouro</span>
                <p className="text-black mt-1">{formData.logradouro}</p>
              </div>
              <div>
                <span className="text-[#81059e] font-medium">Bairro</span>
                <p className="text-black mt-1">{formData.bairro}</p>
              </div>
              <div>
                <span className="text-[#81059e] font-medium">Número</span>
                <p className="text-black mt-1">{formData.numeroCasa}</p>
              </div>
              <div>
                <span className="text-[#81059e] font-medium">RG</span>
                <p className="text-black mt-1">{formData.rg}</p>
              </div>
            </div>
          </div>

          {/* Seção Informações da Consulta */}
          <div className="p-4 bg-gray-50 rounded-lg mb-6">
            <h3 className="text-lg font-semibold text-[#81059e] mb-4 flex items-center gap-2">
              <FiCalendar /> Informações da Consulta
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <span className="text-[#81059e] font-medium">Data</span>
                <p className="text-black mt-1">{formData.data}</p>
              </div>
              <div>
                <span className="text-[#81059e] font-medium">Hora</span>
                <p className="text-black mt-1">{formData.hora}</p>
              </div>
              <div>
                <span className="text-[#81059e] font-medium">Ametropia</span>
                <p className="text-black mt-1">{formData.ametropia}</p>
              </div>
              <div>
                <span className="text-[#81059e] font-medium">Clínica</span>
                <p className="text-black mt-1">{formData.clinica}</p>
              </div>
              <div>
                <span className="text-[#81059e] font-medium">Loja</span>
                <p className="text-black mt-1">
                  {formData.loja === "loja2" ? "Óticas Popular 2" : "Óticas Popular 1"}
                </p>
              </div>
              <div>
                <span className="text-[#81059e] font-medium">Valor da Consulta</span>
                <p className="text-black mt-1">R$ {formData.valorConsulta}</p>
              </div>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex justify-center gap-6 mt-6">
            <button
              onClick={handleEdit}
              className="bg-[#81059e] p-2 px-3 rounded-sm text-white flex items-center gap-2"
            >
              <FiEdit2 /> EDITAR
            </button>
            <button
              onClick={handleConfirm}
              disabled={isSubmitting}
              className="border-2 border-[#81059e] p-2 px-3 rounded-sm text-[#81059e] flex items-center gap-2"
            >
              <FiCheck /> {isSubmitting ? "CONFIRMANDO..." : "CONFIRMAR"}
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
    <Suspense fallback={<div> <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#81059e]"></div></div>}>
      <ConfirmConsultation />
    </Suspense>
  );
}
