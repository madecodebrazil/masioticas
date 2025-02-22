"use client";
import { useEffect } from "react";
import { auth } from "../../../../lib/firebaseConfig";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  getDoc,
  updateDoc,
  addDoc,
  collection,
  getDocs,
  doc,
  setDoc,
} from "firebase/firestore";
import { firestore } from "../../../../lib/firebaseConfig";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import Sidebar from "../../../../components/Sidebar";
import MobileNavSidebar from "../../../../components/MB_NavSidebar";

export default function ClientePage() {
  const [emprego, setEmprego] = useState({
    cargo: "",
    empresa: "",
    telefone: "",
    endereco: "",
  });
  const [receitaFile, setReceitaFile] = useState(null);
  const [receitaPreview, setReceitaPreview] = useState(null); // Para pré-visualização de imagens

  const [telefones, setTelefones] = useState([]);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true); // Estado de carregamento inicial
  const [loadingUserData, setLoadingUserData] = useState(false); // Estado para carregamento dos dados do formulário
  const router = useRouter();
  const [formData, setFormData] = useState({}); // Estado dinâmico para dados do formulário
  const [imagePreviews, setImagePreviews] = useState({});
  const [selectedFile, setSelectedFile] = useState(null);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false); // Estado para exibir o popup de sucesso
  const [convenios, setConvenios] = useState([]);
  const [filhos, setFilhos] = useState([]); // Estado para armazenar os filhos

  const handleReceitaChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setReceitaFile(file);
      if (file.type.startsWith("image/")) {
        // Cria pré-visualização apenas se for imagem
        setReceitaPreview(URL.createObjectURL(file));
      } else {
        setReceitaPreview(null); // Não há preview para PDFs
      }
    }
  };

  const handleEmpregoChange = (e) => {
    const { name, value } = e.target;
    setEmprego((prevEmprego) => ({
      ...prevEmprego,
      [name]: value,
    }));
  };

  // Adicionar um novo telefone
  const handleAddTelefone = () => {
    setTelefones([...telefones, ""]);
  };

  // Atualizar um telefone específico
  const handleTelefoneChange = (index, value) => {
    const updatedTelefones = [...telefones];
    updatedTelefones[index] = value;
    setTelefones(updatedTelefones);
  };

  // Remover um telefone específico
  const handleRemoveTelefone = (index) => {
    const updatedTelefones = [...telefones];
    updatedTelefones.splice(index, 1);
    setTelefones(updatedTelefones);
  };

  const checkIfIdentifierExists = async (identifier) => {
    try {
      const docRef = doc(firestore, "consumers", identifier);
      const docSnap = await getDoc(docRef);
      return docSnap.exists(); // Retorna `true` se o documento já existir
    } catch (error) {
      console.error("Erro ao verificar duplicidade:", error);
      return false;
    }
  };

  const isValidCPFOrCNPJ = (value) => {
    const cleanedValue = value.replace(/\D/g, ""); // Remove caracteres não numéricos
    if (cleanedValue.length === 11) {
      // CPF
      return "CPF";
    } else if (cleanedValue.length === 14) {
      // CNPJ
      return "CNPJ";
    }
    return false; // Valor inválido
  };

  const fetchConvenios = async () => {
    try {
      const snapshot = await getDocs(collection(firestore, "convenios"));
      const conveniosList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setConvenios(conveniosList);
    } catch (error) {
      console.error("Erro ao buscar dados de convenios: ", error);
    }
  };

  // Carrega os convênios ao montar o componente
  useEffect(() => {
    fetchConvenios();
  }, []);

  const fetchUserData = async (uid) => {
    try {
      const docRef = doc(firestore, `loja1/users/${uid}/dados`);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setUserData(docSnap.data());
      } else {
        console.log("Nenhum documento encontrado para o UID:", uid);
      }
    } catch (error) {
      console.error("Erro ao buscar os dados do usuário:", error);
    } finally {
      setLoading(false); // Conclui o carregamento
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        console.log("Usuário autenticado:", user); // Verifica se o usuário está autenticado
        fetchUserData(user.uid);
      } else {
        console.log("Usuário não autenticado");
        router.push("/login"); // Redireciona para a página de login se não estiver logado
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Função para capturar as mudanças nos campos do formulário
  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (files && files.length > 0) {
      // Atualiza formData com o arquivo
      setFormData((prevData) => ({ ...prevData, [name]: files[0] }));

      // Cria e armazena a URL de visualização da imagem
      setImagePreviews((prevPreviews) => ({
        ...prevPreviews,
        [name]: URL.createObjectURL(files[0]),
      }));
    } else {
      // Atualiza formData com o valor do campo de texto
      setFormData((prevData) => ({ ...prevData, [name]: value }));
    }
  };

  // Função para buscar o endereço via API do ViaCEP
  const fetchAddressByCep = async (cep) => {
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();
      if (!data.erro) {
        // Preencher os campos de endereço automaticamente
        setFormData((prevData) => ({
          ...prevData,
          logradouro: data.logradouro,
          bairro: data.bairro,
          cidade: data.localidade,
          estado: data.uf,
        }));
      } else {
        console.error("CEP inválido.");
      }
    } catch (error) {
      console.error("Erro ao buscar o endereço:", error);
    }
  };

  // Função para capturar as mudanças no campo de CEP
  const handleCepChange = (e) => {
    const cep = e.target.value.replace(/\D/g, ""); // Remove caracteres não numéricos
    if (cep.length === 8) {
      fetchAddressByCep(cep);
    }
    setFormData((prevData) => ({ ...prevData, cep: e.target.value }));
  };

  // Função para fazer upload de uma imagem e retornar a URL
  const uploadImage = async (file, fileName) => {
    if (!file) return null;

    const storage = getStorage();
    const storageRef = ref(storage, `consumers/${fileName}`);

    const snapshot = await uploadBytes(storageRef, file);
    return await getDownloadURL(snapshot.ref);
  };

  // Função para adicionar um novo filho ao array
  const handleAddFilho = () => {
    setFilhos((prevFilhos) => [...prevFilhos, { nome: "", idade: "" }]);
  };

  // Função para atualizar informações de um filho específico
  const handleFilhoChange = (index, field, value) => {
    const updatedFilhos = [...filhos];
    updatedFilhos[index][field] = value;
    setFilhos(updatedFilhos);
  };

  // Função para remover um filho do array
  const handleRemoveFilho = (index) => {
    const updatedFilhos = [...filhos];
    updatedFilhos.splice(index, 1);
    setFilhos(updatedFilhos);
  };

  // Função de submissão do formulário
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loadingUserData) return;

    setLoadingUserData(true);

    try {
      // Validação de CPF/CNPJ
      const identifier = formData.cpf ? formData.cpf.replace(/\D/g, "") : "";
      const tipo = isValidCPFOrCNPJ(identifier);
      if (!tipo) {
        alert("O CPF deve conter 11 dígitos ou o CNPJ deve conter 14 dígitos.");
        setLoadingUserData(false);
        return;
      }

      // Verifica se o identificador já existe
      const exists = await checkIfIdentifierExists(identifier);
      if (exists) {
        alert(`Erro: Este ${tipo} já está cadastrado.`);
        setLoadingUserData(false);
        return;
      }

      // Upload das imagens
      const rgImageUrl = await uploadImage(formData.rgImage, `rg-${identifier}`);
      const cpfImageUrl = await uploadImage(formData.cpfImage, `cpf-${identifier}`);
      const addressImageUrl = await uploadImage(formData.addressImage, `address-${identifier}`);
      const clientImageUrl = await uploadImage(formData.imagem, `client-${identifier}`);

      // Upload da receita, se houver
      let receitaUrl = null;
      if (receitaFile) {
        receitaUrl = await (async (file, fileName) => {
          const storage = getStorage();
          const storageRef = ref(storage, `receitas/${fileName}`);
          const snapshot = await uploadBytes(storageRef, file);
          return await getDownloadURL(snapshot.ref);
        })(receitaFile, `receita-${Date.now()}`);
      }

      // Monta o objeto a ser salvo
      const { rgImage, cpfImage, addressImage, imagem, ...clientData } = formData;
      clientData.rgImageUrl = rgImageUrl;
      clientData.cpfImageUrl = cpfImageUrl;
      clientData.addressImageUrl = addressImageUrl;
      clientData.clientImageUrl = clientImageUrl;
      clientData.tipo = tipo;
      clientData.filhos = filhos;
      clientData.emprego = emprego;
      clientData.telefones = telefones;
      clientData.receitaUrl = receitaUrl;

      // Aqui sobrescrevemos o CPF para remover qualquer formatação
      clientData.cpf = identifier;

      // Salva no Firestore
      await setDoc(doc(firestore, "consumers", identifier), clientData);

      console.log("Cliente adicionado com sucesso:", clientData);
      setShowSuccessPopup(true);

      // Redireciona após 3 segundos
      setTimeout(() => {
        router.push("/register/consumers/list-clients");
      }, 3000);
    } catch (error) {
      console.error("Erro ao adicionar cliente:", error);
    } finally {
      setLoadingUserData(false);
    }
  };



  return (
    <div className="flex flex-col min-h-screen bg-[#81059e]">
      <MobileNavSidebar
        userPhotoURL={userData?.imageUrl || "/default-avatar.png"}
        userData={userData}
        handleLogout={() => router.push("/login")}
      />
      <div className="hidden lg:block w-16">
        <Sidebar />
      </div>

      <div className="flex flex-col items-center justify-center w-full mt-12 lg:mt-0">
        <div className="flex-1 flex justify-center items-center w-full p-6">
          <div className="bg-white p-6 rounded-3xl shadow-lg border border-gray-300 w-full max-w-3xl">
            <h1 className="text-purple-700 text-xl font-bold mb-4">
              Adicionar cliente
            </h1>
            <img
              src="/images/Settings.png" // Caminho para o ícone de configurações
              alt="Ícone de Configurações"
              className="cursor-pointer hover:opacity-80 transition mb-4" // Adiciona margem inferior e hover
              style={{ width: "40px", height: "40px" }} // Define o tamanho do ícone
              onClick={() => router.push("/register/clients-ab")} // Redireciona para a rota desejada ao clicar
            />
            <main className="">
              <form
                onSubmit={handleSubmit}
                className="p-4 text-black bg-white justify-center rounded-lg shadow-md"
              >
                {/* Nome */}
                <fieldset className="mb-4">
                  <legend>Nome </legend>
                  <input
                    type="text"
                    name="nome"
                    value={formData.nome || ""}
                    onChange={handleChange}
                    className="form-input w-full border border-gray-400 rounded-lg px-3 py-2"
                    required
                  />
                </fieldset>

                {/* CPF / CNPJ */}
                <fieldset className="mb-4">
                  <legend>CPF / CNPJ </legend>
                  <input
                    type="text"
                    name="cpf"
                    value={formData.cpf || ""}
                    onChange={handleChange}
                    className="form-input w-full border border-gray-400 rounded-lg px-3 py-2"
                    placeholder="Digite o CPF (11 dígitos) ou CNPJ (14 dígitos)"
                    required
                  />
                </fieldset>

                {/* Data de Nascimento */}
                <fieldset className="mb-4">
                  <legend>Data de Nascimento </legend>
                  <input
                    type="date"
                    name="dataNascimento"
                    value={formData.dataNascimento || ""}
                    onChange={handleChange}
                    className="form-input w-full border border-gray-400 rounded-lg px-3 py-2"
                    required
                  />
                </fieldset>

                {/* Gênero */}
                <fieldset className="mb-4">
                  <legend>Gênero </legend>
                  <select
                    name="genero"
                    value={formData.genero || ""}
                    onChange={handleChange}
                    className="form-input w-full border border-gray-400 rounded-lg px-3 py-2"
                    required
                  >
                    <option value="" disabled>
                      Selecione
                    </option>
                    <option value="Masculino">Masculino</option>
                    <option value="Feminino">Feminino</option>
                    <option value="Outros">Outros</option>
                  </select>
                </fieldset>

                {/* Nome da Mãe */}
                <fieldset className="mb-4">
                  <legend>Mãe </legend>
                  <input
                    type="text"
                    name="mae"
                    value={formData.mae || ""}
                    onChange={handleChange}
                    className="form-input w-full border border-gray-400 rounded-lg px-3 py-2"
                  />
                </fieldset>

                {/* Estado Civil */}
                <fieldset className="mb-4">
                  <legend>Estado Civil </legend>
                  <select
                    name="estadoCivil"
                    value={formData.estadoCivil || ""}
                    onChange={handleChange}
                    className="form-input w-full border border-gray-400 rounded-lg px-3 py-2"
                    required
                  >
                    <option value="" disabled>
                      Selecione
                    </option>
                    <option value="Solteiro(a)">Solteiro(a)</option>
                    <option value="Casado(a)">Casado(a)</option>
                    <option value="União estável">União estável</option>
                    <option value="Separado(a)">Separado(a)</option>
                    <option value="Divorciado(a)">Divorciado(a)</option>
                    <option value="Viúvo(a)">Viúvo(a)</option>
                  </select>
                </fieldset>

                {/* Escolaridade */}
                <fieldset className="mb-4">
                  <legend>Escolaridade </legend>
                  <select
                    name="escolaridade"
                    value={formData.escolaridade || ""}
                    onChange={handleChange}
                    className="form-input w-full border border-gray-400 rounded-lg px-3 py-2"
                    required
                  >
                    <option value="" disabled>
                      Selecione
                    </option>
                    <option value="Analfabeto">Analfabeto</option>
                    <option value="Ensino Fundamental Incompleto">
                      Ensino Fundamental Incompleto
                    </option>
                    <option value="Ensino Fundamental Completo">
                      Ensino Fundamental Completo
                    </option>
                    <option value="Ensino Médio Incompleto">
                      Ensino Médio Incompleto
                    </option>
                    <option value="Ensino Médio Completo">
                      Ensino Médio Completo
                    </option>
                    <option value="Educação Técnica ou Profissionalizante">
                      Educação Técnica ou Profissionalizante
                    </option>
                    <option value="Ensino Superior Incompleto">
                      Ensino Superior Incompleto
                    </option>
                    <option value="Ensino Superior Completo">
                      Ensino Superior Completo
                    </option>
                    <option value="Pós-Graduação">Pós-Graduação</option>
                    <option value="Pós-Doutorado">Pós-Doutorado</option>
                  </select>
                </fieldset>

                {/* Informações de Emprego */}
                <fieldset className="mb-4">
                  <legend>Informações de Emprego</legend>

                  {/* Cargo */}
                  <div className="mb-2">
                    <label
                      htmlFor="cargo"
                      className="block text-sm font-medium"
                    >
                      Cargo
                    </label>
                    <input
                      type="text"
                      id="cargo"
                      name="cargo"
                      value={emprego.cargo}
                      onChange={handleEmpregoChange}
                      className="form-input w-full border border-gray-400 rounded-lg px-3 py-2"
                    />
                  </div>

                  {/* Empresa */}
                  <div className="mb-2">
                    <label
                      htmlFor="empresa"
                      className="block text-sm font-medium"
                    >
                      Empresa
                    </label>
                    <input
                      type="text"
                      id="empresa"
                      name="empresa"
                      value={emprego.empresa}
                      onChange={handleEmpregoChange}
                      className="form-input w-full border border-gray-400 rounded-lg px-3 py-2"
                    />
                  </div>

                  {/* Telefone */}
                  <div className="mb-2">
                    <label
                      htmlFor="telefone"
                      className="block text-sm font-medium"
                    >
                      Telefone
                    </label>
                    <input
                      type="text"
                      id="telefone"
                      name="telefone"
                      value={emprego.telefone}
                      onChange={handleEmpregoChange}
                      className="form-input w-full border border-gray-400 rounded-lg px-3 py-2"
                    />
                  </div>

                  {/* Endereço */}
                  <div className="mb-2">
                    <label
                      htmlFor="endereco"
                      className="block text-sm font-medium"
                    >
                      Endereço
                    </label>
                    <input
                      type="text"
                      id="endereco"
                      name="endereco"
                      value={emprego.endereco}
                      onChange={handleEmpregoChange}
                      className="form-input w-full border border-gray-400 rounded-lg px-3 py-2"
                    />
                  </div>
                </fieldset>

                {/* Telefones */}
                <fieldset className="mb-4">
                  <legend>Números de Celular</legend>
                  {telefones.map((telefone, index) => (
                    <div key={index} className="flex gap-4 mb-2">
                      <input
                        type="text"
                        placeholder={`Telefone ${index + 1}`}
                        value={telefone}
                        onChange={(e) =>
                          handleTelefoneChange(index, e.target.value)
                        }
                        className="form-input border border-gray-400 rounded-lg px-3 py-2"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveTelefone(index)}
                        className="bg-red-500 text-white rounded-lg px-3 py-1 hover:bg-red-700"
                      >
                        -
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={handleAddTelefone}
                    className="bg-blue-500 text-white rounded-lg px-3 py-1 hover:bg-blue-700"
                  >
                    + Adicionar Celular
                  </button>
                </fieldset>

                {/* E-mail */}
                <fieldset className="mb-4">
                  <legend>E-mail </legend>
                  <input
                    type="email"
                    name="email"
                    value={formData.email || ""}
                    onChange={handleChange}
                    className="form-input w-full border border-gray-400 rounded-lg px-3 py-2"
                    required
                  />
                </fieldset>

                {/* CEP */}
                <fieldset className="mb-4">
                  <legend>CEP </legend>
                  <input
                    type="text"
                    name="cep"
                    value={formData.cep || ""}
                    onChange={handleCepChange} // Adiciona a função de busca pelo CEP
                    className="form-input w-full border border-gray-400 rounded-lg px-3 py-2"
                    required
                  />
                </fieldset>

                {/* Logradouro */}
                <fieldset className="mb-4">
                  <legend>Logradouro </legend>
                  <input
                    type="text"
                    name="logradouro"
                    value={formData.logradouro || ""}
                    onChange={handleChange}
                    className="form-input w-full border border-gray-400 rounded-lg px-3 py-2"
                    required
                  />
                </fieldset>

                {/* Complemento */}
                <fieldset className="mb-4">
                  <legend>Complemento</legend>
                  <input
                    type="text"
                    name="complemento"
                    value={formData.complemento || ""}
                    onChange={handleChange}
                    className="form-input w-full border border-gray-400 rounded-lg px-3 py-2"
                  />
                </fieldset>

                {/* Bairro */}
                <fieldset className="mb-4">
                  <legend>Bairro </legend>
                  <input
                    type="text"
                    name="bairro"
                    value={formData.bairro || ""}
                    onChange={handleChange}
                    className="form-input w-full border border-gray-400 rounded-lg px-3 py-2"
                    required
                  />
                </fieldset>

                {/* Cidade */}
                <fieldset className="mb-4">
                  <legend>Cidade </legend>
                  <input
                    type="text"
                    name="cidade"
                    value={formData.cidade || ""}
                    onChange={handleChange}
                    className="form-input w-full border border-gray-400 rounded-lg px-3 py-2"
                    required
                  />
                </fieldset>

                {/* Estado */}
                <fieldset className="mb-4">
                  <legend>Estado </legend>
                  <input
                    type="text"
                    name="estado"
                    value={formData.estado || ""}
                    onChange={handleChange}
                    className="form-input w-full border border-gray-400 rounded-lg px-3 py-2"
                    required
                  />
                </fieldset>

                {/* Convênio */}
                <fieldset className="mb-4">
                  <legend>Convênio</legend>
                  <select
                    name="convenio"
                    value={formData.convenio || ""}
                    onChange={handleChange}
                    className="form-select w-full border border-gray-400 rounded-lg px-3 py-2"
                  >
                    <option value="" disabled>
                      Selecione um convênio
                    </option>
                    {convenios.map((convenio) => (
                      <option key={convenio.id} value={convenio.name}>
                        {convenio.name}
                      </option>
                    ))}
                  </select>
                </fieldset>

                {/* Possui Filhos */}
                <fieldset className="mb-4">
                  <legend>Parentesco</legend>
                  <select
                    name="temFilhos"
                    value={formData.temFilhos || "Não"}
                    onChange={handleChange}
                    className="form-input w-full border border-gray-400 rounded-lg px-3 py-2"
                  >
                    <option value="Não">Não</option>
                    <option value="Sim">Sim</option>
                  </select>
                </fieldset>

                {/* Campos para adicionar filhos dinamicamente */}
                {formData.temFilhos === "Sim" && (
                  <fieldset className="mb-4">
                    {filhos.map((filho, index) => (
                      <div key={index} className="flex gap-4 mb-2">
                        <input
                          type="text"
                          placeholder="Nome"
                          value={filho.nome || ""}
                          onChange={(e) =>
                            handleFilhoChange(index, "nome", e.target.value)
                          }
                          className="form-input border border-gray-400 rounded-lg px-3 py-2"
                        />
                        <input
                          type="number"
                          placeholder="Idade"
                          value={filho.idade || ""}
                          onChange={(e) =>
                            handleFilhoChange(index, "idade", e.target.value)
                          }
                          className="form-input border border-gray-400 rounded-lg px-3 py-2"
                        />
                        <input
                          type="text"
                          placeholder="Telefone"
                          value={filho.telefone || ""}
                          onChange={(e) =>
                            handleFilhoChange(index, "telefone", e.target.value)
                          }
                          className="form-input border border-gray-400 rounded-lg px-3 py-2"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveFilho(index)}
                          className="bg-red-500 text-white rounded-lg px-3 py-1 hover:bg-red-700"
                        >
                          -
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={handleAddFilho}
                      className="bg-blue-500 text-white rounded-lg px-3 py-1 hover:bg-blue-700"
                    >
                      + Adicionar
                    </button>
                  </fieldset>
                )}

                {/* Imagem */}
                <fieldset className="mb-4">
                  <legend>Imagem</legend>
                  <input
                    type="file"
                    name="imagem"
                    onChange={handleChange}
                    className="form-input w-full border border-gray-400 rounded-lg px-3 py-2"
                  />
                  {imagePreviews.imagem && (
                    <img
                      src={imagePreviews.imagem}
                      alt="Imagem"
                      className="mt-2 h-32 w-auto rounded-lg"
                    />
                  )}
                  <p className="text-sm text-gray-600 mt-1">
                    Tipos permitidos: png, gif, jpg. Limite: 4 MB.
                  </p>
                </fieldset>

                {/* Imagem do RG */}
                <fieldset className="mb-4">
                  <legend>Foto do RG</legend>
                  <input
                    type="file"
                    name="rgImage"
                    onChange={handleChange}
                    className="form-input w-full border border-gray-400 rounded-lg px-3 py-2"
                  />
                  {imagePreviews.rgImage && (
                    <img
                      src={imagePreviews.rgImage}
                      alt="Foto do RG"
                      className="mt-2 h-32 w-auto rounded-lg"
                    />
                  )}
                  <p className="text-sm text-gray-600 mt-1">
                    Tipos permitidos: png, gif, jpg. Limite: 4 MB.
                  </p>
                </fieldset>

                {/* Imagem do CPF */}
                <fieldset className="mb-4">
                  <legend>Foto do CPF</legend>
                  <input
                    type="file"
                    name="cpfImage"
                    onChange={handleChange}
                    className="form-input w-full border border-gray-400 rounded-lg px-3 py-2"
                  />
                  {imagePreviews.cpfImage && (
                    <img
                      src={imagePreviews.cpfImage}
                      alt="Foto do CPF"
                      className="mt-2 h-32 w-auto rounded-lg"
                    />
                  )}
                  <p className="text-sm text-gray-600 mt-1">
                    Tipos permitidos: png, gif, jpg. Limite: 4 MB.
                  </p>
                </fieldset>

                {/* Campo para upload de receita */}
                <fieldset className="mb-4">
                  <legend>Receita (Foto ou PDF)</legend>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleReceitaChange}
                    className="form-input w-full border border-gray-400 rounded-lg px-3 py-2"
                  />
                  {receitaPreview && (
                    <img
                      src={receitaPreview}
                      alt="Pré-visualização da Receita"
                      className="mt-2 h-32 w-auto rounded-lg"
                    />
                  )}
                  {receitaFile && receitaFile.type === "application/pdf" && (
                    <p className="mt-2 text-sm text-gray-600">
                      Arquivo PDF selecionado: {receitaFile.name}
                    </p>
                  )}
                  <p className="text-sm text-gray-600 mt-1">
                    Tipos permitidos: PNG, JPG, PDF. Limite: 5 MB.
                  </p>
                </fieldset>

                {/* Comprovante de endereço */}
                <fieldset className="mb-4">
                  <legend>Comprovante de Endereço</legend>
                  <input
                    type="file"
                    name="addressImage"
                    onChange={handleChange}
                    className="form-input w-full border border-gray-400 rounded-lg px-3 py-2"
                  />
                  {imagePreviews.addressImage && (
                    <img
                      src={imagePreviews.addressImage}
                      alt="Comprovante de Endereço"
                      className="mt-2 h-32 w-auto rounded-lg"
                    />
                  )}
                  <p className="text-sm text-gray-600 mt-1">
                    Tipos permitidos: png, gif, jpg. Limite: 4 MB.
                  </p>
                </fieldset>

                <fieldset className="mb-4">
                  <legend>Observações do Cliente</legend>
                  <textarea
                    name="observacoes"
                    value={formData.observacoes || ""}
                    onChange={handleChange}
                    className="form-textarea w-full h-16 border border-gray-400 rounded-lg px-3 py-2"
                    placeholder="Adicione aqui qualquer observação importante sobre o cliente."
                    rows="4" // Define uma altura inicial para o textarea
                  ></textarea>
                  <p className="text-sm text-gray-600 mt-1">
                    Utilize este campo para adicionar informações adicionais
                    sobre o cliente.
                  </p>
                </fieldset>

                {/* Outros campos do formulário */}
                <button
                  type="submit"
                  className="mt-4 btn btn-primary px-4 py-2 bg-[#9f206b] text-white rounded-lg hover:bg-[#e91e63] flex items-center justify-center"
                  disabled={loadingUserData} // Desativa o botão durante o carregamento
                >
                  {loadingUserData ? (
                    <svg
                      className="animate-spin h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8a8 8 0 01-8 8"
                      ></path>
                    </svg>
                  ) : (
                    "Salvar"
                  )}
                </button>
              </form>
            </main>
          </div>
        </div>
      </div>

      {/* Popup de sucesso */}
      {showSuccessPopup && (
        <div className="fixed bottom-5 right-5 bg-green-500 text-white p-4 rounded-lg shadow-lg transition-opacity duration-500">
          <p>Cliente adicionado com sucesso! Redirecionando...</p>
        </div>
      )}
    </div>
  );
}
