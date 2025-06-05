// src/components/OSManager.js
import React, { useState, useEffect } from 'react';
import { FiFileText, FiClipboard, FiEye, FiInfo, FiEdit3, FiX, FiCheck, FiAlertTriangle } from 'react-icons/fi';

const OSManager = ({ cartItems, selectedClient, onOSChange, collections, activeCollection }) => {
    // Estados para gerenciar os dados da OS global
    const [osType, setOsType] = useState('incompleta'); // Padrão como incompleta
    const [osStatus, setOsStatus] = useState('em_montagem');
    const [osObservacoes, setOsObservacoes] = useState('');

    // Estado para controle de formulários de OS
    const [activeOSForm, setActiveOSForm] = useState(null); // Armazena o ID da coleção com formulário aberto
    const [osData, setOsData] = useState({}); // Armazena os dados do formulário para cada coleção

    // FUNÇÃO MODIFICADA: Agora óculos solares sempre podem ter OS
    const precisaDeOS = (item) => {
        if (!item || !item.categoria) return false;

        // Todos os produtos das categorias principais podem precisar de OS
        const categoriasComOS = ['armacoes', 'lentes', 'solares'];

        return categoriasComOS.includes(item.categoria);
    };

    // Função para verificar se uma coleção tem produtos que precisam de OS
    const colecaoPrecisaDeOS = (colecao) => {
        return colecao.items && colecao.items.some(item => precisaDeOS(item));
    };

    // FUNÇÃO MODIFICADA: Agora determina baseado nos produtos, mas não força tipos específicos
    const determinarTipoOSParaColecao = (colecao) => {
        if (!colecaoPrecisaDeOS(colecao)) return 'sem_os';

        const temArmacao = colecao.items.some(item => item.categoria === 'armacoes');
        const temLente = colecao.items.some(item => item.categoria === 'lentes');
        const temSolar = colecao.items.some(item => item.categoria === 'solares');

        // Se tem armação + lente, ou só solar, pode ser completa
        if ((temArmacao && temLente) || temSolar) {
            return 'completa';
        }

        // Se tem apenas armação ou apenas lente, é incompleta
        if (temArmacao || temLente) {
            return 'incompleta';
        }

        return 'incompleta'; // Padrão para incompleta ao invés de sem_os
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
            dataPrevistaEntrega: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
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
            colecaoPrecisaDeOS(colecao) && (osData[colecao.id]?.tipoOSColecao !== 'sem_os')
        ).every(colecao =>
            osData[colecao.id]?.isCompleted === true
        );
    };

    // MODIFICADO: Agora não determina automaticamente o tipo global
    useEffect(() => {
        if (!collections || collections.length === 0) return;

        // Inicializar dados para cada coleção
        collections.forEach(colecao => {
            if (colecao && colecao.items) {
                const tipoRecomendado = determinarTipoOSParaColecao(colecao);
                inicializarDadosOS(colecao.id, tipoRecomendado);
            }
        });

        // Mantém o tipo atual ou define como incompleta se for a primeira vez
        if (!osType) {
            setOsType('incompleta');
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

    // FUNÇÃO MODIFICADA: Agora permite seleção manual do tipo de OS no modal
    const renderOSForm = (colecaoId) => {
        const colecao = collections.find(c => c.id === colecaoId);
        if (!colecao) return null;

        const formData = osData[colecaoId] || {};
        const tipoRecomendado = determinarTipoOSParaColecao(colecao);

        // Obter detalhes dos produtos para exibir no formulário
        const armacao = colecao.items && colecao.items.find(item => item.categoria === 'armacoes');
        const lente = colecao.items && colecao.items.find(item => item.categoria === 'lentes');
        const solar = colecao.items && colecao.items.find(item => item.categoria === 'solares');

        const armacaoDados = armacao ?
            `${armacao.nome || armacao.titulo || 'Armação'} - ${armacao.marca || 'Sem marca'}` :
            'Nenhuma armação selecionada';

        const lenteDados = lente ?
            `${lente.nome || lente.titulo || 'Lente'} - ${lente.marca || 'Sem marca'}` :
            'Nenhuma lente selecionada';

        const solarDados = solar ?
            `${solar.nome || solar.titulo || 'Óculos Solar'} - ${solar.marca || 'Sem marca'}` :
            'Nenhum óculos solar selecionado';

        // Valores específicos para os dropdown conforme as imagens enviadas
        const esfericos = [6.00, 5.75, 5.50, 5.25, 5.00, 4.75, 4.50, 4.25, 4.00, 3.75, 3.50, 3.25, 3.00, 2.75, 2.50, 2.25, 2.00, 1.75, 1.50, 1.25, 1.00, 0.75, 0.50, 0.25, 0.00, -0.25, -0.50, -0.75, -1.00, -1.25, -1.50, -1.75, -2.00, -2.25, -2.50, -2.75, -3.00, -3.25, -3.50, -3.75, -4.00, -4.25, -4.50, -4.75, -5.00, -5.25, -5.50, -5.75, -6.00];
        const cilindricos = [-6.00, -5.75, -5.50, -5.25, -5.00, -4.75, -4.50, -4.25, -4.00, -3.75, -3.50, -3.25, -3.00, -2.75, -2.50, -2.25, -2.00, -1.75, -1.50, -1.25, -1.00, -0.75, -0.50, -0.25, 0.00];
        const eixos = Array.from({ length: 181 }, (_, i) => i);
        const adicoes = [0.75, 1.00, 1.25, 1.50, 1.75, 2.00, 2.25, 2.50, 2.75, 3.00, 3.25, 3.50];
        const dnpValores = [24, 24.5, 25, 25.5, 26, 26.5, 27, 27.5, 28, 28.5, 29, 29.5, 30, 30.5, 31, 31.5, 32, 32.5, 33, 33.5, 34, 34.5, 35, 35.5, 36, 36.5, 37, 37.5, 38, 38.5, 39, 39.5, 40];
        const alturaValores = [16, 16.5, 17, 17.5, 18, 18.5, 19, 19.5, 20, 20.5, 21, 21.5, 22, 22.5, 23, 23.5, 24, 24.5, 25, 25.5, 26, 26.5, 27, 27.5, 28, 28.5, 29, 29.5, 30, 30.5, 31, 31.5, 32, 32.5, 33, 33.5, 34, 34.5, 35];
        const prismaValores = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7];

        return (
            <div className="fixed inset-0 z-[80] overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-sm shadow-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
                    {/* Header fixo */}
                    <div className="flex justify-between items-center bg-[#81059e] rounded-t-lg px-6 py-4 flex-shrink-0">
                        <h2 className="text-xl font-bold text-white">
                            Ordem de Serviço - {colecao.name}
                        </h2>
                        <button
                            onClick={closeOSForm}
                            className="text-white hover:text-gray-200 transition-colors"
                        >
                            <FiX size={24} />
                        </button>
                    </div>

                    {/* Conteúdo com scroll */}
                    <div className="flex-1 overflow-y-auto p-6">

                        {/* NOVA SEÇÃO: Seleção Manual do Tipo de OS */}
                        <div className="mb-6 border-2 border-[#81059e] rounded-sm p-6 bg-gradient-to-r from-purple-50 to-blue-50">
                            <h3 className="text-xl font-bold text-[#81059e] mb-4 flex items-center">
                                <FiFileText className="mr-3" size={24} />
                                Tipo de OS para esta coleção
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <label className="cursor-pointer group">
                                    <div className="border-2 border-gray-300 rounded-sm p-4 transition-all group-hover:border-[#81059e] group-hover:bg-purple-50 h-full flex flex-col group-hover:shadow-md">
                                        <div className="flex items-center mb-3">
                                            <input
                                                type="radio"
                                                name="tipoOSColecao"
                                                value="completa"
                                                defaultChecked={formData.tipoOS === 'completa' || tipoRecomendado === 'completa'}
                                                className="w-5 h-5 text-[#81059e] border-2 border-gray-400 mr-3"
                                            />
                                            <span className="font-bold text-lg text-gray-800">OS Completa</span>
                                        </div>
                                        <p className="text-sm text-gray-600 flex-1 mb-3">Armação + Lentes ou Solar completo para montagem no laboratório</p>
                                        <div className="text-xs bg-green-100 text-green-700 px-3 py-2 rounded-full text-center font-medium">
                                            ✅ Montagem completa
                                        </div>
                                    </div>
                                </label>

                                <label className="cursor-pointer group">
                                    <div className="border-2 border-gray-300 rounded-sm p-4 transition-all group-hover:border-[#81059e] group-hover:bg-purple-50 h-full flex flex-col group-hover:shadow-md">
                                        <div className="flex items-center mb-3">
                                            <input
                                                type="radio"
                                                name="tipoOSColecao"
                                                value="incompleta"
                                                defaultChecked={formData.tipoOS === 'incompleta' || tipoRecomendado === 'incompleta'}
                                                className="w-5 h-5 text-[#81059e] border-2 border-gray-400 mr-3"
                                            />
                                            <span className="font-bold text-lg text-gray-800">OS Incompleta</span>
                                        </div>
                                        <p className="text-sm text-gray-600 flex-1 mb-3">Só armação, só lentes ou solar para adicionar lentes depois</p>
                                        <div className="text-xs bg-yellow-100 text-yellow-700 px-3 py-2 rounded-full text-center font-medium">
                                            ⚠️ Serviço parcial
                                        </div>
                                    </div>
                                </label>

                                <label className="cursor-pointer group">
                                    <div className="border-2 border-gray-300 rounded-sm p-4 transition-all group-hover:border-[#81059e] group-hover:bg-purple-50 h-full flex flex-col group-hover:shadow-md">
                                        <div className="flex items-center mb-3">
                                            <input
                                                type="radio"
                                                name="tipoOSColecao"
                                                value="sem_os"
                                                defaultChecked={formData.tipoOS === 'sem_os'}
                                                className="w-5 h-5 text-[#81059e] border-2 border-gray-400 mr-3"
                                            />
                                            <span className="font-bold text-lg text-gray-800">Sem OS</span>
                                        </div>
                                        <p className="text-sm text-gray-600 flex-1 mb-3">Produto pronto para entrega imediata, sem necessidade de laboratório</p>
                                        <div className="text-xs bg-blue-100 text-blue-700 px-3 py-2 rounded-full text-center font-medium">
                                            🚀 Entrega direta
                                        </div>
                                    </div>
                                </label>
                            </div>
                        </div>

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
                            formData.solarDados = solarDados;

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
                                        <option value="">-</option>
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
                                        <option value="aguardandoCliente">Aguardando cliente</option>
                                        <option value="encaminhadoLaboratorio">Encaminhado ao Laboratório</option>
                                        <option value="montagemProgresso">Montagem em Progresso</option>
                                        <option value="prontoEntrega">Pronto para Entrega</option>
                                    </select>
                                </div>
                            </div>

                            {/* Área de produtos MODIFICADA */}
                            <div className="mb-6 border-2 border-purple-200 rounded-sm p-6 bg-gradient-to-r from-purple-50 to-pink-50">
                                <h3 className="text-lg font-bold text-[#81059e] mb-4 flex items-center">
                                    <FiClipboard className="mr-2" size={20} />
                                    Produtos desta coleção
                                </h3>

                                <div className="grid grid-cols-1 gap-6">
                                    {/* Armação */}
                                    {armacao && (
                                        <div className="bg-white rounded-sm p-4 border border-gray-200">
                                            <div className="flex items-center mb-2">
                                                <span className="text-2xl mr-3">👓</span>
                                                <label className="text-lg font-semibold text-gray-700">Armação Selecionada</label>
                                            </div>
                                            <div className="bg-gray-50 p-3 rounded-sm border-l-4 border-[#81059e]">
                                                <p className="font-medium text-gray-800">{armacaoDados}</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Lentes */}
                                    {lente && (
                                        <div className="bg-white rounded-sm p-4 border border-gray-200">
                                            <div className="flex items-center mb-2">
                                                <span className="text-2xl mr-3">🔍</span>
                                                <label className="text-lg font-semibold text-gray-700">Lentes Selecionadas</label>
                                            </div>
                                            <div className="bg-gray-50 p-3 rounded-sm border-l-4 border-[#81059e]">
                                                <p className="font-medium text-gray-800">{lenteDados}</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Óculos Solar */}
                                    {solar && (
                                        <div className="bg-white rounded-sm p-4 border border-gray-200">
                                            <div className="flex items-center mb-2">
                                                <span className="text-2xl mr-3">🕶️</span>
                                                <label className="text-lg font-semibold text-gray-700">Óculos Solar Selecionado</label>
                                            </div>
                                            <div className="bg-gray-50 p-3 rounded-sm border-l-4 border-[#81059e]">
                                                <p className="font-medium text-gray-800">{solarDados}</p>
                                                <div className="mt-2 inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                                                    💡 Pode receber lentes graduadas se necessário
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Campo para cliente trazer produto */}
                                    {(!armacao || !lente) && (
                                        <div className="bg-white rounded-sm p-4 border-2 border-dashed border-gray-300">
                                            <div className="flex items-center mb-3">
                                                <span className="text-2xl mr-3">📦</span>
                                                <label className="text-lg font-semibold text-gray-700">
                                                    {!armacao && !solar && 'Armação que o cliente vai trazer'}
                                                    {!lente && 'Lentes que o cliente vai trazer'}
                                                </label>
                                            </div>
                                            <input
                                                type="text"
                                                name={!armacao && !solar ? "armacaoClienteDescricao" : "lentesClienteDescricao"}
                                                defaultValue={
                                                    !armacao && !solar
                                                        ? formData.armacaoClienteDescricao || ""
                                                        : formData.lentesClienteDescricao || ""
                                                }
                                                placeholder={
                                                    !armacao && !solar
                                                        ? "Descreva a armação que o cliente vai trazer (marca, modelo, cor, etc.)"
                                                        : "Descreva as lentes que o cliente vai trazer (tipo, graduação, etc.)"
                                                }
                                                className="w-full border-2 border-[#81059e] p-3 rounded-sm focus:ring-2 focus:ring-purple-400 focus:border-purple-500"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Resto do formulário continua igual... */}
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
                                            <option value="">-</option>
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
                                            <option value="">-</option>
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
                                            <option value="">-</option>
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
                                            <option value="">-</option>
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
                                            <option value="">-</option>
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
                                            <option value="">-</option>
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
                                            <option value="">-</option>
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
                                            <option value="">-</option>
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
                                            <option value="">-</option>
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
                                            <option value="">-</option>
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
                                            <path d="M12 15C13.6569 15 15 13.6569 15 12 C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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
                                            <option value="">-</option>
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
                                            <option value="">-</option>
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
                                    defaultValue={formData.dataPrevistaEntrega || new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                                    className="w-full border-2 border-gray-300 p-2 rounded-sm"
                                    required
                                />
                            </div>

                            <div className="flex justify-end space-x-4">
                                <button
                                    type="button"
                                    onClick={closeOSForm}
                                    className="px-6 py-3 rounded-sm text-[#81059e] hover:bg-gray-50 font-medium"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-3 bg-[#81059e] text-white rounded-sm hover:bg-[#6f0486] font-medium"
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
    if (colecoesPrecisandoOS.length === 0) {
        return null;
    }

    return (
        <div className="mb-4 border-2 border-[#81059e] rounded-sm p-4">
            <div>
                <h3 className="text-xl text-[#81059e] font-medium flex items-center">
                    <FiClipboard className="mr-2" /> Ordens de Serviço
                </h3>
                <p className="font-medium text-[#96709d] mb-2 ml-6">Coleções com dados pendentes:</p>
            </div>



            {/* Exibir coleções */}
            {collections.length > 0 && (
                <div className="mt-4">
                    <div className="space-y-3">
                        {collections.map((colecao) => (
                            colecaoPrecisaDeOS(colecao) && (
                                <div
                                    key={colecao.id}
                                    className={`border-2 rounded-sm p-4 transition-all ${activeCollection === colecao.id
                                        ? 'border-[#81059e] bg-purple-50' : 'border-gray-200 hover:border-purple-300'
                                        }`}
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <FiFileText className="text-[#81059e] text-xl" />
                                                <span className="font-semibold text-lg">{colecao.name}</span>

                                                {osData[colecao.id]?.isCompleted && (
                                                    <span className="bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full font-medium flex items-center gap-1">
                                                        <FiCheck size={14} /> Preenchida
                                                    </span>
                                                )}
                                            </div>

                                            {/* Lista de itens */}
                                            <div className="mb-3">
                                                <span className="bg-orange-100 text-blue-800 text-sm px-3 py-1 rounded-full font-medium ">
                                                    {osData[colecao.id]?.tipoOSColecao || 'Pendente'}
                                                </span>
                                                <h5 className="font-medium text-sm text-gray-600 mb-2 mt-3">Itens desta coleção:</h5>
                                                <div className="flex flex-wrap gap-2">
                                                    {colecao.items && colecao.items.filter(item => precisaDeOS(item)).map((item, idx) => (
                                                        <span key={idx} className="text-sm text-gray-700 py-1 rounded-full">
                                                            {item.categoria === 'armacoes' ? '👓 Armação' :
                                                                item.categoria === 'lentes' ? '🔍 Lente' :
                                                                    item.categoria === 'solares' ? '🕶️ Óculos Solar' :
                                                                        item.categoria}
                                                            {item.categoria === 'solares' && (
                                                                <span className="ml-1 text-xs text-blue-600">
                                                                    (pode receber lentes)
                                                                </span>
                                                            )}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Status */}
                                            <div className="flex items-center gap-2 text-sm">
                                                <span className="font-medium">Status:</span>
                                                {osData[colecao.id]?.isCompleted ? (
                                                    <span className="text-green-600 flex items-center gap-1">
                                                        <FiCheck size={16} /> Preenchida e pronta
                                                    </span>
                                                ) : (
                                                    <span className="text-orange-600 flex items-center gap-1">
                                                        <FiAlertTriangle size={16} /> Aguardando preenchimento
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Botão de ação */}
                                        <div className="ml-4">
                                            <button
                                                type="button"
                                                onClick={() => openOSForm(colecao.id)}
                                                className={`px-6 py-3 rounded-sm font-semibold transition-all flex items-center gap-2 text-base ${osData[colecao.id]?.isCompleted
                                                        ? 'bg-green-500 hover:bg-green-600 text-white'
                                                        : 'bg-[#81059e] hover:bg-[#6f0486] text-white'
                                                    }`}
                                            >
                                                {osData[colecao.id]?.isCompleted ? (
                                                    <>
                                                        <FiEdit3 size={18} />
                                                        Editar OS
                                                    </>
                                                ) : (
                                                    <>
                                                        <FiFileText size={18} />
                                                        Preencher OS
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Resumo da receita se estiver preenchida */}
                                    {osData[colecao.id]?.isCompleted && (
                                        <div className="mt-4 bg-white p-4 rounded-sm border border-gray-200">
                                            <h6 className="font-semibold mb-2 text-gray-700">Resumo da receita:</h6>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                                <div>
                                                    <p><span className="font-medium">Olho Direito:</span> {osData[colecao.id].esferaDireito}/{osData[colecao.id].cilindroDireito}/{osData[colecao.id].eixoDireito}</p>
                                                    <p><span className="font-medium">Olho Esquerdo:</span> {osData[colecao.id].esferaEsquerdo}/{osData[colecao.id].cilindroEsquerdo}/{osData[colecao.id].eixoEsquerdo}</p>
                                                </div>
                                                <div>
                                                    <p><span className="font-medium">DNP:</span> {osData[colecao.id].dnpDireito}/{osData[colecao.id].dnpEsquerdo}</p>
                                                    <p><span className="font-medium">Altura:</span> {osData[colecao.id].alturaDireito}/{osData[colecao.id].alturaEsquerdo}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )
                        ))}
                    </div>
                </div>
            )}

            {/* Status do preenchimento de todos os formulários */}
            {colecoesPrecisandoOS.length > 0 && (
                <div className="mt-6 p-4 rounded-sm bg-gray-50 border-2 border-gray-200">
                    <h4 className="font-bold text-gray-700 mb-3 text-lg">Status Geral do Preenchimento:</h4>
                    <div className="flex items-center">
                        {allOSFormsCompleted() ? (
                            <>
                                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mr-3">
                                    <FiCheck className="text-green-600" size={20} />
                                </div>
                                <div>
                                    <span className="text-green-600 font-semibold text-lg">Todas as OS foram preenchidas</span>
                                    <p className="text-sm text-gray-600">Você pode prosseguir com a finalização da venda</p>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center mr-3">
                                    <FiAlertTriangle className="text-orange-600" size={20} />
                                </div>
                                <div>
                                    <span className="text-orange-600 font-semibold text-lg">Existem OS pendentes de preenchimento</span>
                                    <p className="text-sm text-gray-600">Clique nos botões "Preencher OS" para completar as informações necessárias</p>
                                </div>
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