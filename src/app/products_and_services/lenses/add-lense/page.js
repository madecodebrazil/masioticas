"use client";
import React, { Suspense, useEffect, useState } from "react";
import Layout from "@/components/Layout";
import Link from "next/link";
import { collection, setDoc, doc, getDoc, getDocs, addDoc } from "firebase/firestore";
import { firestore } from "../../../../lib/firebaseConfig";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { FiPlus, FiChevronDown } from 'react-icons/fi';

// Componente SelectWithAddOption reutilizável
const SelectWithAddOption = ({ label, options, value, onChange, collectionName, addNewOption }) => {
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
                {option ? option.toUpperCase() : ""}
              </option>
            ))}
            <option value="add_new">+ ADICIONAR NOVO</option>
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

// Componente para o SelectWithAddOption para valores numéricos
const SelectWithAddNumericOption = ({ label, options, value, onChange, collectionName, addNewOption }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [newItemValue, setNewItemValue] = useState("");
  const [showAddInput, setShowAddInput] = useState(false);

  const handleAddItem = async () => {
    if (!newItemValue.trim()) return;

    try {
      const numericValue = parseFloat(newItemValue);
      if (isNaN(numericValue)) {
        alert("Por favor, insira um valor numérico válido.");
        return;
      }

      await addNewOption(numericValue);
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
                {option}
              </option>
            ))}
            <option value="add_new">+ ADICIONAR NOVO</option>
          </select>
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
            <FiChevronDown className="text-[#81059e]" />
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <input
            type="number"
            step="0.01"
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

export function FormularioLentes() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { userPermissions, userData } = useAuth();
  const [selectedLoja, setSelectedLoja] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  const [fornecedores, setFornecedores] = useState([]);
  const [fabricantes, setFabricantes] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [tipos, setTipos] = useState([]);
  const [designs, setDesigns] = useState([]);
  const [indicies, setIndicies] = useState([]);
  const [materiais, setMateriais] = useState([]);
  const [tecnologias, setTecnologias] = useState([]);
  const [tiposTratamentos, setTipoTratamentos] = useState([]);
  const [familias, setFamilias] = useState([]);
  const [filteredFamilias, setFilteredFamilias] = useState([]);
  const [ncmList, setNCMs] = useState([]);
  const [unidades, setUnidades] = useState([]);
  const [selectedLojas, setSelectedLojas] = useState([]);

  const [formData, setFormData] = useState({
    sku: "",
    unidade: "",
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
    CEST: "",
    CSOSN: "",
    aliquota_icms: "",
    base_calculo_icms: "",
    cfop: "",
    custo: 0,
    valor: 0,
    quantidade: 0,
    percentual_lucro: 0,
    custo_medio: 0,
    imagem: null,
    aliquota_ipi: "",
    cst_ipi: "",
    base_calculo_ipi: "",
    cst_pis: "",
    cst_cofins: "",
    origem_produto: "",
    peso_bruto: "",
    peso_liquido: "",
  });

  // Configuração inicial com base nas permissões de usuário
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

  // Função para buscar dados do produto a ser clonado
  const fetchCloneData = async (cloneId, loja) => {
    try {
      const collectionName = loja === "loja1" ? "loja1_lentes" : "loja2_lentes";
      const docRef = doc(firestore, collectionName, cloneId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        // Remover campos que não devem ser clonados
        const { id, data: dataField, hora, imagem, lojas, ...clonedData } = data;

        // Atualizar data e hora para os valores atuais
        const currentDate = new Date();
        const formattedDate = currentDate.toISOString().split("T")[0];
        const formattedTime = currentDate.toTimeString().split(" ")[0].slice(0, 5);

        setFormData({
          ...formData,
          ...clonedData,
          data: formattedDate,
          hora: formattedTime,
          imagem: null,
        });

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

  // Verificar parâmetros de URL ao carregar
  useEffect(() => {
    const params = {};
    searchParams.forEach((value, key) => {
      params[key] = value;
    });

    const cloneId = searchParams.get("cloneId");
    const loja = searchParams.get("loja");

    if (cloneId && loja) {
      fetchCloneData(cloneId, loja);
    } else if (params.formData) {
      // Estamos editando
      const formDataFromQuery = JSON.parse(decodeURIComponent(params.formData));
      setFormData(formDataFromQuery);
    } else {
      // Preenche data e hora atuais se não estiver clonando ou editando
      const now = new Date();
      const formattedDate = now.toISOString().split("T")[0];
      const formattedTime = now.toTimeString().split(" ")[0].slice(0, 5);

      setFormData((prevData) => ({
        ...prevData,
        data: formattedDate,
        hora: formattedTime,
      }));
    }
  }, [searchParams]);

  // Funções para gerar código e SKU
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

  // Handler para campos de formulário
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

  // Handler para seleção múltipla (ex: tecnologia, tipos)
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

  // Funções para adicionar novos itens
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
      const lojaPath = `estoque/${lojaToUse}/items/${collectionName}`;
      const lojaItemRef = doc(firestore, lojaPath, value.toLowerCase().replace(/\s+/g, '_'));

      await setDoc(lojaItemRef, {
        name: value,
        createdAt: new Date(),
        addedBy: userData?.nome || 'Sistema'
      });

      // Atualizar a lista correspondente
      switch (collectionName) {
        case "lentes_fabricantes":
          setFabricantes([...fabricantes, value]);
          setFormData(prev => ({ ...prev, fabricante: value }));
          break;
        case "fornecedores":
          setFornecedores([...fornecedores, value]);
          setFormData(prev => ({ ...prev, fornecedor: value }));
          break;
        case "lentes_marcas":
          setMarcas([...marcas, value]);
          setFormData(prev => ({ ...prev, marca: value }));
          break;
        case "lentes_designs":
          setDesigns([...designs, value]);
          setFormData(prev => ({ ...prev, design: value }));
          break;
        case "lentes_materiais":
          setMateriais([...materiais, value]);
          setFormData(prev => ({ ...prev, material: value }));
          break;
        case "lentes_tecnologias":
          setTecnologias([...tecnologias, value]);
          break;
        case "lentes_tratamentos":
          setTipoTratamentos([...tiposTratamentos, value]);
          break;
        case "lentes_familias":
          setFamilias([...familias, value]);
          setFormData(prev => ({ ...prev, familia: value }));
          break;
        case "lentes_unidades":
          setUnidades([...unidades, value]);
          setFormData(prev => ({ ...prev, unidade: value }));
          break;
        default:
          break;
      }

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
      const lojaPath = `estoque/${lojaToUse}/items/${collectionName}`;
      const lojaItemRef = doc(firestore, lojaPath, value.toString().replace(/\./g, '_'));

      await setDoc(lojaItemRef, {
        value: value,
        createdAt: new Date(),
        addedBy: userData?.nome || 'Sistema'
      });

      // Atualizar a lista correspondente
      switch (collectionName) {
        case "lentes_indices":
          setIndicies([...indicies, value]);
          setFormData(prev => ({ ...prev, indice: value }));
          break;
        default:
          break;
      }

      alert(`${value} adicionado com sucesso!`);
    } catch (error) {
      console.error(`Erro ao adicionar ${value} à coleção ${collectionName}:`, error);
      alert(`Erro ao adicionar ${value}`);
    }
  };

  // Buscar dados iniciais do Firebase
  useEffect(() => {
    const fetchFornecedores = async () => {
      try {
        const snapshot = await getDocs(collection(firestore, "fornecedores"));
        const list = snapshot.docs.map((doc) => doc.data().name);
        setFornecedores(list);
      } catch (error) {
        console.error("Erro ao buscar fornecedores:", error);
      }
    };

    const fetchFabricantes = async () => {
      try {
        const snapshot = await getDocs(collection(firestore, "lentes_fabricantes"));
        const list = snapshot.docs.map((doc) => doc.data().name);
        setFabricantes(list);
      } catch (error) {
        console.error("Erro ao buscar fabricantes:", error);
      }
    };

    const fetchMarcas = async () => {
      try {
        const snapshot = await getDocs(collection(firestore, "lentes_marcas"));
        const list = snapshot.docs.map((doc) => doc.data().name);
        setMarcas(list);
      } catch (error) {
        console.error("Erro ao buscar marcas:", error);
      }
    };

    const fetchDesigns = async () => {
      try {
        const snapshot = await getDocs(collection(firestore, "lentes_designs"));
        const list = snapshot.docs.map((doc) => doc.data().name);
        setDesigns(list);
      } catch (error) {
        console.error("Erro ao buscar designs:", error);
      }
    };

    const fetchTipos = async () => {
      try {
        const snapshot = await getDocs(collection(firestore, "lentes_tipos"));
        const list = snapshot.docs.map((doc) => doc.data().name);
        setTipos(list);
      } catch (error) {
        console.error("Erro ao buscar tipos:", error);
      }
    };

    const fetchIndicies = async () => {
      try {
        const snapshot = await getDocs(collection(firestore, "lentes_indices"));
        const list = snapshot.docs.map((doc) => doc.data().value);
        setIndicies(list);
      } catch (error) {
        console.error("Erro ao buscar índices:", error);
      }
    };

    const fetchMateriais = async () => {
      try {
        const snapshot = await getDocs(collection(firestore, "lentes_materiais"));
        const list = snapshot.docs.map((doc) => doc.data().name);
        setMateriais(list);
      } catch (error) {
        console.error("Erro ao buscar materiais:", error);
      }
    };

    const fetchTecnologias = async () => {
      try {
        const snapshot = await getDocs(collection(firestore, "lentes_tecnologias"));
        const list = snapshot.docs.map((doc) => doc.data().name);
        setTecnologias(list);
      } catch (error) {
        console.error("Erro ao buscar tecnologias:", error);
      }
    };

    const fetchTipoTratamentos = async () => {
      try {
        const snapshot = await getDocs(collection(firestore, "lentes_tratamentos"));
        const list = snapshot.docs.map((doc) => doc.data().name);
        setTipoTratamentos(list);
      } catch (error) {
        console.error("Erro ao buscar tratamentos:", error);
      }
    };

    const fetchFamilias = async () => {
      try {
        const snapshot = await getDocs(collection(firestore, "lentes_familias"));
        const list = snapshot.docs.map((doc) => doc.data().name);
        setFamilias(list);
      } catch (error) {
        console.error("Erro ao buscar famílias:", error);
      }
    };

    const fetchNcm = async () => {
      try {
        const snapshot = await getDocs(collection(firestore, "ncm"));
        const list = snapshot.docs.map((doc) => doc.data().name);
        setNCMs(list);
      } catch (error) {
        console.error("Erro ao buscar NCMs:", error);
      }
    };

    const fetchUnidades = async () => {
      try {
        const snapshot = await getDocs(collection(firestore, "lentes_unidades"));
        const list = snapshot.docs.map((doc) => doc.data().name);
        setUnidades(list);
      } catch (error) {
        console.error("Erro ao buscar unidades:", error);
      }
    };

    fetchFornecedores();
    fetchFabricantes();
    fetchMarcas();
    fetchDesigns();
    fetchTipos();
    fetchIndicies();
    fetchMateriais();
    fetchTecnologias();
    fetchTipoTratamentos();
    fetchFamilias();
    fetchNcm();
    fetchUnidades();
  }, []);

  // Função para limpar o formulário
  const handleClearSelection = () => {
    const now = new Date();
    const date = now.toISOString().split("T")[0];
    const time = now.toTimeString().split(":").slice(0, 2).join(":");

    setFormData({
      data: date,
      hora: time,
      sku: "",
      unidade: "",
      codigoBarras: "",
      codigoFabricante: "",
      codigo: "",
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
      CEST: "",
      CSOSN: "",
      aliquota_icms: "",
      base_calculo_icms: "",
      cfop: "",
      custo: 0,
      valor: 0,
      quantidade: 0,
      percentual_lucro: 0,
      custo_medio: 0,
      imagem: null,
      aliquota_ipi: "",
      cst_ipi: "",
      base_calculo_ipi: "",
      cst_pis: "",
      cst_cofins: "",
      origem_produto: "",
      peso_bruto: "",
      peso_liquido: "",
    });
    setSelectedLojas([]);
  };

  // Função para enviar a imagem
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
      if (updatedFormData.imagem instanceof File) {
        imageUrl = await handleImageUpload(updatedFormData.imagem);
      } else {
        imageUrl = updatedFormData.imagem || "";
      }

      // Cria o objeto com os dados do formulário e a URL da imagem
      const productData = {
        ...updatedFormData,
        imagem: imageUrl,
        categoria: "lentes",
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
          `lojas/estoque/${lojaId}/lentes`,
          updatedFormData.codigo
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
        `/products_and_services/lenses/confirm?formData=${encodeURIComponent(
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

  // Função auxiliar para renderizar nome da loja
  const renderLojaName = (lojaId) => {
    const lojaNames = {
      'loja1': 'Loja 1 - Centro',
      'loja2': 'Loja 2 - Caramuru'
    };

    return lojaNames[lojaId] || lojaId;
  };

  return (
    <Layout>
      <div className="w-full max-w-5xl mx-auto rounded-lg">
        <h2 className="text-3xl font-bold text-[#81059e] mb-8 mt-8 text-center">ADICIONAR LENTE</h2>

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
          <Link href="/products_and_services/lenses">
            <button className="bg-[#81059e] p-3 rounded-sm text-white">
              LENTES REGISTRADAS
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
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

              {/* Categoria */}
              <div>
                <label className="text-[#81059e] font-medium">Categoria</label>
                <select
                  name="categoria"
                  value={formData.categoria}
                  onChange={handleChange}
                  className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black"
                  disabled
                >
                  <option value="lentes">Lentes</option>
                </select>
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
                addNewOption={(value) => addNewItem("lentes_fabricantes", value)}
              />

              {/* Fornecedor com opção de adicionar */}
              <SelectWithAddOption
                label="Fornecedor"
                options={fornecedores}
                value={formData.fornecedor}
                onChange={(value) => setFormData({ ...formData, fornecedor: value })}
                addNewOption={(value) => addNewItem("fornecedores", value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              {/* Marca com opção de adicionar */}
              <SelectWithAddOption
                label="Marca"
                options={marcas}
                value={formData.marca}
                onChange={(value) => setFormData({ ...formData, marca: value })}
                addNewOption={(value) => addNewItem("lentes_marcas", value)}
              />

              {/* Família com opção de adicionar */}
              <SelectWithAddOption
                label="Família"
                options={familias}
                value={formData.familia}
                onChange={(value) => setFormData({ ...formData, familia: value })}
                addNewOption={(value) => addNewItem("lentes_familias", value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              {/* Material com opção de adicionar */}
              <SelectWithAddOption
                label="Material"
                options={materiais}
                value={formData.material}
                onChange={(value) => setFormData({ ...formData, material: value })}
                addNewOption={(value) => addNewItem("lentes_materiais", value)}
              />

              {/* Design com opção de adicionar */}
              <SelectWithAddOption
                label="Design"
                options={designs}
                value={formData.design}
                onChange={(value) => setFormData({ ...formData, design: value })}
                addNewOption={(value) => addNewItem("lentes_designs", value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              {/* Índice com opção de adicionar */}
              <SelectWithAddNumericOption
                label="Índice"
                options={indicies}
                value={formData.indice}
                onChange={(value) => setFormData({ ...formData, indice: value })}
                addNewOption={(value) => addNewValueItem("lentes_indices", value)}
              />

              {/* Unidade com opção de adicionar */}
              <SelectWithAddOption
                label="Unidade"
                options={unidades}
                value={formData.unidade}
                onChange={(value) => setFormData({ ...formData, unidade: value })}
                addNewOption={(value) => addNewItem("lentes_unidades", value)}
              />
            </div>

            {/* Tipos (multiselect) */}
            <div className="mt-4">
              <label className="text-lg font-semibold text-[#81059e]">Tipos:</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {tipos.map((tipo) => (
                  <button
                    key={tipo}
                    type="button"
                    onClick={() => handleToggle("tipo", tipo)}
                    className={`px-4 py-2 rounded-lg border-2 ${Array.isArray(formData.tipo) && formData.tipo.includes(tipo)
                      ? "bg-[#81059e] text-white border-[#81059e]"
                      : "bg-transparent text-[#81059e] border-[#81059e]"
                      }`}
                  >
                    {tipo}
                  </button>
                ))}
              </div>
            </div>

            {/* Tecnologias (multiselect) */}
            <div className="mt-4">
              <label className="text-lg font-semibold text-[#81059e]">Tecnologias:</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {tecnologias.map((tecnologia) => (
                  <button
                    key={tecnologia}
                    type="button"
                    onClick={() => handleToggle("tecnologia", tecnologia)}
                    className={`px-4 py-2 rounded-lg border-2 ${Array.isArray(formData.tecnologia) && formData.tecnologia.includes(tecnologia)
                      ? "bg-[#81059e] text-white border-[#81059e]"
                      : "bg-transparent text-[#81059e] border-[#81059e]"
                      }`}
                  >
                    {tecnologia}
                  </button>
                ))}
              </div>
            </div>

            {/* Tratamentos (multiselect) */}
            <div className="mt-4">
              <label className="text-lg font-semibold text-[#81059e]">Tratamentos:</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {tiposTratamentos.map((tratamento) => (
                  <button
                    key={tratamento}
                    type="button"
                    onClick={() => handleToggle("tratamento", tratamento)}
                    className={`px-4 py-2 rounded-lg border-2 ${Array.isArray(formData.tratamento) && formData.tratamento.includes(tratamento)
                      ? "bg-[#81059e] text-white border-[#81059e]"
                      : "bg-transparent text-[#81059e] border-[#81059e]"
                      }`}
                  >
                    {tratamento}
                  </button>
                ))}
              </div>
            </div>

            {/* Corredores (multiselect) */}
            <div className="mt-4">
              <label className="text-lg font-semibold text-[#81059e]">Corredores:</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {["14", "15", "16", "17", "18"].map((corredor) => (
                  <button
                    key={corredor}
                    type="button"
                    onClick={() => handleToggle("corredor", corredor)}
                    className={`px-4 py-2 rounded-lg border-2 ${Array.isArray(formData.corredor) && formData.corredor.includes(corredor)
                      ? "bg-[#81059e] text-white border-[#81059e]"
                      : "bg-transparent text-[#81059e] border-[#81059e]"
                      }`}
                  >
                    {corredor}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Seção Especificações Técnicas */}
          <div className="p-4 bg-gray-50 rounded-lg mb-6">
            <h3 className="text-lg font-semibold text-[#81059e] mb-4">Especificações Técnicas</h3>

            {/* Esférico */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-[#81059e] font-medium">Esférico De:</label>
                <input
                  type="number"
                  step="0.01"
                  name="esfericoDe"
                  value={formData.esfericoDe}
                  onChange={handleChange}
                  className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black"
                />
              </div>
              <div>
                <label className="text-[#81059e] font-medium">Esférico Para:</label>
                <input
                  type="number"
                  step="0.01"
                  name="esfericoPara"
                  value={formData.esfericoPara}
                  onChange={handleChange}
                  className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black"
                />
              </div>
            </div>

            {/* Cilindro */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <div>
                <label className="text-[#81059e] font-medium">Cilindro De:</label>
                <input
                  type="number"
                  step="0.01"
                  name="cilindroDe"
                  value={formData.cilindroDe}
                  onChange={handleChange}
                  className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black"
                />
              </div>
              <div>
                <label className="text-[#81059e] font-medium">Cilindro Para:</label>
                <input
                  type="number"
                  step="0.01"
                  name="cilindroPara"
                  value={formData.cilindroPara}
                  onChange={handleChange}
                  className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black"
                />
              </div>
            </div>

            {/* Diâmetro */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <div>
                <label className="text-[#81059e] font-medium">Diâmetro De:</label>
                <input
                  type="number"
                  step="0.01"
                  name="diametroDe"
                  value={formData.diametroDe}
                  onChange={handleChange}
                  className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black"
                />
              </div>
              <div>
                <label className="text-[#81059e] font-medium">Diâmetro Para:</label>
                <input
                  type="number"
                  step="0.01"
                  name="diametroPara"
                  value={formData.diametroPara}
                  onChange={handleChange}
                  className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black"
                />
              </div>
            </div>

            {/* Adição */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <div>
                <label className="text-[#81059e] font-medium">Adição De:</label>
                <input
                  type="number"
                  step="0.01"
                  name="adicaoDe"
                  value={formData.adicaoDe}
                  onChange={handleChange}
                  className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black"
                />
                <small className="text-gray-500">Em caso de Visão Simples, não preencher.</small>
              </div>
              <div>
                <label className="text-[#81059e] font-medium">Adição Para:</label>
                <input
                  type="number"
                  step="0.01"
                  name="adicaoPara"
                  value={formData.adicaoPara}
                  onChange={handleChange}
                  className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black"
                />
              </div>
            </div>

            {/* Montagem */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <div>
                <label className="text-[#81059e] font-medium">Montagem De:</label>
                <input
                  type="number"
                  step="0.01"
                  name="montagemDe"
                  value={formData.montagemDe}
                  onChange={handleChange}
                  className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black"
                />
                <small className="text-gray-500">Em caso de Visão Simples, não preencher.</small>
              </div>
              <div>
                <label className="text-[#81059e] font-medium">Montagem Para:</label>
                <input
                  type="number"
                  step="0.01"
                  name="montagemPara"
                  value={formData.montagemPara}
                  onChange={handleChange}
                  className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black"
                />
              </div>
            </div>
          </div>

          {/* Seção Valores */}
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
                    step="0.01"
                    name="custo"
                    value={formData.custo}
                    onChange={handleChange}
                    placeholder="0,00"
                    className="w-full px-2 py-3 text-black focus:outline-none focus:border-[#81059e] focus:ring-1 focus:ring-[#81059e] rounded-lg"
                    required
                  />
                </div>
              </div>

              {/* Valor de Venda */}
              <div>
                <label className="text-[#81059e] font-medium">Valor de Venda (R$)</label>
                <div className="flex items-center border-2 border-[#81059e] rounded-lg">
                  <span className="px-2 text-gray-400">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    name="valor"
                    value={formData.valor}
                    onChange={handleChange}
                    placeholder="0,00"
                    className="w-full px-2 py-3 text-black focus:outline-none focus:border-[#81059e] focus:ring-1 focus:ring-[#81059e] rounded-lg"
                    required
                  />
                </div>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              {/* Percentual de Lucro */}
              <div>
                <label className="text-[#81059e] font-medium">Percentual de Lucro (%)</label>
                <input
                  type="text"
                  id="percentual_lucro"
                  name="percentual_lucro"
                  value={formData.percentual_lucro}
                  readOnly
                  className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black bg-gray-100"
                  placeholder="Calculado automaticamente"
                />
              </div>

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
            </div>
          </div>

          {/* Seção Fiscal */}
          <div className="p-4 bg-gray-50 rounded-lg mb-6">
            <h3 className="text-lg font-semibold text-[#81059e] mb-4">Informações Fiscais</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* NCM */}
              <div>
                <label className="text-[#81059e] font-medium">NCM</label>
                <select
                  name="NCM"
                  value={formData.NCM || ""}
                  onChange={(e) => setFormData({ ...formData, NCM: e.target.value })}
                  className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black"
                  required
                >
                  <option value="">Selecione o NCM</option>
                  {ncmList.map((NCM) => (
                    <option key={NCM} value={NCM}>{NCM}</option>
                  ))}
                </select>
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
                  name="CSOSN"
                  value={formData.CSOSN || ""}
                  onChange={(e) => setFormData({ ...formData, CSOSN: e.target.value })}
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
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div> <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#81059e]"></div></div>}>
      <FormularioLentes />
    </Suspense>
  );
}