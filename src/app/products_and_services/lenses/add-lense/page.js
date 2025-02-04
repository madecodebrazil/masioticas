"use client";
import React, { Suspense, useEffect, useState } from "react";
import Layout from "@/components/Layout";
import Link from "next/link"; // Importando o componente Link
import { collection, setDoc, doc, getDoc, getDocs } from "firebase/firestore";
import { firestore } from "../../../../lib/firebaseConfig";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../../../../lib/firebaseConfig"; // Certifique-se de que está configurado corretamente o Firebase Storage
import { useRouter, useSearchParams } from "next/navigation";

export function FormularioLentes() {
  const router = useRouter();
  const searchParams = useSearchParams(); // Defina aqui
  const [isLoading, setIsLoading] = useState(false);
  const [fornecedores, setFornecedores] = useState([]);
  const [fabricantes, setFabricantes] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [tipos, setTipos] = useState([]);
  const [designs, setDesigns] = useState([]);
  const [indicies, setIndicies] = useState([]);
  const [selectedLojas, setSelectedLojas] = useState([]);

  useEffect(() => {
    const params = {};
    searchParams.forEach((value, key) => {
      params[key] = value;
    });
  
    const cloneId = searchParams.get("cloneId");
    const loja = searchParams.get("loja");
  
    if (cloneId && loja) {
      // Estamos clonando
      fetchCloneData(cloneId, loja);
    } else if (params.formData) {
      // Estamos editando
      const formDataFromQuery = JSON.parse(decodeURIComponent(params.formData));
  
      // Converte os campos numéricos de volta para números
      const numericFields = [
        "custo",
        "quantidade",
        "valor",
        "diametroDe",
        "diametroPara",
        "esfericoDe",
        "esfericoPara",
        "cilindroDe",
        "cilindroPara",
        "adicaoDe",
        "adicaoPara",
        "montagemDe",
        "montagemPara",
      ];
  
      const convertedFormData = { ...formDataFromQuery };
  
      numericFields.forEach((field) => {
        convertedFormData[field] = Number(formDataFromQuery[field]) || 0;
      });
  
      setFormData(convertedFormData);
  
      if (convertedFormData.codigo) {
        fetchProductImage(convertedFormData.codigo);
      }
    } else {
      // Preenche data e hora atuais se não estiver clonando ou editando
      const currentDate = new Date();
      const formattedDate = currentDate.toISOString().split("T")[0];
      const formattedTime = currentDate.toTimeString().split(" ")[0].slice(0, 5);
  
      setFormData((prevData) => ({
        ...prevData,
        data: formattedDate,
        hora: formattedTime,
      }));
    }
  }, [searchParams]);
  const fetchCloneData = async (cloneId, loja) => {
    try {
      const collectionName =
        loja === "loja1" ? "loja1_lentes" : "loja2_lentes";
      const docRef = doc(firestore, collectionName, cloneId);
      const docSnap = await getDoc(docRef);
  
      if (docSnap.exists()) {
        const data = docSnap.data();
  
        // Remover campos que não devem ser clonados
        const {
          id,
          data: dataField,
          hora,
          imagem,
          lojas,
          ...clonedData
        } = data;
  
        // Atualizar data e hora para os valores atuais
        const currentDate = new Date();
        const formattedDate = currentDate.toISOString().split("T")[0];
        const formattedTime = currentDate
          .toTimeString()
          .split(" ")[0]
          .slice(0, 5);
  
        setFormData((prevData) => ({
          ...prevData,
          ...clonedData,
          data: formattedDate,
          hora: formattedTime,
          imagem: null, // Resetar a imagem para forçar o upload de uma nova
        }));
  
        // Atualizar o estado 'selectedLojas' com base em 'lojas'
        if (data.lojas && Array.isArray(data.lojas)) {
          setSelectedLojas(data.lojas);
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
  const [materiais, setMateriais] = useState([]);
  const [tecnologias, setTecnologias] = useState([]);
  const [tiposTratamentos, setTipoTratamentos] = useState([]);
  const [familias, setFamilias] = useState([]);
  const [filteredFamilias, setFilteredFamilias] = useState([]);
  const [ncmList, setNCMs] = useState([]);
  const [formData, setFormData] = useState({
    sku: "",
    unidade:"",
    codigoBarras: "",
    codigoFabricante: "",
    codigo: "",
    data: "",
    hora: "",
    fornecedor: "",
    familia: "",
    fabricante: "",
    marca: "",
    tipo: [],
    design: "",
    indice: "",
    material: "",
    categoria: "lentes",
    tecnologia: [],
    tipoTratamento: "",
    tratamento: [],
    diametroDe: 0,
    diametroPara: 0,
    esfericoDe: 0,
    esfericoPara: 0,
    cilindroDe: 0,
    cilindroPara: 0,
    adicaoDe: 0,
    adicaoPara: 0,
    montagemDe: 0,
    montagemPara: 0,
    corredor: [],
    NCM: "",
    GTIN: "",
    CSOSN: "",
    CEST: "",
    aliquotaICMS: 0,
    baseCalculoICMS: 0,
    CFOP: "",
    custo: 0,
    valor: 0,
    quantidade: 0,
    percentual_lucro: 0,
    custo_medio: 0,
    imagem: null,

    // Novos campos adicionados
    aliquotaIPI: 0,
    cstIPI: "",
    baseCalculoIPI: 0,
    cstPIS: "",
    cstCOFINS: "",
    origemProduto: "",
    pesoBruto: 0,
    pesoLiquido: 0,
  });

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

  const generateSKU = () => {
    const randomPart = Math.floor(Math.random() * 10000);
    const productCode = formData.codigo || generateRandomCode();
    const productName = formData.produto
      ? formData.produto.substring(0, 3).toUpperCase()
      : "LNS";
    return `${productName}-${productCode}-${randomPart}`;
  };

  // Atualiza o SKU automaticamente quando o código ou nome do produto muda
  useEffect(() => {
    const sku = generateSKU();
    setFormData((prevData) => ({
      ...prevData,
      sku: sku,
    }));
  }, [formData.codigo, formData.produto]);

  useEffect(() => {
    const params = {};
    searchParams.forEach((value, key) => {
      params[key] = value;
    });

    const formDataFromQuery = params.formData
      ? JSON.parse(decodeURIComponent(params.formData))
      : {};

    // Converte os campos numéricos de volta para números
    const numericFields = [
      "custo",
      "quantidade",
      "valor",
      "diametro",
      "esferico",
      "cilindro",
      "adicao",
      "montagem",
    ];

    const convertedFormData = {
      ...formDataFromQuery,
      quantidade: Number(formDataFromQuery.quantidade) || 0,
      custo: Number(formDataFromQuery.custo) || 0,
      valor: Number(formDataFromQuery.valor) || 0,
      diametro: {
        de: Number(formDataFromQuery.diametro?.de) || 0,
        para: Number(formDataFromQuery.diametro?.para) || 0,
      },
      esferico: {
        de: Number(formDataFromQuery.esferico?.de) || 0,
        para: Number(formDataFromQuery.esferico?.para) || 0,
      },
      cilindro: {
        de: Number(formDataFromQuery.cilindro?.de) || 0,
        para: Number(formDataFromQuery.cilindro?.para) || 0,
      },
      adicao: {
        de: Number(formDataFromQuery.adicao?.de) || 0,
        para: Number(formDataFromQuery.adicao?.para) || 0,
      },
      montagem: {
        de: Number(formDataFromQuery.montagem?.de) || 0,
        para: Number(formDataFromQuery.montagem?.para) || 0,
      },
    };

    setFormData(convertedFormData);

    if (convertedFormData.codigo) {
      fetchProductImage(convertedFormData.codigo);
    }
  }, [searchParams]);

  useEffect(() => {
    // Preenche automaticamente a data e a hora com o momento atual
    const currentDate = new Date();
    const formattedDate = currentDate.toISOString().split("T")[0]; // Formato YYYY-MM-DD
    const formattedTime = currentDate.toTimeString().split(" ")[0].slice(0, 5); // Formato HH:MM

    setFormData((prevData) => ({
      ...prevData,
      data: formattedDate,
      hora: formattedTime,
    }));
  }, []);
  const handleMultiSelect = (field, value) => {
    setFormData((prevState) => {
      const selectedValues = prevState[field] || [];

      if (selectedValues.includes(value)) {
        // Remove o valor se já estiver selecionado
        return {
          ...prevState,
          [field]: selectedValues.filter((item) => item !== value),
        };
      } else {
        // Adiciona o valor se não estiver selecionado
        return {
          ...prevState,
          [field]: [...selectedValues, value],
        };
      }
    });
  };
  const handleImageChange = async (e) => {
    const file = e.target.files[0]; // Obtém o primeiro arquivo selecionado

    if (file) {
      const storageRef = ref(storage, `temp_images/${file.name}`); // Caminho temporário para armazenar a imagem
      try {
        // Faz o upload da imagem para o Firebase Storage
        await uploadBytes(storageRef, file);

        // Obtém a URL de download
        const downloadURL = await getDownloadURL(storageRef);

        // Atualiza o formData com a URL da imagem
        setFormData((prevData) => ({
          ...prevData,
          imagem: downloadURL, // Armazena a URL de download da imagem
        }));

        console.log("Imagem enviada com sucesso:", downloadURL);
      } catch (error) {
        console.error("Erro ao enviar imagem:", error);
      }
    }
  };

  useEffect(() => {
    const fetchFamilias = async () => {
      try {
        const familiasSnapshot = await getDocs(
          collection(firestore, "lentes_familias")
        );
        const familiasList = familiasSnapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name,
        }));
        setFamilias(familiasList);
      } catch (error) {
        console.error("Erro ao buscar famílias:", error);
      }
    };

    fetchFamilias();
  }, []);

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

  const handleFetchFamilias = async (searchText) => {
    if (searchText.trim() === "") {
      setFamilias([]); // Se o campo estiver vazio, limpa as sugestões
      return;
    }

    // Busca famílias no Firestore (pode ser adaptado conforme sua necessidade)
    const familiasSnapshot = await getDocs(
      collection(firestore, "lentes_familias")
    );
    const familiasList = familiasSnapshot.docs.map((doc) => ({
      id: doc.id,
      name: doc.data().name,
    }));
    setFamilias(familiasList);
  };

  // Função para seleção única (ex.: corredores)
  const handleSingleSelect = (field, value) => {
    setFormData({
      ...formData,
      [field]: value, // Define o valor para o campo selecionado
    });
  };

  // Função para múltipla seleção (ex.: tecnologia e tratamento)
  const handleToggle = (field, value) => {
    // Garante que formData[field] seja sempre um array
    const currentSelection = Array.isArray(formData[field])
      ? [...formData[field]]
      : [];

    if (currentSelection.includes(value)) {
      // Remove se já estiver selecionado
      setFormData({
        ...formData,
        [field]: currentSelection.filter((item) => item !== value),
      });
    } else {
      // Adiciona se não estiver selecionado
      setFormData({
        ...formData,
        [field]: [...currentSelection, value],
      });
    }
  };

  // Função de submissão do formulário
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true); // Ativa o estado de carregamento

    // Verifica se a imagem já foi enviada
    if (!formData.imagem) {
      alert(
        "Por favor, aguarde o upload da imagem antes de submeter o formulário."
      );
      setIsLoading(false);
      return;
    }

    try {
      const codigoProduto = formData.codigo; // Use o código como identificador

      // Verifica o formData antes de redirecionar
      console.log("Form Data antes de redirecionar:", formData);

      // Salva os dados no Firestore em 'temp_image'
      await setDoc(doc(firestore, "temp_image", codigoProduto), formData);

      // Adiciona as lojas selecionadas ao formData
      const dataToSend = {
        ...formData,
        lojas: selectedLojas, // Adiciona as lojas selecionadas
      };

      // Redireciona para a página de confirmação com os dados do formulário
      const queryString = encodeURIComponent(JSON.stringify(dataToSend));
      router.push(
        `/products_and_services/lenses/confirm?formData=${queryString}`
      );
    } catch (error) {
      console.error("Erro ao salvar os dados temporários:", error);
    } finally {
      setIsLoading(false); // Desativa o estado de carregamento
    }
  };

  useEffect(() => {
    const fetchFornecedores = async () => {
      try {
        const fornecedoresSnapshot = await getDocs(
          collection(firestore, "fornecedores")
        );
        const fornecedoresList = fornecedoresSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setFornecedores(fornecedoresList); // Atualiza o estado com os fornecedores
      } catch (error) {
        console.error("Erro ao buscar fornecedores:", error);
      }
    };
    const fetchFabricantes = async () => {
      try {
        const fabricantesSnapshot = await getDocs(
          collection(firestore, "lentes_fabricantes")
        );
        const fabricantesList = fabricantesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setFabricantes(fabricantesList); // Atualiza o estado com os fornecedores
      } catch (error) {
        console.error("Erro ao buscar fornecedores:", error);
      }
    };
    const fetchMarcas = async () => {
      try {
        const marcasSnapshot = await getDocs(
          collection(firestore, "lentes_marcas")
        );
        const marcasList = marcasSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setMarcas(marcasList); // Atualiza o estado com os fornecedores
      } catch (error) {
        console.error("Erro ao buscar marcas", error);
      }
    };
    const fetchTipos = async () => {
      try {
        const tiposSnapshot = await getDocs(
          collection(firestore, "lentes_tipos")
        );
        const tiposList = tiposSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setTipos(tiposList); // Atualiza o estado com os fornecedores
      } catch (error) {
        console.error("Erro ao buscar tipos:", error);
      }
    };
    const fetchDesigns = async () => {
      try {
        const designsSnapshot = await getDocs(
          collection(firestore, "lentes_designs")
        );
        const designsList = designsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setDesigns(designsList); // Atualiza o estado com os fornecedores
      } catch (error) {
        console.error("Erro ao buscar design:", error);
      }
    };
    const fetchIndicies = async () => {
      try {
        const indiciesSnapshot = await getDocs(
          collection(firestore, "lentes_indices")
        );
        const indiciesList = indiciesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setIndicies(indiciesList); // Atualiza o estado com os fornecedores
      } catch (error) {
        console.error("Erro ao buscar design:", error);
      }
    };
    const fetchMateriais = async () => {
      try {
        const materiaisSnapshot = await getDocs(
          collection(firestore, "lentes_materiais")
        );
        const materiaisList = materiaisSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setMateriais(materiaisList); // Atualiza o estado com os fornecedores
      } catch (error) {
        console.error("Erro ao buscar design:", error);
      }
    };
    const fetchTecnologias = async () => {
      try {
        const tecnologiasSnapshot = await getDocs(
          collection(firestore, "lentes_tecnologias")
        );
        const tecnologiasList = tecnologiasSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setTecnologias(tecnologiasList); // Atualiza o estado com os fornecedores
      } catch (error) {
        console.error("Erro ao buscar design:", error);
      }
    };
    const fetchTipoTratamentos = async () => {
      try {
        const tipotratamentosSnapshot = await getDocs(
          collection(firestore, "lentes_tratamentos")
        ); // Coleção de tratamentos
        const tipotratamentosList = tipotratamentosSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setTipoTratamentos(tipotratamentosList); // Atualiza o estado com os tratamentos
      } catch (error) {
        console.error("Erro ao buscar tratamentos:", error);
      }
    };
    const fetchFamilias = async () => {
      try {
        const familiasSnapshot = await getDocs(
          collection(firestore, "lentes_familias")
        ); // Coleção de famílias
        const familiasList = familiasSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setFamilias(familiasList); // Atualiza o estado com as famílias
      } catch (error) {
        console.error("Erro ao buscar famílias:", error);
      }
    };
    const fetchNCMs = async () => {
      try {
        const ncmSnapshot = await getDocs(collection(firestore, "ncm")); // Coleção de NCM
        const ncmList = ncmSnapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name, // Acessa o campo 'value'
        }));

        setNCMs(ncmList); // Atualiza o estado com os NCMs
      } catch (error) {
        console.error("Erro ao buscar NCMs:", error);
      }
    };

    fetchFornecedores(); // Chama a função ao montar o componente
    fetchFabricantes(); // Chama a função ao montar o componente
    fetchMarcas(); // Chama a função ao montar o componente
    fetchTipos(); // Chama a função ao montar o componente
    fetchDesigns();
    fetchIndicies(); // Chama a função ao montar o componente
    fetchMateriais(); // Chama a função ao montar o componente
    fetchTecnologias();
    fetchTipoTratamentos();
    fetchFamilias();
    fetchNCMs();
  }, []);

  return (
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
          onClick={() => router.push("/products_and_services/lenses/lenses-ab")} // Redireciona para a rota desejada ao clicar
        />
      </div>
      <div className="relative flex items-center mt-4">
        <Link href="/products_and_services/lenses">
          <img
            src="/images/angle-left-solid.svg"
            alt="Ícone de voltar"
            className="cursor-pointer"
            style={{ width: "20px", height: "20px" }}
          />
        </Link>

        <div className="flex items-center justify-center mx-auto space-x-4">
          <button
            className="bg-[#800080] text-white font-bold px-6 py-2 rounded-lg shadow hover:bg-[#660066]"
            onClick={() => router.push("/products_and_services/lenses")}
          >
            LENTES REGISTRADAS
          </button>
        </div>
      </div>

      <h2 className="text-3xl text-center font-semibold text-[#800080]">
        ADICIONAR LENTE
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
            readOnly // Define como somente leitura
            placeholder="O SKU será gerado automaticamente"
            className="w-full px-2 py-2 text-black focus:outline-none focus:border-[#800080] focus:ring-1 focus:ring-[#800080] rounded-lg bg-gray-100"
          />
        </div>
      </div>

      {/* Seção de Escolha de Lojas */}
      <div className="flex-1 w-full sm:w-auto mt-4 sm:mt-0 sm:ml-0">
        <label className="block text-md font-bold text-[#800080] mb-2 text-left">
          Loja
        </label>
        <select
          value={selectedLojas.length === 2 ? "Ambas" : selectedLojas[0] || ""}
          onChange={(e) => {
            const selectedValue = e.target.value;
            if (selectedValue === "Ambas") {
              setSelectedLojas(["Loja 1", "Loja 2"]);
            } else if (selectedValue) {
              setSelectedLojas([selectedValue]);
            } else {
              setSelectedLojas([]); // Nenhuma loja selecionada
            }
          }}
          className="bg-gray-100 w-full px-4 py-2 border rounded-lg text-black focus:outline-none focus:border-[#800080] focus:ring-1 focus:ring-[#800080]"
        >
          <option value="">Selecione uma loja</option>
          <option value="loja1">LOJA 1</option>
          <option value="loja2">LOJA 2</option>
          <option value="Ambas">AMBAS AS LOJAS</option>
        </select>

        {/* Indica que ambas as lojas foram selecionadas */}
        {selectedLojas.length === 2 && (
          <p className="text-sm text-green-600 mt-2">
            Ambas as lojas selecionadas
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Data e Hora */}
        <div className="flex space-x-4">
          <div className="flex-1">
            <label className="block text-md font-bold text-[#800080]">
              Data:
            </label>
            <input
              type="date"
              name="data"
              value={formData.data}
              onChange={handleChange}
              className="bg-gray-100 px-4 py-2 rounded-lg text-black w-full mt-2"
            />
          </div>
          <div className="flex-1">
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
        </div>
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

        <div className="space-y-4">
          <label className="text-lg font-semibold text-[#800080]">
            Fabricante:
          </label>
          <select
            name="fabricante"
            value={formData.fabricante}
            onChange={handleChange}
            className="bg-gray-100 px-4 py-2 rounded-lg text-black w-full"
          >
            <option value="">Selecione um fabricante</option>
            {fabricantes.map((fabricante) => (
              <option key={fabricante.id} value={fabricante.name}>
                {fabricante.name}
              </option>
            ))}
          </select>
        </div>

        {/* Fornecedor (com dados obtidos do Firestore) */}
        <div className="space-y-4">
          <label className="text-lg font-semibold text-[#800080]">
            Fornecedor:
          </label>
          <select
            name="fornecedor"
            value={formData.fornecedor}
            onChange={handleChange}
            className="bg-gray-100 px-4 py-2 rounded-lg text-black w-full"
          >
            <option value="">Selecione um fornecedor</option>
            {fornecedores.map((fornecedor) => (
              <option key={fornecedor.id} value={fornecedor.name}>
                {fornecedor.name}
              </option>
            ))}
          </select>
        </div>

        {/* Código */}
        <div className="space-y-4">
          <label className="text-lg font-semibold text-[#800080]">
            Código:
          </label>
          <input
            type="text"
            name="codigo"
            value={formData.codigo}
            onChange={handleChange}
            className="bg-gray-100 px-4 py-2 rounded-lg text-black w-full"
            placeholder="Informe o código"
          />
        </div>

        {/* Marca */}
        <div className="space-y-4">
          <label className="text-lg font-semibold text-[#800080]">Marca:</label>
          <select
            name="marca"
            value={formData.marca}
            onChange={handleChange}
            className="bg-gray-100 px-4 py-2 rounded-lg text-black w-full"
          >
            <option value="">Selecione um marca</option>
            {marcas.map((marca) => (
              <option key={marca.id} value={marca.name}>
                {marca.name}
              </option>
            ))}
          </select>
        </div>

        {/* tecnologia */}
        <div className="space-y-4">
          <label className="text-lg font-semibold text-[#800080]">
            Tecnologias:
          </label>
          <div className="flex flex-wrap gap-2">
            {tecnologias.map((tecnologia) => (
              <button
                key={tecnologia.id}
                type="button"
                onClick={() => handleToggle("tecnologia", tecnologia.name)}
                className={`px-4 py-2 rounded-lg border-2 ${
                  Array.isArray(formData.tecnologia) &&
                  formData.tecnologia.includes(tecnologia.name) // Verifique se é um array
                    ? "bg-[#932A83] text-white border-[#932A83]"
                    : "bg-transparent text-[#932A83] border-[#932A83]"
                }`}
              >
                {tecnologia.name}
              </button>
            ))}
          </div>
        </div>

        {/*unidde*/}
        <div className="space-y-4">
          <label className="text-lg font-semibold text-[#800080]">
            Unidade:
          </label>
          <select
            name="unidade"
            value={formData.unidade || ""}
            onChange={handleChange}
            className="bg-gray-100 px-4 py-2 rounded-lg text-black w-full"
          >
            <option value="">Selecione a unidade</option>
            <option value="Peça">Peça</option>
            <option value="Par">Par</option>
            <option value="Caixa">Caixa</option>
          </select>
        </div>

        {/* Tipo */}
        <div className="space-y-4">
          <label className="text-lg font-semibold text-[#800080]">
            Tipos (tratamento):
          </label>
          <div className="flex flex-wrap gap-2">
            {tipos.map((tipo) => (
              <button
                key={tipo.id}
                type="button"
                onClick={() => handleToggle("tipo", tipo.name)}
                className={`px-4 py-2 rounded-lg border-2 ${
                  Array.isArray(formData.tipo) &&
                  formData.tipo.includes(tipo.name)
                    ? "bg-[#932A83] text-white border-[#932A83]"
                    : "bg-transparent text-[#932A83] border-[#932A83]"
                }`}
              >
                {tipo.name}
              </button>
            ))}
          </div>
        </div>

        {/* Tipo de tratamento (multiselect estilizado, com fetch de Firestore) */}
        <div className="space-y-4">
          <label className="text-lg font-semibold text-[#932A83]">
            Tratamento:
          </label>
          <div className="flex flex-wrap gap-2">
            {tiposTratamentos.map((tipoTratamento) => (
              <button
                key={tipoTratamento.id}
                type="button"
                onClick={() =>
                  handleToggle("tipoTratamento", tipoTratamento.name)
                }
                className={`px-4 py-2 rounded-lg border-2 ${
                  Array.isArray(formData.tipoTratamento) &&
                  formData.tipoTratamento.includes(tipoTratamento.name) // Verifique se é um array
                    ? "bg-[#932A83] text-white border-[#932A83]"
                    : "bg-transparent text-[#932A83] border-[#932A83]"
                }`}
              >
                {tipoTratamento.name}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4 relative">
          <div>
            <label className="text-lg font-semibold text-[#800080]">
              Família:
            </label>
            <input
              type="text"
              name="familia"
              value={formData.familia}
              onChange={handleChange}
              placeholder="Digite o nome da família"
              className="bg-gray-100 px-4 py-2 rounded-lg text-black w-full"
              list="familias-suggestions"
            />
            <datalist id="familias-suggestions">
              {filteredFamilias.map((familia) => (
                <option key={familia.id} value={familia.name} />
              ))}
            </datalist>
          </div>
        </div>

        <div className="space-y-4">
          <label className="text-lg font-semibold text-[#800080]">
            Design:
          </label>
          <select
            name="design"
            value={formData.design}
            onChange={handleChange}
            className="bg-gray-100 px-4 py-2 rounded-lg text-black w-full"
          >
            <option value="">Selecione um design</option>
            {designs.map((design) => (
              <option key={design.id} value={design.name}>
                {design.name}
              </option>
            ))}
          </select>
        </div>

        {/* Índice */}

        <div className="space-y-4">
          <label className="text-lg font-semibold text-[#800080]">Índice</label>
          <select
            name="indice"
            value={formData.indice}
            onChange={handleChange}
            className="bg-gray-100 px-4 py-2 rounded-lg text-black w-full"
          >
            <option value="">Selecione um índice</option>
            {indicies.map((indice) => (
              <option key={indice.id} value={indice.value}>
                {indice.value}
              </option>
            ))}
          </select>
        </div>

        {/* Material */}

        <div className="space-y-4">
          <label className="text-lg font-semibold text-[#800080]">
            Material:
          </label>
          <select
            name="material"
            value={formData.material}
            onChange={handleChange}
            className="bg-gray-100 px-4 py-2 rounded-lg text-black w-full"
          >
            <option value="">Selecione um material</option>
            {materiais.map((material) => (
              <option key={material.id} value={material.name}>
                {material.name}
              </option>
            ))}
          </select>
        </div>

        {/* Esférico */}
        <div className="space-y-4">
          <label className="text-lg font-semibold text-[#800080]">
            Esférico:
          </label>
          <div className="flex space-x-4">
            <input
              type="number" // Mudado para type="number"
              name="esfericoDe"
              value={formData.esfericoDe}
              onChange={handleChange}
              className="bg-gray-100 px-4 py-2 rounded-lg text-black w-full"
              placeholder="De"
            />
            <input
              type="number" // Mudado para type="number"
              name="esfericoPara"
              value={formData.esfericoPara}
              onChange={handleChange}
              className="bg-gray-100 px-4 py-2 rounded-lg text-black w-full"
              placeholder="Para"
            />
          </div>
        </div>

        {/* Cilindro */}
        <div className="space-y-4">
          <label className="text-lg font-semibold text-[#800080]">
            Cilindro:
          </label>
          <div className="flex space-x-4">
            <input
              type="number" // Mudado para type="number"
              name="cilindroDe"
              value={formData.cilindroDe}
              onChange={handleChange}
              className="bg-gray-100 px-4 py-2 rounded-lg text-black w-full"
              placeholder="De"
            />
            <input
              type="number" // Mudado para type="number"
              name="cilindroPara"
              value={formData.cilindroPara}
              onChange={handleChange}
              className="bg-gray-100 px-4 py-2 rounded-lg text-black w-full"
              placeholder="Para"
            />
          </div>
        </div>

        {/* Diâmetro */}
        <div className="space-y-4">
          <label className="text-lg font-semibold text-[#800080]">
            Diâmetro:
          </label>
          <div className="flex space-x-4">
            <input
              type="number" // Mudado para type="number"
              name="diametroDe"
              value={formData.diametroDe}
              onChange={handleChange}
              className="bg-gray-100 px-4 py-2 rounded-lg text-black w-full"
              placeholder="De"
            />
            <input
              type="number" // Mudado para type="number"
              name="diametroPara"
              value={formData.diametroPara}
              onChange={handleChange}
              className="bg-gray-100 px-4 py-2 rounded-lg text-black w-full"
              placeholder="Para"
            />
          </div>
        </div>

        {/* Adição */}
        <div className="space-y-4">
          <label className="text-lg font-semibold text-[#800080]">
            Adição:
          </label>
          <div className="flex space-x-4">
            <input
              type="number" // Mudado para type="number"
              name="adicaoDe"
              value={formData.adicaoDe}
              onChange={handleChange}
              className="bg-gray-100 px-4 py-2 rounded-lg text-black w-full"
              placeholder="De"
            />
            <input
              type="number" // Mudado para type="number"
              name="adicaoPara"
              value={formData.adicaoPara}
              onChange={handleChange}
              className="bg-gray-100 px-4 py-2 rounded-lg text-black w-full"
              placeholder="Para"
            />
          </div>
          <small className="text-[#800080]">
            Em caso de Visão Simples, não preencher.
          </small>
        </div>

        {/* Montagem */}
        <div className="space-y-4">
          <label className="text-lg font-semibold text-[#800080]">
            Montagem:
          </label>
          <div className="flex space-x-4">
            <input
              type="number" // Mudado para type="number"
              name="montagemDe"
              value={formData.montagemDe}
              onChange={handleChange}
              className="bg-gray-100 px-4 py-2 rounded-lg text-black w-full"
              placeholder="De"
            />
            <input
              type="number" // Mudado para type="number"
              name="montagemPara"
              value={formData.montagemPara}
              onChange={handleChange}
              className="bg-gray-100 px-4 py-2 rounded-lg text-black w-full"
              placeholder="Para"
            />
          </div>
          <small className="text-[#800080]">
            Em caso de Visão Simples, não preencher.
          </small>
        </div>

        {/* Corredores (seleção múltipla estilizada) */}
        <div className="space-y-4">
          <label className="text-lg font-semibold text-[#800080]">
            Corredores:
          </label>
          <div className="flex flex-wrap gap-2">
            {["14", "15", "16", "17", "18"].map((corredor) => (
              <button
                key={corredor}
                type="button"
                onClick={() => handleMultiSelect("corredor", corredor)}
                className={`px-4 py-2 rounded-lg border-2 ${
                  Array.isArray(formData.corredor) &&
                  formData.corredor.includes(corredor)
                    ? "bg-[#932A83] text-white border-[#932A83]"
                    : "bg-transparent text-[#932A83] border-[#932A83]"
                }`}
              >
                {corredor}
              </button>
            ))}
          </div>
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
                value={formData.custo_medio ? `${formData.custo_medio} R$` : ""} // Adiciona "R$" depois do valor
                readOnly // Campo de leitura
                className="w-full px-2 py-2 text-black bg-gray-100 focus:outline-none focus:border-[#800080] focus:ring-1 focus:ring-[#800080] rounded-lg"
                placeholder="Calculado automaticamente"
              />
            </div>
          </div>
        </div>
        {/* Input para definir a quantidade */}
        <div>
          <label className="block text-md font-bold text-[#800080]">
            Quantidade:
          </label>
          <input
            type="number"
            name="quantidade"
            value={formData.quantidade || ""}
            onChange={(e) => {
              const quantidade = parseInt(e.target.value, 10);
              setFormData({
                ...formData,
                quantidade: isNaN(quantidade) ? "" : quantidade,
              });
            }}
            className="bg-gray-100 px-4 py-2 rounded-lg text-black w-full mt-2"
            placeholder="Informe a quantidade"
          />
        </div>

        <div className="space-y-4">
          <label className="text-lg font-semibold text-[#800080]">
            Imagem:
          </label>
          <input
            type="file"
            name="imagem"
            accept="image/*"
            onChange={handleImageChange}
            className="bg-gray-100 px-4 py-2 rounded-lg text-black w-full"
          />
        </div>

        {/* Campo de CSOSN (102) */}
        <div>
          <label className="block text-md font-bold text-[#800080]">
            CSOSN (Dados fiscais):
          </label>
          <input
            type="text"
            name="CSOSN"
            value={formData.CSOSN || ""}
            onChange={(e) =>
              setFormData({ ...formData, CSOSN: e.target.value })
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
            name="CEST"
            value={formData.CEST || ""}
            onChange={(e) => setFormData({ ...formData, CEST: e.target.value })}
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

        {/* Campo de NCM */}
        <div>
          <label className="block text-md font-bold text-[#800080]">NCM:</label>
          <input
            type="text"
            name="ncm"
            value={formData.ncm || ""}
            onChange={(e) => setFormData({ ...formData, ncm: e.target.value })}
            className="bg-gray-100 px-4 py-2 rounded-lg text-black w-full mt-2"
            placeholder="Informe o NCM"
          />
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
            name="CFOP"
            value={formData.CFOP || ""}
            onChange={(e) => setFormData({ ...formData, CFOP: e.target.value })}
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

        {/* Botão de enviar */}
        <button
          onClick={handleSubmit}
          className={`bg-purple-700 text-white font-bold px-8 py-3 rounded-lg shadow ${
            isLoading || !formData.imagem ? "opacity-50 cursor-not-allowed" : ""
          }`}
          disabled={isLoading || !formData.imagem}
        >
          {isLoading ? "Enviando..." : "CONFIRMAR"}
        </button>
      </form>
    </Layout>
  );
}
export default function Page() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <FormularioLentes />
    </Suspense>
  );
}
