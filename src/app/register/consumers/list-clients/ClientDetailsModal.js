"use client";

import { useState, useEffect } from "react";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { firestore } from "@/lib/firebaseConfig";
import { getStorage, ref, getDownloadURL, listAll } from "firebase/storage";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faUsers, faPhone, faX, faUser, faHome, faIdCard, faEdit, faPrint,
    faSpinner, faEnvelope, faCalendar, faBriefcase, faGraduationCap,
    faHeart, faFileAlt, faDownload, faEye, faImage, faTimes, faComments
} from "@fortawesome/free-solid-svg-icons";
import { faInstagram } from "@fortawesome/free-brands-svg-icons";
import Link from "next/link";
import { useClientPDF } from '@/hooks/useClientPDF';
import { useClientCommunications } from '@/hooks/useClientCommunications';

// Função para formatar CPF
function formatCPF(cpf) {
    if (!cpf) return 'N/A';
    cpf = cpf.replace(/\D/g, '');
    if (cpf.length !== 11) return cpf;
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

// Modal para visualizar documento
const DocumentViewerModal = ({ documentUrl, documentName, onClose }) => {
    const [isLoading, setIsLoading] = useState(true);

    if (!documentUrl) return null;

    const isImage = documentUrl.toLowerCase().includes('.jpg') ||
        documentUrl.toLowerCase().includes('.jpeg') ||
        documentUrl.toLowerCase().includes('.png') ||
        documentUrl.toLowerCase().includes('.gif');

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-80 z-[60] p-4">
            <div className="bg-white rounded-sm w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between p-4 border-b bg-[#81059e]">
                    <h3 className="text-lg font-semibold text-white">{documentName}</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-200 hover:text-gray-400 p-1"
                    >
                        <FontAwesomeIcon icon={faTimes} className="h-5 w-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-auto p-4">
                    {isImage ? (
                        <img
                            src={documentUrl}
                            alt={documentName}
                            className="max-w-full h-auto mx-auto"
                            onLoad={() => setIsLoading(false)}
                            onError={() => setIsLoading(false)}
                        />
                    ) : (
                        <iframe
                            src={documentUrl}
                            className="w-full h-full min-h-[500px]"
                            onLoad={() => setIsLoading(false)}
                        />
                    )}

                    {isLoading && (
                        <div className="flex justify-center items-center h-64">
                            <FontAwesomeIcon icon={faSpinner} className="h-8 w-8 animate-spin text-gray-400" />
                        </div>
                    )}
                </div>

                <div className="border-t p-4 flex justify-center">
                    <a
                        href={documentUrl}
                        download={documentName}
                        className="flex items-center px-4 py-2 bg-[#81059e] text-white rounded-sm hover:bg-[#690480] transition-colors"
                    >
                        <FontAwesomeIcon icon={faDownload} className="h-4 w-4 mr-2" />
                        Baixar Documento
                    </a>
                </div>
            </div>
        </div>
    );
};

const ClientDetailsModal = ({ client, onClose }) => {
    const [titularData, setTitularData] = useState(null);
    const [dependentesData, setDependentesData] = useState([]);
    const [clientImageUrl, setClientImageUrl] = useState(null);
    const [titularImageUrl, setTitularImageUrl] = useState(null);
    const [dependentesImageUrls, setDependentesImageUrls] = useState({});
    const [clientDocuments, setClientDocuments] = useState([]);
    const [loadingDocuments, setLoadingDocuments] = useState(true);
    const [selectedDocument, setSelectedDocument] = useState(null);
    const { openClientPDF, isGenerating } = useClientPDF();

    // Hook para gerenciar comunicações
    const {
        communications,
        loading: loadingCommunications,
        formatPhone,
        generateWhatsAppLink,
        hasCommunications,
        getPreferredCommunication,
        getTotalCommunications
    } = useClientCommunications(client);

    const handleOpenPDF = async () => {
        if (!client) return;
        try {
            await openClientPDF(client, titularData, dependentesData);
        } catch (error) {
            console.error('Erro ao gerar PDF:', error);
            alert('Erro ao gerar PDF. Tente novamente.');
        }
    };

    // Função para buscar documentos do cliente
    const fetchClientDocuments = async (clientCpf) => {
        if (!clientCpf) {
            setLoadingDocuments(false);
            return;
        }

        try {
            const storage = getStorage();
            const documentsPath = `clientes/${clientCpf}/documentos`;
            const documentsRef = ref(storage, documentsPath);

            const listResult = await listAll(documentsRef);
            const documents = [];

            for (const item of listResult.items) {
                try {
                    const url = await getDownloadURL(item);
                    documents.push({
                        name: item.name,
                        url: url,
                        fullPath: item.fullPath
                    });
                } catch (error) {
                    console.error(`Erro ao obter URL para ${item.name}:`, error);
                }
            }

            setClientDocuments(documents);
        } catch (error) {
            console.error("Erro ao buscar documentos:", error);
            setClientDocuments([]);
        } finally {
            setLoadingDocuments(false);
        }
    };

    // Função para buscar dados do titular e dependentes
    const fetchFamilyData = async (client) => {
        try {
            setTitularData(null);
            setDependentesData([]);

            if (client.dependentesDe) {
                const titularRef = doc(firestore, 'lojas/clientes/users', client.dependentesDe);
                const titularDoc = await getDoc(titularRef);

                if (titularDoc.exists()) {
                    setTitularData({
                        id: titularDoc.id,
                        ...titularDoc.data()
                    });
                }
            }
            else if (client.temDependentes) {
                const dependentesRef = collection(firestore, 'lojas/clientes/users');
                const q = query(dependentesRef, where('dependentesDe', '==', client.id));
                const querySnapshot = await getDocs(q);

                const dependentes = [];
                querySnapshot.forEach((doc) => {
                    dependentes.push({
                        id: doc.id,
                        ...doc.data()
                    });
                });

                setDependentesData(dependentes);
            }
        } catch (error) {
            console.error('Erro ao buscar dados familiares:', error);
        }
    };

    // Função para obter URL da imagem
    const getImageUrl = async (cpf) => {
        if (!cpf) return null;
        try {
            const storage = getStorage();
            const imagePath = `clientes/${cpf}`;
            const imageRef = ref(storage, imagePath);
            try {
                const url = await getDownloadURL(imageRef);
                return url;
            } catch (error) {
                try {
                    const folderRef = ref(storage, `clientes/${cpf}`);
                    const listResult = await listAll(folderRef);
                    if (listResult.items.length > 0) {
                        const fileRef = listResult.items[0];
                        const url = await getDownloadURL(fileRef);
                        return url;
                    }
                } catch (listError) {
                    console.log(`Modal: Falha ao listar arquivos para ${cpf}`);
                }
                return null;
            }
        } catch (error) {
            console.error("Erro ao obter URL da imagem:", error);
            return null;
        }
    };

    // Buscar URLs das imagens
    useEffect(() => {
        const fetchImageUrls = async () => {
            if (client?.imagem) {
                setClientImageUrl(client.imagem);
            } else if (client?.cpf) {
                const url = await getImageUrl(client.cpf);
                setClientImageUrl(url);
            } else {
                setClientImageUrl(null);
            }
            if (titularData?.imagem) {
                setTitularImageUrl(titularData.imagem);
            } else if (titularData?.cpf) {
                const url = await getImageUrl(titularData.cpf);
                setTitularImageUrl(url);
            } else {
                setTitularImageUrl(null);
            }
            if (dependentesData.length > 0) {
                const urls = {};
                for (const dependente of dependentesData) {
                    if (dependente.imagem) {
                        urls[dependente.id] = dependente.imagem;
                    } else if (dependente.cpf) {
                        urls[dependente.id] = await getImageUrl(dependente.cpf);
                    } else {
                        urls[dependente.id] = null;
                    }
                }
                setDependentesImageUrls(urls);
            }
        };

        fetchImageUrls();
    }, [client, titularData, dependentesData]);

    useEffect(() => {
        if (client) {
            fetchFamilyData(client);
            fetchClientDocuments(client.cpf);
        }
    }, [client]);

    if (!client) return null;

    return (
        <>
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl relative overflow-hidden max-h-[95vh] flex flex-col">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-[#81059e] to-[#a855f7] p-6 text-white relative">
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 text-white/80 hover:text-white hover:bg-white/20 rounded-full p-2 transition-all"
                        >
                            <FontAwesomeIcon icon={faX} className="h-5 w-5" />
                        </button>

                        <div className="flex items-center space-x-6">
                            {/* Foto de perfil */}
                            <div className="relative">
                                {clientImageUrl ? (
                                    <img
                                        src={clientImageUrl}
                                        alt={`Foto de ${client.nome}`}
                                        className="h-24 w-24 rounded-full object-cover border-4 border-white shadow-lg"
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = "https://via.placeholder.com/96?text=NA";
                                        }}
                                    />
                                ) : (
                                    <div className="h-24 w-24 rounded-full bg-white/20 flex items-center justify-center text-white text-2xl font-bold border-4 border-white shadow-lg">
                                        {client.nome ? client.nome.charAt(0).toUpperCase() : "?"}
                                    </div>
                                )}
                            </div>

                            {/* Informações básicas */}
                            <div className="flex-1 min-w-0">
                                <h3 className="text-xl font-bold mb-3 truncate">{client.nome || 'Cliente'}</h3>
                                <div className="grid">
                                    <div className="flex items-center">
                                        <FontAwesomeIcon icon={faIdCard} className="h-4 w-4 mr-3 flex-shrink-0" />
                                        <span>ID:</span>
                                        <span className="ml-1 truncate">{client.id}</span>
                                    </div>
                                    <div className="flex items-center">
                                        <FontAwesomeIcon icon={faIdCard} className="h-4 w-4 mr-3 flex-shrink-0" />
                                        <span>CPF:</span>
                                        <span className="ml-1 truncate">{formatCPF(client.cpf)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Conteúdo Principal */}
                    <div className="flex-1 overflow-y-auto p-2 bg-gray-50">
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

                            {/* Seção 1: Informações Pessoais */}
                            <div className="bg-white rounded-sm p-6 shadow-sm border border-gray-100">
                                <div className="flex items-center mb-6">
                                    <div>
                                        <FontAwesomeIcon icon={faUser} className="h-5 w-5 text-[#81059e]" />
                                        <h4 className="text-xl font-bold text-[#81059e]">Informações Pessoais</h4>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <p className="flex text-[#96709d] font-medium items-center gap-1 tracking-wide mb-2">Nome Completo</p>
                                        <div className="text-gray-600 font-medium break-words text-base ">
                                            {client.nome || 'N/A'}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <p className="flex text-[#96709d] font-medium items-center gap-1 tracking-wide mb-2">CPF</p>
                                            <p className="text-gray-600 font-medium break-words text-base">
                                                {formatCPF(client.cpf)}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[#96709d] font-medium items-center gap-1 tracking-wide mb-2">Gênero</p>
                                            <p className="text-gray-600 font-medium break-words text-base">
                                                {client.genero || 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-[#96709d] font-medium items-center gap-1 tracking-wide mb-2">Data de Nascimento</p>
                                        <p className="text-gray-600 font-medium break-words text-base">
                                            <FontAwesomeIcon icon={faCalendar} className="h-4 w-4 mr-2 text-gray-500" />
                                            {client.dataNascimento ?
                                                (typeof client.dataNascimento === 'string' ?
                                                    client.dataNascimento :
                                                    new Date(client.dataNascimento.seconds * 1000).toLocaleDateString('pt-BR'))
                                                : 'N/A'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            {/* Seção 2: Comunicações */}
                            <div className="bg-white rounded-sm p-6 shadow-sm border border-gray-100">
                                <div className="flex items-center mb-6">
                                    <div className="flex items-center space-x-2">
                                        <div>
                                            <FontAwesomeIcon icon={faComments} className="h-5 w-5 text-[#81059e]" />
                                            <h4 className="text-xl font-bold text-[#81059e]">Comunicações</h4>
                                        </div>
                                    </div>
                                </div>
                                {loadingCommunications ? (
                                    <div className="flex justify-center items-center h-24">
                                        <FontAwesomeIcon icon={faSpinner} className="h-6 w-6 animate-spin text-gray-400" />
                                        <span className="ml-3 text-gray-600">Carregando comunicações...</span>
                                    </div>
                                ) : !hasCommunications() ? (
                                    <div className="bg-gray-50 p-6 rounded-sm text-center">
                                        <FontAwesomeIcon icon={faComments} className="h-8 w-8 text-gray-400 mb-3" />
                                        <p className="text-gray-600 mb-2">Nenhuma forma de comunicação cadastrada</p>
                                        <p className="text-gray-500 text-sm">Adicione telefones, email ou redes sociais para facilitar o contato</p>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {/* Email */}
                                        {communications.email && (
                                            <div>
                                                <p className="flex text-[#96709d] font-medium items-center gap-1 tracking-wide mb-2">Email</p>
                                                <div className="text-gray-600 font-medium break-words text-base">
                                                    <span className="font-medium text-gray-600">
                                                        <FontAwesomeIcon icon={faEnvelope} className="h-4 w-4 mr-2 text-gray-500 flex-shrink-0" />
                                                        {communications.email}
                                                    </span>
                                                    <a
                                                        href={`mailto:${communications.email}`}
                                                        className="bg-[#96709d] text-white px-3 py-2 rounded-sm text-sm hover:bg-green-600 transition-colors flex items-center justify-center w-28 mt-2"
                                                    >
                                                        Enviar Email
                                                    </a>
                                                </div>
                                            </div>
                                        )}

                                        {/* WhatsApp (Previously Telefones) */}
                                        {communications.telefones && communications.telefones.length > 0 && (
                                            <div>
                                                <p className="flex text-[#96709d] font-medium items-center gap-1 tracking-wide mb-2">
                                                    WhatsApp
                                                </p>
                                                <div className="space-y-2">
                                                    {communications.telefones.map((telefone, index) => (
                                                        <div key={index} className="bg-gradient-to-r from-green-500 to-green-600 p-3 rounded-sm flex items-center justify-between">
                                                            <span className="font-medium text-white flex items-center">
                                                                <FontAwesomeIcon icon={faPhone} className="h-6 w-6 mr-2 text-white" />
                                                                {formatPhone(telefone)}
                                                            </span>
                                                            <div className="flex space-x-2">
                                                                <a
                                                                    href={`tel:${telefone}`}
                                                                    className="border-2 text-white px-3 py-1 rounded-sm text-sm hover:opacity-90 transition-opacity flex-shrink-0"
                                                                >
                                                                    Ligar
                                                                </a>
                                                                <a
                                                                    href={generateWhatsAppLink(telefone)}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="border-2 text-white px-3 py-1 rounded-sm text-sm hover:opacity-90 transition-opacity flex-shrink-0"
                                                                >
                                                                    Abrir WhatsApp
                                                                </a>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Redes Sociais */}
                                        {communications.redesSociais && Object.keys(communications.redesSociais).length > 0 && (
                                            <div>
                                                <p className="text-gray-600 font-semibold text-xs uppercase tracking-wide mb-3">Redes Sociais</p>
                                                <div className="space-y-2">
                                                    {Object.entries(communications.redesSociais).map(([rede, usuario], index) => (
                                                        <div key={index} className="bg-gray-50 p-3 rounded-sm flex items-center justify-between">
                                                            <span className="font-medium text-gray-800 capitalize">
                                                                <strong>{rede}:</strong> {usuario}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Instagram (Add this section) */}
                                        {communications.instagram && (
                                            <div>
                                                <p className="flex text-[#96709d] font-medium items-center gap-1 tracking-wide mb-2">Instagram</p>
                                                <div className="bg-gradient-to-r from-pink-500 to-purple-500 p-3 rounded-sm flex items-center justify-between">
                                                    <span className="font-medium text-white flex items-center">
                                                        <FontAwesomeIcon icon={faInstagram} className="h-6 w-6 mr-2 text-white" />
                                                        {communications.instagram}
                                                    </span>
                                                    <a
                                                        href={`https://instagram.com/${communications.instagram.replace('@', '')}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="border-2 text-white px-3 py-1 rounded-sm text-sm hover:opacity-90 transition-opacity flex-shrink-0"
                                                    >
                                                        Visitar Perfil
                                                    </a>
                                                </div>
                                            </div>
                                        )}

                                        {/* Observações de Comunicação */}
                                        {communications.observacoesComunicacao && (
                                            <div>
                                                <p className="flex text-[#96709d] font-medium items-center gap-1 tracking-wide mb-2">Observações</p>
                                                <div className="bg-yellow-50 border border-yellow-200 rounded-sm p-3">
                                                    <p className="text-yellow-800 text-sm">{communications.observacoesComunicacao}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Seção 3: Informações Complementares */}
                        <div className="mt-6 grid grid-cols-1 xl:grid-cols-2 gap-6">

                            {/* Informações Pessoais Complementares */}
                            <div className="bg-white rounded-sm p-6 shadow-sm border border-gray-100">
                                <div className="flex items-center mb-6">
                                    <div>
                                        <FontAwesomeIcon icon={faBriefcase} className="h-5 w-5 text-[#81059e]" />
                                        <h4 className="text-xl font-bold text-[#81059e]">Informações Complementares</h4>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <p className="flex text-[#96709d] font-medium items-center gap-1 tracking-wide mb-2">Estado Civil</p>
                                            <p className="text-gray-600 font-medium break-words text-base">
                                                <FontAwesomeIcon icon={faHeart} className="h-4 w-4 mr-2 text-gray-500" />
                                                {client.estadoCivil || 'N/A'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="flex text-[#96709d] font-medium items-center gap-1 tracking-wide mb-2">Profissão</p>
                                            <p className="text-gray-600 font-medium break-words text-base">
                                                <FontAwesomeIcon icon={faBriefcase} className="h-4 w-4 mr-2 text-gray-500" />
                                                {client.profissao || 'N/A'}
                                            </p>
                                        </div>
                                    </div>

                                    <div>
                                        <p className="flex text-[#96709d] font-medium items-center gap-1 tracking-wide mb-2">Escolaridade</p>
                                        <p className="text-gray-600 font-medium break-words text-base">
                                            <FontAwesomeIcon icon={faGraduationCap} className="h-4 w-4 mr-2 text-gray-500" />
                                            {client.escolaridade || 'N/A'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Endereço */}
                            <div className="bg-white rounded-sm p-6 shadow-sm border border-gray-100">
                                <div className="flex items-center mb-6">
                                    <div>
                                        <FontAwesomeIcon icon={faHome} className="h-5 w-5 text-[#81059e]" />
                                    <h4 className="text-xl font-bold text-[#81059e]">Endereço</h4>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <p className="flex text-[#96709d] font-medium items-center gap-1 tracking-wide mb-2">CEP</p>
                                            <p className="text-gray-900 font-medium p-3 rounded-sm">
                                                {client.endereco?.cep || 'N/A'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="flex text-[#96709d] font-medium items-center gap-1 tracking-wide mb-2">Cidade / Estado</p>
                                            <p className="text-gray-900 font-medium p-3 rounded-sm">
                                                {`${client.endereco?.cidade || 'N/A'} - ${client.endereco?.estado || 'N/A'}`}
                                            </p>
                                        </div>
                                    </div>

                                    <div>
                                        <p className="flex text-[#96709d] font-medium items-center gap-1 tracking-wide mb-2">Bairro</p>
                                        <p className="text-gray-900 font-medium p-3 rounded-sm">
                                            {client.endereco?.bairro || 'N/A'}
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="col-span-2">
                                            <p className="flex text-[#96709d] font-medium items-center gap-1 tracking-wide mb-2">Logradouro</p>
                                            <p className="text-gray-900 font-medium p-3 rounded-sm break-words">
                                                {client.endereco?.logradouro || 'N/A'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="flex text-[#96709d] font-medium items-center gap-1 tracking-wide mb-2">Número</p>
                                            <p className="text-gray-900 font-medium p-3 rounded-sm">
                                                {client.endereco?.numero || 'N/A'}
                                            </p>
                                        </div>
                                    </div>

                                    {client.endereco?.complemento && (
                                        <div>
                                            <p className="flex text-[#96709d] font-medium items-center gap-1 tracking-wide mb-2">Complemento</p>
                                            <p className="text-gray-900 font-medium p-3 rounded-sm break-words">
                                                {client.endereco.complemento}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Seção 4: Documentos */}
                        <div className="mt-6 bg-white rounded-sm p-6 shadow-sm border border-gray-100">
                            <div className="flex items-center mb-6">
                                <div>
                                    <FontAwesomeIcon icon={faFileAlt} className="h-5 w-5 text-[#81059e]" />
                                <h4 className="text-xl font-bold text-[#81059e]">Documentos</h4>
                                </div>
                            </div>

                            {loadingDocuments ? (
                                <div className="flex justify-center items-center h-32">
                                    <FontAwesomeIcon icon={faSpinner} className="h-8 w-8 animate-spin text-gray-400" />
                                    <span className="ml-3 text-gray-600">Carregando documentos...</span>
                                </div>
                            ) : clientDocuments.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {clientDocuments.map((doc, index) => (
                                        <div key={index} className="bg-gray-50 rounded-sm p-4 border border-gray-200 hover:border-purple-300 transition-colors">
                                            <div className="flex items-center mb-3">
                                                <FontAwesomeIcon
                                                    icon={doc.name.toLowerCase().includes('.jpg') || doc.name.toLowerCase().includes('.png') ? faImage : faFileAlt}
                                                    className="h-5 w-5 text-purple-600 mr-2"
                                                />
                                                <span className="text-sm font-medium text-gray-800 truncate" title={doc.name}>
                                                    {doc.name}
                                                </span>
                                            </div>
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => setSelectedDocument({ url: doc.url, name: doc.name })}
                                                    className="flex items-center px-3 py-2 bg-purple-100 text-purple-700 text-xs rounded-md hover:bg-purple-200 transition-colors flex-1 justify-center"
                                                >
                                                    <FontAwesomeIcon icon={faEye} className="h-3 w-3 mr-1" />
                                                    Visualizar
                                                </button>
                                                <a
                                                    href={doc.url}
                                                    download={doc.name}
                                                    className="flex items-center px-3 py-2 bg-green-100 text-green-700 text-xs rounded-md hover:bg-green-200 transition-colors flex-1 justify-center"
                                                >
                                                    <FontAwesomeIcon icon={faDownload} className="h-3 w-3 mr-1" />
                                                    Baixar
                                                </a>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-gray-50 rounded-sm p-8 text-center">
                                    <FontAwesomeIcon icon={faFileAlt} className="h-12 w-12 text-gray-400 mb-4" />
                                    <p className="text-gray-600 mb-2">Nenhum documento encontrado</p>
                                    <p className="text-gray-500 text-sm">Os documentos do cliente aparecerão aqui quando disponíveis</p>
                                </div>
                            )}
                        </div>

                        {/* Seção 5: Relacionamento Familiar */}
                        <div className="mt-6 bg-white rounded-sm p-6 shadow-sm border border-gray-100">
                            <div className="flex items-center mb-6">
                                <div>
                                    <FontAwesomeIcon icon={faUsers} className="h-5 w-5 text-[#81059e]" />
                                <h4 className="text-xl font-bold text-[#81059e]">Relacionamento Familiar</h4>
                                </div>
                            </div>

                            {/* Cliente é um dependente */}
                            {client?.dependentesDe && (
                                <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-4">
                                    <p className="font-bold text-purple-800 mb-3 flex items-center">
                                        <span className="bg-purple-200 rounded-full px-3 py-1 text-xs mr-3">Dependente</span>
                                        Este cliente é dependente de:
                                    </p>
                                    {titularData ? (
                                        <div className="bg-white border border-purple-200 rounded-sm p-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-4 min-w-0 flex-1">
                                                    {titularImageUrl ? (
                                                        <img
                                                            src={titularImageUrl}
                                                            alt={`Foto de ${titularData.nome}`}
                                                            className="h-12 w-12 rounded-full object-cover border-2 border-purple-200 flex-shrink-0"
                                                            onError={(e) => {
                                                                e.target.src = "https://via.placeholder.com/48?text=NA";
                                                            }}
                                                        />
                                                    ) : (
                                                        <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold border-2 border-purple-200 flex-shrink-0">
                                                            {titularData.nome ? titularData.nome.charAt(0).toUpperCase() : "?"}
                                                        </div>
                                                    )}
                                                    <div className="min-w-0 flex-1">
                                                        <p className="font-bold text-gray-900 truncate">{titularData.nome}</p>
                                                        <p className="text-sm text-gray-600 truncate">CPF: {formatCPF(titularData.cpf)}</p>
                                                        <p className="text-sm text-purple-700">
                                                            <span className="font-semibold">Parentesco:</span> {client.parentesco || 'N/E'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <button
                                                    className="bg-purple-100 hover:bg-purple-200 p-2 rounded-sm transition-colors flex-shrink-0 ml-3"
                                                    onClick={() => {
                                                        onClose();
                                                        setTimeout(() => onClose(titularData), 100);
                                                    }}
                                                    title="Ver dados do titular"
                                                >
                                                    <FontAwesomeIcon icon={faUser} className="h-4 w-4 text-purple-700" />
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="bg-white border border-purple-200 rounded-sm p-4">
                                            <p className="text-gray-500">Carregando dados do titular...</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Cliente é um titular com dependentes */}
                            {client?.temDependentes && !client?.dependentesDe && (
                                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                                    <p className="font-bold text-green-800 mb-4 flex items-center">
                                        <span className="bg-green-200 rounded-full px-3 py-1 text-xs mr-3">Titular</span>
                                        Este cliente possui os seguintes dependentes:
                                    </p>
                                    {dependentesData.length > 0 ? (
                                        <div className="space-y-3">
                                            {dependentesData.map(dependente => (
                                                <div key={dependente.id} className="bg-white border border-green-200 rounded-sm p-4">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center space-x-4 min-w-0 flex-1">
                                                            {dependentesImageUrls[dependente.id] ? (
                                                                <img
                                                                    src={dependentesImageUrls[dependente.id]}
                                                                    alt={`Foto de ${dependente.nome}`}
                                                                    className="h-12 w-12 rounded-full object-cover border-2 border-green-200 flex-shrink-0"
                                                                    onError={(e) => {
                                                                        e.target.src = "https://via.placeholder.com/48?text=NA";
                                                                    }}
                                                                />
                                                            ) : (
                                                                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold border-2 border-green-200 flex-shrink-0">
                                                                    {dependente.nome ? dependente.nome.charAt(0).toUpperCase() : "?"}
                                                                </div>
                                                            )}
                                                            <div className="min-w-0 flex-1">
                                                                <p className="font-bold text-gray-900 truncate">{dependente.nome}</p>
                                                                <p className="text-sm text-gray-600 truncate">CPF: {formatCPF(dependente.cpf)}</p>
                                                                <p className="text-sm text-green-700">
                                                                    <span className="font-semibold">Parentesco:</span> {dependente.parentesco || 'N/E'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <button
                                                            className="bg-green-100 hover:bg-green-200 p-2 rounded-sm transition-colors flex-shrink-0 ml-3"
                                                            onClick={() => {
                                                                onClose();
                                                                setTimeout(() => onClose(dependente), 100);
                                                            }}
                                                            title="Ver dados do dependente"
                                                        >
                                                            <FontAwesomeIcon icon={faUser} className="h-4 w-4 text-green-700" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="bg-white border border-green-200 rounded-sm p-4">
                                            <p className="text-gray-500">Carregando dependentes...</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Cliente é um titular sem dependentes */}
                            {!client?.temDependentes && !client?.dependentesDe && (
                                <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                                    <div className="text-center">
                                        <FontAwesomeIcon icon={faUsers} className="h-12 w-12 text-gray-400 mb-4" />
                                        <p className="text-gray-600 mb-4">
                                            Este cliente não possui relações familiares cadastradas.
                                        </p>
                                        <Link href={`/register/consumers/add.client?titular=${client?.id}`}>
                                            <button className="inline-flex items-center px-4 py-2 bg-[#81059e] text-white rounded-sm hover:bg-[#690480] transition-colors">
                                                <FontAwesomeIcon icon={faUsers} className="h-4 w-4 mr-2" />
                                                Adicionar dependente
                                            </button>
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer com botões de ação */}
                    <div className="bg-white border-t border-gray-200 p-6">
                        <div className="flex flex-wrap gap-3 justify-center">
                            <button
                                className={`flex items-center px-6 py-3 ${isGenerating
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'text-gray-500 border hover:bg-purple-100'
                                    } text-gray-500 rounded-sm transition-colors shadow-sm font-medium`}
                                onClick={handleOpenPDF}
                                disabled={isGenerating}
                            >
                                <FontAwesomeIcon
                                    icon={isGenerating ? faSpinner : faPrint}
                                    className={`h-4 w-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`}
                                />
                                {isGenerating ? 'Gerando...' : 'Gerar PDF'}
                            </button>

                            {communications.telefones && communications.telefones.length > 0 && (
                                <a
                                    href={generateWhatsAppLink(communications.telefones[0])}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center px-6 py-3 border text-gray-500 rounded-sm hover:bg-purple-100 transition-colors shadow-sm font-medium"
                                >
                                    <FontAwesomeIcon icon={faPhone} className="h-4 w-4 mr-2" />
                                    WhatsApp
                                </a>
                            )}

                            <Link href={`/clients/edit/${client.id}`}>
                                <button className="flex items-center px-6 py-3 border text-gray-500 rounded-sm hover:bg-purple-100 transition-colors shadow-sm font-medium">
                                    <FontAwesomeIcon icon={faEdit} className="h-4 w-4 mr-2" />
                                    Editar
                                </button>
                            </Link>

                            <button
                                className="flex items-center px-6 py-3 border text-gray-500 rounded-sm hover:bg-purple-100 transition-colors shadow-sm font-medium"
                                onClick={onClose}
                            >
                                <FontAwesomeIcon icon={faX} className="h-4 w-4 mr-2" />
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal de visualização de documentos */}
            {selectedDocument && (
                <DocumentViewerModal
                    documentUrl={selectedDocument.url}
                    documentName={selectedDocument.name}
                    onClose={() => setSelectedDocument(null)}
                />
            )}
        </>
    );
};

export default ClientDetailsModal;