"use client";
import { useState, useEffect } from "react";
import { firestore } from "../../../lib/firebaseConfig";
import { collection, getDocs, query, where, orderBy, Timestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Layout from "../../../components/Layout";
import Link from 'next/link';
import { 
  FiCalendar, 
  FiDollarSign, 
  FiFileText, 
  FiUser, 
  FiHome,
  FiFilter,
  FiSearch,
  FiDownload,
  FiRefreshCw,
  FiPrinter
} from 'react-icons/fi';
import ptBR from 'date-fns/locale/pt-BR';
import { format } from 'date-fns';

// Registrar localização PT-BR para o DatePicker
registerLocale('pt-BR', ptBR);

export default function SalesPage() {
  const { userPermissions, userData } = useAuth();
  const [selectedLoja, setSelectedLoja] = useState(null);
  const [sales, setSales] = useState([]);
  const [filteredSales, setFilteredSales] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  // Estados para filtros
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [clientFilter, setClientFilter] = useState("");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Estatísticas
  const [totalAmount, setTotalAmount] = useState(0);
  const [totalSales, setTotalSales] = useState(0);

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

  // Buscar vendas quando a loja for selecionada
  useEffect(() => {
    if (selectedLoja) {
      fetchSales();
    }
  }, [selectedLoja]);

  // Buscar vendas do Firebase
  const fetchSales = async () => {
    if (!selectedLoja) return;

    setIsLoading(true);
    try {
      const salesRef = collection(firestore, `lojas/${selectedLoja}/vendas/items/items`);
      const querySnapshot = await getDocs(query(salesRef, orderBy('createdAt', 'desc')));
      
      const salesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setSales(salesData);
      setFilteredSales(salesData);
      calculateStatistics(salesData);
    } catch (error) {
      console.error("Erro ao buscar vendas:", error);
      alert("Erro ao carregar vendas. Por favor, tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  // Calcular estatísticas
  const calculateStatistics = (salesData) => {
    const total = salesData.reduce((sum, sale) => {
      // Tentar vários campos possíveis para o valor
      const valor = sale.total || sale.valorTotal || sale.subtotal || 0;
      return sum + valor;
    }, 0);
    setTotalAmount(total);
    setTotalSales(salesData.length);
  };

  // Aplicar filtros
  const applyFilters = () => {
    let filtered = [...sales];

    // Filtrar por data
    if (startDate && endDate) {
      const startTimestamp = Timestamp.fromDate(startDate);
      const endTimestamp = Timestamp.fromDate(new Date(endDate.setHours(23, 59, 59, 999)));
      
      filtered = filtered.filter(sale => {
        // Tentar obter a data de vários campos possíveis
        const saleTimestamp = sale.data || sale.createdAt || sale.dataRegistro || null;
        if (!saleTimestamp) return false;
        
        const saleDate = saleTimestamp?.toDate ? saleTimestamp.toDate() : new Date(saleTimestamp);
        return saleDate >= startDate && saleDate <= endDate;
      });
    }

    // Filtrar por cliente
    if (clientFilter) {
      filtered = filtered.filter(sale => {
        // Verificar várias possibilidades para o nome do cliente
        const clientName = sale.cliente?.nome || sale.nomeCliente || sale.nome || '';
        return clientName.toLowerCase().includes(clientFilter.toLowerCase());
      });
    }

    // Filtrar por método de pagamento
    if (paymentMethodFilter) {
      filtered = filtered.filter(sale => {
        // Verificar várias possibilidades para o método de pagamento
        if (sale.pagamento_resumo?.metodos_utilizados?.includes(paymentMethodFilter)) {
          return true;
        }
        
        if (sale.pagamentos && sale.pagamentos.length > 0) {
          return sale.pagamentos.some(pagamento => 
            pagamento.dados_especificos?.metodo === paymentMethodFilter
          );
        }
        
        if (sale.formaPagamento === paymentMethodFilter) {
          return true;
        }
        
        return false;
      });
    }

    // Filtrar por status
    if (statusFilter) {
      filtered = filtered.filter(sale => {
        // Verificar várias possibilidades para o status
        const status = sale.status_venda || sale.status || '';
        return status === statusFilter;
      });
    }

    setFilteredSales(filtered);
    calculateStatistics(filtered);
  };

  // Resetar filtros
  const resetFilters = () => {
    setStartDate(null);
    setEndDate(null);
    setClientFilter("");
    setPaymentMethodFilter("");
    setStatusFilter("");
    setFilteredSales(sales);
    calculateStatistics(sales);
  };

  // Exportar para CSV
  const exportToCSV = () => {
    if (filteredSales.length === 0) {
      alert("Não há dados para exportar!");
      return;
    }

    // Criar cabeçalho do CSV
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "ID,Cliente,CPF,Valor,Forma de Pagamento,Data,Status\n";

    // Adicionar linhas de dados
    filteredSales.forEach(sale => {
      const saleDate = sale.data?.toDate ? sale.data.toDate() : new Date(sale.data);
      const formattedDate = format(saleDate, 'dd/MM/yyyy');
      
      // Determinar o método de pagamento
      let metodoPagamento = "N/A";
      if (sale.pagamento_resumo && sale.pagamento_resumo.metodos_utilizados && 
          sale.pagamento_resumo.metodos_utilizados.length > 0) {
        metodoPagamento = sale.pagamento_resumo.metodos_utilizados.join(", ");
      } else if (sale.pagamentos && sale.pagamentos.length > 0 && 
                sale.pagamentos[0].dados_especificos) {
        metodoPagamento = sale.pagamentos[0].dados_especificos.metodo;
      }
      
      const row = [
        sale.os_id || sale.id,
        (sale.cliente?.nome || "").replace(/,/g, " "),
        sale.cliente?.cpf || "",
        sale.total || 0,
        metodoPagamento.replace(/,/g, " "),
        formattedDate,
        sale.status_venda || ""
      ].join(",");
      csvContent += row + "\n";
    });

    // Criar elemento para download
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `vendas_${selectedLoja}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Imprimir relatório
  const printReport = () => {
    window.print();
  };

  // Renderizar nome da loja
  const renderLojaName = (lojaId) => {
    const lojaNames = {
      'loja1': 'Loja 1 - Centro',
      'loja2': 'Loja 2 - Caramuru'
    };

    return lojaNames[lojaId] || lojaId;
  };

  // Formatar valor monetário
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    }).format(value);
  };

  // Formatar CPF
  const formatCPF = (cpf) => {
    if (!cpf) return '';
    cpf = cpf.replace(/\D/g, '');
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  return (
    <Layout>
      <div className="min-h-screen">
        <div className="w-full max-w-6xl mx-auto rounded-lg">
          <h2 className="text-3xl font-bold text-[#81059e] mb-8 mt-8">VENDAS</h2>

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

          {/* Barra de Ações */}
          <div className="flex flex-wrap gap-2 justify-between mb-6">
            <div className="flex space-x-2">
              <Link href="/sales/add-sale">
                <button className="bg-[#81059e] p-3 rounded-sm text-white">
                  NOVA VENDA
                </button>
              </Link>
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className="bg-[#81059e] p-3 rounded-sm text-white flex items-center gap-2"
              >
                <FiFilter /> FILTROS
              </button>
            </div>
            <div className="flex space-x-2">
              <button 
                onClick={exportToCSV}
                className="bg-green-600 p-3 rounded-sm text-white flex items-center gap-2"
              >
                <FiDownload /> EXPORTAR
              </button>
              <button 
                onClick={printReport}
                className="bg-blue-600 p-3 rounded-sm text-white flex items-center gap-2"
              >
                <FiPrinter /> IMPRIMIR
              </button>
              <button 
                onClick={fetchSales}
                className="bg-gray-600 p-3 rounded-sm text-white flex items-center gap-2"
              >
                <FiRefreshCw /> ATUALIZAR
              </button>
            </div>
          </div>

          {/* Painel de Filtros */}
          {showFilters && (
            <div className="p-4 bg-gray-50 rounded-lg mb-6 border-2 border-[#81059e]">
              <h3 className="text-lg font-semibold text-[#81059e] mb-4 flex items-center gap-2">
                <FiFilter /> Filtros
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                <div>
                  <label className="text-[#81059e] font-medium flex items-center gap-2">
                    <FiCalendar /> Data Inicial
                  </label>
                  <DatePicker
                    selected={startDate}
                    onChange={setStartDate}
                    selectsStart
                    startDate={startDate}
                    endDate={endDate}
                    dateFormat="dd/MM/yyyy"
                    locale="pt-BR"
                    className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black"
                    placeholderText="Selecione a data inicial"
                  />
                </div>
                <div>
                  <label className="text-[#81059e] font-medium flex items-center gap-2">
                    <FiCalendar /> Data Final
                  </label>
                  <DatePicker
                    selected={endDate}
                    onChange={setEndDate}
                    selectsEnd
                    startDate={startDate}
                    endDate={endDate}
                    minDate={startDate}
                    dateFormat="dd/MM/yyyy"
                    locale="pt-BR"
                    className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black"
                    placeholderText="Selecione a data final"
                  />
                </div>
                <div>
                  <label className="text-[#81059e] font-medium flex items-center gap-2">
                    <FiUser /> Cliente
                  </label>
                  <input
                    type="text"
                    value={clientFilter}
                    onChange={(e) => setClientFilter(e.target.value)}
                    className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black"
                    placeholder="Nome do cliente"
                  />
                </div>
                <div>
                  <label className="text-[#81059e] font-medium flex items-center gap-2">
                    <FiDollarSign /> Forma de Pagamento
                  </label>
                  <select
                    value={paymentMethodFilter}
                    onChange={(e) => setPaymentMethodFilter(e.target.value)}
                    className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black"
                  >
                    <option value="">Todas</option>
                    <option value="dinheiro">Dinheiro</option>
                    <option value="cartao">Cartão</option>
                    <option value="pix">PIX</option>
                    <option value="boleto">Boleto</option>
                    <option value="transferencia">Transferência</option>
                  </select>
                </div>
                <div>
                  <label className="text-[#81059e] font-medium flex items-center gap-2">
                    <FiFileText /> Status
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black"
                  >
                    <option value="">Todos</option>
                    <option value="paga">Paga</option>
                    <option value="pendente">Pendente</option>
                    <option value="cancelada">Cancelada</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={resetFilters}
                  className="border-2 border-[#81059e] p-2 px-4 rounded-sm text-[#81059e]"
                >
                  Limpar Filtros
                </button>
                <button
                  onClick={applyFilters}
                  className="bg-[#81059e] p-2 px-4 rounded-sm text-white"
                >
                  Aplicar Filtros
                </button>
              </div>
            </div>
          )}

          {/* Resumo Estatístico */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-gradient-to-r from-purple-500 to-[#81059e] p-6 rounded-lg text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Total de Vendas</h3>
                  <p className="text-3xl font-bold">{totalSales}</p>
                </div>
                <FiFileText className="text-4xl opacity-70" />
              </div>
            </div>
            <div className="bg-gradient-to-r from-[#81059e] to-purple-800 p-6 rounded-lg text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Valor Total</h3>
                  <p className="text-3xl font-bold">{formatCurrency(totalAmount)}</p>
                </div>
                <FiDollarSign className="text-4xl opacity-70" />
              </div>
            </div>
          </div>

          {/* Tabela de Vendas */}
          <div className="bg-white shadow-md rounded-lg overflow-hidden mb-20">
            {isLoading ? (
              <div className="p-10 text-center">
                <p className="text-[#81059e] font-medium">Carregando vendas...</p>
              </div>
            ) : filteredSales.length === 0 ? (
              <div className="p-10 text-center">
                <p className="text-[#81059e] font-medium">Nenhuma venda encontrada</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-[#81059e]">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                        Código
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                        Cliente
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                        Valor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                        Forma Pagto
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                        Data
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredSales.map((sale, index) => {
                      // Verificar e extrair a data da venda - tentando vários campos possíveis
                      const saleTimestamp = sale.data || sale.createdAt || sale.dataRegistro || new Date();
                      const saleDate = saleTimestamp?.toDate ? 
                        saleTimestamp.toDate() : 
                        new Date(saleTimestamp);
                      
                      // Determinar o método de pagamento principal - tentando várias estruturas
                      let metodoPagamento = "N/A";
                      if (sale.pagamento_resumo && sale.pagamento_resumo.metodos_utilizados && 
                          sale.pagamento_resumo.metodos_utilizados.length > 0) {
                        metodoPagamento = sale.pagamento_resumo.metodos_utilizados.join(", ");
                      } else if (sale.pagamentos && sale.pagamentos.length > 0 && 
                                sale.pagamentos[0].dados_especificos) {
                        metodoPagamento = sale.pagamentos[0].dados_especificos.metodo;
                      } else if (sale.formaPagamento) {
                        metodoPagamento = sale.formaPagamento;
                      }
                      
                      // Determinar o status da venda - tentando vários campos possíveis
                      const status = sale.status_venda || sale.status || 'desconhecido';
                      
                      // Formatação condicional para o status
                      const statusClass = 
                        status === 'paga' || status === 'concluida' ? 'bg-green-100 text-green-800' : 
                        status === 'pendente' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-red-100 text-red-800';
                      
                      // Formatação texto do status
                      const statusText = 
                        status === 'paga' ? 'Paga' : 
                        status === 'concluida' ? 'Concluída' : 
                        status === 'pendente' ? 'Pendente' : 
                        status === 'cancelada' ? 'Cancelada' : 
                        'Desconhecido';
                      
                      return (
                        <tr key={sale.id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {sale.os_id || sale.codigo || sale.id.substring(0, 8)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div>{sale.cliente?.nome || sale.nome || "N/A"}</div>
                            <div className="text-xs text-gray-400">
                              {sale.cliente?.cpf ? formatCPF(sale.cliente.cpf) : 
                               sale.cpfCliente ? formatCPF(sale.cpfCliente) : ""}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatCurrency(sale.total || sale.valorTotal || sale.subtotal || 0)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {metodoPagamento}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {isNaN(saleDate) ? "Data inválida" : format(saleDate, 'dd/MM/yyyy')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass}`}>
                              {statusText}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <Link href={`/sales/view/${sale.id}`}>
                              <button className="text-[#81059e] hover:text-purple-900 mr-3">
                                Detalhes
                              </button>
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}