"use client";
import React, { Suspense, useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { doc, setDoc, getDocs, getDoc, collection, addDoc, query, where } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { firestore } from "../../../../lib/firebaseConfig";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FiPlus, FiChevronDown } from 'react-icons/fi';

const SelectWithAddOption = ({ label, options, value, onChange, collectionName, addNewOption, canAddNew = true }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [newItemValue, setNewItemValue] = useState("");
  const [showAddInput, setShowAddInput] = useState(false);


  const handleAddItem = async () => {
    if (!newItemValue.trim()) return;

    try {
      await addNewOption(newItemValue);
      setNewItemValue("");
      setShowAddInput(false);
    } catch (error) {
      console.error("Erro ao adicionar novo item:", error);
    }
  };

  return (
    <div className="space-y-2 relative">
      <h3 className="text-lg font-semibold text-[#81059e]">{label}:</h3>

      {!showAddInput ? (
        <div className="relative">
          <select
            value={value || ""}
            onChange={(e) => {
              if (e.target.value === "add_new") {
                setShowAddInput(true);
              } else {
                onChange(e.target.value);
              }
            }}
            className="bg-gray-100 w-full px-4 py-3 border-2 border-[#81059e] rounded-lg text-black focus:outline-none focus:border-[#81059e] focus:ring-1 focus:ring-[#81059e]"
          >
            <option value="">Selecione uma opção</option>
            {options.map((option) => (
              <option key={option} value={option}>
                {option ? (typeof option === 'object' ? option.nome : option.toUpperCase()) : ""}
              </option>
            ))}
            {canAddNew && <option value="add_new">+ ADICIONAR NOVO</option>}
          </select>
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
            <FiChevronDown className="text-[#81059e]" />
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newItemValue}
            onChange={(e) => setNewItemValue(e.target.value)}
            className="bg-gray-100 w-full px-4 py-3 border-2 border-[#81059e] rounded-lg text-black focus:outline-none focus:border-[#81059e] focus:ring-1 focus:ring-[#81059e]"
            placeholder={`Adicionar novo ${label.toLowerCase()}`}
          />
          <button
            type="button"
            onClick={handleAddItem}
            className="bg-[#81059e] text-white p-3 rounded-lg"
          >
            <FiPlus />
          </button>
          <button
            type="button"
            onClick={() => setShowAddInput(false)}
            className="border-2 border-[#81059e] text-[#81059e] p-3 rounded-lg"
          >
            Cancelar
          </button>
        </div>
      )}
    </div>
  );
};

export function FormularioLoja() {
  const searchParams = useSearchParams();
  const { userPermissions, userData } = useAuth();
  const [ncm, setNcm] = useState([]);
  const [selectedLoja, setSelectedLoja] = useState(null);

  const renderLojaName = (lojaId) => {
    const lojaNames = {
      'loja1': 'Loja 1 - Centro',
      'loja2': 'Loja 2 - Caramuru'
    };

    return lojaNames[lojaId] || lojaId;
  };

  const fetchCloneData = async (cloneId, loja) => {
    try {
      const collectionName =
        loja === "Loja 1" ? "loja1_armacoes" : "loja2_armacoes";
      const docRef = doc(firestore, collectionName, cloneId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        // Remova campos que não devem ser clonados, como o ID e a loja
        const { id, loja, ...clonedData } = data;
        setFormData((prevData) => ({
          ...prevData,
          ...clonedData,
        }));
      } else {
        console.error("Documento não encontrado");
      }
    } catch (error) {
      console.error("Erro ao buscar dados para clonar:", error);
    }
  };

  const router = useRouter();
  const [selectedLojas, setSelectedLojas] = useState([]);
  const [formData, setFormData] = useState({
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
    titulo: "", // Novo campo para título do produto
    subcategoria: "grau", // Substituição do campo categoria por subcategoria
    cor: "",
    formato: "",
    codigo: "",
    lente: "",
    ponte: "",
    haste: "",
    NCM: "",
    custo: "",
    valor: "",
    percentual_lucro: "",
    custo_medio: "",
    sku: "",
    quantidade: "",
    avaria: false,
    imagem: null,

    // Campos adicionais
    CEST: "",
    aliquota_icms: "",
    base_calculo_icms: "",
    aliquota_ipi: "",
    cst_ipi: "",
    base_calculo_ipi: "",
    cst_pis: "",
    cst_cofins: "",
    cfop: "",
    origem_produto: "",
    peso_bruto: "",
    peso_liquido: "",
    csosn: "",
  });

  // Definir loja inicial baseado nas permissões
  useEffect(() => {
    if (userPermissions) {
      // Se não for admin, usa a primeira loja que tem acesso
      if (!userPermissions.isAdmin && userPermissions.lojas.length > 0) {
        setSelectedLoja(userPermissions.lojas[0]);
        setSelectedLojas([renderLojaName(userPermissions.lojas[0])]);
      }
      // Se for admin, usa a primeira loja da lista
      else if (userPermissions.isAdmin && userPermissions.lojas.length > 0) {
        setSelectedLoja(userPermissions.lojas[0]);
      }
    }
  }, [userPermissions]);

  useEffect(() => {
    const cloneId = searchParams.get("cloneId");
    const loja = searchParams.get("loja");

    if (cloneId && loja) {
      fetchCloneData(cloneId, loja);
    }
  }, [searchParams]);

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
      // Tente a coleção original primeiro
      const ncmSnapshot = await getDocs(collection(firestore, "ncm"));

      // Se não houver dados, tente um caminho alternativo
      if (ncmSnapshot.empty) {
        console.log("Coleção NCM vazia, tentando caminho alternativo...");
        // Tente outro caminho que poderia conter os dados NCM
        const altNcmSnapshot = await getDocs(collection(firestore, "lojas/estoque/ncm"));

        if (!altNcmSnapshot.empty) {
          const ncmList = altNcmSnapshot.docs.map((doc) => {
            const data = doc.data();
            return data.codigo ? `${data.codigo} - ${data.descricao || ''}` : data.name || doc.id;
          });
          setNcm(ncmList);
          return;
        }

        // Se nenhum dado for encontrado, adicione alguns NCMs comuns para armações óticas como fallback
        const defaultNcms = [
          "9003.11.00 - Armações de plástico",
          "9003.19.10 - Armações de metais preciosos",
          "9003.19.90 - Armações de outros materiais",
          "9004.10.00 - Óculos de sol"
        ];
        setNcm(defaultNcms);
        console.log("Usando NCMs padrão como fallback");
      } else {
        // Se encontrou dados no caminho original
        const ncmList = ncmSnapshot.docs.map((doc) => {
          const data = doc.data();
          return data.codigo ? `${data.codigo} - ${data.descricao || ''}` : data.name || doc.id;
        });
        setNcm(ncmList);
      }
    } catch (error) {
      console.error("Erro ao buscar NCMs: ", error);
      // Adicione NCMs padrão como fallback em caso de erro
      const defaultNcms = [
        "9003.11.00 - Armações de plástico",
        "9003.19.10 - Armações de metais preciosos",
        "9003.19.90 - Armações de outros materiais",
        "9004.10.00 - Óculos de sol"
      ];
      setNcm(defaultNcms);
      console.log("Usando NCMs padrão devido a erro");
    }
  };

  const generateSKU = () => {
    const randomPart = Math.floor(Math.random() * 10000);
    const productCode = formData.codigo || generateRandomCode();
    const productName = formData.titulo
      ? formData.titulo.substring(0, 3).toUpperCase()
      : "AMC";

    return `${productName}-${productCode}-${randomPart}`;
  };

  // Atualiza o SKU automaticamente quando o código ou nome do produto muda
  useEffect(() => {
    const sku = generateSKU();
    setFormData((prevData) => ({
      ...prevData,
      sku: sku,
    }));
  }, [formData.codigo, formData.titulo]);

  useEffect(() => {
    if (router.state?.formData) {
      setFormData(router.state.formData);
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
    const formattedDate = now.toLocaleDateString("pt-BR", options);
    const formattedTime = now.toTimeString().split(":").slice(0, 2).join(":");

    // Transformando a data no formato compatível com o input date (YYYY-MM-DD)
    const [day, month, year] = formattedDate.split("/");
    const date = `${year}-${month}-${day}`;

    setFormData((prevData) => ({
      ...prevData,
      data: date,
      hora: formattedTime,
    }));
  }, []);

  // Funções para adicionar novos itens às coleções
  const addNewItem = async (collectionName, value) => {
    if (!selectedLoja && selectedLojas.length === 0) {
      alert("Selecione uma loja antes de adicionar novos itens!");
      return;
    }

    try {
      // Determinar a loja para salvar
      const lojaToUse = selectedLoja ||
        (selectedLojas[0]?.includes("Loja 1") ? "loja1" :
          selectedLojas[0]?.includes("Loja 2") ? "loja2" : "loja1");

      // Salva na estrutura específica do estoque da loja
      const lojaPath = `lojas/estoque/${lojaToUse}/armacoes/${collectionName}`;
      const lojaItemRef = doc(firestore, lojaPath, value.toLowerCase().replace(/\s+/g, '_'));

      await setDoc(lojaItemRef, {
        name: value,
        createdAt: new Date(),
        addedBy: userData?.nome || 'Sistema'
      });
      // Atualizar a lista correspondente
      switch (collectionName) {
        case "armacoes_fabricantes":
          setFabricantes([...fabricantes, value]);
          break;
        case "fornecedores":
          setFornecedores([...fornecedores, value]);
          break;
        case "armacoes_marcas":
          setMarcas([...marcas, value]);
          break;
        case "armacoes_formatos":
          setFormatos([...formatos, value]);
          break;
        case "armacoes_aros":
          setAros([...aros, value]);
          break;
        case "armacoes_materiais":
          setMateriais([...materiais, value]);
          break;
        case "armacoes_cores":
          setCores([...cores, value]);
          break;
        case "armacoes_unidades":
          setUnidades([...unidades, value]);
          break;
        default:
          break;
      }

      // Se o item adicionado corresponder ao campo atual, atualizar o formData
      if (collectionName === "armacoes_fabricantes") setFormData(prev => ({ ...prev, fabricante: value }));
      if (collectionName === "fornecedores") setFormData(prev => ({ ...prev, fornecedor: value }));
      if (collectionName === "armacoes_marcas") setFormData(prev => ({ ...prev, marca: value }));
      if (collectionName === "armacoes_formatos") setFormData(prev => ({ ...prev, formato: value }));
      if (collectionName === "armacoes_aros") setFormData(prev => ({ ...prev, aro: value }));
      if (collectionName === "armacoes_materiais") setFormData(prev => ({ ...prev, material: value }));
      if (collectionName === "armacoes_cores") setFormData(prev => ({ ...prev, cor: value }));
      if (collectionName === "armacoes_unidades") setFormData(prev => ({ ...prev, unidade: value }));

      alert(`${value} adicionado com sucesso!`);
    } catch (error) {
      console.error(`Erro ao adicionar ${value} à coleção ${collectionName}:`, error);
      alert(`Erro ao adicionar ${value}`);
    }
  };

  // Função para adicionar novos valores numéricos às coleções
  const addNewValueItem = async (collectionName, value) => {
    if (!selectedLoja && selectedLojas.length === 0) {
      alert("Selecione uma loja antes de adicionar novos itens!");
      return;
    }
    try {
      // Determinar a loja para salvar
      const lojaToUse = selectedLoja ||
        (selectedLojas[0]?.includes("Loja 1") ? "loja1" :
          selectedLojas[0]?.includes("Loja 2") ? "loja2" : "loja1");

      // Salva na estrutura específica do estoque da loja
      const lojaPath = `lojas/estoque/${lojaToUse}/armacoes/${collectionName}`;
      const lojaItemRef = doc(firestore, lojaPath, value.toString().replace(/\./g, '_'));

      await setDoc(lojaItemRef, {
        value: value,
        createdAt: new Date(),
        addedBy: userData?.nome || 'Sistema'
      });

      // Atualizar a lista correspondente
      switch (collectionName) {
        case "armacoes_hastes":
          setHastes([...hastes, value]);
          break;
        case "armacoes_largura_lentes":
          setLentes([...lentes, value]);
          break;
        case "armacoes_pontes":
          setPontes([...pontes, value]);
          break;
        default:
          break;
      }

      // Se o item adicionado corresponder ao campo atual, atualizar o formData
      if (collectionName === "armacoes_hastes") setFormData(prev => ({ ...prev, haste: value }));
      if (collectionName === "armacoes_largura_lentes") setFormData(prev => ({ ...prev, lente: value }));
      if (collectionName === "armacoes_pontes") setFormData(prev => ({ ...prev, ponte: value }));

      alert(`${value} adicionado com sucesso!`);
    } catch (error) {
      console.error(`Erro ao adicionar ${value} à coleção ${collectionName}:`, error);
      alert(`Erro ao adicionar ${value}`);
    }
  };

  // Funções para buscar dados
  const fetchAros = async () => {
    try {
      const arosSnapshot = await getDocs(collection(firestore, "armacoes_aros"));
      const arosList = arosSnapshot.docs.map((doc) => doc.data().name);
      setAros(arosList);
    } catch (error) {
      console.error("Erro ao buscar aros:", error);
    }
  };

  const fetchCores = async () => {
    try {
      const corSnapshot = await getDocs(collection(firestore, "armacoes_cores"));
      const corList = corSnapshot.docs.map((doc) => doc.data().name);
      setCores(corList);
    } catch (error) {
      console.error("Erro ao buscar cores:", error);
    }
  };

  const fetchFabricantes = async () => {
    try {
      const fabricantesSnapshot = await getDocs(collection(firestore, "armacoes_fabricantes"));
      const fabricantesList = fabricantesSnapshot.docs.map(
        (doc) => doc.data().name
      );
      setFabricantes(fabricantesList);
    } catch (error) {
      console.error("Erro ao buscar fabricantes:", error);
    }
  };

  const fetchHastes = async () => {
    try {
      const hasteSnapshot = await getDocs(collection(firestore, "armacoes_hastes"));
      const hasteList = hasteSnapshot.docs.map((doc) => doc.data().value);
      setHastes(hasteList);
    } catch (error) {
      console.error("Erro ao buscar hastes:", error);
    }
  };

  const fetchLentes = async () => {
    try {
      const lenteSnapshot = await getDocs(collection(firestore, "armacoes_largura_lentes"));
      const lentesList = lenteSnapshot.docs.map((doc) => doc.data().value);
      setLentes(lentesList);
    } catch (error) {
      console.error("Erro ao buscar lentes:", error);
    }
  };

  const fetchMarcas = async () => {
    try {
      const marcasSnapshot = await getDocs(collection(firestore, "armacoes_marcas"));
      const marcasList = marcasSnapshot.docs.map((doc) => doc.data().name);
      setMarcas(marcasList);
    } catch (error) {
      console.error("Erro ao buscar marcas:", error);
    }
  };

  const fetchMateriais = async () => {
    try {
      const materiaisSnapshot = await getDocs(collection(firestore, "armacoes_materiais"));
      const materiaisList = materiaisSnapshot.docs.map((doc) => doc.data().name);
      setMateriais(materiaisList);
    } catch (error) {
      console.error("Erro ao buscar materiais:", error);
    }
  };

  const fetchPontes = async () => {
    try {
      const pontesSnapshot = await getDocs(collection(firestore, "armacoes_pontes"));
      const ponteList = pontesSnapshot.docs.map((doc) => doc.data().value);
      setPontes(ponteList);
    } catch (error) {
      console.error("Erro ao buscar pontes:", error);
    }
  };

  const fetchFormatos = async () => {
    try {
      const formatosSnapshot = await getDocs(collection(firestore, "armacoes_formatos"));
      const formatosList = formatosSnapshot.docs.map((doc) => doc.data().name);
      setFormatos(formatosList);
    } catch (error) {
      console.error("Erro ao buscar formatos:", error);
    }
  };

  // Nova função para buscar fornecedores da estrutura correta do banco
  const fetchFornecedores = async () => {
    try {
      // Busca fornecedores no caminho correto conforme estrutura do banco
      const fornecedoresSnapshot = await getDocs(collection(firestore, "lojas/fornecedores/users"));
      const fornecedoresList = fornecedoresSnapshot.docs.map((doc) => {
        const data = doc.data();
        const nomeFantasia = data.nomeFantasia || "";
        const razaoSocial = data.razaoSocial || "";
        const representante = data.representante || "";

        // Se nome fantasia e razão social forem similares
        if (nomeFantasia && razaoSocial && nomeFantasia.trim() === razaoSocial.trim()) {
          return {
            id: doc.id,
            nome: representante ? `${nomeFantasia} - ${representante}` : nomeFantasia
          };
        }

        // Caso padrão: mostrar ambos
        return {
          id: doc.id,
          nome: razaoSocial ? `${nomeFantasia} (${razaoSocial})` : nomeFantasia
        };
      });
      setFornecedores(fornecedoresList);
    } catch (error) {
      console.error("Erro ao buscar fornecedores:", error);
    }
  };

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

  const [unidades, setUnidades] = useState([]);

  const fetchUnidades = async () => {
    try {
      const unidadesSnapshot = await getDocs(collection(firestore, "armacoes_unidades"));
      const unidadesList = unidadesSnapshot.docs.map((doc) => doc.data().name);
      setUnidades(unidadesList);
    } catch (error) {
      console.error("Erro ao buscar unidades:", error);
    }
  };

  // Função para tratar mudanças nos inputs do formulário
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => {
      const updatedData = {
        ...prevData,
        [name]: value,
      };

      // Nova lógica: se o percentual de lucro ou custo mudar, recalcula o valor de venda
      if (name === "percentual_lucro" && updatedData.custo) {
        const valorCusto = parseFloat(updatedData.custo);
        const percentualLucro = parseFloat(value);

        if (valorCusto > 0 && !isNaN(percentualLucro)) {
          // Calcula o valor de venda baseado no percentual de lucro
          const valorVenda = valorCusto * (1 + (percentualLucro / 100));
          updatedData.valor = valorVenda.toFixed(2);

          // Calcula o custo médio (média simples)
          const custoMedio = (valorCusto + valorVenda) / 2;
          updatedData.custo_medio = custoMedio.toFixed(2);
        }
      } else if (name === "custo" && updatedData.percentual_lucro) {
        // Se o custo for alterado, recalcula o valor com base no percentual já definido
        const valorCusto = parseFloat(value);
        const percentualLucro = parseFloat(updatedData.percentual_lucro);

        if (valorCusto > 0 && !isNaN(percentualLucro)) {
          // Calcula o valor de venda baseado no percentual de lucro
          const valorVenda = valorCusto * (1 + (percentualLucro / 100));
          updatedData.valor = valorVenda.toFixed(2);

          // Calcula o custo médio (média simples)
          const custoMedio = (valorCusto + valorVenda) / 2;
          updatedData.custo_medio = custoMedio.toFixed(2);
        }
      } else if (name === "valor" && updatedData.custo) {
        // Se o usuário preferir definir o valor diretamente, recalculamos o percentual
        const valorCusto = parseFloat(updatedData.custo);
        const valorVenda = parseFloat(value);

        if (valorCusto > 0 && valorVenda > 0) {
          // Calcula o percentual de lucro
          const percentualLucro = ((valorVenda - valorCusto) / valorCusto) * 100;
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
      titulo: "", // Limpa o campo de título
      percentual_lucro: "", // Limpa o percentual de lucro
      quantidade: "",
      imagem: null,
      codigoBarras: "",
      codigoFabricante: "",
      unidade: "",
      CEST: "",
      aliquota_icms: "",
      base_calculo_icms: "",
      aliquota_ipi: "",
      cst_ipi: "",
      base_calculo_ipi: "",
      cst_pis: "",
      cst_cofins: "",
      cfop: "",
      origem_produto: "",
      peso_bruto: "",
      peso_liquido: "",
      csosn: "",
      subcategoria: "grau", // Reset para o valor padrão da subcategoria
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

  // Função para enviar os dados para o Firestore
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
  
    if (selectedLojas.length === 0) {
      alert("Selecione ao menos uma loja antes de enviar o formulário");
      setIsLoading(false);
      return;
    }
  
    // Verificar se o título do produto foi preenchido
    if (!formData.titulo || formData.titulo.trim() === "") {
      alert("O título do produto é obrigatório");
      setIsLoading(false);
      return;
    }
  
    // Garantir que o SKU está presente antes de prosseguir
    let updatedFormData = { ...formData };
    if (!formData.sku) {
      const generatedSKU = generateSKU();
      updatedFormData = {
        ...updatedFormData,
        sku: generatedSKU,
      };
    }
  
    try {
      // Se houver uma imagem, faz o upload e obtém a URL
      let imageUrl = "";
      if (updatedFormData.imagem) {
        imageUrl = await handleImageUpload(updatedFormData.imagem);
      }
  
      // Cria o objeto com os dados do formulário e a URL da imagem
      const productData = {
        ...updatedFormData,
        imagem: imageUrl,
        categoria: "armacao", // Categoria fixa
        subcategoria: updatedFormData.subcategoria || "grau", // Subcategoria
        avaria: updatedFormData.avaria || false,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: userData?.nome || 'Sistema'
      };
  
      // Para cada loja selecionada, salvar o produto na estrutura correta
      for (const loja of selectedLojas) {
        // Converter o nome da loja para o ID usado no Firebase
        const lojaId = loja.includes("Loja 1") ? "loja1" :
          loja.includes("Loja 2") ? "loja2" : loja.toLowerCase().replace(/\s+/g, '');
  
        // Caminho para o documento do produto na estrutura correta do estoque
        const docRef = doc(
          firestore,
          `lojas/estoque/${lojaId}/armacoes`,
          updatedFormData.codigo // Usa o código do produto como ID
        );
  
        await setDoc(docRef, productData);
  
        console.log(`Produto salvo no estoque da ${loja}:`, productData);
      }
  
      // Também salva uma cópia na temp_image para compatibilidade com a página de confirmação
      const tempRef = doc(firestore, "temp_image", updatedFormData.codigo);
      await setDoc(tempRef, {
        ...productData,
        lojas: selectedLojas // Incluir lojas na cópia temporária
      });
  
      router.push(
        `/products_and_services/frames/confirm?formData=${encodeURIComponent(
          JSON.stringify({ ...productData, lojas: selectedLojas })
        )}`
      );
    } catch (error) {
      console.error("Erro ao enviar os dados:", error);
      alert(`Erro ao salvar o produto: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <Layout>
        <div className="w-full max-w-5xl mx-auto rounded-lg">
          <h2 className="text-3xl font-bold text-[#81059e] mb-8 mt-8 text-center">ADICIONAR ARMAÇÃO</h2>

          {/* Seletor de Loja para Admins */}
          {userPermissions?.isAdmin && (
            <div className="mb-6">
              <label className="text-[#81059e] font-medium">
                Selecionar Loja
              </label>
              <select
                value={selectedLoja || ''}
                onChange={(e) => {
                  setSelectedLoja(e.target.value);
                  if (e.target.value === "ambas") {
                    setSelectedLojas(["Loja 1", "Loja 2"]);
                  } else {
                    setSelectedLojas([renderLojaName(e.target.value)]);
                  }
                }}
                className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black mt-1"
              >
                <option value="">Selecione uma loja</option>
                {userPermissions.lojas.map((loja) => (
                  <option key={loja} value={loja}>
                    {renderLojaName(loja)}
                  </option>
                ))}
                <option value="ambas">AMBAS AS LOJAS</option>
              </select>
            </div>
          )}

          <div className='space-x-2 mb-6'>
            <Link href="/products_and_services/frames">
              <button className="bg-[#81059e] p-3 rounded-sm text-white">
                ARMAÇÕES REGISTRADAS
              </button>
            </Link>
            <button
              onClick={handleClearSelection}
              className="text-[#81059e] px-4 py-2 border-2 border-[#81059e] font-bold text-base rounded-sm"
            >
              Limpar
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 mb-20">
            <div className="p-4 bg-gray-50 rounded-lg mb-6">
              <h3 className="text-lg font-semibold text-[#81059e] mb-4">Informações Básicas</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Título do Produto - NOVO CAMPO */}
                <div>
                  <label className="text-[#81059e] font-medium">Título do Produto</label>
                  <input
                    type="text"
                    id="titulo"
                    name="titulo"
                    value={formData.titulo || ""}
                    onChange={handleChange}
                    className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black"
                    placeholder="Ex: Armação Ray-Ban Wayfarer"
                    required
                  />
                </div>

                {/* SKU */}
                <div>
                  <label className="text-[#81059e] font-medium">SKU</label>
                  <input
                    type="text"
                    id="sku"
                    name="sku"
                    value={formData.sku}
                    readOnly
                    className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black bg-gray-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                {/* Data */}
                <div>
                  <label className="text-[#81059e] font-medium">Data</label>
                  <input
                    type="date"
                    name="data"
                    value={formData.data}
                    onChange={handleChange}
                    className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black"
                  />
                </div>

                {/* Subcategoria - SUBSTITUI O CAMPO CATEGORIA */}
                <div>
                  <label className="text-[#81059e] font-medium">Tipo de Armação</label>
                  <select
                    name="subcategoria"
                    value={formData.subcategoria}
                    onChange={handleChange}
                    className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black"
                  >
                    <option value="grau">Armação de Grau</option>
                    <option value="solar">Óculos Solar</option>
                    <option value="clip-on">Armação com Clip-on</option>
                    <option value="infantil">Armação Infantil</option>
                    <option value="esportiva">Armação Esportiva</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                {/* Código de Barras */}
                <div>
                  <label className="text-[#81059e] font-medium">Código de Barras</label>
                  <input
                    type="text"
                    name="codigoBarras"
                    value={formData.codigoBarras || ""}
                    onChange={(e) => setFormData({ ...formData, codigoBarras: e.target.value })}
                    className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black"
                    required
                  />
                </div>

                {/* Código do Fabricante */}
                <div>
                  <label className="text-[#81059e] font-medium">Código do Fabricante</label>
                  <input
                    type="text"
                    name="codigoFabricante"
                    value={formData.codigoFabricante || ""}
                    onChange={(e) => setFormData({ ...formData, codigoFabricante: e.target.value })}
                    className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-1 gap-6 mt-4">
                {/* Código do Produto */}
                <div>
                  <label className="text-[#81059e] font-medium">Código do Produto</label>
                  <input
                    type="text"
                    name="codigo"
                    value={formData.codigo || ""}
                    onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                    className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Seção Características do Produto */}
            <div className="p-4 bg-gray-50 rounded-lg mb-6">
              <h3 className="text-lg font-semibold text-[#81059e] mb-4">Características do Produto</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Fabricante com opção de adicionar */}
                <SelectWithAddOption
                  label="Fabricante"
                  options={fabricantes}
                  value={formData.fabricante}
                  onChange={(value) => setFormData({ ...formData, fabricante: value })}
                  addNewOption={(value) => addNewItem("armacoes_fabricantes", value)}
                />

                {/* Fornecedor - Agora sem opção de adicionar */}
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-[#81059e]">Fornecedor:</h3>
                  <select
                    value={formData.fornecedor || ""}
                    onChange={(e) => setFormData({ ...formData, fornecedor: e.target.value })}
                    className="bg-gray-100 w-full px-4 py-3 border-2 border-[#81059e] rounded-lg text-black focus:outline-none focus:border-[#81059e] focus:ring-1 focus:ring-[#81059e]"
                  >
                    <option value="">Selecione um fornecedor</option>
                    {fornecedores.map((fornecedor) => (
                      <option key={fornecedor.id} value={fornecedor.nome}>
                        {fornecedor.nome.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                {/* Marca com opção de adicionar */}
                <SelectWithAddOption
                  label="Marca"
                  options={marcas}
                  value={formData.marca}
                  onChange={(value) => setFormData({ ...formData, marca: value })}
                  addNewOption={(value) => addNewItem("armacoes_marcas", value)}
                />

                {/* Gênero */}
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-[#81059e]">Gênero:</h3>
                  <select
                    name="genero"
                    value={formData.genero || ""}
                    onChange={(e) => setFormData({ ...formData, genero: e.target.value })}
                    className="bg-gray-100 w-full px-4 py-3 border-2 border-[#81059e] rounded-lg text-black focus:outline-none focus:border-[#81059e] focus:ring-1 focus:ring-[#81059e]"
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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                {/* Formato com opção de adicionar */}
                <SelectWithAddOption
                  label="Formato"
                  options={formatos}
                  value={formData.formato}
                  onChange={(value) => setFormData({ ...formData, formato: value })}
                  addNewOption={(value) => addNewItem("armacoes_formatos", value)}
                />

                {/* Cor com opção de adicionar */}
                <SelectWithAddOption
                  label="Cor"
                  options={cores}
                  value={formData.cor}
                  onChange={(value) => setFormData({ ...formData, cor: value })}
                  addNewOption={(value) => addNewItem("armacoes_cores", value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                {/* Material com opção de adicionar */}
                <SelectWithAddOption
                  label="Material"
                  options={materiais}
                  value={formData.material}
                  onChange={(value) => setFormData({ ...formData, material: value })}
                  addNewOption={(value) => addNewItem("armacoes_materiais", value)}
                />

                {/* Aro com opção de adicionar */}
                <SelectWithAddOption
                  label="Aro"
                  options={aros}
                  value={formData.aro}
                  onChange={(value) => setFormData({ ...formData, aro: value })}
                  addNewOption={(value) => addNewItem("armacoes_aros", value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                {/* Ponte com opção de adicionar */}
                <SelectWithAddOption
                  label="Ponte"
                  options={pontes}
                  value={formData.ponte}
                  onChange={(value) => setFormData({ ...formData, ponte: value })}
                  addNewOption={(value) => addNewValueItem("armacoes_pontes", value)}
                />

                {/* Haste com opção de adicionar */}
                <SelectWithAddOption
                  label="Haste"
                  options={hastes}
                  value={formData.haste}
                  onChange={(value) => setFormData({ ...formData, haste: value })}
                  addNewOption={(value) => addNewValueItem("armacoes_hastes", value)}
                />

                {/* Lente com opção de adicionar */}
                <SelectWithAddOption
                  label="Lente"
                  options={lentes}
                  value={formData.lente}
                  onChange={(value) => setFormData({ ...formData, lente: value })}
                  addNewOption={(value) => addNewValueItem("armacoes_largura_lentes", value)}
                />
              </div>
            </div>

            {/* Seção Valores - MODIFICADA PARA CALCULAR PREÇO A PARTIR DO PERCENTUAL */}
            <div className="p-4 bg-gray-50 rounded-lg mb-6">
              <h3 className="text-lg font-semibold text-[#81059e] mb-4">Valores</h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Custo */}
                <div>
                  <label className="text-[#81059e] font-medium">Custo (R$)</label>
                  <div className="flex items-center border-2 border-[#81059e] rounded-lg">
                    <span className="px-2 text-gray-400">R$</span>
                    <input
                      type="number"
                      name="custo"
                      value={formData.custo}
                      onChange={handleChange}
                      placeholder="0,00"
                      className="w-full px-2 py-3 text-black focus:outline-none focus:border-[#81059e] focus:ring-1 focus:ring-[#81059e] rounded-lg"
                      required
                    />
                  </div>
                </div>

                {/* Percentual de Lucro - CAMPO MODIFICADO */}
                <div>
                  <label className="text-[#81059e] font-medium">Percentual de Lucro (%)</label>
                  <div className="flex items-center border-2 border-[#81059e] rounded-lg">
                    <input
                      type="number"
                      id="percentual_lucro"
                      name="percentual_lucro"
                      value={formData.percentual_lucro}
                      onChange={handleChange}
                      placeholder="0,00"
                      className="w-full px-2 py-3 text-black focus:outline-none focus:border-[#81059e] focus:ring-1 focus:ring-[#81059e] rounded-lg"
                      required
                    />
                    <span className="px-2 text-gray-400">%</span>
                  </div>
                </div>

                {/* Valor de Venda - AGORA CALCULADO AUTOMATICAMENTE */}
                <div>
                  <label className="text-[#81059e] font-medium">Valor de Venda (R$)</label>
                  <div className="flex items-center border-2 border-[#81059e] rounded-lg">
                    <span className="px-2 text-gray-400">R$</span>
                    <input
                      type="number"
                      name="valor"
                      value={formData.valor}
                      onChange={handleChange}
                      placeholder="0,00"
                      className="w-full px-2 py-3 text-black focus:outline-none focus:border-[#81059e] focus:ring-1 focus:ring-[#81059e] rounded-lg"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                {/* Custo Médio */}
                <div>
                  <label className="text-[#81059e] font-medium">Custo Médio (R$)</label>
                  <input
                    type="text"
                    id="custo_medio"
                    name="custo_medio"
                    value={formData.custo_medio || ""}
                    readOnly
                    className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black bg-gray-100"
                    placeholder="Calculado automaticamente"
                  />
                </div>

                {/* Quantidade */}
                <div>
                  <label className="text-[#81059e] font-medium">Quantidade</label>
                  <input
                    type="number"
                    name="quantidade"
                    value={formData.quantidade || ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value > 0) {
                        setFormData({ ...formData, quantidade: value });
                      }
                    }}
                    min="1"
                    className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black"
                    required
                  />
                </div>
              </div>

              {/* Unidade com opção de adicionar */}
              <div className="mt-4">
                <SelectWithAddOption
                  label="Unidade"
                  options={unidades}
                  value={formData.unidade}
                  onChange={(value) => setFormData({ ...formData, unidade: value })}
                  addNewOption={(value) => addNewItem("armacoes_unidades", value)}
                />
              </div>
            </div>


            {/* Seção Fiscal */}
            <div className="p-4 bg-gray-50 rounded-lg mb-6">
              <h3 className="text-lg font-semibold text-[#81059e] mb-4">Informações Fiscais</h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* NCM */}
                <div>
                  <SelectWithAddOption
                    label="NCM"
                    options={ncm}
                    value={formData.NCM}
                    onChange={(value) => setFormData({ ...formData, NCM: value })}
                    addNewOption={(value) => addNewItem("ncm", value)}
                  />
                </div>

                {/* CEST */}
                <div>
                  <label className="text-[#81059e] font-medium">CEST</label>
                  <input
                    type="text"
                    name="CEST"
                    value={formData.CEST || ""}
                    onChange={(e) => setFormData({ ...formData, CEST: e.target.value })}
                    className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black"
                    required
                  />
                </div>

                {/* CSOSN */}
                <div>
                  <label className="text-[#81059e] font-medium">CSOSN</label>
                  <input
                    type="text"
                    name="csosn"
                    value={formData.csosn || ""}
                    onChange={(e) => setFormData({ ...formData, csosn: e.target.value })}
                    className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                {/* CFOP */}
                <div>
                  <label className="text-[#81059e] font-medium">CFOP</label>
                  <input
                    type="text"
                    name="cfop"
                    value={formData.cfop || ""}
                    onChange={(e) => setFormData({ ...formData, cfop: e.target.value })}
                    className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black"
                    required
                  />
                </div>

                {/* Origem do Produto */}
                <div>
                  <label className="text-[#81059e] font-medium">Origem do Produto</label>
                  <input
                    type="text"
                    name="origem_produto"
                    value={formData.origem_produto || ""}
                    onChange={(e) => setFormData({ ...formData, origem_produto: e.target.value })}
                    className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                {/* Alíquota ICMS */}
                <div>
                  <label className="text-[#81059e] font-medium">Alíquota ICMS (%)</label>
                  <input
                    type="text"
                    name="aliquota_icms"
                    value={formData.aliquota_icms || ""}
                    onChange={(e) => setFormData({ ...formData, aliquota_icms: e.target.value })}
                    className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black"
                    required
                  />
                </div>

                {/* Base de Cálculo ICMS */}
                <div>
                  <label className="text-[#81059e] font-medium">Base de Cálculo ICMS</label>
                  <input
                    type="text"
                    name="base_calculo_icms"
                    value={formData.base_calculo_icms || ""}
                    onChange={(e) => setFormData({ ...formData, base_calculo_icms: e.target.value })}
                    className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black"
                    required
                  />
                </div>

                {/* CST PIS */}
                <div>
                  <label className="text-[#81059e] font-medium">CST PIS</label>
                  <input
                    type="text"
                    name="cst_pis"
                    value={formData.cst_pis || ""}
                    onChange={(e) => setFormData({ ...formData, cst_pis: e.target.value })}
                    className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                {/* CST COFINS */}
                <div>
                  <label className="text-[#81059e] font-medium">CST COFINS</label>
                  <input
                    type="text"
                    name="cst_cofins"
                    value={formData.cst_cofins || ""}
                    onChange={(e) => setFormData({ ...formData, cst_cofins: e.target.value })}
                    className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black"
                    required
                  />
                </div>

                {/* Alíquota IPI */}
                <div>
                  <label className="text-[#81059e] font-medium">Alíquota IPI (%)</label>
                  <input
                    type="text"
                    name="aliquota_ipi"
                    value={formData.aliquota_ipi || ""}
                    onChange={(e) => setFormData({ ...formData, aliquota_ipi: e.target.value })}
                    className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black"
                    required
                  />
                </div>

                {/* CST IPI */}
                <div>
                  <label className="text-[#81059e] font-medium">CST IPI</label>
                  <input
                    type="text"
                    name="cst_ipi"
                    value={formData.cst_ipi || ""}
                    onChange={(e) => setFormData({ ...formData, cst_ipi: e.target.value })}
                    className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                {/* Base de Cálculo IPI */}
                <div>
                  <label className="text-[#81059e] font-medium">Base de Cálculo IPI</label>
                  <input
                    type="text"
                    name="base_calculo_ipi"
                    value={formData.base_calculo_ipi || ""}
                    onChange={(e) => setFormData({ ...formData, base_calculo_ipi: e.target.value })}
                    className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black"
                    required
                  />
                </div>

                {/* Peso Bruto */}
                <div>
                  <label className="text-[#81059e] font-medium">Peso Bruto</label>
                  <input
                    type="text"
                    name="peso_bruto"
                    value={formData.peso_bruto || ""}
                    onChange={(e) => setFormData({ ...formData, peso_bruto: e.target.value })}
                    className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black"
                    required
                  />
                </div>

                {/* Peso Líquido */}
                <div>
                  <label className="text-[#81059e] font-medium">Peso Líquido</label>
                  <input
                    type="text"
                    name="peso_liquido"
                    value={formData.peso_liquido || ""}
                    onChange={(e) => setFormData({ ...formData, peso_liquido: e.target.value })}
                    className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Seção Imagem */}
            <div className="p-4 bg-gray-50 rounded-lg mb-6">
              <h3 className="text-lg font-semibold text-[#81059e] mb-4">Imagem do Produto</h3>

              <input
                type="file"
                name="imagem"
                accept="image/*"
                onChange={(e) => setFormData({ ...formData, imagem: e.target.files[0] })}
                className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black bg-gray-100"
                required
              />
            </div>

            {/* Botões de ação */}
            <div className="flex justify-center gap-4 mt-8">
              <button
                type="submit"
                className="bg-[#81059e] p-3 px-6 rounded-sm text-white flex items-center gap-2"
                disabled={isLoading || !formData.imagem}
              >
                {isLoading ? 'PROCESSANDO...' : 'CONFIRMAR'}
              </button>
              <button
                type="button"
                onClick={handleClearSelection}
                className="border-2 border-[#81059e] p-3 px-6 rounded-sm text-[#81059e] flex items-center gap-2"
                disabled={isLoading}
              >
                CANCELAR
              </button>
            </div>
          </form>
        </div>

        {showSuccessPopup && (
          <div className="fixed bottom-4 right-4 bg-green-500 text-white p-4 rounded-lg shadow-lg">
            <p>Produto enviado com sucesso!</p>
          </div>
        )}
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