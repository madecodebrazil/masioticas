"use client";
import { useState, useEffect } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth, firestore, storage } from "../../lib/firebaseConfig";
import { doc, setDoc, getDocs, query, collection, where } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { motion } from "framer-motion";

// Função para adicionar máscara ao CPF e limitar a 11 dígitos
const formatCPF = (value) => {
  value = value.replace(/\D/g, "");
  if (value.length > 11) {
    value = value.slice(0, 11);
  }
  return value
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
};

// Verifica se o CPF ou telefone já está cadastrado
const checkFieldExists = async (field, value) => {
  const q = query(collection(firestore, "colaboradores"), where(field, "==", value));
  const querySnapshot = await getDocs(q);
  return !querySnapshot.empty; // Retorna true se já existe
};

// Função para transformar a imagem em formato circular usando canvas
const getCircularImage = (imageFile) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (event) => {
      img.src = event.target.result;
      img.onload = () => {
        const size = Math.min(img.width, img.height);
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");

        // Desenhar um círculo
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();

        // Desenhar a imagem no canvas
        ctx.drawImage(img, (img.width - size) / 2, (img.height - size) / 2, size, size, 0, 0, size, size);

        // Converter para blob (formato adequado para upload)
        canvas.toBlob((blob) => {
          resolve(blob);
        }, "image/png");
      };
    };

    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(imageFile);
  });
};

export default function RegisterScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [cpf, setCpf] = useState("");
  const [name, setName] = useState("");
  const [phoneNumber, setPhone] = useState("");
  const [loja, setLoja] = useState([]); // Array para armazenar lojas selecionadas
  const [error, setError] = useState("");
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [image, setImage] = useState(null); // Imagem original para upload
  const [previewImage, setPreviewImage] = useState(null); // Imagem de pré-visualização
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [isMobile, setIsMobile] = useState(false); // Estado para detectar mobile
  const router = useRouter();

  // Função para processar e exibir a imagem circular de pré-visualização
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        // Cria a versão circular da imagem
        const circularImage = await getCircularImage(file);

        // Converte o blob circular em uma URL para pré-visualização
        const previewUrl = URL.createObjectURL(circularImage);

        // Define a imagem para upload e a pré-visualização
        setImage(circularImage); // O estado agora contém a imagem circular
        setPreviewImage(previewUrl); // Define a imagem de pré-visualização circular
      } catch (error) {
        console.error("Erro ao processar a imagem:", error);
      }
    }
  };

  // Função para lidar com a seleção de lojas
  const handleLojaChange = (e) => {
    const { value, checked } = e.target;
    if (checked) {
      setLoja((prevLoja) => [...prevLoja, value]); // Adiciona a loja ao array
    } else {
      setLoja((prevLoja) => prevLoja.filter((l) => l !== value)); // Remove a loja do array
    }
  };

  // Função para lidar com o registro e envio da imagem circular ao Firebase
  const handleRegister = async (e) => {
    e.preventDefault();

    try {
      setIsButtonDisabled(true);

      // Verifica se o CPF já está registrado
      const cpfExists = await checkFieldExists("cpf", cpf);
      if (cpfExists) {
        setError("CPF já cadastrado.");
        setIsButtonDisabled(false);
        return;
      }

      // Verifica se o telefone já está registrado
      const phoneExists = await checkFieldExists("phoneNumber", phoneNumber);
      if (phoneExists) {
        setError("Telefone já cadastrado.");
        setIsButtonDisabled(false);
        return;
      }

      // Cria o usuário no Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      let uploadedImageUrl = "";
      if (image) {
        const storageRef = ref(storage, `userImages/${user.uid}`);
        await uploadBytes(storageRef, image); // Envia a imagem circular para o Firebase Storage
        uploadedImageUrl = await getDownloadURL(storageRef);
      }

      const userData = {
        name,
        cpf,
        email,
        phoneNumber,
        imageUrl: uploadedImageUrl,
        level_perm: "user",
        loja: loja.length > 1 ? "Ambas" : loja[0], // Define a loja como "Ambas" ou a loja selecionada
      };

      // Envia os dados para as lojas selecionadas
      if (loja.includes("loja1")) {
        await setDoc(doc(firestore, `loja1/users/${user.uid}/dados`), userData);
      }
      if (loja.includes("loja2")) {
        await setDoc(doc(firestore, `loja2/users/${user.uid}/dados`), userData);
      }

      // Enviar o nome do usuário para a coleção "colaboradores" com o campo "loja"
      await setDoc(doc(firestore, `colaboradores/${user.uid}`), {
        name,
        cpf,
        email,
        phoneNumber,
        imageUrl: uploadedImageUrl,
        loja: loja.length > 1 ? "Ambas" : loja[0], // Campo loja adicionado com o valor correto
      });

      // Exibe o popup de sucesso e redireciona após 3 segundos
      setShowSuccessPopup(true);
      setTimeout(() => {
        router.push("/homepage");
      }, 3000);
    } catch (err) {
      if (err.code === "auth/email-already-in-use") {
        setError("Este e-mail já está sendo utilizado.");
      } else if (err.code === "auth/weak-password") {
        setError("A senha é muito fraca. Use pelo menos 6 caracteres.");
      } else {
        setError("Erro ao registrar. Verifique os dados e tente novamente.");
      }
      setIsButtonDisabled(false);
    }
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768); // Define como mobile se a largura da tela for <= 768px
    };

    handleResize(); // Verificar imediatamente ao carregar
    window.addEventListener("resize", handleResize); // Atualizar quando a janela for redimensionada

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col md:flex-row min-h-screen w-full bg-white relative overflow-hidden"
      style={{
        height: "auto", // Altura automática, para permitir que cresça com o conteúdo
        overflowY: "auto", // Habilita o scroll vertical quando necessário
      }}
    >
      <div
        dir="rtl"
        className="relative z-20 hidden md:flex w-[45%] bg-gradient-to-r from-[#932A83] to-[#B855A9] shadow-[0px_20px_50px_rgba(0,0,0,0.25)] items-center justify-center rounded-tr-[30px] rounded-br-[30px]"
        style={{
          height: "auto", // Altura automática
          flexGrow: 1, // Faz com que a div cresça com o conteúdo
          position: "relative", // Para manter a imagem no lugar
        }}
      >
        <img
          src="/images/estartic.png"
          alt="Estático"
          className="w-[75%] h-auto absolute transform -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2"
        />
      </div>

      {/* Formulário de registro para desktop e mobile */}
      <div
        className="relative z-10 w-full md:w-[55%] flex flex-col justify-center items-center bg-white p-4"
        style={{
          flexGrow: 1, // Garante que a altura cresça com o conteúdo
          borderRadius: "30px 0 0 30px", // Arredondamento no lado esquerdo superior e inferior
        }}
      >
        <img
          src="/images/logo.png"
          alt="Logo"
          className="logo mb-8 max-w-[150px] max-h-[150px] w-full h-auto"
        />
        <div className="w-full max-w-xs">
          <h2 className="text-center text-pink-600 text-3xl font-semibold mb-6">
            REGISTRAR-SE
          </h2>

          {error && (
            <p className="text-red-500 text-sm text-center mb-4">{error}</p>
          )}

          <form onSubmit={handleRegister} className="flex flex-col">
            <label htmlFor="name" className="text-pink-600 pb-2">
              Nome
            </label>
            <input
              type="text"
              id="name"
              placeholder="Digite seu nome"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="text-black mb-4 px-4 py-3 rounded-lg bg-gray-200 w-full"
              required
            />

            <label htmlFor="cpf" className="text-pink-600 pb-2">
              CPF
            </label>
            <input
              type="text"
              id="cpf"
              placeholder="Digite seu CPF"
              value={formatCPF(cpf)} // Aplica a máscara
              onChange={(e) => setCpf(e.target.value)} // Limita a 11 números
              className="text-black mb-4 px-4 py-3 rounded-lg bg-gray-200 w-full"
              required
            />

            <label htmlFor="email" className="text-pink-600 pb-2">
              E-mail
            </label>
            <input
              type="email"
              id="email"
              placeholder="Digite seu e-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="text-black mb-4 px-4 py-3 rounded-lg bg-gray-200 w-full"
              required
            />

            <label htmlFor="password" className="text-pink-600 pb-2">
              Senha
            </label>
            <input
              type="password"
              id="password"
              placeholder="Digite sua senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="text-black mb-4 px-4 py-3 rounded-lg bg-gray-200 w-full"
              required
            />

            <label htmlFor="phoneNumber" className="text-pink-600 pb-2">
              Telefone
            </label>
            <input
              type="text"
              id="phoneNumber"
              placeholder="Digite seu telefone"
              value={phoneNumber}
              onChange={(e) => setPhone(e.target.value)}
              className="text-black mb-4 px-4 py-3 rounded-lg bg-gray-200 w-full"
              required
            />

            <label htmlFor="image" className="text-pink-600 pb-2">
              Imagem de perfil
            </label>
            <input
              type="file"
              id="image"
              accept="image/*"
              onChange={handleImageUpload}
              className="text-black mb-4 px-4 py-3 rounded-lg bg-gray-200 w-full"
            />

            {/* Pré-visualização da imagem de perfil */}
            {previewImage && (
              <div className="flex justify-center mb-4">
                <img
                  src={previewImage}
                  alt="Preview"
                  className="w-24 h-24 rounded-full object-cover"
                />
              </div>
            )}

            {/* Seletor de lojas */}
            <label className="text-pink-600 pb-2">Selecionar Loja</label>
            <div className="flex flex-col mb-4">
              <label className="text-black">
                <input
                  type="checkbox"
                  value="loja1"
                  onChange={handleLojaChange}
                  className="mr-2"
                />
                Loja 1
              </label>
              <label className="text-black">
                <input
                  type="checkbox"
                  value="loja2"
                  onChange={handleLojaChange}
                  className="mr-2"
                />
                Loja 2
              </label>
            </div>

            {/* Botões para desktop e mobile */}
            <div className="flex justify-center mt-6 gap-4">
              <button
                type="submit"
                className={`w-[110px] h-[35px] text-white bg-pink-600 rounded-md transition-all duration-300 ${
                  isButtonDisabled ? "opacity-50 cursor-not-allowed" : ""
                }`}
                disabled={isButtonDisabled}
              >
                {isButtonDisabled ? "Enviando..." : "Registrar"}
              </button>

              <button
                onClick={() => router.push("/homepage")}
                className="text-pink-600 border border-pink-600 rounded-lg px-4 py-2 hover:bg-pink-50 transition-colors"
              >
                Voltar para Homepage
              </button>
            </div>
          </form>
        </div>
      </div>

      {isMobile && (
        <div className="absolute top-0 w-full h-[120px] bg-gradient-to-b from-[#932A83] to-[#B855A9] rounded-b-[50px] flex justify-center items-center z-10">
          <img
            src="/images/estartic.png"
            alt="Imagem do topo"
            className="w-32 h-32"
          />
        </div>
      )}

      {showSuccessPopup && (
        <div className="fixed top-0 left-0 right-0 bottom-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-lg text-center">
            <h2 className="text-2xl font-bold text-green-600 mb-4">
              Registrado com sucesso!
            </h2>
            <p className="text-gray-700">
              Você será redirecionado para o login em instantes.
            </p>
          </div>
        </div>
      )}
    </motion.div>
  );
}
