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
        
        return (
            <div className="fixed inset-0 z-[80] overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center">
                <div className="bg-white p-6 rounded-lg shadow-lg max-h-[80vh] overflow-y-auto w-full max-w-4xl m-4">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-bold text-[#81059e]">
                            Dados da Ordem de Serviço - {colecao.name}
                        </h2>
                        <button 
                            onClick={closeOSForm}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <FiX size={24} />
                        </button>
                    </div>
                    
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
                                    className="w-full border border-gray-300 p-2 rounded-md"
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
                                    className="w-full border border-gray-300 p-2 rounded-md"
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
                        <div className="mb-4 border border-gray-200 rounded-lg p-4 bg-gray-50">
                            <h3 className="text-md font-medium text-[#81059e] mb-2">Produtos</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Armação */}
                                <div>
                                    <div className="flex justify-between">
                                        <label className="block text-sm font-medium text-gray-700">Armação</label>
                                        {osFormTipo === "somente_lente" && (
                                            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
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
                                                className="w-full border border-gray-300 p-2 rounded-md"
                                            />
                                        </div>
                                    ) : (
                                        <div className="mt-2 p-3 bg-white border border-gray-200 rounded-md">
                                            {armacaoDados}
                                        </div>
                                    )}
                                </div>

                                {/* Lentes */}
                                <div>
                                    <div className="flex justify-between">
                                        <label className="block text-sm font-medium text-gray-700">Lentes</label>
                                        {osFormTipo === "somente_armacao" && (
                                            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
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
                                                className="w-full border border-gray-300 p-2 rounded-md"
                                            />
                                        </div>
                                    ) : (
                                        <div className="mt-2 p-3 bg-white border border-gray-200 rounded-md">
                                            {lenteDados}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Receita médica */}
                        <div className="mb-4">
                            <h3 className="text-md font-medium text-[#81059e] mb-2">Receita Médica</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <h4 className="text-sm font-medium text-gray-700">Olho Direito</h4>
                                    <div className="grid grid-cols-4 gap-2">
                                        <div>
                                            <label className="block text-xs text-gray-600">Esfera</label>
                                            <input
                                                type="text"
                                                name="esferaDireito"
                                                defaultValue={formData.esferaDireito || ''}
                                                className="w-full border border-gray-300 p-1 rounded-md text-sm"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-600">Cilindro</label>
                                            <input
                                                type="text"
                                                name="cilindroDireito"
                                                defaultValue={formData.cilindroDireito || ''}
                                                className="w-full border border-gray-300 p-1 rounded-md text-sm"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-600">Eixo</label>
                                            <input
                                                type="text"
                                                name="eixoDireito"
                                                defaultValue={formData.eixoDireito || ''}
                                                className="w-full border border-gray-300 p-1 rounded-md text-sm"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-600">Adição</label>
                                            <input
                                                type="text"
                                                name="adicaoDireito"
                                                defaultValue={formData.adicaoDireito || ''}
                                                className="w-full border border-gray-300 p-1 rounded-md text-sm"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-sm font-medium text-gray-700">Olho Esquerdo</h4>
                                    <div className="grid grid-cols-4 gap-2">
                                        <div>
                                            <label className="block text-xs text-gray-600">Esfera</label>
                                            <input
                                                type="text"
                                                name="esferaEsquerdo"
                                                defaultValue={formData.esferaEsquerdo || ''}
                                                className="w-full border border-gray-300 p-1 rounded-md text-sm"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-600">Cilindro</label>
                                            <input
                                                type="text"
                                                name="cilindroEsquerdo"
                                                defaultValue={formData.cilindroEsquerdo || ''}
                                                className="w-full border border-gray-300 p-1 rounded-md text-sm"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-600">Eixo</label>
                                            <input
                                                type="text"
                                                name="eixoEsquerdo"
                                                defaultValue={formData.eixoEsquerdo || ''}
                                                className="w-full border border-gray-300 p-1 rounded-md text-sm"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-600">Adição</label>
                                            <input
                                                type="text"
                                                name="adicaoEsquerdo"
                                                defaultValue={formData.adicaoEsquerdo || ''}
                                                className="w-full border border-gray-300 p-1 rounded-md text-sm"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Medidas pupilares */}
                        <div className="mb-4">
                            <h3 className="text-md font-medium text-[#81059e] mb-2">Medidas Pupilares</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Distância Interpupilar</label>
                                    <input
                                        type="text"
                                        name="distanciaInterpupilar"
                                        defaultValue={formData.distanciaInterpupilar || ''}
                                        className="w-full border border-gray-300 p-2 rounded-md"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Altura</label>
                                    <input
                                        type="text"
                                        name="altura"
                                        defaultValue={formData.altura || ''}
                                        className="w-full border border-gray-300 p-2 rounded-md"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Observações adicionais */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700">Observações</label>
                            <textarea
                                name="observacoes"
                                defaultValue={formData.observacoes || ''}
                                className="w-full border border-gray-300 p-2 rounded-md h-20"
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
                                className="w-full border border-gray-300 p-2 rounded-md"
                                required
                            />
                        </div>

                        <div className="flex justify-end space-x-3">
                            <button
                                type="button"
                                onClick={closeOSForm}
                                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-[#81059e] text-white rounded-md hover:bg-[#6f0486]"
                            >
                                Salvar OS
                            </button>
                        </div>
                    </form>
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
                        className={`px-3 py-2 border rounded-sm ${
                            osType === 'completa' 
                                ? 'bg-[#81059e] text-white border-[#81059e]' 
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-purple-50'
                        }`}
                    >
                        OS Completa
                    </button>
                    <button
                        type="button"
                        onClick={() => setOsType('incompleta')}
                        className={`px-3 py-2 border rounded-sm ${
                            osType === 'incompleta' 
                                ? 'bg-[#81059e] text-white border-[#81059e]' 
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-purple-50'
                        }`}
                    >
                        OS Incompleta
                    </button>
                    <button
                        type="button"
                        onClick={() => setOsType('sem_os')}
                        className={`px-3 py-2 border rounded-sm ${
                            osType === 'sem_os' 
                                ? 'bg-[#81059e] text-white border-[#81059e]' 
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-purple-50'
                        }`}
                    >
                        Sem OS
                    </button>
                </div>
            </div>
            
            {/* Status da OS */}
            {osType !== 'sem_os' && (
                <div className="mb-4">
                    <label className="block text-gray-700 mb-2">Status Inicial:</label>
                    <select
                        value={osStatus}
                        onChange={(e) => setOsStatus(e.target.value)}
                        className="border-2 border-[#81059e] p-2 rounded-sm w-full"
                    >
                        <option value="em_montagem">Em Montagem</option>
                        <option value="aguardando_laboratorio">Aguardando Laboratório</option>
                        <option value="aguardando_material">Aguardando Material</option>
                        <option value="em_analise">Em Análise</option>
                    </select>
                </div>
            )}
            
            {/* Observações da OS */}
            {osType !== 'sem_os' && (
                <div className="mb-4">
                    <label className="block text-gray-700 mb-2">Observações Gerais:</label>
                    <textarea
                        value={osObservacoes}
                        onChange={(e) => setOsObservacoes(e.target.value)}
                        className="border-2 border-[#81059e] p-2 rounded-sm w-full h-20"
                        placeholder="Observações gerais aplicáveis a todas as OS..."
                    />
                </div>
            )}
            
            {/* Exibir coleções */}
            {osType !== 'sem_os' && collections.length > 0 && (
                <div className="mt-4">
                    <h4 className="font-medium text-gray-700 mb-2">Coleções com OS:</h4>
                    <div className="space-y-2">
                        {collections.map((colecao) => (
                            colecaoPrecisaDeOS(colecao) && (
                                <div 
                                    key={colecao.id}
                                    className={`border rounded-sm p-2 ${
                                        activeCollection === colecao.id 
                                            ? 'border-[#81059e] bg-purple-50': 'border-gray-200'
                                        }`}
                                    >
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-2">
                                                <FiFileText className="text-[#81059e]" />
                                                <span className="font-medium">{colecao.name}</span>
                                                {isOSCompleta(colecao) && (
                                                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                                                        OS Completa
                                                    </span>
                                                )}
                                                {isOSIncompleta(colecao) && (
                                                    <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
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
                                                    className={`p-1 rounded ${
                                                        osData[colecao.id]?.isCompleted
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
                                                                <p><span className="font-medium">DNP:</span> {osData[colecao.id].distanciaInterpupilar}</p>
                                                                <p><span className="font-medium">Altura:</span> {osData[colecao.id].altura}</p>
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
                                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mr-2">
                                        <FiCheck className="text-green-600" />
                                    </div>
                                    <span className="text-green-600">Todas as OS foram preenchidas</span>
                                </>
                            ) : (
                                <>
                                    <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center mr-2">
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
                
                {/* Modal de formulário de OS */}
                {activeOSForm !== null && renderOSForm(activeOSForm)}
            </div>
        );
    };
    
    export default OSManager;