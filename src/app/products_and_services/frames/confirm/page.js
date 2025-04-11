"use client";
import React, { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Layout from "@/components/Layout";
import { doc, getDoc, deleteDoc, setDoc } from "firebase/firestore";
import { firestore } from "../../../../lib/firebaseConfig";

export function ConfirmPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [formData, setFormData] = useState({
    // Informações Gerais
    codigoBarras: "",
    unidade: "",
    codigoFabricante: "",
    data: "",
    hora: "",
    fabricante: "",
    fornecedor: "",
    marca: "",
    genero: "",
    aro: "",
    material: [],
    categoria: "armacoes",
    cor: "",
    formato: "",
    codigo: "",
    lente: "",
    ponte: "",
    haste: "",
    GTIN: "",
    sku: "", // Campo SKU

    // Dados Fiscais
    NCM: "",
    CSOSN: "",
    CEST: "",
    aliquotaICMS: "",
    baseCalculoICMS: "",
    CFOP: "",
    aliquotaIPI: "",
    cstIPI: "",
    baseCalculoIPI: "",
    cstPIS: "",
    cstCOFINS: "",
    origemProduto: "",

    // Informações de Preço
    custo: "", // Campo de custo já existente
    valor: "", // Campo de valor de venda já existente
    percentual_lucro: "", // Campo de percentual de lucro (calculado)
    custo_medio: "", // Campo de custo médio (calculado)

    // Outras Informações
    quantidade: "",
    avaria: false,
    imagem: null,
    pesoBruto: "",
    pesoLiquido: "",
  });

  const [imagePreviewUrl, setImagePreviewUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const generateProductName = () => {
    const { marca, cor, categoria, codigo, genero } = formData;

    // Verifica se todas as variáveis estão presentes para criar o nome
    const nomeCompleto = [
      marca || "Sem Marca",
      cor || "Sem Cor",
      categoria || "sem categoria",
      codigo || "Sem Codigo",
      genero || "Sem genero",

    ].join("  "); // Concatena todas as informações com ' - ' entre elas

    return nomeCompleto;
  };
  // Função para buscar os dados da coleção '/temp_image' no Firestore
  // Função para buscar os dados da coleção '/temp_image' no Firestore
  const fetchProductData = async (codigoProduto) => {
    try {
      const docRef = doc(firestore, "temp_image", codigoProduto);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        setFormData({
          ...data,
          avaria: data.avaria !== undefined ? data.avaria : false,
          categoria: data.categoria !== undefined ? data.categoria : "armação",
        });
        // Aqui definimos a URL da imagem no estado imagePreviewUrl
        setImagePreviewUrl(data.imagem || "/images/default-image.png"); // Exibe a imagem temporária
      } else {
        console.log("Nenhum documento encontrado!");
      }
    } catch (error) {
      console.error("Erro ao buscar dados do Firestore:", error);
    }
  };

  useEffect(() => {
    console.log("URL da imagem para preview:", imagePreviewUrl); // Log para verificar a URL da imagem
  }, [imagePreviewUrl]);

  useEffect(() => {
    const params = {};
    searchParams.forEach((value, key) => {
      params[key] = value;
    });

    console.log("Parâmetros recebidos:", params); // Log para depuração

    const formDataFromQuery = params.formData
      ? JSON.parse(decodeURIComponent(params.formData))
      : {};
    const codigoProduto = formDataFromQuery.codigo;

    if (codigoProduto) {
      fetchProductData(codigoProduto);
    }
  }, [searchParams]);

  const handleConfirmSubmit = async () => {
    setIsLoading(true);

    try {
      const { codigo, lojas, avaria } = formData;

      // Garantir que 'avaria' esteja sempre presente
      const dataToSend = {
        ...formData,
        avaria: avaria !== undefined ? avaria : false, // Garante que 'avaria' será false se não estiver definido
      };

      // Enviar os dados para as coleções de acordo com as lojas selecionadas
      if (lojas.includes("Loja 1")) {
        const loja1Ref = doc(firestore, "loja1_armacoes", codigo);
        await setDoc(loja1Ref, dataToSend);
        console.log("Dados enviados para Loja 1");
      }

      if (lojas.includes("Loja 2")) {
        const loja2Ref = doc(firestore, "loja2_armacoes", codigo);
        await setDoc(loja2Ref, dataToSend);
        console.log("Dados enviados para Loja 2");
      }

      // Apagar os dados da coleção 'temp_image'
      const tempDocRef = doc(firestore, "temp_image", codigo);
      await deleteDoc(tempDocRef);
      console.log("Dados apagados de temp_image");

      // Redirecionar o usuário após confirmar
      router.push("/products_and_services/frames");
    } catch (error) {
      console.error("Erro ao confirmar e enviar os dados:", error);
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    const nomeProduto = generateProductName();
    setFormData((prevData) => ({
      ...prevData,
      produto: nomeProduto,
    }));
  }, [
    formData.marca,
    formData.cor,
    formData.categoria,
    formData.codigo,
  ]); // Monitora as mudanças em cada campo relevante

  return (
    <Layout>
      <div className="container mx-auto mt-8 px-4">
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => router.back()}
            className="text-purple-600 font-bold text-lg"
          >
            <i className="fas fa-arrow-left"></i> CONFIRMAR REGISTRO
          </button>
        </div>

        <div className="bg-white p-8 rounded-lg shadow-lg">
          <div className="flex justify-between mb-8">
            <div className="flex items-start">
              <img
                src={imagePreviewUrl} // Verifique se imagePreviewUrl tem o valor correto
                alt="Pré-visualização da imagem"
                className="w-48 h-48 rounded-lg shadow-md border border-purple-300"
                style={{ objectFit: "cover" }}
              />
              <div className="ml-6">
                <h3 className="text-2xl font-bold text-purple-700">
                  {formData.produto || "Produto gerado automaticamente"}
                </h3>

                <h3 className="text-2xl font-bold text-purple-700">
                  {formData.codigoBarras || "Produto não especificado"}
                </h3>
                <h3 className="text-2xl font-bold text-purple-700">
                  {formData.codigoFabricante || "Produto não especificado"}
                </h3>
                <p className="text-lg text-gray-700 mt-2">
                  Código do Produto:{" "}
                  <span className="font-semibold">
                    {formData.codigo || "Código não disponível"}
                  </span>
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6 text-lg text-gray-800">
            <div>
              <p>
                <span className="font-semibold">Data:</span> {formData.data}
              </p>
              <p>
                <span className="font-semibold">Hora:</span> {formData.hora}
              </p>
              <p>
                <span className="font-semibold">Loja:</span>{" "}
                {Array.isArray(formData.lojas)
                  ? formData.lojas.join(", ")
                  : "Nenhuma loja selecionada"}
              </p>
            </div>
            <div>
              <p>
                <span className="font-semibold">Fabricante:</span>{" "}
                {formData.fabricante}
              </p>
              <p>
                <span className="font-semibold">Fornecedor:</span>{" "}
                {formData.fornecedor}
              </p>
              <p>
                <span className="font-semibold">Marca:</span> {formData.marca}
              </p>
            </div>
            <div>
              <p>
                <span className="font-semibold">Material:</span>{" "}
                {formData.material}
              </p>
              <p>
                <span className="font-semibold">Cor:</span> {formData.cor}
              </p>
              <p>
                <span className="font-semibold">Lente:</span> {formData.lente}
              </p>
            </div>
            <div>
              <p>
                <span className="font-semibold">Gênero:</span> {formData.genero}
              </p>
              <p>
                <span className="font-semibold">Formato:</span>{" "}
                {formData.formato}
              </p>
              <p>
                <span className="font-semibold">Aro:</span> {formData.aro}
              </p>
            </div>
            <div>
              <p>
                <span className="font-semibold">Ponte:</span> {formData.ponte}
              </p>
              <p>
                <span className="font-semibold">Haste:</span> {formData.haste}
              </p>
              <p>
                <span className="font-semibold">Custo:</span>{" "}
                <span className="text-green-700">R${formData.custo}</span>
              </p>
            </div>
            <div>
              <p>
                <span className="font-semibold">Quantidade:</span>{" "}
                {formData.quantidade}
              </p>
              <p>
                <span className="font-semibold">Unidade:</span>{" "}
                {formData.unidade || "Unidade não disponível"}
              </p>
              <p>
                <span className="font-semibold">Total:</span>{" "}
                <span className="text-red-700 font-bold">
                  R${formData.valor}
                </span>
              </p>
            </div>
          </div>

          <div className="mt-8 flex justify-center space-x-6">
            <button
              onClick={handleConfirmSubmit}
              className="bg-purple-700 text-white font-bold px-8 py-3 rounded-lg shadow hover:bg-purple-800 transition"
              disabled={isLoading}
            >
              {isLoading ? "Enviando..." : "CONFIRMAR"}
            </button>
            <button
              onClick={() => {
                const queryString = encodeURIComponent(
                  JSON.stringify(formData)
                );
                router.push(
                  `/products_and_services/frames/add-frame?formData=${queryString}`
                );
              }}
              className="bg-gray-600 text-white font-bold px-8 py-3 rounded-lg shadow hover:bg-gray-700 transition"
            >
              EDITAR
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
export default function Page() {
  return (
    <Suspense fallback={<div> <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#81059e]"></div></div>}>
      <ConfirmPage />
    </Suspense>
  );
}
