// components/HistoricoPagamentos.js
import { useState, useEffect } from 'react';
import {
    collection,
    query,
    orderBy,
    limit,
    getDocs,
    doc,
    getDoc,
    where
} from 'firebase/firestore';
import { firestore } from '@/lib/firebaseConfig';
import {
    FiDollarSign,
    FiSearch,
    FiCalendar,
    FiFilter,
    FiDownload,
    FiCreditCard,
    FiFileText,
    FiArrowUp,
    FiArrowDown,
    FiCheckCircle,
    FiXCircle
} from 'react-icons/fi';

const HistoricoPagamentos = ({ selectedLoja }) => {
    const [transacoes, setTransacoes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filtroTipo, setFiltroTipo] = useState('todos');
    const [filtroMetodo, setFiltroMetodo] = useState('todos');
    const [dataInicio, setDataInicio] = useState('');
    const [dataFim, setDataFim] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [ordenacao, setOrdenacao] = useState('data_desc');
    const [periodoAtivo, setPeriodoAtivo] = useState('ultimos7');

    useEffect(() => {
        if (!selectedLoja) return;

        // Definir datas padrão
        const hoje = new Date();
        const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        const seteDiasAtras = new Date(hoje);
        seteDiasAtras.setDate(hoje.getDate() - 7);

        if (periodoAtivo === 'ultimos7') {
            setDataInicio(seteDiasAtras.toISOString().split('T')[0]);
        } else if (periodoAtivo === 'mes') {
            setDataInicio(inicioMes.toISOString().split('T')[0]);
        } else if (periodoAtivo === 'tudo') {
            setDataInicio('');
        }

        setDataFim(hoje.toISOString().split('T')[0]);

        // Buscar transações quando o período muda
        buscarTransacoes();
    }, [selectedLoja, periodoAtivo]);

    // Buscar transações ao modificar filtros
    useEffect(() => {
        if (selectedLoja) {
            buscarTransacoes();
        }
    }, [filtroTipo, filtroMetodo, ordenacao, dataInicio, dataFim]);

    const buscarTransacoes = async () => {
        try {
            setLoading(true);

            // Buscar movimentações do caixa
            const caixaRef = collection(firestore, `lojas/${selectedLoja}/financeiro/controle_caixa/items`);

            // Construir a query com filtros
            let caixaQuery = query(caixaRef);

            // Aplicar filtro de data
            if (dataInicio) {
                const dataInicioObj = new Date(dataInicio);
                dataInicioObj.setHours(0, 0, 0, 0);
                caixaQuery = query(caixaQuery, where('data', '>=', dataInicioObj));
            }

            if (dataFim) {
                const dataFimObj = new Date(dataFim);
                dataFimObj.setHours(23, 59, 59, 999);
                caixaQuery = query(caixaQuery, where('data', '<=', dataFimObj));
            }

            // Aplicar filtro de tipo (entrada/saída)
            if (filtroTipo !== 'todos') {
                caixaQuery = query(caixaQuery, where('tipo', '==', filtroTipo));
            }

            // Aplicar filtro de método de pagamento
            if (filtroMetodo !== 'todos') {
                caixaQuery = query(caixaQuery, where('formaPagamento', '==', filtroMetodo));
            }

            // Aplicar ordenação
            if (ordenacao === 'data_desc') {
                caixaQuery = query(caixaQuery, orderBy('data', 'desc'));
            } else if (ordenacao === 'data_asc') {
                caixaQuery = query(caixaQuery, orderBy('data', 'asc'));
            } else if (ordenacao === 'valor_desc') {
                caixaQuery = query(caixaQuery, orderBy('valor', 'desc'));
            } else if (ordenacao === 'valor_asc') {
                caixaQuery = query(caixaQuery, orderBy('valor', 'asc'));
            }

            // Limitar resultados para melhor performance
            caixaQuery = query(caixaQuery, limit(100));

            const caixaSnapshot = await getDocs(caixaQuery);

            // Processar resultados
            const transacoesPromises = caixaSnapshot.docs.map(async (docCaixa) => {
                const transacao = {
                    id: docCaixa.id,
                    ...docCaixa.data(),
                    origem: 'caixa'
                };

                // Se houver uma venda relacionada, buscar informações
                if (transacao.vendaId) {
                    try {
                        const vendaDoc = await getDoc(doc(firestore, `lojas/${selectedLoja}/vendas/items/${transacao.vendaId}`));
                        if (vendaDoc.exists()) {
                            transacao.venda = vendaDoc.data();
                        }
                    } catch (err) {
                        console.error('Erro ao buscar venda:', err);
                    }
                }

                return transacao;
            });

            const transacoesProcessadas = await Promise.all(transacoesPromises);

            // Filtrar por termo de busca se necessário
            const transacoesFiltradas = searchTerm
                ? transacoesProcessadas.filter(tr =>
                    tr.descricao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    tr.venda?.cliente?.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    tr.vendaId?.includes(searchTerm)
                )
                : transacoesProcessadas;

            setTransacoes(transacoesFiltradas);
        } catch (err) {
            console.error('Erro ao buscar transações:', err);
            setError('Falha ao carregar histórico de pagamentos');
        } finally {
            setLoading(false);
        }
    };

    // Formatar data
    const formatarData = (timestamp) => {
        if (!timestamp) return 'N/A';

        const data = timestamp instanceof Date ?
            timestamp :
            new Date(timestamp.seconds ? timestamp.seconds * 1000 : timestamp);

        return data.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Formatar valor monetário
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    // Exportar dados para CSV
    const exportarCSV = () => {
        if (transacoes.length === 0) return;

        // Cabeçalhos CSV
        const headers = [
            'ID',
            'Data',
            'Tipo',
            'Descrição',
            'Método de Pagamento',
            'Valor',
            'Registrado Por',
            'Venda ID',
            'Observação'
        ];

        // Preparar os dados
        const rows = transacoes.map(tr => [
            tr.id,
            formatarData(tr.data),
            tr.tipo,
            tr.descricao,
            tr.formaPagamento,
            tr.valor,
            tr.registradoPor?.nome || '',
            tr.vendaId || '',
            tr.observacao || ''
        ]);

        // Combinar cabeçalhos e dados
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => {
                // Escapar aspas e adicionar aspas para células com vírgulas
                const cellStr = String(cell || '');
                if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
                    return `"${cellStr.replace(/"/g, '""')}"`;
                }
                return cellStr;
            }).join(','))
        ].join('\n');

        // Criar blob e link para download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `historico_pagamentos_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Calcular totais
    const calcularTotais = () => {
        const entradas = transacoes
            .filter(tr => tr.tipo === 'entrada')
            .reduce((total, tr) => total + (tr.valor || 0), 0);

        const saidas = transacoes
            .filter(tr => tr.tipo === 'saida')
            .reduce((total, tr) => total + (tr.valor || 0), 0);

        const saldo = entradas - saidas;

        return { entradas, saidas, saldo };
    };

    const { entradas, saidas, saldo } = calcularTotais();

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-[#81059e] flex items-center">
                    <FiDollarSign className="mr-2" /> Histórico de Pagamentos
                </h2>

                <button
                    onClick={exportarCSV}
                    disabled={transacoes.length === 0 || loading}
                    className="flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-[#81059e] rounded-md hover:bg-[#6f0486] disabled:bg-purple-300 disabled:cursor-not-allowed"
                >
                    <FiDownload className="mr-2" /> Exportar
                </button>
            </div>

            {error && (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
                    <p>{error}</p>
                </div>
            )}

            {/* Filtros e Período */}
            <div className="mb-6">
                <div className="flex flex-col md:flex-row gap-4 mb-4">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            <FiFilter className="inline mr-1" /> Tipo de Transação
                        </label>
                        <select
                            value={filtroTipo}
                            onChange={(e) => setFiltroTipo(e.target.value)}
                            className="w-full border border-gray-300 rounded-md p-2"
                        >
                            <option value="todos">Todos</option>
                            <option value="entrada">Entradas</option>
                            <option value="saida">Saídas</option>
                        </select>
                    </div>

                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            <FiCreditCard className="inline mr-1" /> Método de Pagamento
                        </label>
                        <select
                            value={filtroMetodo}
                            onChange={(e) => setFiltroMetodo(e.target.value)}
                            className="w-full border border-gray-300 rounded-md p-2"
                        >
                            <option value="todos">Todos</option>
                            <option value="dinheiro">Dinheiro</option>
                            <option value="cartao">Cartão</option>
                            <option value="pix">PIX</option>
                            <option value="boleto">Boleto</option>
                            <option value="ted">TED</option>
                            <option value="crediario">Crediário</option>
                        </select>
                    </div>

                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            <FiSearch className="inline mr-1" /> Buscar
                        </label>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyUp={(e) => {
                                if (e.key === 'Enter') {
                                    buscarTransacoes();
                                }
                            }}
                            placeholder="Descrição, cliente, ID..."
                            className="w-full border border-gray-300 rounded-md p-2"
                        />
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            <FiCalendar className="inline mr-1" /> Período
                        </label>
                        <div className="grid grid-cols-4 gap-2">
                            <button
                                onClick={() => setPeriodoAtivo('ultimos7')}
                                className={`px-3 py-2 text-sm font-medium rounded-md ${periodoAtivo === 'ultimos7'
                                        ? 'bg-[#81059e] text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                Últimos 7 dias
                            </button>
                            <button
                                onClick={() => setPeriodoAtivo('mes')}
                                className={`px-3 py-2 text-sm font-medium rounded-md ${periodoAtivo === 'mes'
                                        ? 'bg-[#81059e] text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                Este mês
                            </button>
                            <button
                                onClick={() => setPeriodoAtivo('tudo')}
                                className={`px-3 py-2 text-sm font-medium rounded-md ${periodoAtivo === 'tudo'
                                        ? 'bg-[#81059e] text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                Todo o período
                            </button>
                            <button
                                onClick={() => setPeriodoAtivo('personalizado')}
                                className={`px-3 py-2 text-sm font-medium rounded-md ${periodoAtivo === 'personalizado'
                                        ? 'bg-[#81059e] text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                Personalizado
                            </button>
                        </div>
                    </div>

                    {periodoAtivo === 'personalizado' && (
                        <div className="flex-1 flex gap-4">
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">De</label>
                                <input
                                    type="date"
                                    value={dataInicio}
                                    onChange={(e) => setDataInicio(e.target.value)}
                                    className="w-full border border-gray-300 rounded-md p-2"
                                />
                            </div>
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Até</label>
                                <input
                                    type="date"
                                    value={dataFim}
                                    onChange={(e) => setDataFim(e.target.value)}
                                    className="w-full border border-gray-300 rounded-md p-2"
                                />
                            </div>
                        </div>
                    )}

                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Ordenar por
                        </label>
                        <select
                            value={ordenacao}
                            onChange={(e) => setOrdenacao(e.target.value)}
                            className="w-full border border-gray-300 rounded-md p-2"
                        >
                            <option value="data_desc">Data (mais recente)</option>
                            <option value="data_asc">Data (mais antiga)</option>
                            <option value="valor_desc">Valor (maior)</option>
                            <option value="valor_asc">Valor (menor)</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Cards de Resumo */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-green-50 border border-green-100 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-green-700 font-medium">Total de Entradas</h3>
                        <FiArrowDown className="h-5 w-5 text-green-600" />
                    </div>
                    <p className="text-2xl font-bold text-green-600 mt-2">{formatCurrency(entradas)}</p>
                </div>

                <div className="bg-red-50 border border-red-100 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-red-700 font-medium">Total de Saídas</h3>
                        <FiArrowUp className="h-5 w-5 text-red-600" />
                    </div>
                    <p className="text-2xl font-bold text-red-600 mt-2">{formatCurrency(saidas)}</p>
                </div>

                <div className={`${saldo >= 0 ? 'bg-blue-50 border-blue-100' : 'bg-orange-50 border-orange-100'} border rounded-lg p-4`}>
                    <div className="flex items-center justify-between">
                        <h3 className={`${saldo >= 0 ? 'text-blue-700' : 'text-orange-700'} font-medium`}>Saldo</h3>
                        {saldo >= 0 ? (
                            <FiCheckCircle className="h-5 w-5 text-blue-600" />
                        ) : (
                            <FiXCircle className="h-5 w-5 text-orange-600" />
                        )}
                    </div>
                    <p className={`text-2xl font-bold ${saldo >= 0 ? 'text-blue-600' : 'text-orange-600'} mt-2`}>
                        {formatCurrency(saldo)}
                    </p>
                </div>
            </div>

            {/* Tabela de Transações */}
            {loading ? (
                <div className="flex justify-center items-center h-40">
                    <div className="animate-spin h-8 w-8 border-4 border-[#81059e] rounded-full border-t-transparent"></div>
                </div>
            ) : transacoes.length === 0 ? (
                <div className="bg-gray-50 p-8 text-center rounded-lg border border-gray-200">
                    <p className="text-gray-500">Nenhuma transação encontrada para o período selecionado.</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Data
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Descrição
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Método
                                </th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Valor
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {transacoes.map((transacao) => (
                                <tr key={transacao.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {formatarData(transacao.data)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{transacao.descricao}</div>
                                        {transacao.vendaId && (
                                            <div className="text-xs text-gray-500">
                                                Venda #{transacao.vendaId.substring(0, 8)}... •
                                                {transacao.venda?.cliente?.nome && (
                                                    <span> Cliente: {transacao.venda.cliente.nome}</span>
                                                )}
                                            </div>
                                        )}
                                        {transacao.observacao && (
                                            <div className="text-xs text-gray-500 italic">
                                                Obs: {transacao.observacao}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${getMetodoPagamentoClasse(transacao.formaPagamento)}`}>
                                            {getMetodoPagamentoLabel(transacao.formaPagamento)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right">
                                        <span className={transacao.tipo === 'entrada' ? 'text-green-600' : 'text-red-600'}>
                                            {transacao.tipo === 'entrada' ? '+' : '-'} {formatCurrency(transacao.valor || 0)}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

// Funções auxiliares para formatação
const getMetodoPagamentoLabel = (metodo) => {
    switch (metodo) {
        case 'dinheiro': return 'Dinheiro';
        case 'cartao': return 'Cartão';
        case 'pix': return 'PIX';
        case 'boleto': return 'Boleto';
        case 'ted': return 'TED';
        case 'crediario': return 'Crediário';
        default: return metodo || 'Desconhecido';
    }
};

const getMetodoPagamentoClasse = (metodo) => {
    switch (metodo) {
        case 'dinheiro': return 'bg-green-100 text-green-800';
        case 'cartao': return 'bg-blue-100 text-blue-800';
        case 'pix': return 'bg-indigo-100 text-indigo-800';
        case 'boleto': return 'bg-yellow-100 text-yellow-800';
        case 'ted': return 'bg-cyan-100 text-cyan-800';
        case 'crediario': return 'bg-purple-100 text-purple-800';
        default: return 'bg-gray-100 text-gray-800';
    }
};

export default HistoricoPagamentos;