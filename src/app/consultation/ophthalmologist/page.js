'use client'
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';
import { FiUser, FiFileText, FiPhone, FiMail, FiMapPin, FiHome } from 'react-icons/fi';
import InputMask from 'react-input-mask';

const RegistrarOftalmologista = () => {
  const router = useRouter();
  const { userPermissions, userData } = useAuth();
  const [selectedLoja, setSelectedLoja] = useState(null);

  const [formData, setFormData] = useState({
    nomeMedico: '',
    crm: '',
    email: '',
    genero: '',
    telefone: '',
    logradouro: '',
    bairro: ''
  });

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const queryString = new URLSearchParams(formData).toString();
    router.push(`/consultation/ophthalmologist/confirm-add?${queryString}`);
  };

  const handleGoToList = () => {
    router.push('/consultation/ophthalmologist/list-ophthalmo');
  };

  const renderLojaName = (lojaId) => {
    const lojaNames = {
      'loja1': 'Loja 1 - Centro',
      'loja2': 'Loja 2 - Caramuru'
    };
    return lojaNames[lojaId] || lojaId;
  };

  return (
    <Layout>
      <div className="min-h-screen">
        <div className="w-full max-w-5xl mx-auto rounded-lg">
          <h2 className="text-3xl font-bold text-[#81059e] mb-8 mt-8">REGISTRO DE OFTALMOLOGISTA</h2>

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
                    {renderLojaName(loja)}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className='space-x-2 mb-6'>
            <button
              onClick={handleGoToList}
              className="bg-[#81059e] p-2 rounded-sm text-white"
            >
              LISTA DE OFTALMOLOGISTAS
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 mb-20">
            {/* Seção Informações Pessoais */}
            <div className="p-4 bg-gray-50 rounded-lg mb-6">
              <h3 className="text-lg font-semibold text-[#81059e] mb-4 flex items-center gap-2">
                <FiUser /> Informações Pessoais
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-[#81059e] font-medium">Nome do Médico</label>
                  <input
                    type="text"
                    name="nomeMedico"
                    value={formData.nomeMedico}
                    onChange={handleInputChange}
                    className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black"
                    required
                  />
                </div>

                <div>
                  <label className="text-[#81059e] font-medium">CRM</label>
                  <InputMask
                    mask="CRM/aa 999999"
                    formatChars={{
                      'a': '[A-Z]',
                      '9': '[0-9]'
                    }}
                    maskChar=" "
                    name="crm"
                    value={formData.crm}
                    onChange={handleInputChange}
                    className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black uppercase"
                    placeholder="CRM/SP 123456"
                    required
                  />
                </div>

                <div>
                  <label className="text-[#81059e] font-medium">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black"
                    required
                  />
                </div>

                <div>
                  <label className="text-[#81059e] font-medium">Telefone</label>
                  <input
                    type="text"
                    name="telefone"
                    value={formData.telefone}
                    onChange={handleInputChange}
                    className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black"
                    required
                  />
                </div>

                <div>
                  <label className="text-[#81059e] font-medium">Gênero</label>
                  <div className="flex space-x-4 mt-1">
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
              </div>
            </div>

            {/* Seção Endereço */}
            <div className="p-4 bg-gray-50 rounded-lg mb-6">
              <h3 className="text-lg font-semibold text-[#81059e] mb-4 flex items-center gap-2">
                <FiMapPin /> Endereço
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-[#81059e] font-medium">Logradouro</label>
                  <input
                    type="text"
                    name="logradouro"
                    value={formData.logradouro}
                    onChange={handleInputChange}
                    className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black"
                    required
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
                    required
                  />
                </div>
              </div>
            </div>

            {/* Botões de ação */}
            <div className="flex justify-center gap-6 mt-8">
              <button
                type="submit"
                className="bg-[#81059e] p-2 px-3 rounded-sm text-white flex items-center gap-2"
              >
                REGISTRAR
              </button>
              <button
                type="button"
                onClick={() => setFormData({
                  nomeMedico: '',
                  crm: '',
                  email: '',
                  genero: '',
                  telefone: '',
                  logradouro: '',
                  bairro: ''
                })}
                className="border-2 border-[#81059e] p-2 px-3 rounded-sm text-[#81059e] flex items-center gap-2"
              >
                LIMPAR
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default RegistrarOftalmologista;