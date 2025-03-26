"use client";
import Layout from '@/components/Layout'; // Instancie o seu layout
import { useState, useEffect } from 'react';
import { getFirestore, collection, doc, setDoc, getDoc, query, getDocs } from 'firebase/firestore';
import { app } from '../../../lib/firebaseConfig'; // Certifique-se de que o Firebase foi configurado corretamente

const firestore = getFirestore(app);

export default function CriarEntrega() {
  const [cliente, setCliente] = useState('');
  const [cpf, setCpf] = useState('');
  const [referencia, setReferencia] = useState('');
  const [lente, setLente] = useState('');
  const [armacao, setArmacao] = useState('');
  const [solar, setSolar] = useState('');
  const [status, setStatus] = useState('');
  const [loja, setLoja] = useState('loja1'); // Definir valor padrão para a loja
  const [data, setData] = useState('');
  const [hora, setHora] = useState('');
  const [clientesSugestoes, setClientesSugestoes] = useState([]); // Para armazenar sugestões de clientes
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false); // Para controlar a exibição de sugestões

  // Preencher data e hora automaticamente ao carregar a página
  useEffect(() => {
    const currentDate = new Date();
    const formattedDate = currentDate.toISOString().slice(0, 10); // Formatar a data para YYYY-MM-DD
    const formattedTime = currentDate.toTimeString().slice(0, 5); // Formatar a hora para HH:MM
    setData(formattedDate);
    setHora(formattedTime);
  }, []);

  // Função para limpar os campos
  const limparCampos = () => {
    setCliente('');
    setCpf('');
    setReferencia('');
    setLente('');
    setArmacao('');
    setSolar('');
    setStatus('');
    setLoja('loja1'); // Voltar para loja padrão
    const currentDate = new Date();
    setData(currentDate.toISOString().slice(0, 10));
    setHora(currentDate.toTimeString().slice(0, 5));
  };

  // Função para buscar clientes por nome e exibir sugestões
  const buscarClientes = async (nomeCliente) => {
    if (nomeCliente.length < 2) {
      setClientesSugestoes([]);
      setMostrarSugestoes(false);
      return;
    }

    try {
      const querySnapshot = await getDocs(collection(firestore, 'consumers'));
      const sugestoes = querySnapshot.docs
        .filter(doc => doc.data().nome.toLowerCase().includes(nomeCliente.toLowerCase())) // Faz a busca case-insensitive
        .map(doc => ({
          nome: doc.data().nome,
          cpf: doc.data().cpf,
        }));
      setClientesSugestoes(sugestoes);
      setMostrarSugestoes(sugestoes.length > 0);
    } catch (error) {
      console.error("Erro ao buscar o cliente: ", error);
    }
  };

  // Função para selecionar um cliente da lista de sugestões
  const selecionarCliente = (clienteSelecionado) => {
    setCliente(clienteSelecionado.nome);
    setCpf(clienteSelecionado.cpf); // O CPF será usado no Firestore
    setMostrarSugestoes(false); // Ocultar as sugestões após a seleção
  };

  // Função para enviar os dados para o Firestore
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!cpf) {
      alert("Selecione um cliente válido.");
      return;
    }

    const lojaCollection = loja === 'loja1' ? 'loja1' : 'loja2'; // Definir a coleção com base na loja selecionada

    try {
      // Verificar se já existe uma entrega para o CPF
      const docRef = doc(firestore, `${lojaCollection}/stock/deliveries`, cpf);
      const docSnap = await getDoc(docRef);

      let cpfComSufixo = cpf; // Iniciar com o CPF original

      if (docSnap.exists()) {
        // Se já existir uma entrega, perguntar se deseja adicionar uma nova com sufixo
        const confirmarDuplicata = window.confirm("Já existe uma entrega para este CPF. Deseja adicionar uma nova com um sufixo?");

        if (confirmarDuplicata) {
          let sufixo = 2;
          while (true) {
            const novoDocRef = doc(firestore, `${lojaCollection}/stock/deliveries`, `${cpf} (${sufixo})`);
            const novoDocSnap = await getDoc(novoDocRef);

            if (!novoDocSnap.exists()) {
              cpfComSufixo = `${cpf} (${sufixo})`; // Gerar CPF com sufixo
              break;
            }
            sufixo++; // Incrementar o sufixo
          }
        } else {
          return; // Se o usuário não confirmar, cancelar a operação
        }
      }

      // Criar a entrega com o CPF (ou CPF com sufixo) como ID no Firestore
      await setDoc(doc(firestore, `${lojaCollection}/stock/deliveries`, cpfComSufixo), {
        cliente,
        cpf: cpfComSufixo,
        referencia,
        lente,
        armacao,
        solar,
        status,
        data,
        hora,
      });

      limparCampos(); // Limpar os campos após o envio
      alert("Entrega registrada com sucesso!");
    } catch (error) {
      console.error("Erro ao registrar entrega: ", error);
      alert("Ocorreu um erro ao registrar a entrega.");
    }
  };

  return (
    <Layout>
      <div>
        <div className="w-full p-2">

          {/* Botão Limpar dentro do conteúdo principal no canto superior direito */}
          <button
            type="button"
            onClick={limparCampos}
            className="absolute top-4 right-4 px-4 py-2 bg-gray-500 text-white font-medium rounded-md shadow-sm hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
          >
            Limpar
          </button>

          {/* Centralizar o título */}
          <h2 className="text-center text-2xl font-extrabold" style={{ color: '#81059e' }}>CRIAR ENTREGA</h2>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-1">
                <label
                  htmlFor="data"
                  className="block text-sm font-medium"
                  style={{ color: '#81059e87' }}
                >
                  Data
                </label>
                <input
                  type="date"
                  id="data"
                  value={data}
                  onChange={(e) => setData(e.target.value)}
                  className="mt-1 block w-full h-10 rounded-md border shadow-sm focus:border-purple-500 focus:ring focus:ring-purple-500 sm:text-sm text-black"
                  style={{ borderColor: '#81059e' }}
                />
              </div>
              <div className="col-span-1">
                <label
                  htmlFor="hora"
                  className="block text-sm font-medium"
                  style={{ color: '#81059e87' }}
                >
                  Hora
                </label>
                <input
                  type="time"
                  id="hora"
                  value={hora}
                  onChange={(e) => setHora(e.target.value)}
                  className="mt-1 block w-full h-10 rounded-md border shadow-sm focus:border-purple-500 focus:ring focus:ring-purple-500 sm:text-sm text-black"
                  style={{ borderColor: '#81059e' }}
                />
              </div>
              <div className="col-span-1">
                <label
                  htmlFor="loja"
                  className="block text-sm font-medium"
                  style={{ color: '#81059e87' }}
                >
                  Loja
                </label>
                <select
                  id="loja"
                  value={loja}
                  onChange={(e) => setLoja(e.target.value)}
                  className="mt-1 block w-full h-10 rounded-md border bg-gray-100 shadow-sm focus:border-purple-500 focus:ring focus:ring-purple-500 sm:text-sm text-black"
                  style={{ borderColor: '#81059e' }}
                >
                  <option value="loja1">Ótica Popular 1</option>
                  <option value="loja2">Ótica Popular 2</option>
                </select>
              </div>
            </div>

            {/* Campo de cliente ocupando toda a linha */}
            <div className="relative">
              <label
                htmlFor="cliente"
                className="block text-sm font-medium"
                style={{ color: '#81059e87' }}
              >
                Cliente
              </label>
              <input
                type="text"
                id="cliente"
                value={cliente}
                onChange={(e) => {
                  setCliente(e.target.value);
                  buscarClientes(e.target.value); // Buscar clientes ao digitar
                }}
                className="mt-1 block w-full h-10 rounded-md border shadow-sm focus:border-purple-500 focus:ring focus:ring-purple-500 sm:text-sm text-black"
                style={{ borderColor: '#81059e' }}
              />
              {mostrarSugestoes && clientesSugestoes.length > 0 && (
                <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-40 overflow-y-auto shadow-lg">
                  {clientesSugestoes.map((sugestao, index) => (
                    <li
                      key={index}
                      onClick={() => selecionarCliente(sugestao)}
                      className="text-black px-4 py-2 cursor-pointer hover:bg-gray-100"
                    >
                      {sugestao.nome}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Mostrar o CPF */}
            <div>
              <label
                htmlFor="cpf"
                className="block text-sm font-medium"
                style={{ color: '#81059e87' }}
              >
                CPF
              </label>
              <input
                type="text"
                id="cpf"
                value={cpf}
                readOnly
                className="mt-1 block w-full h-10 rounded-md border shadow-sm bg-gray-100 sm:text-sm text-black"
                style={{ borderColor: '#81059e' }}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="referencia"
                  className="block text-sm font-medium"
                  style={{ color: '#81059e87' }}
                >
                  Referência
                </label>
                <input
                  type="text"
                  id="referencia"
                  value={referencia}
                  onChange={(e) => setReferencia(e.target.value)}
                  className="mt-1 block w-full h-10 rounded-md border shadow-sm focus:border-purple-500 focus:ring focus:ring-purple-500 sm:text-sm text-black"
                  style={{ borderColor: '#81059e' }}
                />
              </div>
              <div>
                <label
                  htmlFor="lente"
                  className="block text-sm font-medium"
                  style={{ color: '#81059e87' }}
                >
                  Lente
                </label>
                <input
                  type="text"
                  id="lente"
                  value={lente}
                  onChange={(e) => setLente(e.target.value)}
                  className="mt-1 block w-full h-10 rounded-md border shadow-sm focus:border-purple-500 focus:ring focus:ring-purple-500 sm:text-sm text-black"
                  style={{ borderColor: '#81059e' }}
                />
              </div>
            </div>

            {/* Campo de armação ocupando toda a linha */}
            <div>
              <label
                htmlFor="armacao"
                className="block text-sm font-medium"
                style={{ color: '#81059e87' }}
              >
                Armação
              </label>
              <input
                type="text"
                id="armacao"
                value={armacao}
                onChange={(e) => setArmacao(e.target.value)}
                className="mt-1 block w-full h-10 rounded-md border shadow-sm focus:border-purple-500 focus:ring focus:ring-purple-500 sm:text-sm text-black"
                style={{ borderColor: '#81059e' }}
              />
            </div>

            <div>
              <label
                htmlFor="solar"
                className="block text-sm font-medium"
                style={{ color: '#81059e87' }}
              >
                Solar
              </label>
              <input
                type="text"
                id="solar"
                value={solar}
                onChange={(e) => setSolar(e.target.value)}
                className="mt-1 block w-full h-10 rounded-md border shadow-sm focus:border-purple-500 focus:ring focus:ring-purple-500 sm:text-sm text-black"
                style={{ borderColor: '#81059e' }}
              />
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label
                  htmlFor="status"
                  className="block text-sm font-medium"
                  style={{ color: '#81059e87' }}
                >
                  Status
                </label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {['Aguardando o cliente', 'Produtos conferidos antes da entrega', 'Entregue ao cliente titular', 'Entregue à pessoa autorizada', 'Cancelado'].map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setStatus(option)}
                      className={`text-black px-2 py-1 border rounded-md text-sm ${status === option ? 'bg-purple-500 text-white' : 'bg-gray-100 border-purple-300'}`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Botão "Salvar" centralizado */}
            <div className="flex justify-center">
              <button
                type="submit"
                className="mt-4 px-4 py-2 bg-[#81059e] text-white font-medium rounded-md shadow-sm hover:bg-purple-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                Salvar
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}
