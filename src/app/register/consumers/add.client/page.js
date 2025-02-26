"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, doc, setDoc } from "firebase/firestore";
import { firestore } from "../../../../lib/firebaseConfig";
import { useAuth } from "@/hooks/useAuth";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Layout from "@/components/Layout";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function ClientePage() {
  const { userPermissions, userData, user } = useAuth();
  const [selectedLoja, setSelectedLoja] = useState(null);
  const [formData, setFormData] = useState({});
  const [loadingUserData, setLoadingUserData] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  // ... outros estados permanecem os mesmos ...

  // Definir loja inicial baseado nas permissões
  useEffect(() => {
    if (userPermissions) {
      if (!userPermissions.isAdmin && userPermissions.lojas.length > 0) {
        setSelectedLoja(userPermissions.lojas[0]);
      }
      else if (userPermissions.isAdmin && userPermissions.lojas.length > 0) {
        setSelectedLoja(userPermissions.lojas[0]);
      }
    }
  }, [userPermissions]);

  // Função para verificar se o cliente já existe
  const checkIfClientExists = async (identifier, lojaId) => {
    try {
      const docRef = doc(firestore, `lojas/${lojaId}/clientes/${identifier}`);
      const docSnap = await getDoc(docRef);
      return docSnap.exists();
    } catch (error) {
      console.error("Erro ao verificar duplicidade:", error);
      return false;
    }
  };

  // Upload de imagem modificado para incluir a loja
  const uploadImage = async (file, fileName, lojaId) => {
    if (!file) return null;

    const storage = getStorage();
    const storageRef = ref(storage, `lojas/${lojaId}/clientes/${fileName}`);

    const snapshot = await uploadBytes(storageRef, file);
    return await getDownloadURL(snapshot.ref);
  };

  // Função para capturar mudanças nos campos do formulário
  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (files && files.length > 0) {
      // Atualiza formData com o arquivo
      setFormData(prev => ({ ...prev, [name]: files[0] }));

      // Cria e armazena a URL de visualização da imagem
      setImagePreviews(prev => ({
        ...prev,
        [name]: URL.createObjectURL(files[0])
      }));
    } else {
      // Atualiza formData com o valor do campo de texto
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // Função para buscar o endereço via API do ViaCEP
  const handleCepChange = async (e) => {
    const cep = e.target.value.replace(/\D/g, '');
    if (cep.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await response.json();
        if (!data.erro) {
          setFormData(prev => ({
            ...prev,
            cep: e.target.value,
            logradouro: data.logradouro,
            bairro: data.bairro,
            cidade: data.localidade,
            estado: data.uf
          }));
        }
      } catch (error) {
        console.error("Erro ao buscar o endereço:", error);
      }
    } else {
      setFormData(prev => ({ ...prev, cep: e.target.value }));
    }
  };

  // Função para lidar com os filhos
  const handleAddFilho = () => {
    setFilhos(prev => [...prev, { nome: "", idade: "", telefone: "" }]);
  };

  const handleFilhoChange = (index, field, value) => {
    setFilhos(prev => {
      const newFilhos = [...prev];
      newFilhos[index] = { ...newFilhos[index], [field]: value };
      return newFilhos;
    });
  };

  const handleRemoveFilho = (index) => {
    setFilhos(prev => prev.filter((_, i) => i !== index));
  };

  // Estados do componente
  const [imagePreviews, setImagePreviews] = useState({});
  const [filhos, setFilhos] = useState([]);
  const [emprego, setEmprego] = useState({
    cargo: "",
    empresa: "",
    telefone: "",
    endereco: ""
  });

  // Função para atualizar dados do emprego
  const handleEmpregoChange = (e) => {
    const { name, value } = e.target;
    setEmprego(prev => ({
      ...prev,
      [name]: value
    }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedLoja) {
      alert("Selecione uma loja primeiro!");
      return;
    }

    if (loadingUserData) return;
    setLoadingUserData(true);

    try {
      const identifier = formData.cpf ? formData.cpf.replace(/\D/g, "") : "";
      
      // Verifica se o cliente já existe na loja selecionada
      const exists = await checkIfClientExists(identifier, selectedLoja);
      if (exists) {
        alert("Este cliente já está cadastrado nesta loja.");
        setLoadingUserData(false);
        return;
      }

      // Upload das imagens com o contexto da loja
      const rgImageUrl = await uploadImage(formData.rgImage, `rg-${identifier}`, selectedLoja);
      const cpfImageUrl = await uploadImage(formData.cpfImage, `cpf-${identifier}`, selectedLoja);
      const addressImageUrl = await uploadImage(formData.addressImage, `address-${identifier}`, selectedLoja);
      const clientImageUrl = await uploadImage(formData.imagem, `client-${identifier}`, selectedLoja);

      // Monta o objeto do cliente
      const { rgImage, cpfImage, addressImage, imagem, ...clientData } = formData;
      const clientToSave = {
        ...clientData,
        rgImageUrl,
        cpfImageUrl,
        addressImageUrl,
        clientImageUrl,
        cpf: identifier,
        createdAt: new Date(),
        createdBy: userData?.nome || user?.email,
        updatedAt: new Date()
      };

      // Salva o cliente na subcoleção correta da loja
      await setDoc(
        doc(firestore, `lojas/${selectedLoja}/clientes/${identifier}`), 
        clientToSave
      );

      setShowSuccessPopup(true);
      setTimeout(() => {
        router.push(`/register/${selectedLoja}/list-clients`);
      }, 3000);
      
    } catch (error) {
      console.error("Erro ao adicionar cliente:", error);
      alert("Erro ao salvar cliente. Por favor, tente novamente.");
    } finally {
      setLoadingUserData(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen p-4">
        <div className="w-full max-w-3xl mx-auto bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-purple-700 mb-6">
            Adicionar Cliente
          </h1>

          {/* Seletor de Loja para Admins */}
          {userPermissions?.isAdmin && (
            <div className="mb-6">
              <label className="text-purple-700 font-medium">Selecionar Loja</label>
              <select
                value={selectedLoja || ''}
                onChange={(e) => setSelectedLoja(e.target.value)}
                className="w-full border-2 border-purple-700 rounded-lg p-2 mt-1"
              >
                <option value="">Selecione uma loja</option>
                {userPermissions.lojas.map((loja) => (
                  <option key={loja} value={loja}>
                    {loja === 'loja1' ? 'Loja 1' : 'Loja 2'}
                  </option>
                ))}
              </select>
            </div>
          )}

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
        </div>
      </div>
    </Layout>
  );
}
}