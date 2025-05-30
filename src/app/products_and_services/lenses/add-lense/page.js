"use client";
import React, { Suspense, useEffect, useState, useRef } from "react";
import Layout from "@/components/Layout";
import { doc, setDoc, getDocs, getDoc, collection, addDoc, query, where } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { firestore, storage } from "@/lib/firebaseConfig";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import "react-datepicker/dist/react-datepicker.css";
import { FiPlus, FiX } from 'react-icons/fi';
import ProductConfirmModal from '@/components/ProductLensConfirmModal';

const SelectWithAddOption = ({ label, options, value, onChange, collectionName, addNewOption, canAddNew = true }) => {
  const [showAddInput, setShowAddInput] = useState(false);
  const [newItemValue, setNewItemValue] = useState("");

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
            className="bg-gray-100 w-full px-4 py-3 border-2 border-[#81059e] rounded-sm text-black focus:outline-none focus:border-[#81059e] focus:ring-1 focus:ring-[#81059e]"
          >
            <option value="">Selecione uma opção</option>
            {options.map((option) => (
              <option key={option} value={option}>
                {option ? (typeof option === 'object' ? option.nome : option.toUpperCase()) : ""}
              </option>
            ))}
            {canAddNew && <option value="add_new">+ ADICIONAR NOVO</option>}
          </select>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newItemValue}
            onChange={(e) => setNewItemValue(e.target.value)}
            className="bg-gray-100 w-full px-4 py-3 border-2 border-[#81059e] rounded-sm text-black focus:outline-none focus:border-[#81059e] focus:ring-1 focus:ring-[#81059e]"
            placeholder={`Adicionar novo ${label.toLowerCase()}`}
          />
          <button
            type="button"
            onClick={handleAddItem}
            className="bg-[#81059e] text-white p-3 rounded-sm"
          >
            <FiPlus />
          </button>
          <button
            type="button"
            onClick={() => setShowAddInput(false)}
            className="border-2 border-[#81059e] text-[#81059e] p-3 rounded-sm"
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
  const [showAddInput, setShowAddInput] = useState(false);
  const [newItemValue, setNewItemValue] = useState("");

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
            className="bg-gray-100 w-full px-4 py-3 border-2 border-[#81059e] rounded-sm text-black focus:outline-none focus:border-[#81059e] focus:ring-1 focus:ring-[#81059e]"
          >
            <option value="">Selecione uma opção</option>
            {options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
            <option value="add_new">+ ADICIONAR NOVO</option>
          </select>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <input
            type="number"
            step="0.01"
            value={newItemValue}
            onChange={(e) => setNewItemValue(e.target.value)}
            className="bg-gray-100 w-full px-4 py-3 border-2 border-[#81059e] rounded-sm text-black focus:outline-none focus:border-[#81059e] focus:ring-1 focus:ring-[#81059e]"
            placeholder={`Adicionar novo ${label.toLowerCase()}`}
          />
          <button
            type="button"
            onClick={handleAddItem}
            className="bg-[#81059e] text-white p-3 rounded-sm"
          >
            <FiPlus />
          </button>
          <button
            type="button"
            onClick={() => setShowAddInput(false)}
            className="border-2 border-[#81059e] text-[#81059e] p-3 rounded-sm"
          >
            Cancelar
          </button>
        </div>
      )}
    </div>
  );
};

// Componente de botão de alternância para multi-seleção
const ToggleButton = ({ label, isSelected, onToggle }) => (
  <button
    type="button"
    onClick={onToggle}
    className={`px-4 py-2 rounded-sm border-2 ${isSelected
      ? "bg-[#81059e] text-white border-[#81059e]"
      : "bg-transparent text-[#81059e] border-[#81059e]"
      }`}
  >
    {label}
  </button>
);

export function FormularioLentes() {
  const searchParams = useSearchParams();
  const { userPermissions, userData } = useAuth();
  const [ncm, setNcm] = useState([]);
  const [selectedLoja, setSelectedLoja] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [productToConfirm, setProductToConfirm] = useState(null);
  const [dataExibicao, setDataExibicao] = useState('');
  const [searchFornecedor, setSearchFornecedor] = useState("");
  const [listaFornecedores, setListaFornecedores] = useState([]);
  const [isLoadingFornecedores, setIsLoadingFornecedores] = useState(false);
  const imageInputRef = useRef(null);

  // Arrays para valores dos selects de faixa - mesmos da Ordem de Serviço
  const [esfericos, setEsfericos] = useState([]);
  const [cilindricos, setCilindricos] = useState([]);
  const [diametros, setDiametros] = useState([]);
  const [adicoes, setAdicoes] = useState([]);

  // Função para formatação de números
  const formatNumberForDisplay = (value) => {
    if (typeof value === 'number') {
      // Para valores inteiros, não mostra decimal
      if (Number.isInteger(value)) {
        return value.toString();
      }
      // Para valores com casas decimais
      return value.toFixed(2).replace(/\.00$/, '');
    }
    return value;
  };

  // Estados para listas de opções de lentes
  const [fornecedores, setFornecedores] = useState([]);
  const [fabricantes, setFabricantes] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [familias, setFamilias] = useState([]);
  const [subfamilias, setSubFamilias] = useState([]);
  const [tipos, setTipos] = useState(['Progressiva', 'Bifocal', 'Visão Simples']);
  const [designs, setDesigns] = useState(['Esférico']);
  const [indicies, setIndicies] = useState([]);
  const [materiais, setMateriais] = useState(['Policarbonato', 'Mineral', 'Resina', 'Acrílico', 'CR39']);
  const [tecnologias, setTecnologias] = useState([
    'Duravision Platinum UV', 'Transitions VII', 'BlueBlock', 'Diamond', 'Blueguard', 'Saphira',
    'Esmerald', 'Multi Coating Azul', 'Clarity White', 'Polarizada Verde', 'Polarizada Cinza',
    'Polarizada Marrom', 'Duravision Silver UV', 'Clarity Premium', 'Blue Cut', 'Blue Care',
    'Duravision Chrome UV', 'Clarity Plate', 'Multi Coating Verde', 'PhotoFusion X Cinza'
  ]);
  const [tratamentos, setTratamentos] = useState([
    'Polarizada', 'AR externo', 'Antiestáticos', 'Hidrofóbica', 'Filtro azul',
    'Liporrepelete', 'Antirriscos', 'Proteção UV', 'Fotossensível'
  ]);
  const [unidades, setUnidades] = useState(['Peça', 'Par']);
  const [corredores, setCorredores] = useState(['14mm', '15mm', '16mm', '17mm', '18mm']);

  useEffect(() => {
    fetchFornecedoresDinamico();
  }, [searchFornecedor]);

  const router = useRouter();
  const [selectedLojas, setSelectedLojas] = useState([]);
  const [formData, setFormData] = useState({
    // Identificação Básica
    nome: "",
    familia: "",
    subfamilia: "",
    indice: "",
    sku: "",
    marca: "",

    // Informações de Loja e Preço
    loja: "",
    preco: "",
    precoPromocional: "",
    estoque: 0,

    // Códigos e Fabricante
    codigoBarras: "",
    codigoFabricante: "",
    fabricante: "",
    fornecedor: "",

    // Características Técnicas
    design: "",
    material: "",
    unidade: "",
    esferico: "",
    cilindro: "",
    diametro: "",
    adicao: "",

    // Tecnologias e Tratamentos
    tipo: [],
    corredor: [],
    tecnologias: [],
    tratamentos: [],

    // Dados fiscais
    NCM: "",
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

    // Valores e outros
    custo: "",
    valor: "",
    percentual_lucro: "",
    custo_medio: "",
    codigo: "",
    data: "",
    hora: "",
    quantidade: 1,
    imagem: null,
    categoria: "lentes",
  });

  // Definir loja inicial baseado nas permissões
  useEffect(() => {
    if (userPermissions && userPermissions.lojas && userPermissions.lojas.length > 0) {
      const defaultLoja = userPermissions.lojas[0];
      setSelectedLoja(defaultLoja);
      setSelectedLojas([renderLojaName(defaultLoja)]);
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
  const [previewUrl, setPreviewUrl] = useState(null);

  // Gerar produto título
  const generateLensTitle = (marca, tecnologia, tratamento, familia, subfamilia) => {
    if (!marca || !tecnologia || !tratamento) {
      return "";
    }

    const marcaFormatted = marca.trim().toUpperCase();
    const tecnologiaFormatted = tecnologia.trim().charAt(0).toUpperCase() + tecnologia.trim().slice(1).toLowerCase();
    const tratamentoFormatted = tratamento.trim().charAt(0).toUpperCase() + tratamento.trim().slice(1).toLowerCase();

    let familiaFormatted = "";
    if (familia) {
      familiaFormatted = " " + familia.trim().charAt(0).toUpperCase() + familia.trim().slice(1).toLowerCase();
    }

    let subfamiliaFormatted = "";
    if (subfamilia) {
      subfamiliaFormatted = " " + subfamilia.trim().charAt(0).toUpperCase() + subfamilia.trim().slice(1).toLowerCase();
    }

    return `${marcaFormatted} ${tecnologiaFormatted} ${tratamentoFormatted}${familiaFormatted}${subfamiliaFormatted}`;
  };

  // Nome da loja legível
  const renderLojaName = (lojaId) => {
    const lojaNames = {
      'loja1': 'Loja 1 - Centro',
      'loja2': 'Loja 2 - Caramuru'
    };

    return lojaNames[lojaId] || lojaId;
  };

  // Buscar dados para clonagem
  const fetchCloneData = async (cloneId, loja) => {
    try {
      const collectionName = loja === "Loja 1" ? "loja1_lentes" : "loja2_lentes";
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

  // Gerar código aleatório
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

  // Buscar lista de NCM
  const fetchNcm = async () => {
    try {
      // Tente a coleção original primeiro
      const ncmSnapshot = await getDocs(collection(firestore, "ncm"));

      // Se não houver dados, tente um caminho alternativo
      if (ncmSnapshot.empty) {
        console.log("Coleção NCM vazia, tentando caminho alternativo...");
        // Tente outro caminho que poderia conter os dados NCM
        const altNcmSnapshot = await getDocs(collection(firestore, "/estoque/${loja}/configuracoes/ncm"));

        if (!altNcmSnapshot.empty) {
          const ncmList = altNcmSnapshot.docs.map((doc) => {
            const data = doc.data();
            return data.codigo ? `${data.codigo} - ${data.descricao || ''}` : data.name || doc.id;
          });
          setNcm(ncmList);
          return;
        }

        // Se nenhum dado for encontrado, adicione alguns NCMs comuns para lentes óticas como fallback
        const defaultNcms = [
          "9001.50.00 - Lentes para óculos, de outras matérias",
          "9001.40.00 - Lentes de vidro para óculos",
          "9001.30.00 - Lentes de contato",
          "9001.50.00 - Lentes para óculos, de outras matérias"
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
        "9001.50.00 - Lentes para óculos, de outras matérias",
        "9001.40.00 - Lentes de vidro para óculos",
        "9001.30.00 - Lentes de contato",
        "9001.50.00 - Lentes para óculos, de outras matérias"
      ];
      setNcm(defaultNcms);
      console.log("Usando NCMs padrão devido a erro");
    }
  };

  // Gerar SKU
  const generateSKU = () => {
    const randomPart = Math.floor(Math.random() * 10000);
    const productCode = formData.codigo || generateRandomCode();
    const productType = formData.tipo && Array.isArray(formData.tipo) && formData.tipo.length > 0
      ? formData.tipo[0].substring(0, 3).toUpperCase()
      : "LNT";

    return `${productType}-${productCode}-${randomPart}`;
  };

  // Tratar valores monetários
  const parseValorMonetario = (valorFormatado) => {
    if (!valorFormatado) return 0;

    return parseFloat(
      valorFormatado
        .replace(/[^\d,]/g, '') // remove R$ e pontos
        .replace(',', '.')      // converte vírgula em ponto
    );
  };

  // Atualizar o SKU automaticamente quando necessário
  useEffect(() => {
    const sku = generateSKU();
    setFormData((prevData) => ({
      ...prevData,
      sku: sku,
    }));
  }, [formData.codigo, formData.tipo]);

  // Atualizar data e hora atuais
  useEffect(() => {
    const now = new Date();
    const formattedDate = format(now, 'yyyy-MM-dd');
    // Formato para exibição (DD/MM/YYYY)
    const displayDate = format(now, 'dd/MM/yyyy');

    setFormData(prevData => ({
      ...prevData,
      data: formattedDate,
      hora: format(now, 'HH:mm')
    }));

    // Define a data formatada em um estado separado
    setDataExibicao(displayDate);
  }, []);

  // Gerar nome de produto automático
  useEffect(() => {
    if (!formData.nome || formData.autoNome) {
      const novoNome = generateLensTitle(
        formData.marca,
        formData.tecnologias[0],
        formData.tratamentos[0],
        formData.familia,
        formData.subfamilia
      );

      if (novoNome) {
        setFormData(prev => ({
          ...prev,
          nome: novoNome,
          autoNome: true
        }));
      }
    }
  }, [formData.marca, formData.tecnologias, formData.tratamentos, formData.familia, formData.subfamilia]);


  // Funções para adicionar novos itens às coleções
  const addNewItem = async (collectionName, value) => {
    if (!selectedLoja && selectedLojas.length === 0) {
      alert("Selecione uma loja antes de adicionar novos itens!");
      return;
    }

    try {
      // Determinar a loja para salvar
      let lojaToUse;
      if (selectedLoja === "ambas") {
        lojaToUse = "loja1"; // Default para "ambas"
      } else if (selectedLoja) {
        lojaToUse = selectedLoja;
      } else if (selectedLojas.length > 0) {
        lojaToUse = selectedLojas[0]?.includes("Loja 1") ? "loja1" :
          selectedLojas[0]?.includes("Loja 2") ? "loja2" : "loja1";
      } else {
        lojaToUse = "loja1"; // Default final
      }

      // Salva na estrutura específica do estoque da loja
      const lojaPath = `/estoque/${lojaToUse}/lentes/configuracoes/${collectionName}`;
      const lojaItemRef = doc(firestore, lojaPath, value.toLowerCase().replace(/\s+/g, '_'));

      await setDoc(lojaItemRef, {
        name: value,
        createdAt: new Date(),
        addedBy: userData?.nome || 'Sistema'
      });

      // Atualizar a lista correspondente e o formulário
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
        case "lentes_familias":
          setFamilias([...familias, value]);
          setFormData(prev => ({ ...prev, familia: value }));
          break;
        case "lentes_subfamilias":
          setSubFamilias([...subfamilias, value]);
          setFormData(prev => ({ ...prev, subfamilia: value }));
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
          setTratamentos([...tratamentos, value]);
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

  // Adicionar novos valores numéricos
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
      const lojaPath = `/estoque/${lojaToUse}/lentes/configuracoes/${collectionName}`;
      const lojaItemRef = doc(firestore, lojaPath, value.toString().replace(/\./g, '_'));

      await setDoc(lojaItemRef, {
        value: value,
        createdAt: new Date(),
        addedBy: userData?.nome || 'Sistema'
      });

      // Atualizar a lista correspondente
      if (collectionName === "lentes_indices") {
        setIndicies([...indicies, value]);
        setFormData(prev => ({ ...prev, indice: value }));
      }

      alert(`${value} adicionado com sucesso!`);
    } catch (error) {
      console.error(`Erro ao adicionar ${value} à coleção ${collectionName}:`, error);
      alert(`Erro ao adicionar ${value}`);
    }
  };

  // Buscar dados iniciais do Firebase
  useEffect(() => {
    fetchFabricantes();
    fetchFornecedoresDinamico();
    fetchFamilias();
    fetchSubFamilias();
    fetchMarcas();
    fetchDesigns();
    fetchIndicies();
    fetchMateriais();
    fetchTecnologias();
    fetchTratamentos();
    fetchUnidades();
    fetchNcm();
    fetchEsfericos();
    fetchCilindricos();
    fetchDiametros();
    fetchAdicoes();
    fetchCorredores(); // <- ADICIONE ESTA LINHA
  }, [selectedLoja]);

  // Funções para buscar dados
  const fetchFabricantes = async () => {
    try {
      const loja = selectedLoja || "loja1";
      const path = `estoque/${loja}/lentes/configuracoes/lentes_fabricantes`;
      const snapshot = await getDocs(collection(firestore, path));
      const list = snapshot.docs.map(doc => doc.data().name);
      setFabricantes(list.length > 0 ? list : fabricantes);
    } catch (error) {
      console.error("Erro ao buscar fabricantes:", error);
    }
  };

  const fetchFamilias = async () => {
    try {
      const loja = selectedLoja || "loja1";
      const path = `estoque/${loja}/lentes/configuracoes/lentes_familias`;
      const snapshot = await getDocs(collection(firestore, path));
      const list = snapshot.docs.map(doc => doc.data().name);
      setFamilias(list.length > 0 ? list : familias);
    } catch (error) {
      console.error("Erro ao buscar famílias:", error);
    }
  };

  const fetchSubFamilias = async () => {
    try {
      const loja = selectedLoja || "loja1";
      const path = `estoque/${loja}/lentes/configuracoes/lentes_subfamilias`;
      const snapshot = await getDocs(collection(firestore, path));
      const list = snapshot.docs.map(doc => doc.data().name);
      setSubFamilias(list.length > 0 ? list : subfamilias);
    } catch (error) {
      console.error("Erro ao buscar subfamílias:", error);
    }
  };

  const fetchMarcas = async () => {
    try {
      const loja = selectedLoja || "loja1";
      const path = `estoque/${loja}/lentes/configuracoes/lentes_marcas`;
      const snapshot = await getDocs(collection(firestore, path));
      const list = snapshot.docs.map(doc => doc.data().name);
      setMarcas(list.length > 0 ? list : marcas);
    } catch (error) {
      console.error("Erro ao buscar marcas:", error);
    }
  };

  const fetchDesigns = async () => {
    try {
      const loja = selectedLoja || "loja1";
      const path = `estoque/${loja}/lentes/configuracoes/lentes_designs`;
      const snapshot = await getDocs(collection(firestore, path));
      const list = snapshot.docs.map(doc => doc.data().name);
      setDesigns(list.length > 0 ? list : designs);
    } catch (error) {
      console.error("Erro ao buscar designs:", error);
    }
  };

  const fetchIndicies = async () => {
    try {
      const loja = selectedLoja || "loja1";
      const path = `estoque/${loja}/lentes/configuracoes/lentes_indices`;
      const snapshot = await getDocs(collection(firestore, path));
      const list = snapshot.docs.map(doc => doc.data().value || doc.data().name);
      setIndicies(list.length > 0 ? list : indicies);
    } catch (error) {
      console.error("Erro ao buscar índices:", error);
    }
  };

  const fetchMateriais = async () => {
    try {
      const loja = selectedLoja || "loja1";
      const path = `estoque/${loja}/lentes/configuracoes/lentes_materiais`;
      const snapshot = await getDocs(collection(firestore, path));
      const list = snapshot.docs.map(doc => doc.data().name);
      setMateriais(list.length > 0 ? list : materiais);
    } catch (error) {
      console.error("Erro ao buscar materiais:", error);
    }
  };

  const fetchTecnologias = async () => {
    try {
      const loja = selectedLoja || "loja1";
      const path = `estoque/${loja}/lentes/configuracoes/lentes_tecnologias`;
      const snapshot = await getDocs(collection(firestore, path));
      const list = snapshot.docs.map(doc => doc.data().name);
      setTecnologias(list.length > 0 ? list : tecnologias);
    } catch (error) {
      console.error("Erro ao buscar tecnologias:", error);
    }
  };

  const fetchTratamentos = async () => {
    try {
      const loja = selectedLoja || "loja1";
      const path = `estoque/${loja}/lentes/configuracoes/lentes_tratamentos`;
      const snapshot = await getDocs(collection(firestore, path));
      const list = snapshot.docs.map(doc => doc.data().name);
      setTratamentos(list.length > 0 ? list : tratamentos);
    } catch (error) {
      console.error("Erro ao buscar tratamentos:", error);
    }
  };

  const fetchUnidades = async () => {
    try {
      const loja = selectedLoja || "loja1";
      const path = `estoque/${loja}/lentes/configuracoes/lentes_unidades`;
      const snapshot = await getDocs(collection(firestore, path));
      const list = snapshot.docs.map(doc => doc.data().name);
      setUnidades(list.length > 0 ? list : unidades);
    } catch (error) {
      console.error("Erro ao buscar unidades:", error);
    }
  };

  const fetchFornecedoresDinamico = async () => {
    if (!searchFornecedor.trim()) {
      setListaFornecedores([]);
      return;
    }

    setIsLoadingFornecedores(true);
    try {
      const fornecedoresRef = collection(firestore, 'lojas/fornecedores/users');
      const snapshot = await getDocs(fornecedoresRef);

      const fornecedoresData = snapshot.docs
        .map(doc => {
          const data = doc.data();
          const nome = data.nomeFantasia || data.razaoSocial || "Fornecedor";
          const representante = data.representante || "";
          const nomeCompleto = nome + (representante ? ` - ${representante}` : "");
          return {
            id: doc.id,
            nome: nomeCompleto.toLowerCase(),
          };
        })
        .filter(f => f.nome.includes(searchFornecedor.toLowerCase()));

      setListaFornecedores(fornecedoresData);
    } catch (error) {
      console.error("Erro ao buscar fornecedores:", error);
      setListaFornecedores([]);
    } finally {
      setIsLoadingFornecedores(false);
    }
  };

  const fetchEsfericos = async () => {
    try {
      const loja = selectedLoja || "loja1";
      const path = `estoque/${loja}/lentes/configuracoes/lentes_esfericos`;
      const snapshot = await getDocs(collection(firestore, path));
      const list = snapshot.docs.map(doc => doc.data().value);
      setEsfericos(list.length > 0 ? list : esfericos);
    } catch (error) {
      console.error("Erro ao buscar esféricos:", error);
    }
  };
  const fetchCilindricos = async () => {
    try {
      const loja = selectedLoja || "loja1";
      const path = `estoque/${loja}/lentes/configuracoes/lentes_cilindricos`;
      const snapshot = await getDocs(collection(firestore, path));
      const list = snapshot.docs.map(doc => doc.data().value);
      setCilindricos(list.length > 0 ? list : cilindricos);
    } catch (error) {
      console.error("Erro ao buscar cilindricos:", error);
    }
  };
  const fetchDiametros = async () => {
    try {
      const loja = selectedLoja || "loja1";
      const path = `estoque/${loja}/lentes/configuracoes/lentes_diametros`;
      const snapshot = await getDocs(collection(firestore, path));
      const list = snapshot.docs.map(doc => doc.data().value);
      setDiametros(list.length > 0 ? list : diametros);
    } catch (error) {
      console.error("Erro ao buscar diametros:", error);
    }
  };
  const fetchAdicoes = async () => {
    try {
      const loja = selectedLoja || "loja1";
      const path = `estoque/${loja}/lentes/configuracoes/lentes_adicoes`;
      const snapshot = await getDocs(collection(firestore, path));
      const list = snapshot.docs.map(doc => doc.data().value);
      setAdicoes(list.length > 0 ? list : adicoes);
    } catch (error) {
      console.error("Erro ao buscar adições:", error);
    }
  };

  const fetchCorredores = async () => {
    try {
      const loja = selectedLoja || "loja1";
      const path = `estoque/${loja}/lentes/configuracoes/lentes_corredores`;
      const snapshot = await getDocs(collection(firestore, path));
      const list = snapshot.docs.map(doc => doc.data().value || doc.data().name);
      setCorredores(list.length > 0 ? list : ['14mm', '15mm', '16mm', '17mm', '18mm']);
    } catch (error) {
      console.error("Erro ao buscar corredores:", error);
      setCorredores(['14mm', '15mm', '16mm', '17mm', '18mm']);
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

      // Quando o nome do produto é alterado manualmente
      if (name === "nome") {
        updatedData.autoNome = false;
      }

      // Recálculo de valores monetários baseado no percentual de lucro
      if (name === "percentual_lucro" && updatedData.custo) {
        const valorCusto = parseValorMonetario(updatedData.custo);
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

  // Tratamento de valores monetários
  const handleCustoChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '');

    if (raw === '') {
      setFormData(prev => ({ ...prev, custo: '' }));
      return;
    }

    const valor = Number(raw) / 100;

    setFormData(prev => ({
      ...prev,
      custo: valor.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      })
    }));
  };


  // Toggle para campos de múltipla seleção
  const handleToggle = (field, value) => {
    setFormData(prevData => {
      const currentValues = Array.isArray(prevData[field]) ? [...prevData[field]] : [];

      if (currentValues.includes(value)) {
        // Remove se já estiver selecionado
        return {
          ...prevData,
          [field]: currentValues.filter(item => item !== value)
        };
      } else {
        // Adiciona se não estiver selecionado
        return {
          ...prevData,
          [field]: [...currentValues, value]
        };
      }
    });
  };

  // Função para limpar o formulário
  const handleClearSelection = () => {
    const now = new Date();
    const date = now.toISOString().split("T")[0];
    const time = now.toTimeString().split(":").slice(0, 2).join(":");

    setFormData({
      nome: "",
      familia: "",
      subfamilia: "",
      indice: "",
      sku: "",
      marca: "",
      loja: "",
      preco: "",
      precoPromocional: "",
      estoque: 0,
      codigoBarras: "",
      codigoFabricante: "",
      fabricante: "",
      fornecedor: "",
      design: "",
      material: "",
      unidade: "",
      esferico: "",
      cilindro: "",
      diametro: "",
      adicao: "",
      tipo: [],
      corredor: [],
      tecnologias: [],
      tratamentos: [],
      NCM: "",
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
      custo: "",
      valor: "",
      percentual_lucro: "",
      custo_medio: "",
      codigo: "",
      data: date,
      hora: time,
      quantidade: 1,
      imagem: null,
      categoria: "lentes",
      autoNome: true,
    });

    setSelectedLojas([]);
    setPreviewUrl(null);
  };

  // Função para enviar os dados para o Firestore
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (!selectedLoja && selectedLojas.length === 0) {
      alert("Selecione ao menos uma loja antes de enviar o formulário");
      setIsLoading(false);
      return;
    }

    // Verificar se o nome do produto foi preenchido
    if (!formData.nome || formData.nome.trim() === "") {
      alert("O nome do produto é obrigatório");
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
      // Se houver uma imagem, faz o upload para o servidor local
      let imagePath = "";

      if (updatedFormData.imagem) {
        const fileName = `${Date.now()}_${updatedFormData.codigo}_${updatedFormData.imagem.name.replace(/\s+/g, '_')}`;
        imagePath = `/images/lentes/${fileName}`;

        const uploadFormData = new FormData();
        uploadFormData.append('image', updatedFormData.imagem);
        uploadFormData.append('fileName', fileName);
        uploadFormData.append('productCode', updatedFormData.codigo);

        try {
          const response = await fetch('/api/upload-image', {
            method: 'POST',
            body: uploadFormData,
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Falha no upload da imagem');
          }

          const result = await response.json();
          console.log('Imagem enviada com sucesso:', result);
        } catch (uploadError) {
          console.error('Erro no upload da imagem:', uploadError);
          alert(`Erro ao fazer upload da imagem: ${uploadError.message}`);
          setIsLoading(false);
          return;
        }
      }

      // Criar objeto de dados do produto (sem o objeto File)
      const { imagem, ...productDataWithoutFile } = updatedFormData;
      const now = new Date();
      const productData = {
        ...productDataWithoutFile,
        imagemUrl: imagePath,
        categoria: "lentes",
        createdAt: now,
        updatedAt: now,
        dataFormatada: format(now, 'dd/MM/yyyy', { locale: ptBR }),
        horaFormatada: format(now, 'HH:mm', { locale: ptBR }),
        createdBy: userData?.nome || 'Sistema',
        lojas: selectedLojas
      };

      // Salvar uma cópia na temp_image para persistência temporária
      const tempRef = doc(firestore, "temp_image", updatedFormData.codigo || updatedFormData.sku);
      await setDoc(tempRef, productData);

      // Em vez de redirecionar, definimos o produto para confirmação e mostramos o modal
      setProductToConfirm(productData);
      setShowConfirmModal(true);
      setIsLoading(false);

    } catch (error) {
      console.error("Erro ao processar os dados:", error);
      alert(`Erro ao processar o produto: ${error.message}`);
      setIsLoading(false);
    }
  };

  const addNewCorredor = async (value) => {
    if (!selectedLoja && selectedLojas.length === 0) {
      alert("Selecione uma loja antes de adicionar novos itens!");
      return;
    }
  
    try {
      const lojaToUse = selectedLoja ||
        (selectedLojas[0]?.includes("Loja 1") ? "loja1" :
          selectedLojas[0]?.includes("Loja 2") ? "loja2" : "loja1");
  
      const lojaPath = `/estoque/${lojaToUse}/lentes/configuracoes/lentes_corredores`;
      const lojaItemRef = doc(firestore, lojaPath, value.toString().replace(/\./g, '_'));
  
      await setDoc(lojaItemRef, {
        value: value,
        createdAt: new Date(),
        addedBy: userData?.nome || 'Sistema'
      });
  
      setCorredores([...corredores, value]);
      alert(`${value} adicionado com sucesso!`);
    } catch (error) {
      console.error(`Erro ao adicionar ${value} à coleção lentes_corredores:`, error);
      alert(`Erro ao adicionar ${value}`);
    }
  };

  const CorredorSection = () => {
    const [showAddInput, setShowAddInput] = useState(false);
    const [newCorredorValue, setNewCorredorValue] = useState("");
  
    const handleAddCorredor = async () => {
      if (!newCorredorValue.trim()) return;
  
      const formattedValue = newCorredorValue.includes('mm')
        ? newCorredorValue
        : `${newCorredorValue}mm`;
  
      try {
        await addNewCorredor(formattedValue);
        setNewCorredorValue("");
        setShowAddInput(false);
      } catch (error) {
        console.error("Erro ao adicionar novo corredor:", error);
      }
    };
  
    return (
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-[#81059e] mb-2">Corredor*:</h3>
        <div className="flex flex-wrap gap-2 mb-3">
          {corredores.map((corredor) => (
            <ToggleButton
              key={corredor}
              label={corredor}
              isSelected={Array.isArray(formData.corredor) && formData.corredor.includes(corredor)}
              onToggle={() => handleToggle("corredor", corredor)}
            />
          ))}
          {!showAddInput && (
            <button
              type="button"
              onClick={() => setShowAddInput(true)}
              className="px-4 py-2 rounded-sm border-2 border-dashed border-[#81059e] text-[#81059e] hover:bg-[#f3e8fc] transition-colors flex items-center gap-1"
            >
              <FiPlus size={16} />
              Adicionar
            </button>
          )}
        </div>
        {showAddInput && (
          <div className="flex items-center gap-2 mt-3 p-3 bg-white border-2 border-[#81059e] rounded-sm">
            <input
              type="text"
              value={newCorredorValue}
              onChange={(e) => setNewCorredorValue(e.target.value)}
              placeholder="Ex: 19mm"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-sm text-black focus:outline-none focus:border-[#81059e]"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleAddCorredor();
                }
              }}
            />
            <button
              type="button"
              onClick={handleAddCorredor}
              className="bg-[#81059e] text-white px-4 py-2 rounded-sm hover:bg-[#6a0480] transition-colors"
            >
              <FiPlus size={16} />
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAddInput(false);
                setNewCorredorValue("");
              }}
              className="border-2 border-[#81059e] text-[#81059e] px-4 py-2 rounded-sm hover:bg-[#f3e8fc] transition-colors"
            >
              Cancelar
            </button>
          </div>
        )}
        <small className="text-gray-500">Selecione apenas se a lente for multifocal.</small>
      </div>
    );
  };

  return (
    <div>
      <Layout>
        <div className="w-full max-w-5xl mx-auto rounded-sm">
          <h2 className="text-3xl font-bold text-[#81059e] mb-8 mt-8 text-center">ADICIONAR LENTE</h2>

          {/* Seletor de Loja para Admins */}
          {userPermissions?.isAdmin && (
            <div className="mb-6">
              <label className="text-[#81059e] font-medium">
                Selecionar Loja
              </label>
              <select
                value={selectedLoja || userPermissions.lojas[0] || ''}
                onChange={(e) => {
                  const lojaValue = e.target.value;
                  setSelectedLoja(lojaValue);
                  if (lojaValue === "ambas") {
                    setSelectedLojas(["Loja 1 - Centro", "Loja 2 - Caramuru"]);
                  } else if (lojaValue) {
                    setSelectedLojas([renderLojaName(lojaValue)]);
                  } else {
                    setSelectedLojas([]);
                  }
                }}
                className="border-2 border-[#81059e] p-2 rounded-sm w-48 text-[#81059e] mt-1 ml-4"
              >
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
            {/* Seção Identificação Básica */}
            <div className="p-4 bg-gray-50 rounded-sm mb-6">
              <h3 className="text-lg font-semibold text-[#81059e] mb-4">Identificação Básica</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Nome do Produto */}
                <div>
                  <label className="text-[#81059e] font-medium">
                    Nome do Produto*
                    {formData.autoNome && (
                      <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                        Gerado automaticamente
                      </span>
                    )}
                  </label>
                  <input
                    type="text"
                    id="nome"
                    name="nome"
                    value={formData.nome || ""}
                    onChange={handleChange}
                    className="border-2 border-[#81059e] p-3 rounded-sm w-full text-black bg-gray-100"
                    placeholder="Gerado automaticamente"
                    disabled
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
                    className="border-2 border-[#81059e] p-3 rounded-sm w-full text-black bg-gray-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                {/* Família */}
                <SelectWithAddOption
                  label="Família*"
                  options={familias}
                  value={formData.familia}
                  onChange={(value) => setFormData({ ...formData, familia: value })}
                  addNewOption={(value) => addNewItem("lentes_familias", value)}
                />

                {/* Sub-família */}
                <SelectWithAddOption
                  label="Sub-família*"
                  options={subfamilias}
                  value={formData.subfamilia}
                  onChange={(value) => setFormData({ ...formData, subfamilia: value })}
                  addNewOption={(value) => addNewItem("lentes_subfamilias", value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                {/* Índice/Produto */}
                <SelectWithAddNumericOption
                  label="Índice/Produto*"
                  options={indicies}
                  value={formData.indice}
                  onChange={(value) => setFormData({ ...formData, indice: value })}
                  addNewOption={(value) => addNewValueItem("lentes_indices", value)}
                />

                {/* Marca */}
                <SelectWithAddOption
                  label="Marca"
                  options={marcas}
                  value={formData.marca}
                  onChange={(value) => setFormData({ ...formData, marca: value })}
                  addNewOption={(value) => addNewItem("lentes_marcas", value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                {/* Data de Cadastro */}
                <div>
                  <label className="text-[#81059e] font-medium">Data de Cadastro</label>
                  <input
                    type="text"
                    value={dataExibicao}
                    readOnly
                    className="border-2 border-[#81059e] p-3 rounded-sm w-full text-black bg-gray-100"
                  />
                </div>

                {/* Código do Produto */}
                <div>
                  <label className="text-[#81059e] font-medium">Código do Produto</label>
                  <input
                    type="text"
                    name="codigo"
                    value={formData.codigo || ""}
                    onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                    className="border-2 border-[#81059e] p-3 rounded-sm w-full text-black"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Seção Códigos e Fabricante */}
            <div className="p-4 bg-gray-50 rounded-sm mb-6">
              <h3 className="text-lg font-semibold text-[#81059e] mb-4">Códigos e Fabricante</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Código de Barras */}
                <div>
                  <label className="text-[#81059e] font-medium">Código de Barras</label>
                  <input
                    type="text"
                    name="codigoBarras"
                    value={formData.codigoBarras || ""}
                    onChange={(e) => setFormData({ ...formData, codigoBarras: e.target.value })}
                    className="border-2 border-[#81059e] p-3 rounded-sm w-full text-black"
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
                    className="border-2 border-[#81059e] p-3 rounded-sm w-full text-black"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                {/* Fabricante */}
                <SelectWithAddOption
                  label="Fabricante*"
                  options={fabricantes}
                  value={formData.fabricante}
                  onChange={(value) => setFormData({ ...formData, fabricante: value })}
                  addNewOption={(value) => addNewItem("lentes_fabricantes", value)}
                />

                {/* Fornecedor - com busca dinâmica */}
                <div className="space-y-2 relative">
                  <label className="text-lg font-semibold text-[#81059e]">Fornecedor*:</label>
                  <input
                    type="text"
                    value={searchFornecedor}
                    onChange={(e) => {
                      setSearchFornecedor(e.target.value);
                      setFormData(prev => ({ ...prev, fornecedor: e.target.value }));
                    }}
                    placeholder="Buscar fornecedor"
                    className="bg-gray-100 w-full px-4 py-3 border-2 border-[#81059e] rounded-sm text-black"
                  />

                  {searchFornecedor && listaFornecedores.length > 0 && (
                    <ul className="absolute z-20 bg-white border border-gray-300 rounded-xl w-full max-h-60 overflow-y-auto shadow-md mt-2">
                      {listaFornecedores.map((f) => (
                        <li
                          key={f.id}
                          onClick={() => {
                            setFormData(prev => ({ ...prev, fornecedor: f.nome }));
                            setSearchFornecedor(f.nome);
                            setListaFornecedores([]);
                          }}
                          className="px-4 py-2 hover:bg-[#f3e8fc] cursor-pointer text-gray-800 border-b last:border-none"
                        >
                          {f.nome}
                        </li>
                      ))}
                    </ul>
                  )}

                  {isLoadingFornecedores && (
                    <p className="text-sm text-gray-500 mt-1">Buscando fornecedores...</p>
                  )}
                </div>
              </div>
            </div>

            {/* Seção Características Técnicas */}
            <div className="p-4 bg-gray-50 rounded-sm mb-6">
              <h3 className="text-lg font-semibold text-[#81059e] mb-4">Características Técnicas</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Design */}
                <SelectWithAddOption
                  label="Design*"
                  options={designs}
                  value={formData.design}
                  onChange={(value) => setFormData({ ...formData, design: value })}
                  addNewOption={(value) => addNewItem("lentes_designs", value)}
                />

                {/* Material */}
                <SelectWithAddOption
                  label="Material*"
                  options={materiais}
                  value={formData.material}
                  onChange={(value) => setFormData({ ...formData, material: value })}
                  addNewOption={(value) => addNewItem("lentes_materiais", value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                {/* Unidade */}
                <SelectWithAddOption
                  label="Unidade*"
                  options={unidades}
                  value={formData.unidade}
                  onChange={(value) => setFormData({ ...formData, unidade: value })}
                  addNewOption={(value) => addNewItem("lentes_unidades", value)}
                />

                {/* Tipo (multiselect) */}
                <div>
                  <h3 className="text-lg font-semibold text-[#81059e] mb-2">Tipo*:</h3>
                  <div className="flex flex-wrap gap-2">
                    {tipos.map((tipo) => (
                      <ToggleButton
                        key={tipo}
                        label={tipo}
                        isSelected={Array.isArray(formData.tipo) && formData.tipo.includes(tipo)}
                        onToggle={() => handleToggle("tipo", tipo)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Disponibilidade */}
            <div className="p-4 bg-gray-50 rounded-sm mb-6">
              <h3 className="text-lg font-semibold text-[#81059e] mb-4">Disponibilidade</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <SelectWithAddNumericOption
                  label="Esférico*"
                  options={esfericos}
                  value={formData.esferico}
                  onChange={(value) => setFormData({ ...formData, esferico: value })}
                  addNewOption={(value) => addNewValueItem("lentes_esfericos", value)}
                />
                <SelectWithAddNumericOption
                  label="Cilíndrico*"
                  options={cilindricos}
                  value={formData.cilindro}
                  onChange={(value) => setFormData({ ...formData, cilindro: value })}
                  addNewOption={(value) => addNewValueItem("lentes_cilindricos", value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <SelectWithAddNumericOption
                  label="Diâmetro*"
                  options={diametros}
                  value={formData.diametro}
                  onChange={(value) => setFormData({ ...formData, diametro: value })}
                  addNewOption={(value) => addNewValueItem("lentes_diametros", value)}
                />
                <SelectWithAddNumericOption
                  label="Adição"
                  options={adicoes}
                  value={formData.adicao}
                  onChange={(value) => setFormData({ ...formData, adicao: value })}
                  addNewOption={(value) => addNewValueItem("lentes_adicoes", value)}
                />
              </div>
            </div>

            {/* Seção Tecnologias e Tratamentos */}
            <div className="p-4 bg-gray-50 rounded-sm mb-6">
              <h3 className="text-lg font-semibold text-[#81059e] mb-4">Tecnologias e Tratamentos</h3>

              {/* Corredor (multiselect com adição dinâmica) */}
              <CorredorSection />

              {/* Tecnologias (multiselect) */}
              <div>
                <h3 className="text-lg font-semibold text-[#81059e] mt-2">Tecnologias*:</h3>
                <div className="flex flex-wrap gap-2 mt-2">
                  {tratamentos.map((tratamento) => (
                    <ToggleButton
                      key={tratamento}
                      label={tratamento}
                      isSelected={Array.isArray(formData.tratamentos) && formData.tratamentos.includes(tratamento)}
                      onToggle={() => handleToggle("tratamentos", tratamento)}
                    />
                  ))}
                </div>
              </div>

              {/* Tratamentos (multiselect) */}
              <div className="mt-4">
                <h3 className="text-lg font-semibold text-[#81059e] mb-2">Tratamentos:</h3>
                <div className="flex flex-wrap gap-2 mt-2">
                  {tecnologias.map((tecnologia) => (
                    <ToggleButton
                      key={tecnologia}
                      label={tecnologia}
                      isSelected={Array.isArray(formData.tecnologias) && formData.tecnologias.includes(tecnologia)}
                      onToggle={() => handleToggle("tecnologias", tecnologia)}
                    />
                  ))}
                </div>
              </div>

              
            </div>

            {/* Seção Valores */}
            <div className="p-4 bg-gray-50 rounded-sm mb-6">
              <h3 className="text-lg font-semibold text-[#81059e] mb-4">Valores</h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Custo */}
                <div>
                  <label className="text-[#81059e] font-medium">Custo (R$)</label>
                  <div className="flex items-center border-2 border-[#81059e] rounded-sm">
                    <input
                      type="text"
                      name="custo"
                      value={formData.custo}
                      onChange={handleCustoChange}
                      placeholder="R$ 0,00"
                      className="w-full px-2 py-3 text-black rounded-sm"
                    />
                  </div>
                </div>

                {/* Percentual de Lucro */}
                <div>
                  <label className="text-[#81059e] font-medium">Percentual de Lucro (%)</label>
                  <div className="flex items-center border-2 border-[#81059e] rounded-sm">
                    <input
                      type="number"
                      id="percentual_lucro"
                      name="percentual_lucro"
                      value={formData.percentual_lucro}
                      onChange={handleChange}
                      placeholder="%0,00"
                      className="w-full px-2 py-3 text-black focus:outline-none focus:border-[#81059e] focus:ring-1 focus:ring-[#81059e] rounded-sm"
                    />
                  </div>
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
                    className="border-2 border-[#81059e] p-3 rounded-sm w-full text-black bg-gray-100"
                    placeholder="Calculado automaticamente"
                  />
                </div>
              </div>
            </div>

            {/* Seção Fiscal */}
            <div className="p-4 bg-gray-50 rounded-sm mb-6">
              <h3 className="text-lg font-semibold text-[#81059e] mb-4">Informações Fiscais</h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* NCM */}
                <div>
                  <label className="text-[#81059e] font-medium">NCM</label>
                  <select
                    name="NCM"
                    value={formData.NCM || ""}
                    onChange={(e) => setFormData({ ...formData, NCM: e.target.value })}
                    className="border-2 border-[#81059e] p-3 rounded-sm w-full text-black"
                  >
                    <option value="">Selecione o NCM</option>
                    {ncm.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
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
                    className="border-2 border-[#81059e] p-3 rounded-sm w-full text-black"
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
                    className="border-2 border-[#81059e] p-3 rounded-sm w-full text-black"
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
                    className="border-2 border-[#81059e] p-3 rounded-sm w-full text-black"
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
                    className="border-2 border-[#81059e] p-3 rounded-sm w-full text-black"
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
                    className="border-2 border-[#81059e] p-3 rounded-sm w-full text-black"
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
                    className="border-2 border-[#81059e] p-3 rounded-sm w-full text-black"
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
                    className="border-2 border-[#81059e] p-3 rounded-sm w-full text-black"
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
                    className="border-2 border-[#81059e] p-3 rounded-sm w-full text-black"
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
                    className="border-2 border-[#81059e] p-3 rounded-sm w-full text-black"
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
                    className="border-2 border-[#81059e] p-3 rounded-sm w-full text-black"
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
                    className="border-2 border-[#81059e] p-3 rounded-sm w-full text-black"
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
                    className="border-2 border-[#81059e] p-3 rounded-sm w-full text-black"
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
                    className="border-2 border-[#81059e] p-3 rounded-sm w-full text-black"
                  />
                </div>
              </div>
            </div>

            {/* Seção Imagem */}
            <div className="p-4 bg-gray-50 rounded-sm mb-6">
              <h3 className="text-lg font-semibold text-[#81059e] mb-4">Imagem do Produto</h3>

              <div className="flex flex-col">
                <input
                  type="file"
                  name="imagem"
                  accept="image/*"
                  ref={imageInputRef}
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      setFormData(prev => ({ ...prev, imagem: file }));
                      setPreviewUrl(URL.createObjectURL(file));
                    }
                  }}
                  className="border-2 border-[#81059e] p-3 rounded-sm w-full text-black bg-gray-100"
                  required
                />

                {/* Pré-visualização da imagem */}
                {previewUrl && (
                  <div className="mt-4 relative inline-block">
                    <p className="text-sm text-gray-600 mb-2">Pré-visualização:</p>
                    <img
                      src={previewUrl}
                      alt="Pré-visualização"
                      className="w-32 h-32 object-cover rounded-sm border-2 border-[#81059e]"
                    />

                    {/* Botão de fechar (X) */}
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewUrl(null);
                        setFormData(prev => ({ ...prev, imagem: null }));
                        if (imageInputRef.current) {
                          imageInputRef.current.value = null;
                        }
                      }}
                      className="absolute top-0 right-0 bg-white border border-gray-300 rounded-full p-1 shadow hover:bg-red-100"
                      title="Remover imagem"
                    >
                      <FiX className="text-red-600 text-lg" />
                    </button>
                  </div>
                )}
              </div>
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
          <div className="fixed bottom-4 right-4 bg-green-500 text-white p-4 rounded-sm shadow-lg">
            <p>Produto enviado com sucesso!</p>
          </div>
        )}

        {showConfirmModal && (
          <ProductConfirmModal
            isOpen={showConfirmModal}
            onClose={() => setShowConfirmModal(false)}
            productData={productToConfirm}
            setIsLoading={setIsLoading}
          />
        )}
      </Layout>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div> <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#81059e]"></div></div>}>
      <FormularioLentes />
    </Suspense>
  );
}