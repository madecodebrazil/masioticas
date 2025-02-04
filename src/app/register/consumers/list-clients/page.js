"use client";
import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  getDoc,
  setDoc,
  deleteDoc,
} from "firebase/firestore";
import { firestore, storage } from "../../../../lib/firebaseConfig";
import Layout from "@/components/Layout";
import { jsPDF } from "jspdf";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFilter, faTrash } from "@fortawesome/free-solid-svg-icons";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const ClientsTable = () => {
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Estados para os filtros
  const [nameFilter, setNameFilter] = useState("");
  const [cpfFilter, setCpfFilter] = useState("");
  const [dobFilter, setDobFilter] = useState("");
  const [genderFilter, setGenderFilter] = useState("");
  const [phoneFilter, setPhoneFilter] = useState("");
  const [emailFilter, setEmailFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [stateFilter, setStateFilter] = useState("");

  // Estados para edição
  const [isEditing, setIsEditing] = useState(false);
  const [editedClientData, setEditedClientData] = useState(null);

  // Estados para novas imagens
  const [newPhotoFile, setNewPhotoFile] = useState(null);
  const [newPhotoPreviewUrl, setNewPhotoPreviewUrl] = useState(null);
  const [newRGFile, setNewRGFile] = useState(null);
  const [newRGPreviewUrl, setNewRGPreviewUrl] = useState(null);
  const [newCPFFile, setNewCPFFile] = useState(null);
  const [newCPFPreviewUrl, setNewCPFPreviewUrl] = useState(null);
  const [newAddressFile, setNewAddressFile] = useState(null);
  const [newAddressPreviewUrl, setNewAddressPreviewUrl] = useState(null);

  const handleDeleteClient = async (clientId) => {
    const confirmDelete = window.confirm(
      "Tem certeza de que deseja excluir este cliente? Esta ação não poderá ser desfeita."
    );
    if (!confirmDelete) return;

    try {
      const clientRef = doc(firestore, "consumers", clientId);
      await deleteDoc(clientRef);

      const updatedClients = clients.filter((client) => client.id !== clientId);
      setClients(updatedClients);
      setFilteredClients(updatedClients);

      console.log("Cliente excluído com sucesso!");
    } catch (error) {
      console.error("Erro ao excluir cliente:", error);
    }
  };

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const clientsCollection = collection(firestore, "consumers");
        const snapshot = await getDocs(clientsCollection);
        const clientsList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setClients(clientsList);
        setFilteredClients(clientsList);
      } catch (error) {
        console.error("Erro ao buscar clientes:", error);
      }
    };

    fetchClients();
  }, []);

  // Atualizar lista filtrada sempre que os filtros mudarem
  useEffect(() => {
    const filtered = clients.filter((client) => {
      const matchesPhone =
        phoneFilter === "" ||
        (Array.isArray(client.telefones) &&
          client.telefones.some((tel) =>
            tel.toLowerCase().includes(phoneFilter.toLowerCase())
          ));

      return (
        (nameFilter === "" ||
          client.nome?.toLowerCase().includes(nameFilter.toLowerCase())) &&
        (cpfFilter === "" || client.cpf?.includes(cpfFilter)) &&
        (dobFilter === "" || client.dataNascimento === dobFilter) &&
        (genderFilter === "" || client.genero === genderFilter) &&
        matchesPhone &&
        (emailFilter === "" ||
          client.email?.toLowerCase().includes(emailFilter.toLowerCase())) &&
        (cityFilter === "" ||
          client.cidade?.toLowerCase().includes(cityFilter.toLowerCase())) &&
        (stateFilter === "" ||
          client.estado?.toLowerCase().includes(stateFilter.toLowerCase()))
      );
    });
    setFilteredClients(filtered);
  }, [
    nameFilter,
    cpfFilter,
    dobFilter,
    genderFilter,
    phoneFilter,
    emailFilter,
    cityFilter,
    stateFilter,
    clients,
  ]);

  const handleModalOpen = (client) => {
    setSelectedClient(client);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setSelectedClient(null);
    setIsEditing(false);
    setEditedClientData(null);
    setNewPhotoFile(null);
    setNewPhotoPreviewUrl(null);
    setNewRGFile(null);
    setNewRGPreviewUrl(null);
    setNewCPFFile(null);
    setNewCPFPreviewUrl(null);
    setNewAddressFile(null);
    setNewAddressPreviewUrl(null);
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
    docPDF.text(`Cidade: ${selectedClient.cidade}`, 10, 40);
    docPDF.text(`Bairro: ${selectedClient.bairro}`, 10, 50);
    docPDF.text(`Logradouro: ${selectedClient.logradouro}`, 10, 60);
    docPDF.text(`Número: ${selectedClient.numero}`, 10, 70);

    docPDF.save(`${selectedClient.nome}-dados.pdf`);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleEditClick = () => {
    setEditedClientData(selectedClient);
    setIsEditing(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedClientData({
      ...editedClientData,
      [name]: value,
    });
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewPhotoFile(file);
      setNewPhotoPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleRGChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewRGFile(file);
      setNewRGPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleCPFChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewCPFFile(file);
      setNewCPFPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleAddressChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewAddressFile(file);
      setNewAddressPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSaveChanges = async () => {
    try {
      const clientId = editedClientData.cpf;

      if (!clientId) {
        console.error("Erro: O CPF não pode estar vazio.");
        return;
      }

      // Upload da nova foto do cliente, se houver
      let newImageUrl = editedClientData?.imagem || selectedClient?.imagem;
      if (newPhotoFile) {
        const storageRef = ref(
          storage,
          `client_images/${clientId}/${newPhotoFile.name}`
        );
        await uploadBytes(storageRef, newPhotoFile);
        newImageUrl = await getDownloadURL(storageRef);
      }

      // Upload da nova foto do RG, se houver
      let newRGUrl = editedClientData?.rgImageUrl || selectedClient?.rgImageUrl;
      if (newRGFile) {
        const storageRef = ref(
          storage,
          `client_images/${clientId}/rg/${newRGFile.name}`
        );
        await uploadBytes(storageRef, newRGFile);
        newRGUrl = await getDownloadURL(storageRef);
      }

      // Upload da nova foto do CPF, se houver
      let newCPFUrl =
        editedClientData?.cpfImageUrl || selectedClient?.cpfImageUrl;
      if (newCPFFile) {
        const storageRef = ref(
          storage,
          `client_images/${clientId}/cpf/${newCPFFile.name}`
        );
        await uploadBytes(storageRef, newCPFFile);
        newCPFUrl = await getDownloadURL(storageRef);
      }

      // Upload do novo comprovante de endereço, se houver
      let newAddressUrl =
        editedClientData?.addressImageUrl || selectedClient?.addressImageUrl;
      if (newAddressFile) {
        const storageRef = ref(
          storage,
          `client_images/${clientId}/address/${newAddressFile.name}`
        );
        await uploadBytes(storageRef, newAddressFile);
        newAddressUrl = await getDownloadURL(storageRef);
      }

      // Criação do objeto atualizado
      const updatedClientData = {
        ...editedClientData,
        imagem: newImageUrl,
        rgImageUrl: newRGUrl,
        cpfImageUrl: newCPFUrl,
        addressImageUrl: newAddressUrl,
      };

      // Remover undefined
      const sanitizedData = Object.fromEntries(
        Object.entries(updatedClientData).filter(
          ([_, value]) => value !== undefined
        )
      );

      const clientRef = doc(firestore, "consumers", clientId);
      await setDoc(clientRef, sanitizedData, { merge: true });

      const updatedClients = clients.map((client) =>
        client.cpf === clientId ? { cpf: clientId, ...sanitizedData } : client
      );

      if (!clients.some((client) => client.cpf === clientId)) {
        updatedClients.push({ cpf: clientId, ...sanitizedData });
      }

      setClients(updatedClients);
      setFilteredClients(updatedClients);
      setSelectedClient({ cpf: clientId, ...sanitizedData });

      // Resetar estados
      setIsEditing(false);
      setEditedClientData(null);
      setNewPhotoFile(null);
      setNewPhotoPreviewUrl(null);
      setNewRGFile(null);
      setNewRGPreviewUrl(null);
      setNewCPFFile(null);
      setNewCPFPreviewUrl(null);
      setNewAddressFile(null);
      setNewAddressPreviewUrl(null);

      console.log("Alterações salvas com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar alterações:", error);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedClientData(null);
    setNewPhotoFile(null);
    setNewPhotoPreviewUrl(null);
    setNewRGFile(null);
    setNewRGPreviewUrl(null);
    setNewCPFFile(null);
    setNewCPFPreviewUrl(null);
    setNewAddressFile(null);
    setNewAddressPreviewUrl(null);
  };

  return (
    <Layout>
      <div className="container mx-auto p-4">
        <h1
          className="text-2xl font-bold mb-4 text-center md:text-left"
          style={{ color: "#932A83" }}
        >
          Clientes
        </h1>

        {/* Botão para exibir/esconder filtros */}
        <div className="flex justify-end mb-4">
          <button
            className="text-gray-600 p-2 rounded hover:bg-gray-200 transition"
            onClick={() => setShowFilters(!showFilters)}
          >
            <FontAwesomeIcon icon={faFilter} /> Filtros
          </button>
        </div>

        {/* Campos de Filtro */}
        {showFilters && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <input
              type="text"
              placeholder="Nome"
              value={nameFilter}
              onChange={(e) => setNameFilter(e.target.value)}
              className="border p-2"
            />
            <input
              type="text"
              placeholder="CPF"
              value={cpfFilter}
              onChange={(e) => setCpfFilter(e.target.value)}
              className="border p-2"
            />
            <input
              type="date"
              placeholder="Data de Nascimento"
              value={dobFilter}
              onChange={(e) => setDobFilter(e.target.value)}
              className="border p-2"
            />
            <input
              type="text"
              placeholder="Gênero"
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value)}
              className="border p-2"
            />
            <input
              type="text"
              placeholder="Telefone"
              value={phoneFilter}
              onChange={(e) => setPhoneFilter(e.target.value)}
              className="border p-2"
            />
            <input
              type="text"
              placeholder="Email"
              value={emailFilter}
              onChange={(e) => setEmailFilter(e.target.value)}
              className="border p-2"
            />
            <input
              type="text"
              placeholder="Cidade"
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="border p-2"
            />
            <input
              type="text"
              placeholder="Estado"
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              className="border p-2"
            />
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead>
              <tr>
                <th className="py-2 px-4 border-b" style={{ color: "#932A83" }}>
                  Nome
                </th>
                <th className="py-2 px-4 border-b" style={{ color: "#932A83" }}>
                  CPF
                </th>
                <th className="py-2 px-4 border-b" style={{ color: "#932A83" }}>
                  Telefones
                </th>
                <th className="py-2 px-4 border-b" style={{ color: "#932A83" }}>
                  Cidade
                </th>
                <th className="py-2 px-4 border-b" style={{ color: "#932A83" }}>
                  Bairro
                </th>
                <th className="py-2 px-4 border-b" style={{ color: "#932A83" }}>
                  Logradouro
                </th>
                <th className="py-2 px-4 border-b" style={{ color: "#932A83" }}>
                  Número
                </th>
                <th className="py-2 px-4 border-b" style={{ color: "#932A83" }}>
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map((client) => (
                <tr
                  key={client.id}
                  onClick={() => handleModalOpen(client)}
                  className="cursor-pointer hover:bg-gray-100"
                >
                  <td className="py-2 px-4 border-b text-black">
                    {client.nome}
                  </td>
                  <td className="py-2 px-4 border-b text-black">
                    {client.cpf}
                  </td>
                  <td className="py-2 px-4 border-b text-black">
                    {client.telefones && client.telefones.length > 0
                      ? client.telefones.join(", ")
                      : ""}
                  </td>
                  <td className="py-2 px-4 border-b text-black">
                    {client.cidade}
                  </td>
                  <td className="py-2 px-4 border-b text-black">
                    {client.bairro}
                  </td>
                  <td className="py-2 px-4 border-b text-black">
                    {client.logradouro}
                  </td>
                  <td className="py-2 px-4 border-b text-black">
                    {client.numero}
                  </td>
                  <td className="py-2 px-4 border-b text-black flex justify-center">
                    <button
                      className="text-red-500 hover:text-red-700 transition"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClient(client.id);
                      }}
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {showModal && selectedClient && (
          <div className="fixed inset-0 z-50 flex justify-center items-center overflow-x-hidden overflow-y-auto bg-black bg-opacity-50">
            <div className="mt-24 relative w-full max-w-2xl max-h-full">
              {/* Modal content */}
              <div className="bg-white rounded-lg shadow-lg overflow-y-auto max-h-screen">
                <div className="p-6">
                  {isEditing ? (
                    <div>
                      <h2
                        className="mt-16 text-xl font-bold mb-4 text-center"
                        style={{ color: "#932A83" }}
                      >
                        Editar Cliente
                      </h2>
                      <div className="space-y-4">
                        {/* Nome */}
                        <div>
                          <label className="text-black">
                            <strong>Nome:</strong>
                          </label>
                          <input
                            type="text"
                            name="nome"
                            value={editedClientData.nome || ""}
                            onChange={handleInputChange}
                            className="border p-2 w-full bg-white text-black"
                            style={{ opacity: 1 }}
                          />
                        </div>
                        {/* CPF */}
                        <div>
                          <label className="text-black">
                            <strong>CPF:</strong>
                          </label>
                          <input
                            type="text"
                            name="cpf"
                            value={editedClientData.cpf || ""}
                            onChange={handleInputChange}
                            className="border p-2 w-full bg-white text-black"
                            style={{ opacity: 1 }}
                          />
                        </div>
                        {/* Email */}
                        <div>
                          <label className="text-black">
                            <strong>Email:</strong>
                          </label>
                          <input
                            type="email"
                            name="email"
                            value={editedClientData.email || ""}
                            onChange={handleInputChange}
                            className="border p-2 w-full bg-white text-black"
                            style={{ opacity: 1 }}
                          />
                        </div>
                        {/* Telefone */}
                        <div>
                          <label className="text-black">
                            <strong>Telefone:</strong>
                          </label>
                          <input
                            type="text"
                            name="telefone"
                            value={editedClientData.telefone || ""}
                            onChange={handleInputChange}
                            className="border p-2 w-full bg-white text-black"
                            style={{ opacity: 1 }}
                          />
                        </div>
                        {/* Data de Nascimento */}
                        <div>
                          <label className="text-black">
                            <strong>Data de Nascimento:</strong>
                          </label>
                          <input
                            type="date"
                            name="dataNascimento"
                            value={editedClientData.dataNascimento || ""}
                            onChange={handleInputChange}
                            className="border p-2 w-full bg-white text-black"
                            style={{ opacity: 1 }}
                          />
                        </div>
                        {/* Gênero */}
                        <div>
                          <label className="text-black">
                            <strong>Gênero:</strong>
                          </label>
                          <input
                            type="text"
                            name="genero"
                            value={editedClientData.genero || ""}
                            onChange={handleInputChange}
                            className="border p-2 w-full bg-white text-black"
                            style={{ opacity: 1 }}
                          />
                        </div>
                        {/* Estado Civil */}
                        <div>
                          <label className="text-black">
                            <strong>Estado Civil:</strong>
                          </label>
                          <input
                            type="text"
                            name="estadoCivil"
                            value={editedClientData.estadoCivil || ""}
                            onChange={handleInputChange}
                            className="border p-2 w-full bg-white text-black"
                            style={{ opacity: 1 }}
                          />
                        </div>
                        {/* Escolaridade */}
                        <div>
                          <label className="text-black">
                            <strong>Escolaridade:</strong>
                          </label>
                          <input
                            type="text"
                            name="escolaridade"
                            value={editedClientData.escolaridade || ""}
                            onChange={handleInputChange}
                            className="border p-2 w-full bg-white text-black"
                            style={{ opacity: 1 }}
                          />
                        </div>
                        {/* Endereço */}
                        <div>
                          <label className="text-black">
                            <strong>Cidade:</strong>
                          </label>
                          <input
                            type="text"
                            name="cidade"
                            value={editedClientData.cidade || ""}
                            onChange={handleInputChange}
                            className="border p-2 w-full bg-white text-black"
                            style={{ opacity: 1 }}
                          />
                        </div>
                        <div>
                          <label className="text-black">
                            <strong>Estado:</strong>
                          </label>
                          <input
                            type="text"
                            name="estado"
                            value={editedClientData.estado || ""}
                            onChange={handleInputChange}
                            className="border p-2 w-full bg-white text-black"
                            style={{ opacity: 1 }}
                          />
                        </div>
                        <div>
                          <label className="text-black">
                            <strong>Bairro:</strong>
                          </label>
                          <input
                            type="text"
                            name="bairro"
                            value={editedClientData.bairro || ""}
                            onChange={handleInputChange}
                            className="border p-2 w-full bg-white text-black"
                            style={{ opacity: 1 }}
                          />
                        </div>
                        <div>
                          <label className="text-black">
                            <strong>Logradouro:</strong>
                          </label>
                          <input
                            type="text"
                            name="logradouro"
                            value={editedClientData.logradouro || ""}
                            onChange={handleInputChange}
                            className="border p-2 w-full bg-white text-black"
                            style={{ opacity: 1 }}
                          />
                        </div>
                        <div>
                          <label className="text-black">
                            <strong>Número:</strong>
                          </label>
                          <input
                            type="text"
                            name="numero"
                            value={editedClientData.numero || ""}
                            onChange={handleInputChange}
                            className="border p-2 w-full bg-white text-black"
                            style={{ opacity: 1 }}
                          />
                        </div>
                        <div>
                          <label className="text-black">
                            <strong>Complemento:</strong>
                          </label>
                          <input
                            type="text"
                            name="complemento"
                            value={editedClientData.complemento || ""}
                            onChange={handleInputChange}
                            className="border p-2 w-full bg-white text-black"
                            style={{ opacity: 1 }}
                          />
                        </div>
                        <div>
                          <label className="text-black">
                            <strong>CEP:</strong>
                          </label>
                          <input
                            type="text"
                            name="cep"
                            value={editedClientData.cep || ""}
                            onChange={handleInputChange}
                            className="border p-2 w-full bg-white text-black"
                            style={{ opacity: 1 }}
                          />
                        </div>
                        {/* Foto do Cliente */}
                        <div>
                          <label className="text-black">
                            <strong>Foto:</strong>
                          </label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoChange}
                            className="border p-2 w-full bg-white text-black"
                            style={{ opacity: 1 }}
                          />
                          <div className="flex mt-2">
                            {newPhotoPreviewUrl ? (
                              <img
                                src={newPhotoPreviewUrl}
                                alt="Nova foto"
                                className="w-32 h-32 object-cover"
                              />
                            ) : (
                              editedClientData.imagem && (
                                <img
                                  src={editedClientData.imagem}
                                  alt="Foto atual"
                                  className="w-32 h-32 object-cover"
                                />
                              )
                            )}
                          </div>
                        </div>

                        {/* Foto do RG */}
                        <div>
                          <label className="text-black">
                            <strong>Foto do RG:</strong>
                          </label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleRGChange}
                            className="border p-2 w-full bg-white text-black"
                            style={{ opacity: 1 }}
                          />
                          <div className="flex mt-2">
                            {newRGPreviewUrl ? (
                              <img
                                src={newRGPreviewUrl}
                                alt="Nova foto do RG"
                                className="w-32 h-32 object-cover"
                              />
                            ) : (
                              editedClientData.rgImageUrl && (
                                <img
                                  src={editedClientData.rgImageUrl}
                                  alt="Foto atual do RG"
                                  className="w-32 h-32 object-cover"
                                />
                              )
                            )}
                          </div>
                        </div>

                        {/* Foto do CPF */}
                        <div>
                          <label className="text-black">
                            <strong>Foto do CPF:</strong>
                          </label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleCPFChange}
                            className="border p-2 w-full bg-white text-black"
                            style={{ opacity: 1 }}
                          />
                          <div className="flex mt-2">
                            {newCPFPreviewUrl ? (
                              <img
                                src={newCPFPreviewUrl}
                                alt="Nova foto do CPF"
                                className="w-32 h-32 object-cover"
                              />
                            ) : (
                              editedClientData.cpfImageUrl && (
                                <img
                                  src={editedClientData.cpfImageUrl}
                                  alt="Foto atual do CPF"
                                  className="w-32 h-32 object-cover"
                                />
                              )
                            )}
                          </div>
                        </div>

                        {/* Comprovante de Endereço */}
                        <div>
                          <label className="text-black">
                            <strong>Comprovante de Endereço:</strong>
                          </label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleAddressChange}
                            className="border p-2 w-full bg-white text-black"
                            style={{ opacity: 1 }}
                          />
                          <div className="flex mt-2">
                            {newAddressPreviewUrl ? (
                              <img
                                src={newAddressPreviewUrl}
                                alt="Novo comprovante de endereço"
                                className="w-32 h-32 object-cover"
                              />
                            ) : (
                              editedClientData.addressImageUrl && (
                                <img
                                  src={editedClientData.addressImageUrl}
                                  alt="Comprovante de endereço atual"
                                  className="w-32 h-32 object-cover"
                                />
                              )
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2 justify-center">
                        <button
                          className="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 transition"
                          onClick={handleSaveChanges}
                        >
                          Salvar
                        </button>
                        <button
                          className="bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600 transition"
                          onClick={handleCancelEdit}
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <h2
                        className="text-xl font-bold mb-4 text-center"
                        style={{ color: "#932A83" }}
                      >
                        Dados do Cliente
                      </h2>

                      <div className="space-y-2">
                        <p className="text-black">
                          <strong>ID:</strong> {selectedClient.id}
                        </p>
                        <p className="text-black">
                          <strong>Nome:</strong> {selectedClient.nome}
                        </p>
                        <p className="text-black">
                          <strong>CPF:</strong> {selectedClient.cpf}
                        </p>
                        <p className="text-black">
                          <strong>Email:</strong> {selectedClient.email}
                        </p>
                        <p className="text-black">
                          <strong>Telefones:</strong>{" "}
                          {selectedClient.telefones && selectedClient.telefones.length > 0
                            ? selectedClient.telefones.join(", ")
                            : "Não informado"}
                        </p>
                        <p className="text-black">
                          <strong>Data de Nascimento:</strong>{" "}
                          {selectedClient.dataNascimento}
                        </p>
                        <p className="text-black">
                          <strong>Gênero:</strong> {selectedClient.genero}
                        </p>
                        <p className="text-black">
                          <strong>Estado Civil:</strong>{" "}
                          {selectedClient.estadoCivil}
                        </p>
                        <p className="text-black">
                          <strong>Escolaridade:</strong>{" "}
                          {selectedClient.escolaridade}
                        </p>
                        <p className="text-black">
                          <strong>Cidade:</strong> {selectedClient.cidade}
                        </p>
                        <p className="text-black">
                          <strong>Estado:</strong> {selectedClient.estado}
                        </p>
                        <p className="text-black">
                          <strong>Bairro:</strong> {selectedClient.bairro}
                        </p>
                        <p className="text-black">
                          <strong>Logradouro:</strong>{" "}
                          {selectedClient.logradouro}
                        </p>
                        <p className="text-black">
                          <strong>Número:</strong> {selectedClient.numero}
                        </p>
                        <p className="text-black">
                          <strong>Complemento:</strong>{" "}
                          {selectedClient.complemento}
                        </p>
                        <p className="text-black">
                          <strong>CEP:</strong> {selectedClient.cep}
                        </p>
                      </div>

                      <div className="mt-4 flex flex-col space-y-2">
                        {selectedClient.imagem && (
                          <button
                            className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition"
                            onClick={() =>
                              window.open(selectedClient.imagem, "_blank")
                            }
                          >
                            Ver Imagem do Cliente
                          </button>
                        )}
                        {selectedClient.rgImageUrl && (
                          <button
                            className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition"
                            onClick={() =>
                              window.open(selectedClient.rgImageUrl, "_blank")
                            }
                          >
                            Ver Foto do RG
                          </button>
                        )}
                        {selectedClient.cpfImageUrl && (
                          <button
                            className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition"
                            onClick={() =>
                              window.open(selectedClient.cpfImageUrl, "_blank")
                            }
                          >
                            Ver Foto do CPF
                          </button>
                        )}
                        {selectedClient.addressImageUrl && (
                          <button
                            className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition"
                            onClick={() =>
                              window.open(
                                selectedClient.addressImageUrl,
                                "_blank"
                              )
                            }
                          >
                            Ver Comprovante de Endereço
                          </button>
                        )}
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2 justify-center">
                        <button
                          className="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 transition"
                          onClick={handlePrint}
                        >
                          Imprimir
                        </button>
                        <button
                          className="bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 transition"
                          onClick={handleDownloadPDF}
                        >
                          Baixar PDF
                        </button>
                        <button
                          className="bg-yellow-500 text-white py-2 px-4 rounded hover:bg-yellow-600 transition"
                          onClick={handleEditClick}
                        >
                          Editar
                        </button>
                        <button
                          className="bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600 transition"
                          onClick={handleModalClose}
                        >
                          Fechar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ClientsTable;
