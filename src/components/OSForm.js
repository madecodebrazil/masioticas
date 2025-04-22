import { useState } from 'react';
import { FiX, FiCheck } from 'react-icons/fi';

const OSForm = ({ data, onSubmit, onCancel }) => {
    const [formData, setFormData] = useState(data);
    const [tipoOS, setTipoOS] = useState(data.tipoOS || "completa");

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-lg max-h-[80vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-[#81059e] mb-4">Dados da Ordem de Serviço</h2>

            {/* Alerta para OS especiais */}
            {(tipoOS === "somente_armacao" || tipoOS === "somente_lente") && (
                <div className="mb-4 p-3 bg-yellow-50 border-l-4 border-yellow-500 text-yellow-700">
                    <h3 className="font-medium">Atenção: Kit Incompleto</h3>
                    <p className="text-sm">
                        {tipoOS === "somente_armacao"
                            ? "Cliente comprou apenas a armação e vai trazer suas próprias lentes."
                            : "Cliente comprou apenas as lentes e vai trazer sua própria armação."}
                    </p>
                </div>
            )}

            <form onSubmit={(e) => {
                e.preventDefault();
                onSubmit(formData);
            }}>
                {/* Campos comuns a todos os tipos de OS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Laboratório</label>
                        <select
                            name="laboratorio"
                            value={formData.laboratorio || ''}
                            onChange={handleChange}
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
                            value={formData.status || ''}
                            onChange={handleChange}
                            className="w-full border border-gray-300 p-2 rounded-md"
                            required
                        >
                            <option value="processamentoInicial">Em processamento inicial</option>
                            <option value="aguardandoCliente">Aguardando cliente trazer {tipoOS === "somente_armacao" ? "lentes" : "armação"}</option>
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
                                {tipoOS === "somente_lente" && (
                                    <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                                        Cliente traz
                                    </span>
                                )}
                            </div>
                            {tipoOS === "somente_lente" ? (
                                <div className="mt-2">
                                    <input
                                        type="text"
                                        name="armacaoClienteDescricao"
                                        value={formData.armacaoClienteDescricao || ""}
                                        onChange={handleChange}
                                        placeholder="Descrição da armação do cliente"
                                        className="w-full border border-gray-300 p-2 rounded-md"
                                    />
                                </div>
                            ) : (
                                <div className="mt-2 p-3 bg-white border border-gray-200 rounded-md">
                                    {formData.armacaoDados || "Nenhuma armação selecionada"}
                                </div>
                            )}
                        </div>

                        {/* Lentes */}
                        <div>
                            <div className="flex justify-between">
                                <label className="block text-sm font-medium text-gray-700">Lentes</label>
                                {tipoOS === "somente_armacao" && (
                                    <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                                        Cliente traz
                                    </span>
                                )}
                            </div>
                            {tipoOS === "somente_armacao" ? (
                                <div className="mt-2">
                                    <input
                                        type="text"
                                        name="lentesClienteDescricao"
                                        value={formData.lentesClienteDescricao || ""}
                                        onChange={handleChange}
                                        placeholder="Descrição das lentes do cliente"
                                        className="w-full border border-gray-300 p-2 rounded-md"
                                    />
                                </div>
                            ) : (
                                <div className="mt-2 p-3 bg-white border border-gray-200 rounded-md">
                                    {formData.lenteDados || "Nenhuma lente selecionada"}
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
                                        value={formData.esferaDireito || ''}
                                        onChange={handleChange}
                                        className="w-full border border-gray-300 p-1 rounded-md text-sm"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-600">Cilindro</label>
                                    <input
                                        type="text"
                                        name="cilindroDireito"
                                        value={formData.cilindroDireito || ''}
                                        onChange={handleChange}
                                        className="w-full border border-gray-300 p-1 rounded-md text-sm"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-600">Eixo</label>
                                    <input
                                        type="text"
                                        name="eixoDireito"
                                        value={formData.eixoDireito || ''}
                                        onChange={handleChange}
                                        className="w-full border border-gray-300 p-1 rounded-md text-sm"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-600">Adição</label>
                                    <input
                                        type="text"
                                        name="adicaoDireito"
                                        value={formData.adicaoDireito || ''}
                                        onChange={handleChange}
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
                                        value={formData.esferaEsquerdo || ''}
                                        onChange={handleChange}
                                        className="w-full border border-gray-300 p-1 rounded-md text-sm"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-600">Cilindro</label>
                                    <input
                                        type="text"
                                        name="cilindroEsquerdo"
                                        value={formData.cilindroEsquerdo || ''}
                                        onChange={handleChange}
                                        className="w-full border border-gray-300 p-1 rounded-md text-sm"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-600">Eixo</label>
                                    <input
                                        type="text"
                                        name="eixoEsquerdo"
                                        value={formData.eixoEsquerdo || ''}
                                        onChange={handleChange}
                                        className="w-full border border-gray-300 p-1 rounded-md text-sm"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-600">Adição</label>
                                    <input
                                        type="text"
                                        name="adicaoEsquerdo"
                                        value={formData.adicaoEsquerdo || ''}
                                        onChange={handleChange}
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
                                value={formData.distanciaInterpupilar || ''}
                                onChange={handleChange}
                                className="w-full border border-gray-300 p-2 rounded-md"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Altura</label>
                            <input
                                type="text"
                                name="altura"
                                value={formData.altura || ''}
                                onChange={handleChange}
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
                        value={formData.observacoes || ''}
                        onChange={handleChange}
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
                        value={formData.dataPrevistaEntrega || ''}
                        onChange={handleChange}
                        className="w-full border border-gray-300 p-2 rounded-md"
                        required
                    />
                </div>

                <div className="flex justify-end space-x-3">
                    <button
                        type="button"
                        onClick={onCancel}
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
    );
};

export default OSForm; 