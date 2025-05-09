"use client";
import { useState, useEffect } from "react";
import { firestore } from "../../../lib/firebaseConfig";
import { collection, getDocs, query, where, orderBy, limit } from "firebase/firestore";
import { useAuth } from "@/hooks/useAuth";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Layout from "../../../components/Layout";
import Link from 'next/link';
// import BotaoNovoOrcamento from "@/components/BotaoNovoOrcamento";
import { FiCalendar, FiDollarSign, FiFileText, FiUser, FiClock, 
         FiRefreshCw, FiFilter, FiSearch, FiCheckCircle, 
         FiAlertCircle, FiArrowRight, FiPrinter, FiSend, FiHome } from 'react-icons/fi';

export default function OrcamentosPage() {
  const { userPermissions, userData } = useAuth();
  const [selectedLoja, setSelectedLoja] = useState(null);
  const [orcamentos, setOrcamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtro, setFiltro] = useState('todos');
  const [busca, setBusca] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [periodoInicio, setPeriodoInicio] = useState(null);
  const [periodoFim, setPeriodoFim] = useState(null);

  // Definir loja inicial baseado nas permissões
  useEffect(() => {
    if (userPermissions) {
      // Se não for admin, usa a primeira loja que tem acesso
      if (!userPermissions.isAdmin && userPermissions.lojas?.length > 0) {
        setSelectedLoja(userPermissions.lojas[0]);
      }
      // Se for admin, usa a primeira loja da lista
      else if (userPermissions.isAdmin && userPermissions.lojas?.length > 0) {
        setSelectedLoja(userPermissions.lojas[0]);
      }
    }
  }, [userPermissions]);

  // Buscar orçamentos quando a loja selecionada mudar
  useEffect(() => {
    if (selectedLoja) {
      fetchOrcamentos();
    }
  }, [selectedLoja, filtro]);

  // Função para buscar orçamentos - CORRIGIDA para o caminho correto
  const fetchOrcamentos = async () => {
    if (!selectedLoja) return;

    try {
      setIsFetching(true);
      // Caminho corrigido para acessar a coleção de orçamentos
      const orcamentosRef = collection(firestore, `lojas/${selectedLoja}/orcamentos/items/items`);
      
      // Construir a query com base no filtro
      let q = orcamentosRef;
      
      if (filtro === 'ativos') {
        q = query(orcamentosRef, where('status', '==', 'ativo'), orderBy('data_criacao', 'desc'));
      } else if (filtro === 'expirados') {
        q = query(orcamentosRef, where('status', '==', 'expirado'), orderBy('data_criacao', 'desc'));
      } else if (filtro === 'convertidos') {
        q = query(orcamentosRef, where('status', '==', 'convertido'), orderBy('data_criacao', 'desc'));
      } else {
        // Todos os orçamentos, ordenados por data
        q = query(orcamentosRef, orderBy('data_criacao', 'desc'));
      }
      
      // Limitar a 50 orçamentos inicialmente
      q = query(q, limit(50));
      
      const querySnapshot = await getDocs(q);
      
      // Mapear documentos para o formato desejado
      const orcamentosData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        data_criacao: doc.data().data_criacao?.toDate() || new Date(),
        validade: doc.data().validade?.toDate() || null
      }));
      
      setOrcamentos(orcamentosData);
      setLoading(false);
    } catch (err) {
      console.error('Erro ao buscar orçamentos:', err);
      setError('Falha ao carregar orçamentos. Por favor, tente novamente.');
      setLoading(false);
    } finally {
      setIsFetching(false);
    }
  };

  // Filtrar orçamentos pela busca e pelo período
  const orcamentosFiltrados = orcamentos.filter(orcamento => {
    // Filtro de busca
    const termoBusca = busca.toLowerCase();
    const clienteNome = orcamento.cliente?.nome?.toLowerCase() || '';
    const codigo = orcamento.codigo?.toLowerCase() || '';
    const observacao = orcamento.observacao?.toLowerCase() || '';
    
    const passaNaBusca = !busca || 
                        clienteNome.includes(termoBusca) || 
                        codigo.includes(termoBusca) || 
                        observacao.includes(termoBusca);
    
    // Filtro de período
    let passaNoPeriodo = true;
    if (periodoInicio && periodoFim) {
      const dataOrcamento = orcamento.data_criacao;
      passaNoPeriodo = dataOrcamento >= periodoInicio && 
                      dataOrcamento <= new Date(periodoFim.setHours(23, 59, 59, 999));
    } else if (periodoInicio) {
      passaNoPeriodo = orcamento.data_criacao >= periodoInicio;
    } else if (periodoFim) {
      passaNoPeriodo = orcamento.data_criacao <= new Date(periodoFim.setHours(23, 59, 59, 999));
    }
    
    return passaNaBusca && passaNoPeriodo;
  });

  // Renderizar status do orçamento
  const renderStatus = (status, validade) => {
    // Verificar se está expirado pela data de validade
    const hoje = new Date();
    const estaExpirado = validade && hoje > validade && status === 'ativo';
    
    if (estaExpirado) {
      return (
        <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800 flex items-center">
          <FiAlertCircle className="mr-1" /> Expirado
        </span>
      );
    }

    switch(status) {
      case 'ativo':
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 flex items-center">
            <FiCheckCircle className="mr-1" /> Ativo
          </span>
        );
      case 'expirado':
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800 flex items-center">
            <FiAlertCircle className="mr-1" /> Expirado
          </span>
        );
      case 'convertido':
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 flex items-center">
            <FiArrowRight className="mr-1" /> Convertido
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
            Desconhecido
          </span>
        );
    }
  };

  // Formatar valor como moeda
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  // Enviar orçamento por WhatsApp
  const enviarPorWhatsApp = (orcamento) => {
    if (!orcamento.cliente?.telefone) {
      alert('O cliente selecionado não tem telefone cadastrado');
      return;
    }

    const telefone = orcamento.cliente.telefone.replace(/\D/g, '');
    
    // Construir a mensagem para o WhatsApp
    let mensagem = `*Orçamento MASI Óticas - ${orcamento.codigo || orcamento.id}*\n\n`;
    mensagem += `Olá ${orcamento.cliente.nome}, segue o orçamento solicitado:\n\n`;
    
    // Adicionar produtos
    mensagem += "*Produtos:*\n";
    if (orcamento.itens && Array.isArray(orcamento.itens)) {
      orcamento.itens.forEach((item, index) => {
        mensagem += `${index + 1}. ${item.nome} - ${item.marca || 'Sem marca'}\n`;
        mensagem += `   ${item.quantidade} x ${formatCurrency(item.valor_unitario)} = ${formatCurrency(item.valor_total)}\n`;
      });
    }
    
    // Adicionar valores
    mensagem += `\n*Subtotal:* ${formatCurrency(orcamento.subtotal)}\n`;
    if (orcamento.desconto > 0) {
      mensagem += `*Desconto${orcamento.desconto_tipo === 'percentage' ? ` (${orcamento.desconto_valor || ''}%)` : ''}:* ${formatCurrency(orcamento.desconto)}\n`;
    }
    mensagem += `*Valor Total:* ${formatCurrency(orcamento.valor_total || orcamento.total)}\n\n`;
    
    // Adicionar validade
    const dataValidadeFormatada = orcamento.validade ? orcamento.validade.toLocaleDateString('pt-BR') : 'Não definida';
    mensagem += `Este orçamento é válido até ${dataValidadeFormatada}.\n\n`;
    
    // Adicionar observação se houver
    if (orcamento.observacoes || orcamento.observacao) {
      mensagem += `*Observações:* ${orcamento.observacoes || orcamento.observacao}\n\n`;
    }
    
    // Adicionar mensagem de fechamento
    mensagem += "Agradecemos a preferência. Para confirmar este orçamento ou tirar dúvidas, entre em contato conosco.";
    
    // Criar URL para o WhatsApp
    const whatsappUrl = `https://wa.me/55${telefone}?text=${encodeURIComponent(mensagem)}`;
    
    // Abrir em uma nova janela
    window.open(whatsappUrl, '_blank');
  };

  // Função para imprimir orçamento
  const imprimirOrcamento = (orcamento) => {
    // Implementar lógica de impressão
    window.print();
  };

  const renderLojaName = (lojaId) => {
    const lojaNames = {
      'loja1': 'Loja 1 - Centro',
      'loja2': 'Loja 2 - Caramuru'
    };

    return lojaNames[lojaId] || lojaId;
  };

  const limparFiltros = () => {
    setBusca('');
    setPeriodoInicio(null);
    setPeriodoFim(null);
    setFiltro('todos');
  };

  return (
    <Layout>
      <div className="min-h-screen mb-32">
        <div className="w-full max-w-7xl mx-auto rounded-lg ">
          <h2 className="text-3xl font-bold text-[#81059e] mb-8 mt-8">ORÇAMENTOS</h2>

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
                {userPermissions.lojas?.map((loja) => (
                  <option key={loja} value={loja}>
                    {renderLojaName(loja)}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex justify-between items-center mb-6">
            <div className="space-x-2">
              {/* <BotaoNovoOrcamento selectedLoja={selectedLoja} /> */}
            </div>
            <button
              onClick={fetchOrcamentos}
              className="flex items-center justify-center px-4 py-2 border border-[#81059e] text-[#81059e] rounded-md hover:bg-purple-50"
              disabled={isFetching}
            >
              {isFetching ? (
                <div className="animate-spin mr-2 h-4 w-4 border-2 border-[#81059e] rounded-full border-t-transparent" />
              ) : (
                <FiRefreshCw className="mr-2" />
              )}
              Atualizar
            </button>
          </div>

          {/* Filtros e busca */}
          <div className="p-4 bg-gray-50 rounded-lg mb-6">
            <h3 className="text-lg font-semibold text-[#81059e] mb-4 flex items-center gap-2">
              <FiFilter /> Filtros
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
              {/* Busca */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiSearch className="text-gray-400" />
                </div>
                <input
                  type="text"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="pl-10 p-3 border-2 border-[#81059e] rounded-lg w-full"
                  placeholder="Buscar por cliente ou código..."
                />
              </div>
              
              {/* Período início */}
              <div>
                <label className="text-[#81059e] font-medium flex items-center gap-2 mb-1">
                  <FiCalendar /> Data Inicial
                </label>
                <DatePicker
                  selected={periodoInicio}
                  onChange={setPeriodoInicio}
                  className="p-3 border-2 border-[#81059e] rounded-lg w-full"
                  dateFormat="dd/MM/yyyy"
                  placeholderText="Selecione a data inicial"
                  isClearable
                />
              </div>
              
              {/* Período fim */}
              <div>
                <label className="text-[#81059e] font-medium flex items-center gap-2 mb-1">
                  <FiCalendar /> Data Final
                </label>
                <DatePicker
                  selected={periodoFim}
                  onChange={setPeriodoFim}
                  className="p-3 border-2 border-[#81059e] rounded-lg w-full"
                  dateFormat="dd/MM/yyyy"
                  placeholderText="Selecione a data final"
                  isClearable
                  minDate={periodoInicio}
                />
              </div>
            </div>
            
            <div className="flex justify-between items-center mt-4">
              <div className="flex items-center space-x-2">
                <span className="text-gray-600 font-medium">Status:</span>
                <div className="flex bg-gray-100 rounded-md">
                  <button
                    onClick={() => setFiltro('todos')}
                    className={`px-3 py-1 text-sm rounded-md ${filtro === 'todos' 
                      ? 'bg-[#81059e] text-white' 
                      : 'text-gray-700'}`}
                  >
                    Todos
                  </button>
                  <button
                    onClick={() => setFiltro('ativos')}
                    className={`px-3 py-1 text-sm rounded-md ${filtro === 'ativos' 
                      ? 'bg-[#81059e] text-white' 
                      : 'text-gray-700'}`}
                  >
                    Ativos
                  </button>
                  <button
                    onClick={() => setFiltro('expirados')}
                    className={`px-3 py-1 text-sm rounded-md ${filtro === 'expirados' 
                      ? 'bg-[#81059e] text-white' 
                      : 'text-gray-700'}`}
                  >
                    Expirados
                  </button>
                  <button
                    onClick={() => setFiltro('convertidos')}
                    className={`px-3 py-1 text-sm rounded-md ${filtro === 'convertidos' 
                      ? 'bg-[#81059e] text-white' 
                      : 'text-gray-700'}`}
                  >
                    Convertidos
                  </button>
                </div>
              </div>
              
              <button
                onClick={limparFiltros}
                className="text-[#81059e] hover:underline"
              >
                Limpar filtros
              </button>
            </div>
          </div>

          {/* Lista de orçamentos */}
          {loading ? (
            <div className="bg-white shadow rounded-lg p-8 text-center">
              <div className="animate-spin mx-auto h-12 w-12 border-4 border-[#81059e] border-t-transparent rounded-full mb-4"></div>
              <p className="text-gray-600">Carregando orçamentos...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
              <div className="flex">
                <div className="flex-shrink-0">
                  <FiAlertCircle className="h-5 w-5 text-red-500" />
                </div>
                <div className="ml-3">
                  <p className="text-red-700">{error}</p>
                </div>
              </div>
            </div>
          ) : orcamentosFiltrados.length === 0 ? (
            <div className="bg-white shadow rounded-lg p-8 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-purple-100 mb-4">
                <FiFileText className="h-6 w-6 text-[#81059e]" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">Nenhum orçamento encontrado</h3>
              <p className="text-gray-500">Crie um novo orçamento ou altere os filtros de busca.</p>
            </div>
          ) : (
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Código
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cliente
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Data
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Validade
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Valor
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {orcamentosFiltrados.map((orcamento) => (
                      <tr key={orcamento.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <FiFileText className="flex-shrink-0 h-5 w-5 text-[#81059e]" />
                            <div className="ml-2 text-sm font-medium text-gray-900">
                              {orcamento.codigo || orcamento.id}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <FiUser className="flex-shrink-0 h-5 w-5 text-gray-400" />
                            <div className="ml-2">
                              <div className="text-sm font-medium text-gray-900">
                                {orcamento.cliente?.nome || 'Cliente não informado'}
                              </div>
                              {orcamento.cliente?.telefone && (
                                <div className="text-xs text-gray-500">
                                  {orcamento.cliente.telefone}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <FiCalendar className="flex-shrink-0 h-5 w-5 text-gray-400" />
                            <div className="ml-2 text-sm text-gray-500">
                              {orcamento.data_criacao.toLocaleDateString('pt-BR')}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <FiClock className="flex-shrink-0 h-5 w-5 text-gray-400" />
                            <div className="ml-2 text-sm text-gray-500">
                              {orcamento.validade ? orcamento.validade.toLocaleDateString('pt-BR') : 'Não definida'}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-[#81059e]">
                            {formatCurrency(orcamento.valor_total || orcamento.total)}
                          </div>
                          {(orcamento.desconto > 0 || (orcamento.desconto && orcamento.desconto.total > 0)) && (
                            <div className="text-xs text-green-600">
                              Desconto: {formatCurrency(orcamento.desconto.total || orcamento.desconto)}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {renderStatus(orcamento.status, orcamento.validade)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => imprimirOrcamento(orcamento)}
                              className="text-gray-600 hover:text-[#81059e]"
                              title="Imprimir"
                            >
                              <FiPrinter />
                            </button>
                            {orcamento.cliente?.telefone && (
                              <button
                                onClick={() => enviarPorWhatsApp(orcamento)}
                                className="text-green-600 hover:text-green-800"
                                title="Enviar por WhatsApp"
                              >
                                <FiSend />
                              </button>
                            )}
                            <Link href={`/orcamentos/${orcamento.id}`} className="text-blue-600 hover:text-blue-800" title="Ver detalhes">
                              <FiFileText />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}