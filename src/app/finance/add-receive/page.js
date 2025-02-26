"use client";
import { useState, useEffect } from "react";
import { firestore } from "../../../lib/firebaseConfig";
import { collection, getDocs, addDoc, getDoc, Timestamp, doc, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import DatePicker from "react-datepicker";
import InputMask from "react-input-mask";
import "react-datepicker/dist/react-datepicker.css";
import Layout from "../../../components/Layout";
import ConfirmationModal from '../../../components/ConfirmationModal.js';
import Link from 'next/link';

export default function AddAccountPage() {
  const { userPermissions, userData } = useAuth();
  const [selectedLoja, setSelectedLoja] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    cliente: "",
    cpf: "",
    observacoes: "",
    numeroDocumento: "",
    parcela: "",
    tipoCobranca: "",
    origem: "",
    valor: "",
    taxaJuros: "",
    dataCobranca: "",
    localCobranca: "",
    contaLancamentoCaixa: "",
    dispensarJuros: false
  });
  
  const [consumers, setConsumers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [numeroParcelas, setNumeroParcelas] = useState("1");
  const [taxaJuros, setTaxaJuros] = useState("0,00");
  
  const router = useRouter();

  // Definir loja inicial baseado nas permissões
  useEffect(() => {
    if (userPermissions) {
      // Se não for admin, usa a primeira loja que tem acesso
      if (!userPermissions.isAdmin && userPermissions.lojas.length > 0) {
        setSelectedLoja(userPermissions.lojas[0]);
      }
      // Se for admin, usa a primeira loja da lista
      else if (userPermissions.isAdmin && userPermissions.lojas.length > 0) {
        setSelectedLoja(userPermissions.lojas[0]);
      }
    }
  }, [userPermissions]);

  // Função para buscar clientes/devedores
  const fetchConsumers = async () => {
    if (searchTerm.trim() === "" || !selectedLoja) {
      setConsumers([]);
      return;
    }

    try {
      // Busca clientes da loja selecionada
      const querySnapshot = await getDocs(collection(firestore, `lojas/${selectedLoja}/clientes`));
      
      const consumersData = querySnapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .filter(client => 
          client.nome?.toLowerCase().includes(searchTerm.toLowerCase()) || 
          client.cpf?.includes(searchTerm)
        );

      setConsumers(consumersData);
    } catch (error) {
      console.error("Erro ao buscar clientes:", error);
      alert("Erro ao buscar clientes. Por favor, tente novamente.");
    }
  };

  useEffect(() => {
    fetchConsumers();
  }, [searchTerm, selectedLoja]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const handleValorChange = (e) => {
    const valor = e.target.value.replace(/\D/g, '');
    if (valor === '') {
      setFormData(prev => ({ ...prev, valor: '' }));
      return;
    }
    
    setFormData(prev => ({ 
      ...prev, 
      valor: (Number(valor) / 100).toLocaleString('pt-BR', { 
        style: 'currency', 
        currency: 'BRL' 
      })
    }));
  };

  const handleClienteSelect = (cliente) => {
    setFormData(prev => ({ 
      ...prev, 
      cliente: cliente.nome, 
      cpf: cliente.cpf 
    }));
    setSearchTerm(cliente.nome);
    setConsumers([]);
  };

  const handleClear = () => {
    setFormData({
      cliente: "",
      cpf: "",
      observacoes: "",
      numeroDocumento: "",
      parcela: "",
      tipoCobranca: "",
      origem: "",
      valor: "",
      taxaJuros: "",
      dataCobranca: "",
      localCobranca: "",
      contaLancamentoCaixa: "",
      dispensarJuros: false
    });
    setSearchTerm("");
    setConsumers([]);
    setNumeroParcelas("1");
    setTaxaJuros("0,00");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!selectedLoja) {
      alert("Selecione uma loja primeiro!");
      return;
    }
    
    setIsModalOpen(true);
  };

  const handleConfirm = async () => {
    if (!selectedLoja) {
      alert("Selecione uma loja primeiro!");
      return;
    }

    try {
      // Converter valor de string formatada para number 
      const valorNumerico = parseFloat(
        formData.valor
          .replace(/[^\d,]/g, '') // Remove tudo exceto dígitos e vírgula 
          .replace(',', '.') // Substitui vírgula por ponto 
      );

      // Converter taxa de juros para número 
      const taxaJurosNumerica = formData.taxaJuros ? parseFloat(formData.taxaJuros) : 0;

      // Preparar os dados para salvar 
      const recebimentoData = {
        cliente: formData.cliente,
        cpf: formData.cpf,
        numeroDocumento: formData.numeroDocumento || '',
        parcela: formData.parcela || '',
        tipoCobranca: formData.tipoCobranca || '',
        origem: formData.origem || '',
        valor: valorNumerico,
        taxaJuros: taxaJurosNumerica,
        dataRegistro: Timestamp.now(),
        dataCobranca: formData.dataCobranca
          ? Timestamp.fromDate(formData.dataCobranca)
          : null,
        localCobranca: formData.localCobranca || '',
        contaLancamentoCaixa: formData.contaLancamentoCaixa || '',
        dispensarJuros: formData.dispensarJuros || false,
        observacoes: formData.observacoes || '',
        status: 'pendente',
        registradoPor: userData?.nome || 'Sistema',
        loja: selectedLoja,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        dataRecebimento: null
      };

      // Primeiro, garantimos que o documento contas_receber existe
      const contasReceberDocRef = doc(firestore, `lojas/${selectedLoja}/financeiro`, 'contas_receber');

      // Verificar se o documento existe, se não, criá-lo
      const docSnap = await getDoc(contasReceberDocRef);
      if (!docSnap.exists()) {
        await setDoc(contasReceberDocRef, {
          descricao: "Contas a receber",
          createdAt: Timestamp.now()
        });
      }

      // Agora criamos a conta na subcoleção "items" do documento contas_receber
      const itemsCollectionRef = collection(contasReceberDocRef, 'items');
      await addDoc(itemsCollectionRef, recebimentoData);

      alert("Conta a receber registrada com sucesso!");
      handleClear();
      setIsModalOpen(false);
    } catch (error) {
      console.error("Erro ao registrar conta a receber:", error);
      alert("Erro ao registrar a conta. Tente novamente.");
    }
  };

  return (
    <Layout>
      <div className="min-h-screen p-2">
        <div className="w-full max-w-5xl mx-auto rounded-lg">
          <h2 className="text-3xl font-bold text-[#81059e] mb-8">ADICIONAR CONTAS A RECEBER</h2>
          
          {/* Seletor de Loja para Admins */}
          {userPermissions?.isAdmin && (
            <div className="mb-6">
              <label className="text-[#81059e] font-medium">Selecionar Loja</label>
              <select
                value={selectedLoja || ''}
                onChange={(e) => setSelectedLoja(e.target.value)}
                className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black ml-2"
              >
                <option value="">Selecione uma loja</option>
                {userPermissions.lojas.map((loja) => (
                  <option key={loja} value={loja}>
                    {loja === 'loja1' ? 'Loja 1' : 'Loja 2'}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="space-x-2">
            <Link href="/finance/add-receive/list-receives">
              <button className="bg-[#81059e] p-3 rounded-sm text-white">
                RECEBIMENTOS PENDENTES
              </button>
            </Link>
            <button
              onClick={handleClear}
              className="text-[#81059e] px-4 py-2 border-2 border-[#81059e] font-bold text-base rounded-sm"
            >
              Limpar
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="max-w-7xl mx-auto bg-white mt-8 mb-20">
            <div className="flex flex-col space-y-6">
              {/* Primeira seção - Informações do Cliente/Devedor */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-[#81059e] font-medium mb-2 block">Nome do Cliente</label>
                  <div className="relative">
                    <input
                      type="text"
                      name="cliente"
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setFormData(prev => ({ ...prev, cliente: e.target.value }));
                      }}
                      placeholder="Digite o nome do cliente"
                      className="border-2 border-[#81059e] p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-[#81059e] text-black"
                      required
                    />
                    {searchTerm && consumers.length > 0 && (
                      <ul className="absolute z-10 w-full border-2 border-[#81059e] rounded-lg mt-1 max-h-60 overflow-auto bg-white shadow-lg">
                        {consumers.map((consumer) => (
                          <li
                            key={consumer.id}
                            onClick={() => handleClienteSelect(consumer)}
                            className="p-4 hover:bg-purple-50 cursor-pointer text-black border-b border-purple-100 last:border-b-0 flex justify-between items-center"
                          >
                            <div>
                              <div className="font-medium text-[#81059e]">{consumer.nome}</div>
                              <div className="text-sm text-gray-600">CPF: {consumer.cpf}</div>
                            </div>
                            <div className="text-purple-600">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
                              </svg>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-[#81059e] font-medium mb-2 block">CPF do Cliente</label>
                  <input
                    type="text"
                    name="cpf"
                    value={formData.cpf}
                    readOnly
                    className="border-2 border-[#81059e] p-3 rounded-lg w-full bg-gray-100 text-black"
                  />
                </div>
              </div>

              {/* Segunda seção - Informações do Documento */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="text-[#81059e] font-medium mb-2 block">Nº do Documento</label>
                  <input
                    type="text"
                    name="numeroDocumento"
                    value={formData.numeroDocumento}
                    onChange={handleInputChange}
                    className="border-2 border-[#81059e] p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-[#81059e] text-black"
                  />
                </div>
                <div>
                  <label className="text-[#81059e] font-medium mb-2 block">
                    Número de Parcelas
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="24"
                    value={numeroParcelas}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '' || parseInt(value) < 0) {
                        setNumeroParcelas('0');
                      } else if (parseInt(value) > 24) {
                        setNumeroParcelas('24');
                      } else {
                        setNumeroParcelas(value);
                      }
                    }}
                    className="border-2 border-[#81059e] p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-[#81059e] text-black"
                  />
                </div>
                <div>
                  <label className="text-[#81059e] font-medium mb-2 block">Tipo de Cobrança</label>
                  <select
                    name="tipoCobranca"
                    value={formData.tipoCobranca}
                    onChange={handleInputChange}
                    className="border-2 border-[#81059e] p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-[#81059e] text-black"
                  >
                    <option value="">Selecione o tipo</option>
                    <option value="boleto">Boleto</option>
                    <option value="cartao">Cartão</option>
                    <option value="dinheiro">Dinheiro</option>
                    <option value="pix">PIX</option>
                  </select>
                </div>
              </div>

              {/* Terceira seção - Valores e Datas */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="text-[#81059e] font-medium mb-2 block">Valor</label>
                  <input
                    type="text"
                    name="valor"
                    value={formData.valor}
                    onChange={handleValorChange}
                    placeholder="R$ 0,00"
                    className="border-2 border-[#81059e] p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-[#81059e] text-black text-right"
                    required
                  />
                </div>
                <div>
                  <label className="text-[#81059e] font-medium mb-2 block">
                    Taxa de Juros (%)
                  </label>
                  <InputMask
                    mask="99,99%"
                    maskChar={null}
                    value={taxaJuros.endsWith('%') ? taxaJuros : `${taxaJuros}%`}
                    onChange={(e) => {
                      let value = e.target.value.replace(/[^\d,]/g, '');

                      // Garantir formato correto (até 2 dígitos antes da vírgula, 2 depois)
                      if (value) {
                        const parts = value.split(',');
                        if (parts[0].length > 2) {
                          parts[0] = parts[0].substring(0, 2);
                        }
                        if (parts.length > 1 && parts[1].length > 2) {
                          parts[1] = parts[1].substring(0, 2);
                        }
                        value = parts.join(',');
                      }

                      setTaxaJuros(value);
                      setFormData(prev => ({ ...prev, taxaJuros: value }));
                    }}
                    className="border-2 border-[#81059e] p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-[#81059e] text-black"
                  />
                </div>
                <div>
                  <label className="text-[#81059e] font-medium mb-2 block">Data de Cobrança</label>
                  <DatePicker
                    selected={formData.dataCobranca}
                    onChange={(date) => setFormData(prev => ({ ...prev, dataCobranca: date }))}
                    dateFormat="dd/MM/yyyy"
                    className="border-2 border-[#81059e] p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-[#81059e] text-black"
                    placeholderText="Selecione a data"
                  />
                </div>
              </div>

              {/* Quarta seção - Informações Adicionais */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-[#81059e] font-medium mb-2 block">Local de Cobrança</label>
                  <input
                    type="text"
                    name="localCobranca"
                    value={formData.localCobranca}
                    onChange={handleInputChange}
                    className="border-2 border-[#81059e] p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-[#81059e] text-black"
                  />
                </div>
                <div>
                  <label className="text-[#81059e] font-medium mb-2 block">Conta para Lançamento</label>
                  <select
                    name="contaLancamentoCaixa"
                    value={formData.contaLancamentoCaixa}
                    onChange={handleInputChange}
                    className="border-2 border-[#81059e] p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-[#81059e] text-black"
                  >
                    <option value="">Selecione a conta</option>
                    <option value="conta1">Conta Principal</option>
                    <option value="conta2">Conta Secundária</option>
                  </select>
                </div>
              </div>

              {/* Quinta seção - Opções Adicionais */}
              <div className="flex items-center space-x-4">
                <input
                  type="checkbox"
                  id="dispensarJuros"
                  name="dispensarJuros"
                  checked={formData.dispensarJuros}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-[#81059e] border-[#81059e] rounded focus:ring-[#81059e]"
                />
                <label htmlFor="dispensarJuros" className="text-[#81059e] font-medium">
                  Dispensar Juros
                </label>
              </div>

              {/* Sexta seção - Origem */}
              <div>
                <label className="text-[#81059e] font-medium mb-2 block">Origem</label>
                <input
                  type="text"
                  name="origem"
                  value={formData.origem}
                  onChange={handleInputChange}
                  className="border-2 border-[#81059e] p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-[#81059e] text-black"
                  placeholder="Origem da conta a receber"
                />
              </div>

              {/* Sétima seção - Observações */}
              <div>
                <label className="text-[#81059e] font-medium mb-2 block">Observações</label>
                <textarea
                  name="observacoes"
                  value={formData.observacoes}
                  onChange={handleInputChange}
                  className="border-2 border-[#81059e] p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-[#81059e] text-black min-h-[120px] resize-y"
                  placeholder="Adicione observações relevantes..."
                />
              </div>

              {/* Oitava seção - Botões de Ação */}
              <div className="flex justify-center gap-4 mb-20">
                <button
                  type="submit"
                  className="w-32 justify-center mt-8 bg-[#81059e] text-white p-3 rounded-md hover:bg-[#7d2370] transition-colors font-medium text-lg"
                >
                  REGISTRAR
                </button>
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="w-32 justify-center mt-8 bg-gray-500 text-white p-3 rounded-md hover:bg-gray-600 transition-colors font-medium text-lg"
                >
                  CANCELAR
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        data={{ ...formData, loja: selectedLoja }}
        onConfirm={handleConfirm}
      />
    </Layout>
  );
}