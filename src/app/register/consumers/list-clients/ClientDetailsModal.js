"use client";

import { useState, useEffect } from "react";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { firestore } from "@/lib/firebaseConfig";
import { getStorage, ref, getDownloadURL, listAll } from "firebase/storage";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUsers, faPhone } from "@fortawesome/free-solid-svg-icons";
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
    // Função para buscar dados do titular e dependentes
const fetchFamilyData = async (client) => {
    try {
      // Resetar dados anteriores
      setTitularData(null);
      setDependentesData([]);
  
      // Se for dependente, buscar dados do titular
      if (client.dependentesDe) {
        // Caminho corrigido para a coleção de clientes
        const titularRef = doc(firestore, 'lojas/clientes/users', client.dependentesDe);
        const titularDoc = await getDoc(titularRef);
  
        if (titularDoc.exists()) {
          setTitularData({
            id: titularDoc.id,
            ...titularDoc.data()
          });
        }
      }
      // Se for titular com dependentes, buscar dependentes
      else if (client.temDependentes) {
        // Caminho corrigido para a coleção de clientes
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
                // Abordagem alternativa
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
            // Só tenta buscar do storage se não houver client.imagem
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
        debugStoragePath("");  // Listar a raiz do storage
        debugStoragePath("clientes");  // Listar o diretório 'clientes'
    }, []);

    const handleDownloadPDF = () => {
        if (!client) return;

        const docPDF = new jsPDF();
        docPDF.text(`Nome: ${client.nome}`, 10, 10);
        docPDF.text(`CPF: ${client.cpf}`, 10, 20);
        docPDF.text(`Telefones: ${client.telefones?.join(", ") || "N/A"}`, 10, 30);
        docPDF.text(`Cidade: ${client.endereco?.cidade || 'N/A'}`, 10, 40);
        docPDF.text(`Bairro: ${client.endereco?.bairro || 'N/A'}`, 10, 50);
        docPDF.text(`Logradouro: ${client.endereco?.logradouro || 'N/A'}`, 10, 60);
        docPDF.text(`Número: ${client.endereco?.numero || 'N/A'}`, 10, 70);

        docPDF.save(`${client.nome}-dados.pdf`);
    };

    const generateWhatsAppLink = (phoneNumber) => {
        const cleanNumber = phoneNumber.replace(/\D/g, '');
        const formattedNumber = cleanNumber.startsWith('55') ? cleanNumber : `55${cleanNumber}`;
        return `https://wa.me/${formattedNumber}`;
    };

    if (!client) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-[#81059e] p-6 rounded-lg shadow-lg w-full max-w-md relative text-black overflow-y-auto max-h-[90vh]">
                <h3 className="text-xl font-bold mb-4" style={{ color: "#81059e" }}>
                    Dados do Cliente
                </h3>

                {/* Foto de perfil centralizada */}
                <div className="flex justify-center mb-6">
                    {clientImageUrl ? (
                        <img
                            src={clientImageUrl}
                            alt={`Foto de ${client.nome}`}
                            className="h-32 w-32 rounded-full object-cover border-4 border-purple-200"
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = "https://via.placeholder.com/128?text=NA";
                            }}
                        />
                    ) : (
                        <div className="h-32 w-32 rounded-full bg-purple-200 flex items-center justify-center text-purple-800 text-4xl font-bold">
                            {client.nome ? client.nome.charAt(0).toUpperCase() : "?"}
                        </div>
                    )}
                </div>

                <div className="space-y-2">
                    <p className="text-black">
                        <strong>ID:</strong> {client.id}
                    </p>
                    <p className="text-black">
                        <strong>Nome:</strong> {client.nome || 'N/A'}
                    </p>
                    <p className="text-black">
                        <strong>CPF:</strong> {client.cpf || 'N/A'}
                    </p>
                    <p className="text-black">
                        <strong>Email:</strong> {client.email || 'N/A'}
                    </p>
                    <p className="text-black">
                        <strong>Telefones:</strong>{" "}
                        {client.telefones && client.telefones.length > 0
                            ? client.telefones.join(", ")
                            : "Não informado"}
                    </p>
                    <p className="text-black">
                        <strong>Data de Nascimento:</strong>{" "}
                        {client.dataNascimento ?
                            (typeof client.dataNascimento === 'string' ?
                                client.dataNascimento :
                                new Date(client.dataNascimento.seconds * 1000).toLocaleDateString('pt-BR'))
                            : 'N/A'}
                    </p>
                    <p className="text-black">
                        <strong>Gênero:</strong> {client.genero || 'N/A'}
                    </p>
                    <p className="text-black">
                        <strong>Estado Civil:</strong>{" "}
                        {client.estadoCivil || 'N/A'}
                    </p>
                    <p className="text-black">
                        <strong>Escolaridade:</strong>{" "}
                        {client.escolaridade || 'N/A'}
                    </p>
                    <p className="text-black">
                        <strong>Cidade:</strong> {client.endereco?.cidade || 'N/A'}
                    </p>
                    <p className="text-black">
                        <strong>Estado:</strong> {client.endereco?.estado || 'N/A'}
                    </p>
                    <p className="text-black">
                        <strong>Bairro:</strong> {client.endereco?.bairro || 'N/A'}
                    </p>
                    <p className="text-black">
                        <strong>Logradouro:</strong>{" "}
                        {client.endereco?.logradouro || 'N/A'}
                    </p>
                    <p className="text-black">
                        <strong>Número:</strong> {client.endereco?.numero || 'N/A'}
                    </p>
                    <p className="text-black">
                        <strong>Complemento:</strong>{" "}
                        {client.endereco?.complemento || 'N/A'}
                    </p>
                    <p className="text-black">
                        <strong>CEP:</strong> {client.endereco?.cep || 'N/A'}
                    </p>
                </div>

                {/* Seção de Relacionamento Familiar */}
                <div className="mt-6 border-t pt-4">
                    <h4 className="text-lg font-semibold text-[#81059e] mb-3">
                        <FontAwesomeIcon icon={faUsers} className="mr-2" />
                        Relacionamento Familiar
                    </h4>

                    {/* Cliente é um dependente */}
                    {client?.dependentesDe && (
                        <div className="bg-purple-50 p-3 rounded-lg mb-3">
                            <p className="font-medium text-[#81059e] mb-2">
                                Este cliente é dependente de:
                            </p>
                            {titularData ? (
                                <div className="flex items-center">
                                    <div className="bg-white p-2 rounded-lg border border-purple-200 flex-grow">
                                        <div className="flex items-center">
                                            {titularImageUrl ? (
                                                <img
                                                    src={titularImageUrl}
                                                    alt={`Foto de ${titularData.nome}`}
                                                    className="h-10 w-10 rounded-full object-cover mr-2"
                                                    onError={(e) => {
                                                        e.target.src = "https://via.placeholder.com/40?text=NA";
                                                    }}
                                                />
                                            ) : (
                                                <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold mr-2">
                                                    {titularData.nome ? titularData.nome.charAt(0).toUpperCase() : "?"}
                                                </div>
                                            )}
                                            <div>
                                                <p className="font-medium">{titularData.nome}</p>
                                                <p className="text-sm">CPF: {titularData.cpf}</p>
                                                <p className="text-sm">
                                                    <span className="text-purple-700">Parentesco:</span> {client.parentesco || 'Não especificado'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        className="ml-2 bg-purple-100 p-2 rounded-lg hover:bg-purple-200"
                                        onClick={() => {
                                            onClose();
                                            setTimeout(() => onClose(titularData), 100);
                                        }}
                                        title="Ver dados do titular"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#81059e]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    </button>
                                </div>
                            ) : (
                                <p className="text-gray-500">Carregando dados do titular...</p>
                            )}
                        </div>
                    )}

                    {/* Cliente é um titular com dependentes */}
                    {client?.temDependentes && !client?.dependentesDe && (
                        <div className="bg-purple-50 p-3 rounded-lg">
                            <p className="font-medium text-[#81059e] mb-2">
                                Este cliente possui os seguintes dependentes:
                            </p>
                            {dependentesData.length > 0 ? (
                                <div className="space-y-2">
                                    {dependentesData.map(dependente => (
                                        <div key={dependente.id} className="flex items-center">
                                            <div className="bg-white p-2 rounded-lg border border-purple-200 flex-grow">
                                                <div className="flex items-center">
                                                    {dependentesImageUrls[dependente.id] ? (
                                                        <img
                                                            src={dependentesImageUrls[dependente.id]}
                                                            alt={`Foto de ${dependente.nome}`}
                                                            className="h-10 w-10 rounded-full object-cover mr-2"
                                                            onError={(e) => {
                                                                e.target.src = "https://via.placeholder.com/40?text=NA";
                                                            }}
                                                        />
                                                    ) : (
                                                        <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold mr-2">
                                                            {dependente.nome ? dependente.nome.charAt(0).toUpperCase() : "?"}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className="font-medium">{dependente.nome}</p>
                                                        <p className="text-sm">CPF: {dependente.cpf}</p>
                                                        <p className="text-sm">
                                                            <span className="text-purple-700">Parentesco:</span> {dependente.parentesco || 'Não especificado'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                className="ml-2 bg-purple-100 p-2 rounded-lg hover:bg-purple-200"
                                                onClick={() => {
                                                    onClose();
                                                    setTimeout(() => onClose(dependente), 100);
                                                }}
                                                title="Ver dados do dependente"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#81059e]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-500">Carregando dependentes...</p>
                            )}
                        </div>
                    )}

                    {/* Cliente é um titular sem dependentes */}
                    {!client?.temDependentes && !client?.dependentesDe && (
                        <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-gray-600">
                                Este cliente não possui relações familiares cadastradas.
                            </p>
                            <Link href={`/register/consumers/add.client?titular=${client?.id}`}>
                                <button className="mt-2 text-sm text-[#81059e] hover:text-[#690480] flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                    Adicionar dependente para este cliente
                                </button>
                            </Link>
                        </div>
                    )}
                </div>

                <div className="mt-4 flex flex-wrap gap-2 justify-center">
                    <button
                        className="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 transition"
                        onClick={() => window.print()}
                    >
                        Imprimir
                    </button>
                    <button
                        className="bg-[#81059e] text-white py-2 px-4 rounded hover:bg-[#690480] transition"
                        onClick={handleDownloadPDF}
                    >
                        Baixar PDF
                    </button>
                    {client.telefones && client.telefones.length > 0 && (
                        <a
                            href={generateWhatsAppLink(client.telefones[0])}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 transition flex items-center gap-2"
                        >
                            <FontAwesomeIcon icon={faPhone} className="h-5 w-5" />
                            WhatsApp
                        </a>
                    )}
                    <Link href={`/clients/edit/${client.id}`}>
                        <button
                            className="bg-yellow-500 text-white py-2 px-4 rounded hover:bg-yellow-600 transition"
                        >
                            Editar
                        </button>
                    </Link>
                    <button
                        className="bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600 transition"
                        onClick={onClose}
                    >
                        Fechar
                    </button>
                </div>

                <button
                    onClick={onClose}
                    className="absolute top-2 right-2 text-gray-600 hover:text-gray-800"
                >
                    &times;
                </button>
            </div>
        </div>
    );
};

export default ClientDetailsModal; 