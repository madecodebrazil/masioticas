"use client";
import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation'; // Pacote de navegação e URLSearchParams
import { collection, getDocs } from "firebase/firestore"; // Firestore para buscar consumidores
import { firestore } from '../../../lib/firebaseConfig'; // Configuração do Firebase
import Layout from '@/components/Layout';

export function NewOrderForm() {
  const router = useRouter();
  const searchParams = useSearchParams(); // Captura dos parâmetros da URL
  const [formData, setFormData] = useState({
    data: '',
    hora: '',
    loja: "Óticas Popular 1",
    cliente: "",
    distribuidor: "",
    lentes: "",
    quantidade: "",
    valor: "",
    status: "",
    cpf: "", // CPF do cliente selecionado
  });

  const [userSuggestions, setUserSuggestions] = useState([]); // Sugestões de consumidores

  // Função para preencher os dados com base nos parâmetros da URL
  useEffect(() => {
    const params = Object.fromEntries(new URLSearchParams(searchParams)); // Obtenção dos parâmetros de URL
    setFormData((prevFormData) => ({
      ...prevFormData,
      ...params // Preenche o formData com os valores dos parâmetros de URL
    }));
  }, [searchParams]);

  // Função para obter a data e hora atuais
  useEffect(() => {
    const currentDate = new Date();
    const dataAtual = currentDate.toLocaleDateString('pt-BR');
    const horaAtual = currentDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    setFormData((prevFormData) => ({
      ...prevFormData,
      data: prevFormData.data || dataAtual, // Preenche data com a data atual, se não houver nos parâmetros
      hora: prevFormData.hora || horaAtual, // Preenche hora com a hora atual, se não houver nos parâmetros
    }));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Se estiver digitando no campo "Cliente", buscar sugestões
    if (name === 'cliente') {
      fetchUserSuggestions(value);
    }
  };

  // Função para buscar sugestões de consumidores pelo nome
  const fetchUserSuggestions = async (nome) => {
    if (nome.trim() === "") {
      setUserSuggestions([]); // Limpar as sugestões se o campo estiver vazio
      return;
    }

    try {
      const consumersCollectionRef = collection(firestore, 'consumers');
      const usersSnapshot = await getDocs(consumersCollectionRef);

      const suggestions = [];

      for (const consumerDoc of usersSnapshot.docs) {
        const consumerData = consumerDoc.data();

        if (consumerData.nome && consumerData.nome.toLowerCase().startsWith(nome.toLowerCase())) {
          suggestions.push({
            id: consumerDoc.id,
            cpf: consumerData.cpf,
            nome: consumerData.nome
          });
        }
      }

      setUserSuggestions(suggestions); // Atualiza as sugestões exibidas
    } catch (error) {
      console.error('Erro ao buscar consumidores: ', error);
    }
  };

  // Função para selecionar um usuário das sugestões
  const selectUser = (user) => {
    setFormData((prevData) => ({
      ...prevData,
      cliente: user.nome,  // Nome do cliente selecionado
      cpf: user.cpf        // CPF do cliente selecionado
    }));

    setUserSuggestions([]); // Limpar sugestões após a seleção
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Converte os dados para parâmetros de URL
    const queryString = new URLSearchParams(formData).toString();
    router.push(`/products_and_services/orders/confirm-order?${queryString}`);
  };

  return (
    <Layout>
      <form onSubmit={handleSubmit}>
        <div className="max-w-3xl mx-auto bg-white shadow-md rounded-lg p-6">
          <h2 className="text-2xl text-center text-[#81059e] mb-6">NOVA ORDEM DE SERVIÇO</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Data */}
            <div>
              <label className="block text-[#81059e] font-bold mb-1">Data</label>
              <input
                type="text"
                name="data"
                value={formData.data}
                className="w-full px-3 py-2 border border-[#81059e] rounded-md focus:outline-none focus:ring focus:border-[#81059e] text-black"
                disabled
              />
            </div>

            {/* Hora */}
            <div>
              <label className="block text-[#81059e] font-bold mb-1">Hora</label>
              <input
                type="text"
                name="hora"
                value={formData.hora}
                className="w-full px-3 py-2 border border-[#81059e] rounded-md focus:outline-none focus:ring focus:border-[#81059e] text-black"
                disabled
              />
            </div>

            {/* Loja */}
            <div>
              <label className="block text-[#81059e] font-bold mb-1">Loja</label>
              <input
                type="text"
                name="loja"
                value={formData.loja}
                className="w-full px-3 py-2 border border-[#81059e] rounded-md focus:outline-none focus:ring focus:border-[#81059e] text-black"
                disabled
              />
            </div>

            {/* Cliente */}
            <div className="col-span-2">
              <label className="block text-[#81059e] font-bold mb-1">Cliente</label>
              <input
                type="text"
                name="cliente"
                placeholder="Buscar cliente da ordem de serviço"
                className="w-full px-3 py-2 border border-[#81059e] rounded-md focus:outline-none focus:ring focus:border-[#81059e] text-black"
                onChange={handleChange}
                value={formData.cliente}
              />
              {userSuggestions.length > 0 && (
                <ul className="bg-white border border-gray-300 rounded mt-2">
                  {userSuggestions.map((user) => (
                    <li
                      key={user.id}
                      className="p-2 hover:bg-gray-200 cursor-pointer text-black" // Texto das sugestões em preto
                      onClick={() => selectUser(user)}
                    >
                      {user.nome} - CPF: {user.cpf}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* CPF */}
            <div>
              <label className="block text-[#81059e] font-bold mb-1">CPF</label>
              <input
                type="text"
                name="cpf"
                value={formData.cpf}
                className="w-full px-3 py-2 border border-[#81059e] rounded-md focus:outline-none focus:ring focus:border-[#81059e] text-black"
                disabled
              />
            </div>

            {/* Distribuidor */}
            <div className="col-span-2">
              <label className="block text-[#81059e] font-bold mb-1">Distribuidor</label>
              <select
                name="distribuidor"
                value={formData.distribuidor}
                className="w-full px-3 py-2 border border-[#81059e] rounded-md focus:outline-none focus:ring focus:border-[#81059e] text-black"
                onChange={handleChange}
              >
                <option value="">Selecione o distribuidor</option>
                <option value="Fit Lab Optical">Fit Lab Optical</option>
                <option value="HTK lentes oftálmicas">HTK lentes oftálmicas</option>
              </select>
            </div>

            {/* Lentes */}
            <div>
              <label className="block text-[#81059e] font-bold mb-1">Lentes</label>
              <input
                type="text"
                name="lentes"
                value={formData.lentes}
                className="w-full px-3 py-2 border border-[#81059e] rounded-md focus:outline-none focus:ring focus:border-[#81059e] text-black"
                onChange={handleChange}
              />
            </div>

            {/* Quantidade */}
            <div>
              <label className="block text-[#81059e] font-bold mb-1">Quantidade</label>
              <input
                type="number"
                name="quantidade"
                value={formData.quantidade}
                className="w-full px-3 py-2 border border-[#81059e] rounded-md focus:outline-none focus:ring focus:border-[#81059e] text-black"
                onChange={handleChange}
              />
            </div>

            {/* Valor */}
            <div>
              <label className="block text-[#81059e] font-bold mb-1">Valor R$</label>
              <input
                type="number"
                name="valor"
                value={formData.valor}
                className="w-full px-3 py-2 border border-[#81059e] rounded-md focus:outline-none focus:ring focus:border-[#81059e] text-black"
                onChange={handleChange}
              />
            </div>

            {/* Status */}
            <div className="col-span-2">
              <label className="block text-[#81059e] font-bold mb-1">Status</label>
              <select
                name="status"
                value={formData.status}
                className="w-full px-3 py-2 border border-[#81059e] rounded-md focus:outline-none focus:ring focus:border-[#81059e] text-black"
                onChange={handleChange}
              >
                <option value="">Selecione o status</option>
                <option value="Realizada">Realizada</option>
                <option value="Recebida">Recebida</option>
                <option value="Paga">Paga</option>
                <option value="Entregue">Entregue</option>
                <option value="Cancelada">Cancelada</option>
              </select>
            </div>
          </div>

          <div className="mt-6 text-center">
            <button
              type="submit"
              className="bg-[#81059e] text-white px-6 py-2 rounded-md hover:bg-[#81059e]/90"
            >
              Salvar
            </button>
          </div>
        </div>
      </form>
    </Layout>
  );
}
export default function Page() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <NewOrderForm />
    </Suspense>
  );
}