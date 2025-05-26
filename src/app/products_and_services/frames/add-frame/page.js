//adicionar armação
"use client";
import React, { Suspense, useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { doc, setDoc, getDocs, getDoc, collection, addDoc, query, where, deleteDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { firestore } from "../../../../lib/firebaseConfig";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { format, parseISO } from 'date-fns';
import { useRef } from "react";
import { storage } from "@/lib/firebaseConfig";
import "react-datepicker/dist/react-datepicker.css";
import { FiPlus, FiTrash, FiTrash2 } from 'react-icons/fi';
import ProductConfirmModal from '@/components/ProductConfirmModal';
import { QRCodeSVG } from 'qrcode.react';

const SelectWithAddOption = ({
  label,
  options,
  value,
  onChange,
  collectionName,
  addNewOption,
  canAddNew = true,
  selectedLoja,
  setOptions,
}) => {

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [newItemValue, setNewItemValue] = useState("");
  const [showAddInput, setShowAddInput] = useState(false);
  const [showRemoveOptions, setShowRemoveOptions] = useState(false);

  const handleRemoveItem = async (itemToRemove) => {
    try {
      const loja = selectedLoja || "loja1";
      const path = `estoque/${loja}/armacoes/configuracoes/${collectionName}`;

      const docId = itemToRemove.toString().replace(/\./g, '_'); // ← EXATAMENTE igual ao usado na criação
      const docRef = doc(firestore, path, docId);
      await deleteDoc(docRef);

      const updatedOptions = options.filter(opt => opt !== itemToRemove);
      onChange("");
      setOptions(updatedOptions);

      alert(`${itemToRemove} removido com sucesso!`);
      setShowRemoveOptions(false);
    } catch (error) {
      console.error("Erro ao remover:", error);
      alert("Erro ao remover item.");
    }
  };




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
          <div className="flex items-center">
            <select
              value={value || ""}
              onChange={(e) => {
                if (e.target.value === "add_new") {
                  setShowAddInput(true);
                } else {
                  onChange(e.target.value);
                  setShowRemoveOptions(false);
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

            {value && (
              <button
                type="button"
                onClick={() => setShowRemoveOptions(!showRemoveOptions)}
                className="ml-2 bg-gray-100 border-2 border-[#81059e] text-[#81059e] p-3 rounded-sm text-lg"
              >
                <FiTrash2 />
              </button>
            )}
          </div>

          {/* Lista de opções com botões de remover - agora controlada por estado separado */}
          {showRemoveOptions && (
            <div className="absolute top-full left-0 w-full bg-white border border-gray-200 rounded-b-lg shadow-lg z-10 mt-1">
              <div className="py-2 px-4 bg-gray-50 border-b text-sm font-semibold text-gray-700">
                Clique no X para remover {label.toLowerCase()}
              </div>
              {options.map((option) => (
                <div key={option} className="flex justify-between items-center px-4 py-2 hover:bg-gray-50">
                  <span>{option ? (typeof option === 'object' ? option.nome : option.toUpperCase()) : ""}</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Deseja remover ${option}?`)) {
                        handleRemoveItem(option);
                      }
                    }}
                    className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50"
                  >
                    <FiTrash2 />
                  </button>
                </div>
              ))}
            </div>
          )}
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

export function FormularioLoja() {
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
  const [qrCodeData, setQrCodeData] = useState(null);
  const imageInputRef = useRef(null);

  useEffect(() => {
    fetchFornecedoresDinamico();
  }, [searchFornecedor]);


  const generateProductTitle = (marca, cor, genero, material) => {
    // Verificar se todos os campos necessários estão preenchidos
    if (!marca || !cor || !genero || !material) {
      return ""; // Retorna vazio se algum dos campos estiver faltando
    }

    // Formatar cada parte para garantir consistência
    const marcaFormatted = marca.trim().toUpperCase();
    const corFormatted = cor.trim().charAt(0).toUpperCase() + cor.trim().slice(1).toLowerCase();
    const generoFormatted = genero === "Unissex" ? "Unissex" :
      genero === "Masculino" ? "Masculino" : "Feminino";
    const materialFormatted = material.trim().charAt(0).toUpperCase() + material.trim().slice(1).toLowerCase();

    // Construir o título
    return `${marcaFormatted} ${corFormatted} ${generoFormatted} ${materialFormatted}`;
  };


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
    nome: "",
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
  const [fabricantes, setFabricantes] = useState([]);
  const [fornecedores, setFornecedores] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [formatos, setFormatos] = useState([]);
  const [aros, setAros] = useState([]);
  const [materiais, setMateriais] = useState([]);
  const [cores, setCores] = useState([]);
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
        const altNcmSnapshot = await getDocs(collection(firestore, "/estoque/${loja}/configuracoes/ncm"));

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


  const parseValorMonetario = (valorFormatado) => {
    if (!valorFormatado) return 0;

    return parseFloat(
      valorFormatado
        .replace(/[^\d,]/g, '') // remove R$ e pontos
        .replace(',', '.')      // converte vírgula em ponto
    );
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
      const lojaPath = `/estoque/${lojaToUse}/armacoes/configuracoes/${collectionName}`;
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
      const lojaPath = `/estoque/${lojaToUse}/armacoes/configuracoes/${collectionName}`;
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
      const loja = selectedLoja || "loja1";
      const path = `estoque/${loja}/armacoes/configuracoes/armacoes_aros`;
      const snapshot = await getDocs(collection(firestore, path));
      const list = snapshot.docs.map(doc => doc.data().name);
      setAros(list);
    } catch (error) {
      console.error("Erro ao buscar aros:", error);
    }
  };

  const fetchCores = async () => {
    try {
      const loja = selectedLoja || "loja1";
      const path = `estoque/${loja}/armacoes/configuracoes/armacoes_cores`;
      const snapshot = await getDocs(collection(firestore, path));
      const list = snapshot.docs.map(doc => doc.data().name);
      setCores(list);
    } catch (error) {
      console.error("Erro ao buscar cores:", error);
    }
  };

  const fetchFabricantes = async () => {
    try {
      const loja = selectedLoja || "loja1";
      const path = `estoque/${loja}/armacoes/configuracoes/armacoes_fabricantes`;
      const snapshot = await getDocs(collection(firestore, path));
      const list = snapshot.docs.map(doc => doc.data().name);
      setFabricantes(list);
    } catch (error) {
      console.error("Erro ao buscar fabricantes:", error);
    }
  };

  const fetchHastes = async () => {
    try {
      const loja = selectedLoja || "loja1";
      const path = `estoque/${loja}/armacoes/configuracoes/armacoes_hastes`;
      const snapshot = await getDocs(collection(firestore, path));
      const list = snapshot.docs.map(doc => doc.data().value || doc.id); // ← aqui também
      setHastes(list);
    } catch (error) {
      console.error("Erro ao buscar hastes:", error);
    }
  };

  const fetchLentes = async () => {
    try {
      const loja = selectedLoja || "loja1";
      const path = `estoque/${loja}/armacoes/configuracoes/armacoes_lentes`;
      const snapshot = await getDocs(collection(firestore, path));
      const list = snapshot.docs.map(doc => doc.data().name);
      setLentes(list);
    } catch (error) {
      console.error("Erro ao buscar lentes:", error);
    }
  };

  const fetchMarcas = async () => {
    try {
      const loja = selectedLoja || "loja1";
      const path = `estoque/${loja}/armacoes/configuracoes/armacoes_marcas`;
      const snapshot = await getDocs(collection(firestore, path));
      const list = snapshot.docs.map(doc => doc.data().name);
      setMarcas(list);
    } catch (error) {
      console.error("Erro ao buscar marcas:", error);
    }
  };

  const fetchMateriais = async () => {
    try {
      const loja = selectedLoja || "loja1";
      const path = `estoque/${loja}/armacoes/configuracoes/armacoes_materiais`;
      const snapshot = await getDocs(collection(firestore, path));
      const list = snapshot.docs.map(doc => doc.data().name);
      setMateriais(list);
    } catch (error) {
      console.error("Erro ao buscar materiais:", error);
    }
  };

  const fetchPontes = async () => {
    try {
      const loja = selectedLoja || "loja1";
      const path = `estoque/${loja}/armacoes/configuracoes/armacoes_pontes`;
      const snapshot = await getDocs(collection(firestore, path));
      const list = snapshot.docs.map(doc => doc.data().value || doc.id); // ← aqui está o segredo
      setPontes(list);
    } catch (error) {
      console.error("Erro ao buscar pontes:", error);
    }
  };

  const fetchFormatos = async () => {
    try {
      const loja = selectedLoja || "loja1";
      const path = `estoque/${loja}/armacoes/configuracoes/armacoes_formatos`;
      const snapshot = await getDocs(collection(firestore, path));
      const list = snapshot.docs.map(doc => doc.data().name);
      setFormatos(list);
    } catch (error) {
      console.error("Erro ao buscar formatos:", error);
    }
  };

  // Nova função para buscar fornecedores da estrutura correta do banco
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



  useEffect(() => {
    fetchAros();
    fetchCores();
    fetchFabricantes();
    fetchFornecedoresDinamico();
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
      const unidadesSnapshot = await getDocs(collection(firestore, "estoque/items/armacoes_unidades"));
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
      if (name === "nome") {
        updatedData.tituloAutomatico = false;
      }

      // Nova lógica: se o percentual de lucro ou custo mudar, recalcula o valor de venda
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

  useEffect(() => {
    if (!formData.nome || formData.tituloAutomatico) {
      const novoNome = generateProductTitle(
        formData.marca,
        formData.cor,
        formData.genero,
        formData.material
      );

      if (novoNome) {
        setFormData(prev => ({
          ...prev,
          nome: novoNome,
          tituloAutomatico: true // Mantém o controle de geração automática
        }));
      }
    }
  }, [formData.marca, formData.cor, formData.genero, formData.material]);


  const handleCustoChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '');

    if (raw === '') {
      setFormData(prev => ({ ...prev, custo: '', valor: '', custo_medio: '' }));
      return;
    }

    const valorCusto = Number(raw) / 100;

    const custoFormatado = valorCusto.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });

    const percentual = parseFloat(formData.percentual_lucro?.toString().replace(',', '.')) || 0;

    const valorVenda = valorCusto * (1 + percentual / 100);
    const custoMedio = (valorCusto + valorVenda) / 2;

    setFormData(prev => ({
      ...prev,
      custo: custoFormatado,
      valor: valorVenda.toFixed(2),
      custo_medio: custoMedio.toFixed(2)
    }));
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
      titulo: "",
      tituloAutomatico: true, // Adicionado para controlar a geração automática
      percentual_lucro: "",
      quantidade: "",
      imagem: null,
      codigoBarras: "",
      codigoFabricante: "",
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
    try {
      if (!imageFile || !imageFile.name) {
        throw new Error('Arquivo inválido');
      }

      const timestamp = new Date().getTime();
      const fileName = `${timestamp}_${imageFile.name.replace(/\s+/g, '_')}`;
      const storageRef = ref(storage, `armacoes/${fileName}`);

      console.log('Iniciando upload para:', `armacoes/${fileName}`);

      const uploadTask = await uploadBytes(storageRef, imageFile);
      console.log('Upload concluído');

      const downloadURL = await getDownloadURL(storageRef);
      console.log('URL obtida:', downloadURL);

      return downloadURL;
    } catch (error) {
      console.error('Erro detalhado no upload:', error);
      alert(`Erro ao fazer upload da imagem: ${error.message}`);
      throw error;
    }
  };

  // Função para enviar os dados para o Firestore
  // Estado para pré-visualização
  const [previewUrl, setPreviewUrl] = useState(null);

  // Função para enviar os dados para o Firestore
  // Em add-frame.js
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let imageUrl = null;

      // Upload da imagem para o Firebase Storage
      if (formData.imagem) {
        console.log('Arquivo para upload:', formData.imagem);
        imageUrl = await handleImageUpload(formData.imagem);
        console.log('URL da imagem salva no Storage:', imageUrl);
      }

      // Preparar dados para salvar
      const productData = {
        ...formData,
        imagem: imageUrl, // URL do Firebase Storage
        data: new Date().toISOString(),
        loja: selectedLoja || "loja1"
      };

      // Salvar no Firestore
      const docRef = doc(firestore, `estoque/${productData.loja}/armacoes/`, productData.codigo);
      await setDoc(docRef, productData);

      console.log('Produto salvo no Firestore com sucesso');

      setShowSuccessPopup(true);
      setTimeout(() => {
        setShowSuccessPopup(false);
        router.push('/products_and_services/frames');
      }, 2000);
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      alert(`Erro ao salvar produto: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <Layout>
        <div className="w-full max-w-5xl mx-auto rounded-sm">
          <h2 className="text-3xl font-bold text-[#81059e] mb-8 mt-8 text-center">ADICIONAR ARMAÇÃO</h2>

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
            <div className="p-4 bg-gray-50 rounded-sm mb-6">
              <h3 className="text-lg font-semibold text-[#81059e] mb-4">Informações Básicas</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Título do Produto - NOVO CAMPO */}
                <div>
                  <label className="text-[#81059e] font-medium">
                    Título do Produto
                    {formData.tituloAutomatico && (
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
                    className="border-2 border-[#81059e] p-3 rounded-sm w-full text-black"
                    placeholder="Gerado automaticamente"
                    required disabled
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
                <div>
                  <label className="text-[#81059e] font-medium">Data de Cadastro</label>
                  <input
                    type="text"
                    value={dataExibicao}
                    readOnly
                    className="border-2 border-[#81059e] p-3 rounded-sm w-full text-black bg-gray-100"
                  />
                </div>


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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                {/* Código de Barras */}
                <div>
                  <label className="text-[#81059e] font-medium">Código de Barras</label>
                  <input
                    type="text"
                    name="codigoBarras"
                    value={formData.codigoBarras || ""}
                    onChange={(e) => setFormData({ ...formData, codigoBarras: e.target.value })}
                    className="border-2 border-[#81059e] p-3 rounded-sm w-full text-black"
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
                    className="border-2 border-[#81059e] p-3 rounded-sm w-full text-black"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Seção Características do Produto */}
            <div className="p-4 bg-gray-50 rounded-sm mb-6">
              <h3 className="text-lg font-semibold text-[#81059e] mb-4">Características do Produto</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Fabricante com opção de adicionar */}
                <SelectWithAddOption
                  label="Fabricante"
                  options={fabricantes}
                  value={formData.fabricante}
                  onChange={(value) => setFormData({ ...formData, fabricante: value })}
                  addNewOption={(value) => addNewItem("armacoes_fabricantes", value)}
                  selectedLoja={selectedLoja}
                />

                {/* Fornecedor - Agora sem opção de adicionar */}
                <div className="space-y-2 relative">
                  <label className="text-lg font-semibold text-[#81059e]">Fornecedor:</label>
                  <div className="flex items-center">
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
                    {formData.fornecedor && (
                      <button
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, fornecedor: "" }));
                          setSearchFornecedor("");
                        }}
                        className="ml-2 bg-gray-100 border-2 border-[#81059e] text-[#81059e] p-2 rounded-sm"
                      >
                        <FiTrash2 />
                      </button>
                    )}
                  </div>

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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                {/* Marca com opção de adicionar */}
                <SelectWithAddOption
                  label="Marca"
                  options={marcas}
                  value={formData.marca}
                  onChange={(value) => setFormData({ ...formData, marca: value })}
                  addNewOption={(value) => addNewItem("armacoes_marcas", value)}
                  selectedLoja={selectedLoja}
                />

                {/* Gênero */}
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-[#81059e]">Gênero:</h3>
                  <select
                    name="genero"
                    value={formData.genero || ""}
                    onChange={(e) => setFormData({ ...formData, genero: e.target.value })}
                    className="bg-gray-100 w-full px-4 py-3 border-2 border-[#81059e] rounded-sm text-black focus:outline-none focus:border-[#81059e] focus:ring-1 focus:ring-[#81059e]"
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
                  selectedLoja={selectedLoja}
                />

                {/* Cor com opção de adicionar */}
                <SelectWithAddOption
                  label="Cor"
                  options={cores}
                  value={formData.cor}
                  onChange={(value) => setFormData({ ...formData, cor: value })}
                  addNewOption={(value) => addNewItem("armacoes_cores", value)}
                  selectedLoja={selectedLoja}
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
                  selectedLoja={selectedLoja}
                />

                {/* Aro com opção de adicionar */}
                <SelectWithAddOption
                  label="Aro"
                  options={aros}
                  value={formData.aro}
                  onChange={(value) => setFormData({ ...formData, aro: value })}
                  addNewOption={(value) => addNewItem("armacoes_aros", value)}
                  selectedLoja={selectedLoja}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                {/* Ponte com opção de adicionar */}
                <SelectWithAddOption
                  label="Ponte (mm)"
                  options={pontes}
                  value={formData.ponte}
                  onChange={(value) => setFormData({ ...formData, ponte: value })}
                  addNewOption={(value) => addNewValueItem("armacoes_pontes", value)}
                  selectedLoja={selectedLoja}
                />

                {/* Haste com opção de adicionar */}
                <SelectWithAddOption
                  label="Hastes (mm)"
                  options={hastes}
                  value={formData.haste}
                  onChange={(value) => setFormData({ ...formData, haste: value })}
                  addNewOption={(value) => addNewValueItem("armacoes_hastes", value)}
                  selectedLoja={selectedLoja}
                  setOptions={setHastes}
                />


              </div>
            </div>

            {/* Seção Valores - MODIFICADA PARA CALCULAR PREÇO A PARTIR DO PERCENTUAL */}
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

                {/* Percentual de Lucro - CAMPO MODIFICADO */}
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
                      required
                    />
                  </div>
                </div>

                {/* Valor de Venda - AGORA CALCULADO AUTOMATICAMENTE */}
                <div>
                  <label className="text-[#81059e] font-medium">Valor de Venda (R$)</label>
                  <div className="flex items-center border-2 border-[#81059e] rounded-sm">
                    <input
                      type="number"
                      name="valor"
                      value={formData.valor}
                      onChange={handleChange}
                      placeholder="0,00"
                      className="w-full px-2 py-3 text-black focus:outline-none focus:border-[#81059e] focus:ring-1 focus:ring-[#81059e] rounded-sm"
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
                    className="border-2 border-[#81059e] p-3 rounded-sm w-full text-black bg-gray-100"
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
                    className="border-2 border-[#81059e] p-3 rounded-sm w-full text-black"
                    required
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
                  <SelectWithAddOption
                    label="NCM"
                    options={ncm}
                    value={formData.NCM}
                    onChange={(value) => setFormData({ ...formData, NCM: value })}
                    addNewOption={(value) => addNewItem("ncm", value)}
                    selectedLoja={selectedLoja}
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
                    className="border-2 border-[#81059e] p-3 rounded-sm w-full text-black"
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
                    className="border-2 border-[#81059e] p-3 rounded-sm w-full text-black"
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
                    className="border-2 border-[#81059e] p-3 rounded-sm w-full text-black"
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
                    className="border-2 border-[#81059e] p-3 rounded-sm w-full text-black"
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
                    className="border-2 border-[#81059e] p-3 rounded-sm w-full text-black"
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
                    className="border-2 border-[#81059e] p-3 rounded-sm w-full text-black"
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
                    className="border-2 border-[#81059e] p-3 rounded-sm w-full text-black"
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
                    className="border-2 border-[#81059e] p-3 rounded-sm w-full text-black"
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
                    className="border-2 border-[#81059e] p-3 rounded-sm w-full text-black"
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
                    className="border-2 border-[#81059e] p-3 rounded-sm w-full text-black"
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
                    className="border-2 border-[#81059e] p-3 rounded-sm w-full text-black"
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
                    className="border-2 border-[#81059e] p-3 rounded-sm w-full text-black"
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
                    className="border-2 border-[#81059e] p-3 rounded-sm w-full text-black"
                    required
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
                  ref={imageInputRef} // 👈 aqui
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
                      className="max-w-xs h-auto object-contain border border-gray-300 rounded-md"
                    />

                    {/* Botão de fechar (X) */}
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewUrl(null);
                        setFormData(prev => ({ ...prev, imagem: null }));
                        if (imageInputRef.current) {
                          imageInputRef.current.value = null; // 👈 força reset do input
                        }
                      }}
                      className="absolute top-0 right-0 bg-white border border-gray-300 rounded-full p-1 shadow hover:bg-red-100"
                      title="Remover imagem"
                    >
                      <FiTrash2 className="text-red-600 text-lg" />
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

        {
          showSuccessPopup && (
            <div className="fixed bottom-4 right-4 bg-green-500 text-white p-4 rounded-sm shadow-lg">
              <p>Produto enviado com sucesso!</p>
              {qrCodeData && (
                <div className="mt-4 p-4 bg-white rounded-sm">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">QR Code da Armação</h3>
                  <div className="flex justify-center">
                    <QRCodeSVG value={qrCodeData} size={200} />
                  </div>
                  <p className="text-sm text-gray-600 mt-2">Imprima este QR code para identificação da armação</p>
                </div>
              )}
            </div>
          )
        }

        {
          showConfirmModal && (
            <ProductConfirmModal
              isOpen={showConfirmModal}
              onClose={() => setShowConfirmModal(false)}
              productData={productToConfirm}
              setIsLoading={setIsLoading}
            />
          )
        }
      </Layout >
    </div >
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div> <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#81059e]"></div></div>}>
      <FormularioLoja />
    </Suspense>
  );
}