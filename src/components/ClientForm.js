
"use client";
import React from 'react';
import InputMask from 'react-input-mask';
import {
    FiUser, FiMail, FiPhone, FiCalendar, FiMapPin, FiHash, FiHome, FiImage,
    FiFileText, FiCamera, FiCheckCircle, FiX, FiFile, FiSearch, FiUsers, FiMessageCircle, FiUpload
} from 'react-icons/fi';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUsers, faGraduationCap, faBriefcase, faInstagram } from "@fortawesome/free-solid-svg-icons";
import { useClientForm } from '../hooks/useClientForm';
import ConfirmationModalClient from '@/app/register/consumers/confirm/confirmModal';
import SucessModal from '@/app/register/consumers/confirm/sucessModal';


// Constantes
const estados = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

const relacoesContatoAlternativo = [
    'Pai/Mãe', 'Filho(a)', 'Cônjuge', 'Irmão/Irmã', 'Amigo(a)', 'Outro'
];

const parentescoOptions = [
    'Cônjuge', 'Filho(a)', 'Pai/Mãe', 'Irmão/Irmã', 'Avô/Avó',
    'Neto(a)', 'Tio(a)', 'Sobrinho(a)', 'Outro'
];

const formatCPF = (cpf) => {
    if (!cpf) return '';
    const numericCPF = cpf.replace(/\D/g, '');
    if (numericCPF.length === 11) {
        return numericCPF.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    return cpf;
};

const ClientForm = ({ selectedLoja, onSuccessRedirect, userId, userName }) => {
    const {
        formData,
        setFormData,
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
        createFilePreview,
        showConfirmModal,
        handleConfirmSubmit,
        handleCancelSubmit,
    } = useClientForm({ selectedLoja, onSuccessRedirect, userId, userName });

    return (
        <form onSubmit={handleSubmit} className="mt-8 mb-20 max-w-6xl mx-auto">
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
                    <span className="block sm:inline">{error}</span>
                </div>
            )}

            {/* 1. TIPO DE CLIENTE */}
            <div className="bg-white p-6 rounded-sm shadow-sm border border-gray-200 mb-6">
                <h3 className="text-xl font-semibold text-[#81059e] flex items-center gap-2 mb-4">
                    <FontAwesomeIcon icon={faUsers} className="h-5 w-5" />
                    Tipo de Cliente
                </h3>

                <div className="flex items-center space-x-6">
                    <label className="inline-flex items-center">
                        <input
                            type="radio"
                            className="form-radio text-[#96709d] h-4 w-4"
                            name="tipoCliente"
                            checked={isTitular}
                            onChange={() => setIsTitular(true)}
                        />
                        <span className="ml-2 text-[#96709d] font-medium">Cliente Titular</span>
                    </label>

                    <label className="inline-flex items-center">
                        <input
                            type="radio"
                            className="form-radio text-[#96709d] h-4 w-4"
                            name="tipoCliente"
                            checked={!isTitular}
                            onChange={() => setIsTitular(false)}
                        />
                        <span className="ml-2 text-[#96709d] font-medium">Dependente</span>
                    </label>
                </div>

                {/* Campos de Dependente - só aparecem quando necessário */}
                {!isTitular && (
                    <div className="mt-6 space-y-6">
                        {/* Busca de Titular */}
                        <div className="space-y-3">
                            <label className="text-[#81059e] font-medium flex items-center gap-1">
                                <FiSearch size={16} />
                                Buscar Cliente Titular
                            </label>

                            {!selectedTitular ? (
                                <div className="relative">
                                    <div className="flex items-center border-2 border-[#81059e] rounded-sm bg-white search-input transition-all duration-200">
                                        <span className="pl-3 text-[#81059e]">
                                            <FiSearch size={16} />
                                        </span>
                                        <input
                                            type="text"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            placeholder="Digite nome ou CPF do titular"
                                            className="p-3 w-full text-black outline-none rounded-r-lg bg-transparent"
                                        />
                                        {isSearching && (
                                            <div className="pr-3">
                                                <div className="animate-spin h-4 w-4 border-2 border-[#81059e] rounded-full border-t-transparent"></div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Resultados da busca - Melhor posicionamento */}
                                    {consumers.length > 0 && (
                                        <div className="absolute z-50 w-full mt-2 bg-white border-2 border-[#81059e] rounded-sm shadow-xl search-dropdown">
                                            <div className="p-2 bg-purple-50 border-b border-purple-200 text-sm font-medium text-[#81059e]">
                                                Clientes encontrados:
                                            </div>
                                            <ul className="max-h-[240px] overflow-y-auto">
                                                {consumers.map((cliente, index) => (
                                                    <li
                                                        key={cliente.id}
                                                        onClick={() => handleSelectCliente(cliente)}
                                                        className={`p-3 hover:bg-purple-50 cursor-pointer text-black transition-colors group ${index !== consumers.length - 1 ? 'border-b border-gray-100' : ''
                                                            }`}
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <div>
                                                                <div className="font-medium text-gray-900">{cliente.nome}</div>
                                                                {cliente.cpf && (
                                                                    <div className="text-xs text-gray-500 mt-1">
                                                                        CPF: {formatCPF(cliente.cpf)}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="text-[#81059e] opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <FiUser size={16} />
                                                            </div>
                                                        </div>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* Nenhum resultado encontrado */}
                                    {searchTerm && searchTerm.length >= 3 && consumers.length === 0 && !isSearching && (
                                        <div className="absolute z-40 w-full mt-2 bg-white border-2 border-[#81059e] rounded-sm shadow-lg search-dropdown">
                                            <div className="p-4 text-center text-gray-500">
                                                <FiSearch size={24} className="mx-auto mb-2 text-gray-400" />
                                                <div className="text-sm">Nenhum cliente titular encontrado</div>
                                                <div className="text-xs mt-1">Tente buscar por nome completo ou CPF</div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                /* Cliente Titular Selecionado */
                                <div className="p-4 bg-gradient-to-r from-purple-50 to-purple-100 border-2 border-purple-200 rounded-sm selected-titular">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-[#81059e] rounded-full flex items-center justify-center">
                                                <FiUser className="text-white" size={18} />
                                            </div>
                                            <div>
                                                <div className="font-semibold text-gray-900">
                                                    {selectedTitular.nome}
                                                </div>
                                                <div className="text-sm text-gray-600">
                                                    Cliente Titular Selecionado
                                                </div>
                                            </div>
                                        </div>
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
                                            className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors"
                                            title="Remover titular selecionado"
                                        >
                                            <FiX size={18} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Campo de Parentesco - Com espaçamento adequado */}
                        <div className="space-y-2">
                            <label className="block text-[#81059e] font-medium">
                                Parentesco com o Titular
                            </label>
                            <select
                                name="parentesco"
                                value={formData.parentesco}
                                onChange={handleChange}
                                className="border-2 border-[#81059e] p-3 rounded-sm w-full text-black bg-white"
                                required={!isTitular}
                                disabled={!selectedTitular}
                            >
                                <option value="">
                                    {selectedTitular ? 'Selecione o parentesco' : 'Primeiro selecione um titular'}
                                </option>
                                {parentescoOptions.map((option) => (
                                    <option key={option} value={option}>
                                        {option}
                                    </option>
                                ))}
                            </select>
                            {!selectedTitular && (
                                <p className="text-sm text-gray-500 mt-1">
                                    * Selecione um cliente titular para habilitar este campo
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* 2. INFORMAÇÕES GERAIS */}
            <div className="bg-white p-6 rounded-sm shadow-sm border-2 border-gray-200 mb-6">
                <h3 className="text-xl font-semibold text-[#81059e] flex items-center gap-2 mb-4">
                    <FiUser className="h-5 w-5 text-[#81059e]" />
                    Informações Gerais
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className='md:col-span-2 lg:col-span-2'>
                        <label className="flex text-[#96709d] font-medium items-center gap-1 mb-2">
                            <FiUser size={16} /> Nome Completo
                        </label>
                        <input
                            type="text"
                            name="nome"
                            value={formData.nome}
                            onChange={handleChange}
                            className="border-2 border-[#96709d] p-3 rounded-sm w-full text-gray-600"
                            required
                        />
                    </div>

                    <div>
                        <label className="flex text-[#96709d] font-medium items-center gap-1 mb-2">
                            <FiCalendar size={16} /> Data de Nascimento
                        </label>
                        <input
                            type="date"
                            name="dataNascimento"
                            value={formData.dataNascimento}
                            onChange={handleChange}
                            className="border-2 border-[#96709d] p-3 rounded-sm w-full text-gray-600"
                            required
                        />
                    </div>

                    <div>
                        <label className="flex text-[#96709d] font-medium items-center gap-1 mb-2">
                            <FiHash size={16} /> CPF
                        </label>
                        <InputMask
                            mask="999.999.999-99"
                            type="text"
                            name="cpf"
                            value={formData.cpf}
                            onChange={handleChange}
                            placeholder="000.000.000-00"
                            className="border-2 border-[#96709d] p-3 rounded-sm w-full text-gray-600"
                            required
                        />
                    </div>

                    <div>
                        <label className="flex text-[#96709d] font-medium items-center gap-1 mb-2">
                            <FiUser size={16} /> Gênero
                        </label>
                        <select
                            name="genero"
                            value={formData.genero}
                            onChange={handleChange}
                            className="border-2 border-[#96709d] p-3 rounded-sm w-full text-gray-600"
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
                        <label className="flex text-[#96709d] font-medium items-center gap-1 mb-2">
                            <FiUsers size={16} /> Estado Civil
                        </label>
                        <select
                            name="estadoCivil"
                            value={formData.estadoCivil}
                            onChange={handleChange}
                            className="border-2 border-[#96709d] p-3 rounded-sm w-full text-gray-600"
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
                        <label className="flex text-[#96709d] font-medium items-center gap-1 mb-2">
                            <FontAwesomeIcon icon={faGraduationCap} className="h-4 w-4" />
                            Escolaridade
                        </label>
                        <select
                            name="escolaridade"
                            value={formData.escolaridade}
                            onChange={handleChange}
                            className="border-2 border-[#96709d] p-3 rounded-sm w-full text-gray-600"
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

                    <div className="md:col-span-2 lg:col-span-1">
                        <label className="flex text-[#96709d] font-medium items-center gap-1 mb-2">
                            <FontAwesomeIcon icon={faBriefcase} className="h-4 w-4" />
                            Profissão
                        </label>
                        <input
                            type="text"
                            name="profissao"
                            value={formData.profissao}
                            onChange={handleChange}
                            className="border-2 border-[#96709d] p-3 rounded-sm w-full text-gray-600"
                            placeholder="Digite a profissão"
                            required
                        />
                    </div>
                </div>
            </div>

            {/* 3. COMUNICAÇÃO */}
            <div className="bg-white p-6 rounded-sm shadow-sm border border-gray-200 mb-6">
                <h3 className="text-xl font-semibold text-[#81059e] flex items-center gap-2 mb-4">
                    <FiMessageCircle className="h-5 w-5" />
                    Comunicação
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    <div>
                        <label className="flex text-[#96709d] font-medium items-center gap-1 mb-2">
                            <FiPhone size={16} /> WhatsApp
                        </label>
                        <InputMask
                            mask="(99) 99999-9999"
                            type="tel"
                            name="telefone"
                            value={formData.telefone}
                            onChange={handleChange}
                            placeholder="(00) 00000-0000"
                            className="border-2 border-[#96709d] p-3 rounded-sm w-full text-gray-600"
                            required
                        />
                    </div>

                    <div>
                        <label className="flex text-[#96709d] font-medium items-center gap-1 mb-2">
                            <FiMail size={16} /> Email
                        </label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="cliente@exemplo.com"
                            className="border-2 border-[#96709d] p-3 rounded-sm w-full text-gray-600"
                        />
                    </div>

                    <div>
                        <label className="flex text-[#96709d]  font-medium items-center gap-1 mb-2">
                            <FontAwesomeIcon icon={faInstagram} className="h-4 w-4" />
                            Instagram
                        </label>
                        <input
                            type="text"
                            name="instagram"
                            value={formData.instagram || ''}
                            onChange={handleChange}
                            placeholder="@usuario"
                            className="border-2 border-[#96709d] p-3 rounded-sm w-full text-gray-600"
                        />
                    </div>
                </div>

                {/* Contato Alternativo */}
                <div className="border-t pt-4">
                    <h4 className="text-md font-medium text-[#96709d] mb-3">Contato Alternativo (Opcional)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="flex text-[#96709d] font-medium items-center gap-1 mb-2">
                                <FiUser size={16} /> Nome
                            </label>
                            <input
                                type="text"
                                name="contatoAlternativo.nome"
                                value={formData.contatoAlternativo.nome}
                                onChange={handleChange}
                                placeholder="Nome do contato alternativo"
                                className="border-2 border-[#96709d] p-3 rounded-sm w-full text-gray-600"
                            />
                        </div>

                        <div>
                            <label className="flex text-[#96709d] font-medium items-center gap-1 mb-2">
                                <FiPhone size={16} /> Telefone
                            </label>
                            <InputMask
                                mask="(99) 99999-9999"
                                type="tel"
                                name="contatoAlternativo.telefone"
                                value={formData.contatoAlternativo.telefone}
                                onChange={handleChange}
                                placeholder="(00) 00000-0000"
                                className="border-2 border-[#96709d] p-3 rounded-sm w-full text-gray-600"
                            />
                        </div>

                        <div>
                            <label className="flex text-[#96709d] font-medium items-center gap-1 mb-2">
                                <FiUsers size={16} /> Relação
                            </label>
                            <select
                                name="contatoAlternativo.relacao"
                                value={formData.contatoAlternativo.relacao}
                                onChange={handleChange}
                                className="border-2 border-[#96709d] p-3 rounded-sm w-full text-gray-600"
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
            </div>

            {/* 4. ENDEREÇO */}
            <div className="bg-white p-6 rounded-sm shadow-sm border border-gray-200 mb-6">
                <h3 className="text-xl font-semibold text-[#81059e] flex items-center gap-2 mb-4">
                    <FiMapPin className="h-5 w-5" />
                    Endereço
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                        <label className="flex text-[#96709d] font-medium items-center gap-1 mb-2">
                            <FiHash size={16} /> CEP
                        </label>
                        <div className="relative">
                            <InputMask
                                mask="99999-999"
                                type="text"
                                name="endereco.cep"
                                value={formData.endereco.cep}
                                onChange={handleChange}
                                placeholder="00000-000"
                                className="border-2 border-[#96709d] p-3 rounded-sm w-full text-gray-600"
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
                        <label className="flex text-[#96709d] font-medium items-center gap-1 mb-2">
                            <FiHome size={16} /> Logradouro
                        </label>
                        <input
                            type="text"
                            name="endereco.logradouro"
                            value={formData.endereco.logradouro}
                            onChange={handleChange}
                            className="border-2 border-[#96709d] p-3 rounded-sm w-full text-gray-600"
                            required
                        />
                    </div>

                    <div>
                        <label className="flex text-[#96709d] font-medium items-center gap-1 mb-2">
                            <FiHash size={16} /> Número
                        </label>
                        <input
                            type="text"
                            name="endereco.numero"
                            value={formData.endereco.numero}
                            onChange={handleChange}
                            className="border-2 border-[#96709d] p-3 rounded-sm w-full text-gray-600"
                            required
                        />
                    </div>

                    <div>
                        <label className="flex text-[#96709d] font-medium items-center gap-1 mb-2">
                            <FiHome size={16} /> Complemento
                        </label>
                        <input
                            type="text"
                            name="endereco.complemento"
                            value={formData.endereco.complemento}
                            onChange={handleChange}
                            className="border-2 border-[#96709d] p-3 rounded-sm w-full text-gray-600"
                        />
                    </div>

                    <div>
                        <label className="flex text-[#96709d] font-medium items-center gap-1 mb-2">
                            <FiMapPin size={16} /> Bairro
                        </label>
                        <input
                            type="text"
                            name="endereco.bairro"
                            value={formData.endereco.bairro}
                            onChange={handleChange}
                            className="border-2 border-[#96709d] p-3 rounded-sm w-full text-gray-600"
                            required
                        />
                    </div>

                    <div>
                        <label className="flex text-[#96709d] font-medium items-center gap-1 mb-2">
                            <FiMapPin size={16} /> Cidade
                        </label>
                        <input
                            type="text"
                            name="endereco.cidade"
                            value={formData.endereco.cidade}
                            onChange={handleChange}
                            className="border-2 border-[#96709d] p-3 rounded-sm w-full text-gray-600"
                            required
                        />
                    </div>

                    <div>
                        <label className="flex text-[#96709d] font-medium items-center gap-1 mb-2">
                            <FiMapPin size={16} /> Estado
                        </label>
                        <select
                            name="endereco.estado"
                            value={formData.endereco.estado}
                            onChange={handleChange}
                            className="border-2 border-[#96709d] p-3 rounded-sm w-full text-gray-600"
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

            {/* 5. DOCUMENTAÇÕES */}
            <div className="bg-white p-6 rounded-sm shadow-sm border border-gray-200 mb-6">
                <h3 className="text-xl font-semibold text-[#81059e] flex items-center gap-2 mb-4">
                    <FiFileText className="h-5 w-5" />
                    Documentações
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Foto do Cliente */}
                    <div className="space-y-2">
                        <label className="flex text-[#96709d] font-medium items-center gap-1 mb-2">
                            <FiImage size={16} /> Foto do Cliente
                        </label>
                        <div className="flex gap-3">
                            <div className="relative">
                                <input
                                    type="file"
                                    accept="image/*"
                                    capture="environment"
                                    onChange={handleImageChange}
                                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                                    required
                                />
                                <div className="flex items-center justify-center gap-2 border-2 bg-[#96709d] border-[#96709d] py-2 px-6 rounded-sm cursor-pointer hover:bg-[#a95eb8] transition-colors whitespace-nowrap shadow-md">
                                    <FiUpload size={20} className='text-white' />
                                    <span className="text-sm text-white">
                                        Upload Foto
                                    </span>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => handleCameraClick('foto')}
                                className="border-2 border-[#96709d] text-[#96709d] p-2 rounded-sm flex items-center justify-center hover:bg-purple-100 transition-colors"
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
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                                >
                                    <FiX size={16} />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* RG ou CNH */}
                    <div className="space-y-2">
                        <label className="flex text-[#96709d] font-medium items-center gap-1 mb-2">
                            <FiFileText size={16} /> RG ou CNH
                        </label>
                        <div className="flex gap-3">
                            <div className="relative">
                                <input
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png,image/*"
                                    capture="environment"
                                    onChange={(e) => handleDocumentChange(e, 'documento')}
                                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                                />
                                <div className="flex items-center justify-center gap-2 border-2 bg-[#96709d] border-[#96709d] py-2 px-6 rounded-sm cursor-pointer hover:bg-[#a95eb8] transition-colors whitespace-nowrap shadow-md">
                                    <FiUpload size={20} className='text-white' />
                                    <span className="text-sm text-white">
                                        Upload RG/CNH
                                    </span>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => handleCameraClick('documento')}
                                className="border-2 border-[#96709d] text-[#96709d] p-2 rounded-sm flex items-center justify-center hover:bg-purple-100 transition-colors"
                                title="Tirar foto do documento"
                            >
                                <FiCamera size={20} />
                            </button>
                        </div>
                        {documentoPreview && (
                            <div className="mt-2 relative">
                                {typeof documentoPreview === 'string' && documentoPreview === 'pdf' ? (
                                    <div className="w-full h-36 bg-red-100 rounded-sm border-2 border-[#96709d] flex flex-col items-center justify-center">
                                        <FiFile size={36} className="text-red-500" />
                                        <span className="text-xs mt-2 text-center px-2 text-gray-600">
                                            Documento PDF
                                        </span>
                                    </div>
                                ) : typeof documentoPreview === 'string' && documentoPreview === 'file' ? (
                                    <div className="w-full h-36 bg-gray-100 rounded-sm border-2 border-[#96709d] flex flex-col items-center justify-center">
                                        <FiFileText size={36} className="text-gray-500" />
                                        <span className="text-xs mt-2 text-center px-2 text-gray-600">
                                            Documento
                                        </span>
                                    </div>
                                ) : (
                                    <img
                                        src={documentoPreview}
                                        alt="Preview documento"
                                        className="w-32 h-32 object-cover rounded-sm border-2 border-[#96709d]"
                                    />
                                )}
                                <button
                                    type="button"
                                    onClick={() => {
                                        setDocumentoFile(null);
                                        setDocumentoPreview(null);
                                    }}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                                >
                                    <FiX size={16} />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Comprovante de Residência */}
                    <div className="space-y-2">
                        <label className="flex text-[#96709d] font-medium items-center gap-1 mb-2">
                            <FiFileText size={16} /> Comprovante de Residência
                        </label>
                        <div className="flex gap-3">
                            <div className="relative">
                                <input
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png,image/*"
                                    capture="environment"
                                    onChange={(e) => handleDocumentChange(e, 'comprovante')}
                                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                                />
                                <div className="flex items-center justify-center gap-2 border-2 bg-[#96709d] border-[#96709d] py-2 px-6 rounded-sm cursor-pointer hover:bg-[#a95eb8] transition-colors whitespace-nowrap shadow-md">
                                    <FiUpload size={20} className='text-white' />
                                    <span className="text-sm text-white">
                                        Upload Comprovante
                                    </span>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => handleCameraClick('comprovante')}
                                className="border-2 border-[#96709d] text-[#96709d] p-2 rounded-sm flex items-center justify-center hover:bg-purple-100 transition-colors"
                                title="Tirar foto do comprovante"
                            >
                                <FiCamera size={20} />
                            </button>
                        </div>
                        {comprovantePreview && (
                            <div className="mt-2 relative">
                                {typeof comprovantePreview === 'string' && comprovantePreview === 'pdf' ? (
                                    <div className="w-full h-36 bg-red-100 rounded-sm border-2 border-[#96709d] flex flex-col items-center justify-center">
                                        <FiFile size={36} className="text-red-500" />
                                        <span className="text-xs mt-2 text-center px-2 text-gray-600">
                                            Comprovante PDF
                                        </span>
                                    </div>
                                ) : typeof comprovantePreview === 'string' && comprovantePreview === 'file' ? (
                                    <div className="w-full h-36 bg-gray-100 rounded-sm border-2 border-[#96709d] flex flex-col items-center justify-center">
                                        <FiFileText size={36} className="text-gray-500" />
                                        <span className="text-xs mt-2 text-center px-2 text-gray-600">
                                            Comprovante
                                        </span>
                                    </div>
                                ) : (
                                    <img
                                        src={comprovantePreview}
                                        alt="Preview comprovante"
                                        className="w-32 h-32 object-cover rounded-sm border-2 border-[#96709d]"
                                    />
                                )}
                                <button
                                    type="button"
                                    onClick={() => {
                                        setComprovanteFile(null);
                                        setComprovantePreview(null);
                                    }}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                                >
                                    <FiX size={16} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {/* 6. OBSERVAÇÕES */}
            <div className="bg-white p-6 rounded-sm shadow-sm border border-gray-200 mb-6">
                <h3 className="text-lg font-semibold text-[#81059e] flex items-center gap-2 mb-4">
                    <FiFileText className="h-5 w-5" />
                    Observações
                </h3>

                <textarea
                    name="observacoes"
                    value={formData.observacoes}
                    onChange={handleChange}
                    className="border-2 border-[#96709d] p-3 rounded-sm w-full text-gray-600 resize-none"
                    rows="4"
                    placeholder="Adicione observações relevantes sobre o cliente..."
                />
            </div>

            {/* BOTÕES DE AÇÃO */}
            <div className="flex justify-center gap-4 mt-8">
                <button
                    type="button"
                    onClick={() => {
                        if (onSuccessRedirect) onSuccessRedirect();
                    }}
                    className="inline-flex justify-center py-3 px-8 border-2 border-[#81059e] shadow-sm text-sm font-semibold rounded-sm text-[#81059e] bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#81059e] transition-colors"
                >
                    CANCELAR
                </button>
                <button
                    type="submit"
                    className="inline-flex justify-center items-center py-3 px-8 border border-transparent shadow-sm text-sm font-semibold rounded-sm text-white bg-[#81059e] hover:bg-[#6f0486] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#81059e] transition-colors"
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

            {/* MODAL DE SUCESSO */}
            <SucessModal
                isOpen={showSuccessPopup}
                onClose={() => {
                    // Esta função já está sendo chamada automaticamente no hook
                    // mas você pode adicionar lógica extra se necessário
                }}
                message="Cliente cadastrado com sucesso!"
                autoClose={false}
                autoCloseTime={3000}
            />

            <ConfirmationModalClient
                isOpen={showConfirmModal}
                onClose={handleCancelSubmit}
                data={formData}
                onConfirm={handleConfirmSubmit}
                isTitular={isTitular}
                selectedTitular={selectedTitular}
            />

        </form>
    );
};

export default ClientForm;