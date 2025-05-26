"use client";

import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { collection, getDocs, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { firestore } from '@/lib/firebaseConfig';
import { useAuth } from '@/hooks/useAuth';
import { FiCalendar, FiDownload, FiPrinter, FiRefreshCw, FiFilter } from 'react-icons/fi';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { addMonths, startOfMonth, endOfMonth, format, startOfWeek, endOfWeek, eachDayOfInterval, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function FluxoCaixa() {
  const { userPermissions, userData } = useAuth();
  const [selectedLoja, setSelectedLoja] = useState(null);
  const [loading, setLoading] = useState(true);

  // Período padrão: mês atual
  const [dataInicio, setDataInicio] = useState(startOfMonth(new Date()));
  const [dataFim, setDataFim] = useState(endOfMonth(new Date()));

  const [movimentacoes, setMovimentacoes] = useState([]);
  const [saldoAnterior, setSaldoAnterior] = useState(0);
  const [agrupamento, setAgrupamento] = useState('dia'); // dia, semana, mes
  const [visaoAtual, setVisaoAtual] = useState('grafico'); // grafico, tabela
  const [comparativoMesAnterior, setComparativoMesAnterior] = useState([]);
  const [dadosAgrupados, setDadosAgrupados] = useState([]);
  const [categoriasFiltradas, setCategoriasFiltradas] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  // Dados para os gráficos
  const [dadosGraficoLinha, setDadosGraficoLinha] = useState([]);
  const [dadosGraficoBarra, setDadosGraficoBarra] = useState([]);
  const [categorias, setCategorias] = useState({
    entrada: [],
    saida: []
  });

  // Substitua o useEffect existente que lida com userPermissions
useEffect(() => {
  if (userPermissions) {
    console.log("userPermissions mudou:", userPermissions);
    // Se não for admin, usa a primeira loja que tem acesso
    if (!userPermissions.isAdmin && userPermissions.lojas.length > 0) {
      setSelectedLoja(userPermissions.lojas[0]);
      console.log("Definindo loja para usuário normal:", userPermissions.lojas[0]);
    }
    // Se for admin, usa a primeira loja da lista
    else if (userPermissions.isAdmin && userPermissions.lojas.length > 0) {
      setSelectedLoja(userPermissions.lojas[0]);
      console.log("Definindo loja para admin:", userPermissions.lojas[0]);
    }
  }
}, [userPermissions]);

  useEffect(() => {
    if (selectedLoja) {
      fetchMovimentacoes();
    }
  }, [selectedLoja, dataInicio, dataFim]);

  useEffect(() => {
    if (movimentacoes.length > 0) {
      // Processar dados conforme o agrupamento selecionado
      agruparDados();

      // Preparar dados para os gráficos
      prepararDadosGraficos();

      // Extrair categorias únicas
      extrairCategorias();

      // Gerar comparativo com mês anterior
      if (agrupamento === 'mes') {
        gerarComparativoMesAnterior();
      }
    }
  }, [movimentacoes, agrupamento]);

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
      // Buscar todas as movimentações para o período filtrado
      let itemsRef = collection(firestore, `lojas/${selectedLoja}/financeiro/controle_caixa/items`);

      // Query base para movimentações no período selecionado
      let baseQuery = query(
        itemsRef,
        where('data', '>=', formatarData(new Date(dataInicio))),
        where('data', '<=', formatarDataFim(new Date(dataFim))),
        orderBy('data', 'asc')
      );

      const querySnapshot = await getDocs(baseQuery);

      const movimentacoesData = [];

      // Processa movimentações do período
      querySnapshot.forEach((doc) => {
        const movData = doc.data();
        const movItem = {
          id: doc.id,
          ...movData,
          data: movData.data ? new Date(movData.data.seconds * 1000) : new Date()
        };
        movimentacoesData.push(movItem);
      });

      setMovimentacoes(movimentacoesData);

      // Calcular saldo anterior ao período selecionado
      const saldoAnteriorQuery = query(
        collection(firestore, `lojas/${selectedLoja}/financeiro/controle_caixa/items`),
        where('data', '<', formatarData(new Date(dataInicio)))
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

  const agruparDados = () => {
    let dados = [];
    let agrupados = {};

    // Cópia das movimentações para manipulação
    const movs = [...movimentacoes];

    // Calculando saldo inicial para o primeiro dia
    let saldoAcumulado = saldoAnterior;

    // Agrupamento por dia
    if (agrupamento === 'dia') {
      // Criar objeto para cada dia no intervalo
      const datas = eachDayOfInterval({
        start: new Date(dataInicio),
        end: new Date(dataFim)
      });

      datas.forEach(data => {
        const dataStr = format(data, 'yyyy-MM-dd');
        agrupados[dataStr] = {
          data: data,
          entradas: 0,
          saidas: 0,
          saldo: 0,
          saldoAcumulado: saldoAcumulado,
          movs: []
        };
      });

      // Preencher com movimentações reais
      movs.forEach(mov => {
        const dataStr = format(mov.data, 'yyyy-MM-dd');

        if (!agrupados[dataStr]) {
          // Não deveria acontecer devido ao intervalo criado acima
          return;
        }

        if (mov.tipo === 'entrada') {
          agrupados[dataStr].entradas += parseFloat(mov.valor || 0);
        } else if (mov.tipo === 'saida') {
          agrupados[dataStr].saidas += parseFloat(mov.valor || 0);
        }

        agrupados[dataStr].saldo = agrupados[dataStr].entradas - agrupados[dataStr].saidas;
        agrupados[dataStr].movs.push(mov);
      });

      // Calcular saldo acumulado
      Object.keys(agrupados).sort().forEach((dataStr, index, array) => {
        if (index > 0) {
          const dataAnterior = array[index - 1];
          agrupados[dataStr].saldoAcumulado = agrupados[dataAnterior].saldoAcumulado + agrupados[dataStr].saldo;
        } else {
          agrupados[dataStr].saldoAcumulado = saldoAcumulado + agrupados[dataStr].saldo;
        }
      });

      // Converter para array
      dados = Object.values(agrupados);
    }

    // Agrupamento por semana
    else if (agrupamento === 'semana') {
      movs.forEach(mov => {
        const inicioSemana = startOfWeek(mov.data, { weekStartsOn: 0 }); // 0 = domingo
        const fimSemana = endOfWeek(mov.data, { weekStartsOn: 0 });
        const semanaKey = `${format(inicioSemana, 'yyyy-MM-dd')}_${format(fimSemana, 'yyyy-MM-dd')}`;

        if (!agrupados[semanaKey]) {
          agrupados[semanaKey] = {
            inicioSemana,
            fimSemana,
            label: `${format(inicioSemana, 'dd/MM')} - ${format(fimSemana, 'dd/MM')}`,
            entradas: 0,
            saidas: 0,
            saldo: 0,
            saldoAcumulado: 0,
            movs: []
          };
        }

        if (mov.tipo === 'entrada') {
          agrupados[semanaKey].entradas += parseFloat(mov.valor || 0);
        } else if (mov.tipo === 'saida') {
          agrupados[semanaKey].saidas += parseFloat(mov.valor || 0);
        }

        agrupados[semanaKey].movs.push(mov);
      });

      // Ordenar semanas cronologicamente
      const semanasOrdenadas = Object.keys(agrupados).sort();

      // Calcular saldo e acumulado para cada semana
      let acumulado = saldoAnterior;
      semanasOrdenadas.forEach(semanaKey => {
        agrupados[semanaKey].saldo = agrupados[semanaKey].entradas - agrupados[semanaKey].saidas;
        acumulado += agrupados[semanaKey].saldo;
        agrupados[semanaKey].saldoAcumulado = acumulado;
      });

      // Converter para array
      semanasOrdenadas.forEach(key => {
        dados.push(agrupados[key]);
      });
    }

    // Agrupamento por mês
    else if (agrupamento === 'mes') {
      movs.forEach(mov => {
        const mesKey = format(mov.data, 'yyyy-MM');
        const nomeMes = format(mov.data, 'MMMM yyyy', { locale: ptBR });

        if (!agrupados[mesKey]) {
          agrupados[mesKey] = {
            data: new Date(mov.data.getFullYear(), mov.data.getMonth(), 1),
            mes: nomeMes,
            entradas: 0,
            saidas: 0,
            saldo: 0,
            saldoAcumulado: 0,
            categorias: {
              entradas: {},
              saidas: {}
            },
            movs: []
          };
        }

        if (mov.tipo === 'entrada') {
          agrupados[mesKey].entradas += parseFloat(mov.valor || 0);

          // Agrupar por categoria
          const categoria = mov.categoria || 'Sem categoria';
          if (!agrupados[mesKey].categorias.entradas[categoria]) {
            agrupados[mesKey].categorias.entradas[categoria] = 0;
          }
          agrupados[mesKey].categorias.entradas[categoria] += parseFloat(mov.valor || 0);

        } else if (mov.tipo === 'saida') {
          agrupados[mesKey].saidas += parseFloat(mov.valor || 0);

          // Agrupar por categoria
          const categoria = mov.categoria || 'Sem categoria';
          if (!agrupados[mesKey].categorias.saidas[categoria]) {
            agrupados[mesKey].categorias.saidas[categoria] = 0;
          }
          agrupados[mesKey].categorias.saidas[categoria] += parseFloat(mov.valor || 0);
        }

        agrupados[mesKey].movs.push(mov);
      });

      // Ordenar meses cronologicamente
      const mesesOrdenados = Object.keys(agrupados).sort();

      // Calcular saldo e acumulado para cada mês
      let acumulado = saldoAnterior;
      mesesOrdenados.forEach(mesKey => {
        agrupados[mesKey].saldo = agrupados[mesKey].entradas - agrupados[mesKey].saidas;
        acumulado += agrupados[mesKey].saldo;
        agrupados[mesKey].saldoAcumulado = acumulado;
      });

      // Converter para array
      mesesOrdenados.forEach(key => {
        dados.push(agrupados[key]);
      });
    }

    setDadosAgrupados(dados);
  };

  const prepararDadosGraficos = () => {
    // Prepara dados para o gráfico de linha (evolução do saldo)
    const dadosLinha = dadosAgrupados.map(item => {
      let label = '';
      
      if (agrupamento === 'dia') {
        // Verifica se a data é válida antes de formatar
        label = item.data instanceof Date && !isNaN(item.data.getTime()) 
          ? format(item.data, 'dd/MM') 
          : 'Data inválida';
      } else if (agrupamento === 'semana') {
        label = item.label;
      } else if (agrupamento === 'mes') {
        // Verifica se a data é válida antes de formatar
        label = item.data instanceof Date && !isNaN(item.data.getTime()) 
          ? format(item.data, 'MMM/yy', { locale: ptBR }) 
          : 'Data inválida';
      }
      
      return {
        name: label,
        entradas: item.entradas,
        saidas: item.saidas,
        saldo: item.saldo,
        saldoAcumulado: item.saldoAcumulado
      };
    });
    
    setDadosGraficoLinha(dadosLinha);
    
    // Preparar dados para o gráfico de barras (entradas x saídas)
    setDadosGraficoBarra(dadosLinha);
  };  

  const extrairCategorias = () => {
    // Extrair categorias únicas de entradas e saídas
    const categoriasEntrada = new Set();
    const categoriasSaida = new Set();

    movimentacoes.forEach(mov => {
      if (mov.categoria) {
        if (mov.tipo === 'entrada') {
          categoriasEntrada.add(mov.categoria);
        } else if (mov.tipo === 'saida') {
          categoriasSaida.add(mov.categoria);
        }
      }
    });

    setCategorias({
      entrada: Array.from(categoriasEntrada),
      saida: Array.from(categoriasSaida)
    });
  };

  const gerarComparativoMesAnterior = () => {
    // Criar comparativo entre o mês atual e o mês anterior
    try {
      // Verificar se há dados mensais para comparar
      if (dadosAgrupados.length < 2) {
        setComparativoMesAnterior([]);
        return;
      }

      // Pegar último mês disponível e seu anterior
      const mesAtual = dadosAgrupados[dadosAgrupados.length - 1];
      const mesAnterior = dadosAgrupados[dadosAgrupados.length - 2];

      // Preparar comparativo por categoria
      const comparativo = {
        mes: {
          atual: mesAtual.mes,
          anterior: mesAnterior.mes
        },
        totais: {
          entradas: {
            atual: mesAtual.entradas,
            anterior: mesAnterior.entradas,
            variacao: calcularVariacao(mesAtual.entradas, mesAnterior.entradas)
          },
          saidas: {
            atual: mesAtual.saidas,
            anterior: mesAnterior.saidas,
            variacao: calcularVariacao(mesAtual.saidas, mesAnterior.saidas)
          },
          saldo: {
            atual: mesAtual.saldo,
            anterior: mesAnterior.saldo,
            variacao: calcularVariacao(mesAtual.saldo, mesAnterior.saldo)
          }
        },
        categorias: {
          entradas: [],
          saidas: []
        }
      };

      // Comparar categorias de entradas
      const todasCategoriasEntrada = new Set([
        ...Object.keys(mesAtual.categorias.entradas),
        ...Object.keys(mesAnterior.categorias.entradas)
      ]);

      todasCategoriasEntrada.forEach(categoria => {
        const valorAtual = mesAtual.categorias.entradas[categoria] || 0;
        const valorAnterior = mesAnterior.categorias.entradas[categoria] || 0;

        comparativo.categorias.entradas.push({
          categoria,
          atual: valorAtual,
          anterior: valorAnterior,
          variacao: calcularVariacao(valorAtual, valorAnterior)
        });
      });

      // Comparar categorias de saídas
      const todasCategoriasSaida = new Set([
        ...Object.keys(mesAtual.categorias.saidas),
        ...Object.keys(mesAnterior.categorias.saidas)
      ]);

      todasCategoriasSaida.forEach(categoria => {
        const valorAtual = mesAtual.categorias.saidas[categoria] || 0;
        const valorAnterior = mesAnterior.categorias.saidas[categoria] || 0;

        comparativo.categorias.saidas.push({
          categoria,
          atual: valorAtual,
          anterior: valorAnterior,
          variacao: calcularVariacao(valorAtual, valorAnterior)
        });
      });

      // Ordenar por maior valor atual
      comparativo.categorias.entradas.sort((a, b) => b.atual - a.atual);
      comparativo.categorias.saidas.sort((a, b) => b.atual - a.atual);

      setComparativoMesAnterior(comparativo);

    } catch (error) {
      console.error("Erro ao gerar comparativo:", error);
      setComparativoMesAnterior([]);
    }
  };

  const calcularVariacao = (atual, anterior) => {
    if (anterior === 0) return atual > 0 ? 100 : 0;
    return ((atual - anterior) / anterior) * 100;
  };

  const formatarValor = (valor) => {
    return `R$ ${parseFloat(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatarVariacao = (variacao) => {
    return `${variacao > 0 ? '+' : ''}${variacao.toFixed(2)}%`;
  };

  const exportarCSV = () => {
    if (dadosAgrupados.length === 0) return;

    let csvContent = 'data:text/csv;charset=utf-8,';

    // Cabeçalho
    let header = '';
    if (agrupamento === 'dia') {
      header = 'Data,Entradas,Saídas,Saldo,Saldo Acumulado\n';
    } else if (agrupamento === 'semana') {
      header = 'Período,Entradas,Saídas,Saldo,Saldo Acumulado\n';
    } else if (agrupamento === 'mes') {
      header = 'Mês,Entradas,Saídas,Saldo,Saldo Acumulado\n';
    }

    csvContent += header;

    // Dados
    dadosAgrupados.forEach(item => {
      let linha = '';

      if (agrupamento === 'dia') {
        linha += `"${format(item.data, 'dd/MM/yyyy')}",`;
      } else if (agrupamento === 'semana') {
        linha += `"${item.label}",`;
      } else if (agrupamento === 'mes') {
        linha += `"${item.mes}",`;
      }

      linha += `${item.entradas.toFixed(2)},`;
      linha += `${item.saidas.toFixed(2)},`;
      linha += `${item.saldo.toFixed(2)},`;
      linha += `${item.saldoAcumulado.toFixed(2)}\n`;

      csvContent += linha;
    });

    // Criar link temporário para download
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `fluxo_caixa_${agrupamento}_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);
  };

  const imprimirRelatorio = () => {
    window.print();
  };

  const renderLojaName = (lojaId) => {
    const lojaNames = {
      'loja1': 'Loja 1 - Centro',
      'loja2': 'Loja 2 - Caramuru'
    };

    return lojaNames[lojaId] || lojaId;
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

  const { totalEntradas, totalSaidas, saldoPeriodo } = calcularTotais();

  // Configurar períodos pré-definidos
  const selecionarPeriodo = (periodo) => {
    const hoje = new Date();

    switch (periodo) {
      case 'mes_atual':
        setDataInicio(startOfMonth(hoje));
        setDataFim(endOfMonth(hoje));
        break;
      case 'mes_anterior':
        const mesAnterior = subMonths(hoje, 1);
        setDataInicio(startOfMonth(mesAnterior));
        setDataFim(endOfMonth(mesAnterior));
        break;
      case 'ultimos_3_meses':
        setDataInicio(startOfMonth(subMonths(hoje, 2)));
        setDataFim(endOfMonth(hoje));
        break;
      case 'ano_atual':
        setDataInicio(new Date(hoje.getFullYear(), 0, 1)); // 1º de janeiro
        setDataFim(new Date(hoje.getFullYear(), 11, 31)); // 31 de dezembro
        break;
      default:
        break;
    }
  };

  return (
    <Layout>
      <div className="min-h-screen mb-20">
        <div className="w-full max-w-6xl mx-auto rounded-lg">
          <h2 className="text-3xl font-bold text-[#81059e] mb-8 mt-8">FLUXO DE CAIXA</h2>

          {/* Seletor de Loja para Admins */}
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

          {/* Dashboard resumo */}
          <div className="grid grid-cols-2 md:flex md:flex-nowrap md:space-x-4 mb-4 overflow-x-auto">
            {/* Saldo Anterior */}
            <div className="rounded-sm p-2 border-l-4 border-l-blue-500 md:flex-1 min-w-[100px] mb-2 md:mb-0">
              <p className="text-black text-sm font-bold whitespace-nowrap">Saldo Anterior</p>
              <p className={`text-base ${saldoAnterior >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {saldoAnterior >= 0
                  ? formatarValor(saldoAnterior)
                  : `- ${formatarValor(Math.abs(saldoAnterior))}`
                }
              </p>
            </div>

            {/* Entradas */}
            <div className="rounded-sm p-2 border-l-4 border-green-500 md:flex-1 min-w-[100px] mb-2 md:mb-0">
              <p className="text-black text-sm font-bold whitespace-nowrap">Entradas</p>
              <p className="text-base text-green-600">{formatarValor(totalEntradas)}</p>
            </div>

            {/* Saídas */}
            <div className="rounded-sm p-2 border-l-4 border-red-500 md:flex-1 min-w-[100px] mb-2 md:mb-0">
              <p className="text-black text-sm font-bold whitespace-nowrap">Saídas</p>
              <p className="text-base text-red-600">{formatarValor(totalSaidas)}</p>
            </div>

            {/* Saldo do Período */}
            <div className="rounded-sm p-2 border-l-4 border-indigo-500 md:flex-1 min-w-[100px] mb-2 md:mb-0">
              <p className="text-black text-sm font-bold whitespace-nowrap">Saldo do Período</p>
              <p className={`text-base ${saldoPeriodo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {saldoPeriodo >= 0
                  ? formatarValor(saldoPeriodo)
                  : `- ${formatarValor(Math.abs(saldoPeriodo))}`
                }
              </p>
            </div>

            {/* Saldo Final */}
            <div className="rounded-sm p-2 border-l-4  bg-purple-500 md:flex-1 min-w-[100px] mb-2 md:mb-0">
              <p className="text-white text-sm font-bold whitespace-nowrap">SALDO TOTAL</p>
              <p className={`text-base ${(saldoAnterior + saldoPeriodo) >= 0 ? 'text-white' : 'text-red-600'}`}>
                {(saldoAnterior + saldoPeriodo) >= 0
                  ? formatarValor(saldoAnterior + saldoPeriodo)
                  : `- ${formatarValor(Math.abs(saldoAnterior + saldoPeriodo))}`
                }
              </p>
            </div>
          </div>

          {/* Barra de filtros */}
          <div className="flex flex-wrap gap-2 mb-4">
            <div className="flex flex-grow flex-wrap md:flex-nowrap gap-2">
              {/* Seletor de período */}
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

              {/* Períodos pré-definidos */}
              <select
                onChange={(e) => selecionarPeriodo(e.target.value)}
                className="h-10 border rounded-lg px-2 text-black text-sm bg-white"
                defaultValue=""
              >
                <option value="" disabled>Períodos</option>
                <option value="mes_atual">Mês Atual</option>
                <option value="mes_anterior">Mês Anterior</option>
                <option value="ultimos_3_meses">Últimos 3 meses</option>
                <option value="ano_atual">Ano Atual</option>
              </select>

              {/* Agrupamento */}
              <select
                value={agrupamento}
                onChange={(e) => setAgrupamento(e.target.value)}
                className="h-10 border rounded-lg px-2 text-black text-sm bg-white"
              >
                <option value="dia">Diário</option>
                <option value="semana">Semanal</option>
                <option value="mes">Mensal</option>
              </select>
            </div>

            <div className="flex gap-1">
              {/* Botão Visão: Gráfico ou Tabela */}
              <button
                onClick={() => setVisaoAtual(visaoAtual === 'grafico' ? 'tabela' : 'grafico')}
                className="bg-[#81059e] text-white h-10 px-3 rounded-md flex items-center justify-center text-sm"
                title={visaoAtual === 'grafico' ? 'Mostrar Tabela' : 'Mostrar Gráfico'}
              >
                {visaoAtual === 'grafico' ? 'Exibir Tabelas' : 'Exibir Gráficos'}
              </button>

              {/* Botão Filtro */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="border-2 text-purple-600 h-10 w-10 rounded-md flex items-center justify-center"
                title="Filtros"
              >
                <FiFilter className='h-5 w-5' />
              </button>

              {/* Botão Atualizar */}
              <button
                onClick={() => fetchMovimentacoes()}
                className="border-2 text-purple-600 h-10 w-10 rounded-md flex items-center justify-center"
                title="Atualizar"
              >
                <FiRefreshCw className='h-5 w-5' />
              </button>

              {/* Botão Exportar */}
              <button
                onClick={exportarCSV}
                className="border-2 text-purple-600 h-10 w-10 rounded-md flex items-center justify-center"
                title="Exportar CSV"
              >
                <FiDownload className='h-5 w-5' />
              </button>

              {/* Botão Imprimir */}
              <button
                onClick={imprimirRelatorio}
                className="border-2 text-purple-600 h-10 w-10 rounded-md flex items-center justify-center"
                title="Imprimir"
              >
                <FiPrinter className='h-5 w-5' />
              </button>
            </div>
          </div>

          {/* Filtros avançados (expandível) */}
          {showFilters && (
            <div className="bg-gray-100 p-4 rounded-lg mb-4">
              <h3 className="text-lg font-semibold text-[#81059e] mb-2">Filtros Avançados</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-1">Categorias de Entrada</h4>
                  <div className="flex flex-wrap gap-2">
                    {categorias.entrada.map(cat => (
                      <label key={`entrada-${cat}`} className="flex items-center space-x-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={categoriasFiltradas.includes(`entrada-${cat}`)}
                          onChange={() => {
                            setCategoriasFiltradas(prev =>
                              prev.includes(`entrada-${cat}`)
                                ? prev.filter(c => c !== `entrada-${cat}`)
                                : [...prev, `entrada-${cat}`]
                            )
                          }}
                          className="h-4 w-4"
                        />
                        <span>{cat}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-1">Categorias de Saída</h4>
                  <div className="flex flex-wrap gap-2">
                    {categorias.saida.map(cat => (
                      <label key={`saida-${cat}`} className="flex items-center space-x-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={categoriasFiltradas.includes(`saida-${cat}`)}
                          onChange={() => {
                            setCategoriasFiltradas(prev =>
                              prev.includes(`saida-${cat}`)
                                ? prev.filter(c => c !== `saida-${cat}`)
                                : [...prev, `saida-${cat}`]
                            )
                          }}
                          className="h-4 w-4"
                        />
                        <span>{cat}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-3">
                <button
                  onClick={() => setCategoriasFiltradas([])}
                  className="text-[#81059e] text-sm mr-3"
                >
                  Limpar Filtros
                </button>
                <button
                  onClick={() => setShowFilters(false)}
                  className="bg-[#81059e] text-white px-4 py-1 rounded-sm text-sm"
                >
                  Aplicar
                </button>
              </div>
            </div>
          )}

          {/* Conteúdo Principal: Gráficos ou Tabela */}
          {loading ? (
            <div className="bg-white p-8 rounded-lg shadow text-center">
              <p>Carregando dados...</p>
            </div>
          ) : dadosAgrupados.length === 0 ? (
            <div className="bg-white p-8 rounded-lg shadow text-center">
              <p>Nenhum dado encontrado para o período selecionado.</p>
            </div>
          ) : (
            <div>
              {/* Visualização de Gráficos */}
              {visaoAtual === 'grafico' && (
                <div className="space-y-6">
                  {/* Gráfico de Evolução de Saldo */}
                  <div className="bg-white p-4 rounded-lg shadow">
                    <h3 className="text-lg font-semibold text-[#81059e] mb-4">Evolução do Saldo</h3>
                    <div className="h-64 md:h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={dadosGraficoLinha}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip formatter={(value) => ['R$ ' + value.toFixed(2), '']} />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="saldoAcumulado"
                            stroke="#81059e"
                            strokeWidth={2}
                            name="Saldo Acumulado"
                            dot={{ r: 3 }}
                            activeDot={{ r: 6 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Gráfico de Barras - Entradas vs Saídas */}
                  <div className="bg-white p-4 rounded-lg shadow">
                    <h3 className="text-lg font-semibold text-[#81059e] mb-4">Entradas e Saídas por Período</h3>
                    <div className="h-64 md:h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={dadosGraficoBarra}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                          barGap={10}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip formatter={(value) => ['R$ ' + value.toFixed(2), '']} />
                          <Legend />
                          <Bar dataKey="entradas" name="Entradas" fill="#4ade80" radius={[3, 3, 0, 0]} />
                          <Bar dataKey="saidas" name="Saídas" fill="#f87171" radius={[3, 3, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Comparativo Mensal (apenas para agrupamento mensal) */}
                  {agrupamento === 'mes' && comparativoMesAnterior && Object.keys(comparativoMesAnterior).length > 0 && (
                    <div className="bg-white p-4 rounded-lg shadow">
                      <h3 className="text-lg font-semibold text-[#81059e] mb-4">
                        Comparativo: {comparativoMesAnterior.mes.atual} vs {comparativoMesAnterior.mes.anterior}
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Total de Entradas */}
                        <div className="border rounded-md p-3">
                          <h4 className="font-medium text-[#81059e]">Entradas</h4>
                          <div className="flex justify-between items-end mt-2">
                            <div>
                              <p className="text-xs text-gray-500">Atual</p>
                              <p className="text-base text-green-600">{formatarValor(comparativoMesAnterior.totais.entradas.atual)}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-gray-500">Anterior</p>
                              <p className="text-sm text-gray-600">{formatarValor(comparativoMesAnterior.totais.entradas.anterior)}</p>
                            </div>
                            <div className={`ml-2 text-base ${comparativoMesAnterior.totais.entradas.variacao >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {formatarVariacao(comparativoMesAnterior.totais.entradas.variacao)}
                            </div>
                          </div>
                        </div>

                        {/* Total de Saídas */}
                        <div className="border rounded-md p-3">
                          <h4 className="font-medium text-[#81059e]">Saídas</h4>
                          <div className="flex justify-between items-end mt-2">
                            <div>
                              <p className="text-xs text-gray-500">Atual</p>
                              <p className="text-base text-red-600">{formatarValor(comparativoMesAnterior.totais.saidas.atual)}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-gray-500">Anterior</p>
                              <p className="text-sm text-gray-600">{formatarValor(comparativoMesAnterior.totais.saidas.anterior)}</p>
                            </div>
                            <div className={`ml-2 text-base ${comparativoMesAnterior.totais.saidas.variacao <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {formatarVariacao(comparativoMesAnterior.totais.saidas.variacao)}
                            </div>
                          </div>
                        </div>

                        {/* Saldo */}
                        <div className="border rounded-md p-3">
                          <h4 className="font-medium text-[#81059e]">Saldo</h4>
                          <div className="flex justify-between items-end mt-2">
                            <div>
                              <p className="text-xs text-gray-500">Atual</p>
                              <p className={`text-base ${comparativoMesAnterior.totais.saldo.atual >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatarValor(comparativoMesAnterior.totais.saldo.atual)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-gray-500">Anterior</p>
                              <p className={`text-sm ${comparativoMesAnterior.totais.saldo.anterior >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatarValor(comparativoMesAnterior.totais.saldo.anterior)}
                              </p>
                            </div>
                            <div className={`ml-2 text-base ${comparativoMesAnterior.totais.saldo.variacao >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {formatarVariacao(comparativoMesAnterior.totais.saldo.variacao)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Visualização de Tabela */}
              {visaoAtual === 'tabela' && (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead className="bg-[#81059e] text-white">
                        <tr>
                          <th className="px-4 py-3 text-left">
                            {agrupamento === 'dia' ? 'Data' : agrupamento === 'semana' ? 'Período' : 'Mês'}
                          </th>
                          <th className="px-4 py-3 text-right">Entradas</th>
                          <th className="px-4 py-3 text-right">Saídas</th>
                          <th className="px-4 py-3 text-right">Saldo</th>
                          <th className="px-4 py-3 text-right">Saldo Acumulado</th>
                        </tr>
                      </thead>
                      <tbody className="text-black">
                        {dadosAgrupados.map((item, index) => (
                          <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                            <td className="px-4 py-3 border-b">
                              {agrupamento === 'dia'
                                ? format(item.data, 'dd/MM/yyyy')
                                : agrupamento === 'semana'
                                  ? item.label
                                  : item.mes
                              }
                            </td>
                            <td className="px-4 py-3 border-b text-right text-green-600">
                              {formatarValor(item.entradas)}
                            </td>
                            <td className="px-4 py-3 border-b text-right text-red-600">
                              {formatarValor(item.saidas)}
                            </td>
                            <td className={`px-4 py-3 border-b text-right ${item.saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {item.saldo >= 0
                                ? formatarValor(item.saldo)
                                : `- ${formatarValor(Math.abs(item.saldo))}`
                              }
                            </td>
                            <td className={`px-4 py-3 border-b text-right font-medium ${item.saldoAcumulado >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {item.saldoAcumulado >= 0
                                ? formatarValor(item.saldoAcumulado)
                                : `- ${formatarValor(Math.abs(item.saldoAcumulado))}`
                              }
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-100 text-black font-medium">
                        <tr>
                          <td className="px-4 py-3">TOTAL</td>
                          <td className="px-4 py-3 text-right text-green-600">
                            {formatarValor(totalEntradas)}
                          </td>
                          <td className="px-4 py-3 text-right text-red-600">
                            {formatarValor(totalSaidas)}
                          </td>
                          <td className={`px-4 py-3 text-right ${saldoPeriodo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {saldoPeriodo >= 0
                              ? formatarValor(saldoPeriodo)
                              : `- ${formatarValor(Math.abs(saldoPeriodo))}`
                            }
                          </td>
                          <td className={`px-4 py-3 text-right ${(saldoAnterior + saldoPeriodo) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {(saldoAnterior + saldoPeriodo) >= 0
                              ? formatarValor(saldoAnterior + saldoPeriodo)
                              : `- ${formatarValor(Math.abs(saldoAnterior + saldoPeriodo))}`
                            }
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
} 