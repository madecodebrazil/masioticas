"use client";

import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { firestore } from "@/lib/firebaseConfig";
import { getStorage, ref, getDownloadURL, listAll } from "firebase/storage";
import Layout from "@/components/Layout";
import { jsPDF } from "jspdf";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUsers,
  faCakeCandles,
  faGlasses,
  faTrash,
  faIdCard,
  faPhone
} from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import ClientDetailsModal from "./ClientDetailsModal";

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

const ClientsTable = () => {
  const { userPermissions } = useAuth();
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);
  const [selectedForDeletion, setSelectedForDeletion] = useState([]);
  const [expandedFamilies, setExpandedFamilies] = useState({});
  const [clientesAgrupados, setClientesAgrupados] = useState({ titulares: [], dependentes: {} });
  const [clientImages, setClientImages] = useState({});

  // Função para construir o caminho do diretório do cliente
  const getImagePath = (cpf) => {
    return `clientes/${cpf}`;
  };

  // Função para obter URL da imagem
  const getImageUrl = async (cpf) => {
    if (!cpf) return null;
    try {
      const storage = getStorage();
      const folderRef = ref(storage, `clientes/${cpf}`);
      const listResult = await listAll(folderRef);
      if (listResult.items.length > 0) {
        const fileRef = listResult.items[0];
        const url = await getDownloadURL(fileRef);
        return url;
      }
      return null;
    } catch (error) {
      // Silencie o erro se não houver imagem
      return null;
    }
  };

  // Buscar URLs das imagens
  useEffect(() => {
    const fetchImageUrls = async () => {
      const urls = {};
      for (const client of clients) {
        if (client.cpf) {
          urls[client.id] = await getImageUrl(client.cpf);
        }
      }
      setClientImages(urls);
    };

    if (clients.length > 0) {
      fetchImageUrls();
    }
  }, [clients]);

  useEffect(() => {
    debugStoragePath("");  // Listar a raiz do storage
    debugStoragePath("clientes");  // Listar o diretório 'clientes'
  }, []);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        setLoading(true);
        const fetchedClients = [];
        const clientsCollection = collection(firestore, 'lojas/clientes/users');
        const snapshot = await getDocs(clientsCollection);
        const clientsWithPromises = snapshot.docs.map(async (doc) => {
          const clientData = doc.data();
          let imageUrl = null;
          if (clientData.cpf) {
            imageUrl = await getImageUrl(clientData.cpf);
          }
          return {
            id: doc.id,
            ...clientData,
            imagemUrl: imageUrl
          };
        });
        const resolvedClients = await Promise.all(clientsWithPromises);
        setClients(resolvedClients);
        setFilteredClients(resolvedClients);
        setLoading(false);
      } catch (error) {
        console.error("Erro ao buscar clientes:", error);
        setError("Erro ao carregar os dados dos clientes: " + error.message);
        setLoading(false);
      }
    };
    fetchClients();
  }, []);

  // Filtrar clientes com base na busca
  useEffect(() => {
    if (searchQuery === "") {
      setFilteredClients(clients);
    } else {
      const filtered = clients.filter(
        (client) =>
          (client.nome?.toLowerCase().includes(searchQuery.toLowerCase()) || "") ||
          (client.cpf?.includes(searchQuery) || "") ||
          (Array.isArray(client.telefones) &&
            client.telefones.some((tel) =>
              tel.toLowerCase().includes(searchQuery.toLowerCase())
            ))
      );
      setFilteredClients(filtered);
    }
  }, [searchQuery, clients]);

  // Agrupar clientes por família
  useEffect(() => {
    const agruparClientesPorFamilia = () => {
      const titularesArray = [];
      const dependentesObj = {};

      // Separar titulares e dependentes
      clients.forEach(cliente => {
        if (!cliente.dependentesDe) {
          titularesArray.push(cliente);

          // Inicializar array para dependentes deste titular
          if (cliente.temDependentes) {
            dependentesObj[cliente.id] = [];
          }
        } else {
          // Adicionar ao array de dependentes do titular
          if (!dependentesObj[cliente.dependentesDe]) {
            dependentesObj[cliente.dependentesDe] = [];
          }
          dependentesObj[cliente.dependentesDe].push(cliente);
        }
      });

      setClientesAgrupados({
        titulares: titularesArray,
        dependentes: dependentesObj
      });
    };

    if (clients.length > 0) {
      agruparClientesPorFamilia();
    }
  }, [clients]);

  const handleModalOpen = (client) => {
    setSelectedClient(client);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setSelectedClient(null);
  };

  const handleDownloadPDF = () => {
    if (!selectedClient) return;

    const docPDF = new jsPDF();
    docPDF.text(`Nome: ${selectedClient.nome}`, 10, 10);
    docPDF.text(`CPF: ${selectedClient.cpf}`, 10, 20);

    // Telefones
    const telefonesString =
      selectedClient.telefones && selectedClient.telefones.length > 0
        ? selectedClient.telefones.join(", ")
        : "Não informado";

    docPDF.text(`Telefones: ${telefonesString}`, 10, 30);
    docPDF.text(`Cidade: ${selectedClient.endereco?.cidade || 'N/A'}`, 10, 40);
    docPDF.text(`Bairro: ${selectedClient.endereco?.bairro || 'N/A'}`, 10, 50);
    docPDF.text(`Logradouro: ${selectedClient.endereco?.logradouro || 'N/A'}`, 10, 60);
    docPDF.text(`Número: ${selectedClient.endereco?.numero || 'N/A'}`, 10, 70);

    docPDF.save(`${selectedClient.nome}-dados.pdf`);
  };

  const handlePrint = () => {
    window.print();
  };

  // Função para marcar ou desmarcar cliente para exclusão
  const toggleDeletion = (e, clientId) => {
    e.stopPropagation(); // Evitar abrir o modal

    setSelectedForDeletion(prev => {
      if (prev.includes(clientId)) {
        return prev.filter(id => id !== clientId);
      } else {
        return [...prev, clientId];
      }
    });
  };

  // Função para excluir os clientes selecionados
  const handleDeleteSelected = async () => {
    if (selectedForDeletion.length === 0) {
      alert('Selecione pelo menos um cliente para excluir.');
      return;
    }

    if (confirm(`Deseja realmente excluir ${selectedForDeletion.length} clientes selecionados?`)) {
      try {
        for (const clientId of selectedForDeletion) {
          // Excluir o cliente da coleção correta: lojas/clientes/users
          const clientRef = doc(firestore, "lojas/clientes/users", clientId);
          await deleteDoc(clientRef);
        }

        // Atualizar as listas de clientes
        const updatedClients = clients.filter(client => !selectedForDeletion.includes(client.id));
        setClients(updatedClients);
        setFilteredClients(updatedClients);
        setSelectedForDeletion([]);

        alert('Clientes excluídos com sucesso!');
      } catch (error) {
        console.error('Erro ao excluir clientes:', error);
        alert('Erro ao excluir os clientes selecionados.');
      }
    }
  };

  // Função para alternar a exibição de dependentes
  const toggleFamilyExpand = (titularId) => {
    setExpandedFamilies(prev => ({
      ...prev,
      [titularId]: !prev[titularId]
    }));
  };

  // Calcular clientes para a página atual
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentClients = filteredClients.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);

  // Funções de navegação
  const goToPage = (pageNumber) => {
    setCurrentPage(Math.max(1, Math.min(pageNumber, totalPages)));
  };

  // Calcular aniversariantes do mês atual
  const currentMonth = new Date().getMonth() + 1;
  const birthdaysThisMonth = clients.filter(client => {
    if (!client.dataNascimento) return false;

    // Converter string de data para objeto Date se necessário
    const birthDate = typeof client.dataNascimento === 'string'
      ? new Date(client.dataNascimento)
      : client.dataNascimento.seconds
        ? new Date(client.dataNascimento.seconds * 1000)
        : null;

    return birthDate && birthDate.getMonth() + 1 === currentMonth;
  }).length;

  // Calcular clientes recentes (últimos 30 dias)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentClients = clients.filter(client => {
    if (!client.dataCadastro) return false;

    const cadastroDate = typeof client.dataCadastro === 'string'
      ? new Date(client.dataCadastro)
      : client.dataCadastro.seconds
        ? new Date(client.dataCadastro.seconds * 1000)
        : null;

    return cadastroDate && cadastroDate >= thirtyDaysAgo;
  }).length;

  // Função para gerar link do WhatsApp
  const generateWhatsAppLink = (phoneNumber) => {
    // Remove caracteres não numéricos
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    // Adiciona o código do país se não tiver
    const formattedNumber = cleanNumber.startsWith('55') ? cleanNumber : `55${cleanNumber}`;
    return `https://wa.me/${formattedNumber}`;
  };

  return (
    <Layout>
      <div className="min-h-screen p-0 md:p-2 mb-20">
        <div className="w-full max-w-5xl mx-auto rounded-lg">
          <div className="mb-4">
            <h2
              className="text-3xl font-bold mb-8 mt-8"
              style={{ color: "#81059e" }}
            >
              CLIENTES
            </h2>
          </div>

          {/* Dashboard compacto com estatísticas */}
          <div className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              {/* Card - Total de Clientes */}
              <div className="border-2 rounded-lg p-4 border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <FontAwesomeIcon
                    icon={faUsers}
                    className="h-8 w-8 text-[#81059e] bg-purple-300 p-2 rounded-2xl"
                  />
                  <span className="text-lg font-medium text-gray-700 flex-grow ml-3">
                    Total de Clientes
                  </span>
                </div>
                <p className="text-2xl font-semibold text-center mt-2">
                  {clients.length}
                </p>
              </div>

              {/* Card - Aniversariantes do Mês */}
              <div className="border-2 rounded-lg p-4 border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <FontAwesomeIcon
                    icon={faCakeCandles}
                    className="h-8 w-8 text-[#81059e] bg-purple-300 p-2 rounded-2xl"
                  />
                  <span className="text-lg font-medium text-gray-700 flex-grow ml-3">
                    Aniversariantes
                  </span>
                </div>
                <p className="text-2xl font-semibold text-center mt-2">
                  {birthdaysThisMonth}
                </p>
              </div>

              {/* Card - Clientes Recentes */}
              <div className="border-2 rounded-lg p-4 border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <FontAwesomeIcon
                    icon={faIdCard}
                    className="h-8 w-8 text-[#81059e] bg-purple-300 p-2 rounded-2xl"
                  />
                  <span className="text-lg font-medium text-gray-700 flex-grow ml-3">
                    Clientes Recentes
                  </span>
                </div>
                <p className="text-2xl font-semibold text-center mt-2">
                  {recentClients}
                </p>
                <p className="text-sm text-gray-500 text-center mt-1">
                  Últimos 30 dias
                </p>
              </div>

              {/* Card - Compras Pendentes */}
              <div className="border-2 rounded-lg p-4 border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <FontAwesomeIcon
                    icon={faGlasses}
                    className="h-8 w-8 text-[#81059e] bg-purple-300 p-2 rounded-2xl"
                  />
                  <span className="text-lg font-medium text-gray-700 flex-grow ml-3">
                    Armações Vendidas
                  </span>
                </div>
                <p className="text-2xl font-semibold text-center mt-2">
                  0
                </p>
                <p className="text-sm text-gray-500 text-center mt-1">
                  Este mês
                </p>
              </div>
            </div>
          </div>

          {/* Barra de busca e filtros */}
          <div className="flex flex-wrap gap-2 items-center mb-4">
            {/* Barra de busca */}
            <input
              type="text"
              placeholder="Busque por nome, CPF ou telefone"
              className="p-2 h-10 flex-grow min-w-[200px] border-2 border-gray-200 rounded-lg text-black"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            {/* Botões de ação */}
            <div className="flex gap-2">
              {/* Botão Adicionar */}
              <Link href="/register/consumers/add.client">
                <button className="bg-green-400 text-white h-10 w-10 rounded-md flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </Link>

              {/* Botão Excluir */}
              <button
                onClick={handleDeleteSelected}
                className={`${selectedForDeletion.length === 0 ? 'bg-red-400' : 'bg-red-400'} text-white h-10 w-10 rounded-md flex items-center justify-center`}
                disabled={selectedForDeletion.length === 0}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>

          {/* Tabela de clientes */}
          {loading ? (
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#81059e]"></div>
          ) : error ? (
            <p>{error}</p>
          ) : (
            <div className="w-full overflow-x-auto">
              {filteredClients.length === 0 ? (
                <p>Nenhum cliente encontrado.</p>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="min-w-full table-auto select-none">
                      <thead>
                        <tr className="bg-[#81059e] text-white">
                          <th className="px-3 py-2 w-12">
                            <span className="sr-only">Selecionar</span>
                          </th>
                          <th className="px-3 py-2 w-20">Foto</th>
                          <th className="px-3 py-2">Nome</th>
                          <th className="px-3 py-2">CPF</th>
                          <th className="px-3 py-2">Telefones</th>
                          <th className="px-3 py-2">Cidade</th>
                          <th className="px-3 py-2">Bairro</th>
                          <th className="px-3 py-2">Logradouro</th>
                          <th className="px-3 py-2">Número</th>
                          <th className="px-3 py-2">Whatsapp</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentClients.map((client) => {
                          // Verifica se é um titular com dependentes
                          const isTitularWithDependents = !client.dependentesDe && client.temDependentes;
                          const isExpanded = expandedFamilies[client.id];

                          return (
                            <>
                              <tr
                                key={client.id}
                                className={`text-black text-left hover:bg-gray-100 cursor-pointer ${isTitularWithDependents ? 'border-b-0 bg-gray-50' : ''
                                  } h-16`}
                              >
                                <td className="border px-2 py-2 text-center">
                                  <input
                                    type="checkbox"
                                    checked={selectedForDeletion.includes(client.id)}
                                    onChange={(e) => toggleDeletion(e, client.id)}
                                    className="h-4 w-4 cursor-pointer"
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                </td>
                                <td className="border px-3 py-2 text-center" onClick={() => handleModalOpen(client)}>
                                  {clientImages[client.id] ? (
                                    <img
                                      src={clientImages[client.id]}
                                      alt={`Foto de ${client.nome}`}
                                      className="h-12 w-12 rounded-full object-cover inline-block"
                                      onError={(e) => {
                                        console.log("Erro ao carregar imagem:", client.cpf);
                                        e.target.src = "https://via.placeholder.com/48?text=NA";
                                      }}
                                    />
                                  ) : (
                                    <div className="h-12 w-12 rounded-full bg-purple-200 flex items-center justify-center text-purple-800 font-bold inline-block">
                                      {client.nome ? client.nome.charAt(0).toUpperCase() : "?"}
                                    </div>
                                  )}
                                </td>
                                <td
                                  className="border px-3 py-2"
                                  onClick={() => isTitularWithDependents
                                    ? toggleFamilyExpand(client.id)
                                    : handleModalOpen(client)
                                  }
                                >
                                  <div className="flex items-center">
                                    {isTitularWithDependents && (
                                      <button
                                        className="mr-2 text-[#81059e] hover:text-[#690480] focus:outline-none"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          toggleFamilyExpand(client.id);
                                        }}
                                      >
                                        {isExpanded ? (
                                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                          </svg>
                                        ) : (
                                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                          </svg>
                                        )}
                                      </button>
                                    )}
                                    <div className="flex flex-col">
                                      <span className="font-medium">{client.nome || 'N/A'}</span>
                                      {isTitularWithDependents && (
                                        <span className="text-xs text-[#81059e]">
                                          {clientesAgrupados.dependentes[client.id]?.length || 0} dependente(s)
                                        </span>
                                      )}
                                      {client.dependentesDe && (
                                        <span className="text-xs text-gray-500">
                                          Dependente • {client.parentesco || 'Não especificado'}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </td>
                                <td className="border px-3 py-2" onClick={() => handleModalOpen(client)}>
                                  {client.cpf || 'N/A'}
                                </td>
                                <td className="border px-3 py-2" onClick={() => handleModalOpen(client)}>
                                  {client.telefones && client.telefones.length > 0
                                    ? client.telefones.join(", ")
                                    : "N/A"}
                                </td>
                                <td className="border px-3 py-2" onClick={() => handleModalOpen(client)}>
                                  {client.endereco?.cidade || 'N/A'}
                                </td>
                                <td className="border px-3 py-2" onClick={() => handleModalOpen(client)}>
                                  {client.endereco?.bairro || 'N/A'}
                                </td>
                                <td className="border px-3 py-2" onClick={() => handleModalOpen(client)}>
                                  {client.endereco?.logradouro || 'N/A'}
                                </td>
                                <td className="border px-3 py-2" onClick={() => handleModalOpen(client)}>
                                  {client.endereco?.numero || 'N/A'}
                                </td>
                                <td className="border px-3 py-2 text-center">
                                  {client.telefones && client.telefones.length > 0 ? (
                                    <a
                                      href={generateWhatsAppLink(client.telefones[0])}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      className="inline-block p-2 bg-green-500 text-green-600 hover:text-green-100 hover:bg-green-500 rounded-full transition-all"
                                    >
                                      <FontAwesomeIcon icon={faPhone} className="h-5 w-5" />
                                    </a>
                                  ) : (
                                    <span className="inline-block p-2 text-gray-400">
                                      <FontAwesomeIcon icon={faPhone} className="h-5 w-5" />
                                    </span>
                                  )}
                                </td>
                              </tr>

                              {/* Exibir dependentes se expandido */}
                              {isTitularWithDependents && isExpanded &&
                                clientesAgrupados.dependentes[client.id]?.map(dependente => (
                                  <tr
                                    key={dependente.id}
                                    className="text-black text-left hover:bg-gray-100 cursor-pointer bg-purple-50 h-16"
                                  >
                                    <td className="border px-2 py-2 text-center">
                                      <input
                                        type="checkbox"
                                        checked={selectedForDeletion.includes(dependente.id)}
                                        onChange={(e) => toggleDeletion(e, dependente.id)}
                                        className="h-4 w-4 cursor-pointer"
                                        onClick={(e) => e.stopPropagation()}
                                      />
                                    </td>
                                    <td className="border px-3 py-2 text-center" onClick={() => handleModalOpen(dependente)}>
                                      {clientImages[dependente.id] ? (
                                        <img
                                          src={clientImages[dependente.id]}
                                          alt={`Foto de ${dependente.nome}`}
                                          className="h-10 w-10 rounded-full object-cover inline-block"
                                          onError={(e) => {
                                            e.target.src = "https://via.placeholder.com/40?text=NA";
                                          }}
                                        />
                                      ) : (
                                        <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold inline-block">
                                          {dependente.nome ? dependente.nome.charAt(0).toUpperCase() : "?"}
                                        </div>
                                      )}
                                    </td>
                                    <td className="border px-3 py-2 pl-8" onClick={() => handleModalOpen(dependente)}>
                                      <div className="flex items-center">
                                        <span className="text-xs text-purple-600 font-medium mr-2">
                                          ↳ {dependente.parentesco || 'Dependente'}:
                                        </span>
                                        {dependente.nome || 'N/A'}
                                      </div>
                                    </td>
                                    <td className="border px-3 py-2" onClick={() => handleModalOpen(dependente)}>
                                      {dependente.cpf || 'N/A'}
                                    </td>
                                    <td className="border px-3 py-2" onClick={() => handleModalOpen(dependente)}>
                                      {dependente.telefones && dependente.telefones.length > 0
                                        ? dependente.telefones.join(", ")
                                        : "N/A"}
                                    </td>
                                    <td className="border px-3 py-2" onClick={() => handleModalOpen(dependente)}>
                                      {dependente.endereco?.cidade || 'N/A'}
                                    </td>
                                    <td className="border px-3 py-2" onClick={() => handleModalOpen(dependente)}>
                                      {dependente.endereco?.bairro || 'N/A'}
                                    </td>
                                    <td className="border px-3 py-2" onClick={() => handleModalOpen(dependente)}>
                                      {dependente.endereco?.logradouro || 'N/A'}
                                    </td>
                                    <td className="border px-3 py-2" onClick={() => handleModalOpen(dependente)}>
                                      {dependente.endereco?.numero || 'N/A'}
                                    </td>
                                    <td className="border px-3 py-2 text-center">
                                      {dependente.telefones && dependente.telefones.length > 0 ? (
                                        <a
                                          href={generateWhatsAppLink(dependente.telefones[0])}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          onClick={(e) => e.stopPropagation()}
                                          className="inline-block p-2 bg-green-500 text-green-600 hover:text-green-100 hover:bg-green-500 rounded-full transition-all"
                                        >
                                          <FontAwesomeIcon icon={faPhone} className="h-5 w-5" />
                                        </a>
                                      ) : (
                                        <span className="inline-block p-2 text-gray-400">
                                          <FontAwesomeIcon icon={faPhone} className="h-5 w-5" />
                                        </span>
                                      )}
                                    </td>
                                  </tr>
                                ))
                              }
                            </>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Paginação */}
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-gray-700">
                      Mostrando <span className="font-medium">{indexOfFirstItem + 1}</span> a{' '}
                      <span className="font-medium">
                        {Math.min(indexOfLastItem, filteredClients.length)}
                      </span>{' '}
                      de <span className="font-medium">{filteredClients.length}</span> registros
                    </div>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => goToPage(1)}
                        disabled={currentPage === 1}
                        className={`px-3 py-1 rounded ${currentPage === 1
                          ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                          : 'bg-[#81059e] text-white hover:bg-[#690480]'
                          }`}
                      >
                        &laquo;
                      </button>
                      <button
                        onClick={() => goToPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        className={`px-3 py-1 rounded ${currentPage === 1
                          ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                          : 'bg-[#81059e] text-white hover:bg-[#690480]'
                          }`}
                      >
                        &lt;
                      </button>

                      <span className="px-3 py-1 text-gray-700">
                        {currentPage} / {totalPages}
                      </span>

                      <button
                        onClick={() => goToPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className={`px-3 py-1 rounded ${currentPage === totalPages
                          ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                          : 'bg-[#81059e] text-white hover:bg-[#690480]'
                          }`}
                      >
                        &gt;
                      </button>
                      <button
                        onClick={() => goToPage(totalPages)}
                        disabled={currentPage === totalPages}
                        className={`px-3 py-1 rounded ${currentPage === totalPages
                          ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                          : 'bg-[#81059e] text-white hover:bg-[#690480]'
                          }`}
                      >
                        &raquo;
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Replace the old modal with the new component */}
          {showModal && selectedClient && (
            <ClientDetailsModal
              client={selectedClient}
              onClose={() => {
                setShowModal(false);
                setSelectedClient(null);
              }}
            />
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ClientsTable;