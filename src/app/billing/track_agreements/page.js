"use client";

import { useState, useEffect } from 'react';
import { collection, getDocs, query, where, Timestamp, updateDoc, doc } from "firebase/firestore";
import { firestore } from '@/lib/firebaseConfig';
import Sidebar from '@/components/Sidebar';
import Layout from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';
import { FaCalendarAlt, FaCheck, FaUndoAlt, FaPhoneAlt, FaEnvelope, FaInfoCircle } from 'react-icons/fa';

export default function AcompanhamentoPage() {
    const { userPermissions } = useAuth();
    const [casosAgendados, setCasosAgendados] = useState([]);
    const [casosAtrasados, setCasosAtrasados] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedLoja, setSelectedLoja] = useState('all');
    const [viewMode, setViewMode] = useState('pendentes'); // 'pendentes' ou 'todos'

    const fetchCasosAcompanhamento = async () => {
        setIsLoading(true);
        try {
            let casosAgendadosData = [];
            let casosAtrasadosData = [];
            const lojas = userPermissions?.lojas || [];
            const hoje = new Date();

            for (const loja of lojas) {
                if (selectedLoja !== 'all' && selectedLoja !== loja) continue;

                const casosRef = collection(firestore, `lojas/${loja}/cobrancas/casos`);
                let casosQuery;
                
                // Se estiver no modo 'pendentes', busca apenas casos com proxContato
                if (viewMode === 'pendentes') {
                    casosQuery = query(
                        casosRef, 
                        where('proxContato', '!=', null)
                    );
                } else {
                    // No modo 'todos', busca todos os casos
                    casosQuery = casosRef;
                }

                const casosSnapshot = await getDocs(casosQuery);
                
                const casosData = casosSnapshot.docs.map((doc) => ({ 
                    id: doc.id, 
                    loja, 
                    ...doc.data() 
                }));
                
                // Separar casos por data de próximo contato
                casosData.forEach(caso => {
                    if (caso.proxContato) {
                        const dataProxContato = new Date(caso.proxContato.seconds * 1000);
                        
                        // Verificar se o próximo contato já passou
                        if (dataProxContato < hoje) {
                            caso.atrasado = true;
                            casosAtrasadosData.push(caso);
                        } else {
                            casosAgendadosData.push(caso);
                        }
                    } else if (viewMode === 'todos') {
                        // Se não tem próximo contato mas está no modo 'todos', adiciona aos atrasados
                        caso.semContato = true;
                        casosAtrasadosData.push(caso);
                    }
                });
            }

            // Ordenar por data de próximo contato
            casosAgendadosData.sort((a, b) => {
                const dataA = a.proxContato ? new Date(a.proxContato.seconds * 1000) : new Date(0);
                const dataB = b.proxContato ? new Date(b.proxContato.seconds * 1000) : new Date(0);
                return dataA - dataB;
            });

            casosAtrasadosData.sort((a, b) => {
                if (a.semContato && !b.semContato) return 1;
                if (!a.semContato && b.semContato) return -1;
                
                const dataA = a.proxContato ? new Date(a.proxContato.seconds * 1000) : new Date(0);
                const dataB = b.proxContato ? new Date(b.proxContato.seconds * 1000) : new Date(0);
                return dataA - dataB;
            });

            setCasosAgendados(casosAgendadosData);
            setCasosAtrasados(casosAtrasadosData);
        } catch (error) {
            console.error("Erro ao buscar os casos: ", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (userPermissions?.lojas?.length > 0) {
            fetchCasosAcompanhamento();
        }
    }, [selectedLoja, viewMode, userPermissions]);

    const marcarComoConcluido = async (caso) => {
        try {
            setIsLoading(true);
            const casoRef = doc(firestore, `lojas/${caso.loja}/cobrancas/casos`, caso.id);
            
            // Atualizar o histórico do caso
            const historicoAtualizado = [
                ...(caso.historico || []),
                {
                    data: Timestamp.now(),
                    acao: `Contato marcado como concluído`,
                    usuario: 'Sistema' // Idealmente seria o nome do usuário logado
                }
            ];
            
            // Limpar o próximo contato e atualizar o último contato
            await updateDoc(casoRef, {
                proxContato: null,
                dataUltimoContato: Timestamp.now(),
                dataAtualizacao: Timestamp.now(),
                historico: historicoAtualizado
            });
            
            // Atualizar a interface
            fetchCasosAcompanhamento();
        } catch (error) {
            console.error("Erro ao marcar contato como concluído:", error);
            alert("Erro ao atualizar o caso. Tente novamente.");
        } finally {
            setIsLoading(false);
        }
    };

    const reagendarContato = async (caso, novaData) => {
        try {
            setIsLoading(true);
            const casoRef = doc(firestore, `lojas/${caso.loja}/cobrancas/casos`, caso.id);
            
            // Atualizar o histórico do caso
            const historicoAtualizado = [
                ...(caso.historico || []),
                {
                    data: Timestamp.now(),
                    acao: `Contato reagendado para ${new Date(novaData).toLocaleDateString('pt-BR')}`,
                    usuario: 'Sistema' // Idealmente seria o nome do usuário logado
                }
            ];
            
            // Atualizar o próximo contato
            await updateDoc(casoRef, {
                proxContato: Timestamp.fromDate(new Date(novaData)),
                dataAtualizacao: Timestamp.now(),
                historico: historicoAtualizado
            });
            
            // Atualizar a interface
            fetchCasosAcompanhamento();
        } catch (error) {
            console.error("Erro ao reagendar contato:", error);
            alert("Erro ao atualizar o caso. Tente novamente.");
        } finally {
            setIsLoading(false);
        }
    };

    // Formatar data do Firebase
    const formatFirestoreDate = (firestoreDate) => {
        if (!firestoreDate) return 'N/A';
        if (firestoreDate && typeof firestoreDate === 'object' && firestoreDate.seconds) {
            const date = new Date(firestoreDate.seconds * 1000);
            return date.toLocaleDateString('pt-BR');
        }
        return firestoreDate;
    };

    const getStatusClassColor = (status) => {
        switch (status) {
            case 'Em aberto':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'Advogado':
                return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'Judicial':
                return 'bg-red-100 text-red-800 border-red-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const DiasAtrasado = ({ dataProxContato }) => {
        if (!dataProxContato) return null;
        const hoje = new Date();
        const data = new Date(dataProxContato.seconds * 1000);
        const diffTime = Math.abs(hoje - data);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return (
            <span className="text-red-600 text-xs font-semibold">
                {diffDays} {diffDays === 1 ? 'dia' : 'dias'} atrasado
            </span>
        );
    };

    return (
        <Layout>
            <div className="flex">
                <Sidebar />
                <div className="flex-1 p-4">
                    <h1 className="text-purple-700 text-xl font-bold mb-4">Acompanhamento de Cobranças</h1>

                    <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Loja:</label>
                            <select
                                value={selectedLoja}
                                onChange={(e) => setSelectedLoja(e.target.value)}
                                className="border rounded w-full py-2 px-3 text-gray-700"
                            >
                                <option value="all">Todas as Lojas</option>
                                {userPermissions?.lojas?.map((loja) => (
                                    <option key={loja} value={loja}>
                                        {loja === 'loja1' ? 'Óticas Masi 1' : 'Óticas Masi 2'}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Visualização:</label>
                            <div className="flex space-x-4">
                                <button
                                    className={`px-4 py-2 rounded ${viewMode === 'pendentes' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                                    onClick={() => setViewMode('pendentes')}
                                >
                                    Pendentes
                                </button>
                                <button
                                    className={`px-4 py-2 rounded ${viewMode === 'todos' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                                    onClick={() => setViewMode('todos')}
                                >
                                    Todos
                                </button>
                            </div>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="flex justify-center py-10">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#81059e]"></div>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {/* Casos Atrasados */}
                            {casosAtrasados.length > 0 && (
                                <div>
                                    <h2 className="text-lg font-bold text-red-600 mb-3 flex items-center">
                                        <FaInfoCircle className="mr-2" />
                                        Contatos Atrasados ({casosAtrasados.length})
                                    </h2>
                                    <div className="bg-red-50 rounded-lg border border-red-200 p-4 mb-4">
                                        <p className="text-sm text-red-700 mb-2">
                                            Estes contatos estão atrasados e precisam de atenção imediata.
                                        </p>
                                    </div>
                                    <div className="space-y-4">
                                        {casosAtrasados.map((caso) => (
                                            <div 
                                                key={caso.id} 
                                                className="bg-white p-4 rounded-lg shadow border-l-4 border-red-500"
                                            >
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h3 className="text-lg font-bold text-gray-800">
                                                            {caso.cliente}
                                                        </h3>
                                                        <div className="mt-1">
                                                            {caso.semContato ? (
                                                                <span className="text-red-600 text-xs font-semibold">
                                                                    Nenhum contato agendado
                                                                </span>
                                                            ) : (
                                                                <>
                                                                    <p className="text-sm text-gray-600">
                                                                        <span className="font-semibold">Previsão:</span> {formatFirestoreDate(caso.proxContato)}
                                                                    </p>
                                                                    <DiasAtrasado dataProxContato={caso.proxContato} />
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getStatusClassColor(caso.status)}`}>
                                                        {caso.status}
                                                    </span>
                                                </div>

                                                <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
                                                    <p className="text-sm">
                                                        <span className="font-semibold">Loja:</span> {caso.loja === 'loja1' ? 'Óticas Masi 1' : 'Óticas Masi 2'}
                                                    </p>
                                                    <p className="text-sm">
                                                        <span className="font-semibold">Valor:</span> R$ {parseFloat(caso.valor || 0).toFixed(2)}
                                                    </p>
                                                    <p className="text-sm">
                                                        <span className="font-semibold">Último contato:</span> {formatFirestoreDate(caso.dataUltimoContato)}
                                                    </p>
                                                </div>

                                                <div className="mt-4 flex flex-wrap gap-2">
                                                    <button
                                                        onClick={() => {
                                                            const novaData = prompt('Informe a nova data para contato (DD/MM/AAAA):');
                                                            if (novaData) {
                                                                const [dia, mes, ano] = novaData.split('/');
                                                                const dataFormatada = `${ano}-${mes}-${dia}`;
                                                                reagendarContato(caso, dataFormatada);
                                                            }
                                                        }}
                                                        className="flex items-center space-x-1 bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                                                    >
                                                        <FaCalendarAlt className="h-4 w-4" />
                                                        <span>Reagendar</span>
                                                    </button>

                                                    <button
                                                        onClick={() => marcarComoConcluido(caso)}
                                                        className="flex items-center space-x-1 bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                                                    >
                                                        <FaCheck className="h-4 w-4" />
                                                        <span>Marcar como Concluído</span>
                                                    </button>

                                                    <a
                                                        href={`tel:${caso.telefone || ''}`}
                                                        className="flex items-center space-x-1 bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700"
                                                    >
                                                        <FaPhoneAlt className="h-4 w-4" />
                                                        <span>Ligar</span>
                                                    </a>

                                                    {caso.email && (
                                                        <a
                                                            href={`mailto:${caso.email}`}
                                                            className="flex items-center space-x-1 bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700"
                                                        >
                                                            <FaEnvelope className="h-4 w-4" />
                                                            <span>Email</span>
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Casos Agendados */}
                            {casosAgendados.length > 0 && (
                                <div>
                                    <h2 className="text-lg font-bold text-green-600 mb-3 flex items-center">
                                        <FaCalendarAlt className="mr-2" />
                                        Contatos Agendados ({casosAgendados.length})
                                    </h2>
                                    <div className="space-y-4">
                                        {casosAgendados.map((caso) => (
                                            <div 
                                                key={caso.id} 
                                                className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500"
                                            >
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h3 className="text-lg font-bold text-gray-800">
                                                            {caso.cliente}
                                                        </h3>
                                                        <p className="text-sm text-gray-600">
                                                            <span className="font-semibold">Previsão:</span> {formatFirestoreDate(caso.proxContato)}
                                                        </p>
                                                    </div>
                                                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getStatusClassColor(caso.status)}`}>
                                                        {caso.status}
                                                    </span>
                                                </div>

                                                <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
                                                    <p className="text-sm">
                                                        <span className="font-semibold">Loja:</span> {caso.loja === 'loja1' ? 'Óticas Masi 1' : 'Óticas Masi 2'}
                                                    </p>
                                                    <p className="text-sm">
                                                        <span className="font-semibold">Valor:</span> R$ {parseFloat(caso.valor || 0).toFixed(2)}
                                                    </p>
                                                    <p className="text-sm">
                                                        <span className="font-semibold">Último contato:</span> {formatFirestoreDate(caso.dataUltimoContato)}
                                                    </p>
                                                </div>

                                                <div className="mt-4 flex flex-wrap gap-2">
                                                    <button
                                                        onClick={() => {
                                                            const novaData = prompt('Informe a nova data para contato (DD/MM/AAAA):');
                                                            if (novaData) {
                                                                const [dia, mes, ano] = novaData.split('/');
                                                                const dataFormatada = `${ano}-${mes}-${dia}`;
                                                                reagendarContato(caso, dataFormatada);
                                                            }
                                                        }}
                                                        className="flex items-center space-x-1 bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                                                    >
                                                        <FaCalendarAlt className="h-4 w-4" />
                                                        <span>Reagendar</span>
                                                    </button>

                                                    <button
                                                        onClick={() => marcarComoConcluido(caso)}
                                                        className="flex items-center space-x-1 bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                                                    >
                                                        <FaCheck className="h-4 w-4" />
                                                        <span>Marcar como Concluído</span>
                                                    </button>

                                                    <a
                                                        href={`tel:${caso.telefone || ''}`}
                                                        className="flex items-center space-x-1 bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700"
                                                    >
                                                        <FaPhoneAlt className="h-4 w-4" />
                                                        <span>Ligar</span>
                                                    </a>

                                                    {caso.email && (
                                                        <a
                                                            href={`mailto:${caso.email}`}
                                                            className="flex items-center space-x-1 bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700"
                                                        >
                                                            <FaEnvelope className="h-4 w-4" />
                                                            <span>Email</span>
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {casosAgendados.length === 0 && casosAtrasados.length === 0 && (
                                <div className="text-center py-10">
                                    <p className="text-gray-500 text-lg">
                                        Nenhum caso de cobrança encontrado para acompanhamento.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}