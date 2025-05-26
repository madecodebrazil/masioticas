//add-receive
"use client";
import { useState, useEffect } from "react";
import { firestore } from "../../../lib/firebaseConfig";
import { collection, getDocs, addDoc, getDoc, Timestamp, doc, setDoc, query, where, deleteDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import BackButton from '@/components/BackButton';
import InputMask from "react-input-mask";
import "react-datepicker/dist/react-datepicker.css";
import Layout from "../../../components/Layout";
import ConfirmationModal from '../../../components/ConfirmationModal.js';
import Link from 'next/link';
import { FiCalendar, FiDollarSign, FiTag, FiFileText, FiUser, FiCreditCard, FiMapPin, FiLayers, FiTrendingUp, FiHome, FiPlus, FiX, FiTrash2 } from 'react-icons/fi';

export default function AddAccountPage() {
  const { userPermissions, userData } = useAuth();
  const [selectedLoja, setSelectedLoja] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [caixasDisponiveis, setCaixasDisponiveis] = useState([]);
  const [categoriasReceita, setCategoriasReceita] = useState([]);
  const [showAddCategoriaInput, setShowAddCategoriaInput] = useState(false);
  const [newCategoria, setNewCategoria] = useState("");
  const [formData, setFormData] = useState({
    cliente: "",
    cpf: "",
    observacoes: "",
    numeroDocumento: "",
    parcela: "",
    tipoCobranca: "",
    origem: "",
    valor: "",
    taxaJuros: "",
    dataCobranca: "",
    localCobranca: "",
    contaLancamentoCaixa: "",
    dispensarJuros: false,
    parcelaAtual: '1',
    totalParcelas: '1'
  });

  const [consumers, setConsumers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [numeroParcelas, setNumeroParcelas] = useState("1");
  const [taxaJuros, setTaxaJuros] = useState("0,00");
  const [isLoading, setIsLoading] = useState(false);
  const [taxaJurosPadrao, setTaxaJurosPadrao] = useState(0);

  const router = useRouter();

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

  // Buscar taxa de juros padrão do sistema
  useEffect(() => {
    const fetchTaxaJurosPadrao = async () => {
      try {
        // Primeiro tenta buscar da coleção configuracoes/financeiro
        const configDoc = await getDoc(doc(firestore, 'configuracoes', 'financeiro'));

        if (configDoc.exists()) {
          const taxa = configDoc.data().taxaJurosPadrao || 0;
          console.log('Taxa de juros encontrada:', taxa); // Debug log
          setTaxaJurosPadrao(taxa);
          // Formatar a taxa para exibição com duas casas decimais
          const taxaFormatada = taxa.toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          });
          console.log('Taxa formatada:', taxaFormatada); // Debug log
          setTaxaJuros(taxaFormatada);
          setFormData(prev => ({ ...prev, taxaJuros: taxa }));
        } else {
          console.log('Documento de configuração não encontrado'); // Debug log
          // Se não encontrar, tenta buscar da coleção configuracoes/horarios
          const horariosDoc = await getDoc(doc(firestore, 'configuracoes', 'horarios'));
          if (horariosDoc.exists()) {
            const taxa = horariosDoc.data().taxaJurosPadrao || 0;
            console.log('Taxa de juros encontrada em horarios:', taxa); // Debug log
            setTaxaJurosPadrao(taxa);
            const taxaFormatada = taxa.toLocaleString('pt-BR', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            });
            setTaxaJuros(taxaFormatada);
            setFormData(prev => ({ ...prev, taxaJuros: taxa }));
          }
        }
      } catch (error) {
        console.error("Erro ao buscar taxa de juros padrão:", error);
      }
    };

    fetchTaxaJurosPadrao();
  }, []);

  // Função para calcular juros
  const calcularJuros = (valor, diasAtraso) => {
    if (formData.dispensarJuros || !taxaJurosPadrao) return 0;

    const taxaDiaria = taxaJurosPadrao / 30; // Taxa mensal dividida por 30 dias
    const juros = valor * (taxaDiaria / 100) * diasAtraso;
    return juros;
  };

  // Atualizar juros quando a data de cobrança mudar
  useEffect(() => {
    if (formData.dataCobranca && formData.valor) {
      const dataCobranca = new Date(formData.dataCobranca);
      const hoje = new Date();
      const diasAtraso = Math.max(0, Math.floor((hoje - dataCobranca) / (1000 * 60 * 60 * 24)));

      const valorNumerico = parseFloat(
        formData.valor
          .replace(/[^\d,]/g, '')
          .replace(',', '.')
      );

      const juros = calcularJuros(valorNumerico, diasAtraso);
      setFormData(prev => ({ ...prev, juros }));
    }
  }, [formData.dataCobranca, formData.valor, formData.dispensarJuros]);

  // Função para buscar clientes/devedores
  const fetchConsumers = async () => {
    if (searchTerm.trim() === "" || !selectedLoja) {
      setConsumers([]);
      return;
    }

    setIsLoading(true);
    try {
      // O caminho deve ser o mesmo utilizado no ClientForm
      const clientesRef = collection(firestore, 'lojas/clientes/users');
      const querySnapshot = await getDocs(
        query(clientesRef,
          where('nome', '>=', searchTerm),
          where('nome', '<=', searchTerm + '\uf8ff')
        )
      );

      // Se não encontrar por nome, tenta por CPF
      let clientesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Se não encontrou por nome, tente por CPF
      if (clientesData.length === 0 && searchTerm.replace(/\D/g, '').length > 0) {
        const cpfQuerySnapshot = await getDocs(
          query(clientesRef, where('cpf', '==', searchTerm.replace(/\D/g, '')))
        );

        clientesData = cpfQuerySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      }

      setConsumers(clientesData);
    } catch (error) {
      console.error("Erro ao buscar clientes:", error);

      // Plano B: Tentar buscar na coleção 'clientes' global se existir
      try {
        const clientesGlobalRef = collection(firestore, 'clientes');
        const globalQuerySnapshot = await getDocs(
          query(clientesGlobalRef,
            where('nome', '>=', searchTerm),
            where('nome', '<=', searchTerm + '\uf8ff')
          )
        );

        const clientesData = globalQuerySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setConsumers(clientesData);
      } catch (fallbackError) {
        console.error("Erro ao buscar no plano B:", fallbackError);
        setConsumers([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConsumers();
  }, [searchTerm, selectedLoja]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'numeroDocumento') {
      const numericValue = value.replace(/\D/g, '');
      setFormData(prev => ({ ...prev, [name]: numericValue }));
    } else if (name === 'dispensarJuros') {
      setFormData(prev => ({
        ...prev,
        [name]: checked,
        juros: checked ? 0 : prev.juros // Zera os juros se marcado
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleValorChange = (e) => {
    const valor = e.target.value.replace(/\D/g, '');
    if (valor === '') {
      setFormData(prev => ({ ...prev, valor: '' }));
      return;
    }

    setFormData(prev => ({
      ...prev,
      valor: (Number(valor) / 100).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      })
    }));
  };

  // Função para formatar CPF: 00000000000 -> 000.000.000-00
  const formatCPF = (cpf) => {
    if (!cpf) return '';

    // Remove caracteres não numéricos
    cpf = cpf.replace(/\D/g, '');

    // Aplica a máscara
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const handleClienteSelect = (cliente) => {
    setFormData(prev => ({
      ...prev,
      cliente: cliente.nome,
      cpf: cliente.cpf
    }));
    setSearchTerm(cliente.nome);
    setConsumers([]);
  };

  const handleClear = () => {
    setFormData({
      cliente: "",
      cpf: "",
      observacoes: "",
      numeroDocumento: "",
      parcela: "",
      tipoCobranca: "",
      origem: "",
      valor: "",
      taxaJuros: "",
      dataCobranca: "",
      localCobranca: "",
      contaLancamentoCaixa: "",
      dispensarJuros: false,
      parcelaAtual: '1',
      totalParcelas: '1'
    });
    setSearchTerm("");
    setConsumers([]);
    setNumeroParcelas("1");
    setTaxaJuros("0,00");
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!selectedLoja) {
      alert("Selecione uma loja primeiro!");
      return;
    }

    setIsModalOpen(true);
  };

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
      const recebimentoData = {
        cliente: formData.cliente,
        cpf: formData.cpf,
        numeroDocumento: formData.numeroDocumento || '',
        parcela: formatoParcela,
        tipoCobranca: formData.tipoCobranca || '',
        origem: formData.origem || '',
        valor: valorNumerico,
        taxaJuros: taxaJurosNumerica,
        dataRegistro: Timestamp.now(),
        dataCobranca: formData.dataCobranca
          ? Timestamp.fromDate(formData.dataCobranca)
          : null,
        localCobranca: formData.localCobranca || '',
        contaLancamentoCaixa: formData.contaLancamentoCaixa || '',
        dispensarJuros: formData.dispensarJuros || false,
        observacoes: formData.observacoes || '',
        status: 'pendente',
        registradoPor: userData?.nome || 'Sistema',
        loja: selectedLoja,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        dataRecebimento: null
      };

      // Primeiro, garantimos que o documento contas_receber existe
      const contasReceberDocRef = doc(firestore, `lojas/${selectedLoja}/financeiro`, 'contas_receber');

      // Verificar se o documento existe, se não, criá-lo
      const docSnap = await getDoc(contasReceberDocRef);
      if (!docSnap.exists()) {
        await setDoc(contasReceberDocRef, {
          descricao: "Contas a receber",
          createdAt: Timestamp.now()
        });
      }

      // Agora criamos a conta na subcoleção "items" do documento contas_receber
      const itemsCollectionRef = collection(contasReceberDocRef, 'items');
      await addDoc(itemsCollectionRef, recebimentoData);

      alert("Conta a receber registrada com sucesso!");
      handleClear();
      setIsModalOpen(false);
    } catch (error) {
      console.error("Erro ao registrar conta a receber:", error);
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

  // Função para buscar categorias de receita
  const fetchCategoriasReceita = async () => {
    try {
      const loja = selectedLoja || "loja1";
      const path = `lojas/${loja}/financeiro/configuracoes/categorias_receita`;
      const snapshot = await getDocs(collection(firestore, path));
      const list = snapshot.docs.map(doc => doc.data().name || doc.id);
      setCategoriasReceita(list);
    } catch (error) {
      console.error("Erro ao buscar categorias de receita:", error);
    }
  };

  // Função para adicionar nova categoria de receita
  const addNewCategoriaReceita = async (value) => {
    if (!selectedLoja) {
      alert("Selecione uma loja antes de adicionar novas categorias!");
      return;
    }

    try {
      const path = `lojas/${selectedLoja}/financeiro/configuracoes/categorias_receita`;
      const itemRef = doc(firestore, path, value.toLowerCase().replace(/\s+/g, '_'));

      await setDoc(itemRef, {
        name: value,
        createdAt: new Date(),
        addedBy: userData?.nome || 'Sistema'
      });

      setCategoriasReceita([...categoriasReceita, value]);
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
      fetchCategoriasReceita();
    }
  }, [selectedLoja]);

  return (
    <Layout>
      <div className="min-h-screen">
        <div className="w-full max-w-5xl mx-auto rounded-sm">
          {/* <BackButton label="Voltar" size={36} /> */}
          <h2 className="text-3xl font-bold text-[#81059e] mb-8 mt-8">CONTAS A RECEBER</h2>

          {/* Seletor de Loja para Admins */}
          {userPermissions?.isAdmin && (
            <div className="mb-6">
              <label className="text-[#81059e] font-medium flex items-center gap-2">
                <FiHome /> Selecionar Loja
              </label>
              <select
                value={selectedLoja || ''}
                onChange={(e) => setSelectedLoja(e.target.value)}
                className="border-2 border-[#81059e] p-3 rounded-sm w-full text-black mt-1"
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
            <Link href="/finance/add-receive/list-receives">
              <button className="bg-[#81059e] p-2 rounded-sm text-white">
                RECEBIMENTOS PENDENTES
              </button>
            </Link>
            <button
              onClick={handleClear}
              className="text-[#81059e] px-3 py-1 border-2 border-[#81059e] font-bold text-base rounded-sm"
            >
              Limpar
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 mb-20">
            {/* Seção Cliente */}
            <div className="p-4 bg-gray-50 rounded-sm mb-6 h-64">
              <h3 className="text-lg font-semibold text-[#81059e] mb-4 flex items-center gap-2">
                <FiUser /> Informações do Cliente
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="relative">
                  <label className="text-[#81059e] font-medium">Nome do Cliente</label>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setFormData(prev => ({ ...prev, cliente: e.target.value }));
                    }}
                    placeholder="Digite o nome do cliente"
                    className="border-2 border-[#81059e] p-3 rounded-sm w-full text-black"
                    required
                  />
                  {searchTerm && consumers.length > 0 && (
                    <div className="absolute w-full z-10">
                      <ul className="bg-white border-2 border-[#81059e] rounded-sm w-full max-h-[104px] overflow-y-auto shadow-lg custom-scroll">
                        {consumers.map((consumer) => (
                          <li
                            key={consumer.id}
                            onClick={() => handleClienteSelect(consumer)}
                            className="p-2 hover:bg-purple-50 cursor-pointer text-black border-b last:border-b-0 h-[52px] flex items-center"
                          >
                            {consumer.nome} (CPF: {formatCPF(consumer.cpf)})
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {isLoading && searchTerm && (
                    <p className="text-sm text-gray-500 mt-1">Buscando clientes...</p>
                  )}
                </div>
                <div>
                  <label className="text-[#81059e] font-medium">CPF do Cliente</label>
                  <input
                    type="text"
                    value={formData.cpf ? formatCPF(formData.cpf) : ''}
                    readOnly
                    className="border-2 border-[#81059e] p-3 rounded-sm w-full bg-gray-100 text-black"
                  />
                </div>
              </div>
            </div>

            {/* Seção Documento */}
            <div className="p-4 bg-gray-50 rounded-sm mb-6">
              <h3 className="text-lg font-semibold text-[#81059e] mb-4 flex items-center gap-2">
                <FiFileText /> Informações do Documento
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="text-[#81059e] font-medium">Nº do Documento</label>
                  <input
                    type="text"
                    name="numeroDocumento"
                    value={formData.numeroDocumento}
                    onChange={handleInputChange}
                    className="border-2 border-[#81059e] p-3 rounded-sm w-full text-black"
                  />
                </div>
                <div>
                  <label className="text-[#81059e] font-medium">Origem</label>
                  <input
                    type="text"
                    name="origem"
                    value={formData.origem}
                    onChange={handleInputChange}
                    className="border-2 border-[#81059e] p-3 rounded-sm w-full text-black"
                  />
                </div>
                <div>
                  <label className="text-[#81059e] font-medium">Forma de Recebimento</label>
                  <select
                    name="tipoCobranca"
                    value={formData.tipoCobranca}
                    onChange={handleInputChange}
                    className="border-2 border-[#81059e] p-3 rounded-sm w-full text-black"
                  >
                    <option value="">Selecione</option>
                    <option value="boleto">Boleto</option>
                    <option value="cartao">Cartão de Débito/Crédito</option>
                    <option value="dinheiro">Dinheiro</option>
                    <option value="TEV">TEV</option>
                    <option value="pix">PIX</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Seção Recebimento */}
            <div className=" p-4 bg-gray-50 rounded-sm mb-6">
              <h3 className="text-lg font-semibold text-[#81059e] mb-4 flex items-center gap-2">
                <FiDollarSign /> Informações de Recebimento
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
                    className="border-2 border-[#81059e] p-3 rounded-sm w-full text-black"
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
                      setFormData(prev => ({ ...prev, totalParcelas: e.target.value }));
                    }}
                    className="border-2 border-[#81059e] p-3 rounded-sm w-full text-black"
                  >
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5">5</option>
                    <option value="6">6</option>
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
                    name="dataCobranca"
                    placeholder="dd/mm/aaaa"
                    value={
                      formData.dataCobranca instanceof Date && !isNaN(formData.dataCobranca)
                        ? formData.dataCobranca.toISOString().split('T')[0]
                        : ''
                    }
                    onChange={(e) => {
                      const selectedDate = e.target.value ? new Date(e.target.value) : null;
                      setFormData((prev) => ({
                        ...prev,
                        dataCobranca: selectedDate,
                      }));
                    }}
                    className="border-2 border-[#81059e] p-3 rounded-sm w-full text-black"
                  />
                </div>
                <div>
                  <label className="text-[#81059e] font-medium">Taxa de Juros (%)</label>
                  <input
                    type="text"
                    value={taxaJuros}
                    readOnly
                    className="border-2 border-[#81059e] p-3 rounded-sm w-full bg-gray-100 text-black"
                  />
                  <p className="text-xs text-gray-500 mt-1">Taxa de juros padrão do sistema: {taxaJuros}%</p>
                </div>
                <div>
                  <label className="text-[#81059e] font-medium">Local de Recebimento</label>
                  <input
                    type="text"
                    name="localCobranca"
                    value={formData.localCobranca}
                    onChange={handleInputChange}
                    className="border-2 border-[#81059e] p-3 rounded-sm w-full text-black"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="dispensarJuros"
                    name="dispensarJuros"
                    checked={formData.dispensarJuros}
                    onChange={handleInputChange}
                    className="w-4 h-4 mr-2"
                  />
                  <label htmlFor="dispensarJuros" className="text-[#81059e] font-medium">
                    Dispensar Juros
                  </label>
                </div>
              </div>
            </div>

            {/* Seção Contabilidade */}
            <div className="p-4 bg-gray-50 rounded-sm mb-6">
              <h3 className="text-lg font-semibold text-[#81059e] mb-4 flex items-center gap-2">
                <FiTrendingUp /> Informações Contábeis
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-[#81059e] font-medium">Lançamento no Caixa</label>
                  <select
                    name="contaLancamentoCaixa"
                    value={formData.contaLancamentoCaixa}
                    onChange={handleInputChange}
                    className="border-2 border-[#81059e] p-3 rounded-sm w-full text-black"
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
                  <label className="text-[#81059e] font-medium">Categoria de Receita</label>
                  <div className="relative flex">
                    <select
                      name="categoriaReceita"
                      value={formData.categoriaReceita}
                      onChange={(e) => {
                        if (e.target.value === "add_new") {
                          setShowAddCategoriaInput(true);
                        } else {
                          setFormData(prev => ({ ...prev, categoriaReceita: e.target.value }));
                        }
                      }}
                      className="border-2 border-[#81059e] p-3 rounded-sm w-full text-black"
                    >
                      <option value="">Selecione</option>
                      {categoriasReceita.map((categoria) => (
                        <option key={categoria} value={categoria}>
                          {categoria.toUpperCase()}
                        </option>
                      ))}
                      <option value="add_new">+ ADICIONAR NOVA CATEGORIA</option>
                    </select>

                    {formData.categoriaReceita && (
                      <button
                        type="button"
                        onClick={async () => {
                          if (confirm(`Deseja remover a categoria "${formData.categoriaReceita}"?`)) {
                            try {
                              const path = `lojas/${selectedLoja}/financeiro/configuracoes/categorias_receita`;
                              const docId = formData.categoriaReceita.toLowerCase().replace(/\s+/g, '_');
                              const docRef = doc(firestore, path, docId);

                              await deleteDoc(docRef);

                              // Atualizar a lista de categorias
                              setCategoriasReceita(categoriasReceita.filter(
                                cat => cat !== formData.categoriaReceita
                              ));

                              // Limpar a seleção atual
                              setFormData(prev => ({ ...prev, categoriaReceita: '' }));

                              alert(`Categoria ${formData.categoriaReceita} removida com sucesso!`);
                            } catch (error) {
                              console.error("Erro ao remover categoria:", error);
                              alert(`Erro ao remover categoria: ${error.message}`);
                            }
                          }
                        }}
                        className="ml-2 bg-red-50 border-2 border-red-400 text-red-600 p-2 rounded-sm flex items-center justify-center"
                        title="Remover categoria"
                      >
                        <FiTrash2 />
                      </button>
                    )}

                    {showAddCategoriaInput && (
                      <div className="absolute z-10 top-full left-0 w-full mt-1 bg-white border-2 border-[#81059e] p-3 rounded-sm shadow-lg">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={newCategoria}
                            onChange={(e) => setNewCategoria(e.target.value)}
                            className="border-2 border-[#81059e] p-2 rounded-sm w-full"
                            placeholder="Digite a nova categoria"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (newCategoria.trim()) {
                                addNewCategoriaReceita(newCategoria);
                                setFormData(prev => ({ ...prev, categoriaReceita: newCategoria }));
                                setNewCategoria("");
                                setShowAddCategoriaInput(false);
                              }
                            }}
                            className="bg-[#81059e] text-white p-2 rounded-sm"
                          >
                            <FiPlus />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setNewCategoria("");
                              setShowAddCategoriaInput(false);
                            }}
                            className="border-2 border-[#81059e] text-[#81059e] p-2 rounded-sm"
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
                  className="border-2 border-[#81059e] p-3 rounded-sm w-full text-black min-h-[120px]"
                  placeholder="Adicione observações relevantes..."
                ></textarea>
              </div>
            </div>

            {/* Botões de ação */}
            <div className="flex justify-center gap-6 mt-8">

              <button
                type="button"
                onClick={handleClear}
                className="border-2 border-[#81059e] p-2 px-3 rounded-sm text-[#81059e] flex items-center gap-2"
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