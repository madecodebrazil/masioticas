"use client";

import React, { useState } from "react";
import Layout from "@/components/Layout"; // ajuste o caminho do import conforme necessário
import axios from "axios"; // Importando axios para requisições
import { firestore } from "../../../lib/firebaseConfig"; // Ajuste o caminho do import conforme necessário
import { collection, addDoc } from "firebase/firestore"; // Importando funções do Firestore
import Link from "next/link"; // Importando o componente Link

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

  const [notification, setNotification] = useState({ message: "", type: "" }); // Estado para notificações

  const handleCnpjChange = async (e) => {
    const inputCnpj = e.target.value.replace(/\D/g, ""); // Remove caracteres não numéricos
    setCnpj(inputCnpj);

    if (inputCnpj.length === 14) {
      await fetchCnpjData(inputCnpj);
    } else {
      clearAddressFields();
    }
  };

  const fetchCnpjData = async (cnpj) => {
    try {
      const response = await axios.get(`https://publica.cnpj.ws/cnpj/${cnpj}`);
      const data = response.data;

      if (data.estabelecimento) {
        const estabelecimento = data.estabelecimento;
        setFormData({
          razaoSocial: data.razao_social || "N/A",
          nomeFantasia: estabelecimento.nome_fantasia || "N/A",
          email: estabelecimento.email || "N/A",
          telefone: estabelecimento.ddd1 ? `${estabelecimento.ddd1} ${estabelecimento.telefone1}` : "N/A",
          cep: estabelecimento.cep || "N/A",
          numero: "",
          logradouro: estabelecimento.logradouro || "N/A",
          bairro: estabelecimento.bairro || "N/A",
          cidade: estabelecimento.cidade && estabelecimento.cidade.nome ? estabelecimento.cidade.nome : "N/A",
          complemento: estabelecimento.complemento || "",
          estado: estabelecimento.estado ? estabelecimento.estado.sigla : "N/A",
        });
      } else {
        alert("CNPJ inválido ou não encontrado.");
        clearAddressFields();
      }
    } catch (error) {
      console.error("Erro ao buscar dados do CNPJ:", error);
      alert("Erro ao buscar dados do CNPJ. Verifique o número e tente novamente.");
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

  const handleSubmit = async (e) => {
    e.preventDefault(); // Evitar refresh da página
    console.log("Enviando dados do prestador:", formData);

    try {
      // Adicionando dados à coleção 'laboratory' no Firestore
      const docRef = await addDoc(collection(firestore, "laboratory"), {
        cnpj,
        ...formData,
      });
      setNotification({ message: "Prestador registrado com sucesso! ID: " + docRef.id, type: "success" });

      // Redirecionando após um tempo para outra página
      setTimeout(() => {
        window.location.href = "/products_and_services"; // Redireciona para a rota desejada
      }, 2000); // Redireciona após 2 segundos
    } catch (error) {
      console.error("Erro ao registrar prestador:", error);
      setNotification({ message: "Erro ao registrar prestador. Tente novamente.", type: "error" });
    }
  };

  return (
    <Layout>
      <div className="p-4">
        <h1 className="text-2xl font-bold text-center text-[#81059e] mb-4">CRIAR LABORATÓRIO</h1>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-[#81059e]">CNPJ</label>
            <input
              type="text"
              value={cnpj}
              onChange={handleCnpjChange}
              className="border border-purple-300 p-2 w-full text-black"
              placeholder="Digite apenas números"
            />
          </div>
          <div>
            <label className="block text-[#81059e]">Razão Social</label>
            <input
              type="text"
              value={formData.razaoSocial}
              onChange={(e) => setFormData({ ...formData, razaoSocial: e.target.value })}
              className="border border-purple-300 p-2 w-full text-black"
            />
          </div>
          <div>
            <label className="block text-[#81059e]">Nome Fantasia</label>
            <input
              type="text"
              value={formData.nomeFantasia}
              onChange={(e) => setFormData({ ...formData, nomeFantasia: e.target.value })}
              className="border border-purple-300 p-2 w-full text-black"
            />
          </div>
          <div>
            <label className="block text-[#81059e]">E-mail</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="border border-purple-300 p-2 w-full text-black"
            />
          </div>
          <div>
            <label className="block text-[#81059e]">Telefone</label>
            <input
              type="text"
              value={formData.telefone}
              onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
              className="border border-purple-300 p-2 w-full text-black"
            />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-[#81059e]">Endereço</h2>
          <div>
            <label className="block text-[#81059e]">CEP</label>
            <input
              type="text"
              value={formData.cep}
              onChange={(e) => setFormData({ ...formData, cep: e.target.value })}
              className="border border-purple-300 p-2 w-full text-black"
            />
          </div>
          <div>
            <label className="block text-[#81059e]">Número</label>
            <input
              type="text"
              value={formData.numero}
              onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
              className="border border-purple-300 p-2 w-full text-black"
            />
          </div>
          <div>
            <label className="block text-[#81059e]">Logradouro</label>
            <input
              type="text"
              value={formData.logradouro}
              onChange={(e) => setFormData({ ...formData, logradouro: e.target.value })}
              className="border border-purple-300 p-2 w-full text-black"
            />
          </div>
          <div>
            <label className="block text-[#81059e]">Bairro</label>
            <input
              type="text"
              value={formData.bairro}
              onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
              className="border border-purple-300 p-2 w-full text-black"
            />
          </div>
          <div>
            <label className="block text-[#81059e]">Cidade</label>
            <input
              type="text"
              value={formData.cidade}
              onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
              className="border border-purple-300 p-2 w-full text-black"
            />
          </div>
          <div>
            <label className="block text-[#81059e]">Complemento</label>
            <input
              type="text"
              value={formData.complemento}
              onChange={(e) => setFormData({ ...formData, complemento: e.target.value })}
              className="border border-purple-300 p-2 w-full text-black"
            />
          </div>
          <div>
            <label className="block text-[#81059e]">Estado</label>
            <input
              type="text"
              value={formData.estado}
              onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
              className="border border-purple-300 p-2 w-full text-black"
            />
          </div>
          <button type="submit" className="bg-[#81059e] text-white p-2 w-full">Salvar</button>
        </form>

        {/* Exibe notificações abaixo do botão de salvar */}
        {notification.message && (
          <div className={`p-4 mb-4 text-white ${notification.type === "success" ? "bg-green-500" : "bg-red-500"}`}>
            {notification.message}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default RegisterProvider;
