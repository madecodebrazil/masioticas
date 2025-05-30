"use client";

import React, { useState } from "react";
import Layout from "@/components/Layout";
import axios from "axios";
import { firestore } from "../../../lib/firebaseConfig";
import { collection, addDoc } from "firebase/firestore";
import Link from "next/link";
import { FiMapPin, FiUser, FiMail, FiPhone, FiHome, FiFileText } from 'react-icons/fi';

const RegisterProvider = () => {
  const [cnpj, setCnpj] = useState("");
  const [formData, setFormData] = useState({
    razaoSocial: "",
    nomeFantasia: "",
    email: "",
    telefone: "",
    cep: "",
    numero: "",
    logradouro: "",
    bairro: "",
    cidade: "",
    complemento: "",
    estado: "",
  });

  const [notification, setNotification] = useState({ message: "", type: "" });
  const [isLoading, setIsLoading] = useState(false);

  const handleCnpjChange = async (e) => {
    const inputCnpj = e.target.value.replace(/\D/g, "");
    setCnpj(inputCnpj);

    if (inputCnpj.length === 14) {
      await fetchCnpjData(inputCnpj);
    } else {
      clearAddressFields();
    }
  };

  const fetchCnpjData = async (cnpj) => {
    setIsLoading(true);
    try {
      const response = await axios.get(`https://publica.cnpj.ws/cnpj/${cnpj}`);
      const data = response.data;

      if (data.estabelecimento) {
        const estabelecimento = data.estabelecimento;
        setFormData({
          razaoSocial: data.razao_social || "",
          nomeFantasia: estabelecimento.nome_fantasia || "",
          email: estabelecimento.email || "",
          telefone: estabelecimento.ddd1 ? `${estabelecimento.ddd1} ${estabelecimento.telefone1}` : "",
          cep: estabelecimento.cep || "",
          numero: "",
          logradouro: estabelecimento.logradouro || "",
          bairro: estabelecimento.bairro || "",
          cidade: estabelecimento.cidade && estabelecimento.cidade.nome ? estabelecimento.cidade.nome : "",
          complemento: estabelecimento.complemento || "",
          estado: estabelecimento.estado ? estabelecimento.estado.sigla : "",
        });
        setNotification({ message: "Dados do CNPJ carregados com sucesso!", type: "success" });
      } else {
        setNotification({ message: "CNPJ inválido ou não encontrado.", type: "error" });
        clearAddressFields();
      }
    } catch (error) {
      console.error("Erro ao buscar dados do CNPJ:", error);
      setNotification({ message: "Erro ao buscar dados do CNPJ. Verifique o número e tente novamente.", type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  const clearAddressFields = () => {
    setFormData((prevData) => ({
      ...prevData,
      logradouro: "",
      bairro: "",
      cidade: "",
      estado: "",
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleClear = () => {
    setCnpj("");
    setFormData({
      razaoSocial: "",
      nomeFantasia: "",
      email: "",
      telefone: "",
      cep: "",
      numero: "",
      logradouro: "",
      bairro: "",
      cidade: "",
      complemento: "",
      estado: "",
    });
    setNotification({ message: "", type: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!cnpj || cnpj.length !== 14) {
      setNotification({ message: "CNPJ deve ter 14 dígitos!", type: "error" });
      return;
    }

    if (!formData.razaoSocial || !formData.nomeFantasia) {
      setNotification({ message: "Razão Social e Nome Fantasia são obrigatórios!", type: "error" });
      return;
    }

    setIsLoading(true);

    try {
      // Armazenando no novo endereço: lojas/laboratorio/items
      const docRef = await addDoc(collection(firestore, "lojas/laboratorio/items"), {
        cnpj,
        ...formData,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      setNotification({ 
        message: "Laboratório registrado com sucesso! ID: " + docRef.id, 
        type: "success" 
      });

      // Limpar formulário após sucesso
      setTimeout(() => {
        handleClear();
      }, 2000);

    } catch (error) {
      console.error("Erro ao registrar laboratório:", error);
      setNotification({ 
        message: "Erro ao registrar laboratório. Tente novamente.", 
        type: "error" 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatCNPJ = (value) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  };

  return (
    <Layout>
      <div className="min-h-screen">
        <div className="w-full max-w-5xl mx-auto rounded-sm">
            {/* Notificações */}
          {notification.message && (
            <div className={`p-4 mb-4 text-white rounded-sm ${
              notification.type === "success" ? "bg-green-500" : "bg-red-500"
            }`}>
              {notification.message}
            </div>
          )}
          <h2 className="text-3xl font-bold text-[#81059e] mb-8 mt-8">LABORATÓRIO</h2>

          <div className='space-x-2 mb-6'>
            <Link href="/products_and_services/laboratory/list_laboratory">
              <button className="bg-[#81059e] p-2 rounded-sm text-white">
                LISTA DE LABORATÓRIOS
              </button>
            </Link>
            <button
              onClick={handleClear}
              className="text-[#81059e] px-3 py-1 border-2 border-[#81059e] font-bold text-base rounded-sm"
            >
              Limpar
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 mb-20">
            {/* Seção CNPJ */}
            <div className="p-4 bg-gray-50 rounded-sm mb-6">
              <h3 className="text-lg font-semibold text-[#81059e] mb-4 flex items-center gap-2">
                <FiFileText /> Identificação
              </h3>
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="text-[#81059e] font-medium">CNPJ</label>
                  <input
                    type="text"
                    value={formatCNPJ(cnpj)}
                    onChange={handleCnpjChange}
                    maxLength={18}
                    className="border-2 border-[#81059e] p-3 rounded-sm w-full text-black"
                    placeholder="00.000.000/0000-00"
                    required
                  />
                  {isLoading && (
                    <p className="text-sm text-gray-500 mt-1">Buscando dados do CNPJ...</p>
                  )}
                </div>
              </div>
            </div>

            {/* Seção Dados da Empresa */}
            <div className="p-4 bg-gray-50 rounded-sm mb-6">
              <h3 className="text-lg font-semibold text-[#81059e] mb-4 flex items-center gap-2">
                <FiUser /> Dados da Empresa
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-[#81059e] font-medium">Razão Social</label>
                  <input
                    type="text"
                    name="razaoSocial"
                    value={formData.razaoSocial}
                    onChange={handleInputChange}
                    className="border-2 border-[#81059e] p-3 rounded-sm w-full text-black"
                    placeholder="EXEMPLOS E SERVIÇOS LTDA"
                    required
                  />
                </div>
                <div>
                  <label className="text-[#81059e] font-medium">Nome Fantasia</label>
                  <input
                    type="text"
                    name="nomeFantasia"
                    value={formData.nomeFantasia}
                    onChange={handleInputChange}
                    className="border-2 border-[#81059e] p-3 rounded-sm w-full text-black"
                    placeholder="EMPRESA LTDA"
                    required
                  />
                </div>
                <div>
                  <label className="text-[#81059e] font-medium flex items-center gap-2">
                    <FiMail /> E-mail
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="border-2 border-[#81059e] p-3 rounded-sm w-full text-black"
                    placeholder="empresa@email.com"
                  />
                </div>
                <div>
                  <label className="text-[#81059e] font-medium flex items-center gap-2">
                    <FiPhone /> Telefone
                  </label>
                  <input
                    type="text"
                    name="telefone"
                    value={formData.telefone}
                    onChange={handleInputChange}
                    className="border-2 border-[#81059e] p-3 rounded-sm w-full text-black"
                    placeholder="(12) 3456-7890"
                  />
                </div>
              </div>
            </div>

            {/* Seção Endereço */}
            <div className="p-4 bg-gray-50 rounded-sm mb-6">
              <h3 className="text-lg font-semibold text-[#81059e] mb-4 flex items-center gap-2">
                <FiMapPin /> Endereço
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                <div>
                  <label className="text-[#81059e] font-medium">CEP</label>
                  <input
                    type="text"
                    name="cep"
                    value={formData.cep}
                    onChange={handleInputChange}
                    className="border-2 border-[#81059e] p-3 rounded-sm w-full text-black"
                    placeholder="00000-000"
                  />
                </div>
                <div>
                  <label className="text-[#81059e] font-medium">Logradouro</label>
                  <input
                    type="text"
                    name="logradouro"
                    value={formData.logradouro}
                    onChange={handleInputChange}
                    className="border-2 border-[#81059e] p-3 rounded-sm w-full text-black"
                    placeholder="Rua Exemplo"
                  />
                </div>
                <div>
                  <label className="text-[#81059e] font-medium">Número</label>
                  <input
                    type="text"
                    name="numero"
                    value={formData.numero}
                    onChange={handleInputChange}
                    className="border-2 border-[#81059e] p-3 rounded-sm w-full text-black"
                    placeholder="ex:123"
                  />
                </div>
                <div>
                  <label className="text-[#81059e] font-medium">Bairro</label>
                  <input
                    type="text"
                    name="bairro"
                    value={formData.bairro}
                    onChange={handleInputChange}
                    className="border-2 border-[#81059e] p-3 rounded-sm w-full text-black"
                    placeholder="Bairro Exemplo"
                  />
                </div>
                <div>
                  <label className="text-[#81059e] font-medium">Cidade</label>
                  <input
                    type="text"
                    name="cidade"
                    value={formData.cidade}
                    onChange={handleInputChange}
                    className="border-2 border-[#81059e] p-3 rounded-sm w-full text-black"
                    placeholder="Exemplo City"
                  />
                </div>
                <div>
                  <label className="text-[#81059e] font-medium">Estado</label>
                  <input
                    type="text"
                    name="estado"
                    value={formData.estado}
                    onChange={handleInputChange}
                    className="border-2 border-[#81059e] p-3 rounded-sm w-full text-black"
                    maxLength={2}
                    placeholder="Ex: SP, RJ, MG"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="text-[#81059e] font-medium">Complemento</label>
                  <input
                    type="text"
                    name="complemento"
                    value={formData.complemento}
                    onChange={handleInputChange}
                    className="border-2 border-[#81059e] p-3 rounded-sm w-full text-black"
                    placeholder="Opcional"
                  />
                </div>
              </div>
            </div>

            {/* Botões de ação */}
            <div className="flex justify-center gap-6 mt-8">
              <button
                type="button"
                onClick={handleClear}
                className="border-2 border-[#81059e] p-2 px-3 rounded-sm text-[#81059e] flex items-center gap-2"
                disabled={isLoading}
              >
                CANCELAR
              </button>
              <button
                type="submit"
                className="bg-[#81059e] p-3 px-6 rounded-sm text-white flex items-center gap-2"
                disabled={isLoading}
              >
                {isLoading ? 'PROCESSANDO...' : 'SALVAR'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default RegisterProvider;