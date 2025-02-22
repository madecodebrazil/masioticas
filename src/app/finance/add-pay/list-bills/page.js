"use client";

import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import Link from 'next/link';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { firestore } from '../../../../lib/firebaseConfig';
import jsPDF from 'jspdf';

export default function ListaContas() {
  const [contas, setContas] = useState([]);
  const [filteredContas, setFilteredContas] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLoja, setSelectedLoja] = useState('Ambas');
  const [selectedConta, setSelectedConta] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Novos estados para a forma de pagamento e mensagem de sucesso
  const [formaPagamento, setFormaPagamento] = useState('');
  const [settleMessage, setSettleMessage] = useState('');

  useEffect(() => {
    const fetchContas = async () => {
      try {
        setLoading(true);
        const lojas = ['loja1', 'loja2'];
        const fetchedContas = [];

        for (const loja of lojas) {
          const contasSnapshot = await getDocs(collection(firestore, loja, 'finances', 'a_pagar'));
          const lojaContas = contasSnapshot.docs.map((doc) => ({
            id: doc.id,
            loja: loja,
            ...doc.data(),
          }));
          fetchedContas.push(...lojaContas);
        }

        setContas(fetchedContas);
        setFilteredContas(fetchedContas);
        setLoading(false);
      } catch (err) {
        console.error('Erro ao carregar as contas:', err);
        setError('Erro ao carregar os dados das contas.');
        setLoading(false);
      }
    };

    fetchContas();
  }, []);

  // Função para filtrar contas com base na busca e loja
  useEffect(() => {
    const filterBySearchAndLoja = () => {
      let filtered = contas;

      // Filtro por loja
      if (selectedLoja !== 'Ambas') {
        filtered = filtered.filter((conta) => conta.loja === selectedLoja);
      }

      // Filtro por busca
      if (searchQuery !== '') {
        filtered = filtered.filter(
          (conta) =>
            conta.documento.toLowerCase().includes(searchQuery.toLowerCase()) ||
            conta.credor.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      setFilteredContas(filtered);
    };

    filterBySearchAndLoja();
  }, [searchQuery, selectedLoja, contas]);

  const getStatusColor = (vencimento) => {
    const now = new Date();
    const dueDate = new Date(vencimento);

    if (dueDate < now) return 'bg-red-200 text-red-800'; // Vencido
    if (dueDate - now <= 7 * 24 * 60 * 60 * 1000) return 'bg-yellow-200 text-yellow-800'; // Próximo de vencer
    return 'bg-green-200 text-green-800'; // Longe de vencer
  };

  // Função para abrir o modal e definir a conta selecionada
  const openModal = (conta) => {
    setSelectedConta(conta);
    setIsModalOpen(true);
    setFormaPagamento('');
    setSettleMessage('');
  };

  // Função para fechar o modal
  const closeModal = () => {
    setSelectedConta(null);
    setIsModalOpen(false);
  };

  // Função para gerar PDF
  const generatePDF = () => {
    if (!selectedConta) return;

    const doc = new jsPDF();
    doc.text(`Detalhes da Conta`, 10, 10);
    doc.text(`Código: ${selectedConta.documento}`, 10, 20);
    doc.text(`Credor: ${selectedConta.credor}`, 10, 30);
    doc.text(`Valor: R$ ${parseFloat(selectedConta.valor).toFixed(2)}`, 10, 40);
    doc.text(`Data de Entrada: ${selectedConta.dataEntrada}`, 10, 50);
    doc.text(`Data de Vencimento: ${selectedConta.dataVencimento}`, 10, 60);
    doc.text(`Loja: ${selectedConta.loja}`, 10, 70);
    if (selectedConta.observacoes) {
      doc.text(`Observações: ${selectedConta.observacoes}`, 10, 80);
    }
    doc.save(`Conta_${selectedConta.documento}.pdf`);
  };

  // Função para lidar com a impressão
  const handlePrint = () => {
    window.print();
  };

  // Função para quitar o pagamento
  const handleSettlePayment = async () => {
    if (!formaPagamento) {
      alert('Por favor, selecione a forma de pagamento.');
      return;
    }

    try {
      // Preparar descrição personalizada
      const descricao = `Pagamento da conta ${selectedConta.documento} via ${formaPagamento}`;

      // Preparar dados para o cashflow
      const cashflowData = {
        nome: selectedConta.credor,
        formaPagamento: formaPagamento,
        data: new Date(),
        valorFinal: -Math.abs(parseFloat(selectedConta.valor)), // Valor negativo
        descricao: descricao, // Adicionado o campo 'descricao' com a descrição personalizada
      };

      // Adicionar ao 'cashflow'
      await setDoc(doc(collection(firestore, 'cashflow')), cashflowData);

      // Preparar dados para o caixa do dia
      const loja = selectedConta.loja; // 'loja1' ou 'loja2'
      const dataAtual = new Date();
      const dataFormatada = dataAtual.toLocaleDateString('pt-BR').replace(/\//g, '-');

      const caixaRef = collection(
        firestore,
        `${loja}/finances/caixas/${dataFormatada}/transactions`
      );

      const caixaData = {
        nome: selectedConta.credor,
        valorFinal: -Math.abs(parseFloat(selectedConta.valor)), // Valor negativo
        data: dataAtual,
        descricao: descricao,
        type: 'despesa',
        formaPagamento: formaPagamento,
      };

      // Adicionar ao caixa do dia
      await setDoc(doc(caixaRef), caixaData);

      // Remover a conta da coleção 'a_pagar'
      const contaRef = doc(firestore, loja, 'finances', 'a_pagar', selectedConta.id);
      await deleteDoc(contaRef);

      // Atualizar o estado local para remover a conta quitada
      setContas((prevContas) => prevContas.filter((conta) => conta.id !== selectedConta.id));
      setFilteredContas((prevContas) => prevContas.filter((conta) => conta.id !== selectedConta.id));

      setSettleMessage('Pagamento quitado com sucesso!');
      setTimeout(() => {
        setSettleMessage('');
        closeModal();
      }, 2000);
    } catch (error) {
      console.error('Erro ao quitar pagamento:', error);
      alert('Erro ao quitar pagamento.');
    }
  };

  return (
    <Layout>
      <div className="min-h-screen p-2">
        <div className="w-full max-w-5xl mx-auto rounded-lg">
          <h2 className="text-3xl font-bold text-[#81059e] mb-6">PAGAMENTOS PENDENTES</h2>

          {/* Barra de busca e filtro de loja */}
          <div className="flex justify-between items-center mb-6 space-x-4">
            <input
              type="text"
              placeholder="Busque por código ou título"
              className="p-3 flex-grow border-2 border-[#81059e] rounded-lg text-black"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            {/* Filtro por loja */}
            <select
              value={selectedLoja}
              onChange={(e) => setSelectedLoja(e.target.value)}
              className="p-3 border-2 border-[#81059e] rounded-lg text-black"
            >
              <option value="Ambas">Ambas</option>
              <option value="loja1">Loja 1</option>
              <option value="loja2">Loja 2</option>
            </select>

            <Link href="/finance/add-pay">
              <button className="bg-[#81059e] text-white py-2 px-6 rounded-md">
                Adicionar
              </button>
            </Link>
          </div>

          {/* Tabela de contas */}
          {loading ? (
            <p>Carregando...</p>
          ) : error ? (
            <p>{error}</p>
          ) : (
            <div className="bg-white p-6 rounded-lg shadow-md">
              {filteredContas.length === 0 ? (
                <p>Nenhuma conta encontrada.</p>
              ) : (
                <table className="min-w-full table-auto">
                  <thead>
                    <tr className="bg-[#81059e] text-white">
                      <th className="px-4 py-2">Código</th>
                      <th className="px-4 py-2">Nome</th>
                      <th className="px-4 py-2">Valor</th>
                      <th className="px-4 py-2">Entrada</th>
                      <th className="px-4 py-2">Vencimento</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredContas.map((conta) => (
                      <tr
                        key={conta.id}
                        className="text-black text-center hover:bg-gray-100 cursor-pointer"
                        onClick={() => openModal(conta)}
                      >
                        <td className="border px-4 py-2">{conta.documento}</td>
                        <td className="border px-4 py-2">{conta.credor}</td>
                        <td className="border px-4 py-2">
                          R$ {parseFloat(conta.valor).toFixed(2)}
                        </td>
                        <td className="border px-4 py-2">{conta.dataEntrada}</td>
                        <td
                          className={`border px-4 py-2 ${getStatusColor(
                            conta.dataVencimento
                          )}`}
                        >
                          {conta.dataVencimento}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Modal para detalhes da conta */}
          {isModalOpen && selectedConta && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
              <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md relative text-black">
                <h3 className="text-xl font-bold text-[#81059e] mb-4">
                  Detalhes da Conta
                </h3>
                <p>
                  <strong>Código:</strong> {selectedConta.documento}
                </p>
                <p>
                  <strong>Credor:</strong> {selectedConta.credor}
                </p>
                <p>
                  <strong>Valor:</strong> R${' '}
                  {parseFloat(selectedConta.valor).toFixed(2)}
                </p>
                <p>
                  <strong>Data de Entrada:</strong> {selectedConta.dataEntrada}
                </p>
                <p>
                  <strong>Data de Vencimento:</strong>{' '}
                  {selectedConta.dataVencimento}
                </p>
                <p>
                  <strong>Loja:</strong> {selectedConta.loja}
                </p>
                {selectedConta.observacoes && (
                  <p>
                    <strong>Observações:</strong> {selectedConta.observacoes}
                  </p>
                )}

                {/* Seção para quitar o pagamento */}
                <div className="mt-6">
                  <label className="block text-[#81059e] mb-2">
                    Forma de Pagamento
                  </label>
                  <select
                    value={formaPagamento}
                    onChange={(e) => setFormaPagamento(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md text-black"
                  >
                    <option value="">Selecione</option>
                    <option value="Dinheiro">Dinheiro</option>
                    <option value="Cartão de Crédito">Cartão de Crédito</option>
                    <option value="Cartão de Débito">Cartão de Débito</option>
                    <option value="Pix">Pix</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Boleto">Boleto</option>
                    {/* Adicione outras formas de pagamento conforme necessário */}
                  </select>
                </div>

                {settleMessage && (
                  <p className="text-green-600 mt-4">{settleMessage}</p>
                )}

                <div className="flex justify-around mt-6">
                  <button
                    onClick={generatePDF}
                    className="bg-[#81059e] text-white px-4 py-2 rounded-md flex items-center"
                  >
                    <img
                      src="/images/pdf.png"
                      alt="PDF"
                      className="h-6 w-6 mr-2"
                    />
                    Ver PDF
                  </button>
                  <button
                    onClick={handlePrint}
                    className="bg-[#81059e] text-white px-4 py-2 rounded-md flex items-center"
                  >
                    <img
                      src="/images/print.png"
                      alt="Imprimir"
                      className="h-6 w-6 mr-2"
                    />
                    Imprimir
                  </button>
                </div>

                <div className="flex justify-center mt-4">
                  <button
                    onClick={handleSettlePayment}
                    className="bg-green-600 text-white px-4 py-2 rounded-md"
                  >
                    Quitar Pagamento
                  </button>
                </div>

                <button
                  onClick={closeModal}
                  className="absolute top-2 right-2 text-gray-600 hover:text-gray-800"
                >
                  &times;
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
