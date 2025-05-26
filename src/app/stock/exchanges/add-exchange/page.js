"use client";
import React, { Suspense, useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { useRouter, useSearchParams } from 'next/navigation';
import { collection, getDocs } from "firebase/firestore";
import { firestore } from '../../../../lib/firebaseConfig';

export function AddExchange() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Função para extrair formData da URL
  const formDataFromQuery = searchParams.get('formData') ? JSON.parse(decodeURIComponent(searchParams.get('formData'))) : {};

  const [formData, setFormData] = useState({
    nomeCliente: '',
    codigoProduto: '',
    NCM: '',
    SKU: '',
    produto: '',
    descricao: '',
    data: '',
    hora: '',
    loja: 'Óticas Popular 1', // Loja selecionada
    motivo: '',
    status: '',
    cpf: '', // Para armazenar o CPF do cliente selecionado
    pessoaId: '', // Armazena o ID do consumidor
  });

  const [isLoading, setIsLoading] = useState(false);
  const [userSuggestions, setUserSuggestions] = useState([]); // Sugestões para nome do cliente

  // Ao montar o componente, preencher o formulário se os dados vierem da URL
  useEffect(() => {
    if (Object.keys(formDataFromQuery).length > 0) {
      const [data, hora] = formDataFromQuery.data ? formDataFromQuery.data.split(' ') : [new Date().toISOString().split('T')[0], new Date().toTimeString().split(' ')[0]];
      setFormData({
        ...formDataFromQuery,
        data,
        hora
      });
    } else {
      const now = new Date();
      setFormData((prevData) => ({
        ...prevData,
        data: now.toISOString().split('T')[0],
        hora: now.toTimeString().split(' ')[0],
      }));
    }
  }, []); // Dependência vazia para garantir que o useEffect só execute uma vez

  // Função para limpar todos os campos
  const handleClear = () => {
    setFormData({
      nomeCliente: '',
      codigoProduto: '',
      NCM: '',
      SKU: '',
      produto: '',
      descricao: '',
      data: new Date().toISOString().split('T')[0],
      hora: new Date().toTimeString().split(' ')[0],
      loja: 'Óticas Popular 1',
      motivo: '',
      status: '',
      cpf: '',
      pessoaId: '',
    });
  };

  // Função para buscar clientes na coleção "consumers"
  const searchClients = async (searchText) => {
    if (!searchText) {
      setUserSuggestions([]);
      return;
    }

    try {
      const consumersCollectionRef = collection(firestore, 'consumers');
      const usersSnapshot = await getDocs(consumersCollectionRef);

      const suggestions = [];

      usersSnapshot.forEach((doc) => {
        const consumerData = doc.data();
        if (consumerData.nome && consumerData.nome.toLowerCase().startsWith(searchText.toLowerCase())) {
          suggestions.push({
            id: doc.id,
            cpf: consumerData.cpf, // Captura o CPF
            ...consumerData
          });
        }
      });

      setUserSuggestions(suggestions);
    } catch (error) {
      console.error('Erro ao buscar consumidores: ', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    if (name === 'nomeCliente') {
      searchClients(value);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setFormData({
      ...formData,
      nomeCliente: suggestion.nome,
      cpf: suggestion.cpf, // Preenche o CPF
      pessoaId: suggestion.id, // Armazena o ID do consumidor
    });
    setUserSuggestions([]); // Limpa as sugestões após a seleção
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Cria o objeto com os dados da troca
      const exchangeData = {
        ...formData,
        data: `${formData.data} ${formData.hora}`, // Combina data e hora
      };

      // Serializa o objeto em uma query string para passar pela URL
      const queryString = encodeURIComponent(JSON.stringify(exchangeData));

      // Redireciona para a página de confirmação com os dados
      router.push(`/stock/exchanges/add-exchange/confirm-exchange?formData=${queryString}`);
    } catch (error) {
      console.error('Erro ao registrar a troca: ', error);
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold" style={{ color: '#81059e' }}>REGISTRAR TROCA</h1>
          <button
            className="bg-[#81059e] text-white font-bold px-4 py-2 rounded-lg"
            onClick={handleClear}
          >
            LIMPAR
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          {/* Nome do Cliente */}
          <div className="relative">
            <label className="block text-sm font-bold" style={{ color: '#81059e87' }}>Nome do Cliente</label>
            <input
              type="text"
              name="nomeCliente"
              value={formData.nomeCliente}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black"
              placeholder="Digite o nome do cliente"
              required
            />
            {userSuggestions.length > 0 && (
              <ul className="text-black absolute z-10 bg-white border border-gray-300 rounded mt-2 max-h-40 overflow-y-auto w-full">
                {userSuggestions.map((suggestion, index) => (
                  <li
                    key={index}
                    className="p-2 hover:bg-gray-200 cursor-pointer"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    {suggestion.nome}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Código do Produto e NCM */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold" style={{ color: '#81059e87' }}>Código do Produto</label>
              <input
                type="text"
                name="codigoProduto"
                value={formData.codigoProduto}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black"
                placeholder="Informe o código do produto"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold" style={{ color: '#81059e87' }}>NCM</label>
              <input
                type="text"
                name="NCM"
                value={formData.NCM}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black"
                placeholder="Informe o NCM"
              />
            </div>
          </div>

          {/* SKU e Produto */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold" style={{ color: '#81059e87' }}>SKU</label>
              <input
                type="text"
                name="SKU"
                value={formData.SKU}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black"
                placeholder="Informe o SKU"
              />
            </div>
            <div>
              <label className="block text-sm font-bold" style={{ color: '#81059e87' }}>Produto</label>
              <input
                type="text"
                name="produto"
                value={formData.produto}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black"
                placeholder="Informe o tipo de produto"
              />
            </div>
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-sm font-bold" style={{ color: '#81059e87' }}>Descrição</label>
            <textarea
              name="descricao"
              value={formData.descricao}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black"
              placeholder="Informe a descrição do produto"
              required
            ></textarea>
          </div>

          {/* Data, Hora e Loja */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-bold" style={{ color: '#81059e87' }}>Data</label>
              <input
                type="date"
                name="data"
                value={formData.data}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black"
              />
            </div>

            <div>
              <label className="block text-sm font-bold" style={{ color: '#81059e87' }}>Hora</label>
              <input
                type="time"
                name="hora"
                value={formData.hora}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black"
              />
            </div>

            <div>
              <label className="block text-sm font-bold" style={{ color: '#81059e87' }}>Loja</label>
              <select
                name="loja"
                value={formData.loja}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black"
              >
                <option value="Óticas Popular 1">Óticas Popular 1</option>
                <option value="Óticas Popular 2">Óticas Popular 2</option>
              </select>
            </div>
          </div>

          {/* Motivo */}
          <div>
            <label className="block text-sm font-bold" style={{ color: '#81059e87' }}>Motivo</label>
            <select
              name="motivo"
              value={formData.motivo}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black"
              required
            >
              <option value="">Selecione um motivo</option>
              <option value="Defeito de Fabricação">Defeito de Fabricação</option>
              <option value="Desconforto Após Uso">Desconforto Após Uso</option>
              <option value="Falha na Montagem">Falha na Montagem</option>
              <option value="Incompatibilidade">Incompatibilidade</option>
              <option value="Preferência de Estilo">Preferência de Estilo</option>
              <option value="Prescrição Alterada">Prescrição Alterada</option>
              <option value="Problema de Visão Não Corrigido">Problema de Visão Não Corrigido</option>
              <option value="Quebra Acidental">Quebra Acidental</option>
              <option value="Tamanho Errado">Tamanho Errado</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-bold" style={{ color: '#81059e87' }}>Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black"
              required
            >
              <option value="">Selecione um status</option>
              <option value="Aguardando Avaliação">Aguardando Avaliação</option>
              <option value="Em Análise">Em Análise</option>
              <option value="Confirmando Defeito de Fabricação">Confirmando Defeito de Fabricação</option>
              <option value="Danos por Uso">Danos por Uso</option>
              <option value="Troca Autorizada">Troca Autorizada</option>
              <option value="Troca Concluída">Troca Concluída</option>
            </select>
          </div>

          {/* Botão de Registrar Troca */}
          <div className="flex justify-center">
            <button
              type="submit"
              className="px-6 py-3 rounded-lg font-bold"
              style={{ backgroundColor: '#81059e', color: 'white' }}
              disabled={isLoading}
            >
              {isLoading ? 'Registrando...' : 'REGISTRAR TROCA'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
export default function Page() {
  return (
    <Suspense fallback={<div> <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#81059e]"></div></div>}>
      <AddExchange />
    </Suspense>
  );
}