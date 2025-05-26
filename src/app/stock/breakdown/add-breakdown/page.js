"use client";
import React, { Suspense, useState, useEffect } from 'react';
import Layout from '@/components/Layout'; // O seu layout
import { useRouter, useSearchParams } from 'next/navigation';
import { doc, setDoc, collection, getDocs } from 'firebase/firestore';
import { firestore } from '../../../../lib/firebaseConfig';

export function AddBreakdown() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Obtém os dados da URL e os converte para um objeto JavaScript
  const formDataFromQuery = searchParams.get('formData') ? JSON.parse(decodeURIComponent(searchParams.get('formData'))) : {};

  const [formData, setFormData] = useState({
    nomeProduto: formDataFromQuery.nomeProduto || '',
    codigo: formDataFromQuery.codigo || '',
    NCM: formDataFromQuery.NCM || '',
    sku: formDataFromQuery.sku || '',
    produto: formDataFromQuery.produto || '',
    descricao: formDataFromQuery.descricao || '',
    data: formDataFromQuery.data || new Date().toISOString().split('T')[0], // Data atual ou valor da URL
    hora: formDataFromQuery.hora || new Date().toTimeString().split(' ')[0], // Hora atual ou valor da URL
    loja: formDataFromQuery.loja || 'Óticas Popular 1', // Pode ser preenchido dinamicamente ou valor da URL
    tipoAvaria: formDataFromQuery.tipoAvaria || '',
  });

  const [isLoading, setIsLoading] = useState(false); // Estado para controle de carregamento
  const [suggestions, setSuggestions] = useState([]); // Estado para armazenar sugestões de produtos

  // Função para atualizar o formData ao digitar nos campos
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });

    // Se o campo alterado for o nome do produto, buscar sugestões
    if (e.target.name === 'nomeProduto') {
      searchProducts(e.target.value);
    }
  };

  // Função para buscar produtos nas coleções ao digitar o nome no campo "produto"
  const searchProducts = async (searchText) => {
    if (!searchText) {
      setSuggestions([]);
      return;
    }

    const lojas = [
      { nome: 'Loja 1 - Armações', colecao: 'loja1_armacoes' },
      { nome: 'Loja 2 - Armações', colecao: 'loja2_armacoes' },
      { nome: 'Loja 1 - Lentes', colecao: 'loja1_lentes' },
      { nome: 'Loja 2 - Lentes', colecao: 'loja2_lentes' },
    ];

    let results = [];

    const searchTextLower = searchText.toLowerCase(); // Converter o texto de busca para minúsculas

    // Itera sobre cada loja e faz a busca correspondente no Firestore pelo campo "produto"
    for (let loja of lojas) {
      const querySnapshot = await getDocs(collection(firestore, loja.colecao));

      querySnapshot.forEach((doc) => {
        const produtoLowerCase = doc.data().produto.toLowerCase(); // Converte o nome do produto para minúsculas
        if (produtoLowerCase.includes(searchTextLower)) {
          results.push({
            id: doc.id,
            produto: doc.data().produto, // Exibe o campo "produto" original
            loja: loja.nome,
            codigo: doc.data().codigo, // Adiciona o campo código do produto
            NCM: doc.data().NCM, // Adiciona o campo NCM
            sku: doc.data().sku, // Adiciona o campo sku
            tipo: loja.colecao.includes('armacoes') ? 'Armação' : 'Lentes', // Define o tipo (armação ou lentes)
          });
        }
      });
    }

    setSuggestions(results);
  };

  const handleSuggestionClick = (suggestion) => {
    // Atualiza o nome do produto e a loja com base na sugestão selecionada, além de preencher o sku, código, NCM e tipo de produto
    setFormData({
      ...formData,
      nomeProduto: suggestion.produto,
      loja: suggestion.loja,
      codigo: suggestion.codigo || '', // Preenche o código do produto
      NCM: suggestion.NCM || '', // Preenche o NCM
      sku: suggestion.sku || '', // Preenche o sku
      produto: suggestion.tipo, // Define como Armação ou Lentes
    });
    setSuggestions([]); // Limpa as sugestões após selecionar
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true); // Ativa o estado de carregamento

    try {
      const queryString = encodeURIComponent(JSON.stringify(formData));
      // Redireciona para a página de confirmação com os dados do formulário na URL
      router.push(`/stock/breakdown/add-breakdown/confirm-breakdown?formData=${queryString}`);
    } catch (error) {
      console.error('Erro ao registrar a avaria:', error);
    } finally {
      setIsLoading(false); // Desativa o estado de carregamento
    }
  };

  return (
    <Layout>
      <div className="p-6">
        <h1 className="text-2xl font-bold" style={{ color: '#81059e' }}>REGISTRAR AVARIA</h1>

        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          {/* Nome do Produto */}
          <div className="relative">
            <label className="block text-sm font-bold" style={{ color: '#81059e87' }}>Nome do Produto</label>
            <input
              type="text"
              name="nomeProduto"
              value={formData.nomeProduto}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black"
              placeholder="Informe o nome do produto"
              required
            />
            {/* Sugestões de produtos */}
            {suggestions.length > 0 && (
              <div className="absolute z-10 bg-white border border-gray-300 rounded-lg mt-1 w-full max-h-40 overflow-y-auto">
                {suggestions.map((suggestion, index) => (
                  <div
                    key={`${suggestion.id}-${suggestion.loja}-${index}`} // Concatena o id com a loja e um índice para garantir unicidade
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="px-4 py-2 hover:bg-purple-100 cursor-pointer"
                  >
                    {suggestion.produto} ({suggestion.loja}) {/* Exibe o campo "produto" */}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Código do Produto, NCM, sku, Produto */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold" style={{ color: '#81059e87' }}>Código do Produto</label>
              <input
                type="text"
                name="codigo"
                value={formData.codigo}
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

            <div>
              <label className="block text-sm font-bold" style={{ color: '#81059e87' }}>SKU</label>
              <input
                type="text"
                name="sku"
                value={formData.sku}
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
              placeholder="Informe a descrição da avaria"
              required
            ></textarea>
          </div>

          {/* Data, Hora, Loja */}
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
              <input
                type="text"
                name="loja"
                value={formData.loja}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black"
                readOnly
              />
            </div>
          </div>

          {/* Tipo de Avaria */}
          <div>
            <label className="block text-sm font-bold" style={{ color: '#81059e87' }}>Tipo de Avaria</label>
            <div className="flex space-x-4">
              {['Desbotando', 'Descascando', 'Fissuras', 'Oxidado'].map((tipo) => (
                <button
                  key={tipo}
                  type="button"
                  onClick={() => setFormData({ ...formData, tipoAvaria: tipo })}
                  className={`px-4 py-2 border rounded-lg ${formData.tipoAvaria === tipo
                    ? 'bg-[#81059e] text-white'
                    : 'border-[#81059e] text-black'
                    }`}
                  style={{ backgroundColor: formData.tipoAvaria === tipo ? '#81059e' : 'transparent' }}
                >
                  {tipo}
                </button>
              ))}
            </div>
          </div>

          {/* Botão de Registro */}
          <div className="flex justify-center">
            <button
              type="submit"
              className="px-6 py-3 rounded-lg font-bold"
              style={{ backgroundColor: '#81059e', color: 'white' }}
              disabled={isLoading}
            >
              {isLoading ? 'Registrando...' : 'REGISTRAR AVARIA'}
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
      <AddBreakdown />
    </Suspense>
  );
}