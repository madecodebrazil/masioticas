"use client";
import React, { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation"; // Para redirecionar e capturar dados da URL
import { getFirestore, collection, getDocs } from "firebase/firestore";
import Layout from "@/components/Layout"; // Seu layout instanciado
import { app } from "../../../lib/firebaseConfig"; // Certifique-se de que o Firebase está corretamente inicializado

const db = getFirestore(app); // Inicializando Firestore

const NovaConsulta = () => {
  const router = useRouter();
  const searchParams = useSearchParams(); // Hook para capturar dados da URL

  const [formData, setFormData] = useState({
    nomePaciente: "",
    cpf: "",
    logradouro: "",
    rg: "",
    bairro: "",
    numeroCasa: "",
    ametropia: "Não",
    data: "",
    hora: "",
    clinica: "",
    loja: "loja1",
    status: "agendada",
    valorConsulta: "", // Adicionando valor da consulta
  });

  const [clientes, setClientes] = useState([]); // Armazenar os dados dos clientes buscados
  const [showNomeSuggestions, setShowNomeSuggestions] = useState(false); // Controlar a exibição das sugestões de nome
  const [showCpfSuggestions, setShowCpfSuggestions] = useState(false); // Controlar a exibição das sugestões de CPF

  // Definir a data e hora atuais no formulário ou capturar da URL
  useEffect(() => {
    const now = new Date();
    const formattedDate = now.toISOString().slice(0, 10); // Formato yyyy-MM-dd
    const formattedTime = now.toTimeString().slice(0, 5); // Formato HH:mm

    // Preencher os dados do formData a partir da URL (caso existam)
    setFormData((prevData) => ({
      nomePaciente: searchParams.get("nomePaciente") || "",
      cpf: searchParams.get("cpf") || "",
      logradouro: searchParams.get("logradouro") || "",
      rg: searchParams.get("rg") || "",
      bairro: searchParams.get("bairro") || "",
      numeroCasa: searchParams.get("numeroCasa") || "",
      ametropia: searchParams.get("ametropia") || "Não", // Padrão para "Não"
      data: searchParams.get("data") || formattedDate,
      hora: searchParams.get("hora") || formattedTime,
      clinica: searchParams.get("clinica") || "", // Campo de clínica preenchido da URL
      loja: searchParams.get("loja") || "loja1", // Valor padrão para loja1
    }));
  }, [searchParams]); // Atualiza quando os parâmetros da URL mudam

  // Função para buscar consumidores por nome no Firestore
  const fetchClientesPorNome = async (nome) => {
    if (nome.length < 3) return; // Buscar após digitar pelo menos 3 caracteres
    try {
      const consumersRef = collection(db, "consumers");
      const querySnapshot = await getDocs(consumersRef);

      const clientesEncontrados = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.nome.toLowerCase().startsWith(nome.toLowerCase())) {
          clientesEncontrados.push(data);
        }
      });

      setClientes(clientesEncontrados);
      setShowNomeSuggestions(true);
      setShowCpfSuggestions(false);
    } catch (error) {
      console.error("Erro ao buscar consumidores por nome:", error);
    }
  };

  // Função para buscar consumidores por CPF no Firestore
  const fetchClientesPorCPF = async (cpf) => {
    if (cpf.length < 3) return;
    try {
      const cpfFormatado = cpf.replace(/[.-]/g, "");
      const consumersRef = collection(db, "consumers");
      const querySnapshot = await getDocs(consumersRef);

      const clientesEncontrados = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.cpf === cpfFormatado) {
          clientesEncontrados.push(data);
        }
      });

      setClientes(clientesEncontrados);
      setShowCpfSuggestions(true);
      setShowNomeSuggestions(false);
    } catch (error) {
      console.error("Erro ao buscar consumidores por CPF:", error);
    }
  };

  // Função para lidar com a mudança nos campos
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));

    if (name === "nomePaciente") {
      fetchClientesPorNome(value);
    }

    if (name === "cpf") {
      fetchClientesPorCPF(value);
    }
  };

  // Função para selecionar um cliente e preencher o formulário
  const handleSelectCliente = (cliente) => {
    setFormData({
      nomePaciente: cliente.nome,
      cpf: cliente.cpf,
      logradouro: cliente.logradouro,
      rg: cliente.rg,
      bairro: cliente.bairro,
      numeroCasa: cliente.numero,
      ametropia: "Não",
      data: formData.data,
      hora: formData.hora,
      clinica: formData.clinica,
      loja: formData.loja,
    });
    setShowNomeSuggestions(false);
    setShowCpfSuggestions(false);
  };

  // Função para redirecionar para a tela de confirmação com os dados
  const handleSubmit = (e) => {
    e.preventDefault();
    const queryString = new URLSearchParams(formData).toString();
    router.push(
      `/consultation/medical-consultation/confirm-consultation?${queryString}`
    );
  };

  // Função para limpar o formulário
  const handleClear = () => {
    setFormData({
      nomePaciente: "",
      valorConsulta: "",
      cpf: "",
      logradouro: "",
      rg: "",
      bairro: "",
      numeroCasa: "",
      ametropia: "Não", // Valor padrão
      data: "",
      hora: "",
      clinica: "", // Limpar o campo clínica
      loja: "loja1", // Valor padrão para loja
    });
    setShowNomeSuggestions(false);
    setShowCpfSuggestions(false);
  };

  return (
    <Layout>
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="w-full max-w-lg p-8 bg-white rounded-lg shadow-md">
          <div className="flex flex-col items-center mb-4">
            <div className="flex w-full justify-between mb-2">
              <button
                type="button"
                onClick={() =>
                  router.push(
                    "/consultation/medical-consultation/list-consultation"
                  )
                }
                className="px-8 mr-2 py-2 bg-[#81059e] text-white rounded"
              >
                LISTA DE CONSULTAS
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="px-8 mr-2 py-2 bg-[#81059e] text-white rounded"
              >
                LIMPAR
              </button>
            </div>
            <h2 className="text-xl md:text-2xl font-semibold text-[#81059e]">
              NOVA CONSULTA
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 grid grid-cols-2 gap-4">
            <div className="relative col-span-2">
              <label className="block text-[#81059e]">Nome do Paciente</label>
              <input
                type="text"
                name="nomePaciente"
                value={formData.nomePaciente}
                onChange={handleInputChange}
                className="w-full mt-1 px-3 py-2 border border-[#81059e] rounded text-black focus:outline-none focus:ring-2 focus:ring-[#81059e]"
              />
              {showNomeSuggestions && clientes.length > 0 && (
                <div className="absolute z-10 bg-white border border-gray-300 rounded mt-2 w-full max-h-40 overflow-auto text-black">
                  {clientes.map((cliente) => (
                    <div
                      key={cliente.cpf}
                      className="p-2 cursor-pointer hover:bg-gray-200"
                      onClick={() => handleSelectCliente(cliente)}
                    >
                      {cliente.nome} - {cliente.cpf}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="relative col-span-2">
              <label className="block text-[#81059e]">CPF</label>
              <input
                type="text"
                name="cpf"
                value={formData.cpf}
                onChange={handleInputChange}
                className="w-full mt-1 px-3 py-2 border border-[#81059e] rounded text-black focus:outline-none focus:ring-2 focus:ring-[#81059e]"
              />
              {showCpfSuggestions && clientes.length > 0 && (
                <div className="absolute z-10 bg-white border border-gray-300 rounded mt-2 w-full max-h-40 overflow-auto text-black">
                  {clientes.map((cliente) => (
                    <div
                      key={cliente.cpf}
                      className="p-2 cursor-pointer hover:bg-gray-200"
                      onClick={() => handleSelectCliente(cliente)}
                    >
                      {cliente.nome} - {cliente.cpf}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-[#81059e]">Logradouro</label>
              <input
                type="text"
                name="logradouro"
                value={formData.logradouro}
                onChange={handleInputChange}
                className="w-full mt-1 px-3 py-2 border border-[#81059e] rounded text-black focus:outline-none focus:ring-2 focus:ring-[#81059e]"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-[#81059e]">Valor da Consulta</label>
              <input
                type="number"
                name="valorConsulta"
                value={formData.valorConsulta}
                onChange={handleInputChange}
                className="w-full mt-1 px-3 py-2 border border-[#81059e] rounded text-black focus:outline-none focus:ring-2 focus:ring-[#81059e]"
              />
            </div>

            <div>
              <label className="block text-[#81059e]">RG</label>
              <input
                type="text"
                name="rg"
                value={formData.rg}
                onChange={handleInputChange}
                className="w-full mt-1 px-3 py-2 border border-[#81059e] rounded text-black focus:outline-none focus:ring-2 focus:ring-[#81059e]"
              />
            </div>

            <div>
              <label className="block text-[#81059e]">Bairro</label>
              <input
                type="text"
                name="bairro"
                value={formData.bairro}
                onChange={handleInputChange}
                className="w-full mt-1 px-3 py-2 border border-[#81059e] rounded text-black focus:outline-none focus:ring-2 focus:ring-[#81059e]"
              />
            </div>

            <div>
              <label className="block text-[#81059e]">Nº da Casa</label>
              <input
                type="text"
                name="numeroCasa"
                value={formData.numeroCasa}
                onChange={handleInputChange}
                className="w-full mt-1 px-3 py-2 border border-[#81059e] rounded text-black focus:outline-none focus:ring-2 focus:ring-[#81059e]"
              />
            </div>

            {/* Ametropia como Select */}
            <div>
              <label className="block text-[#81059e]">Ametropia</label>
              <select
                name="ametropia"
                value={formData.ametropia}
                onChange={handleInputChange}
                className="w-full mt-1 px-3 py-2 border border-[#81059e] rounded text-black focus:outline-none focus:ring-2 focus:ring-[#81059e]"
              >
                <option value="Sim">Sim</option>
                <option value="Não">Não</option>
              </select>
            </div>

            <div>
              <label className="block text-[#81059e]">Data</label>
              <input
                type="date"
                name="data"
                value={formData.data}
                onChange={handleInputChange}
                className="w-full mt-1 px-3 py-2 border border-[#81059e] rounded text-black focus:outline-none focus:ring-2 focus:ring-[#81059e]"
              />
            </div>

            <div>
              <label className="block text-[#81059e]">Hora</label>
              <input
                type="time"
                name="hora"
                value={formData.hora}
                onChange={handleInputChange}
                className="w-full mt-1 px-3 py-2 border border-[#81059e] rounded text-black focus:outline-none focus:ring-2 focus:ring-[#81059e]"
              />
            </div>

            {/* Select para Loja */}
            <div>
              <label className="block text-[#81059e]">Loja</label>
              <select
                name="loja"
                value={formData.loja}
                onChange={handleInputChange}
                className="w-full mt-1 px-3 py-2 border border-[#81059e] rounded text-black focus:outline-none focus:ring-2 focus:ring-[#81059e]"
              >
                <option value="loja1">Óticas Popular 1</option>
                <option value="loja2">Óticas Popular 2</option>
              </select>
            </div>

            {/* Campo para Clínica */}
            <div className="col-span-2">
              <label className="block text-[#81059e]">Clínica</label>
              <input
                type="text"
                name="clinica"
                value={formData.clinica}
                onChange={handleInputChange}
                className="w-full mt-1 px-3 py-2 border border-[#81059e] rounded text-black focus:outline-none focus:ring-2 focus:ring-[#81059e]"
                placeholder="Insira o nome da clínica"
              />
            </div>

            <div className="col-span-2 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2 bg-[#81059e] text-white rounded hover:bg-[#820f76]"
              >
                MARCAR CONSULTA
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

// Envolvendo o componente com Suspense
export default function Page() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <NovaConsulta />
    </Suspense>
  );
}
