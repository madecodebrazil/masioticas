// components/ClientForm.js
import { useState, useEffect } from 'react';
import { getDoc, setDoc, doc, serverTimestamp, collection, addDoc, getDocs, query, where, updateDoc, limit } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { firestore } from '@/lib/firebaseConfig';
import InputMask from 'react-input-mask';
import { FiUser, FiMail, FiPhone, FiCalendar, FiMapPin, FiHash, FiHome, FiImage, FiFileText, FiCamera, FiCheckCircle, FiX, FiFile, FiSearch } from 'react-icons/fi';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUsers } from "@fortawesome/free-solid-svg-icons";

const ClientForm = ({ selectedLoja, onSuccessRedirect, userId, userName }) => {
    const [formData, setFormData] = useState({
        nome: '',
        email: '',
        telefone: '',
        cpf: '',
        dataNascimento: '',
        genero: '',
        observacoes: '',
        parentesco: '',
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
    const [selectedTitular, setSelectedTitular] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [parentescoOptions] = useState([
        'Cônjuge',
        'Filho(a)',
        'Pai/Mãe',
        'Irmão/Irmã',
        'Avô/Avó',
        'Tio(a)',
        'Sobrinho(a)',
        'Outro'
    ]);

    // Adicionar função de debounce
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

   // Versão corrigida da função fetchAddressByCep

const fetchAddressByCep = async (cep) => {
    // Limpa o CEP de qualquer caractere não numérico
    const cleanCep = cep.replace(/\D/g, '');

    // Valida se tem 8 dígitos
    if (!cleanCep || cleanCep.length !== 8) return;

    setFetchingCep(true);
    setError(''); // Limpa erros anteriores

    try {
        // Usando diretamente a API pública ViaCEP em vez da API interna
        const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await response.json();

        // Verificação se o CEP existe na base de dados da ViaCEP
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
        } else {
            console.error('CEP não encontrado ou inválido');
            setError('CEP não encontrado. Verifique se o número está correto.');
        }
    } catch (error) {
        console.error('Erro ao buscar CEP:', error);
        setError(`Erro ao buscar CEP: ${error.message || 'Tente novamente mais tarde.'}`);
    } finally {
        setFetchingCep(false);
    }
};

    // Criar versão com debounce da função fetchAddressByCep
    const debouncedFetchCep = debounce(fetchAddressByCep, 500);

    // Atualizar handleChange
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

            // Se for o CEP sendo alterado
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
            // Criar preview da imagem
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
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

        // Verifica se o dispositivo tem câmera
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

    // Função para buscar titulares
    const searchTitulares = async (searchText) => {
        if (!searchText || searchText.length < 3) {
            setSearchResults([]);
            return;
        }
        
        setIsSearching(true);
        try {
            const usersCollection = collection(firestore, 'lojas/clientes/users');
            
            // Buscar por nome que começa com o texto da busca
            const queryByName = query(usersCollection, 
                where('dependentesDe', '==', null),
                where('nome', '>=', searchText),
                where('nome', '<=', searchText + '\uf8ff'),
                limit(10)
            );
            
            // Buscar por CPF que começa com o texto da busca
            const queryByCpf = query(usersCollection,
                where('dependentesDe', '==', null),
                where('cpf', '>=', searchText),
                where('cpf', '<=', searchText + '\uf8ff'),
                limit(10)
            );
            
            const [nameSnapshot, cpfSnapshot] = await Promise.all([
                getDocs(queryByName),
                getDocs(queryByCpf)
            ]);
            
            // Juntar resultados e remover duplicatas
            const results = [];
            const addedIds = new Set();
            
            nameSnapshot.forEach((doc) => {
                addedIds.add(doc.id);
                results.push({
                    id: doc.id,
                    nome: doc.data().nome,
                    cpf: doc.data().cpf
                });
            });
            
            cpfSnapshot.forEach((doc) => {
                if (!addedIds.has(doc.id)) {
                    results.push({
                        id: doc.id,
                        nome: doc.data().nome,
                        cpf: doc.data().cpf
                    });
                }
            });
            
            setSearchResults(results);
        } catch (error) {
            console.error('Erro ao buscar titulares:', error);
        } finally {
            setIsSearching(false);
        }
    };

    // Versão com debounce da função de busca
    const debouncedSearch = debounce(searchTitulares, 300);

    // Função para selecionar um titular dos resultados da busca
    const handleSelectTitular = (titular) => {
        setSelectedTitular(titular.id);
        setSearchQuery(titular.nome);
        setSearchResults([]); // Limpa os resultados após selecionar
    };

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
            soma += parseInt(cpf.substring(i - 1, i)) * (11 - i);
        }

        resto = (soma * 10) % 11;
        if (resto === 10 || resto === 11) resto = 0;
        if (resto !== parseInt(cpf.substring(9, 10))) return false;

        // Segundo dígito verificador
        soma = 0;
        for (let i = 1; i <= 10; i++) {
            soma += parseInt(cpf.substring(i - 1, i)) * (12 - i);
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

        // Se for dependente, verificar se um titular foi selecionado
        if (!isTitular && !selectedTitular) {
            setError('Selecione um cliente titular.');
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
            const cpf = formData.cpf.replace(/\D/g, '');

            // Verificar se o CPF já existe
            try {
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
            }

            const imageUrl = await uploadImage(cpf);
            const documentoUrl = await uploadDocument(documentoFile, cpf, 'documento');
            const comprovanteUrl = await uploadDocument(comprovanteFile, cpf, 'comprovante');

            // Adicionar informações de dependência
            const dependenteInfo = !isTitular && selectedTitular ? {
                dependentesDe: selectedTitular,
                parentesco: formData.parentesco || 'Não especificado'
            } : {
                dependentesDe: null,
                parentesco: null
            };

            const clienteData = {
                ...formData,
                cpf,
                imagem: imageUrl || null,
                documento: documentoUrl || null,
                comprovante: comprovanteUrl || null,
                dataCadastro: serverTimestamp(),
                lojaOrigem: selectedLoja,
                cadastradoPor: {
                    userId: userId,
                    nome: userName
                },
                telefones: [formData.telefone],
                ...dependenteInfo,
                // Campo para facilitar a consulta de dependentes
                temDependentes: false
            };

            try {
                // Adicionar cliente ao Firestore
                const usersCollection = collection(firestore, 'lojas/clientes/users');
                const docRef = await addDoc(usersCollection, clienteData);

                // Se for dependente, atualizar titular para indicar que possui dependentes
                if (!isTitular && selectedTitular) {
                    const titularRef = doc(firestore, 'lojas/clientes/users', selectedTitular);
                    await updateDoc(titularRef, {
                        temDependentes: true
                    });
                }

                setShowSuccessPopup(true);
                // Limpar formulário após sucesso
                setFormData({
                    nome: '',
                    email: '',
                    telefone: '',
                    cpf: '',
                    dataNascimento: '',
                    genero: '',
                    observacoes: '',
                    parentesco: '',
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
                setSearchQuery('');

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

    // Função auxiliar para criar previews
    const createFilePreview = (file, setPreviewFunction) => {
        if (!file) return;

        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewFunction(reader.result);
            };
            reader.readAsDataURL(file);
        } else if (file.type === 'application/pdf') {
            // Para PDFs, apenas setamos um valor para indicar que há um PDF
            setPreviewFunction('pdf');
        } else {
            // Para outros tipos de arquivo
            setPreviewFunction('file');
        }
    };

    // Função auxiliar para truncar nomes de arquivos
    const truncateFileName = (name, maxLength = 15) => {
        if (!name) return '';
        if (name.length <= maxLength) return name;

        const extension = name.split('.').pop();
        return `${name.substring(0, maxLength)}...${extension}`;
    };

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
                        required
                    />
                </div>

                <div>
                    <label className="flex text-[#81059e] font-medium items-center gap-1">
                        <FiUser /> Gênero
                    </label>
                    <select
                        name="genero"
                        value={formData.genero}
                        onChange={handleChange}
                        className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black"
                        required
                    >
                        <option value="">Selecione</option>
                        <option value="masculino">Masculino</option>
                        <option value="feminino">Feminino</option>
                        <option value="outro">Outro</option>
                        <option value="prefiro_nao_informar">Prefiro não informar</option>
                    </select>
                </div>

                <div>
                    {/* Seção de Tipo de Cadastro */}
                    <div className="mt-6 p-4 rounded-lg h-80">
                        <h3 className="text-lg font-medium text-[#81059e] flex items-center gap-1 mb-4">
                            <FontAwesomeIcon icon={faUsers} className="h-5 w-5" /> Tipo de Cadastro
                        </h3>

                        {/* Opção Titular/Dependente */}
                        <div className="flex items-center space-x-4 mb-4">
                            <label className="inline-flex items-center">
                                <input
                                    type="radio"
                                    className="form-radio text-[#81059e]"
                                    name="tipoCliente"
                                    checked={isTitular}
                                    onChange={() => setIsTitular(true)}
                                />
                                <span className="ml-2 text-gray-700">Cliente Titular</span>
                            </label>

                            <label className="inline-flex items-center">
                                <input
                                    type="radio"
                                    className="form-radio text-[#81059e]"
                                    name="tipoCliente"
                                    checked={!isTitular}
                                    onChange={() => setIsTitular(false)}
                                />
                                <span className="ml-2 text-gray-700">Dependente</span>
                            </label>
                        </div>

                        {/* Seleção de Titular e Parentesco (aparece apenas se for dependente) */}
                        {!isTitular && (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="block text-[#81059e] font-medium">
                                        Buscar Cliente Titular
                                    </label>
                                    <div className="relative">
                                        <div className="flex items-center border-2 border-[#81059e] rounded-lg">
                                            <span className="pl-3 text-[#81059e]">
                                                <FiSearch size={16} />
                                            </span>
                                            <input
                                                type="text"
                                                value={searchQuery}
                                                onChange={(e) => {
                                                    setSearchQuery(e.target.value);
                                                    debouncedSearch(e.target.value);
                                                }}
                                                placeholder="Digite nome ou CPF do titular"
                                                className="p-3 w-full text-black outline-none"
                                                required={!isTitular}
                                            />
                                            {isSearching && (
                                                <div className="pr-3">
                                                    <div className="animate-spin h-4 w-4 border-2 border-[#81059e] rounded-full border-t-transparent"></div>
                                                </div>
                                            )}
                                        </div>
                                        
                                        {/* Resultados da busca */}
                                        {searchResults.length > 0 && (
                                            <div className="absolute z-10 w-full mt-1 bg-white shadow-lg rounded-lg border border-[#81059e] max-h-60 overflow-y-auto">
                                                {searchResults.map((titular) => (
                                                    <div 
                                                        key={titular.id} 
                                                        className="p-3 hover:bg-purple-100 cursor-pointer border-b border-gray-200 last:border-b-0"
                                                        onClick={() => handleSelectTitular(titular)}
                                                    >
                                                        <div className="font-medium">{titular.nome}</div>
                                                        <div className="text-sm text-gray-600">CPF: {titular.cpf}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        
                                        {searchQuery && searchQuery.length >= 3 && searchResults.length === 0 && !isSearching && (
                                            <div className="absolute z-10 w-full mt-1 bg-white shadow-lg rounded-lg border border-[#81059e] p-3">
                                                <p className="text-gray-500">Nenhum cliente titular encontrado</p>
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Mostrar o titular selecionado */}
                                    {selectedTitular && (
                                        <div className="mt-2 p-2 bg-purple-100 rounded-lg flex items-center justify-between">
                                            <span>Titular selecionado</span>
                                            <button 
                                                type="button"
                                                onClick={() => {
                                                    setSelectedTitular('');
                                                    setSearchQuery('');
                                                }}
                                                className="text-red-500 hover:text-red-700"
                                            >
                                                <FiX size={16} />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-[#81059e] font-medium">
                                        Parentesco com o Titular
                                    </label>
                                    <select
                                        name="parentesco"
                                        value={formData.parentesco}
                                        onChange={handleChange}
                                        className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black"
                                        required={!isTitular}
                                    >
                                        <option value="">Selecione o parentesco</option>
                                        {parentescoOptions.map((option) => (
                                            <option key={option} value={option}>
                                                {option}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}
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
                                required
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
                            required
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
                            required
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
                            required
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
                            required
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
                            required
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

            <div className="mt-6">
                <label className="flex text-[#81059e] font-medium items-center gap-1">
                    <FiFileText /> Observações
                </label>
                <textarea
                    name="observacoes"
                    value={formData.observacoes}
                    onChange={handleChange}
                    className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black"
                    rows="3"
                    placeholder="Adicione observações relevantes sobre o cliente"
                />
            </div>

            <div className="mt-6">
                <h3 className="text-lg font-medium text-[#81059e] flex items-center gap-1 mb-4">
                    <FiFileText /> Documentos
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="flex text-[#81059e] font-medium items-center gap-1">
                            <FiImage /> Foto do Cliente
                        </label>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                                    required
                                />
                                <div className="flex items-center border-2 border-[#81059e] py-2 px-3 rounded-lg w-full text-black">
                                    <span className="flex-1 truncate text-sm" title={selectedFileName}>
                                        {selectedFileName ? truncateFileName(selectedFileName) : "Escolher arquivo..."}
                                    </span>
                                    <button type="button" className="bg-purple-100 text-[#81059e] px-3 py-1 rounded-md ml-2 text-xs sm:text-sm whitespace-nowrap">
                                        Procurar
                                    </button>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => handleCameraClick('foto')}
                                className="bg-purple-100 text-[#81059e] p-2 rounded-lg flex items-center justify-center"
                                title="Tirar foto"
                            >
                                <FiCamera size={20} />
                            </button>
                        </div>
                        {imagePreview && (
                            <div className="mt-2 relative">
                                <img
                                    src={imagePreview}
                                    alt="Preview"
                                    className="w-32 h-32 object-cover rounded-lg border-2 border-[#81059e]"
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        setImagePreview(null);
                                        setSelectedFile(null);
                                        setSelectedFileName('');
                                    }}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                                >
                                    <FiX size={16} />
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label className="flex text-[#81059e] font-medium items-center gap-1">
                            <FiFileText /> RG ou CNH
                        </label>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <input
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    onChange={(e) => handleDocumentChange(e, 'documento')}
                                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                                />
                                <div className="flex items-center border-2 border-[#81059e] py-2 px-3 rounded-lg w-full text-black">
                                    <span className="flex-1 truncate text-sm" title={documentoFile?.name}>
                                        {documentoFile ? truncateFileName(documentoFile.name) : "Escolher arquivo..."}
                                    </span>
                                    <button type="button" className="bg-purple-100 text-[#81059e] px-3 py-1 rounded-md ml-2 text-xs sm:text-sm whitespace-nowrap">
                                        Procurar
                                    </button>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => handleCameraClick('documento')}
                                className="bg-purple-100 text-[#81059e] p-2 rounded-lg flex items-center justify-center"
                                title="Tirar foto"
                            >
                                <FiCamera size={20} />
                            </button>
                        </div>
                        {documentoPreview && (
                            <div className="mt-2 relative">
                                {typeof documentoPreview === 'string' && documentoPreview === 'pdf' ? (
                                    <div className="w-full h-36 bg-red-100 rounded-lg border-2 border-[#81059e] flex flex-col items-center justify-center">
                                        <FiFile size={36} className="text-red-500" />
                                        <span className="text-xs mt-2 text-center px-2 truncate w-full">
                                            {documentoFile?.name || 'Documento PDF'}
                                        </span>
                                    </div>
                                ) : typeof documentoPreview === 'string' && documentoPreview === 'file' ? (
                                    <div className="w-full h-36 bg-gray-100 rounded-lg border-2 border-[#81059e] flex flex-col items-center justify-center">
                                        <FiFileText size={36} className="text-gray-500" />
                                        <span className="text-xs mt-2 text-center px-2 truncate w-full">
                                            {documentoFile?.name || 'Documento'}
                                        </span>
                                    </div>
                                ) : (
                                    <img
                                        src={documentoPreview}
                                        alt="Preview documento"
                                        className="w-full h-36 object-cover rounded-lg border-2 border-[#81059e]"
                                    />
                                )}
                                <button
                                    type="button"
                                    onClick={() => {
                                        setDocumentoFile(null);
                                        setDocumentoPreview(null);
                                    }}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                                >
                                    <FiX size={16} />
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label className="flex text-[#81059e] font-medium items-center gap-1">
                            <FiFileText /> Comprovante de Residência
                        </label>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <input
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    onChange={(e) => handleDocumentChange(e, 'comprovante')}
                                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                                />
                                <div className="flex items-center border-2 border-[#81059e] py-2 px-3 rounded-lg w-full text-black">
                                    <span className="flex-1 truncate text-sm" title={comprovanteFile?.name}>
                                        {comprovanteFile ? truncateFileName(comprovanteFile.name) : "Escolher arquivo..."}
                                    </span>
                                    <button type="button" className="bg-purple-100 text-[#81059e] px-3 py-1 rounded-md ml-2 text-xs sm:text-sm whitespace-nowrap">
                                        Procurar
                                    </button>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => handleCameraClick('comprovante')}
                                className="bg-purple-100 text-[#81059e] p-2 rounded-lg flex items-center justify-center"
                                title="Tirar foto"
                            >
                                <FiCamera size={20} />
                            </button>
                        </div>
                        {comprovantePreview && (
                            <div className="mt-2 relative">
                                {typeof comprovantePreview === 'string' && comprovantePreview === 'pdf' ? (
                                    <div className="w-full h-36 bg-red-100 rounded-lg border-2 border-[#81059e] flex flex-col items-center justify-center">
                                        <FiFile size={36} className="text-red-500" />
                                        <span className="text-xs mt-2 text-center px-2 truncate w-full">
                                            {comprovanteFile?.name || 'Comprovante PDF'}
                                        </span>
                                    </div>
                                ) : typeof comprovantePreview === 'string' && comprovantePreview === 'file' ? (
                                    <div className="w-full h-36 bg-gray-100 rounded-lg border-2 border-[#81059e] flex flex-col items-center justify-center">
                                        <FiFileText size={36} className="text-gray-500" />
                                        <span className="text-xs mt-2 text-center px-2 truncate w-full">
                                            {comprovanteFile?.name || 'Comprovante'}
                                        </span>
                                    </div>
                                ) : (
                                    <img
                                        src={comprovantePreview}
                                        alt="Preview comprovante"
                                        className="w-full h-36 object-cover rounded-lg border-2 border-[#81059e]"
                                    />
                                )}
                                <button
                                    type="button"
                                    onClick={() => {
                                        setComprovanteFile(null);
                                        setComprovantePreview(null);
                                    }}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                                >
                                    <FiX size={16} />
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="hidden lg:block">
                        {/* Reservado para expansão futura */}
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
                            <div className="animate-spin mr-2 h-4 w-4 border-2 border-white rounded-full border-t-transparent"></div>
                            SALVANDO...
                        </>
                    ) : 'SALVAR'}
                </button>
            </div>

            {showSuccessPopup && (
                <div className="fixed top-4 right-4 z-50 animate-fade-in">
                    <div className="bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-2">
                        <FiCheckCircle size={24} />
                        <span>Cliente adicionado com sucesso!</span>
                    </div>
                </div>
            )}
        </form>
    );
};

export default ClientForm;