"use client";
import React, { Suspense, useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { firestore } from '@/lib/firebaseConfig';
import { useRouter, useSearchParams } from 'next/navigation';
import { getDocs, collection } from "firebase/firestore";

export function Repair() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [formData, setFormData] = useState({
    nomeCliente: '',
    codigoProduto: '',
    NCM: '',
    SKU: '',
    produto: '',
    descricao: '',
    data: '',
    hora: '',
    loja: 'loja1', // Loja selecionada
    prestador: '',
    tipo: '',
    valor: '',
    pessoaId: '', // ID do consumidor
    cpf: '', // CPF do consumidor
  });

  const [isLoading, setIsLoading] = useState(false);
  const [tipoMontagem, setTipoMontagem] = useState([]); // Tipos de montagem obtidos via fetch
  const [userSuggestions, setUserSuggestions] = useState([]); // Sugestões de consumidores
  const [prestadores, setPrestadores] = useState([]); // Prestadores obtidos via fetch

  useEffect(() => {
    const now = new Date();
    const dataAtual = now.toISOString().split('T')[0];
    const horaAtual = now.toTimeString().split(' ')[0];

    // Preencher os campos de data e hora
    setFormData((prevData) => ({
      ...prevData,
      data: dataAtual,
      hora: horaAtual,
    }));

    fetchTiposMontagem(); // Carregar os tipos de montagem
    fetchPrestadores(); // Carregar os prestadores

    // Verifica se existem dados na URL e os preenche
    const formDataFromQuery = searchParams.get('formData') ? JSON.parse(decodeURIComponent(searchParams.get('formData'))) : {};
    if (Object.keys(formDataFromQuery).length) {
      setFormData({ ...formData, ...formDataFromQuery });
    }
  }, [searchParams]);

  // Função para buscar tipos de montagem na coleção "reparo_tiposs"
  const fetchTiposMontagem = async () => {
    try {
      const montagemSnapshot = await getDocs(collection(firestore, 'reparo_tipos'));
      const tipos = montagemSnapshot.docs.map(doc => doc.data().name); // Busca o campo 'name' de cada documento
      setTipoMontagem(tipos);
    } catch (error) {
      console.error('Erro ao buscar tipos de montagem: ', error);
    }
  };

  // Função para buscar prestadores na coleção "montagem_prestadores"
  const fetchPrestadores = async () => {
    try {
      const prestadorSnapshot = await getDocs(collection(firestore, 'reparo_prestador'));
      const prestadoresData = prestadorSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })); // Busca todos os prestadores

      setPrestadores(prestadoresData);
    } catch (error) {
      console.error('Erro ao buscar prestadores: ', error);
    }
  };

  // Função para buscar consumidores na coleção "consumers"
  const searchClients = async (searchText) => {
    if (!searchText) {
      setUserSuggestions([]);
      return;
    }

    try {
      console.log(`Buscando clientes que começam com: ${searchText}`);
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

    // Se o campo alterado for o nome do cliente, buscar sugestões de consumidores
    if (name === 'nomeCliente') {
      searchClients(value);
    }
  };

  // Função para selecionar um consumidor das sugestões
  const handleSuggestionClick = (suggestion) => {
    setFormData({
      ...formData,
      nomeCliente: suggestion.nome,
      cpf: suggestion.cpf, // Preenche o CPF
      pessoaId: suggestion.id, // Armazena o ID do consumidor
    });
    setUserSuggestions([]); // Limpa as sugestões após a seleção
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const queryString = encodeURIComponent(JSON.stringify(formData));
      router.push(`/products_and_services/repair/confirm-repair?formData=${queryString}`);
    } catch (error) {
      console.error('Erro ao registrar o malote: ', error);
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="p-6">
        {/* Cabeçalho e Botão de Limpar */}
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-center" style={{ color: '#81059e' }}>CRIAR REPARO</h1>
          <button className="bg-[#81059e] text-white font-bold px-4 py-2 rounded-lg">
            LIMPAR
          </button>
          {/* Substituindo o botão por um ícone de configurações */}
          <img
            src="/images/Settings.png" // Caminho para o ícone de configurações
            alt="Configurações"
            className="cursor-pointer hover:opacity-80 transition"
            style={{ width: '40px', height: '40px' }}
            onClick={() => router.push('/products_and_services/repair/repair-ab')} // Redireciona para a rota desejada ao clicar
          />
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          {/* Primeira linha: Data, Hora e Loja */}
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
                <option value="loja1">Óticas Popular 1</option>
                <option value="loja2">Óticas Popular 2</option>
              </select>
            </div>
          </div>

          {/* Segunda linha: Cliente e Produto */}
          <div className="grid grid-cols-2 gap-4">
            <div className="relative">
              <label className="block text-sm font-bold" style={{ color: '#81059e87' }}>Cliente</label>
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

          {/* Terceira linha: Prestadores */}
          <div>
            <label className="block text-sm font-bold" style={{ color: '#81059e87' }}>Prestadores</label>
            <div className="flex flex-wrap gap-2">
              {prestadores.length > 0 ? (
                prestadores.map((prestador) => (
                  <button
                    key={prestador.id}
                    type="button"
                    className={`px-4 py-2 border rounded-lg ${formData.prestador === prestador.name ? 'bg-[#81059e] text-white' : 'border-[#81059e] text-black'
                      }`}
                    onClick={() => setFormData({ ...formData, prestador: prestador.name })} // Define o prestador selecionado
                  >
                    {prestador.name}
                  </button>
                ))
              ) : (
                <p className="text-sm text-gray-500">Carregando prestadores...</p>
              )}
            </div>
          </div>

          {/* Quarta linha: Tipos de Montagem */}
          <div>
            <label className="block text-sm font-bold" style={{ color: '#81059e87' }}>Tipo</label>
            <div className="flex flex-wrap gap-2">
              {tipoMontagem.length > 0 ? (
                tipoMontagem.map((tipo, index) => (
                  <button
                    key={index}
                    type="button"
                    className={`px-4 py-2 border rounded-lg ${formData.tipo === tipo ? 'bg-[#81059e] text-white' : 'border-[#81059e] text-black'
                      }`}
                    onClick={() => setFormData({ ...formData, tipo })} // Define o tipo selecionado
                  >
                    {tipo}
                  </button>
                ))
              ) : (
                <p className="text-sm text-gray-500">Carregando tipos...</p>
              )}
            </div>
          </div>

          {/* Valor */}
          <div>
            <label className="block text-sm font-bold" style={{ color: '#81059e87' }}>Valor</label>
            <input
              type="text"
              name="valor"
              value={formData.valor}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black"
              placeholder="Informe o valor"
              required
            />
          </div>

          {/* Botão de Registrar */}
          <div className="flex justify-center">
            <button
              type="submit"
              className="px-6 py-3 rounded-lg font-bold"
              style={{ backgroundColor: '#81059e', color: 'white' }}
              disabled={isLoading}
            >
              {isLoading ? 'Registrando...' : 'ENVIAR REPARO'}
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
      <Repair />
    </Suspense>
  );
}