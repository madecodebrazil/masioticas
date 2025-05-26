// components/ClientForm.js
"use client";
import React from 'react';
import InputMask from 'react-input-mask';
import { FiUser, FiMail, FiPhone, FiCalendar, FiMapPin, FiHash, FiHome, FiImage, 
         FiFileText, FiCamera, FiCheckCircle, FiX, FiFile, FiSearch, FiUsers } from 'react-icons/fi';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUsers } from "@fortawesome/free-solid-svg-icons";
import { useClientForm } from '../hooks/useClientForm'; 

// Adicione estas constantes antes do componente
const estados = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

const relacoesContatoAlternativo = [
    'Pai/Mãe',
    'Filho(a)',
    'Cônjuge',
    'Irmão/Irmã',
    'Amigo(a)',
    'Outro'
];

const parentescoOptions = [
    'Cônjuge',
    'Filho(a)',
    'Pai/Mãe',
    'Irmão/Irmã',
    'Avô/Avó',
    'Neto(a)',
    'Tio(a)',
    'Sobrinho(a)',
    'Outro'
];

const ClientForm = ({ selectedLoja, onSuccessRedirect, userId, userName }) => {
    const {
        formData,
        selectedFile,
        selectedFileName,
        imagePreview,
        documentoFile,
        comprovanteFile,
        documentoPreview,
        comprovantePreview,
        showSuccessPopup,
        loading,
        error,
        fetchingCep,
        isTitular,
        searchTerm,
        consumers,
        isSearching,
        selectedTitular,
        handleChange,
        handleSubmit,
        handleImageChange,
        handleDocumentChange,
        handleCameraClick,
        handleSelectCliente,
        setImagePreview,
        setSelectedFile,
        setSelectedFileName,
        setDocumentoFile,
        setDocumentoPreview,
        setComprovanteFile,
        setComprovantePreview,
        setIsTitular,
        setSearchTerm,
        setSelectedTitular,
        truncateFileName,
        createFilePreview
    } = useClientForm({ selectedLoja, onSuccessRedirect, userId, userName });


    // Seu JSX permanece o mesmo, mas agora usa as funções e estados do hook
    return (
        <form onSubmit={handleSubmit} className="mt-8 mb-20">
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                    <span className="block sm:inline">{error}</span>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Seção de Tipo de Cadastro */}
                <div className="p-2 rounded-sm h-auto min-h-80">
                    <h3 className="text-sm font-medium text-[#81059e] flex items-center gap-1 mb-4">
                        <FontAwesomeIcon icon={faUsers} className="h-5 w-5" /> Tipo de Cadastro
                    </h3>

                    {/* Opção Titular/Dependente */}
                    <div className="flex items-center space-x-4 mb-4">
                        <label className="inline-flex items-center">
                            <input
                                type="radio"
                                className="form-radio text-[#81059e]"
                                name="tipoCliente"
                                checked={isTitular}
                                onChange={() => setIsTitular(true)}
                            />
                            <span className="ml-2 text-gray-700">Cliente Titular</span>
                        </label>

                        <label className="inline-flex items-center">
                            <input
                                type="radio"
                                className="form-radio text-[#81059e]"
                                name="tipoCliente"
                                checked={!isTitular}
                                onChange={() => setIsTitular(false)}
                            />
                            <span className="ml-2 text-gray-700">Dependente</span>
                        </label>
                    </div>

                    {/* Seleção de Titular e Parentesco (aparece apenas se for dependente) */}
                    {!isTitular && (
                        <div className="space-y-4">
                            <div className="space-y-2 relative mb-20">
                                <label className="text-[#81059e] font-medium">
                                    Buscar Cliente Titular
                                </label>
                                <div className="relative">
                                    <div className="flex items-center border-2 border-[#81059e] rounded-sm">
                                        <span className="pl-3 text-[#81059e]">
                                            <FiSearch size={16} />
                                        </span>
                                        <input
                                            type="text"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            placeholder="Digite nome ou CPF do titular"
                                            className="p-3 w-full text-black outline-none"
                                        />

                                        {isSearching && (
                                            <div className="pr-3">
                                                <div className="animate-spin h-4 w-4 border-2 border-[#81059e] rounded-full border-t-transparent"></div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Resultados da busca - Estilo igual ao add-receive */}
                                    {!isTitular && consumers.length > 0 && (
                                        <div className="absolute z-50 w-full">
                                            <ul className="bg-white border-2 border-[#81059e] rounded-sm w-full max-h-[104px] overflow-y-auto shadow-sm custom-scroll">
                                                {consumers.map((cliente) => (
                                                    <li
                                                        key={cliente.id}
                                                        onClick={() => handleSelectCliente(cliente)}
                                                        className="p-2 hover:bg-purple-50 cursor-pointer text-black border-b last:border-b-0 h-[52px] flex items-center"
                                                    >
                                                        {cliente.nome} {cliente.cpf && (
                                                            <span className="ml-2 text-xs text-gray-500">(CPF: {formatCPF(cliente.cpf)})</span>
                                                        )}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {searchTerm && searchTerm.length >= 3 && consumers.length === 0 && !isSearching && (
                                        <div className="absolute z-40 w-full">
                                            <div className="bg-white border-2 border-[#81059e] rounded-sm w-full p-2 text-gray-500">
                                                Nenhum cliente titular encontrado
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {selectedTitular && (
                                    <div className="mt-2 p-2 bg-purple-100 rounded-sm flex items-center justify-between">
                                        <span>{selectedTitular.nome || 'Titular selecionado'}</span>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSelectedTitular('');
                                                setSearchTerm('');
                                                setFormData(prev => ({
                                                    ...prev,
                                                    dependentesDe: null
                                                }));
                                            }}
                                            className="text-red-500 hover:text-red-700"
                                        >
                                            <FiX size={16} />
                                        </button>
                                    </div>
                                )}

                            </div>

                            <div className="space-y-2">
                                <label className="block text-[#81059e] font-medium">
                                    Parentesco com o Titular
                                </label>
                                <select
                                    name="parentesco"
                                    value={formData.parentesco}
                                    onChange={handleChange}
                                    className="border-2 border-[#81059e] p-3 rounded-sm w-full text-black"
                                    required={!isTitular}
                                >
                                    <option value="">Selecione o parentesco</option>
                                    {parentescoOptions.map((option) => (
                                        <option key={option} value={option}>
                                            {option}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}
                </div>
                <div>
                    <label className="flex text-[#81059e] font-medium items-center gap-1">
                        <FiUser /> Nome Completo
                    </label>
                    <input
                        type="text"
                        name="nome"
                        value={formData.nome}
                        onChange={handleChange}
                        className="border-2 border-[#81059e] p-3 rounded-sm w-full text-black"
                        required
                    />
                </div>

                <div>
                    <label className="flex text-[#81059e] font-medium items-center gap-1">
                        <FiHash /> CPF
                    </label>
                    <InputMask
                        mask="999.999.999-99"
                        type="text"
                        name="cpf"
                        value={formData.cpf}
                        onChange={handleChange}
                        placeholder="000.000.000-00"
                        className="border-2 border-[#81059e] p-3 rounded-sm w-full text-black"
                        required
                    />
                </div>

                <div>
                    <label className="flex text-[#81059e] font-medium items-center gap-1">
                        <FiMail /> Email
                    </label>
                    <input
                        type="email"
                        name="email" value={formData.email}
                        onChange={handleChange}
                        placeholder="cliente@exemplo.com"
                        className="border-2 border-[#81059e] p-3 rounded-sm w-full text-black"
                    />
                </div>

                <div>
                    <label className="flex text-[#81059e] font-medium items-center gap-1">
                        <FiPhone /> Telefone
                    </label>
                    <InputMask
                        mask="(99) 99999-9999"
                        type="tel"
                        name="telefone"
                        value={formData.telefone}
                        onChange={handleChange}
                        placeholder="(00) 00000-0000"
                        className="border-2 border-[#81059e] p-3 rounded-sm w-full text-black"
                        required
                    />
                </div>

                <div>
                    <label className="flex text-[#81059e] font-medium items-center gap-1">
                        <FiCalendar /> Data de Nascimento
                    </label>
                    <input
                        type="date"
                        name="dataNascimento"
                        value={formData.dataNascimento}
                        onChange={handleChange}
                        className="border-2 border-[#81059e] p-3 rounded-sm w-full text-black"
                        required
                    />
                </div>

                <div>
                    <label className="flex text-[#81059e] font-medium items-center gap-1">
                        <FiUser /> Gênero
                    </label>
                    <select
                        name="genero"
                        value={formData.genero}
                        onChange={handleChange}
                        className="border-2 border-[#81059e] p-3 rounded-sm w-full text-black"
                        required
                    >
                        <option value="">Selecione</option>
                        <option value="masculino">Masculino</option>
                        <option value="feminino">Feminino</option>
                        <option value="outro">Outro</option>
                        <option value="prefiro_nao_informar">Prefiro não informar</option>
                    </select>
                </div>

                <div>
                    <label className="flex text-[#81059e] font-medium items-center gap-1">
                        Estado Civil
                    </label>
                    <select
                        name="estadoCivil"
                        value={formData.estadoCivil}
                        onChange={handleChange}
                        className="border-2 border-[#81059e] p-3 rounded-sm w-full text-black"
                        required
                    >
                        <option value="">Selecione</option>
                        <option value="solteiro">Solteiro(a)</option>
                        <option value="casado">Casado(a)</option>
                        <option value="divorciado">Divorciado(a)</option>
                        <option value="viuvo">Viúvo(a)</option>
                        <option value="uniao_estavel">União Estável</option>
                    </select>
                </div>

                <div>
                    <label className="flex text-[#81059e] font-medium items-center gap-1">
                        Escolaridade
                    </label>
                    <select
                        name="escolaridade"
                        value={formData.escolaridade}
                        onChange={handleChange}
                        className="border-2 border-[#81059e] p-3 rounded-sm w-full text-black"
                        required
                    >
                        <option value="">Selecione</option>
                        <option value="fundamental_incompleto">Fundamental Incompleto</option>
                        <option value="fundamental_completo">Fundamental Completo</option>
                        <option value="medio_incompleto">Médio Incompleto</option>
                        <option value="medio_completo">Médio Completo</option>
                        <option value="superior_incompleto">Superior Incompleto</option>
                        <option value="superior_completo">Superior Completo</option>
                        <option value="pos_graduacao">Pós-graduação</option>
                        <option value="outro">Outro</option>
                    </select>
                </div>

                <div>
                    <label className="flex text-[#81059e] font-medium items-center gap-1">
                        Profissão
                    </label>
                    <input
                        type="text"
                        name="profissao"
                        value={formData.profissao}
                        onChange={handleChange}
                        className="border-2 border-[#81059e] p-3 rounded-sm w-full text-black"
                        placeholder="Digite a profissão"
                        required
                    />
                </div>

                <div>

                </div>
            </div>

            <div className="mt-6">
                <h3 className="text-sm font-medium text-[#81059e] flex items-center gap-1">
                    <FiMapPin /> Endereço
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                    <div>
                        <label className="flex text-[#81059e] font-medium items-center gap-1">
                            <FiHash /> CEP
                        </label>
                        <div className="relative">
                            <InputMask
                                mask="99999-999"
                                type="text"
                                name="endereco.cep"
                                value={formData.endereco.cep}
                                onChange={handleChange}
                                placeholder="00000-000"
                                className="border-2 border-[#81059e] p-3 rounded-sm w-full text-black"
                                required
                            />
                            {fetchingCep && (
                                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                    <div className="animate-spin h-4 w-4 border-2 border-[#81059e] rounded-full border-t-transparent"></div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="md:col-span-2">
                        <label className="flex text-[#81059e] font-medium items-center gap-1">
                            <FiHome /> Logradouro
                        </label>
                        <input
                            type="text"
                            name="endereco.logradouro"
                            value={formData.endereco.logradouro}
                            onChange={handleChange}
                            className="border-2 border-[#81059e] p-3 rounded-sm w-full text-black"
                            required
                        />
                    </div>

                    <div>
                        <label className="flex text-[#81059e] font-medium items-center gap-1">
                            Número
                        </label>
                        <input
                            type="text"
                            name="endereco.numero"
                            value={formData.endereco.numero}
                            onChange={handleChange}
                            className="border-2 border-[#81059e] p-3 rounded-sm w-full text-black"
                            required
                        />
                    </div>

                    <div>
                        <label className="flex text-[#81059e] font-medium items-center gap-1">
                            Complemento
                        </label>
                        <input
                            type="text"
                            name="endereco.complemento"
                            value={formData.endereco.complemento}
                            onChange={handleChange}
                            className="border-2 border-[#81059e] p-3 rounded-sm w-full text-black"
                        />
                    </div>

                    <div>
                        <label className="flex text-[#81059e] font-medium items-center gap-1">
                            Bairro
                        </label>
                        <input
                            type="text"
                            name="endereco.bairro"
                            value={formData.endereco.bairro}
                            onChange={handleChange}
                            className="border-2 border-[#81059e] p-3 rounded-sm w-full text-black"
                            required
                        />
                    </div>

                    <div>
                        <label className="flex text-[#81059e] font-medium items-center gap-1">
                            Cidade
                        </label>
                        <input
                            type="text"
                            name="endereco.cidade"
                            value={formData.endereco.cidade}
                            onChange={handleChange}
                            className="border-2 border-[#81059e] p-3 rounded-sm w-full text-black"
                            required
                        />
                    </div>

                    <div>
                        <label className="flex text-[#81059e] font-medium items-center gap-1">
                            Estado
                        </label>
                        <select
                            name="endereco.estado"
                            value={formData.endereco.estado}
                            onChange={handleChange}
                            className="border-2 border-[#81059e] p-3 rounded-sm w-full text-black"
                            required
                        >
                            <option value="">Selecione</option>
                            {estados.map(estado => (
                                <option key={estado} value={estado}>
                                    {estado}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>



            {/* Adicione esta seção logo após a seção de Endereço e antes da seção de Observações */}

            <div className="mt-6">
                <h3 className="text-sm font-medium text-[#81059e] flex items-center gap-1">
                    <FiPhone /> Contato Alternativo (Opcional)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                    <div>
                        <label className="flex text-[#81059e] font-medium items-center gap-1">
                            <FiUser /> Nome
                        </label>
                        <input
                            type="text"
                            name="contatoAlternativo.nome"
                            value={formData.contatoAlternativo.nome}
                            onChange={handleChange}
                            placeholder="Nome do contato alternativo"
                            className="border-2 border-[#81059e] p-3 rounded-sm w-full text-black"
                        />
                    </div>

                    <div>
                        <label className="flex text-[#81059e] font-medium items-center gap-1">
                            <FiPhone /> Telefone
                        </label>
                        <InputMask
                            mask="(99) 99999-9999"
                            type="tel"
                            name="contatoAlternativo.telefone"
                            value={formData.contatoAlternativo.telefone}
                            onChange={handleChange}
                            placeholder="(00) 00000-0000"
                            className="border-2 border-[#81059e] p-3 rounded-sm w-full text-black"
                        />
                    </div>

                    <div>
                        <label className="flex text-[#81059e] font-medium items-center gap-1">
                            <FiUsers /> Relação
                        </label>
                        <select
                            name="contatoAlternativo.relacao"
                            value={formData.contatoAlternativo.relacao}
                            onChange={handleChange}
                            className="border-2 border-[#81059e] p-3 rounded-sm w-full text-black"
                        >
                            <option value="">Selecione a relação</option>
                            {relacoesContatoAlternativo.map((opcao) => (
                                <option key={opcao} value={opcao}>
                                    {opcao}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>


            <div className="mt-6">
                <label className="flex text-[#81059e] font-medium items-center gap-1">
                    <FiFileText /> Observações
                </label>
                <textarea
                    name="observacoes"
                    value={formData.observacoes}
                    onChange={handleChange}
                    className="border-2 border-[#81059e] p-3 rounded-sm w-full text-black"
                    rows="3"
                    placeholder="Adicione observações relevantes sobre o cliente"
                />
            </div>

            <div className="mt-6">
                <h3 className="text-sm font-medium text-[#81059e] flex items-center gap-1 mb-4">
                    <FiFileText /> Documentos
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="flex text-[#81059e] font-medium items-center gap-1">
                            <FiImage /> Foto do Cliente
                        </label>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                                    required
                                />
                                <div className="flex items-center border-2 border-[#81059e] py-2 px-3 rounded-sm w-full text-black">
                                    <span className="flex-1 truncate text-sm" title={selectedFileName}>
                                        {selectedFileName ? truncateFileName(selectedFileName) : "Escolher arquivo..."}
                                    </span>
                                    <button type="button" className="bg-purple-100 text-[#81059e] px-3 py-1 rounded-sm ml-2 text-xs sm:text-sm whitespace-nowrap">
                                        Procurar
                                    </button>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => handleCameraClick('foto')}
                                className="bg-purple-100 text-[#81059e] p-2 rounded-sm flex items-center justify-center"
                                title="Tirar foto"
                            >
                                <FiCamera size={20} />
                            </button>
                        </div>
                        {imagePreview && (
                            <div className="mt-2 relative">
                                <img
                                    src={imagePreview}
                                    alt="Preview"
                                    className="w-32 h-32 object-cover rounded-sm border-2 border-[#81059e]"
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        setImagePreview(null);
                                        setSelectedFile(null);
                                        setSelectedFileName('');
                                    }}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                                >
                                    <FiX size={16} />
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label className="flex text-[#81059e] font-medium items-center gap-1">
                            <FiFileText /> RG ou CNH
                        </label>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <input
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    onChange={(e) => handleDocumentChange(e, 'documento')}
                                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                                />
                                <div className="flex items-center border-2 border-[#81059e] py-2 px-3 rounded-sm w-full text-black">
                                    <span className="flex-1 truncate text-sm" title={documentoFile?.name}>
                                        {documentoFile ? truncateFileName(documentoFile.name) : "Escolher arquivo..."}
                                    </span>
                                    <button type="button" className="bg-purple-100 text-[#81059e] px-3 py-1 rounded-sm ml-2 text-xs sm:text-sm whitespace-nowrap">
                                        Procurar
                                    </button>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => handleCameraClick('documento')}
                                className="bg-purple-100 text-[#81059e] p-2 rounded-sm flex items-center justify-center"
                                title="Tirar foto"
                            >
                                <FiCamera size={20} />
                            </button>
                        </div>
                        {documentoPreview && (
                            <div className="mt-2 relative">
                                {typeof documentoPreview === 'string' && documentoPreview === 'pdf' ? (
                                    <div className="w-full h-36 bg-red-100 rounded-sm border-2 border-[#81059e] flex flex-col items-center justify-center">
                                        <FiFile size={36} className="text-red-500" />
                                        <span className="text-xs mt-2 text-center px-2 truncate w-full">
                                            {documentoFile?.name || 'Documento PDF'}
                                        </span>
                                    </div>
                                ) : typeof documentoPreview === 'string' && documentoPreview === 'file' ? (
                                    <div className="w-full h-36 bg-gray-100 rounded-sm border-2 border-[#81059e] flex flex-col items-center justify-center">
                                        <FiFileText size={36} className="text-gray-500" />
                                        <span className="text-xs mt-2 text-center px-2 truncate w-full">
                                            {documentoFile?.name || 'Documento'}
                                        </span>
                                    </div>
                                ) : (
                                    <img
                                        src={documentoPreview}
                                        alt="Preview documento"
                                        className="w-32 h-32 object-cover rounded-sm border-2 border-[#81059e]"
                                    />
                                )}
                                <button
                                    type="button"
                                    onClick={() => {
                                        setDocumentoFile(null);
                                        setDocumentoPreview(null);
                                    }}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                                >
                                    <FiX size={16} />
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label className="flex text-[#81059e] font-medium items-center gap-1">
                            <FiFileText /> Comprovante de Residência
                        </label>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <input
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    onChange={(e) => handleDocumentChange(e, 'comprovante')}
                                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                                />
                                <div className="flex items-center border-2 border-[#81059e] py-2 px-3 rounded-sm w-full text-black">
                                    <span className="flex-1 truncate text-sm" title={comprovanteFile?.name}>
                                        {comprovanteFile ? truncateFileName(comprovanteFile.name) : "Escolher arquivo..."}
                                    </span>
                                    <button type="button" className="bg-purple-100 text-[#81059e] px-3 py-1 rounded-sm ml-2 text-xs sm:text-sm whitespace-nowrap">
                                        Procurar
                                    </button>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => handleCameraClick('comprovante')}
                                className="bg-purple-100 text-[#81059e] p-2 rounded-sm flex items-center justify-center"
                                title="Tirar foto"
                            >
                                <FiCamera size={20} />
                            </button>
                        </div>
                        {comprovantePreview && (
                            <div className="mt-2 relative">
                                {typeof comprovantePreview === 'string' && comprovantePreview === 'pdf' ? (
                                    <div className="w-full h-36 bg-red-100 rounded-sm border-2 border-[#81059e] flex flex-col items-center justify-center">
                                        <FiFile size={36} className="text-red-500" />
                                        <span className="text-xs mt-2 text-center px-2 truncate w-full">
                                            {comprovanteFile?.name || 'Comprovante PDF'}
                                        </span>
                                    </div>
                                ) : typeof comprovantePreview === 'string' && comprovantePreview === 'file' ? (
                                    <div className="w-full h-36 bg-gray-100 rounded-sm border-2 border-[#81059e] flex flex-col items-center justify-center">
                                        <FiFileText size={36} className="text-gray-500" />
                                        <span className="text-xs mt-2 text-center px-2 truncate w-full">
                                            {comprovanteFile?.name || 'Comprovante'}
                                        </span>
                                    </div>
                                ) : (
                                    <img
                                        src={comprovantePreview}
                                        alt="Preview comprovante"
                                        className="w-32 h-32 object-cover rounded-sm border-2 border-[#81059e]"
                                    />
                                )}
                                <button
                                    type="button"
                                    onClick={() => {
                                        setComprovanteFile(null);
                                        setComprovantePreview(null);
                                    }}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                                >
                                    <FiX size={16} />
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="hidden lg:block">
                        {/* Reservado para expansão futura */}
                    </div>
                </div>
            </div>

            <div className="flex justify-center gap-4 mt-16">
                <button
                    type="button"
                    onClick={() => {
                        if (onSuccessRedirect) onSuccessRedirect();
                    }}
                    className="inline-flex justify-center py-2 px-6 border-2 border-[#81059e] shadow-sm text-sm font-medium rounded-sm text-[#81059e] bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#81059e]"
                >
                    CANCELAR
                </button>
                <button
                    type="submit"
                    className="inline-flex justify-center items-center py-2 px-6 border border-transparent shadow-sm text-sm font-medium rounded-sm text-white bg-[#81059e] hover:bg-[#6f0486] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#81059e]"
                    disabled={loading}
                >
                    {loading ? (
                        <>
                            <div className="animate-spin mr-2 h-4 w-4 border-2 border-white rounded-full border-t-transparent"></div>
                            SALVANDO...
                        </>
                    ) : 'SALVAR'}
                </button>
            </div>

            {showSuccessPopup && (
                <div className="fixed top-4 right-4 z-50 animate-fade-in">
                    <div className="bg-green-500 text-white px-6 py-4 rounded-sm shadow-sm flex items-center gap-2">
                        <FiCheckCircle size={24} />
                        <span>Cliente adicionado com sucesso!</span>
                    </div>
                </div>
            )}
        </form>
    );
};

export default ClientForm;