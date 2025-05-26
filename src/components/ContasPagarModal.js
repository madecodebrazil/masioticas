"use client";

import { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { firestore } from '@/lib/firebaseConfig';

const ContasPagarModal = ({ isOpen, onClose }) => {
  const [contas, setContas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedLoja, setSelectedLoja] = useState([]);
  const [credores, setCredores] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCredor, setSelectedCredor] = useState({ nome: '', cpf: '' });
  const [valorFinal, setValorFinal] = useState("");
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
    if (isOpen) {
      fetchContas();
    }
  }, [isOpen]);

  if (!isOpen) return null;

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
    if (!selectedCredor.nome || !selectedCredor.cpf) {
      alert("Por favor, selecione um credor.");
      return false;
    }
    if (!formData.conta || !formData.documento || !formData.dataEntrada ||
      !formData.horaEntrada || !formData.valor || !formData.dataVencimento ||
      !formData.horaVencimento) {
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      const contaData = {
        credor: selectedCredor.nome,
        cpf: selectedCredor.cpf,
        documento: formData.documento,
        observacoes: formData.observacoes,
        conta: formData.conta,
        dataEntrada: `${formData.dataEntrada.toISOString().split('T')[0]} ${formData.horaEntrada}`,
        valor: formData.valor,
        dataVencimento: `${formData.dataVencimento.toISOString().split('T')[0]} ${formData.horaVencimento}`,
        lojas: selectedLoja
      };
      try {
        const contasRef = collection(firestore, 'contas_pagar');
        await addDoc(contasRef, {
          ...contaData,
          createdAt: serverTimestamp(),
          status: 'pendente'
        });
        alert('Conta registrada com sucesso!');
        handleClear();
        onClose();
      } catch (error) {
        console.error('Erro ao registrar conta:', error);
        alert('Erro ao registrar conta. Por favor, tente novamente.');
      }
      console.log('Form submitted:', contaData);
      onClose();
    }
  };

  const formatarMoeda = (valor) => {
    const numero = valor.replace(/\D/g, '');
    const numeroFormatado = (Number(numero) / 100).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
    return numeroFormatado;
  };

  // Handler para o campo de valor
  const handleValorChange = (e) => {
    const valor = e.target.value.replace(/\D/g, '');
    if (valor === '') {
      setValorFinal('');
      return;
    }
    setValorFinal(formatarMoeda(valor));
  };

  return (

    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto custom-scroll">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div className='flex justify-center items-center w-full'>
              <h2 className="text-3xl font-semibold text-[#81059e] text-center w-full">CONTAS A PAGAR</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 p-0 md:p-4">
            <div>
              <label className="text-[#81059e] font-medium mb-2 block">Nome do Credor, CPF ou CNPJ</label>
              <input
                type="text"
                value={searchTerm}
                onChange={handleSearchChange}
                className="border-2 border-[#81059e] p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-[#81059e] text-black"
                placeholder="Digite o nome, CPF ou CNPJ"
              />

              {credores.length > 0 && (
                <ul className="bg-white border border-gray-300 rounded mt-2 max-h-40 overflow-y-auto text-black">
                  {credores.map((credor) => (
                    <li
                      key={credor.id}
                      className="p-2 hover:bg-gray-200 cursor-pointer"
                      onClick={() => handleCredorSelect(credor)}
                    >
                      {credor.nome} ({credor.id})
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {selectedCredor.nome && (
              <div className="bg-gray-100 p-4 rounded-md">
                <p><strong>Nome do Credor:</strong> {selectedCredor.nome}</p>
                <p><strong>CPF/CNPJ:</strong> {selectedCredor.cpf}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[#81059e] font-medium mb-2 block">Código do Documento</label>
                <input
                  type="text"
                  name="documento"
                  value={formData.documento}
                  onChange={handleFormChange}
                  className="border-2 border-[#81059e] p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-[#81059e] text-black"
                />
              </div>

              <div>
                <label className="text-[#81059e] font-medium mb-2 block">Loja</label>
                <div className="flex flex-wrap mt-1">
                  <label className="inline-flex items-center mr-4">
                    <input
                      type="checkbox"
                      value="Loja 1"
                      checked={selectedLoja.includes("Loja 1")}
                      onChange={handleLojaChange}
                      className="w-4 h-4 text-[#81059e]"
                    />
                    <span className="ml-2 text-black">Loja 1</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      value="Loja 2"
                      checked={selectedLoja.includes("Loja 2")}
                      onChange={handleLojaChange}
                      className="w-4 h-4 text-[#81059e]"
                    />
                    <span className="ml-2 text-black">Loja 2</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[#81059e] font-medium mb-2 block">Conta</label>
                <select
                  name="conta"
                  value={formData.conta}
                  onChange={handleFormChange}
                  className="border-2 border-[#81059e] p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-[#81059e] text-black"
                  disabled={isLoading}
                >
                  <option value="">- Selecionar -</option>
                  {isLoading ? (
                    <option> <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#81059e]"></div></option>
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
                <label className="text-[#81059e] font-medium mb-2 block">Caixa</label>
                <div className="border-2 border-[#81059e] p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-[#81059e] text-black">
                  {selectedLoja.join(', ') || 'Nenhuma loja selecionada'}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-[#81059e]">Data da Entrada</label>
                <DatePicker
                  selected={formData.dataEntrada}
                  onChange={(date) => setFormData({ ...formData, dataEntrada: date })}
                  dateFormat="dd/MM/yyyy"
                  className="border-2 border-[#81059e] p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-[#81059e] text-black"
                  placeholderText="Selecione a data de entrada"
                />
              </div>
              <div>
                <label className="block text-[#81059e]">Hora</label>
                <input
                  type="time"
                  name="horaEntrada"
                  value={formData.horaEntrada}
                  onChange={handleFormChange}
                  className="border-2 border-[#81059e] p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-[#81059e] text-black"
                />
              </div>
              <div>
                <label className="text-[#81059e] font-medium block">Valor</label>
                <input
                  type="text"
                  value={valorFinal}
                  onChange={handleValorChange}
                  placeholder="R$ 0,00"
                  className="border-2 border-[#81059e] p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-[#81059e] text-black font-medium text-right pr-4"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-[#81059e]">Data de Vencimento</label>
                <DatePicker
                  selected={formData.dataVencimento}
                  onChange={(date) => setFormData({ ...formData, dataVencimento: date })}
                  dateFormat="dd/MM/yyyy"
                  className="border-2 border-[#81059e] p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-[#81059e] text-black"
                  placeholderText="Selecione a data de vencimento"
                />
              </div>
              <div>
                <label className="block text-[#81059e]">Hora</label>
                <input
                  type="time"
                  name="horaVencimento"
                  value={formData.horaVencimento}
                  onChange={handleFormChange}
                  className="border-2 border-[#81059e] p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-[#81059e] text-black"
                />
              </div>
            </div>

            <div className="w-full">
              <label className="text-[#81059e] font-medium mb-2 block">Observações</label>
              <textarea
                name="observacoes"
                value={formData.observacoes}
                onChange={handleFormChange}
                className="border-2 border-[#81059e] p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-[#81059e] text-black min-h-[100px] resize-y"
              />
            </div>

            <div className="flex justify-end space-x-4 mt-6">
              <button
                type="button"
                onClick={handleClear}
                className="bg-gray-300 text-black py-2 px-4 rounded-md"
              >
                Limpar
              </button>
              <button
                type="submit"
                className="bg-[#81059e] text-white py-2 px-4 rounded-md"
              >
                REGISTRAR
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ContasPagarModal;