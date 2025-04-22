"use client";

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { collection, getDocs, setDoc, doc, query, where, Timestamp } from "firebase/firestore";
import { firestore } from '@/lib/firebaseConfig';
import Layout from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';
import { v4 as uuidv4 } from 'uuid';
import { FiUser, FiDollarSign } from 'react-icons/fi';

export default function CreateCollectionCasePage() {
    const { userPermissions, userData } = useAuth();
    const [formData, setFormData] = useState({
        cliente: '',
        cpf: '',
        origem: '',
        formaPagamento: '',
        valor: '',
        dataCobranca: '',
        loja: 'loja1',
        status: 'Em aberto',
        observacoes: '',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [showSuccessPopup, setShowSuccessPopup] = useState(false);
    const [contasAtrasadas, setContasAtrasadas] = useState([]);
    const [selectedLoja, setSelectedLoja] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [consumers, setConsumers] = useState([]);
    const router = useRouter();

    useEffect(() => {
        // Inicializar com a data atual
        const today = new Date();
        const formattedDate = today.toISOString().split('T')[0];

        setFormData(prev => ({
            ...prev,
            dataCobranca: formattedDate
        }));

        // Definir loja inicial baseado nas permissões
        if (userPermissions) {
            // Se não for admin, usa a primeira loja que tem acesso
            if (!userPermissions.isAdmin && userPermissions.lojas && userPermissions.lojas.length > 0) {
                setSelectedLoja(userPermissions.lojas[0]);
                setFormData(prev => ({ ...prev, loja: userPermissions.lojas[0] }));
            }
            // Se for admin, usa a primeira loja da lista
            else if (userPermissions.isAdmin && userPermissions.lojas && userPermissions.lojas.length > 0) {
                setSelectedLoja(userPermissions.lojas[0]);
                setFormData(prev => ({ ...prev, loja: userPermissions.lojas[0] }));
            }
        }
    }, [userPermissions]);

    // Função para buscar contas atrasadas do cliente
    const buscarContasAtrasadas = async (cpf, loja) => {
        if (!cpf || !loja) return;

        const lojaPath = loja === 'loja1' ? 'loja1' : 'loja2';
        setIsLoading(true);

        try {
            const contasRef = collection(firestore, `lojas/${lojaPath}/financeiro/contas_receber/items`);
            const snapshot = await getDocs(contasRef);

            const hoje = new Date();
            const contasVencidas = snapshot.docs
                .map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    selecionada: false
                }))
                .filter(conta => {
                    // Filtrar somente contas do cliente
                    if (conta.cpf !== cpf) return false;

                    // Verificar se a conta está vencida
                    if (conta.dataCobranca && conta.dataCobranca.seconds) {
                        const dataVencimento = new Date(conta.dataCobranca.seconds * 1000);
                        return dataVencimento < hoje;
                    }
                    return false;
                });

            setContasAtrasadas(contasVencidas);
        } catch (error) {
            console.error('Erro ao buscar contas atrasadas:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
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

    const toggleContaSelecionada = (contaId) => {
        setContasAtrasadas(prev =>
            prev.map(conta =>
                conta.id === contaId
                    ? { ...conta, selecionada: !conta.selecionada }
                    : conta
            )
        );
    };

    const calcularValorTotal = () => {
        return contasAtrasadas
            .filter(conta => conta.selecionada)
            .reduce((total, conta) => total + parseFloat(conta.valor || 0), 0)
            .toFixed(2);
    };

    const handleStatusChange = (status) => {
        setFormData(prev => ({
            ...prev,
            status
        }));
    };

    // Função para buscar clientes
    const fetchConsumers = async () => {
        if (searchTerm.trim() === "" || !selectedLoja) {
            setConsumers([]);
            return;
        }

        setIsLoading(true);
        try {
            const clientesRef = collection(firestore, 'lojas/clientes/users');
            const querySnapshot = await getDocs(
                query(clientesRef,
                    where('nome', '>=', searchTerm),
                    where('nome', '<=', searchTerm + '\uf8ff')
                )
            );

            let clientesData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

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
            setConsumers([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchConsumers();
    }, [searchTerm, selectedLoja]);

    const handleClienteSelect = (cliente) => {
        setFormData(prev => ({
            ...prev,
            cliente: cliente.nome,
            cpf: cliente.cpf
        }));
        setSearchTerm(cliente.nome);
        setConsumers([]);
    };

    // Função para formatar CPF
    const formatCPF = (cpf) => {
        if (!cpf) return '';
        cpf = cpf.replace(/\D/g, '');
        return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // Se o cliente não foi selecionado da lista, criar um novo cliente
            if (!formData.cpf && formData.cliente) {
                const novoClienteRef = doc(collection(firestore, 'lojas/clientes/users'));
                await setDoc(novoClienteRef, {
                    nome: formData.cliente,
                    cpf: formData.cpf || '',
                    createdAt: Timestamp.now(),
                    updatedAt: Timestamp.now()
                });
            }

            const casoId = uuidv4();

            // Converter valor de string formatada para number se necessário
            let valorNumerico = formData.valor;
            if (typeof formData.valor === 'string' && formData.valor.includes('R$')) {
                valorNumerico = parseFloat(
                    formData.valor
                        .replace(/[^\d,]/g, '') // Remove tudo exceto dígitos e vírgula 
                        .replace(',', '.') // Substitui vírgula por ponto 
                );
            }

            const contasSelecionadas = contasAtrasadas.filter(conta => conta.selecionada);

            // Verificar dados obrigatórios
            if (!formData.cliente || !formData.cpf || !formData.dataCobranca) {
                alert('Por favor, preencha todos os campos obrigatórios.');
                setIsLoading(false);
                return;
            }

            const casoData = {
                id: casoId,
                cliente: formData.cliente,
                cpf: formData.cpf,
                origem: formData.origem,
                formaPagamento: formData.formaPagamento,
                valor: valorNumerico,
                dataCobranca: Timestamp.fromDate(new Date(formData.dataCobranca)),
                loja: formData.loja,
                status: formData.status,
                observacoes: formData.observacoes,
                dataCriacao: Timestamp.now(),
                dividas: contasSelecionadas.map(conta => ({
                    id: conta.id,
                    valor: conta.valor,
                    dataVencimento: conta.dataCobranca,
                    numeroDocumento: conta.numeroDocumento || '',
                })),
                criadorPor: userData?.nome || 'Sistema'
            };

            // Salvar o caso na coleção de acordos
            const lojaPath = formData.loja;
            const casoRef = doc(collection(firestore, `${lojaPath}/agreements/acordos`));
            await setDoc(casoRef, casoData);

            setShowSuccessPopup(true);

            setTimeout(() => {
                setShowSuccessPopup(false);
                router.push('/list_agreements');
            }, 2000);
        } catch (error) {
            console.error('Erro ao criar caso de cobrança:', error);
            alert('Erro ao criar caso de cobrança. Tente novamente.');
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

    const handleClear = () => {
        const today = new Date();
        const formattedDate = today.toISOString().split('T')[0];

        setFormData({
            cliente: '',
            cpf: '',
            origem: '',
            formaPagamento: '',
            valor: '',
            dataCobranca: formattedDate,
            loja: selectedLoja || 'loja1',
            status: 'Em aberto',
            observacoes: '',
        });
        setContasAtrasadas([]);
    };

    return (
        <Layout>
            <div className="min-h-screen">
                <div className="w-full max-w-5xl mx-auto">
                    <h1 className="text-3xl font-bold text-[#81059e] mb-8 mt-8">ADICIONAR COBRANÇA</h1>

                    {/* Seletor de Loja para Admins */}
                    {userPermissions?.isAdmin && (
                        <div className="mb-6">
                            <label className="text-[#81059e] font-medium">Selecionar Loja</label>
                            <select
                                name="loja"
                                value={formData.loja || ''}
                                onChange={handleChange}
                                className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black mt-1"
                            >
                                <option value="">Selecione uma loja</option>
                                {userPermissions.lojas && userPermissions.lojas.map((loja) => (
                                    <option key={loja} value={loja}>
                                        {renderLojaName(loja)}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className='space-x-2 mb-6'>
                        <button
                            onClick={() => router.push('/billing/list-collection-cases')}
                            className="bg-[#81059e] p-2 rounded-sm text-white"
                        >
                            COBRANÇAS PENDENTES
                        </button>
                        <button
                            onClick={handleClear}
                            className="text-[#81059e] px-3 py-1 border-2 border-[#81059e] font-bold text-base rounded-sm"
                        >
                            Limpar
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="mt-8 mb-20">
                        {/* Seção Cliente */}
                        <div className="p-4 bg-gray-50 rounded-lg mb-6">
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
                                        className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black"
                                        required
                                    />
                                    {searchTerm && consumers.length > 0 && (
                                        <div className="absolute w-full z-10">
                                            <ul className="bg-white border-2 border-[#81059e] rounded-lg w-full max-h-[104px] overflow-y-auto shadow-lg custom-scroll">
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
                                        className="border-2 border-[#81059e] p-3 rounded-lg w-full bg-gray-100 text-black"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Seção de informações de Cobrança */}
                        <div className="p-4 bg-gray-50 rounded-lg mb-6">
                            <h3 className="text-lg font-semibold text-[#81059e] mb-4 flex items-center gap-2">
                                <FiDollarSign /> Informações de Cobrança
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <label className="text-[#81059e] font-medium">Origem</label>
                                    <input
                                        type="text"
                                        name="origem"
                                        value={formData.origem}
                                        onChange={handleChange}
                                        placeholder="Origem"
                                        className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black"
                                    />
                                </div>
                                <div>
                                    <label className="text-[#81059e] font-medium">Valor</label>
                                    <input
                                        type="text"
                                        name="valor"
                                        value={formData.valor}
                                        onChange={handleValorChange}
                                        placeholder="R$ 0,00"
                                        className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-[#81059e] font-medium">Data de Cobrança</label>
                                    <input
                                        type="date"
                                        name="dataCobranca"
                                        value={formData.dataCobranca}
                                        onChange={handleChange}
                                        className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-[#81059e] font-medium">Forma de Pagamento</label>
                                    <select
                                        name="formaPagamento"
                                        value={formData.formaPagamento}
                                        onChange={handleChange}
                                        className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black"
                                    >
                                        <option value="">Selecione</option>
                                        <option value="Dinheiro">Dinheiro</option>
                                        <option value="Cartão de Crédito">Cartão de Crédito</option>
                                        <option value="Cartão de Débito">Cartão de Débito</option>
                                        <option value="Pix">Pix</option>
                                        <option value="Boleto">Boleto</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[#81059e] font-medium">Loja</label>
                                    <select
                                        name="loja"
                                        value={formData.loja}
                                        onChange={handleChange}
                                        className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black"
                                    >
                                        <option value="loja1">Óticas Popular 1</option>
                                        <option value="loja2">Óticas Popular 2</option>
                                    </select>
                                </div>
                            </div>

                            <div className="mt-4">
                                <label className="text-[#81059e] font-medium">Status</label>
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        onClick={() => handleStatusChange('Em aberto')}
                                        className={`border-2 border-[#81059e] rounded-md px-4 py-2 ${formData.status === 'Em aberto'
                                            ? 'bg-[#81059e] text-white'
                                            : 'text-[#81059e] bg-white'
                                            }`}
                                    >
                                        EM ABERTO
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleStatusChange('Advogado')}
                                        className={`border-2 border-[#81059e] rounded-md px-4 py-2 ${formData.status === 'Advogado'
                                            ? 'bg-[#81059e] text-white'
                                            : 'text-[#81059e] bg-white'
                                            }`}
                                    >
                                        ADVOGADO
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleStatusChange('Judicial')}
                                        className={`border-2 border-[#81059e] rounded-md px-4 py-2 ${formData.status === 'Judicial'
                                            ? 'bg-[#81059e] text-white'
                                            : 'text-[#81059e] bg-white'
                                            }`}
                                    >
                                        JUDICIAL
                                    </button>
                                </div>
                            </div>

                            <div className="mt-4">
                                <label className="text-[#81059e] font-medium">Observações</label>
                                <textarea
                                    name="observacoes"
                                    value={formData.observacoes}
                                    onChange={handleChange}
                                    placeholder="Observações"
                                    className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black min-h-[120px]"
                                ></textarea>
                            </div>
                        </div>

                        {/* Lista de contas atrasadas, se houver */}
                        {contasAtrasadas.length > 0 && (
                            <div className="p-4 bg-gray-50 rounded-lg mb-6">
                                <h2 className="text-lg font-semibold text-[#81059e] mb-4">Contas Atrasadas Associadas</h2>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full bg-white">
                                        <thead className="bg-[#81059e] text-white">
                                            <tr>
                                                <th className="py-2 px-4 text-center">Selecionar</th>
                                                <th className="py-2 px-4 text-left">Documento</th>
                                                <th className="py-2 px-4 text-left">Vencimento</th>
                                                <th className="py-2 px-4 text-right">Valor</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {contasAtrasadas.map(conta => (
                                                <tr key={conta.id} className="border-b hover:bg-gray-100">
                                                    <td className="py-2 px-4 text-center">
                                                        <input
                                                            type="checkbox"
                                                            checked={conta.selecionada}
                                                            onChange={() => toggleContaSelecionada(conta.id)}
                                                            className="h-4 w-4"
                                                        />
                                                    </td>
                                                    <td className="py-2 px-4">{conta.numeroDocumento || conta.id.slice(0, 8)}</td>
                                                    <td className="py-2 px-4">
                                                        {conta.dataCobranca?.seconds ?
                                                            new Date(conta.dataCobranca.seconds * 1000).toLocaleDateString('pt-BR') : 'N/A'}
                                                    </td>
                                                    <td className="py-2 px-4 text-right">
                                                        R$ {parseFloat(conta.valor || 0).toFixed(2)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Botões de ação */}
                        <div className="flex justify-center gap-6 mt-8">
                            <button
                                type="submit"
                                className="bg-[#81059e] p-2 px-3 rounded-sm text-white"
                                disabled={isLoading}
                            >
                                {isLoading ? 'PROCESSANDO...' : 'REGISTRAR'}
                            </button>
                            <button
                                type="button"
                                onClick={() => router.push('/billing')}
                                className="border-2 border-[#81059e] p-2 px-3 rounded-sm text-[#81059e]"
                                disabled={isLoading}
                            >
                                CANCELAR
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Modal de sucesso */}
            {showSuccessPopup && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white p-6 rounded-md shadow-lg">
                        <p className="text-lg font-bold text-[#81059e]">Caso de cobrança criado com sucesso!</p>
                    </div>
                </div>
            )}
        </Layout>
    );
}