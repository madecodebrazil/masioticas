"use client";
import React, { Suspense, useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { doc, setDoc, getDoc, getDocs, collection } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { firestore } from "../../../lib/firebaseConfig";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";

export function FormularioLoja() {
  const [ncm, setNcm] = useState([]);
  const searchParams = useSearchParams();
  const router = useRouter();
  const [selectedLojas, setSelectedLojas] = useState([]);
  const [formData, setFormData] = useState({
    codigoBarras: "",
    unidade: "",
    data: "",
    hora: "",
    fabricante: "",
    fornecedor: "",
    marca: "",
    genero: "",
    aro: "",
    material: "",
    categoria: "solares", // Definindo como "solar" por padrão
    cor: "",
    formato: "",
    codigo: "",
    lente: "",
    cor: "",
    ponte: "",
    haste: "",
    NCM: "",
    custo: "",
    valor: "",
    percentualLucro: "",
    custoMedio: "",
    sku: "",
    produto: "",
    quantidade: "",
    avaria: false,
    imagem: null,

    // Novos campos de dados fiscais e peso
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
  useEffect(() => {
    const cloneId = searchParams.get("cloneId");
    const loja = searchParams.get("loja");

    if (cloneId && loja) {
      fetchCloneData(cloneId, loja);
    }
  }, [searchParams]);
  const fetchCloneData = async (cloneId, loja) => {
    try {
      const collectionName =
        loja === "Loja 1" ? "loja1_solares" : "loja2_solares";
      const docRef = doc(firestore, collectionName, cloneId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        // Extrair o campo 'lojas' dos dados
        const { id, lojas, data: dataDoc, hora, ...clonedData } = data;

        // Atualizar data e hora para os valores atuais
        const now = new Date();
        const formattedDate = now.toISOString().split("T")[0]; // Formato YYYY-MM-DD
        const formattedTime = now
          .toTimeString()
          .split(":")
          .slice(0, 2)
          .join(":"); // Formato HH:MM

        setFormData((prevData) => ({
          ...prevData,
          ...clonedData,
          data: formattedDate,
          hora: formattedTime,
        }));

        // Atualizar o estado 'selectedLojas' com base em 'lojas'
        if (lojas && Array.isArray(lojas)) {
          setSelectedLojas(lojas);
        } else if (loja) {
          setSelectedLojas([loja]);
        }
      } else {
        console.error("Documento não encontrado");
      }
    } catch (error) {
      console.error("Erro ao buscar dados para clonar:", error);
    }
  };

  const fetchUnidades = async () => {
    try {
      const unidadesSnapshot = await getDocs(
        collection(firestore, "armacoes_unidades")
      );
      const unidadesList = unidadesSnapshot.docs.map((doc) => doc.data().name); // Supondo que o campo seja "name"
      setUnidades(unidadesList); // Salva as unidades no estado
    } catch (error) {
      console.error("Erro ao buscar unidades:", error);
    }
  };

  const [unidades, setUnidades] = useState([]);

  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [fabricantes, setFabricantes] = useState([]);
  const [fornecedores, setFornecedores] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [formatos, setFormatos] = useState([]);
  const [aros, setAros] = useState([]);
  const [materiais, setMateriais] = useState([]);
  const [cores, setCores] = useState([]);
  const [lentes, setLentes] = useState([]);
  const [pontes, setPontes] = useState([]);
  const [hastes, setHastes] = useState([]);

  useEffect(() => {
    if (router.state?.formData) {
      setFormData(router.state.formData); // Preenche o formulário com os dados existentes
    }
  }, [router.state]);
  // Função para pegar a data e hora atuais
  useEffect(() => {
    const now = new Date();

    // Definindo as opções de formatação para o fuso horário do Brasil
    const options = {
      timeZone: "America/Sao_Paulo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    };

    // Formatando a data e hora com o fuso de Brasília (BR)
    const formattedDate = now.toLocaleDateString("pt-BR", options); // Formato DD/MM/YYYY
    const formattedTime = now.toTimeString().split(":").slice(0, 2).join(":"); // Formato HH:MM

    // Transformando a data no formato compatível com o input date (YYYY-MM-DD)
    const [day, month, year] = formattedDate.split("/");
    const date = `${year}-${month}-${day}`; // Formato compatível com o campo input "date"

    setFormData((prevData) => ({
      ...prevData,
      data: date, // Formato YYYY-MM-DD
      hora: formattedTime, // Formato HH:MM
    }));
  }, []);
  const generateRandomCode = (length = 3) => {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let result = "";
    for (let i = 0; i < length; i++) {
      result += characters.charAt(
        Math.floor(Math.random() * characters.length)
      );
    }
    return result;
  };
  const fetchNcm = async () => {
    try {
      const ncmSnapshot = await getDocs(collection(firestore, "ncm"));
      const ncmList = ncmSnapshot.docs.map((doc) => doc.data().name); // Supondo que o campo seja "name"
      setNcm(ncmList);
    } catch (error) {
      console.error("Erro ao buscar NCMs: ", error);
    }
  };

  const generateSKU = () => {
    const randomPart = Math.floor(Math.random() * 10000); // Número aleatório
    const productCode = formData.codigo || generateRandomCode(); // Gera letras aleatórias se não houver código
    const productName = formData.produto
      ? formData.produto.substring(0, 3).toUpperCase()
      : "AMC"; // Pega os primeiros 3 caracteres do nome do produto

    return `${productName}-${productCode}-${randomPart}`; // Exemplo: PRD-ABC-4567
  };
  useEffect(() => {
    const sku = generateSKU();
    setFormData((prevData) => ({
      ...prevData,
      sku: sku,
    }));
  }, [formData.codigo, formData.produto]);
  const fetchAros = async () => {
    try {
      const arosSnapshot = await getDocs(
        collection(firestore, "armacoes_aros")
      );
      const arosList = arosSnapshot.docs.map((doc) => doc.data().name);
      setAros(arosList);
    } catch (error) {
      console.error("Erro ao buscar aros:", error);
    }
  };

  const fetchCores = async () => {
    try {
      const corSnapshot = await getDocs(
        collection(firestore, "armacoes_cores")
      );
      const corList = corSnapshot.docs.map((doc) => doc.data().name);
      setCores(corList);
    } catch (error) {
      console.error("Erro ao buscar cores:", error);
    }
  };

  const fetchFabricantes = async () => {
    try {
      const fabricantesSnapshot = await getDocs(
        collection(firestore, "armacoes_fabricantes")
      );
      const fabricantesList = fabricantesSnapshot.docs.map(
        (doc) => doc.data().name
      );
      setFabricantes(fabricantesList);
    } catch (error) {
      console.error("Erro ao buscar fabricantes:", error);
    }
  };

  const fetchFornecedores = async () => {
    try {
      const fornecedoresSnapshot = await getDocs(
        collection(firestore, "fornecedores")
      );
      const fornecedoresList = fornecedoresSnapshot.docs.map(
        (doc) => doc.data().name
      );
      setFornecedores(fornecedoresList);
    } catch (error) {
      console.error("Erro ao buscar fornecedores:", error);
    }
  };

  const fetchMarcas = async () => {
    try {
      const marcasSnapshot = await getDocs(
        collection(firestore, "armacoes_marcas")
      );
      const marcasList = marcasSnapshot.docs.map((doc) => doc.data().name);
      setMarcas(marcasList);
    } catch (error) {
      console.error("Erro ao buscar marcas:", error);
    }
  };
  const fetchMateriais = async () => {
    try {
      const materiaisSnapshot = await getDocs(
        collection(firestore, "armacoes_materiais")
      );
      const materiaisList = materiaisSnapshot.docs.map(
        (doc) => doc.data().name
      );
      setMateriais(materiaisList);
    } catch (error) {
      console.error("Erro ao buscar materiais:", error);
    }
  };

  const fetchFormatos = async () => {
    try {
      const formatosSnapshot = await getDocs(
        collection(firestore, "armacoes_formatos")
      );
      const formatosList = formatosSnapshot.docs.map((doc) => doc.data().name);
      setFormatos(formatosList);
    } catch (error) {
      console.error("Erro ao buscar formatos:", error);
    }
  };

  const fetchLentes = async () => {
    try {
      const lenteSnapshot = await getDocs(
        collection(firestore, "armacoes_largura_lentes")
      );
      const lentesList = lenteSnapshot.docs.map((doc) => doc.data().value);
      setLentes(lentesList);
    } catch (error) {
      console.error("Erro ao buscar lentes:", error);
    }
  };

  const fetchHastes = async () => {
    try {
      const hasteSnapshot = await getDocs(
        collection(firestore, "armacoes_hastes")
      );
      const hasteList = hasteSnapshot.docs.map((doc) => doc.data().value);
      setHastes(hasteList);
    } catch (error) {
      console.error("Erro ao buscar hastes:", error);
    }
  };

  const fetchPontes = async () => {
    try {
      const pontesSnapshot = await getDocs(
        collection(firestore, "armacoes_pontes")
      );
      const ponteList = pontesSnapshot.docs.map((doc) => doc.data().value);
      setPontes(ponteList);
    } catch (error) {
      console.error("Erro ao buscar pontes:", error);
    }
  };

  // Outras funções para buscar fornecedores, hastes, lentes, etc.

  useEffect(() => {
    fetchAros();
    fetchCores();
    fetchFabricantes();
    fetchFornecedores();
    fetchLentes();
    fetchMarcas();
    fetchMateriais();
    fetchPontes();
    fetchFormatos();
    fetchHastes();
    fetchNcm();
    fetchUnidades();
  }, []);

  // Função para alternar a seleção das lojas
  const handleLojaClick = (loja) => {
    setSelectedLojas((prevSelectedLojas) => {
      if (prevSelectedLojas.includes(loja)) {
        return prevSelectedLojas.filter(
          (selectedLoja) => selectedLoja !== loja
        );
      } else {
        return [...prevSelectedLojas, loja];
      }
    });
  };

  // Função para tratar mudanças nos inputs do formulário
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => {
      const updatedData = {
        ...prevData,
        [name]: value,
      };

      // Calcular o Percentual de Lucro e Custo Médio automaticamente
      if (updatedData.custo && updatedData.valor) {
        const valorCusto = parseFloat(updatedData.custo);
        const valorVenda = parseFloat(updatedData.valor);

        if (valorCusto > 0) {
          // Calcula o percentual de lucro
          const percentualLucro =
            ((valorVenda - valorCusto) / valorCusto) * 100;
          updatedData.percentual_lucro = percentualLucro.toFixed(2);

          // Calcula o custo médio (média simples)
          const custoMedio = (valorCusto + valorVenda) / 2;
          updatedData.custo_medio = custoMedio.toFixed(2);
        }
      }

      return updatedData;
    });
  };

  // Função para limpar o formulário
  const handleClearSelection = () => {
    const now = new Date();
    const date = now.toISOString().split("T")[0];
    const time = now.toTimeString().split(":").slice(0, 2).join(":");

    setFormData({
      data: date,
      hora: time,
      fabricante: "",
      fornecedor: "",
      marca: "",
      genero: "",
      aro: "",
      material: "",
      cor: "",
      formato: "",
      codigo: "",
      lente: "",
      ponte: "",
      haste: "",
      NCM: "",
      custo: "",
      valor: "",
      produto: "",
      quantidade: "",
      imagem: null,
    });
    setSelectedLojas([]);
  };

  useEffect(() => {
    const params = {};
    searchParams.forEach((value, key) => {
      params[key] = value;
    });

    // Parse the `formData` from query parameters and set to state
    const formDataFromQuery = params.formData
      ? JSON.parse(decodeURIComponent(params.formData))
      : {};

    if (formDataFromQuery) {
      setFormData(formDataFromQuery); // Preenche o formulário com os dados recebidos
    }
  }, [searchParams]);

  // Função para subir a imagem no Firebase Storage
  const handleImageUpload = async (imageFile) => {
    const storage = getStorage();
    const storageRef = ref(storage, `temp_images/${imageFile.name}`);
    await uploadBytes(storageRef, imageFile);
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  };

  useEffect(() => {
    // Definindo a data e hora atuais
    const currentDate = new Date();
    const formattedDate = currentDate.toISOString().split("T")[0]; // Formato YYYY-MM-DD
    const formattedTime = currentDate.toTimeString().slice(0, 5); // Formato HH:MM

    setFormData({
      data: formattedDate,
      hora: formattedTime,
    });
  }, []);
  // Função para enviar os dados para o Firestore

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Form data:", formData);

    if (selectedLojas.length === 0) {
      alert("Selecione ao menos uma loja antes de enviar o formulário");
      setIsLoading(false);
      return;
    }

    try {
      let imageUrl = "";
      if (formData.imagem) {
        imageUrl = await handleImageUpload(formData.imagem);
      }

      const queryData = {
        ...formData,
        lojas: selectedLojas,
        imagem: imageUrl,
        categoria: formData.categoria || "solar",
        avaria: formData.avaria || false,
      };

      const docRef = doc(firestore, "temp_image", formData.codigo);
      await setDoc(docRef, queryData);

      console.log("Dados enviados:", queryData);

      router.push(
        `/products_and_services/solar/confirm?formData=${encodeURIComponent(
          JSON.stringify(queryData)
        )}`
      );
    } catch (error) {
      console.error("Erro ao enviar os dados:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <Layout>
        <div className="relative flex items-center mt-4">
          {/* Ícone na extrema esquerda */}

          {/* Ícone de Configurações acima dos botões */}
          {/* Ícone de Configurações acima dos botões */}
          <img
            src="/images/Settings.png" // Caminho para o ícone de configurações
            alt="Ícone de Configurações"
            className="cursor-pointer hover:opacity-80 transition mb-4" // Adiciona margem inferior e hover
            style={{ width: "40px", height: "40px" }} // Define o tamanho do ícone
            onClick={() => router.push("/products_and_services/solar/solar-ab")} // Redireciona para a rota desejada ao clicar
          />

          {/* Container para centralizar os botões e ajustar a responsividade */}
          <div className="flex flex-col items-center justify-center space-y-2 mx-auto w-full md:w-auto">
            {/* Botão "ÓCULOS SOLARES REGISTRADOS" */}
            <button
              className="bg-[#800080] text-white font-bold px-4 py-2 rounded-lg shadow hover:bg-[#660066] transition w-full max-w-xs md:max-w-sm lg:max-w-md"
              onClick={() =>
                router.push("/products_and_services/solar/list-solares")
              } // Lógica para exibir SOLARES registradas
            >
              SOLARES REGISTRADAS
            </button>

            {/* Botão "LIMPAR SELEÇÃO" */}
            <button
              type="button"
              className="bg-[#800080] text-white font-bold px-4 py-2 rounded-lg shadow hover:bg-[#660066] transition w-full max-w-xs md:max-w-sm lg:max-w-md"
              onClick={handleClearSelection} // Chama a função para limpar a seleção
            >
              LIMPAR SELEÇÃO
            </button>
          </div>
        </div>
        <h2 className="text-3xl text-center font-semibold text-[#800080]">
          ADICIONAR SOLAR
        </h2>

        {/* Campo para SKU */}
        <div className="w-full">
          <label
            htmlFor="sku"
            className="text-lg font-semibold text-[#800080] text-start"
          >
            SKU
          </label>
          <div className="flex items-center border border-[#800080] rounded-lg">
            <input
              type="text"
              id="sku"
              name="sku"
              value={formData.sku}
              onChange={handleChange}
              placeholder="Insira o SKU do produto"
              className="w-full px-2 py-2 text-black focus:outline-none focus:border-[#800080] focus:ring-1 focus:ring-[#800080] rounded-lg"
            />
          </div>
        </div>

        {/* Campo de Loja */}
        <div className="flex-1 w-full sm:w-auto mt-4 sm:mt-0 sm:ml-0">
          <label className="block text-md font-bold text-[#800080] mb-2 text-left">
            Loja
          </label>
          <select
            value={selectedLojas.length === 2 ? "Ambas" : selectedLojas}
            onChange={(e) => {
              const selectedValue = e.target.value;
              if (selectedValue === "Ambas") {
                setSelectedLojas(["Loja 1", "Loja 2"]);
              } else {
                setSelectedLojas([selectedValue]);
              }
            }}
            className="bg-gray-100 w-full px-4 py-2 border rounded-lg text-black focus:outline-none focus:border-[#800080] focus:ring-1 focus:ring-[#800080]"
          >
            <option value="">Selecione uma loja</option>
            <option value="Loja 1">LOJA 1</option>
            <option value="Loja 2">LOJA 2</option>
            <option value="Ambas">AMBAS AS LOJAS</option>
          </select>

          {/* Indica que ambas as lojas foram selecionadas */}
          {selectedLojas.length === 2 && (
            <p className="text-sm text-green-600 mt-2">
              Ambas as lojas selecionadas
            </p>
          )}
        </div>
        {/* Data e Hora */}
        <div className="flex space-x-4">
          <div className="flex-1">
            <label className="block text-md font-bold text-[#800080]">
              Data:
            </label>
            <input
              type="date"
              name="data"
              defaultValue={formData.data} // Inserido automaticamente com a data atual
              onChange={handleChange}
              className="bg-gray-100 px-4 py-2 rounded-lg text-black w-full mt-2"
            />
          </div>
        </div>
        {/* Campo de Hora */}
        <div className="flex-1 w-full sm:w-auto mb-4 sm:mb-0">
          <label className="block text-md font-bold text-[#800080]">
            Hora:
          </label>
          <input
            type="time"
            name="hora"
            value={formData.hora}
            onChange={handleChange}
            className="bg-gray-100 px-4 py-2 rounded-lg text-black w-full mt-2"
          />
        </div>

        {/* Campo para Código de Barras */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-[#800080]">
            Código de Barras:
          </h3>
          <input
            type="text"
            name="codigoBarras"
            placeholder="Informe o código de barras"
            value={formData.codigoBarras || ""}
            onChange={(e) =>
              setFormData({ ...formData, codigoBarras: e.target.value })
            }
            className="bg-gray-100 w-full px-4 py-2 border rounded-lg text-black focus:outline-none focus:border-[#800080] focus:ring-1 focus:ring-[#800080]"
            required
          />
        </div>

        {/* Campo para Código do Fabricante */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-[#800080]">
            Código do Fabricante:
          </h3>
          <input
            type="text"
            name="codigoFabricante"
            placeholder="Informe o código do fabricante"
            value={formData.codigoFabricante || ""}
            onChange={(e) =>
              setFormData({ ...formData, codigoFabricante: e.target.value })
            }
            className="bg-gray-100 w-full px-4 py-2 border rounded-lg text-black focus:outline-none focus:border-[#800080] focus:ring-1 focus:ring-[#800080]"
            required
          />
        </div>

        {/* Seção para selecionar o Fabricante como um select */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-[#800080]">Fabricante:</h3>
          <select
            name="fabricante"
            value={formData.fabricante || ""}
            onChange={(e) =>
              setFormData({ ...formData, fabricante: e.target.value })
            }
            className="bg-gray-100 w-full px-4 py-2 border rounded-lg text-black focus:outline-none focus:border-[#800080] focus:ring-1 focus:ring-[#800080]"
            required
          >
            <option value="">Selecione o Fabricante</option>
            {fabricantes.map((fabricante) => (
              <option key={fabricante} value={fabricante}>
                {fabricante ? fabricante.toUpperCase() : ""}
              </option>
            ))}
          </select>
        </div>

        {/* Seção para selecionar o Fornecedor */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-[#800080]">Fornecedor:</h3>
          <select
            name="fornecedor"
            value={formData.fornecedor || ""}
            onChange={(e) =>
              setFormData({ ...formData, fornecedor: e.target.value })
            }
            className="bg-gray-100 w-full px-4 py-2 border rounded-lg text-black focus:outline-none focus:border-[#800080] focus:ring-1 focus:ring-[#800080]"
            required
          >
            <option value="">Selecione o Fornecedor</option>
            {fornecedores.map((fornecedor) => (
              <option key={fornecedor} value={fornecedor}>
                {fornecedor.toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 z-100">
          <div className="flex flex-wrap justify-between space-x-4">
            {/* Campo de Código do Produto */}
            <div className="flex-1">
              <label className="block text-sm font-bold text-[#800080] mb-2">
                Código do Produto{" "}
                <span className="text-red-600">(Obrigatório)</span>
              </label>
              <input
                type="text"
                name="codigo"
                placeholder="Informe o código do produto"
                value={formData.codigo || ""}
                onChange={(e) =>
                  setFormData({ ...formData, codigo: e.target.value })
                }
                className="bg-gray-100 w-full px-4 py-2 border border-gray-300 rounded-lg text-black focus:outline-none focus:border-[#800080] focus:ring-1 focus:ring-[#800080]"
                required
              />

              {/* Seção para selecionar a Marca */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-[#800080]">Marca:</h3>
                <select
                  name="marca"
                  value={formData.marca || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, marca: e.target.value })
                  }
                  className="bg-gray-100 w-full px-4 py-2 border rounded-lg text-black focus:outline-none focus:border-[#800080] focus:ring-1 focus:ring-[#800080]"
                  required
                >
                  <option value="">Selecione a Marca</option>
                  {marcas.map((marca) => (
                    <option key={marca} value={marca}>
                      {marca.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              {/* Seção para selecionar o Gênero */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-[#800080]">
                  Gênero:
                </h3>
                <select
                  name="genero"
                  value={formData.genero || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, genero: e.target.value })
                  }
                  className="bg-gray-100 w-full px-4 py-2 border rounded-lg text-black focus:outline-none focus:border-[#800080] focus:ring-1 focus:ring-[#800080]"
                  required
                >
                  <option value="">Selecione o Gênero</option>
                  {["Masculino", "Feminino", "Unissex"].map((genero) => (
                    <option key={genero} value={genero}>
                      {genero.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              {/* Seção para selecionar o Material */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-[#800080]">
                  Material:
                </h3>
                <select
                  name="material"
                  value={formData.material || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, material: e.target.value })
                  }
                  className="bg-gray-100 w-full px-4 py-2 border rounded-lg text-black focus:outline-none focus:border-[#800080] focus:ring-1 focus:ring-[#800080]"
                  required
                >
                  <option value="">Selecione o Material</option>
                  {materiais.map((material) => (
                    <option key={material} value={material}>
                      {material ? material.toUpperCase() : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Seção para selecionar o Aro */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-[#800080]">Aro:</h3>
                <select
                  name="aro"
                  value={formData.aro || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, aro: e.target.value })
                  }
                  className="bg-gray-100 w-full px-4 py-2 border rounded-lg text-black focus:outline-none focus:border-[#800080] focus:ring-1 focus:ring-[#800080]"
                  required
                >
                  <option value="">Selecione o Aro</option>
                  {aros.map((aro) => (
                    <option key={aro} value={aro}>
                      {aro ? aro.toUpperCase() : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Seção para selecionar o Formato */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-[#800080]">
                  Formato:
                </h3>
                <select
                  name="formato"
                  value={formData.formato || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, formato: e.target.value })
                  }
                  className="bg-gray-100 w-full px-4 py-2 border rounded-lg text-black focus:outline-none focus:border-[#800080] focus:ring-1 focus:ring-[#800080]"
                  required
                >
                  <option value="">Selecione o Formato</option>
                  {formatos.map((formato) => (
                    <option key={formato} value={formato}>
                      {formato ? formato.toUpperCase() : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Seção para selecionar a Cor */}

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-[#800080]">Cor:</h3>
                <select
                  name="cor"
                  value={formData.cor || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, cor: e.target.value })
                  }
                  className="bg-gray-100 w-full px-4 py-2 border rounded-lg text-black focus:outline-none focus:border-[#800080] focus:ring-1 focus:ring-[#800080]"
                  required
                >
                  <option value="">Selecione a Cor</option>
                  {cores.map((cor) => (
                    <option key={cor} value={cor}>
                      {cor ? cor.toUpperCase() : ""}
                    </option>
                  ))}
                </select>
              </div>
              {/* Seção para selecionar a largura da lente*/}

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-[#800080]">Lente:</h3>
                <select
                  name="lente"
                  value={formData.lente || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, lente: e.target.value })
                  }
                  className="bg-gray-100 w-full px-4 py-2 border rounded-lg text-black focus:outline-none focus:border-[#800080] focus:ring-1 focus:ring-[#800080]"
                  required
                >
                  <option value="">Selecione a Lente</option>
                  {lentes.map((lente) => (
                    <option key={lente} value={lente}>
                      {lente}
                    </option>
                  ))}
                </select>
              </div>

              {/* Seção para selecionar a distancia da ponte*/}

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-[#800080]">Ponte:</h3>
                <select
                  name="ponte"
                  value={formData.ponte || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, ponte: e.target.value })
                  }
                  className="bg-gray-100 w-full px-4 py-2 border rounded-lg text-black focus:outline-none focus:border-[#800080] focus:ring-1 focus:ring-[#800080]"
                  required
                >
                  <option value="">Selecione a Ponte</option>
                  {pontes.map((ponte) => (
                    <option key={ponte} value={ponte}>
                      {ponte}
                    </option>
                  ))}
                </select>
              </div>

              {/* Seção para selecionar a Haste como um select */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-[#800080]">Haste:</h3>
                <select
                  name="haste"
                  value={formData.haste || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, haste: e.target.value })
                  }
                  className="bg-gray-100 w-full px-4 py-2 border rounded-lg text-black focus:outline-none focus:border-[#800080] focus:ring-1 focus:ring-[#800080]"
                  required
                >
                  <option value="">Selecione a Haste</option>
                  {hastes.map((haste) => (
                    <option key={haste} value={haste}>
                      {haste}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-start space-x-8">
                <div className="space-y-4 w-full">
                  <div className="flex items-center w-full">
                    {/* Campo de Custo - Aumentando a largura */}
                    <div className="w-full">
                      {" "}
                      {/* Aumentei a largura de w-32 para w-48 */}
                      <h3 className="text-lg font-semibold text-[#800080] text-start">
                        Custo:
                      </h3>
                      <div className="flex items-center border border-[#800080] rounded-lg">
                        <span className="px-2 text-gray-400">R$</span>
                        <input
                          type="number"
                          name="custo"
                          value={formData.custo}
                          onChange={(e) => handleChange(e)} // Função handleChange
                          placeholder="0,00"
                          className="w-full px-2 py-2 text-black focus:outline-none focus:border-[#800080] focus:ring-1 focus:ring-[#800080] rounded-lg"
                          required
                        />
                      </div>
                    </div>

                    {/* Espaçamento manual ajustado */}
                    <div className="w-14"></div>

                    {/* Campo de Total - Aumentando a largura */}
                    <div className="w-full">
                      {" "}
                      {/* Aumentei a largura de w-32 para w-48 */}
                      <h3 className="text-lg font-semibold text-[#800080] text-start">
                        Total:
                      </h3>
                      <div className="flex items-center border border-[#800080] rounded-lg">
                        <span className="px-2 text-gray-400">R$</span>
                        <input
                          type="number"
                          name="valor"
                          value={formData.valor}
                          onChange={(e) => handleChange(e)} // Função handleChange
                          placeholder="0,00"
                          className="w-full px-2 py-2 text-black focus:outline-none focus:border-[#800080] focus:ring-1 focus:ring-[#800080] rounded-lg"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                {/* Campo para Percentual de Lucro */}
                <div className="w-full">
                  <label
                    htmlFor="percentual_lucro"
                    className="text-lg font-semibold text-[#800080] text-start"
                  >
                    Percentual de Lucro (%)
                  </label>
                  <div className="flex items-center border border-[#800080] rounded-lg">
                    <input
                      type="text"
                      id="percentual_lucro"
                      name="percentual_lucro"
                      value={formData.percentual_lucro}
                      readOnly // Campo de leitura
                      className="w-full px-2 py-2 text-black bg-gray-100 focus:outline-none focus:border-[#800080] focus:ring-1 focus:ring-[#800080] rounded-lg"
                      placeholder="O percentual será calculado automaticamente"
                    />
                  </div>
                </div>

                {/* Campo para Custo Médio */}
                <div className="w-full">
                  <label
                    htmlFor="custo_medio"
                    className="text-lg font-semibold text-[#800080] text-start"
                  >
                    Custo Médio
                  </label>
                  <div className="flex items-center border border-[#800080] rounded-lg">
                    <input
                      type="text"
                      id="custo_medio"
                      name="custo_medio"
                      value={
                        formData.custo_medio ? `${formData.custo_medio} R$` : ""
                      } // Adiciona "R$" depois do valor
                      readOnly // Campo de leitura
                      className="w-full px-2 py-2 text-black bg-gray-100 focus:outline-none focus:border-[#800080] focus:ring-1 focus:ring-[#800080] rounded-lg"
                      placeholder="Calculado automaticamente"
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-[#800080]">
                  Quantidade do Produto:
                </h3>
                <input
                  type="number"
                  name="quantidade"
                  placeholder="Informe a quantidade"
                  value={formData.quantidade || ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value > 0) {
                      // Verifica se o valor é maior que zero
                      setFormData({ ...formData, quantidade: value });
                    }
                  }}
                  min="1" // Garante que o campo só aceitará valores iguais ou maiores que 1
                  className="bg-gray-100 w-full px-4 py-2 border rounded-lg text-black focus:outline-none focus:border-[#800080] focus:ring-1 focus:ring-[#800080]"
                  required
                />
              </div>

              {/*unidde*/}
              <div className="space-y-4">
                <label className="text-lg font-semibold text-[#800080]">
                  Unidade:
                </label>
                <select
                  name="unidade"
                  value={formData.unidade || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, unidade: e.target.value })
                  }
                  className="bg-gray-100 px-4 py-2 rounded-lg text-black w-full"
                >
                  <option value="">Selecione a unidade</option>
                  {unidades.map((unidade) => (
                    <option key={unidade} value={unidade}>
                      {unidade ? unidade.toUpperCase() : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-[#800080]">
                  Imagem do Produto:
                </h3>
                <input
                  type="file"
                  name="imagem"
                  accept="image/*"
                  onChange={(e) =>
                    setFormData({ ...formData, imagem: e.target.files[0] })
                  } // Captura o arquivo de imagem
                  className="w-full px-4 py-2 border  bg-gray-100 rounded-lg text-black focus:outline-none focus:border-[#800080] focus:ring-1 focus:ring-[#800080]"
                  required
                />
              </div>
            </div>
          </div>

          {/* Campo de CSOSN (Dados Fiscais) */}
          <div>
            <label className="block text-md font-bold text-[#800080]">
              CSOSN (Dados Fiscais):
            </label>
            <input
              type="text"
              name="csosn"
              value={formData.csosn || ""}
              onChange={(e) =>
                setFormData({ ...formData, csosn: e.target.value })
              }
              className="bg-gray-100 px-4 py-2 rounded-lg text-black w-full mt-2"
              placeholder="Informe o CSOSN"
            />
          </div>

          {/* Campo de CEST */}
          <div>
            <label className="block text-md font-bold text-[#800080]">
              CEST:
            </label>
            <input
              type="text"
              name="cest"
              value={formData.cest || ""}
              onChange={(e) =>
                setFormData({ ...formData, cest: e.target.value })
              }
              className="bg-gray-100 px-4 py-2 rounded-lg text-black w-full mt-2"
              placeholder="Informe o CEST"
            />
          </div>

          {/* Campo de Alíquota do ICMS */}
          <div>
            <label className="block text-md font-bold text-[#800080]">
              Alíquota do ICMS:
            </label>
            <input
              type="text"
              name="aliquotaICMS"
              value={formData.aliquotaICMS || ""}
              onChange={(e) =>
                setFormData({ ...formData, aliquotaICMS: e.target.value })
              }
              className="bg-gray-100 px-4 py-2 rounded-lg text-black w-full mt-2"
              placeholder="Informe a alíquota do ICMS"
            />
          </div>

          {/* Campo de Base de Cálculo ICMS */}
          <div>
            <label className="block text-md font-bold text-[#800080]">
              Base de Cálculo ICMS:
            </label>
            <input
              type="text"
              name="baseCalculoICMS"
              value={formData.baseCalculoICMS || ""}
              onChange={(e) =>
                setFormData({ ...formData, baseCalculoICMS: e.target.value })
              }
              className="bg-gray-100 px-4 py-2 rounded-lg text-black w-full mt-2"
              placeholder="Informe a base de cálculo do ICMS"
            />
          </div>

          {/* Campo de NCM como select */}
          <div className="w-1/2">
            <h3 className="text-lg font-semibold text-[#800080]">NCM:</h3>
            <select
              name="NCM"
              value={formData.NCM || ""}
              onChange={(e) =>
                setFormData({ ...formData, NCM: e.target.value })
              }
              className="bg-gray-100 w-full px-4 py-2 border rounded-lg text-black focus:outline-none focus:border-[#800080] focus:ring-1 focus:ring-[#800080]"
              required
            >
              <option value="">Selecione o NCM</option>
              {ncm.map((NCM) => (
                <option key={NCM} value={NCM}>
                  {NCM}
                </option>
              ))}
            </select>
          </div>
          {/* Campo de Alíquota do IPI */}
          <div>
            <label className="block text-md font-bold text-[#800080]">
              Alíquota do IPI:
            </label>
            <input
              type="text"
              name="aliquotaIPI"
              value={formData.aliquotaIPI || ""}
              onChange={(e) =>
                setFormData({ ...formData, aliquotaIPI: e.target.value })
              }
              className="bg-gray-100 px-4 py-2 rounded-lg text-black w-full mt-2"
              placeholder="Informe a alíquota do IPI"
            />
          </div>

          {/* Campo de CST IPI */}
          <div>
            <label className="block text-md font-bold text-[#800080]">
              CST IPI:
            </label>
            <input
              type="text"
              name="cstIPI"
              value={formData.cstIPI || ""}
              onChange={(e) =>
                setFormData({ ...formData, cstIPI: e.target.value })
              }
              className="bg-gray-100 px-4 py-2 rounded-lg text-black w-full mt-2"
              placeholder="Informe o CST IPI"
            />
          </div>

          {/* Campo de Base de Cálculo do IPI */}
          <div>
            <label className="block text-md font-bold text-[#800080]">
              Base de Cálculo do IPI:
            </label>
            <input
              type="text"
              name="baseCalculoIPI"
              value={formData.baseCalculoIPI || ""}
              onChange={(e) =>
                setFormData({ ...formData, baseCalculoIPI: e.target.value })
              }
              className="bg-gray-100 px-4 py-2 rounded-lg text-black w-full mt-2"
              placeholder="Informe a base de cálculo do IPI"
            />
          </div>

          {/* Campo de CST PIS */}
          <div>
            <label className="block text-md font-bold text-[#800080]">
              CST PIS:
            </label>
            <input
              type="text"
              name="cstPIS"
              value={formData.cstPIS || ""}
              onChange={(e) =>
                setFormData({ ...formData, cstPIS: e.target.value })
              }
              className="bg-gray-100 px-4 py-2 rounded-lg text-black w-full mt-2"
              placeholder="Informe o CST PIS"
            />
          </div>

          {/* Campo de CST COFINS */}
          <div>
            <label className="block text-md font-bold text-[#800080]">
              CST COFINS:
            </label>
            <input
              type="text"
              name="cstCOFINS"
              value={formData.cstCOFINS || ""}
              onChange={(e) =>
                setFormData({ ...formData, cstCOFINS: e.target.value })
              }
              className="bg-gray-100 px-4 py-2 rounded-lg text-black w-full mt-2"
              placeholder="Informe o CST COFINS"
            />
          </div>

          {/* Campo de CFOP */}
          <div>
            <label className="block text-md font-bold text-[#800080]">
              CFOP:
            </label>
            <input
              type="text"
              name="cfop"
              value={formData.cfop || ""}
              onChange={(e) =>
                setFormData({ ...formData, cfop: e.target.value })
              }
              className="bg-gray-100 px-4 py-2 rounded-lg text-black w-full mt-2"
              placeholder="Informe o CFOP"
            />
          </div>

          {/* Campo de Origem do Produto */}
          <div>
            <label className="block text-md font-bold text-[#800080]">
              Origem do Produto:
            </label>
            <input
              type="text"
              name="origemProduto"
              value={formData.origemProduto || ""}
              onChange={(e) =>
                setFormData({ ...formData, origemProduto: e.target.value })
              }
              className="bg-gray-100 px-4 py-2 rounded-lg text-black w-full mt-2"
              placeholder="Informe a origem do produto"
            />
          </div>

          {/* Campo de Peso Bruto */}
          <div>
            <label className="block text-md font-bold text-[#800080]">
              Peso Bruto:
            </label>
            <input
              type="text"
              name="pesoBruto"
              value={formData.pesoBruto || ""}
              onChange={(e) =>
                setFormData({ ...formData, pesoBruto: e.target.value })
              }
              className="bg-gray-100 px-4 py-2 rounded-lg text-black w-full mt-2"
              placeholder="Informe o peso bruto"
            />
          </div>

          {/* Campo de Peso Líquido */}
          <div>
            <label className="block text-md font-bold text-[#800080]">
              Peso Líquido:
            </label>
            <input
              type="text"
              name="pesoLiquido"
              value={formData.pesoLiquido || ""}
              onChange={(e) =>
                setFormData({ ...formData, pesoLiquido: e.target.value })
              }
              className="bg-gray-100 px-4 py-2 rounded-lg text-black w-full mt-2"
              placeholder="Informe o peso líquido"
            />
          </div>

          {/* Botão de envio */}
          <div className="flex justify-center mt-4">
            <button
              type="submit"
              className={`bg-[#9f206b] text-white font-bold px-6 py-2 rounded-lg shadow hover:bg-[#850f56] transition ${isLoading ? "opacity-50 cursor-not-allowed" : ""
                }`}
              disabled={isLoading}
            >
              {loading ? (
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-white"></div>
              ) : (
                "REGISTRAR SOLAR"
              )}
            </button>
          </div>

          {showSuccessPopup && (
            <div className="fixed bottom-4 right-4 bg-green-500 text-white p-4 rounded-lg shadow-lg">
              <p>Produto enviado com sucesso!</p>
            </div>
          )}
        </form>
      </Layout>
    </div>
  );
}
export default function Page() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <FormularioLoja />
    </Suspense>
  );
}
