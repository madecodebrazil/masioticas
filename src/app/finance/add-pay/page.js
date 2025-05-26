"use client";

import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { collection, getDocs, addDoc, getDoc, Timestamp, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { firestore } from '../../../lib/firebaseConfig';
import { useAuth } from '@/hooks/useAuth';
import BackButton from '@/components/BackButton';
import Link from 'next/link';
import ConfirmationModal from '../../../components/ConfirmationModalPay.js';
import { FiCalendar, FiDollarSign, FiTag, FiFileText, FiUser, FiCreditCard, FiMapPin, FiLayers, FiTrendingUp, FiHome, FiPlus, FiX, FiTrash2 } from 'react-icons/fi';

export default function ContasPagar() {
  const { userPermissions, userData } = useAuth();
  const [selectedLoja, setSelectedLoja] = useState(null);
  const [caixasDisponiveis, setCaixasDisponiveis] = useState([]);
  const [categoriasDespesa, setCategoriasDespesa] = useState([]);
  const [showAddCategoriaInput, setShowAddCategoriaInput] = useState(false);
  const [newCategoria, setNewCategoria] = useState("");

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

  // Função para buscar os caixas disponíveis
  const fetchCaixas = async () => {
    if (!selectedLoja) return;

    try {
      const caixasRef = collection(firestore, `lojas/${selectedLoja}/financeiro/controle_caixa/caixas`);
      const caixasSnapshot = await getDocs(caixasRef);

      const caixas = [];
      caixasSnapshot.forEach(doc => {
        caixas.push({
          id: doc.id,
          ...doc.data()
        });
      });

      setCaixasDisponiveis(caixas);
    } catch (error) {
      console.error("Erro ao buscar caixas:", error);
    }
  };

  // Função para buscar categorias de despesa
  const fetchCategoriasDespesa = async () => {
    try {
      const loja = selectedLoja || "loja1";
      const path = `lojas/${loja}/financeiro/configuracoes/categorias_despesa`;
      const snapshot = await getDocs(collection(firestore, path));
      const list = snapshot.docs.map(doc => doc.data().name || doc.id);
      setCategoriasDespesa(list);
    } catch (error) {
      console.error("Erro ao buscar categorias de despesa:", error);
    }
  };

  // Função para adicionar nova categoria de despesa
  const addNewCategoriaDespesa = async (value) => {
    if (!selectedLoja) {
      alert("Selecione uma loja antes de adicionar novas categorias!");
      return;
    }

    try {
      const path = `lojas/${selectedLoja}/financeiro/configuracoes/categorias_despesa`;
      const itemRef = doc(firestore, path, value.toLowerCase().replace(/\s+/g, '_'));

      await setDoc(itemRef, {
        name: value,
        createdAt: new Date(),
        addedBy: userData?.nome || 'Sistema'
      });

      setCategoriasDespesa([...categoriasDespesa, value]);
      alert(`Categoria ${value} adicionada com sucesso!`);
    } catch (error) {
      console.error(`Erro ao adicionar categoria ${value}:`, error);
      alert(`Erro ao adicionar categoria ${value}`);
    }
  };

  // Chamar a função quando a loja for alterada
  useEffect(() => {
    if (selectedLoja) {
      fetchCaixas();
      fetchCategoriasDespesa();
    }
  }, [selectedLoja]);

  return (
    <Layout>
      <div className="min-h-screen">
        <div className="w-full max-w-5xl mx-auto rounded-lg">
          {/* <BackButton label="Voltar" size={36} /> */}
          <h2 className="text-3xl font-bold text-[#81059e] mb-8 mt-8">CONTAS A PAGAR</h2>

          {/* Seletor de Loja para Admins */}
          {userPermissions?.isAdmin && (
            <div className="mb-2">
              <label className="text-[#81059e] font-medium flex items-center gap-2">
                <FiHome /> Selecionar Loja
              </label>
              <select
                value={selectedLoja || ''}
                onChange={(e) => setSelectedLoja(e.target.value)}
                className="border-2 border-[#81059e] p-3 rounded-sm mt-1 w-34 text-black mt-1"
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
            <div className="p-4 bg-gray-50 rounded-sm mb-6 h-64">
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
                    className="border-2 mb-2 mt-1 border-[#81059e] p-3 rounded-sm w-full text-black"
                    required
                  />
                  {searchTerm && (
                    <>
                      {isLoading ? (
                        <div className="mt-4 p-3 text-sm text-gray-600">
                          <span className="inline-block animate-pulse">Buscando credores...</span>
                        </div>
                      ) : (
                        <>
                          {credores.length > 0 ? (
                            <ul className="bg-white border-2 border-[#81059e] rounded-sm w-full max-h-[104px] overflow-y-auto shadow-lg custom-scroll">
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
                              <div className="mt-2 p-3 text-sm text-gray-500">
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
                  <input type="text" value={formData.documentoCredor} readOnly
                    className="border-2 border-[#81059e] p-3 mt-1 rounded-sm w-full bg-gray-50 text-black"
                  />
                </div>
              </div>
            </div>

            {/* Seção Documento */}
            <div className="p-4 bg-gray-50 rounded-sm mb-6">
              <h3 className="text-lg font-semibold text-[#81059e] mb-4 flex items-center gap-2">
                <FiFileText /> Informações do Documento
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                <div>
                  <label className="text-[#81059e] font-medium">Nº do Documento</label>
                  <input
                    type="text"
                    name="documento"
                    value={formData.documento}
                    onChange={handleDocumentoChange}
                    className="border-2 border-[#81059e] p-3 rounded-sm mt-1 w-full text-black"
                  />
                </div>
                <div>
                  <label className="text-[#81059e] font-medium">Origem</label>
                  <input
                    type="text"
                    name="origem"
                    value={formData.origem}
                    onChange={handleInputChange}
                    className="border-2 border-[#81059e] p-3 rounded-sm mt-1 w-full text-black"
                  />
                </div>
                <div>
                  <label className="text-[#81059e] font-medium">Forma de Pagamento</label>
                  <select
                    name="tipoCobranca"
                    value={formData.tipoCobranca}
                    onChange={handleInputChange}
                    className="border-2 border-[#81059e] p-3 rounded-sm mt-1 w-full text-black"
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
            <div className="p-4 bg-gray-50 rounded-sm mb-6">
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
                    className="border-2 border-[#81059e] p-3 rounded-sm mt-1 w-full text-black"
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
                    className="border-2 border-[#81059e] p-3 rounded-sm mt-1 w-full text-black"
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
                    className="border-2 border-[#81059e] p-3 rounded-sm w-full text-black"
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
                    className="border-2 border-[#81059e] p-3 rounded-sm mt-1 w-full text-black"
                  />
                </div>
                <div>
                  <label className="text-[#81059e] font-medium">Local de Pagamento</label>
                  <input
                    type="text"
                    name="localPagamento"
                    value={formData.localPagamento}
                    onChange={handleInputChange}
                    className="border-2 border-[#81059e] p-3 rounded-sm mt-1 w-full text-black"
                  />
                </div>
              </div>
            </div>

            {/* Seção Contabilidade */}
            <div className="p-4 bg-gray-50 rounded-lg mb-6">
              <h3 className="text-lg font-semibold text-[#81059e] mb-4 flex items-center gap-2">
                <FiTrendingUp /> Informações Contábeis
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                <div>
                  <label className="text-[#81059e] font-medium">Lançamento no Caixa</label>
                  <select
                    name="lancamentoNoCaixa"
                    value={formData.lancamentoNoCaixa}
                    onChange={handleInputChange}
                    className="border-2 border-[#81059e] p-3 rounded-sm mt-1 w-full text-black"
                  >
                    <option value="">Selecione um caixa</option>
                    {caixasDisponiveis.map(caixa => (
                      <option key={caixa.id} value={caixa.id}>
                        {caixa.nome || caixa.id}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[#81059e] font-medium">Categoria da Despesa</label>
                  <div className="relative flex">
                    <select
                      name="categoriaDespesa"
                      value={formData.categoriaDespesa}
                      onChange={(e) => {
                        if (e.target.value === "add_new") {
                          setShowAddCategoriaInput(true);
                        } else {
                          setFormData(prev => ({ ...prev, categoriaDespesa: e.target.value }));
                        }
                      }}
                      className="border-2 border-[#81059e] p-3 rounded-sm mt-1 w-full text-black"
                    >
                      <option value="">Selecione</option>
                      {categoriasDespesa.map((categoria) => (
                        <option key={categoria} value={categoria}>
                          {categoria.toUpperCase()}
                        </option>
                      ))}
                      <option value="add_new">+ ADICIONAR NOVA CATEGORIA</option>
                    </select>

                    {formData.categoriaDespesa && (
                      <button
                        type="button"
                        onClick={async () => {
                          if (confirm(`Deseja remover a categoria "${formData.categoriaDespesa}"?`)) {
                            try {
                              const path = `lojas/${selectedLoja}/financeiro/configuracoes/categorias_despesa`;
                              const docId = formData.categoriaDespesa.toLowerCase().replace(/\s+/g, '_');
                              const docRef = doc(firestore, path, docId);

                              await deleteDoc(docRef);

                              // Atualizar a lista de categorias
                              setCategoriasDespesa(categoriasDespesa.filter(
                                cat => cat !== formData.categoriaDespesa
                              ));

                              // Limpar a seleção atual
                              setFormData(prev => ({ ...prev, categoriaDespesa: '' }));

                              alert(`Categoria ${formData.categoriaDespesa} removida com sucesso!`);
                            } catch (error) {
                              console.error("Erro ao remover categoria:", error);
                              alert(`Erro ao remover categoria: ${error.message}`);
                            }
                          }
                        }}
                        className="ml-2 bg-red-50 border-2 border-red-400 text-red-600 p-2 rounded-lg flex items-center justify-center"
                        title="Remover categoria"
                      >
                        <FiTrash2 />
                      </button>
                    )}

                    {showAddCategoriaInput && (
                      <div className="absolute z-10 top-full left-0 w-full mt-1 bg-white border-2 border-[#81059e] p-3 rounded-lg shadow-lg">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={newCategoria}
                            onChange={(e) => setNewCategoria(e.target.value)}
                            className="border-2 border-[#81059e] p-2 rounded-lg w-full"
                            placeholder="Digite a nova categoria"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (newCategoria.trim()) {
                                addNewCategoriaDespesa(newCategoria);
                                setFormData(prev => ({ ...prev, categoriaDespesa: newCategoria }));
                                setNewCategoria("");
                                setShowAddCategoriaInput(false);
                              }
                            }}
                            className="bg-[#81059e] text-white p-2 rounded-lg"
                          >
                            <FiPlus />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setNewCategoria("");
                              setShowAddCategoriaInput(false);
                            }}
                            className="border-2 border-[#81059e] text-[#81059e] p-2 rounded-lg"
                          >
                            <FiX />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Seção Observações */}
            <div className="p-4 bg-gray-50 rounded-sm mb-6">
              <h3 className="text-lg font-semibold text-[#81059e] mb-4 flex items-center gap-2">
                <FiFileText /> Observações
              </h3>
              <div>
                <textarea
                  name="observacoes"
                  value={formData.observacoes}
                  onChange={handleInputChange}
                  className="border-2 border-[#81059e] p-3 rounded-sm mt-1 w-full text-black min-h-[120px]"
                  placeholder="Adicione observações relevantes..."
                ></textarea>
              </div>
            </div>

            {/* Botões de ação */}
            <div className="flex justify-center gap-4 mt-8">
              <button
                type="button"
                onClick={handleClear}
                className="inline-flex justify-center py-3 px-4 border-2 border-[#81059e] shadow-sm text-sm font-semibold rounded-sm text-[#81059e] bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#81059e]"
                disabled={isLoading}
              >
                CANCELAR
              </button>
              <button
                type="submit"
                className="bg-[#81059e] p-3 px-6 rounded-sm text-white font-semibold flex items-center gap-2"
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