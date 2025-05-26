"use client";
import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation"; // Adicionei useRouter para redirecionamento
import Layout from "@/components/Layout"; // Certifique-se de ajustar o caminho correto
import { collection, query, where, getDocs } from "firebase/firestore";
import { firestore } from "../../../../lib/firebaseConfig"; // Certifique-se de ajustar o caminho

export function AddSupplierPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
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
  });

  // Função para remover caracteres especiais do CNPJ
  const cleanCNPJ = (cnpj) => {
    return cnpj.replace(/[^\d]/g, ""); // Remove tudo que não for dígito
  };

  const handleNavigateToAddSupplier = () => {
    router.push('/stock/suppliers');
  };
  const fetchCompanyData = async (cnpj) => {
    try {
      const cleanedCNPJ = cleanCNPJ(cnpj); // Limpa o CNPJ
      const response = await fetch(
        `https://publica.cnpj.ws/cnpj/${cleanedCNPJ}`
      );
      const data = await response.json();

      // Verifique se a resposta contém os campos necessários e trate valores nulos
      const estabelecimento = data.estabelecimento || {};

      const razao_social = data.razao_social || "N/A";
      const nome_fantasia = estabelecimento.nome_fantasia || "N/A";
      const cnpjValue = data.cnpj || cleanedCNPJ;
      const email = estabelecimento.email || "N/A";
      const telefone = estabelecimento.ddd1
        ? `${estabelecimento.ddd1} ${estabelecimento.telefone1}`
        : "N/A";
      const cep = estabelecimento.cep || "N/A";
      const numero = estabelecimento.numero || "N/A";
      const logradouro = estabelecimento.logradouro || "N/A";
      const cidade =
        estabelecimento.cidade && estabelecimento.cidade.nome
          ? estabelecimento.cidade.nome
          : "N/A";
      const estado = estabelecimento.estado
        ? estabelecimento.estado.sigla
        : "N/A";

      setFormData({
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
    }
  };

  // Preencher os campos com os dados da query string, se presentes
  useEffect(() => {
    setFormData({
      razaoSocial: searchParams.get("razaoSocial") || "",
      nomeFantasia: searchParams.get("nomeFantasia") || "",
      cnpj: searchParams.get("cnpj") || "",
      email: searchParams.get("email") || "",
      telefone: searchParams.get("telefone") || "",
      cep: searchParams.get("cep") || "",
      numero: searchParams.get("numero") || "",
      logradouro: searchParams.get("logradouro") || "",
      cidade: searchParams.get("cidade") || "",
      estado: searchParams.get("estado") || "",
    });
  }, [searchParams]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    // Se o campo CNPJ for alterado e tiver 14 dígitos (sem caracteres especiais), buscar dados automaticamente
    if (name === "cnpj" && cleanCNPJ(value).length === 14) {
      fetchCompanyData(value);
    }
  };

  const checkDuplicateCNPJ = async (cnpj) => {
    try {
      const cleanedCNPJ = cnpj.replace(/[^\d]/g, ""); // Limpa o CNPJ
      const suppliersRef = collection(firestore, "suppliers");
      const q = query(suppliersRef, where("cnpj", "==", cleanedCNPJ));
      const querySnapshot = await getDocs(q);

      return !querySnapshot.empty; // Retorna true se já existir, false caso contrário
    } catch (error) {
      console.error("Erro ao verificar duplicidade do CNPJ:", error);
      return false;
    }
  };

  // Exemplo de uso na função handleSubmit
  const handleSubmit = async (e) => {
    e.preventDefault();

    const isDuplicate = await checkDuplicateCNPJ(formData.cnpj);
    if (isDuplicate) {
      alert("Este CNPJ já está registrado para outro fornecedor.");
      return; // Impede o envio caso o CNPJ já exista
    }

    // Cria uma query string com os valores do formulário
    const queryString = new URLSearchParams(formData).toString();

    // Redireciona para a página de confirmação com os dados do formulário
    router.push(`/stock/suppliers/confirm-supplier?${queryString}`);
  };



  return (
    <Layout>
      <div className="flex flex-col items-center justify-start py-8 px-4 sm:px-6 lg:px-8">
        <div className="relative w-full bg-white rounded-lg shadow-lg p-6 max-w-4xl">
          <div className="flex flex-col items-start space-y-4">
            <h2
              className="text-2xl font-extrabold"
              style={{ color: "#81059e87" }}
            >
              REGISTRAR FORNECEDOR
            </h2>
            <button
              onClick={handleNavigateToAddSupplier}
              className="px-6 py-3 bg-[#81059e] text-white font-bold rounded hover:bg-[#820f76] transition"
            >
              Lista de Fornecedores
            </button>
            <button
              className="px-4 py-2 bg-gray-500 text-white rounded-lg self-start"
              onClick={() =>
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
                })
              }
            >
              LIMPAR
            </button>
          </div>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  className="block text-sm font-bold"
                  style={{ color: "#81059e87" }}
                >
                  Razão Social
                </label>
                <input
                  type="text"
                  name="razaoSocial"
                  value={formData.razaoSocial}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border rounded-md text-black"
                />
              </div>

              <div>
                <label
                  className="block text-sm font-bold"
                  style={{ color: "#81059e87" }}
                >
                  Representante
                </label>
                <input
                  type="text"
                  name="representante"
                  value={formData.representante}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border rounded-md text-black"
                />
              </div>

              <div>
                <label
                  className="block text-sm font-bold"
                  style={{ color: "#81059e87" }}
                >
                  Nome Fantasia
                </label>
                <input
                  type="text"
                  name="nomeFantasia"
                  value={formData.nomeFantasia}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border rounded-md text-black"
                />
              </div>

              <div>
                <label
                  className="block text-sm font-bold"
                  style={{ color: "#81059e87" }}
                >
                  CNPJ
                </label>
                <input
                  type="text"
                  name="cnpj"
                  value={formData.cnpj}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border rounded-md text-black"
                />
              </div>

              <div>
                <label
                  className="block text-sm font-bold"
                  style={{ color: "#81059e87" }}
                >
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border rounded-md text-black"
                />
              </div>

              <div>
                <label
                  className="block text-sm font-bold"
                  style={{ color: "#81059e87" }}
                >
                  Telefone
                </label>
                <input
                  type="text"
                  name="telefone"
                  value={formData.telefone}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border rounded-md text-black"
                />
              </div>

              <div>
                <label
                  className="block text-sm font-bold"
                  style={{ color: "#81059e87" }}
                >
                  Celular
                </label>
                <input
                  type="text"
                  name="celular"
                  value={formData.celular}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border rounded-md text-black"
                />
              </div>

              <div>
                <label
                  className="block text-sm font-bold"
                  style={{ color: "#81059e87" }}
                >
                  CEP
                </label>
                <input
                  type="text"
                  name="cep"
                  value={formData.cep}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border rounded-md text-black"
                />
              </div>

              <div>
                <label
                  className="block text-sm font-bold"
                  style={{ color: "#81059e87" }}
                >
                  Número
                </label>
                <input
                  type="text"
                  name="numero"
                  value={formData.numero}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border rounded-md text-black"
                />
              </div>

              <div>
                <label
                  className="block text-sm font-bold"
                  style={{ color: "#81059e87" }}
                >
                  Logradouro
                </label>
                <input
                  type="text"
                  name="logradouro"
                  value={formData.logradouro}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border rounded-md text-black"
                />
              </div>

              <div>
                <label
                  className="block text-sm font-bold"
                  style={{ color: "#81059e87" }}
                >
                  Cidade
                </label>
                <input
                  type="text"
                  name="cidade"
                  value={formData.cidade}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border rounded-md text-black"
                />
              </div>

              <div>
                <label
                  className="block text-sm font-bold"
                  style={{ color: "#81059e87" }}
                >
                  Estado
                </label>
                <input
                  type="text"
                  name="estado"
                  value={formData.estado}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border rounded-md text-black"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-center">
              <button
                type="submit"
                className="px-6 py-2 font-bold rounded-md text-white"
                style={{ backgroundColor: "#81059e" }}
              >
                REGISTRAR FORNECEDOR
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
