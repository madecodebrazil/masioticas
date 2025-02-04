"use client";

import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { collection, getDocs } from 'firebase/firestore';
import { firestore } from '../../../lib/firebaseConfig';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import Link from 'next/link';

export default function ContasPagar() {
  const [contas, setContas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedLoja, setSelectedLoja] = useState([]);
  const [credores, setCredores] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCredor, setSelectedCredor] = useState({ nome: '', cpf: '' });
  const [formData, setFormData] = useState({
    documento: '',
    observacoes: '',
    conta: '',
    dataEntrada: null,
    horaEntrada: '',
    valor: '',
    dataVencimento: null,
    horaVencimento: ''
  });

  const fetchContas = async () => {
    try {
      setIsLoading(true);
      const contasSnapshot = await getDocs(collection(firestore, 'tipo_contas_pagar'));
      const fetchedContas = contasSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setContas(fetchedContas);
      setIsLoading(false);
    } catch (err) {
      console.error('Erro ao carregar as contas:', err);
      setError('Erro ao carregar os dados das contas.');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchContas();

    // Pega dados da URL para preencher o formulário
    const params = new URLSearchParams(window.location.search);
    const contaData = params.get('contaData');

    if (contaData) {
      const parsedData = JSON.parse(decodeURIComponent(contaData));
      setFormData({
        documento: parsedData.documento,
        observacoes: parsedData.observacoes,
        conta: parsedData.conta,
        dataEntrada: new Date(parsedData.dataEntrada),
        horaEntrada: parsedData.horaEntrada,
        valor: parsedData.valor,
        dataVencimento: new Date(parsedData.dataVencimento),
        horaVencimento: parsedData.horaVencimento,
      });
      setSelectedCredor({ nome: parsedData.credor, cpf: parsedData.cpf }); // Preenche o nome e CPF do credor
      setSelectedLoja(parsedData.lojas || []); // Preenche as lojas se necessário
    }
  }, []);

  const handleSearchChange = async (event) => {
    const searchTerm = event.target.value;
    setSearchTerm(searchTerm);

    if (searchTerm.length < 3) {
      setCredores([]);
      return;
    }

    try {
      const querySnapshot = await getDocs(collection(firestore, "consumers"));
      const filteredCredores = querySnapshot.docs.filter((doc) => {
        const data = doc.data();
        const searchLower = searchTerm.toLowerCase();

        return (
          data.nome?.toLowerCase().includes(searchLower) ||
          doc.id?.toLowerCase().includes(searchLower)
        );
      });

      setCredores(filteredCredores.map((doc) => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error("Erro ao buscar consumidores: ", error);
    }
  };

  const handleCredorSelect = (credor) => {
    setSelectedCredor({ nome: credor.nome, cpf: credor.id });
    setSearchTerm(credor.nome);
    setCredores([]);
  };

  const handleLojaChange = (event) => {
    const { value, checked } = event.target;
    if (checked) {
      setSelectedLoja([...selectedLoja, value]);
    } else {
      setSelectedLoja(selectedLoja.filter((loja) => loja !== value));
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const validateForm = () => {
    const { documento, conta, dataEntrada, horaEntrada, valor, dataVencimento, horaVencimento } = formData;

    if (!selectedCredor.nome || !selectedCredor.cpf) {
      alert("Por favor, selecione um credor.");
      return false;
    }

    if (conta === "") {
      alert("Por favor, selecione uma conta.");
      return false;
    }

    if (
      !documento ||
      !dataEntrada ||
      !horaEntrada ||
      !valor ||
      !dataVencimento ||
      !horaVencimento
    ) {
      alert("Todos os campos devem ser preenchidos.");
      return false;
    }

    if (selectedLoja.length === 0) {
      alert("Selecione ao menos uma loja.");
      return false;
    }

    return true;
  };

  const handleClear = () => {
    setFormData({
      documento: '',
      observacoes: '',
      conta: '',
      dataEntrada: null,
      horaEntrada: '',
      valor: '',
      dataVencimento: null,
      horaVencimento: ''
    });
    setSelectedCredor({ nome: '', cpf: '' });
    setSelectedLoja([]);
    setSearchTerm('');
    setCredores([]);
  };

  const prepareDataForConfirmation = () => {
    const contaData = {
      credor: selectedCredor.nome,
      cpf: selectedCredor.cpf,
      documento: formData.documento,
      observacoes: formData.observacoes,
      conta: formData.conta,
      dataEntrada: `${formData.dataEntrada.toISOString().split('T')[0]} ${formData.horaEntrada}`,
      valor: formData.valor,
      dataVencimento: `${formData.dataVencimento.toISOString().split('T')[0]} ${formData.horaVencimento}`,
      lojas: selectedLoja // Adiciona as lojas selecionadas
    };

    return encodeURIComponent(JSON.stringify(contaData)); // Codifica os dados para a URL
  };

  return (
    <Layout>
      <div className="flex h-full p-8 justify-center items-center flex-col">
        <div className="flex-1 w-full max-w-4xl">
          {/* Header with settings button */}
          <header className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-[#932A83]">CONTAS A PAGAR</h2>
            <div className="flex items-center space-x-4">
              <Link href="/finance/add-pay/pay-ab">
                <button className="bg-transparent text-[#932A83] py-2 px-4 rounded-md flex items-center">
                  <img src="/images/settings.png" alt="Configurações" className="h-6 w-6" />
                </button>
              </Link>
            </div>
          </header>

          {/* Action buttons */}
          <div className="flex justify-center space-x-4 mt-4">
            <Link href="/finance/add-pay/list-bills">
              <button className="bg-[#932A83] text-white py-2 px-4 rounded-md">
                Registro de Contas
              </button>
            </Link>
            <button
              onClick={handleClear}
              className="bg-gray-300 text-black py-2 px-4 rounded-md"
            >
              Limpar
            </button>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (validateForm()) {
                const contaData = prepareDataForConfirmation();
                const confirmationUrl = `/finance/add-pay/confirm?contaData=${contaData}`;
                window.location.href = confirmationUrl; // Navega para a página de confirmação
              }
            }}
            className="bg-white p-6 rounded-lg shadow-md space-y-4 mt-6"
          >
            {/* Credor Search */}
            <div>
              <label className="block text-[#932A83]">Nome do Credor, CPF ou CNPJ</label>
              <input
                type="text"
                name="searchTerm"
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full mt-1 p-2 border border-gray-300 rounded-md text-black"
                placeholder="Digite o nome, CPF ou CNPJ"
              />
              {credores.length > 0 && (
                <ul className="bg-white border border-gray-300 rounded mt-2 max-h-40 overflow-y-auto">
                  {credores.map((credor) => (
                    <li
                      key={credor.id}
                      className="p-2 hover:bg-gray-200 cursor-pointer text-black"
                      onClick={() => handleCredorSelect(credor)}
                    >
                      {credor.nome} ({credor.id})
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Selected Credor Details */}
            {selectedCredor.nome && (
              <div className="text-black bg-gray-100 p-4 rounded-md mt-4">
                <p><strong>Nome do Credor:</strong> {selectedCredor.nome}</p>
                <p><strong>CPF/CNPJ:</strong> {selectedCredor.cpf}</p>
              </div>
            )}

            {/* Form Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[#932A83]">Código do Documento</label>
                <input
                  type="text"
                  name="documento"
                  value={formData.documento}
                  onChange={handleFormChange}
                  className="w-full mt-1 p-2 border border-gray-300 rounded-md text-black"
                />
              </div>

              <div>
                <label className="block text-[#932A83]">Loja</label>
                <div className="flex flex-wrap mt-1">
                  <label className="inline-flex items-center mr-4">
                    <input
                      type="checkbox"
                      value="Loja 1"
                      checked={selectedLoja.includes("Loja 1")}
                      onChange={handleLojaChange}
                      className="form-checkbox text-[#932A83]"
                    />
                    <span className="ml-2 text-black">Loja 1</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      value="Loja 2"
                      checked={selectedLoja.includes("Loja 2")}
                      onChange={handleLojaChange}
                      className="form-checkbox text-[#932A83]"
                    />
                    <span className="ml-2 text-black">Loja 2</span>
                  </label>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[#932A83]">Observações</label>
              <input
                type="text"
                name="observacoes"
                value={formData.observacoes}
                onChange={handleFormChange}
                className="w-full mt-1 p-2 border border-gray-300 rounded-md text-black"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[#932A83]">Conta</label>
                <select
                  name="conta"
                  value={formData.conta}
                  onChange={handleFormChange}
                  className="w-full mt-1 p-2 border border-gray-300 rounded-md text-black"
                  disabled={isLoading}
                >
                  <option value="">- Selecionar -</option>
                  {isLoading ? (
                    <option>Carregando...</option>
                  ) : error ? (
                    <option>{error}</option>
                  ) : (
                    contas.map((conta) => (
                      <option key={conta.id} value={conta.name}>
                        {conta.name}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block text-[#932A83]">Caixa</label>
                <div className="w-full mt-1 p-2 border border-gray-300 rounded-md bg-gray-100 text-black">
                  {selectedLoja.join(', ') || 'Nenhuma loja selecionada'}
                </div>
              </div>
            </div>

            {/* Remaining Form Fields */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-[#932A83]">Data da Entrada</label>
                <DatePicker
                  selected={formData.dataEntrada}
                  onChange={(date) => setFormData({ ...formData, dataEntrada: date })}
                  dateFormat="dd/MM/yyyy"
                  className="w-full mt-1 p-2 border border-gray-300 rounded-md text-black"
                  placeholderText="Selecione a data de entrada"
                />
              </div>
              <div>
                <label className="block text-[#932A83]">Hora</label>
                <input
                  type="time"
                  name="horaEntrada"
                  value={formData.horaEntrada}
                  onChange={handleFormChange}
                  className="w-full mt-1 p-2 border border-gray-300 rounded-md text-black"
                />
              </div>
              <div>
                <label className="block text-[#932A83]">Valor</label>
                <input
                  type="text"
                  name="valor"
                  value={formData.valor}
                  onChange={handleFormChange}
                  className="w-full mt-1 p-2 border border-gray-300 rounded-md text-black"
                  placeholder="R$"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-[#932A83]">Data de Vencimento</label>
                <DatePicker
                  selected={formData.dataVencimento}
                  onChange={(date) => setFormData({ ...formData, dataVencimento: date })}
                  dateFormat="dd/MM/yyyy"
                  className="w-full mt-1 p-2 border border-gray-300 rounded-md text-black"
                  placeholderText="Selecione a data de vencimento"
                />
              </div>
              <div>
                <label className="block text-[#932A83]">Hora</label>
                <input
                  type="time"
                  name="horaVencimento"
                  value={formData.horaVencimento}
                  onChange={handleFormChange}
                  className="w-full mt-1 p-2 border border-gray-300 rounded-md text-black"
                />
              </div>
            </div>

            <button type="submit" className="mt-4 w-full bg-[#932A83] text-white py-2 rounded-md">
              REGISTRAR
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
}
