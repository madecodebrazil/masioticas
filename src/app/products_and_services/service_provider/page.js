"use client";

import React, { useState } from 'react';
import Layout from '@/components/Layout'; // ajuste o caminho do import conforme necessário
import { firestore } from "../../../lib/firebaseConfig"; // Ajuste o caminho do import conforme necessário
import { collection, addDoc } from "firebase/firestore"; // Importando funções do Firestore
import { useRouter } from 'next/navigation'; // Importando useRouter para redirecionamento

const RegisterProvider = () => {
  const router = useRouter(); // Para fazer redirecionamento
  const [cep, setCep] = useState('');
  const [logradouro, setLogradouro] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('');
  const [cpf, setCpf] = useState('');
  const [name, setNome] = useState('');
  const [apelido, setApelido] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [notification, setNotification] = useState({ message: "", type: "" }); // Estado para notificações

  const handleCepChange = async (e) => {
    const inputCep = e.target.value;
    setCep(inputCep);

    if (inputCep.length === 8) { // Verifica se o CEP tem 8 dígitos
      try {
        const response = await fetch(`https://viacep.com.br/ws/${inputCep}/json/`);
        const data = await response.json();

        if (!data.erro) {
          setLogradouro(data.logradouro);
          setBairro(data.bairro);
          setCidade(data.localidade);
          setEstado(data.uf);
        } else {
          alert('CEP não encontrado.');
          clearAddressFields();
        }
      } catch (error) {
        console.error('Erro ao buscar o CEP:', error);
      }
    } else {
      clearAddressFields(); // Limpa os campos se o CEP não estiver completo
    }
  };

  const handleCpfChange = async (e) => {
    const inputCpf = e.target.value.replace(/\D/g, ""); // Remove caracteres não numéricos
    setCpf(inputCpf);

    if (inputCpf.length === 11) { // Verifica se o CPF tem 11 dígitos
      try {
        const response = await fetch(`https://www.receitaws.com.br/v1/cpf/${inputCpf}`);
        const data = await response.json();

        if (!data.erro) {
          // Preenche os campos com os dados retornados pela API
          setLogradouro(data.logradouro || '');
          setBairro(data.bairro || '');
          setCidade(data.cidade || '');
          setEstado(data.estado || '');
        } else {
          alert('CPF não encontrado ou inválido.');
          clearAddressFields();
        }
      } catch (error) {
        console.error('Erro ao buscar os dados pelo CPF:', error);
      }
    } else {
      clearAddressFields(); // Limpa os campos se o CPF não estiver completo
    }
  };

  const clearAddressFields = () => {
    setLogradouro('');
    setBairro('');
    setCidade('');
    setEstado('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); // Evitar refresh da página

    try {
      // Adicionando todos os dados à coleção 'providers' no Firestore
      const docRef = await addDoc(collection(firestore, "reparo_prestador"), {
        cep,
        logradouro,
        bairro,
        cidade,
        estado,
        cpf,
        name,
        apelido,
        email,
        telefone,
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
        <div className="flex justify-between items-center mb-4">
          {/* Botão para redirecionar para PRESTADORES REGISTRADOS */}
          <button
            onClick={() => router.push('/products_and_services/service_provider/list-providers')}
            className="bg-[#81059e] text-white font-bold px-4 py-2 rounded-lg"
          >
            PRESTADORES REGISTRADOS
          </button>

          <h1 className="text-2xl font-bold text-center text-[#81059e] mb-4">REGISTRAR PRESTADOR</h1>
        </div>

        {/* Exibe notificações */}
        {notification.message && (
          <div className={`p-4 mb-4 text-white ${notification.type === "success" ? "bg-green-500" : "bg-red-500"}`}>
            {notification.message}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-[#81059e]">Nome</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setNome(e.target.value)}
              className="border border-purple-300 p-2 w-full text-black"
            />
          </div>
          <div className="flex space-x-4">
            <div className="flex-1">
              <label className="block text-[#81059e]">Apelido</label>
              <input
                type="text"
                value={apelido}
                onChange={(e) => setApelido(e.target.value)}
                className="border border-purple-300 p-2 w-full text-black"
              />
            </div>
            <div className="flex-1">
              <label className="block text-[#81059e]">CPF</label>
              <input
                type="text"
                value={cpf}
                onChange={handleCpfChange}
                className="border border-purple-300 p-2 w-full text-black"
                placeholder="Digite apenas números"
              />
            </div>
          </div>
          <div>
            <label className="block text-[#81059e]">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border border-purple-300 p-2 w-full text-black"
            />
          </div>
          <div>
            <label className="block text-[#81059e]">Telefone</label>
            <input
              type="tel"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              className="border border-purple-300 p-2 w-full text-black"
            />
          </div>
          <h2 className="text-lg font-semibold text-[#81059e]">Endereço</h2>
          <div className="flex space-x-4">
            <div className="flex-1">
              <label className="block text-[#81059e]">CEP</label>
              <input
                type="text"
                value={cep}
                onChange={handleCepChange}
                className="border border-purple-300 p-2 w-full text-black"
              />
            </div>
            <div className="flex-1">
              <label className="block text-[#81059e]">Número</label>
              <input type="text" className="border border-purple-300 p-2 w-full text-black" />
            </div>
          </div>
          <div>
            <label className="block text-[#81059e]">Logradouro</label>
            <input
              type="text"
              value={logradouro}
              onChange={(e) => setLogradouro(e.target.value)}
              className="border border-purple-300 p-2 w-full text-black"
            />
          </div>
          <div className="flex space-x-4">
            <div className="flex-1">
              <label className="block text-[#81059e]">Bairro</label>
              <input
                type="text"
                value={bairro}
                onChange={(e) => setBairro(e.target.value)}
                className="border border-purple-300 p-2 w-full text-black"
              />
            </div>
            <div className="flex-1">
              <label className="block text-[#81059e]">Cidade</label>
              <input
                type="text"
                value={cidade}
                onChange={(e) => setCidade(e.target.value)}
                className="border border-purple-300 p-2 w-full text-black"
              />
            </div>
          </div>
          <div>
            <label className="block text-[#81059e]">Complemento</label>
            <input type="text" className="border border-purple-300 p-2 w-full text-black" />
          </div>
          <div>
            <label className="block text-[#81059e]">Estado</label>
            <input
              type="text"
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
              className="border border-purple-300 p-2 w-full text-black"
            />
          </div>
          <button type="submit" className="bg-[#81059e] text-white p-2 w-full ">Salvar</button>
        </form>

        {/* Exibe notificações */}
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
