// src/components/OSManager.js
import React, { useState, useEffect } from 'react';
import { FiFileText, FiClipboard, FiEye, FiInfo, FiEdit3, FiX, FiCheck, FiAlertTriangle } from 'react-icons/fi';

const OSManager = ({ cartItems, selectedClient, onOSChange, collections, activeCollection }) => {
    // Estados para gerenciar os dados da OS global
    const [osType, setOsType] = useState('completa'); // completa, incompleta, sem_os
    const [osStatus, setOsStatus] = useState('em_montagem');
    const [osObservacoes, setOsObservacoes] = useState('');

    // Estado para controle de formulários de OS
    const [activeOSForm, setActiveOSForm] = useState(null); // Armazena o ID da coleção com formulário aberto
    const [osData, setOsData] = useState({}); // Armazena os dados do formulário para cada coleção
    const [expandedCollection, setExpandedCollection] = useState(null);

    // Função para determinar se um item precisa de OS
    const precisaDeOS = (item) => {
        if (!item || !item.categoria) return false;

        // Produtos que podem precisar de OS
        const categoriasComOS = ['armacoes', 'lentes', 'solares'];

        // Para solares, verificar se tem grau
        if (item.categoria === 'solares') {
            return item.info_geral?.tem_grau || item.info_adicional?.tem_grau || false;
        }

        return categoriasComOS.includes(item.categoria);
    };

    // Função para verificar se uma coleção tem produtos que precisam de OS
    const colecaoPrecisaDeOS = (colecao) => {
        return colecao.items && colecao.items.some(item => precisaDeOS(item));
    };

    // Função para determinar se a coleção forma uma OS completa
    const isOSCompleta = (colecao) => {
        if (!colecao.items) return false;

        const temArmacao = colecao.items.some(item => item.categoria === 'armacoes');
        const temLente = colecao.items.some(item => item.categoria === 'lentes');

        // Verifica se tem óculos solar com grau
        const temSolarComGrau = colecao.items.some(
            item => item.categoria === 'solares' && (item.info_geral?.tem_grau || item.info_adicional?.tem_grau)
        );

        return (temArmacao && temLente) || temSolarComGrau;
    };

    // Função para determinar se a coleção forma uma OS incompleta
    const isOSIncompleta = (colecao) => {
        if (!colecaoPrecisaDeOS(colecao) || !colecao.items) return false;

        const temArmacao = colecao.items.some(item => item.categoria === 'armacoes');
        const temLente = colecao.items.some(item => item.categoria === 'lentes');

        return (temArmacao && !temLente) || (!temArmacao && temLente);
    };

    // Determinar o tipo ideal de OS para uma coleção
    const determinarTipoOSParaColecao = (colecao) => {
        if (!colecaoPrecisaDeOS(colecao)) return 'sem_os';
        if (isOSCompleta(colecao)) return 'completa';
        if (isOSIncompleta(colecao)) return 'incompleta';
        return 'sem_os';
    };

    // Inicializar dados da OS para uma coleção
    const inicializarDadosOS = (colecaoId, tipoRecomendado) => {
        // Se já temos dados para esta coleção, retornamos
        if (osData[colecaoId]) return;

        const novosDados = {
            tipoOS: tipoRecomendado,
            status: 'processamentoInicial',
            laboratorio: '',
            esferaDireito: '',
            cilindroDireito: '',
            eixoDireito: '',
            adicaoDireito: '',
            esferaEsquerdo: '',
            cilindroEsquerdo: '',
            eixoEsquerdo: '',
            adicaoEsquerdo: '',
            distanciaInterpupilar: '',
            altura: '',
            observacoes: osObservacoes,
            dataPrevistaEntrega: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            armacaoClienteDescricao: '',
            lentesClienteDescricao: '',
            // Novos campos para armação, tratamento e coloração
            larguraArmacao: '',
            alturaArmacao: '',
            ponteArmacao: '',
            medidasPersonalizadas: 'automatica',
            tipoAro: '',
            materialArmacao: 'acetato',
            tratamento: 'antirisco',
            temColoracao: 'nao',
            tonalidade: 'cinza',
            tipoIntensidade: 'degrade_80',
            usaPrisma: false,
            isCompleted: false // Flag para controlar se o formulário já foi preenchido
        };

        // Atualizar o estado com os novos dados
        setOsData(prevData => ({
            ...prevData,
            [colecaoId]: novosDados
        }));
    };

    // Verificar se todos os formulários de OS necessários estão preenchidos
    const allOSFormsCompleted = () => {
        if (!collections) return true;

        return collections.filter(colecao =>
            colecaoPrecisaDeOS(colecao) && (osType !== 'sem_os')
        ).every(colecao =>
            osData[colecao.id]?.isCompleted === true
        );
    };

    // Processar coleções e determinar tipo de OS
    useEffect(() => {
        if (!collections || collections.length === 0) return;

        // Inicializar dados para cada coleção
        collections.forEach(colecao => {
            if (colecao && colecao.items) {
                const tipoRecomendado = determinarTipoOSParaColecao(colecao);
                inicializarDadosOS(colecao.id, tipoRecomendado);
            }
        });

        // Determinar tipo global de OS
        if (collections.some(colecao => colecao.items && isOSCompleta(colecao))) {
            setOsType('completa');
        } else if (collections.some(colecao => colecao.items && isOSIncompleta(colecao))) {
            setOsType('incompleta');
        } else {
            setOsType('sem_os');
        }

        // Notificar o componente pai
        notifyParent();
    }, [collections, cartItems]);

    // Notificar o componente pai sobre mudanças
    const notifyParent = () => {
        onOSChange({
            tipo: osType,
            status: osStatus,
            observacoes: osObservacoes,
            colecoes: collections || [],
            osData: osData,
            allCompleted: allOSFormsCompleted()
        });
    };

    // Notificar quando os dados mudam
    useEffect(() => {
        notifyParent();
    }, [osType, osStatus, osObservacoes, osData]);

    // Abrir formulário de OS para uma coleção
    const openOSForm = (colecaoId) => {
        setActiveOSForm(colecaoId);

        // Garantir que temos dados inicializados para esta coleção
        const colecao = collections.find(c => c.id === colecaoId);
        if (colecao) {
            const tipoRecomendado = determinarTipoOSParaColecao(colecao);
            inicializarDadosOS(colecaoId, tipoRecomendado);
        }
    };

    // Fechar formulário de OS
    const closeOSForm = () => {
        setActiveOSForm(null);
    };

    // Salvar dados do formulário de OS
    const saveOSForm = (colecaoId, formData) => {
        // Marcar como completo
        const updatedData = {
            ...formData,
            isCompleted: true
        };

        setOsData(prevData => ({
            ...prevData,
            [colecaoId]: updatedData
        }));

        closeOSForm();
    };

    // Toggles a visualização expandida de uma coleção
    const toggleColecao = (colecaoId) => {
        if (expandedCollection === colecaoId) {
            setExpandedCollection(null);
        } else {
            setExpandedCollection(colecaoId);
        }
    };

    // Renderizar formulário de OS para uma coleção
    const renderOSForm = (colecaoId) => {
        const colecao = collections.find(c => c.id === colecaoId);
        if (!colecao) return null;

        const formData = osData[colecaoId] || {};
        const tipoRecomendado = determinarTipoOSParaColecao(colecao);

        // Obter detalhes dos produtos para exibir no formulário
        const armacao = colecao.items && colecao.items.find(item => item.categoria === 'armacoes');
        const lente = colecao.items && colecao.items.find(item => item.categoria === 'lentes');

        const armacaoDados = armacao ?
            `${armacao.nome || armacao.titulo || 'Armação'} - ${armacao.marca || 'Sem marca'}` :
            'Nenhuma armação selecionada';

        const lenteDados = lente ?
            `${lente.nome || lente.titulo || 'Lente'} - ${lente.marca || 'Sem marca'}` :
            'Nenhuma lente selecionada';

        // Determinar se é OS completa ou incompleta
        const osFormTipo = tipoRecomendado === 'completa' ? 'completa' :
            (armacao && !lente) ? 'somente_armacao' :
                (!armacao && lente) ? 'somente_lente' : 'completa';

        // Valores específicos para os dropdown conforme as imagens enviadas
        const esfericos = [6.00, 5.75, 5.50, 5.25, 5.00, 4.75, 4.50, 4.25, 4.00, 3.75, 3.50, 3.25, 3.00, 2.75, 2.50, 2.25, 2.00, 1.75, 1.50, 1.25, 1.00, 0.75, 0.50, 0.25, 0.00, -0.25, -0.50, -0.75, -1.00, -1.25, -1.50, -1.75, -2.00, -2.25, -2.50, -2.75, -3.00, -3.25, -3.50, -3.75, -4.00, -4.25, -4.50, -4.75, -5.00, -5.25, -5.50, -5.75, -6.00];
        const cilindricos = [-6.00, -5.75, -5.50, -5.25, -5.00, -4.75, -4.50, -4.25, -4.00, -3.75, -3.50, -3.25, -3.00, -2.75, -2.50, -2.25, -2.00, -1.75, -1.50, -1.25, -1.00, -0.75, -0.50, -0.25, 0.00];
        const eixos = Array.from({ length: 181 }, (_, i) => i);
        const adicoes = [0.75, 1.00, 1.25, 1.50, 1.75, 2.00, 2.25, 2.50, 2.75, 3.00, 3.25, 3.50];
        const dnpValores = [24, 24.5, 25, 25.5, 26, 26.5, 27, 27.5, 28, 28.5, 29, 29.5, 30, 30.5, 31, 31.5, 32, 32.5, 33, 33.5, 34, 34.5, 35, 35.5, 36, 36.5, 37, 37.5, 38, 38.5, 39, 39.5, 40];
        const alturaValores = [16, 16.5, 17, 17.5, 18, 18.5, 19, 19.5, 20, 20.5, 21, 21.5, 22, 22.5, 23, 23.5, 24, 24.5, 25, 25.5, 26, 26.5, 27, 27.5, 28, 28.5, 29, 29.5, 30, 30.5, 31, 31.5, 32, 32.5, 33, 33.5, 34, 34.5, 35];
        const prismaValores = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7];

        return (
            <div className="fixed inset-0 z-[80] overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center">
                <div className="bg-white  rounded-lg shadow-lg max-h-[90vh] overflow-y-auto w-full max-w-4xl m-4">
                    <div className="flex justify-between items-center mb-4 bg-[#81059e]">
                        <h2 className="text-xl font-bold text-white p-4">
                            Dados da Ordem de Serviço - {colecao.name}
                        </h2>
                        <button
                            onClick={closeOSForm}
                            className="text-gray-200 hover:text-gray-600"
                        >
                            <FiX size={24} />
                        </button>
                    </div>
                    <div className='p-6'>

                    {/* Alerta para OS especiais */}
                    {(osFormTipo === "somente_armacao" || osFormTipo === "somente_lente") && (
                        <div className="mb-4 p-3 bg-yellow-50 border-l-4 border-yellow-500 text-yellow-700">
                            <h3 className="font-medium">Atenção: OS Incompleta</h3>
                            <p className="text-sm">
                                {osFormTipo === "somente_armacao"
                                    ? "Cliente comprou apenas a armação. Lentes serão adicionadas depois?"
                                    : "Cliente comprou apenas as lentes. Vai usar com armação própria?"}
                            </p>
                        </div>
                    )}

                    <form onSubmit={(e) => {
                        e.preventDefault();

                        // Capturar todos os valores do formulário
                        const formElements = e.target.elements;
                        const formData = {};

                        for (let i = 0; i < formElements.length; i++) {
                            const element = formElements[i];
                            if (element.name) {
                                formData[element.name] = element.value;
                            }
                        }

                        // Adicionar dados dos produtos
                        formData.armacaoDados = armacaoDados;
                        formData.lenteDados = lenteDados;
                        formData.tipoOS = osFormTipo;

                        saveOSForm(colecaoId, formData);
                    }}>
                        {/* Campos do formulário de OS */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Laboratório</label>
                                <select
                                    name="laboratorio"
                                    defaultValue={formData.laboratorio || ''}
                                    className="w-full border-2 border-[#81059e] p-2 rounded-sm"
                                    required
                                >
                                    <option value="">Selecione...</option>
                                    <option value="Laboratório 1">Laboratório 1</option>
                                    <option value="Laboratório 2">Laboratório 2</option>
                                    <option value="Laboratório 3">Laboratório 3</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Status</label>
                                <select
                                    name="status"
                                    defaultValue={formData.status || 'processamentoInicial'}
                                    className="w-full border-2 border-[#81059e] p-2 rounded-sm"
                                    required
                                >
                                    <option value="processamentoInicial">Em processamento inicial</option>
                                    <option value="aguardandoCliente">Aguardando cliente trazer {osFormTipo === "somente_armacao" ? "lentes" : osFormTipo === "somente_lente" ? "armação" : "documentos"}</option>
                                    <option value="encaminhadoLaboratorio">Encaminhado ao Laboratório</option>
                                    <option value="montagemProgresso">Montagem em Progresso</option>
                                    <option value="prontoEntrega">Pronto para Entrega</option>
                                </select>
                            </div>
                        </div>

                        {/* Área de produtos */}
                        <div className="mb-4 border border-purple-200 rounded-sm p-4 bg-purple-50">
                            <h3 className="text-md font-medium text-[#81059e] mb-2">Produtos</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Armação */}
                                <div>
                                    <div className="flex justify-between">
                                        <label className="block text-sm font-medium text-gray-700">Armação</label>
                                        {osFormTipo === "somente_lente" && (
                                            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-sm">
                                                Cliente traz
                                            </span>
                                        )}
                                    </div>
                                    {osFormTipo === "somente_lente" ? (
                                        <div className="mt-2">
                                            <input
                                                type="text"
                                                name="armacaoClienteDescricao"
                                                defaultValue={formData.armacaoClienteDescricao || ""}
                                                placeholder="Descrição da armação do cliente"
                                                className="w-full border-2 border-[#81059e] p-2 rounded-sm"
                                            />
                                        </div>
                                    ) : (
                                        <div className="mt-2 p-3 bg-white border border-gray-200 rounded-sm">
                                            {armacaoDados}
                                        </div>
                                    )}
                                </div>

                                {/* Lentes */}
                                <div>
                                    <div className="flex justify-between">
                                        <label className="block text-sm font-medium text-gray-700">Lentes</label>
                                        {osFormTipo === "somente_armacao" && (
                                            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-sm">
                                                Cliente traz
                                            </span>
                                        )}
                                    </div>
                                    {osFormTipo === "somente_armacao" ? (
                                        <div className="mt-2">
                                            <input
                                                type="text"
                                                name="lentesClienteDescricao"
                                                defaultValue={formData.lentesClienteDescricao || ""}
                                                placeholder="Descrição das lentes do cliente"
                                                className="w-full border-2 border-[#81059e] p-2 rounded-sm"
                                            />
                                        </div>
                                    ) : (
                                        <div className="mt-2 p-3 bg-white border border-gray-200 rounded-sm">
                                            {lenteDados}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Receita médica */}
                        <div className="mb-4">
                            <h3 className="text-md font-medium text-[#81059e] mb-2">Receita Médica</h3>

                            {/* Cabeçalhos para colunas da receita */}
                            <div className="grid grid-cols-5 gap-2 mb-3">
                                <div className="col-span-1"></div>
                                <div className="text-center font-medium">Esférico</div>
                                <div className="text-center font-medium">Cilíndrico</div>
                                <div className="text-center font-medium">Eixo</div>
                                <div className="text-center font-medium">Adição</div>
                            </div>

                            {/* Olho Direito */}
                            <div className="grid grid-cols-5 gap-2 mb-4 items-center">
                                <div className="flex items-center">
                                    <svg className="w-5 h-5 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M12 5C5.63636 5 2 12 2 12C2 12 5.63636 19 12 19C18.3636 19 22 12 22 12C22 12 18.3636 5 12 5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                    <span className="font-medium">O.D.</span>
                                </div>

                                {/* Esférico O.D. */}
                                <div>
                                    <select
                                        name="esferaDireito"
                                        defaultValue={formData.esferaDireito || ''}
                                        className="w-full border-2 border-[#81059e] p-2 rounded-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                                        required
                                    >
                                        <option value="">Selecione</option>
                                        {esfericos.map(valor => (
                                            <option key={`esf-od-${valor}`} value={valor}>{valor > 0 ? `${valor.toFixed(2)}` : valor.toFixed(2)}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Cilíndrico O.D. */}
                                <div>
                                    <select
                                        name="cilindroDireito"
                                        defaultValue={formData.cilindroDireito || ''}
                                        className="w-full border-2 border-[#81059e] p-2 rounded-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                                        required
                                    >
                                        <option value="">Selecione</option>
                                        {cilindricos.map(valor => (
                                            <option key={`cil-od-${valor}`} value={valor}>{valor.toFixed(2)}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Eixo O.D. */}
                                <div>
                                    <select
                                        name="eixoDireito"
                                        defaultValue={formData.eixoDireito || ''}
                                        className="w-full border-2 border-[#81059e] p-2 rounded-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                                        required
                                    >
                                        <option value="">Selecione</option>
                                        {eixos.map(valor => (
                                            <option key={`eixo-od-${valor}`} value={valor}>{valor}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Adição O.D. */}
                                <div>
                                    <select
                                        name="adicaoDireito"
                                        defaultValue={formData.adicaoDireito || ''}
                                        className="w-full border-2 border-[#81059e] p-2 rounded-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                                    >
                                        <option value="">Selecione</option>
                                        {adicoes.map(valor => (
                                            <option key={`add-od-${valor}`} value={valor}>{valor.toFixed(2)}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Olho Esquerdo */}
                            <div className="grid grid-cols-5 gap-2 mb-6 items-center">
                                <div className="flex items-center">
                                    <svg className="w-5 h-5 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M12 5C5.63636 5 2 12 2 12C2 12 5.63636 19 12 19C18.3636 19 22 12 22 12C22 12 18.3636 5 12 5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                    <span className="font-medium">O.E.</span>
                                </div>

                                {/* Esférico O.E. */}
                                <div>
                                    <select
                                        name="esferaEsquerdo"
                                        defaultValue={formData.esferaEsquerdo || ''}
                                        className="w-full border-2 border-[#81059e] p-2 rounded-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                                        required
                                    >
                                        <option value="">Selecione</option>
                                        {esfericos.map(valor => (
                                            <option key={`esf-oe-${valor}`} value={valor}>{valor > 0 ? `${valor.toFixed(2)}` : valor.toFixed(2)}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Cilíndrico O.E. */}
                                <div>
                                    <select
                                        name="cilindroEsquerdo"
                                        defaultValue={formData.cilindroEsquerdo || ''}
                                        className="w-full border-2 border-[#81059e] p-2 rounded-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                                        required
                                    >
                                        <option value="">Selecione</option>
                                        {cilindricos.map(valor => (
                                            <option key={`cil-oe-${valor}`} value={valor}>{valor.toFixed(2)}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Eixo O.E. */}
                                <div>
                                    <select
                                        name="eixoEsquerdo"
                                        defaultValue={formData.eixoEsquerdo || ''}
                                        className="w-full border-2 border-[#81059e] p-2 rounded-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                                        required
                                    >
                                        <option value="">Selecione</option>
                                        {eixos.map(valor => (
                                            <option key={`eixo-oe-${valor}`} value={valor}>{valor}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Adição O.E. */}
                                <div>
                                    <select
                                        name="adicaoEsquerdo"
                                        defaultValue={formData.adicaoEsquerdo || ''}
                                        className="w-full border-2 border-[#81059e] p-2 rounded-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                                    >
                                        <option value="">Selecione</option>
                                        {adicoes.map(valor => (
                                            <option key={`add-oe-${valor}`} value={valor}>{valor.toFixed(2)}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* DNP e Altura - Cabeçalhos */}
                            <div className="grid grid-cols-5 gap-2 mb-2">
                                <div className="col-span-1"></div>
                                <div className="text-center font-medium col-span-2">DNP</div>
                                <div className="text-center font-medium col-span-2">Altura</div>
                            </div>

                            {/* DNP e Altura - Olho Direito */}
                            <div className="grid grid-cols-5 gap-2 mb-3 items-center">
                                <div className="flex items-center">
                                    <svg className="w-5 h-5 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M12 5C5.63636 5 2 12 2 12C2 12 5.63636 19 12 19C18.3636 19 22 12 22 12C22 12 18.3636 5 12 5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                    <span className="font-medium">O.D.</span>
                                </div>

                                {/* DNP O.D. */}
                                <div className="col-span-2">
                                    <select
                                        name="dnpDireito"
                                        defaultValue={formData.dnpDireito || ''}
                                        className="w-full border-2 border-[#81059e] p-2 rounded-sm bg-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-400"
                                        required
                                    >
                                        <option value="">Selecione</option>
                                        {dnpValores.map(valor => (
                                            <option key={`dnp-od-${valor}`} value={valor}>{valor}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Altura O.D. */}
                                <div className="col-span-2">
                                    <select
                                        name="alturaDireito"
                                        defaultValue={formData.alturaDireito || ''}
                                        className="w-full border-2 border-[#81059e] p-2 rounded-sm bg-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-400"
                                        required
                                    >
                                        <option value="">Selecione</option>
                                        {alturaValores.map(valor => (
                                            <option key={`alt-od-${valor}`} value={valor}>{valor}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* DNP e Altura - Olho Esquerdo */}
                            <div className="grid grid-cols-5 gap-2 mb-4 items-center">
                                <div className="flex items-center">
                                    <svg className="w-5 h-5 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M12 5C5.63636 5 2 12 2 12C2 12 5.63636 19 12 19C18.3636 19 22 12 22 12C22 12 18.3636 5 12 5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                    <span className="font-medium">O.E.</span>
                                </div>

                                {/* DNP O.E. */}
                                <div className="col-span-2">
                                    <select
                                        name="dnpEsquerdo"
                                        defaultValue={formData.dnpEsquerdo || ''}
                                        className="w-full border-2 border-[#81059e] p-2 rounded-sm bg-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-400"
                                        required
                                    >
                                        <option value="">Selecione</option>
                                        {dnpValores.map(valor => (
                                            <option key={`dnp-oe-${valor}`} value={valor}>{valor}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Altura O.E. */}
                                <div className="col-span-2">
                                    <select
                                        name="alturaEsquerdo"
                                        defaultValue={formData.alturaEsquerdo || ''}
                                        className="w-full border-2 border-[#81059e] p-2 rounded-sm bg-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-400"
                                        required
                                    >
                                        <option value="">Selecione</option>
                                        {alturaValores.map(valor => (
                                            <option key={`alt-oe-${valor}`} value={valor}>{valor}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Ilustração para DNP e Altura */}
                            <div className="flex justify-center mb-8 mt-8">
                                <div className="relative w-64 h-40">
                                    <img src="/images/dnp-altura.png" alt="Diagrama de óculos" className="w-full" />
                                </div>
                            </div>
                        </div>

                        {/* Seção de Prisma */}
                        <div className="mb-8">
                            <h3 className="text-lg font-medium text-[#81059e] mb-4">Prisma</h3>

                            {/* Checkbox para habilitar Prisma */}
                            <div className="mb-4 border-2 border-[#81059e] p-3 rounded-sm">
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        name="usaPrisma"
                                        defaultChecked={formData.usaPrisma || false}
                                        className="h-5 w-5 text-[#81059e]/70 rounded-sm border-gray-300 focus:ring-blue-500"
                                    />
                                    <span className="ml-2 text-lg font-medium">Prisma</span>
                                </label>
                            </div>

                            {/* Conteúdo do Prisma - só mostra se usaPrisma for true */}
                            {formData.usaPrisma && (
                                <>
                                    {/* Prisma Horizontal */}
                                    <div className="mb-4">
                                        <div className="mb-2 mt-2 font-semibold">Horizontal</div>

                                        <div className="grid grid-cols-5 gap-2 mb-2">
                                            <div className="col-span-1"></div>
                                            <div className="text-center font-medium">Prisma</div>
                                            <div className="text-center font-medium">Base</div>
                                            <div className="col-span-2"></div>
                                        </div>

                                        {/* Olho Direito - Horizontal */}
                                        <div className="grid grid-cols-5 gap-2 mb-4 items-center">
                                            <div className="flex items-center">
                                                <svg className="w-5 h-5 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M12 5C5.63636 5 2 12 2 12C2 12 5.63636 19 12 19C18.3636 19 22 12 22 12C22 12 18.3636 5 12 5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                    <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                                <span className="font-medium">O.D.</span>
                                            </div>

                                            {/* Prisma Horizontal O.D. */}
                                            <div>
                                                <select
                                                    name="prismaHorizontalDireito"
                                                    defaultValue={formData.prismaHorizontalDireito || ''}
                                                    className="w-full border-2 border-[#81059e] p-2 rounded-sm bg-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-400"
                                                >
                                                    <option value="">Selecione</option>
                                                    {prismaValores.map(valor => (
                                                        <option key={`prism-h-od-${valor}`} value={valor}>{valor.toFixed(2)}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            {/* Base Horizontal O.D. */}
                                            <div>
                                                <select
                                                    name="baseHorizontalDireito"
                                                    defaultValue={formData.baseHorizontalDireito || ''}
                                                    className="w-full border-2 border-[#81059e] p-2 rounded-sm bg-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-400"
                                                >
                                                    <option value="">Selecione</option>
                                                    <option value="Nasal">Nasal</option>
                                                    <option value="Temporal">Temporal</option>
                                                </select>
                                            </div>
                                            <div className="col-span-2"></div>
                                        </div>

                                        {/* Olho Esquerdo - Horizontal */}
                                        <div className="grid grid-cols-5 gap-2 mb-4 items-center">
                                            <div className="flex items-center">
                                                <svg className="w-5 h-5 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M12 5C5.63636 5 2 12 2 12C2 12 5.63636 19 12 19C18.3636 19 22 12 22 12C22 12 18.3636 5 12 5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                    <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                                <span className="font-medium">O.E.</span>
                                            </div>

                                            {/* Prisma Horizontal O.E. */}
                                            <div>
                                                <select
                                                    name="prismaHorizontalEsquerdo"
                                                    defaultValue={formData.prismaHorizontalEsquerdo || ''}
                                                    className="w-full border-2 border-[#81059e] p-2 rounded-sm bg-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-400"
                                                >
                                                    <option value="">Selecione</option>
                                                    {prismaValores.map(valor => (
                                                        <option key={`prism-h-oe-${valor}`} value={valor}>{valor.toFixed(2)}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            {/* Base Horizontal O.E. */}
                                            <div>
                                                <select
                                                    name="baseHorizontalEsquerdo"
                                                    defaultValue={formData.baseHorizontalEsquerdo || ''}
                                                    className="w-full border-2 border-[#81059e] p-2 rounded-sm bg-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-400"
                                                >
                                                    <option value="">Selecione</option>
                                                    <option value="Nasal">Nasal</option>
                                                    <option value="Temporal">Temporal</option>
                                                </select>
                                            </div>
                                            <div className="col-span-2"></div>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="mb-2 mt-2 font-semibold">Vertical</div>

                                        <div className="grid grid-cols-5 gap-2 mb-2">
                                            <div className="col-span-1"></div>
                                            <div className="text-center font-medium">Prisma</div>
                                            <div className="text-center font-medium">Base</div>
                                            <div className="col-span-2"></div>
                                        </div>

                                        {/* Olho Direito - Vertical */}
                                        <div className="grid grid-cols-5 gap-2 mb-4 items-center">
                                            <div className="flex items-center">
                                                <svg className="w-5 h-5 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M12 5C5.63636 5 2 12 2 12C2 12 5.63636 19 12 19C18.3636 19 22 12 22 12C22 12 18.3636 5 12 5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                    <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                                <span className="font-medium">O.D.</span>
                                            </div>

                                            {/* Prisma Vertical O.D. */}
                                            <div>
                                                <select
                                                    name="prismaVerticalDireito"
                                                    defaultValue={formData.prismaVerticalDireito || ''}
                                                    className="w-full border-2 border-[#81059e] p-2 rounded-sm bg-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-400"
                                                >
                                                    <option value="">Selecione</option>
                                                    {prismaValores.map(valor => (
                                                        <option key={`prism-v-od-${valor}`} value={valor}>{valor.toFixed(2)}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            {/* Base Vertical O.D. */}
                                            <div>
                                                <select
                                                    name="baseVerticalDireito"
                                                    defaultValue={formData.baseVerticalDireito || ''}
                                                    className="w-full border-2 border-[#81059e] p-2 rounded-sm bg-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-400"
                                                >
                                                    <option value="">Selecione</option>
                                                    <option value="Superior">Superior</option>
                                                    <option value="Inferior">Inferior</option>
                                                </select>
                                            </div>
                                            <div className="col-span-2"></div>
                                        </div>

                                        {/* Olho Esquerdo - Vertical */}
                                        <div className="grid grid-cols-5 gap-2 mb-4 items-center">
                                            <div className="flex items-center">
                                                <svg className="w-5 h-5 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M12 5C5.63636 5 2 12 2 12C2 12 5.63636 19 12 19C18.3636 19 22 12 22 12C22 12 18.3636 5 12 5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                    <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                                <span className="font-medium">O.E.</span>
                                            </div>

                                            {/* Prisma Vertical O.E. */}
                                            <div>
                                                <select
                                                    name="prismaVerticalEsquerdo"
                                                    defaultValue={formData.prismaVerticalEsquerdo || ''}
                                                    className="w-full border-2 border-[#81059e] p-2 rounded-sm bg-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-400"
                                                >
                                                    <option value="">Selecione</option>
                                                    {prismaValores.map(valor => (
                                                        <option key={`prism-v-oe-${valor}`} value={valor}>{valor.toFixed(2)}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            {/* Base Vertical O.E. */}
                                            <div>
                                                <select
                                                    name="baseVerticalEsquerdo"
                                                    defaultValue={formData.baseVerticalEsquerdo || ''}
                                                    className="w-full border-2 border-[#81059e] p-2 rounded-sm bg-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-400"
                                                >
                                                    <option value="">Selecione</option>
                                                    <option value="Superior">Superior</option>
                                                    <option value="Inferior">Inferior</option>
                                                </select>
                                            </div>
                                            <div className="col-span-2"></div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Dados da armação */}
                        <div className="mb-6 border border-purple-200 rounded-sm p-4 bg-purple-50">
                            <h3 className="text-md font-medium text-[#81059e] mb-3">Dados da armação</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Largura</label>
                                    <select
                                        name="larguraArmacao"
                                        defaultValue={formData.larguraArmacao || ''}
                                        className="w-full border-2 border-[#81059e] p-2 rounded-sm"
                                    >
                                        <option value="">Selecione...</option>
                                        {Array.from({ length: 31 }, (_, i) => i + 40).map(valor => (
                                            <option key={`larg-${valor}`} value={valor}>{valor} mm</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Altura</label>
                                    <select
                                        name="alturaArmacao"
                                        defaultValue={formData.alturaArmacao || ''}
                                        className="w-full border-2 border-[#81059e] p-2 rounded-sm"
                                    >
                                        <option value="">Selecione...</option>
                                        {Array.from({ length: 31 }, (_, i) => i + 25).map(valor => (
                                            <option key={`alt-${valor}`} value={valor}>{valor} mm</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Ponte</label>
                                    <select
                                        name="ponteArmacao"
                                        defaultValue={formData.ponteArmacao || ''}
                                        className="w-full border-2 border-[#81059e] p-2 rounded-sm"
                                    >
                                        <option value="">Selecione...</option>
                                        {Array.from({ length: 16 }, (_, i) => i + 10).map(valor => (
                                            <option key={`ponte-${valor}`} value={valor}>{valor} mm</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="flex justify-end mb-4">
                                <div className="relative w-40 h-28">
                                    <img src="/images/armacao-medidas.png" alt="Diagrama de medidas da armação" className="w-full" />
                                </div>
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Medidas Personalizadas</label>
                                <div className="flex space-x-4">
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            name="medidasPersonalizadas"
                                            value="automatica"
                                            defaultChecked={formData.medidasPersonalizadas === 'automatica' || !formData.medidasPersonalizadas}
                                            className="h-4 w-4 text-[#81059e] border-gray-300 focus:ring-[#81059e]"
                                        />
                                        <span className="ml-2">Automática</span>
                                    </label>
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            name="medidasPersonalizadas"
                                            value="manual"
                                            defaultChecked={formData.medidasPersonalizadas === 'manual'}
                                            className="h-4 w-4 text-[#81059e] border-gray-300 focus:ring-[#81059e]"
                                        />
                                        <span className="ml-2">Manual</span>
                                    </label>
                                </div>
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de aro</label>
                                <select
                                    name="tipoAro"
                                    defaultValue={formData.tipoAro || ''}
                                    className="w-full border-2 border-[#81059e] p-2 rounded-sm"
                                >
                                    <option value="">Selecione...</option>
                                    <option value="fechado">Fechado</option>
                                    <option value="fio_de_nylon">Fio de Nylon</option>
                                    <option value="3_pecas">3 Peças</option>
                                    <option value="parafusado">Parafusado</option>
                                </select>
                            </div>
                            <div className="mb-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Material</label>
                                <div className="flex space-x-4">
                                    <label className="flex items-center border-2 border-[#81059e] p-2 rounded-sm">
                                        <input
                                            type="radio"
                                            name="materialArmacao"
                                            value="acetato"
                                            defaultChecked={formData.materialArmacao === 'acetato' || !formData.materialArmacao}
                                            className="h-4 w-4 text-[#81059e] border-gray-300 focus:ring-[#81059e]"
                                        />
                                        <span className="ml-2">Acetato</span>
                                    </label>
                                    <label className="flex items-center border-2 border-[#81059e] p-2 rounded-sm">
                                        <input
                                            type="radio"
                                            name="materialArmacao"
                                            value="metal"
                                            defaultChecked={formData.materialArmacao === 'metal'}
                                            className="h-4 w-4 text-[#81059e] border-gray-300 focus:ring-[#81059e]"
                                        />
                                        <span className="ml-2">Metal</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Tratamento e Coloração */}
                        <div className="mb-6 border border-purple-200 rounded-sm p-4 bg-purple-50">
                            <h3 className="text-md font-medium text-[#81059e] mb-3">Tratamento e Coloração</h3>
                            <div className="space-y-3">
                                <label className="flex items-center justify-between border-2 border-[#81059e] p-3 rounded-sm">
                                    <div className="flex items-center">
                                        <input
                                            type="radio"
                                            name="tratamento"
                                            value="antirisco"
                                            defaultChecked={formData.tratamento === 'antirisco' || !formData.tratamento}
                                            className="h-4 w-4 text-[#81059e] border-gray-300 focus:ring-[#81059e]"
                                        />
                                        <span className="ml-2 font-medium">Antirisco</span>
                                    </div>
                                </label>
                                <label className="flex items-center justify-between border-2 border-[#81059e] p-3 rounded-sm">
                                    <div>
                                        <div className="flex items-center">
                                            <input
                                                type="radio"
                                                name="tratamento"
                                                value="antirisco-tingivel"
                                                defaultChecked={formData.tratamento === 'antirisco-tingivel'}
                                                className="h-4 w-4 text-[#81059e] border-gray-300 focus:ring-[#81059e]"
                                            />
                                            <span className="ml-2 font-medium">Lente Esportiva</span>
                                        </div>
                                    </div>
                                    </label>
                            </div>
                        </div>

                        {/* Coloração */}
                        <div className="mb-6 border border-purple-200 rounded-sm p-4 bg-purple-50">
                            <h3 className="text-md font-medium text-[#81059e] mb-3">Coloração</h3>
                            <div className="mb-4">
                                <div className="flex space-x-4">
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            name="temColoracao"
                                            value="nao"
                                            defaultChecked={formData.temColoracao === 'nao' || !formData.temColoracao}
                                            className="h-4 w-4 text-[#81059e] border-gray-300 focus:ring-[#81059e]"
                                        />
                                        <span className="ml-2">Não</span>
                                    </label>
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            name="temColoracao"
                                            value="sim"
                                            defaultChecked={formData.temColoracao === 'sim'}
                                            className="h-4 w-4 text-[#81059e] border-gray-300 focus:ring-[#81059e]"
                                        />
                                        <span className="ml-2">Sim</span>
                                    </label>
                                </div>
                                {formData.tratamento !== 'antirisco-tingivel' && formData.temColoracao === 'sim' && (
                                    <div className="mt-2">
                                        <div className="flex items-center text-yellow-600">
                                            <svg className="h-5 w-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                            <span className="text-xs">Atenção: Só é permitido tratamento de coloração com Antirisco Tingível.</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                            {formData.temColoracao === 'sim' && formData.tratamento === 'antirisco-tingivel' && (
                                <>
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Tonalidade</label>
                                        <div className="grid grid-cols-3 gap-3">
                                            <label className="flex flex-col items-center border border-gray-300 rounded p-2 hover:border-[#81059e] cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="tonalidade"
                                                    value="cinza"
                                                    defaultChecked={formData.tonalidade === 'cinza' || !formData.tonalidade}
                                                    className="sr-only"
                                                />
                                                <div className="w-16 h-10 bg-gray-500 rounded mb-1"></div>
                                                <span className="text-xs">Cinza</span>
                                            </label>
                                            <label className="flex flex-col items-center border border-gray-300 rounded p-2 hover:border-[#81059e] cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="tonalidade"
                                                    value="marrom"
                                                    defaultChecked={formData.tonalidade === 'marrom'}
                                                    className="sr-only"
                                                />
                                                <div className="w-16 h-10 bg-[#8B4513] rounded mb-1"></div>
                                                <span className="text-xs">Marrom</span>
                                            </label>
                                            <label className="flex flex-col items-center border border-gray-300 rounded p-2 hover:border-[#81059e] cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="tonalidade"
                                                    value="verde"
                                                    defaultChecked={formData.tonalidade === 'verde'}
                                                    className="sr-only"
                                                />
                                                <div className="w-16 h-10 bg-[#2F4F4F] rounded mb-1"></div>
                                                <span className="text-xs">Verde</span>
                                            </label>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Tipo e intensidade</label>
                                        <div className="grid grid-cols-3 gap-3 mb-2">
                                            <label className="flex flex-col items-center border border-gray-300 rounded p-2 hover:border-[#81059e] cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="tipoIntensidade"
                                                    value="degrade_80"
                                                    defaultChecked={formData.tipoIntensidade === 'degrade_80' || !formData.tipoIntensidade}
                                                    className="sr-only"
                                                />
                                                <div className="w-16 h-10 bg-gradient-to-b from-gray-500 to-gray-200 rounded mb-1"></div>
                                                <span className="text-xs">Degradê 80%</span>
                                            </label>
                                            <label className="flex flex-col items-center border border-gray-300 rounded p-2 hover:border-[#81059e] cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="tipoIntensidade"
                                                    value="degrade_50"
                                                    defaultChecked={formData.tipoIntensidade === 'degrade_50'}
                                                    className="sr-only"
                                                />
                                                <div className="w-16 h-10 bg-gradient-to-b from-gray-400 to-gray-200 rounded mb-1"></div>
                                                <span className="text-xs">Degradê 50%</span>
                                            </label>
                                            <label className="flex flex-col items-center border border-gray-300 rounded p-2 hover:border-[#81059e] cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="tipoIntensidade"
                                                    value="degrade_25"
                                                    defaultChecked={formData.tipoIntensidade === 'degrade_25'}
                                                    className="sr-only"
                                                />
                                                <div className="w-16 h-10 bg-gradient-to-b from-gray-300 to-gray-200 rounded mb-1"></div>
                                                <span className="text-xs">Degradê 25%</span>
                                            </label>
                                        </div>
                                        <div className="grid grid-cols-3 gap-3">
                                            <label className="flex flex-col items-center border border-gray-300 rounded p-2 hover:border-[#81059e] cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="tipoIntensidade"
                                                    value="total_80"
                                                    defaultChecked={formData.tipoIntensidade === 'total_80'}
                                                    className="sr-only"
                                                />
                                                <div className="w-16 h-10 bg-gray-600 rounded mb-1"></div>
                                                <span className="text-xs">Total 80%</span>
                                            </label>
                                            <label className="flex flex-col items-center border border-gray-300 rounded p-2 hover:border-[#81059e] cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="tipoIntensidade"
                                                    value="total_50"
                                                    defaultChecked={formData.tipoIntensidade === 'total_50'}
                                                    className="sr-only"
                                                />
                                                <div className="w-16 h-10 bg-gray-400 rounded mb-1"></div>
                                                <span className="text-xs">Total 50%</span>
                                            </label>
                                            <label className="flex flex-col items-center border border-gray-300 rounded p-2 hover:border-[#81059e] cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="tipoIntensidade"
                                                    value="total_25"
                                                    defaultChecked={formData.tipoIntensidade === 'total_25'}
                                                    className="sr-only"
                                                />
                                                <div className="w-16 h-10 bg-gray-300 rounded mb-1"></div>
                                                <span className="text-xs">Total 25%</span>
                                            </label>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Observações adicionais */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700">Observações</label>
                            <textarea
                                name="observacoes"
                                defaultValue={formData.observacoes || ''}
                                className="w-full border-2 border-gray-300 p-2 rounded-sm h-20"
                                placeholder="Observações adicionais sobre a OS..."
                            />
                        </div>

                        {/* Data prevista para entrega */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700">Data prevista para entrega</label>
                            <input
                                type="date"
                                name="dataPrevistaEntrega"
                                defaultValue={formData.dataPrevistaEntrega || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                                className="w-full border-2 border-gray-300 p-2 rounded-sm"
                                required
                            />
                        </div>

                        {/* Informações adicionais */}
                        <div className="mt-4 bg-purple-50 p-3 rounded-sm flex items-start">
                            <FiInfo className="text-[#81059e] mt-1 mr-2 flex-shrink-0" />
                            <div className="text-sm text-gray-700">
                                {osType === 'completa' && (
                                    <p>As OS serão enviadas ao laboratório para montagem após a finalização da venda. Cada coleção representa uma OS independente.</p>
                                )}
                                {osType === 'incompleta' && (
                                    <p>As OS incompletas serão geradas apenas para os componentes selecionados em cada coleção.</p>
                                )}
                                {osType === 'sem_os' && (
                                    <p>Nenhuma ordem de serviço será gerada. Os produtos serão entregues diretamente.</p>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-end space-x-4">
                            <button
                                type="button"
                                onClick={closeOSForm}
                                className="px-4 py-2 rounded-sm text-gray-700"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-[#81059e] text-white rounded-sm hover:bg-[#6f0486]"
                            >
                                Salvar OS
                            </button>
                        </div>
                    </form>
                </div>
            </div>
            </div>
        );
    };

    // Se não há collections, retornar null
    if (!collections || collections.length === 0) {
        return null;
    }

    // Identificar quais coleções precisam de OS
    const colecoesPrecisandoOS = collections.filter(colecao => colecaoPrecisaDeOS(colecao));

    // Se nenhuma coleção precisa de OS, não renderizar o componente
    if (colecoesPrecisandoOS.length === 0 && osType === 'sem_os') {
        return null;
    }

    return (
        <div className="mb-4 border-2 border-[#81059e] rounded-sm p-4">
            <h3 className="text-xl text-[#81059e] font-medium mb-3 flex items-center">
                <FiClipboard className="mr-2" /> Ordens de Serviço
            </h3>

            {/* Tipo de OS - visível sempre */}
            <div className="mb-4">
                <label className="block text-gray-700 mb-2">Tipo de OS:</label>
                <div className="flex flex-wrap gap-3">
                    <button
                        type="button"
                        onClick={() => setOsType('completa')}
                        className={`px-3 py-2 border rounded-sm ${osType === 'completa'
                            ? 'bg-[#81059e] text-white border-[#81059e]'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-purple-50'
                            }`}
                    >
                        OS Completa
                    </button>
                    <button
                        type="button"
                        onClick={() => setOsType('incompleta')}
                        className={`px-3 py-2 border rounded-sm ${osType === 'incompleta'
                            ? 'bg-[#81059e] text-white border-[#81059e]'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-purple-50'
                            }`}
                    >
                        OS Incompleta
                    </button>
                    <button
                        type="button"
                        onClick={() => setOsType('sem_os')}
                        className={`px-3 py-2 border rounded-sm ${osType === 'sem_os'
                            ? 'bg-[#81059e] text-white border-[#81059e]'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-purple-50'
                            }`}
                    >
                        Sem OS
                    </button>
                </div>
            </div>

            {/* Exibir coleções */}
            {osType !== 'sem_os' && collections.length > 0 && (
                <div className="mt-4">
                    <h4 className="font-medium text-gray-700 mb-2">Coleções com OS:</h4>
                    <div className="space-y-2">
                        {collections.map((colecao) => (
                            colecaoPrecisaDeOS(colecao) && (
                                <div
                                    key={colecao.id}
                                    className={`border rounded-sm p-2 ${expandedCollection === colecao.id ? 'min-h-36' : 'h-16'} ${activeCollection === colecao.id
                                        ? 'border-[#81059e] bg-purple-50' : 'border-gray-200'
                                        }`}
                                >
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <FiFileText className="text-[#81059e]" />
                                            <span className="font-medium">{colecao.name}</span>
                                            {isOSCompleta(colecao) && (
                                                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-sm">
                                                    OS Completa
                                                </span>
                                            )}
                                            {isOSIncompleta(colecao) && (
                                                <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-sm">
                                                    OS Incompleta
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => toggleColecao(colecao.id)}
                                                className="text-gray-500 hover:text-gray-700 p-1 rounded"
                                                title="Ver detalhes"
                                            >
                                                <FiEye />
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => openOSForm(colecao.id)}
                                                className={`p-1 rounded ${osData[colecao.id]?.isCompleted
                                                    ? 'text-green-500 hover:text-green-700'
                                                    : 'text-blue-500 hover:text-blue-700'
                                                    }`}
                                                title={osData[colecao.id]?.isCompleted ? "Editar OS (preenchida)" : "Preencher OS"}
                                            >
                                                {osData[colecao.id]?.isCompleted
                                                    ? <FiCheck />
                                                    : <FiEdit3 />
                                                }
                                            </button>
                                        </div>
                                    </div>

                                    {expandedCollection === colecao.id && (
                                        <div className="mt-3 pl-4 border-t pt-2">
                                            <h5 className="font-medium text-sm text-gray-600 mb-1">Itens:</h5>
                                            <ul className="space-y-1">
                                                {colecao.items && colecao.items.filter(item => precisaDeOS(item)).map((item, idx) => (
                                                    <li key={idx} className="text-sm">
                                                        <span className="font-medium">{item.nome || item.titulo || item.info_geral?.nome || 'Item'}: </span>
                                                        <span className="text-gray-600">
                                                            {item.categoria === 'armacoes' ? 'Armação' :
                                                                item.categoria === 'lentes' ? 'Lente' :
                                                                    item.categoria === 'solares' ? 'Óculos Solar' :
                                                                        item.categoria}
                                                        </span>
                                                        {item.categoria === 'solares' && (item.info_geral?.tem_grau || item.info_adicional?.tem_grau) && (
                                                            <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-1 py-0.5 rounded">
                                                                Com Grau
                                                            </span>
                                                        )}
                                                    </li>
                                                ))}
                                            </ul>

                                            {/* Status do preenchimento da OS */}
                                            <div className="mt-2 text-sm">
                                                <span className="font-medium">Status da OS: </span>
                                                {osData[colecao.id]?.isCompleted ? (
                                                    <span className="text-green-600 flex items-center">
                                                        <FiCheck className="mr-1" /> Preenchida
                                                    </span>
                                                ) : (
                                                    <span className="text-yellow-600 flex items-center">
                                                        <FiAlertTriangle className="mr-1" /> Pendente
                                                    </span>
                                                )}
                                            </div>

                                            {/* Resumo da receita se estiver preenchida */}
                                            {osData[colecao.id]?.isCompleted && (
                                                <div className="mt-2 bg-white p-2 rounded border text-xs">
                                                    <h6 className="font-medium mb-1">Resumo da receita:</h6>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div>
                                                            <p><span className="font-medium">Olho D:</span> {osData[colecao.id].esferaDireito}/{osData[colecao.id].cilindroDireito}/{osData[colecao.id].eixoDireito}</p>
                                                            <p><span className="font-medium">Olho E:</span> {osData[colecao.id].esferaEsquerdo}/{osData[colecao.id].cilindroEsquerdo}/{osData[colecao.id].eixoEsquerdo}</p>
                                                        </div>
                                                        <div>
                                                            <p><span className="font-medium">DNP:</span> {osData[colecao.id].dnpDireito}/{osData[colecao.id].dnpEsquerdo}</p>
                                                            <p><span className="font-medium">Altura:</span> {osData[colecao.id].alturaDireito}/{osData[colecao.id].alturaEsquerdo}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )
                        ))}
                    </div>
                </div>
            )}

            {/* Status do preenchimento de todos os formulários */}
            {osType !== 'sem_os' && colecoesPrecisandoOS.length > 0 && (
                <div className="mt-4 p-3 rounded-sm bg-gray-50 border border-gray-200">
                    <h4 className="font-medium text-gray-700 mb-2">Status do Preenchimento:</h4>
                    <div className="flex items-center">
                        {allOSFormsCompleted() ? (
                            <>
                                <div className="w-8 h-8 rounded-sm bg-green-100 flex items-center justify-center mr-2">
                                    <FiCheck className="text-green-600" />
                                </div>
                                <span className="text-green-600">Todas as OS foram preenchidas</span>
                            </>
                        ) : (
                            <>
                                <div className="w-8 h-8 rounded-sm bg-yellow-100 flex items-center justify-center mr-2">
                                    <FiAlertTriangle className="text-yellow-600" />
                                </div>
                                <span className="text-yellow-600">
                                    Existem OS pendentes de preenchimento
                                </span>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Modal de formulário de OS */}
            {activeOSForm !== null && renderOSForm(activeOSForm)}
        </div>
    );
};

export default OSManager;