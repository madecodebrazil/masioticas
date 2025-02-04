"use client";
import { useState, useEffect } from "react";
import { firestore } from "../../../lib/firebaseConfig";
import { addDoc, collection, getDocs, Timestamp } from "firebase/firestore"; // Importando Timestamp
import { useRouter } from "next/navigation"; // Importando o hook useRouter
import Layout from "@/components/Layout";

export default function AddAccountPage() {
  const [credor, setCredor] = useState("");
  const [cpfCredor, setCpfCredor] = useState(""); // Novo estado para armazenar o CPF do credor
  const [loja, setLoja] = useState("Óticas Popular 1");
  const [observacoes, setObservacoes] = useState("");
  const [caixa, setCaixa] = useState("");
  const [dataEntrada, setDataEntrada] = useState("");
  const [horaEntrada, setHoraEntrada] = useState("");
  const [valorFinal, setValorFinal] = useState("");
  const [dataRecebimento, setDataRecebimento] = useState("");
  const [horaRecebimento, setHoraRecebimento] = useState("");
  const [consumers, setConsumers] = useState([]); // Estado para armazenar os credores
  const [searchTerm, setSearchTerm] = useState(""); // Estado para armazenar o termo de busca
  const router = useRouter(); // Instanciando o useRouter

  // Função para buscar credores da coleção /consumers
  const fetchConsumers = async () => {
    if (searchTerm.trim() === "") {
      setConsumers([]); // Limpa a lista se o campo de busca estiver vazio
      return;
    }

    try {
      const querySnapshot = await getDocs(collection(firestore, "consumers"));
      const consumersData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Filtrando consumidores insensivelmente a maiúsculas
      const filteredConsumers = consumersData.filter(consumer =>
        consumer.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        consumer.cpf.includes(searchTerm)
      );

      setConsumers(filteredConsumers);
      console.log("Credores encontrados:", filteredConsumers); // Log dos credores encontrados
    } catch (error) {
      console.error("Erro ao buscar credores:", error);
    }
  };

  useEffect(() => {
    fetchConsumers(); // Chama a função para buscar os credores ao montar o componente
  }, [searchTerm]); // Executa a busca toda vez que o termo de busca mudar

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Converter a data e hora de recebimento para timestamp
      const timestampRecebimento = Timestamp.fromDate(new Date(`${dataRecebimento} ${horaRecebimento}`));

      // Redirecionar para a página de confirmação com os dados via URL
      const queryParams = new URLSearchParams({
        cliente: credor,
        cpf: cpfCredor,
        loja: loja,
        observacoes: observacoes,
        caixa: caixa,
        dataEntrada: dataEntrada,
        horaEntrada: horaEntrada,
        valorFinal: valorFinal,
        dataRecebimento: dataRecebimento,
        horaRecebimento: horaRecebimento,
      }).toString();

      router.push(`/finance/add-receive/confirm?${queryParams}`);
    } catch (error) {
      console.error("Erro ao redirecionar para a confirmação:", error);
      alert("Erro ao adicionar a conta. Tente novamente.");
    }
  };

  return (
    <Layout>
      <div className="min-h-screen p-4 bg-gray-100">
        <div className="max-w-md mx-auto bg-white shadow-md rounded-lg p-6">
          <h2 className="text-lg font-bold text-[#932A83] mb-4">ADICIONAR CONTA A RECEBER</h2>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-[#932A83]">Nome do Credor</label>
              <input
                type="text"
                value={credor}
                onChange={(e) => {
                  setCredor(e.target.value);
                  setSearchTerm(e.target.value); // Atualiza o termo de busca ao digitar
                }}
                placeholder="Digite o nome do credor"
                className="border border-[#932A83] p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-[#932A83] text-black"
                required
              />
              {/* Exibe sugestões apenas se houver texto no campo de busca */}
              {searchTerm && (
                <ul className="border border-gray-300 rounded mt-1 max-h-40 overflow-auto">
                  {consumers.map((consumer) => (
                    <li
                      key={consumer.id}
                      onClick={() => {
                        setCredor(consumer.nome); // Setar o nome do credor ao clicar
                        setCpfCredor(consumer.cpf); // Setar o CPF do credor ao clicar
                        setSearchTerm(""); // Limpa o campo de busca ao selecionar
                        setConsumers([]); // Limpa a lista de sugestões
                      }}
                      className="p-2 hover:bg-gray-200 cursor-pointer text-black"
                    >
                      {consumer.nome} - {consumer.cpf} {/* Exibe nome e CPF do credor */}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-[#932A83]">CPF do Credor</label>
              <input
                type="text"
                value={cpfCredor}
                readOnly // Este campo é apenas para visualização, não editável
                className="border border-[#932A83] p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-[#932A83] bg-gray-200 text-black"
              />
            </div>

            <div className="mb-4">
              <label className="block text-[#932A83]">Loja</label>
              <select
                value={loja}
                onChange={(e) => setLoja(e.target.value)}
                className="border border-[#932A83] p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-[#932A83] text-black"
              >
                <option value="Óticas Popular 1">Óticas Popular 1</option>
                <option value="Óticas Popular 2">Óticas Popular 2</option>
                {/* Adicione outras lojas conforme necessário */}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-[#932A83]">Observações</label>
              <textarea
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                className="border border-[#932A83] p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-[#932A83] text-black"
              />
            </div>

            <div className="mb-4">
              <label className="block text-[#932A83]">Caixa</label>
              <select
                value={caixa}
                onChange={(e) => setCaixa(e.target.value)}
                className="border border-[#932A83] p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-[#932A83] text-black"
              >
                <option value="">Selecione o caixa</option>
                <option value="Caixa 1">Caixa 1</option>
                <option value="Caixa 2">Caixa 2</option>
                {/* Adicione outras opções de caixa conforme necessário */}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-[#932A83]">Data da Entrada</label>
              <input
                type="date"
                value={dataEntrada}
                onChange={(e) => setDataEntrada(e.target.value)}
                className="border border-[#932A83] p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-[#932A83] text-black"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-[#932A83]">Hora</label>
              <input
                type="time"
                value={horaEntrada}
                onChange={(e) => setHoraEntrada(e.target.value)}
                className="border border-[#932A83] p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-[#932A83] text-black"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-[#932A83]">Valor</label>
              <input
                type="number"
                value={valorFinal}
                onChange={(e) => setValorFinal(e.target.value)}
                className="border border-[#932A83] p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-[#932A83] text-black"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-[#932A83]">Data de Recebimento</label>
              <input
                type="date"
                value={dataRecebimento}
                onChange={(e) => setDataRecebimento(e.target.value)}
                className="border border-[#932A83] p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-[#932A83] text-black"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-[#932A83]">Hora do Recebimento</label>
              <input
                type="time"
                value={horaRecebimento}
                onChange={(e) => setHoraRecebimento(e.target.value)}
                className="border border-[#932A83] p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-[#932A83] text-black"
                required
              />
            </div>

            <button
              type="submit"
              className="bg-[#932A83] text-white p-2 rounded w-full"
            >
              REGISTRAR
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
}
