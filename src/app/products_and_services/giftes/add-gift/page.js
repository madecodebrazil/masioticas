"use client";
import React, { Suspense, useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { useRouter, useSearchParams } from 'next/navigation';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { collection, getDocs } from "firebase/firestore";
import { firestore } from '../../../../lib/firebaseConfig'; // Certifique-se que o firebaseConfig está correto

export function RegistrarBrinde() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Pegando o momento atual
  const now = new Date();

  // Estado inicial do formulário, buscando os dados da URL se existirem
  const [formData, setFormData] = useState({
    nomeCliente: searchParams.get('nomeCliente') || '',
    sku: searchParams.get('sku') || '',
    produtoComprado: searchParams.get('produtoComprado') || '',
    descricaoBrinde: searchParams.get('descricaoBrinde') || '',
    dataBrinde: searchParams.get('dataBrinde') ? new Date(searchParams.get('dataBrinde')) : now,
    horaBrinde: searchParams.get('horaBrinde') ? new Date(searchParams.get('horaBrinde')) : now,
    loja: searchParams.get('loja') || 'Óticas Popular 1',
  });

  const [userSuggestions, setUserSuggestions] = useState([]); // Para sugestões de usuários

  // Função para tratar a mudança de input
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));

    // Buscar clientes se o campo "nomeCliente" for modificado
    if (name === 'nomeCliente') {
      fetchUserSuggestions(value);
    }
  };

  // Função para buscar sugestões de clientes
  const fetchUserSuggestions = async (nome) => {
    if (nome.trim() === "") {
      setUserSuggestions([]); // Limpar sugestões se o nome for vazio
      return;
    }

    try {
      const consumersCollectionRef = collection(firestore, 'consumers');
      const usersSnapshot = await getDocs(consumersCollectionRef);

      const suggestions = [];

      for (const consumerDoc of usersSnapshot.docs) {
        const consumerData = consumerDoc.data();

        if (consumerData.nome && consumerData.nome.toLowerCase().startsWith(nome.toLowerCase())) {
          suggestions.push({
            id: consumerDoc.id,  // Captura o ID do consumidor
            cpf: consumerData.cpf, // Captura o CPF
            ...consumerData
          });
        }
      }

      setUserSuggestions(suggestions);
    } catch (error) {
      console.error('Erro ao buscar consumidores: ', error);
    }
  };

  // Função para selecionar um cliente da lista de sugestões
  const selectUser = (user) => {
    setFormData((prevData) => ({
      ...prevData,
      nomeCliente: user.nome,
      cpf: user.cpf, // Armazena o CPF do cliente selecionado
    }));

    setUserSuggestions([]); // Limpa as sugestões após a seleção
  };

  // Função para registrar e redirecionar para a página de confirmação
  const handleRegister = () => {
    const query = new URLSearchParams(formData).toString();
    router.push(`/products_and_services/giftes/add-gift/confirm-gift?${query}`);
  };

  return (
    <Layout>
      <div className="container mx-auto p-6 bg-white rounded-lg shadow">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between pb-4">
          <div className="text-lg font-bold text-[#81059e]">REGISTRAR BRINDE</div>
          <button className="bg-[#81059e] text-white px-4 py-2 rounded-md hover:bg-[#781e6a]" onClick={() => setFormData({})}>
            LIMPAR
          </button>
        </div>

        {/* Formulário */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div className="md:col-span-2">
            <label className="block text-[#81059e]">Nome do Cliente</label>
            <input
              type="text"
              name="nomeCliente"
              value={formData.nomeCliente}
              onChange={handleInputChange}
              placeholder="Nome do cliente"
              className="w-full p-2 border border-[#81059e] rounded-md text-black"
            />

            {/* Mostrar sugestões de usuários */}
            {userSuggestions.length > 0 && (
              <ul className="bg-white border border-gray-300 rounded mt-2">
                {userSuggestions.map((user) => (
                  <li
                    key={user.id}
                    className="p-2 hover:bg-gray-200 cursor-pointer text-black" // Texto preto para as sugestões
                    onClick={() => selectUser(user)}
                  >
                    {user.nome}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <label className="block text-[#81059e]">SKU</label>
            <input
              type="text"
              name="sku"
              value={formData.sku}
              onChange={handleInputChange}
              className="w-full p-2 border border-[#81059e] rounded-md text-black"
            />
          </div>

          <div>
            <label className="block text-[#81059e]">Produto Comprado</label>
            <input
              type="text"
              name="produtoComprado"
              value={formData.produtoComprado}
              onChange={handleInputChange}
              className="w-full p-2 border border-[#81059e] rounded-md text-black"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-[#81059e]">Descrição do Brinde</label>
            <textarea
              name="descricaoBrinde"
              value={formData.descricaoBrinde}
              onChange={handleInputChange}
              className="w-full p-2 border border-[#81059e] rounded-md text-black"
            />
          </div>

          {/* Data e Hora utilizando DatePicker */}
          <div>
            <label className="block text-[#81059e]">Data</label>
            <DatePicker
              selected={formData.dataBrinde}
              onChange={(date) => setFormData((prev) => ({ ...prev, dataBrinde: date }))}
              dateFormat="dd/MM/yyyy"
              className="w-full p-2 border border-[#81059e] rounded-md text-black"
            />
          </div>

          <div>
            <label className="block text-[#81059e]">Hora</label>
            <DatePicker
              selected={formData.horaBrinde}
              onChange={(date) => setFormData((prev) => ({ ...prev, horaBrinde: date }))}
              showTimeSelect
              showTimeSelectOnly
              timeIntervals={15}
              timeCaption="Hora"
              dateFormat="HH:mm"
              className="w-full p-2 border border-[#81059e] rounded-md text-black"
            />
          </div>

          {/* Seletor de Loja */}
          <div>
            <label className="block text-[#81059e]">Loja</label>
            <select
              name="loja"
              value={formData.loja}
              onChange={handleInputChange}
              className="w-full p-2 border border-[#81059e] rounded-md text-black"
            >
              <option value="Óticas Popular 1">Óticas Popular 1</option>
              <option value="Óticas Popular 2">Óticas Popular 2</option>
            </select>
          </div>
        </div>

        {/* Botão de Registrar */}
        <div className="flex justify-center mt-6">
          <button
            onClick={handleRegister}
            className="bg-[#81059e] text-white px-6 py-3 rounded-md hover:bg-[#781e6a]"
          >
            REGISTRAR BRINDE
          </button>
        </div>
      </div>
    </Layout>
  );
}
export default function Page() {
  return (
    <Suspense fallback={<div> <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#81059e]"></div></div>}>
      <RegistrarBrinde />
    </Suspense>
  );
}