"use client";

import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import Link from 'next/link';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
import { firestore } from '../../../../lib/firebaseConfig';
import jsPDF from 'jspdf';

export default function ListaContas() {
  const { userPermissions } = useAuth();
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
        const fetchedContas = [];

        // Usar o caminho correto para lojas específicas
        if (selectedLoja !== 'Ambas') {
          // Caminho para uma loja específica
          const contasPagarDocRef = collection(firestore, `lojas/${selectedLoja}/financeiro/contas_pagar/items`);
          const contasSnapshot = await getDocs(contasPagarDocRef);

          contasSnapshot.docs.forEach((docItem) => {
            const contaData = docItem.data();
            fetchedContas.push({
              id: docItem.id,
              ...contaData,
              loja: selectedLoja // Garantir que a loja seja definida corretamente
            });
          });
        } else {
          // Se for "Ambas", buscar de todas as lojas que o usuário tem acesso
          const lojas = userPermissions?.lojas || [];

          for (const loja of lojas) {
            const contasPagarDocRef = collection(firestore, `lojas/${loja}/financeiro/contas_pagar/items`);
            const contasSnapshot = await getDocs(contasPagarDocRef);

            contasSnapshot.docs.forEach((docItem) => {
              const contaData = docItem.data();
              fetchedContas.push({
                id: docItem.id,
                ...contaData,
                loja: loja
              });
            });
          }
        }

        setContas(fetchedContas);
        setFilteredContas(fetchedContas);
        setLoading(false);
      } catch (err) {
        console.error('Erro ao carregar as contas:', err);
        setError(`Erro ao carregar os dados das contas: ${err.message}`);
        setLoading(false);
      }
    };

    fetchContas();
  }, [selectedLoja, userPermissions]);

  // Função para filtrar contas com base na busca e loja
  useEffect(() => {
    const filterBySearchAndLoja = () => {
      let filtered = contas;

      // Filtro por loja
      if (selectedLoja !== 'Ambas') {
        filtered = filtered.filter((conta) => conta.loja === selectedLoja);
      }

      // Adicione esta função auxiliar para formatar datas do Firestore


      // Filtro por busca
      if (searchQuery !== '') {
        filtered = filtered.filter(
          (conta) =>
            (conta.documento?.toLowerCase().includes(searchQuery.toLowerCase()) || '') ||
            (conta.credor?.toLowerCase().includes(searchQuery.toLowerCase()) || '')
        );
      }

      setFilteredContas(filtered);
    };

    filterBySearchAndLoja();
  }, [searchQuery, selectedLoja, contas]);

  const getStatusColor = (vencimento) => {
    if (!vencimento) return 'bg-gray-200 text-gray-800';

    const now = new Date();
    // Se for um timestamp do Firestore
    const dueDate = vencimento.seconds ?
      new Date(vencimento.seconds * 1000) :
      new Date(vencimento);

    if (dueDate < now) return 'bg-red-200 text-red-800'; // Vencido
    if (dueDate - now <= 7 * 24 * 60 * 60 * 1000) return 'bg-yellow-200 text-yellow-800';
    return 'bg-green-200 text-green-800'; // Longe de vencer
    
  };

  // Adicione esta função no escopo principal do componente, antes do return
const formatFirestoreDate = (firestoreDate) => {
  if (!firestoreDate) return 'N/A';
  
  // Se for um timestamp do Firestore (com seconds e nanoseconds)
  if (firestoreDate && typeof firestoreDate === 'object' && firestoreDate.seconds) {
    const date = new Date(firestoreDate.seconds * 1000);
    return date.toLocaleDateString('pt-BR');
  }
  
  // Se já for uma string de data, retorne como está
  return firestoreDate;
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

    // Adicione esta função auxiliar para formatar datas do Firestore
    const formatFirestoreDate = (firestoreDate) => {
      if (!firestoreDate) return 'N/A';

      // Se for um timestamp do Firestore (com seconds e nanoseconds)
      if (firestoreDate.seconds) {
        const date = new Date(firestoreDate.seconds * 1000);
        return date.toLocaleDateString('pt-BR');
      }

      // Se já for uma string de data, retorne como está
      return firestoreDate;
    };

    const doc = new jsPDF();
    doc.text(`Detalhes da Conta`, 10, 10);
    doc.text(`Código: ${selectedConta.documento || 'N/A'}`, 10, 20);
    doc.text(`Credor: ${selectedConta.credor || 'N/A'}`, 10, 30);
    doc.text(`Valor: R$ ${parseFloat(selectedConta.valor || 0).toFixed(2)}`, 10, 40);
    doc.text(`Data de Entrada: ${selectedConta.dataEntrada || 'N/A'}`, 10, 50);
    doc.text(`Data de Vencimento: ${selectedConta.dataVencimento || 'N/A'}`, 10, 60);
    doc.text(`Loja: ${selectedConta.loja || 'N/A'}`, 10, 70);
    if (selectedConta.observacoes) {
      doc.text(`Observações: ${selectedConta.observacoes}`, 10, 80);
    }
    doc.save(`Conta_${selectedConta.documento || selectedConta.id}.pdf`);
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
      const descricao = `Pagamento da conta ${selectedConta.documento || selectedConta.id} via ${formaPagamento}`;

      // Preparar dados para o cashflow
      const cashflowData = {
        nome: selectedConta.credor || 'Credor não especificado',
        formaPagamento: formaPagamento,
        data: new Date(),
        valorFinal: -Math.abs(parseFloat(selectedConta.valor || 0)), // Valor negativo
        descricao: descricao,
      };

      // Adicionar ao 'cashflow'
      await setDoc(doc(collection(firestore, 'cashflow')), cashflowData);

      // Preparar dados para o caixa do dia
      const loja = selectedConta.loja || 'loja1'; // Padrão para 'loja1' se não especificada
      const dataAtual = new Date();
      const dataFormatada = dataAtual.toLocaleDateString('pt-BR').replace(/\//g, '-');

      const caixaRef = collection(
        firestore,
        `${loja}/finances/caixas/${dataFormatada}/transactions`
      );

      const caixaData = {
        nome: selectedConta.credor || 'Credor não especificado',
        valorFinal: -Math.abs(parseFloat(selectedConta.valor || 0)), // Valor negativo
        data: dataAtual,
        descricao: descricao,
        type: 'despesa',
        formaPagamento: formaPagamento,
      };

      // Adicionar ao caixa do dia
      await setDoc(doc(caixaRef), caixaData);

      // Remover a conta da coleção 'contas_pagar/items'
      const contaRef = doc(firestore, 'contas_pagar/items', selectedConta.id);
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
              {userPermissions?.isAdmin && <option value="Ambas">Ambas</option>}
              {userPermissions?.lojas?.includes('loja1') && <option value="loja1">Loja 1</option>}
              {userPermissions?.lojas?.includes('loja2') && <option value="loja2">Loja 2</option>}
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
            <div className="w-full">
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
                        className="text-black text-left hover:bg-gray-100 cursor-pointer"
                        onClick={() => openModal(conta)}
                      >
                        <td className="border px-4 py-2">{conta.documento || 'N/A'}</td>
                        <td className="border px-4 py-2">{conta.credor || 'N/A'}</td>
                        <td className="border px-4 py-2">
                          R$ {parseFloat(conta.valor || 0).toFixed(2)}
                        </td>
                        <td className="border px-4 py-2">{formatFirestoreDate(conta.dataEntrada)}</td>
                        <td className={`border px-4 py-2 ${getStatusColor(conta.dataVencimento)}`}>
                          {formatFirestoreDate(conta.dataVencimento)}
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
                  <strong>Código:</strong> {selectedConta.documento || 'N/A'}
                </p>
                <p>
                  <strong>Credor:</strong> {selectedConta.credor || 'N/A'}
                </p>
                <p>
                  <strong>Valor:</strong> R${' '}
                  {parseFloat(selectedConta.valor || 0).toFixed(2)}
                </p>
                <p>
                  <strong>Data de Entrada:</strong> {formatFirestoreDate(selectedConta.dataEntrada)}
                </p>
                <p>
                  <strong>Data de Vencimento:</strong>{' '}
                  {formatFirestoreDate(selectedConta.dataVencimento)}
                </p>
                <p>
                  <strong>Loja:</strong> {selectedConta.loja || 'Não especificada'}
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