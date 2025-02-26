"use client";

import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import Link from 'next/link';
import { collection, getDocs, doc, setDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
import { firestore } from '../../../../lib/firebaseConfig';
import jsPDF from 'jspdf';

export default function ListaRecebimentos() {
  const { userPermissions, userData } = useAuth();
  const [contas, setContas] = useState([]);
  const [filteredContas, setFilteredContas] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLoja, setSelectedLoja] = useState('Ambas');
  const [selectedConta, setSelectedConta] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estados para a forma de recebimento e mensagem de sucesso
  const [formaRecebimento, setFormaRecebimento] = useState('');
  const [settleMessage, setSettleMessage] = useState('');

  useEffect(() => {
    const fetchContas = async () => {
      try {
        setLoading(true);
        const fetchedContas = [];

        // Usar o caminho correto para lojas específicas
        if (selectedLoja !== 'Ambas') {
          // Caminho para uma loja específica
          const contasReceberDocRef = collection(firestore, `lojas/${selectedLoja}/financeiro/contas_receber/items`);
          const contasSnapshot = await getDocs(contasReceberDocRef);

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
            const contasReceberDocRef = collection(firestore, `lojas/${loja}/financeiro/contas_receber/items`);
            const contasSnapshot = await getDocs(contasReceberDocRef);

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

      // Filtro por busca
      if (searchQuery !== '') {
        filtered = filtered.filter(
          (conta) =>
            (conta.numeroDocumento?.toLowerCase().includes(searchQuery.toLowerCase()) || '') ||
            (conta.cliente?.toLowerCase().includes(searchQuery.toLowerCase()) || '')
        );
      }

      setFilteredContas(filtered);
    };

    filterBySearchAndLoja();
  }, [searchQuery, selectedLoja, contas]);

  const getStatusColor = (dataCobranca) => {
    if (!dataCobranca) return 'bg-gray-200 text-gray-800';

    const now = new Date();
    // Se for um timestamp do Firestore
    const dueDate = dataCobranca.seconds ?
      new Date(dataCobranca.seconds * 1000) :
      new Date(dataCobranca);

    if (dueDate < now) return 'bg-red-200 text-red-800'; // Vencido
    if (dueDate - now <= 7 * 24 * 60 * 60 * 1000) return 'bg-yellow-200 text-yellow-800'; // Próximo
    return 'bg-green-200 text-green-800'; // Longe de vencer
  };

  // Formata data do Firebase
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
    setFormaRecebimento('');
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
    doc.text(`Detalhes da Conta a Receber`, 10, 10);
    doc.text(`Código: ${selectedConta.numeroDocumento || 'N/A'}`, 10, 20);
    doc.text(`Cliente: ${selectedConta.cliente || 'N/A'}`, 10, 30);
    doc.text(`Valor: R$ ${parseFloat(selectedConta.valor || 0).toFixed(2)}`, 10, 40);
    doc.text(`Data de Registro: ${formatFirestoreDate(selectedConta.dataRegistro)}`, 10, 50);
    doc.text(`Data de Cobrança: ${formatFirestoreDate(selectedConta.dataCobranca)}`, 10, 60);
    doc.text(`Loja: ${selectedConta.loja || 'N/A'}`, 10, 70);
    if (selectedConta.observacoes) {
      doc.text(`Observações: ${selectedConta.observacoes}`, 10, 80);
    }
    doc.save(`Conta_${selectedConta.numeroDocumento || selectedConta.id}.pdf`);
  };

  // Função para lidar com a impressão
  const handlePrint = () => {
    window.print();
  };

  // Função para quitar o recebimento
  const handleSettlePayment = async () => {
    if (!formaRecebimento) {
      alert('Por favor, selecione a forma de recebimento.');
      return;
    }

    try {
      // Preparar descrição personalizada
      const descricao = `Recebimento da conta ${selectedConta.numeroDocumento || selectedConta.id} via ${formaRecebimento}`;

      // Preparar dados para o cashflow
      const cashflowData = {
        nome: selectedConta.cliente || 'Cliente não especificado',
        formaPagamento: formaRecebimento,
        data: new Date(),
        valorFinal: parseFloat(selectedConta.valor || 0), // Valor positivo (receita)
        descricao: descricao,
        type: 'receita'
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
        nome: selectedConta.cliente || 'Cliente não especificado',
        valorFinal: parseFloat(selectedConta.valor || 0), // Valor positivo (receita)
        data: dataAtual,
        descricao: descricao,
        type: 'receita',
        formaPagamento: formaRecebimento,
      };

      // Adicionar ao caixa do dia
      await setDoc(doc(caixaRef), caixaData);

      // Remover a conta da coleção 'contas_receber/items'
      const contaRef = doc(firestore, `lojas/${selectedConta.loja}/financeiro/contas_receber/items`, selectedConta.id);
      await deleteDoc(contaRef);

      // Atualizar o estado local para remover a conta quitada
      setContas((prevContas) => prevContas.filter((conta) => conta.id !== selectedConta.id));
      setFilteredContas((prevContas) => prevContas.filter((conta) => conta.id !== selectedConta.id));

      setSettleMessage('Recebimento registrado com sucesso!');
      setTimeout(() => {
        setSettleMessage('');
        closeModal();
      }, 2000);
    } catch (error) {
      console.error('Erro ao registrar recebimento:', error);
      alert('Erro ao registrar recebimento.');
    }
  };

  return (
    <Layout>
      <div className="min-h-screen p-2">
        <div className="w-full max-w-5xl mx-auto rounded-lg">
          <h2 className="text-3xl font-bold text-[#81059e] mb-6">RECEBIMENTOS PENDENTES</h2>

          {/* Barra de busca e filtro de loja */}
          <div className="flex justify-between items-center mb-6 space-x-4">
            <input
              type="text"
              placeholder="Busque por código ou cliente"
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

            <Link href="/finance/add-receive">
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
                      <th className="px-4 py-2">Cliente</th>
                      <th className="px-4 py-2">Valor</th>
                      <th className="px-4 py-2">Registro</th>
                      <th className="px-4 py-2">Cobrança</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredContas.map((conta) => (
                      <tr
                        key={conta.id}
                        className="text-black text-left hover:bg-gray-100 cursor-pointer"
                        onClick={() => openModal(conta)}
                      >
                        <td className="border px-4 py-2">{conta.numeroDocumento || 'N/A'}</td>
                        <td className="border px-4 py-2">{conta.cliente || 'N/A'}</td>
                        <td className="border px-4 py-2">
                          R$ {parseFloat(conta.valor || 0).toFixed(2)}
                        </td>
                        <td className="border px-4 py-2">{formatFirestoreDate(conta.dataRegistro)}</td>
                        <td className={`border px-4 py-2 ${getStatusColor(conta.dataCobranca)}`}>
                          {formatFirestoreDate(conta.dataCobranca)}
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
                  Detalhes da Conta a Receber
                </h3>
                <p>
                  <strong>Código:</strong> {selectedConta.numeroDocumento || 'N/A'}
                </p>
                <p>
                  <strong>Cliente:</strong> {selectedConta.cliente || 'N/A'}
                </p>
                <p>
                  <strong>Valor:</strong> R${' '}
                  {parseFloat(selectedConta.valor || 0).toFixed(2)}
                </p>
                <p>
                  <strong>Data de Registro:</strong> {formatFirestoreDate(selectedConta.dataRegistro)}
                </p>
                <p>
                  <strong>Data de Cobrança:</strong>{' '}
                  {formatFirestoreDate(selectedConta.dataCobranca)}
                </p>
                <p>
                  <strong>Loja:</strong> {selectedConta.loja || 'Não especificada'}
                </p>
                {selectedConta.observacoes && (
                  <p>
                    <strong>Observações:</strong> {selectedConta.observacoes}
                  </p>
                )}

                {/* Seção para registrar o recebimento */}
                <div className="mt-6">
                  <label className="block text-[#81059e] mb-2">
                    Forma de Recebimento
                  </label>
                  <select
                    value={formaRecebimento}
                    onChange={(e) => setFormaRecebimento(e.target.value)}
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
                    Registrar Recebimento
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