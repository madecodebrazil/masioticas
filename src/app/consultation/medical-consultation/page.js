"use client";
import React, { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation"; // Para redirecionar e capturar dados da URL
import { getFirestore, collection, getDocs } from "firebase/firestore";
import Layout from "@/components/Layout"; // Seu layout instanciado
import { app } from "../../../lib/firebaseConfig"; // Certifique-se de que o Firebase está corretamente inicializado
import { useAuth } from "@/hooks/useAuth";
import { FiUser, FiCalendar, FiClock, FiMapPin, FiHome, FiFileText, FiDollarSign } from 'react-icons/fi';

const db = getFirestore(app); // Inicializando Firestore

const NovaConsulta = () => {
  const router = useRouter();
  const searchParams = useSearchParams(); // Hook para capturar dados da URL
  const { userPermissions, userData } = useAuth();
  const [selectedLoja, setSelectedLoja] = useState(null);

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

  // Definir loja inicial baseado nas permissões
  useEffect(() => {
    if (userPermissions) {
      if (!userPermissions.isAdmin && userPermissions.lojas.length > 0) {
        setSelectedLoja(userPermissions.lojas[0]);
      }
      else if (userPermissions.isAdmin && userPermissions.lojas.length > 0) {
        setSelectedLoja(userPermissions.lojas[0]);
      }
    }
  }, [userPermissions]);

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
      <div className="min-h-screen">
        <div className="w-full max-w-5xl mx-auto rounded-lg">
          <h2 className="text-3xl font-bold text-[#81059e] mb-8 mt-8">NOVA CONSULTA</h2>

          {/* Seletor de Loja para Admins */}
          {userPermissions?.isAdmin && (
            <div className="mb-6">
              <label className="text-[#81059e] font-medium flex items-center gap-2">
                <FiHome /> Selecionar Loja
              </label>
              <select
                value={selectedLoja || ''}
                onChange={(e) => setSelectedLoja(e.target.value)}
                className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black mt-1"
              >
                <option value="">Selecione uma loja</option>
                {userPermissions.lojas.map((loja) => (
                  <option key={loja} value={loja}>
                    {loja === 'loja1' ? 'Loja 1 - Centro' : 'Loja 2 - Caramuru'}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className='space-x-2 mb-6'>
            <button
              onClick={() => router.push("/consultation/medical-consultation/list-consultation")}
              className="bg-[#81059e] p-2 rounded-sm text-white"
            >
              LISTA DE CONSULTAS
            </button>
            <button
              onClick={handleClear}
              className="text-[#81059e] px-3 py-1 border-2 border-[#81059e] font-bold text-base rounded-sm"
            >
              Limpar
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 mb-20">
            {/* Seção Paciente */}
            <div className="p-4 bg-gray-50 rounded-lg mb-6">
              <h3 className="text-lg font-semibold text-[#81059e] mb-4 flex items-center gap-2">
                <FiUser /> Informações do Paciente
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="relative">
                  <label className="text-[#81059e] font-medium">Nome do Paciente</label>
                  <input
                    type="text"
                    name="nomePaciente"
                    value={formData.nomePaciente}
                    onChange={handleInputChange}
                    className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black"
                  />
                  {showNomeSuggestions && clientes.length > 0 && (
                    <div className="absolute z-10 bg-white border-2 border-[#81059e] rounded-lg w-full max-h-40 overflow-auto text-black">
                      {clientes.map((cliente) => (
                        <div
                          key={cliente.cpf}
                          className="p-2 cursor-pointer hover:bg-purple-50"
                          onClick={() => handleSelectCliente(cliente)}
                        >
                          {cliente.nome} - {cliente.cpf}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="relative">
                  <label className="text-[#81059e] font-medium">CPF</label>
                  <input
                    type="text"
                    name="cpf"
                    value={formData.cpf}
                    onChange={handleInputChange}
                    className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black"
                  />
                  {showCpfSuggestions && clientes.length > 0 && (
                    <div className="absolute z-10 bg-white border-2 border-[#81059e] rounded-lg w-full max-h-40 overflow-auto text-black">
                      {clientes.map((cliente) => (
                        <div
                          key={cliente.cpf}
                          className="p-2 cursor-pointer hover:bg-purple-50"
                          onClick={() => handleSelectCliente(cliente)}
                        >
                          {cliente.nome} - {cliente.cpf}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-[#81059e] font-medium">Logradouro</label>
                  <input
                    type="text"
                    name="logradouro"
                    value={formData.logradouro}
                    onChange={handleInputChange}
                    className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black"
                  />
                </div>

                <div>
                  <label className="text-[#81059e] font-medium">Bairro</label>
                  <input
                    type="text"
                    name="bairro"
                    value={formData.bairro}
                    onChange={handleInputChange}
                    className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black"
                  />
                </div>

                <div>
                  <label className="text-[#81059e] font-medium">Nº da Casa</label>
                  <input
                    type="text"
                    name="numeroCasa"
                    value={formData.numeroCasa}
                    onChange={handleInputChange}
                    className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black"
                  />
                </div>

                <div>
                  <label className="text-[#81059e] font-medium">RG</label>
                  <input
                    type="text"
                    name="rg"
                    value={formData.rg}
                    onChange={handleInputChange}
                    className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black"
                  />
                </div>
              </div>
            </div>

            {/* Seção Consulta */}
            <div className="p-4 bg-gray-50 rounded-lg mb-6">
              <h3 className="text-lg font-semibold text-[#81059e] mb-4 flex items-center gap-2">
                <FiCalendar /> Informações da Consulta
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="text-[#81059e] font-medium">Data</label>
                  <input
                    type="date"
                    name="data"
                    value={formData.data}
                    onChange={handleInputChange}
                    className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black"
                  />
                </div>

                <div>
                  <label className="text-[#81059e] font-medium">Hora</label>
                  <input
                    type="time"
                    name="hora"
                    value={formData.hora}
                    onChange={handleInputChange}
                    className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black"
                  />
                </div>

                <div>
                  <label className="text-[#81059e] font-medium">Valor da Consulta</label>
                  <input
                    type="number"
                    name="valorConsulta"
                    value={formData.valorConsulta}
                    onChange={handleInputChange}
                    className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black"
                  />
                </div>

                <div>
                  <label className="text-[#81059e] font-medium">Ametropia</label>
                  <select
                    name="ametropia"
                    value={formData.ametropia}
                    onChange={handleInputChange}
                    className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black"
                  >
                    <option value="Sim">Sim</option>
                    <option value="Não">Não</option>
                  </select>
                </div>

                <div>
                  <label className="text-[#81059e] font-medium">Clínica</label>
                  <input
                    type="text"
                    name="clinica"
                    value={formData.clinica}
                    onChange={handleInputChange}
                    className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black"
                    placeholder="Insira o nome da clínica"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-center gap-6 mt-8">
              <button
                type="submit"
                className="bg-[#81059e] p-2 px-3 rounded-sm text-white flex items-center gap-2"
              >
                MARCAR CONSULTA
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="border-2 border-[#81059e] p-2 px-3 rounded-sm text-[#81059e] flex items-center gap-2"
              >
                CANCELAR
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
    <Suspense fallback={<div> <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#81059e]"></div></div>}>
      <NovaConsulta />
    </Suspense>
  );
}
