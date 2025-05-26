"use client";
import React, { useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation'; // Para redirecionamento
import { auth, firestore, storage } from '../../lib/firebaseConfig'; // Importe a instância do Firebase e Firestore
import { doc, getDoc, updateDoc } from 'firebase/firestore'; // Para buscar e atualizar dados do Firestore
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'; // Para manipular o Firebase Storage
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faAngleLeft,
    faHome,
    faSearch,
    faUser as faUserIcon
} from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion'; // Importando o framer-motion

// Função para criar a imagem circular usando canvas
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

const Profile = () => {
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState(null); // Para armazenar os dados do Firestore
    const [loading, setLoading] = useState(true); // Estado de carregamento
    const [newImage, setNewImage] = useState(null); // Armazenar a nova imagem selecionada
    const [previewImage, setPreviewImage] = useState(null); // Pré-visualização circular
    const router = useRouter();

    useEffect(() => {
        // Função para buscar os dados do usuário logado no Firestore
        const fetchUserData = async (uid) => {
            const docRef = doc(firestore, `loja1/users/${uid}/dados`);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                setUserData(docSnap.data());
            } else {
                console.log('Nenhum documento encontrado para o UID:', uid);
            }

            setLoading(false); // Conclui o carregamento
        };

        // Verifica o estado de autenticação do usuário
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setUser(user);
                await fetchUserData(user.uid); // Busca os dados do Firestore usando o uid
            } else {
                router.push('/login'); // Redireciona para login se não estiver logado
            }
        });

        return () => unsubscribe();
    }, [router]);

    // Função para deslogar o usuário
    const handleSignOut = async () => {
        try {
            await signOut(auth);
            router.push('/login'); // Redireciona após sair
        } catch (error) {
            console.error('Erro ao sair:', error);
        }
    };

    // Função para lidar com o upload da nova imagem
    const handleImageChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            try {
                // Criar pré-visualização circular
                const circularImage = await getCircularImage(file);
                const previewUrl = URL.createObjectURL(circularImage);
                setNewImage(circularImage); // Define a imagem circular para upload
                setPreviewImage(previewUrl); // Define a imagem de pré-visualização
            } catch (error) {
                console.error("Erro ao processar a imagem:", error);
            }
        }
    };

    // Função para enviar a nova imagem para o Firebase Storage e atualizar o Firestore
    const handleImageUpload = async () => {
        if (!newImage || !user) return;

        try {
            // Referência ao local da imagem no Firebase Storage
            const imageRef = ref(storage, `userImages/${user.uid}`);

            // Se o usuário já tiver uma imagem, deletar a antiga
            if (userData.imageUrl) {
                const oldImageRef = ref(storage, userData.imageUrl);
                await deleteObject(oldImageRef); // Deleta a imagem antiga
            }

            // Upload da nova imagem circular
            await uploadBytes(imageRef, newImage);
            const downloadURL = await getDownloadURL(imageRef); // Obtenha o novo URL da imagem

            // Atualizar o Firestore com o novo URL da imagem
            const userDocRef = doc(firestore, `loja1/users/${user.uid}/dados`);
            await updateDoc(userDocRef, {
                imageUrl: downloadURL,
            });

            // Atualiza os dados do usuário localmente
            setUserData((prev) => ({ ...prev, imageUrl: downloadURL }));
            setNewImage(null); // Limpa a seleção da nova imagem
            setPreviewImage(null); // Limpa a pré-visualização

            alert("Foto de perfil atualizada com sucesso!");
        } catch (error) {
            console.error("Erro ao atualizar a foto de perfil:", error);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#81059e]"></div>
            </div>
        );
    }

    if (!userData) {
        return (
            <div className="flex justify-center items-center h-screen">
                <p>Usuário não encontrado.</p>
            </div>
        );
    }

    // Verifica se a imagem do Firestore existe, caso contrário, define uma imagem padrão
    const userPhotoURL = previewImage || userData.imageUrl || '/default-avatar.png'; // Pega o link da imagem do Firestore ou da pré-visualização

    return (
        <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '-100%' }}
            transition={{ duration: 0.3 }}
            className="flex flex-col min-h-screen bg-gray-100"
        >
            {/* Header */}
            <header className="bg-white text-[#9f206b] p-4 fixed top-0 left-0 w-full shadow-md z-10">
                <div className="container mx-auto flex items-center justify-between">
                    {/* Botão de Retorno */}
                    <button
                        onClick={() => router.push('/homepage')}
                        className="focus:outline-none"
                    >
                        <FontAwesomeIcon icon={faAngleLeft} className="text-[#9f206b] text-2xl" />
                    </button>

                    {/* Título */}
                    <img
                        src="/images/logo.png" // Caminho atualizado
                        alt="MASI Eyewear"
                        className="h-10"
                        onClick={() => router.push('/homepage')}
                        style={{ cursor: 'pointer' }}
                    />

                    <div className="w-6" /> {/* Espaço para alinhar */}
                </div>
            </header>

            {/* Perfil do Usuário */}
            <div className="flex-1 flex items-center justify-center mt-16">
                <div className="bg-white rounded-lg p-10 w-96 drop-shadow-[0_0_10px_#9f206b] drop-shadow-[0_0_20px_#9f206b] drop-shadow-[0_0_40px_#9f206b]">
                    <div className="flex flex-col items-center">
                        <img
                            src={userPhotoURL}
                            alt="User Avatar"
                            className="w-28 h-28 rounded-full object-cover mb-4"
                        />
                        <h2 className="text-gray-900 text-xl font-bold mb-2">{userData.name || 'Usuário'}</h2>

                        {/* Verifica o nível de permissão */}
                        {userData && userData.level_perm === 'user' && (
                            <h3 className="text-pink-600 text-lg font-semibold">Vendedor</h3>
                        )}
                        {userData && userData.level_perm === 'dev' && (
                            <h3 className="text-pink-600 text-lg font-semibold">Desenvolvedor</h3>
                        )}

                        {/* Input para selecionar nova foto */}
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="mt-4"
                        />

                        {/* Exibe a pré-visualização da nova imagem se disponível */}
                        {previewImage && (
                            <div className="flex justify-center mb-4">
                                <img
                                    src={previewImage}
                                    alt="Preview"
                                    className="w-24 h-24 rounded-full object-cover"
                                />
                            </div>
                        )}

                        {/* Botão para fazer o upload da nova imagem */}
                        {newImage && (
                            <button
                                className="bg-green-500 text-white px-4 py-2 rounded-lg mt-4 w-full hover:bg-green-800"
                                onClick={handleImageUpload}
                            >
                                Atualizar Foto
                            </button>
                        )}

                    </div>
                    <div className="mt-4">
                        <h3 className="text-gray-900 text-lg font-semibold">Informações Adicionais</h3>
                        <ul className="mt-2">
                            <li className="text-gray-600 mb-4">{userData.email}</li>
                            <li className="text-gray-700">CPF: {userData.cpf}</li>
                            <li className="text-gray-700">UID: {user.uid}</li>
                            <li className="text-gray-700">Telefone: {userData.phoneNumber || 'Não disponível'}</li>
                        </ul>
                    </div>
                    <div className="mt-6">
                        <button
                            className="bg-red-500 text-white px-4 py-2 rounded-lg w-full hover:bg-red-800"
                            onClick={handleSignOut}
                        >
                            Sair
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default Profile;
