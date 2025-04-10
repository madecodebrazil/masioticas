"use client";
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { collection, query, getDocs, where, orderBy } from 'firebase/firestore';
import { firestore } from '@/lib/firebaseConfig';
import Layout from '@/components/Layout';
import { 
  FiPieChart, 
  FiBarChart2, 
  FiArrowUp, 
  FiArrowDown, 
  FiDollarSign, 
  FiCalendar, 
  FiFilter, 
  FiDownload, 
  FiRefreshCw,
  FiTrendingUp,
  FiUsers,
  FiPackage
} from 'react-icons/fi';

const RelatorioVendas = () => {
  const { user, userData, userPermissions, loading, hasAccessToLoja } = useAuth();
  const [vendas, setVendas] = useState([]);
  const [filteredVendas, setFilteredVendas] = useState([]);
  const [selectedLoja, setSelectedLoja] = useState('');
  const [periodoFilter, setPeriodoFilter] = useState('30dias');
  const [formasPagamento, setFormasPagamento] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategoria, setSelectedCategoria] = useState('todas');
  
  // Métricas
  const [totalVendas, setTotalVendas] = useState(0);
  const [ticketMedio, setTicketMedio] = useState(0);
  const [totalItens, setTotalItens] = useState(0);
  const [maiorVenda, setMaiorVenda] = useState(0);
  const [vendaPorDia, setVendaPorDia] = useState([]);

  // Determinar loja inicial com base nas permissões
  useEffect(() => {
    if (!loading && userPermissions) {
      if (userPermissions.isAdmin && userPermissions.lojas.length > 0) {
        setSelectedLoja(userPermissions.lojas[0]);
      } else if (!userPermissions.isAdmin && userPermissions.lojas.length > 0) {
        setSelectedLoja(userPermissions.lojas[0]);
      }
    }
  }, [userPermissions, loading]);

  // Buscar vendas quando a loja for selecionada
  useEffect(() => {
    const fetchVendas = async () => {
      if (!selectedLoja) return;
      
      setIsLoading(true);
      try {
        const vendasRef = collection(firestore, `lojas/${selectedLoja}/vendas/items/items`);
        const vendasQuery = query(vendasRef, orderBy('dataVenda', 'desc'));
        
        const querySnapshot = await getDocs(vendasQuery);
        const vendasData = [];
        
        querySnapshot.forEach((doc) => {
          vendasData.push({
            id: doc.id,
            ...doc.data(),
            dataVenda: doc.data().dataVenda?.toDate() || new Date()
          });
        });
        
        setVendas(vendasData);
        filterVendas(vendasData, periodoFilter, selectedCategoria);
        setIsLoading(false);
      } catch (error) {
        console.error("Erro ao buscar vendas:", error);
        setIsLoading(false);
      }
    };
    
    fetchVendas();
  }, [selectedLoja]);

  // Filtrar vendas por período e categoria
  const filterVendas = (vendasData, periodo, categoria) => {
    const hoje = new Date();
    let dataInicial = new Date();
    
    switch (periodo) {
      case '7dias':
        dataInicial.setDate(hoje.getDate() - 7);
        break;
      case '30dias':
        dataInicial.setDate(hoje.getDate() - 30);
        break;
      case '90dias':
        dataInicial.setDate(hoje.getDate() - 90);
        break;
      case 'ano':
        dataInicial.setFullYear(hoje.getFullYear(), 0, 1);
        break;
      default:
        dataInicial.setDate(hoje.getDate() - 30);
    }
    
    let vendasFiltradas = vendasData.filter(venda => venda.dataVenda >= dataInicial);
    
    if (categoria !== 'todas') {
      vendasFiltradas = vendasFiltradas.filter(venda => venda.categoria === categoria);
    }
    
    setFilteredVendas(vendasFiltradas);
    calcularMetricas(vendasFiltradas);
  };

  // Recalcular métricas quando os filtros mudarem
  useEffect(() => {
    filterVendas(vendas, periodoFilter, selectedCategoria);
  }, [periodoFilter, selectedCategoria]);

  const calcularMetricas = (vendasFiltradas) => {
    // Total de vendas
    const total = vendasFiltradas.reduce((acc, venda) => acc + (venda.valorTotal || 0), 0);
    setTotalVendas(total);
    
    // Ticket médio
    setTicketMedio(vendasFiltradas.length > 0 ? total / vendasFiltradas.length : 0);
    
    // Total de itens vendidos
    const itens = vendasFiltradas.reduce((acc, venda) => acc + (venda.quantidadeItens || 1), 0);
    setTotalItens(itens);
    
    // Maior venda
    const maior = vendasFiltradas.reduce((max, venda) => 
      Math.max(max, venda.valorTotal || 0), 0);
    setMaiorVenda(maior);
    
    // Formas de pagamento
    const formas = {};
    vendasFiltradas.forEach(venda => {
      if (venda.formaPagamento) {
        formas[venda.formaPagamento] = (formas[venda.formaPagamento] || 0) + (venda.valorTotal || 0);
      }
    });
    setFormasPagamento(formas);
    
    // Vendas por dia
    const vendasPorDia = {};
    vendasFiltradas.forEach(venda => {
      const dataStr = venda.dataVenda.toISOString().split('T')[0];
      vendasPorDia[dataStr] = (vendasPorDia[dataStr] || 0) + (venda.valorTotal || 0);
    });
    
    const ultimosDias = Object.keys(vendasPorDia)
      .sort()
      .slice(-10)
      .map(data => ({
        data: formatarData(data),
        valor: vendasPorDia[data]
      }));
    
    setVendaPorDia(ultimosDias);
  };

  const formatarData = (dataString) => {
    const data = new Date(dataString);
    return `${data.getDate()}/${data.getMonth() + 1}`;
  };

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const handleExportarCSV = () => {
    // Preparar os dados
    const linhas = [
      ['ID', 'Data', 'Cliente', 'Valor Total', 'Itens', 'Forma de Pagamento', 'Categoria']
    ];
    
    filteredVendas.forEach(venda => {
      linhas.push([
        venda.id,
        venda.dataVenda.toLocaleDateString('pt-BR'),
        venda.cliente?.nome || 'N/A',
        venda.valorTotal,
        venda.quantidadeItens || 1,
        venda.formaPagamento || 'N/A',
        venda.categoria || 'N/A'
      ]);
    });
    
    // Converter para CSV
    const csv = linhas.map(linha => linha.join(',')).join('\n');
    
    // Criar e baixar o arquivo
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio_vendas_${selectedLoja}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <Layout>
    <div className="min-h-screen mb-20">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#81059e] mb-8 mt-8">RELATÓRIO DE VENDAS</h1>
        <p className="text-gray-600">
          Análise financeira e métricas de desempenho de vendas
        </p>
      </div>
      
      {/* Seletor de loja para admin */}
      {userPermissions?.isAdmin && userPermissions.lojas.length > 1 && (
        <div className="mb-6 bg-white p-4 rounded-lg shadow-sm">
          <label className="block text-sm font-medium text-gray-700 mb-2">Selecione a Loja:</label>
          <select
            value={selectedLoja}
            onChange={(e) => setSelectedLoja(e.target.value)}
            className="block w-full md:w-64 p-2 border border-gray-300 rounded-md"
          >
            {userPermissions.lojas.map((loja) => (
              <option key={loja} value={loja}>
                {loja === 'loja1' ? 'Loja Centro' : 'Loja Shopping'}
              </option>
            ))}
          </select>
        </div>
      )}
      
      {/* Filtros */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow-sm flex flex-col md:flex-row md:items-center md:space-x-4">
        <div className="mb-4 md:mb-0">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <FiCalendar className="inline mr-1" /> Período:
          </label>
          <select
            value={periodoFilter}
            onChange={(e) => setPeriodoFilter(e.target.value)}
            className="block w-full p-2 border border-gray-300 rounded-md"
          >
            <option value="7dias">Últimos 7 dias</option>
            <option value="30dias">Últimos 30 dias</option>
            <option value="90dias">Últimos 90 dias</option>
            <option value="ano">Ano atual</option>
          </select>
        </div>
        
        <div className="mb-4 md:mb-0">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <FiFilter className="inline mr-1" /> Categoria:
          </label>
          <select
            value={selectedCategoria}
            onChange={(e) => setSelectedCategoria(e.target.value)}
            className="block w-full p-2 border border-gray-300 rounded-md"
          >
            <option value="todas">Todas as categorias</option>
            <option value="oculos">Óculos</option>
            <option value="lentes">Lentes</option>
            <option value="solares">Solares</option>
            <option value="acessorios">Acessórios</option>
          </select>
        </div>
        
        <div className="flex items-center space-x-2 mt-4 md:mt-0 md:ml-auto">
          <button
            onClick={handleExportarCSV}
            className="px-4 py-2 bg-green-600 text-white rounded-md flex items-center"
          >
            <FiDownload className="mr-2" /> Exportar CSV
          </button>
          <button
            onClick={() => filterVendas(vendas, periodoFilter, selectedCategoria)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md flex items-center"
          >
            <FiRefreshCw className="mr-2" /> Atualizar
          </button>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          {/* Cards de Métricas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-gray-500 text-sm font-medium">Total de Vendas</h3>
                <FiDollarSign className="text-blue-500" />
              </div>
              <p className="text-2xl font-bold text-gray-800">{formatarMoeda(totalVendas)}</p>
              <p className="text-sm text-gray-500 mt-1">
                {filteredVendas.length} transações
              </p>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-gray-500 text-sm font-medium">Ticket Médio</h3>
                <FiTrendingUp className="text-green-500" />
              </div>
              <p className="text-2xl font-bold text-gray-800">{formatarMoeda(ticketMedio)}</p>
              <p className="text-sm text-gray-500 mt-1">
                Por transação
              </p>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-gray-500 text-sm font-medium">Itens Vendidos</h3>
                <FiPackage className="text-purple-500" />
              </div>
              <p className="text-2xl font-bold text-gray-800">{totalItens}</p>
              <p className="text-sm text-gray-500 mt-1">
                Total de produtos
              </p>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-gray-500 text-sm font-medium">Maior Venda</h3>
                <FiArrowUp className="text-red-500" />
              </div>
              <p className="text-2xl font-bold text-gray-800">{formatarMoeda(maiorVenda)}</p>
              <p className="text-sm text-gray-500 mt-1">
                Valor máximo
              </p>
            </div>
          </div>
          
          {/* Gráficos e Tabelas */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Vendas por Método de Pagamento */}
            <div className="bg-white p-4 rounded-lg shadow-sm lg:col-span-1">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-gray-800">Vendas por Forma de Pagamento</h3>
                <FiPieChart className="text-blue-500" />
              </div>
              
              <div className="space-y-2">
                {Object.keys(formasPagamento).length > 0 ? (
                  Object.entries(formasPagamento).map(([forma, valor]) => (
                    <div key={forma} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div 
                          className="w-3 h-3 rounded-full mr-2" 
                          style={{ 
                            backgroundColor: 
                              forma === 'cartao_credito' ? '#4338CA' : 
                              forma === 'cartao_debito' ? '#3B82F6' : 
                              forma === 'dinheiro' ? '#10B981' : 
                              forma === 'pix' ? '#6366F1' : '#9333EA'
                          }}
                        ></div>
                        <span className="text-sm text-gray-600">
                          {forma === 'cartao_credito' ? 'Cartão de Crédito' : 
                           forma === 'cartao_debito' ? 'Cartão de Débito' : 
                           forma === 'dinheiro' ? 'Dinheiro' : 
                           forma === 'pix' ? 'PIX' : 
                           forma}
                        </span>
                      </div>
                      <span className="font-medium text-gray-800">{formatarMoeda(valor)}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">Nenhum dado disponível</p>
                )}
              </div>
            </div>
            
            {/* Gráfico de Vendas recentes */}
            <div className="bg-white p-4 rounded-lg shadow-sm lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-gray-800">Vendas dos Últimos 10 Dias</h3>
                <FiBarChart2 className="text-blue-500" />
              </div>
              
              <div className="h-64 flex items-end space-x-2">
                {vendaPorDia.length > 0 ? (
                  vendaPorDia.map((dia, index) => {
                    const maxValor = Math.max(...vendaPorDia.map(d => d.valor));
                    const altura = (dia.valor / maxValor) * 100;
                    
                    return (
                      <div key={index} className="flex flex-col items-center flex-1">
                        <div 
                          className="w-full bg-blue-500 rounded-t transition-all duration-300 hover:bg-blue-600"
                          style={{ height: `${altura}%` }}
                        ></div>
                        <div className="text-xs text-gray-500 mt-1">{dia.data}</div>
                      </div>
                    );
                  })
                ) : (
                  <div className="w-full flex items-center justify-center">
                    <p className="text-gray-500">Nenhum dado disponível</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Tabela de Vendas Recentes */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-medium text-gray-800">Vendas Recentes</h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Forma de Pagamento
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Categoria
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredVendas.slice(0, 10).map((venda) => (
                    <tr key={venda.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {venda.dataVenda.toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center">
                            <FiUsers className="text-gray-500" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {venda.cliente?.nome || 'Cliente não registrado'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatarMoeda(venda.valorTotal || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {venda.formaPagamento === 'cartao_credito' ? 'Cartão de Crédito' :
                         venda.formaPagamento === 'cartao_debito' ? 'Cartão de Débito' :
                         venda.formaPagamento === 'dinheiro' ? 'Dinheiro' :
                         venda.formaPagamento === 'pix' ? 'PIX' :
                         venda.formaPagamento || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          venda.categoria === 'oculos' ? 'bg-blue-100 text-blue-800' :
                          venda.categoria === 'lentes' ? 'bg-green-100 text-green-800' :
                          venda.categoria === 'solares' ? 'bg-yellow-100 text-yellow-800' :
                          venda.categoria === 'acessorios' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {venda.categoria || 'N/A'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  
                  {filteredVendas.length === 0 && (
                    <tr>
                      <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                        Nenhuma venda encontrada para o período selecionado
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {filteredVendas.length > 10 && (
              <div className="p-4 border-t border-gray-200 text-right">
                <span className="text-sm text-gray-500">
                  Mostrando 10 de {filteredVendas.length} vendas
                </span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
    </Layout>
  );
};

export default RelatorioVendas;