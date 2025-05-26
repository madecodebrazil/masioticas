import { useState, useEffect } from 'react';
import { getDoc, setDoc, doc, serverTimestamp, collection, addDoc, getDocs, query, where, updateDoc, limit } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { firestore } from '@/lib/firebaseConfig';

export const useClientForm = ({ selectedLoja, onSuccessRedirect, userId, userName }) => {
    // Estados do formulário
    const [formData, setFormData] = useState({
        nome: '',
        email: '',
        telefone: '',
        cpf: '',
        dataNascimento: '',
        genero: '',
        estadoCivil: '',      // <-- novo campo
        escolaridade: '',     // <-- novo campo
        profissao: '',        // <-- novo campo
        observacoes: '',
        parentesco: '',
        contatoAlternativo: {
            nome: '',
            telefone: '',
            relacao: ''
        },
        endereco: {
            cep: '',
            logradouro: '',
            numero: '',
            complemento: '',
            bairro: '',
            cidade: '',
            estado: ''
        }
    });

    // Todos os outros estados
    const [selectedFile, setSelectedFile] = useState(null);
    const [selectedFileName, setSelectedFileName] = useState('');
    const [imagePreview, setImagePreview] = useState(null);
    const [documentoFile, setDocumentoFile] = useState(null);
    const [comprovanteFile, setComprovanteFile] = useState(null);
    const [documentoPreview, setDocumentoPreview] = useState(null);
    const [comprovantePreview, setComprovantePreview] = useState(null);
    const [showSuccessPopup, setShowSuccessPopup] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [fetchingCep, setFetchingCep] = useState(false);
    const [isTitular, setIsTitular] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [consumers, setConsumers] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedTitular, setSelectedTitular] = useState('');

    const debounce = (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    };

    const validarCPF = (cpf) => {
        cpf = cpf.replace(/\D/g, '');
        if (cpf.length !== 11) return false;
        if (/^(\d)\1{10}$/.test(cpf)) return false;

        let soma = 0;
        let resto;

        for (let i = 1; i <= 9; i++) {
            soma += parseInt(cpf.substring(i - 1, i)) * (11 - i);
        }

        resto = (soma * 10) % 11;
        if (resto === 10 || resto === 11) resto = 0;
        if (resto !== parseInt(cpf.substring(9, 10))) return false;

        soma = 0;
        for (let i = 1; i <= 10; i++) {
            soma += parseInt(cpf.substring(i - 1, i)) * (12 - i);
        }

        resto = (soma * 10) % 11;
        if (resto === 10 || resto === 11) resto = 0;
        if (resto !== parseInt(cpf.substring(10, 11))) return false;

        return true;
    };

    const validarEmail = (email) => {
        const regex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
        return regex.test(email);
    };

    const uploadImage = async (cpf) => {
        if (!selectedFile) return null;
        try {
            const storage = getStorage();
            const fileName = `${Date.now()}-${selectedFile.name.replace(/[^a-zA-Z0-9.-]/g, '')}`;
            const storageRef = ref(storage, `clientes/${cpf}/${fileName}`);
            const snapshot = await uploadBytes(storageRef, selectedFile);
            return await getDownloadURL(snapshot.ref);
        } catch (error) {
            console.error("Erro ao fazer upload da imagem:", error);
            return null;
        }
    };

    const uploadDocument = async (file, cpf, type) => {
        if (!file) return null;
        try {
            const storage = getStorage();
            const fileName = `${Date.now()}-${type}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '')}`;
            const storageRef = ref(storage, `clientes/${cpf}/documentos/${fileName}`);
            const snapshot = await uploadBytes(storageRef, file);
            return await getDownloadURL(snapshot.ref);
        } catch (error) {
            console.error(`Erro ao fazer upload do ${type}:`, error);
            return null;
        }
    };

    const fetchAddressByCep = async (cep) => {
        const cleanCep = cep.replace(/\D/g, '');
        if (!cleanCep || cleanCep.length !== 8) return;

        setFetchingCep(true);
        setError('');

        try {
            const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
            const data = await response.json();

            if (!data.erro) {
                setFormData(prev => ({
                    ...prev,
                    endereco: {
                        ...prev.endereco,
                        cep: cep,
                        logradouro: data.logradouro || '',
                        bairro: data.bairro || '',
                        cidade: data.localidade || '',
                        estado: data.uf || ''
                    }
                }));
            } else {
                setError('CEP não encontrado. Verifique se o número está correto.');
            }
        } catch (error) {
            setError(`Erro ao buscar CEP: ${error.message || 'Tente novamente mais tarde.'}`);
        } finally {
            setFetchingCep(false);
        }
    };

    const debouncedFetchCep = debounce(fetchAddressByCep, 500);

    const handleChange = (e) => {
        const { name, value, files } = e.target;

        if (files) {
            setSelectedFile(files[0]);
            setSelectedFileName(files[0].name);
        } else if (name.includes('.')) {
            const [parent, child] = name.split('.');
            setFormData((prevData) => ({
                ...prevData,
                [parent]: {
                    ...prevData[parent],
                    [child]: value
                }
            }));

            if (parent === 'endereco' && child === 'cep') {
                const cleanCep = value.replace(/\D/g, '');
                if (cleanCep.length === 8) {
                    debouncedFetchCep(value);
                }
            }
        } else {
            setFormData((prevData) => ({ ...prevData, [name]: value }));
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            setSelectedFileName(file.name);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const createFilePreview = (file, setPreviewFunction) => {
        if (!file) return;

        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewFunction(reader.result);
            };
            reader.readAsDataURL(file);
        } else if (file.type === 'application/pdf') {
            setPreviewFunction('pdf');
        } else {
            setPreviewFunction('file');
        }
    };

    const handleDocumentChange = (e, type) => {
        const file = e.target.files[0];
        if (file) {
            if (type === 'documento') {
                setDocumentoFile(file);
                createFilePreview(file, setDocumentoPreview);
            } else if (type === 'comprovante') {
                setComprovanteFile(file);
                createFilePreview(file, setComprovantePreview);
            }
        }
    };

    const handleCameraClick = (type) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = type === 'foto' ? 'image/*' : '.pdf,.jpg,.jpeg,.png';

        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        if (isMobile && type === 'foto') {
            input.capture = 'environment';
        }

        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                if (type === 'foto') {
                    setSelectedFile(file);
                    setSelectedFileName(file.name);
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        setImagePreview(reader.result);
                    };
                    reader.readAsDataURL(file);
                } else if (type === 'documento') {
                    setDocumentoFile(file);
                    createFilePreview(file, setDocumentoPreview);
                } else if (type === 'comprovante') {
                    setComprovanteFile(file);
                    createFilePreview(file, setComprovantePreview);
                }
            }
        };
        input.click();
    };

    const handleSelectCliente = (cliente) => {
        setSelectedTitular(cliente);
        setSearchTerm(cliente.nome);
        setFormData(prev => ({
            ...prev,
            dependentesDe: cliente.id,
            parentesco: prev.parentesco
        }));
        setSearchTerm('');
        setConsumers([]);
    };

    const truncateFileName = (name, maxLength = 15) => {
        if (!name) return '';
        if (name.length <= maxLength) return name;

        const extension = name.split('.').pop();
        return `${name.substring(0, maxLength)}...${extension}`;
    };

    const fetchConsumers = async () => {
        if (searchTerm.trim().length < 3) {
            setConsumers([]);
            return;
        }

        setIsSearching(true);
        try {
            const clientesRef = collection(firestore, 'lojas/clientes/users');

            const nomeQuerySnapshot = await getDocs(
                query(
                    clientesRef,
                    where('nome', '>=', searchTerm),
                    where('nome', '<=', searchTerm + '\uf8ff'),
                    limit(10)
                )
            );

            let results = nomeQuerySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            if (results.length === 0 && searchTerm.replace(/\D/g, '').length >= 11) {
                const cpfQuerySnapshot = await getDocs(
                    query(
                        clientesRef,
                        where('cpf', '==', searchTerm.replace(/\D/g, '')),
                        limit(10)
                    )
                );

                results = cpfQuerySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
            }

            setConsumers(results);
        } catch (error) {
            console.error("Erro na busca de clientes:", error);
            setConsumers([]);
        } finally {
            setIsSearching(false);
        }
    };

    const validateForm = () => {
        if (!selectedLoja) {
            setError('Não foi possível identificar a loja para o cadastro.');
            return false;
        }

        const cpf = formData.cpf.replace(/\D/g, '');
        if (!validarCPF(cpf)) {
            setError('CPF inválido. Verifique se os números estão corretos.');
            return false;
        }

        const telefone = formData.telefone.replace(/\D/g, '');
        if (telefone.length < 10) {
            setError('Telefone inválido. Digite no mínimo 10 dígitos.');
            return false;
        }

        if (formData.email && !validarEmail(formData.email)) {
            setError('Email inválido. Verifique o formato.');
            return false;
        }

        if (!isTitular && !selectedTitular) {
            setError('Selecione um cliente titular.');
            return false;
        }

        return true;
    };

    const resetForm = () => {
        setFormData({
            nome: '',
            email: '',
            telefone: '',
            cpf: '',
            dataNascimento: '',
            genero: '',
            estadoCivil: '',      // <-- novo campo
            escolaridade: '',     // <-- novo campo
            profissao: '',        // <-- novo campo
            observacoes: '',
            parentesco: '',
            contatoAlternativo: {
                nome: '',
                telefone: '',
                relacao: ''
            },
            endereco: {
                cep: '',
                logradouro: '',
                numero: '',
                complemento: '',
                bairro: '',
                cidade: '',
                estado: ''
            }
        });
        setSelectedFile(null);
        setSelectedFileName('');
        setImagePreview(null);
        setDocumentoFile(null);
        setComprovanteFile(null);
        setDocumentoPreview(null);
        setComprovantePreview(null);
        setIsTitular(true);
        setSelectedTitular('');
        setSearchTerm('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!validateForm()) return;

        setLoading(true);

        try {
            const cpf = formData.cpf.replace(/\D/g, '');

            const usersCollection = collection(firestore, 'lojas/clientes/users');
            const querySnapshot = await getDocs(
                query(usersCollection, where('cpf', '==', cpf))
            );

            if (!querySnapshot.empty) {
                setError("Este CPF já está cadastrado no sistema.");
                return;
            }

            const imageUrl = await uploadImage(cpf);
            const documentoUrl = await uploadDocument(documentoFile, cpf, 'documento');
            const comprovanteUrl = await uploadDocument(comprovanteFile, cpf, 'comprovante');

            const clienteData = {
                ...formData,
                cpf,
                imagem: imageUrl || null,
                documento: documentoUrl || null,
                comprovante: comprovanteUrl || null,
                dataCadastro: serverTimestamp(),
                lojaOrigem: selectedLoja,
                cadastradoPor: {
                    userId,
                    nome: userName
                },
                telefones: [formData.telefone],
                temDependentes: false
            };

            if (!isTitular && selectedTitular) {
                clienteData.dependentesDe = selectedTitular.id;
                clienteData.parentesco = formData.parentesco || 'Não especificado';

                const titularRef = doc(firestore, 'lojas/clientes/users', selectedTitular.id);
                await updateDoc(titularRef, { temDependentes: true });
            }

            await addDoc(usersCollection, clienteData);

            resetForm();
            setShowSuccessPopup(true);

            setTimeout(() => {
                setShowSuccessPopup(false);
                if (onSuccessRedirect) onSuccessRedirect();
            }, 3000);

        } catch (error) {
            console.error('Erro ao adicionar cliente:', error);
            setError(`Erro ao cadastrar cliente: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchConsumers();
    }, [searchTerm]);

    return {
        formData,
        selectedFile,
        selectedFileName,
        imagePreview,
        documentoFile,
        comprovanteFile,
        documentoPreview,
        comprovantePreview,
        showSuccessPopup,
        loading,
        error,
        fetchingCep,
        isTitular,
        searchTerm,
        consumers,
        isSearching,
        selectedTitular,
        handleChange,
        handleSubmit,
        handleImageChange,
        handleDocumentChange,
        handleCameraClick,
        handleSelectCliente,
        setImagePreview,
        setSelectedFile,
        setSelectedFileName,
        setDocumentoFile,
        setDocumentoPreview,
        setComprovanteFile,
        setComprovantePreview,
        setIsTitular,
        setSearchTerm,
        setSelectedTitular,
        createFilePreview,
        truncateFileName,
        validarCPF,
        validarEmail,
        uploadImage,
        uploadDocument,
        fetchConsumers
    };
};

export default useClientForm;