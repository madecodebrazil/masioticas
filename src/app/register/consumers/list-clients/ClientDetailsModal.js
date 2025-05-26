"use client";

import { useState, useEffect } from "react";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { firestore } from "@/lib/firebaseConfig";
import { getStorage, ref, getDownloadURL, listAll } from "firebase/storage";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUsers, faPhone, faX, faUser, faHome, faIdCard, faEdit, faPrint } from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import { jsPDF } from "jspdf";

// Função auxiliar para debug do Storage
const debugStoragePath = async (path) => {
    console.log("Tentando acessar caminho:", path);
    const storage = getStorage();
    const pathRef = ref(storage, path);
    try {
        console.log("Referência criada:", pathRef);
        const list = await listAll(pathRef);
        console.log("Conteúdo do diretório:", path);
        console.log("Pastas:", list.prefixes.map(p => p.fullPath));
        console.log("Arquivos:", list.items.map(i => i.fullPath));
        return list;
    } catch (error) {
        console.error("Erro ao listar diretório:", path, error);
        return null;
    }
};

const ClientDetailsModal = ({ client, onClose }) => {
    const [titularData, setTitularData] = useState(null);
    const [dependentesData, setDependentesData] = useState([]);
    const [clientImageUrl, setClientImageUrl] = useState(null);
    const [titularImageUrl, setTitularImageUrl] = useState(null);
    const [dependentesImageUrls, setDependentesImageUrls] = useState({});

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
        }
    }, [client]);

    useEffect(() => {
        debugStoragePath("");
        debugStoragePath("clientes");
    }, []);

    const handleDownloadPDF = () => {
        if (!client) return;

        const docPDF = new jsPDF();
        const logoUrl = "/images/otica_pop.png";
        const imgWidth = 40;
        const imgHeight = 40;
        const img = new window.Image();
        img.src = logoUrl;

        const generatePDF = () => {
            docPDF.addImage(img, "PNG", 10, 8, imgWidth, imgHeight);

            let y = 30;

            docPDF.setFontSize(16);
            docPDF.text("Ficha de Cadastro - Masioticas", 55, y);
            y += 10;

            docPDF.setFontSize(11);
            docPDF.text(`Nome: ${client.nome || ''}`, 10, y += 10);
            docPDF.text(`CPF: ${client.cpf || ''}`, 10, y += 10);
            docPDF.text(`Telefones: ${client.telefones?.join(", ") || "N/A"}`, 10, y += 10);
            docPDF.text(`Email: ${client.email || 'N/A'}`, 10, y += 10);
            docPDF.text(`Data de Nascimento: ${client.dataNascimento || 'N/A'}`, 10, y += 10);
            docPDF.text(`Gênero: ${client.genero || 'N/A'}`, 10, y += 10);
            docPDF.text(`Estado Civil: ${client.estadoCivil || 'N/A'}`, 10, y += 10);
            docPDF.text(`Escolaridade: ${client.escolaridade || 'N/A'}`, 10, y += 10);
            docPDF.text(`Profissão: ${client.profissao || 'N/A'}`, 10, y += 10);
            docPDF.text(`Cidade: ${client.endereco?.cidade || 'N/A'}`, 10, y += 10);
            docPDF.text(`Estado: ${client.endereco?.estado || 'N/A'}`, 10, y += 10);
            docPDF.text(`Bairro: ${client.endereco?.bairro || 'N/A'}`, 10, y += 10);
            docPDF.text(`Logradouro: ${client.endereco?.logradouro || 'N/A'}`, 10, y += 10);
            docPDF.text(`Número: ${client.endereco?.numero || 'N/A'}`, 10, y += 10);
            docPDF.text(`Complemento: ${client.endereco?.complemento || 'N/A'}`, 10, y += 10);
            docPDF.text(`CEP: ${client.endereco?.cep || 'N/A'}`, 10, y += 10);

            const maxWidth = 180;

            docPDF.text(
                "Declaro, sob as penas da lei, que as informações fornecidas neste cadastro são verdadeiras e de minha inteira responsabilidade. Estou ciente de que a falsidade das declarações poderá implicar em sanções civis e penais previstas na legislação vigente.",
                10, y + 5,
                { maxWidth, align: "left" }
            );

            y += 18;
            docPDF.rect(10, y, 6, 6);
            docPDF.text(
                "Concordo com o uso dos meus dados pessoais para fins legais, conforme previsto na Lei Geral de Proteção de Dados (LGPD – Lei nº 13.709/2018).",
                18, y + 5,
                { maxWidth: 170, align: "left" }
            );

            y += 20;
            docPDF.line(10, y, 190, y);
            docPDF.text("Assinatura do cliente: " + (client.nome || ''), 10, y + 7);

            const pdfBlob = docPDF.output('blob');
            const blobUrl = URL.createObjectURL(new Blob([pdfBlob], { type: 'application/pdf' }));
            window.open(blobUrl);
        };

        if (img.complete) {
            generatePDF();
        } else {
            img.onload = generatePDF;
        }
    };

    const generateWhatsAppLink = (phoneNumber) => {
        const cleanNumber = phoneNumber.replace(/\D/g, '');
        const formattedNumber = cleanNumber.startsWith('55') ? cleanNumber : `55${cleanNumber}`;
        return `https://wa.me/${formattedNumber}`;
    };

    if (!client) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl relative overflow-hidden max-h-[95vh] flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-[#81059e] to-[#a855f7] p-4 text-white relative">
                    <button
                        onClick={onClose}
                        className="absolute top-3 right-3 text-white/80 hover:text-white hover:bg-white/20 rounded-full p-2 transition-all"
                    >
                        <FontAwesomeIcon icon={faX} className="h-4 w-4" />
                    </button>

                    <div className="flex items-center space-x-4">
                        {/* Foto de perfil */}
                        <div className="relative">
                            {clientImageUrl ? (
                                <img
                                    src={clientImageUrl}
                                    alt={`Foto de ${client.nome}`}
                                    className="h-20 w-20 rounded-full object-cover border-4 border-white shadow-lg"
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = "https://via.placeholder.com/80?text=NA";
                                    }}
                                />
                            ) : (
                                <div className="h-20 w-20 rounded-full bg-white/20 flex items-center justify-center text-white text-xl font-bold border-4 border-white shadow-lg">
                                    {client.nome ? client.nome.charAt(0).toUpperCase() : "?"}
                                </div>
                            )}
                            <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1.5">
                                <FontAwesomeIcon icon={faUser} className="h-3 w-3 text-white" />
                            </div>
                        </div>

                        {/* Informações básicas */}
                        <div className="flex-1 min-w-0">
                            <h3 className="text-xl font-bold mb-2 truncate">{client.nome || 'Cliente'}</h3>
                            <div className="space-y-1 text-white/90 text-sm">
                                <p className="flex items-center">
                                    <FontAwesomeIcon icon={faIdCard} className="h-3 w-3 mr-2 flex-shrink-0" />
                                    <span className="font-bold">ID:</span> <span className="ml-2 truncate">{client.id}</span>
                                </p>
                                <p className="flex items-center">
                                    <FontAwesomeIcon icon={faIdCard} className="h-3 w-3 mr-2 flex-shrink-0" />
                                    <span className="font-bold">CPF:</span> <span className="ml-2 truncate">{client.cpf || 'N/A'}</span>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Conteúdo Principal */}
                <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                        {/* Informações Pessoais */}
                        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                            <div className="flex items-center mb-4">
                                <div className="bg-[#81059e]/10 p-2 rounded-lg mr-2">
                                    <FontAwesomeIcon icon={faUser} className="h-4 w-4 text-[#81059e]" />
                                </div>
                                <h4 className="text-lg font-bold text-gray-800">Informações Pessoais</h4>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <p className="text-gray-600 font-bold text-xs uppercase tracking-wide mb-1">Nome Completo</p>
                                    <p className="text-gray-900 font-medium text-sm break-words">{client.nome || 'N/A'}</p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <p className="text-gray-600 font-bold text-xs uppercase tracking-wide mb-1">Email</p>
                                        <p className="text-gray-900 font-medium text-sm break-all">{client.email || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-600 font-bold text-xs uppercase tracking-wide mb-1">Gênero</p>
                                        <p className="text-gray-900 font-medium text-sm">{client.genero || 'N/A'}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <p className="text-gray-600 font-bold text-xs uppercase tracking-wide mb-1">Data de Nascimento</p>
                                        <p className="text-gray-900 font-medium text-sm">
                                            {client.dataNascimento ?
                                                (typeof client.dataNascimento === 'string' ?
                                                    client.dataNascimento :
                                                    new Date(client.dataNascimento.seconds * 1000).toLocaleDateString('pt-BR'))
                                                : 'N/A'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-gray-600 font-bold text-xs uppercase tracking-wide mb-1">Estado Civil</p>
                                        <p className="text-gray-900 font-medium text-sm">{client.estadoCivil || 'N/A'}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <p className="text-gray-600 font-bold text-xs uppercase tracking-wide mb-1">Profissão</p>
                                        <p className="text-gray-900 font-medium text-sm">{client.profissao || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-600 font-bold text-xs uppercase tracking-wide mb-1">Escolaridade</p>
                                        <p className="text-gray-900 font-medium text-sm">{client.escolaridade || 'N/A'}</p>
                                    </div>
                                </div>

                                <div>
                                    <p className="text-gray-600 font-bold text-xs uppercase tracking-wide mb-1">Telefones</p>
                                    <div className="flex flex-wrap gap-1">
                                        {client.telefones && client.telefones.length > 0 ? (
                                            client.telefones.map((telefone, index) => (
                                                <span key={index} className="bg-gray-100 px-2 py-1 rounded-full text-xs font-medium text-gray-800">
                                                    {telefone}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-gray-500 text-sm">Não informado</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Endereço */}
                        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                            <div className="flex items-center mb-4">
                                <div className="bg-blue-500/10 p-2 rounded-lg mr-2">
                                    <FontAwesomeIcon icon={faHome} className="h-4 w-4 text-blue-600" />
                                </div>
                                <h4 className="text-lg font-bold text-gray-800">Endereço</h4>
                            </div>

                            <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <p className="text-gray-600 font-bold text-xs uppercase tracking-wide mb-1">Cidade</p>
                                        <p className="text-gray-900 font-medium text-sm">{client.endereco?.cidade || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-600 font-bold text-xs uppercase tracking-wide mb-1">Estado</p>
                                        <p className="text-gray-900 font-medium text-sm">{client.endereco?.estado || 'N/A'}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <p className="text-gray-600 font-bold text-xs uppercase tracking-wide mb-1">Bairro</p>
                                        <p className="text-gray-900 font-medium text-sm">{client.endereco?.bairro || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-600 font-bold text-xs uppercase tracking-wide mb-1">CEP</p>
                                        <p className="text-gray-900 font-medium text-sm">{client.endereco?.cep || 'N/A'}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-3">
                                    <div className="col-span-2">
                                        <p className="text-gray-600 font-bold text-xs uppercase tracking-wide mb-1">Logradouro</p>
                                        <p className="text-gray-900 font-medium text-sm break-words">{client.endereco?.logradouro || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-600 font-bold text-xs uppercase tracking-wide mb-1">Número</p>
                                        <p className="text-gray-900 font-medium text-sm">{client.endereco?.numero || 'N/A'}</p>
                                    </div>
                                </div>

                                <div>
                                    <p className="text-gray-600 font-bold text-xs uppercase tracking-wide mb-1">Complemento</p>
                                    <p className="text-gray-900 font-medium text-sm break-words">{client.endereco?.complemento || 'N/A'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Seção de Relacionamento Familiar */}
                    <div className="mt-4 bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                        <div className="flex items-center mb-4">
                            <div className="bg-green-500/10 p-2 rounded-lg mr-2">
                                <FontAwesomeIcon icon={faUsers} className="h-4 w-4 text-green-600" />
                            </div>
                            <h4 className="text-lg font-bold text-gray-800">Relacionamento Familiar</h4>
                        </div>

                        {/* Cliente é um dependente */}
                        {client?.dependentesDe && (
                            <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 mb-3">
                                <p className="font-bold text-purple-800 mb-2 flex items-center text-sm">
                                    <span className="bg-purple-200 rounded-full px-2 py-1 text-xs mr-2">Dependente</span>
                                    Este cliente é dependente de:
                                </p>
                                {titularData ? (
                                    <div className="bg-white border border-purple-200 rounded-lg p-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-3 min-w-0 flex-1">
                                                {titularImageUrl ? (
                                                    <img
                                                        src={titularImageUrl}
                                                        alt={`Foto de ${titularData.nome}`}
                                                        className="h-10 w-10 rounded-full object-cover border-2 border-purple-200 flex-shrink-0"
                                                        onError={(e) => {
                                                            e.target.src = "https://via.placeholder.com/40?text=NA";
                                                        }}
                                                    />
                                                ) : (
                                                    <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold border-2 border-purple-200 flex-shrink-0 text-sm">
                                                        {titularData.nome ? titularData.nome.charAt(0).toUpperCase() : "?"}
                                                    </div>
                                                )}
                                                <div className="min-w-0 flex-1">
                                                    <p className="font-bold text-gray-900 text-sm truncate">{titularData.nome}</p>
                                                    <p className="text-xs text-gray-600 truncate">CPF: {titularData.cpf}</p>
                                                    <p className="text-xs text-purple-700">
                                                        <span className="font-bold">Parentesco:</span> {client.parentesco || 'N/E'}
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                className="bg-purple-100 hover:bg-purple-200 p-2 rounded-lg transition-colors flex-shrink-0 ml-2"
                                                onClick={() => {
                                                    onClose();
                                                    setTimeout(() => onClose(titularData), 100);
                                                }}
                                                title="Ver dados do titular"
                                            >
                                                <FontAwesomeIcon icon={faUser} className="h-3 w-3 text-purple-700" />
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-white border border-purple-200 rounded-lg p-3">
                                        <p className="text-gray-500 text-sm">Carregando dados do titular...</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Cliente é um titular com dependentes */}
                        {client?.temDependentes && !client?.dependentesDe && (
                            <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                                <p className="font-bold text-green-800 mb-3 flex items-center text-sm">
                                    <span className="bg-green-200 rounded-full px-2 py-1 text-xs mr-2">Titular</span>
                                    Este cliente possui os seguintes dependentes:
                                </p>
                                {dependentesData.length > 0 ? (
                                    <div className="space-y-2">
                                        {dependentesData.map(dependente => (
                                            <div key={dependente.id} className="bg-white border border-green-200 rounded-lg p-3">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                                                        {dependentesImageUrls[dependente.id] ? (
                                                            <img
                                                                src={dependentesImageUrls[dependente.id]}
                                                                alt={`Foto de ${dependente.nome}`}
                                                                className="h-10 w-10 rounded-full object-cover border-2 border-green-200 flex-shrink-0"
                                                                onError={(e) => {
                                                                    e.target.src = "https://via.placeholder.com/40?text=NA";
                                                                }}
                                                            />
                                                        ) : (
                                                            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold border-2 border-green-200 flex-shrink-0 text-sm">
                                                                {dependente.nome ? dependente.nome.charAt(0).toUpperCase() : "?"}
                                                            </div>
                                                        )}
                                                        <div className="min-w-0 flex-1">
                                                            <p className="font-bold text-gray-900 text-sm truncate">{dependente.nome}</p>
                                                            <p className="text-xs text-gray-600 truncate">CPF: {dependente.cpf}</p>
                                                            <p className="text-xs text-green-700">
                                                                <span className="font-bold">Parentesco:</span> {dependente.parentesco || 'N/E'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        className="bg-green-100 hover:bg-green-200 p-2 rounded-lg transition-colors flex-shrink-0 ml-2"
                                                        onClick={() => {
                                                            onClose();
                                                            setTimeout(() => onClose(dependente), 100);
                                                        }}
                                                        title="Ver dados do dependente"
                                                    >
                                                        <FontAwesomeIcon icon={faUser} className="h-3 w-3 text-green-700" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="bg-white border border-green-200 rounded-lg p-3">
                                        <p className="text-gray-500 text-sm">Carregando dependentes...</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Cliente é um titular sem dependentes */}
                        {!client?.temDependentes && !client?.dependentesDe && (
                            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                                <div className="text-center">
                                    <FontAwesomeIcon icon={faUsers} className="h-8 w-8 text-gray-400 mb-2" />
                                    <p className="text-gray-600 mb-3 text-sm">
                                        Este cliente não possui relações familiares cadastradas.
                                    </p>
                                    <Link href={`/register/consumers/add.client?titular=${client?.id}`}>
                                        <button className="inline-flex items-center px-3 py-2 bg-[#81059e] text-white rounded-lg hover:bg-[#690480] transition-colors text-sm">
                                            <FontAwesomeIcon icon={faUsers} className="h-3 w-3 mr-2" />
                                            Adicionar dependente
                                        </button>
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer com botões de ação */}
                <div className="bg-white border-t border-gray-200 p-4">
                    <div className="flex flex-wrap gap-2 justify-center">
                        <button
                            className="flex items-center px-4 py-2 bg-[#81059e] text-white rounded-lg hover:bg-[#690480] transition-colors shadow-sm text-sm"
                            onClick={handleDownloadPDF}
                        >
                            <FontAwesomeIcon icon={faPrint} className="h-3 w-3 mr-2" />
                            Imprimir
                        </button>

                        {client.telefones && client.telefones.length > 0 && (
                            <a
                                href={generateWhatsAppLink(client.telefones[0])}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors shadow-sm text-sm"
                            >
                                <FontAwesomeIcon icon={faPhone} className="h-3 w-3 mr-2" />
                                WhatsApp
                            </a>
                        )}

                        <Link href={`/clients/edit/${client.id}`}>
                            <button className="flex items-center px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors shadow-sm text-sm">
                                <FontAwesomeIcon icon={faEdit} className="h-3 w-3 mr-2" />
                                Editar
                            </button>
                        </Link>

                        <button
                            className="flex items-center px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors shadow-sm text-sm"
                            onClick={onClose}
                        >
                            <FontAwesomeIcon icon={faX} className="h-3 w-3 mr-2" />
                            Fechar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClientDetailsModal;