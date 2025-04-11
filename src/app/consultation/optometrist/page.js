'use client'
import React, { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation'; // Importação do hook para navegação e busca de params
import Layout from '@/components/Layout'; // Importa seu Layout já instanciado

const RegistrarOptometrist = () => {
  const router = useRouter(); // Instancia o router para navegação
  const searchParams = useSearchParams(); // Hook para capturar os parâmetros da URL

  const [formData, setFormData] = useState({
    nomeOptometrista: '',
    registroOptometrista: '',
    email: '',
    genero: '',
    telefone: '',
    logradouro: '',
    bairro: ''
  });

  // Carregar os dados dos parâmetros da URL para o formulário
  useEffect(() => {
    setFormData({
      nomeOptometrista: searchParams.get('nomeOptometrista') || '',
      registroOptometrista: searchParams.get('registroOptometrista') || '',
      email: searchParams.get('email') || '',
      genero: searchParams.get('genero') || '',
      telefone: searchParams.get('telefone') || '',
      logradouro: searchParams.get('logradouro') || '',
      bairro: searchParams.get('bairro') || ''
    });
  }, [searchParams]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Convertendo os dados do formulário para query string
    const queryString = new URLSearchParams(formData).toString();

    // Redirecionando para a página de confirmação com os dados na URL
    router.push(`/consultation/optometrist/confirm-add?${queryString}`);
  };

  const handleGoToList = () => {
    router.push('/consultation/optometrist/list-optometrist');
  };

  return (
    <Layout>
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="w-full max-w-4xl p-8 bg-white rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-[#81059e]">REGISTRO DE OPTOMETRISTA</h2>
            <button
              onClick={handleGoToList}
              className="px-4 py-2 bg-[#81059e] text-white rounded hover:bg-[#820f76]"
            >
              Lista de Optometristas
            </button>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-[#81059e]">Nome do Optometrista</label>
              <input
                type="text"
                name="nomeOptometrista"
                value={formData.nomeOptometrista}
                onChange={handleInputChange}
                className="w-full mt-1 px-3 py-2 border border-[#81059e] rounded text-black focus:outline-none focus:ring-2 focus:ring-[#81059e]"
              />
            </div>

            <div>
              <label className="block text-[#81059e]">Registro do Optometrista</label>
              <input
                type="text"
                name="registroOptometrista"
                value={formData.registroOptometrista}
                onChange={handleInputChange}
                className="w-full mt-1 px-3 py-2 border border-[#81059e] rounded text-black focus:outline-none focus:ring-2 focus:ring-[#81059e]"
              />
            </div>

            <div>
              <label className="block text-[#81059e]">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full mt-1 px-3 py-2 border border-[#81059e] rounded text-black focus:outline-none focus:ring-2 focus:ring-[#81059e]"
              />
            </div>

            <div>
              <label className="block text-[#81059e]">Gênero</label>
              <div className="flex space-x-4">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="genero"
                    value="Masculino"
                    checked={formData.genero === 'Masculino'}
                    onChange={handleInputChange}
                    className="form-radio h-5 w-5 text-[#81059e]"
                  />
                  <span className="ml-2 text-black">Masculino</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="genero"
                    value="Feminino"
                    checked={formData.genero === 'Feminino'}
                    onChange={handleInputChange}
                    className="form-radio h-5 w-5 text-[#81059e]"
                  />
                  <span className="ml-2 text-black">Feminino</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-[#81059e]">Telefone</label>
              <input
                type="text"
                name="telefone"
                value={formData.telefone}
                onChange={handleInputChange}
                className="w-full mt-1 px-3 py-2 border border-[#81059e] rounded text-black focus:outline-none focus:ring-2 focus:ring-[#81059e]"
              />
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

            <div className="col-span-2 flex justify-end mt-4">
              <button
                type="submit"
                className="px-6 py-2 bg-[#81059e] text-white rounded hover:bg-[#820f76]"
              >
                REGISTRAR
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default function Page() {
  return (
    <Suspense fallback={<div> <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#81059e]"></div></div>}>
      <RegistrarOptometrist />
    </Suspense>
  );
}
