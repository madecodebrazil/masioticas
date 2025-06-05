"use client";

import React, { useState } from 'react';
import Layout from '@/components/Layout';
import { firestore } from "../../../lib/firebaseConfig";
import { collection, addDoc } from "firebase/firestore";
import { useRouter } from 'next/navigation';
import InputMask from 'react-input-mask';
import {
  FiUser, FiMail, FiPhone, FiMapPin, FiHash, FiHome,
  FiFileText, FiUserCheck, FiCheckCircle
} from 'react-icons/fi';
import ConfirmationModalProvider from './confirm/confirmModal';
import SuccessModalProvider from './confirm/successModal';

const RegisterProvider = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    cep: '',
    logradouro: '',
    bairro: '',
    cidade: '',
    estado: '',
    numero: '',
    complemento: '',
    cpf: '',
    name: '',
    apelido: '',
    email: '',
    telefone: '',
  });

  const [notification, setNotification] = useState({ message: "", type: "" });
  const [loading, setLoading] = useState(false);
  const [fetchingCep, setFetchingCep] = useState(false);
  
  // Estados dos modais
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const estados = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCepChange = async (e) => {
    const inputCep = e.target.value.replace(/\D/g, '');
    setFormData(prev => ({ ...prev, cep: e.target.value }));

    if (inputCep.length === 8) {
      setFetchingCep(true);
      try {
        const response = await fetch(`https://viacep.com.br/ws/${inputCep}/json/`);
        const data = await response.json();

        if (!data.erro) {
          setFormData(prev => ({
            ...prev,
            logradouro: data.logradouro,
            bairro: data.bairro,
            cidade: data.localidade,
            estado: data.uf
          }));
        } else {
          setNotification({ 
            message: 'CEP não encontrado.', 
            type: "error" 
          });
          clearAddressFields();
        }
      } catch (error) {
        console.error('Erro ao buscar o CEP:', error);
        setNotification({ 
          message: 'Erro ao buscar CEP. Tente novamente.', 
          type: "error" 
        });
      } finally {
        setFetchingCep(false);
      }
    } else {
      clearAddressFields();
    }
  };

  const clearAddressFields = () => {
    setFormData(prev => ({
      ...prev,
      logradouro: '',
      bairro: '',
      cidade: '',
      estado: ''
    }));
  };

  // Função para abrir o modal de confirmação ao invés de salvar direto
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validações básicas
    if (!formData.name.trim()) {
      setNotification({ 
        message: 'Nome é obrigatório.', 
        type: "error" 
      });
      return;
    }

    if (!formData.cpf.trim()) {
      setNotification({ 
        message: 'CPF é obrigatório.', 
        type: "error" 
      });
      return;
    }

    if (!formData.email.trim()) {
      setNotification({ 
        message: 'Email é obrigatório.', 
        type: "error" 
      });
      return;
    }

    if (!formData.telefone.trim()) {
      setNotification({ 
        message: 'Telefone é obrigatório.', 
        type: "error" 
      });
      return;
    }

    // Limpa notificações e abre modal de confirmação
    setNotification({ message: "", type: "" });
    setShowConfirmModal(true);
  };

  // Função completa para confirmar e salvar no Firebase
  const handleConfirmSubmit = async () => {
    setConfirmLoading(true);
    
    try {
      // Dados para salvar no Firebase
      const dataToSave = {
        // Informações pessoais
        name: formData.name.trim(),
        apelido: formData.apelido.trim() || '',
        cpf: formData.cpf.replace(/\D/g, ''), // Remove formatação
        
        // Contato
        email: formData.email.trim().toLowerCase(),
        telefone: formData.telefone.replace(/\D/g, ''), // Remove formatação
        
        // Endereço
        endereco: {
          cep: formData.cep.replace(/\D/g, ''), // Remove formatação
          logradouro: formData.logradouro.trim(),
          numero: formData.numero.trim(),
          complemento: formData.complemento.trim() || '',
          bairro: formData.bairro.trim(),
          cidade: formData.cidade.trim(),
          estado: formData.estado
        },
        
        // Metadados
        status: 'ativo',
        createdAt: new Date(),
        updatedAt: new Date(),
        
        // Pode adicionar campos extras como:
        // createdBy: userData?.nome || 'Sistema',
        // observacoes: formData.observacoes || ''
      };

      // Salva no Firebase
      const docRef = await addDoc(collection(firestore, "reparo_prestador"), dataToSave);
      
      console.log("Prestador salvo com ID:", docRef.id);

      // Fecha modal de confirmação
      setShowConfirmModal(false);
      
      // Limpa o formulário
      setFormData({
        cep: '',
        logradouro: '',
        bairro: '',
        cidade: '',
        estado: '',
        numero: '',
        complemento: '',
        cpf: '',
        name: '',
        apelido: '',
        email: '',
        telefone: '',
      });

      // Abre modal de sucesso
      setShowSuccessModal(true);

      // Após 3 segundos, redireciona para a lista
      setTimeout(() => {
        setShowSuccessModal(false);
        router.push("/products_and_services/service_provider/list-providers");
      }, 3000);

    } catch (error) {
      console.error("Erro ao salvar prestador:", error);
      
      // Fecha modal de confirmação em caso de erro
      setShowConfirmModal(false);
      
      // Exibe erro
      setNotification({ 
        message: `Erro ao salvar prestador: ${error.message}`, 
        type: "error" 
      });
    } finally {
      setConfirmLoading(false);
    }
  };

  // Função para cancelar confirmação
  const handleCancelSubmit = () => {
    setShowConfirmModal(false);
    setConfirmLoading(false);
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <button
            onClick={() => router.push('/products_and_services/service_provider/list-providers')}
            className="bg-[#81059e] text-white font-semibold px-6 py-3 rounded-sm hover:bg-[#6f0486] transition-colors shadow-sm"
          >
            PRESTADORES REGISTRADOS
          </button>

          <h1 className="text-3xl font-bold text-[#81059e] flex items-center gap-3">
            <FiUserCheck className="h-8 w-8" />
            REGISTRAR PRESTADOR
          </h1>
        </div>

        {/* Notificações */}
        {notification.message && (
          <div className={`p-4 mb-6 rounded-sm border-l-4 ${
            notification.type === "success" 
              ? "bg-green-50 border-green-400 text-green-700" 
              : "bg-red-50 border-red-400 text-red-700"
          }`}>
            <div className="flex items-center">
              <FiCheckCircle className="h-5 w-5 mr-2" />
              {notification.message}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 mb-32">
          {/* 1. INFORMAÇÕES PESSOAIS */}
          <div className="bg-white p-6 rounded-sm shadow-sm border border-gray-200">
            <h3 className="text-xl font-semibold text-[#81059e] flex items-center gap-2 mb-6">
              <FiUser className="h-5 w-5" />
              Informações Pessoais
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="flex text-[#96709d] font-medium items-center gap-1 mb-2">
                  <FiUser size={16} /> Nome Completo
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="border-2 border-[#96709d] p-3 rounded-sm w-full text-gray-600 focus:outline-none focus:border-[#81059e] focus:ring-1 focus:ring-[#81059e]"
                  required
                  placeholder="Digite o nome completo"
                />
              </div>

              <div>
                <label className="flex text-[#96709d] font-medium items-center gap-1 mb-2">
                  <FiUser size={16} /> Apelido
                </label>
                <input
                  type="text"
                  name="apelido"
                  value={formData.apelido}
                  onChange={handleChange}
                  className="border-2 border-[#96709d] p-3 rounded-sm w-full text-gray-600 focus:outline-none focus:border-[#81059e] focus:ring-1 focus:ring-[#81059e]"
                  placeholder="Como é conhecido"
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
                  className="border-2 border-[#96709d] p-3 rounded-sm w-full text-gray-600 focus:outline-none focus:border-[#81059e] focus:ring-1 focus:ring-[#81059e]"
                  required
                />
              </div>
            </div>
          </div>

          {/* 2. CONTATO */}
          <div className="bg-white p-6 rounded-sm shadow-sm border border-gray-200">
            <h3 className="text-xl font-semibold text-[#81059e] flex items-center gap-2 mb-6">
              <FiPhone className="h-5 w-5" />
              Informações de Contato
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="flex text-[#96709d] font-medium items-center gap-1 mb-2">
                  <FiMail size={16} /> E-mail
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="border-2 border-[#96709d] p-3 rounded-sm w-full text-gray-600 focus:outline-none focus:border-[#81059e] focus:ring-1 focus:ring-[#81059e]"
                  placeholder="prestador@exemplo.com"
                  required
                />
              </div>

              <div>
                <label className="flex text-[#96709d] font-medium items-center gap-1 mb-2">
                  <FiPhone size={16} /> Telefone
                </label>
                <InputMask
                  mask="(99) 99999-9999"
                  type="tel"
                  name="telefone"
                  value={formData.telefone}
                  onChange={handleChange}
                  placeholder="(00) 00000-0000"
                  className="border-2 border-[#96709d] p-3 rounded-sm w-full text-gray-600 focus:outline-none focus:border-[#81059e] focus:ring-1 focus:ring-[#81059e]"
                  required
                />
              </div>
            </div>
          </div>

          {/* 3. ENDEREÇO */}
          <div className="bg-white p-6 rounded-sm shadow-sm border border-gray-200">
            <h3 className="text-xl font-semibold text-[#81059e] flex items-center gap-2 mb-6">
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
                    name="cep"
                    value={formData.cep}
                    onChange={handleCepChange}
                    placeholder="00000-000"
                    className="border-2 border-[#96709d] p-3 rounded-sm w-full text-gray-600 focus:outline-none focus:border-[#81059e] focus:ring-1 focus:ring-[#81059e]"
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
                  name="logradouro"
                  value={formData.logradouro}
                  onChange={handleChange}
                  className="border-2 border-[#96709d] p-3 rounded-sm w-full text-gray-600 focus:outline-none focus:border-[#81059e] focus:ring-1 focus:ring-[#81059e]"
                  required
                  placeholder="Rua, Avenida, etc."
                />
              </div>

              <div>
                <label className="flex text-[#96709d] font-medium items-center gap-1 mb-2">
                  <FiHash size={16} /> Número
                </label>
                <input
                  type="text"
                  name="numero"
                  value={formData.numero}
                  onChange={handleChange}
                  className="border-2 border-[#96709d] p-3 rounded-sm w-full text-gray-600 focus:outline-none focus:border-[#81059e] focus:ring-1 focus:ring-[#81059e]"
                  required
                  placeholder="123"
                />
              </div>

              <div>
                <label className="flex text-[#96709d] font-medium items-center gap-1 mb-2">
                  <FiHome size={16} /> Complemento
                </label>
                <input
                  type="text"
                  name="complemento"
                  value={formData.complemento}
                  onChange={handleChange}
                  className="border-2 border-[#96709d] p-3 rounded-sm w-full text-gray-600 focus:outline-none focus:border-[#81059e] focus:ring-1 focus:ring-[#81059e]"
                  placeholder="Apto, sala, etc."
                />
              </div>

              <div>
                <label className="flex text-[#96709d] font-medium items-center gap-1 mb-2">
                  <FiMapPin size={16} /> Bairro
                </label>
                <input
                  type="text"
                  name="bairro"
                  value={formData.bairro}
                  onChange={handleChange}
                  className="border-2 border-[#96709d] p-3 rounded-sm w-full text-gray-600 focus:outline-none focus:border-[#81059e] focus:ring-1 focus:ring-[#81059e]"
                  required
                />
              </div>

              <div>
                <label className="flex text-[#96709d] font-medium items-center gap-1 mb-2">
                  <FiMapPin size={16} /> Cidade
                </label>
                <input
                  type="text"
                  name="cidade"
                  value={formData.cidade}
                  onChange={handleChange}
                  className="border-2 border-[#96709d] p-3 rounded-sm w-full text-gray-600 focus:outline-none focus:border-[#81059e] focus:ring-1 focus:ring-[#81059e]"
                  required
                />
              </div>

              <div>
                <label className="flex text-[#96709d] font-medium items-center gap-1 mb-2">
                  <FiMapPin size={16} /> Estado
                </label>
                <select
                  name="estado"
                  value={formData.estado}
                  onChange={handleChange}
                  className="border-2 border-[#96709d] p-3 rounded-sm w-full text-gray-600 focus:outline-none focus:border-[#81059e] focus:ring-1 focus:ring-[#81059e]"
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

          {/* BOTÕES DE AÇÃO */}
          <div className="flex justify-center gap-4 mt-8">
            <button
              type="button"
              onClick={() => router.push('/products_and_services')}
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
                  VALIDANDO...
                </>
              ) : (
                <>
                  <FiCheckCircle className="mr-2 h-4 w-4" />
                  CADASTRAR PRESTADOR
                </>
              )}
            </button>
          </div>
        </form>

        {/* MODAL DE CONFIRMAÇÃO */}
        <ConfirmationModalProvider
          isOpen={showConfirmModal}
          onClose={handleCancelSubmit}
          data={formData}
          onConfirm={handleConfirmSubmit}
          loading={confirmLoading}
        />

        {/* MODAL DE SUCESSO */}
        <SuccessModalProvider
          isOpen={showSuccessModal}
          onClose={() => setShowSuccessModal(false)}
          message="Prestador cadastrado com sucesso!"
          autoClose={true}
          autoCloseTime={3000}
        />
      </div>
    </Layout>
  );
};

export default RegisterProvider;