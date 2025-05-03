"use client";

import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { collection, getDocs, addDoc, getDoc, Timestamp, doc, setDoc } from 'firebase/firestore';
import { firestore } from '../../../lib/firebaseConfig';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import ConfirmationModal from '../../../components/ConfirmationModalPay.js';
import { FiCalendar, FiDollarSign, FiTag, FiFileText, FiUser, FiCreditCard, FiMapPin, FiLayers, FiTrendingUp, FiHome } from 'react-icons/fi';

export default function ContasPagar() {
  const { userPermissions, userData } = useAuth();
  const [selectedLoja, setSelectedLoja] = useState(null);

  // Estado do formulário com todos os campos necessários para contas a pagar
  const [formData, setFormData] = useState({
    credor: '',
    documentoCredor: '',
    documento: '',
    parcela: '',
    tipoCobranca: '',
    origem: '',
    valor: '',
    taxaJuros: '',
    dataEntrada: '',
    horaEntrada: '',
    dataVencimento: '',
    horaVencimento: '',
    localPagamento: '', // Local de pagamento
    categoriaDespesa: '',
    lancamentoNoCaixa: '', // Lançamento no caixa
    parcelaAtual: '1', // Parcela atual
    totalParcelas: '1', // Total de parcelas
    dispensarJuros: false,
    observacoes: ''
  });

  const [credores, setCredores] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [numeroParcelas, setNumeroParcelas] = useState('1');
  const [taxaJuros, setTaxaJuros] = useState('0,00');
  const [isLoading, setIsLoading] = useState(false);

  // Definir loja inicial baseado nas permissões
  useEffect(() => {
    if (userPermissions) {
      // Se não for admin, usa a primeira loja que tem acesso
      if (!userPermissions.isAdmin && userPermissions.lojas.length > 0) {
        setSelectedLoja(userPermissions.lojas[0]);
      }
      // Se for admin, usa a primeira loja da lista
      else if (userPermissions.isAdmin && userPermissions.lojas.length > 0) {
        setSelectedLoja(userPermissions.lojas[0]);
      }
    }
  }, [userPermissions]);

  const fetchCredores = async () => {
    // Permitir busca com termos mais curtos (2+ caracteres)
    if (!searchTerm.trim() || !selectedLoja) {
      setCredores([]);
      return;
    }

    setIsLoading(true);
    try {
      const allCredores = [];
      const searchTermLower = searchTerm.toLowerCase().trim();

      // 1. Buscar fornecedores em /lojas/fornecedores/users
      try {
        const fornecedoresRef = collection(firestore, 'lojas/fornecedores/users');
        const fornecedoresSnapshot = await getDocs(fornecedoresRef);

        fornecedoresSnapshot.docs.forEach(doc => {
          const data = doc.data();
          let matchScore = 0;
          let matchFound = false;

          // Verificar correspondência na Razão Social
          if (data.razaoSocial) {
            const razaoSocialLower = data.razaoSocial.toLowerCase();
            // Match exato (prioridade mais alta)
            if (razaoSocialLower === searchTermLower) {
              matchScore = 100;
              matchFound = true;
            }
            // Match no início (prioridade alta)
            else if (razaoSocialLower.startsWith(searchTermLower)) {
              matchScore = 80;
              matchFound = true;
            }
            // Match parcial (prioridade média)
            else if (razaoSocialLower.includes(searchTermLower)) {
              matchScore = 60;
              matchFound = true;
            }
            // Para termos curtos (menos de 3 caracteres), ser mais flexível
            else if (searchTermLower.length < 3 && razaoSocialLower.split(' ').some(word => word.startsWith(searchTermLower))) {
              matchScore = 40;
              matchFound = true;
            }
          }

          // Verificar correspondência no Nome Fantasia
          if (data.nomeFantasia) {
            const nomeFantasiaLower = data.nomeFantasia.toLowerCase();
            // Match exato
            if (nomeFantasiaLower === searchTermLower) {
              matchScore = Math.max(matchScore, 100);
              matchFound = true;
            }
            // Match no início
            else if (nomeFantasiaLower.startsWith(searchTermLower)) {
              matchScore = Math.max(matchScore, 80);
              matchFound = true;
            }
            // Match parcial
            else if (nomeFantasiaLower.includes(searchTermLower)) {
              matchScore = Math.max(matchScore, 60);
              matchFound = true;
            }
            // Para termos curtos (menos de 3 caracteres), ser mais flexível
            else if (searchTermLower.length < 3 && nomeFantasiaLower.split(' ').some(word => word.startsWith(searchTermLower))) {
              matchScore = Math.max(matchScore, 40);
              matchFound = true;
            }
          }

          // Verificar correspondência no CNPJ (apenas se o termo de busca parece ser um número)
          if (data.cnpj && /^\d+$/.test(searchTerm.replace(/\D/g, ''))) {
            const cnpjNumbers = data.cnpj.replace(/\D/g, '');
            const searchNumbers = searchTerm.replace(/\D/g, '');

            if (cnpjNumbers.includes(searchNumbers)) {
              matchScore = Math.max(matchScore, 70);
              matchFound = true;
            }
          }

          if (matchFound) {
            allCredores.push({
              id: doc.id,
              nome: data.razaoSocial || data.nomeFantasia || 'Fornecedor sem nome',
              cnpj: data.cnpj,
              tipo: 'fornecedor',
              email: data.email,
              telefone: data.telefone,
              matchScore // Adicionamos o score para ordenação posterior
            });
          }
        });
      } catch (error) {
        console.error("Erro ao buscar fornecedores:", error);
      }

      // 2. Buscar funcionários da loja 1 em /lojas/loja1/users
      try {
        const funcionariosLoja1Ref = collection(firestore, 'lojas/loja1/users');
        const funcionariosLoja1Snapshot = await getDocs(funcionariosLoja1Ref);

        funcionariosLoja1Snapshot.docs.forEach(doc => {
          const data = doc.data();
          let matchScore = 0;
          let matchFound = false;

          // Verificar correspondência no Nome
          if (data.nome) {
            const nomeLower = data.nome.toLowerCase();
            // Match exato
            if (nomeLower === searchTermLower) {
              matchScore = 100;
              matchFound = true;
            }
            // Match no início
            else if (nomeLower.startsWith(searchTermLower)) {
              matchScore = 80;
              matchFound = true;
            }
            // Match parcial
            else if (nomeLower.includes(searchTermLower)) {
              matchScore = 60;
              matchFound = true;
            }
            // Para termos curtos (menos de 3 caracteres), ser mais flexível
            else if (searchTermLower.length < 3 && nomeLower.split(' ').some(word => word.startsWith(searchTermLower))) {
              matchScore = 40;
              matchFound = true;
            }
          }

          // Verificar correspondência no CPF (apenas se o termo de busca parece ser um número)
          if (data.cpf && /^\d+$/.test(searchTerm.replace(/\D/g, ''))) {
            const cpfNumbers = data.cpf.replace(/\D/g, '');
            const searchNumbers = searchTerm.replace(/\D/g, '');

            if (cpfNumbers.includes(searchNumbers)) {
              matchScore = Math.max(matchScore, 70);
              matchFound = true;
            }
          }

          if (matchFound) {
            allCredores.push({
              id: doc.id,
              nome: data.nome || 'Funcionário sem nome',
              cpf: data.cpf,
              tipo: 'funcionario',
              loja: 'loja1',
              email: data.email,
              telefone: data.telefone,
              matchScore
            });
          }
        });
      } catch (error) {
        console.error("Erro ao buscar funcionários da loja 1:", error);
      }

      // 3. Buscar funcionários da loja 2 em /lojas/loja2/users
      try {
        const funcionariosLoja2Ref = collection(firestore, 'lojas/loja2/users');
        const funcionariosLoja2Snapshot = await getDocs(funcionariosLoja2Ref);

        funcionariosLoja2Snapshot.docs.forEach(doc => {
          const data = doc.data();
          let matchScore = 0;
          let matchFound = false;

          // Verificar correspondência no Nome
          if (data.nome) {
            const nomeLower = data.nome.toLowerCase();
            // Match exato
            if (nomeLower === searchTermLower) {
              matchScore = 100;
              matchFound = true;
            }
            // Match no início
            else if (nomeLower.startsWith(searchTermLower)) {
              matchScore = 80;
              matchFound = true;
            }
            // Match parcial
            else if (nomeLower.includes(searchTermLower)) {
              matchScore = 60;
              matchFound = true;
            }
            // Para termos curtos (menos de 3 caracteres), ser mais flexível
            else if (searchTermLower.length < 3 && nomeLower.split(' ').some(word => word.startsWith(searchTermLower))) {
              matchScore = 40;
              matchFound = true;
            }
          }

          // Verificar correspondência no CPF (apenas se o termo de busca parece ser um número)
          if (data.cpf && /^\d+$/.test(searchTerm.replace(/\D/g, ''))) {
            const cpfNumbers = data.cpf.replace(/\D/g, '');
            const searchNumbers = searchTerm.replace(/\D/g, '');

            if (cpfNumbers.includes(searchNumbers)) {
              matchScore = Math.max(matchScore, 70);
              matchFound = true;
            }
          }

          if (matchFound) {
            allCredores.push({
              id: doc.id,
              nome: data.nome || 'Funcionário sem nome',
              cpf: data.cpf,
              tipo: 'funcionario',
              loja: 'loja2',
              email: data.email,
              telefone: data.telefone,
              matchScore
            });
          }
        });
      } catch (error) {
        console.error("Erro ao buscar funcionários da loja 2:", error);
      }

      // Ordenar os resultados pelo score de relevância (do maior para o menor)
      allCredores.sort((a, b) => b.matchScore - a.matchScore);

      // Define os credores encontrados
      setCredores(allCredores);

    } catch (error) {
      console.error("Erro geral ao buscar credores:", error);
      setCredores([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCredores();
  }, [searchTerm, selectedLoja]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleValorChange = (e) => {
    const valor = e.target.value.replace(/\D/g, '');
    setFormData(prev => ({ ...prev, valor: (Number(valor) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }));
  };

  const handleCredorSelect = (credor) => {
    setFormData(prev => ({
      ...prev,
      credor: credor.nome,
      documentoCredor: credor.cnpj || credor.cpf, // Aceita CNPJ ou CPF
      tipoCredor: credor.tipo // Armazena se é 'fornecedor' ou 'funcionario'
    }));
    setSearchTerm(credor.nome);
    setCredores([]); // Limpa a lista de credores após seleção
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsModalOpen(true);
  };

  const handleDocumentoChange = (e) => {
    // Remove qualquer caractere que não seja número
    const numeroApenas = e.target.value.replace(/\D/g, '');

    setFormData(prev => ({ ...prev, documento: numeroApenas }));
  };

  // Modificar a função handleClear para incluir os novos campos
  // Na função handleClear
  const handleClear = () => {
    setFormData({
      credor: '',
      documentoCredor: '',
      documento: '',
      parcela: '',
      tipoCobranca: '',
      origem: '',
      valor: '',
      taxaJuros: '',
      dataEntrada: '',
      horaEntrada: '',
      dataVencimento: '',
      horaVencimento: '',
      localPagamento: '',
      categoriaDespesa: '',
      contaBancaria: '',
      lancamentoNoCaixa: '',
      parcelaAtual: '1',
      totalParcelas: '1',
      dispensarJuros: false,
      observacoes: ''
    });
    setSearchTerm('');
    setCredores([]);
    setNumeroParcelas('1');
    setTaxaJuros('0,00');
  };

  // Adicionando ao handleConfirm para salvar os novos campos
  const handleConfirm = async () => {
    if (!selectedLoja) {
      alert("Selecione uma loja primeiro!");
      return;
    }

    setIsLoading(true);

    try {
      // Converter valor de string formatada para number 
      const valorNumerico = parseFloat(
        formData.valor
          .replace(/[^\d,]/g, '') // Remove tudo exceto dígitos e vírgula 
          .replace(',', '.') // Substitui vírgula por ponto 
      );

      // Converter taxa de juros para número 
      const taxaJurosNumerica = formData.taxaJuros ? parseFloat(formData.taxaJuros) : 0;

      // Formatar parcelas no formato X/Y
      const formatoParcela = formData.parcelaAtual && formData.totalParcelas ?
        `${formData.parcelaAtual.padStart(2, '0')}/${formData.totalParcelas.padStart(2, '0')}` : '';

      // Preparar os dados para salvar 
      const contaData = {
        credor: formData.credor,
        cpfCredor: formData.documentoCredor,
        tipoCredor: formData.tipoCredor || 'outro', // 'fornecedor', 'funcionario' ou 'outro'
        documento: formData.documento || '',
        parcela: formatoParcela,
        tipoCobranca: formData.tipoCobranca || '',
        origem: formData.origem || '',
        valor: valorNumerico,
        taxaJuros: taxaJurosNumerica,
        dataEntrada: formData.dataEntrada
          ? Timestamp.fromDate(formData.dataEntrada)
          : null,
        dataVencimento: formData.dataVencimento
          ? Timestamp.fromDate(formData.dataVencimento)
          : null,
        localPagamento: formData.localPagamento || '',
        categoriaDespesa: formData.categoriaDespesa || '',
        contaBancaria: formData.contaBancaria || '',
        lancamentoNoCaixa: formData.lancamentoNoCaixa || '',
        dispensarJuros: formData.dispensarJuros || false,
        observacoes: formData.observacoes || '',
        status: 'pendente',
        registradoPor: userData?.nome || 'Sistema',
        loja: selectedLoja,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        dataPagamento: null
      };

      // Primeiro, garantimos que o documento contas_pagar existe
      const contasPagarDocRef = doc(firestore, `lojas/${selectedLoja}/financeiro`, 'contas_pagar');

      // Verificar se o documento existe, se não, criá-lo
      const docSnap = await getDoc(contasPagarDocRef);
      if (!docSnap.exists()) {
        await setDoc(contasPagarDocRef, {
          descricao: "Contas a pagar",
          createdAt: Timestamp.now()
        });
      }

      // Agora criamos a conta na subcoleção "items" do documento contas_pagar
      const itemsCollectionRef = collection(contasPagarDocRef, 'items');
      await addDoc(itemsCollectionRef, contaData);

      alert("Conta a pagar registrada com sucesso!");
      handleClear();
      setIsModalOpen(false);
    } catch (error) {
      console.error("Erro ao registrar conta a pagar:", error);
      alert("Erro ao registrar a conta. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const renderLojaName = (lojaId) => {
    const lojaNames = {
      'loja1': 'Loja 1 - Centro',
      'loja2': 'Loja 2 - Caramuru'
    };

    return lojaNames[lojaId] || lojaId;
  };

  const atualizarParcelas = (parcelaAtual, totalParcelas) => {
    setFormData(prev => ({
      ...prev,
      parcelaAtual: parcelaAtual || '1',
      totalParcelas: totalParcelas
    }));
  };

  return (
    <Layout>
      <div className="min-h-screen">
        <div className="w-full max-w-5xl mx-auto rounded-lg">
          <h2 className="text-3xl font-bold text-[#81059e] mb-8 mt-8">CONTAS A PAGAR</h2>

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
            <Link href={`/finance/add-pay/list-bills`}>
              <button className="bg-[#81059e] p-3 rounded-sm text-white">PAGAMENTOS PENDENTES
              </button>
            </Link>
            <button
              onClick={handleClear}
              className="text-[#81059e] px-4 py-2 border-2 border-[#81059e] font-bold text-base rounded-sm"
            >
              Limpar
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 mb-20">
            {/* Seção Credor */}
            <div className="p-4 bg-gray-50 rounded-lg mb-6 h-64">
              <h3 className="text-lg font-semibold text-[#81059e] mb-4 flex items-center gap-2">
                <FiUser /> Informações do Credor
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Componente de busca de credores */}
                <div>
                  <label className="text-[#81059e] font-medium">Nome do Credor</label>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setFormData(prev => ({ ...prev, credor: e.target.value }));
                    }}
                    placeholder="Digite o nome do credor"
                    className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black"
                    required
                  />
                  {searchTerm && (
                    <>
                      {isLoading ? (
                        <div className="mt-2 p-3 text-sm text-gray-600">
                          <span className="inline-block animate-pulse">Buscando credores...</span>
                        </div>
                      ) : (
                        <>
                          {credores.length > 0 ? (
                            <ul className="bg-white border-2 border-[#81059e] rounded-lg w-full max-h-[104px] overflow-y-auto shadow-lg custom-scroll">
                              {credores.map((credor) => (
                                <li
                                  key={credor.id}
                                  onClick={() => handleCredorSelect(credor)}
                                  className="p-2 hover:bg-purple-50 cursor-pointer text-black border-b last:border-b-0"
                                >
                                  {credor.nome} {" "}
                                  {credor.tipo === 'fornecedor' ? (
                                    <span className="text-xs text-gray-500">(Fornecedor - CNPJ: {credor.cnpj})</span>
                                  ) : (
                                    <span className="text-xs text-gray-500">
                                      (Funcionário {credor.loja === 'loja1' ? 'Loja 1' : 'Loja 2'} - CPF: {credor.cpf})
                                    </span>
                                  )}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            searchTerm && credores.length === 0 && !formData.documentoCredor && (
                              <div className="mt-2 p-3 text-sm text-red-500  rounded border border-red-100">
                                Não encontrado. Tente outro termo de busca.
                              </div>
                            )
                          )}
                        </>
                      )}
                    </>
                  )}
                </div>
                <div>
                  <label className="text-[#81059e] font-medium">CPF ou CNPJ do Credor</label>
                  <input
                    type="text"
                    value={formData.documentoCredor}
                    readOnly
                    className="border-2 border-[#81059e] p-3 rounded-lg w-full bg-gray-100 text-black"
                  />
                </div>
              </div>
            </div>

            {/* Seção Documento */}
            <div className="p-4 bg-gray-50 rounded-lg mb-6">
              <h3 className="text-lg font-semibold text-[#81059e] mb-4 flex items-center gap-2">
                <FiFileText /> Informações do Documento
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="text-[#81059e] font-medium">Nº do Documento</label>
                  <input
                    type="text"
                    name="documento"
                    value={formData.documento}
                    onChange={handleDocumentoChange}
                    className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black"
                  />
                </div>
                <div>
                  <label className="text-[#81059e] font-medium">Origem</label>
                  <input
                    type="text"
                    name="origem"
                    value={formData.origem}
                    onChange={handleInputChange}
                    className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black"
                  />
                </div>
                <div>
                  <label className="text-[#81059e] font-medium">Forma de Pagamento</label>
                  <select
                    name="tipoCobranca"
                    value={formData.tipoCobranca}
                    onChange={handleInputChange}
                    className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black"
                  >
                    <option value="">Selecione</option>
                    <option value="boleto">Boleto</option>
                    <option value="cartao">Cartão de Débito/Crédito</option>
                    <option value="dinheiro">Dinheiro</option>
                    <option value="TED">TEV</option>
                    <option value="pix">PIX</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Seção Pagamento */}
            <div className="p-4 bg-gray-50 rounded-lg mb-6">
              <h3 className="text-lg font-semibold text-[#81059e] mb-4 flex items-center gap-2">
                <FiDollarSign /> Informações de Pagamento
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                <div>
                  <label className="text-[#81059e] font-medium">Valor</label>
                  <input
                    type="text"
                    name="valor"
                    value={formData.valor}
                    onChange={handleValorChange}
                    placeholder="R$ 0,00"
                    className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black"
                    required
                  />
                </div>

                <div>
                  <label className="text-[#81059e] font-medium">
                    Número de Parcelas
                  </label>
                  <select
                    value={numeroParcelas}
                    onChange={(e) => {
                      setNumeroParcelas(e.target.value);
                      atualizarParcelas('1', e.target.value);  // Aqui estamos definindo a parcela atual como '1'
                    }}
                    className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black"
                  >
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5">5</option>
                    <option value="6">6</option>
                    <option value="7">7</option>
                    <option value="8">8</option>
                    <option value="9">9</option>
                    <option value="10">10</option>
                    <option value="11">11</option>
                    <option value="12">12</option>
                    <option value="18">18</option>
                    <option value="24">24</option>
                    <option value="Indefinido">Indefinido</option>

                  </select>
                </div>

                <div>
                  <label className="text-[#81059e] font-medium">Data de Emissão</label>
                  <input
                    type="date"
                    name="dataEntrada"
                    value={formData.dataEntrada instanceof Date && !isNaN(formData.dataEntrada)
                      ? formData.dataEntrada.toISOString().split('T')[0]
                      : ''}
                    onChange={(e) => {
                      const selectedDate = e.target.value ? new Date(e.target.value) : null;
                      setFormData((prev) => ({
                        ...prev,
                        dataEntrada: selectedDate,
                      }));
                    }}
                    className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black"
                  />
                </div>
                <div>
                  <label className="text-[#81059e] font-medium">Data de Vencimento</label>
                  <input
                    type="date"
                    name="dataVencimento"
                    value={formData.dataVencimento instanceof Date && !isNaN(formData.dataVencimento)
                      ? formData.dataVencimento.toISOString().split('T')[0]
                      : ''}
                    onChange={(e) => {
                      const selectedDate = e.target.value ? new Date(e.target.value) : null;
                      setFormData((prev) => ({
                        ...prev,
                        dataVencimento: selectedDate,
                      }));
                    }}
                    className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black"
                  />
                </div>
                <div>
                  <label className="text-[#81059e] font-medium">Local de Pagamento</label>
                  <input
                    type="text"
                    name="localPagamento"
                    value={formData.localPagamento}
                    onChange={handleInputChange}
                    className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black"
                  />
                </div>
              </div>
            </div>

            {/* Seção Contabilidade */}
            <div className="p-4 bg-gray-50 rounded-lg mb-6">
              <h3 className="text-lg font-semibold text-[#81059e] mb-4 flex items-center gap-2">
                <FiTrendingUp /> Informações Contábeis
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-[#81059e] font-medium">Lançamento no Caixa</label>
                  <select
                    name="lancamentoNoCaixa"
                    value={formData.lancamentoNoCaixa}
                    onChange={handleInputChange}
                    className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black"
                  >
                    <option value="ENTRADA">CAIXA DA LOJA 1</option>
                    <option value="SAÍDA">BOLETO FÁCIL</option>
                    <option value="TRANSFERÊNCIA">BANCO CAIXA ECONÔMICA</option>
                  </select>
                </div>

                <div>
                  <label className="text-[#81059e] font-medium">Categoria da Despesa</label>
                  <select
                    name="categoriaDespesa"
                    value={formData.categoriaDespesa}
                    onChange={handleInputChange}
                    className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black"
                  >
                    <option value="">Selecione</option>
                    <option value="PUBLICIDADE/PROPAGANDA">PUBLICIDADE/PROPAGANDA</option>
                    <option value="ALUGUEL">ALUGUEL</option>
                    <option value="FORNECEDORES">FORNECEDORES</option>
                    <option value="SALÁRIOS">SALÁRIOS</option>
                    <option value="IMPOSTOS">IMPOSTOS</option>
                    <option value="MANUTENÇÃO">MANUTENÇÃO</option>
                    <option value="MANUTENÇÃO">TELEFONIA</option>

                    <option value="OUTROS">OUTROS</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Seção Observações */}
            <div className="p-4 bg-gray-50 rounded-lg mb-6">
              <h3 className="text-lg font-semibold text-[#81059e] mb-4 flex items-center gap-2">
                <FiFileText /> Observações
              </h3>
              <div>
                <textarea
                  name="observacoes"
                  value={formData.observacoes}
                  onChange={handleInputChange}
                  className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black min-h-[120px]"
                  placeholder="Adicione observações relevantes..."
                ></textarea>
              </div>
            </div>

            {/* Botões de ação */}
            <div className="flex justify-center gap-4 mt-8">
              <button
                type="button"
                onClick={handleClear}
                className="inline-flex justify-center py-3 px-4 border-2 border-[#81059e] shadow-sm text-sm font-medium rounded-sm text-[#81059e] bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#81059e]"
                disabled={isLoading}
              >
                CANCELAR
              </button>
              <button
                type="submit"
                className="bg-[#81059e] p-3 px-6 rounded-sm text-white flex items-center gap-2"
                disabled={isLoading}
              >
                {isLoading ? 'PROCESSANDO...' : 'SALVAR'}
              </button>

            </div>
          </form>
        </div>
      </div>

      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        data={{ ...formData, loja: selectedLoja }}
        onConfirm={handleConfirm}
      />
    </Layout>
  );
}