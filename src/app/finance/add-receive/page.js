"use client";
import { useState, useEffect } from "react";
import { firestore } from "../../../lib/firebaseConfig";
import { addDoc, collection, getDocs, Timestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Layout from "../../../components/Layout";
import ConfirmationModal from '../../../components/ConfirmationModal.js';

export default function AddAccountPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState(null);
  const [devedor, setDevedor] = useState("");
  const [cpfDevedor, setCpfDevedor] = useState("");
  const [loja, setLoja] = useState("Óticas Popular 1");
  const [observacoes, setObservacoes] = useState("");
  const [caixa, setCaixa] = useState("");
  const [dataEntrada, setDataEntrada] = useState("");
  const [horaEntrada, setHoraEntrada] = useState("");
  const [valorFinal, setValorFinal] = useState("");
  const [dataRecebimento, setDataRecebimento] = useState("");
  const [horaRecebimento, setHoraRecebimento] = useState("");
  const [consumers, setConsumers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Novos estados baseados no ERP tradicional
  const [numeroDocumento, setNumeroDocumento] = useState("");
  const [parcela, setParcela] = useState("");
  const [tipoCobranca, setTipoCobranca] = useState("");
  const [origem, setOrigem] = useState("");
  const [taxaJuros, setTaxaJuros] = useState("");
  const [dataCobranca, setDataCobranca] = useState("");
  const [localCobranca, setLocalCobranca] = useState("");
  const [contaLancamentoCaixa, setContaLancamentoCaixa] = useState("");
  const [dispensarJuros, setDispensarJuros] = useState(false);
  
  const router = useRouter();

  // Função para buscar devedores
  const fetchConsumers = async () => {
    if (searchTerm.trim() === "") {
      setConsumers([]);
      return;
    }

    try {
      // Busca todos os documentos da coleção consumers
      const querySnapshot = await getDocs(collection(firestore, "loja1/users/" + "USUARIOS"));
      const consumersData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Filtra os consumidores que correspondem ao termo de busca
      const filteredConsumers = consumersData.filter(consumer => {
        const nome = consumer.nome?.toLowerCase() || '';
        const cpf = consumer.cpf || '';
        const searchTermLower = searchTerm.toLowerCase();
        
        return nome.includes(searchTermLower) || cpf.includes(searchTerm);
      });

      console.log("Devedores encontrados:", filteredConsumers); // Para debug
      setConsumers(filteredConsumers);
    } catch (error) {
      console.error("Erro ao buscar devedores:", error);
      alert("Erro ao buscar devedores. Por favor, tente novamente.");
    }
  };

  useEffect(() => {
    fetchConsumers();
  }, [searchTerm]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const data = {
      cliente: devedor,
      cpf: cpfDevedor,
      loja: loja,
      observacoes: observacoes,
      caixa: caixa,
      dataEntrada: dataEntrada,
      horaEntrada: horaEntrada,
      valorFinal: valorFinal,
      dataRecebimento: dataRecebimento,
      horaRecebimento: horaRecebimento,
      // Novos campos
      numeroDocumento,
      parcela,
      tipoCobranca,
      origem,
      taxaJuros,
      dataCobranca,
      localCobranca,
      contaLancamentoCaixa,
      dispensarJuros
    };

    setFormData(data);
    setIsModalOpen(true);
  };

  const handleConfirm = async () => {
    try {
      const timestampRecebimento = Timestamp.fromDate(new Date(`${dataRecebimento} ${horaRecebimento}`));
      const timestampCobranca = dataCobranca ? Timestamp.fromDate(new Date(dataCobranca)) : null;

      await addDoc(collection(firestore, "crediarios"), {
        ...formData,
        dataRecebimento: timestampRecebimento,
        dataCobranca: timestampCobranca,
        createdAt: Timestamp.now()
      });

      setIsModalOpen(false);
      alert("Conta registrada com sucesso!");
      
      // Limpar formulário
      setDevedor("");
      setCpfDevedor("");
      setLoja("Óticas Popular 1");
      setObservacoes("");
      setCaixa("");
      setDataEntrada("");
      setHoraEntrada("");
      setValorFinal("");
      setDataRecebimento("");
      setHoraRecebimento("");
      setNumeroDocumento("");
      setParcela("");
      setTipoCobranca("");
      setOrigem("");
      setTaxaJuros("");
      setDataCobranca("");
      setLocalCobranca("");
      setContaLancamentoCaixa("");
      setDispensarJuros(false);
      
    } catch (error) {
      console.error("Erro ao registrar a conta:", error);
      alert("Erro ao registrar a conta. Tente novamente.");
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

  const handleValorChange = (e) => {
    const valor = e.target.value.replace(/\D/g, '');
    if (valor === '') {
      setValorFinal('');
      return;
    }
    setValorFinal(formatarMoeda(valor));
  };

  return (
    <Layout>
      <div className="min-h-screen p-2">
        <div className="w-full max-w-5xl mx-auto rounded-lg">
          <h2 className="text-3xl font-bold text-[#81059e] mb-8">ADICIONAR CONTAS A RECEBER</h2>
          <a href="/finance/add-receive/list-receives" className="bg-[#81059e] p-3 rounded-sm text-white">
            <button>RECEBIMENTOS PENDENTES</button>
          </a>
          
          <form onSubmit={handleSubmit} className="max-w-7xl mx-auto bg-white mt-8 mb-20">
            <div className="flex flex-col space-y-6">
              {/* Primeira seção - Informações do Devedor */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-[#81059e] font-medium mb-2 block">Nome do Devedor</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={devedor}
                      onChange={(e) => {
                        setDevedor(e.target.value);
                        setSearchTerm(e.target.value);
                      }}
                      placeholder="Digite o nome do Devedor"
                      className="border-2 border-[#81059e] p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-[#81059e] text-black"
                      required
                    />
                    {searchTerm && consumers.length > 0 && (
                      <ul className="absolute z-10 w-full border-2 border-[#81059e] rounded-lg mt-1 max-h-60 overflow-auto bg-white shadow-lg">
                        {consumers.map((consumer) => (
                          <li
                            key={consumer.id}
                            onClick={() => {
                              setDevedor(consumer.nome);
                              setCpfDevedor(consumer.cpf);
                              setSearchTerm("");
                              setConsumers([]);
                            }}
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
                  <label className="text-[#81059e] font-medium mb-2 block">CPF do Devedor</label>
                  <input
                    type="text"
                    value={cpfDevedor}
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
                    value={numeroDocumento}
                    onChange={(e) => setNumeroDocumento(e.target.value)}
                    className="border-2 border-[#81059e] p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-[#81059e] text-black"
                  />
                </div>
                <div>
                  <label className="text-[#81059e] font-medium mb-2 block">Parcela</label>
                  <input
                    type="text"
                    value={parcela}
                    onChange={(e) => setParcela(e.target.value)}
                    className="border-2 border-[#81059e] p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-[#81059e] text-black"
                  />
                </div>
                <div>
                  <label className="text-[#81059e] font-medium mb-2 block">Tipo de Cobrança</label>
                  <select
                    value={tipoCobranca}
                    onChange={(e) => setTipoCobranca(e.target.value)}
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
                    value={valorFinal}
                    onChange={handleValorChange}
                    placeholder="R$ 0,00"
                    className="border-2 border-[#81059e] p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-[#81059e] text-black text-right"
                    required
                  />
                </div>
                <div>
                  <label className="text-[#81059e] font-medium mb-2 block">Taxa de Juros (%)</label>
                  <input
                    type="number"
                    value={taxaJuros}
                    onChange={(e) => setTaxaJuros(e.target.value)}
                    step="0.01"
                    className="border-2 border-[#81059e] p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-[#81059e] text-black"
                  />
                </div>
                <div>
                  <label className="text-[#81059e] font-medium mb-2 block">Data de Cobrança</label>
                  <input
                    type="date"
                    value={dataCobranca}
                    onChange={(e) => setDataCobranca(e.target.value)}
                    className="border-2 border-[#81059e] p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-[#81059e] text-black"
                  />
                </div>
              </div>

              {/* Quarta seção - Informações Adicionais */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-[#81059e] font-medium mb-2 block">Local de Cobrança</label>
                  <input
                    type="text"
                    value={localCobranca}
                    onChange={(e) => setLocalCobranca(e.target.value)}
                    className="border-2 border-[#81059e] p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-[#81059e] text-black"
                  />
                </div>
                <div>
                  <label className="text-[#81059e] font-medium mb-2 block">Conta para Lançamento</label>
                  <select
                    value={contaLancamentoCaixa}
                    onChange={(e) => setContaLancamentoCaixa(e.target.value)}
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
                  checked={dispensarJuros}
                  onChange={(e) => setDispensarJuros(e.target.checked)}
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
                  value={origem}
                  onChange={(e) => setOrigem(e.target.value)}
                  className="border-2 border-[#81059e] p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-[#81059e] text-black"
                  placeholder="Origem da conta a receber"
                />
              </div>

              {/* Sétima seção - Observações */}
              <div>
                <label className="text-[#81059e] font-medium mb-2 block">Observações</label>
                <textarea
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
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
        data={formData}
        onConfirm={handleConfirm}
      />
    </Layout>
  );
}