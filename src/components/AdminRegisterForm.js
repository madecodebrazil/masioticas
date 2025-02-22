import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, firestore, storage } from "../lib/firebaseConfig";

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
    profession: "",
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
    "Optometrista"
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

    try {
      if (!formData.email || !formData.password) {
        setError("Email e senha são obrigatórios");
        return;
      }

      if (formData.loja.length === 0) {
        setError("Selecione pelo menos uma loja");
        return;
      }

      let imageUrl = "";
      if (imageFile) {
        const fileName = `${Date.now()}-${imageFile.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
        const storageRef = ref(storage, `profile-images/${fileName}`);
        const uploadResult = await uploadBytes(storageRef, imageFile);
        imageUrl = await getDownloadURL(uploadResult.ref);
      }

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      const user = userCredential.user;
      const userData = {
        nome: formData.name,
        cpf: formData.cpf,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        level_perm: formData.level_perm,
        cargo: formData.profession,
        imageUrl: imageUrl,
        createdAt: new Date().toISOString()
      };

      const savePromises = [];

      // Salva em cada loja selecionada - CORRIGIDO O CAMINHO
      formData.loja.forEach(loja => {
        savePromises.push(
          // Aqui está a correção principal
          setDoc(doc(firestore, `lojas/${loja}/users/${user.uid}`), userData)
        );
      });

      // Se for admin, salva na coleção de admins
      if (formData.isAdmin) {
        const adminData = {
          nome: formData.name,
          email: formData.email,
          isAdmin: true,
          acesso_total: formData.adminAccess.acesso_total,
          permissoes: {
            acesso_total: formData.adminAccess.acesso_total,
            lojas: formData.adminAccess.lojas
          }
        };
        savePromises.push(setDoc(doc(firestore, `admins/${user.uid}`), adminData));
      }

      await Promise.all(savePromises);
      await signOut(auth);
      setSuccess(true);
      setTimeout(() => router.push('/homepage'), 3000);
    } catch (err) {
      console.error("Erro completo:", err);
      setError(err.message || "Erro ao registrar usuário");
    }
};

  return (
    <div className="w-full max-w-md mx-auto p-6">
      <h2 className="text-2xl font-bold text-pink-600 mb-6">Adicionar Colaborador</h2>
      {error && <div className="text-red-500 mb-4">{error}</div>}
      {success && <div className="text-green-500 mb-4">Colaborador registrado com sucesso!</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-pink-600 mb-2">Foto de Perfil</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="w-full px-4 py-2 rounded-lg bg-gray-200 text-black"
          />
          {imagePreview && (
            <div className="mt-2">
              <img src={imagePreview} alt="Preview" className="w-32 h-32 object-cover rounded-full mx-auto" />
            </div>
          )}
        </div>

        <div>
          <label className="block text-pink-600 mb-2">Nome</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className="w-full px-4 py-2 rounded-lg bg-gray-200 text-black"
            required
          />
        </div>

        <div>
          <label className="block text-pink-600 mb-2">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            className="w-full px-4 py-2 rounded-lg bg-gray-200 text-black"
            required
          />
        </div>

        <div>
          <label className="block text-pink-600 mb-2">Senha</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            className="w-full px-4 py-2 rounded-lg bg-gray-200 text-black"
            required
          />
        </div>

        <div>
          <label className="block text-pink-600 mb-2">Profissão</label>
          <select
            name="profession"
            value={formData.profession}
            onChange={handleInputChange}
            className="w-full px-4 py-2 rounded-lg bg-gray-200 text-black"
            required
          >
            {professions.map((profession, index) => (
              <option key={index} value={profession} disabled={index === 0}>
                {profession}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-pink-600 mb-2">Nível de Permissão</label>
          <select
            name="level_perm"
            value={formData.level_perm}
            onChange={handleInputChange}
            className="w-full px-4 py-2 rounded-lg bg-gray-200 text-black"
          >
            {Object.entries(permissionLevels).map(([level, description]) => (
              <option key={level} value={level}>
                {description}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-pink-600 mb-2">Selecionar Loja</label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                value="loja1"
                checked={formData.loja.includes("loja1")}
                onChange={handleLojaChange}
                className="mr-2"
              />
              Loja 1
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                value="loja2"
                checked={formData.loja.includes("loja2")}
                onChange={handleLojaChange}
                className="mr-2"
              />
              Loja 2
            </label>
          </div>
        </div>

        <div className="space-y-4 border-t pt-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="isAdmin"
              checked={formData.isAdmin}
              onChange={handleAdminChange}
              className="form-checkbox"
            />
            <span className="text-pink-600">Tornar Administrador</span>
          </label>

          {formData.isAdmin && (
            <div className="ml-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="acesso_total"
                  checked={formData.adminAccess.acesso_total}
                  onChange={handleAdminChange}
                  className="form-checkbox"
                />
                <span className="text-pink-600">Acesso Total</span>
              </label>
            </div>
          )}
        </div>

        <button
          type="submit"
          className="w-full bg-pink-600 text-white py-2 px-4 rounded-lg hover:bg-pink-700 transition-colors"
        >
          Registrar Colaborador
        </button>
      </form>
    </div>
  );
};

export default AdminRegisterForm;
