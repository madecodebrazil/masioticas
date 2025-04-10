import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAuth } from "firebase/auth";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, firestore, storage } from "../lib/firebaseConfig";
import { FiUser, FiMail, FiLock, FiBriefcase, FiShield, FiHome, FiImage, FiUserPlus } from 'react-icons/fi';

const AdminRegisterForm = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    cpf: "",
    phoneNumber: "",
    level_perm: "1",
    loja: [],
    cargo: "",
    imageUrl: "",
    isAdmin: false,
    adminAccess: {
      acesso_total: false,
      lojas: []
    }
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);

  const permissionLevels = {
    "3": "3 - Acesso Total",
    "2": "2 - Acesso Parcial",
    "1": "1 - Apenas Vendas"
  };

  const professions = [
    "Selecione uma profissão",
    "Desenvolvedor Full Stack",
    "SEO",
    "Vendedor(a)",
    "Oftalmologista",
    "Advogado",
    "Optometrista",
    "Gerente",
    "Tia do Lanche"
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Por favor, selecione apenas arquivos de imagem.');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('A imagem deve ter no máximo 5MB.');
        return;
      }

      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLojaChange = (e) => {
    const { value, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      loja: checked
        ? [...prev.loja, value]
        : prev.loja.filter(l => l !== value)
    }));
  };

  const handleAdminChange = (e) => {
    const { name, checked } = e.target;
    if (name === 'isAdmin') {
      setFormData(prev => ({
        ...prev,
        isAdmin: checked,
        adminAccess: checked ? prev.adminAccess : { acesso_total: false, lojas: [] }
      }));
    } else if (name === 'acesso_total') {
      setFormData(prev => ({
        ...prev,
        adminAccess: {
          ...prev.adminAccess,
          acesso_total: checked,
          lojas: checked ? ['loja1', 'loja2'] : []
        }
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
        if (!formData.email || !formData.password) {
            setError("Email e senha são obrigatórios");
            setLoading(false);
            return;
        }

        if (formData.loja.length === 0) {
            setError("Selecione pelo menos uma loja");
            setLoading(false);
            return;
        }

        // Upload da imagem
        let imageUrl = "";
        if (imageFile) {
            const fileName = `${Date.now()}-${imageFile.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
            const storageRef = ref(storage, `profile-images/${fileName}`);
            const uploadResult = await uploadBytes(storageRef, imageFile);
            imageUrl = await getDownloadURL(uploadResult.ref);
        }

        // Criar uma nova instância do auth
        const secondaryAuth = getAuth();

        // Criar o usuário com a instância secundária
        const { user } = await createUserWithEmailAndPassword(
            secondaryAuth,
            formData.email,
            formData.password
        );

        const userData = {
            nome: formData.name,
            cpf: formData.cpf,
            email: formData.email,
            phoneNumber: formData.phoneNumber,
            level_perm: formData.level_perm,
            cargo: formData.cargo,
            imageUrl: imageUrl,
            createdAt: new Date().toISOString()
        };

        const savePromises = [];

        // Salvar dados nas lojas selecionadas
        formData.loja.forEach(loja => {
            savePromises.push(
                setDoc(doc(firestore, `lojas/${loja}/users/${user.uid}`), userData)
            );
        });

        // Se for admin, salvar na coleção de admins
        if (formData.isAdmin) {
            const adminData = {
                nome: formData.name,
                email: formData.email,
                isAdmin: true,
                cargo: formData.cargo,
                acesso_total: formData.adminAccess.acesso_total,
                permissoes: {
                    acesso_total: formData.adminAccess.acesso_total,
                    lojas: formData.adminAccess.lojas
                }
            };
            savePromises.push(setDoc(doc(firestore, `admins/${user.uid}`), adminData));
        }

        await Promise.all(savePromises);

        // Fazer logout da instância secundária
        await secondaryAuth.signOut();

        setSuccess(true);
        setLoading(false);
        setTimeout(() => router.push('/homepage'), 3000);

    } catch (err) {
        console.error("Erro completo:", err);
        setError(err.message || "Erro ao registrar usuário");
        setLoading(false);
    }
};

  return (
    <div className="min-h-screen">
      <div className="w-full max-w-5xl mx-auto rounded-lg">
        <h2 className="text-3xl font-bold text-[#81059e] mb-8 mt-8 flex items-center gap-2">
          + NOVO COLABORADOR
        </h2>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        
        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-6" role="alert">
            <span className="block sm:inline">Colaborador registrado com sucesso! Redirecionando...</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 mb-20">
          {/* Seção Informações Pessoais */}
          <div className="p-4 bg-gray-50 rounded-lg mb-6">
            <h3 className="text-lg font-semibold text-[#81059e] mb-4 flex items-center gap-2">
              <FiUser /> Informações Pessoais
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
              <div>
                <label className="block text-[#81059e] font-medium mb-2">Nome Completo</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black"
                  required
                />
              </div>
              
              <div>
                <label className="block text-[#81059e] font-medium mb-2">CPF</label>
                <input
                  type="text"
                  name="cpf"
                  value={formData.cpf}
                  onChange={handleInputChange}
                  className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black"
                  placeholder="000.000.000-00"
                />
              </div>
              
              <div>
                <label className="block text-[#81059e] font-medium mb-2">Telefone</label>
                <input
                  type="text"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black"
                  placeholder="(00) 00000-0000"
                />
              </div>
              
              <div>
                <label className="block text-[#81059e] font-medium mb-2 flex items-center gap-1">
                  <FiImage /> Foto de Perfil
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                  />
                  <div className="flex items-center border-2 border-[#81059e] py-2 px-3 rounded-lg w-full text-black">
                    <span className="flex-1 truncate">
                      {imageFile ? imageFile.name : "Escolher arquivo..."}
                    </span>
                    <button type="button" className="bg-purple-100 text-[#81059e] px-3 py-1 rounded-md ml-2">
                      Procurar
                    </button>
                  </div>
                </div>
                
                {imagePreview && (
                  <div className="mt-4 flex justify-center">
                    <img src={imagePreview} alt="Preview" className="w-32 h-32 object-cover rounded-full border-2 border-[#81059e]" />
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Seção Acesso */}
          <div className="p-4 bg-gray-50 rounded-lg mb-6">
            <h3 className="text-lg font-semibold text-[#81059e] mb-4 flex items-center gap-2">
              <FiMail /> Informações de Acesso
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[#81059e] font-medium mb-2">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black"
                  required
                />
              </div>
              
              <div>
                <label className="block text-[#81059e] font-medium mb-2">Senha</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black"
                  required
                />
              </div>
            </div>
          </div>
          
          {/* Seção Cargo */}
          <div className="p-4 bg-gray-50 rounded-lg mb-6">
            <h3 className="text-lg font-semibold text-[#81059e] mb-4 flex items-center gap-2">
              <FiBriefcase /> Cargo e Permissões
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[#81059e] font-medium mb-2">Profissão/Cargo</label>
                <select
                  name="cargo"
                  value={formData.cargo}
                  onChange={handleInputChange}
                  className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black"
                  required
                >
                  <option value="">Selecione uma profissão</option>
                  {professions.slice(1).map((profession) => (
                    <option key={profession} value={profession}>
                      {profession}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-[#81059e] font-medium mb-2">Nível de Permissão</label>
                <select
                  name="level_perm"
                  value={formData.level_perm}
                  onChange={handleInputChange}
                  className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black"
                >
                  {Object.entries(permissionLevels).map(([level, description]) => (
                    <option key={level} value={level}>
                      {description}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          
          {/* Seção Lojas */}
          <div className="p-4 bg-gray-50 rounded-lg mb-6">
            <h3 className="text-lg font-semibold text-[#81059e] mb-4 flex items-center gap-2">
              <FiHome /> Lojas de Atuação
            </h3>
            
            <div className="space-y-4">
              <div className="flex flex-wrap gap-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    value="loja1"
                    checked={formData.loja.includes("loja1")}
                    onChange={handleLojaChange}
                    className="form-checkbox h-5 w-5 text-[#81059e] mr-2"
                  />
                  <span className="text-gray-700">Loja 1 - Centro</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    value="loja2"
                    checked={formData.loja.includes("loja2")}
                    onChange={handleLojaChange}
                    className="form-checkbox h-5 w-5 text-[#81059e] mr-2"
                  />
                  <span className="text-gray-700">Loja 2 - Caramuru</span>
                </label>
              </div>
            </div>
          </div>
          
          {/* Seção Admin */}
          <div className="p-4 bg-gray-50 rounded-lg mb-6">
            <h3 className="text-lg font-semibold text-[#81059e] mb-4 flex items-center gap-2">
              <FiShield /> Acesso Administrativo
            </h3>
            
            <div className="space-y-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="isAdmin"
                  checked={formData.isAdmin}
                  onChange={handleAdminChange}
                  className="form-checkbox h-5 w-5 text-[#81059e] mr-2"
                />
                <span className="text-gray-700 font-medium">Tornar Administrador</span>
              </label>
              
              {formData.isAdmin && (
                <div className="ml-8 mt-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="acesso_total"
                      checked={formData.adminAccess.acesso_total}
                      onChange={handleAdminChange}
                      className="form-checkbox h-5 w-5 text-[#81059e] mr-2"
                    />
                    <span className="text-gray-700">Acesso Total a Todas as Lojas</span>
                  </label>
                  <p className="text-sm text-gray-500 mt-2 ml-7">
                    Esta opção dá ao administrador acesso completo a todas as lojas do sistema.
                  </p>
                </div>
              )}
            </div>
          </div>
          
          {/* Botões de ação */}
          <div className="flex justify-center gap-4 mt-8">
            <button
              type="button"
              onClick={() => router.push('/homepage')}
              className="border-2 border-[#81059e] p-3 px-6 rounded-sm text-[#81059e] font-medium"
              disabled={loading}
            >
              CANCELAR
            </button>
            
            <button
              type="submit"
              className="bg-[#81059e] p-3 px-6 rounded-sm text-white font-medium"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  PROCESSANDO...
                </div>
              ) : (
                "REGISTRAR COLABORADOR"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminRegisterForm;