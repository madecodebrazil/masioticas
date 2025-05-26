"use client";

import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import Link from 'next/link';
import { useRouter } from 'next/navigation'; // Atualizado para usar `next/navigation`
import { firestore } from '../../../../lib/firebaseConfig';
import { doc, setDoc, getDocs, collection, query, where } from 'firebase/firestore';

export default function Confirm() {
  const [conta, setConta] = useState({}); // Estado para armazenar os dados da conta
  const [selectedLojas, setSelectedLojas] = useState([]); // Estado para armazenar as lojas selecionadas
  const [isLoading, setIsLoading] = useState(false); // Estado para gerenciar o carregamento
  const router = useRouter(); // Atualizado para usar `next/navigation`

  useEffect(() => {
    // Pega os dados da URL e decodifica
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const contaData = params.get('contaData');

      if (contaData) {
        const parsedData = JSON.parse(decodeURIComponent(contaData)); // Decodifica os dados recebidos
        setConta(parsedData); // Armazena os dados no estado
        setSelectedLojas(parsedData.lojas || []); // Atualiza o estado com as lojas (como array)
      }
    }
  }, []);

  // Função para mapear o nome da loja para o valor correto no Firestore
  const mapLojasToFirestore = (loja) => {
    const lojaMap = {
      "Loja 1": "loja1",
      "Loja 2": "loja2",
    };
    return lojaMap[loja] || loja; // Retorna 'loja1' ou 'loja2', ou o valor original se não houver mapeamento
  };

  // Função para confirmar os dados e salvar em várias lojas
  const handleConfirm = async () => {
    // Verifica se pelo menos uma loja foi selecionada
    if (selectedLojas.length === 0) {
      alert('Por favor, selecione ao menos uma loja.');
      return;
    }

    // Confirma com o usuário antes de salvar os dados
    const confirmSave = window.confirm("Tem certeza que deseja salvar os dados?");
    if (!confirmSave) return;

    setIsLoading(true); // Iniciar o carregamento

    try {
      const { cpf, documento } = conta; // Obter o CPF e o código do documento

      const saveToStore = async (loja) => {
        const mappedLoja = mapLojasToFirestore(loja); // Mapeia o nome da loja para 'loja1' ou 'loja2'

        // Verificar se já existe um documento com o mesmo código na loja selecionada
        const q = query(
          collection(firestore, mappedLoja, "finances", "a_pagar"),
          where("documento", "==", documento)
        );
        const existingAccountsSnapshot = await getDocs(q);

        if (!existingAccountsSnapshot.empty) {
          const userConfirmed = window.confirm(`Já existe uma conta registrada com este código de documento na ${mappedLoja}. Deseja sobrescrever?`);
          if (!userConfirmed) {
            return; // Se o usuário não confirmar, não prossegue
          }

          // Se o usuário confirmar, sobrescrevemos a conta existente
          const existingAccount = existingAccountsSnapshot.docs[0];
          await setDoc(doc(firestore, mappedLoja, "finances", "a_pagar", existingAccount.id), conta);
        } else {
          // Caso contrário, criamos um novo documento com ID aleatório na loja selecionada
          const newDocRef = doc(collection(firestore, mappedLoja, "finances", "a_pagar")); // Usar a loja mapeada
          await setDoc(newDocRef, conta);
        }
      };

      // Itera sobre todas as lojas selecionadas e salva a conta em cada uma
      for (const loja of selectedLojas) {
        try {
          await saveToStore(loja); // Salva para cada loja mapeada
        } catch (error) {
          console.error(`Erro ao registrar a conta na ${loja}: `, error);
          alert(`Erro ao registrar a conta na ${loja}. Tente novamente.`);
        }
      }

      alert("Conta registrada com sucesso!");
      router.push('/finance/add-pay/list-bills'); // Navega usando o Next.js router
    } catch (error) {
      console.error("Erro ao registrar a conta: ", error);
      alert("Erro ao registrar a conta. Tente novamente.");
    } finally {
      setIsLoading(false); // Encerra o carregamento
    }
  };

  return (
    <Layout>
      <div className="flex h-full p-8 justify-center items-center flex-col">
        <div className="flex-1 w-full max-w-4xl">
          <h2 className="text-2xl font-semibold text-[#81059e] mb-6">CONFIRMAÇÃO DOS DADOS</h2>

          <div className="text-black bg-white p-6 rounded-lg shadow-md space-y-4">
            <div>
              <p><strong>Nome do Credor:</strong> {conta.credor}</p>
              <p><strong>CPF/CNPJ:</strong> {conta.cpf}</p>
              <p><strong>Código do Documento:</strong> {conta.documento}</p>
              <p><strong>Observações:</strong> {conta.observacoes}</p>
              <p><strong>Conta:</strong> {conta.conta}</p>
              <p><strong>Data da Entrada:</strong> {conta.dataEntrada}</p>
              <p><strong>Valor:</strong> {conta.valor}</p>
              <p><strong>Data de Vencimento:</strong> {conta.dataVencimento}</p>
              <p><strong>Lojas Selecionadas:</strong> {selectedLojas.join(', ')}</p> {/* Exibe todas as lojas selecionadas */}
            </div>

            <div className="flex justify-between">
              <Link href={`/finance/add-pay?contaData=${encodeURIComponent(JSON.stringify(conta))}`}>
                <button className="bg-gray-300 text-black py-2 px-4 rounded-md" disabled={isLoading}>
                  Editar
                </button>
              </Link>
              <button
                onClick={handleConfirm}
                className="bg-[#81059e] text-white py-2 px-4 rounded-md"
                disabled={isLoading}
              >
                {isLoading ? 'Salvando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
