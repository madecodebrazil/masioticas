"use client";

import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { collection, getDocs, query, where, orderBy, addDoc, Timestamp, doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { firestore } from '@/lib/firebaseConfig';
import { useAuth } from '@/hooks/useAuth';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { FiCalendar, FiDollarSign, FiArrowUp, FiArrowDown, FiPrinter, FiRefreshCw, FiHome, FiFilter } from 'react-icons/fi';

export default function ControleCaixa() {
  const { userPermissions, userData } = useAuth();
  const [selectedLoja, setSelectedLoja] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dataInicio, setDataInicio] = useState(new Date());
  const [dataFim, setDataFim] = useState(new Date());
  const [movimentacoes, setMovimentacoes] = useState([]);
  const [saldoAnterior, setSaldoAnterior] = useState(0);
  const [saldoAtual, setSaldoAtual] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [tipoMovimentacao, setTipoMovimentacao] = useState('entrada');
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [meiosPagamento, setMeiosPagamento] = useState({
    dinheiro: 0,
    cartao_credito: 0,
    cartao_debito: 0,
    pix: 0,
    outros: 0
  });

  // Formulário de nova movimentação com os campos adicionais
  const [formData, setFormData] = useState({
    tipo: 'entrada',
    valor: '',
    data: new Date(),
    categoria: '',
    descricao: '',
    metodoPagamento: 'dinheiro',
    responsavel: userData?.nome || '',
    numeroDocumento: '', // Novo campo para N° do Documento
    caixa: 'principal', // Novo campo para Caixa
    numeroOS: '', // Novo campo para OS
  });

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

  // Buscar movimentações quando selectedLoja ou datas mudarem
  useEffect(() => {
    if (selectedLoja) {
      fetchMovimentacoes();
    }
  }, [selectedLoja, dataInicio, dataFim, filtroTipo]);

  const formatarData = (data) => {
    return new Date(data.setHours(0, 0, 0, 0));
  };

  const formatarDataFim = (data) => {
    const novaData = new Date(data);
    return new Date(novaData.setHours(23, 59, 59, 999));
  };

  const fetchMovimentacoes = async () => {
    if (!selectedLoja) return;

    setLoading(true);
    try {
      // Verificar se o documento de caixa existe
      const caixaDocRef = doc(firestore, `lojas/${selectedLoja}/financeiro/controle_caixa`);
      const docSnap = await getDoc(caixaDocRef);

      if (!docSnap.exists()) {
        // Criar documento de caixa se não existir
        await setDoc(caixaDocRef, {
          saldoAtual: 0,
          ultimaAtualizacao: Timestamp.now()
        });
      } else {
        // Obter saldo atual
        const caixaData = docSnap.data();
        setSaldoAtual(caixaData.saldoAtual || 0);
      }

      let movimentacoesQuery;
      const itemsRef = collection(firestore, `lojas/${selectedLoja}/financeiro/controle_caixa/items`);
      
      // Configurar a query base
      let baseQuery = query(
        itemsRef,
        where('data', '>=', formatarData(new Date(dataInicio))),
        where('data', '<=', formatarDataFim(new Date(dataFim)))
      );

      // Aplicar filtro por tipo se não for "todos"
      if (filtroTipo !== 'todos') {
        movimentacoesQuery = query(
          baseQuery,
          where('tipo', '==', filtroTipo),
          orderBy('data', 'desc')
        );
      } else {
        movimentacoesQuery = query(
          baseQuery,
          orderBy('data', 'desc')
        );
      }

      const querySnapshot = await getDocs(movimentacoesQuery);

      const movimentacoesData = [];
      const meiosPagamentoTemp = {
        dinheiro: 0,
        cartao_credito: 0,
        cartao_debito: 0,
        pix: 0,
        outros: 0
      };

      querySnapshot.forEach((doc) => {
        const movData = doc.data();
        const movItem = {
          id: doc.id,
          ...movData,
          data: movData.data ? new Date(movData.data.seconds * 1000) : new Date()
        };
        movimentacoesData.push(movItem);

        // Calcular totais por método de pagamento (apenas entradas)
        if (movItem.tipo === 'entrada') {
          const metodo = movItem.metodoPagamento || 'outros';
          if (meiosPagamentoTemp[metodo] !== undefined) {
            meiosPagamentoTemp[metodo] += parseFloat(movItem.valor || 0);
          } else {
            meiosPagamentoTemp.outros += parseFloat(movItem.valor || 0);
          }
        }
      });

      setMeiosPagamento(meiosPagamentoTemp);
      setMovimentacoes(movimentacoesData);

      // Calcular saldo anterior à data de início
      const saldoAnteriorQuery = query(
        collection(firestore, `lojas/${selectedLoja}/financeiro/controle_caixa/items`),
        where('data', '<', formatarData(new Date(dataInicio))),
      );

      const saldoAnteriorSnapshot = await getDocs(saldoAnteriorQuery);
      let saldoAnt = 0;

      saldoAnteriorSnapshot.forEach((doc) => {
        const movData = doc.data();
        if (movData.tipo === 'entrada') {
          saldoAnt += parseFloat(movData.valor || 0);
        } else if (movData.tipo === 'saida') {
          saldoAnt -= parseFloat(movData.valor || 0);
        }
      });

      setSaldoAnterior(saldoAnt);

    } catch (error) {
      console.error("Erro ao buscar movimentações:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleValorChange = (e) => {
    const valor = e.target.value.replace(/\D/g, '');
    setFormData(prev => ({
      ...prev,
      valor: valor ? (Number(valor) / 100) : ''
    }));
  };

  const abrirModal = (tipo) => {
    setTipoMovimentacao(tipo);
    setFormData(prev => ({
      ...prev,
      tipo: tipo,
      data: new Date(),
      responsavel: userData?.nome || '',
      numeroDocumento: '',
      caixa: 'principal',
      numeroOS: '',
    }));
    setShowModal(true);
  };

  const fecharModal = () => {
    setShowModal(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDataChange = (date) => {
    setFormData(prev => ({ ...prev, data: date }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedLoja) {
      alert("Selecione uma loja primeiro!");
      return;
    }

    if (!formData.valor || formData.valor <= 0) {
      alert("O valor deve ser maior que zero!");
      return;
    }

    setIsLoading(true);

    try {
      // Criar referência ao documento do caixa
      const caixaDocRef = doc(firestore, `lojas/${selectedLoja}/financeiro`, 'controle_caixa');

      // Obter dados atuais do caixa
      const caixaSnap = await getDoc(caixaDocRef);
      const caixaData = caixaSnap.exists() ? caixaSnap.data() : { saldoAtual: 0 };

      // Calcular novo saldo
      let novoSaldo = caixaData.saldoAtual || 0;
      if (formData.tipo === 'entrada') {
        novoSaldo += Number(formData.valor);
      } else {
        novoSaldo -= Number(formData.valor);
      }

      // Preparar dados para salvar, incluindo os novos campos
      const movimentacaoData = {
        tipo: formData.tipo,
        valor: Number(formData.valor),
        data: Timestamp.fromDate(formData.data),
        categoria: formData.categoria,
        descricao: formData.descricao,
        metodoPagamento: formData.metodoPagamento,
        responsavel: formData.responsavel,
        registradoPor: userData?.nome || 'Sistema',
        loja: selectedLoja,
        createdAt: Timestamp.now(),
        numeroDocumento: formData.numeroDocumento, // Novo campo
        caixa: formData.caixa, // Novo campo
        numeroOS: formData.numeroOS, // Novo campo
      };

      // Adicionar movimentação
      const movimentacoesCollectionRef = collection(firestore, `lojas/${selectedLoja}/financeiro/controle_caixa/items`);
      await addDoc(movimentacoesCollectionRef, movimentacaoData);

      // Atualizar saldo do caixa
      await updateDoc(caixaDocRef, {
        saldoAtual: novoSaldo,
        ultimaAtualizacao: Timestamp.now()
      });

      // Atualizar saldo na interface
      setSaldoAtual(novoSaldo);

      // Recarregar movimentações
      fetchMovimentacoes();

      // Fechar modal e limpar formulário
      setShowModal(false);
      setFormData({
        tipo: 'entrada',
        valor: '',
        data: new Date(),
        categoria: '',
        descricao: '',
        metodoPagamento: 'dinheiro',
        responsavel: userData?.nome || '',
        numeroDocumento: '',
        caixa: 'principal',
        numeroOS: '',
      });

      alert(formData.tipo === 'entrada' ? "Entrada registrada com sucesso!" : "Saída registrada com sucesso!");
    } catch (error) {
      console.error("Erro ao registrar movimentação:", error);
      alert("Erro ao registrar movimentação. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const calcularTotais = () => {
    let totalEntradas = 0;
    let totalSaidas = 0;

    movimentacoes.forEach(mov => {
      if (mov.tipo === 'entrada') {
        totalEntradas += parseFloat(mov.valor || 0);
      } else if (mov.tipo === 'saida') {
        totalSaidas += parseFloat(mov.valor || 0);
      }
    });

    const saldoPeriodo = totalEntradas - totalSaidas;

    return {
      totalEntradas,
      totalSaidas,
      saldoPeriodo
    };
  };

  const imprimirRelatorio = () => {
    window.print();
  };

  const { totalEntradas, totalSaidas, saldoPeriodo } = calcularTotais();

  const getCategorias = (tipo) => {
    if (tipo === 'entrada') {
      return [
        'Venda',
        'Recebimento',
        'Empréstimo',
        'Investimento',
        'Outro'
      ];
    } else {
      return [
        'Fornecedor',
        'Salário',
        'Aluguel',
        'Imposto',
        'Material de Escritório',
        'Manutenção',
        'Publicidade',
        'Outro'
      ];
    }
  };

  const renderLojaName = (lojaId) => {
    const lojaNames = {
      'loja1': 'Loja 1 - Centro',
      'loja2': 'Loja 2 - Caramuru'
    };

    return lojaNames[lojaId] || lojaId;
  };

  const formatarValor = (valor) => {
    return `R$ ${parseFloat(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatarDataExibicao = (data) => {
    return data.toLocaleDateString('pt-BR');
  };

  return (
    <Layout>
      <div className="min-h-screen">
        <div className="w-full max-w-6xl mx-auto rounded-lg">
          <h2 className="text-3xl font-bold text-[#81059e] mb-8 mt-8">CONTROLE DE CAIXA</h2>

          {/* Seletor de Loja para Admins - mais compacto */}
          {userPermissions?.isAdmin && (
            <div className="mb-4">
              <select
                value={selectedLoja || ''}
                onChange={(e) => setSelectedLoja(e.target.value)}
                className="border-2 border-[#81059e] p-2 rounded-lg w-full md:w-1/3 text-black"
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

          {/* Dashboard mais compacto */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">
            {/* Saldo Anterior */}
            <div className="bg-white shadow-sm rounded-md p-2 border-l-4 border-blue-500">
              <p className="text-gray-500 text-xs">Saldo Anterior</p>
              <p className="text-lg font-bold">{formatarValor(saldoAnterior)}</p>
            </div>

            {/* Entradas */}
            <div className="bg-white shadow-sm rounded-md p-2 border-l-4 border-green-500">
              <p className="text-gray-500 text-xs">Entradas</p>
              <p className="text-lg font-bold text-green-600">{formatarValor(totalEntradas)}</p>
            </div>

            {/* Saídas */}
            <div className="bg-white shadow-sm rounded-md p-2 border-l-4 border-red-500">
              <p className="text-gray-500 text-xs">Saídas</p>
              <p className="text-lg font-bold text-red-600">{formatarValor(totalSaidas)}</p>
            </div>

            {/* Dinheiro */}
            <div className="bg-white shadow-sm rounded-md p-2 border-l-4 border-yellow-500">
              <p className="text-gray-500 text-xs">Dinheiro</p>
              <p className="text-lg font-bold">{formatarValor(meiosPagamento.dinheiro)}</p>
            </div>

            {/* PIX */}
            <div className="bg-white shadow-sm rounded-md p-2 border-l-4 border-indigo-500">
              <p className="text-gray-500 text-xs">PIX</p>
              <p className="text-lg font-bold">{formatarValor(meiosPagamento.pix)}</p>
            </div>
          </div>

          {/* Barra de filtros (compacta) */}
          <div className="flex flex-wrap gap-2 mb-4">
            <div className="flex flex-grow flex-wrap md:flex-nowrap gap-2">
              <div className="flex items-center space-x-1 h-10 border rounded-lg px-2 bg-white flex-grow md:flex-grow-0">
                <FiCalendar className="text-[#81059e]" />
                <DatePicker
                  selected={dataInicio}
                  onChange={setDataInicio}
                  dateFormat="dd/MM/yyyy"
                  className="border-0 p-1 w-24 text-black text-sm"
                />
              </div>

              <div className="flex items-center space-x-1 h-10 border rounded-lg px-2 bg-white flex-grow md:flex-grow-0">
                <FiCalendar className="text-[#81059e]" />
                <DatePicker
                  selected={dataFim}
                  onChange={setDataFim}
                  dateFormat="dd/MM/yyyy"
                  className="border-0 p-1 w-24 text-black text-sm"
                />
              </div>

              <select
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
                className="h-10 border rounded-lg px-2 text-black text-sm bg-white"
              >
                <option value="todos">Todos</option>
                <option value="entrada">Entradas</option>
                <option value="saida">Saídas</option>
              </select>
            </div>

            <div className="flex gap-1">
              <button
                onClick={() => fetchMovimentacoes()}
                className="bg-gray-600 px-3 h-10 rounded-md text-white text-sm"
                title="Atualizar"
              >
                <FiRefreshCw />
              </button>

              <button
                onClick={imprimirRelatorio}
                className="bg-blue-600 px-3 h-10 rounded-md text-white text-sm"
                title="Imprimir"
              >
                <FiPrinter />
              </button>
            </div>
          </div>

          {/* Botões de Ação com Saldo Atual */}
          <div className="flex items-center mb-4">
            <div className="flex gap-2 mr-4">
              <button
                onClick={() => abrirModal('entrada')}
                className="bg-green-500 hover:bg-green-600 px-3 py-2 rounded-md text-white flex items-center gap-2 text-sm"
              >
                <FiArrowUp /> Nova Entrada
              </button>

              <button
                onClick={() => abrirModal('saida')}
                className="bg-red-500 hover:bg-red-600 px-3 py-2 rounded-md text-white flex items-center gap-2 text-sm"
              >
                <FiArrowDown /> Nova Saída
              </button>
            </div>
            
            <div className="flex items-center justify-center">
              <span className="text-[#81059e] text-base mr-1">Saldo Atual:</span>
              <span className="text-lg font-bold text-[#81059e]">R$ {(saldoAnterior + saldoPeriodo).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>

          {/* Tabela de Movimentações - Colunas ajustadas para melhor visualização */}
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto select-none">
              <thead className="bg-[#81059e] text-white">
                <tr>
                  <th className="px-4 py-3">Data</th>
                  <th className="px-4 py-3">Descrição</th>
                  <th className="px-4 py-3">Categoria</th>
                  <th className="px-4 py-3">Método</th>
                  <th className="px-4 py-3">Responsável</th>
                  <th className="px-4 py-3">Valor</th>
                  <th className="px-4 py-3">N° Documento</th>
                  <th className="px-4 py-3">Caixa</th>
                  <th className="px-4 py-3">O.S</th>
                </tr>
              </thead>
              <tbody className="text-black">
                {loading ? (
                  <tr>
                    <td colSpan="9" className="px-4 py-4 text-center">Carregando...</td>
                  </tr>
                ) : movimentacoes.length > 0 ? (
                  movimentacoes.map((mov) => (
                    <tr key={mov.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3">{formatarDataExibicao(mov.data)}</td>
                      <td className="px-4 py-3 min-w-[150px]">{mov.descricao}</td>
                      <td className="px-4 py-3">{mov.categoria}</td>
                      <td className="px-4 py-3">{mov.metodoPagamento}</td>
                      <td className="px-4 py-3">{mov.responsavel}</td>
                      <td className="px-4 py-3 text-right font-medium">
                        {mov.tipo === 'entrada' 
                          ? <span className="text-green-600">+ R$ {parseFloat(mov.valor).toFixed(2)}</span> 
                          : <span className="text-red-600">- R$ {parseFloat(mov.valor).toFixed(2)}</span>
                        }
                      </td>
                      <td className="px-4 py-3">{mov.numeroDocumento || '-'}</td>
                      <td className="px-4 py-3">{mov.caixa || 'Principal'}</td>
                      <td className="px-4 py-3">{mov.numeroOS || '-'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="9" className="px-4 py-4 text-center">Nenhuma movimentação encontrada.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal para Nova Movimentação - Com os novos campos */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md text-black overflow-y-auto max-h-[90vh]">
            {/* Cabeçalho do Modal */}
            <div className="bg-[#81059e] text-white py-2 px-4">
              <h3 className="text-lg font-bold">
                {tipoMovimentacao === 'entrada' ? 'Nova Entrada de Caixa' : 'Nova Saída de Caixa'}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="p-4">
              <div className="space-y-3">
                {/* Valor */}
                <div className="mb-3">
                  <label className="block text-[#81059e] text-sm font-medium mb-1">Valor</label>
                  <div className="relative">
                    <span className="absolute left-2 top-2.5 text-gray-600">R$</span>
                    <input
                      type="text"
                      name="valor"
                      value={formData.valor ? formatarValor(formData.valor).replace('R$', '').trim() : ''}
                      onChange={handleValorChange}
                      className="border border-[#81059e] p-2 pl-8 rounded w-full text-black"
                      placeholder="0,00"
                      required
                    />
                  </div>
                </div>

                {/* Data */}
                <div className="mb-3">
                  <label className="block text-[#81059e] text-sm font-medium mb-1">Data</label>
                  <DatePicker
                    selected={formData.data}
                    onChange={handleDataChange}
                    dateFormat="dd/MM/yyyy"
                    className="border border-[#81059e] p-2 rounded w-full text-black"
                  />
                </div>

                {/* Categoria */}
                <div className="mb-3">
                  <label className="block text-[#81059e] text-sm font-medium mb-1">Categoria</label>
                  <select
                    name="categoria"
                    value={formData.categoria}
                    onChange={handleInputChange}
                    className="border border-[#81059e] p-2 rounded w-full text-black"
                    required
                  >
                    <option value="">Selecione</option>
                    {getCategorias(formData.tipo).map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Método de Pagamento */}
                <div className="mb-3">
                  <label className="block text-[#81059e] text-sm font-medium mb-1">Método de Pagamento</label>
                  <select
                    name="metodoPagamento"
                    value={formData.metodoPagamento}
                    onChange={handleInputChange}
                    className="border border-[#81059e] p-2 rounded w-full text-black"
                    required
                  >
                    <option value="dinheiro">Dinheiro</option>
                    <option value="cartao_debito">Cartão de Débito</option>
                    <option value="cartao_credito">Cartão de Crédito</option>
                    <option value="pix">PIX</option>
                    <option value="transferencia">Transferência</option>
                    <option value="cheque">Cheque</option>
                    <option value="boleto">Boleto</option>
                  </select>
                </div>

                {/* Número do Documento - Novo Campo */}
                <div className="mb-3">
                  <label className="block text-[#81059e] text-sm font-medium mb-1">N° do Documento</label>
                  <input
                    type="text"
                    name="numeroDocumento"
                    value={formData.numeroDocumento}
                    onChange={handleInputChange}
                    className="border border-[#81059e] p-2 rounded w-full text-black"
                    placeholder="Ex: NF12345"
                  />
                </div>

                {/* Caixa - Novo Campo */}
                <div className="mb-3">
                  <label className="block text-[#81059e] text-sm font-medium mb-1">Caixa</label>
                  <select
                    name="caixa"
                    value={formData.caixa}
                    onChange={handleInputChange}
                    className="border border-[#81059e] p-2 rounded w-full text-black"
                    required
                  >
                    <option value="principal">Principal</option>
                    <option value="secundario">Secundário</option>
                    <option value="reserva">Reserva</option>
                  </select>
                </div>

                {/* Número OS - Novo Campo (condicionalmente exibido) */}
                {(formData.tipo === 'entrada' && formData.categoria === 'Venda') && (
                  <div className="mb-3">
                    <label className="block text-[#81059e] text-sm font-medium mb-1">
                      Número da O.S
                      <span className="text-xs text-gray-500 ml-1">(Apenas para vendas)</span>
                    </label>
                    <input
                      type="text"
                      name="numeroOS"
                      value={formData.numeroOS}
                      onChange={handleInputChange}
                      className="border border-[#81059e] p-2 rounded w-full text-black"
                      placeholder="Ex: OS-2025-001"
                    />
                  </div>
                )}

                {/* Responsável */}
                <div className="mb-3">
                  <label className="block text-[#81059e] text-sm font-medium mb-1">Responsável</label>
                  <input
                    type="text"
                    name="responsavel"
                    value={formData.responsavel}
                    onChange={handleInputChange}
                    className="border border-[#81059e] p-2 rounded w-full text-black bg-gray-100"
                    required
                    readOnly
                  />
                </div>

                {/* Descrição */}
                <div className="mb-3">
                  <label className="block text-[#81059e] text-sm font-medium mb-1">Descrição</label>
                  <textarea
                    name="descricao"
                    value={formData.descricao}
                    onChange={handleInputChange}
                    className="border border-[#81059e] p-2 rounded w-full text-black h-20"
                    placeholder="Adicione uma descrição detalhada..."
                    required
                  ></textarea>
                </div>
              </div>

              {/* Botões do Modal */}
              <div className="flex justify-between mt-4 pt-2 border-t border-gray-200">
                <button
                  type="button"
                  onClick={fecharModal}
                  className="px-4 py-2 border border-gray-300 rounded text-gray-700 bg-white hover:bg-gray-50"
                  disabled={isLoading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 rounded text-white ${
                    formData.tipo === 'entrada' 
                      ? 'bg-green-500 hover:bg-green-600' 
                      : 'bg-red-500 hover:bg-red-600'
                  }`}
                  disabled={isLoading}
                >
                  {isLoading ? 'Salvando...' : 'Confirmar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}