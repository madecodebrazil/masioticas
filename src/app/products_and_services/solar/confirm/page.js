"use client";
import React, { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Layout from "@/components/Layout";
import { doc, getDoc, deleteDoc, setDoc } from "firebase/firestore";
import { firestore } from "../../../../lib/firebaseConfig";

export function ConfirmSolar() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [formData, setFormData] = useState({
    unidade: "",
    fabricante: "",
    fornecedor: "",
    marca: "",
    produto: "",
    lojas: [],
    codigo: "",
    data: "",
    hora: "",
    material: "",
    categoria: "solares",
    cor: "",
    lente: "",
    haste: "",
    custo: "",
    valor: "",
    quantidade: "",
    genero: "",
    formato: "",
    aro: "",
    ponte: "",
    avaria: false,
    imagem: null,
    csosn: "",
    cest: "",
    aliquotaICMS: "",
    baseCalculoICMS: "",
    aliquotaIPI: "",
    cstIPI: "",
    baseCalculoIPI: "",
    cstPIS: "",
    cstCOFINS: "",
    CFOP: "",
    origemProduto: "",
    pesoBruto: "",
    pesoLiquido: "",
  });

  const [imagePreviewUrl, setImagePreviewUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const generateProductName = () => {
    const { marca, produto, categoria, codigo, genero, formato, aro, material, cor } = formData;
    const nomeCompleto = [
      marca || "Sem Marca",
      cor || "Sem Cor",
      categoria || "Sem Categoria",
      codigo || "Sem Código",
      genero || "Sem Gênero",

    ].join("  ");
    return nomeCompleto;
  };

  const fetchProductData = async (codigoProduto) => {
    try {
      const docRef = doc(firestore, "temp_image", codigoProduto);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        setFormData({
          ...data,
          avaria: data.avaria !== undefined ? data.avaria : false,
          categoria: data.categoria !== undefined ? data.categoria : "solar",
        });
        setImagePreviewUrl(data.imagem || "/images/default-image.png");
      }
    } catch (error) {
      console.error("Erro ao buscar dados do Firestore:", error);
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
    formData.genero,
    formData.formato,
    formData.aro,
    formData.material,
    formData.cor,
  ]);

  useEffect(() => {
    const params = {};
    searchParams.forEach((value, key) => {
      params[key] = value;
    });

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

      if (!codigo || lojas.length === 0) {
        alert(
          "Por favor, preencha o código do produto e selecione pelo menos uma loja."
        );
        return;
      }

      const lojasMapped = lojas.map((loja) =>
        loja === "Loja 1" ? "loja1" : loja === "Loja 2" ? "loja2" : loja
      );

      const dataToSend = {
        ...formData,
        avaria: avaria !== undefined ? avaria : false,
      };

      for (const loja of lojasMapped) {
        const lojaRef = doc(firestore, `${loja}_solares`, codigo);
        await setDoc(lojaRef, dataToSend);
      }

      const tempDocRef = doc(firestore, "temp_image", codigo);
      await deleteDoc(tempDocRef);

      router.push("/products_and_services/solar/list-solares");
    } catch (error) {
      console.error("Erro ao confirmar e enviar os dados:", error);
      alert(
        "Ocorreu um erro ao tentar salvar os dados. Por favor, tente novamente."
      );
    } finally {
      setIsLoading(false);
    }
  };

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

        <div className="bg-white p-4 md:p-8 rounded-lg shadow-lg">
          <div className="flex flex-col md:flex-row justify-between mb-8">
            <div className="flex items-start">
              <img
                src={imagePreviewUrl}
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
                <p className="text-base md:text-lg text-gray-700 mt-2">
                  Lojas Selecionadas:{" "}
                  <span className="font-semibold">
                    {formData.lojas.join(", ") || "Nenhuma loja selecionada"}
                  </span>
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 text-gray-800">
            <div>
              <p>
                <span className="font-semibold">Data:</span> {formData.data}
              </p>
              <p>
                <span className="font-semibold">Hora:</span> {formData.hora}
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

          <div className="mt-8 flex flex-col md:flex-row justify-center md:justify-between items-center space-y-4 md:space-y-0 md:space-x-6">
            <button
              onClick={handleConfirmSubmit}
              className="bg-purple-700 text-white font-bold px-8 py-3 rounded-lg shadow hover:bg-purple-800 transition w-full md:w-auto"
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
                  `/products_and_services/solar?formData=${queryString}`
                );
              }}
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
      <ConfirmSolar />
    </Suspense>
  );
}
