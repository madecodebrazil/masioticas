"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { collection, getDocs, addDoc, query, where } from "firebase/firestore";
import { firestore } from "@/lib/firebaseConfig";
import Layout from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";
import Link from 'next/link';
import { FiUser, FiMapPin, FiPhone, FiMail, FiFileText } from 'react-icons/fi';

export function AddSupplierPage() {
  const router = useRouter();
  const { user, userPermissions, loading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    razaoSocial: "",
    nomeFantasia: "",
    cnpj: "",
    email: "",
    telefone: "",
    cep: "",
    numero: "",
    logradouro: "",
    cidade: "",
    estado: "",
    representante: "",
    celular: "",
  });

  // Verificar se o usuário é admin e tem permissões
  useEffect(() => {
    if (!loading && !userPermissions?.isAdmin) {
      // Redirecionar se não for admin
      alert("Acesso restrito a administradores");
      router.push("/");
    }
  }, [userPermissions, loading, router]);

  // Função para remover caracteres especiais do CNPJ
  const cleanCNPJ = (cnpj) => {
    return cnpj.replace(/[^\d]/g, ""); // Remove tudo que não for dígito
  };

  // Função para formatar o CNPJ conforme o usuário digita
  const formatCNPJ = (value) => {
    const cleanValue = cleanCNPJ(value);

    if (cleanValue.length <= 2) {
      return cleanValue;
    }
    if (cleanValue.length <= 5) {
      return `${cleanValue.slice(0, 2)}.${cleanValue.slice(2)}`;
    }
    if (cleanValue.length <= 8) {
      return `${cleanValue.slice(0, 2)}.${cleanValue.slice(2, 5)}.${cleanValue.slice(5)}`;
    }
    if (cleanValue.length <= 12) {
      return `${cleanValue.slice(0, 2)}.${cleanValue.slice(2, 5)}.${cleanValue.slice(5, 8)}/${cleanValue.slice(8)}`;
    }
    return `${cleanValue.slice(0, 2)}.${cleanValue.slice(2, 5)}.${cleanValue.slice(5, 8)}/${cleanValue.slice(8, 12)}-${cleanValue.slice(12, 14)}`;
  };

  // Função de validação de CNPJ
  const validateCNPJ = (cnpj) => {
    const stripped = cleanCNPJ(cnpj);

    if (stripped.length !== 14) return false;

    // Verifica se todos os dígitos são iguais (CNPJs como 00.000.000/0000-00 são inválidos)
    if (/^(\d)\1+$/.test(stripped)) return false;

    // Algoritmo de validação de CNPJ
    let sum = 0;
    let weight = 2;

    // Primeiro dígito verificador
    for (let i = 11; i >= 0; i--) {
      sum += parseInt(stripped.charAt(i)) * weight;
      weight = weight === 9 ? 2 : weight + 1;
    }

    let digit = 11 - (sum % 11);
    if (digit > 9) digit = 0;

    if (parseInt(stripped.charAt(12)) !== digit) return false;

    // Segundo dígito verificador
    sum = 0;
    weight = 2;

    for (let i = 12; i >= 0; i--) {
      sum += parseInt(stripped.charAt(i)) * weight;
      weight = weight === 9 ? 2 : weight + 1;
    }

    digit = 11 - (sum % 11);
    if (digit > 9) digit = 0;

    if (parseInt(stripped.charAt(13)) !== digit) return false;

    return true;
  };

  const handleNavigateToSuppliersList = () => {
    router.push('/register/suppliers');
  };

  const fetchCompanyData = async (cnpj) => {
    try {
      setIsLoading(true);
      const cleanedCNPJ = cleanCNPJ(cnpj);
      const response = await fetch(
        `https://publica.cnpj.ws/cnpj/${cleanedCNPJ}`
      );

      if (!response.ok) {
        throw new Error("Falha ao buscar dados da empresa");
      }

      const data = await response.json();

      // Verifique se a resposta contém os campos necessários e trate valores nulos
      const estabelecimento = data.estabelecimento || {};

      const razao_social = data.razao_social || "";
      const nome_fantasia = estabelecimento.nome_fantasia || "";
      const cnpjValue = data.cnpj || cleanedCNPJ;
      const email = estabelecimento.email || "";
      const telefone = estabelecimento.ddd1
        ? `${estabelecimento.ddd1} ${estabelecimento.telefone1}`
        : "";
      const cep = estabelecimento.cep || "";
      const numero = estabelecimento.numero || "";
      const logradouro = estabelecimento.logradouro || "";
      const cidade =
        estabelecimento.cidade && estabelecimento.cidade.nome
          ? estabelecimento.cidade.nome
          : "";
      const estado = estabelecimento.estado
        ? estabelecimento.estado.sigla
        : "";

      setFormData({
        ...formData,
        razaoSocial: razao_social,
        nomeFantasia: nome_fantasia,
        cnpj: cnpjValue,
        email: email,
        telefone: telefone,
        cep: cep,
        numero: numero,
        logradouro: logradouro,
        cidade: cidade,
        estado: estado,
      });
    } catch (error) {
      console.error("Erro ao buscar dados da empresa:", error);
      alert("Não foi possível buscar os dados da empresa. Verifique o CNPJ e tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Aplicar formatação para o campo CNPJ
    if (name === "cnpj") {
      const formattedCNPJ = formatCNPJ(value);
      setFormData({
        ...formData,
        [name]: formattedCNPJ,
      });

      // Se o CNPJ tiver 14 dígitos (completo), buscar dados automaticamente
      if (cleanCNPJ(value).length === 14) {
        fetchCompanyData(value);
      }
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const checkDuplicateCNPJ = async (cnpj) => {
    try {
      const cleanedCNPJ = cnpj.replace(/[^\d]/g, "");
      // Usar o caminho correto para verificar duplicação: lojas/fornecedores/users
      const q = query(
        collection(firestore, "lojas/fornecedores/users"),
        where("cnpj", "==", cleanedCNPJ)
      );
      const querySnapshot = await getDocs(q);

      return !querySnapshot.empty; // Retorna true se já existir, false caso contrário
    } catch (error) {
      console.error("Erro ao verificar duplicidade do CNPJ:", error);
      return false;
    }
  };

  const handleClear = () => {
    setFormData({
      razaoSocial: "",
      nomeFantasia: "",
      cnpj: "",
      email: "",
      telefone: "",
      cep: "",
      numero: "",
      logradouro: "",
      cidade: "",
      estado: "",
      representante: "",
      celular: "",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!userPermissions?.isAdmin) {
      alert("Apenas administradores podem registrar fornecedores");
      return;
    }

    if (!formData.cnpj || !formData.razaoSocial) {
      alert("CNPJ e Razão Social são campos obrigatórios");
      return;
    }

    const cleanedCNPJ = cleanCNPJ(formData.cnpj);

    // Verificar se o CNPJ é válido
    if (!validateCNPJ(cleanedCNPJ)) {
      alert("CNPJ inválido. Por favor, verifique o número informado.");
      return;
    }

    setIsLoading(true);

    try {
      // Verificar se o CNPJ já está cadastrado
      const isDuplicate = await checkDuplicateCNPJ(cleanedCNPJ);
      if (isDuplicate) {
        alert("Este CNPJ já está registrado para outro fornecedor.");
        setIsLoading(false);
        return;
      }

      // Preparar dados do fornecedor
      const supplierData = {
        razaoSocial: formData.razaoSocial,
        nomeFantasia: formData.nomeFantasia,
        cnpj: cleanedCNPJ,
        email: formData.email,
        telefone: formData.telefone,
        endereco: {
          cep: formData.cep,
          numero: formData.numero,
          logradouro: formData.logradouro,
          cidade: formData.cidade,
          estado: formData.estado,
        },
        representante: formData.representante,
        celular: formData.celular,
        dataCadastro: new Date(),
        cadastradoPor: user?.uid || "sistema"
      };

      // Usar o caminho correto para adicionar o documento: lojas/fornecedores/users
      await addDoc(collection(firestore, "lojas/fornecedores/users"), supplierData);

      alert("Fornecedor cadastrado com sucesso!");
      handleClear();
      router.push('/fornecedores');
    } catch (error) {
      console.error("Erro ao cadastrar fornecedor:", error);
      alert("Erro ao cadastrar fornecedor. Por favor, tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-screen">
          <p className="text-xl"> <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#81059e]"></div></p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen">
        <div className="w-full max-w-5xl mx-auto rounded-lg">
          <h2 className="text-3xl font-bold text-[#81059e] mb-8 mt-8">REGISTRAR FORNECEDOR</h2>

          <div className="space-x-2 mb-6">
            <button
              onClick={handleNavigateToSuppliersList}
              className="bg-[#81059e] p-3 rounded-sm text-white"
            >
              LISTA DE FORNECEDORES
            </button>
            <button
              onClick={handleClear}
              className="text-[#81059e] px-4 py-2 border-2 border-[#81059e] text-base rounded-sm"
            >
              Limpar
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 mb-20">
            {/* Seção de Informações Básicas */}
            <div className="p-4 bg-gray-50 rounded-lg mb-6">
              <h3 className="text-lg text-[#81059e] mb-4 flex items-center gap-2">
                <FiFileText /> Informações Básicas
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-[#81059e]">Razão Social</label>
                  <input
                    type="text"
                    name="razaoSocial"
                    value={formData.razaoSocial}
                    onChange={handleChange}
                    required
                    className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black"
                  />
                </div>

                <div>
                  <label className="text-[#81059e]">Nome Fantasia</label>
                  <input
                    type="text"
                    name="nomeFantasia"
                    value={formData.nomeFantasia}
                    onChange={handleChange}
                    required
                    className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black"
                  />
                </div>

                <div>
                  <label className="text-[#81059e]">CNPJ</label>
                  <input
                    type="text"
                    name="cnpj"
                    value={formData.cnpj}
                    onChange={handleChange}
                    required
                    placeholder="00.000.000/0000-00"
                    maxLength="18"
                    className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black"
                  />
                  {isLoading && (
                    <p className="text-sm text-gray-500 mt-1">Buscando dados do CNPJ...</p>
                  )}
                </div>
              </div>
            </div>

            {/* Seção de Contato */}
            <div className="p-4 bg-gray-50 rounded-lg mb-6">
              <h3 className="text-lg text-[#81059e] mb-4 flex items-center gap-2">
                <FiUser /> Informações de Contato
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-[#81059e]">Representante</label>
                  <input
                    type="text"
                    name="representante"
                    value={formData.representante}
                    onChange={handleChange}
                    className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black"
                  />
                </div>

                <div>
                  <label className="text-[#81059e]">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black"
                  />
                </div>

                <div>
                  <label className="text-[#81059e]">Telefone</label>
                  <input
                    type="text"
                    name="telefone"
                    value={formData.telefone}
                    onChange={handleChange}
                    className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black"
                  />
                </div>

                <div>
                  <label className="text-[#81059e]">Celular</label>
                  <input
                    type="text"
                    name="celular"
                    value={formData.celular}
                    onChange={handleChange}
                    className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black"
                  />
                </div>
              </div>
            </div>

            {/* Seção de Endereço */}
            <div className="p-4 bg-gray-50 rounded-lg mb-6">
              <h3 className="text-lg text-[#81059e] mb-4 flex items-center gap-2">
                <FiMapPin /> Endereço
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="text-[#81059e]">CEP</label>
                  <input
                    type="text"
                    name="cep"
                    value={formData.cep}
                    onChange={handleChange}
                    className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black"
                  />
                </div>

                <div>
                  <label className="text-[#81059e]">Logradouro</label>
                  <input
                    type="text"
                    name="logradouro"
                    value={formData.logradouro}
                    onChange={handleChange}
                    className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black"
                  />
                </div>

                <div>
                  <label className="text-[#81059e]">Número</label>
                  <input
                    type="text"
                    name="numero"
                    value={formData.numero}
                    onChange={handleChange}
                    className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black"
                  />
                </div>

                <div>
                  <label className="text-[#81059e]">Cidade</label>
                  <input
                    type="text"
                    name="cidade"
                    value={formData.cidade}
                    onChange={handleChange}
                    className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black"
                  />
                </div>

                <div>
                  <label className="text-[#81059e]">Estado</label>
                  <input
                    type="text"
                    name="estado"
                    value={formData.estado}
                    onChange={handleChange}
                    className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black"
                  />
                </div>
              </div>
            </div>

            {/* Botões de ação */}
            <div className="flex justify-center gap-4 mt-8">
              <button
                type="submit"
                className="bg-[#81059e] p-3 px-6 rounded-sm text-white"
                disabled={isLoading}
              >
                {isLoading ? "PROCESSANDO..." : "REGISTRAR FORNECEDOR"}
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="border-2 border-[#81059e] p-3 px-6 rounded-sm text-[#81059e]"
                disabled={isLoading}
              >
                CANCELAR
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div> <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#81059e]"></div></div>}>
      <AddSupplierPage />
    </Suspense>
  );
}