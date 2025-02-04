// components/ClientForm.js
import { useState } from 'react';
import { getDoc, setDoc, doc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { firestore } from '../lib/firebaseConfig';

export const ClientForm = ({ onSuccessRedirect }) => {
    const [formData, setFormData] = useState({});
    const [selectedFile, setSelectedFile] = useState(null);
    const [showSuccessPopup, setShowSuccessPopup] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value, files } = e.target;
        if (files) {
            setSelectedFile(files[0]);
        } else {
            setFormData((prevData) => ({ ...prevData, [name]: value }));
        }
    };

    const uploadImage = async () => {
        if (!selectedFile) return null;
        const storage = getStorage();
        const storageRef = ref(storage, `consumers/${selectedFile.name}`);
        const snapshot = await uploadBytes(storageRef, selectedFile);
        return await getDownloadURL(snapshot.ref);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const imageUrl = await uploadImage();
            const newClientData = { ...formData, imagem: imageUrl };
            const cpf = formData.cpf.replace(/\D/g, ''); // Remove caracteres não numéricos do CPF

            const docRef = doc(firestore, "consumers", cpf);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                alert("Erro: Este CPF já está cadastrado.");
                setLoading(false);
                return;
            }

            await setDoc(docRef, newClientData);
            setShowSuccessPopup(true);
            setTimeout(() => {
                setShowSuccessPopup(false);
                if (onSuccessRedirect) onSuccessRedirect(); // Redireciona ou faz algo após o sucesso
            }, 3000);
        } catch (error) {
            console.error('Erro ao adicionar cliente:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            {/* Campos do formulário */}
            <div>
                <label>Nome</label>
                <input
                    type="text"
                    name="nome"
                    onChange={handleChange}
                    className="form-input w-full border border-gray-400 rounded-lg px-3 py-2"
                    required
                />
            </div>

            <div>
                <label>CPF</label>
                <input
                    type="text"
                    name="cpf"
                    onChange={handleChange}
                    className="form-input w-full border border-gray-400 rounded-lg px-3 py-2"
                    required
                />
            </div>

            {/* Outros campos do formulário... */}

            <button
                type="submit"
                className="mt-4 bg-[#9f206b] text-white rounded-lg px-4 py-2"
                disabled={loading}
            >
                {loading ? 'Salvando...' : 'Salvar'}
            </button>

            {showSuccessPopup && (
                <div className="fixed bottom-5 right-5 bg-green-500 text-white p-4 rounded-lg shadow-lg">
                    Cliente adicionado com sucesso!
                </div>
            )}
        </form>
    );
};
