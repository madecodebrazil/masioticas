'use client';
import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation'; // Importar useSearchParams
import Layout from '@/components/Layout';
import axios from 'axios';

const AddFabricanteForm = () => {
  const [formData, setFormData] = useState({
    razaoSocial: '',
    nomeFantasia: '',
    cnpj: '',
    email: '',
    telefone: '',
    cep: '',
    numero: '',
    logradouro: '',
    estado: '',
    cidade: ''
  });

  const router = useRouter();
  const searchParams = useSearchParams(); // Hook para acessar os parâmetros da URL

  useEffect(() => {
    // Recupera os valores da URL e atualiza o estado se os dados existirem
    const razaoSocial = searchParams.get('razaoSocial') || '';
    const nomeFantasia = searchParams.get('nomeFantasia') || '';
    const cnpj = searchParams.get('cnpj') || '';
    const email = searchParams.get('email') || '';
    const telefone = searchParams.get('telefone') || '';
    const cep = searchParams.get('cep') || '';
    const numero = searchParams.get('numero') || '';
    const logradouro = searchParams.get('logradouro') || '';
    const estado = searchParams.get('estado') || '';
    const cidade = searchParams.get('cidade') || '';

    setFormData({
      razaoSocial,
      nomeFantasia,
      cnpj,
      email,
      telefone,
      cep,
      numero,
      logradouro,
      estado,
      cidade
    });
  }, [searchParams]); // Executa o efeito toda vez que os parâmetros da URL mudarem

  // Função para formatar o CNPJ automaticamente com pontos e traços
  const formatCNPJ = (cnpj) => {
    return cnpj
      .replace(/\D/g, '')
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  };

  // Função para buscar dados da API de CNPJ
  const fetchCNPJData = async (cnpj) => {
    const cleanedCNPJ = cnpj.replace(/\D/g, ''); // Remove todos os caracteres não numéricos
    console.log(`Fetching data for CNPJ: ${cleanedCNPJ}`);
    try {
      const response = await axios.get(`https://brasilapi.com.br/api/cnpj/v1/${cleanedCNPJ}`);
      console.log('API Response:', response.data);
      const data = response.data;
      setFormData({
        razaoSocial: data.razao_social || '',
        nomeFantasia: data.nome_fantasia || '',
        email: data.email || '',
        telefone: data.telefone || '',
        cep: data.cep || '',
        logradouro: data.logradouro || '',
        numero: data.numero || '',
        estado: data.uf || '',
        cidade: data.municipio || '',
        cnpj: formatCNPJ(cleanedCNPJ) // Formatar o CNPJ ao preencher
      });
    } catch (error) {
      console.error('Erro ao buscar dados do CNPJ:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === 'cnpj') {
      const cleanedValue = value.replace(/\D/g, ''); // Remove pontos e traços ao colar ou digitar
      setFormData({ ...formData, [name]: formatCNPJ(cleanedValue) });

      // Fazer o fetch do CNPJ se tiverem 14 dígitos numéricos
      if (cleanedValue.length === 14) {
        fetchCNPJData(cleanedValue);
      }
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleConfirm = () => {
    // Serializa os dados do formulário para enviar via URL
    const queryParams = new URLSearchParams(formData).toString();
    // Redireciona para a página de confirmação
    router.push(`/products_and_services/industry/confirm?${queryParams}`);
  };

  return (
    <Layout>
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4" style={{ color: '#81059e87' }}>
          Registrar Fabricante
        </h1>
        <form className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
          {/* Restante dos inputs */}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="razaoSocial" style={{ color: '#81059e87' }}>
              Razão Social
            </label>
            <input
              type="text"
              id="razaoSocial"
              name="razaoSocial"
              value={formData.razaoSocial}
              onChange={handleInputChange}
              className="border rounded w-full py-2 px-3"
              style={{ color: 'black' }}
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="nomeFantasia" style={{ color: '#81059e87' }}>
              Nome Fantasia
            </label>
            <input
              type="text"
              id="nomeFantasia"
              name="nomeFantasia"
              value={formData.nomeFantasia}
              onChange={handleInputChange}
              className="border rounded w-full py-2 px-3"
              style={{ color: 'black' }}
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="cnpj" style={{ color: '#81059e87' }}>
              CNPJ
            </label>
            <input
              type="text"
              id="cnpj"
              name="cnpj"
              value={formData.cnpj}
              onChange={handleInputChange}
              className="border rounded w-full py-2 px-3"
              style={{ color: 'black' }}
              maxLength="18"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email" style={{ color: '#81059e87' }}>
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="border rounded w-full py-2 px-3"
              style={{ color: 'black' }}
              required
            />
          </div>

          {/* Campos na mesma linha: Telefone, CEP e Número */}
          <div className="flex space-x-4 mb-4">
            <div className="w-1/3">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="telefone" style={{ color: '#81059e87' }}>
                Telefone
              </label>
              <input
                type="text"
                id="telefone"
                name="telefone"
                value={formData.telefone}
                onChange={handleInputChange}
                className="border rounded w-full py-2 px-3"
                style={{ color: 'black' }}
                required
              />
            </div>

            <div className="w-1/3">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="cep" style={{ color: '#81059e87' }}>
                CEP
              </label>
              <input
                type="text"
                id="cep"
                name="cep"
                value={formData.cep}
                onChange={handleInputChange}
                className="border rounded w-full py-2 px-3"
                style={{ color: 'black' }}
                required
              />
            </div>

            <div className="w-1/3">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="numero" style={{ color: '#81059e87' }}>
                Número
              </label>
              <input
                type="text"
                id="numero"
                name="numero"
                value={formData.numero}
                onChange={handleInputChange}
                className="border rounded w-full py-2 px-3"
                style={{ color: 'black' }}
                required
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="logradouro" style={{ color: '#81059e87' }}>
              Logradouro
            </label>
            <input
              type="text"
              id="logradouro"
              name="logradouro"
              value={formData.logradouro}
              onChange={handleInputChange}
              className="border rounded w-full py-2 px-3"
              style={{ color: 'black' }}
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="estado" style={{ color: '#81059e87' }}>
              Estado
            </label>
            <input
              type="text"
              id="estado"
              name="estado"
              value={formData.estado}
              onChange={handleInputChange}
              className="border rounded w-full py-2 px-3"
              style={{ color: 'black' }}
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="cidade" style={{ color: '#81059e87' }}>
              Cidade
            </label>
            <input
              type="text"
              id="cidade"
              name="cidade"
              value={formData.cidade}
              onChange={handleInputChange}
              className="border rounded w-full py-2 px-3"
              style={{ color: 'black' }}
              required
            />
          </div>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handleConfirm}
              className="bg-[#81059e87] text-white font-bold py-2 px-4 rounded"
            >
              Confirmar
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default function Page() {
  return (
    <Suspense fallback={<div> <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#81059e]"></div></div>}>
      <AddFabricanteForm />
    </Suspense>
  );
}
