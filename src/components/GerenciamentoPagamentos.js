// components/GerenciamentoPagamentos.js
import { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  addDoc,
  serverTimestamp
} from 'firebase/firestore';
import { firestore } from '@/lib/firebaseConfig';
import { useAuth } from '@/hooks/useAuth';
import {
  FiDollarSign,
  FiClock,
  FiCheck,
  FiX,
  FiFileText,
  FiSearch,
  FiCalendar,
  FiUser,
  FiTag,
  FiEye,
  FiChevronDown,
  FiChevronUp,
  FiClipboard
} from 'react-icons/fi';

const GerenciamentoPagamentos = ({ selectedLoja }) => {
  const [pagamentosPendentes, setPagamentosPendentes] = useState([]);
  const [filtro, setFiltro] = useState('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [detalhesAbertos, setDetalhesAbertos] = useState({});
  const [comprovanteBoleto, setComprovanteBoleto] = useState(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pagamentoParaConfirmar, setPagamentoParaConfirmar] = useState(null);
  const [obsConfirmacao, setObsConfirmacao] = useState('');

  const { user, userData } = useAuth();

  // Buscar pagamentos pendentes
  useEffect(() => {
    if (!selectedLoja) return;
    
    const fetchPagamentosPendentes = async () => {
      try {
        setLoading(true);
        
        // Buscar vendas aguardando pagamento
        const vendasRef = collection(firestore, `lojas/${selectedLoja}/vendas/items`);
        const vendasQuery = query(vendasRef, where('status_venda', '==', 'aguardando_pagamento'));
        const vendasSnapshot = await getDocs(vendasQuery);
        
        // Buscar contas a receber pendentes
        const contasReceberRef = collection(firestore, `lojas/${selectedLoja}/financeiro/contas_receber/items`);
        const contasReceberQuery = query(contasReceberRef, where('status', '==', 'pendente'));
        const contasReceberSnapshot = await getDocs(contasReceberQuery);
        
        // Processar vendas
        const vendasPendentes = await Promise.all(vendasSnapshot.docs.map(async (docVenda) => {
          const venda = {
            id: docVenda.id,
            ...docVenda.data(),
            tipo: 'venda'
          };
          
          // Buscar dados do cliente se necessário
          if (venda.cliente?.id) {
            try {
              const clienteDoc = await getDoc(doc(firestore, `clientes/${venda.cliente.id}`));
              if (clienteDoc.exists()) {
                venda.cliente = {
                  ...venda.cliente,
                  ...clienteDoc.data()
                };
              }
            } catch (err) {
              console.error('Erro ao buscar cliente:', err);
            }
          }
          
          return venda;
        }));
        
        // Processar contas a receber
        const contasPendentes = await Promise.all(contasReceberSnapshot.docs.map(async (docConta) => {
          const conta = {
            id: docConta.id,
            ...docConta.data(),
            tipo: 'conta_receber'
          };
          
          // Buscar venda relacionada se houver
          if (conta.venda_id) {
            try {
              const vendaDoc = await getDoc(doc(firestore, `lojas/${selectedLoja}/vendas/items/${conta.venda_id}`));
              if (vendaDoc.exists()) {
                conta.venda = vendaDoc.data();
              }
            } catch (err) {
              console.error('Erro ao buscar venda:', err);
            }
          }
          
          // Buscar dados do cliente se necessário
          if (conta.cliente?.id) {
            try {
              const clienteDoc = await getDoc(doc(firestore, `clientes/${conta.cliente.id}`));
              if (clienteDoc.exists()) {
                conta.cliente = {
                  ...conta.cliente,
                  ...clienteDoc.data()
                };
              }
            } catch (err) {
              console.error('Erro ao buscar cliente:', err);
            }
          }
          
          return conta;
        }));
        
        // Combinar os resultados
        const pagamentos = [...vendasPendentes, ...contasPendentes];
        
        // Ordenar por data de vencimento (ou criação)
        pagamentos.sort((a, b) => {
          const dataA = a.data_vencimento ? new Date(a.data_vencimento) : new Date(a.data.seconds * 1000);
          const dataB = b.data_vencimento ? new Date(b.data_vencimento) : new Date(b.data.seconds * 1000);
          return dataA - dataB;
        });
        
        setPagamentosPendentes(pagamentos);
      } catch (err) {
        console.error('Erro ao buscar pagamentos pendentes:', err);
        setError('Falha ao carregar pagamentos pendentes');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPagamentosPendentes();
  }, [selectedLoja]);

  // Filtrar pagamentos
  const pagamentosFiltrados = pagamentosPendentes.filter(pagamento => {
    // Filtrar por tipo
    if (filtro !== 'todos' && pagamento.pagamento?.metodo !== filtro && 
        pagamento.forma_pagamento !== filtro) {
      return false;
    }
    
    // Filtrar por termo de busca
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        pagamento.cliente?.nome?.toLowerCase().includes(searchLower) ||
        pagamento.id.toLowerCase().includes(searchLower) ||
        pagamento.os_id?.toLowerCase().includes(searchLower) ||
        (pagamento.venda?.os_id && pagamento.venda.os_id.toLowerCase().includes(searchLower))
      );
    }
    
    return true;
  });

  // Confirmar pagamento
  const confirmarPagamento = async () => {
    if (!pagamentoParaConfirmar) return;
    
    try {
      setLoading(true);
      
      if (pagamentoParaConfirmar.tipo === 'venda') {
        // Atualizar status da venda
        const vendaRef = doc(firestore, `lojas/${selectedLoja}/vendas/items/${pagamentoParaConfirmar.id}`);
        
        await updateDoc(vendaRef, {
          'status_venda': 'paga',
          'pagamento.status': 'aprovado',
          'pagamento.data_aprovacao': serverTimestamp(),
          'historico_status': [...(pagamentoParaConfirmar.historico_status || []), {
            status: 'paga',
            data: serverTimestamp(),
            responsavel: {
              id: user?.uid,
              nome: userData?.nome || user?.email
            },
            observacao: obsConfirmacao
          }]
        });
        
        // Registrar no controle de caixa
        const caixaRef = collection(firestore, `lojas/${selectedLoja}/financeiro/controle_caixa/items`);
        await addDoc(caixaRef, {
          tipo: 'entrada',
          valor: pagamentoParaConfirmar.total,
          descricao: `Venda #${pagamentoParaConfirmar.id} - Cliente: ${pagamentoParaConfirmar.cliente?.nome}`,
          formaPagamento: pagamentoParaConfirmar.pagamento?.metodo,
          data: serverTimestamp(),
          registradoPor: {
            id: user?.uid,
            nome: userData?.nome || user?.email
          },
          vendaId: pagamentoParaConfirmar.id,
          observacao: obsConfirmacao
        });
        
        // Criar ordem de serviço se ainda não existir
        if (pagamentoParaConfirmar.requer_montagem && pagamentoParaConfirmar.os_id) {
          const osRef = collection(firestore, `lojas/${selectedLoja}/servicos/items`);
          
          // Verificar se já existe uma OS
          const osQuery = query(osRef, where('id_os', '==', pagamentoParaConfirmar.os_id));
          const osSnapshot = await getDocs(osQuery);
          
          if (osSnapshot.empty) {
            // Criar nova OS
            await addDoc(osRef, {
              id_os: pagamentoParaConfirmar.os_id,
              id_venda: pagamentoParaConfirmar.id,
              cliente: {
                id: pagamentoParaConfirmar.cliente?.id,
                nome: pagamentoParaConfirmar.cliente?.nome,
                cpf: pagamentoParaConfirmar.cliente?.cpf,
                contato: pagamentoParaConfirmar.cliente?.telefone || ''
              },
              status: 'aguardando_montagem',
              data_criacao: serverTimestamp(),
              data_previsao: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // +2 dias
              produtos: pagamentoParaConfirmar.produtos,
              observacoes: pagamentoParaConfirmar.observacao
            });
          }
        }
      } else if (pagamentoParaConfirmar.tipo === 'conta_receber') {
        // Atualizar status da conta a receber
        const contaRef = doc(firestore, `lojas/${selectedLoja}/financeiro/contas_receber/items/${pagamentoParaConfirmar.id}`);
        
        await updateDoc(contaRef, {
          'status': 'pago',
          'data_pagamento': serverTimestamp(),
          'observacao_pagamento': obsConfirmacao,
          'confirmado_por': {
            id: user?.uid,
            nome: userData?.nome || user?.email
          }
        });
        
        // Registrar no controle de caixa
        const caixaRef = collection(firestore, `lojas/${selectedLoja}/financeiro/controle_caixa/items`);
        await addDoc(caixaRef, {
          tipo: 'entrada',
          valor: pagamentoParaConfirmar.valor,
          descricao: `Recebimento - ${pagamentoParaConfirmar.descricao}`,
          formaPagamento: pagamentoParaConfirmar.forma_pagamento,
          data: serverTimestamp(),
          registradoPor: {
            id: user?.uid,
            nome: userData?.nome || user?.email
          },
          vendaId: pagamentoParaConfirmar.venda_id,
          observacao: obsConfirmacao
        });
        
        // Se for parcela de crediário, verificar se todas parcelas foram pagas
        if (pagamentoParaConfirmar.forma_pagamento === 'crediario' && 
            pagamentoParaConfirmar.venda_id && 
            pagamentoParaConfirmar.parcela) {
          
          // Buscar venda relacionada
          const vendaRef = doc(firestore, `lojas/${selectedLoja}/vendas/items/${pagamentoParaConfirmar.venda_id}`);
          const vendaDoc = await getDoc(vendaRef);
          
          if (vendaDoc.exists()) {
            const venda = vendaDoc.data();
            
            // Atualizar status da parcela
            if (venda.pagamento?.dados_especificos?.status_parcelas) {
              const parcelasAtualizadas = venda.pagamento.dados_especificos.status_parcelas.map((p, idx) => {
                if (idx + 1 === pagamentoParaConfirmar.parcela) {
                  return {
                    ...p,
                    status: 'paga',
                    data_pagamento: new Date()
                  };
                }
                return p;
              });
              
              await updateDoc(vendaRef, {
                'pagamento.dados_especificos.status_parcelas': parcelasAtualizadas
              });
            }
          }
        }
      }
      
      // Atualizar a lista de pagamentos
      setPagamentosPendentes(pagamentosPendentes.filter(p => p.id !== pagamentoParaConfirmar.id));
      setShowConfirmDialog(false);
      setPagamentoParaConfirmar(null);
      setObsConfirmacao('');
      
    } catch (err) {
      console.error('Erro ao confirmar pagamento:', err);
      setError('Falha ao confirmar pagamento');
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
    
    return data.toLocaleDateString('pt-BR');
  };

  // Formatar valor monetário
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Toggle detalhes
  const toggleDetalhes = (id) => {
    setDetalhesAbertos({
      ...detalhesAbertos,
      [id]: !detalhesAbertos[id]
    });
  };

  // Abrir diálogo de confirmação
  const abrirConfirmacao = (pagamento) => {
    setPagamentoParaConfirmar(pagamento);
    setShowConfirmDialog(true);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold text-[#81059e] mb-6 flex items-center">
        <FiDollarSign className="mr-2" /> Gerenciamento de Pagamentos Pendentes
      </h2>
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          <p>{error}</p>
        </div>
      )}
      
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Filtrar por tipo</label>
          <select
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            className="border border-gray-300 rounded-md p-2 w-full"
          >
            <option value="todos">Todos os métodos</option>
            <option value="boleto">Boletos</option>
            <option value="ted">TED</option>
            <option value="crediario">Crediário</option>
            <option value="pix">PIX</option>
          </select>
        </div>
        
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border border-gray-300 rounded-md p-2 w-full"
              placeholder="Nome do cliente, ID da venda..."
            />
          </div>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin h-8 w-8 border-4 border-[#81059e] rounded-full border-t-transparent"></div>
        </div>
      ) : pagamentosFiltrados.length === 0 ? (
        <div className="bg-gray-50 p-8 text-center rounded-lg border border-gray-200">
          <p className="text-gray-500">Nenhum pagamento pendente encontrado.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pagamentosFiltrados.map((pagamento) => (
            <div 
              key={pagamento.id} 
              className="border border-gray-200 rounded-lg overflow-hidden"
            >
              <div 
                className={`flex justify-between items-center p-4 cursor-pointer ${detalhesAbertos[pagamento.id] ? 'bg-purple-50 border-b' : ''}`}
                onClick={() => toggleDetalhes(pagamento.id)}
              >
                <div className="flex-1">
                  <div className="flex items-center mb-1">
                    <FiUser className="text-[#81059e] mr-2" />
                    <span className="font-medium">{pagamento.cliente?.nome || 'Cliente não identificado'}</span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {pagamento.tipo === 'venda' ? (
                      <span>Venda #{pagamento.id.substring(0, 8)}... • OS: {pagamento.os_id}</span>
                    ) : (
                      <span>{pagamento.descricao}</span>
                    )}
                  </div>
                </div>
                
                <div className="flex-1 text-right">
                  <div className="font-semibold text-[#81059e]">
                    {formatCurrency(pagamento.total || pagamento.valor || 0)}
                  </div>
                  <div className="flex items-center justify-end space-x-2 text-sm">
                    <FiCalendar className="text-gray-500" />
                    <span className="text-gray-500">
                      Venc.: {formatarData(pagamento.data_vencimento || pagamento.pagamento?.dados_especificos?.data_vencimento)}
                    </span>
                    
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 ml-2">
                      {pagamento.pagamento?.metodo || pagamento.forma_pagamento}
                    </span>
                  </div>
                </div>
                
                <div className="ml-4">
                  {detalhesAbertos[pagamento.id] ? (
                    <FiChevronUp className="text-gray-500" />
                  ) : (
                    <FiChevronDown className="text-gray-500" />
                  )}
                </div>
              </div>
              
              {detalhesAbertos[pagamento.id] && (
                <div className="p-4 bg-gray-50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <h4 className="font-medium text-[#81059e] mb-2">Informações do Pagamento</h4>
                      <table className="w-full text-sm">
                        <tbody>
                          <tr>
                            <td className="py-1 font-medium">Método:</td>
                            <td>{pagamento.pagamento?.metodo || pagamento.forma_pagamento}</td>
                          </tr>
                          <tr>
                            <td className="py-1 font-medium">Valor:</td>
                            <td>{formatCurrency(pagamento.total || pagamento.valor || 0)}</td>
                          </tr>
                          <tr>
                            <td className="py-1 font-medium">Data Criação:</td>
                            <td>{formatarData(pagamento.data || pagamento.data_criacao)}</td>
                          </tr>
                          <tr>
                            <td className="py-1 font-medium">Vencimento:</td>
                            <td>{formatarData(pagamento.data_vencimento || pagamento.pagamento?.dados_especificos?.data_vencimento)}</td>
                          </tr>
                          {pagamento.pagamento?.metodo === 'boleto' && pagamento.pagamento?.dados_especificos?.linha_digitavel && (
                            <tr>
                              <td className="py-1 font-medium">Linha Digitável:</td>
                              <td className="font-mono text-xs break-all">{pagamento.pagamento.dados_especificos.linha_digitavel}</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-[#81059e] mb-2">Dados do Cliente</h4>
                      <table className="w-full text-sm">
                        <tbody>
                          <tr>
                            <td className="py-1 font-medium">Nome:</td>
                            <td>{pagamento.cliente?.nome || 'N/A'}</td>
                          </tr>
                          <tr>
                            <td className="py-1 font-medium">CPF:</td>
                            <td>{pagamento.cliente?.cpf || 'N/A'}</td>
                          </tr>
                          <tr>
                            <td className="py-1 font-medium">Telefone:</td>
                            <td>{pagamento.cliente?.telefone || 'N/A'}</td>
                          </tr>
                          <tr>
                            <td className="py-1 font-medium">Email:</td>
                            <td>{pagamento.cliente?.email || 'N/A'}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                  
                  {pagamento.tipo === 'venda' && pagamento.produtos && (
                    <div className="mb-4">
                      <h4 className="font-medium text-[#81059e] mb-2">Itens da Venda</h4>
                      <div className="max-h-40 overflow-y-auto">
                        <table className="w-full text-sm border-collapse">
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="p-2 text-left">Produto</th>
                              <th className="p-2 text-center">Qtd</th>
                              <th className="p-2 text-right">Valor</th>
                            </tr>
                          </thead>
                          <tbody>
                            {pagamento.produtos.map((produto, idx) => (
                              <tr key={idx} className="border-t border-gray-200">
                                <td className="p-2">
                                  <div className="font-medium">{produto.nome}</div>
                                  <div className="text-xs text-gray-500">{produto.marca} - {produto.codigo}</div>
                                </td>
                                <td className="p-2 text-center">{produto.quantidade}</td>
                                <td className="p-2 text-right">{formatCurrency(produto.preco * produto.quantidade)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                  
                  {/* Upload de comprovante e opções */}
                  <div className="flex flex-col sm:flex-row gap-4 mt-6">
                    {(pagamento.pagamento?.metodo === 'boleto' || pagamento.pagamento?.metodo === 'ted' || 
                      pagamento.forma_pagamento === 'boleto' || pagamento.forma_pagamento === 'ted') && (
                      <div className="flex-1">
                        <h4 className="font-medium text-[#81059e] mb-2">Comprovante de Pagamento</h4>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                          <input
                            type="file"
                            id={`comprovante-${pagamento.id}`}
                            className="hidden"
                            accept="image/*,.pdf"
                            onChange={(e) => {
                              const file = e.target.files[0];
                              if (file) {
                                setComprovanteBoleto({
                                  file,
                                  pagamentoId: pagamento.id,
                                  nome: file.name
                                });
                              }
                            }}
                          />
                          {comprovanteBoleto && comprovanteBoleto.pagamentoId === pagamento.id ? (
                            <div>
                              <p className="text-sm mb-2">{comprovanteBoleto.nome}</p>
                              <button 
                                onClick={() => setComprovanteBoleto(null)}
                                className="text-sm text-red-600 hover:text-red-800"
                              >
                                Remover
                              </button>
                            </div>
                          ) : (
                            <label 
                              htmlFor={`comprovante-${pagamento.id}`}
                              className="cursor-pointer block"
                            >
                              <FiFileText className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                              <p className="text-sm text-gray-500">Clique para adicionar comprovante</p>
                              <p className="text-xs text-gray-400">PDF ou imagem</p>
                            </label>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex-1 flex flex-col justify-end">
                      <button
                        onClick={() => abrirConfirmacao(pagamento)}
                        className="w-full bg-[#81059e] text-white py-2 px-4 rounded-lg flex items-center justify-center font-medium hover:bg-[#6f0486]"
                      >
                        <FiCheck className="mr-2" /> Confirmar Pagamento
                      </button>
                      
                      {pagamento.tipo === 'venda' && pagamento.produtos && (
                        <button
                          onClick={() => {/* Lógica para visualizar detalhes completos */}}
                          className="w-full mt-2 border border-[#81059e] text-[#81059e] bg-white py-2 px-4 rounded-lg flex items-center justify-center font-medium hover:bg-purple-50"
                        >
                          <FiEye className="mr-2" /> Ver Venda Completa
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      {/* Modal de confirmação de pagamento */}
      {showConfirmDialog && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Confirmar Pagamento</h3>
            
            <div className="mb-4">
              <p className="text-sm text-gray-500 mb-4">
                Você está confirmando o recebimento do pagamento de:
              </p>
              
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="font-medium">{pagamentoParaConfirmar?.cliente?.nome}</p>
                <p className="text-sm text-gray-500">
                  {pagamentoParaConfirmar?.tipo === 'venda' ? 'Venda' : 'Conta'} #{pagamentoParaConfirmar?.id.substring(0, 8)}...
                </p>
                <p className="text-lg font-bold text-[#81059e] mt-1">
                  {formatCurrency(pagamentoParaConfirmar?.total || pagamentoParaConfirmar?.valor || 0)}
                </p>
              </div>
            </div>
            
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FiClipboard className="inline mr-1" /> Observações (opcional)
              </label>
              <textarea
                value={obsConfirmacao}
                onChange={(e) => setObsConfirmacao(e.target.value)}
                className="w-full border border-gray-300 rounded-md p-2"
                rows="2"
                placeholder="Informações adicionais sobre o pagamento..."
              ></textarea>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowConfirmDialog(false);
                  setPagamentoParaConfirmar(null);
                  setObsConfirmacao('');
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancelar
              </button>
              
              <button
                onClick={confirmarPagamento}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-[#81059e] border border-transparent rounded-md hover:bg-[#6f0486] disabled:bg-purple-300"
              >
                {loading ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent mr-2 inline-block"></div>
                    Processando...
                  </>
                ) : (
                  'Confirmar'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GerenciamentoPagamentos;