// components/ClientForm.js
import { useState, useEffect } from 'react';
import { getDoc, setDoc, doc, serverTimestamp, collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { firestore } from '@/lib/firebaseConfig';
import InputMask from 'react-input-mask';
import { FiUser, FiMail, FiPhone, FiCalendar, FiMapPin, FiHash, FiHome, FiImage, FiFileText } from 'react-icons/fi';

const ClientForm = ({ selectedLoja, onSuccessRedirect, userId, userName }) => {
    const [formData, setFormData] = useState({
        nome: '',
        email: '',
        telefone: '',
        cpf: '',
        dataNascimento: '',
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
    const [selectedFile, setSelectedFile] = useState(null);
    const [selectedFileName, setSelectedFileName] = useState('');
    const [showSuccessPopup, setShowSuccessPopup] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [fetchingCep, setFetchingCep] = useState(false);

    const handleChange = (e) => {
        const { name, value, files } = e.target;
        
        if (files) {
            setSelectedFile(files[0]);
            setSelectedFileName(files[0].name);
        } else if (name.includes('.')) {
            // Tratamento para campos aninhados como endereco.cep
            const [parent, child] = name.split('.');
            setFormData((prevData) => ({
                ...prevData,
                [parent]: {
                    ...prevData[parent],
                    [child]: value
                }
            }));
        } else {
            setFormData((prevData) => ({ ...prevData, [name]: value }));
        }
    };

    // Função para buscar endereço pelo CEP
    const fetchAddressByCep = async (cep) => {
        if (!cep || cep.replace(/\D/g, '').length !== 8) return;
        
        setFetchingCep(true);
        try {
            const cleanCep = cep.replace(/\D/g, '');
            const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
            const data = await response.json();
            
            if (!data.erro) {
                setFormData(prev => ({
                    ...prev,
                    endereco: {
                        ...prev.endereco,
                        cep: cep, // Mantém o formato com máscara
                        logradouro: data.logradouro || '',
                        bairro: data.bairro || '',
                        cidade: data.localidade || '',
                        estado: data.uf || ''
                    }
                }));
            }
        } catch (error) {
            console.error('Erro ao buscar CEP:', error);
        } finally {
            setFetchingCep(false);
        }
    };

    // Observar mudanças no CEP para buscar endereço automaticamente
    useEffect(() => {
        const cep = formData.endereco.cep;
        if (cep && cep.replace(/\D/g, '').length === 8) {
            fetchAddressByCep(cep);
        }
    }, [formData.endereco.cep]);

    const uploadImage = async (cpf) => {
        if (!selectedFile) return null;
        
        try {
            const storage = getStorage();
            // Gera um nome de arquivo único baseado no timestamp para evitar conflitos
            const fileName = `${Date.now()}-${selectedFile.name.replace(/[^a-zA-Z0-9.-]/g, '')}`;
            // Caminho de armazenamento simplificado
            const storageRef = ref(storage, `clientes/${cpf}/${fileName}`);
            const snapshot = await uploadBytes(storageRef, selectedFile);
            return await getDownloadURL(snapshot.ref);
        } catch (error) {
            console.error("Erro ao fazer upload da imagem:", error);
            // Não deixa o erro de upload impedir o cadastro do cliente
            return null;
        }
    };

    // Validação de CPF usando algoritmo de dígitos verificadores
    const validarCPF = (cpf) => {
        cpf = cpf.replace(/\D/g, '');
        
        if (cpf.length !== 11) return false;
        
        // Verificar se todos os dígitos são iguais
        if (/^(\d)\1{10}$/.test(cpf)) return false;
        
        // Validar dígitos verificadores
        let soma = 0;
        let resto;
        
        // Primeiro dígito verificador
        for (let i = 1; i <= 9; i++) {
            soma += parseInt(cpf.substring(i-1, i)) * (11 - i);
        }
        
        resto = (soma * 10) % 11;
        if (resto === 10 || resto === 11) resto = 0;
        if (resto !== parseInt(cpf.substring(9, 10))) return false;
        
        // Segundo dígito verificador
        soma = 0;
        for (let i = 1; i <= 10; i++) {
            soma += parseInt(cpf.substring(i-1, i)) * (12 - i);
        }
        
        resto = (soma * 10) % 11;
        if (resto === 10 || resto === 11) resto = 0;
        if (resto !== parseInt(cpf.substring(10, 11))) return false;
        
        return true;
    };
    
    // Validação de email com regex mais completa
    const validarEmail = (email) => {
        const regex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
        return regex.test(email);
    };

    const validateForm = () => {
        if (!selectedLoja) {
            setError('Não foi possível identificar a loja para o cadastro.');
            return false;
        }
        
        // Validação do CPF
        const cpf = formData.cpf.replace(/\D/g, '');
        if (!validarCPF(cpf)) {
            setError('CPF inválido. Verifique se os números estão corretos.');
            return false;
        }
        
        // Validação do telefone
        const telefone = formData.telefone.replace(/\D/g, '');
        if (telefone.length < 10) {
            setError('Telefone inválido. Digite no mínimo 10 dígitos.');
            return false;
        }
        
        // Validação do email (se fornecido)
        if (formData.email && !validarEmail(formData.email)) {
            setError('Email inválido. Verifique o formato.');
            return false;
        }
        
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        if (!validateForm()) return;
        
        setLoading(true);

        try {
            const cpf = formData.cpf.replace(/\D/g, ''); // Remove caracteres não numéricos do CPF

            // Verificar se o CPF já existe na subcoleção 'users'
            try {
                // Caminho correto para a subcoleção 'users'
                const usersCollection = collection(firestore, 'lojas/clientes/users');
                const querySnapshot = await getDocs(
                    query(usersCollection, where('cpf', '==', cpf))
                );
                
                if (!querySnapshot.empty) {
                    setError("Este CPF já está cadastrado no sistema.");
                    setLoading(false);
                    return;
                }
            } catch (err) {
                console.error("Erro ao verificar CPF existente:", err);
                // Continua mesmo se der erro na verificação
            }

            const imageUrl = await uploadImage(cpf);
            
            // Prepare os dados do cliente
            const clienteData = {
                ...formData,
                cpf,
                imagem: imageUrl || null,
                dataCadastro: serverTimestamp(),
                lojaOrigem: selectedLoja,
                cadastradoPor: {
                    userId: userId,
                    nome: userName
                },
                // Converte 'telefone' para um array 'telefones' para manter compatibilidade com a tabela de listagem
                telefones: [formData.telefone]
            };

            try {
                // Caminho correto: /lojas/clientes/users/{autoID}
                const usersCollection = collection(firestore, 'lojas/clientes/users');
                await addDoc(usersCollection, clienteData);
                
                setShowSuccessPopup(true);
                // Limpar formulário após sucesso
                setFormData({
                    nome: '',
                    email: '',
                    telefone: '',
                    cpf: '',
                    dataNascimento: '',
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
                
                setTimeout(() => {
                    setShowSuccessPopup(false);
                    if (onSuccessRedirect) onSuccessRedirect();
                }, 3000);
            } catch (error) {
                console.error("Erro ao salvar cliente:", error);
                throw error;
            }
        } catch (error) {
            console.error('Erro ao adicionar cliente:', error);
            setError(`Erro ao cadastrar cliente: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    // Lista de estados brasileiros
    const estados = [
        'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 
        'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 
        'SP', 'SE', 'TO'
    ];

    return (
        <form onSubmit={handleSubmit} className="mt-8 mb-20">
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                    <span className="block sm:inline">{error}</span>
                </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="flex text-[#81059e] font-medium items-center gap-1">
                        <FiUser /> Nome Completo
                    </label>
                    <input
                        type="text"
                        name="nome"
                        value={formData.nome}
                        onChange={handleChange}
                        className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black"
                        required
                    />
                </div>

                <div>
                    <label className="flex text-[#81059e] font-medium items-center gap-1">
                        <FiHash /> CPF
                    </label>
                    <InputMask
                        mask="999.999.999-99"
                        type="text"
                        name="cpf"
                        value={formData.cpf}
                        onChange={handleChange}
                        placeholder="000.000.000-00"
                        className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black"
                        required
                    />
                </div>

                <div>
                    <label className="flex text-[#81059e] font-medium items-center gap-1">
                        <FiMail /> Email
                    </label>
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="cliente@exemplo.com"
                        className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black"
                    />
                </div>

                <div>
                    <label className="flex text-[#81059e] font-medium items-center gap-1">
                        <FiPhone /> Telefone
                    </label>
                    <InputMask
                        mask="(99) 99999-9999"
                        type="tel"
                        name="telefone"
                        value={formData.telefone}
                        onChange={handleChange}
                        placeholder="(00) 00000-0000"
                        className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black"
                        required
                    />
                </div>

                <div>
                    <label className="flex text-[#81059e] font-medium items-center gap-1">
                        <FiCalendar /> Data de Nascimento
                    </label>
                    <input
                        type="date"
                        name="dataNascimento"
                        value={formData.dataNascimento}
                        onChange={handleChange}
                        className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black"
                    />
                </div>

                <div>
                    <label className="flex text-[#81059e] font-medium items-center gap-1">
                        <FiImage /> Foto do Cliente
                    </label>
                    <div className="relative">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleChange}
                            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                        />
                        <div className="flex items-center border-2 border-[#81059e] py-2 px-3 rounded-lg w-full text-black">
                            <span className="flex-1 truncate">
                                {selectedFileName || "Escolher arquivo..."}
                            </span>
                            <button type="button" className="bg-purple-100 text-[#81059e] px-3 py-1 rounded-md ml-2">
                                Procurar
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-6">
                <h3 className="text-lg font-medium text-[#81059e] flex items-center gap-1">
                    <FiMapPin /> Endereço
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                    <div>
                        <label className="flex text-[#81059e] font-medium items-center gap-1">
                            <FiHash /> CEP
                        </label>
                        <div className="relative">
                            <InputMask
                                mask="99999-999"
                                type="text"
                                name="endereco.cep"
                                value={formData.endereco.cep}
                                onChange={handleChange}
                                placeholder="00000-000"
                                className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black"
                            />
                            {fetchingCep && (
                                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                    <div className="animate-spin h-4 w-4 border-2 border-[#81059e] rounded-full border-t-transparent"></div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="md:col-span-2">
                        <label className="flex text-[#81059e] font-medium items-center gap-1">
                            <FiHome /> Logradouro
                        </label>
                        <input
                            type="text"
                            name="endereco.logradouro"
                            value={formData.endereco.logradouro}
                            onChange={handleChange}
                            className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black"
                        />
                    </div>

                    <div>
                        <label className="flex text-[#81059e] font-medium items-center gap-1">
                            Número
                        </label>
                        <input
                            type="text"
                            name="endereco.numero"
                            value={formData.endereco.numero}
                            onChange={handleChange}
                            className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black"
                        />
                    </div>

                    <div>
                        <label className="flex text-[#81059e] font-medium items-center gap-1">
                            Complemento
                        </label>
                        <input
                            type="text"
                            name="endereco.complemento"
                            value={formData.endereco.complemento}
                            onChange={handleChange}
                            className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black"
                        />
                    </div>

                    <div>
                        <label className="flex text-[#81059e] font-medium items-center gap-1">
                            Bairro
                        </label>
                        <input
                            type="text"
                            name="endereco.bairro"
                            value={formData.endereco.bairro}
                            onChange={handleChange}
                            className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black"
                        />
                    </div>

                    <div>
                        <label className="flex text-[#81059e] font-medium items-center gap-1">
                            Cidade
                        </label>
                        <input
                            type="text"
                            name="endereco.cidade"
                            value={formData.endereco.cidade}
                            onChange={handleChange}
                            className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black"
                        />
                    </div>

                    <div>
                        <label className="flex text-[#81059e] font-medium items-center gap-1">
                            Estado
                        </label>
                        <select
                            name="endereco.estado"
                            value={formData.endereco.estado}
                            onChange={handleChange}
                            className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black"
                        >
                            <option value="">Selecione</option>
                            {estados.map(estado => (
                                <option key={estado} value={estado}>
                                    {estado}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className="flex justify-center gap-4 mt-16">
                <button
                    type="button"
                    onClick={() => {
                        if (onSuccessRedirect) onSuccessRedirect();
                    }}
                    className="inline-flex justify-center py-2 px-6 border-2 border-[#81059e] shadow-sm text-sm font-medium rounded-sm text-[#81059e] bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#81059e]"
                >
                    CANCELAR
                </button>
                <button
                    type="submit"
                    className="inline-flex justify-center items-center py-2 px-6 border border-transparent shadow-sm text-sm font-medium rounded-sm text-white bg-[#81059e] hover:bg-[#6f0486] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#81059e]"
                    disabled={loading}
                >
                    {loading ? (
                        <>
                            <div className="border-2 border-[#81059e] p-3 px-6 rounded-sm text-[#81059e] flex items-center gap-2"></div>
                            SALVANDO...
                        </>
                    ) : 'SALVAR'}
                </button>
            </div>

            {showSuccessPopup && (
                <div className="fixed bottom-5 right-5 bg-green-500 text-white p-4 rounded-lg shadow-lg flex items-center">
                    <FiFileText className="mr-2" />
                    Cliente adicionado com sucesso!
                </div>
            )}
        </form>
    );
};

export default ClientForm;