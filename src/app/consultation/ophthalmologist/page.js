'use client'
import React, { useState } from 'react';
import { useRouter } from 'next/navigation'; // Importação do hook para navegação
import Layout from '@/components/Layout'; // Importa seu Layout já instanciado

const RegistrarOftalmologista = () => {
  const router = useRouter(); // Instancia o router para navegação

  const [formData, setFormData] = useState({
    nomeMedico: '',
    crm: '',
    email: '',
    genero: '',
    telefone: '',
    logradouro: '',
    bairro: ''
  });

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
    router.push(`/consultation/ophthalmologist/confirm-add?${queryString}`);
  };

  const handleGoToList = () => {
    router.push('/consultation/ophthalmologist/list-ophthalmo');
  };

  return (
    <Layout>
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="w-full max-w-4xl p-8 bg-white rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-[#932A83]">REGISTRO DE OFTALMOLOGISTA</h2>
            <button
              onClick={handleGoToList}
              className="px-4 py-2 bg-[#932A83] text-white rounded hover:bg-[#820f76]"
            >
              Lista de Oftalmologistas
            </button>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-[#932A83]">Nome do Médico</label>
              <input
                type="text"
                name="nomeMedico"
                value={formData.nomeMedico}
                onChange={handleInputChange}
                className="w-full mt-1 px-3 py-2 border border-[#932A83] rounded text-black focus:outline-none focus:ring-2 focus:ring-[#932A83]"
              />
            </div>

            <div>
              <label className="block text-[#932A83]">CRM</label>
              <input
                type="text"
                name="crm"
                value={formData.crm}
                onChange={handleInputChange}
                className="w-full mt-1 px-3 py-2 border border-[#932A83] rounded text-black focus:outline-none focus:ring-2 focus:ring-[#932A83]"
              />
            </div>

            <div>
              <label className="block text-[#932A83]">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full mt-1 px-3 py-2 border border-[#932A83] rounded text-black focus:outline-none focus:ring-2 focus:ring-[#932A83]"
              />
            </div>

            <div>
              <label className="block text-[#932A83]">Gênero</label>
              <div className="flex space-x-4">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="genero"
                    value="Masculino"
                    checked={formData.genero === 'Masculino'}
                    onChange={handleInputChange}
                    className="form-radio h-5 w-5 text-[#932A83]"
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
                    className="form-radio h-5 w-5 text-[#932A83]"
                  />
                  <span className="ml-2 text-black">Feminino</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-[#932A83]">Telefone</label>
              <input
                type="text"
                name="telefone"
                value={formData.telefone}
                onChange={handleInputChange}
                className="w-full mt-1 px-3 py-2 border border-[#932A83] rounded text-black focus:outline-none focus:ring-2 focus:ring-[#932A83]"
              />
            </div>

            <div>
              <label className="block text-[#932A83]">Logradouro</label>
              <input
                type="text"
                name="logradouro"
                value={formData.logradouro}
                onChange={handleInputChange}
                className="w-full mt-1 px-3 py-2 border border-[#932A83] rounded text-black focus:outline-none focus:ring-2 focus:ring-[#932A83]"
              />
            </div>

            <div>
              <label className="block text-[#932A83]">Bairro</label>
              <input
                type="text"
                name="bairro"
                value={formData.bairro}
                onChange={handleInputChange}
                className="w-full mt-1 px-3 py-2 border border-[#932A83] rounded text-black focus:outline-none focus:ring-2 focus:ring-[#932A83]"
              />
            </div>

            <div className="col-span-2 flex justify-end mt-4">
              <button
                type="submit"
                className="px-6 py-2 bg-[#932A83] text-white rounded hover:bg-[#820f76]"
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

export default RegistrarOftalmologista;
