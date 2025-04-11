"use client";
import React, { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Layout from "@/components/Layout";
import { doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";
import { firestore } from "../../../../lib/firebaseConfig";

export function ConfirmLensesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [formData, setFormData] = useState({
    codigo: "",
    unidade: "",
    data: "",
    hora: "",
    fornecedor: "",
    categoria: "lentes",
    fabricante: "",
    marca: "",
    tipo: [],
    design: "",
    indice: "",
    material: "",
    tecnologia: [],
    tipoTratamento: "",
    tratamento: "",
    familia: "",
    diametroDe: "",
    diametroPara: "",
    esfericoDe: "",
    esfericoPara: "",
    cilindroDe: "",
    cilindroPara: "",
    adicaoDe: "",
    adicaoPara: "",
    montagemDe: "",
    montagemPara: "",
    NCM: "",
    CSOSN: "",
    CEST: "",
    aliquotaICMS: "",
    baseCalculoICMS: "",
    CFOP: "",
    custo: "",
    quantidade: "",
    valor: "",
    imagem: null,
    produto: "",
    lojas: [],

    aliquotaIPI: "",
    cstIPI: "",
    baseCalculoIPI: "",
    cstPIS: "",
    cstCOFINS: "",
    origemProduto: "",
    pesoBruto: "",
    pesoLiquido: "",
  });

  const [imagePreviewUrl, setImagePreviewUrl] = useState("");

  const fetchProductImage = async (codigo) => {
    try {
      const docRef = doc(firestore, "temp_image", codigo);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        setFormData((prevData) => ({
          ...prevData,
          imagem: data.imagem || "/images/default-image.png",
        }));
      } else {
        console.log(
          `Nenhuma imagem encontrada para o produto com código: ${codigo}`
        );
      }
    } catch (error) {
      console.error("Erro ao buscar imagem no Firestore:", error);
    }
  };

  const generateProductName = () => {
    const { familia, tipoTratamento } = formData;

    const productNameParts = [
      familia || "FML", // Família (ou "FML" caso esteja vazio)
      tipoTratamento || "TRT", // Tratamento (ou "TRT" caso esteja vazio)
    ];

    // Junta as partes com " - " e retorna o nome
    return productNameParts.filter(Boolean).join("  ");
  };

  useEffect(() => {
    const params = {};
    searchParams.forEach((value, key) => {
      params[key] = value;
    });

    const formDataFromQuery = params.formData
      ? JSON.parse(decodeURIComponent(params.formData))
      : {};

    // Define o nome do produto gerado com base nos dados recebidos
    setFormData({
      ...formDataFromQuery,
      produto: generateProductName(formDataFromQuery),
    });

    const lojasSelecionadas = formDataFromQuery.lojas || [];
    console.log("Lojas selecionadas:", lojasSelecionadas);

    if (formDataFromQuery.codigo) {
      fetchProductImage(formDataFromQuery.codigo);
    }
  }, [searchParams]);

  // Atualiza o nome do produto sempre que as partes relevantes de `formData` mudarem
  useEffect(() => {
    setFormData((prevData) => ({
      ...prevData,
      produto: generateProductName(),
    }));
  }, [
    formData.marca,
    formData.tipo,
    formData.design,
    formData.indice,
    formData.material,
    formData.tecnologia,
    formData.tipoTratamento,
  ]);

  const checkProductExists = async (loja) => {
    const docRef = doc(firestore, loja, formData.codigo);
    const docSnap = await getDoc(docRef);
    return docSnap.exists();
  };

  useEffect(() => {
    const params = {};
    searchParams.forEach((value, key) => {
      params[key] = value;
    });

    const formDataFromQuery = params.formData
      ? JSON.parse(decodeURIComponent(params.formData))
      : {};
    setFormData(formDataFromQuery);

    const lojasSelecionadas = formDataFromQuery.lojas || [];
    console.log("Lojas selecionadas:", lojasSelecionadas);

    if (formDataFromQuery.codigo) {
      fetchProductImage(formDataFromQuery.codigo);
    }
  }, [searchParams]);

  const handleConfirmSubmit = async () => {
    try {
      // Log das lojas selecionadas antes de verificar a existência do produto
      console.log("Lojas selecionadas:", formData.lojas);

      // Verifica se o produto já existe nas lojas selecionadas
      const checkPromises = formData.lojas.map((loja) => {
        const collectionName =
          loja === "Loja 1" ? "loja1_lentes" : "loja2_lentes";
        console.log(`Verificando existência em ${collectionName}`);
        return checkProductExists(collectionName);
      });

      const existsInSelectedLojas = await Promise.all(checkPromises);

      if (existsInSelectedLojas.some(Boolean)) {
        alert("Este produto já existe em uma das lojas selecionadas.");
        return;
      }

      const productName = generateProductName();
      const imageUrl = imagePreviewUrl;

      const queryData = {
        ...formData,
        produto: productName,
        imagem: imageUrl,
        diametroDe: Number(formData.diametroDe),
        diametroPara: Number(formData.diametroPara),
        esfericoDe: Number(formData.esfericoDe),
        esfericoPara: Number(formData.esfericoPara),
        cilindroDe: Number(formData.cilindroDe),
        cilindroPara: Number(formData.cilindroPara),
        adicaoDe: Number(formData.adicaoDe),
        adicaoPara: Number(formData.adicaoPara),
        montagemDe: Number(formData.montagemDe),
        montagemPara: Number(formData.montagemPara),
      };

      // Log dos dados que serão enviados
      console.log("Dados a serem enviados:", queryData);

      // Adiciona as promessas para atualizar os documentos nas lojas selecionadas
      const promises = formData.lojas.map((loja) => {
        const collectionName =
          loja === "Loja 1" ? "loja1_lentes" : "loja2_lentes";
        console.log(`Enviando dados para ${collectionName}`);
        const lojaRef = doc(firestore, collectionName, formData.codigo);
        return setDoc(lojaRef, queryData);
      });

      await Promise.all(promises);
      console.log("Dados enviados com sucesso para as lojas selecionadas");

      // Salva a imagem em uma coleção separada
      const imagemRef = doc(firestore, "lentes_imagens", formData.codigo);
      await setDoc(imagemRef, { imagem: imageUrl });
      console.log("Imagem salva em lentes_imagens");

      // Remove a imagem temporária
      const tempDocRef = doc(firestore, "temp_image", formData.codigo);
      await deleteDoc(tempDocRef);
      console.log("Imagem temporária removida");

      router.push("/products_and_services/lenses");
    } catch (error) {
      console.error("Erro ao confirmar e enviar os dados:", error);
    }
  };

  const handleEdit = () => {
    const queryString = encodeURIComponent(JSON.stringify(formData));
    router.push(
      `/products_and_services/lenses/add-lense?formData=${queryString}`
    );
  };

  return (
    <Layout>
      <div className="container mx-auto mt-8 px-4">
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => router.back()}
            className="text-purple-600 font-bold text-lg"
          >
            <i className="fas fa-arrow-left"></i> VOLTAR
          </button>
        </div>

        <div className="bg-white p-4 md:p-8 rounded-lg shadow-lg">
          <div className="flex flex-col md:flex-row justify-between items-start mb-8">
            <img
              src={imagePreviewUrl || "/images/default-image.png"}
              alt="Pré-visualização da imagem"
              className="w-32 h-32 md:w-48 md:h-48 rounded-lg shadow-md border border-purple-300 object-cover"
            />
            <div className="mt-4 md:mt-0 md:ml-6 text-center md:text-left">
              <h3 className="text-xl md:text-2xl font-bold text-purple-700">
                {formData.produto || "Produto não especificado"}
              </h3>
              <p className="text-base md:text-lg text-gray-700 mt-2">
                Código do Produto:{" "}
                <span className="font-semibold">
                  {formData.codigo || "Código não disponível"}
                </span>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 text-gray-800">
            <div>
              <p>
                <span className="font-semibold">Data:</span>{" "}
                {formData.data || "Data não disponível"}
              </p>
              <p>
                <span className="font-semibold">Hora:</span>{" "}
                {formData.hora || "Hora não disponível"}
              </p>
              <p>
                <span className="font-semibold">Fornecedor:</span>{" "}
                {formData.fornecedor || "Fornecedor não disponível"}
              </p>
              <p>
                <span className="font-semibold">Fabricante:</span>{" "}
                {formData.fabricante || "Fabricante não disponível"}
              </p>
            </div>
            <div>
              <p>
                <span className="font-semibold">Marca:</span>{" "}
                {formData.marca || "Marca não disponível"}
              </p>
              <p>
                <span className="font-semibold">Tipo:</span>{" "}
                {Array.isArray(formData.tipo) && formData.tipo.length > 0
                  ? formData.tipo.join(", ") // Junta os tipos com vírgula e espaço
                  : "Tipo não disponível"}
              </p>
              <p>
                <span className="font-semibold">Design:</span>{" "}
                {formData.design || "Design não disponível"}
              </p>
            </div>
            <div>
              <p>
                <span className="font-semibold">Índice:</span>{" "}
                {formData.indice || "Índice não disponível"}
              </p>
              <p>
                <span className="font-semibold">Material:</span>{" "}
                {formData.material || "Material não disponível"}
              </p>
              <p>
                <span className="font-semibold">NCM:</span>{" "}
                {formData.NCM || "NCM não disponível"}
              </p>
            </div>
            <div>
              <p>
                <span className="font-semibold">Custo:</span> R$
                {formData.custo || "Custo não disponível"}
              </p>
              <p>
                <span className="font-semibold">Valor:</span> R$
                {formData.valor || "Valor não disponível"}
              </p>
              <p>
                <span className="font-semibold">Quantidade:</span>{" "}
                {formData.quantidade || "Quantidade não disponível"}
              </p>
              <p>
                <span className="font-semibold">Unidade:</span>{" "}
                {formData.unidade || "Unidade não disponível"}
              </p>
            </div>
            <div>
              <p>
                <span className="font-semibold">Diâmetro de:</span>{" "}
                {formData.diametroDe || "N/A"} até{" "}
                {formData.diametroPara || "N/A"}
              </p>
              <p>
                <span className="font-semibold">Esférico de:</span>{" "}
                {formData.esfericoDe || "N/A"} até{" "}
                {formData.esfericoPara || "N/A"}
              </p>
              <p>
                <span className="font-semibold">Cilindro de:</span>{" "}
                {formData.cilindroDe || "N/A"} até{" "}
                {formData.cilindroPara || "N/A"}
              </p>
              <p>
                <span className="font-semibold">Adição de:</span>{" "}
                {formData.adicaoDe || "N/A"} até {formData.adicaoPara || "N/A"}
              </p>
              <p>
                <span className="font-semibold">Montagem de:</span>{" "}
                {formData.montagemDe || "N/A"} até{" "}
                {formData.montagemPara || "N/A"}
              </p>
            </div>
            <div>
              <p>
                <span className="font-semibold">Tecnologia:</span>
                {Array.isArray(formData.tecnologia) &&
                  formData.tecnologia.length > 0
                  ? formData.tecnologia.join(", ")
                  : "Nenhuma tecnologia"}
              </p>
            </div>
            <div>
              <p>
                <span className="font-semibold">Tratamento:</span>{" "}
                {formData.tratamento || "Nenhum tratamento"}
              </p>
              <p>
                <span className="font-semibold">Tipo de Tratamento:</span>{" "}
                {formData.tipoTratamento || "Nenhum tratamento"}
              </p>
              <p>
                <span className="font-semibold">Família:</span>{" "}
                {formData.familia || "Nenhuma família"}
              </p>
            </div>
          </div>

          <div className="mt-8 p-4 border border-gray-300 bg-white rounded-lg shadow-sm">
            <h4 className="text-lg font-semibold text-black mb-2">
              Lojas Selecionadas:
            </h4>
            <p className="text-gray-800 font-medium">
              {Array.isArray(formData.lojas) && formData.lojas.length > 0
                ? formData.lojas.join(", ")
                : "Nenhuma loja selecionada."}
            </p>
          </div>

          <div className="mt-8 flex flex-col md:flex-row justify-center md:justify-between items-center space-y-4 md:space-y-0 md:space-x-6">
            <button
              onClick={handleConfirmSubmit}
              className="bg-purple-700 text-white font-bold px-8 py-3 rounded-lg shadow hover:bg-purple-800 transition w-full md:w-auto"
            >
              CONFIRMAR
            </button>
            <button
              onClick={handleEdit}
              className="bg-gray-600 text-white font-bold px-8 py-3 rounded-lg shadow hover:bg-gray-700 transition w-full md:w-auto"
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
      <ConfirmLensesPage />
    </Suspense>
  );
}
